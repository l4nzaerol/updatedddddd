<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\ProductMaterial;

class UpdateAlkansyaBomSeeder extends Seeder
{
    public function run()
    {
        $this->command->info('Updating Alkansya BOM to 1:1 ratio...');

        // Get Alkansya product
        $alkansyaProduct = Product::where('name', 'Alkansya')->first();
        if (!$alkansyaProduct) {
            $this->command->error('Alkansya product not found. Please run ProductsTableSeeder first.');
            return;
        }

        // Get all Alkansya BOM materials
        $bomMaterials = ProductMaterial::where('product_id', $alkansyaProduct->id)->get();

        if ($bomMaterials->isEmpty()) {
            $this->command->error('Alkansya BOM not found. Please run ProductMaterialsSeeder first.');
            return;
        }

        // Update all materials to 1:1 ratio
        $updatedCount = 0;
        foreach ($bomMaterials as $bomMaterial) {
            $oldQuantity = $bomMaterial->qty_per_unit;
            $bomMaterial->qty_per_unit = 1; // Set to 1:1 ratio
            $bomMaterial->save();
            
            $this->command->info("  Updated: {$bomMaterial->inventoryItem->name} from {$oldQuantity} to 1 per unit");
            $updatedCount++;
        }

        $this->command->info("✓ Updated {$updatedCount} Alkansya BOM materials to 1:1 ratio");
        $this->command->info('Alkansya BOM update completed successfully!');
    }
}
