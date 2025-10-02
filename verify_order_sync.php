<?php

// Verification script to check order, production, and tracking synchronization
require __DIR__ . '/capstone-back/vendor/autoload.php';

$app = require_once __DIR__ . '/capstone-back/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Order;
use App\Models\Production;
use App\Models\OrderTracking;

echo "=== Order, Production & Tracking Synchronization Verification ===\n\n";

$orders = Order::with(['tracking', 'items.product'])->orderBy('id')->get();

foreach ($orders as $order) {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    echo "ORDER #{$order->id}\n";
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
    
    // Order details
    $product = $order->items->first()->product ?? null;
    $productName = $product ? $product->name : 'Unknown';
    echo "Product: {$productName}\n";
    echo "Order Status: {$order->status}\n";
    echo "Acceptance Status: {$order->acceptance_status}\n";
    echo "Created: {$order->created_at}\n\n";
    
    // Production details
    $production = Production::where('order_id', $order->id)->first();
    if ($production) {
        echo "PRODUCTION #{$production->id}:\n";
        echo "  Status: {$production->status}\n";
        echo "  Current Stage: {$production->current_stage}\n";
        echo "  Progress: {$production->overall_progress}%\n";
        echo "  Started: {$production->production_started_at}\n";
        
        // Check production processes
        $processes = $production->processes()->orderBy('process_order')->get();
        if ($processes->count() > 0) {
            echo "  Processes:\n";
            foreach ($processes as $proc) {
                $icon = $proc->status === 'completed' ? '✓' : ($proc->status === 'in_progress' ? '→' : '○');
                echo "    {$icon} {$proc->process_name} ({$proc->status})\n";
            }
        }
    } else {
        echo "PRODUCTION: None (Order not accepted yet)\n";
    }
    
    echo "\n";
    
    // Tracking details
    $tracking = $order->tracking->first();
    if ($tracking) {
        echo "ORDER TRACKING:\n";
        echo "  Status: {$tracking->status}\n";
        echo "  Current Stage: {$tracking->current_stage}\n";
        echo "  Type: {$tracking->tracking_type}\n";
        
        if ($tracking->process_timeline) {
            $timeline = json_decode($tracking->process_timeline, true);
            echo "  Timeline:\n";
            foreach ($timeline as $stage) {
                $icon = $stage['status'] === 'completed' ? '✓' : ($stage['status'] === 'in_progress' ? '→' : '○');
                echo "    {$icon} {$stage['stage']} ({$stage['status']})\n";
            }
        }
    } else {
        echo "ORDER TRACKING: None\n";
    }
    
    // Verification
    echo "\n";
    if ($production && $tracking) {
        $stageMatch = $production->current_stage === $tracking->current_stage;
        $statusMatch = ($production->status === 'In Progress' && $tracking->status === 'in_production') ||
                       ($production->status === 'Completed' && $tracking->status === 'ready_for_delivery');
        
        if ($stageMatch && $statusMatch) {
            echo "✓ SYNCHRONIZED - Production and Tracking match\n";
        } else {
            echo "✗ MISMATCH DETECTED:\n";
            if (!$stageMatch) {
                echo "  - Stage: Production='{$production->current_stage}' vs Tracking='{$tracking->current_stage}'\n";
            }
            if (!$statusMatch) {
                echo "  - Status: Production='{$production->status}' vs Tracking='{$tracking->status}'\n";
            }
        }
    } elseif (!$production && $tracking && $order->acceptance_status === 'pending') {
        echo "✓ CORRECT - Pending order has tracking but no production yet\n";
    } else {
        echo "⚠ WARNING - Unexpected state\n";
    }
    
    echo "\n";
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "SUMMARY\n";
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
echo "Total Orders: " . $orders->count() . "\n";
echo "Pending Acceptance: " . $orders->where('acceptance_status', 'pending')->count() . "\n";
echo "Accepted Orders: " . $orders->where('acceptance_status', 'accepted')->count() . "\n";
echo "With Production: " . Production::count() . "\n";
echo "With Tracking: " . OrderTracking::count() . "\n";
