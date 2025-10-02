<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProductionAnalytics;
use App\Models\Product;
use App\Models\Production;
use Carbon\Carbon;

class ProductionAnalyticsSeeder extends Seeder
{
    public function run()
    {
        $this->command->info('=== Creating Production Analytics from AccurateOrdersSeeder ===');

        // Clear existing analytics
        ProductionAnalytics::truncate();

        // Get products
        $diningTable = Product::where('name', 'Dining Table')->first();
        $woodenChair = Product::where('name', 'Wooden Chair')->first();
        $alkansya = Product::where('name', 'Alkansya')->first();

        if (!$diningTable || !$woodenChair || !$alkansya) {
            $this->command->error('Products not found. Please run ProductsTableSeeder first.');
            return;
        }

        // Get actual productions from AccurateOrdersSeeder
        $productions = Production::with('product')
            ->whereNotNull('production_started_at')
            ->orderBy('production_started_at')
            ->get();

        if ($productions->isEmpty()) {
            $this->command->warn('No productions found. Creating sample historical data only.');
            $this->createHistoricalData($diningTable, $woodenChair, $alkansya);
            return;
        }

        $this->command->info("Found {$productions->count()} productions from AccurateOrdersSeeder");
        $this->command->info("");

        // Group productions by date and product
        $productionsByDate = [];
        foreach ($productions as $production) {
            $date = Carbon::parse($production->production_started_at)->format('Y-m-d');
            $productId = $production->product_id;
            
            if (!isset($productionsByDate[$date])) {
                $productionsByDate[$date] = [];
            }
            if (!isset($productionsByDate[$date][$productId])) {
                $productionsByDate[$date][$productId] = [
                    'product' => $production->product,
                    'quantity' => 0,
                    'completed' => 0,
                    'total_progress' => 0,
                    'count' => 0
                ];
            }
            
            $productionsByDate[$date][$productId]['quantity'] += $production->quantity;
            $productionsByDate[$date][$productId]['total_progress'] += $production->overall_progress;
            $productionsByDate[$date][$productId]['count']++;
            
            if ($production->overall_progress >= 100) {
                $productionsByDate[$date][$productId]['completed'] += $production->quantity;
            }
        }

        // Create analytics for each date and product
        $analyticsCount = 0;
        foreach ($productionsByDate as $date => $products) {
            foreach ($products as $productId => $data) {
                $product = $data['product'];
                $avgProgress = $data['total_progress'] / $data['count'];
                $efficiency = min(100, $avgProgress); // Efficiency based on average progress
                
                // Calculate durations based on product type
                $totalDurationMinutes = $product->name === 'Alkansya' 
                    ? rand(7 * 24 * 60, 8 * 24 * 60) // 7-8 days for Alkansya
                    : rand(12 * 24 * 60, 14 * 24 * 60); // 12-14 days for furniture
                
                $avgProcessDuration = (int)($totalDurationMinutes / 6); // 6 processes

                ProductionAnalytics::create([
                    'date' => $date,
                    'product_id' => $productId,
                    'target_output' => $data['quantity'],
                    'actual_output' => $data['completed'],
                    'efficiency_percentage' => round($efficiency, 2),
                    'total_duration_minutes' => $totalDurationMinutes,
                    'avg_process_duration_minutes' => $avgProcessDuration,
                ]);

                $this->command->info("📊 {$date} | {$product->name}");
                $this->command->info("   Target: {$data['quantity']} | Completed: {$data['completed']} | Efficiency: " . round($efficiency, 2) . "%");
                $analyticsCount++;
            }
        }

        // Add historical data for better analytics visualization (past 30 days)
        $this->command->info("");
        $this->command->info("Adding historical analytics data for trend visualization...");
        $historicalCount = $this->createHistoricalData($diningTable, $woodenChair, $alkansya);

        $this->command->info("");
        $this->command->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        $this->command->info("✓ Created {$analyticsCount} analytics records from actual productions!");
        $this->command->info("✓ Created {$historicalCount} historical analytics records!");
        $this->command->info("✓ Total analytics records: " . ProductionAnalytics::count());
        $this->command->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }

    /**
     * Create historical analytics data for better visualization
     */
    private function createHistoricalData($diningTable, $woodenChair, $alkansya)
    {
        $count = 0;
        
        // Create 30 days of historical data (excluding today and recent days with actual data)
        for ($i = 30; $i >= 15; $i--) {
            $date = Carbon::now()->subDays($i)->format('Y-m-d');
            
            // Skip if analytics already exists for this date
            if (ProductionAnalytics::where('date', $date)->exists()) {
                continue;
            }
            
            // Dining Table analytics (realistic production patterns)
            ProductionAnalytics::create([
                'date' => $date,
                'product_id' => $diningTable->id,
                'target_output' => rand(2, 4),
                'actual_output' => rand(1, 3),
                'efficiency_percentage' => rand(75, 95),
                'total_duration_minutes' => rand(12 * 24 * 60, 14 * 24 * 60), // 12-14 days
                'avg_process_duration_minutes' => rand(2800, 3500),
            ]);
            $count++;

            // Wooden Chair analytics
            ProductionAnalytics::create([
                'date' => $date,
                'product_id' => $woodenChair->id,
                'target_output' => rand(3, 6),
                'actual_output' => rand(2, 5),
                'efficiency_percentage' => rand(80, 98),
                'total_duration_minutes' => rand(12 * 24 * 60, 14 * 24 * 60), // 12-14 days
                'avg_process_duration_minutes' => rand(2800, 3500),
            ]);
            $count++;

            // Alkansya analytics (higher volume, faster production)
            ProductionAnalytics::create([
                'date' => $date,
                'product_id' => $alkansya->id,
                'target_output' => rand(10, 20),
                'actual_output' => rand(8, 18),
                'efficiency_percentage' => rand(85, 99),
                'total_duration_minutes' => rand(7 * 24 * 60, 8 * 24 * 60), // 7-8 days
                'avg_process_duration_minutes' => rand(1000, 1500),
            ]);
            $count++;
        }

        return $count;
    }
}
