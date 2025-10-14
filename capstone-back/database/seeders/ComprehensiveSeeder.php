<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Artisan;

class ComprehensiveSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * This seeder runs all necessary seeders in the correct order
     */
    public function run(): void
    {
        $this->command->info('🚀 Starting comprehensive database seeding...');
        $this->command->info('This will create 3 months of realistic data for predictive analytics testing.');

        // Step 1: Basic setup seeders
        $this->command->info('📋 Step 1: Setting up basic data...');
        $this->call([
            \Database\Seeders\InventoryItemsSeeder::class,
            \Database\Seeders\ProductSeeder::class,
            \Database\Seeders\ProductMaterialSeeder::class,
        ]);

        // Step 2: Create historical Alkansya daily output (3 months)
        $this->command->info('📊 Step 2: Creating 3 months of Alkansya daily output data...');
        $this->call(\Database\Seeders\AlkansyaDailyOutputSeeder::class);

        // Step 3: Create manual orders (3 months)
        $this->command->info('🛒 Step 3: Creating 3 months of manual orders...');
        $this->call(\Database\Seeders\ManualOrdersSeeder::class);

        // Step 4: Create additional production data
        $this->command->info('🏭 Step 4: Creating production analytics data...');
        $this->createProductionAnalytics();

        // Step 5: Create sales analytics data
        $this->command->info('💰 Step 5: Creating sales analytics data...');
        $this->createSalesAnalytics();

        $this->command->info('✅ Comprehensive seeding completed!');
        $this->command->info('📈 You now have 3 months of realistic data for predictive analytics testing.');
        $this->command->info('🔍 Check the Reports section to see the predictive analytics in action.');
    }

    /**
     * Create production analytics data
     */
    private function createProductionAnalytics()
    {
        // This would create production analytics records
        // For now, we'll rely on the data from AlkansyaDailyOutputSeeder
        $this->command->info('   - Production analytics data will be generated from daily output records');
    }

    /**
     * Create sales analytics data
     */
    private function createSalesAnalytics()
    {
        // This would create sales analytics records
        // For now, we'll rely on the data from ManualOrdersSeeder
        $this->command->info('   - Sales analytics data will be generated from order records');
    }
}
