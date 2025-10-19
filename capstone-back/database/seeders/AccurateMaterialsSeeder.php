<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Product;
use App\Models\RawMaterial;
use App\Models\Bom;
use App\Models\Material;
use App\Models\Inventory;
use App\Models\InventoryTransaction;

class AccurateMaterialsSeeder extends Seeder
{
    public function run()
    {
        $this->command->info('Creating products with accurate material data...');

        // Create Alkansya product
        $alkansya = Product::updateOrCreate(
            ['product_code' => 'ALK001'],
            [
                'product_name' => 'Alkansya',
                'name' => 'Alkansya',
                'description' => 'Traditional Filipino wooden savings box',
                'price' => 0, // Will be calculated from BOM
                'stock' => 0, // Will be updated by AlkansyaFactorySeeder
                'image' => 'storage/products/alkansya.jpg',
                'unit_of_measure' => 'pcs',
                'standard_cost' => 0, // Will be calculated
                'category_name' => 'Stocked Products',
                'raw_materials' => json_encode([
                    'Pinewood 1x4x8ft' => 1/350, // 1 piece produces 350 Alkansya
                    'Plywood 4.2mm 4x8ft' => 1/78, // 1 piece produces 78 Alkansya
                    'Acrylic 1.5mm 4x8ft' => 1/78, // 1 piece produces 78 Alkansya
                    'Pin Nail F30' => 14, // 14 nails per Alkansya
                    'Black Screw 1 1/2' => 4, // 4 screws per Alkansya
                    'Stikwell 250 grams' => 1/200, // 1 piece per 200 Alkansya
                    'Grinder pad 4inch 120 grit' => 1/50, // 1 piece per 50 Alkansya
                    'Sticker 24 inch Car Decals' => 1/78, // 1 piece produces 78 Alkansya
                    'Transfer Tape' => 1/300, // 1 piece per 300 Alkansya
                    'TAPE 2 inch 200m' => 1/150, // 1 piece per 150 Alkansya
                    'Fragile Tape' => 1/500, // 1 piece per 500 Alkansya
                    'Bubble Wrap 40 inch x 100m' => 1/250, // 1 piece per 250 Alkansya
                    'Insulation 8mm 40 inch x 100m' => 1/250 // 1 piece per 250 Alkansya
                ]),
                'total_bom_cost' => 0 // Will be calculated
            ]
        );

        // Create Dining Table product
        $diningTable = Product::updateOrCreate(
            ['product_code' => 'DT001'],
            [
                'product_name' => 'Dining Table',
                'name' => 'Dining Table',
                'description' => 'High-quality mahogany dining table',
                'price' => 0, // Will be calculated from BOM
                'stock' => 0, // Made to order
                'image' => 'storage/products/Table.jpg',
                'unit_of_measure' => 'pcs',
                'standard_cost' => 0, // Will be calculated
                'category_name' => 'Made to Order',
                'raw_materials' => json_encode([
                    'Mahogany Hardwood 2x4x8ft' => 4,
                    'Mahogany Hardwood 1x6x10ft' => 6,
                    'Plywood 18mm 4x8ft' => 1,
                    'Metal Table Brackets' => 1,
                    'Wood Screws 3 inch' => 32,
                    'Wood Glue 500ml' => 1,
                    'Sandpaper 80 Grit' => 4,
                    'Sandpaper 120 Grit' => 6,
                    'Sandpaper 220 Grit' => 4,
                    'Wood Stain Walnut 1 Liter' => 0.3,
                    'Polyurethane Gloss 1 Liter' => 0.4,
                    'Felt Pads Large' => 1
                ]),
                'total_bom_cost' => 0 // Will be calculated
            ]
        );

        // Create Wooden Chair product
        $woodenChair = Product::updateOrCreate(
            ['product_code' => 'WC001'],
            [
                'product_name' => 'Wooden Chair',
                'name' => 'Wooden Chair',
                'description' => 'Comfortable mahogany wooden chair',
                'price' => 0, // Will be calculated from BOM
                'stock' => 0, // Made to order
                'image' => 'storage/products/Chair.jpg',
                'unit_of_measure' => 'pcs',
                'standard_cost' => 0, // Will be calculated
                'category_name' => 'Made to Order',
                'raw_materials' => json_encode([
                    'Mahogany Hardwood 2x2x6ft' => 4,
                    'Mahogany Hardwood 1x4x6ft' => 3,
                    'Plywood 12mm 2x4ft' => 1,
                    'Wood Screws 2.5 inch' => 24,
                    'Wood Dowels 8mm' => 8,
                    'Wood Glue 250ml' => 1,
                    'Foam Cushion 2 inch' => 1,
                    'Upholstery Fabric' => 1.5,
                    'Upholstery Staples' => 50,
                    'Sandpaper 80 Grit' => 2,
                    'Sandpaper 120 Grit' => 3,
                    'Sandpaper 220 Grit' => 2,
                    'Wood Stain Walnut 500ml' => 0.3,
                    'Lacquer Spray Clear' => 1,
                    'Felt Pads Small' => 1
                ]),
                'total_bom_cost' => 0 // Will be calculated
            ]
        );

        // Create materials in the materials table
        $this->createMaterials();

        // Create inventory records and transactions for materials
        $this->createInventoryRecords();

        // Create raw materials entries for each product
        $this->createRawMaterials($alkansya, $diningTable, $woodenChair);

        // Create BOM entries
        $this->createBomEntries($alkansya, $diningTable, $woodenChair);

        $this->command->info('Accurate materials data seeded successfully!');
    }

