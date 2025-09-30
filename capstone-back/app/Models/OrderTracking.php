<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderTracking extends Model
{
    use HasFactory;

    protected $table = 'order_tracking';

    protected $fillable = [
        'order_id',
        'product_id',
        'tracking_type',
        'current_stage',
        'status',
        'estimated_start_date',
        'estimated_completion_date',
        'actual_start_date',
        'actual_completion_date',
        'process_timeline',
        'production_updates',
        'customer_notes',
        'internal_notes',
    ];

    protected $casts = [
        'estimated_start_date' => 'datetime',
        'estimated_completion_date' => 'datetime',
        'actual_start_date' => 'datetime',
        'actual_completion_date' => 'datetime',
        'process_timeline' => 'array',
        'production_updates' => 'array',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    // Helper method to get progress percentage based on time elapsed
    public function getProgressPercentageAttribute()
    {
        if ($this->status === 'completed') {
            return 100;
        }

        // Calculate progress based on time elapsed since order was placed
        $orderDate = $this->order->checkout_date;
        $totalDays = $this->getTotalProductionDays();
        $elapsedDays = now()->diffInDays($orderDate);
        
        // Calculate progress percentage based on elapsed time
        $progress = min(100, ($elapsedDays / $totalDays) * 100);
        
        return round($progress, 2);
    }

    // Get total production days based on product type
    private function getTotalProductionDays()
    {
        if ($this->tracking_type === 'alkansya') {
            return 2; // 2 days for alkansya
        } else {
            return 14; // 2 weeks for tables and chairs
        }
    }

    // Update current stage based on progress percentage (public method)
    public function updateCurrentStageBasedOnProgress($progress = null)
    {
        if ($progress === null) {
            $progress = $this->getProgressPercentageAttribute();
        }
        
        if ($this->tracking_type === 'alkansya') {
            $stages = ['Design', 'Preparation', 'Cutting', 'Assembly', 'Finishing', 'Quality Control'];
            $stageProgress = [16, 33, 50, 66, 83, 100]; // Progress thresholds for each stage
            
            for ($i = 0; $i < count($stages); $i++) {
                if ($progress <= $stageProgress[$i]) {
                    $this->current_stage = $stages[$i];
                    $this->status = $progress >= 100 ? 'completed' : ($progress > 0 ? 'in_production' : 'pending');
                    break;
                }
            }
        } else {
            // For tables and chairs - 2 weeks production (matches actual production stages)
            $stages = ['Material Preparation', 'Cutting & Shaping', 'Assembly', 'Sanding & Surface Preparation', 'Finishing', 'Quality Check & Packaging'];
            $stageProgress = [10, 30, 60, 75, 95, 100]; // Progress thresholds for each stage
            
            for ($i = 0; $i < count($stages); $i++) {
                if ($progress <= $stageProgress[$i]) {
                    $this->current_stage = $stages[$i];
                    $this->status = $progress >= 100 ? 'completed' : ($progress > 0 ? 'in_production' : 'pending');
                    break;
                }
            }
        }
        
        // Save changes if they're different
        if ($this->isDirty(['current_stage', 'status'])) {
            $this->save();
        }
    }
}
