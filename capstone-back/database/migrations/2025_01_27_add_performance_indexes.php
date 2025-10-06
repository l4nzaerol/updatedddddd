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
        // Add indexes for better performance
        Schema::table('products', function (Blueprint $table) {
            $table->index('name');
            $table->index('price');
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->index('checkout_date');
            $table->index('status');
            $table->index('payment_status');
            $table->index(['checkout_date', 'status']);
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->index('product_id');
            $table->index('order_id');
            $table->index(['product_id', 'order_id']);
        });

        Schema::table('inventory_items', function (Blueprint $table) {
            $table->index('category');
            $table->index('name');
            $table->index(['category', 'name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropIndex(['name']);
            $table->dropIndex(['price']);
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->dropIndex(['checkout_date']);
            $table->dropIndex(['status']);
            $table->dropIndex(['payment_status']);
            $table->dropIndex(['checkout_date', 'status']);
        });

        Schema::table('order_items', function (Blueprint $table) {
            $table->dropIndex(['product_id']);
            $table->dropIndex(['order_id']);
            $table->dropIndex(['product_id', 'order_id']);
        });

        Schema::table('inventory_items', function (Blueprint $table) {
            $table->dropIndex(['category']);
            $table->dropIndex(['name']);
            $table->dropIndex(['category', 'name']);
        });
    }
};