    private function createMaterials()
    {
        $materials = [
            // Alkansya materials
            ['material_code' => 'PW-1X4X8', 'material_name' => 'Pinewood 1x4x8ft', 'unit_of_measure' => 'pcs', 'standard_cost' => 150.00],
            ['material_code' => 'PLY-4.2-4X8', 'material_name' => 'Plywood 4.2mm 4x8ft', 'unit_of_measure' => 'pcs', 'standard_cost' => 800.00],
            ['material_code' => 'ACR-1.5-4X8', 'material_name' => 'Acrylic 1.5mm 4x8ft', 'unit_of_measure' => 'pcs', 'standard_cost' => 1200.00],
            ['material_code' => 'PN-F30', 'material_name' => 'Pin Nail F30', 'unit_of_measure' => 'pcs', 'standard_cost' => 0.50],
            ['material_code' => 'BS-1.5', 'material_name' => 'Black Screw 1 1/2', 'unit_of_measure' => 'pcs', 'standard_cost' => 2.00],
            ['material_code' => 'STK-250G', 'material_name' => 'Stikwell 250 grams', 'unit_of_measure' => 'pcs', 'standard_cost' => 150.00],
            ['material_code' => 'GP-4IN-120', 'material_name' => 'Grinder pad 4inch 120 grit', 'unit_of_measure' => 'pcs', 'standard_cost' => 25.00],
            ['material_code' => 'STK-24IN', 'material_name' => 'Sticker 24 inch Car Decals', 'unit_of_measure' => 'pcs', 'standard_cost' => 50.00],
            ['material_code' => 'TT-TAPE', 'material_name' => 'Transfer Tape', 'unit_of_measure' => 'pcs', 'standard_cost' => 200.00],
            ['material_code' => 'TAPE-2IN-200M', 'material_name' => 'TAPE 2 inch 200m', 'unit_of_measure' => 'pcs', 'standard_cost' => 300.00],
            ['material_code' => 'FT-TAPE', 'material_name' => 'Fragile Tape', 'unit_of_measure' => 'pcs', 'standard_cost' => 250.00],
            ['material_code' => 'BW-40IN-100M', 'material_name' => 'Bubble Wrap 40 inch x 100m', 'unit_of_measure' => 'pcs', 'standard_cost' => 500.00],
            ['material_code' => 'INS-8MM-40IN-100M', 'material_name' => 'Insulation 8mm 40 inch x 100m', 'unit_of_measure' => 'pcs', 'standard_cost' => 400.00],

            // Dining Table materials
            ['material_code' => 'HW-MAHOG-2X4X8', 'material_name' => 'Mahogany Hardwood 2x4x8ft', 'unit_of_measure' => 'pcs', 'standard_cost' => 1200.00],
            ['material_code' => 'HW-MAHOG-1X6X10', 'material_name' => 'Mahogany Hardwood 1x6x10ft', 'unit_of_measure' => 'pcs', 'standard_cost' => 1500.00],
            ['material_code' => 'PLY-18-4X8', 'material_name' => 'Plywood 18mm 4x8ft', 'unit_of_measure' => 'pcs', 'standard_cost' => 2000.00],
            ['material_code' => 'TBRACKET-METAL', 'material_name' => 'Metal Table Brackets', 'unit_of_measure' => 'pcs', 'standard_cost' => 500.00],
            ['material_code' => 'WS-3', 'material_name' => 'Wood Screws 3 inch', 'unit_of_measure' => 'pcs', 'standard_cost' => 5.00],
            ['material_code' => 'WG-500', 'material_name' => 'Wood Glue 500ml', 'unit_of_measure' => 'pcs', 'standard_cost' => 200.00],
            ['material_code' => 'SAND-80', 'material_name' => 'Sandpaper 80 Grit', 'unit_of_measure' => 'pcs', 'standard_cost' => 15.00],
            ['material_code' => 'SAND-120', 'material_name' => 'Sandpaper 120 Grit', 'unit_of_measure' => 'pcs', 'standard_cost' => 15.00],
            ['material_code' => 'SAND-220', 'material_name' => 'Sandpaper 220 Grit', 'unit_of_measure' => 'pcs', 'standard_cost' => 15.00],
            ['material_code' => 'STAIN-WALNUT-1L', 'material_name' => 'Wood Stain Walnut 1 Liter', 'unit_of_measure' => 'pcs', 'standard_cost' => 800.00],
            ['material_code' => 'POLY-GLOSS-1L', 'material_name' => 'Polyurethane Gloss 1 Liter', 'unit_of_measure' => 'pcs', 'standard_cost' => 1000.00],
            ['material_code' => 'FELT-PAD-LG', 'material_name' => 'Felt Pads Large', 'unit_of_measure' => 'pcs', 'standard_cost' => 50.00],

            // Wooden Chair materials
            ['material_code' => 'HW-MAHOG-2X2X6', 'material_name' => 'Mahogany Hardwood 2x2x6ft', 'unit_of_measure' => 'pcs', 'standard_cost' => 800.00],
            ['material_code' => 'HW-MAHOG-1X4X6', 'material_name' => 'Mahogany Hardwood 1x4x6ft', 'unit_of_measure' => 'pcs', 'standard_cost' => 900.00],
            ['material_code' => 'PLY-12-2X4', 'material_name' => 'Plywood 12mm 2x4ft', 'unit_of_measure' => 'pcs', 'standard_cost' => 500.00],
            ['material_code' => 'WS-2.5', 'material_name' => 'Wood Screws 2.5 inch', 'unit_of_measure' => 'pcs', 'standard_cost' => 4.00],
            ['material_code' => 'WD-8MM', 'material_name' => 'Wood Dowels 8mm', 'unit_of_measure' => 'pcs', 'standard_cost' => 2.00],
            ['material_code' => 'WG-250', 'material_name' => 'Wood Glue 250ml', 'unit_of_measure' => 'pcs', 'standard_cost' => 100.00],
            ['material_code' => 'FOAM-CUSHION-2', 'material_name' => 'Foam Cushion 2 inch', 'unit_of_measure' => 'pcs', 'standard_cost' => 300.00],
            ['material_code' => 'FABRIC-UPHOLSTERY', 'material_name' => 'Upholstery Fabric', 'unit_of_measure' => 'pcs', 'standard_cost' => 400.00],
            ['material_code' => 'STAPLES-UPHOLSTERY', 'material_name' => 'Upholstery Staples', 'unit_of_measure' => 'pcs', 'standard_cost' => 0.10],
            ['material_code' => 'STAIN-WALNUT-500', 'material_name' => 'Wood Stain Walnut 500ml', 'unit_of_measure' => 'pcs', 'standard_cost' => 400.00],
            ['material_code' => 'LACQUER-SPRAY', 'material_name' => 'Lacquer Spray Clear', 'unit_of_measure' => 'pcs', 'standard_cost' => 200.00],
            ['material_code' => 'FELT-PAD-SM', 'material_name' => 'Felt Pads Small', 'unit_of_measure' => 'pcs', 'standard_cost' => 25.00],
        ];

        foreach ($materials as $material) {
            // Determine supplier and lead time based on material type
            $supplier = $this->getSupplierForMaterial($material['material_code']);
            $leadTimeDays = $this->getLeadTimeForMaterial($material['material_code']);
            $criticalStock = $this->getCriticalStockForMaterial($material['material_code']);
            $maxLevel = $this->getMaxLevelForMaterial($material['material_code']);

            Material::updateOrCreate(
                ['material_code' => $material['material_code']],
                [
                    'material_name' => $material['material_name'],
                    'description' => 'Material for furniture production',
                    'unit_of_measure' => $material['unit_of_measure'],
                    'reorder_level' => 10,
                    'standard_cost' => $material['standard_cost'],
                    'current_stock' => 1000,
                    'location' => 'Windfield 2',
                    'critical_stock' => $criticalStock,
                    'max_level' => $maxLevel,
                    'lead_time_days' => $leadTimeDays,
                    'supplier' => $supplier,
                    'category' => 'raw'
                ]
            );
        }
    }

