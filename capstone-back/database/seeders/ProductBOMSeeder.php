<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\Material;
use App\Models\BOM;
use Illuminate\Support\Facades\DB;

class ProductBOMSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Don't clear existing BOM data, just add missing ones

        // Get all products and materials
        $products = Product::all();
        $materials = Material::all();

        if ($products->isEmpty() || $materials->isEmpty()) {
            $this->command->warn('No products or materials found. Please run product and material seeders first.');
            return;
        }

        // Define BOM configurations for different product types based on AccurateMaterialsSeeder
        $bomConfigs = [
            'Alkansya' => [
                ['material_name' => 'Pinewood 1x4x8ft', 'quantity' => 1/350, 'unit' => 'pcs'],
                ['material_name' => 'Plywood 4.2mm 4x8ft', 'quantity' => 1/78, 'unit' => 'pcs'],
                ['material_name' => 'Acrylic 1.5mm 4x8ft', 'quantity' => 1/78, 'unit' => 'pcs'],
                ['material_name' => 'Pin Nail F30', 'quantity' => 14, 'unit' => 'pcs'],
                ['material_name' => 'Black Screw 1 1/2', 'quantity' => 4, 'unit' => 'pcs'],
                ['material_name' => 'Stikwell 250 grams', 'quantity' => 1/200, 'unit' => 'pcs'],
                ['material_name' => 'Grinder pad 4inch 120 grit', 'quantity' => 1/50, 'unit' => 'pcs'],
                ['material_name' => 'Sticker 24 inch Car Decals', 'quantity' => 1/78, 'unit' => 'pcs'],
                ['material_name' => 'Transfer Tape', 'quantity' => 1/300, 'unit' => 'pcs'],
                ['material_name' => 'TAPE 2 inch 200m', 'quantity' => 1/150, 'unit' => 'pcs'],
                ['material_name' => 'Fragile Tape', 'quantity' => 1/500, 'unit' => 'pcs'],
                ['material_name' => 'Bubble Wrap 40 inch x 100m', 'quantity' => 1/250, 'unit' => 'pcs'],
                ['material_name' => 'Insulation 8mm 40 inch x 100m', 'quantity' => 1/250, 'unit' => 'pcs'],
            ],
            'Dining Table' => [
                ['material_name' => 'Mahogany Hardwood 2x4x8ft', 'quantity' => 4, 'unit' => 'pcs'],
                ['material_name' => 'Mahogany Hardwood 1x6x10ft', 'quantity' => 6, 'unit' => 'pcs'],
                ['material_name' => 'Plywood 18mm 4x8ft', 'quantity' => 1, 'unit' => 'pcs'],
                ['material_name' => 'Metal Table Brackets', 'quantity' => 1, 'unit' => 'pcs'],
                ['material_name' => 'Wood Screws 3 inch', 'quantity' => 32, 'unit' => 'pcs'],
                ['material_name' => 'Wood Glue 500ml', 'quantity' => 1, 'unit' => 'pcs'],
                ['material_name' => 'Sandpaper 80 Grit', 'quantity' => 4, 'unit' => 'pcs'],
                ['material_name' => 'Sandpaper 120 Grit', 'quantity' => 6, 'unit' => 'pcs'],
                ['material_name' => 'Sandpaper 220 Grit', 'quantity' => 4, 'unit' => 'pcs'],
                ['material_name' => 'Wood Stain Walnut 1 Liter', 'quantity' => 0.3, 'unit' => 'pcs'],
                ['material_name' => 'Polyurethane Gloss 1 Liter', 'quantity' => 0.4, 'unit' => 'pcs'],
                ['material_name' => 'Felt Pads Large', 'quantity' => 1, 'unit' => 'pcs'],
            ],
            'Wooden Chair' => [
                ['material_name' => 'Mahogany Hardwood 2x2x6ft', 'quantity' => 4, 'unit' => 'pcs'],
                ['material_name' => 'Mahogany Hardwood 1x4x6ft', 'quantity' => 3, 'unit' => 'pcs'],
                ['material_name' => 'Plywood 12mm 2x4ft', 'quantity' => 1, 'unit' => 'pcs'],
                ['material_name' => 'Wood Screws 2.5 inch', 'quantity' => 24, 'unit' => 'pcs'],
                ['material_name' => 'Wood Dowels 8mm', 'quantity' => 8, 'unit' => 'pcs'],
                ['material_name' => 'Wood Glue 250ml', 'quantity' => 1, 'unit' => 'pcs'],
                ['material_name' => 'Foam Cushion 2 inch', 'quantity' => 1, 'unit' => 'pcs'],
                ['material_name' => 'Upholstery Fabric', 'quantity' => 1.5, 'unit' => 'pcs'],
                ['material_name' => 'Upholstery Staples', 'quantity' => 50, 'unit' => 'pcs'],
                ['material_name' => 'Sandpaper 80 Grit', 'quantity' => 2, 'unit' => 'pcs'],
                ['material_name' => 'Sandpaper 120 Grit', 'quantity' => 3, 'unit' => 'pcs'],
                ['material_name' => 'Sandpaper 220 Grit', 'quantity' => 2, 'unit' => 'pcs'],
                ['material_name' => 'Wood Stain Walnut 500ml', 'quantity' => 0.3, 'unit' => 'pcs'],
                ['material_name' => 'Lacquer Spray Clear', 'quantity' => 1, 'unit' => 'pcs'],
                ['material_name' => 'Felt Pads Small', 'quantity' => 1, 'unit' => 'pcs'],
            ],
            'Chair' => [
                ['material_name' => 'Mahogany Hardwood 2x2x6ft', 'quantity' => 4, 'unit' => 'pcs'],
                ['material_name' => 'Mahogany Hardwood 1x4x6ft', 'quantity' => 3, 'unit' => 'pcs'],
                ['material_name' => 'Plywood 12mm 2x4ft', 'quantity' => 1, 'unit' => 'pcs'],
                ['material_name' => 'Wood Screws 2.5 inch', 'quantity' => 24, 'unit' => 'pcs'],
                ['material_name' => 'Wood Dowels 8mm', 'quantity' => 8, 'unit' => 'pcs'],
                ['material_name' => 'Wood Glue 250ml', 'quantity' => 1, 'unit' => 'pcs'],
                ['material_name' => 'Foam Cushion 2 inch', 'quantity' => 1, 'unit' => 'pcs'],
                ['material_name' => 'Upholstery Fabric', 'quantity' => 1.5, 'unit' => 'pcs'],
                ['material_name' => 'Upholstery Staples', 'quantity' => 50, 'unit' => 'pcs'],
                ['material_name' => 'Sandpaper 80 Grit', 'quantity' => 2, 'unit' => 'pcs'],
                ['material_name' => 'Sandpaper 120 Grit', 'quantity' => 3, 'unit' => 'pcs'],
                ['material_name' => 'Sandpaper 220 Grit', 'quantity' => 2, 'unit' => 'pcs'],
                ['material_name' => 'Wood Stain Walnut 500ml', 'quantity' => 0.3, 'unit' => 'pcs'],
                ['material_name' => 'Lacquer Spray Clear', 'quantity' => 1, 'unit' => 'pcs'],
                ['material_name' => 'Felt Pads Small', 'quantity' => 1, 'unit' => 'pcs'],
            ],
        ];

        $bomCount = 0;

        foreach ($products as $product) {
            $productName = $product->product_name ?? $product->name ?? '';
            
            // Find matching BOM config
            $bomConfig = null;
            foreach ($bomConfigs as $configName => $config) {
                if (stripos($productName, $configName) !== false) {
                    $bomConfig = $config;
                    break;
                }
            }

            // If no specific config found, create a generic BOM
            if (!$bomConfig) {
                $bomConfig = [
                    ['material_name' => 'Wood', 'quantity' => 5, 'unit' => 'kg'],
                    ['material_name' => 'Nails', 'quantity' => 30, 'unit' => 'pcs'],
                    ['material_name' => 'Varnish', 'quantity' => 1, 'unit' => 'L'],
                ];
            }

            // Create BOM entries
            foreach ($bomConfig as $bomItem) {
                // Find material by name (case insensitive)
                $material = $materials->first(function ($m) use ($bomItem) {
                    return stripos($m->material_name, $bomItem['material_name']) !== false;
                });

                // If exact match not found, try partial match
                if (!$material) {
                    $material = $materials->first(function ($m) use ($bomItem) {
                        return str_contains(strtolower($m->material_name), strtolower($bomItem['material_name']));
                    });
                }

                // If still no match, use the first available material
                if (!$material) {
                    $material = $materials->first();
                }

                if ($material) {
                    // Check if BOM entry already exists
                    $existingBOM = BOM::where('product_id', $product->id)
                        ->where('material_id', $material->material_id)
                        ->first();

                    if (!$existingBOM) {
                        BOM::create([
                            'product_id' => $product->id,
                            'material_id' => $material->material_id,
                            'quantity_per_product' => $bomItem['quantity'],
                            'unit_of_measure' => $bomItem['unit']
                        ]);
                        $bomCount++;
                    }
                }
            }
        }

        $this->command->info("Created {$bomCount} BOM entries for " . $products->count() . " products.");
    }
}
