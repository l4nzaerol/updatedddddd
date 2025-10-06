<?php

require_once 'capstone-back/vendor/autoload.php';

// Bootstrap Laravel
$app = require_once 'capstone-back/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Order;

echo "Checking Order Status Fields\n";
echo "===========================\n\n";

// Check all orders and their status fields
$orders = Order::all();

echo "Order Status Distribution:\n";
$statusCounts = [];
$acceptanceCounts = [];

foreach ($orders as $order) {
    // Count by status
    $status = $order->status ?? 'null';
    $statusCounts[$status] = ($statusCounts[$status] ?? 0) + 1;
    
    // Count by acceptance_status if it exists
    if (isset($order->acceptance_status)) {
        $acceptance = $order->acceptance_status ?? 'null';
        $acceptanceCounts[$acceptance] = ($acceptanceCounts[$acceptance] ?? 0) + 1;
    }
}

echo "Order Status:\n";
foreach ($statusCounts as $status => $count) {
    echo "- {$status}: {$count}\n";
}

echo "\nAcceptance Status:\n";
if (!empty($acceptanceCounts)) {
    foreach ($acceptanceCounts as $acceptance => $count) {
        echo "- {$acceptance}: {$count}\n";
    }
} else {
    echo "No acceptance_status field found\n";
}

// Show sample order data
echo "\nSample Order Data:\n";
$sampleOrder = $orders->first();
if ($sampleOrder) {
    echo "Order ID: {$sampleOrder->id}\n";
    echo "Status: {$sampleOrder->status}\n";
    echo "Payment Status: {$sampleOrder->payment_status}\n";
    if (isset($sampleOrder->acceptance_status)) {
        echo "Acceptance Status: {$sampleOrder->acceptance_status}\n";
    }
    if (isset($sampleOrder->accepted_at)) {
        echo "Accepted At: {$sampleOrder->accepted_at}\n";
    }
}

echo "\nTest completed.\n";