    private function createInventoryRecords()
    {
        $this->command->info('Creating inventory records and transactions...');
        
        $materials = Material::all();
        foreach ($materials as $material) {
            // Create inventory record
            $inventory = Inventory::firstOrCreate(
                ['material_id' => $material->material_id],
                [
                    'material_id' => $material->material_id,
                    'location_id' => 1,
                    'current_stock' => $material->current_stock,
                    'quantity_reserved' => 0,
                    'last_updated' => now()
                ]
            );

            // Create initial stock transaction
            InventoryTransaction::firstOrCreate(
                [
                    'material_id' => $material->material_id,
                    'transaction_type' => 'PURCHASE',
                    'reference' => 'Initial Stock - Accurate Materials'
                ],
                [
                    'material_id' => $material->material_id,
                    'transaction_type' => 'PURCHASE',
                    'quantity' => $material->current_stock,
                    'reference' => 'Initial Stock - Accurate Materials',
                    'remarks' => 'Initial material stock from AccurateMaterialsSeeder',
                    'timestamp' => now(),
                    'unit_cost' => $material->standard_cost,
                    'total_cost' => $material->standard_cost * $material->current_stock
                ]
            );
        }
        
        $this->command->info('Inventory records and transactions created successfully!');
    }

    private function getSupplierForMaterial($materialCode)
    {
        // Determine supplier based on material type
        if (strpos($materialCode, 'PW-') === 0 || strpos($materialCode, 'PLY-') === 0 || strpos($materialCode, 'HW-') === 0) {
            return 'Timber Supply Co.';
        } elseif (strpos($materialCode, 'ACR-') === 0 || strpos($materialCode, 'FOAM-') === 0 || strpos($materialCode, 'FABRIC-') === 0) {
            return 'Plastic & Fabric Supply Inc.';
        } elseif (strpos($materialCode, 'PN-') === 0 || strpos($materialCode, 'BS-') === 0 || strpos($materialCode, 'WS-') === 0 || strpos($materialCode, 'WD-') === 0) {
            return 'Hardware Supply Co.';
        } elseif (strpos($materialCode, 'STK-') === 0 || strpos($materialCode, 'TAPE-') === 0 || strpos($materialCode, 'BW-') === 0 || strpos($materialCode, 'INS-') === 0) {
            return 'Packaging Materials Ltd.';
        } elseif (strpos($materialCode, 'STAIN-') === 0 || strpos($materialCode, 'POLY-') === 0 || strpos($materialCode, 'LACQUER-') === 0 || strpos($materialCode, 'WG-') === 0) {
            return 'Chemical & Adhesives Corp.';
        } elseif (strpos($materialCode, 'SAND-') === 0 || strpos($materialCode, 'GP-') === 0) {
            return 'Abrasive Tools Supply';
        } else {
            return 'General Materials Corp.';
        }
    }

