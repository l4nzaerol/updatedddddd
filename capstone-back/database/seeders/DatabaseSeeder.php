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
            ComprehensiveInventorySeeder::class, // Creates comprehensive inventory system with BOM
            UpdateProductPricesFromBomSeeder::class, // Updates products with BOM-calculated prices
            AlkansyaDailyOutputSeeder::class, // Creates daily output records for Alkansya
        ]);
    }
}
