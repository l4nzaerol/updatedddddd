<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\InventoryItem;

class InventoryItemsSeeder extends Seeder
{
    public function run(): void
    {
        $items = [
            // === ALKANSYA MATERIALS ===
            [
                'sku' => 'PW-1x4x8',
                'name' => 'Pinewood 1x4x8ft',
                'category' => 'raw',
                'unit' => 'piece',
                'description' => 'Pine wood board 1x4x8 ft (for Alkansya)',
            ],
            [
                'sku' => 'PLY-4.2-4x8',
                'name' => 'Plywood 4.2mm 4x8ft',
                'category' => 'raw',
                'unit' => 'sheet',
                'description' => 'Plywood sheet 4.2mm thickness 4x8 ft (for Alkansya)',
            ],
            [
                'sku' => 'ACR-1.5-4x8',
                'name' => 'Acrylic 1.5mm 4x8ft',
                'category' => 'raw',
                'unit' => 'sheet',
                'description' => 'Acrylic sheet 1.5mm thickness 4x8 ft (for Alkansya)',
            ],
            
            // === DINING TABLE MATERIALS ===
            [
                'sku' => 'HW-2x6x8',
                'name' => 'Hardwood 2x6x8ft',
                'category' => 'raw',
                'unit' => 'piece',
                'description' => 'Hardwood lumber 2x6x8 ft (for Table Legs)',
            ],
            [
                'sku' => 'HW-1x8x10',
                'name' => 'Hardwood 1x8x10ft',
                'category' => 'raw',
                'unit' => 'piece',
                'description' => 'Hardwood board 1x8x10 ft (for Table Top)',
            ],
            [
                'sku' => 'PLY-18-4x8',
                'name' => 'Plywood 18mm 4x8ft',
                'category' => 'raw',
                'unit' => 'sheet',
                'description' => 'Plywood sheet 18mm thickness 4x8 ft (for Table Support)',
            ],
            [
                'sku' => 'WS-3',
                'name' => 'Wood Screws 3 inch',
                'category' => 'raw',
                'unit' => 'box',
                'description' => 'Wood screws 3 inch (for Table Assembly)',
            ],
            [
                'sku' => 'WG-250',
                'name' => 'Wood Glue 250ml',
                'category' => 'raw',
                'unit' => 'bottle',
                'description' => 'Wood glue 250ml (for Table Joints)',
            ],
            [
                'sku' => 'SAND-80',
                'name' => 'Sandpaper 80 Grit',
                'category' => 'raw',
                'unit' => 'sheet',
                'description' => 'Sandpaper 80 grit (for Table Sanding)',
            ],
            [
                'sku' => 'SAND-120',
                'name' => 'Sandpaper 120 Grit',
                'category' => 'raw',
                'unit' => 'sheet',
                'description' => 'Sandpaper 120 grit (for Table Finishing)',
            ],
            [
                'sku' => 'VARN-1L',
                'name' => 'Wood Varnish 1 Liter',
                'category' => 'raw',
                'unit' => 'liter',
                'description' => 'Wood varnish 1 liter (for Table Finish)',
            ],
            
            // === WOODEN CHAIR MATERIALS ===
            [
                'sku' => 'HW-2x2x6',
                'name' => 'Hardwood 2x2x6ft',
                'category' => 'raw',
                'unit' => 'piece',
                'description' => 'Hardwood lumber 2x2x6 ft (for Chair Legs)',
            ],
            [
                'sku' => 'HW-1x4x6',
                'name' => 'Hardwood 1x4x6ft',
                'category' => 'raw',
                'unit' => 'piece',
                'description' => 'Hardwood board 1x4x6 ft (for Chair Seat/Back)',
            ],
            [
                'sku' => 'PLY-12-2x4',
                'name' => 'Plywood 12mm 2x4ft',
                'category' => 'raw',
                'unit' => 'sheet',
                'description' => 'Plywood sheet 12mm thickness 2x4 ft (for Chair Seat)',
            ],
            [
                'sku' => 'WS-2',
                'name' => 'Wood Screws 2 inch',
                'category' => 'raw',
                'unit' => 'box',
                'description' => 'Wood screws 2 inch (for Chair Assembly)',
            ],
            [
                'sku' => 'WD-1.5',
                'name' => 'Wood Dowels 1.5 inch',
                'category' => 'raw',
                'unit' => 'piece',
                'description' => 'Wood dowels 1.5 inch (for Chair Joints)',
            ],
            [
                'sku' => 'FOAM-2',
                'name' => 'Foam Padding 2 inch',
                'category' => 'raw',
                'unit' => 'sheet',
                'description' => 'Foam padding 2 inch (for Chair Cushion)',
            ],
            [
                'sku' => 'FAB-1Y',
                'name' => 'Fabric 1 Yard',
                'category' => 'raw',
                'unit' => 'yard',
                'description' => 'Upholstery fabric (for Chair Cover)',
            ],
            [
                'sku' => 'STAIN-500',
                'name' => 'Wood Stain 500ml',
                'category' => 'raw',
                'unit' => 'bottle',
                'description' => 'Wood stain 500ml (for Chair Finish)',
            ],
            [
                'sku' => 'PN-F30',
                'name' => 'Pin Nail F30',
                'category' => 'raw',
                'unit' => 'box',
                'description' => 'F30 pin nails',
            ],
            [
                'sku' => 'BS-1.5',
                'name' => 'Black Screw 1 1/2',
                'category' => 'raw',
                'unit' => 'box',
                'description' => 'Black screw 1.5 inch',
            ],
            [
                'sku' => 'STKW-250',
                'name' => 'Stikwell 250',
                'category' => 'raw',
                'unit' => 'tube',
                'description' => 'Stikwell adhesive 250',
            ],
            [
                'sku' => 'GRP-4-120',
                'name' => 'Grinder pad 4inch 120 grit',
                'category' => 'raw',
                'unit' => 'piece',
                'description' => 'Grinding pad 4 inch, 120 grit',
            ],
            [
                'sku' => 'STK-24-W',
                'name' => 'Sticker 24 inch Car Decals - White',
                'category' => 'raw',
                'unit' => 'roll',
                'description' => 'White sticker roll, 24 inch for car decals',
            ],
            [
                'sku' => 'STK-24-B',
                'name' => 'Sticker 24 inch Car Decals - Black',
                'category' => 'raw',
                'unit' => 'roll',
                'description' => 'Black sticker roll, 24 inch for car decals',
            ],
            [
                'sku' => 'TFT-24',
                'name' => 'Transfer Tape 24 inch',
                'category' => 'raw',
                'unit' => 'roll',
                'description' => 'Transfer tape, 24 inch width',
            ],
            [
                'sku' => 'TAPE-2-300',
                'name' => 'TAPE 2 inch 300m',
                'category' => 'raw',
                'unit' => 'roll',
                'description' => 'General packing tape, 2 inch x 300 m',
            ],
            [
                'sku' => 'FRAG-2-300',
                'name' => 'Fragile Tape 2inch 300m',
                'category' => 'raw',
                'unit' => 'roll',
                'description' => 'Fragile printed packing tape, 2 inch x 300 m',
            ],
            [
                'sku' => 'BWRAP-40-100',
                'name' => 'Bubble Wrap 40 inch x 100 m',
                'category' => 'raw',
                'unit' => 'roll',
                'description' => 'Bubble wrap roll 40 inch width x 100 m length',
            ],
            [
                'sku' => 'INS-8-40-100',
                'name' => 'Insulation 8mm 40 inch x 100 m',
                'category' => 'raw',
                'unit' => 'roll',
                'description' => 'Insulation foam 8mm, 40 inch width x 100 m length',
            ],
        ];

        // Seed sensible default stocks so items display with on-hand quantities
        $defaults = [
            'quantity_on_hand' => 100,
            'safety_stock' => 10,
            'reorder_point' => 20,
            'max_level' => 200,
            'lead_time_days' => 7,
            'location' => 'Main Warehouse',
        ];

        // Assign specific quantities for some items
        $qtyMap = [
            // Alkansya materials - Enough for 1 month production (~1,200 units)
            // Based on BOM: 0.5 piece, 0.25 sheet, 0.1 sheet, 20 pieces, 4 pieces, 0.1 tube per unit
            'PW-1x4x8' => 800,      // 0.5 × 1200 = 600 needed + buffer
            'PLY-4.2-4x8' => 400,   // 0.25 × 1200 = 300 needed + buffer
            'ACR-1.5-4x8' => 200,   // 0.1 × 1200 = 120 needed + buffer
            'PN-F30' => 30000,      // 20 × 1200 = 24,000 needed + buffer
            'BS-1.5' => 6000,       // 4 × 1200 = 4,800 needed + buffer
            'STKW-250' => 200,      // 0.1 × 1200 = 120 needed + buffer
            'GRP-4-120' => 150,
            'STK-24-W' => 200,
            'STK-24-B' => 180,
            'TFT-24' => 90,
            'TAPE-2-300' => 300,
            'BWRAP-40-100' => 50,
            'INS-8-40-100' => 45,
            
            // Dining Table materials
            'HW-2x6x8' => 150,
            'HW-1x8x10' => 200,
            'PLY-18-4x8' => 100,
            'WS-3' => 300,
            'WG-250' => 80,
            'SAND-80' => 250,
            'SAND-120' => 200,
            'VARN-1L' => 60,
            
            // Wooden Chair materials
            'HW-2x2x6' => 180,
            'HW-1x4x6' => 220,
            'PLY-12-2x4' => 120,
            'WS-2' => 350,
            'WD-1.5' => 400,
            'FOAM-2' => 90,
            'FAB-1Y' => 150,
            'STAIN-500' => 70,
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
                    'unit_cost' => null,
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
                'location' => 'Finished Goods Warehouse',
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
    }
}


