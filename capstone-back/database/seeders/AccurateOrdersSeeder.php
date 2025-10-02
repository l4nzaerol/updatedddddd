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

class AccurateOrdersSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * 
     * This seeder creates orders with accurate production tracking that displays
     * consistently across both customer orders page and production tracking page.
     */
    public function run(): void
    {
        $this->command->info('=== Creating Accurate Orders with Synchronized Tracking ===');
        
        // Find or create customer
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

        // Find or create admin
        $admin = User::whereIn('role', ['admin', 'employee'])->first();
        if (!$admin) {
            $admin = User::create([
                'name' => 'Admin',
                'email' => 'admin@gmail.com',
                'password' => bcrypt('password'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]);
        }

        // Get products
        $alkansya = Product::where('name', 'Alkansya')->first();
        $diningTable = Product::where('name', 'Dining Table')->first();
        $woodenChair = Product::where('name', 'Wooden Chair')->first();

        if (!$alkansya || !$diningTable || !$woodenChair) {
            $this->command->error('Required products not found. Please run ProductsTableSeeder first.');
            return;
        }

        $this->command->info("\n--- Creating Sample Orders ---\n");
        $this->command->info("Demonstrating Order Lifecycle:");
        $this->command->info("  1. Customer places order → Status: PENDING");
        $this->command->info("  2. Admin accepts order → Status: PROCESSING (production starts)");
        $this->command->info("  3. Production completes → Status: READY FOR DELIVERY");
        $this->command->info("");

        // Order 1: PENDING - Customer placed order, waiting for admin acceptance
        $this->command->info("1. Creating PENDING order (just placed, awaiting admin acceptance)");
        $this->createOrder($customer, $admin, $diningTable, 1, [
            'days_ago_placed' => 0,
            'is_accepted' => false,
        ]);

        // Order 2: PENDING - Customer placed order 2 days ago, still waiting
        $this->command->info("2. Creating PENDING order (placed 2 days ago, still awaiting acceptance)");
        $this->createOrder($customer, $admin, $woodenChair, 2, [
            'days_ago_placed' => 2,
            'is_accepted' => false,
        ]);

        // Order 3: PROCESSING - Admin accepted 1.4 days ago, early stage (10% progress)
        // Time-based: 1.4 days / 14 days = 10%
        $this->command->info("3. Creating PROCESSING order (accepted 1.4 days ago, 10% complete)");
        $this->createOrder($customer, $admin, $diningTable, 1, [
            'days_ago_placed' => 1.4,
            'days_ago_accepted' => 1.4,
            'is_accepted' => true,
            'progress' => 10,
        ]);

        // Order 4: PROCESSING - Early stage (20% progress)
        // Time-based: 2.8 days / 14 days = 20%
        $this->command->info("4. Creating PROCESSING order (accepted 2.8 days ago, 20% complete)");
        $this->createOrder($customer, $admin, $woodenChair, 2, [
            'days_ago_placed' => 2.8,
            'days_ago_accepted' => 2.8,
            'is_accepted' => true,
            'progress' => 20,
        ]);

        // Order 5: PROCESSING - Mid-production (40% progress)
        // Time-based: 5.6 days / 14 days = 40%
        $this->command->info("5. Creating PROCESSING order (accepted 5.6 days ago, 40% complete)");
        $this->createOrder($customer, $admin, $diningTable, 1, [
            'days_ago_placed' => 5.6,
            'days_ago_accepted' => 5.6,
            'is_accepted' => true,
            'progress' => 40,
        ]);

        // Order 6: PROCESSING - Mid-production (60% progress)
        // Time-based: 8.4 days / 14 days = 60%
        $this->command->info("6. Creating PROCESSING order (accepted 8.4 days ago, 60% complete)");
        $this->createOrder($customer, $admin, $woodenChair, 1, [
            'days_ago_placed' => 8.4,
            'days_ago_accepted' => 8.4,
            'is_accepted' => true,
            'progress' => 60,
        ]);

        // Order 7: PROCESSING - Late stage (75% progress)
        // Time-based: 10.5 days / 14 days = 75%
        $this->command->info("7. Creating PROCESSING order (accepted 10.5 days ago, 75% complete)");
        $this->createOrder($customer, $admin, $diningTable, 2, [
            'days_ago_placed' => 10.5,
            'days_ago_accepted' => 10.5,
            'is_accepted' => true,
            'progress' => 75,
        ]);

        // Order 8: PROCESSING - Near completion (90% progress)
        // Time-based: 12.6 days / 14 days = 90%
        $this->command->info("8. Creating PROCESSING order (accepted 12.6 days ago, 90% complete)");
        $this->createOrder($customer, $admin, $woodenChair, 1, [
            'days_ago_placed' => 12.6,
            'days_ago_accepted' => 12.6,
            'is_accepted' => true,
            'progress' => 90,
        ]);

        // Order 9: COMPLETED PRODUCTION - Production complete (100% progress)
        // Note: Order status will be 'processing' but production is 'Completed'
        $this->command->info("9. Creating COMPLETED PRODUCTION order (accepted 14 days ago, 100% complete)");
        $this->createOrder($customer, $admin, $diningTable, 1, [
            'days_ago_placed' => 14,
            'days_ago_accepted' => 14,
            'is_accepted' => true,
            'progress' => 100,
            'keep_processing_status' => true, // Don't change to ready_for_delivery
        ]);

        // Order 10: PENDING - Alkansya (no production tracking needed)
        // Alkansya orders are manually updated in orders page, no production tracking
        $this->command->info("10. Creating PENDING order - Alkansya (no production tracking)");
        $this->createOrder($customer, $admin, $alkansya, 5, [
            'days_ago_placed' => 0,
            'is_accepted' => false, // Not accepted, so no production created
        ]);

        $this->command->info("");
        $this->command->info("✓ All orders created successfully with accurate tracking!");
        $this->command->info("");
        $this->command->info("=== Order Status Summary ===");
        $this->command->info("PENDING (3 orders): Orders 1-2, 10 → Awaiting admin acceptance");
        $this->command->info("  - Orders 1-2: Regular furniture (Dining Table, Wooden Chair)");
        $this->command->info("  - Order 10: Alkansya (no production tracking needed)");
        $this->command->info("PROCESSING (7 orders): Orders 3-9 → Production in progress (10%-100%)");
        $this->command->info("  - Order 9: Production completed (100%) but order still processing");
        $this->command->info("");
        $this->command->info("Customer Orders Page: Shows ALL 10 orders");
        $this->command->info("Production Tracking Page: Shows ONLY 7 orders (3-9, NOT 1-2 or 10)");
    }

    /**
     * Create an order with accurate production tracking
     */
    private function createOrder($customer, $admin, $product, $quantity, $config)
    {
        $daysAgoPlaced = $config['days_ago_placed'] ?? 0;
        $daysAgoAccepted = $config['days_ago_accepted'] ?? $daysAgoPlaced;
        $isAccepted = $config['is_accepted'] ?? false;
        $progress = $config['progress'] ?? 0;
        $keepProcessingStatus = $config['keep_processing_status'] ?? false;

        $isAlkansya = str_contains(strtolower($product->name), 'alkansya');
        $totalProductionDays = $isAlkansya ? 7 : 14;

        // Determine order status
        $orderStatus = 'pending';
        if ($isAccepted) {
            if ($progress >= 100 && !$keepProcessingStatus) {
                $orderStatus = 'ready_for_delivery';
            } else {
                $orderStatus = 'processing';
            }
        }

        // Create order
        $order = Order::create([
            'user_id' => $customer->id,
            'total_price' => $product->price * $quantity,
            'status' => $orderStatus,
            'acceptance_status' => $isAccepted ? 'accepted' : 'pending',
            'accepted_by' => $isAccepted ? $admin->id : null,
            'accepted_at' => $isAccepted ? now()->subDays($daysAgoAccepted) : null,
            'checkout_date' => now()->subDays($daysAgoPlaced),
            'payment_method' => 'Maya',
            'payment_status' => 'paid',
            'shipping_address' => '456 Woodcraft Avenue, Furniture District, Metro Manila',
            'contact_phone' => '+63 917 123 4567',
            'created_at' => now()->subDays($daysAgoPlaced),
            'updated_at' => now(),
        ]);

        // Create order item
        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => $quantity,
            'price' => $product->price,
        ]);

        // Determine current stage based on progress
        $currentStage = $this->determineStageFromProgress($progress, $isAlkansya);

        // Calculate dates
        $productionStartedAt = $isAccepted ? now()->subDays($daysAgoAccepted) : null;
        $estimatedCompletion = $isAccepted ? $productionStartedAt->copy()->addDays($totalProductionDays) : null;
        $actualCompletion = ($isAccepted && $progress >= 100) ? now()->subDays(max(0, $daysAgoAccepted - $totalProductionDays)) : null;

        // Create production if accepted
        $production = null;
        if ($isAccepted) {
            // Ensure minimum progress of 5% for accepted orders to show in production tracking
            $actualProgress = max(5, $progress);
            $productionStatus = $progress >= 100 ? 'Completed' : 'In Progress';
            
            $production = Production::create([
                'order_id' => $order->id,
                'user_id' => $admin->id,
                'product_id' => $product->id,
                'product_name' => $product->name,
                'date' => now()->subDays($daysAgoAccepted)->format('Y-m-d'),
                'current_stage' => $currentStage,
                'status' => $productionStatus,
                'quantity' => $quantity,
                'priority' => $daysAgoAccepted <= 5 ? 'high' : 'medium',
                'requires_tracking' => !$isAlkansya,
                'product_type' => $isAlkansya ? 'alkansya' : (str_contains(strtolower($product->name), 'table') ? 'table' : 'chair'),
                'production_started_at' => $productionStartedAt,
                'estimated_completion_date' => $estimatedCompletion,
                'actual_completion_date' => $actualCompletion,
                'overall_progress' => $actualProgress,
            ]);

            // Create production processes for non-alkansya items
            if (!$isAlkansya) {
                $this->createProductionProcesses($production, $progress, $currentStage, $productionStartedAt);
            }
        }

        // Create order tracking
        $trackingType = $isAlkansya ? 'alkansya' : 'custom';
        $trackingStatus = 'pending';
        $actualProgress = $isAccepted ? max(5, $progress) : 0;
        
        if ($isAccepted) {
            if ($progress >= 100) {
                $trackingStatus = 'ready_for_delivery';
            } else {
                $trackingStatus = 'in_production';
            }
        }

        $tracking = OrderTracking::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'tracking_type' => $trackingType,
            'current_stage' => $isAccepted ? $currentStage : ($isAlkansya ? 'Design' : 'Material Preparation'),
            'status' => $trackingStatus,
            'progress_percentage' => $actualProgress,
            'estimated_start_date' => $productionStartedAt,
            'estimated_completion_date' => $estimatedCompletion,
            'actual_start_date' => $isAccepted ? $productionStartedAt : null,
            'actual_completion_date' => $actualCompletion,
            'process_timeline' => $this->generateProcessTimeline($trackingType, $currentStage, $trackingStatus, $actualProgress, $isAccepted),
            'created_at' => now()->subDays($daysAgoPlaced),
            'updated_at' => now(),
        ]);

        // Sync tracking with production if production exists
        if ($production) {
            $trackingService = app(\App\Services\ProductionTrackingService::class);
            $trackingService->syncOrderTrackingWithProduction($order->id);
            
            // Refresh to get updated data
            $tracking->refresh();
            $production->refresh();
        }

        // Log creation with detailed information
        $displayProgress = $isAccepted ? max(5, $progress) : 0;
        $statusText = $isAccepted ? ($progress >= 100 ? 'COMPLETED' : "IN PROGRESS ({$displayProgress}%)") : 'PENDING ACCEPTANCE';
        $acceptanceStatus = $isAccepted ? '✅ ACCEPTED' : '⏳ PENDING';
        
        $this->command->info("   ✓ Order #{$order->id} | {$product->name} x{$quantity}");
        $this->command->info("     Order Status: {$order->status} | Acceptance: {$acceptanceStatus}");
        
        if ($production) {
            $this->command->info("     🏭 Production: #{$production->id} CREATED");
            $this->command->info("        Stage: {$currentStage} | Progress: {$displayProgress}%");
            $this->command->info("        Status: {$production->status} | Will show in production tracking: YES ✅");
        } else {
            $this->command->info("     🏭 Production: NOT CREATED (order not accepted)");
            $this->command->info("        Will show in production tracking: NO ❌");
        }
        $this->command->info("     📊 Tracking: Stage: {$tracking->current_stage} | Status: {$tracking->status} | Progress: {$displayProgress}%");
        $this->command->info("");
    }

    /**
     * Determine current stage based on progress percentage
     */
    private function determineStageFromProgress($progress, $isAlkansya)
    {
        // For Alkansya, we use the custom furniture stages since the database
        // only has one set of stage enums. We map Alkansya progress to these stages.
        if ($isAlkansya) {
            // Map Alkansya stages to custom furniture stage names
            $stages = [
                ['name' => 'Material Preparation', 'threshold' => 16],  // Design + Preparation
                ['name' => 'Cutting & Shaping', 'threshold' => 50],     // Cutting
                ['name' => 'Assembly', 'threshold' => 66],              // Assembly
                ['name' => 'Finishing', 'threshold' => 83],             // Finishing
                ['name' => 'Quality Check & Packaging', 'threshold' => 100], // Quality Control
            ];
        } else {
            $stages = [
                ['name' => 'Material Preparation', 'threshold' => 10],
                ['name' => 'Cutting & Shaping', 'threshold' => 30],
                ['name' => 'Assembly', 'threshold' => 60],
                ['name' => 'Sanding & Surface Preparation', 'threshold' => 75],
                ['name' => 'Finishing', 'threshold' => 95],
                ['name' => 'Quality Check & Packaging', 'threshold' => 100],
            ];
        }

        $currentStage = $stages[0]['name'];
        foreach ($stages as $stage) {
            if ($progress >= $stage['threshold']) {
                $currentStage = $stage['name'];
            }
        }

        return $currentStage;
    }

    /**
     * Create production processes with accurate status
     */
    private function createProductionProcesses($production, $progress, $currentStage, $productionStartedAt)
    {
        $totalMinutes = 14 * 24 * 60; // 14 days in minutes
        
        $processes = [
            ['name' => 'Material Preparation', 'order' => 1, 'estimated_duration' => (int) round($totalMinutes * 0.10), 'threshold' => 10, 'days_duration' => 1.5],
            ['name' => 'Cutting & Shaping', 'order' => 2, 'estimated_duration' => (int) round($totalMinutes * 0.20), 'threshold' => 30, 'days_duration' => 2.5],
            ['name' => 'Assembly', 'order' => 3, 'estimated_duration' => (int) round($totalMinutes * 0.30), 'threshold' => 60, 'days_duration' => 4.0],
            ['name' => 'Sanding & Surface Preparation', 'order' => 4, 'estimated_duration' => (int) round($totalMinutes * 0.15), 'threshold' => 75, 'days_duration' => 2.0],
            ['name' => 'Finishing', 'order' => 5, 'estimated_duration' => (int) round($totalMinutes * 0.20), 'threshold' => 95, 'days_duration' => 2.5],
            ['name' => 'Quality Check & Packaging', 'order' => 6, 'estimated_duration' => (int) round($totalMinutes * 0.05), 'threshold' => 100, 'days_duration' => 1.5],
        ];

        $currentStageIndex = array_search($currentStage, array_column($processes, 'name'));
        if ($currentStageIndex === false) {
            $currentStageIndex = 0;
        }

        $cumulativeDays = 0;
        foreach ($processes as $index => $proc) {
            $processStatus = 'pending';
            $startedAt = null;
            $completedAt = null;
            
            if ($progress >= $proc['threshold']) {
                // Process is completed
                $processStatus = 'completed';
                $startedAt = $productionStartedAt->copy()->addDays($cumulativeDays);
                $completedAt = $startedAt->copy()->addDays($proc['days_duration']);
            } elseif ($index === $currentStageIndex || ($progress > 0 && $index === 0 && $currentStageIndex === 0)) {
                // Current process is in progress (or first process if just started)
                $processStatus = 'in_progress';
                $startedAt = $productionStartedAt->copy()->addDays($cumulativeDays);
            } elseif ($index < $currentStageIndex) {
                // Previous processes should be completed
                $processStatus = 'completed';
                $startedAt = $productionStartedAt->copy()->addDays($cumulativeDays);
                $completedAt = $startedAt->copy()->addDays($proc['days_duration']);
            }
            // else: process is pending (future stage)

            ProductionProcess::create([
                'production_id' => $production->id,
                'process_name' => $proc['name'],
                'process_order' => $proc['order'],
                'status' => $processStatus,
                'estimated_duration_minutes' => $proc['estimated_duration'],
                'started_at' => $startedAt,
                'completed_at' => $completedAt,
            ]);
            
            $cumulativeDays += $proc['days_duration'];
        }
    }

    /**
     * Generate process timeline for tracking
     */
    private function generateProcessTimeline($trackingType, $currentStage, $status, $progress, $isAccepted)
    {
        if ($trackingType === 'alkansya') {
            // For Alkansya, use simplified stages that map to the production stages
            // This ensures consistency between tracking and production
            $stages = [
                ['stage' => 'Material Preparation', 'description' => 'Design and material preparation', 'estimated_duration' => '1 day'],
                ['stage' => 'Cutting & Shaping', 'description' => 'Cutting wood to specifications', 'estimated_duration' => '2 days'],
                ['stage' => 'Assembly', 'description' => 'Assembling components', 'estimated_duration' => '2 days'],
                ['stage' => 'Finishing', 'description' => 'Applying finish and polish', 'estimated_duration' => '1 day'],
                ['stage' => 'Quality Check & Packaging', 'description' => 'Final inspection and packaging', 'estimated_duration' => '1 day'],
            ];
        } else {
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

        return array_map(function($stage, $index) use ($currentStage, $status, $currentStageIndex, $progress, $isAccepted) {
            $stageStatus = 'pending';
            
            if (!$isAccepted) {
                $stageStatus = 'pending';
            } elseif ($progress >= 100) {
                $stageStatus = 'completed';
            } elseif ($index < $currentStageIndex) {
                $stageStatus = 'completed';
            } elseif ($index === $currentStageIndex) {
                $stageStatus = $status === 'in_production' ? 'in_progress' : 'pending';
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
