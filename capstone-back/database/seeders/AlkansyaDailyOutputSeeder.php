<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AlkansyaDailyOutput;
use App\Models\Product;
use App\Models\ProductMaterial;
use App\Models\InventoryItem;
use App\Models\InventoryUsage;
use Carbon\Carbon;

class AlkansyaDailyOutputSeeder extends Seeder
{
    public function run()
    {
        $this->command->info('Creating 3 months of Alkansya daily output data...');

        // Get Alkansya product and BOM
        $alkansyaProduct = Product::where('name', 'Alkansya')->first();
        if (!$alkansyaProduct) {
            $this->command->error('Alkansya product not found. Please run ProductsTableSeeder first.');
            return;
        }

        $bomMaterials = ProductMaterial::where('product_id', $alkansyaProduct->id)
            ->with('inventoryItem')
            ->get();

        if ($bomMaterials->isEmpty()) {
            $this->command->error('Alkansya BOM not found. Please run ProductMaterialsSeeder first.');
            return;
        }

        // Generate 3 months of data (90 days)
        $startDate = Carbon::now()->subMonths(3);
        $endDate = Carbon::now();

        $totalOutput = 0;
        $daysWithOutput = 0;

        for ($date = $startDate->copy(); $date->lte($endDate); $date->addDay()) {
            // Skip weekends (optional - you can remove this if you want weekend production)
            if ($date->isWeekend()) {
                continue;
            }

            // Random daily output between 25-50 units
            $dailyQuantity = rand(25, 50);
            
            // Some days have no production (10% chance)
            if (rand(1, 100) <= 10) {
                $dailyQuantity = 0;
            }

            if ($dailyQuantity > 0) {
                $materialsUsed = [];
                $totalCost = 0;

                // Calculate materials needed for this day's production (1:1 BOM ratio)
                foreach ($bomMaterials as $bomMaterial) {
                    $inventoryItem = $bomMaterial->inventoryItem;
                    $requiredQuantity = $bomMaterial->qty_per_unit * $dailyQuantity; // Now 1:1 ratio
                    
                    if ($requiredQuantity > 0) {
                        // Check if we have enough stock (should be sufficient with updated quantities)
                        if ($inventoryItem->quantity_on_hand < $requiredQuantity) {
                            $this->command->warn("Insufficient stock for {$inventoryItem->name}. Required: {$requiredQuantity}, Available: {$inventoryItem->quantity_on_hand}");
                            // Skip this day's production if insufficient stock
                            continue 2; // Skip to next day
                        }

                        // Deduct from inventory
                        $inventoryItem->quantity_on_hand -= $requiredQuantity;
                        $inventoryItem->save();

                        // Record material usage
                        $materialsUsed[] = [
                            'inventory_item_id' => $inventoryItem->id,
                            'item_name' => $inventoryItem->name,
                            'sku' => $inventoryItem->sku,
                            'quantity_used' => $requiredQuantity,
                            'unit_cost' => $inventoryItem->unit_cost,
                            'total_cost' => $inventoryItem->unit_cost * $requiredQuantity,
                        ];

                        $totalCost += $inventoryItem->unit_cost * $requiredQuantity;

                        // Log usage in inventory_usages table
                        InventoryUsage::create([
                            'inventory_item_id' => $inventoryItem->id,
                            'qty_used' => $requiredQuantity,
                            'date' => $date->format('Y-m-d'),
                        ]);
                    }
                }

                // Create daily output record
                AlkansyaDailyOutput::create([
                    'date' => $date->format('Y-m-d'),
                    'quantity_produced' => $dailyQuantity,
                    'notes' => "Daily production - {$dailyQuantity} units",
                    'produced_by' => 'Production Staff',
                    'materials_used' => $materialsUsed,
                    'efficiency_percentage' => rand(85, 100), // Random efficiency between 85-100%
                    'defects' => rand(0, 2), // Random defects 0-2
                ]);

                $totalOutput += $dailyQuantity;
                $daysWithOutput++;
            }
        }

        $this->command->info("Created {$daysWithOutput} days of Alkansya production");
        $this->command->info("Total output: {$totalOutput} units");
        $this->command->info("Average daily output: " . round($totalOutput / max($daysWithOutput, 1), 2) . " units");
        $this->command->info('Alkansya daily output data created successfully!');
    }
}