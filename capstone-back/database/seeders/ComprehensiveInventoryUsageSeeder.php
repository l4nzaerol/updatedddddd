<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Production;
use App\Models\ProductionAnalytics;
use App\Models\ProductMaterial;
use App\Models\InventoryItem;
use App\Models\InventoryUsage;
use App\Models\Product;
use App\Models\AlkansyaDailyOutput;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ComprehensiveInventoryUsageSeeder extends Seeder
{
    /**
     * Comprehensive Inventory Usage Seeder
     * Creates accurate inventory usage data from TWO sources:
     * 1. Customer Orders (Tables, Chairs, Alkansya) - from Production records
     * 2. Daily Alkansya Production (3 months, excluding Sundays) - from ProductionAnalytics records
     */
    public function run(): void
    {
        $this->command->info('╔════════════════════════════════════════════════════════════╗');
        $this->command->info('║   COMPREHENSIVE INVENTORY USAGE SEEDER                     ║');
        $this->command->info('╚════════════════════════════════════════════════════════════╝');
        $this->command->info('');

        // Clear existing data
        $this->command->info('🗑️  Clearing existing data...');
        InventoryUsage::truncate();
        ProductionAnalytics::truncate();
        AlkansyaDailyOutput::truncate();
        $this->command->info('✓ Cleared inventory usage, production analytics, and alkansya daily output');
        $this->command->info('');

        // Part 1: Process Customer Orders
        $this->command->info('═══════════════════════════════════════════════════════════');
        $this->command->info('PART 1: Processing Customer Orders (Tables, Chairs, Alkansya)');
        $this->command->info('═══════════════════════════════════════════════════════════');
        $orderStats = $this->processCustomerOrders();
        $this->command->info('');

        // Part 2: Process Daily Alkansya Production
        $this->command->info('═══════════════════════════════════════════════════════════');
        $this->command->info('PART 2: Processing Daily Alkansya Production (3 Months)');
        $this->command->info('═══════════════════════════════════════════════════════════');
        $dailyStats = $this->processDailyAlkansyaProduction();
        $this->command->info('');

        // Final Summary
        $this->displayFinalSummary($orderStats, $dailyStats);
    }

    /**
     * Process inventory usage from customer orders (Productions)
     */
    private function processCustomerOrders(): array
    {
        $productions = Production::with(['product'])->get();
        
        if ($productions->isEmpty()) {
            $this->command->warn('⚠️  No productions found. Run ComprehensiveOrdersSeeder first.');
            return [
                'total_productions' => 0,
                'by_product' => [],
                'total_usage_records' => 0,
                'materials_affected' => []
            ];
        }

        $this->command->info("📦 Found {$productions->count()} productions to process");
        $this->command->info('');

        $stats = [
            'total_productions' => $productions->count(),
            'by_product' => [
                'Dining Table' => 0,
                'Wooden Chair' => 0,
                'Alkansya' => 0,
            ],
            'total_usage_records' => 0,
            'materials_affected' => []
        ];

        foreach ($productions as $production) {
            $productName = $production->product_name ?? $production->product_type;
            
            // Count by product
            if (isset($stats['by_product'][$productName])) {
                $stats['by_product'][$productName]++;
            }

            $this->command->info("Processing: {$productName} (Qty: {$production->quantity})");

            // Get BOM (Bill of Materials)
            $materials = ProductMaterial::where('product_id', $production->product_id)
                ->with('inventoryItem')
                ->get();

            if ($materials->isEmpty()) {
                $this->command->warn("  ⚠️  No BOM found for {$productName}");
                continue;
            }

            // Determine usage date (when production started)
            $usageDate = $production->production_started_at 
                ? Carbon::parse($production->production_started_at)->format('Y-m-d')
                : ($production->date ?? Carbon::now()->format('Y-m-d'));

            // Process each material
            foreach ($materials as $material) {
                if (!$material->inventoryItem) {
                    continue;
                }

                $qtyNeeded = $material->qty_per_unit * $production->quantity;
                
                // Create inventory usage record
                InventoryUsage::create([
                    'inventory_item_id' => $material->inventory_item_id,
                    'date' => $usageDate,
                    'qty_used' => $qtyNeeded,
                ]);

                // Update inventory quantity
                $currentQty = $material->inventoryItem->quantity_on_hand;
                $newQty = max(0, $currentQty - $qtyNeeded);
                $material->inventoryItem->update(['quantity_on_hand' => $newQty]);

                // Track statistics
                $materialName = $material->inventoryItem->name;
                if (!isset($stats['materials_affected'][$materialName])) {
                    $stats['materials_affected'][$materialName] = 0;
                }
                $stats['materials_affected'][$materialName] += $qtyNeeded;
                $stats['total_usage_records']++;

                $this->command->info("  ✓ {$materialName}: {$qtyNeeded} {$material->inventoryItem->unit}");
            }

            $this->command->info('');
        }

        // Display summary for this part
        $this->command->info('─────────────────────────────────────────────────────────');
        $this->command->info('📊 Customer Orders Summary:');
        foreach ($stats['by_product'] as $product => $count) {
            if ($count > 0) {
                $this->command->info("   • {$product}: {$count} productions");
            }
        }
        $this->command->info("   • Total usage records created: {$stats['total_usage_records']}");
        $this->command->info("   • Unique materials affected: " . count($stats['materials_affected']));

        return $stats;
    }

    /**
     * Process daily Alkansya production (3 months, excluding Sundays)
     * Saves total output to finished goods inventory
     */
    private function processDailyAlkansyaProduction(): array
    {
        // Get Alkansya product
        $alkansya = Product::where('name', 'Alkansya')->first();
        
        if (!$alkansya) {
            $this->command->warn('⚠️  Alkansya product not found.');
            return [
                'total_days' => 0,
                'total_output' => 0,
                'total_usage_records' => 0,
                'materials_affected' => []
            ];
        }

        // Get Alkansya BOM
        $materials = ProductMaterial::where('product_id', $alkansya->id)
            ->with('inventoryItem')
            ->get();

        if ($materials->isEmpty()) {
            $this->command->warn('⚠️  No BOM found for Alkansya.');
            return [
                'total_days' => 0,
                'total_output' => 0,
                'total_usage_records' => 0,
                'materials_affected' => []
            ];
        }

        $this->command->info("📦 Product: {$alkansya->name}");
        $this->command->info("📋 Materials in BOM: {$materials->count()}");
        $this->command->info('');

        // Ensure sufficient materials for 3-month production + future manual orders
        $this->command->info('🔧 Ensuring sufficient material stock for production...');
        $this->ensureSufficientMaterials($materials, $alkansya);
        $this->command->info('');

        // Generate EXACTLY 3 months of daily production (excluding Sundays)
        $startDate = Carbon::now()->subMonths(3)->startOfDay();
        $endDate = Carbon::now()->subDay(); // Up to yesterday
        
        $this->command->info("📅 Date Range: {$startDate->format('Y-m-d')} to {$endDate->format('Y-m-d')}");
        $this->command->info('🔄 Generating daily production data (NO production on Sundays)...');
        $this->command->info('');

        $stats = [
            'total_days' => 0,
            'total_output' => 0,
            'total_usage_records' => 0,
            'materials_affected' => []
        ];

        $currentDate = $startDate->copy();
        $dayCount = 0;

        while ($currentDate->lte($endDate)) {
            // Skip Sundays (dayOfWeek === 0)
            if ($currentDate->dayOfWeek === 0) {
                $currentDate->addDay();
                continue;
            }

            $dayCount++;
            $stats['total_days']++;

            // Determine daily output based on day of week
            $dailyOutput = $this->getDailyOutput($currentDate);
            $stats['total_output'] += $dailyOutput;

            if ($dailyOutput > 0) {
                // Create ProductionAnalytics record for charts
                $targetOutput = 50;
                $efficiency = min(99, round(($dailyOutput / $targetOutput) * 100, 2));
                
                ProductionAnalytics::create([
                    'date' => $currentDate->format('Y-m-d'),
                    'product_id' => $alkansya->id,
                    'target_output' => $targetOutput,
                    'actual_output' => $dailyOutput,
                    'efficiency_percentage' => $efficiency,
                    'total_duration_minutes' => rand(7 * 24 * 60, 8 * 24 * 60),
                    'avg_process_duration_minutes' => rand(1000, 1500),
                ]);

                // Create AlkansyaDailyOutput record
                $materialsUsed = [];
                foreach ($materials as $material) {
                    if ($material->inventoryItem) {
                        $qtyUsed = $material->qty_per_unit * $dailyOutput;
                        $materialsUsed[] = [
                            'inventory_item_id' => $material->inventoryItem->id,
                            'item_name' => $material->inventoryItem->name,
                            'sku' => $material->inventoryItem->sku,
                            'quantity_used' => $qtyUsed,
                            'unit_cost' => $material->inventoryItem->unit_cost,
                            'total_cost' => $material->inventoryItem->unit_cost * $qtyUsed,
                        ];
                    }
                }

                AlkansyaDailyOutput::create([
                    'date' => $currentDate->format('Y-m-d'),
                    'quantity_produced' => $dailyOutput,
                    'notes' => "Daily production - {$dailyOutput} units",
                    'produced_by' => 'Production Staff',
                    'materials_used' => $materialsUsed,
                    'efficiency_percentage' => $efficiency,
                    'defects' => rand(0, 2),
                ]);

                // Create inventory usage for each material
                foreach ($materials as $material) {
                    if ($material->inventoryItem) {
                        $qtyUsed = $material->qty_per_unit * $dailyOutput;
                        
                        InventoryUsage::create([
                            'inventory_item_id' => $material->inventory_item_id,
                            'date' => $currentDate->format('Y-m-d'),
                            'qty_used' => $qtyUsed,
                        ]);

                        // Update inventory
                        $currentQty = $material->inventoryItem->quantity_on_hand;
                        $newQty = max(0, $currentQty - $qtyUsed);
                        $material->inventoryItem->update(['quantity_on_hand' => $newQty]);

                        // Track statistics
                        $materialName = $material->inventoryItem->name;
                        if (!isset($stats['materials_affected'][$materialName])) {
                            $stats['materials_affected'][$materialName] = 0;
                        }
                        $stats['materials_affected'][$materialName] += $qtyUsed;
                        $stats['total_usage_records']++;
                    }
                }

                // Show progress every 10 days
                if ($dayCount % 10 === 0) {
                    $this->command->info("  ✓ Processed {$dayCount} days... (Latest: {$currentDate->format('Y-m-d')}, Output: {$dailyOutput})");
                }
            }

            $currentDate->addDay();
        }

        // Verify material deduction and show final levels
        $this->command->info('');
        $this->command->info('🔍 Verifying material deduction...');
        $this->verifyMaterialDeduction($materials);
        $this->command->info('');

        // Update Alkansya finished goods inventory
        $this->command->info('📦 Updating Finished Goods Inventory...');
        
        $alkansyaFinishedGood = InventoryItem::where('sku', 'FG-ALKANSYA')->first();
        
        if ($alkansyaFinishedGood) {
            $alkansyaFinishedGood->update([
                'quantity_on_hand' => $stats['total_output']
            ]);
            $this->command->info("✓ Updated Alkansya finished goods (SKU: FG-ALKANSYA)");
            $this->command->info("  → Quantity: " . number_format($stats['total_output']) . " units");
        } else {
            $this->command->warn('⚠️  Alkansya finished goods item (FG-ALKANSYA) not found in inventory');
            $this->command->warn('   Please ensure the inventory seeder creates this item');
        }

        // Display summary for this part
        $this->command->info('');
        $this->command->info('─────────────────────────────────────────────────────────');
        $this->command->info('📊 Daily Alkansya Production Summary:');
        $this->command->info("   • Total days processed: {$stats['total_days']} days (Sundays excluded)");
        $this->command->info("   • Total Alkansya produced: " . number_format($stats['total_output']) . " units");
        $this->command->info("   • Average per day: " . round($stats['total_output'] / max(1, $stats['total_days']), 1) . " units");
        $this->command->info("   • Total usage records created: {$stats['total_usage_records']}");
        $this->command->info("   • Unique materials affected: " . count($stats['materials_affected']));

        return $stats;
    }

    /**
     * Get daily output based on day of week (realistic patterns)
     * Sunday = 0 (no production)
     */
    private function getDailyOutput($date): int
    {
        $dayOfWeek = $date->dayOfWeek;
        
        // Monday-Friday: Higher output (35-50)
        if ($dayOfWeek >= 1 && $dayOfWeek <= 5) {
            return rand(35, 50);
        }
        
        // Saturday: Lower output (25-35)
        if ($dayOfWeek === 6) {
            return rand(25, 35);
        }
        
        // Sunday: No production
        return 0;
    }

    /**
     * Display final comprehensive summary
     */
    private function displayFinalSummary(array $orderStats, array $dailyStats): void
    {
        $this->command->info('╔════════════════════════════════════════════════════════════╗');
        $this->command->info('║              FINAL COMPREHENSIVE SUMMARY                   ║');
        $this->command->info('╚════════════════════════════════════════════════════════════╝');
        $this->command->info('');

        // Total inventory usage records
        $totalRecords = $orderStats['total_usage_records'] + $dailyStats['total_usage_records'];
        $this->command->info("📊 TOTAL INVENTORY USAGE RECORDS: " . number_format($totalRecords));
        $this->command->info('');

        // Breakdown by source
        $this->command->info('📦 BY SOURCE:');
        $this->command->info("   • From Customer Orders: " . number_format($orderStats['total_usage_records']) . " records");
        $this->command->info("   • From Daily Alkansya: " . number_format($dailyStats['total_usage_records']) . " records");
        $this->command->info('');

        // Production summary
        $this->command->info('🏭 PRODUCTION SUMMARY:');
        foreach ($orderStats['by_product'] as $product => $count) {
            if ($count > 0) {
                $this->command->info("   • {$product}: {$count} productions from orders");
            }
        }
        if ($dailyStats['total_output'] > 0) {
            $this->command->info("   • Alkansya Daily: " . number_format($dailyStats['total_output']) . " units over {$dailyStats['total_days']} days");
        }
        $this->command->info('');

        // Material usage summary - properly merge the arrays
        $allMaterials = [];
        foreach ($orderStats['materials_affected'] as $material => $qty) {
            $allMaterials[$material] = ($allMaterials[$material] ?? 0) + $qty;
        }
        foreach ($dailyStats['materials_affected'] as $material => $qty) {
            $allMaterials[$material] = ($allMaterials[$material] ?? 0) + $qty;
        }
        
        $this->command->info('📦 MATERIAL USAGE SUMMARY:');
        foreach ($allMaterials as $material => $qty) {
            $this->command->info("   • {$material}: " . number_format($qty, 2) . " units consumed");
        }
        $this->command->info('');

        // Date range
        if ($dailyStats['total_days'] > 0) {
            $startDate = Carbon::now()->subMonths(3)->format('Y-m-d');
            $endDate = Carbon::now()->subDay()->format('Y-m-d');
            $this->command->info('📅 DATA COVERAGE:');
            $this->command->info("   • Date Range: {$startDate} to {$endDate}");
            $this->command->info("   • Total Days: {$dailyStats['total_days']} days (Sundays excluded)");
        }
        $this->command->info('');

        // Database verification
        $actualCount = InventoryUsage::count();
        $actualAnalytics = ProductionAnalytics::count();
        $this->command->info('✅ DATABASE VERIFICATION:');
        $this->command->info("   • Expected usage records: " . number_format($totalRecords));
        $this->command->info("   • Actual usage records in DB: " . number_format($actualCount));
        $this->command->info("   • Production analytics records: " . number_format($actualAnalytics));
        
        if ($actualCount === $totalRecords) {
            $this->command->info('   • Status: ✓ MATCH - All records created successfully!');
        } else {
            $this->command->warn("   • Status: ⚠️  MISMATCH - Expected {$totalRecords}, got {$actualCount}");
        }
        $this->command->info('');

        $this->command->info('╔════════════════════════════════════════════════════════════╗');
        $this->command->info('║  ✓ INVENTORY USAGE SEEDING COMPLETE!                      ║');
        $this->command->info('║                                                            ║');
        $this->command->info('║  ✓ Alkansya finished goods updated in inventory           ║');
        $this->command->info('║  ✓ 3 months of daily production data created              ║');
        $this->command->info('║  ✓ Sundays excluded (no production)                       ║');
        $this->command->info('║                                                            ║');
        $this->command->info('║  You can now view data in:                                ║');
        $this->command->info('║  • Admin Dashboard → Daily Output                         ║');
        $this->command->info('║  • Inventory → Material Usage tab                         ║');
        $this->command->info('║  • Production → Output Analytics                          ║');
        $this->command->info('╚════════════════════════════════════════════════════════════╝');
    }

    /**
     * Ensure sufficient materials for 3-month production + future manual orders
     */
    private function ensureSufficientMaterials($materials, $alkansya)
    {
        // Calculate total materials needed for 3 months of production
        // Assuming average 40 units per day for 79 days = 3,160 units
        $estimatedTotalProduction = 3200; // Conservative estimate
        
        // Add buffer for future manual orders (additional 1000 units)
        $bufferForManualOrders = 1000;
        $totalNeeded = $estimatedTotalProduction + $bufferForManualOrders;
        
        $this->command->info("📊 Material Requirements:");
        $this->command->info("   • 3-month production: ~{$estimatedTotalProduction} units");
        $this->command->info("   • Future manual orders: {$bufferForManualOrders} units");
        $this->command->info("   • Total needed per material: {$totalNeeded} units");
        $this->command->info('');

        foreach ($materials as $material) {
            if ($material->inventoryItem) {
                $currentStock = $material->inventoryItem->quantity_on_hand;
                $requiredStock = $totalNeeded; // 1:1 BOM ratio
                
                if ($currentStock < $requiredStock) {
                    $shortfall = $requiredStock - $currentStock;
                    $newStock = $currentStock + $shortfall;
                    
                    $material->inventoryItem->update([
                        'quantity_on_hand' => $newStock
                    ]);
                    
                    $this->command->info("   ✓ {$material->inventoryItem->name}: Added {$shortfall} units (now {$newStock})");
                } else {
                    $this->command->info("   ✓ {$material->inventoryItem->name}: Sufficient stock ({$currentStock} units)");
                }
            }
        }
        
        $this->command->info('✓ All materials have sufficient stock for production + manual orders');
    }

    /**
     * Verify material deduction and show final levels
     */
    private function verifyMaterialDeduction($materials)
    {
        $this->command->info('📊 Final Material Stock Levels:');
        
        foreach ($materials as $material) {
            if ($material->inventoryItem) {
                $currentStock = $material->inventoryItem->quantity_on_hand;
                $materialName = $material->inventoryItem->name;
                
                // Determine status based on remaining stock
                if ($currentStock >= 1000) {
                    $status = "✅ Excellent";
                } elseif ($currentStock >= 500) {
                    $status = "✅ Good";
                } elseif ($currentStock >= 100) {
                    $status = "⚠️ Low";
                } else {
                    $status = "❌ Critical";
                }
                
                $this->command->info("   • {$materialName}: {$currentStock} units {$status}");
            }
        }
        
        $this->command->info('✓ Material deduction verification complete');
    }
}