    private function getLeadTimeForMaterial($materialCode)
    {
        // Determine lead time based on material type
        if (strpos($materialCode, 'PW-') === 0 || strpos($materialCode, 'PLY-') === 0 || strpos($materialCode, 'HW-') === 0) {
            return 14; // Wood materials - longer lead time
        } elseif (strpos($materialCode, 'ACR-') === 0 || strpos($materialCode, 'FOAM-') === 0 || strpos($materialCode, 'FABRIC-') === 0) {
            return 21; // Specialized materials - longer lead time
        } elseif (strpos($materialCode, 'PN-') === 0 || strpos($materialCode, 'BS-') === 0 || strpos($materialCode, 'WS-') === 0 || strpos($materialCode, 'WD-') === 0) {
            return 7; // Hardware - shorter lead time
        } elseif (strpos($materialCode, 'STK-') === 0 || strpos($materialCode, 'TAPE-') === 0 || strpos($materialCode, 'BW-') === 0 || strpos($materialCode, 'INS-') === 0) {
            return 10; // Packaging materials
        } elseif (strpos($materialCode, 'STAIN-') === 0 || strpos($materialCode, 'POLY-') === 0 || strpos($materialCode, 'LACQUER-') === 0 || strpos($materialCode, 'WG-') === 0) {
            return 14; // Chemicals - moderate lead time
        } elseif (strpos($materialCode, 'SAND-') === 0 || strpos($materialCode, 'GP-') === 0) {
            return 5; // Abrasives - short lead time
        } else {
            return 7; // Default lead time
        }
    }

    private function getCriticalStockForMaterial($materialCode)
    {
        // Determine critical stock based on material type and usage
        if (strpos($materialCode, 'PW-') === 0 || strpos($materialCode, 'PLY-') === 0 || strpos($materialCode, 'HW-') === 0) {
            return 50; // Wood materials - higher critical stock
        } elseif (strpos($materialCode, 'ACR-') === 0 || strpos($materialCode, 'FOAM-') === 0 || strpos($materialCode, 'FABRIC-') === 0) {
            return 20; // Specialized materials - moderate critical stock
        } elseif (strpos($materialCode, 'PN-') === 0 || strpos($materialCode, 'BS-') === 0 || strpos($materialCode, 'WS-') === 0 || strpos($materialCode, 'WD-') === 0) {
            return 100; // Hardware - high critical stock (small items)
        } elseif (strpos($materialCode, 'STK-') === 0 || strpos($materialCode, 'TAPE-') === 0 || strpos($materialCode, 'BW-') === 0 || strpos($materialCode, 'INS-') === 0) {
            return 30; // Packaging materials
        } elseif (strpos($materialCode, 'STAIN-') === 0 || strpos($materialCode, 'POLY-') === 0 || strpos($materialCode, 'LACQUER-') === 0 || strpos($materialCode, 'WG-') === 0) {
            return 15; // Chemicals - lower critical stock
        } elseif (strpos($materialCode, 'SAND-') === 0 || strpos($materialCode, 'GP-') === 0) {
            return 25; // Abrasives
        } else {
            return 20; // Default critical stock
        }
    }

