# Time-Accurate Order Seeder

## Overview
The seeder has been completely rewritten to create orders with **time-accurate progress** based on when they were placed and accepted.

## Key Principle
**Progress is calculated based on time elapsed since acceptance, not arbitrary percentages.**

## Formula
```
Progress = (Days Since Acceptance / Total Production Days) × 100
```

For furniture (non-Alkansya): **14 days total production time**

## Seeder Data

### Orders 1-3: Pending (Not Accepted)
These orders are waiting for admin acceptance:

| Order | Product | Placed | Status | Progress |
|-------|---------|--------|--------|----------|
| 1 | Dining Table x1 | Today | Pending | 0% |
| 2 | Wooden Chair x2 | Yesterday | Pending | 0% |
| 3 | Alkansya x5 | 2 days ago | Pending | 0% |

**Characteristics:**
- `acceptance_status = 'pending'`
- `status = 'pending'`
- No production record
- Tracking status = `'pending'`
- Progress = 0%

### Orders 4-6: Accepted (In Production)
These orders were accepted and progress is calculated based on time:

| Order | Product | Placed | Accepted | Days in Production | Progress | Current Stage |
|-------|---------|--------|----------|-------------------|----------|---------------|
| 4 | Dining Table x1 | 14 days ago | 13 days ago | 13 days | ~93% | Quality Check & Packaging |
| 5 | Wooden Chair x2 | 10 days ago | 9 days ago | 9 days | ~64% | Sanding & Surface Prep |
| 6 | Dining Table x2 | 7 days ago | 6 days ago | 6 days | ~43% | Assembly |

**Progress Calculation Examples:**

**Order 4:**
- Accepted 13 days ago
- Total production time: 14 days
- Progress: (13 / 14) × 100 = **92.86%** ≈ 93%
- Stage: Quality Check & Packaging (90-100% threshold)

**Order 5:**
- Accepted 9 days ago
- Total production time: 14 days
- Progress: (9 / 14) × 100 = **64.29%** ≈ 64%
- Stage: Sanding & Surface Preparation (60-75% threshold)

**Order 6:**
- Accepted 6 days ago
- Total production time: 14 days
- Progress: (6 / 14) × 100 = **42.86%** ≈ 43%
- Stage: Assembly (30-60% threshold)

**Characteristics:**
- `acceptance_status = 'accepted'`
- `status = 'pending'` (still pending until ready)
- Production created with time-based progress
- Tracking status = `'in_production'`
- Current stage determined by progress percentage

### Order 7: Completed
| Order | Product | Placed | Accepted | Completed | Progress |
|-------|---------|--------|----------|-----------|----------|
| 7 | Wooden Chair x1 | 16 days ago | 15 days ago | 1 day ago | 100% |

**Characteristics:**
- `acceptance_status = 'accepted'`
- `status = 'ready_for_delivery'`
- Production status = `'Completed'`
- Tracking status = `'ready_for_delivery'`
- Progress = 100%

## Stage Thresholds

Progress determines which stage the production is in:

| Progress Range | Stage |
|----------------|-------|
| 0-10% | Material Preparation |
| 10-30% | Cutting & Shaping |
| 30-60% | Assembly |
| 60-75% | Sanding & Surface Preparation |
| 75-90% | Finishing |
| 90-100% | Quality Check & Packaging |

## Production Processes

For each order, 6 production processes are created with status based on current stage:

```
✓ Material Preparation (completed)
✓ Cutting & Shaping (completed)
→ Assembly (in_progress) ← Current stage
○ Sanding & Surface Preparation (pending)
○ Finishing (pending)
○ Quality Check & Packaging (pending)
```

## Time Calculations

### Production Started At
```php
$productionStartedAt = now()->subDays($daysAgoAccepted);
```

### Estimated Completion
```php
$estimatedCompletion = $productionStartedAt->copy()->addDays(14);
```

### Actual Completion (for completed orders)
```php
$actualCompletion = now()->subDays($daysAgoAccepted - 14);
```

## Synchronization

After creating each order, the seeder:
1. Creates the order with proper dates
2. Creates production with time-based progress
3. Creates production processes with correct status
4. Creates order tracking
5. **Syncs tracking with production** using `ProductionTrackingService`
6. Verifies and logs the result

## Expected Output

When you run the seeder, you'll see:

```
=== Creating Time-Accurate Orders ===

Order 1: PENDING - Placed today (not accepted yet)
✓ Order #1 (PENDING ACCEPTANCE) | Dining Table x1
  Tracking Stage: Material Preparation | Status: pending

Order 2: PENDING - Placed yesterday (not accepted yet)
✓ Order #2 (PENDING ACCEPTANCE) | Wooden Chair x2
  Tracking Stage: Material Preparation | Status: pending

Order 3: PENDING - Placed 2 days ago (not accepted yet)
✓ Order #3 (PENDING ACCEPTANCE) | Alkansya x5
  Tracking Stage: Design | Status: pending

Order 4: Placed 14 days ago, Accepted 13 days ago
✓ Order #4 | Placed 14d ago | Accepted 13d ago
  Production: Quality Check & Packaging | Progress: 93%
  Tracking: Quality Check & Packaging | Status: in_production

Order 5: Placed 10 days ago, Accepted 9 days ago
✓ Order #5 | Placed 10d ago | Accepted 9d ago
  Production: Sanding & Surface Preparation | Progress: 64%
  Tracking: Sanding & Surface Preparation | Status: in_production

Order 6: Placed 7 days ago, Accepted 6 days ago
✓ Order #6 | Placed 7d ago | Accepted 6d ago
  Production: Assembly | Progress: 43%
  Tracking: Assembly | Status: in_production

Order 7: Placed 16 days ago, Accepted 15 days ago, COMPLETED
✓ Order #7 | Placed 16d ago | Accepted 15d ago
  Production: Quality Check & Packaging | Progress: 100%
  Tracking: Quality Check & Packaging | Status: ready_for_delivery
```

## Verification

### Admin Dashboard
- **Pending Orders**: 3
- **In Progress**: 3
- **Completed Productions**: 1

### Orders Page
- 3 orders with "Pending Acceptance" badge
- 3 orders showing actual progress (93%, 64%, 43%)
- 1 order "Ready for Delivery"

### Production Dashboard
- Order #4: 93% complete, Quality Check stage
- Order #5: 64% complete, Sanding stage
- Order #6: 43% complete, Assembly stage
- Order #7: 100% complete

### Customer Tracking
Each order shows:
- Correct placement date
- Acceptance date (for accepted orders)
- Time-based progress
- Current stage matching production
- Timeline with correct process status

## Benefits

✅ **Realistic Data**: Progress reflects actual time elapsed
✅ **Accurate Tracking**: Customer sees real production timeline
✅ **Consistent Display**: All pages show same information
✅ **Time-Based**: Progress automatically calculated from dates
✅ **Proper Workflow**: Orders start at 0% when accepted
✅ **Stage Accuracy**: Current stage matches progress percentage

## Testing

```bash
# Refresh database
cd capstone-back
php artisan migrate:fresh --seed

# Verify synchronization
php verify_order_sync.php

# Check output
# All orders should show synchronized data
```

## Summary

The seeder now creates **time-accurate orders** where:
- Pending orders have 0% progress
- Accepted orders have progress based on days since acceptance
- Current stage is determined by progress percentage
- All tracking data matches production data
- Progress will continue to increase as time passes (if using time-based progress system)
