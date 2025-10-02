<?php

require __DIR__ . '/capstone-back/vendor/autoload.php';

$app = require_once __DIR__ . '/capstone-back/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Order;
use App\Models\Production;

echo "=== Checking Productions ===\n\n";

$orders = Order::with('items.product')->orderBy('id')->get();

foreach ($orders as $order) {
    $product = $order->items->first()->product ?? null;
    $productName = $product ? $product->name : 'Unknown';
    
    echo "Order #{$order->id}: {$productName}\n";
    echo "  Status: {$order->status}\n";
    echo "  Acceptance: {$order->acceptance_status}\n";
    
    $production = Production::where('order_id', $order->id)->first();
    if ($production) {
        echo "  ✓ Production #{$production->id}: {$production->status}, Progress: {$production->overall_progress}%\n";
    } else {
        echo "  ✗ No production record\n";
    }
    echo "\n";
}

echo "Total Productions: " . Production::count() . "\n";
