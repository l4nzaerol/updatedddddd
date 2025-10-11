<?php

// Debug script to test the inventory API filtering
require_once 'capstone-back/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'capstone-back/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Product;
use App\Models\ProductMaterial;
use App\Models\InventoryItem;

echo "Debugging Material Filtering API\n";
echo "================================\n\n";

// Test the filtering logic directly
$productFilter = 'alkansya';

echo "Testing filter: $productFilter\n\n";

// Get product IDs based on filter
$productIds = [];
switch ($productFilter) {
    case 'alkansya':
        $productIds = Product::where('name', 'like', '%alkansya%')
            ->orWhere('name', 'like', '%Alkansya%')
            ->pluck('id')->toArray();
        break;
    case 'dining-table':
        $productIds = Product::where('name', 'like', '%table%')
            ->orWhere('name', 'like', '%Table%')
            ->pluck('id')->toArray();
        break;
    case 'wooden-chair':
        $productIds = Product::where('name', 'like', '%chair%')
            ->orWhere('name', 'like', '%Chair%')
            ->pluck('id')->toArray();
        break;
}

echo "Found product IDs: " . implode(', ', $productIds) . "\n";

if (!empty($productIds)) {
    // Get inventory item IDs that are used by these products
    $inventoryItemIds = ProductMaterial::whereIn('product_id', $productIds)
        ->pluck('inventory_item_id')
        ->toArray();
    
    echo "Found inventory item IDs: " . implode(', ', $inventoryItemIds) . "\n";
    
    // Get the actual inventory items
    $filteredItems = InventoryItem::whereIn('id', $inventoryItemIds)->get();
    
    echo "\nFiltered inventory items:\n";
    foreach ($filteredItems as $item) {
        echo "- {$item->name} (SKU: {$item->sku}, Category: {$item->category})\n";
    }
    
    echo "\nTotal filtered items: " . $filteredItems->count() . "\n";
} else {
    echo "No products found for filter: $productFilter\n";
}

echo "\nDebug completed!\n";

