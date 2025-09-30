<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\InventoryUsage;
use App\Models\InventoryItem;
use App\Models\Production;
use App\Models\ProductMaterial;
use App\Models\Order;
use Carbon\Carbon;

class InventoryUsageSeeder extends Seeder
{
    /**
     * Seed inventory usage data based on production history from CustomerOrdersSeeder
     * This creates accurate usage records matching the orders created in the demo
     */
    public function run()
    {
        $this->command->info('Creating inventory usage records based on production history...');

        // Clear existing usage data
        InventoryUsage::truncate();

        // Get all productions (both in progress and completed)
        // We track usage from the moment production starts, not when it completes
        $productions = Production::with(['product', 'order'])
            ->whereNotNull('order_id')
            ->orderBy('production_started_at')
            ->get();

        if ($productions->isEmpty()) {
            $this->command->warn('No productions found. Make sure CustomerOrdersSeeder has been run first.');
            return;
        }

        $usageCount = 0;
        $totalUsageValue = 0;

        foreach ($productions as $production) {
            // Get the product's bill of materials
            $materials = ProductMaterial::where('product_id', $production->product_id)
                ->with('inventoryItem')
                ->get();

            if ($materials->isEmpty()) {
                $this->command->warn("No BOM found for product: {$production->product_name}");
                continue;
            }

            // Use production start date as usage date (when materials are consumed)
            $usageDate = $production->production_started_at 
                ? Carbon::parse($production->production_started_at)->format('Y-m-d')
                : Carbon::parse($production->date)->format('Y-m-d');

            $this->command->info("Processing Order #{$production->order_id} - {$production->product_name} x{$production->quantity}");

            // For each material in the BOM, create usage record
            foreach ($materials as $material) {
                if (!$material->inventoryItem) {
                    $this->command->warn("  Inventory item not found for material ID: {$material->inventory_item_id}");
                    continue;
                }

                $qtyUsed = $material->qty_per_unit * $production->quantity;

                InventoryUsage::create([
                    'inventory_item_id' => $material->inventory_item_id,
                    'date' => $usageDate,
                    'qty_used' => $qtyUsed,
                ]);

                $this->command->info("  ✓ Used: {$material->inventoryItem->name} ({$qtyUsed} {$material->inventoryItem->unit})");
                $usageCount++;
            }
        }

        // Add historical usage data for better analytics and daily reports
        // This creates usage data for the past 14 days to populate reports
        $this->createHistoricalUsage();

        $this->command->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
        $this->command->info("✓ Created {$usageCount} inventory usage records from {$productions->count()} productions!");
        $this->command->info("✓ Total usage records in database: " . InventoryUsage::count());
        $this->command->info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }

    /**
     * Create historical usage data for the past 14 days
     * This provides more data points for trend analysis and forecasting
     * Uses realistic patterns based on actual product BOMs
     * Includes recent dates for daily usage reports
     */
    private function createHistoricalUsage()
    {
        $this->command->info('Creating additional historical usage data for past 14 days...');

        // Get products with their BOMs
        $products = \App\Models\Product::whereIn('name', ['Dining Table', 'Wooden Chair'])
            ->get();

        if ($products->isEmpty()) {
            $this->command->warn('No products found for historical data generation.');
            return;
        }

        $historicalCount = 0;

        // Create usage for past 14 days with realistic production patterns
        // Start from 14 days ago, go up to 7 days ago (to not overlap with main orders)
        for ($daysAgo = 14; $daysAgo >= 7; $daysAgo--) {
            $date = Carbon::now()->subDays($daysAgo)->format('Y-m-d');

            // Skip weekends (no production on Sat/Sun)
            $dayOfWeek = Carbon::now()->subDays($daysAgo)->dayOfWeek;
            if ($dayOfWeek == 0 || $dayOfWeek == 6) {
                continue;
            }

            // Randomly skip some days (70% production days)
            if (rand(1, 100) > 70) {
                continue;
            }

            // Randomly select 1-2 products to produce
            $productsToMake = $products->random(rand(1, 2));

            foreach ($productsToMake as $product) {
                // Random quantity (1-2 units per production for historical data)
                $quantity = rand(1, 2);

                // Get BOM for this product
                $materials = ProductMaterial::where('product_id', $product->id)
                    ->with('inventoryItem')
                    ->get();

                if ($materials->isEmpty()) {
                    continue;
                }

                // Create usage records for each material
                foreach ($materials as $material) {
                    if (!$material->inventoryItem) {
                        continue;
                    }

                    $qtyUsed = $material->qty_per_unit * $quantity;

                    InventoryUsage::create([
                        'inventory_item_id' => $material->inventory_item_id,
                        'date' => $date,
                        'qty_used' => $qtyUsed,
                    ]);

                    $historicalCount++;
                }
            }
        }

        $this->command->info("✓ Created {$historicalCount} historical usage records!");
    }
}
