<?php

namespace App\Http\Controllers;

use App\Models\Production;
use App\Models\ProductionProcess;
use App\Models\ProductionAnalytics;
use App\Models\Product;
use App\Models\InventoryItem;
use App\Models\InventoryUsage;
use App\Models\ProductMaterial;
use App\Models\User;
use Illuminate\Http\Request;
use App\Events\ProductionUpdated;
use App\Events\ProductionProcessUpdated;
use App\Notifications\OrderStageUpdated;
use App\Notifications\LowStockAlert;
use App\Models\Order;
use App\Models\OrderTracking;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ProductionController extends Controller
{
    public function index(Request $request)
    {
        $query = Production::with(['user', 'product', 'order.user']); // eager load relationships including customer

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('start_date') && $request->has('end_date')) {
            $query->whereBetween('date', [$request->start_date, $request->end_date]);
        }

        return response()->json(
            $query->orderBy('date', 'desc')->get()
        );
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'user_id'       => 'required|exists:users,id',
            'product_id'    => 'required|exists:products,id',
            'product_name'  => 'required|string|max:255', // keep for quick display
            'date'          => 'required|date',
            'stage'         => 'required|string|in:Design,Preparation,Cutting,Assembly,Finishing,Quality Control',
            'status'        => 'required|string|in:Pending,In Progress,Completed,Hold',
            'quantity'      => 'required|integer|min:0',
            'resources_used'=> 'nullable|array',
            'notes'         => 'nullable|string',
        ]);

        $production = Production::create($data)->load(['user','product']);

        broadcast(new ProductionUpdated($production))->toOthers();

        return response()->json($production, 201);
    }

    public function show($id)
    {
        $production = Production::with(['user', 'product'])->findOrFail($id);
        return response()->json($production);
    }

    public function update(Request $request, $id)
    {
        $production = Production::findOrFail($id);

        $data = $request->validate([
            'user_id'       => 'sometimes|exists:users,id',
            'product_id'    => 'sometimes|exists:products,id',
            'product_name'  => 'sometimes|string|max:255',
            'date'          => 'sometimes|date',
            'status'        => 'sometimes|string|in:Pending,In Progress,Completed,Hold',
            'quantity'      => 'sometimes|integer|min:0',
            'resources_used'=> 'nullable|array',
            'notes'         => 'nullable|string',
        ]);

        $old = $production->replicate();
        // Enforce stage progression via process updates/auto-advance only
        unset($data['stage']);
        $production->update($data);

        $production->load(['user', 'product']); // reload relationships

        broadcast(new ProductionUpdated($production))->toOthers();

        // Notify customer on stage or status change
        if (($data['stage'] ?? null) || ($data['status'] ?? null)) {
            $order = $production->order_id ? Order::with('user')->find($production->order_id) : null;
            if ($order && $order->user) {
                $order->user->notify(new OrderStageUpdated(
                    $order->id,
                    $production->product_name,
                    $production->stage,
                    $production->status
                ));
            }
        }

        return response()->json($production);
    }

    /**
     * Manually override the active production stage (admin/supervisor action).
     * Sets all earlier processes to completed, selected stage to in_progress, later to pending.
     */
    public function overrideStage(Request $request, $id)
    {
        $request->validate([
            'stage' => 'required|string',
            'reason' => 'nullable|string'
        ]);

        $production = Production::with('processes')->findOrFail($id);
        $targetStage = $request->input('stage');

        // Find the process order for the target stage
        $target = $production->processes->firstWhere('process_name', $targetStage);
        if (!$target) {
            return response()->json(['message' => 'Unknown stage for this production'], 422);
        }

        // Apply status changes
        foreach ($production->processes as $proc) {
            if ($proc->process_order < $target->process_order) {
                if ($proc->status !== 'completed') {
                    $proc->status = 'completed';
                    $proc->completed_at = Carbon::now();
                }
            } elseif ($proc->process_order === $target->process_order) {
                $proc->status = 'in_progress';
                $proc->started_at = $proc->started_at ?: Carbon::now();
            } else {
                $proc->status = 'pending';
                $proc->started_at = null;
                $proc->completed_at = null;
            }
            if ($request->filled('reason')) {
                $proc->notes = trim(($proc->notes ? $proc->notes."\n" : '').'[Override] '.$request->input('reason'));
            }
            $proc->save();
        }

        // Update production stage/current_stage and overall progress
        $production->refresh();
        $production->update([
            'stage' => $targetStage,
            'current_stage' => $targetStage,
            'status' => 'In Progress',
            'overall_progress' => $this->calculateOverallProgress($production),
        ]);

        // Sync order tracking if applicable
        if ($production->order_id) {
            $tracking = OrderTracking::firstOrCreate([
                'order_id' => $production->order_id,
                'product_id' => $production->product_id,
            ], [
                'tracking_type' => 'standard',
                'current_stage' => $targetStage,
                'status' => 'in_production',
            ]);
            $tracking->update([
                'current_stage' => $targetStage,
                'status' => 'in_production',
            ]);
            broadcast(new \App\Events\OrderTrackingUpdated($tracking))->toOthers();
        }

        // Broadcast production update for dashboards/analytics
        broadcast(new ProductionUpdated($production->fresh(['processes'])))->toOthers();

        return response()->json(['message' => 'Stage overridden', 'production' => $production->fresh('processes')]);
    }

    public function destroy($id)
    {
        $production = Production::findOrFail($id);
        $production->delete();

        return response()->json(['message' => 'Production deleted']);
    }

    public function analytics(Request $request)
    {
        // Get Production data (main source with 30 records)
        $productionQuery = Production::query();

        if ($request->filled('start_date') && $request->filled('end_date')) {
            $productionQuery->whereBetween('date', [$request->start_date, $request->end_date]);
        }

        $productionData = $productionQuery->get();

        // Normalize statuses and stages to be resilient to seeder/manual variations
        $normalized = $productionData->map(function($p) {
            // Status normalization (case/whitespace, multi-word mapping)
            $rawStatus = trim((string) ($p->status ?? ''));
            $lc = strtolower($rawStatus);
            $statusMap = [
                'in progress' => 'In Progress',
                'in_progress' => 'In Progress',
                'pending' => 'Pending',
                'on hold' => 'Hold',
                'hold' => 'Hold',
                'completed' => 'Completed',
                'ready' => 'Completed',
            ];
            $status = $statusMap[$lc] ?? (strlen($rawStatus) ? ucwords($lc) : 'Pending');

            // Stage normalization: prefer current_stage, but accept 'stage' if present in payloads
            $stage = trim((string) ($p->current_stage ?? ($p->stage ?? '')));
            $stageLc = strtolower($stage);
            // Map common variants to canonical values used by dashboard/seeders
            $stageAliases = [
                'cutting and shaping' => 'Cutting & Shaping',
                'sanding and surface preparation' => 'Sanding & Surface Preparation',
                'quality assurance' => 'Quality Check & Packaging',
                'quality control' => 'Quality Check & Packaging',
                'ready to deliver' => 'Ready for Delivery',
                'ready for delivery' => 'Ready for Delivery',
                'completed' => 'Ready for Delivery', // completed items treated as ready slice
            ];
            if (isset($stageAliases[$stageLc])) {
                $stage = $stageAliases[$stageLc];
            }

            // Attach normalized virtual attributes for downstream collection ops
            $p->setAttribute('normalized_status', $status);
            $p->setAttribute('normalized_stage', $stage);
            return $p;
        });

        // KPIs from Production data
        $kpis = [
            'total'       => $normalized->count(),
            'in_progress' => $normalized->where('normalized_status', 'In Progress')->count(),
            'completed'   => $normalized->where('normalized_status', 'Completed')->count(),
            'hold'        => $normalized->where('normalized_status', 'Hold')->count(),
        ];

        // Daily output from Production data
        $daily = $normalized
            ->filter(function($p){ return !empty($p->date); })
            ->groupBy(function($p){
                // Ensure date is grouped reliably even if stored as string
                try {
                    return optional($p->date instanceof \Carbon\Carbon ? $p->date : \Carbon\Carbon::parse($p->date))->format('Y-m-d');
                } catch (\Throwable $e) {
                    return null;
                }
            })
            ->forget([null])
            ->map(fn($items, $date) => [
                'date'     => $date,
                'quantity' => $items->sum('quantity'),
            ])
            ->values()
            ->sortBy('date')
            ->values();

        // Stage breakdown from Production data (using actual stages from data)
        $actualStages = $normalized->whereNotNull('normalized_stage')
            ->where('normalized_stage', '!=', '')
            ->pluck('normalized_stage')
            ->unique()
            ->values()
            ->toArray();
        
        // If no stages found, use default stages
        if (empty($actualStages)) {
            $actualStages = [
                'Material Preparation',
                'Cutting & Shaping', 
                'Assembly',
                'Sanding & Surface Preparation',
                'Finishing',
                'Quality Check & Packaging'
            ];
        }
        // Always include Ready for Delivery slice for analytics visibility
        if (!in_array('Ready for Delivery', $actualStages, true)) {
            $actualStages[] = 'Ready for Delivery';
        }
        
        // Align stage breakdown with the dashboard's "Current Production Processes"
        // Only count items that are actively In Progress to avoid including Pending
        $stageBreakdown = collect($actualStages)->map(function($stage) use ($normalized) {
            $query = $normalized->where('normalized_stage', $stage);
            $value = $stage === 'Ready for Delivery'
                ? $query->where('normalized_status', 'Completed')->count() // completed items in Ready for Delivery
                : $query->where('normalized_status', 'In Progress')->count(); // active items elsewhere
            return [ 'name' => $stage, 'value' => $value ];
        })->values();

        // Resource allocation suggestions based on Production data
        $resourceAllocation = [];
        foreach ($actualStages as $stage) {
            // Focus allocation on active items (In Progress)
            $stageCount = $normalized->where('normalized_stage', $stage)->where('normalized_status', 'In Progress')->count();
            if ($stageCount > 3) {
                $resourceAllocation[] = [
                    'stage' => $stage,
                    'workload' => $stageCount,
                    'message' => "Stage '{$stage}' is overloaded with {$stageCount} items",
                    'priority' => 'high'
                ];
            }
        }

        // Stage workload analysis based on Production data
        $capacities = [
            'Material Preparation' => 3, 
            'Cutting & Shaping' => 4, 
            'Assembly' => 5, 
            'Sanding & Surface Preparation' => 3, 
            'Finishing' => 3, 
            'Quality Check & Packaging' => 2
        ];
        
        $stageWorkload = collect($actualStages)->map(function($stage) use ($normalized, $capacities) {
            // Only consider In Progress for current workload to match dashboard cards
            $currentWorkload = $normalized->where('normalized_stage', $stage)->where('normalized_status', 'In Progress')->count();
            $capacity = $capacities[$stage] ?? 1;
            $utilization = ($currentWorkload / $capacity) * 100;
            
            return [
                'stage' => $stage,
                'capacity' => $capacity,
                'current_workload' => $currentWorkload,
                'utilization_percentage' => round($utilization, 1),
                'status' => $utilization > 90 ? 'overloaded' : ($utilization > 70 ? 'busy' : 'available')
            ];
        })->values();

        // Get top products from Production data
        $topProducts = $normalized->groupBy('product_name')
            ->map(function($productions, $productName) {
                return [
                    'name' => $productName,
                    'quantity' => $productions->sum('quantity'),
                ];
            })
            ->sortByDesc('quantity')
            ->take(5)
            ->values();

        // Get top users from Production data
        $topUsers = $normalized->groupBy('user_id')
            ->map(function($productions, $userId) {
                $user = \App\Models\User::find($userId);
                return [
                    'name' => $user ? $user->name : 'Unknown User',
                    'quantity' => $productions->sum('quantity'),
                ];
            })
            ->sortByDesc('quantity')
            ->take(5)
            ->values();

        return response()->json([
            'kpis'             => $kpis,
            'daily_output'     => $daily,
            'stage_breakdown'  => $stageBreakdown,
            'top_products'     => $topProducts,
            'top_users'        => $topUsers,
            'resource_allocation' => $resourceAllocation,
            'stage_workload'   => $stageWorkload,
            'capacity_utilization' => [
                'total_capacity' => array_sum($capacities),
                'current_utilization' => $normalized->filter(function($p){
                    return in_array($p->normalized_status, ['In Progress', 'Pending']);
                })->count(),
                'utilization_percentage' => round(($normalized->filter(function($p){
                    return in_array($p->normalized_status, ['In Progress', 'Pending']);
                })->count() / max(1, array_sum($capacities))) * 100, 1)
            ]
        ]);
    }

    /**
     * Get predictive analytics for production
     */
    public function predictiveAnalytics(Request $request)
    {
        $productId = $request->get('product_id');
        $days = $request->get('days', 7);

        // Get historical data for the product
        $historicalData = ProductionAnalytics::where('product_id', $productId)
            ->orderBy('date', 'desc')
            ->limit(30)
            ->get();

        // Calculate moving averages for prediction
        $avgOutput = $historicalData->avg('actual_output');
        $avgEfficiency = $historicalData->avg('efficiency_percentage');
        $avgDuration = $historicalData->avg('total_duration_minutes');

        // Predict next day's output based on historical data
        $predictedOutput = round($avgOutput * (1 + ($avgEfficiency - 100) / 100));
        
        // Calculate trend
        $recentData = $historicalData->take(7);
        $olderData = $historicalData->slice(7, 7);
        $trend = $recentData->avg('actual_output') - $olderData->avg('actual_output');

        // Generate daily predictions
        $predictions = [];
        $currentDate = Carbon::now();
        
        for ($i = 1; $i <= $days; $i++) {
            $predictedDate = $currentDate->copy()->addDays($i);
            $dayOfWeek = $predictedDate->dayOfWeek;
            
            // Adjust prediction based on day of week (weekends might have different output)
            $dayAdjustment = in_array($dayOfWeek, [0, 6]) ? 0.8 : 1.0; // Weekend adjustment
            
            $dailyPrediction = round($predictedOutput * $dayAdjustment);
            
            $predictions[] = [
                'date' => $predictedDate->format('Y-m-d'),
                'predicted_output' => $dailyPrediction,
                'confidence_level' => 85, // Based on historical accuracy
                'factors' => [
                    'historical_average' => round($avgOutput),
                    'efficiency_trend' => round($trend, 2),
                    'day_of_week_adjustment' => $dayAdjustment
                ]
            ];
        }

        return response()->json([
            'product_id' => $productId,
            'historical_data' => $historicalData,
            'predictions' => $predictions,
            'summary' => [
                'avg_daily_output' => round($avgOutput),
                'avg_efficiency' => round($avgEfficiency, 2),
                'trend' => round($trend, 2),
                'prediction_confidence' => 85
            ]
        ]);
    }

    /**
     * Start a production process for Alkansya (6 processes)
     */
    public function startProduction(Request $request)
    {
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'quantity' => 'required|integer|min:1',
            'user_id' => 'required|exists:users,id',
            'order_id' => 'nullable|exists:orders,id',
        ]);

        $product = Product::findOrFail($data['product_id']);

        // Pre-check: ensure raw materials are sufficient for requested quantity using BOM
        $bom = ProductMaterial::where('product_id', $product->id)->get();
        $shortages = [];
        foreach ($bom as $mat) {
            $inv = InventoryItem::find($mat->inventory_item_id);
            if ($inv) {
                $required = (int) ($mat->qty_per_unit * $data['quantity']);
                if ($inv->quantity_on_hand < $required) {
                    $shortages[] = [
                        'sku' => $inv->sku,
                        'name' => $inv->name,
                        'required' => $required,
                        'on_hand' => $inv->quantity_on_hand,
                        'deficit' => max(0, $required - $inv->quantity_on_hand),
                    ];
                }
            }
        }
        if (!empty($shortages)) {
            return response()->json([
                'message' => 'Insufficient raw materials to start production',
                'shortages' => $shortages,
            ], 422);
        }
        
        // Create production record
        $production = Production::create([
            'user_id' => $data['user_id'],
            'product_id' => $data['product_id'],
            'product_name' => $product->name,
            'date' => Carbon::now()->format('Y-m-d'),
            'stage' => 'Design',
            'status' => 'In Progress',
            'quantity' => $data['quantity'],
            'order_id' => $data['order_id'] ?? null,
        ]);

        // Create process records for Tables and Chairs (6 processes)
        // Exclude alkansya from production tracking as they are pre-made inventory
        if (!str_contains(strtolower($product->name), 'alkansya')) {
            // Allocate the 2-week timeline (14 days ≈ 14*24*60 = 20160 minutes)
            // Distribution by complexity: 10%, 20%, 30%, 15%, 20%, 5%
            $totalMinutes = 14 * 24 * 60; // 20160
            $processes = [
                ['name' => 'Material Preparation', 'order' => 1, 'estimated_duration' => (int) round($totalMinutes * 0.10)],
                ['name' => 'Cutting & Shaping', 'order' => 2, 'estimated_duration' => (int) round($totalMinutes * 0.20)],
                ['name' => 'Assembly', 'order' => 3, 'estimated_duration' => (int) round($totalMinutes * 0.30)],
                ['name' => 'Sanding & Surface Preparation', 'order' => 4, 'estimated_duration' => (int) round($totalMinutes * 0.15)],
                ['name' => 'Finishing', 'order' => 5, 'estimated_duration' => (int) round($totalMinutes * 0.20)],
                ['name' => 'Quality Check & Packaging', 'order' => 6, 'estimated_duration' => (int) round($totalMinutes * 0.05)],
            ];

            foreach ($processes as $process) {
                ProductionProcess::create([
                    'production_id' => $production->id,
                    'process_name' => $process['name'],
                    'process_order' => $process['order'],
                    'status' => $process['order'] === 1 ? 'in_progress' : 'pending',
                    'estimated_duration_minutes' => $process['estimated_duration'],
                    'started_at' => $process['order'] === 1 ? Carbon::now() : null,
                ]);
            }

            // Set estimated completion date (2 weeks for tables and chairs)
            $estimatedCompletionDate = Carbon::now()->addWeeks(2);
            $production->update(['estimated_completion_date' => $estimatedCompletionDate]);
        } else {
            // For alkansya, mark as ready for delivery immediately since they're pre-made
            $production->update([
                'status' => 'Completed',
                'stage' => 'Ready for Delivery',
                'estimated_completion_date' => Carbon::now(),
            ]);
        }

        // Automatically reduce inventory materials only if not created from an order (to avoid double deduction)
        if (empty($data['order_id'])) {
            $this->reduceInventoryMaterials($production);
        }

        return response()->json($production->load('processes'));
    }

    /**
     * Update production process status
     */
    public function updateProcess(Request $request, $productionId, $processId)
    {
        $data = $request->validate([
            'status' => 'required|in:pending,in_progress,completed,delayed',
            'notes' => 'nullable|string',
            'materials_used' => 'nullable|array',
            'quality_checks' => 'nullable|array',
            'force' => 'sometimes|boolean',
        ]);

        $process = ProductionProcess::where('production_id', $productionId)
            ->where('id', $processId)
            ->firstOrFail();

        // Prevent manual skipping: only allow valid transitions
        $originalStatus = $process->status;
        $nextAllowed = [
            'pending' => ['in_progress', 'delayed'],
            'in_progress' => ['completed', 'delayed'],
            'delayed' => ['in_progress', 'completed'],
            'completed' => [],
        ];
        if (!in_array($data['status'], $nextAllowed[$originalStatus] ?? []) && empty($data['force'])) {
            return response()->json(['message' => 'Invalid status transition'], 422);
        }

        $process->update($data);

        // Ensure production reflects process state promptly for analytics
        $production = Production::find($productionId);
        if ($production) {
            $active = ProductionProcess::where('production_id', $productionId)
                ->whereIn('status', ['in_progress', 'pending'])
                ->orderBy('process_order')
                ->first();
            $activeName = $active?->process_name ?? $process->process_name;

            // If any process is in_progress, set production status accordingly
            $anyInProgress = ProductionProcess::where('production_id', $productionId)
                ->where('status', 'in_progress')
                ->exists();

            $production->update([
                'stage' => $activeName,
                'current_stage' => $activeName,
                'status' => $anyInProgress ? 'In Progress' : ($production->status === 'Completed' ? 'Completed' : $production->status),
            ]);
        }

        // Broadcast process update
        broadcast(new ProductionProcessUpdated($process))->toOthers();

        // If process is completed, start next process
        if ($data['status'] === 'completed') {
            $process->update(['completed_at' => Carbon::now()]);
            
            $nextProcess = ProductionProcess::where('production_id', $productionId)
                ->where('process_order', $process->process_order + 1)
                ->first();

            if ($nextProcess) {
                $nextProcess->update([
                    'status' => 'in_progress',
                    'started_at' => Carbon::now(),
                ]);
            } else {
                // All processes completed
                $production = Production::find($productionId);
                $production->update([
                    'status' => 'Completed',
                    'stage' => 'Ready for Delivery',
                    'current_stage' => 'Ready for Delivery',
                    'actual_completion_date' => Carbon::now(),
                ]);

                // If linked to an order, also mark order ready for delivery
                if ($production && $production->order_id) {
                    \App\Models\Order::where('id', $production->order_id)
                        ->update(['status' => 'ready_for_delivery']);
                }

                // If linked to an order, mark tracking completed
                if ($production && $production->order_id) {
                    $tracking = OrderTracking::firstOrCreate([
                        'order_id' => $production->order_id,
                        'product_id' => $production->product_id,
                    ], [
                        'tracking_type' => 'standard',
                        'current_stage' => 'Ready for Delivery',
                        'status' => 'completed',
                    ]);
                    $tracking->update([
                        'current_stage' => 'Ready for Delivery',
                        'status' => 'completed',
                        'actual_completion_date' => Carbon::now(),
                    ]);
                    broadcast(new \App\Events\OrderTrackingUpdated($tracking))->toOthers();
                }
            }
        }

        // Sync order tracking current stage/status when linked to order
        $production = Production::find($productionId);
        if ($production && $production->order_id) {
            $stageStatus = match ($process->status) {
                'in_progress' => 'in_production',
                'completed' => 'completed',
                'delayed' => 'in_production',
                default => 'pending',
            };

            $tracking = OrderTracking::firstOrCreate([
                'order_id' => $production->order_id,
                'product_id' => $production->product_id,
            ], [
                'tracking_type' => 'standard',
                'current_stage' => $process->process_name,
                'status' => $stageStatus,
            ]);

            $tracking->update([
                'current_stage' => $process->process_name,
                'status' => $stageStatus,
            ]);

            broadcast(new \App\Events\OrderTrackingUpdated($tracking))->toOthers();
        }

        // Reflect current active stage back to production and recompute overall progress
        if ($production) {
            $active = ProductionProcess::where('production_id', $productionId)
                ->whereIn('status', ['in_progress', 'pending'])
                ->orderBy('process_order')
                ->first();
            $activeName = $active?->process_name ?? $process->process_name;
            $production->update([
                'stage' => $activeName,
                'current_stage' => $activeName,
            ]);

            $production->load('processes');
            $overall = $this->calculateOverallProgress($production);
            $production->update(['overall_progress' => $overall]);

            broadcast(new ProductionUpdated($production->fresh(['processes'])))->toOthers();
        }

        return response()->json($process->load('production'));
    }

    /**
     * Get daily production summary with predictive analytics
     */
    public function dailySummary(Request $request)
    {
        $date = $request->get('date', Carbon::now()->format('Y-m-d'));
        
        // Get today's productions
        $todayProductions = Production::where('date', $date)->get();
        
        // Calculate daily metrics
        $totalOutput = $todayProductions->sum('quantity');
        $completedProductions = $todayProductions->where('status', 'Completed')->count();
        $inProgressProductions = $todayProductions->where('status', 'In Progress')->count();
        
        // Get process breakdown
        $processBreakdown = ProductionProcess::whereHas('production', function($query) use ($date) {
            $query->where('date', $date);
        })->get()->groupBy('process_name')->map(function($processes) {
            return [
                'total' => $processes->count(),
                'completed' => $processes->where('status', 'completed')->count(),
                'in_progress' => $processes->where('status', 'in_progress')->count(),
                'delayed' => $processes->where('status', 'delayed')->count(),
            ];
        });

        // Calculate efficiency
        $targetOutput = 50; // Assuming 50 units per day target
        $efficiency = $targetOutput > 0 ? round(($totalOutput / $targetOutput) * 100, 2) : 0;

        // Get predictive forecast for tomorrow
        $tomorrow = Carbon::parse($date)->addDay()->format('Y-m-d');
        $predictedOutput = $this->predictTomorrowOutput($date);

        return response()->json([
            'date' => $date,
            'summary' => [
                'total_output' => $totalOutput,
                'completed_productions' => $completedProductions,
                'in_progress_productions' => $inProgressProductions,
                'efficiency_percentage' => $efficiency,
                'target_output' => $targetOutput,
            ],
            'process_breakdown' => $processBreakdown,
            'prediction' => [
                'tomorrow_date' => $tomorrow,
                'predicted_output' => $predictedOutput,
                'confidence_level' => 85,
            ],
            'productions' => $todayProductions->load('processes')
        ]);
    }

    /**
     * Reduce inventory materials when production starts
     */
    private function reduceInventoryMaterials($production)
    {
        // Use BOM to compute material usage
        $bom = ProductMaterial::where('product_id', $production->product_id)->get();
        foreach ($bom as $mat) {
            $inventoryItem = InventoryItem::find($mat->inventory_item_id);
            if (!$inventoryItem) {
                continue;
            }
            $quantityNeeded = (int) ($mat->qty_per_unit * $production->quantity);

            // Reduce inventory
            $inventoryItem->decrement('quantity_on_hand', $quantityNeeded);

            // Record usage (migration uses qty_used field)
            InventoryUsage::create([
                'inventory_item_id' => $inventoryItem->id,
                'qty_used' => $quantityNeeded,
                'date' => Carbon::now()->format('Y-m-d'),
            ]);

            // Low stock notifications when hitting ROP
            $inventoryItem->refresh();
            if (!is_null($inventoryItem->reorder_point) && $inventoryItem->quantity_on_hand <= $inventoryItem->reorder_point) {
                User::where('role', 'employee')->get()->each(function ($u) use ($inventoryItem) {
                    $u->notify(new LowStockAlert($inventoryItem));
                });
            }
        }
    }

    /**
     * Predict tomorrow's output based on historical data
     */
    private function predictTomorrowOutput($currentDate)
    {
        // Get last 7 days of production data
        $historicalData = Production::where('date', '>=', Carbon::parse($currentDate)->subDays(7))
            ->where('date', '<', $currentDate)
            ->get()
            ->groupBy('date')
            ->map(function($productions) {
                return $productions->sum('quantity');
            });

        if ($historicalData->count() < 3) {
            return 40; // Default prediction if not enough data
        }

        // Calculate moving average
        $avgOutput = $historicalData->avg();
        
        // Apply trend adjustment
        $recentDays = $historicalData->take(3);
        $olderDays = $historicalData->slice(3, 3);
        $trend = $recentDays->avg() - $olderDays->avg();
        
        $prediction = round($avgOutput + ($trend * 0.5)); // Apply 50% of trend
        
        return max(0, $prediction);
    }

    /**
     * Get comprehensive production dashboard data
     */
    public function dashboard(Request $request)
    {
        $dateRange = $request->get('date_range', 7); // Default 7 days
        $startDate = Carbon::now()->subDays($dateRange);
        
        // Get active productions (excluding alkansya)
        $activeProductions = Production::whereHas('product', function($query) {
                $query->where('name', 'NOT LIKE', '%alkansya%');
            })
            ->where('status', '!=', 'Completed')
            ->with(['product', 'processes', 'user'])
            ->get();

        // Get completed productions in date range
        $completedProductions = Production::whereHas('product', function($query) {
                $query->where('name', 'NOT LIKE', '%alkansya%');
            })
            ->where('status', 'Completed')
            ->where('updated_at', '>=', $startDate)
            ->count();

        // Calculate workload distribution
        $workloadByStage = $activeProductions->groupBy('stage')
            ->map(function($productions, $stage) {
                return [
                    'stage' => $stage,
                    'count' => $productions->count(),
                    'total_quantity' => $productions->sum('quantity'),
                    'avg_days_in_stage' => $productions->avg(function($p) {
                        return $p->updated_at->diffInDays(Carbon::now());
                    })
                ];
            })->values();

        // Resource utilization
        $resourceUtilization = $this->calculateResourceUtilization($activeProductions);

        // Production efficiency trends
        $efficiencyTrends = $this->getEfficiencyTrends($dateRange);

        return response()->json([
            'overview' => [
                'active_productions' => $activeProductions->count(),
                'completed_this_period' => $completedProductions,
                'total_quantity_in_production' => $activeProductions->sum('quantity'),
                'avg_completion_time' => $this->getAverageCompletionTime(),
                'on_time_delivery_rate' => $this->getOnTimeDeliveryRate($dateRange),
            ],
            'workload_by_stage' => $workloadByStage,
            'resource_utilization' => $resourceUtilization,
            'efficiency_trends' => $efficiencyTrends,
            'active_productions' => $activeProductions,
            'priority_breakdown' => $activeProductions->groupBy('priority')
                ->map->count(),
        ]);
    }

    /**
     * Get efficiency report with detailed metrics
     */
    public function efficiencyReport(Request $request)
    {
        $startDate = $request->get('start_date', Carbon::now()->subMonth());
        $endDate = $request->get('end_date', Carbon::now());

        $productions = Production::whereHas('product', function($query) {
                $query->where('name', 'NOT LIKE', '%alkansya%');
            })
            ->whereBetween('created_at', [$startDate, $endDate])
            ->with(['processes', 'product'])
            ->get();

        $processEfficiency = [];
        $processNames = ['Material Preparation', 'Cutting & Shaping', 'Assembly', 
                        'Sanding & Surface Preparation', 'Finishing', 'Quality Check & Packaging'];

        foreach ($processNames as $processName) {
            $processes = ProductionProcess::whereHas('production', function($query) use ($startDate, $endDate) {
                    $query->whereHas('product', function($subQuery) {
                        $subQuery->where('name', 'NOT LIKE', '%alkansya%');
                    })
                    ->whereBetween('created_at', [$startDate, $endDate]);
                })
                ->where('process_name', $processName)
                ->whereNotNull('completed_at')
                ->get();

            $avgDuration = $processes->avg('duration');
            $avgEstimated = $processes->avg('estimated_duration_minutes');
            $efficiency = $avgEstimated > 0 ? ($avgEstimated / $avgDuration) * 100 : 100;

            $processEfficiency[] = [
                'process_name' => $processName,
                'avg_actual_duration' => round($avgDuration, 2),
                'avg_estimated_duration' => round($avgEstimated, 2),
                'efficiency_percentage' => round($efficiency, 2),
                'total_completed' => $processes->count(),
                'delayed_count' => $processes->where('is_delayed', true)->count(),
            ];
        }

        return response()->json([
            'date_range' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
            ],
            'overall_metrics' => [
                'total_productions' => $productions->count(),
                'completed_productions' => $productions->where('status', 'Completed')->count(),
                'avg_production_time' => $this->getAverageProductionTime($productions),
                'overall_efficiency' => $this->getOverallEfficiency($productions),
            ],
            'process_efficiency' => $processEfficiency,
        ]);
    }

    /**
     * Get capacity utilization report
     */
    public function capacityUtilization(Request $request)
    {
        $dateRange = $request->get('days', 30);
        $startDate = Carbon::now()->subDays($dateRange);

        // Assume 8 hours per day, 5 days per week capacity
        $dailyCapacityMinutes = 8 * 60; // 480 minutes
        $weeklyCapacityMinutes = $dailyCapacityMinutes * 5; // 2400 minutes

        $utilizationData = [];
        $currentDate = $startDate->copy();

        while ($currentDate->lte(Carbon::now())) {
            $dayProductions = Production::whereHas('product', function($query) {
                    $query->where('name', 'NOT LIKE', '%alkansya%');
                })
                ->whereDate('created_at', $currentDate)
                ->with('processes')
                ->get();

            $totalTimeUsed = $dayProductions->sum(function($production) {
                return $production->processes->sum('duration');
            });

            $utilizationPercentage = $dailyCapacityMinutes > 0 
                ? ($totalTimeUsed / $dailyCapacityMinutes) * 100 
                : 0;

            $utilizationData[] = [
                'date' => $currentDate->format('Y-m-d'),
                'capacity_minutes' => $dailyCapacityMinutes,
                'used_minutes' => $totalTimeUsed,
                'utilization_percentage' => round($utilizationPercentage, 2),
                'productions_count' => $dayProductions->count(),
            ];

            $currentDate->addDay();
        }

        $avgUtilization = collect($utilizationData)->avg('utilization_percentage');
        $maxUtilization = collect($utilizationData)->max('utilization_percentage');
        $minUtilization = collect($utilizationData)->min('utilization_percentage');

        return response()->json([
            'date_range' => $dateRange,
            'summary' => [
                'average_utilization' => round($avgUtilization, 2),
                'peak_utilization' => round($maxUtilization, 2),
                'lowest_utilization' => round($minUtilization, 2),
                'daily_capacity_hours' => 8,
            ],
            'daily_utilization' => $utilizationData,
        ]);
    }

    /**
     * Get resource allocation optimization suggestions
     */
    public function resourceAllocation(Request $request)
    {
        $activeProductions = Production::whereHas('product', function($query) {
                $query->where('name', 'NOT LIKE', '%alkansya%');
            })
            ->where('status', '!=', 'Completed')
            ->with(['processes', 'product'])
            ->get();

        // Analyze bottlenecks by counting productions in each stage
        $stageAnalysis = $activeProductions->groupBy('stage')
            ->map(function($productions, $stage) {
                $totalQuantity = $productions->sum('quantity');
                $avgTimeInStage = $productions->avg(function($p) {
                    return $p->updated_at->diffInHours(Carbon::now());
                });
                
                return [
                    'stage' => $stage,
                    'productions_count' => $productions->count(),
                    'total_quantity' => $totalQuantity,
                    'avg_time_in_stage_hours' => round($avgTimeInStage, 1),
                    'urgency_score' => $this->calculateUrgencyScore($productions),
                ];
            })->sortByDesc('urgency_score')->values();

        // Resource optimization suggestions
        $suggestions = $this->generateResourceOptimizationSuggestions($stageAnalysis);

        return response()->json([
            'current_allocation' => $stageAnalysis,
            'bottlenecks' => $stageAnalysis->take(3), // Top 3 bottlenecks
            'optimization_suggestions' => $suggestions,
            'total_active_productions' => $activeProductions->count(),
        ]);
    }

    /**
     * Get comprehensive performance metrics
     */
    public function performanceMetrics(Request $request)
    {
        $period = $request->get('period', 'month'); // week, month, quarter
        $startDate = match($period) {
            'week' => Carbon::now()->subWeek(),
            'quarter' => Carbon::now()->subQuarter(),
            default => Carbon::now()->subMonth(),
        };

        $productions = Production::whereHas('product', function($query) {
                $query->where('name', 'NOT LIKE', '%alkansya%');
            })
            ->where('created_at', '>=', $startDate)
            ->with(['processes', 'product'])
            ->get();

        $completedProductions = $productions->where('status', 'Completed');
        $inProgressProductions = $productions->where('status', 'In Progress');

        // Calculate KPIs
        $throughput = $completedProductions->sum('quantity');
        $averageLeadTime = $this->getAverageLeadTime($completedProductions);
        $qualityRate = $this->getQualityRate($completedProductions);
        $onTimeDelivery = $this->getOnTimeDeliveryRate(null, $completedProductions);
        $resourceUtilization = $this->getResourceUtilization($productions);

        return response()->json([
            'period' => $period,
            'date_range' => [
                'start' => $startDate->format('Y-m-d'),
                'end' => Carbon::now()->format('Y-m-d'),
            ],
            'kpis' => [
                'throughput' => $throughput,
                'average_lead_time_days' => round($averageLeadTime, 1),
                'quality_rate_percentage' => round($qualityRate, 2),
                'on_time_delivery_percentage' => round($onTimeDelivery, 2),
                'resource_utilization_percentage' => round($resourceUtilization, 2),
            ],
            'production_summary' => [
                'total_started' => $productions->count(),
                'completed' => $completedProductions->count(),
                'in_progress' => $inProgressProductions->count(),
                'completion_rate' => $productions->count() > 0 
                    ? round(($completedProductions->count() / $productions->count()) * 100, 2) 
                    : 0,
            ],
            'trends' => $this->getPerformanceTrends($startDate),
        ]);
    }

    /**
     * Create batch production
     */
    public function createBatch(Request $request)
    {
        $data = $request->validate([
            'product_id' => 'required|exists:products,id',
            'batch_quantity' => 'required|integer|min:1',
            'orders' => 'required|array',
            'orders.*.order_id' => 'required|exists:orders,id',
            'orders.*.quantity' => 'required|integer|min:1',
            'priority' => 'in:low,medium,high,urgent',
            'user_id' => 'required|exists:users,id',
        ]);

        $product = Product::findOrFail($data['product_id']);
        $batchNumber = 'BATCH-' . Carbon::now()->format('YmdHis');

        // Check if product should be tracked (not alkansya)
        if (str_contains(strtolower($product->name), 'alkansya')) {
            return response()->json([
                'message' => 'Alkansya products do not require production tracking as they are pre-made inventory items.',
                'batch_number' => $batchNumber,
                'status' => 'ready_for_delivery'
            ]);
        }

        $productions = [];
        foreach ($data['orders'] as $orderData) {
            $production = Production::create([
                'order_id' => $orderData['order_id'],
                'user_id' => $data['user_id'],
                'product_id' => $data['product_id'],
                'product_name' => $product->name,
                'date' => Carbon::now()->format('Y-m-d'),
                'stage' => 'Material Preparation',
                'status' => 'In Progress',
                'quantity' => $orderData['quantity'],
                'priority' => $data['priority'] ?? 'medium',
                'production_batch_number' => $batchNumber,
                'estimated_completion_date' => Carbon::now()->addWeeks(2),
            ]);

            // Create process records
            $this->createProductionProcesses($production);
            $productions[] = $production;
        }

        return response()->json([
            'batch_number' => $batchNumber,
            'total_productions' => count($productions),
            'total_quantity' => array_sum(array_column($data['orders'], 'quantity')),
            'estimated_completion' => Carbon::now()->addWeeks(2),
            'productions' => $productions
        ]);
    }

    /**
     * Update production priority
     */
    public function updatePriority(Request $request, $id)
    {
        $data = $request->validate([
            'priority' => 'required|in:low,medium,high,urgent',
            'reason' => 'nullable|string'
        ]);

        $production = Production::findOrFail($id);
        $production->update([
            'priority' => $data['priority'],
            'notes' => $production->notes . "\n[" . Carbon::now() . "] Priority changed to {$data['priority']}. Reason: " . ($data['reason'] ?? 'Not specified')
        ]);

        return response()->json($production->fresh());
    }

    /**
     * Get production timeline
     */
    public function getTimeline($id)
    {
        $production = Production::with(['processes' => function($query) {
                $query->orderBy('process_order');
            }])->findOrFail($id);

        $timeline = $production->processes->map(function($process) {
            return [
                'process_name' => $process->process_name,
                'process_order' => $process->process_order,
                'status' => $process->status,
                'estimated_duration' => $process->estimated_duration_minutes,
                'actual_duration' => $process->duration,
                'started_at' => $process->started_at,
                'completed_at' => $process->completed_at,
                'is_delayed' => $process->is_delayed,
                'notes' => $process->notes,
            ];
        });

        return response()->json([
            'production' => $production,
            'timeline' => $timeline,
            'overall_progress' => $this->calculateOverallProgress($production),
        ]);
    }

    // Helper methods
    private function calculateResourceUtilization($productions)
    {
        // Implementation for resource utilization calculation
        return [
            'workers' => 85,
            'equipment' => 75,
            'materials' => 90,
        ];
    }

    private function getEfficiencyTrends($days)
    {
        // Implementation for efficiency trends
        return [];
    }

    private function getAverageCompletionTime()
    {
        $recentCompletions = Production::where('status', 'Completed')
            ->where('created_at', '>=', Carbon::now()->subMonth())
            ->get();

        return $recentCompletions->avg(function($production) {
            return $production->created_at->diffInDays($production->updated_at);
        }) ?? 14; // Default 14 days
    }

    private function getOnTimeDeliveryRate($days = null, $productions = null)
    {
        if (!$productions) {
            $query = Production::where('status', 'Completed');
            if ($days) {
                $query->where('created_at', '>=', Carbon::now()->subDays($days));
            }
            $productions = $query->get();
        }

        $onTimeCount = $productions->filter(function($production) {
            return $production->actual_completion_date && 
                   $production->estimated_completion_date &&
                   $production->actual_completion_date <= $production->estimated_completion_date;
        })->count();

        return $productions->count() > 0 ? ($onTimeCount / $productions->count()) * 100 : 100;
    }

    private function calculateUrgencyScore($productions)
    {
        return $productions->sum(function($production) {
            $priorityWeight = match($production->priority) {
                'urgent' => 4,
                'high' => 3,
                'medium' => 2,
                'low' => 1,
                default => 2,
            };
            
            $timeWeight = $production->updated_at->diffInHours(Carbon::now()) / 24;
            return $priorityWeight * (1 + $timeWeight);
        });
    }

    private function generateResourceOptimizationSuggestions($stageAnalysis)
    {
        $suggestions = [];
        $topBottleneck = $stageAnalysis->first();
        
        if ($topBottleneck && $topBottleneck['productions_count'] > 3) {
            $suggestions[] = [
                'type' => 'bottleneck_alert',
                'message' => "Consider allocating additional resources to {$topBottleneck['stage']} stage",
                'priority' => 'high',
                'impact' => 'Reduce production delays by up to 25%'
            ];
        }

        return $suggestions;
    }

    private function getAverageProductionTime($productions)
    {
        return $productions->where('status', 'Completed')
            ->avg(function($production) {
                return $production->created_at->diffInDays($production->updated_at);
            }) ?? 14;
    }

    private function getOverallEfficiency($productions)
    {
        // Calculate based on estimated vs actual completion times
        $completedProductions = $productions->where('status', 'Completed')
            ->filter(function($p) {
                return $p->estimated_completion_date && $p->actual_completion_date;
            });

        if ($completedProductions->count() === 0) return 100;

        $efficiencyScores = $completedProductions->map(function($production) {
            $estimatedDays = $production->created_at->diffInDays($production->estimated_completion_date);
            $actualDays = $production->created_at->diffInDays($production->actual_completion_date);
            
            return $estimatedDays > 0 ? min(100, ($estimatedDays / $actualDays) * 100) : 100;
        });

        return $efficiencyScores->avg();
    }

    private function getAverageLeadTime($productions)
    {
        return $productions->avg(function($production) {
            return $production->created_at->diffInDays($production->updated_at);
        }) ?? 14;
    }

    private function getQualityRate($productions)
    {
        // Assume quality checks are passed if no quality issues noted
        $passedQuality = $productions->filter(function($production) {
            return $production->processes
                ->where('process_name', 'Quality Check & Packaging')
                ->where('status', 'completed')
                ->count() > 0;
        })->count();

        return $productions->count() > 0 ? ($passedQuality / $productions->count()) * 100 : 100;
    }

    private function getResourceUtilization($productions)
    {
        // Simplified resource utilization calculation
        return 80; // Placeholder
    }

    private function getPerformanceTrends($startDate)
    {
        // Implementation for performance trends over time
        return [];
    }

    private function createProductionProcesses($production)
    {
        $processes = [
            ['name' => 'Material Preparation', 'order' => 1, 'estimated_duration' => 120],
            ['name' => 'Cutting & Shaping', 'order' => 2, 'estimated_duration' => 240],
            ['name' => 'Assembly', 'order' => 3, 'estimated_duration' => 360],
            ['name' => 'Sanding & Surface Preparation', 'order' => 4, 'estimated_duration' => 180],
            ['name' => 'Finishing', 'order' => 5, 'estimated_duration' => 240],
            ['name' => 'Quality Check & Packaging', 'order' => 6, 'estimated_duration' => 60],
        ];

        foreach ($processes as $process) {
            ProductionProcess::create([
                'production_id' => $production->id,
                'process_name' => $process['name'],
                'process_order' => $process['order'],
                'status' => $process['order'] === 1 ? 'in_progress' : 'pending',
                'estimated_duration_minutes' => $process['estimated_duration'],
                'started_at' => $process['order'] === 1 ? Carbon::now() : null,
            ]);
        }
    }

    private function calculateOverallProgress($production)
    {
        $totalProcesses = $production->processes->count();
        $completedProcesses = $production->processes->where('status', 'completed')->count();
        $inProgressProcesses = $production->processes->where('status', 'in_progress')->count();
        
        $progress = $totalProcesses > 0 
            ? (($completedProcesses + ($inProgressProcesses * 0.5)) / $totalProcesses) * 100
            : 0;
            
        return round($progress, 2);
    }
}
