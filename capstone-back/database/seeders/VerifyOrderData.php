<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Order;
use App\Models\Production;

class VerifyOrderData extends Seeder
{
    /**
     * Verify order and production data
     */
    public function run(): void
    {
        $this->command->info('=== Order and Production Verification ===');
        $this->command->info('');
        
        $orders = Order::with('production')->orderBy('id')->get();
        
        $this->command->info('Order Details:');
        $this->command->info(str_repeat('-', 100));
        
        foreach ($orders as $order) {
            $hasProduction = $order->production ? 'YES' : 'NO';
            $productionId = $order->production ? "#{$order->production->id}" : 'N/A';
            $productionProgress = $order->production ? "{$order->production->overall_progress}%" : 'N/A';
            
            $status = str_pad($order->acceptance_status, 10);
            $orderStatus = str_pad($order->status, 20);
            
            $icon = $order->acceptance_status === 'accepted' ? '✅' : '⏳';
            $prodIcon = $order->production ? '🏭' : '❌';
            
            $this->command->info(sprintf(
                "%s Order #%-2d | Status: %s | Acceptance: %s | Production: %s %s | Progress: %s",
                $icon,
                $order->id,
                $orderStatus,
                $status,
                $prodIcon,
                str_pad($hasProduction, 3),
                $productionProgress
            ));
        }
        
        $this->command->info('');
        $this->command->info(str_repeat('-', 100));
        $this->command->info('');
        
        // Statistics
        $totalOrders = $orders->count();
        $pendingOrders = $orders->where('acceptance_status', 'pending')->count();
        $acceptedOrders = $orders->where('acceptance_status', 'accepted')->count();
        $ordersWithProduction = $orders->filter(fn($o) => $o->production !== null)->count();
        
        $this->command->info('Statistics:');
        $this->command->info("  Total Orders: {$totalOrders}");
        $this->command->info("  Pending Orders: {$pendingOrders}");
        $this->command->info("  Accepted Orders: {$acceptedOrders}");
        $this->command->info("  Orders with Production: {$ordersWithProduction}");
        $this->command->info('');
        
        // Check for issues
        $issues = [];
        
        // Issue 1: Pending orders with production
        $pendingWithProduction = $orders->filter(function($order) {
            return $order->acceptance_status === 'pending' && $order->production !== null;
        });
        
        if ($pendingWithProduction->count() > 0) {
            $issues[] = "❌ Found {$pendingWithProduction->count()} pending orders with production records!";
            foreach ($pendingWithProduction as $order) {
                $issues[] = "   - Order #{$order->id} is PENDING but has Production #{$order->production->id}";
            }
        }
        
        // Issue 2: Accepted orders without production
        $acceptedWithoutProduction = $orders->filter(function($order) {
            return $order->acceptance_status === 'accepted' && $order->production === null;
        });
        
        if ($acceptedWithoutProduction->count() > 0) {
            $issues[] = "❌ Found {$acceptedWithoutProduction->count()} accepted orders WITHOUT production records!";
            foreach ($acceptedWithoutProduction as $order) {
                $issues[] = "   - Order #{$order->id} is ACCEPTED but has NO production";
            }
        }
        
        if (count($issues) > 0) {
            $this->command->error('Issues Found:');
            foreach ($issues as $issue) {
                $this->command->error($issue);
            }
            $this->command->info('');
            $this->command->error('⚠ Run CleanupAndReseedOrders to fix these issues!');
            $this->command->error('   php artisan db:seed --class=CleanupAndReseedOrders');
        } else {
            $this->command->info('✅ All checks passed!');
            $this->command->info('   - All pending orders have NO production (correct)');
            $this->command->info('   - All accepted orders have production (correct)');
        }
        
        $this->command->info('');
        
        // Production tracking page simulation
        $this->command->info('=== Production Tracking Page (What Admin Sees) ===');
        $productionsShown = Production::whereHas('order', function($q) {
            $q->where('acceptance_status', 'accepted');
        })->with('order')->get();
        
        $this->command->info("Productions shown: {$productionsShown->count()}");
        foreach ($productionsShown as $prod) {
            $this->command->info(sprintf(
                "  🏭 Production #%-2d | Order #%-2d | %s | Progress: %s%%",
                $prod->id,
                $prod->order_id,
                str_pad($prod->product_name, 15),
                $prod->overall_progress
            ));
        }
        
        $this->command->info('');
        $this->command->info('Expected: Orders 3, 4, 5, 6, 7, 8, 9, 10 (8 total)');
        $this->command->info('');
    }
}