    private function getMaxLevelForMaterial($materialCode)
    {
        // Determine max level based on material type and storage capacity
        if (strpos($materialCode, 'PW-') === 0 || strpos($materialCode, 'PLY-') === 0 || strpos($materialCode, 'HW-') === 0) {
            return 500; // Wood materials - higher max level
        } elseif (strpos($materialCode, 'ACR-') === 0 || strpos($materialCode, 'FOAM-') === 0 || strpos($materialCode, 'FABRIC-') === 0) {
            return 200; // Specialized materials - moderate max level
        } elseif (strpos($materialCode, 'PN-') === 0 || strpos($materialCode, 'BS-') === 0 || strpos($materialCode, 'WS-') === 0 || strpos($materialCode, 'WD-') === 0) {
            return 1000; // Hardware - very high max level (small items)
        } elseif (strpos($materialCode, 'STK-') === 0 || strpos($materialCode, 'TAPE-') === 0 || strpos($materialCode, 'BW-') === 0 || strpos($materialCode, 'INS-') === 0) {
            return 300; // Packaging materials
        } elseif (strpos($materialCode, 'STAIN-') === 0 || strpos($materialCode, 'POLY-') === 0 || strpos($materialCode, 'LACQUER-') === 0 || strpos($materialCode, 'WG-') === 0) {
            return 100; // Chemicals - lower max level
        } elseif (strpos($materialCode, 'SAND-') === 0 || strpos($materialCode, 'GP-') === 0) {
            return 150; // Abrasives
        } else {
            return 200; // Default max level
        }
    }

