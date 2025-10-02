# Order Seeder Synchronization Fix

## Problem
Orders, Productions, and Order Tracking were not properly synchronized, causing mismatches between:
- Order page display
- Production dashboard
- Customer tracking page

## Root Causes Fixed

### 1. **Pending Orders Had Incorrect Tracking Data**
- **Before**: Pending orders (not accepted) had tracking with progress and stages set
- **After**: Pending orders now have:
  - `status = 'pending'`
  - `current_stage` set to first stage (Material Preparation or Design)
  - `progress = 0`
  - No estimated dates until accepted

### 2. **Tracking Stage Mismatch**
- **Before**: Tracking `current_stage` could differ from Production `current_stage`
- **After**: Both use the exact same stage name after sync

### 3. **Process Timeline Not Matching Production Processes**
- **Before**: Timeline in tracking could show different status than actual production processes
- **After**: Timeline is generated based on actual progress and synced after production creation

## Changes Made

### File: `CustomerOrdersSeeder.php`

#### Change 1: Tracking Status Logic (Lines 172-181)
```php
// Determine tracking status based on progress AND acceptance status
$trackingStatus = 'pending';
if (!$isAccepted) {
    // Not accepted yet - tracking should be pending
    $trackingStatus = 'pending';
} elseif ($progress >= 100) {
    $trackingStatus = 'ready_for_delivery';
} elseif ($progress > 0) {
    $trackingStatus = 'in_production';
}
```

#### Change 2: Tracking Stage for Pending Orders (Lines 183-187)
```php
// For pending orders (not accepted), set stage to first stage
$trackingCurrentStage = $currentStage;
if (!$isAccepted) {
    $trackingCurrentStage = $trackingType === 'alkansya' ? 'Design' : 'Material Preparation';
}
```

#### Change 3: Conditional Tracking Data (Lines 197-201)
```php
'estimated_start_date' => $isAccepted ? $estimatedStart : null,
'estimated_completion_date' => $isAccepted ? $estimatedCompletion : null,
'actual_start_date' => ($isAccepted && $progress > 0) ? $estimatedStart : null,
'actual_completion_date' => ($isAccepted && $progress >= 100) ? now()->subDays(max(0, $daysAgo - 1)) : null,
'process_timeline' => $this->generateProcessTimeline($trackingType, $trackingCurrentStage, $trackingStatus, $isAccepted ? $progress : 0),
```

#### Change 4: Enhanced Logging (Lines 316-321)
```php
// Verify sync worked
$tracking->refresh();
$this->command->info("✓ Order #{$order->id} (ACCEPTED) | Production #{$production->id} | {$product->name} x{$quantity}");
$this->command->info("  Production Stage: {$production->current_stage} | Progress: {$progress}%");
$this->command->info("  Tracking Stage: {$tracking->current_stage} | Status: {$tracking->status}");
```

## Updated Seeder Data

The seeder now creates **7 orders**:

### Pending Orders (Not Accepted - No Production)
1. **Order #1**: Dining Table x1 - Placed today
   - Acceptance Status: `pending`
   - Tracking Status: `pending`
   - Current Stage: `Material Preparation`
   - Progress: 0%

2. **Order #2**: Wooden Chair x2 - Placed yesterday
   - Acceptance Status: `pending`
   - Tracking Status: `pending`
   - Current Stage: `Material Preparation`
   - Progress: 0%

3. **Order #3**: Alkansya x5 - Placed 2 days ago
   - Acceptance Status: `pending`
   - Tracking Status: `pending`
   - Current Stage: `Design`
   - Progress: 0%

### Accepted Orders (With Production)
4. **Order #4**: Dining Table x1 - Placed 14 days ago
   - Acceptance Status: `accepted`
   - Production Status: `In Progress`
   - Tracking Status: `in_production`
   - Current Stage: `Quality Check & Packaging`
   - Progress: 95%

5. **Order #5**: Wooden Chair x2 - Placed 7 days ago
   - Acceptance Status: `accepted`
   - Production Status: `In Progress`
   - Tracking Status: `in_production`
   - Current Stage: `Assembly`
   - Progress: 50%

