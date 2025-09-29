<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderTracking;
use App\Models\Product;
use Carbon\Carbon;

class CustomerOrdersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Find or create the customer user
        $customer = User::firstOrCreate(
            ['email' => 'customer@gmail.com'],
            [
                'name' => 'John Customer',
                'email' => 'customer@gmail.com',
                'password' => bcrypt('password'),
                'role' => 'customer',
                'email_verified_at' => now(),
            ]
        );

        // Get products
        $alkansya = Product::where('name', 'Alkansya')->first();
        $diningTable = Product::where('name', 'Dining Table')->first();
        $woodenChair = Product::where('name', 'Wooden Chair')->first();

        if (!$alkansya || !$diningTable || !$woodenChair) {
            $this->command->error('Required products not found. Please run ProductsTableSeeder first.');
            return;
        }

        $this->command->info('Creating sample orders for customer@gmail.com...');

        // Create orders with different progress levels
        $this->createOrderWithProgress($customer, $alkansya, 2, 'completed', 'Ready for Delivery', 100, 0);
        $this->createOrderWithProgress($customer, $diningTable, 1, 'in_production', 'Assembly', 65, 5);
        $this->createOrderWithProgress($customer, $woodenChair, 3, 'in_production', 'Finishing', 45, 10);
        $this->createOrderWithProgress($customer, $alkansya, 1, 'pending', 'Design', 15, 15);
        $this->createOrderWithProgress($customer, $diningTable, 2, 'pending', 'Planning', 0, 20);

        $this->command->info('Sample orders created successfully!');
    }

    private function createOrderWithProgress($customer, $product, $quantity, $status, $currentStage, $progress, $daysAgo)
    {
        // Create order
        $order = Order::create([
            'user_id' => $customer->id,
            'total_price' => $product->price * $quantity,
            'status' => $status === 'completed' ? 'completed' : 'pending',
            'checkout_date' => now()->subDays($daysAgo),
            'payment_method' => 'cod',
            'payment_status' => 'paid',
            'shipping_address' => '123 Customer Street, City, Province',
            'contact_phone' => '+63 912 345 6789',
            'created_at' => now()->subDays($daysAgo),
            'updated_at' => now()->subDays($daysAgo),
        ]);

        // Create order item
        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => $quantity,
            'price' => $product->price,
        ]);

        // Create order tracking
        $trackingType = $product->name === 'Alkansya' ? 'alkansya' : 'custom';
        $estimatedStart = now()->subDays($daysAgo);
        $estimatedCompletion = $estimatedStart->copy()->addWeeks($trackingType === 'alkansya' ? 1 : 2);

        $tracking = OrderTracking::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'tracking_type' => $trackingType,
            'current_stage' => $currentStage,
            'status' => $status,
            'estimated_start_date' => $estimatedStart,
            'estimated_completion_date' => $estimatedCompletion,
            'actual_start_date' => $status !== 'pending' ? $estimatedStart : null,
            'actual_completion_date' => $status === 'completed' ? now()->subDays($daysAgo - 2) : null,
            'process_timeline' => $this->generateProcessTimeline($trackingType, $currentStage, $status, $progress),
            'created_at' => now()->subDays($daysAgo),
            'updated_at' => now()->subDays($daysAgo),
        ]);

        $this->command->info("Created order #{$order->id} - {$product->name} x{$quantity} - {$status} - {$currentStage} - {$progress}%");
    }

    private function generateProcessTimeline($trackingType, $currentStage, $status, $progress)
    {
        if ($trackingType === 'alkansya') {
            $stages = [
                ['stage' => 'Design', 'description' => 'Creating design specifications', 'estimated_duration' => '30 minutes'],
                ['stage' => 'Preparation', 'description' => 'Preparing materials and tools', 'estimated_duration' => '45 minutes'],
                ['stage' => 'Cutting', 'description' => 'Cutting wood to specifications', 'estimated_duration' => '60 minutes'],
                ['stage' => 'Assembly', 'description' => 'Assembling components', 'estimated_duration' => '90 minutes'],
                ['stage' => 'Finishing', 'description' => 'Applying finish and polish', 'estimated_duration' => '45 minutes'],
                ['stage' => 'Quality Control', 'description' => 'Final inspection and testing', 'estimated_duration' => '30 minutes'],
            ];
        } else {
            $stages = [
                ['stage' => 'Planning', 'description' => 'Detailed planning and design', 'estimated_duration' => '2-3 days'],
                ['stage' => 'Material Selection', 'description' => 'Selecting high-quality materials', 'estimated_duration' => '1 day'],
                ['stage' => 'Cutting and Shaping', 'description' => 'Precise cutting and shaping', 'estimated_duration' => '3-4 days'],
                ['stage' => 'Assembly', 'description' => 'Careful assembly process', 'estimated_duration' => '4-5 days'],
                ['stage' => 'Finishing', 'description' => 'Professional finishing', 'estimated_duration' => '2-3 days'],
                ['stage' => 'Quality Assurance', 'description' => 'Comprehensive quality check', 'estimated_duration' => '1 day'],
            ];
        }

        $currentStageIndex = array_search($currentStage, array_column($stages, 'stage'));
        if ($currentStageIndex === false) {
            $currentStageIndex = 0;
        }

        return array_map(function($stage, $index) use ($currentStage, $status, $currentStageIndex) {
            $stageStatus = 'pending';
            
            if ($index < $currentStageIndex) {
                $stageStatus = 'completed';
            } elseif ($index === $currentStageIndex && $status === 'in_progress') {
                $stageStatus = 'in_progress';
            } elseif ($index === $currentStageIndex && $status === 'completed') {
                $stageStatus = 'completed';
            }

            return [
                'stage' => $stage['stage'],
                'description' => $stage['description'],
                'estimated_duration' => $stage['estimated_duration'],
                'status' => $stageStatus,
            ];
        }, $stages, array_keys($stages));
    }
}
