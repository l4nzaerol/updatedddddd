<?php

/**
 * Test Price Calculator
 * 
 * This script demonstrates how the price calculator works with sample products.
 * Run this after seeding the database with: php artisan db:seed --class=InventoryItemsSeeder
 */

require __DIR__ . '/capstone-back/vendor/autoload.php';

use Illuminate\Support\Facades\DB;

$app = require_once __DIR__ . '/capstone-back/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "\n╔═══════════════════════════════════════════════════════════╗\n";
echo "║         PRICE CALCULATOR TEST - SAMPLE PRODUCTS          ║\n";
echo "╚═══════════════════════════════════════════════════════════╝\n\n";

// Sample Product 1: Alkansya
echo "═══════════════════════════════════════════════════════════\n";
echo "PRODUCT 1: WOODEN ALKANSYA (Money Box)\n";
echo "═══════════════════════════════════════════════════════════\n\n";

$alkansyaMaterials = [
    ['sku' => 'PW-1x4x8', 'quantity' => 0.5],
    ['sku' => 'PLY-4.2-4x8', 'quantity' => 0.25],
    ['sku' => 'ACR-1.5-4x8', 'quantity' => 0.1],
    ['sku' => 'PN-F30', 'quantity' => 0.02],
    ['sku' => 'BS-1.5', 'quantity' => 0.008],
    ['sku' => 'STKW-250', 'quantity' => 0.1],
    ['sku' => 'GRP-4-120', 'quantity' => 0.5],
    ['sku' => 'STK-24-W', 'quantity' => 0.02],
];

calculateAndDisplay($alkansyaMaterials, 25, 30, "Alkansya");

// Sample Product 2: Dining Table
echo "\n═══════════════════════════════════════════════════════════\n";
echo "PRODUCT 2: MAHOGANY DINING TABLE (4-Seater)\n";
echo "═══════════════════════════════════════════════════════════\n\n";

$tableMaterials = [
    ['sku' => 'HW-MAHOG-2x4x8', 'quantity' => 4],
    ['sku' => 'HW-MAHOG-1x6x10', 'quantity' => 6],
    ['sku' => 'PLY-18-4x8', 'quantity' => 0.5],
    ['sku' => 'WS-3', 'quantity' => 0.5],
    ['sku' => 'WG-500', 'quantity' => 2],
    ['sku' => 'SAND-80', 'quantity' => 10],
    ['sku' => 'SAND-120', 'quantity' => 10],
    ['sku' => 'SAND-220', 'quantity' => 8],
    ['sku' => 'STAIN-WALNUT-1L', 'quantity' => 1],
    ['sku' => 'POLY-GLOSS-1L', 'quantity' => 1],
    ['sku' => 'TBRACKET-METAL', 'quantity' => 2],
    ['sku' => 'FELT-PAD-LG', 'quantity' => 1],
];

calculateAndDisplay($tableMaterials, 40, 35, "Dining Table");

// Sample Product 3: Chair
echo "\n═══════════════════════════════════════════════════════════\n";
echo "PRODUCT 3: MAHOGANY DINING CHAIR (Upholstered)\n";
echo "═══════════════════════════════════════════════════════════\n\n";

$chairMaterials = [
    ['sku' => 'HW-MAHOG-2x2x6', 'quantity' => 4],
    ['sku' => 'HW-MAHOG-1x4x6', 'quantity' => 2],
    ['sku' => 'PLY-12-2x4', 'quantity' => 0.5],
    ['sku' => 'WS-2.5', 'quantity' => 0.25],
    ['sku' => 'WD-8MM', 'quantity' => 8],
    ['sku' => 'FOAM-CUSHION-2', 'quantity' => 0.25],
    ['sku' => 'FABRIC-UPHOLSTERY', 'quantity' => 1.5],
    ['sku' => 'STAPLES-UPHOLSTERY', 'quantity' => 0.1],
    ['sku' => 'WG-250', 'quantity' => 1],
    ['sku' => 'STAIN-WALNUT-500', 'quantity' => 0.5],
    ['sku' => 'LACQUER-SPRAY', 'quantity' => 1],
    ['sku' => 'FELT-PAD-SM', 'quantity' => 1],
];

