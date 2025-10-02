<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\InventoryUsage;
use App\Models\InventoryItem;
use App\Models\Production;
use App\Models\ProductMaterial;
use App\Models\Product;
use App\Models\Order;
use Carbon\Carbon;

class InventoryUsageSeeder extends Seeder
{
    /**
     * Seed inventory usage data based on AccurateOrdersSeeder AND AlkansyaDailyOutputSeeder
     * This creates accurate usage records matching both production orders and daily Alkansya output
     */
    public function run()
    {
        $this->command->info('=== Creating Inventory Usage Records ===');
        $this->command->info('Sources: AccurateOrdersSeeder + AlkansyaDailyOutputSeeder');
        $this->command->info("");

        // Clear existing usage data
        InventoryUsage::truncate();

        $totalUsageCount = 0;

        // ========================================
        // PART 1: Process Productions from AccurateOrdersSeeder
        // ========================================
        $this->command->info('--- PART 1: Processing Custom Furniture Orders ---');
        
        $productions = Production::with(['product', 'order'])
            ->whereNotNull('order_id')
            ->orderBy('production_started_at')
            ->get();

        if ($productions->isEmpty()) {
            $this->command->warn('No productions found from AccurateOrdersSeeder.');
        } else {
            $this->command->info("Found {$productions->count()} furniture productions");
            $this->command->info("");

            foreach ($productions as $production) {
                // Get the product's bill of materials
                $materials = ProductMaterial::where('product_id', $production->product_id)
                    ->with('inventoryItem')
                    ->get();

                if ($materials->isEmpty()) {
                    $this->command->warn("⚠ No BOM found for product: {$production->product_name}");
                    continue;
                }

                // Use production start date as usage date (when materials are consumed)
                $usageDate = $production->production_started_at 
                    ? Carbon::parse($production->production_started_at)->format('Y-m-d')
                    : Carbon::parse($production->date)->format('Y-m-d');

                $this->command->info("📦 Order #{$production->order_id} - {$production->product_name} x{$production->quantity}");
                $this->command->info("   Date: {$usageDate} | Progress: {$production->overall_progress}%");

                // For each material in the BOM, create usage record
                foreach ($materials as $material) {
                    if (!$material->inventoryItem) {
                        continue;
                    }

                    $qtyUsed = $material->qty_per_unit * $production->quantity;

                    InventoryUsage::create([
                        'inventory_item_id' => $material->inventory_item_id,
                        'date' => $usageDate,
                        'qty_used' => $qtyUsed,
                    ]);

                    $this->command->info("   ✓ {$material->inventoryItem->name}: {$qtyUsed} {$material->inventoryItem->unit}");
                    $totalUsageCount++;
                }
                $this->command->info("");
            }
        }

        // ========================================
        // PART 2: Alkansya Daily Output is handled by AlkansyaDailyOutputSeeder
        // ========================================
        $this->command->info('--- PART 2: Alkansya Daily Output ---');
        $this->command->info('Note: Alkansya inventory usage is created by AlkansyaDailyOutputSeeder');
        $this->command->info('This seeder runs AFTER AlkansyaDailyOutputSeeder in DatabaseSeeder');
        
        // Count Alkansya usage records created by AlkansyaDailyOutputSeeder
        $alkansya = Product::where('name', 'Alkansya')->first();
        if ($alkansya) {
            $alkansyaMaterials = ProductMaterial::where('product_id', $alkansya->id)
                ->pluck('inventory_item_id');
            
            $alkansyaUsageCount = InventoryUsage::whereIn('inventory_item_id', $alkansyaMaterials)->count();
            $this->command->info("✓ Found {$alkansyaUsageCount} Alkansya material usage records");
            $totalUsageCount += $alkansyaUsageCount;
        }

        $this->command->info("");
        $this->command->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        $this->command->info("✓ Furniture orders usage: " . ($totalUsageCount - ($alkansyaUsageCount ?? 0)) . " records");
        $this->command->info("✓ Alkansya daily usage: " . ($alkansyaUsageCount ?? 0) . " records");
        $this->command->info("✓ Total usage records in database: {$totalUsageCount}");
        $this->command->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }
}
