<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UsersTableSeeder::class,
            ProductsTableSeeder::class, // Creates products with initial prices
            InventoryItemsSeeder::class, // Creates inventory items with unit costs
            ProductMaterialsSeeder::class, // Creates BOM relationships
            UpdateAlkansyaBomSeeder::class, // Updates Alkansya BOM to 1:1 ratio
            UpdateProductPricesFromBomSeeder::class, // Updates products with BOM-calculated prices
            // ComprehensiveOrdersSeeder::class, // REMOVED - For manual testing of production tracking
            ComprehensiveInventoryUsageSeeder::class, // ✅ Comprehensive inventory usage from orders + daily Alkansya (3 months)
            
            // OLD SEEDERS (replaced by ComprehensiveInventoryUsageSeeder)
            // InventoryDeductionSeeder::class, // Old: Only processed orders
            // InventoryUsageSeeder::class, // Old: Original version
            // AlkansyaDailyOutputSeeder::class, // REMOVED - Now handled by ComprehensiveInventoryUsageSeeder
        ]);
    }
}
