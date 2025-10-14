<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\OrderTracking;
use Carbon\Carbon;

class ManualOrdersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates realistic manual orders for the past 3 months
     */
    public function run(): void
    {
        $this->command->info('🛒 Seeding 3 months of manual orders data...');

        // Get products
        $alkansya = Product::where('name', 'Alkansya')->first();
        $diningTable = Product::where('name', 'Dining Table')->first();
        $woodenChair = Product::where('name', 'Wooden Chair')->first();

        if (!$alkansya || !$diningTable || !$woodenChair) {
            $this->command->error('❌ Products not found. Please run ProductSeeder first.');
            return;
        }

        // Create orders for the past 3 months
        $startDate = Carbon::now()->subDays(90);
        $endDate = Carbon::now();

        $this->command->info("📅 Creating orders from {$startDate->format('Y-m-d')} to {$endDate->format('Y-m-d')}");

        $totalOrders = 0;
        $currentDate = $startDate->copy();

        while ($currentDate->lte($endDate)) {
            // Create 0-3 orders per day (more on weekdays)
            $ordersPerDay = $this->getOrdersPerDay($currentDate);
            
            for ($i = 0; $i < $ordersPerDay; $i++) {
                $this->createOrder($currentDate, $alkansya, $diningTable, $woodenChair);
                $totalOrders++;
            }
            
            $currentDate->addDay();
        }

        $this->command->info("✅ Created {$totalOrders} manual orders");
    }

    /**
     * Get number of orders for a specific day
     */
    private function getOrdersPerDay($date)
    {
        $dayOfWeek = $date->dayOfWeek;
        $month = $date->month;
        
        // More orders on weekdays
        $baseOrders = [
            0 => rand(0, 1), // Sunday
            1 => rand(1, 3), // Monday
            2 => rand(1, 4), // Tuesday
            3 => rand(1, 4), // Wednesday
            4 => rand(1, 3), // Thursday
            5 => rand(0, 2), // Friday
            6 => rand(0, 1), // Saturday
        ];

        $orders = $baseOrders[$dayOfWeek];

        // Seasonal adjustments
        if ($month >= 11 || $month <= 2) {
            // Winter months - more orders
            $orders = min(5, $orders + rand(0, 2));
        } elseif ($month >= 6 && $month <= 8) {
            // Summer months - fewer orders
            $orders = max(0, $orders - rand(0, 1));
        }

        return $orders;
    }

    /**
     * Create a single order
     */
    private function createOrder($date, $alkansya, $diningTable, $woodenChair)
    {
        $customer = $this->getRandomCustomer();
        $orderType = $this->getOrderType();
        
        // Create order
        $order = Order::create([
            'customer_name' => $customer['name'],
            'customer_email' => $customer['email'],
            'customer_phone' => $customer['phone'],
            'customer_address' => $customer['address'],
            'status' => $this->getOrderStatus($date),
            'total_amount' => 0, // Will be calculated
            'payment_status' => $this->getPaymentStatus(),
            'notes' => $this->generateOrderNotes($orderType),
            'created_at' => $date->copy()->addHours(rand(8, 17))->addMinutes(rand(0, 59)),
        ]);

        // Create order items
        $totalAmount = 0;
        $items = $this->getOrderItems($orderType, $alkansya, $diningTable, $woodenChair);

        foreach ($items as $item) {
            $orderItem = OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $item['product_id'],
                'quantity' => $item['quantity'],
                'unit_price' => $item['unit_price'],
                'total_price' => $item['quantity'] * $item['unit_price'],
            ]);

            $totalAmount += $orderItem->total_price;
        }

        // Update order total
        $order->update(['total_amount' => $totalAmount]);

        // Create order tracking
        $this->createOrderTracking($order, $date);

        return $order;
    }

    /**
     * Get random customer data
     */
    private function getRandomCustomer()
    {
        $customers = [
            ['name' => 'Juan Dela Cruz', 'email' => 'juan.delacruz@email.com', 'phone' => '09123456789', 'address' => '123 Main St, Quezon City'],
            ['name' => 'Maria Santos', 'email' => 'maria.santos@email.com', 'phone' => '09234567890', 'address' => '456 Oak Ave, Makati City'],
            ['name' => 'Pedro Garcia', 'email' => 'pedro.garcia@email.com', 'phone' => '09345678901', 'address' => '789 Pine St, Manila'],
            ['name' => 'Ana Rodriguez', 'email' => 'ana.rodriguez@email.com', 'phone' => '09456789012', 'address' => '321 Elm St, Taguig City'],
            ['name' => 'Carlos Lopez', 'email' => 'carlos.lopez@email.com', 'phone' => '09567890123', 'address' => '654 Maple Dr, Pasig City'],
            ['name' => 'Elena Martinez', 'email' => 'elena.martinez@email.com', 'phone' => '09678901234', 'address' => '987 Cedar Ln, Mandaluyong City'],
            ['name' => 'Roberto Silva', 'email' => 'roberto.silva@email.com', 'phone' => '09789012345', 'address' => '147 Birch St, San Juan City'],
            ['name' => 'Carmen Flores', 'email' => 'carmen.flores@email.com', 'phone' => '09890123456', 'address' => '258 Spruce Ave, Marikina City'],
        ];

        return $customers[array_rand($customers)];
    }

    /**
     * Get order type (Alkansya only, MTO only, or mixed)
     */
    private function getOrderType()
    {
        $types = ['alkansya_only', 'mto_only', 'mixed'];
        $weights = [40, 30, 30]; // 40% Alkansya only, 30% MTO only, 30% mixed
        
        $random = rand(1, 100);
        $cumulative = 0;
        
        foreach ($weights as $index => $weight) {
            $cumulative += $weight;
            if ($random <= $cumulative) {
                return $types[$index];
            }
        }
        
        return 'alkansya_only';
    }

    /**
     * Get order items based on order type
     */
    private function getOrderItems($orderType, $alkansya, $diningTable, $woodenChair)
    {
        $items = [];

        switch ($orderType) {
            case 'alkansya_only':
                $items[] = [
                    'product_id' => $alkansya->id,
                    'quantity' => rand(1, 10),
                    'unit_price' => $alkansya->price,
                ];
                break;

            case 'mto_only':
                $mtoProducts = [$diningTable, $woodenChair];
                $selectedProduct = $mtoProducts[array_rand($mtoProducts)];
                $items[] = [
                    'product_id' => $selectedProduct->id,
                    'quantity' => rand(1, 3),
                    'unit_price' => $selectedProduct->price,
                ];
                break;

            case 'mixed':
                // Alkansya + one MTO product
                $items[] = [
                    'product_id' => $alkansya->id,
                    'quantity' => rand(1, 5),
                    'unit_price' => $alkansya->price,
                ];
                
                $mtoProducts = [$diningTable, $woodenChair];
                $selectedProduct = $mtoProducts[array_rand($mtoProducts)];
                $items[] = [
                    'product_id' => $selectedProduct->id,
                    'quantity' => rand(1, 2),
                    'unit_price' => $selectedProduct->price,
                ];
                break;
        }

        return $items;
    }

    /**
     * Get order status based on date
     */
    private function getOrderStatus($date)
    {
        $daysAgo = Carbon::now()->diffInDays($date);
        
        if ($daysAgo > 30) {
            // Old orders - mostly completed
            $statuses = ['completed', 'completed', 'completed', 'shipped', 'in_production'];
        } elseif ($daysAgo > 14) {
            // Medium age orders - various statuses
            $statuses = ['completed', 'shipped', 'in_production', 'in_production', 'pending'];
        } else {
            // Recent orders - mostly pending/in_production
            $statuses = ['pending', 'pending', 'in_production', 'in_production', 'shipped'];
        }

        return $statuses[array_rand($statuses)];
    }

    /**
     * Get payment status
     */
    private function getPaymentStatus()
    {
        $statuses = ['paid', 'paid', 'paid', 'pending', 'partial'];
        return $statuses[array_rand($statuses)];
    }

    /**
     * Generate order notes
     */
    private function generateOrderNotes($orderType)
    {
        $notes = [];

        if ($orderType === 'mto_only') {
            $notes[] = "Made-to-order product";
            $notes[] = "Custom specifications required";
        } elseif ($orderType === 'mixed') {
            $notes[] = "Mixed order - standard and custom items";
        } else {
            $notes[] = "Standard Alkansya order";
        }

        $randomNotes = [
            "Rush order - expedite production",
            "Standard delivery timeline",
            "Customer prefers morning delivery",
            "Contact customer before delivery",
            "Quality check required",
            "Bulk order discount applied",
            "Repeat customer",
            "New customer - welcome package",
        ];

        if (rand(1, 3) === 1) {
            $notes[] = $randomNotes[array_rand($randomNotes)];
        }

        return implode('. ', $notes);
    }

    /**
     * Create order tracking
     */
    private function createOrderTracking($order, $date)
    {
        $statuses = ['pending', 'confirmed', 'in_production', 'quality_check', 'shipped', 'delivered'];
        $currentStatus = $order->status;
        $statusIndex = array_search($currentStatus, $statuses);
        
        if ($statusIndex === false) {
            $statusIndex = 0;
        }

        // Create tracking entries for all statuses up to current
        for ($i = 0; $i <= $statusIndex; $i++) {
            $statusDate = $date->copy()->addDays($i * 2)->addHours(rand(8, 17));
            
            OrderTracking::create([
                'order_id' => $order->id,
                'status' => $statuses[$i],
                'notes' => $this->getStatusNotes($statuses[$i]),
                'updated_at' => $statusDate,
                'created_at' => $statusDate,
            ]);
        }
    }

    /**
     * Get status-specific notes
     */
    private function getStatusNotes($status)
    {
        $notes = [
            'pending' => 'Order received and being processed',
            'confirmed' => 'Order confirmed and payment verified',
            'in_production' => 'Production has started',
            'quality_check' => 'Quality control in progress',
            'shipped' => 'Order shipped to customer',
            'delivered' => 'Order delivered successfully',
        ];

        return $notes[$status] ?? 'Status updated';
    }
}