6. **Order #6**: Dining Table x2 - Placed 10 days ago
   - Acceptance Status: `accepted`
   - Production Status: `In Progress`
   - Tracking Status: `in_production`
   - Current Stage: `Sanding & Surface Preparation`
   - Progress: 70%

7. **Order #7**: Dining Table x1 - Placed 15 days ago
   - Acceptance Status: `accepted`
   - Production Status: `Completed`
   - Tracking Status: `ready_for_delivery`
   - Current Stage: `Quality Check & Packaging`
   - Progress: 100%

## Synchronization Flow

```
1. Order Created
   ↓
2. OrderTracking Created
   - If pending: status='pending', stage=first stage, no dates
   - If accepted: status based on progress
   ↓
3. Production Created (only if accepted)
   - Status: 'In Progress' or 'Completed'
   - Stage: matches tracking
   - Progress: set correctly
   ↓
4. ProductionProcesses Created (only for non-alkansya)
   - 6 processes with correct status
   - Previous stages: completed
   - Current stage: in_progress
   - Future stages: pending
   ↓
5. Sync Called (ProductionTrackingService)
   - Updates tracking to match production
   - Ensures stage names are identical
   - Updates progress percentage
   - Updates process timeline
```

## How to Refresh Database

### Step 1: Backup (Optional)
```bash
cd capstone-back
php artisan db:seed --class=DatabaseSeeder > backup.sql
```

### Step 2: Refresh Database
```bash
cd capstone-back
php artisan migrate:fresh --seed
```

This will:
- Drop all tables
- Run migrations
- Run all seeders with the fixed logic

### Step 3: Verify Synchronization
```bash
php verify_order_sync.php
```

Expected output:
```
✓ SYNCHRONIZED - Production and Tracking match (for accepted orders)
✓ CORRECT - Pending order has tracking but no production yet (for pending orders)
```

### Step 4: Clear Caches
```bash
cd capstone-back
php artisan cache:clear
php artisan config:clear
php artisan route:clear
```

### Step 5: Restart Server
```bash
php artisan serve
```

## Verification Checklist

After reseeding, verify these pages show consistent data:

### ✓ Admin Dashboard
- Pending Orders: **3**
- In Progress: **3**
- Completed Productions: **1**

### ✓ Orders Page (Admin)
- 3 orders with "Pending Acceptance" badge
- 3 orders with "In Production" status
- 1 order with "Ready for Delivery" status

### ✓ Production Dashboard
- 4 productions total (only accepted orders)
- Each production shows correct stage and progress
- Production processes match the current stage

### ✓ Customer Tracking Page
- Pending orders show "Waiting for acceptance"
- In-progress orders show current stage with progress bar
- Completed orders show "Ready for delivery"
- Timeline stages match production processes

## Testing Script

Run this to verify everything:
```bash
php verify_order_sync.php
```

This script checks:
- Order status vs Production status
- Order tracking stage vs Production stage
- Process timeline vs Production processes
- Identifies any mismatches

## Expected Dashboard Display

After refresh:
- **Total Productions**: 4
- **Completed Productions**: 1
- **In Progress**: 3
- **Pending Orders**: 3 ✅
- **Completed Orders**: 1
- **On Hold**: 0

## Key Points

1. **Pending orders** (not accepted) should have:
   - No production record
   - Tracking with status='pending'
   - Stage set to first stage
   - No estimated dates

2. **Accepted orders** should have:
   - Production record created
   - Tracking synced with production
   - Matching stages and status
   - Production processes created (for non-alkansya)

3. **Sync service** ensures:
   - Tracking always reflects production state
   - Stage names are identical
   - Progress percentages match
   - Timeline matches process status

## Troubleshooting

### If stages still don't match:
```bash
php artisan tinker
$order = App\Models\Order::find(1);
$service = app(\App\Services\ProductionTrackingService::class);
$service->syncOrderTrackingWithProduction($order->id);
```

### If tracking is missing:
Check that `ProductionTrackingService` exists and the sync method works correctly.

### If processes don't match timeline:
Verify that `generateProcessTimeline()` uses the same stage names as `ProductionProcess` records.
