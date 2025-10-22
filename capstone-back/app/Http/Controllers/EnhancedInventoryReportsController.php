<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\InventoryTransaction;
use App\Models\Material;
use App\Models\Inventory;
use App\Models\BOM;
use App\Models\Product;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Production;
use App\Models\OrderTracking;
use App\Http\Controllers\NormalizedInventoryController;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class EnhancedInventoryReportsController extends Controller
{
    /**
     * Get normalized inventory data for stock status
     */
    public function getNormalizedInventoryData()
    {
        try {
            $materials = Material::with('inventory')->get();
            
            $items = $materials->map(function($material) {
                $totalStock = $material->inventory->sum('current_stock');
                $reorderPoint = $material->reorder_point ?? 10;
                
                // Determine stock status
                $stockStatus = 'in_stock';
                if ($totalStock <= 0) {
                    $stockStatus = 'out_of_stock';
                } elseif ($totalStock <= $reorderPoint) {
                    $stockStatus = 'low';
                }
                
                return [
                    'name' => $material->material_name,
                    'sku' => $material->material_code ?: 'MAT-' . str_pad($material->material_id, 3, '0', STR_PAD_LEFT),
                    'category' => $material->category ?? 'Material',
                    'current_stock' => $totalStock,
                    'reorder_point' => $reorderPoint,
                    'stock_status' => $stockStatus,
                    'unit' => $material->unit ?? 'units',
                    'value' => $totalStock * ($material->unit_cost ?? 100), // Default unit cost of 100 if not set
                    'unit_cost' => $material->unit_cost ?? 100
                ];
            });

            return response()->json([
                'summary' => [
                    'total_items' => $items->count(),
                    'items_needing_reorder' => $items->where('stock_status', 'low')->count() + $items->where('stock_status', 'out_of_stock')->count(),
                    'critical_items' => $items->where('stock_status', 'out_of_stock')->count(),
                    'total_usage' => 0 // This would need to be calculated from transactions
                ],
                'items' => $items
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching normalized inventory data: ' . $e->getMessage());
            return response()->json([
                'summary' => [
                    'total_items' => 0,
                    'items_needing_reorder' => 0,
                    'critical_items' => 0,
                    'total_usage' => 0
                ],
                'items' => []
            ]);
        }
    }
    /**
     * Debug endpoint to test consumption data
     */
    public function debugConsumptionData(Request $request)
    {
        try {
            $days = $request->get('days', 30);
            $startDate = Carbon::now()->subDays($days);
            $endDate = Carbon::now();

            // Debug Alkansya data
            $alkansyaOutputs = \App\Models\AlkansyaDailyOutput::whereBetween('date', [$startDate, $endDate])->get();
            $alkansyaDebug = $alkansyaOutputs->map(function($output) {
                return [
                    'id' => $output->id,
                    'date' => $output->date,
                    'quantity_produced' => $output->quantity_produced,
                    'materials_used' => $output->materials_used,
                    'materials_used_count' => is_array($output->materials_used) ? count($output->materials_used) : 0
                ];
            });

            // Debug Orders data
            $orders = \App\Models\Order::where('acceptance_status', 'accepted')
                ->whereBetween('created_at', [$startDate, $endDate])
                ->with(['items.product'])
                ->get();
            
            $ordersDebug = $orders->map(function($order) {
                return [
                    'id' => $order->id,
                    'created_at' => $order->created_at,
                    'items_count' => $order->items->count(),
                    'items' => $order->items->map(function($item) {
                        return [
                            'product_id' => $item->product_id,
                            'product_name' => $item->product->name ?? 'Unknown',
                            'category' => $item->product->category_name ?? 'Unknown',
                            'quantity' => $item->quantity
                        ];
                    })
                ];
            });

            // Debug Materials
            $materials = \App\Models\Material::take(5)->get(['id', 'material_name', 'standard_cost']);

            // If no real data, generate some sample data for testing
            $sampleData = [];
            if ($alkansyaOutputs->isEmpty() && $orders->isEmpty()) {
                $sampleData = [
                    'sample_alkansya' => [
                        'date' => Carbon::now()->format('Y-m-d'),
                        'quantity_produced' => 10,
                        'materials_used' => [
                            [
                                'material_id' => 1,
                                'material_name' => 'Sample Material 1',
                                'quantity_used' => 5,
                                'total_cost' => 100
                            ]
                        ]
                    ],
                    'sample_order' => [
                        'id' => 1,
                        'created_at' => Carbon::now(),
                        'items' => [
                            [
                                'product_id' => 1,
                                'product_name' => 'Sample Product',
                                'category_name' => 'Made-to-Order',
                                'quantity' => 2
                            ]
                        ]
                    ]
                ];
            }

            return response()->json([
                'debug_info' => [
                    'date_range' => [
                        'start' => $startDate->format('Y-m-d'),
                        'end' => $endDate->format('Y-m-d'),
                        'days' => $days
                    ],
                    'alkansya_outputs' => $alkansyaDebug,
                    'alkansya_count' => $alkansyaOutputs->count(),
                    'orders' => $ordersDebug,
                    'orders_count' => $orders->count(),
                    'materials_sample' => $materials,
                    'materials_count' => \App\Models\Material::count(),
                    'sample_data' => $sampleData,
                    'server_time' => now()->toDateTimeString()
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        }
    }

    /**
     * Get comprehensive consumption trends including orders and Alkansya output
     */
    public function getConsumptionTrends(Request $request)
    {
        try {
            $days = $request->get('days', 30);
            $productType = $request->get('product_type', 'all'); // 'all', 'alkansya', 'made_to_order'
            $startDate = Carbon::now()->subDays($days);
            $endDate = Carbon::now();

            // Get Alkansya consumption from daily output
            $alkansyaConsumption = $this->getAlkansyaConsumption($startDate, $endDate);
            \Log::info('Alkansya consumption data:', ['count' => $alkansyaConsumption->count(), 'data' => $alkansyaConsumption->toArray()]);
            
            // Get Made-to-Order consumption from accepted orders
            $madeToOrderConsumption = $this->getMadeToOrderConsumption($startDate, $endDate);
            \Log::info('Made-to-Order consumption data:', ['count' => $madeToOrderConsumption->count(), 'data' => $madeToOrderConsumption->toArray()]);

            // Combine consumption data based on filter
            $consumptionDataArray = [];
            
            if ($productType === 'all' || $productType === 'alkansya') {
                foreach ($alkansyaConsumption as $consumption) {
                    $key = $consumption['date'] . '_' . $consumption['material_id'];
                    
                    if (!isset($consumptionDataArray[$key])) {
                        $consumptionDataArray[$key] = [
                            'date' => $consumption['date'],
                            'material_id' => $consumption['material_id'],
                            'material_name' => $consumption['material_name'],
                            'total_consumption' => 0,
                            'alkansya_consumption' => 0,
                            'made_to_order_consumption' => 0,
                            'cost' => 0,
                            'product_type' => 'alkansya'
                        ];
                    }
                    
                    $consumptionDataArray[$key]['total_consumption'] += $consumption['quantity'];
                    $consumptionDataArray[$key]['alkansya_consumption'] += $consumption['quantity'];
                    $consumptionDataArray[$key]['cost'] += $consumption['cost'];
                }
            }
            
            if ($productType === 'all' || $productType === 'made_to_order') {
                foreach ($madeToOrderConsumption as $consumption) {
                    $key = $consumption['date'] . '_' . $consumption['material_id'];
                    
                    if (!isset($consumptionDataArray[$key])) {
                        $consumptionDataArray[$key] = [
                            'date' => $consumption['date'],
                            'material_id' => $consumption['material_id'],
                            'material_name' => $consumption['material_name'],
                            'total_consumption' => 0,
                            'alkansya_consumption' => 0,
                            'made_to_order_consumption' => 0,
                            'cost' => 0,
                            'product_type' => 'made_to_order'
                        ];
                    }
                    
                    $consumptionDataArray[$key]['total_consumption'] += $consumption['quantity'];
                    $consumptionDataArray[$key]['made_to_order_consumption'] += $consumption['quantity'];
                    $consumptionDataArray[$key]['cost'] += $consumption['cost'];
                }
            }
            
            $consumptionData = collect($consumptionDataArray);

            \Log::info('Combined consumption data:', ['count' => $consumptionData->count(), 'data' => $consumptionData->toArray()]);

            // Group by date for chart data
            $chartData = $consumptionData->groupBy('date')->map(function($dayData, $date) {
                return [
                    'date' => $date,
                    'total_consumption' => $dayData->sum('total_consumption'),
                    'alkansya_consumption' => $dayData->sum('alkansya_consumption'),
                    'made_to_order_consumption' => $dayData->sum('made_to_order_consumption'),
                    'total_cost' => $dayData->sum('cost'),
                    'materials_count' => $dayData->count()
                ];
            })->sortBy('date')->values()->toArray();

            \Log::info('Chart data:', ['count' => count($chartData), 'data' => $chartData]);

            // Calculate summary statistics
            $chartDataCollection = collect($chartData);
            $summary = [
                'total_consumption' => $consumptionData->sum('total_consumption'),
                'alkansya_consumption' => $consumptionData->sum('alkansya_consumption'),
                'made_to_order_consumption' => $consumptionData->sum('made_to_order_consumption'),
                'total_cost' => $consumptionData->sum('cost'),
                'average_daily_consumption' => $chartDataCollection->avg('total_consumption'),
                'peak_consumption_day' => $chartDataCollection->sortByDesc('total_consumption')->first(),
                'materials_consumed' => $consumptionData->groupBy('material_id')->count(),
                'product_type_filter' => $productType
            ];

            // Get top consumed materials with trend analysis
            $topMaterials = [];
            $groupedData = $consumptionData->groupBy('material_id');
            
            foreach ($groupedData as $materialId => $materialData) {
                $firstItem = $materialData->first();
                $totalConsumption = $materialData->sum('total_consumption');
                $consumptionDays = $materialData->count();
                $avgDailyUsage = $consumptionDays > 0 ? $totalConsumption / $consumptionDays : 0;
                
                $topMaterials[] = [
                    'material_id' => $materialId,
                    'material_name' => $firstItem['material_name'],
                    'total_consumption' => $totalConsumption,
                    'alkansya_consumption' => $materialData->sum('alkansya_consumption'),
                    'made_to_order_consumption' => $materialData->sum('made_to_order_consumption'),
                    'total_cost' => $materialData->sum('cost'),
                    'consumption_days' => $consumptionDays,
                    'avg_daily_usage' => round($avgDailyUsage, 2),
                    'trend' => 0, // Simplified for now
                    'days_until_stockout' => 999 // Simplified for now
                ];
            }
            
            // Sort by total consumption and take top 20
            usort($topMaterials, function($a, $b) {
                return $b['total_consumption'] <=> $a['total_consumption'];
            });
            $topMaterials = array_slice($topMaterials, 0, 20);

            // Calculate trends for each material
            $trends = collect($topMaterials)->mapWithKeys(function($material) {
                return [$material['material_id'] => $material];
            })->toArray();

            // If no data, generate sample data for demonstration
            if ($consumptionData->isEmpty()) {
                \Log::info('No consumption data found, generating sample data');
                
                // Generate sample chart data for the last 7 days
                $sampleChartData = [];
                for ($i = 6; $i >= 0; $i--) {
                    $date = Carbon::now()->subDays($i)->format('Y-m-d');
                    $sampleChartData[] = [
                        'date' => $date,
                        'total_consumption' => rand(50, 150),
                        'alkansya_consumption' => rand(20, 80),
                        'made_to_order_consumption' => rand(30, 70),
                        'total_cost' => rand(1000, 5000),
                        'materials_count' => rand(5, 15)
                    ];
                }
                
                // Generate sample materials
                $sampleMaterials = [
                    [
                        'material_id' => 1,
                        'material_name' => 'Plywood 18mm',
                        'total_consumption' => 45,
                        'alkansya_consumption' => 25,
                        'made_to_order_consumption' => 20,
                        'total_cost' => 2250,
                        'consumption_days' => 5,
                        'avg_daily_usage' => 9.0,
                        'trend' => 0.5,
                        'days_until_stockout' => 15
                    ],
                    [
                        'material_id' => 2,
                        'material_name' => 'Hardwood Mahogany 2x2',
                        'total_consumption' => 38,
                        'alkansya_consumption' => 20,
                        'made_to_order_consumption' => 18,
                        'total_cost' => 1900,
                        'consumption_days' => 4,
                        'avg_daily_usage' => 9.5,
                        'trend' => -0.2,
                        'days_until_stockout' => 22
                    ],
                    [
                        'material_id' => 3,
                        'material_name' => 'Wood Screws 3"',
                        'total_consumption' => 120,
                        'alkansya_consumption' => 60,
                        'made_to_order_consumption' => 60,
                        'total_cost' => 600,
                        'consumption_days' => 6,
                        'avg_daily_usage' => 20.0,
                        'trend' => 1.2,
                        'days_until_stockout' => 8
                    ]
                ];
                
                return response()->json([
                    'chart_data' => $sampleChartData,
                    'summary' => [
                        'total_consumption' => 203,
                        'alkansya_consumption' => 105,
                        'made_to_order_consumption' => 98,
                        'total_cost' => 4750,
                        'average_daily_consumption' => 29.0,
                        'peak_consumption_day' => $sampleChartData[6],
                        'materials_consumed' => 3,
                        'product_type_filter' => $productType
                    ],
                    'top_materials' => $sampleMaterials,
                    'trends' => collect($sampleMaterials)->mapWithKeys(function($material) {
                        return [$material['material_id'] => $material];
                    }),
                    'period' => [
                        'start_date' => $startDate->format('Y-m-d'),
                        'end_date' => $endDate->format('Y-m-d'),
                        'days' => $days
                    ],
                    'is_sample_data' => true
                ]);
            }

            return response()->json([
                'chart_data' => $chartData,
                'summary' => $summary,
                'top_materials' => $topMaterials,
                'trends' => $trends,
                'period' => [
                    'start_date' => $startDate->format('Y-m-d'),
                    'end_date' => $endDate->format('Y-m-d'),
                    'days' => $days
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching consumption trends: ' . $e->getMessage());
            return response()->json([
                'chart_data' => [],
                'summary' => [
                    'total_consumption' => 0,
                    'alkansya_consumption' => 0,
                    'made_to_order_consumption' => 0,
                    'total_cost' => 0,
                    'average_daily_consumption' => 0,
                    'peak_consumption_day' => null,
                    'materials_consumed' => 0,
                    'product_type_filter' => $productType ?? 'all'
                ],
                'top_materials' => [],
                'trends' => [],
                'period' => [
                    'start_date' => $startDate->format('Y-m-d') ?? Carbon::now()->subDays(30)->format('Y-m-d'),
                    'end_date' => $endDate->format('Y-m-d') ?? Carbon::now()->format('Y-m-d'),
                    'days' => $days ?? 30
                ]
            ]);
        }
    }

    /**
     * Get Alkansya consumption from daily output data
     */
    private function getAlkansyaConsumption($startDate, $endDate)
    {
        $consumption = collect();

        // Get Alkansya daily output records
        $dailyOutputs = \App\Models\AlkansyaDailyOutput::whereBetween('date', [$startDate, $endDate])
            ->get();

        foreach ($dailyOutputs as $output) {
            $materialsUsed = $output->materials_used ?? [];
            
            foreach ($materialsUsed as $materialUsage) {
                $consumption->push([
                    'date' => $output->date->format('Y-m-d'),
                    'material_id' => $materialUsage['material_id'] ?? null,
                    'material_name' => $materialUsage['material_name'] ?? 'Unknown',
                    'quantity' => $materialUsage['quantity_used'] ?? 0,
                    'cost' => $materialUsage['total_cost'] ?? 0,
                    'output_id' => $output->id,
                    'quantity_produced' => $output->quantity_produced
                ]);
            }
        }

        return $consumption;
    }

    /**
     * Get Made-to-Order consumption from accepted orders
     */
    private function getMadeToOrderConsumption($startDate, $endDate)
    {
        $consumption = collect();

        // Get accepted orders in the date range
        $orders = \App\Models\Order::with(['items.product'])
            ->where('acceptance_status', 'accepted')
            ->whereBetween('created_at', [$startDate, $endDate])
            ->get();

        foreach ($orders as $order) {
            foreach ($order->items as $orderItem) {
                // Skip Alkansya products (they're handled separately)
                if ($orderItem->product && 
                    ($orderItem->product->category_name === 'Stocked Products' || 
                     str_contains(strtolower($orderItem->product->name), 'alkansya'))) {
                    continue;
                }

                // Get BOM for this product
                $bomItems = \App\Models\BOM::where('product_id', $orderItem->product_id)
                    ->with('material')
                    ->get();

                foreach ($bomItems as $bomItem) {
                    $consumedQuantity = $bomItem->quantity_per_product * $orderItem->quantity;
                    $cost = $consumedQuantity * ($bomItem->material->standard_cost ?? 0);

                    $consumption->push([
                        'date' => $order->created_at->format('Y-m-d'),
                        'material_id' => $bomItem->material_id,
                        'material_name' => $bomItem->material->material_name,
                        'quantity' => $consumedQuantity,
                        'cost' => $cost,
                        'order_id' => $order->id,
                        'product_name' => $orderItem->product->name ?? 'Unknown'
                    ]);
                }
            }
        }

        return $consumption;
    }

    /**
     * Calculate trend using simple linear regression
     */
    private function calculateTrend($data)
    {
        if (count($data) < 2) return 0;

        $n = count($data);
        $xSum = 0;
        $ySum = 0;
        $xySum = 0;
        $x2Sum = 0;

        foreach ($data as $index => $item) {
            $x = $index; // Day number
            $y = $item['total_consumption'];
            
            $xSum += $x;
            $ySum += $y;
            $xySum += $x * $y;
            $x2Sum += $x * $x;
        }

        $slope = ($n * $xySum - $xSum * $ySum) / ($n * $x2Sum - $xSum * $xSum);
        
        return round($slope, 4);
    }

    /**
     * Calculate days until stockout based on current stock and average daily usage
     */
    private function calculateDaysUntilStockout($materialId, $avgDailyUsage)
    {
        if ($avgDailyUsage <= 0) return 999;

        // Get current stock from normalized inventory
        $inventory = \App\Models\Inventory::where('material_id', $materialId)->first();
        
        if (!$inventory || $inventory->quantity_on_hand <= 0) {
            return 0;
        }

        $daysUntilStockout = floor($inventory->quantity_on_hand / $avgDailyUsage);
        
        return min($daysUntilStockout, 999); // Cap at 999 days
    }

    /**
     * Get order-based material consumption (legacy method)
     */
    private function getOrderBasedConsumption($startDate, $endDate)
    {
        return $this->getMadeToOrderConsumption($startDate, $endDate);
    }
    public function getForecastData(Request $request)
    {
        try {
            $forecastDays = $request->get('forecast_days', 30);
            $historicalDays = $request->get('historical_days', 30);
            
            // Get historical consumption data
            $transactions = InventoryTransaction::where('transaction_type', 'CONSUMPTION')
                ->where('created_at', '>=', Carbon::now()->subDays($historicalDays))
                ->with('material')
                ->get();
            
            // Group by material and calculate daily usage
            $dailyUsage = $transactions->groupBy('material_id')->map(function($materialTransactions) {
                $material = $materialTransactions->first()->material;
                $totalUsage = $materialTransactions->sum('quantity');
                $days = $materialTransactions->groupBy(function($item) {
                    return Carbon::parse($item->created_at)->format('Y-m-d');
                })->count();
                
                return [
                    'material_id' => $material->material_id,
                    'material_name' => $material->material_name,
                    'average_daily_usage' => $days > 0 ? $totalUsage / $days : 0,
                    'total_usage' => $totalUsage,
                    'days_analyzed' => $days
                ];
            });
            
            // Generate forecast data
            $forecast = [];
            for ($i = 1; $i <= $forecastDays; $i++) {
                $date = Carbon::now()->addDays($i)->format('Y-m-d');
                $predictedUsage = $dailyUsage->sum('average_daily_usage');
                
                $forecast[] = [
                    'date' => $date,
                    'predicted' => round($predictedUsage, 2),
                    'actual' => null // Will be filled when actual data is available
                ];
            }
            
            // Calculate accuracy (simplified)
            $accuracy = 85; // Placeholder accuracy
            
            return response()->json([
                'forecast' => $forecast,
                'accuracy' => $accuracy,
                'materials_analyzed' => $dailyUsage->count(),
                'period' => [
                    'forecast_days' => $forecastDays,
                    'historical_days' => $historicalDays
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching forecast data: ' . $e->getMessage());
            return response()->json([
                'forecast' => [],
                'accuracy' => 0,
                'materials_analyzed' => 0,
                'period' => [
                    'forecast_days' => $forecastDays ?? 30,
                    'historical_days' => $historicalDays ?? 30
                ]
            ]);
        }
    }

    /**
     * Get replenishment schedule
     */
    public function getReplenishmentSchedule()
    {
        try {
            $materials = Material::with('inventory')->get();
            
            $replenishmentItems = $materials->map(function($material) {
                $totalStock = $material->inventory->sum('current_stock');
                $reorderPoint = $material->reorder_point ?? 10;
                $suggestedOrder = max(0, ($reorderPoint * 2) - $totalStock);
                
                // Determine urgency
                $urgency = 'low';
                if ($totalStock <= 0) {
                    $urgency = 'critical';
                } elseif ($totalStock <= $reorderPoint) {
                    $urgency = 'high';
                } elseif ($totalStock <= $reorderPoint * 1.5) {
                    $urgency = 'medium';
                }
                
                return [
                    'material' => $material->material_name,
                    'current_stock' => $totalStock,
                    'reorder_point' => $reorderPoint,
                    'suggested_order' => $suggestedOrder,
                    'urgency' => $urgency,
                    'unit_cost' => $material->unit_cost ?? 100,
                    'total_cost' => $suggestedOrder * ($material->unit_cost ?? 100)
                ];
            })->filter(function($item) {
                return $item['suggested_order'] > 0; // Only show items that need replenishment
            })->sortByDesc('urgency');

            return response()->json([
                'items' => $replenishmentItems->values(),
                'summary' => [
                    'total_items' => $replenishmentItems->count(),
                    'critical_items' => $replenishmentItems->where('urgency', 'critical')->count(),
                    'high_priority_items' => $replenishmentItems->where('urgency', 'high')->count(),
                    'total_estimated_cost' => $replenishmentItems->sum('total_cost')
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching replenishment schedule: ' . $e->getMessage());
            return response()->json([
                'items' => [],
                'summary' => [
                    'total_items' => 0,
                    'critical_items' => 0,
                    'high_priority_items' => 0,
                    'total_estimated_cost' => 0
                ]
            ]);
        }
    }

    /**
     * Get made-to-order products status
     */
    public function getMadeToOrderStatus(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

            // Get made-to-order products that are in progress
            $inProgressOrders = Order::with(['items.product', 'user'])
                ->where('acceptance_status', 'accepted')
                ->whereIn('status', ['processing', 'pending'])
                ->whereHas('items.product', function($query) {
                    $query->where('category_name', 'Made to Order')
                          ->orWhere('category_name', 'made_to_order');
                })
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();

            $inProgressData = $inProgressOrders->map(function($order) {
                $madeToOrderItems = $order->items->filter(function($item) {
                    return in_array($item->product->category_name, ['Made to Order', 'made_to_order']);
                });

                return $madeToOrderItems->map(function($item) use ($order) {
                    // Get production progress
                    $production = Production::where('order_id', $order->id)
                        ->where('product_id', $item->product_id)
                        ->first();

                    $progress = 0;
                    $currentStage = 'Pending';
                    $estimatedCompletion = null;

                    if ($production) {
                        $progress = $production->overall_progress ?? 0;
                        $currentStage = $production->current_stage ?? 'Pending';
                        $estimatedCompletion = $production->estimated_completion_date;
                    }

                    // Get materials consumed for this product
                    $materialsConsumed = $this->getMaterialsConsumedForProduct($item->product_id, $order->id);

                    return [
                        'order_id' => $order->id,
                        'product_name' => $item->product->name,
                        'customer_name' => $order->user->name ?? 'Unknown',
                        'start_date' => $order->created_at->format('Y-m-d'),
                        'estimated_completion' => $estimatedCompletion ? Carbon::parse($estimatedCompletion)->format('Y-m-d') : null,
                        'progress' => $progress,
                        'materials_consumed' => $materialsConsumed,
                        'status' => $order->status,
                        'quantity' => $item->quantity
                    ];
                });
            })->flatten();

            // Get completed orders today
            $completedToday = Order::where('status', 'completed')
                ->whereHas('items.product', function($query) {
                    $query->where('category_name', 'Made to Order')
                          ->orWhere('category_name', 'made_to_order');
                })
                ->whereDate('updated_at', Carbon::today())
                ->count();

            // Calculate average completion time
            $completedOrders = Order::where('status', 'completed')
                ->whereHas('items.product', function($query) {
                    $query->where('category_name', 'Made to Order')
                          ->orWhere('category_name', 'made_to_order');
                })
                ->whereBetween('updated_at', [Carbon::now()->subDays(30), Carbon::now()])
                ->get();

            $averageCompletionTime = 0;
            if ($completedOrders->count() > 0) {
                $totalDays = $completedOrders->sum(function($order) {
                    return Carbon::parse($order->created_at)->diffInDays(Carbon::parse($order->updated_at));
                });
                $averageCompletionTime = round($totalDays / $completedOrders->count(), 1);
            }

            return response()->json([
                'in_progress' => $inProgressData,
                'completed_today' => $completedToday,
                'total_in_progress' => $inProgressData->count(),
                'average_completion_time' => $averageCompletionTime,
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching made-to-order status: ' . $e->getMessage());
            return response()->json([
                'in_progress' => [],
                'completed_today' => 0,
                'total_in_progress' => 0,
                'average_completion_time' => 0,
                'period' => [
                    'start_date' => $startDate ?? Carbon::now()->subDays(30)->format('Y-m-d'),
                    'end_date' => $endDate ?? Carbon::now()->format('Y-m-d')
                ]
            ]);
        }
    }

    /**
     * Get manual inventory activities
     */
    public function getManualActivities(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

            // Get manual inventory transactions
            $transactions = InventoryTransaction::with(['material'])
                ->whereIn('transaction_type', ['MANUAL_ADJUSTMENT', 'STOCK_TRANSFER', 'QUALITY_CHECK'])
                ->whereBetween('created_at', [$startDate, $endDate])
                ->orderBy('created_at', 'desc')
                ->get();

            $activities = $transactions->map(function($transaction) {
                return [
                    'id' => $transaction->id,
                    'type' => strtolower($transaction->transaction_type),
                    'material' => $transaction->material->material_name ?? 'Unknown',
                    'quantity' => $transaction->quantity,
                    'reason' => $transaction->notes ?? 'No reason provided',
                    'user' => $transaction->created_by ?? 'System',
                    'timestamp' => $transaction->created_at->toISOString(),
                    'before_stock' => $transaction->quantity_before ?? 0,
                    'after_stock' => $transaction->quantity_after ?? 0,
                    'reference' => $transaction->reference_number
                ];
            });

            // Get summary statistics
            $summary = [
                'total_activities' => $activities->count(),
                'adjustments' => $activities->where('type', 'manual_adjustment')->count(),
                'transfers' => $activities->where('type', 'stock_transfer')->count(),
                'quality_checks' => $activities->where('type', 'quality_check')->count()
            ];

            return response()->json([
                'activities' => $activities,
                'summary' => $summary,
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching manual activities: ' . $e->getMessage());
            return response()->json([
                'activities' => [],
                'summary' => [
                    'total_activities' => 0,
                    'adjustments' => 0,
                    'transfers' => 0,
                    'quality_checks' => 0
                ],
                'period' => [
                    'start_date' => $startDate ?? Carbon::now()->subDays(30)->format('Y-m-d'),
                    'end_date' => $endDate ?? Carbon::now()->format('Y-m-d')
                ]
            ]);
        }
    }

    /**
     * Get inventory transactions
     */
    public function getInventoryTransactions(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

            $transactions = InventoryTransaction::with(['material'])
                ->whereBetween('created_at', [$startDate, $endDate])
                ->orderBy('created_at', 'desc')
                ->get();

            $transactionData = $transactions->map(function($transaction) {
                return [
                    'id' => $transaction->transaction_id,
                    'type' => $transaction->transaction_type,
                    'material' => $transaction->material->material_name ?? 'Unknown',
                    'quantity' => $transaction->quantity,
                    'unit_cost' => $transaction->unit_cost,
                    'total_cost' => $transaction->total_cost,
                    'supplier' => $transaction->supplier_name,
                    'timestamp' => $transaction->created_at->toISOString(),
                    'reference' => $transaction->reference_number,
                    'reason' => $transaction->notes
                ];
            });

            // Calculate summary
            $summary = [
                'total_transactions' => $transactionData->count(),
                'total_value' => $transactionData->sum('total_cost'),
                'purchase_value' => $transactionData->where('type', 'PURCHASE')->sum('total_cost'),
                'consumption_value' => abs($transactionData->where('type', 'CONSUMPTION')->sum('total_cost')),
                'production_output_value' => $transactionData->where('type', 'PRODUCTION_OUTPUT')->sum('total_cost')
            ];

            return response()->json([
                'transactions' => $transactionData,
                'summary' => $summary,
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching inventory transactions: ' . $e->getMessage());
            return response()->json([
                'transactions' => [],
                'summary' => [
                    'total_transactions' => 0,
                    'total_value' => 0,
                    'purchase_value' => 0,
                    'consumption_value' => 0
                ],
                'period' => [
                    'start_date' => $startDate ?? Carbon::now()->subDays(30)->format('Y-m-d'),
                    'end_date' => $endDate ?? Carbon::now()->format('Y-m-d')
                ]
            ]);
        }
    }

    /**
     * Get real-time alerts
     */
    public function getAlerts()
    {
        try {
            $alerts = [];

            // Check for low stock items
            $lowStockItems = Material::with('inventory')
                ->get()
                ->filter(function($material) {
                    $totalStock = $material->inventory->sum('current_stock');
                    return $totalStock > 0 && $totalStock <= ($material->reorder_point ?? 10);
                });

            foreach ($lowStockItems as $material) {
                $totalStock = $material->inventory->sum('current_stock');
                $alerts[] = [
                    'id' => 'low_stock_' . $material->material_id,
                    'type' => 'low_stock',
                    'severity' => $totalStock == 0 ? 'critical' : 'high',
                    'material' => $material->material_name,
                    'current_stock' => $totalStock,
                    'reorder_point' => $material->reorder_point ?? 10,
                    'message' => $totalStock == 0 
                        ? "URGENT: {$material->material_name} is out of stock"
                        : "Critical: {$material->material_name} is below reorder point",
                    'timestamp' => now()->toISOString()
                ];
            }

            // Check for out of stock items
            $outOfStockItems = Material::with('inventory')
                ->get()
                ->filter(function($material) {
                    return $material->inventory->sum('current_stock') == 0;
                });

            foreach ($outOfStockItems as $material) {
                $alerts[] = [
                    'id' => 'out_of_stock_' . $material->material_id,
                    'type' => 'out_of_stock',
                    'severity' => 'critical',
                    'material' => $material->material_name,
                    'current_stock' => 0,
                    'reorder_point' => $material->reorder_point ?? 10,
                    'message' => "URGENT: {$material->material_name} is out of stock",
                    'timestamp' => now()->toISOString()
                ];
            }

            // Remove duplicates and sort by severity
            $alerts = collect($alerts)->unique('id')->sortByDesc(function($alert) {
                return $alert['severity'] === 'critical' ? 3 : ($alert['severity'] === 'high' ? 2 : 1);
            })->values();

            $summary = [
                'total_alerts' => $alerts->count(),
                'critical' => $alerts->where('severity', 'critical')->count(),
                'high' => $alerts->where('severity', 'high')->count(),
                'medium' => $alerts->where('severity', 'medium')->count()
            ];

            return response()->json([
                'alerts' => $alerts,
                'summary' => $summary,
                'generated_at' => now()->toISOString()
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching alerts: ' . $e->getMessage());
            return response()->json([
                'alerts' => [],
                'summary' => [
                    'total_alerts' => 0,
                    'critical' => 0,
                    'high' => 0,
                    'medium' => 0
                ],
                'generated_at' => now()->toISOString()
            ]);
        }
    }

    /**
     * Get production analytics
     */
    public function getProductionAnalytics(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

            // Get in-progress productions
            $inProgressProductions = Production::with(['order.items.product'])
                ->whereIn('status', ['In Progress', 'Pending'])
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();

            $inProgressData = $inProgressProductions->map(function($production) {
                $product = $production->order->items->first()?->product;
                return [
                    'production_id' => $production->id,
                    'product' => $product->name ?? 'Unknown',
                    'order_id' => $production->order_id,
                    'progress' => $production->overall_progress ?? 0,
                    'current_stage' => $production->current_stage ?? 'Pending',
                    'estimated_completion' => $production->estimated_completion_date,
                    'materials_used' => $this->getMaterialsUsedForProduction($production->id),
                    'materials_remaining' => $this->getMaterialsRemainingForProduction($production->id)
                ];
            });

            // Get completed productions today
            $completedToday = Production::where('status', 'Completed')
                ->whereDate('actual_completion_date', Carbon::today())
                ->count();

            // Calculate efficiency
            $totalProductions = Production::whereBetween('created_at', [$startDate, $endDate])->count();
            $completedProductions = Production::where('status', 'Completed')
                ->whereBetween('actual_completion_date', [$startDate, $endDate])
                ->count();

            $efficiency = $totalProductions > 0 ? round(($completedProductions / $totalProductions) * 100, 1) : 0;

            // Calculate average cycle time
            $completedProductionsWithTime = Production::where('status', 'Completed')
                ->whereBetween('actual_completion_date', [$startDate, $endDate])
                ->whereNotNull('actual_completion_date')
                ->whereNotNull('created_at')
                ->get();

            $averageCycleTime = 0;
            if ($completedProductionsWithTime->count() > 0) {
                $totalDays = $completedProductionsWithTime->sum(function($production) {
                    return Carbon::parse($production->created_at)->diffInDays(Carbon::parse($production->actual_completion_date));
                });
                $averageCycleTime = round($totalDays / $completedProductionsWithTime->count(), 1);
            }

            return response()->json([
                'in_progress' => $inProgressData,
                'completed_today' => $completedToday,
                'efficiency' => $efficiency,
                'average_cycle_time' => $averageCycleTime,
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching production analytics: ' . $e->getMessage());
            return response()->json([
                'in_progress' => [],
                'completed_today' => 0,
                'efficiency' => 0,
                'average_cycle_time' => 0,
                'period' => [
                    'start_date' => $startDate ?? Carbon::now()->subDays(30)->format('Y-m-d'),
                    'end_date' => $endDate ?? Carbon::now()->format('Y-m-d')
                ]
            ]);
        }
    }

    /**
     * Helper method to get materials consumed for a product
     */
    private function getMaterialsConsumedForProduct($productId, $orderId)
    {
        $bomItems = BOM::where('product_id', $productId)->with('material')->get();
        
        return $bomItems->map(function($bomItem) use ($orderId) {
            // Get consumption transactions for this material and order
            $consumption = InventoryTransaction::where('material_id', $bomItem->material_id)
                ->where('transaction_type', 'CONSUMPTION')
                ->where('reference_number', 'like', "%ORD-{$orderId}%")
                ->first();

            return [
                'material' => $bomItem->material->material_name,
                'quantity' => abs($consumption->quantity ?? 0),
                'cost' => abs($consumption->total_cost ?? 0)
            ];
        })->filter(function($item) {
            return $item['quantity'] > 0;
        });
    }

    /**
     * Helper method to get materials used for production
     */
    private function getMaterialsUsedForProduction($productionId)
    {
        // This would need to be implemented based on your production tracking system
        return 0; // Placeholder
    }

    /**
     * Get production output data
     */
    public function getProductionOutput(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

            // Get Alkansya daily output
            $alkansyaOutput = AlkansyaDailyOutput::whereBetween('date', [$startDate, $endDate])
                ->orderBy('date', 'desc')
                ->get();

            // Get production records
            $productions = Production::whereBetween('created_at', [$startDate, $endDate])
                ->with(['order.items.product'])
                ->get();

            // Generate daily output data
            $dailyData = [];
            $currentDate = Carbon::parse($startDate);
            $endDateCarbon = Carbon::parse($endDate);

            while ($currentDate->lte($endDateCarbon)) {
                $dateStr = $currentDate->format('Y-m-d');
                
                $alkansyaForDate = $alkansyaOutput->where('date', $dateStr)->sum('quantity_produced');
                $productionsForDate = $productions->filter(function($production) use ($dateStr) {
                    return Carbon::parse($production->created_at)->format('Y-m-d') === $dateStr;
                });

                $dailyData[] = [
                    'date' => $dateStr,
                    'alkansya_output' => $alkansyaForDate,
                    'made_to_order_output' => $productionsForDate->count(),
                    'total_output' => $alkansyaForDate + $productionsForDate->count(),
                    'target' => 30, // Daily target
                    'efficiency' => $alkansyaForDate > 0 ? round(($alkansyaForDate / 30) * 100, 1) : 0
                ];

                $currentDate->addDay();
            }

            $summary = [
                'total_output' => collect($dailyData)->sum('total_output'),
                'alkansya_total' => collect($dailyData)->sum('alkansya_output'),
                'made_to_order_total' => collect($dailyData)->sum('made_to_order_output'),
                'average_daily' => collect($dailyData)->avg('total_output'),
                'peak_output' => collect($dailyData)->max('total_output'),
                'average_efficiency' => collect($dailyData)->avg('efficiency')
            ];

            return response()->json([
                'output_data' => $dailyData,
                'summary' => $summary,
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching production output: ' . $e->getMessage());
            return response()->json([
                'output_data' => [],
                'summary' => [
                    'total_output' => 0,
                    'alkansya_total' => 0,
                    'made_to_order_total' => 0,
                    'average_daily' => 0,
                    'peak_output' => 0,
                    'average_efficiency' => 0
                ],
                'period' => [
                    'start_date' => $startDate ?? Carbon::now()->subDays(30)->format('Y-m-d'),
                    'end_date' => $endDate ?? Carbon::now()->format('Y-m-d')
                ]
            ]);
        }
    }

    /**
     * Get efficiency metrics
     */
    public function getEfficiencyMetrics(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

            // Calculate efficiency metrics
            $alkansyaOutput = AlkansyaDailyOutput::whereBetween('date', [$startDate, $endDate])->get();
            $productions = Production::whereBetween('created_at', [$startDate, $endDate])->get();

            $totalDays = Carbon::parse($startDate)->diffInDays(Carbon::parse($endDate)) + 1;
            $totalAlkansyaOutput = $alkansyaOutput->sum('quantity_produced');
            $totalProductions = $productions->count();

            $metrics = [
                'overall_efficiency' => $totalDays > 0 ? round(($totalAlkansyaOutput / ($totalDays * 30)) * 100, 1) : 0,
                'alkansya_efficiency' => $totalDays > 0 ? round(($totalAlkansyaOutput / ($totalDays * 30)) * 100, 1) : 0,
                'production_efficiency' => $totalDays > 0 ? round(($totalProductions / ($totalDays * 5)) * 100, 1) : 0,
                'average_daily_output' => $totalDays > 0 ? round($totalAlkansyaOutput / $totalDays, 1) : 0,
                'target_achievement' => $totalDays > 0 ? round(($totalAlkansyaOutput / ($totalDays * 30)) * 100, 1) : 0,
                'consistency_score' => $this->calculateConsistencyScore($alkansyaOutput)
            ];

            return response()->json([
                'metrics' => $metrics,
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'total_days' => $totalDays
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching efficiency metrics: ' . $e->getMessage());
            return response()->json([
                'metrics' => [
                    'overall_efficiency' => 0,
                    'alkansya_efficiency' => 0,
                    'production_efficiency' => 0,
                    'average_daily_output' => 0,
                    'target_achievement' => 0,
                    'consistency_score' => 0
                ],
                'period' => [
                    'start_date' => $startDate ?? Carbon::now()->subDays(30)->format('Y-m-d'),
                    'end_date' => $endDate ?? Carbon::now()->format('Y-m-d'),
                    'total_days' => 0
                ]
            ]);
        }
    }

    /**
     * Get resource utilization data
     */
    public function getResourceUtilization(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

            // Calculate resource utilization
            $utilization = [
                'materials_utilization' => [
                    'total_materials' => Material::count(),
                    'active_materials' => Material::whereHas('inventory', function($query) {
                        $query->where('current_stock', '>', 0);
                    })->count(),
                    'utilization_rate' => Material::count() > 0 ? round((Material::whereHas('inventory', function($query) {
                        $query->where('current_stock', '>', 0);
                    })->count() / Material::count()) * 100, 1) : 0
                ],
                'production_capacity' => [
                    'total_capacity' => 30, // Daily target
                    'utilized_capacity' => AlkansyaDailyOutput::whereBetween('date', [$startDate, $endDate])->avg('quantity_produced') ?? 0,
                    'capacity_utilization' => 30 > 0 ? round(((AlkansyaDailyOutput::whereBetween('date', [$startDate, $endDate])->avg('quantity_produced') ?? 0) / 30) * 100, 1) : 0
                ],
                'workforce_utilization' => [
                    'total_workers' => 10, // Placeholder
                    'active_workers' => 8, // Placeholder
                    'utilization_rate' => 80.0
                ]
            ];

            return response()->json([
                'utilization' => $utilization,
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching resource utilization: ' . $e->getMessage());
            return response()->json([
                'utilization' => [
                    'materials_utilization' => ['total_materials' => 0, 'active_materials' => 0, 'utilization_rate' => 0],
                    'production_capacity' => ['total_capacity' => 0, 'utilized_capacity' => 0, 'capacity_utilization' => 0],
                    'workforce_utilization' => ['total_workers' => 0, 'active_workers' => 0, 'utilization_rate' => 0]
                ],
                'period' => [
                    'start_date' => $startDate ?? Carbon::now()->subDays(30)->format('Y-m-d'),
                    'end_date' => $endDate ?? Carbon::now()->format('Y-m-d')
                ]
            ]);
        }
    }

    /**
     * Get production stage breakdown
     */
    public function getStageBreakdown(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

            // Get production stages data
            $stages = [
                [
                    'stage_name' => 'Planning',
                    'total_productions' => Production::whereBetween('created_at', [$startDate, $endDate])->count(),
                    'completed' => Production::whereBetween('created_at', [$startDate, $endDate])->where('current_stage', '!=', 'Planning')->count(),
                    'in_progress' => Production::whereBetween('created_at', [$startDate, $endDate])->where('current_stage', 'Planning')->count(),
                    'average_duration' => 1.5
                ],
                [
                    'stage_name' => 'Material Preparation',
                    'total_productions' => Production::whereBetween('created_at', [$startDate, $endDate])->count(),
                    'completed' => Production::whereBetween('created_at', [$startDate, $endDate])->whereIn('current_stage', ['Production', 'Quality Check', 'Completed'])->count(),
                    'in_progress' => Production::whereBetween('created_at', [$startDate, $endDate])->where('current_stage', 'Material Preparation')->count(),
                    'average_duration' => 2.0
                ],
                [
                    'stage_name' => 'Production',
                    'total_productions' => Production::whereBetween('created_at', [$startDate, $endDate])->count(),
                    'completed' => Production::whereBetween('created_at', [$startDate, $endDate])->whereIn('current_stage', ['Quality Check', 'Completed'])->count(),
                    'in_progress' => Production::whereBetween('created_at', [$startDate, $endDate])->where('current_stage', 'Production')->count(),
                    'average_duration' => 3.5
                ],
                [
                    'stage_name' => 'Quality Check',
                    'total_productions' => Production::whereBetween('created_at', [$startDate, $endDate])->count(),
                    'completed' => Production::whereBetween('created_at', [$startDate, $endDate])->where('current_stage', 'Completed')->count(),
                    'in_progress' => Production::whereBetween('created_at', [$startDate, $endDate])->where('current_stage', 'Quality Check')->count(),
                    'average_duration' => 1.0
                ],
                [
                    'stage_name' => 'Completed',
                    'total_productions' => Production::whereBetween('created_at', [$startDate, $endDate])->count(),
                    'completed' => Production::whereBetween('created_at', [$startDate, $endDate])->where('current_stage', 'Completed')->count(),
                    'in_progress' => 0,
                    'average_duration' => 0
                ]
            ];

            return response()->json([
                'stages' => $stages,
                'summary' => [
                    'total_stages' => count($stages),
                    'total_productions' => Production::whereBetween('created_at', [$startDate, $endDate])->count(),
                    'completed_productions' => Production::whereBetween('created_at', [$startDate, $endDate])->where('current_stage', 'Completed')->count(),
                    'average_cycle_time' => array_sum(array_column($stages, 'average_duration'))
                ],
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching stage breakdown: ' . $e->getMessage());
            return response()->json([
                'stages' => [],
                'summary' => [
                    'total_stages' => 0,
                    'total_productions' => 0,
                    'completed_productions' => 0,
                    'average_cycle_time' => 0
                ],
                'period' => [
                    'start_date' => $startDate ?? Carbon::now()->subDays(30)->format('Y-m-d'),
                    'end_date' => $endDate ?? Carbon::now()->format('Y-m-d')
                ]
            ]);
        }
    }

    /**
     * Calculate consistency score for Alkansya output
     */
    private function calculateConsistencyScore($alkansyaOutput)
    {
        if ($alkansyaOutput->count() < 2) return 0;
        
        $outputs = $alkansyaOutput->pluck('quantity_produced')->toArray();
        $mean = array_sum($outputs) / count($outputs);
        $variance = array_sum(array_map(function($x) use ($mean) { return pow($x - $mean, 2); }, $outputs)) / count($outputs);
        $stdDev = sqrt($variance);
        
        // Consistency score: higher score for lower standard deviation
        return $mean > 0 ? round(max(0, 100 - ($stdDev / $mean) * 100), 1) : 0;
    }

    /**
     * Get sales dashboard data
     */
    public function getSalesDashboard(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

            // Get orders data
            $orders = Order::whereBetween('created_at', [$startDate, $endDate])->get();
            $totalOrders = $orders->count();
            $paidOrders = $orders->where('payment_status', 'paid')->count();
            $pendingOrders = $orders->where('payment_status', 'pending')->count();
            $totalRevenue = $orders->where('payment_status', 'paid')->sum('total_price');
            $averageOrderValue = $paidOrders > 0 ? round($totalRevenue / $paidOrders, 2) : 0;

            // Generate daily revenue trends
            $dailyTrends = [];
            $currentDate = Carbon::parse($startDate);
            $endDateCarbon = Carbon::parse($endDate);

            while ($currentDate->lte($endDateCarbon)) {
                $dateStr = $currentDate->format('Y-m-d');
                $dayOrders = $orders->filter(function($order) use ($dateStr) {
                    return Carbon::parse($order->created_at)->format('Y-m-d') === $dateStr;
                });

                $dailyTrends[] = [
                    'date' => $dateStr,
                    'revenue' => $dayOrders->where('payment_status', 'paid')->sum('total_price'),
                    'orders' => $dayOrders->count()
                ];

                $currentDate->addDay();
            }

            // Get top products
            $topProducts = OrderItem::with(['product'])
                ->whereHas('order', function($query) use ($startDate, $endDate) {
                    $query->whereBetween('created_at', [$startDate, $endDate])
                          ->where('payment_status', 'paid');
                })
                ->get()
                ->groupBy('product_id')
                ->map(function($items, $productId) {
                    $product = $items->first()->product;
                    return [
                        'name' => $product->name ?? 'Unknown',
                        'total_quantity' => $items->sum('quantity'),
                        'total_revenue' => $items->sum(function($item) {
                            return $item->quantity * $item->price;
                        })
                    ];
                })
                ->sortByDesc('total_revenue')
                ->take(5)
                ->values();

            return response()->json([
                'overview' => [
                    'total_revenue' => $totalRevenue,
                    'total_orders' => $totalOrders,
                    'paid_orders' => $paidOrders,
                    'pending_orders' => $pendingOrders,
                    'average_order_value' => $averageOrderValue,
                    'conversion_rate' => $totalOrders > 0 ? round(($paidOrders / $totalOrders) * 100, 1) : 0
                ],
                'revenue_trends' => $dailyTrends,
                'top_products' => $topProducts,
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching sales dashboard: ' . $e->getMessage());
            return response()->json([
                'overview' => [
                    'total_revenue' => 0,
                    'total_orders' => 0,
                    'paid_orders' => 0,
                    'pending_orders' => 0,
                    'average_order_value' => 0,
                    'conversion_rate' => 0
                ],
                'revenue_trends' => [],
                'top_products' => [],
                'period' => [
                    'start_date' => $startDate ?? Carbon::now()->subDays(30)->format('Y-m-d'),
                    'end_date' => $endDate ?? Carbon::now()->format('Y-m-d')
                ]
            ]);
        }
    }

    /**
     * Get revenue analytics
     */
    public function getRevenueAnalytics(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

            $orders = Order::whereBetween('created_at', [$startDate, $endDate])
                ->where('payment_status', 'paid')
                ->get();

            $totalRevenue = $orders->sum('total_price');
            $totalDays = Carbon::parse($startDate)->diffInDays(Carbon::parse($endDate)) + 1;
            $averageDailyRevenue = $totalDays > 0 ? round($totalRevenue / $totalDays, 2) : 0;

            // Calculate growth rate (compare with previous period)
            $previousStartDate = Carbon::parse($startDate)->subDays($totalDays)->format('Y-m-d');
            $previousEndDate = Carbon::parse($startDate)->subDay()->format('Y-m-d');
            $previousRevenue = Order::whereBetween('created_at', [$previousStartDate, $previousEndDate])
                ->where('payment_status', 'paid')
                ->sum('total_price');
            
            $growthRate = $previousRevenue > 0 ? round((($totalRevenue - $previousRevenue) / $previousRevenue) * 100, 1) : 0;

            return response()->json([
                'summary' => [
                    'total_revenue' => $totalRevenue,
                    'average_daily_revenue' => $averageDailyRevenue,
                    'growth_rate' => $growthRate,
                    'total_orders' => $orders->count(),
                    'average_order_value' => $orders->count() > 0 ? round($totalRevenue / $orders->count(), 2) : 0
                ],
                'revenue_data' => $this->generateDailyRevenueData($orders, $startDate, $endDate),
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching revenue analytics: ' . $e->getMessage());
            return response()->json([
                'summary' => [
                    'total_revenue' => 0,
                    'average_daily_revenue' => 0,
                    'growth_rate' => 0,
                    'total_orders' => 0,
                    'average_order_value' => 0
                ],
                'revenue_data' => [],
                'period' => [
                    'start_date' => $startDate ?? Carbon::now()->subDays(30)->format('Y-m-d'),
                    'end_date' => $endDate ?? Carbon::now()->format('Y-m-d')
                ]
            ]);
        }
    }

    /**
     * Get product performance analytics
     */
    public function getProductPerformance(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

            $orderItems = OrderItem::with(['product'])
                ->whereHas('order', function($query) use ($startDate, $endDate) {
                    $query->whereBetween('created_at', [$startDate, $endDate])
                          ->where('payment_status', 'paid');
                })
                ->get();

            $products = $orderItems->groupBy('product_id')->map(function($items, $productId) {
                $product = $items->first()->product;
                $totalQuantity = $items->sum('quantity');
                $totalRevenue = $items->sum(function($item) {
                    return $item->quantity * $item->price;
                });
                
                return [
                    'product_id' => $productId,
                    'product_name' => $product->name ?? 'Unknown',
                    'quantity_sold' => $totalQuantity,
                    'revenue' => $totalRevenue,
                    'profit_margin' => $this->calculateProfitMargin($product, $totalRevenue, $totalQuantity),
                    'average_price' => $totalQuantity > 0 ? round($totalRevenue / $totalQuantity, 2) : 0
                ];
            })->sortByDesc('revenue')->values();

            return response()->json([
                'products' => $products,
                'summary' => [
                    'total_products' => $products->count(),
                    'total_revenue' => $products->sum('revenue'),
                    'total_quantity_sold' => $products->sum('quantity_sold'),
                    'average_profit_margin' => $products->avg('profit_margin')
                ],
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching product performance: ' . $e->getMessage());
            return response()->json([
                'products' => [],
                'summary' => [
                    'total_products' => 0,
                    'total_revenue' => 0,
                    'total_quantity_sold' => 0,
                    'average_profit_margin' => 0
                ],
                'period' => [
                    'start_date' => $startDate ?? Carbon::now()->subDays(30)->format('Y-m-d'),
                    'end_date' => $endDate ?? Carbon::now()->format('Y-m-d')
                ]
            ]);
        }
    }

    /**
     * Get customer analytics
     */
    public function getCustomerAnalytics(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

            $orders = Order::with(['user'])
                ->whereBetween('created_at', [$startDate, $endDate])
                ->where('payment_status', 'paid')
                ->get();

            $customers = $orders->groupBy('user_id')->map(function($userOrders, $userId) {
                $user = $userOrders->first()->user;
                return [
                    'customer_id' => $userId,
                    'customer_name' => $user->name ?? 'Unknown',
                    'customer_email' => $user->email ?? 'Unknown',
                    'total_orders' => $userOrders->count(),
                    'total_revenue' => $userOrders->sum('total_price'),
                    'average_order_value' => $userOrders->count() > 0 ? round($userOrders->sum('total_price') / $userOrders->count(), 2) : 0,
                    'last_order_date' => $userOrders->max('created_at')
                ];
            })->sortByDesc('total_revenue')->values();

            $totalCustomers = $customers->count();
            $newCustomers = $customers->filter(function($customer) use ($startDate) {
                return Carbon::parse($customer['last_order_date'])->format('Y-m-d') >= $startDate;
            })->count();
            $repeatCustomers = $totalCustomers - $newCustomers;

            return response()->json([
                'customers' => $customers,
                'summary' => [
                    'total_customers' => $totalCustomers,
                    'new_customers' => $newCustomers,
                    'repeat_customers' => $repeatCustomers,
                    'retention_rate' => $totalCustomers > 0 ? round(($repeatCustomers / $totalCustomers) * 100, 1) : 0,
                    'average_lifetime_value' => $totalCustomers > 0 ? round($customers->sum('total_revenue') / $totalCustomers, 2) : 0
                ],
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching customer analytics: ' . $e->getMessage());
            return response()->json([
                'customers' => [],
                'summary' => [
                    'total_customers' => 0,
                    'new_customers' => 0,
                    'repeat_customers' => 0,
                    'retention_rate' => 0,
                    'average_lifetime_value' => 0
                ],
                'period' => [
                    'start_date' => $startDate ?? Carbon::now()->subDays(30)->format('Y-m-d'),
                    'end_date' => $endDate ?? Carbon::now()->format('Y-m-d')
                ]
            ]);
        }
    }

    /**
     * Get order analytics
     */
    public function getOrderAnalytics(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

            $orders = Order::whereBetween('created_at', [$startDate, $endDate])->get();

            $orderData = $this->generateDailyOrderData($orders, $startDate, $endDate);
            $statusDistribution = $orders->groupBy('status')->map(function($statusOrders, $status) {
                return [
                    'status' => ucfirst($status),
                    'count' => $statusOrders->count(),
                    'percentage' => $orders->count() > 0 ? round(($statusOrders->count() / $orders->count()) * 100, 1) : 0
                ];
            })->values();

            return response()->json([
                'order_data' => $orderData,
                'status_distribution' => $statusDistribution,
                'summary' => [
                    'total_orders' => $orders->count(),
                    'paid_orders' => $orders->where('payment_status', 'paid')->count(),
                    'pending_orders' => $orders->where('payment_status', 'pending')->count(),
                    'completed_orders' => $orders->where('status', 'completed')->count(),
                    'average_order_value' => $orders->where('payment_status', 'paid')->count() > 0 ? 
                        round($orders->where('payment_status', 'paid')->sum('total_price') / $orders->where('payment_status', 'paid')->count(), 2) : 0
                ],
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching order analytics: ' . $e->getMessage());
            return response()->json([
                'order_data' => [],
                'status_distribution' => [],
                'summary' => [
                    'total_orders' => 0,
                    'paid_orders' => 0,
                    'pending_orders' => 0,
                    'completed_orders' => 0,
                    'average_order_value' => 0
                ],
                'period' => [
                    'start_date' => $startDate ?? Carbon::now()->subDays(30)->format('Y-m-d'),
                    'end_date' => $endDate ?? Carbon::now()->format('Y-m-d')
                ]
            ]);
        }
    }

    /**
     * Get payment analytics
     */
    public function getPaymentAnalytics(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

            $orders = Order::whereBetween('created_at', [$startDate, $endDate])->get();

            $paymentMethods = $orders->groupBy('payment_method')->map(function($methodOrders, $method) {
                return [
                    'payment_method' => strtoupper($method),
                    'count' => $methodOrders->count(),
                    'revenue' => $methodOrders->where('payment_status', 'paid')->sum('total_price'),
                    'average_value' => $methodOrders->where('payment_status', 'paid')->count() > 0 ? 
                        round($methodOrders->where('payment_status', 'paid')->sum('total_price') / $methodOrders->where('payment_status', 'paid')->count(), 2) : 0,
                    'success_rate' => $methodOrders->count() > 0 ? 
                        round(($methodOrders->where('payment_status', 'paid')->count() / $methodOrders->count()) * 100, 1) : 0
                ];
            })->values();

            return response()->json([
                'payment_methods' => $paymentMethods,
                'summary' => [
                    'total_transactions' => $orders->count(),
                    'successful_transactions' => $orders->where('payment_status', 'paid')->count(),
                    'failed_transactions' => $orders->where('payment_status', 'failed')->count(),
                    'pending_transactions' => $orders->where('payment_status', 'pending')->count(),
                    'overall_success_rate' => $orders->count() > 0 ? 
                        round(($orders->where('payment_status', 'paid')->count() / $orders->count()) * 100, 1) : 0
                ],
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching payment analytics: ' . $e->getMessage());
            return response()->json([
                'payment_methods' => [],
                'summary' => [
                    'total_transactions' => 0,
                    'successful_transactions' => 0,
                    'failed_transactions' => 0,
                    'pending_transactions' => 0,
                    'overall_success_rate' => 0
                ],
                'period' => [
                    'start_date' => $startDate ?? Carbon::now()->subDays(30)->format('Y-m-d'),
                    'end_date' => $endDate ?? Carbon::now()->format('Y-m-d')
                ]
            ]);
        }
    }

    /**
     * Get trend analysis
     */
    public function getTrendAnalysis(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

            // Generate weekly trends
            $trends = [];
            $currentDate = Carbon::parse($startDate);
            $endDateCarbon = Carbon::parse($endDate);

            while ($currentDate->lte($endDateCarbon)) {
                $weekStart = $currentDate->copy();
                $weekEnd = $currentDate->copy()->addDays(6);
                
                $weekOrders = Order::whereBetween('created_at', [$weekStart, $weekEnd])
                    ->where('payment_status', 'paid')
                    ->get();

                $trends[] = [
                    'period' => 'Week ' . ($currentDate->weekOfYear),
                    'revenue' => $weekOrders->sum('total_price'),
                    'orders' => $weekOrders->count(),
                    'customers' => $weekOrders->groupBy('user_id')->count()
                ];

                $currentDate->addWeek();
            }

            // Calculate growth insights
            $currentPeriodRevenue = $trends->sum('revenue');
            $previousPeriodRevenue = $trends->count() > 1 ? $trends[0]['revenue'] : 0;
            $revenueGrowth = $previousPeriodRevenue > 0 ? 
                round((($currentPeriodRevenue - $previousPeriodRevenue) / $previousPeriodRevenue) * 100, 1) : 0;

            return response()->json([
                'trends' => $trends,
                'insights' => [
                    'revenue_growth' => $revenueGrowth,
                    'order_growth' => $trends->count() > 1 ? 
                        round((($trends->sum('orders') - $trends[0]['orders']) / $trends[0]['orders']) * 100, 1) : 0,
                    'customer_growth' => $trends->count() > 1 ? 
                        round((($trends->sum('customers') - $trends[0]['customers']) / $trends[0]['customers']) * 100, 1) : 0,
                    'peak_period' => $trends->sortByDesc('revenue')->first()['period'] ?? 'N/A',
                    'low_period' => $trends->sortBy('revenue')->first()['period'] ?? 'N/A'
                ],
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching trend analysis: ' . $e->getMessage());
            return response()->json([
                'trends' => [],
                'insights' => [
                    'revenue_growth' => 0,
                    'order_growth' => 0,
                    'customer_growth' => 0,
                    'peak_period' => 'N/A',
                    'low_period' => 'N/A'
                ],
                'period' => [
                    'start_date' => $startDate ?? Carbon::now()->subDays(30)->format('Y-m-d'),
                    'end_date' => $endDate ?? Carbon::now()->format('Y-m-d')
                ]
            ]);
        }
    }

    /**
     * Get sales reports
     */
    public function getSalesReports(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

            $orders = Order::with(['user', 'items.product'])
                ->whereBetween('created_at', [$startDate, $endDate])
                ->where('payment_status', 'paid')
                ->get();

            $reports = [
                'daily_sales' => $this->generateDailyRevenueData($orders, $startDate, $endDate),
                'product_sales' => $this->generateProductSalesReport($orders),
                'customer_sales' => $this->generateCustomerSalesReport($orders),
                'summary' => [
                    'total_revenue' => $orders->sum('total_price'),
                    'total_orders' => $orders->count(),
                    'total_customers' => $orders->groupBy('user_id')->count(),
                    'average_order_value' => $orders->count() > 0 ? round($orders->sum('total_price') / $orders->count(), 2) : 0
                ]
            ];

            return response()->json([
                'reports' => $reports,
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching sales reports: ' . $e->getMessage());
            return response()->json([
                'reports' => [
                    'daily_sales' => [],
                    'product_sales' => [],
                    'customer_sales' => [],
                    'summary' => [
                        'total_revenue' => 0,
                        'total_orders' => 0,
                        'total_customers' => 0,
                        'average_order_value' => 0
                    ]
                ],
                'period' => [
                    'start_date' => $startDate ?? Carbon::now()->subDays(30)->format('Y-m-d'),
                    'end_date' => $endDate ?? Carbon::now()->format('Y-m-d')
                ]
            ]);
        }
    }

    /**
     * Helper methods for sales analytics
     */
    private function generateDailyRevenueData($orders, $startDate, $endDate)
    {
        $dailyData = [];
        $currentDate = Carbon::parse($startDate);
        $endDateCarbon = Carbon::parse($endDate);
        $cumulativeRevenue = 0;

        while ($currentDate->lte($endDateCarbon)) {
            $dateStr = $currentDate->format('Y-m-d');
            $dayOrders = $orders->filter(function($order) use ($dateStr) {
                return Carbon::parse($order->created_at)->format('Y-m-d') === $dateStr;
            });

            $dayRevenue = $dayOrders->sum('total_price');
            $cumulativeRevenue += $dayRevenue;

            $dailyData[] = [
                'date' => $dateStr,
                'revenue' => $dayRevenue,
                'cumulative' => $cumulativeRevenue,
                'orders' => $dayOrders->count()
            ];

            $currentDate->addDay();
        }

        return $dailyData;
    }

    private function generateDailyOrderData($orders, $startDate, $endDate)
    {
        $dailyData = [];
        $currentDate = Carbon::parse($startDate);
        $endDateCarbon = Carbon::parse($endDate);

        while ($currentDate->lte($endDateCarbon)) {
            $dateStr = $currentDate->format('Y-m-d');
            $dayOrders = $orders->filter(function($order) use ($dateStr) {
                return Carbon::parse($order->created_at)->format('Y-m-d') === $dateStr;
            });

            $dailyData[] = [
                'date' => $dateStr,
                'orders' => $dayOrders->count(),
                'revenue' => $dayOrders->where('payment_status', 'paid')->sum('total_price')
            ];

            $currentDate->addDay();
        }

        return $dailyData;
    }

    private function generateProductSalesReport($orders)
    {
        $productSales = [];
        foreach ($orders as $order) {
            foreach ($order->items as $item) {
                $productId = $item->product_id;
                if (!isset($productSales[$productId])) {
                    $productSales[$productId] = [
                        'product_name' => $item->product->name ?? 'Unknown',
                        'quantity_sold' => 0,
                        'revenue' => 0
                    ];
                }
                $productSales[$productId]['quantity_sold'] += $item->quantity;
                $productSales[$productId]['revenue'] += $item->quantity * $item->price;
            }
        }

        return array_values($productSales);
    }

    private function generateCustomerSalesReport($orders)
    {
        $customerSales = [];
        foreach ($orders as $order) {
            $userId = $order->user_id;
            if (!isset($customerSales[$userId])) {
                $customerSales[$userId] = [
                    'customer_name' => $order->user->name ?? 'Unknown',
                    'total_orders' => 0,
                    'total_revenue' => 0
                ];
            }
            $customerSales[$userId]['total_orders']++;
            $customerSales[$userId]['total_revenue'] += $order->total_price;
        }

        return array_values($customerSales);
    }

    private function calculateProfitMargin($product, $revenue, $quantity)
    {
        // This is a simplified calculation - in reality, you'd need cost data
        $estimatedCost = $product ? ($product->price * 0.7) : ($revenue / $quantity * 0.7);
        $totalCost = $estimatedCost * $quantity;
        return $totalCost > 0 ? round((($revenue - $totalCost) / $revenue) * 100, 1) : 0;
    }
}
