<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\AlkansyaDailyOutput;
use App\Models\Product;
use App\Models\ProductMaterial;
use App\Models\InventoryItem;
use Carbon\Carbon;

class AlkansyaDailyOutputSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Creates 3 months of historical Alkansya daily output data
     */
    public function run(): void
    {
        $this->command->info('🌱 Seeding 3 months of Alkansya daily output data...');

        // Get Alkansya product
        $alkansyaProduct = Product::where('name', 'Alkansya')->first();
        if (!$alkansyaProduct) {
            $this->command->error('❌ Alkansya product not found. Please run ProductSeeder first.');
            return;
        }

        // Get Alkansya BOM materials
        $bomMaterials = ProductMaterial::where('product_id', $alkansyaProduct->id)
            ->with('inventoryItem')
            ->get();

        if ($bomMaterials->isEmpty()) {
            $this->command->error('❌ No BOM materials found for Alkansya. Please run ProductMaterialSeeder first.');
            return;
        }

        // Create 3 months of data (90 days)
        $startDate = Carbon::now()->subDays(90);
        $endDate = Carbon::now();

        $this->command->info("📅 Creating data from {$startDate->format('Y-m-d')} to {$endDate->format('Y-m-d')}");

        $totalCreated = 0;
        $currentDate = $startDate->copy();

        while ($currentDate->lte($endDate)) {
            // Skip weekends (Saturday = 6, Sunday = 0)
            if ($currentDate->dayOfWeek !== 6 && $currentDate->dayOfWeek !== 0) {
                $this->createDailyOutput($currentDate, $bomMaterials);
                $totalCreated++;
            }
            
            $currentDate->addDay();
        }

        $this->command->info("✅ Created {$totalCreated} days of Alkansya daily output data");
    }

    /**
     * Create daily output for a specific date
     */
    private function createDailyOutput($date, $bomMaterials)
    {
        // Simulate realistic production patterns
        $baseProduction = $this->getBaseProduction($date);
        $variation = $this->getProductionVariation($date);
        $quantityProduced = max(1, $baseProduction + $variation);

        // Calculate materials used (1:1 BOM ratio)
        $materialsUsed = [];
        $totalCost = 0;

        foreach ($bomMaterials as $bomMaterial) {
            $inventoryItem = $bomMaterial->inventoryItem;
            $requiredQuantity = $bomMaterial->qty_per_unit * $quantityProduced;
            
            if ($requiredQuantity > 0) {
                // Simulate material usage with some variation
                $actualUsage = $requiredQuantity * (0.95 + (rand(0, 10) / 100)); // 95-105% of required
                
                $materialsUsed[] = [
                    'inventory_item_id' => $inventoryItem->id,
                    'item_name' => $inventoryItem->name,
                    'sku' => $inventoryItem->sku,
                    'quantity_used' => round($actualUsage, 2),
                    'unit_cost' => $inventoryItem->unit_cost,
                    'total_cost' => round($inventoryItem->unit_cost * $actualUsage, 2),
                ];

                $totalCost += $inventoryItem->unit_cost * $actualUsage;

                // Update inventory (deduct materials)
                $inventoryItem->quantity_on_hand -= $actualUsage;
                $inventoryItem->save();

                // Create inventory usage record
                \App\Models\InventoryUsage::create([
                    'inventory_item_id' => $inventoryItem->id,
                    'qty_used' => $actualUsage,
                    'date' => $date->format('Y-m-d'),
                ]);
            }
        }

        // Calculate efficiency (90-110%)
        $efficiency = 90 + rand(0, 20);
        
        // Simulate defects (0-5%)
        $defects = rand(0, max(0, floor($quantityProduced * 0.05)));

        // Create daily output record
        AlkansyaDailyOutput::create([
            'date' => $date->format('Y-m-d'),
            'quantity_produced' => $quantityProduced,
            'notes' => $this->generateProductionNotes($date, $quantityProduced, $efficiency),
            'produced_by' => $this->getRandomProducer(),
            'materials_used' => $materialsUsed,
            'efficiency_percentage' => $efficiency,
            'defects' => $defects,
        ]);
    }

    /**
     * Get base production quantity based on day of week and season
     */
    private function getBaseProduction($date)
    {
        $dayOfWeek = $date->dayOfWeek;
        $month = $date->month;
        
        // Base production by day of week
        $baseByDay = [
            1 => 25, // Monday
            2 => 30, // Tuesday
            3 => 35, // Wednesday
            4 => 35, // Thursday
            5 => 30, // Friday
        ];

        $baseProduction = $baseByDay[$dayOfWeek] ?? 25;

        // Seasonal adjustments
        $seasonalMultiplier = 1.0;
        if ($month >= 11 || $month <= 2) {
            // Winter months - higher production
            $seasonalMultiplier = 1.2;
        } elseif ($month >= 6 && $month <= 8) {
            // Summer months - slightly lower production
            $seasonalMultiplier = 0.9;
        }

        return round($baseProduction * $seasonalMultiplier);
    }

    /**
     * Get production variation for the day
     */
    private function getProductionVariation($date)
    {
        // Random variation between -5 and +10
        return rand(-5, 10);
    }

    /**
     * Generate realistic production notes
     */
    private function generateProductionNotes($date, $quantity, $efficiency)
    {
        $notes = [];
        
        if ($efficiency >= 100) {
            $notes[] = "Excellent production day";
        } elseif ($efficiency >= 95) {
            $notes[] = "Good production efficiency";
        } else {
            $notes[] = "Below target efficiency";
        }

        if ($quantity >= 35) {
            $notes[] = "High output achieved";
        }

        // Add random notes
        $randomNotes = [
            "All materials available",
            "No equipment issues",
            "Team performed well",
            "Quality checks passed",
            "On-time completion",
            "Minor delays in morning setup",
            "Extra quality control time",
            "New team member training",
        ];

        if (rand(1, 3) === 1) {
            $notes[] = $randomNotes[array_rand($randomNotes)];
        }

        return implode('. ', $notes);
    }

    /**
     * Get random producer name
     */
    private function getRandomProducer()
    {
        $producers = [
            'Production Team A',
            'Production Team B',
            'Production Team C',
            'John Santos',
            'Maria Garcia',
            'Production Supervisor',
            'Quality Control Team',
        ];

        return $producers[array_rand($producers)];
    }
}
