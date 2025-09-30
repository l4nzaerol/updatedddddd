<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Order;
use App\Models\Production;
use App\Models\ProductionProcess;

echo "=== Checking Accepted Orders and Productions ===\n\n";

$acceptedOrders = Order::where('acceptance_status', 'accepted')->get();

echo "Total accepted orders: " . $acceptedOrders->count() . "\n\n";

foreach ($acceptedOrders as $order) {
    echo "Order #{$order->id}\n";
    echo "  Customer: {$order->user->name}\n";
    echo "  Accepted at: {$order->accepted_at}\n";
    
    $productions = Production::where('order_id', $order->id)->get();
    echo "  Productions: " . $productions->count() . "\n";
    
    foreach ($productions as $prod) {
        echo "    Production #{$prod->id}: {$prod->product_name}\n";
        echo "      Status: {$prod->status}\n";
        echo "      Stage: {$prod->current_stage}\n";
        
        $processes = ProductionProcess::where('production_id', $prod->id)->get();
        echo "      Processes: " . $processes->count() . "\n";
        
        foreach ($processes as $proc) {
            echo "        - {$proc->process_name} ({$proc->status})\n";
        }
    }
    echo "\n";
}

echo "=== Done ===\n";
