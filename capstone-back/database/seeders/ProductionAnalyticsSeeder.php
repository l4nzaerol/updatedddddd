<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProductionAnalytics;
use App\Models\Product;
use Carbon\Carbon;

class ProductionAnalyticsSeeder extends Seeder
{
    public function run()
    {
        $this->command->info('Creating production analytics data...');

        // Get products
        $diningTable = Product::where('name', 'Dining Table')->first();
        $woodenChair = Product::where('name', 'Wooden Chair')->first();
        $alkansya = Product::where('name', 'Alkansya')->first();

        if (!$diningTable || !$woodenChair || !$alkansya) {
            $this->command->error('Products not found. Please run ProductsTableSeeder first.');
            return;
        }

        // Create 30 days of historical data
        for ($i = 30; $i >= 1; $i--) {
            $date = Carbon::now()->subDays($i)->format('Y-m-d');
            
            // Dining Table analytics
            ProductionAnalytics::create([
                'date' => $date,
                'product_id' => $diningTable->id,
                'target_output' => 10,
                'actual_output' => rand(3, 8), // 3-8 tables per day
                'efficiency_percentage' => rand(75, 95), // 75-95%
                'total_duration_minutes' => rand(18000, 22000), // ~12-15 days in minutes
                'avg_process_duration_minutes' => rand(3000, 3700),
            ]);

            // Wooden Chair analytics
            ProductionAnalytics::create([
                'date' => $date,
                'product_id' => $woodenChair->id,
                'target_output' => 15,
                'actual_output' => rand(8, 15), // 8-15 chairs per day
                'efficiency_percentage' => rand(80, 98), // 80-98%
                'total_duration_minutes' => rand(17000, 21000), // ~12-14 days in minutes
                'avg_process_duration_minutes' => rand(2800, 3500),
            ]);

            // Alkansya analytics
            ProductionAnalytics::create([
                'date' => $date,
                'product_id' => $alkansya->id,
                'target_output' => 50,
                'actual_output' => rand(20, 40), // 20-40 alkansya per day
                'efficiency_percentage' => rand(85, 99), // 85-99%
                'total_duration_minutes' => rand(200, 400), // ~3-6 hours in minutes
                'avg_process_duration_minutes' => rand(30, 60),
            ]);
        }

        $this->command->info('Production analytics data created successfully!');
        $this->command->info('Created 90 analytics records (30 days × 3 products)');
    }
}
