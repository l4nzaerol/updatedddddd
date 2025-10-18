<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InventoryItem extends Model
{
    protected $table = 'inventory_items';
    protected $primaryKey = 'inventory_item_id';
    
    protected $fillable = [
        'name',
        'sku',
        'description',
        'unit',
        'current_stock',
        'unit_cost',
        'reorder_point',
        'safety_stock',
        'location',
        'category',
        'supplier',
        'lead_time_days'
    ];

    public function usage(): HasMany {
        return $this->hasMany(InventoryUsage::class);
    }

    public function usages(): HasMany {
        return $this->hasMany(InventoryUsage::class);
    }
}