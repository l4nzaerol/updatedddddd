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
            
        ]);
    }
}
