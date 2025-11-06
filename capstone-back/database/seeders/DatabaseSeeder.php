<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UsersTableSeeder::class,
            ProductsTableSeeder::class,
            InventoryItemsSeeder::class,
            ProductMaterialsSeeder::class, // Bill of Materials for products
            ComprehensiveOrdersSeeder::class, // ✅ Creates 10 orders (2 pending, 8 accepted with productions)
            ComprehensiveInventoryUsageSeeder::class, // ✅ NEW - Comprehensive inventory usage from orders + daily Alkansya (3 months)
            
            // OLD SEEDERS (replaced by ComprehensiveInventoryUsageSeeder)
            // InventoryDeductionSeeder::class, // Old: Only processed orders
            // AlkansyaDailyOutputSeeder::class, // Old: Only processed daily Alkansya
            // InventoryUsageSeeder::class, // Old: Original version
        ]);
    }
}
