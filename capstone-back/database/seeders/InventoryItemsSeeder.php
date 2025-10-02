<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\InventoryItem;

class InventoryItemsSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            // ========================================
            // === ALKANSYA MATERIALS ===
            // ========================================
            [
                'sku' => 'PW-1x4x8',
                'name' => 'Pinewood 1x4x8ft',
                'category' => 'raw',
                'unit' => 'piece',
                'unit_cost' => 85.00,
                'description' => 'Pine wood board 1x4x8 ft (for Alkansya)',
            ],
            [
                'sku' => 'PLY-4.2-4x8',
                'name' => 'Plywood 4.2mm 4x8ft',
                'category' => 'raw',
                'unit' => 'sheet',
                'unit_cost' => 320.00,
                'description' => 'Plywood sheet 4.2mm thickness 4x8 ft (for Alkansya)',
            ],
            [
                'sku' => 'ACR-1.5-4x8',
                'name' => 'Acrylic 1.5mm 4x8ft',
                'category' => 'raw',
                'unit' => 'sheet',
                'unit_cost' => 450.00,
                'description' => 'Acrylic sheet 1.5mm thickness 4x8 ft (for Alkansya)',
            ],
            [
                'sku' => 'PN-F30',
                'name' => 'Pin Nail F30',
                'category' => 'raw',
                'unit' => 'box',
                'unit_cost' => 180.00,
                'description' => 'F30 pin nails (1000 pcs per box) (for Alkansya)',
            ],
            [
                'sku' => 'BS-1.5',
                'name' => 'Black Screw 1 1/2',
                'category' => 'raw',
                'unit' => 'box',
                'unit_cost' => 250.00,
                'description' => 'Black screw 1.5 inch (500 pcs per box) (for Alkansya)',
            ],
            [
                'sku' => 'STKW-250',
                'name' => 'Stikwell 250',
                'category' => 'raw',
                'unit' => 'tube',
                'unit_cost' => 65.00,
                'description' => 'Stikwell adhesive 250ml (for Alkansya)',
            ],
            [
                'sku' => 'GRP-4-120',
                'name' => 'Grinder pad 4inch 120 grit',
                'category' => 'raw',
                'unit' => 'piece',
                'unit_cost' => 25.00,
                'description' => 'Grinding pad 4 inch, 120 grit (for Alkansya)',
            ],
            [
                'sku' => 'STK-24-W',
                'name' => 'Sticker 24 inch Car Decals - White',
                'category' => 'raw',
                'unit' => 'roll',
                'unit_cost' => 850.00,
                'description' => 'White sticker roll, 24 inch x 50m (for Alkansya)',
            ],
            [
                'sku' => 'STK-24-B',
                'name' => 'Sticker 24 inch Car Decals - Black',
                'category' => 'raw',
                'unit' => 'roll',
                'unit_cost' => 850.00,
                'description' => 'Black sticker roll, 24 inch x 50m (for Alkansya)',
            ],
            [
                'sku' => 'TFT-24',
                'name' => 'Transfer Tape 24 inch',
                'category' => 'raw',
                'unit' => 'roll',
                'unit_cost' => 380.00,
                'description' => 'Transfer tape, 24 inch x 50m (for Alkansya)',
            ],
            [
                'sku' => 'TAPE-2-300',
                'name' => 'TAPE 2 inch 300m',
                'category' => 'raw',
                'unit' => 'roll',
                'unit_cost' => 120.00,
                'description' => 'General packing tape, 2 inch x 300 m (for Alkansya)',
            ],
            [
                'sku' => 'FRAG-2-300',
                'name' => 'Fragile Tape 2inch 300m',
                'category' => 'raw',
                'unit' => 'roll',
                'unit_cost' => 135.00,
                'description' => 'Fragile printed packing tape, 2 inch x 300 m (for Alkansya)',
            ],
            [
                'sku' => 'BWRAP-40-100',
                'name' => 'Bubble Wrap 40 inch x 100 m',
                'category' => 'raw',
                'unit' => 'roll',
                'unit_cost' => 680.00,
                'description' => 'Bubble wrap roll 40 inch width x 100 m length (for Alkansya)',
            ],
            [
                'sku' => 'INS-8-40-100',
                'name' => 'Insulation 8mm 40 inch x 100 m',
                'category' => 'raw',
                'unit' => 'roll',
                'unit_cost' => 720.00,
                'description' => 'Insulation foam 8mm, 40 inch width x 100 m length (for Alkansya)',
            ],
            
            // ========================================
            // === WOODEN DINING TABLE MATERIALS ===
            // ========================================
            [
                'sku' => 'HW-MAHOG-2x4x8',
                'name' => 'Mahogany Hardwood 2x4x8ft',
                'category' => 'raw',
                'unit' => 'piece',
                'unit_cost' => 420.00,
                'description' => 'Mahogany hardwood lumber 2x4x8 ft (for Table Legs)',
            ],
            [
                'sku' => 'HW-MAHOG-1x6x10',
                'name' => 'Mahogany Hardwood 1x6x10ft',
                'category' => 'raw',
                'unit' => 'piece',
                'unit_cost' => 580.00,
                'description' => 'Mahogany hardwood board 1x6x10 ft (for Table Top)',
            ],
            [
                'sku' => 'PLY-18-4x8',
                'name' => 'Plywood 18mm 4x8ft',
                'category' => 'raw',
                'unit' => 'sheet',
                'unit_cost' => 850.00,
                'description' => 'Plywood sheet 18mm thickness 4x8 ft (for Table Base)',
            ],
            [
                'sku' => 'WS-3',
                'name' => 'Wood Screws 3 inch',
                'category' => 'raw',
                'unit' => 'box',
                'unit_cost' => 320.00,
                'description' => 'Wood screws 3 inch (200 pcs per box) (for Table Assembly)',
            ],
            [
                'sku' => 'WG-500',
                'name' => 'Wood Glue 500ml',
                'category' => 'raw',
                'unit' => 'bottle',
                'unit_cost' => 145.00,
                'description' => 'Wood glue 500ml (for Table Joints)',
            ],
            [
                'sku' => 'SAND-80',
                'name' => 'Sandpaper 80 Grit',
                'category' => 'raw',
                'unit' => 'sheet',
                'unit_cost' => 8.00,
                'description' => 'Sandpaper 80 grit (for Table Rough Sanding)',
            ],
            [
                'sku' => 'SAND-120',
                'name' => 'Sandpaper 120 Grit',
                'category' => 'raw',
                'unit' => 'sheet',
                'unit_cost' => 8.00,
                'description' => 'Sandpaper 120 grit (for Table Fine Sanding)',
            ],
            [
                'sku' => 'SAND-220',
                'name' => 'Sandpaper 220 Grit',
                'category' => 'raw',
                'unit' => 'sheet',
                'unit_cost' => 10.00,
                'description' => 'Sandpaper 220 grit (for Table Finishing)',
            ],
            [
                'sku' => 'STAIN-WALNUT-1L',
                'name' => 'Wood Stain Walnut 1 Liter',
                'category' => 'raw',
                'unit' => 'liter',
                'unit_cost' => 380.00,
                'description' => 'Walnut wood stain 1 liter (for Table Coloring)',
            ],
            [
                'sku' => 'POLY-GLOSS-1L',
                'name' => 'Polyurethane Gloss 1 Liter',
                'category' => 'raw',
                'unit' => 'liter',
                'unit_cost' => 420.00,
                'description' => 'Polyurethane gloss finish 1 liter (for Table Protection)',
            ],
            [
                'sku' => 'TBRACKET-METAL',
                'name' => 'Metal Table Brackets',
                'category' => 'raw',
                'unit' => 'set',
                'unit_cost' => 180.00,
                'description' => 'Metal corner brackets (4 pcs per set) for table reinforcement',
            ],
            [
                'sku' => 'FELT-PAD-LG',
                'name' => 'Felt Pads Large',
                'category' => 'raw',
                'unit' => 'pack',
                'unit_cost' => 45.00,
                'description' => 'Large felt pads (8 pcs per pack) for table leg protection',
            ],
            
            // ========================================
            // === WOODEN CHAIR MATERIALS ===
            // ========================================
            [
                'sku' => 'HW-MAHOG-2x2x6',
                'name' => 'Mahogany Hardwood 2x2x6ft',
                'category' => 'raw',
                'unit' => 'piece',
                'unit_cost' => 280.00,
                'description' => 'Mahogany hardwood lumber 2x2x6 ft (for Chair Legs)',
            ],
            [
                'sku' => 'HW-MAHOG-1x4x6',
                'name' => 'Mahogany Hardwood 1x4x6ft',
                'category' => 'raw',
                'unit' => 'piece',
                'unit_cost' => 320.00,
                'description' => 'Mahogany hardwood board 1x4x6 ft (for Chair Backrest)',
            ],
            [
                'sku' => 'PLY-12-2x4',
                'name' => 'Plywood 12mm 2x4ft',
                'category' => 'raw',
                'unit' => 'sheet',
                'unit_cost' => 280.00,
                'description' => 'Plywood sheet 12mm thickness 2x4 ft (for Chair Seat Base)',
            ],
            [
                'sku' => 'WS-2.5',
                'name' => 'Wood Screws 2.5 inch',
                'category' => 'raw',
                'unit' => 'box',
                'unit_cost' => 280.00,
                'description' => 'Wood screws 2.5 inch (200 pcs per box) (for Chair Assembly)',
            ],
            [
                'sku' => 'WD-8MM',
                'name' => 'Wood Dowels 8mm',
                'category' => 'raw',
                'unit' => 'piece',
                'unit_cost' => 5.00,
                'description' => 'Wood dowels 8mm diameter x 36 inches (for Chair Joints)',
            ],
            [
                'sku' => 'FOAM-CUSHION-2',
                'name' => 'Foam Cushion 2 inch',
                'category' => 'raw',
                'unit' => 'sheet',
                'unit_cost' => 380.00,
                'description' => 'High-density foam cushion 2 inch (2x4 ft sheet) (for Chair Seat)',
            ],
            [
                'sku' => 'FABRIC-UPHOLSTERY',
                'name' => 'Upholstery Fabric',
                'category' => 'raw',
                'unit' => 'yard',
                'unit_cost' => 220.00,
                'description' => 'Durable upholstery fabric per yard (for Chair Covering)',
            ],
            [
                'sku' => 'STAPLES-UPHOLSTERY',
                'name' => 'Upholstery Staples',
                'category' => 'raw',
                'unit' => 'box',
                'unit_cost' => 95.00,
                'description' => 'Heavy-duty upholstery staples (1000 pcs per box) (for Chair Fabric)',
            ],
            [
                'sku' => 'WG-250',
                'name' => 'Wood Glue 250ml',
                'category' => 'raw',
                'unit' => 'bottle',
                'unit_cost' => 85.00,
                'description' => 'Wood glue 250ml (for Chair Joints)',
            ],
            [
                'sku' => 'STAIN-WALNUT-500',
                'name' => 'Wood Stain Walnut 500ml',
                'category' => 'raw',
                'unit' => 'bottle',
                'unit_cost' => 220.00,
                'description' => 'Walnut wood stain 500ml (for Chair Finish)',
            ],
            [
                'sku' => 'LACQUER-SPRAY',
                'name' => 'Lacquer Spray Clear',
                'category' => 'raw',
                'unit' => 'can',
                'unit_cost' => 180.00,
                'description' => 'Clear lacquer spray 400ml (for Chair Protection)',
            ],
            [
                'sku' => 'FELT-PAD-SM',
                'name' => 'Felt Pads Small',
                'category' => 'raw',
                'unit' => 'pack',
                'unit_cost' => 35.00,
                'description' => 'Small felt pads (8 pcs per pack) for chair leg protection',
            ],
        ];

        // All items stored at Windfield 2
        $defaults = [
            'quantity_on_hand' => 100,
            'safety_stock' => 10,
            'reorder_point' => 20,
            'max_level' => 200,
            'lead_time_days' => 7,
            'location' => 'Windfield 2',
        ];

        // Assign specific quantities for items
        $qtyMap = [
            // === Alkansya materials ===
            'PW-1x4x8' => 800,
            'PLY-4.2-4x8' => 400,
            'ACR-1.5-4x8' => 200,
            'PN-F30' => 30000,
            'BS-1.5' => 6000,
            'STKW-250' => 200,
            'GRP-4-120' => 150,
            'STK-24-W' => 200,
            'STK-24-B' => 180,
            'TFT-24' => 90,
            'TAPE-2-300' => 300,
            'FRAG-2-300' => 250,
            'BWRAP-40-100' => 50,
            'INS-8-40-100' => 45,
            
            // === Dining Table materials ===
            'HW-MAHOG-2x4x8' => 120,
            'HW-MAHOG-1x6x10' => 180,
            'PLY-18-4x8' => 80,
            'WS-3' => 500,
            'WG-500' => 60,
            'SAND-80' => 200,
            'SAND-120' => 180,
            'SAND-220' => 150,
            'STAIN-WALNUT-1L' => 40,
            'POLY-GLOSS-1L' => 35,
            'TBRACKET-METAL' => 100,
            'FELT-PAD-LG' => 80,
            
            // === Wooden Chair materials ===
            'HW-MAHOG-2x2x6' => 200,
            'HW-MAHOG-1x4x6' => 180,
            'PLY-12-2x4' => 100,
            'WS-2.5' => 600,
            'WD-8MM' => 800,
            'FOAM-CUSHION-2' => 120,
            'FABRIC-UPHOLSTERY' => 150,
            'STAPLES-UPHOLSTERY' => 300,
            'WG-250' => 70,
            'STAIN-WALNUT-500' => 50,
            'LACQUER-SPRAY' => 90,
            'FELT-PAD-SM' => 120,
        ];

        foreach ($items as $item) {
            $onHand = $qtyMap[$item['sku']] ?? $defaults['quantity_on_hand'];
            $reorderPoint = max(5, (int) round($onHand * 0.2)); // 20% of on-hand as ROP
            $maxLevel = max($onHand, (int) round($onHand * 1.8));

            InventoryItem::updateOrCreate(
                ['sku' => $item['sku']],
                [
                    'name' => $item['name'],
                    'category' => $item['category'],
                    'location' => $defaults['location'],
                    'unit' => $item['unit'] ?? null,
                    'unit_cost' => $item['unit_cost'] ?? null,
                    'supplier' => null,
                    'description' => $item['description'] ?? null,
                    'quantity_on_hand' => $onHand,
                    'safety_stock' => max(5, (int) round($onHand * 0.1)),
                    'reorder_point' => $reorderPoint,
                    'max_level' => $maxLevel,
                    'lead_time_days' => $defaults['lead_time_days'],
                ]
            );
        }

        // Add Alkansya as Finished Good
        $this->command->info('Adding Alkansya as finished good inventory...');
        InventoryItem::updateOrCreate(
            ['sku' => 'FG-ALKANSYA'],
            [
                'name' => 'Alkansya (Finished Good)',
                'category' => 'finished',
                'location' => 'Windfield 2',
                'unit' => 'piece',
                'unit_cost' => 150.00,
                'supplier' => 'In-House Production',
                'description' => 'Completed Alkansya ready for sale',
                'quantity_on_hand' => 0, // Will be updated by production
                'safety_stock' => 50,
                'reorder_point' => 100,
                'max_level' => 500,
                'lead_time_days' => 7,
            ]
        );
        $this->command->info('✓ Alkansya finished good added to inventory!');
        
        $this->command->info('✓ All inventory items seeded successfully at Windfield 2!');
    }
}


