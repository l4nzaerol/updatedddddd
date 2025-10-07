<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add indexes for orders performance
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                if (!Schema::hasColumn('orders', 'status')) return;
                $table->index(['status', 'created_at'], 'idx_orders_status_date');
                $table->index(['created_at'], 'idx_orders_created_at');
                $table->index(['status'], 'idx_orders_status');
            });
        }
        
        // Add indexes for order items performance
        if (Schema::hasTable('order_items')) {
            Schema::table('order_items', function (Blueprint $table) {
                if (!Schema::hasColumn('order_items', 'order_id')) return;
                $table->index(['order_id', 'product_id'], 'idx_order_items_order_product');
                $table->index(['product_id'], 'idx_order_items_product');
            });
        }
        
        // Add indexes for productions performance
        if (Schema::hasTable('productions')) {
            Schema::table('productions', function (Blueprint $table) {
                if (!Schema::hasColumn('productions', 'order_id')) return;
                $table->index(['order_id', 'status'], 'idx_productions_order_status');
                $table->index(['status'], 'idx_productions_status');
                $table->index(['created_at'], 'idx_productions_created_at');
            });
        }
        
        // Add indexes for production processes performance
        if (Schema::hasTable('production_processes')) {
            Schema::table('production_processes', function (Blueprint $table) {
                if (!Schema::hasColumn('production_processes', 'production_id')) return;
                $table->index(['production_id', 'status'], 'idx_processes_production_status');
                $table->index(['status'], 'idx_processes_status');
                $table->index(['process_order'], 'idx_processes_order');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Remove indexes safely
        if (Schema::hasTable('orders')) {
            Schema::table('orders', function (Blueprint $table) {
                $table->dropIndex('idx_orders_status_date');
                $table->dropIndex('idx_orders_created_at');
                $table->dropIndex('idx_orders_status');
            });
        }
        
        if (Schema::hasTable('order_items')) {
            Schema::table('order_items', function (Blueprint $table) {
                $table->dropIndex('idx_order_items_order_product');
                $table->dropIndex('idx_order_items_product');
            });
        }
        
        if (Schema::hasTable('productions')) {
            Schema::table('productions', function (Blueprint $table) {
                $table->dropIndex('idx_productions_order_status');
                $table->dropIndex('idx_productions_status');
                $table->dropIndex('idx_productions_created_at');
            });
        }
        
        if (Schema::hasTable('production_processes')) {
            Schema::table('production_processes', function (Blueprint $table) {
                $table->dropIndex('idx_processes_production_status');
                $table->dropIndex('idx_processes_status');
                $table->dropIndex('idx_processes_order');
            });
        }
    }
};
