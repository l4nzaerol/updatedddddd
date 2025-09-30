<?php

require __DIR__ . '/capstone-back/vendor/autoload.php';

$app = require_once __DIR__ . '/capstone-back/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Checking Notifications in Database\n";
echo "===================================\n\n";

$notifications = \App\Models\Notification::orderBy('created_at', 'desc')->get();

echo "Total notifications: {$notifications->count()}\n\n";

if ($notifications->count() > 0) {
    foreach ($notifications as $notif) {
        echo "Notification ID: {$notif->id}\n";
        echo "  User ID: {$notif->user_id}\n";
        echo "  Order ID: {$notif->order_id}\n";
        echo "  Type: {$notif->type}\n";
        echo "  Title: {$notif->title}\n";
        echo "  Message: {$notif->message}\n";
        echo "  Read: " . ($notif->is_read ? 'Yes' : 'No') . "\n";
        echo "  Created: {$notif->created_at}\n";
        echo "\n";
    }
} else {
    echo "No notifications found in database.\n";
    echo "\nThis means the notification was NOT created when you marked the order.\n";
    echo "Possible reasons:\n";
    echo "1. You might not be logged in as admin/employee\n";
    echo "2. There might be an error in the code\n";
    echo "3. The order might not have been found\n";
}

// Check Order 7 status
echo "\n-----------------------------------\n";
echo "Order 7 Status:\n";
$order = \App\Models\Order::find(7);
if ($order) {
    echo "  Status: {$order->status}\n";
    echo "  User ID: {$order->user_id}\n";
} else {
    echo "  Order 7 not found!\n";
}

// Check customer user
echo "\n-----------------------------------\n";
echo "Customer User:\n";
$customer = \App\Models\User::where('email', 'customer@gmail.com')->first();
if ($customer) {
    echo "  ID: {$customer->id}\n";
    echo "  Name: {$customer->name}\n";
    echo "  Email: {$customer->email}\n";
    echo "  Role: {$customer->role}\n";
} else {
    echo "  Customer not found!\n";
}
