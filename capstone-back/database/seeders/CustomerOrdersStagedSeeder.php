<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\OrderTracking;
use App\Models\Product;
use App\Models\Production;
use App\Models\ProductionProcess;
use Carbon\Carbon;

class CustomerOrdersStagedSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $customer = User::firstOrCreate(
            ['email' => 'staged.customer@example.com'],
            [
                'name' => 'Staged Customer',
                'password' => bcrypt('password'),
                'role' => 'customer',
                'email_verified_at' => now(),
            ]
        );

        $table = Product::where('name', 'Dining Table')->first();
        $chair = Product::where('name', 'Wooden Chair')->first();
        if (!$table || !$chair) {
            $this->command->error('Products Dining Table / Wooden Chair not found. Run ProductsTableSeeder first.');
            return;
        }

        // Define the 6 aligned stages
        $stages = [
            'Material Preparation',
            'Cutting & Shaping',
            'Assembly',
            'Sanding & Surface Preparation',
            'Finishing',
            'Quality Check & Packaging',
        ];

        // Create 6 orders each locked to a different current stage
        $products = [ $table, $chair ];
        $now = Carbon::now();

        foreach ($products as $product) {
            foreach ($stages as $idx => $currentStage) {
                $daysAgo = 10 - $idx; // staggered start dates
                $quantity = $product->name === 'Dining Table' ? 1 : 2;
                $status = $currentStage === 'Quality Check & Packaging' ? 'in_production' : 'in_production';

                // Create order
                $order = Order::create([
                    'user_id' => $customer->id,
                    'total_price' => $product->price * $quantity,
                    'status' => 'pending',
                    'checkout_date' => $now->copy()->subDays($daysAgo),
                    'payment_method' => 'cod',
                    'payment_status' => 'paid',
                    'shipping_address' => '456 Test Avenue, City',
                    'contact_phone' => '+63 900 000 0000',
                    'created_at' => $now->copy()->subDays($daysAgo),
                    'updated_at' => $now->copy()->subDays($daysAgo),
                ]);

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'quantity' => $quantity,
                    'price' => $product->price,
                ]);

                // Tracking aligned to production stages
                $estimatedStart = $now->copy()->subDays($daysAgo);
                $estimatedCompletion = $estimatedStart->copy()->addWeeks(2);

                OrderTracking::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'tracking_type' => 'custom',
                    'current_stage' => $currentStage,
                    'status' => $status,
                    'estimated_start_date' => $estimatedStart,
                    'estimated_completion_date' => $estimatedCompletion,
                    'actual_start_date' => $estimatedStart,
                    'process_timeline' => $this->buildAlignedTimeline($currentStage),
                ]);

                // Create production and processes
                $production = Production::create([
                    'order_id' => $order->id,
                    'user_id' => $customer->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'date' => $estimatedStart->toDateString(),
                    'current_stage' => $currentStage,
                    'status' => 'In Progress',
                    'quantity' => $quantity,
                    'priority' => 'medium',
                    'requires_tracking' => true,
                    'product_type' => $product->name === 'Dining Table' ? 'table' : 'chair',
                    'production_started_at' => $estimatedStart,
                    'estimated_completion_date' => $estimatedCompletion,
                ]);

                $totalMinutes = 14 * 24 * 60;
                $processDefs = [
                    ['Material Preparation', 0.10],
                    ['Cutting & Shaping', 0.20],
                    ['Assembly', 0.30],
                    ['Sanding & Surface Preparation', 0.15],
                    ['Finishing', 0.20],
                    ['Quality Check & Packaging', 0.05],
                ];

                foreach ($processDefs as $orderIndex => [$name, $pct]) {
                    $statusProc = 'pending';
                    $startedAt = null;
                    $completedAt = null;
                    if ($stages[$orderIndex] === $currentStage) {
                        $statusProc = 'in_progress';
                        $startedAt = $estimatedStart->copy()->addMinutes($totalMinutes * array_sum(array_column(array_slice($processDefs, 0, $orderIndex), 1)));
                    } elseif (array_search($currentStage, $stages) > $orderIndex) {
                        $statusProc = 'completed';
                        $startedAt = $estimatedStart;
                        $completedAt = $estimatedStart->copy()->addMinutes((int) round($totalMinutes * array_sum(array_column(array_slice($processDefs, 0, $orderIndex + 1), 1))));
                    }

                    ProductionProcess::create([
                        'production_id' => $production->id,
                        'process_name' => $name,
                        'process_order' => $orderIndex + 1,
                        'status' => $statusProc,
                        'estimated_duration_minutes' => (int) round($totalMinutes * $pct),
                        'started_at' => $startedAt,
                        'completed_at' => $completedAt,
                    ]);
                }

                $this->command->info("Seeded order {$order->id} ({$product->name}) at stage '{$currentStage}'.");
            }
        }
    }

    private function buildAlignedTimeline(string $currentStage): array
    {
        $stages = [
            'Material Preparation',
            'Cutting & Shaping',
            'Assembly',
            'Sanding & Surface Preparation',
            'Finishing',
            'Quality Check & Packaging',
        ];

        return array_map(function($name) use ($currentStage) {
            $status = 'pending';
            $order = array_search($name, $stages = [
                'Material Preparation',
                'Cutting & Shaping',
                'Assembly',
                'Sanding & Surface Preparation',
                'Finishing',
                'Quality Check & Packaging',
            ]);
            $currentOrder = array_search($currentStage, $stages);
            if ($order < $currentOrder) $status = 'completed';
            if ($order === $currentOrder) $status = 'in_progress';
            return [ 'stage' => $name, 'status' => $status ];
        }, $stages);
    }
}


