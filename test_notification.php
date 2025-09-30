<?php

require __DIR__ . '/capstone-back/vendor/autoload.php';

$app = require_once __DIR__ . '/capstone-back/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Testing Notification System\n";
echo "============================\n\n";

// Get Order 7
$order = \App\Models\Order::with(['items.product', 'user'])->find(7);

if (!$order) {
    echo "❌ Order 7 not found!\n";
    exit(1);
}

echo "✓ Order found: #{$order->id}\n";
echo "  Customer: {$order->user->name} (ID: {$order->user_id})\n";
echo "  Status: {$order->status}\n";
echo "  Products: " . $order->items->pluck('product.name')->join(', ') . "\n\n";

// Create a test notification
echo "Creating test notification...\n";

try {
    $notification = \App\Models\Notification::create([
        'user_id' => $order->user_id,
        'order_id' => $order->id,
        'type' => 'ready_for_delivery',
        'title' => '📦 Test Notification',
        'message' => "This is a test notification for order #{$order->id}",
    ]);
    
    echo "✓ Notification created successfully!\n";
    echo "  ID: {$notification->id}\n";
    echo "  User ID: {$notification->user_id}\n";
    echo "  Order ID: {$notification->order_id}\n";
    echo "  Type: {$notification->type}\n";
    echo "  Title: {$notification->title}\n\n";
    
    // Check all notifications for this user
    $allNotifications = \App\Models\Notification::where('user_id', $order->user_id)
        ->orderBy('created_at', 'desc')
        ->get();
    
    echo "Total notifications for user {$order->user->name}: {$allNotifications->count()}\n";
    foreach ($allNotifications as $notif) {
        echo "  - [{$notif->id}] {$notif->title} (Order #{$notif->order_id}) - " . 
             ($notif->is_read ? 'Read' : 'Unread') . " - {$notif->created_at->diffForHumans()}\n";
    }
    
} catch (\Exception $e) {
    echo "❌ Error creating notification: {$e->getMessage()}\n";
    echo "Stack trace:\n{$e->getTraceAsString()}\n";
}