calculateAndDisplay($chairMaterials, 35, 30, "Chair");

echo "\n═══════════════════════════════════════════════════════════\n";
echo "✓ Test Complete! All sample products calculated.\n";
echo "═══════════════════════════════════════════════════════════\n\n";

/**
 * Calculate and display price for a product
 */
function calculateAndDisplay($materials, $laborPercentage, $profitMargin, $productName)
{
    echo "Materials Breakdown:\n";
    echo str_repeat("─", 63) . "\n";
    printf("%-20s %-12s %-10s %s\n", "Material", "Unit Cost", "Qty", "Total");
    echo str_repeat("─", 63) . "\n";

    $materialCost = 0;
    
    foreach ($materials as $material) {
        $item = DB::table('inventory_items')
            ->where('sku', $material['sku'])
            ->first();
        
        if ($item) {
            $unitCost = $item->unit_cost ?? 0;
            $quantity = $material['quantity'];
            $itemCost = $unitCost * $quantity;
            $materialCost += $itemCost;
            
            $name = strlen($item->name) > 18 ? substr($item->name, 0, 18) : $item->name;
            printf("%-20s ₱%-11s %-10s ₱%.2f\n", 
                $name, 
                number_format($unitCost, 2), 
                $quantity, 
                $itemCost
            );
        } else {
            echo "⚠ Material {$material['sku']} not found in database!\n";
        }
    }
    
    echo str_repeat("─", 63) . "\n";
    
    // Calculate costs
    $laborCost = $materialCost * ($laborPercentage / 100);
    $productionCost = $materialCost + $laborCost;
    $suggestedPrice = $productionCost * (1 + ($profitMargin / 100));
    $profitAmount = $suggestedPrice - $productionCost;
    $roundedPrice = round($suggestedPrice, -1); // Round to nearest 10
    
    // Display calculation
    echo "\n";
    echo "┌─────────────────────────────────────────────────────────┐\n";
    echo "│  PRICE CALCULATION                                      │\n";
    echo "├─────────────────────────────────────────────────────────┤\n";
    printf("│  Material Cost:           ₱%-29s│\n", number_format($materialCost, 2));
    printf("│  Labor (%d%%):              ₱%-29s│\n", $laborPercentage, number_format($laborCost, 2));
    echo "│  " . str_repeat("─", 53) . "  │\n";
    printf("│  Production Cost:         ₱%-29s│\n", number_format($productionCost, 2));
    printf("│  Profit (%d%%):             ₱%-29s│\n", $profitMargin, number_format($profitAmount, 2));
    echo "│  " . str_repeat("─", 53) . "  │\n";
    printf("│  Suggested Price:         ₱%-29s│\n", number_format($suggestedPrice, 2));
    printf("│  Recommended Price:       ₱%-29s│\n", number_format($roundedPrice, 2));
    echo "└─────────────────────────────────────────────────────────┘\n";
    
    // Profit margin check
    $actualMargin = ($profitAmount / $productionCost) * 100;
    echo "\n";
    echo "📊 Profit Analysis:\n";
    echo "   • Profit Margin: " . number_format($actualMargin, 1) . "%\n";
    echo "   • Profit per Unit: ₱" . number_format($profitAmount, 2) . "\n";
    echo "   • Break-even: ₱" . number_format($productionCost, 2) . "\n";
    
    if ($actualMargin < 20) {
        echo "   ⚠ Warning: Low profit margin!\n";
    } elseif ($actualMargin > 40) {
        echo "   ✓ Excellent profit margin!\n";
    } else {
        echo "   ✓ Good profit margin\n";
    }
}