    private function createRawMaterials($alkansya, $diningTable, $woodenChair)
    {
        // Alkansya raw materials - quantities per Alkansya based on production capacity
        $alkansyaMaterials = [
            ['material_name' => 'Pinewood 1x4x8ft', 'material_code' => 'PW-1X4X8', 'quantity_needed' => 1/350, 'unit_of_measure' => 'pcs', 'unit_cost' => 150.00], // 1 piece produces 350 Alkansya
            ['material_name' => 'Plywood 4.2mm 4x8ft', 'material_code' => 'PLY-4.2-4X8', 'quantity_needed' => 1/78, 'unit_of_measure' => 'pcs', 'unit_cost' => 800.00], // 1 piece produces 78 Alkansya
            ['material_name' => 'Acrylic 1.5mm 4x8ft', 'material_code' => 'ACR-1.5-4X8', 'quantity_needed' => 1/78, 'unit_of_measure' => 'pcs', 'unit_cost' => 1200.00], // 1 piece produces 78 Alkansya
            ['material_name' => 'Pin Nail F30', 'material_code' => 'PN-F30', 'quantity_needed' => 14, 'unit_of_measure' => 'pcs', 'unit_cost' => 0.50], // 14 nails per Alkansya
            ['material_name' => 'Black Screw 1 1/2', 'material_code' => 'BS-1.5', 'quantity_needed' => 4, 'unit_of_measure' => 'pcs', 'unit_cost' => 2.00], // 4 screws per Alkansya
            ['material_name' => 'Stikwell 250 grams', 'material_code' => 'STK-250G', 'quantity_needed' => 1/200, 'unit_of_measure' => 'pcs', 'unit_cost' => 150.00], // 1 piece per 200 Alkansya
            ['material_name' => 'Grinder pad 4inch 120 grit', 'material_code' => 'GP-4IN-120', 'quantity_needed' => 1/50, 'unit_of_measure' => 'pcs', 'unit_cost' => 25.00], // 1 piece per 50 Alkansya
            ['material_name' => 'Sticker 24 inch Car Decals', 'material_code' => 'STK-24IN', 'quantity_needed' => 1/78, 'unit_of_measure' => 'pcs', 'unit_cost' => 50.00], // 1 piece produces 78 Alkansya
            ['material_name' => 'Transfer Tape', 'material_code' => 'TT-TAPE', 'quantity_needed' => 1/300, 'unit_of_measure' => 'pcs', 'unit_cost' => 200.00], // 1 piece per 300 Alkansya
            ['material_name' => 'TAPE 2 inch 200m', 'material_code' => 'TAPE-2IN-200M', 'quantity_needed' => 1/150, 'unit_of_measure' => 'pcs', 'unit_cost' => 300.00], // 1 piece per 150 Alkansya
            ['material_name' => 'Fragile Tape', 'material_code' => 'FT-TAPE', 'quantity_needed' => 1/500, 'unit_of_measure' => 'pcs', 'unit_cost' => 250.00], // 1 piece per 500 Alkansya
            ['material_name' => 'Bubble Wrap 40 inch x 100m', 'material_code' => 'BW-40IN-100M', 'quantity_needed' => 1/250, 'unit_of_measure' => 'pcs', 'unit_cost' => 500.00], // 1 piece per 250 Alkansya
            ['material_name' => 'Insulation 8mm 40 inch x 100m', 'material_code' => 'INS-8MM-40IN-100M', 'quantity_needed' => 1/250, 'unit_of_measure' => 'pcs', 'unit_cost' => 400.00], // 1 piece per 250 Alkansya
        ];

        foreach ($alkansyaMaterials as $material) {
            RawMaterial::updateOrCreate(
                [
                    'product_id' => $alkansya->id,
                    'material_name' => $material['material_name']
                ],
                [
                    'material_code' => $material['material_code'],
                    'quantity_needed' => $material['quantity_needed'],
                    'unit_of_measure' => $material['unit_of_measure'],
                    'unit_cost' => $material['unit_cost'],
                    'total_cost' => $material['quantity_needed'] * $material['unit_cost'],
                    'description' => 'Raw material for Alkansya production'
                ]
            );
        }

        // Dining Table raw materials
        $diningTableMaterials = [
            ['material_name' => 'Mahogany Hardwood 2x4x8ft', 'material_code' => 'HW-MAHOG-2X4X8', 'quantity_needed' => 4, 'unit_of_measure' => 'pcs', 'unit_cost' => 1200.00],
            ['material_name' => 'Mahogany Hardwood 1x6x10ft', 'material_code' => 'HW-MAHOG-1X6X10', 'quantity_needed' => 6, 'unit_of_measure' => 'pcs', 'unit_cost' => 1500.00],
            ['material_name' => 'Plywood 18mm 4x8ft', 'material_code' => 'PLY-18-4X8', 'quantity_needed' => 1, 'unit_of_measure' => 'pcs', 'unit_cost' => 2000.00],
            ['material_name' => 'Metal Table Brackets', 'material_code' => 'TBRACKET-METAL', 'quantity_needed' => 1, 'unit_of_measure' => 'pcs', 'unit_cost' => 500.00],
            ['material_name' => 'Wood Screws 3 inch', 'material_code' => 'WS-3', 'quantity_needed' => 32, 'unit_of_measure' => 'pcs', 'unit_cost' => 5.00],
            ['material_name' => 'Wood Glue 500ml', 'material_code' => 'WG-500', 'quantity_needed' => 1, 'unit_of_measure' => 'pcs', 'unit_cost' => 200.00],
            ['material_name' => 'Sandpaper 80 Grit', 'material_code' => 'SAND-80-DT', 'quantity_needed' => 4, 'unit_of_measure' => 'pcs', 'unit_cost' => 15.00],
            ['material_name' => 'Sandpaper 120 Grit', 'material_code' => 'SAND-120-DT', 'quantity_needed' => 6, 'unit_of_measure' => 'pcs', 'unit_cost' => 15.00],
            ['material_name' => 'Sandpaper 220 Grit', 'material_code' => 'SAND-220-DT', 'quantity_needed' => 4, 'unit_of_measure' => 'pcs', 'unit_cost' => 15.00],
            ['material_name' => 'Wood Stain Walnut 1 Liter', 'material_code' => 'STAIN-WALNUT-1L', 'quantity_needed' => 0.3, 'unit_of_measure' => 'pcs', 'unit_cost' => 800.00],
            ['material_name' => 'Polyurethane Gloss 1 Liter', 'material_code' => 'POLY-GLOSS-1L', 'quantity_needed' => 0.4, 'unit_of_measure' => 'pcs', 'unit_cost' => 1000.00],
            ['material_name' => 'Felt Pads Large', 'material_code' => 'FELT-PAD-LG', 'quantity_needed' => 1, 'unit_of_measure' => 'pcs', 'unit_cost' => 50.00],
        ];

        foreach ($diningTableMaterials as $material) {
            RawMaterial::updateOrCreate(
                [
                    'product_id' => $diningTable->id,
                    'material_name' => $material['material_name']
                ],
                [
                    'material_code' => $material['material_code'],
                    'quantity_needed' => $material['quantity_needed'],
                    'unit_of_measure' => $material['unit_of_measure'],
                    'unit_cost' => $material['unit_cost'],
                    'total_cost' => $material['quantity_needed'] * $material['unit_cost'],
                    'description' => 'Raw material for Dining Table production'
                ]
            );
        }

        // Wooden Chair raw materials
        $woodenChairMaterials = [
            ['material_name' => 'Mahogany Hardwood 2x2x6ft', 'material_code' => 'HW-MAHOG-2X2X6', 'quantity_needed' => 4, 'unit_of_measure' => 'pcs', 'unit_cost' => 800.00],
            ['material_name' => 'Mahogany Hardwood 1x4x6ft', 'material_code' => 'HW-MAHOG-1X4X6', 'quantity_needed' => 3, 'unit_of_measure' => 'pcs', 'unit_cost' => 900.00],
            ['material_name' => 'Plywood 12mm 2x4ft', 'material_code' => 'PLY-12-2X4', 'quantity_needed' => 1, 'unit_of_measure' => 'pcs', 'unit_cost' => 500.00],
            ['material_name' => 'Wood Screws 2.5 inch', 'material_code' => 'WS-2.5', 'quantity_needed' => 24, 'unit_of_measure' => 'pcs', 'unit_cost' => 4.00],
            ['material_name' => 'Wood Dowels 8mm', 'material_code' => 'WD-8MM', 'quantity_needed' => 8, 'unit_of_measure' => 'pcs', 'unit_cost' => 2.00],
            ['material_name' => 'Wood Glue 250ml', 'material_code' => 'WG-250', 'quantity_needed' => 1, 'unit_of_measure' => 'pcs', 'unit_cost' => 100.00],
            ['material_name' => 'Foam Cushion 2 inch', 'material_code' => 'FOAM-CUSHION-2', 'quantity_needed' => 1, 'unit_of_measure' => 'pcs', 'unit_cost' => 300.00],
            ['material_name' => 'Upholstery Fabric', 'material_code' => 'FABRIC-UPHOLSTERY', 'quantity_needed' => 1.5, 'unit_of_measure' => 'pcs', 'unit_cost' => 400.00],
            ['material_name' => 'Upholstery Staples', 'material_code' => 'STAPLES-UPHOLSTERY', 'quantity_needed' => 50, 'unit_of_measure' => 'pcs', 'unit_cost' => 0.10],
            ['material_name' => 'Sandpaper 80 Grit', 'material_code' => 'SAND-80-WC', 'quantity_needed' => 2, 'unit_of_measure' => 'pcs', 'unit_cost' => 15.00],
            ['material_name' => 'Sandpaper 120 Grit', 'material_code' => 'SAND-120-WC', 'quantity_needed' => 3, 'unit_of_measure' => 'pcs', 'unit_cost' => 15.00],
            ['material_name' => 'Sandpaper 220 Grit', 'material_code' => 'SAND-220-WC', 'quantity_needed' => 2, 'unit_of_measure' => 'pcs', 'unit_cost' => 15.00],
            ['material_name' => 'Wood Stain Walnut 500ml', 'material_code' => 'STAIN-WALNUT-500', 'quantity_needed' => 0.3, 'unit_of_measure' => 'pcs', 'unit_cost' => 400.00],
            ['material_name' => 'Lacquer Spray Clear', 'material_code' => 'LACQUER-SPRAY', 'quantity_needed' => 1, 'unit_of_measure' => 'pcs', 'unit_cost' => 200.00],
            ['material_name' => 'Felt Pads Small', 'material_code' => 'FELT-PAD-SM', 'quantity_needed' => 1, 'unit_of_measure' => 'pcs', 'unit_cost' => 25.00],
        ];

        foreach ($woodenChairMaterials as $material) {
            RawMaterial::updateOrCreate(
                [
                    'product_id' => $woodenChair->id,
                    'material_name' => $material['material_name']
                ],
                [
                    'material_code' => $material['material_code'],
                    'quantity_needed' => $material['quantity_needed'],
                    'unit_of_measure' => $material['unit_of_measure'],
                    'unit_cost' => $material['unit_cost'],
                    'total_cost' => $material['quantity_needed'] * $material['unit_cost'],
                    'description' => 'Raw material for Wooden Chair production'
                ]
            );
        }
    }

