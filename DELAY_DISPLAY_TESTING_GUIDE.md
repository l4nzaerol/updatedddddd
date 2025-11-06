# Delay Information Display - Testing Guide

## Overview
The customer production tracking page now displays delay information for completed processes that were delayed.

## Test Data Created
The `DelayTestingOrdersSeeder` has created test orders with realistic delay scenarios:

### Order #3 (Dining Table x1)
- **Started**: 3 days ago
- **Current Stage**: Cutting & Shaping (In Progress)
- **Completed Processes with Delays**:
  - ✅ Material Preparation - **DELAYED**
    - Reason: "Supplier delayed wood delivery by 2 days"
    - Extra time: 2 days

### Order #7 (Dining Table x2)
- **Started**: 10 days ago  
- **Current Stage**: Finishing (In Progress)
- **Completed Processes with Delays**:
  - ✅ Material Preparation - **DELAYED**
    - Reason: "Supplier delayed wood delivery by 2 days"
    - Extra time: 2 days
  - ✅ Cutting & Shaping - **DELAYED**
    - Reason: "Equipment malfunction required maintenance"
    - Extra time: 1.5 days
  - ✅ Assembly - **DELAYED**
    - Reason: "Worker shortage due to sick leave"
    - Extra time: 1 day
  - ✅ Sanding & Surface Preparation - **ON TIME** (no delay)

## How to Test

### Step 1: Login as Customer
```
Email: customer@gmail.com
Password: password
```

### Step 2: Navigate to Production Tracking
- Go to the customer dashboard
- Click on "Production Tracking" or navigate to the tracking page

### Step 3: View Order #3 or Order #7
You should see:

1. **Delay Summary Alert** (yellow warning box at the top):
   - Shows how many processes were delayed
   - Lists all delayed stages with their reasons

2. **Individual Process Cards**:
   - Each completed process shows:
     - ✅ Green checkmark if on time
     - ⚠️ Yellow/orange warning if delayed
   - Delayed processes have:
     - "DELAYED" badge in red
     - Yellow background highlighting
     - Delay reason displayed in a warning box
     - Completed by name
     - Expected vs Actual completion dates

### Step 4: Check Browser Console
Open browser DevTools (F12) and check the Console tab for:
```javascript
// You should see logs like:
⚠️ DELAYED PROCESS FOUND: {
  name: "Material Preparation",
  reason: "Supplier delayed wood delivery by 2 days",
  completed_by_name: "Admin"
}
```

## Expected Display Format

### Delay Summary Alert
```
⚠️ Production Delays Occurred

3 processes were completed late. See details below for each delayed stage.

Delayed Stages:
• Material Preparation - Supplier delayed wood delivery by 2 days
• Cutting & Shaping - Equipment malfunction required maintenance
• Assembly - Worker shortage due to sick leave
```

### Individual Process with Delay
```
⚠️ [Process Name]  [DELAYED badge]
Duration: Xh Ym
Started: [Date]
Expected Completion: [Date]
Actual Completion: [Date] (in red/warning color)

⚠️ Delay Reason:
[Reason text]
Completed by: [Admin Name]
```

## Troubleshooting

### If delays are not showing:

1. **Check the database**:
   ```bash
   php artisan tinker
   ```
   ```php
   \App\Models\ProductionProcess::where('delay_reason', '!=', null)->get(['id', 'process_name', 'delay_reason', 'is_delayed'])
   ```

2. **Check API response**:
   - Open browser DevTools → Network tab
   - Look for the API call to `/api/orders/{id}/tracking`
   - Check if `processes` array contains `delay_reason` field

3. **Check frontend console**:
   - Look for the console.log statements that show tracking data
   - Verify `tracking.processes` contains delay information

4. **Clear cache**:
   ```bash
   # Backend
   php artisan cache:clear
   php artisan config:clear
   
   # Frontend
   Ctrl+Shift+R (hard refresh in browser)
   ```

## Re-running the Seeder

To reset and recreate test data:
```bash
cd capstone-back
php artisan db:seed --class=DelayTestingOrdersSeeder
```

This will:
- Delete existing orders #3 and #7
- Recreate them with fresh delay data
- Preserve all other orders in the database

## Code Locations

### Backend
- **Seeder**: `capstone-back/database/seeders/DelayTestingOrdersSeeder.php`
- **API Controller**: `capstone-back/app/Http/Controllers/OrderController.php` (tracking method)
- **Model**: `capstone-back/app/Models/ProductionProcess.php`

### Frontend
- **Customer View**: `casptone-front/src/components/Customers/ProductionTracking.jsx`
- **Lines 417-463**: Delay summary alert logic
- **Lines 466-561**: Individual process display with delays

## Notes
- Only **completed** processes can show delay information
- Delays are calculated by comparing expected vs actual completion dates
- The `delay_reason` field must be non-null and non-empty to display
- The frontend filters for `status === 'completed'` when showing delay summaries
