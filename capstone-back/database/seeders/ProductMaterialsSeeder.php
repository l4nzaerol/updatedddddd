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
            // Main structural materials
            ['sku' => 'HW-MAHOG-2x4x8', 'quantity' => 4, 'unit' => 'piece'], // 4 legs
            ['sku' => 'HW-MAHOG-1x6x10', 'quantity' => 6, 'unit' => 'piece'], // Table top boards
            ['sku' => 'PLY-18-4x8', 'quantity' => 1, 'unit' => 'sheet'], // Support/base
            ['sku' => 'TBRACKET-METAL', 'quantity' => 1, 'unit' => 'set'], // Metal brackets
            
            // Fasteners and adhesives
            ['sku' => 'WS-3', 'quantity' => 32, 'unit' => 'piece'], // Wood screws
            ['sku' => 'WG-500', 'quantity' => 1, 'unit' => 'bottle'], // Wood glue
            
            // Sanding materials
            ['sku' => 'SAND-80', 'quantity' => 4, 'unit' => 'sheet'], // Rough sanding
            ['sku' => 'SAND-120', 'quantity' => 6, 'unit' => 'sheet'], // Fine sanding
            ['sku' => 'SAND-220', 'quantity' => 4, 'unit' => 'sheet'], // Final sanding
            
            // Finishing materials
            ['sku' => 'STAIN-WALNUT-1L', 'quantity' => 0.3, 'unit' => 'liter'], // Wood stain
            ['sku' => 'POLY-GLOSS-1L', 'quantity' => 0.4, 'unit' => 'liter'], // Polyurethane
            
            // Protection materials
            ['sku' => 'FELT-PAD-LG', 'quantity' => 1, 'unit' => 'pack'], // Felt pads for legs
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
            // Main structural materials
            ['sku' => 'HW-MAHOG-2x2x6', 'quantity' => 4, 'unit' => 'piece'], // 4 legs
            ['sku' => 'HW-MAHOG-1x4x6', 'quantity' => 3, 'unit' => 'piece'], // Backrest slats
            ['sku' => 'PLY-12-2x4', 'quantity' => 1, 'unit' => 'sheet'], // Seat base
            
            // Fasteners and joints
            ['sku' => 'WS-2.5', 'quantity' => 24, 'unit' => 'piece'], // Wood screws
            ['sku' => 'WD-8MM', 'quantity' => 8, 'unit' => 'piece'], // Wood dowels for joints
            ['sku' => 'WG-250', 'quantity' => 1, 'unit' => 'bottle'], // Wood glue
            
            // Upholstery materials
            ['sku' => 'FOAM-CUSHION-2', 'quantity' => 1, 'unit' => 'sheet'], // Foam cushion
            ['sku' => 'FABRIC-UPHOLSTERY', 'quantity' => 1.5, 'unit' => 'yard'], // Upholstery fabric
            ['sku' => 'STAPLES-UPHOLSTERY', 'quantity' => 50, 'unit' => 'piece'], // Upholstery staples
            
            // Sanding materials
            ['sku' => 'SAND-80', 'quantity' => 2, 'unit' => 'sheet'], // Rough sanding
            ['sku' => 'SAND-120', 'quantity' => 3, 'unit' => 'sheet'], // Fine sanding
            ['sku' => 'SAND-220', 'quantity' => 2, 'unit' => 'sheet'], // Final sanding
            
            // Finishing materials
            ['sku' => 'STAIN-WALNUT-500', 'quantity' => 0.3, 'unit' => 'bottle'], // Wood stain
            ['sku' => 'LACQUER-SPRAY', 'quantity' => 1, 'unit' => 'can'], // Lacquer protection
            
            // Protection materials
            ['sku' => 'FELT-PAD-SM', 'quantity' => 1, 'unit' => 'pack'], // Felt pads for legs
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

        // === ALKANSYA BOM (simplified to 1 quantity per material) ===
        $alkansyaMaterials = [
            // Core structural materials (1 quantity each)
            ['sku' => 'PW-1x4x8', 'quantity' => 1, 'unit' => 'piece'], // Pinewood frame
            ['sku' => 'PLY-4.2-4x8', 'quantity' => 1, 'unit' => 'sheet'], // Plywood backing
            ['sku' => 'ACR-1.5-4x8', 'quantity' => 1, 'unit' => 'sheet'], // Acrylic front
            
            // Fasteners and adhesives (1 quantity each)
            ['sku' => 'PN-F30', 'quantity' => 1, 'unit' => 'box'], // Pin nails
            ['sku' => 'BS-1.5', 'quantity' => 1, 'unit' => 'box'], // Black screws
            ['sku' => 'STKW-250', 'quantity' => 1, 'unit' => 'tube'], // Stikwell adhesive
            
            // Processing materials (1 quantity each)
            ['sku' => 'GRP-4-120', 'quantity' => 1, 'unit' => 'piece'], // Grinder pad
            
            // Decorative materials (1 quantity each)
            ['sku' => 'STK-24-W', 'quantity' => 1, 'unit' => 'roll'], // White stickers
            ['sku' => 'STK-24-B', 'quantity' => 1, 'unit' => 'roll'], // Black stickers
            ['sku' => 'TFT-24', 'quantity' => 1, 'unit' => 'roll'], // Transfer tape
            
            // Packaging materials (1 quantity each)
            ['sku' => 'TAPE-2-300', 'quantity' => 1, 'unit' => 'roll'], // Packing tape
            ['sku' => 'FRAG-2-300', 'quantity' => 1, 'unit' => 'roll'], // Fragile tape
            ['sku' => 'BWRAP-40-100', 'quantity' => 1, 'unit' => 'roll'], // Bubble wrap
            ['sku' => 'INS-8-40-100', 'quantity' => 1, 'unit' => 'roll'], // Insulation foam
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
