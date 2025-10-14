<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\AlkansyaDailyOutput;
use App\Models\Product;
use App\Models\ProductMaterial;
use App\Models\InventoryItem;
use App\Models\InventoryUsage;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class AlkansyaDailyOutputController extends Controller
{
    /**
     * Display a listing of daily outputs
     */
    public function index(Request $request)
    {
        $query = AlkansyaDailyOutput::query();

        // Filter by date range if provided
        if ($request->has('start_date')) {
            $query->where('date', '>=', $request->start_date);
        }
        if ($request->has('end_date')) {
            $query->where('date', '<=', $request->end_date);
        }

        // Get last 3 months by default
        if (!$request->has('start_date') && !$request->has('end_date')) {
            $query->where('date', '>=', Carbon::now()->subMonths(3));
        }

        $outputs = $query->orderBy('date', 'desc')->get();

        return response()->json($outputs);
    }

    /**
     * Store a newly created daily output with automatic material deduction
     */
    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'quantity' => 'required|integer|min:0',
            'notes' => 'nullable|string',
            'produced_by' => 'nullable|string'
        ]);

        try {
            DB::beginTransaction();

            // Get Alkansya product and BOM
            $alkansyaProduct = Product::where('name', 'Alkansya')->first();
            if (!$alkansyaProduct) {
                return response()->json(['error' => 'Alkansya product not found'], 404);
            }

            $bomMaterials = ProductMaterial::where('product_id', $alkansyaProduct->id)
                ->with('inventoryItem')
                ->get();

            if ($bomMaterials->isEmpty()) {
                return response()->json(['error' => 'Alkansya BOM not found'], 404);
            }

            $quantity = $request->quantity;
            $materialsUsed = [];
            $totalCost = 0;

            // Calculate materials needed and deduct from inventory
            foreach ($bomMaterials as $bomMaterial) {
                $inventoryItem = $bomMaterial->inventoryItem;
                $requiredQuantity = $bomMaterial->qty_per_unit * $quantity;
                
                if ($requiredQuantity > 0) {
                    // Check if enough stock
                    if ($inventoryItem->quantity_on_hand < $requiredQuantity) {
                        DB::rollBack();
                        return response()->json([
                            'error' => "Insufficient stock for {$inventoryItem->name}. Required: {$requiredQuantity}, Available: {$inventoryItem->quantity_on_hand}"
                        ], 400);
                    }

                    // Deduct from inventory
                    $inventoryItem->quantity_on_hand -= $requiredQuantity;
                    $inventoryItem->save();

                    // Record material usage
                    $materialsUsed[] = [
                        'inventory_item_id' => $inventoryItem->id,
                        'item_name' => $inventoryItem->name,
                        'sku' => $inventoryItem->sku,
                        'quantity_used' => $requiredQuantity,
                        'unit_cost' => $inventoryItem->unit_cost,
                        'total_cost' => $inventoryItem->unit_cost * $requiredQuantity,
                    ];

                    $totalCost += $inventoryItem->unit_cost * $requiredQuantity;

                    // Log usage in inventory_usages table
                    InventoryUsage::create([
                        'inventory_item_id' => $inventoryItem->id,
                        'qty_used' => $requiredQuantity,
                        'date' => $request->date,
                    ]);

                    Log::info("Auto-deducted {$requiredQuantity} {$inventoryItem->unit} of {$inventoryItem->name} for Alkansya daily output");
                }
            }

            // Create or update daily output record
            $dailyOutput = AlkansyaDailyOutput::updateOrCreate(
                ['date' => $request->date],
                [
                    'quantity_produced' => $quantity,
                    'notes' => $request->notes,
                    'produced_by' => $request->produced_by,
                    'materials_used' => $materialsUsed,
                    'efficiency_percentage' => 100.00, // Default efficiency
                    'defects' => 0,
                ]
            );

            // Update finished goods inventory
            $alkansyaFinishedGood = InventoryItem::where('sku', 'FG-ALKANSYA')->first();
            if ($alkansyaFinishedGood) {
                $alkansyaFinishedGood->quantity_on_hand += $quantity;
                $alkansyaFinishedGood->save();
            }

            DB::commit();

            return response()->json([
                'message' => 'Daily output added and materials automatically deducted successfully',
                'data' => $dailyOutput,
                'materials_used' => $materialsUsed,
                'total_cost' => $totalCost
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Alkansya daily output auto deduction failed: ' . $e->getMessage());
            return response()->json([
                'error' => 'Failed to add daily output: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get statistics for Alkansya production
     */
    public function statistics()
    {
        $totalOutput = AlkansyaDailyOutput::sum('quantity_produced');
        $totalDays = AlkansyaDailyOutput::count();
        $averageDaily = $totalDays > 0 ? $totalOutput / $totalDays : 0;
        
        $last7Days = AlkansyaDailyOutput::where('date', '>=', Carbon::now()->subDays(7))
            ->sum('quantity_produced');
        
        $last30Days = AlkansyaDailyOutput::where('date', '>=', Carbon::now()->subDays(30))
            ->sum('quantity_produced');

        $monthlyOutput = AlkansyaDailyOutput::select(
                DB::raw('YEAR(date) as year'),
                DB::raw('MONTH(date) as month'),
                DB::raw('SUM(quantity_produced) as total')
            )
            ->where('date', '>=', Carbon::now()->subMonths(6))
            ->groupBy('year', 'month')
            ->orderBy('year', 'desc')
            ->orderBy('month', 'desc')
            ->get();

        return response()->json([
            'total_output' => $totalOutput,
            'total_days' => $totalDays,
            'average_daily' => round($averageDaily, 2),
            'last_7_days' => $last7Days,
            'last_30_days' => $last30Days,
            'monthly_output' => $monthlyOutput
        ]);
    }

    /**
     * Get materials consumption analysis
     */
    public function materialsAnalysis()
    {
        $alkansyaProduct = Product::where('name', 'Alkansya')->first();
        if (!$alkansyaProduct) {
            return response()->json(['error' => 'Alkansya product not found'], 404);
        }

        $bomMaterials = ProductMaterial::where('product_id', $alkansyaProduct->id)
            ->with('inventoryItem')
            ->get();

        $materialsAnalysis = [];
        foreach ($bomMaterials as $bomMaterial) {
            $inventoryItem = $bomMaterial->inventoryItem;
            $totalUsed = InventoryUsage::where('inventory_item_id', $inventoryItem->id)
                ->where('date', '>=', Carbon::now()->subMonths(3))
                ->sum('qty_used');

            $materialsAnalysis[] = [
                'material_name' => $inventoryItem->name,
                'sku' => $inventoryItem->sku,
                'qty_per_unit' => $bomMaterial->qty_per_unit,
                'current_stock' => $inventoryItem->quantity_on_hand,
                'total_used_3months' => $totalUsed,
                'unit_cost' => $inventoryItem->unit_cost,
                'reorder_point' => $inventoryItem->reorder_point,
                'safety_stock' => $inventoryItem->safety_stock,
                'status' => $inventoryItem->quantity_on_hand <= $inventoryItem->reorder_point ? 'reorder' : 'ok'
            ];
        }

        return response()->json($materialsAnalysis);
    }
}