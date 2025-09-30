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
                'name' => 'Customer',
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

        // Get admin/employee user for accepting orders
        $admin = User::whereIn('role', ['admin', 'employee'])->first();
        if (!$admin) {
            $admin = User::create([
                'name' => 'Admin',
                'email' => 'admin@gmail.com',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]);
        }

        // Create realistic orders with accurate time-based tracking
        // Orders demonstrate real-world scenarios with proper dates
        
        $this->command->info("\n=== Creating Time-Accurate Orders ===\n");
        
        // Order 1: Placed 14 days ago - DUE TODAY (should be at ~95% completion)
        // This demonstrates an order that's almost ready and due for delivery today
        $this->command->info("Order 1: Placed 14 days ago, DUE TODAY (95% complete - Final Quality Check)");
        $this->createOrderWithProgress($customer, $admin, $diningTable, 1, 'in_production', 'Quality Check & Packaging', 95, 14, true);
        
        // Order 2: Placed 7 days ago - Halfway through (50% - Assembly stage)
        // This shows a mid-production order with 7 days remaining
        $this->command->info("Order 2: Placed 7 days ago, 50% complete (Assembly stage)");
        $this->createOrderWithProgress($customer, $admin, $woodenChair, 2, 'in_production', 'Assembly', 50, 7, true);
        
        // Order 3: Placed YESTERDAY - Just started (10% - Material Preparation)
        // Fresh order that just began production
        $this->command->info("Order 3: Placed YESTERDAY, 10% complete (Material Preparation)");
        $this->createOrderWithProgress($customer, $admin, $diningTable, 1, 'in_production', 'Material Preparation', 10, 1, true);
        
        // Order 4: Placed TODAY - Just accepted, production starting (5% - Early Material Prep)
        // Brand new order accepted today
        $this->command->info("Order 4: Placed TODAY, 5% complete (Just started)");
        $this->createOrderWithProgress($customer, $admin, $woodenChair, 3, 'in_production', 'Material Preparation', 5, 0, true);
        
        // Order 5: Placed 10 days ago - Advanced stage (70% - Sanding & Surface Prep)
        // Order in advanced production stage
        $this->command->info("Order 5: Placed 10 days ago, 70% complete (Sanding & Surface Preparation)");
        $this->createOrderWithProgress($customer, $admin, $diningTable, 2, 'in_production', 'Sanding & Surface Preparation', 70, 10, true);
        
        // Order 6: Placed 12 days ago - Near completion (85% - Finishing stage)
        // Order in final stages, will be ready in 2-3 days
        $this->command->info("Order 6: Placed 12 days ago, 85% complete (Finishing stage)");
        $this->createOrderWithProgress($customer, $admin, $woodenChair, 4, 'in_production', 'Finishing', 85, 12, true);
        
        // Order 7: Placed 15 days ago - COMPLETED (100% - Ready for delivery)
        // Completed order ready for pickup/delivery
        $this->command->info("Order 7: Placed 15 days ago, 100% COMPLETE (Ready for delivery)");
        $this->createOrderWithProgress($customer, $admin, $diningTable, 1, 'pending', 'Quality Check & Packaging', 100, 15, true);

        $this->command->info('Sample orders created successfully!');
    }
    
    private function createOrderWithProgress($customer, $admin, $product, $quantity, $status, $currentStage, $progress, $daysAgo, $isAccepted)
    {
        // Create order
        // For 100% completed orders, keep status as 'pending' so they appear in ready_for_delivery list
        // They will only move to 'completed' when manually marked in the order page
        $orderStatus = 'pending';
        if ($status === 'in_production') {
            $orderStatus = 'pending'; // All in-production orders show as pending
        } elseif ($status === 'ready_for_delivery') {
            $orderStatus = 'ready_for_delivery';
        } elseif ($status === 'completed') {
            $orderStatus = 'completed';
        }
        
        $order = Order::create([
            'user_id' => $customer->id,
            'total_price' => $product->price * $quantity,
            'status' => $orderStatus,
            'acceptance_status' => $isAccepted ? 'accepted' : 'pending',
            'accepted_by' => $isAccepted ? $admin->id : null,
            'accepted_at' => $isAccepted ? now()->subDays($daysAgo) : null,
            'checkout_date' => now()->subDays($daysAgo),
            'payment_method' => 'gcash',
            'payment_status' => 'paid',
            'shipping_address' => '456 Woodcraft Avenue, Furniture District, Metro Manila',
            'contact_phone' => '+63 917 123 4567',
            'created_at' => now()->subDays($daysAgo),
            'updated_at' => now(),
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
        
        // CRITICAL: Calculate dates to work WITH time-based progress system
        // The system calculates: progress = (elapsed_time / total_time) * 100
        // We need to set dates so this calculation gives us our desired progress
        
        $totalProductionDays = $trackingType === 'alkansya' ? 7 : 14;
        
        if ($progress >= 100) {
            // Completed: start in past, end in past
            $estimatedStart = now()->subDays($totalProductionDays + 1);
            $estimatedCompletion = now()->subDays(1);
        } elseif ($progress > 0) {
            // In progress: calculate start date so elapsed time = desired progress
            // Formula: elapsed_days = (progress / 100) * total_days
            $targetElapsedDays = ($progress / 100) * $totalProductionDays;
            $estimatedStart = now()->subDays($targetElapsedDays);
            $estimatedCompletion = $estimatedStart->copy()->addDays($totalProductionDays);
        } else {
            // Not started: start today, end in future
            $estimatedStart = now();
            $estimatedCompletion = now()->addDays($totalProductionDays);
        }

        // Map legacy/current stage names to production dashboard stages for custom items
        if ($trackingType === 'custom') {
            $stageMap = [
                'Planning' => 'Material Preparation',
                'Material Selection' => 'Material Preparation',
                'Cutting and Shaping' => 'Cutting & Shaping',
                'Quality Assurance' => 'Quality Check & Packaging',
                'Quality Control' => 'Quality Check & Packaging',
            ];
            $currentStage = $stageMap[$currentStage] ?? $currentStage;
        }

        // Determine tracking status based on progress
        $trackingStatus = 'pending';
        if ($progress >= 100) {
            $trackingStatus = 'ready_for_delivery'; // 100% done = ready for delivery
        } elseif ($progress > 0) {
            $trackingStatus = 'in_production';
        }
        
        // IMPORTANT: Use the same currentStage that matches the production
        // This ensures tracking shows the correct stage
        $tracking = OrderTracking::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'tracking_type' => $trackingType,
            'current_stage' => $currentStage, // This must match production current_stage
            'status' => $trackingStatus,
            'estimated_start_date' => $estimatedStart,
            'estimated_completion_date' => $estimatedCompletion,
            'actual_start_date' => $progress > 0 ? $estimatedStart : null,
            'actual_completion_date' => $progress >= 100 ? now()->subDays(max(0, $daysAgo - 1)) : null,
            'process_timeline' => $this->generateProcessTimeline($trackingType, $currentStage, $trackingStatus, $progress),
            'created_at' => now()->subDays($daysAgo),
            'updated_at' => now(),
        ]);

        // Only create production if order is accepted
        $production = null;
        if ($isAccepted) {
            $isAlkansya = str_contains(strtolower($product->name), 'alkansya');
            
            // For 100% progress, mark production as completed but keep order as pending
            // This allows the order to show in "ready for delivery" until manually completed
            $productionStatus = 'In Progress';
            $actualCompletionDate = null;
            
            if ($progress >= 100) {
                $productionStatus = 'Completed';
                $actualCompletionDate = now()->subDays(max(0, $daysAgo - 1));
            }
            
            $production = Production::create([
                'order_id' => $order->id,
                'user_id' => $admin->id, // Use admin as the one who created production
                'product_id' => $product->id,
                'product_name' => $product->name,
                'date' => now()->subDays($daysAgo)->format('Y-m-d'),
                'current_stage' => $currentStage,
                'status' => $productionStatus,
                'quantity' => $quantity,
                'priority' => $daysAgo <= 5 ? 'high' : 'medium',
                'requires_tracking' => !$isAlkansya,
                'product_type' => $isAlkansya ? 'alkansya' : (str_contains(strtolower($product->name), 'table') ? 'table' : 'chair'),
                'production_started_at' => $estimatedStart,
                'estimated_completion_date' => $estimatedCompletion,
                'actual_completion_date' => $actualCompletionDate,
                'overall_progress' => $progress,
            ]);
        } else {
            $isAlkansya = str_contains(strtolower($product->name), 'alkansya');
        }

        // Only create processes if production was created (i.e., order is accepted)
        if ($production && !$isAlkansya) {
            // Create process records with realistic progress based on current stage
            // Total 2 weeks = 14 days for complete production cycle
            $totalMinutes = 14 * 24 * 60; // 20160 minutes for 2 weeks
            
            // Define all 6 processes with their durations and progress thresholds
            $processes = [
                ['name' => 'Material Preparation', 'order' => 1, 'estimated_duration' => (int) round($totalMinutes * 0.10), 'progress_threshold' => 10, 'days_duration' => 1.5],
                ['name' => 'Cutting & Shaping', 'order' => 2, 'estimated_duration' => (int) round($totalMinutes * 0.20), 'progress_threshold' => 25, 'days_duration' => 2.5],
                ['name' => 'Assembly', 'order' => 3, 'estimated_duration' => (int) round($totalMinutes * 0.30), 'progress_threshold' => 50, 'days_duration' => 4.0],
                ['name' => 'Sanding & Surface Preparation', 'order' => 4, 'estimated_duration' => (int) round($totalMinutes * 0.15), 'progress_threshold' => 65, 'days_duration' => 2.0],
                ['name' => 'Finishing', 'order' => 5, 'estimated_duration' => (int) round($totalMinutes * 0.20), 'progress_threshold' => 85, 'days_duration' => 2.5],
                ['name' => 'Quality Check & Packaging', 'order' => 6, 'estimated_duration' => (int) round($totalMinutes * 0.05), 'progress_threshold' => 100, 'days_duration' => 1.5],
            ];

            // Find the index of the current stage
            $currentStageIndex = array_search($currentStage, array_column($processes, 'name'));
            if ($currentStageIndex === false) {
                $currentStageIndex = 0;
            }

            $cumulativeDays = 0;
            foreach ($processes as $index => $proc) {
                // Determine process status based on progress and current stage
                $processStatus = 'pending';
                $startedAt = null;
                $completedAt = null;
                
                // If progress is 100%, all processes should be completed
                if ($progress >= 100) {
                    $processStatus = 'completed';
                    $startedAt = $estimatedStart->copy()->addDays($cumulativeDays);
                    $completedAt = $startedAt->copy()->addDays($proc['days_duration']);
                }
                // If this process is before the current stage, it should be completed
                elseif ($index < $currentStageIndex) {
                    $processStatus = 'completed';
                    $startedAt = $estimatedStart->copy()->addDays($cumulativeDays);
                    $completedAt = $startedAt->copy()->addDays($proc['days_duration']);
                }
                // If this is the current stage, it should be in progress
                elseif ($index === $currentStageIndex) {
                    $processStatus = 'in_progress';
                    $startedAt = $estimatedStart->copy()->addDays($cumulativeDays);
                }
                // Future processes remain pending
                else {
                    $processStatus = 'pending';
                }

                ProductionProcess::create([
                    'production_id' => $production->id,
                    'process_name' => $proc['name'],
                    'process_order' => $proc['order'],
                    'status' => $processStatus,
                    'estimated_duration_minutes' => $proc['estimated_duration'],
                    'started_at' => $startedAt,
                    'completed_at' => $completedAt,
                ]);
                
                // Accumulate days for next process start time
                $cumulativeDays += $proc['days_duration'];
            }
        }

        // CRITICAL: Sync tracking with production immediately after creation
        // This ensures customer tracking matches production from the start
        if ($production) {
            $trackingService = app(\App\Services\ProductionTrackingService::class);
            $trackingService->syncOrderTrackingWithProduction($order->id);
            
            $this->command->info("Created order #{$order->id} (ACCEPTED) and production #{$production->id} - {$product->name} x{$quantity} - {$status} - {$currentStage} - {$progress}%");
        } else {
            $this->command->info("Created order #{$order->id} (PENDING ACCEPTANCE) - {$product->name} x{$quantity} - No production yet");
        }
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
            // Use the actual 6-process workflow names that match production
            $stages = [
                ['stage' => 'Material Preparation', 'description' => 'Selecting and preparing high-quality materials', 'estimated_duration' => '1.5 days'],
                ['stage' => 'Cutting & Shaping', 'description' => 'Precise cutting and shaping of components', 'estimated_duration' => '2.5 days'],
                ['stage' => 'Assembly', 'description' => 'Careful assembly of furniture components', 'estimated_duration' => '4 days'],
                ['stage' => 'Sanding & Surface Preparation', 'description' => 'Sanding and preparing surfaces for finishing', 'estimated_duration' => '2 days'],
                ['stage' => 'Finishing', 'description' => 'Applying professional finish, stain, and polish', 'estimated_duration' => '2.5 days'],
                ['stage' => 'Quality Check & Packaging', 'description' => 'Final quality inspection and packaging', 'estimated_duration' => '1.5 days'],
            ];
        }

        $currentStageIndex = array_search($currentStage, array_column($stages, 'stage'));
        if ($currentStageIndex === false) {
            $currentStageIndex = 0;
        }

        return array_map(function($stage, $index) use ($currentStage, $status, $currentStageIndex, $progress) {
            $stageStatus = 'pending';
            
            // Determine status based on progress and current stage
            if ($progress >= 100) {
                // All stages completed
                $stageStatus = 'completed';
            } elseif ($index < $currentStageIndex) {
                // Previous stages are completed
                $stageStatus = 'completed';
            } elseif ($index === $currentStageIndex) {
                // Current stage is in progress
                $stageStatus = $status === 'in_production' ? 'in_progress' : 'pending';
            } else {
                // Future stages are pending
                $stageStatus = 'pending';
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
