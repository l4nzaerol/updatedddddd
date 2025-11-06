# Comprehensive Orders Seeder Guide

## Overview
The `ComprehensiveOrdersSeeder` creates a complete set of test orders that demonstrate all aspects of the production tracking system, including delays, ready-to-deliver items, and pending orders.

## What It Creates

### 9 Orders Total:

#### **Order 1: PENDING Alkansya** 
- **Product**: Alkansya x3
- **Status**: Pending (awaiting admin acceptance)
- **Days Ago**: Just placed (0 days)
- **Production**: None (not accepted yet)
- **Purpose**: Shows pending Alkansya order without production tracking

#### **Order 2: READY TO DELIVER Alkansya** ✅
- **Product**: Alkansya x5
- **Status**: Ready for Delivery
- **Days Ago**: Placed 8 days ago, accepted 7 days ago
- **Progress**: 100% complete
- **Production**: Completed
- **Purpose**: Shows completed Alkansya ready for delivery

#### **Order 3: PROCESSING with Early Delay** ⚠️
- **Product**: Wooden Chair x1
- **Status**: Processing
- **Progress**: 20% complete
- **Days Ago**: Placed 4 days ago, accepted 3 days ago
- **Delays**: 
  - Material Preparation: "Supplier delayed wood delivery by 1 day" (+1 day)
- **Purpose**: Shows early-stage delay

#### **Order 4: PROCESSING with Multiple Delays** ⚠️⚠️
- **Product**: Dining Table x2
- **Status**: Processing
- **Progress**: 45% complete
- **Days Ago**: Placed 8 days ago, accepted 7 days ago
- **Delays**:
  - Material Preparation: "Supplier delayed wood delivery by 2 days" (+2 days)
  - Cutting & Shaping: "Equipment malfunction required maintenance" (+1.5 days)
- **Purpose**: Shows multiple delays in different stages

#### **Order 5: PROCESSING without Delays** ✅
- **Product**: Wooden Chair x2
- **Status**: Processing
- **Progress**: 60% complete
- **Days Ago**: Placed 10 days ago, accepted 9 days ago
- **Delays**: None
- **Purpose**: Shows on-time production for comparison

#### **Order 6: PROCESSING with Assembly Delay** ⚠️
- **Product**: Dining Table x1
- **Status**: Processing
- **Progress**: 75% complete
- **Days Ago**: Placed 13 days ago, accepted 12 days ago
- **Delays**:
  - Assembly: "Worker shortage due to sick leave" (+1 day)
- **Purpose**: Shows mid-stage delay

#### **Order 7: PROCESSING with Finishing Delay** ⚠️
- **Product**: Wooden Chair x1
- **Status**: Processing
- **Progress**: 90% complete
- **Days Ago**: Placed 16 days ago, accepted 15 days ago
- **Delays**:
  - Finishing: "Waiting for custom stain color to arrive" (+2 days)
- **Purpose**: Shows late-stage delay

#### **Order 8: COMPLETED - Ready for Delivery** ✅
- **Product**: Dining Table x1
- **Status**: Ready for Delivery
- **Progress**: 100% complete
- **Days Ago**: Placed 18 days ago, accepted 17 days ago
- **Delays**: None
- **Purpose**: Shows completed furniture ready for delivery

#### **Order 9: PENDING Regular Furniture**
- **Product**: Wooden Chair x1
- **Status**: Pending (awaiting admin acceptance)
- **Days Ago**: Placed 1 day ago
- **Production**: None (not accepted yet)
- **Purpose**: Shows pending regular furniture order

## How to Run

### Step 1: Ensure Products Exist
Make sure you have the required products in your database:
```bash
php artisan db:seed --class=ProductsTableSeeder
```

### Step 2: Run the Comprehensive Seeder
```bash
cd capstone-back
php artisan db:seed --class=ComprehensiveOrdersSeeder
```

### Step 3: Verify in the Application
1. **Login as Customer** (customer@gmail.com / password)
2. **Go to "My Orders"** - You should see all 9 orders
3. **Check Production Tracking** - You should see delay information for Orders 3, 4, 6, 7

4. **Login as Admin** (admin@gmail.com / password)
5. **Go to Production Page**:
   - **Current Production Tab**: See Orders 3-7 (in progress)
   - **Ready to Deliver Tab**: See Orders 2, 8 (completed)
   - **Process Completion Tab**: See all completed processes with delay reasons
   - **Production Analytics Tab**: See stage performance metrics

## What You'll See

