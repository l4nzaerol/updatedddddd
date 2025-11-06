# Customer Order Page - Production Tracking Update

## Overview
Updated the customer's order page (`OrderTable.js`) to display **current production stage** for table and chair orders, showing real-time updates from the admin side.

## Changes Made

### Frontend Changes (`casptone-front/src/components/OrderTable.js`)

#### 1. Fixed Tracking API Endpoint
**Before:**
```javascript
const res = await axios.get(`${API}/order-tracking/${orderId}/customer`, ...)
```

**After:**
```javascript
const res = await axios.get(`${API}/orders/${orderId}/tracking`, ...)
```

#### 2. Enhanced Production Tracking Display

**New Features:**
- ✅ Shows **current production stage** for each table/chair item
- ✅ Displays **overall progress bar** with percentage
- ✅ Shows **ETA (Estimated Time of Arrival)**
- ✅ Individual progress bars for each tracked product
- ✅ Status badges (In Progress, Completed, Pending)
- ✅ Only displays for **table and chair orders**
- ✅ Real-time updates when admin marks stages complete

## What Customers See

### For Table/Chair Orders (Tracked Products):

```
Order Acceptance Status
✅ Your order has been accepted and is now in production!

Production Tracking
─────────────────────────────────────────
Overall Progress                  ETA: 2 weeks
[████████░░░░░░░░░░░░] 33%

Current Production Stage:
┌──────────────────────────────────────┐
│ Dining Table                         │
│ 🚚 Assembly                 [In Progress] │
│ [████████░░░░░░░░░░░░] 33%          │
└──────────────────────────────────────┘
```

### For Non-Tracked Products (Alkansya, etc.):
```
Production Tracking
─────────────────────────────────────────
🕐 This order contains items that don't 
   require detailed production tracking.
```

## Display Logic

### Shows Production Tracking When:
1. ✅ Order acceptance_status === 'accepted'
2. ✅ Tracking data is available
3. ✅ Order contains table or chair products

### Shows Current Stage:
- **Product Name**: e.g., "Dining Table"
- **Current Stage**: e.g., "Assembly", "Cutting & Shaping"
- **Status Badge**: "In Progress", "Completed", or "Pending"
- **Progress Bar**: Shows percentage complete

## Real-Time Updates

### How It Works:
1. **Admin/Staff** marks a production stage as complete
2. **Backend** updates production process status
3. **Backend** recalculates current_stage for the production
4. **Customer** sees updated stage name immediately (or after page refresh)

### Auto-Refresh:
- Orders list refreshes every **10 seconds**
- Tracking data fetched when order is expanded
- No manual refresh needed

## Backend Integration

The tracking data comes from:
- **Endpoint**: `GET /api/orders/{id}/tracking`
- **Returns**: 
  - `trackings[]` - Array of product tracking data
  - `trackings[].is_tracked_product` - Boolean (true for table/chair)
  - `trackings[].current_stage` - Current production stage name
  - `trackings[].status` - Overall status
  - `trackings[].progress_percentage` - Progress (0-100)
  - `overall.progress_pct` - Overall order progress
  - `overall.eta` - Estimated completion date

## Production Stages Displayed

Customers can see these stage names:
1. Material Preparation
2. Cutting & Shaping
3. Assembly
4. Sanding & Surface Preparation
5. Finishing
6. Quality Check & Packaging
7. Completed

## UI Components

### Order Acceptance Status
- **Pending**: Blue info alert with clock icon
- **Accepted**: Green success alert with checkmark
- **Rejected**: Red danger alert with reason

### Production Tracking Section
- **Overall Progress Bar**: Shows total order progress
- **Current Stage Cards**: One card per tracked product
- **Product Name**: Bold, primary color
- **Stage Name**: With truck icon, bold text
- **Status Badge**: Color-coded (info/success/secondary)
- **Individual Progress Bar**: Shows item-specific progress

## Testing Steps

1. **Create Order**: Place an order with a table or chair
2. **Admin Accepts**: Order acceptance_status becomes 'accepted'
3. **Production Starts**: Production record created automatically
4. **Customer Views Order**: 
   - Click on order to expand
   - See "Order Acceptance Status" section
   - See "Production Tracking" section
   - See current stage (e.g., "Material Preparation")
5. **Admin Updates Stage**: Admin checks off a stage
6. **Customer Refreshes**: 
   - Current stage updates automatically
   - Progress bar increases
   - Status badge updates

## Example Scenarios

### Scenario 1: Order Just Accepted
```
Current Production Stage:
Dining Table
🚚 Material Preparation [In Progress]
[██░░░░░░░░░░░░░░░░░░] 10%
```

### Scenario 2: Mid-Production
```
Current Production Stage:
Dining Table
🚚 Assembly [In Progress]
[████████░░░░░░░░░░░░] 40%
```

### Scenario 3: Almost Complete
```
Current Production Stage:
Dining Table
🚚 Quality Check & Packaging [In Progress]
[████████████████████] 90%
```

### Scenario 4: Completed
```
Current Production Stage:
Dining Table
🚚 Completed [Completed]
[████████████████████] 100%
```

## Benefits

1. **Transparency**: Customers know exactly what stage their order is in
2. **Real-Time**: Updates reflect admin actions immediately
3. **Clarity**: Simple, clear stage names (not technical jargon)
4. **Confidence**: Visual progress bars build trust
5. **Reduced Inquiries**: Customers don't need to call/email for updates

## Notes

- Only **table and chair** orders show detailed stage tracking
- Other products show a simple message
- Stage names come directly from production processes
- Updates happen when admin checks/unchecks stages
- ETA defaults to "2 weeks" if not specified
- Progress percentage calculated from completed stages
