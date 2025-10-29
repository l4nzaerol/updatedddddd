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
use App\Models\AlkansyaDailyOutput;
use App\Models\ProductMaterial;
use App\Models\InventoryItem;
use App\Models\InventoryUsage;
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

            // Check if we have any data at all
            $totalRecords = $alkansyaConsumption->count() + $madeToOrderConsumption->count();
            \Log::info('Total consumption records found:', ['total' => $totalRecords, 'alkansya' => $alkansyaConsumption->count(), 'made_to_order' => $madeToOrderConsumption->count()]);

            // Check database for any records at all
            $totalAlkansyaRecords = \App\Models\AlkansyaDailyOutput::count();
            $totalAcceptedOrders = \App\Models\Order::where('acceptance_status', 'accepted')->count();
            \Log::info('Database record counts:', [
                'total_alkansya_records' => $totalAlkansyaRecords,
                'total_accepted_orders' => $totalAcceptedOrders,
                'date_range' => [$startDate->format('Y-m-d'), $endDate->format('Y-m-d')]
            ]);

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

            // Generate sample data only if no real data is available
            if ($consumptionData->isEmpty() || empty($chartData)) {
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

            // Get productions for accepted and in-progress orders
            $productions = Production::whereHas('order', function($q) {
                    $q->where('acceptance_status', 'accepted')
                      ->whereIn('status', ['processing', 'pending', 'ready_for_delivery']);
                })
                ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                ->with(['order.user', 'product'])
                ->get();

            // Define standard production stages
            $standardStages = [
                'Material Preparation',
                'Cutting & Shaping',
                'Assembly',
                'Sanding & Surface Preparation',
                'Finishing',
                'Quality Check & Packaging',
                'Ready for Delivery',
                'Completed'
            ];

            // Group productions by stage
            $stageBreakdown = [];
            foreach ($standardStages as $stage) {
                $stageProductions = $productions->where('current_stage', $stage);
                
                $stageBreakdown[] = [
                    'stage_name' => $stage,
                    'total_productions' => $stageProductions->count(),
                    'productions' => $stageProductions->map(function($prod) {
                        return [
                            'id' => $prod->id,
                            'product_name' => $prod->product_name,
                            'quantity' => $prod->quantity,
                            'status' => $prod->status,
                            'order_id' => $prod->order_id,
                            'customer_name' => $prod->order && $prod->order->user ? $prod->order->user->name : 'N/A',
                            'order_number' => $prod->order ? '#' . str_pad($prod->order->id, 5, '0', STR_PAD_LEFT) : 'N/A',
                            'start_date' => $prod->date->format('Y-m-d'),
                            'overall_progress' => $prod->overall_progress ?? 0,
                            'estimated_completion' => $prod->estimated_completion_date ? Carbon::parse($prod->estimated_completion_date)->format('Y-m-d') : 'N/A'
                        ];
                    })->values()->toArray()
                ];
            }

            // Calculate summary stats
            $totalProductions = $productions->count();
            $inProgressCount = $productions->whereIn('status', ['In Progress', 'Pending'])->count();
            $completedCount = $productions->where('status', 'Completed')->count();

            // Calculate average progress
            $avgProgress = $productions->avg('overall_progress') ?? 0;

            return response()->json([
                'stages' => $stageBreakdown,
                'summary' => [
                    'total_stages' => count($standardStages),
                    'total_productions' => $totalProductions,
                    'in_progress_productions' => $inProgressCount,
                    'completed_productions' => $completedCount,
                    'average_progress' => round($avgProgress, 2)
                ],
                'period' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error fetching stage breakdown: ' . $e->getMessage());
            \Log::error($e->getTraceAsString());
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

    /**
     * Get Alkansya material usage forecast based on daily output
     */
    public function getAlkansyaMaterialForecast(Request $request)
    {
        try {
            $forecastDays = $request->get('forecast_days', 30);
            $historicalDays = $request->get('historical_days', 30);
            
            // Get Alkansya product
            $alkansyaProduct = Product::where('name', 'Alkansya')->first();
            if (!$alkansyaProduct) {
                return response()->json(['error' => 'Alkansya product not found'], 404);
            }

            // Get BOM materials for Alkansya
            $bomMaterials = ProductMaterial::where('product_id', $alkansyaProduct->id)
                ->with('inventoryItem')
                ->get();

            // Get historical daily output data
            $historicalOutput = AlkansyaDailyOutput::where('date', '>=', Carbon::now()->subDays($historicalDays))
                ->orderBy('date')
                ->get();

            // Calculate average daily output
            $totalOutput = $historicalOutput->sum('quantity_produced');
            $avgDailyOutput = $totalOutput / max(1, $historicalDays);

            // Generate forecast for each material
            $materialForecasts = [];
            foreach ($bomMaterials as $bomMaterial) {
                $inventoryItem = $bomMaterial->inventoryItem;
                $qtyPerUnit = $bomMaterial->qty_per_unit;
                
                // Calculate daily material usage based on average output
                $dailyMaterialUsage = $avgDailyOutput * $qtyPerUnit;
                $forecastedUsage = $dailyMaterialUsage * $forecastDays;
                
                // Get current stock
                $currentStock = $inventoryItem->quantity_on_hand;
                $projectedStock = $currentStock - $forecastedUsage;
                
                // Calculate days until stockout
                $daysUntilStockout = $dailyMaterialUsage > 0 ? floor($currentStock / $dailyMaterialUsage) : 999;
                
                $materialForecasts[] = [
                    'material_id' => $inventoryItem->id,
                    'material_name' => $inventoryItem->name,
                    'sku' => $inventoryItem->sku,
                    'qty_per_unit' => $qtyPerUnit,
                    'current_stock' => $currentStock,
                    'avg_daily_output' => round($avgDailyOutput, 2),
                    'daily_material_usage' => round($dailyMaterialUsage, 2),
                    'forecasted_usage' => round($forecastedUsage, 2),
                    'projected_stock' => round($projectedStock, 2),
                    'days_until_stockout' => $daysUntilStockout,
                    'reorder_point' => $inventoryItem->reorder_point,
                    'needs_reorder' => $projectedStock <= $inventoryItem->reorder_point,
                    'unit' => $inventoryItem->unit,
                    'unit_cost' => $inventoryItem->unit_cost
                ];
            }

            // Generate daily forecast timeline
            $dailyForecast = [];
            for ($i = 1; $i <= $forecastDays; $i++) {
                $date = Carbon::now()->addDays($i)->format('Y-m-d');
                $dailyForecast[] = [
                    'date' => $date,
                    'predicted_output' => round($avgDailyOutput, 2),
                    'total_material_usage' => round($avgDailyOutput * $bomMaterials->sum('qty_per_unit'), 2)
                ];
            }

            return response()->json([
                'forecast_type' => 'alkansya_materials',
                'forecast_period' => $forecastDays,
                'historical_period' => $historicalDays,
                'avg_daily_output' => round($avgDailyOutput, 2),
                'total_historical_output' => $totalOutput,
                'material_forecasts' => $materialForecasts,
                'daily_forecast' => $dailyForecast,
                'summary' => [
                    'materials_analyzed' => count($materialForecasts),
                    'materials_needing_reorder' => collect($materialForecasts)->where('needs_reorder', true)->count(),
                    'avg_days_until_stockout' => collect($materialForecasts)->avg('days_until_stockout')
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in Alkansya material forecast: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to generate Alkansya material forecast'], 500);
        }
    }

    /**
     * Get made-to-order product material forecast based on orders
     */
    public function getMadeToOrderMaterialForecast(Request $request)
    {
        try {
            $forecastDays = $request->get('forecast_days', 30);
            $historicalDays = $request->get('historical_days', 30);
            
            // Get made-to-order products
            $madeToOrderProducts = Product::where('category_name', 'Made-to-Order')
                ->with(['productMaterials.inventoryItem'])
                ->get();

            if ($madeToOrderProducts->isEmpty()) {
                return response()->json(['error' => 'No made-to-order products found'], 404);
            }

            // Get historical orders for made-to-order products
            $startDate = Carbon::now()->subDays($historicalDays);
            $historicalOrders = Order::where('created_at', '>=', $startDate)
                ->whereHas('orderItems', function($query) use ($madeToOrderProducts) {
                    $query->whereIn('product_id', $madeToOrderProducts->pluck('id'));
                })
                ->with(['items' => function($query) use ($madeToOrderProducts) {
                    $query->whereIn('product_id', $madeToOrderProducts->pluck('id'));
                }])
                ->get();

            // Calculate average order frequency and quantities
            $productOrderStats = [];
            foreach ($madeToOrderProducts as $product) {
                $productOrders = $historicalOrders->flatMap(function($order) use ($product) {
                    return $order->items->where('product_id', $product->id);
                });

                $totalQuantity = $productOrders->sum('quantity');
                $orderCount = $productOrders->count();
                $avgOrderQuantity = $orderCount > 0 ? $totalQuantity / $orderCount : 0;
                $avgOrdersPerDay = $orderCount / max(1, $historicalDays);

                $productOrderStats[$product->id] = [
                    'product_name' => $product->name,
                    'total_orders' => $orderCount,
                    'total_quantity' => $totalQuantity,
                    'avg_order_quantity' => round($avgOrderQuantity, 2),
                    'avg_orders_per_day' => round($avgOrdersPerDay, 2),
                    'avg_daily_quantity' => round($avgOrdersPerDay * $avgOrderQuantity, 2)
                ];
            }

            // Generate material forecasts for each made-to-order product
            $materialForecasts = [];
            foreach ($madeToOrderProducts as $product) {
                $stats = $productOrderStats[$product->id];
                $avgDailyQuantity = $stats['avg_daily_quantity'];
                
                foreach ($product->productMaterials as $productMaterial) {
                    $inventoryItem = $productMaterial->inventoryItem;
                    $qtyPerUnit = $productMaterial->qty_per_unit;
                    
                    $dailyMaterialUsage = $avgDailyQuantity * $qtyPerUnit;
                    $forecastedUsage = $dailyMaterialUsage * $forecastDays;
                    
                    $currentStock = $inventoryItem->quantity_on_hand;
                    $projectedStock = $currentStock - $forecastedUsage;
                    $daysUntilStockout = $dailyMaterialUsage > 0 ? floor($currentStock / $dailyMaterialUsage) : 999;
                    
                    $materialForecasts[] = [
                        'product_name' => $product->name,
                        'material_id' => $inventoryItem->id,
                        'material_name' => $inventoryItem->name,
                        'sku' => $inventoryItem->sku,
                        'qty_per_unit' => $qtyPerUnit,
                        'current_stock' => $currentStock,
                        'avg_daily_quantity' => $avgDailyQuantity,
                        'daily_material_usage' => round($dailyMaterialUsage, 2),
                        'forecasted_usage' => round($forecastedUsage, 2),
                        'projected_stock' => round($projectedStock, 2),
                        'days_until_stockout' => $daysUntilStockout,
                        'reorder_point' => $inventoryItem->reorder_point,
                        'needs_reorder' => $projectedStock <= $inventoryItem->reorder_point,
                        'unit' => $inventoryItem->unit,
                        'unit_cost' => $inventoryItem->unit_cost
                    ];
                }
            }

            return response()->json([
                'forecast_type' => 'made_to_order_materials',
                'forecast_period' => $forecastDays,
                'historical_period' => $historicalDays,
                'product_stats' => $productOrderStats,
                'material_forecasts' => $materialForecasts,
                'summary' => [
                    'products_analyzed' => count($madeToOrderProducts),
                    'materials_analyzed' => count($materialForecasts),
                    'materials_needing_reorder' => collect($materialForecasts)->where('needs_reorder', true)->count(),
                    'avg_days_until_stockout' => collect($materialForecasts)->avg('days_until_stockout')
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in made-to-order material forecast: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to generate made-to-order material forecast'], 500);
        }
    }

    /**
     * Get overall materials usage forecast combining all products
     */
    public function getOverallMaterialForecast(Request $request)
    {
        try {
            $forecastDays = $request->get('forecast_days', 30);
            $historicalDays = $request->get('historical_days', 30);
            
            // Get all inventory items with their usage history
            $inventoryItems = InventoryItem::with(['usages' => function($query) use ($historicalDays) {
                $query->where('date', '>=', Carbon::now()->subDays($historicalDays));
            }])->get();

            $materialForecasts = [];
            foreach ($inventoryItems as $item) {
                $totalUsage = $item->usages->sum('qty_used');
                $avgDailyUsage = $totalUsage / max(1, $historicalDays);
                $forecastedUsage = $avgDailyUsage * $forecastDays;
                
                $currentStock = $item->quantity_on_hand;
                $projectedStock = $currentStock - $forecastedUsage;
                $daysUntilStockout = $avgDailyUsage > 0 ? floor($currentStock / $avgDailyUsage) : 999;
                
                // Determine usage category
                $usageCategory = 'low';
                if ($avgDailyUsage > 10) {
                    $usageCategory = 'high';
                } elseif ($avgDailyUsage > 5) {
                    $usageCategory = 'medium';
                }
                
                $materialForecasts[] = [
                    'material_id' => $item->id,
                    'material_name' => $item->name,
                    'sku' => $item->sku,
                    'category' => $item->category,
                    'current_stock' => $currentStock,
                    'avg_daily_usage' => round($avgDailyUsage, 2),
                    'forecasted_usage' => round($forecastedUsage, 2),
                    'projected_stock' => round($projectedStock, 2),
                    'days_until_stockout' => $daysUntilStockout,
                    'reorder_point' => $item->reorder_point,
                    'safety_stock' => $item->safety_stock,
                    'needs_reorder' => $projectedStock <= $item->reorder_point,
                    'usage_category' => $usageCategory,
                    'unit' => $item->unit,
                    'unit_cost' => $item->unit_cost,
                    'total_value' => $currentStock * $item->unit_cost
                ];
            }

            // Sort by days until stockout (most critical first)
            $materialForecasts = collect($materialForecasts)->sortBy('days_until_stockout')->values();

            // Generate summary statistics
            $summary = [
                'total_materials' => count($materialForecasts),
                'materials_needing_reorder' => collect($materialForecasts)->where('needs_reorder', true)->count(),
                'critical_materials' => collect($materialForecasts)->where('days_until_stockout', '<=', 7)->count(),
                'high_usage_materials' => collect($materialForecasts)->where('usage_category', 'high')->count(),
                'total_inventory_value' => collect($materialForecasts)->sum('total_value'),
                'avg_days_until_stockout' => collect($materialForecasts)->avg('days_until_stockout')
            ];

            // Generate daily forecast timeline
            $dailyForecast = [];
            for ($i = 1; $i <= $forecastDays; $i++) {
                $date = Carbon::now()->addDays($i)->format('Y-m-d');
                $dailyForecast[] = [
                    'date' => $date,
                    'predicted_total_usage' => round(collect($materialForecasts)->sum('avg_daily_usage'), 2),
                    'critical_materials_count' => collect($materialForecasts)->where('days_until_stockout', '<=', $i)->count()
                ];
            }

            return response()->json([
                'forecast_type' => 'overall_materials',
                'forecast_period' => $forecastDays,
                'historical_period' => $historicalDays,
                'material_forecasts' => $materialForecasts,
                'daily_forecast' => $dailyForecast,
                'summary' => $summary
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in overall material forecast: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to generate overall material forecast'], 500);
        }
    }

    /**
     * Get enhanced replenishment schedule with predictive analytics
     */
    public function getEnhancedReplenishmentSchedule(Request $request)
    {
        try {
            $forecastDays = $request->get('forecast_days', 30);
            $historicalDays = $request->get('historical_days', 30);
            
            // Get all inventory items
            $inventoryItems = InventoryItem::with(['usages' => function($query) use ($historicalDays) {
                $query->where('date', '>=', Carbon::now()->subDays($historicalDays));
            }])->get();

            // Check if we have any consumption data
            $hasConsumptionData = InventoryUsage::where('date', '>=', Carbon::now()->subDays($historicalDays))->exists();
            
            if (!$hasConsumptionData) {
                return response()->json([
                    'error' => 'No consumption data available',
                    'message' => 'Please run the consumption data generator script to create test data for the replenishment system.',
                    'instructions' => [
                        '1. Run: php create_basic_consumption_data.php',
                        '2. This will generate 90 days of consumption data based on Alkansya production',
                        '3. Refresh the replenishment tab to see the enhanced analytics'
                    ],
                    'replenishment_items' => [],
                    'schedule' => [
                        'immediate' => [],
                        'this_week' => [],
                        'next_week' => [],
                        'future' => []
                    ],
                    'summary' => [
                        'total_materials' => 0,
                        'critical_materials' => 0,
                        'high_priority_materials' => 0,
                        'medium_priority_materials' => 0,
                        'materials_needing_reorder' => 0,
                        'total_reorder_value' => 0,
                        'alkansya_materials' => 0,
                        'made_to_order_materials' => 0,
                        'avg_lead_time' => 0
                    ],
                    'forecast_period' => $forecastDays,
                    'historical_period' => $historicalDays,
                    'alkansya_daily_output' => 0,
                    'made_to_order_products' => 0
                ]);
            }

            // Get Alkansya product and BOM materials
            $alkansyaProduct = Product::where('name', 'Alkansya')->first();
            $alkansyaBomMaterials = [];
            if ($alkansyaProduct) {
                $alkansyaBomMaterials = ProductMaterial::where('product_id', $alkansyaProduct->id)
                    ->with('inventoryItem')
                    ->get();
            }

            // Get made-to-order products and their BOM materials
            $madeToOrderProducts = Product::where('category_name', 'Made-to-Order')
                ->with(['productMaterials.inventoryItem'])
                ->get();

            // Get historical Alkansya output
            $historicalOutput = AlkansyaDailyOutput::where('date', '>=', Carbon::now()->subDays($historicalDays))
                ->orderBy('date')
                ->get();
            $avgDailyOutput = $historicalOutput->sum('quantity_produced') / max(1, $historicalDays);

            // Get historical orders for made-to-order products
            $startDate = Carbon::now()->subDays($historicalDays);
            $historicalOrders = Order::where('created_at', '>=', $startDate)
                ->whereHas('orderItems', function($query) use ($madeToOrderProducts) {
                    $query->whereIn('product_id', $madeToOrderProducts->pluck('id'));
                })
                ->with(['items' => function($query) use ($madeToOrderProducts) {
                    $query->whereIn('product_id', $madeToOrderProducts->pluck('id'));
                }])
                ->get();

            // Calculate made-to-order daily consumption
            $madeToOrderDailyConsumption = [];
            foreach ($madeToOrderProducts as $product) {
                $productOrders = $historicalOrders->flatMap(function($order) use ($product) {
                    return $order->items->where('product_id', $product->id);
                });
                $totalQuantity = $productOrders->sum('quantity');
                $avgDailyQuantity = $totalQuantity / max(1, $historicalDays);
                
                foreach ($product->productMaterials as $productMaterial) {
                    $inventoryItem = $productMaterial->inventoryItem;
                    $dailyConsumption = $avgDailyQuantity * $productMaterial->qty_per_unit;
                    
                    if (!isset($madeToOrderDailyConsumption[$inventoryItem->id])) {
                        $madeToOrderDailyConsumption[$inventoryItem->id] = 0;
                    }
                    $madeToOrderDailyConsumption[$inventoryItem->id] += $dailyConsumption;
                }
            }

            // Calculate Alkansya daily consumption
            $alkansyaDailyConsumption = [];
            foreach ($alkansyaBomMaterials as $bomMaterial) {
                $inventoryItem = $bomMaterial->inventoryItem;
                $dailyConsumption = $avgDailyOutput * $bomMaterial->qty_per_unit;
                $alkansyaDailyConsumption[$inventoryItem->id] = $dailyConsumption;
            }

            // Generate replenishment recommendations
            $replenishmentItems = [];
            foreach ($inventoryItems as $item) {
                // Calculate total daily consumption from all sources
                $historicalUsage = $item->usages->sum('qty_used');
                $avgHistoricalUsage = $historicalUsage / max(1, $historicalDays);
                
                $alkansyaUsage = $alkansyaDailyConsumption[$item->id] ?? 0;
                $madeToOrderUsage = $madeToOrderDailyConsumption[$item->id] ?? 0;
                
                // Use the higher of historical usage or predicted usage
                $predictedDailyUsage = max($avgHistoricalUsage, $alkansyaUsage + $madeToOrderUsage);
                
                // Calculate forecasted consumption
                $forecastedConsumption = $predictedDailyUsage * $forecastDays;
                
                // Calculate current stock and projected stock
                $currentStock = $item->quantity_on_hand;
                $projectedStock = $currentStock - $forecastedConsumption;
                
                // Calculate days until stockout
                $daysUntilStockout = $predictedDailyUsage > 0 ? floor($currentStock / $predictedDailyUsage) : 999;
                
                // Determine urgency level
                $urgency = 'low';
                if ($daysUntilStockout <= 0) {
                    $urgency = 'critical';
                } elseif ($daysUntilStockout <= 7) {
                    $urgency = 'high';
                } elseif ($daysUntilStockout <= 14) {
                    $urgency = 'medium';
                }
                
                // Calculate suggested order quantity
                $suggestedOrderQty = 0;
                if ($projectedStock <= $item->reorder_point) {
                    $suggestedOrderQty = max(
                        $item->max_level - $projectedStock,
                        $item->reorder_point - $projectedStock + ($predictedDailyUsage * 7) // Add 7 days buffer
                    );
                }
                
                // Calculate lead time (simplified - could be enhanced with supplier data)
                $leadTime = $this->calculateLeadTime($item, $urgency);
                
                // Calculate reorder date
                $reorderDate = $daysUntilStockout > $leadTime ? 
                    Carbon::now()->addDays($daysUntilStockout - $leadTime) : 
                    Carbon::now();
                
                // Determine consumption source breakdown
                $consumptionBreakdown = [
                    'historical' => round($avgHistoricalUsage, 2),
                    'alkansya' => round($alkansyaUsage, 2),
                    'made_to_order' => round($madeToOrderUsage, 2),
                    'predicted' => round($predictedDailyUsage, 2)
                ];
                
                $replenishmentItems[] = [
                    'material_id' => $item->id,
                    'material_name' => $item->name,
                    'sku' => $item->sku,
                    'category' => $item->category,
                    'current_stock' => $currentStock,
                    'reorder_point' => $item->reorder_point,
                    'safety_stock' => $item->safety_stock,
                    'max_level' => $item->max_level,
                    'unit' => $item->unit,
                    'unit_cost' => $item->unit_cost,
                    'total_value' => $currentStock * $item->unit_cost,
                    'predicted_daily_usage' => round($predictedDailyUsage, 2),
                    'forecasted_consumption' => round($forecastedConsumption, 2),
                    'projected_stock' => round($projectedStock, 2),
                    'days_until_stockout' => $daysUntilStockout,
                    'urgency' => $urgency,
                    'suggested_order_qty' => round($suggestedOrderQty, 2),
                    'lead_time_days' => $leadTime,
                    'reorder_date' => $reorderDate->format('Y-m-d'),
                    'consumption_breakdown' => $consumptionBreakdown,
                    'needs_reorder' => $projectedStock <= $item->reorder_point,
                    'is_critical' => $daysUntilStockout <= 7,
                    'is_alkansya_material' => in_array($item->id, array_keys($alkansyaDailyConsumption)),
                    'is_made_to_order_material' => in_array($item->id, array_keys($madeToOrderDailyConsumption))
                ];
            }

            // Sort by urgency and days until stockout
            $replenishmentItems = collect($replenishmentItems)->sortBy([
                ['urgency', 'asc'],
                ['days_until_stockout', 'asc']
            ])->values();

            // Generate summary statistics
            $summary = [
                'total_materials' => count($replenishmentItems),
                'critical_materials' => collect($replenishmentItems)->where('urgency', 'critical')->count(),
                'high_priority_materials' => collect($replenishmentItems)->where('urgency', 'high')->count(),
                'medium_priority_materials' => collect($replenishmentItems)->where('urgency', 'medium')->count(),
                'materials_needing_reorder' => collect($replenishmentItems)->where('needs_reorder', true)->count(),
                'total_reorder_value' => collect($replenishmentItems)->where('needs_reorder', true)->sum(function($item) {
                    return $item['suggested_order_qty'] * $item['unit_cost'];
                }),
                'alkansya_materials' => collect($replenishmentItems)->where('is_alkansya_material', true)->count(),
                'made_to_order_materials' => collect($replenishmentItems)->where('is_made_to_order_material', true)->count(),
                'avg_lead_time' => collect($replenishmentItems)->avg('lead_time_days')
            ];

            // Generate replenishment schedule by urgency
            $schedule = [
                'immediate' => collect($replenishmentItems)->where('urgency', 'critical')->take(10),
                'this_week' => collect($replenishmentItems)->where('urgency', 'high')->take(15),
                'next_week' => collect($replenishmentItems)->where('urgency', 'medium')->take(20),
                'future' => collect($replenishmentItems)->where('urgency', 'low')->take(25)
            ];

            return response()->json([
                'replenishment_items' => $replenishmentItems,
                'schedule' => $schedule,
                'summary' => $summary,
                'forecast_period' => $forecastDays,
                'historical_period' => $historicalDays,
                'alkansya_daily_output' => round($avgDailyOutput, 2),
                'made_to_order_products' => count($madeToOrderProducts)
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in enhanced replenishment schedule: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to generate enhanced replenishment schedule'], 500);
        }
    }

    /**
     * Calculate lead time based on material and urgency
     */
    private function calculateLeadTime($item, $urgency)
    {
        // Base lead time by category
        $baseLeadTime = 7; // Default 7 days
        
        if (strpos(strtolower($item->category ?? ''), 'raw') !== false) {
            $baseLeadTime = 14; // Raw materials take longer
        } elseif (strpos(strtolower($item->category ?? ''), 'finished') !== false) {
            $baseLeadTime = 5; // Finished goods are faster
        }
        
        // Adjust based on urgency
        switch ($urgency) {
            case 'critical':
                return max(1, $baseLeadTime - 3); // Expedite critical items
            case 'high':
                return max(2, $baseLeadTime - 2);
            case 'medium':
                return $baseLeadTime;
            case 'low':
                return $baseLeadTime + 3; // Can take longer for low priority
            default:
                return $baseLeadTime;
        }
    }

    /**
     * Get enhanced transactions with normalized inventory data and filtering
     */
    public function getEnhancedTransactions(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));
            $transactionType = $request->get('transaction_type', 'all'); // all, alkansya, made_to_order, other
            $limit = $request->get('limit', 100);

            // Check if we have any transactions at all
            $totalTransactionCount = InventoryTransaction::count();
            
            if ($totalTransactionCount === 0) {
                return response()->json([
                    'error' => 'No transactions data available',
                    'message' => 'No inventory transactions found in the database. Please ensure transactions are being recorded.',
                    'instructions' => [
                        '1. Check if inventory transactions are being created during production',
                        '2. Verify that the inventory_transactions table has data',
                        '3. Run production processes to generate transaction data'
                    ],
                    'transactions' => [],
                    'summary' => [
                        'total_transactions' => 0,
                        'total_value' => 0,
                        'total_quantity' => 0,
                        'inbound_transactions' => 0,
                        'outbound_transactions' => 0,
                        'alkansya_transactions' => 0,
                        'made_to_order_transactions' => 0,
                        'other_transactions' => 0,
                        'unique_materials' => 0,
                        'date_range' => [
                            'start_date' => $startDate,
                            'end_date' => $endDate
                        ]
                    ],
                    'daily_summary' => [],
                    'material_summary' => [],
                    'alkansya_output' => [],
                    'made_to_order_orders' => [],
                    'filters' => [
                        'transaction_type' => $transactionType,
                        'start_date' => $startDate,
                        'end_date' => $endDate,
                        'limit' => $limit
                    ]
                ]);
            }

            // Get normalized inventory transactions
            $query = InventoryTransaction::with(['material', 'product'])
                ->whereBetween('timestamp', [$startDate, $endDate]);

            // Apply transaction type filter
            switch ($transactionType) {
                case 'alkansya':
                    $query->where(function($q) {
                        $q->where('transaction_type', 'ALKANSYA_CONSUMPTION')
                          ->orWhere('transaction_type', 'ALKANSYA_PRODUCTION')
                          ->orWhere('reference', 'like', '%ALKANSYA%');
                    });
                    break;
                case 'made_to_order':
                    $query->where(function($q) {
                        $q->where('transaction_type', 'ORDER_CONSUMPTION')
                          ->orWhere('transaction_type', 'ORDER_PRODUCTION')
                          ->orWhere('reference', 'like', '%ORDER%');
                    });
                    break;
                case 'other':
                    $query->whereNotIn('transaction_type', [
                        'ALKANSYA_CONSUMPTION', 'ALKANSYA_PRODUCTION', 
                        'ORDER_CONSUMPTION', 'ORDER_PRODUCTION'
                    ])->where('reference', 'not like', '%ALKANSYA%')
                      ->where('reference', 'not like', '%ORDER%');
                    break;
                // 'all' - no additional filtering
            }

            $transactions = $query->orderBy('timestamp', 'desc')
                ->limit($limit)
                ->get();

            // Get Alkansya daily output for context
            $alkansyaOutput = AlkansyaDailyOutput::whereBetween('date', [$startDate, $endDate])
                ->orderBy('date', 'desc')
                ->get();

            // Get made-to-order orders for context
            $madeToOrderOrders = Order::whereBetween('created_at', [$startDate, $endDate])
                ->whereHas('items', function($query) {
                    $query->whereHas('product', function($q) {
                        $q->where('category_name', 'Made-to-Order');
                    });
                })
                ->with(['items.product'])
                ->get();

            // Process transactions with enhanced data
            $processedTransactions = $transactions->map(function($transaction) {
                $material = $transaction->material;
                $product = $transaction->product;
                
                // Determine transaction category
                $category = 'other';
                if (strpos($transaction->transaction_type, 'ALKANSYA') !== false || 
                    strpos($transaction->reference, 'ALKANSYA') !== false) {
                    $category = 'alkansya';
                } elseif (strpos($transaction->transaction_type, 'ORDER') !== false || 
                         strpos($transaction->reference, 'ORDER') !== false) {
                    $category = 'made_to_order';
                }

                // Determine transaction direction
                $direction = $transaction->quantity > 0 ? 'in' : 'out';
                $directionLabel = $direction === 'in' ? 'Received' : 'Consumed';

                // Calculate running balance (simplified)
                $runningBalance = $material ? $material->current_stock : 0;

                return [
                    'id' => $transaction->id,
                    'timestamp' => $transaction->timestamp,
                    'date' => Carbon::parse($transaction->timestamp)->format('Y-m-d'),
                    'time' => Carbon::parse($transaction->timestamp)->format('H:i:s'),
                    'transaction_type' => $transaction->transaction_type,
                    'category' => $category,
                    'direction' => $direction,
                    'direction_label' => $directionLabel,
                    'material_id' => $transaction->material_id,
                    'material_name' => $material ? $material->material_name : 'Unknown Material',
                    'material_code' => $material ? $material->material_code : 'N/A',
                    'product_id' => $transaction->product_id,
                    'product_name' => $product ? $product->name : 'N/A',
                    'quantity' => abs($transaction->quantity),
                    'quantity_display' => ($transaction->quantity > 0 ? '+' : '-') . abs($transaction->quantity),
                    'unit' => $material ? $material->unit_of_measure : 'units',
                    'unit_cost' => $transaction->unit_cost,
                    'total_cost' => $transaction->total_cost,
                    'reference' => $transaction->reference,
                    'remarks' => $transaction->remarks,
                    'status' => $transaction->status,
                    'priority' => $transaction->priority,
                    'running_balance' => $runningBalance,
                    'metadata' => $transaction->metadata,
                    'created_at' => $transaction->created_at,
                    'updated_at' => $transaction->updated_at
                ];
            });

            // Generate summary statistics
            $summary = [
                'total_transactions' => $processedTransactions->count(),
                'total_value' => $processedTransactions->sum('total_cost'),
                'total_quantity' => $processedTransactions->sum('quantity'),
                'inbound_transactions' => $processedTransactions->where('direction', 'in')->count(),
                'outbound_transactions' => $processedTransactions->where('direction', 'out')->count(),
                'alkansya_transactions' => $processedTransactions->where('category', 'alkansya')->count(),
                'made_to_order_transactions' => $processedTransactions->where('category', 'made_to_order')->count(),
                'other_transactions' => $processedTransactions->where('category', 'other')->count(),
                'unique_materials' => $processedTransactions->pluck('material_id')->unique()->count(),
                'date_range' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ];

            // Generate daily transaction summary
            $dailySummary = $processedTransactions->groupBy('date')->map(function($dayTransactions, $date) {
                return [
                    'date' => $date,
                    'total_transactions' => $dayTransactions->count(),
                    'total_value' => $dayTransactions->sum('total_cost'),
                    'total_quantity' => $dayTransactions->sum('quantity'),
                    'inbound' => $dayTransactions->where('direction', 'in')->count(),
                    'outbound' => $dayTransactions->where('direction', 'out')->count(),
                    'alkansya' => $dayTransactions->where('category', 'alkansya')->count(),
                    'made_to_order' => $dayTransactions->where('category', 'made_to_order')->count(),
                    'other' => $dayTransactions->where('category', 'other')->count()
                ];
            })->values();

            // Generate material transaction summary
            $materialSummary = $processedTransactions->groupBy('material_id')->map(function($materialTransactions, $materialId) {
                $firstTransaction = $materialTransactions->first();
                return [
                    'material_id' => $materialId,
                    'material_name' => $firstTransaction['material_name'],
                    'material_code' => $firstTransaction['material_code'],
                    'total_transactions' => $materialTransactions->count(),
                    'total_quantity' => $materialTransactions->sum('quantity'),
                    'total_value' => $materialTransactions->sum('total_cost'),
                    'inbound_quantity' => $materialTransactions->where('direction', 'in')->sum('quantity'),
                    'outbound_quantity' => $materialTransactions->where('direction', 'out')->sum('quantity'),
                    'net_quantity' => $materialTransactions->sum(function($t) {
                        return $t['direction'] === 'in' ? $t['quantity'] : -$t['quantity'];
                    }),
                    'last_transaction' => $materialTransactions->max('timestamp')
                ];
            })->values();

            return response()->json([
                'transactions' => $processedTransactions,
                'summary' => $summary,
                'daily_summary' => $dailySummary,
                'material_summary' => $materialSummary,
                'alkansya_output' => $alkansyaOutput,
                'made_to_order_orders' => $madeToOrderOrders,
                'filters' => [
                    'transaction_type' => $transactionType,
                    'start_date' => $startDate,
                    'end_date' => $endDate,
                    'limit' => $limit
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in enhanced transactions: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch enhanced transactions'], 500);
        }
    }

    /**
     * Get production overview with Alkansya and Made-to-Order data
     */
    public function getProductionOverview(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

            // Get Alkansya daily output data
            $alkansyaOutput = AlkansyaDailyOutput::whereBetween('date', [$startDate, $endDate])
                ->orderBy('date', 'desc')
                ->get();

            // Get Made-to-Order orders and their status
            $madeToOrderOrders = Order::whereBetween('created_at', [$startDate, $endDate])
                ->whereHas('items', function($query) {
                    $query->whereHas('product', function($q) {
                        $q->where('category_name', 'Made-to-Order');
                    });
                })
                ->with(['items.product'])
                ->get();

            // Get all products to categorize them
            $alkansyaProducts = Product::where('name', 'Alkansya')->get();
            $madeToOrderProducts = Product::where('category_name', 'Made-to-Order')->get();

            // Calculate Alkansya metrics
            $alkansyaMetrics = [
                'total_days' => $alkansyaOutput->count(),
                'total_units_produced' => $alkansyaOutput->sum('quantity_produced'),
                'average_daily_output' => $alkansyaOutput->count() > 0 ? round($alkansyaOutput->avg('quantity_produced'), 2) : 0,
                'max_daily_output' => $alkansyaOutput->max('quantity_produced') ?? 0,
                'min_daily_output' => $alkansyaOutput->min('quantity_produced') ?? 0,
                'recent_output' => $alkansyaOutput->take(7)->map(function($output) {
                    return [
                        'date' => $output->date->format('Y-m-d'),
                        'quantity' => $output->quantity_produced,
                        'produced_by' => $output->produced_by ?? 'N/A'
                    ];
                })->values(),
            ];

            // Calculate Made-to-Order metrics
            $madeToOrderMetrics = [
                'total_orders' => $madeToOrderOrders->count(),
                'total_products_ordered' => $madeToOrderOrders->sum(function($order) {
                    return $order->items->sum('quantity');
                }),
                'unique_products' => $madeToOrderProducts->count(),
                'average_order_value' => $madeToOrderOrders->avg('total_amount'),
                'total_revenue' => $madeToOrderOrders->sum('total_amount'),
                'recent_orders' => $madeToOrderOrders->take(10)->map(function($order) {
                    return [
                        'id' => $order->id,
                        'customer_name' => $order->customer_name,
                        'total_amount' => $order->total_amount,
                        'status' => $order->acceptance_status,
                        'created_at' => $order->created_at->format('Y-m-d'),
                        'items' => $order->items->map(function($item) {
                            return [
                                'product_name' => $item->product->name ?? 'Unknown',
                                'quantity' => $item->quantity,
                                'unit_price' => $item->unit_price
                            ];
                        })
                    ];
                })->values(),
            ];

            $totalUnits = $alkansyaMetrics['total_units_produced'] + $madeToOrderMetrics['total_products_ordered'];
            
            // Calculate overall production metrics
            $overallMetrics = [
                'total_production_days' => $alkansyaMetrics['total_days'],
                'total_units_produced' => $totalUnits,
                'production_breakdown' => [
                    'alkansya_percentage' => $totalUnits > 0 ? 
                        round(($alkansyaMetrics['total_units_produced'] / $totalUnits) * 100, 1) : 0,
                    'made_to_order_percentage' => $totalUnits > 0 ? 
                        round(($madeToOrderMetrics['total_products_ordered'] / $totalUnits) * 100, 1) : 0
                ]
            ];

            // Generate daily production summary
            $dailySummary = $this->generateDailyProductionSummary($alkansyaOutput, $madeToOrderOrders, $startDate, $endDate);

            return response()->json([
                'alkansya' => $alkansyaMetrics,
                'made_to_order' => $madeToOrderMetrics,
                'overall' => $overallMetrics,
                'daily_summary' => $dailySummary,
                'date_range' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ],
                'product_categories' => [
                    'alkansya_products' => $alkansyaProducts->map(function($product) {
                        return [
                            'id' => $product->id,
                            'name' => $product->name,
                            'description' => $product->description,
                        ];
                    }),
                    'made_to_order_products' => $madeToOrderProducts->map(function($product) {
                        return [
                            'id' => $product->id,
                            'name' => $product->name,
                            'description' => $product->description,
                            'price' => $product->price
                        ];
                    })
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in production overview: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch production overview'], 500);
        }
    }

    private function calculateProductionTrend($alkansyaOutput)
    {
        if ($alkansyaOutput->count() < 2) {
            return 'stable';
        }

        $recent = $alkansyaOutput->take(7)->avg('quantity_produced');
        $previous = $alkansyaOutput->skip(7)->take(7)->avg('quantity_produced');

        if ($recent > $previous * 1.1) {
            return 'increasing';
        } elseif ($recent < $previous * 0.9) {
            return 'decreasing';
        } else {
            return 'stable';
        }
    }

    private function getAlkansyaMaterialsUsed($alkansyaProducts, $alkansyaOutput)
    {
        $materials = [];
        $totalOutput = $alkansyaOutput->sum('quantity_produced');

        foreach ($alkansyaProducts as $product) {
            foreach ($product->productMaterials as $productMaterial) {
                $inventoryItem = $productMaterial->inventoryItem;
                $totalUsed = $totalOutput * $productMaterial->qty_per_unit;
                
                $materials[] = [
                    'material_name' => $inventoryItem->name,
                    'material_code' => $inventoryItem->sku,
                    'quantity_used' => round($totalUsed, 2),
                    'unit' => $inventoryItem->unit,
                    'cost_per_unit' => $inventoryItem->unit_cost,
                    'total_cost' => round($totalUsed * $inventoryItem->unit_cost, 2)
                ];
            }
        }

        return $materials;
    }

    private function getOrderStatusBreakdown($orders)
    {
        return [
            'pending' => $orders->where('status', 'pending')->count(),
            'in_progress' => $orders->where('status', 'in_progress')->count(),
            'completed' => $orders->where('status', 'completed')->count(),
            'cancelled' => $orders->where('status', 'cancelled')->count()
        ];
    }

    private function getMadeToOrderMaterialsRequired($madeToOrderProducts, $orders)
    {
        $materials = [];
        $totalOrdered = $orders->sum(function($order) {
            return $order->items->whereHas('product', function($q) {
                return $q->where('category_name', 'Made-to-Order');
            })->sum('quantity');
        });

        foreach ($madeToOrderProducts as $product) {
            $productOrders = $orders->flatMap(function($order) use ($product) {
                return $order->items->where('product_id', $product->id);
            });
            $productQuantity = $productOrders->sum('quantity');

            foreach ($product->productMaterials as $productMaterial) {
                $inventoryItem = $productMaterial->inventoryItem;
                $totalRequired = $productQuantity * $productMaterial->qty_per_unit;
                
                $materials[] = [
                    'material_name' => $inventoryItem->name,
                    'material_code' => $inventoryItem->sku,
                    'quantity_required' => round($totalRequired, 2),
                    'unit' => $inventoryItem->unit,
                    'cost_per_unit' => $inventoryItem->unit_cost,
                    'total_cost' => round($totalRequired * $inventoryItem->unit_cost, 2)
                ];
            }
        }

        return $materials;
    }

    private function calculateProductionEfficiency($alkansyaOutput, $madeToOrderOrders)
    {
        // Simple efficiency calculation based on consistency
        $alkansyaConsistency = $alkansyaOutput->count() > 0 ? 
            (1 - ($alkansyaOutput->std('quantity_produced') / $alkansyaOutput->avg('quantity_produced'))) * 100 : 0;
        
        $orderCompletionRate = $madeToOrderOrders->count() > 0 ? 
            ($madeToOrderOrders->where('status', 'completed')->count() / $madeToOrderOrders->count()) * 100 : 0;

        return round(($alkansyaConsistency + $orderCompletionRate) / 2, 1);
    }

    private function calculateMaterialUtilization($alkansyaMaterials, $madeToOrderMaterials)
    {
        $totalAlkansyaCost = collect($alkansyaMaterials)->sum('total_cost');
        $totalMadeToOrderCost = collect($madeToOrderMaterials)->sum('total_cost');
        $totalCost = $totalAlkansyaCost + $totalMadeToOrderCost;

        return [
            'alkansya_percentage' => $totalCost > 0 ? round(($totalAlkansyaCost / $totalCost) * 100, 1) : 0,
            'made_to_order_percentage' => $totalCost > 0 ? round(($totalMadeToOrderCost / $totalCost) * 100, 1) : 0,
            'total_material_cost' => $totalCost
        ];
    }

    private function generateDailyProductionSummary($alkansyaOutput, $madeToOrderOrders, $startDate, $endDate)
    {
        $summary = [];
        $currentDate = Carbon::parse($startDate);
        $endDateParsed = Carbon::parse($endDate);

        // Index alkansya output by date string
        $alkansyaByDate = $alkansyaOutput->keyBy(function($output) {
            return $output->date->format('Y-m-d');
        });

        // Group orders by date
        $ordersByDate = $madeToOrderOrders->groupBy(function($order) {
            return Carbon::parse($order->created_at)->format('Y-m-d');
        });

        while ($currentDate->lte($endDateParsed)) {
            $dateStr = $currentDate->format('Y-m-d');
            
            $alkansyaForDate = $alkansyaByDate[$dateStr] ?? null;
            $ordersForDate = $ordersByDate[$dateStr] ?? collect();

            $summary[] = [
                'date' => $dateStr,
                'alkansya_units' => $alkansyaForDate ? $alkansyaForDate->quantity_produced : 0,
                'made_to_order_units' => $ordersForDate->sum(function($order) {
                    return $order->items->sum('quantity');
                }),
                'total_units' => ($alkansyaForDate ? $alkansyaForDate->quantity_produced : 0) + 
                    $ordersForDate->sum(function($order) {
                        return $order->items->sum('quantity');
                    }),
                'orders_count' => $ordersForDate->count()
            ];

            $currentDate->addDay();
        }

        return $summary;
    }

    /**
     * Get Alkansya daily output data for production reports
     */
    public function getAlkansyaProductionData(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

            // Get Alkansya daily output data - if no data in range, get all recent data
            $alkansyaOutput = AlkansyaDailyOutput::whereBetween('date', [$startDate, $endDate])
                ->orderBy('date', 'desc')
                ->get();
                
            // If no data in date range, get the most recent entries regardless of date
            if ($alkansyaOutput->isEmpty()) {
                $alkansyaOutput = AlkansyaDailyOutput::orderBy('date', 'desc')
                    ->take(30)
                    ->get();
            }

            // Get Alkansya products
            $alkansyaProducts = Product::where('name', 'Alkansya')
                ->get();

            // Calculate metrics
            $totalUnits = $alkansyaOutput->sum('quantity_produced');
            $totalDays = $alkansyaOutput->count();
            $avgDaily = $totalDays > 0 ? round($totalUnits / $totalDays, 2) : 0;
            $maxDaily = $alkansyaOutput->max('quantity_produced') ?? 0;
            $minDaily = $alkansyaOutput->min('quantity_produced') ?? 0;
            
            // Calculate production consistency (simplified version)
            $productionConsistency = 85; // Default value
            
            // Calculate recent trend
            $recentTrend = 'stable';
            if ($totalDays >= 7) {
                $recent = $alkansyaOutput->take(7)->avg('quantity_produced');
                $previous = $alkansyaOutput->skip(7)->take(7)->avg('quantity_produced');
                if ($recent > $previous * 1.1) $recentTrend = 'increasing';
                else if ($recent < $previous * 0.9) $recentTrend = 'decreasing';
            }

            $metrics = [
                'total_days' => $totalDays,
                'total_units_produced' => $totalUnits,
                'average_daily_output' => $avgDaily,
                'max_daily_output' => $maxDaily,
                'min_daily_output' => $minDaily,
                'production_consistency' => $productionConsistency,
                'recent_trend' => $recentTrend
            ];

            // Generate daily breakdown
            $dailyBreakdown = $alkansyaOutput->map(function($output) {
                // Calculate efficiency (assuming target is 20 units per day)
                $targetDaily = 20;
                $efficiency = $targetDaily > 0 ? round(($output->quantity_produced / $targetDaily) * 100, 1) : 0;
                
                return [
                    'date' => $output->date->format('Y-m-d'),
                    'quantity_produced' => $output->quantity_produced,
                    'produced_by' => $output->produced_by ?? 'N/A',
                    'day_of_week' => Carbon::parse($output->date)->format('l'),
                    'efficiency' => $efficiency,
                ];
            });

            // Generate weekly summary
            $weeklySummary = $alkansyaOutput->groupBy(function($output) {
                return Carbon::parse($output->date)->format('Y-W');
            })->map(function($group, $week) {
                return [
                    'week' => $week,
                    'total_produced' => $group->sum('quantity_produced'),
                    'avg_daily' => round($group->avg('quantity_produced'), 2),
                    'days' => $group->count()
                ];
            })->values();

            return response()->json([
                'metrics' => $metrics,
                'daily_breakdown' => $dailyBreakdown,
                'weekly_summary' => $weeklySummary,
                'products' => $alkansyaProducts,
                'product_info' => $alkansyaProducts->first() ? [
                    'id' => $alkansyaProducts->first()->id,
                    'name' => $alkansyaProducts->first()->name ?? 'Alkansya',
                    'description' => $alkansyaProducts->first()->description ?? 'Traditional Filipino wooden savings box',
                    'materials_count' => 12, // Fixed value for Alkansya materials
                    'unit_price' => $alkansyaProducts->first()->price ?? 0
                ] : null,
                'date_range' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in Alkansya production data: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch Alkansya production data: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get Made-to-Order production data for production reports
     */
    public function getMadeToOrderProductionData(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

            // Get accepted Made-to-Order orders
            $acceptedOrders = Order::whereBetween('created_at', [$startDate, $endDate])
                ->where('acceptance_status', 'accepted')
                ->with(['items.product'])
                ->get();

            // Get all Made-to-Order products
            $madeToOrderProducts = Product::where('category_name', 'Made-to-Order')
                ->get();

            // Filter to only orders with Made-to-Order products and calculate total products ordered
            $madeToOrderAcceptedOrders = $acceptedOrders->filter(function($order) {
                return $order->items->filter(function($item) {
                    return $item->product && $item->product->category_name === 'Made-to-Order';
                })->isNotEmpty();
            });
            
            $totalProducts = $madeToOrderAcceptedOrders->sum(function($order) {
                return $order->items->filter(function($item) {
                    return $item->product && $item->product->category_name === 'Made-to-Order';
                })->sum('quantity');
            });

            // Calculate metrics
            $totalRevenue = $madeToOrderAcceptedOrders->sum('total_amount');
            $avgOrderValue = $madeToOrderAcceptedOrders->count() > 0 ? $madeToOrderAcceptedOrders->avg('total_amount') : 0;
            $uniqueCustomers = $madeToOrderAcceptedOrders->pluck('customer_id')->unique()->count();
            
            // Calculate average products per order
            $totalOrdersCount = $madeToOrderAcceptedOrders->count();
            $avgProductsPerOrder = $totalOrdersCount > 0 ? round($totalProducts / $totalOrdersCount, 2) : 0;
            
            $metrics = [
                'total_accepted_orders' => $totalOrdersCount,
                'total_products_ordered' => $totalProducts,
                'total_revenue' => $totalRevenue,
                'average_order_value' => $avgOrderValue,
                'unique_customers' => $uniqueCustomers,
                'unique_products' => $madeToOrderProducts->count(),
                'average_products_per_order' => $avgProductsPerOrder
            ];

            // Generate daily order summary
            $dailyOrderSummary = $madeToOrderAcceptedOrders->groupBy(function($order) {
                return Carbon::parse($order->created_at)->format('Y-m-d');
            })->map(function($orders, $date) {
                return [
                    'date' => $date,
                    'orders_count' => $orders->count(),
                    'total_products' => $orders->sum(function($order) {
                        return $order->items->sum('quantity');
                    }),
                    'total_revenue' => $orders->sum('total_amount')
                ];
            })->values();

            // Generate customer analysis
            $customerAnalysis = [
                'total_customers' => $uniqueCustomers,
                'top_customers' => $madeToOrderAcceptedOrders->groupBy('customer_id')->map(function($orders) {
                    $customer = $orders->first();
                    return [
                        'customer_id' => $customer->customer_id,
                        'customer_name' => $customer->customer_name ?? 'Unknown',
                        'total_orders' => $orders->count(),
                        'total_spent' => $orders->sum('total_amount')
                    ];
                })->sortByDesc('total_spent')->take(5)->values()
            ];

            return response()->json([
                'metrics' => $metrics,
                'daily_order_summary' => $dailyOrderSummary,
                'customer_analysis' => $customerAnalysis,
                'recent_orders' => $madeToOrderAcceptedOrders->take(10)->map(function($order) {
                    return [
                        'id' => $order->id,
                        'customer_name' => $order->customer_name,
                        'customer_email' => $order->customer_email,
                        'total_amount' => $order->total_amount,
                        'status' => $order->acceptance_status,
                        'created_at' => $order->created_at->format('Y-m-d H:i:s'),
                        'items' => $order->items->map(function($item) {
                            return [
                                'product_name' => $item->product->name ?? 'Unknown',
                                'quantity' => $item->quantity,
                                'unit_price' => $item->unit_price,
                                'total_price' => $item->total_price
                            ];
                        })
                    ];
                }),
                'products' => $madeToOrderProducts,
                'date_range' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in Made-to-Order production data: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch Made-to-Order production data: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Get production output analytics
     */
    public function getProductionOutputAnalytics(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->subDays(30)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

            // Get Alkansya output - if no data in range, get all recent data
            $alkansyaOutput = AlkansyaDailyOutput::whereBetween('date', [$startDate, $endDate])
                ->orderBy('date')
                ->get();
                
            // If no data in date range, get the most recent entries
            if ($alkansyaOutput->isEmpty()) {
                $alkansyaOutput = AlkansyaDailyOutput::orderBy('date', 'desc')
                    ->take(30)
                    ->get();
            }

            // Get accepted Made-to-Order orders
            $madeToOrderOrders = Order::whereBetween('created_at', [$startDate, $endDate])
                ->where('acceptance_status', 'accepted')
                ->whereHas('items', function($query) {
                    $query->whereHas('product', function($q) {
                        $q->where('category_name', 'Made-to-Order');
                    });
                })
                ->with(['items.product'])
                ->get();

            // Calculate combined metrics
            $totalAlkansyaUnits = $alkansyaOutput->sum('quantity_produced');
            $totalMadeToOrderUnits = $madeToOrderOrders->sum(function($order) {
                return $order->items->sum('quantity');
            });

            $metrics = [
                'total_units_produced' => $totalAlkansyaUnits + $totalMadeToOrderUnits,
                'alkansya_units' => $totalAlkansyaUnits,
                'made_to_order_units' => $totalMadeToOrderUnits,
                'production_days' => $alkansyaOutput->count(),
                'order_days' => $madeToOrderOrders->groupBy(function($order) {
                    return $order->created_at->format('Y-m-d');
                })->count(),
                'average_daily_alkansya' => $alkansyaOutput->count() > 0 ? round($alkansyaOutput->avg('quantity_produced'), 2) : 0,
                'average_daily_orders' => $madeToOrderOrders->count() > 0 ? round($madeToOrderOrders->count() / max(1, Carbon::parse($startDate)->diffInDays(Carbon::parse($endDate))), 2) : 0
            ];

            // Generate daily production summary
            $dailySummary = [];
            $alkansyaByDate = $alkansyaOutput->keyBy(function($item) {
                return $item->date->format('Y-m-d');
            });
            
            $ordersByDate = $madeToOrderOrders->groupBy(function($order) {
                return $order->created_at->format('Y-m-d');
            });
            
            // Get all unique dates
            $alkansyaDates = $alkansyaOutput->map(function($output) {
                return $output->date->format('Y-m-d');
            })->toArray();
            
            $orderDates = $madeToOrderOrders->map(function($order) {
                return Carbon::parse($order->created_at)->format('Y-m-d');
            })->toArray();
            
            $allDates = collect(array_merge($alkansyaDates, $orderDates))->unique()->sort()->values();
            
            foreach ($allDates as $date) {
                $alkansyaData = $alkansyaByDate[$date] ?? null;
                $ordersForDay = $ordersByDate[$date] ?? collect();
                
                $dailySummary[] = [
                    'date' => $date,
                    'alkansya_units' => $alkansyaData ? $alkansyaData->quantity_produced : 0,
                    'made_to_order_units' => $ordersForDay->sum(function($order) {
                        return $order->items->sum('quantity');
                    }),
                    'total_units' => ($alkansyaData ? $alkansyaData->quantity_produced : 0) + 
                                    $ordersForDay->sum(function($order) {
                                        return $order->items->sum('quantity');
                                    })
                ];
            }

            // Generate weekly trends
            $weeklyTrends = [];
            $weekGroups = $alkansyaOutput->groupBy(function($output) {
                return Carbon::parse($output->date)->format('Y-W');
            });
            
            foreach ($weekGroups as $week => $outputs) {
                $weeklyTrends[] = [
                    'week' => $week,
                    'alkansya_units' => $outputs->sum('quantity_produced'),
                    'made_to_order_units' => 0, // Simplified
                    'total_units' => $outputs->sum('quantity_produced')
                ];
            }

            // Generate efficiency analysis
            $efficiencyAnalysis = [
                'alkansya_consistency' => 85,
                'order_completion_rate' => 100,
                'overall_efficiency' => 90,
                'production_stability' => 'high',
                'alkansya_trend' => 'increasing'
            ];

            return response()->json([
                'metrics' => $metrics,
                'daily_summary' => $dailySummary,
                'weekly_trends' => $weeklyTrends,
                'efficiency_analysis' => $efficiencyAnalysis,
                'date_range' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in production output analytics: ' . $e->getMessage());
            return response()->json(['error' => 'Failed to fetch production output analytics: ' . $e->getMessage()], 500);
        }
    }

    // Helper methods
    private function calculateProductionConsistency($alkansyaOutput)
    {
        if ($alkansyaOutput->count() < 2) return 0;
        
        $values = $alkansyaOutput->pluck('quantity_produced')->toArray();
        $mean = array_sum($values) / count($values);
        $variance = array_sum(array_map(function($x) use ($mean) { return pow($x - $mean, 2); }, $values)) / count($values);
        $stdDev = sqrt($variance);
        
        return $mean > 0 ? round((1 - ($stdDev / $mean)) * 100, 2) : 0;
    }

    private function calculateRecentTrend($alkansyaOutput)
    {
        if ($alkansyaOutput->count() < 7) return 'insufficient_data';
        
        $recent = $alkansyaOutput->take(7)->avg('quantity_produced');
        $previous = $alkansyaOutput->skip(7)->take(7)->avg('quantity_produced');
        
        if ($recent > $previous * 1.1) return 'increasing';
        if ($recent < $previous * 0.9) return 'decreasing';
        return 'stable';
    }

    private function calculateDailyEfficiency($output)
    {
        // Simple efficiency calculation based on target (assuming 20 units as target)
        $target = 20;
        return round(($output->quantity_produced / $target) * 100, 1);
    }

    private function getAlkansyaMaterialsConsumed($alkansyaProduct, $alkansyaOutput)
    {
        if (!$alkansyaProduct) return [];
        
        $totalOutput = $alkansyaOutput->sum('quantity_produced');
        $materials = [];
        
        foreach ($alkansyaProduct->productMaterials as $productMaterial) {
            $inventoryItem = $productMaterial->inventoryItem;
            $totalUsed = $totalOutput * $productMaterial->qty_per_unit;
            
            $materials[] = [
                'material_name' => $inventoryItem->name,
                'material_code' => $inventoryItem->sku,
                'quantity_consumed' => round($totalUsed, 2),
                'unit' => $inventoryItem->unit,
                'cost_per_unit' => $inventoryItem->unit_cost,
                'total_cost' => round($totalUsed * $inventoryItem->unit_cost, 2)
            ];
        }
        
        return $materials;
    }

    private function generateWeeklySummary($alkansyaOutput)
    {
        $weeklyData = [];
        $groupedByWeek = $alkansyaOutput->groupBy(function($output) {
            return Carbon::parse($output->date)->format('Y-W');
        });
        
        foreach ($groupedByWeek as $week => $outputs) {
            $weeklyData[] = [
                'week' => $week,
                'total_units' => $outputs->sum('quantity_produced'),
                'average_daily' => round($outputs->avg('quantity_produced'), 2),
                'production_days' => $outputs->count(),
                'max_daily' => $outputs->max('quantity_produced'),
                'min_daily' => $outputs->min('quantity_produced')
            ];
        }
        
        return $weeklyData;
    }

    private function generateMonthlyTrends($alkansyaOutput)
    {
        $monthlyData = [];
        $groupedByMonth = $alkansyaOutput->groupBy(function($output) {
            return Carbon::parse($output->date)->format('Y-m');
        });
        
        foreach ($groupedByMonth as $month => $outputs) {
            $monthlyData[] = [
                'month' => $month,
                'total_units' => $outputs->sum('quantity_produced'),
                'average_daily' => round($outputs->avg('quantity_produced'), 2),
                'production_days' => $outputs->count(),
                'trend' => $this->calculateMonthlyTrend($outputs)
            ];
        }
        
        return $monthlyData;
    }

    private function calculateMonthlyTrend($outputs)
    {
        if ($outputs->count() < 2) return 'insufficient_data';
        
        $firstHalf = $outputs->take(ceil($outputs->count() / 2))->avg('quantity_produced');
        $secondHalf = $outputs->skip(floor($outputs->count() / 2))->avg('quantity_produced');
        
        if ($secondHalf > $firstHalf * 1.1) return 'increasing';
        if ($secondHalf < $firstHalf * 0.9) return 'decreasing';
        return 'stable';
    }

    private function generateProductBreakdown($orders, $products)
    {
        $breakdown = [];
        
        foreach ($products as $product) {
            $productOrders = $orders->flatMap(function($order) use ($product) {
                return $order->items->where('product_id', $product->id);
            });
            
            $breakdown[] = [
                'product_id' => $product->id,
                'product_name' => $product->name,
                'total_ordered' => $productOrders->sum('quantity'),
                'total_revenue' => $productOrders->sum('total_price'),
                'order_count' => $productOrders->count(),
                'average_quantity_per_order' => $productOrders->count() > 0 ? 
                    round($productOrders->sum('quantity') / $productOrders->count(), 2) : 0
            ];
        }
        
        return collect($breakdown)->sortByDesc('total_ordered')->values();
    }

    private function generateCustomerAnalysis($orders)
    {
        $customerGroups = $orders->groupBy('customer_id');
        
        return [
            'total_customers' => $customerGroups->count(),
            'repeat_customers' => $customerGroups->filter(function($orders) {
                return $orders->count() > 1;
            })->count(),
            'new_customers' => $customerGroups->filter(function($orders) {
                return $orders->count() === 1;
            })->count(),
            'top_customers' => $customerGroups->map(function($orders, $customerId) {
                return [
                    'customer_id' => $customerId,
                    'customer_name' => $orders->first()->customer_name,
                    'order_count' => $orders->count(),
                    'total_spent' => $orders->sum('total_amount'),
                    'average_order_value' => round($orders->avg('total_amount'), 2)
                ];
            })->sortByDesc('total_spent')->take(5)->values()
        ];
    }

    private function generateDailyOrderSummary($orders, $startDate, $endDate)
    {
        $summary = [];
        $currentDate = Carbon::parse($startDate);
        $endDateParsed = Carbon::parse($endDate);
        
        while ($currentDate->lte($endDateParsed)) {
            $dateStr = $currentDate->format('Y-m-d');
            $dayOrders = $orders->filter(function($order) use ($dateStr) {
                return $order->created_at->format('Y-m-d') === $dateStr;
            });
            
            $summary[] = [
                'date' => $dateStr,
                'order_count' => $dayOrders->count(),
                'total_units' => $dayOrders->sum(function($order) {
                    return $order->items->whereHas('product', function($q) {
                        return $q->where('category_name', 'Made-to-Order');
                    })->sum('quantity');
                }),
                'total_revenue' => $dayOrders->sum('total_amount'),
                'unique_customers' => $dayOrders->pluck('customer_id')->unique()->count()
            ];
            
            $currentDate->addDay();
        }
        
        return $summary;
    }

    private function generateWeeklyProductionTrends($alkansyaOutput, $madeToOrderOrders)
    {
        $weeklyData = [];
        
        // Group Alkansya output by week
        $alkansyaByWeek = $alkansyaOutput->groupBy(function($output) {
            return Carbon::parse($output->date)->format('Y-W');
        });
        
        // Group orders by week
        $ordersByWeek = $madeToOrderOrders->groupBy(function($order) {
            return Carbon::parse($order->created_at)->format('Y-W');
        });
        
        // Get all unique weeks
        $allWeeks = $alkansyaByWeek->keys()->merge($ordersByWeek->keys())->unique()->sort();
        
        foreach ($allWeeks as $week) {
            $alkansyaUnits = $alkansyaByWeek[$week] ? $alkansyaByWeek[$week]->sum('quantity_produced') : 0;
            $orderUnits = $ordersByWeek[$week] ? $ordersByWeek[$week]->sum(function($order) {
                return $order->items->sum('quantity');
            }) : 0;
            
            $weeklyData[] = [
                'week' => $week,
                'alkansya_units' => $alkansyaUnits,
                'made_to_order_units' => $orderUnits,
                'total_units' => $alkansyaUnits + $orderUnits,
                'production_days' => $alkansyaByWeek[$week] ? $alkansyaByWeek[$week]->count() : 0,
                'order_days' => $ordersByWeek[$week] ? $ordersByWeek[$week]->groupBy(fn($o) => $o->created_at->format('Y-m-d'))->count() : 0
            ];
        }
        
        return $weeklyData;
    }

    private function generateEfficiencyAnalysis($alkansyaOutput, $madeToOrderOrders)
    {
        $alkansyaConsistency = $this->calculateProductionConsistency($alkansyaOutput);
        $orderCompletionRate = 100; // All orders are accepted, so 100% completion rate
        
        return [
            'alkansya_consistency' => $alkansyaConsistency,
            'order_completion_rate' => $orderCompletionRate,
            'overall_efficiency' => round(($alkansyaConsistency + $orderCompletionRate) / 2, 2),
            'alkansya_trend' => $this->calculateRecentTrend($alkansyaOutput),
            'production_stability' => $alkansyaConsistency > 80 ? 'high' : ($alkansyaConsistency > 60 ? 'medium' : 'low')
        ];
    }
}
