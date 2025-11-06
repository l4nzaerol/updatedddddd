<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\ProductionAnalytics;
use App\Models\Product;
use App\Models\ProductMaterial;
use App\Models\InventoryUsage;
use App\Models\InventoryItem;
use Carbon\Carbon;

class AlkansyaDailyOutputSeeder extends Seeder
{
    /**
     * Seed Alkansya daily output analytics for 3 months
     * Creates analytics records AND inventory usage tracking
     * Realistic production patterns with no Sunday output
     */
    public function run(): void
    {
        $this->command->info('=== Creating Alkansya Daily Output Analytics (3 Months) ===');
        
        // Get Alkansya product
        $alkansya = Product::where('name', 'Alkansya')->first();
        
        if (!$alkansya) {
            $this->command->error('Alkansya product not found. Please run ProductsTableSeeder first.');
            return;
        }

        // Get Alkansya BOM (Bill of Materials)
        $materials = ProductMaterial::where('product_id', $alkansya->id)
            ->with('inventoryItem')
            ->get();

        if ($materials->isEmpty()) {
            $this->command->warn('No BOM found for Alkansya. Inventory usage will not be tracked.');
        }

        $this->command->info("Product: {$alkansya->name} (ID: {$alkansya->id})");
        $this->command->info("Materials in BOM: {$materials->count()}");
        $this->command->info("Creating analytics and inventory usage records...");
        $this->command->info("");

        // Start from 3 months ago
        $startDate = Carbon::now()->subMonths(3)->startOfDay();
        $endDate = Carbon::now()->subDay(); // Up to yesterday
        
        $analyticsCount = 0;
        $totalQuantity = 0;

        $this->command->info("Date Range: {$startDate->format('Y-m-d')} to {$endDate->format('Y-m-d')}");
        $this->command->info("Generating daily analytics data (excluding Sundays)...");
        $this->command->info("");

        // Loop through each day
        $currentDate = $startDate->copy();
        
        while ($currentDate->lte($endDate)) {
            // Skip Sundays (0 = Sunday)
            if ($currentDate->dayOfWeek === 0) {
                $currentDate->addDay();
                continue;
            }

            // Determine daily output based on day of week
            $dailyOutput = $this->getDailyOutput($currentDate);
            
            if ($dailyOutput > 0) {
                // Calculate efficiency (80-99% based on output)
                $targetOutput = 50; // Target 50 alkansya per day
                $efficiency = min(99, round(($dailyOutput / $targetOutput) * 100, 2));
                
                // Create analytics record for Daily Output chart
                ProductionAnalytics::create([
                    'date' => $currentDate->format('Y-m-d'),
                    'product_id' => $alkansya->id,
                    'target_output' => $targetOutput,
                    'actual_output' => $dailyOutput,
                    'efficiency_percentage' => $efficiency,
                    'total_duration_minutes' => rand(7 * 24 * 60, 8 * 24 * 60), // 7-8 days
                    'avg_process_duration_minutes' => rand(1000, 1500),
                ]);

                // Create inventory usage records for materials consumed
                if ($materials->isNotEmpty()) {
                    foreach ($materials as $material) {
                        if ($material->inventoryItem) {
                            $qtyUsed = $material->qty_per_unit * $dailyOutput;
                            
                            InventoryUsage::create([
                                'inventory_item_id' => $material->inventory_item_id,
                                'date' => $currentDate->format('Y-m-d'),
                                'qty_used' => $qtyUsed,
                            ]);
                        }
                    }
                }

                $analyticsCount++;
                $totalQuantity += $dailyOutput;

                // Log every 10 days
                if ($analyticsCount % 10 === 0) {
                    $this->command->info("✓ {$currentDate->format('Y-m-d')} ({$currentDate->format('l')}): {$dailyOutput} units | Efficiency: {$efficiency}%");
                }
            }

            $currentDate->addDay();
        }

        // Update Alkansya finished goods inventory with total produced
        $alkansyaFinishedGood = InventoryItem::where('sku', 'FG-ALKANSYA')->first();
        if ($alkansyaFinishedGood) {
            $alkansyaFinishedGood->update([
                'quantity_on_hand' => $totalQuantity
            ]);
            $this->command->info("✓ Updated Alkansya finished goods inventory: {$totalQuantity} units");
        }

        // Reduce raw material inventory based on total usage
        $this->command->info("");
        $this->command->info("Updating raw material inventory quantities...");
        
        if ($materials->isNotEmpty()) {
            foreach ($materials as $material) {
                if ($material->inventoryItem) {
                    $totalUsed = $material->qty_per_unit * $totalQuantity;
                    $currentQty = $material->inventoryItem->quantity_on_hand;
                    $newQty = max(0, $currentQty - $totalUsed);
                    
                    $material->inventoryItem->update([
                        'quantity_on_hand' => $newQty
                    ]);
                    
                    $this->command->info("  ✓ {$material->inventoryItem->name}: {$currentQty} → {$newQty} (used: {$totalUsed})");
                }
            }
        }

        $this->command->info("");
        $this->command->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        $this->command->info("✓ Created {$analyticsCount} daily analytics records!");
        $this->command->info("✓ Created inventory usage records for materials consumed");
        $this->command->info("✓ Total Alkansya output recorded: {$totalQuantity} units");
        $this->command->info("✓ Alkansya finished goods inventory updated: {$totalQuantity} units");
        $this->command->info("✓ Raw material inventory quantities reduced based on usage");
        $this->command->info("✓ Average daily output: " . round($totalQuantity / $analyticsCount, 2) . " units");
        $this->command->info("✓ Data will display in Daily Output charts");
        $this->command->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }

    /**
     * Get realistic daily output based on day of week
     * Higher output mid-week, lower on Mondays and Saturdays
     */
    private function getDailyOutput(Carbon $date): int
    {
        $dayOfWeek = $date->dayOfWeek;
        
        // 0 = Sunday (skip), 1 = Monday, 2 = Tuesday, ..., 6 = Saturday
        switch ($dayOfWeek) {
            case 0: // Sunday - No production
                return 0;
            
            case 1: // Monday - Slower start
                return rand(25, 35);
            
            case 2: // Tuesday - Normal
                return rand(35, 45);
            
            case 3: // Wednesday - Peak
                return rand(40, 50);
            
            case 4: // Thursday - Peak
                return rand(40, 50);
            
            case 5: // Friday - Normal
                return rand(35, 45);
            
            case 6: // Saturday - Half day
                return rand(20, 30);
            
            default:
                return rand(30, 40);
        }
    }
}
