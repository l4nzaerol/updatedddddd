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
            // ProductionSeeder::class, // DISABLED - Only use customer orders
            // CustomerOrdersSeeder::class, // DISABLED - Using AccurateOrdersSeeder instead
            InventoryItemsSeeder::class,
            ProductMaterialsSeeder::class, // Bill of Materials for products
            AccurateOrdersSeeder::class, // ✅ MAIN SEEDER - Creates 10 orders (2 pending, 8 accepted with productions)
            AlkansyaDailyOutputSeeder::class, // ✅ Alkansya daily production (3 months, no Sundays)
            InventoryUsageSeeder::class, // Inventory usage based on production
            ProductionAnalyticsSeeder::class, // Historical analytics data for predictions
        ]);
    }
}
