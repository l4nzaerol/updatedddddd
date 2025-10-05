<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SalesAnalyticsController extends Controller
{
    /**
     * Get comprehensive sales dashboard data
     */
    public function getSalesDashboard(Request $request)
    {
        $startDate = $request->get('start_date', Carbon::now()->subMonths(3)->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));
        $timeframe = $request->get('timeframe', 'daily'); // daily, weekly, monthly

        // Overall sales metrics - include all orders for comprehensive reporting
        $totalRevenue = Order::whereBetween('checkout_date', [$startDate, $endDate])
            ->sum('total_price');

        $totalOrders = Order::whereBetween('checkout_date', [$startDate, $endDate])->count();
        $paidOrders = Order::whereBetween('checkout_date', [$startDate, $endDate])
            ->where('payment_status', 'paid')
            ->count();
        $pendingOrders = Order::whereBetween('checkout_date', [$startDate, $endDate])
            ->whereIn('payment_status', ['cod_pending', 'pending'])
            ->count();

        // Average order value - calculate based on all orders
        $averageOrderValue = $totalOrders > 0 ? $totalRevenue / $totalOrders : 0;

        // Revenue trends
        $revenueTrends = $this->getRevenueTrends($startDate, $endDate, $timeframe);

        // Top selling products
        $topProducts = $this->getTopSellingProducts($startDate, $endDate);

        // Sales by status
        $salesByStatus = $this->getSalesByStatus($startDate, $endDate);

        // Payment method analysis
        $paymentMethodAnalysis = $this->getPaymentMethodAnalysis($startDate, $endDate);

        // Customer analysis
        $customerAnalysis = $this->getCustomerAnalysis($startDate, $endDate);

        // Monthly comparison
        $monthlyComparison = $this->getMonthlyComparison();

        return response()->json([
            'overview' => [
                'total_revenue' => $totalRevenue,
                'total_orders' => $totalOrders,
                'paid_orders' => $paidOrders,
                'pending_orders' => $pendingOrders,
                'average_order_value' => round($averageOrderValue, 2),
                'conversion_rate' => $totalOrders > 0 ? round(($paidOrders / $totalOrders) * 100, 2) : 0
            ],
            'revenue_trends' => $revenueTrends,
            'top_products' => $topProducts,
            'sales_by_status' => $salesByStatus,
            'payment_method_analysis' => $paymentMethodAnalysis,
            'customer_analysis' => $customerAnalysis,
            'monthly_comparison' => $monthlyComparison,
            'timeframe' => $timeframe,
            'date_range' => [
                'start_date' => $startDate,
                'end_date' => $endDate
            ]
        ]);
    }

    /**
     * Get revenue trends over time
     */
    private function getRevenueTrends($startDate, $endDate, $timeframe)
    {
        $query = Order::select(
                DB::raw('DATE(checkout_date) as date'),
                DB::raw('SUM(total_price) as revenue'),
                DB::raw('COUNT(*) as orders')
            )
            ->whereBetween('checkout_date', [$startDate, $endDate])
            ->groupBy(DB::raw('DATE(checkout_date)'))
            ->orderBy('date');

        if ($timeframe === 'weekly') {
            $query = Order::select(
                    DB::raw('YEAR(checkout_date) as year'),
                    DB::raw('WEEK(checkout_date) as week'),
                    DB::raw('SUM(total_price) as revenue'),
                    DB::raw('COUNT(*) as orders')
                )
                ->whereBetween('checkout_date', [$startDate, $endDate])
                ->groupBy(DB::raw('YEAR(checkout_date)'), DB::raw('WEEK(checkout_date)'))
                ->orderBy('year', 'week');
        } elseif ($timeframe === 'monthly') {
            $query = Order::select(
                    DB::raw('YEAR(checkout_date) as year'),
                    DB::raw('MONTH(checkout_date) as month'),
                    DB::raw('SUM(total_price) as revenue'),
                    DB::raw('COUNT(*) as orders')
                )
                ->whereBetween('checkout_date', [$startDate, $endDate])
                ->groupBy(DB::raw('YEAR(checkout_date)'), DB::raw('MONTH(checkout_date)'))
                ->orderBy('year', 'month');
        }

        return $query->get();
    }

    /**
     * Get top selling products
     */
    private function getTopSellingProducts($startDate, $endDate)
    {
        return OrderItem::select(
                'products.name',
                'products.price',
                DB::raw('SUM(order_items.quantity) as total_quantity'),
                DB::raw('SUM(order_items.quantity * order_items.price) as total_revenue'),
                DB::raw('COUNT(DISTINCT order_items.order_id) as order_count')
            )
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->whereBetween('orders.checkout_date', [$startDate, $endDate])
            ->groupBy('products.id', 'products.name', 'products.price')
            ->orderBy('total_quantity', 'desc')
            ->limit(10)
            ->get();
    }

    /**
     * Get sales by status
     */
    private function getSalesByStatus($startDate, $endDate)
    {
        return Order::select(
                'status',
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(total_price) as revenue')
            )
            ->whereBetween('checkout_date', [$startDate, $endDate])
            ->groupBy('status')
            ->get();
    }

    /**
     * Get payment method analysis
     */
    private function getPaymentMethodAnalysis($startDate, $endDate)
    {
        return Order::select(
                'payment_method',
                DB::raw('COUNT(*) as count'),
                DB::raw('SUM(total_price) as revenue'),
                DB::raw('AVG(total_price) as average_value')
            )
            ->whereBetween('checkout_date', [$startDate, $endDate])
            ->groupBy('payment_method')
            ->get();
    }

    /**
     * Get customer analysis
     */
    private function getCustomerAnalysis($startDate, $endDate)
    {
        // New vs returning customers
        $newCustomers = User::whereBetween('created_at', [$startDate, $endDate])
            ->whereHas('orders', function($query) use ($startDate, $endDate) {
                $query->whereBetween('checkout_date', [$startDate, $endDate]);
            })
            ->count();

        $returningCustomers = User::where('created_at', '<', $startDate)
            ->whereHas('orders', function($query) use ($startDate, $endDate) {
                $query->whereBetween('checkout_date', [$startDate, $endDate]);
            })
            ->count();

        // Customer lifetime value
        $customerLifetimeValue = User::select(
                DB::raw('AVG(customer_total.total_spent) as avg_lifetime_value')
            )
            ->joinSub(
                Order::select('user_id', DB::raw('SUM(total_price) as total_spent'))
                    ->groupBy('user_id'),
                'customer_total',
                'users.id',
                '=',
                'customer_total.user_id'
            )
            ->first();

        return [
            'new_customers' => $newCustomers,
            'returning_customers' => $returningCustomers,
            'total_customers' => $newCustomers + $returningCustomers,
            'avg_lifetime_value' => $customerLifetimeValue->avg_lifetime_value ?? 0
        ];
    }

    /**
     * Get monthly comparison
     */
    private function getMonthlyComparison()
    {
        $currentMonth = Carbon::now()->startOfMonth();
        $lastMonth = Carbon::now()->subMonth()->startOfMonth();

        $currentMonthData = Order::whereBetween('checkout_date', [
                $currentMonth,
                $currentMonth->copy()->endOfMonth()
            ])
            ->select(
                DB::raw('SUM(total_price) as revenue'),
                DB::raw('COUNT(*) as orders')
            )
            ->first();

        $lastMonthData = Order::whereBetween('checkout_date', [
                $lastMonth,
                $lastMonth->copy()->endOfMonth()
            ])
            ->select(
                DB::raw('SUM(total_price) as revenue'),
                DB::raw('COUNT(*) as orders')
            )
            ->first();

        $revenueGrowth = $lastMonthData->revenue > 0 
            ? (($currentMonthData->revenue - $lastMonthData->revenue) / $lastMonthData->revenue) * 100 
            : 0;

        $ordersGrowth = $lastMonthData->orders > 0 
            ? (($currentMonthData->orders - $lastMonthData->orders) / $lastMonthData->orders) * 100 
            : 0;

        return [
            'current_month' => [
                'revenue' => $currentMonthData->revenue ?? 0,
                'orders' => $currentMonthData->orders ?? 0
            ],
            'last_month' => [
                'revenue' => $lastMonthData->revenue ?? 0,
                'orders' => $lastMonthData->orders ?? 0
            ],
            'growth' => [
                'revenue_growth' => round($revenueGrowth, 2),
                'orders_growth' => round($ordersGrowth, 2)
            ]
        ];
    }

    /**
     * Get detailed sales report
     */
    public function getSalesReport(Request $request)
    {
        $startDate = $request->get('start_date', Carbon::now()->subMonths(1)->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));
        $status = $request->get('status', 'all');
        $paymentStatus = $request->get('payment_status', 'all');

        $query = Order::with(['user', 'items.product'])
            ->whereBetween('checkout_date', [$startDate, $endDate]);

        if ($status !== 'all') {
            $query->where('status', $status);
        }

        if ($paymentStatus !== 'all') {
            $query->where('payment_status', $paymentStatus);
        }

        $orders = $query->orderBy('checkout_date', 'desc')->get();

        // Calculate summary statistics - include all orders
        $summary = [
            'total_orders' => $orders->count(),
            'total_revenue' => $orders->sum('total_price'),
            'paid_orders' => $orders->where('payment_status', 'paid')->count(),
            'pending_orders' => $orders->whereIn('payment_status', ['cod_pending', 'pending'])->count(),
            'average_order_value' => $orders->avg('total_price') ?? 0
        ];

        return response()->json([
            'orders' => $orders,
            'summary' => $summary,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'status' => $status,
                'payment_status' => $paymentStatus
            ]
        ]);
    }

    /**
     * Get sales process analytics
     */
    public function getSalesProcessAnalytics(Request $request)
    {
        $startDate = $request->get('start_date', Carbon::now()->subMonths(3)->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

        // Order funnel analysis
        $orderFunnel = [
            'total_orders' => Order::whereBetween('checkout_date', [$startDate, $endDate])->count(),
            'pending_orders' => Order::whereBetween('checkout_date', [$startDate, $endDate])
                ->where('status', 'pending')->count(),
            'processing_orders' => Order::whereBetween('checkout_date', [$startDate, $endDate])
                ->where('status', 'processing')->count(),
            'completed_orders' => Order::whereBetween('checkout_date', [$startDate, $endDate])
                ->where('status', 'completed')->count(),
            'delivered_orders' => Order::whereBetween('checkout_date', [$startDate, $endDate])
                ->where('status', 'delivered')->count()
        ];

        // Payment funnel analysis
        $paymentFunnel = [
            'unpaid_orders' => Order::whereBetween('checkout_date', [$startDate, $endDate])
                ->where('payment_status', 'unpaid')->count(),
            'paid_orders' => Order::whereBetween('checkout_date', [$startDate, $endDate])
                ->where('payment_status', 'paid')->count(),
            'cod_pending_orders' => Order::whereBetween('checkout_date', [$startDate, $endDate])
                ->where('payment_status', 'cod_pending')->count(),
            'failed_payments' => Order::whereBetween('checkout_date', [$startDate, $endDate])
                ->where('payment_status', 'failed')->count()
        ];

        // Time to payment analysis
        $timeToPayment = Order::whereBetween('checkout_date', [$startDate, $endDate])
            ->where('payment_status', 'paid')
            ->whereNotNull('accepted_at')
            ->select(
                DB::raw('AVG(TIMESTAMPDIFF(HOUR, checkout_date, accepted_at)) as avg_hours_to_payment')
            )
            ->first();

        // Order completion time analysis
        $completionTime = Order::whereBetween('checkout_date', [$startDate, $endDate])
            ->where('status', 'completed')
            ->whereNotNull('accepted_at')
            ->select(
                DB::raw('AVG(TIMESTAMPDIFF(DAY, accepted_at, updated_at)) as avg_days_to_completion')
            )
            ->first();

        return response()->json([
            'order_funnel' => $orderFunnel,
            'payment_funnel' => $paymentFunnel,
            'time_to_payment' => $timeToPayment->avg_hours_to_payment ?? 0,
            'completion_time' => $completionTime->avg_days_to_completion ?? 0,
            'date_range' => [
                'start_date' => $startDate,
                'end_date' => $endDate
            ]
        ]);
    }

    /**
     * Get product performance analytics
     */
    public function getProductPerformance(Request $request)
    {
        try {
            $startDate = $request->get('start_date', Carbon::now()->subMonths(3)->format('Y-m-d'));
            $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));

            $productPerformance = OrderItem::select(
                    'products.id',
                    'products.name',
                    'products.price',
                    DB::raw('SUM(order_items.quantity) as total_sold'),
                    DB::raw('SUM(order_items.quantity * order_items.price) as total_revenue'),
                    DB::raw('COUNT(DISTINCT order_items.order_id) as order_count'),
                    DB::raw('AVG(order_items.quantity) as avg_quantity_per_order')
                )
                ->join('orders', 'order_items.order_id', '=', 'orders.id')
                ->join('products', 'order_items.product_id', '=', 'products.id')
                ->whereBetween('orders.checkout_date', [$startDate, $endDate])
                ->groupBy('products.id', 'products.name', 'products.price')
                ->orderBy('total_revenue', 'desc')
                ->get();

            // Category analysis - simplified since products table doesn't have category column
            $categoryAnalysis = collect([
                [
                    'category' => 'Furniture',
                    'total_sold' => $productPerformance->sum('total_sold'),
                    'total_revenue' => $productPerformance->sum('total_revenue'),
                    'order_count' => $productPerformance->sum('order_count')
                ]
            ]);


            return response()->json([
                'product_performance' => $productPerformance,
                'category_analysis' => $categoryAnalysis,
                'date_range' => [
                    'start_date' => $startDate,
                    'end_date' => $endDate
                ]
            ]);
        } catch (\Exception $e) {
            \Log::error('Product Performance Error', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'error' => 'Failed to load product performance data',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Export sales data to CSV
     */
    public function exportSalesData(Request $request)
    {
        $startDate = $request->get('start_date', Carbon::now()->subMonths(1)->format('Y-m-d'));
        $endDate = $request->get('end_date', Carbon::now()->format('Y-m-d'));
        $format = $request->get('format', 'csv');

        $orders = Order::with(['user', 'items.product'])
            ->whereBetween('checkout_date', [$startDate, $endDate])
            ->orderBy('checkout_date', 'desc')
            ->get();

        if ($format === 'csv') {
            $csvData = [];
            $csvData[] = ['Order ID', 'Customer', 'Date', 'Status', 'Payment Status', 'Total', 'Items'];

            foreach ($orders as $order) {
                $items = $order->items->map(function($item) {
                    return $item->product->name . ' (x' . $item->quantity . ')';
                })->join(', ');

                $csvData[] = [
                    $order->id,
                    $order->user->name ?? 'Unknown',
                    $order->checkout_date->format('Y-m-d H:i:s'),
                    $order->status,
                    $order->payment_status,
                    $order->total_price,
                    $items
                ];
            }

            $csvContent = '';
            foreach ($csvData as $row) {
                $csvContent .= implode(',', array_map(function($field) {
                    return '"' . str_replace('"', '""', $field) . '"';
                }, $row)) . "\n";
            }

            return response($csvContent)
                ->header('Content-Type', 'text/csv')
                ->header('Content-Disposition', 'attachment; filename="sales_report_' . $startDate . '_to_' . $endDate . '.csv"');
        }

        return response()->json(['message' => 'Unsupported format']);
    }
}
