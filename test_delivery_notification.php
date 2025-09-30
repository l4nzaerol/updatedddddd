<?php

require __DIR__ . '/capstone-back/vendor/autoload.php';

$app = require_once __DIR__ . '/capstone-back/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing Delivery Notification System\n";
echo "=====================================\n\n";

// Get Order 7
$order = \App\Models\Order::with(['items.product', 'user'])->find(7);

if (!$order) {
    echo "❌ Order 7 not found!\n";
    exit(1);
}

echo "Order Information:\n";
echo "  ID: {$order->id}\n";
echo "  Customer: {$order->user->name} (ID: {$order->user_id})\n";
echo "  Current Status: {$order->status}\n";
echo "  Products: " . $order->items->pluck('product.name')->join(', ') . "\n\n";

// Simulate marking as ready for delivery
echo "Step 1: Marking order as 'ready_for_delivery'...\n";
$order->status = 'ready_for_delivery';
$order->save();

$productNames = $order->items->pluck('product.name')->unique()->join(', ');
$notif1 = \App\Models\Notification::create([
    'user_id' => $order->user_id,
    'order_id' => $order->id,
    'type' => 'ready_for_delivery',
    'title' => '📦 Order Ready for Delivery!',
    'message' => "Great news! Your order #{$order->id} ({$productNames}) is ready for delivery. We'll contact you soon to arrange delivery.",
]);

echo "✓ Notification created: ID {$notif1->id}\n";
echo "  Status changed to: {$order->status}\n\n";

// Simulate marking as delivered
echo "Step 2: Marking order as 'delivered'...\n";
$order->status = 'delivered';
$order->save();

$notif2 = \App\Models\Notification::create([
    'user_id' => $order->user_id,
    'order_id' => $order->id,
    'type' => 'delivered',
    'title' => '🚚 Order Delivered!',
    'message' => "Your order #{$order->id} ({$productNames}) has been successfully delivered. Thank you for choosing Unick Furniture!",
]);

echo "✓ Notification created: ID {$notif2->id}\n";
echo "  Status changed to: {$order->status}\n\n";

// Show all notifications for this user
echo "All notifications for customer:\n";
$notifications = \App\Models\Notification::where('user_id', $order->user_id)
    ->orderBy('created_at', 'desc')
    ->get();

foreach ($notifications as $notif) {
    echo "  [{$notif->id}] {$notif->title}\n";
    echo "      Type: {$notif->type}\n";
    echo "      Message: {$notif->message}\n";
    echo "      Read: " . ($notif->is_read ? 'Yes' : 'No') . "\n";
    echo "      Created: {$notif->created_at->diffForHumans()}\n\n";
}

echo "✅ Test completed successfully!\n";
echo "\nNow log in as customer@gmail.com to see these {$notifications->count()} notifications!\n";