### Customer View (My Orders)
- **Order #1**: Pending Alkansya (no tracking details yet)
- **Order #2**: Alkansya - Ready for Delivery ✅
- **Order #3**: Wooden Chair - 20% complete ⚠️ (Material Preparation delayed)
- **Order #4**: Dining Table - 45% complete ⚠️⚠️ (2 processes delayed)
- **Order #5**: Wooden Chair - 60% complete ✅ (on time)
- **Order #6**: Dining Table - 75% complete ⚠️ (Assembly delayed)
- **Order #7**: Wooden Chair - 90% complete ⚠️ (Finishing delayed)
- **Order #8**: Dining Table - Ready for Delivery ✅
- **Order #9**: Wooden Chair - Pending acceptance

### Customer View (Production Tracking Details)
When you expand an order with delays, you'll see:
- **Previous Stages** section showing completed processes
- **Delay warning boxes** with yellow background
- **Delay reasons** clearly displayed
- **Completed by** information
- **Red "DELAYED" badges** on affected processes

### Admin View (Production Page)

#### Current Production Tab
Shows Orders 3-7 with their current stages and progress

#### Ready to Deliver Tab
Shows Orders 2 and 8 ready for delivery

#### Process Completion Tab
Shows all completed processes with:
- Order # column
- Delay status column
- Delay reasons for Orders 3, 4, 6, 7

#### Production Analytics Tab
Shows:
- **Stage Completion Summary**: Performance metrics per stage
- **Summary**: Total orders, in progress, completed
- **Stage Workload**: Distribution across stages
- **Resource Allocation**: Capacity and priorities

## Delay Summary

| Order | Product | Delayed Processes | Total Extra Days |
|-------|---------|-------------------|------------------|
| 3 | Wooden Chair | Material Preparation | +1 day |
| 4 | Dining Table | Material Preparation, Cutting & Shaping | +3.5 days |
| 6 | Dining Table | Assembly | +1 day |
| 7 | Wooden Chair | Finishing | +2 days |

**Total Delays**: 4 orders with delays out of 7 in production (57% delayed)

## Key Features Demonstrated

1. ✅ **Pending Orders** - Both Alkansya and regular furniture
2. ✅ **Ready to Deliver** - Both Alkansya and regular furniture
3. ✅ **Production Tracking** - Various stages of completion
4. ✅ **Delay Tracking** - Multiple types of delays with reasons
5. ✅ **Completed Processes** - With and without delays
6. ✅ **Order-to-Production Mapping** - Clear association
7. ✅ **Progress Percentages** - Accurate tracking
8. ✅ **Date Tracking** - Started, expected, and actual completion dates

## Testing Scenarios

### Test 1: View Delays in Customer Orders
1. Login as customer
2. Go to My Orders
3. Click on Order #4 (Dining Table)
4. Scroll to "Production Stages"
5. You should see:
   - Yellow warning: "2 processes were completed late"
   - Material Preparation with delay reason
   - Cutting & Shaping with delay reason

### Test 2: View Delays in Admin Production
1. Login as admin
2. Go to Production page
3. Click "Process Completion" tab
4. You should see:
   - Order #3, #4, #6, #7 with "DELAYED" status
   - Delay reasons displayed in the table

### Test 3: View Analytics
1. Login as admin
2. Go to Production page
3. Click "Production Analytics" tab
4. You should see:
   - Stage performance metrics
   - Some stages showing delayed processes
   - Overall production summary

### Test 4: Ready to Deliver
1. Login as admin
2. Go to Production page
3. Click "Ready to Deliver" tab
4. You should see:
   - Order #2 (Alkansya)
   - Order #8 (Dining Table)
   - Both ready to be marked as delivered

## Notes

- **Alkansya orders** don't have detailed process tracking (simplified workflow)
- **Regular furniture** (Tables, Chairs) have full 6-stage process tracking
- **Delays** are only shown for completed processes
- **In-progress processes** don't show delay information yet
- **Pending orders** don't have production records until accepted

## Cleanup

To remove all test data and start fresh:
```bash
php artisan migrate:fresh --seed
```

Then run the seeder again:
```bash
php artisan db:seed --class=ComprehensiveOrdersSeeder
```

## Success Indicators

✅ **Customer can see**:
- All 9 orders in My Orders
- Delay information for Orders 3, 4, 6, 7
- Ready to deliver status for Orders 2, 8

✅ **Admin can see**:
- 5 orders in Current Production (3-7)
- 2 orders in Ready to Deliver (2, 8)
- Delay details in Process Completion tab
- Analytics showing stage performance

✅ **Delay tracking works**:
- Delay reasons display correctly
- Completed by information shows
- Expected vs actual dates visible
- Performance metrics reflect delays
