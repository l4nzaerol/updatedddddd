<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->call([
            UsersTableSeeder::class, // Creates admin and user accounts
            
            // Use AccurateMaterialsSeeder for products with accurate material data
            AccurateMaterialsSeeder::class, // Creates products with accurate material data and BOM
            
            // Use ComprehensiveInventorySeeder for complete inventory system with BOM
            //ComprehensiveInventorySeeder::class, // Creates materials, BOM, inventory tracking, and daily output
            
            // Enhanced Alkansya seeder with normalized inventory integration
            EnhancedAlkansyaFactorySeeder::class, // Creates 3 months of Alkansya production with inventory tracking
        ]);
    }
}
