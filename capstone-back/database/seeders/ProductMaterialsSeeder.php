<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProductMaterial;
use App\Models\Product;
use App\Models\InventoryItem;

class ProductMaterialsSeeder extends Seeder
{
    public function run()
    {
        $this->command->info('Creating Bill of Materials (BOM) for products...');

        // Get products
        $diningTable = Product::where('name', 'Dining Table')->first();
        $woodenChair = Product::where('name', 'Wooden Chair')->first();
        $alkansya = Product::where('name', 'Alkansya')->first();

        if (!$diningTable || !$woodenChair || !$alkansya) {
            $this->command->error('Products not found. Please run ProductsTableSeeder first.');
            return;
        }

        // === DINING TABLE BOM ===
        $tableMaterials = [
            ['sku' => 'HW-2x6x8', 'quantity' => 4, 'unit' => 'piece'], // 4 legs
            ['sku' => 'HW-1x8x10', 'quantity' => 6, 'unit' => 'piece'], // Table top boards
            ['sku' => 'PLY-18-4x8', 'quantity' => 1, 'unit' => 'sheet'], // Support
            ['sku' => 'WS-3', 'quantity' => 32, 'unit' => 'piece'], // Screws
            ['sku' => 'WG-250', 'quantity' => 1, 'unit' => 'bottle'], // Glue
            ['sku' => 'SAND-80', 'quantity' => 4, 'unit' => 'sheet'], // Rough sanding
            ['sku' => 'SAND-120', 'quantity' => 6, 'unit' => 'sheet'], // Fine sanding
            ['sku' => 'VARN-1L', 'quantity' => 0.5, 'unit' => 'liter'], // Varnish
        ];

        foreach ($tableMaterials as $material) {
            $inventoryItem = InventoryItem::where('sku', $material['sku'])->first();
            if ($inventoryItem) {
                ProductMaterial::updateOrCreate(
                    [
                        'product_id' => $diningTable->id,
                        'inventory_item_id' => $inventoryItem->id,
                    ],
                    [
                        'qty_per_unit' => $material['quantity'],
                    ]
                );
                $this->command->info("  Added: {$inventoryItem->name} ({$material['quantity']} {$material['unit']}) to Dining Table");
            }
        }

        // === WOODEN CHAIR BOM ===
        $chairMaterials = [
            ['sku' => 'HW-2x2x6', 'quantity' => 4, 'unit' => 'piece'], // 4 legs
            ['sku' => 'HW-1x4x6', 'quantity' => 3, 'unit' => 'piece'], // Seat & back slats
            ['sku' => 'PLY-12-2x4', 'quantity' => 1, 'unit' => 'sheet'], // Seat base
            ['sku' => 'WS-2', 'quantity' => 24, 'unit' => 'piece'], // Screws
            ['sku' => 'WD-1.5', 'quantity' => 8, 'unit' => 'piece'], // Dowels for joints
            ['sku' => 'FOAM-2', 'quantity' => 1, 'unit' => 'sheet'], // Cushion
            ['sku' => 'FAB-1Y', 'quantity' => 1.5, 'unit' => 'yard'], // Fabric cover
            ['sku' => 'STAIN-500', 'quantity' => 0.3, 'unit' => 'bottle'], // Wood stain
            ['sku' => 'SAND-120', 'quantity' => 3, 'unit' => 'sheet'], // Sanding
        ];

        foreach ($chairMaterials as $material) {
            $inventoryItem = InventoryItem::where('sku', $material['sku'])->first();
            if ($inventoryItem) {
                ProductMaterial::updateOrCreate(
                    [
                        'product_id' => $woodenChair->id,
                        'inventory_item_id' => $inventoryItem->id,
                    ],
                    [
                        'qty_per_unit' => $material['quantity'],
                    ]
                );
                $this->command->info("  Added: {$inventoryItem->name} ({$material['quantity']} {$material['unit']}) to Wooden Chair");
            }
        }

        // === ALKANSYA BOM (existing) ===
        $alkansyaMaterials = [
            ['sku' => 'PW-1x4x8', 'quantity' => 0.5, 'unit' => 'piece'],
            ['sku' => 'PLY-4.2-4x8', 'quantity' => 0.25, 'unit' => 'sheet'],
            ['sku' => 'ACR-1.5-4x8', 'quantity' => 0.1, 'unit' => 'sheet'],
            ['sku' => 'PN-F30', 'quantity' => 20, 'unit' => 'piece'],
            ['sku' => 'BS-1.5', 'quantity' => 4, 'unit' => 'piece'],
            ['sku' => 'STKW-250', 'quantity' => 0.1, 'unit' => 'tube'],
        ];

        foreach ($alkansyaMaterials as $material) {
            $inventoryItem = InventoryItem::where('sku', $material['sku'])->first();
            if ($inventoryItem) {
                ProductMaterial::updateOrCreate(
                    [
                        'product_id' => $alkansya->id,
                        'inventory_item_id' => $inventoryItem->id,
                    ],
                    [
                        'qty_per_unit' => $material['quantity'],
                    ]
                );
                $this->command->info("  Added: {$inventoryItem->name} ({$material['quantity']} {$material['unit']}) to Alkansya");
            }
        }

        $this->command->info('Bill of Materials created successfully!');
        $this->command->info('Total BOM entries: ' . ProductMaterial::count());
    }
}