    private function createBomEntries($alkansya, $diningTable, $woodenChair)
    {
        // Get materials for BOM entries
        $materials = Material::all()->keyBy('material_code');

        // Alkansya BOM entries - calculated based on how many Alkansya can be produced from each piece
        $alkansyaBomMaterials = [
            'PW-1X4X8' => 1/350, // 1 piece produces 350 Alkansya, so per Alkansya = 1/350
            'PLY-4.2-4X8' => 1/78, // 1 piece produces 78 Alkansya, so per Alkansya = 1/78
            'ACR-1.5-4X8' => 1/78, // 1 piece produces 78 Alkansya, so per Alkansya = 1/78
            'PN-F30' => 14, // 14 nails per Alkansya
            'BS-1.5' => 4, // 4 screws per Alkansya
            'STK-250G' => 1/200, // 1 piece per 200 Alkansya, so per Alkansya = 1/200
            'GP-4IN-120' => 1/50, // 1 piece per 50 Alkansya, so per Alkansya = 1/50
            'STK-24IN' => 1/78, // 1 piece produces 78 Alkansya, so per Alkansya = 1/78
            'TT-TAPE' => 1/300, // 1 piece per 300 Alkansya, so per Alkansya = 1/300
            'TAPE-2IN-200M' => 1/150, // 1 piece per 150 Alkansya, so per Alkansya = 1/150
            'FT-TAPE' => 1/500, // 1 piece per 500 Alkansya, so per Alkansya = 1/500
            'BW-40IN-100M' => 1/250, // 1 piece per 250 Alkansya, so per Alkansya = 1/250
            'INS-8MM-40IN-100M' => 1/250, // 1 piece per 250 Alkansya, so per Alkansya = 1/250
        ];

        foreach ($alkansyaBomMaterials as $materialCode => $quantity) {
            if (isset($materials[$materialCode])) {
                Bom::updateOrCreate(
                    [
                        'product_id' => $alkansya->id,
                        'material_id' => $materials[$materialCode]->material_id
                    ],
                    [
                        'material_name' => $materials[$materialCode]->material_name,
                        'quantity_per_product' => $quantity,
                        'unit_of_measure' => $materials[$materialCode]->unit_of_measure
                    ]
                );
            }
        }

        // Dining Table BOM entries
        $diningTableBomMaterials = [
            'HW-MAHOG-2X4X8' => 4,
            'HW-MAHOG-1X6X10' => 6,
            'PLY-18-4X8' => 1,
            'TBRACKET-METAL' => 1,
            'WS-3' => 32,
            'WG-500' => 1,
            'SAND-80-DT' => 4,
            'SAND-120-DT' => 6,
            'SAND-220-DT' => 4,
            'STAIN-WALNUT-1L' => 0.3,
            'POLY-GLOSS-1L' => 0.4,
            'FELT-PAD-LG' => 1,
        ];

        foreach ($diningTableBomMaterials as $materialCode => $quantity) {
            if (isset($materials[$materialCode])) {
                Bom::updateOrCreate(
                    [
                        'product_id' => $diningTable->id,
                        'material_id' => $materials[$materialCode]->material_id
                    ],
                    [
                        'material_name' => $materials[$materialCode]->material_name,
                        'quantity_per_product' => $quantity,
                        'unit_of_measure' => $materials[$materialCode]->unit_of_measure
                    ]
                );
            }
        }

        // Wooden Chair BOM entries
        $woodenChairBomMaterials = [
            'HW-MAHOG-2X2X6' => 4,
            'HW-MAHOG-1X4X6' => 3,
            'PLY-12-2X4' => 1,
            'WS-2.5' => 24,
            'WD-8MM' => 8,
            'WG-250' => 1,
            'FOAM-CUSHION-2' => 1,
            'FABRIC-UPHOLSTERY' => 1.5,
            'STAPLES-UPHOLSTERY' => 50,
            'SAND-80-WC' => 2,
            'SAND-120-WC' => 3,
            'SAND-220-WC' => 2,
            'STAIN-WALNUT-500' => 0.3,
            'LACQUER-SPRAY' => 1,
            'FELT-PAD-SM' => 1,
        ];

        foreach ($woodenChairBomMaterials as $materialCode => $quantity) {
            if (isset($materials[$materialCode])) {
                Bom::updateOrCreate(
                    [
                        'product_id' => $woodenChair->id,
                        'material_id' => $materials[$materialCode]->material_id
                    ],
                    [
                        'material_name' => $materials[$materialCode]->material_name,
                        'quantity_per_product' => $quantity,
                        'unit_of_measure' => $materials[$materialCode]->unit_of_measure
                    ]
                );
            }
        }

        // Calculate and update total BOM costs for each product
        $this->updateProductBomCosts($alkansya, $diningTable, $woodenChair);
    }

    private function updateProductBomCosts($alkansya, $diningTable, $woodenChair)
    {
        // Calculate Alkansya total BOM cost
        $alkansyaTotalCost = RawMaterial::where('product_id', $alkansya->id)->sum('total_cost');
        $alkansya->update([
            'total_bom_cost' => $alkansyaTotalCost,
            'price' => $alkansyaTotalCost * 1.5, // 50% markup
            'standard_cost' => $alkansyaTotalCost
        ]);

        // Calculate Dining Table total BOM cost
        $diningTableTotalCost = RawMaterial::where('product_id', $diningTable->id)->sum('total_cost');
        $diningTable->update([
            'total_bom_cost' => $diningTableTotalCost,
            'price' => $diningTableTotalCost * 1.5, // 50% markup
            'standard_cost' => $diningTableTotalCost
        ]);

        // Calculate Wooden Chair total BOM cost
        $woodenChairTotalCost = RawMaterial::where('product_id', $woodenChair->id)->sum('total_cost');
        $woodenChair->update([
            'total_bom_cost' => $woodenChairTotalCost,
            'price' => $woodenChairTotalCost * 1.5, // 50% markup
            'standard_cost' => $woodenChairTotalCost
        ]);
    }
}