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
            InventoryItemsSeeder::class,
            ProductMaterialsSeeder::class, // Bill of Materials for products
            CustomerOrdersSeeder::class, // Sample customer orders with productions
            InventoryUsageSeeder::class, // Inventory usage based on production
            ProductionAnalyticsSeeder::class, // Historical analytics data for predictions
        ]);
    }
}
