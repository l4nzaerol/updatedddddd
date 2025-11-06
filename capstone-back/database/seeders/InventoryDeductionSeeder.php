<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Production;
use App\Models\ProductMaterial;
use App\Models\InventoryItem;
use App\Models\InventoryUsage;
use Carbon\Carbon;

class InventoryDeductionSeeder extends Seeder
{
    /**
     * Deduct inventory materials based on productions
     * Materials are deducted when production STARTS, not when it completes
     * Includes Tables, Chairs, and Alkansya from orders
     */
    public function run(): void
    {
        $this->command->info('=== Deducting Inventory Based on Productions ===');
        
        // Get all productions (both in-progress and completed)
        $productions = Production::with(['product'])->get();
        
        if ($productions->isEmpty()) {
            $this->command->warn('No productions found. Please run ComprehensiveOrdersSeeder first.');
            return;
        }

        $this->command->info("Found {$productions->count()} productions to process");
        $this->command->info("");

        $totalDeductions = 0;
        $materialsAffected = [];
        $productionsByType = [
            'table' => 0,
            'chair' => 0,
            'alkansya' => 0,
        ];

        foreach ($productions as $production) {
            // Count productions by type
            $productionsByType[$production->product_type] = ($productionsByType[$production->product_type] ?? 0) + 1;

            $this->command->info("Processing Production #{$production->id}: {$production->product_name} (Qty: {$production->quantity})");

            // Get BOM (Bill of Materials) for this product
            $materials = ProductMaterial::where('product_id', $production->product_id)
                ->with('inventoryItem')
                ->get();

            if ($materials->isEmpty()) {
                $this->command->warn("  ⚠ No BOM found for {$production->product_name}");
                continue;
            }

            // Deduct materials based on quantity
            foreach ($materials as $material) {
                if (!$material->inventoryItem) {
                    $this->command->warn("  ⚠ Inventory item not found for material");
                    continue;
                }

                $qtyNeeded = $material->qty_per_unit * $production->quantity;
                $currentQty = $material->inventoryItem->quantity_on_hand;
                $newQty = max(0, $currentQty - $qtyNeeded);

                // Update inventory
                $material->inventoryItem->update([
                    'quantity_on_hand' => $newQty
                ]);

                // Create inventory usage record
                $usageDate = $production->production_started_at 
                    ? Carbon::parse($production->production_started_at)->format('Y-m-d')
                    : $production->date;

                InventoryUsage::create([
                    'inventory_item_id' => $material->inventory_item_id,
                    'date' => $usageDate,
                    'qty_used' => $qtyNeeded,
                ]);

                $this->command->info("  ✓ {$material->inventoryItem->name}: {$currentQty} → {$newQty} (used: {$qtyNeeded})");

                $totalDeductions++;
                $materialsAffected[$material->inventoryItem->name] = 
                    ($materialsAffected[$material->inventoryItem->name] ?? 0) + $qtyNeeded;
            }

            $this->command->info("");
        }

        $this->command->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        $this->command->info("✓ Inventory deduction complete!");
        $this->command->info("");
        $this->command->info("📊 Production Summary:");
        $this->command->info("  • Dining Tables: {$productionsByType['table']} productions");
        $this->command->info("  • Wooden Chairs: {$productionsByType['chair']} productions");
        $this->command->info("  • Alkansya: {$productionsByType['alkansya']} productions");
        $this->command->info("");
        $this->command->info("✓ Total material deductions: {$totalDeductions}");
        $this->command->info("✓ Unique materials affected: " . count($materialsAffected));
        $this->command->info("");
        $this->command->info("📦 Materials Usage Summary:");
        foreach ($materialsAffected as $materialName => $totalUsed) {
            $this->command->info("  • {$materialName}: {$totalUsed} units used");
        }
        $this->command->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        $this->command->info("");
        $this->command->info("💡 Note: Alkansya daily output (3 months) is handled by AlkansyaDailyOutputSeeder");
        $this->command->info("   This seeder only processes Alkansya from customer orders.");
    }
}
