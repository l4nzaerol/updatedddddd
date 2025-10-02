<?php

// Quick test script to check orders in database
require __DIR__ . '/capstone-back/vendor/autoload.php';

$app = require_once __DIR__ . '/capstone-back/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Order;

echo "=== Testing Orders in Database ===\n\n";

$allOrders = Order::all();
echo "Total orders: " . $allOrders->count() . "\n\n";

echo "Orders by acceptance_status:\n";
$byAcceptance = $allOrders->groupBy('acceptance_status');
foreach ($byAcceptance as $status => $orders) {
    echo "  - {$status}: " . $orders->count() . "\n";
}

echo "\nOrders by status:\n";
$byStatus = $allOrders->groupBy('status');
foreach ($byStatus as $status => $orders) {
    echo "  - {$status}: " . $orders->count() . "\n";
}

echo "\n=== Sample Order Details ===\n";
$sampleOrder = Order::first();
if ($sampleOrder) {
    echo "ID: {$sampleOrder->id}\n";
    echo "Status: {$sampleOrder->status}\n";
    echo "Acceptance Status: {$sampleOrder->acceptance_status}\n";
    echo "Created: {$sampleOrder->created_at}\n";
}

echo "\n=== Pending Orders (acceptance_status = 'pending') ===\n";
$pendingOrders = Order::where('acceptance_status', 'pending')->get();
echo "Count: " . $pendingOrders->count() . "\n";
foreach ($pendingOrders as $order) {
    echo "  Order #{$order->id} - Status: {$order->status}, Acceptance: {$order->acceptance_status}\n";
}
