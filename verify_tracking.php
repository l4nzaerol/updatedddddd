<?php

require __DIR__ . '/capstone-back/vendor/autoload.php';

$app = require_once __DIR__ . '/capstone-back/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Verifying Production vs Tracking Match\n";
echo "========================================\n\n";

for ($i = 1; $i <= 6; $i++) {
    $production = \App\Models\Production::where('order_id', $i)->first();
    $tracking = \App\Models\OrderTracking::where('order_id', $i)->first();
    
    if ($production && $tracking) {
        $match = $production->current_stage === $tracking->current_stage ? '✓ MATCH' : '✗ MISMATCH';
        echo sprintf(
            "Order #%d: Prod=%-35s | Track=%-35s | %s\n",
            $i,
            $production->current_stage . " ({$production->overall_progress}%)",
            $tracking->current_stage,
            $match
        );
    }
}

echo "\n========================================\n";
echo "Verification Complete!\n";
