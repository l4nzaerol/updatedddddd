# Production Page Reorganization - Implementation Guide

## Overview
Reorganize the production page to display current productions in full width with tabs and order filtering.

## Current Status
✅ Tab structure partially added
❌ Need to complete the tab navigation at the top
❌ Need to add order filter dropdown
❌ Need to change layout from 2-column to full-width

## Required Changes

### 1. Add Tab Navigation (Line ~560)

**Replace this section:**
```jsx
<div className="row">
  {/* Current Production Processes */}
  <div className="col-lg-6 mb-4">
```

**With:**
```jsx
{/* Tab Navigation */}
<div className="card mb-3 shadow-sm">
  <div className="card-body py-2">
    <div className="d-flex gap-2">
      <button 
        className={`btn ${activeTab === 'current' ? 'btn-primary' : 'btn-outline-primary'}`}
        onClick={() => setActiveTab('current')}
      >
        <i className="fas fa-cogs me-2"></i>
        Current Production Processes
        <span className="badge bg-light text-primary ms-2">
          {filtered.filter(p => p.status === 'In Progress').length}
        </span>
      </button>
      <button 
        className={`btn ${activeTab === 'ready' ? 'btn-warning' : 'btn-outline-warning'}`}
        onClick={() => setActiveTab('ready')}
      >
        <i className="fas fa-truck me-2"></i>
        Ready to Deliver
        <span className="badge bg-light text-dark ms-2">
          {filtered.filter(p => 
            p.status === 'Completed' && 
            p.overall_progress >= 100 && 
            p.order?.status !== 'ready_for_delivery' && 
            p.order?.status !== 'delivered'
          ).length}
        </span>
      </button>
    </div>
  </div>
</div>

{/* Current Production Tab */}
{activeTab === 'current' && (
  <>
    {/* Order Filter */}
    <div className="card mb-3 shadow-sm">
      <div className="card-body py-2">
        <div className="row align-items-center">
          <div className="col-md-2">
            <label className="form-label mb-0 small fw-bold">Filter by Order:</label>
          </div>
          <div className="col-md-10">
            <select 
              className="form-select form-select-sm"
              value={selectedOrder}
              onChange={(e) => setSelectedOrder(e.target.value)}
            >
              <option value="all">All Orders</option>
              {[...new Set(filtered.filter(p => p.status === 'In Progress' && p.order_id).map(p => p.order_id))]
                .map(orderId => (
                  <option key={orderId} value={orderId}>
                    Order #{orderId}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>
    </div>

    <div className="row">
      <div className="col-12">
```

### 2. Update Production List Filter (Line ~592)

**Replace:**
```jsx
<div className="timeline-list" style={{ maxHeight: 500, overflowY: "auto" }}>
  {filtered.filter(p => p.status === 'In Progress').map((prod) => (
```

**With:**
```jsx
<div className="d-flex flex-column gap-3">
  {filtered.filter(p => p.status === 'In Progress' && (selectedOrder === 'all' || p.order_id == selectedOrder)).map((prod) => (
```

### 3. Close Current Tab Section (After production list ends)

**Replace:**
```jsx
            </div>
          </div>
        </div>

        {/* Ready to Deliver */}
        <div className="col-lg-6 mb-4">
```

**With:**
```jsx
            </div>
          </div>
        </div>
      </>
    )}

    {/* Ready to Deliver Tab */}
    {activeTab === 'ready' && (
      <div className="row">
        <div className="col-12">
```

### 4. Close Ready Tab at End

**Replace the closing:**
```jsx
            </div>
          </div>
        </div>

      </div>
```

**With:**
```jsx
            </div>
          </div>
        </div>
      )}
```

## New Features

### Tab Navigation
- Two tabs: "Current Production Processes" and "Ready to Deliver"
- Badge counters showing item counts
- Icons for visual clarity
- Active tab highlighted in blue/yellow

### Order Filter
- Dropdown to filter by specific order
- "All Orders" option to show everything
- Only shows orders that have in-progress productions
- Located above the production list

### Full-Width Display
- Changed from 2-column (`col-lg-6`) to full-width (`col-12`)
- Productions display one per row with full details
- Easier to read and update
- Better use of screen space

### Organized by Order
- When filtering by order, only shows productions for that order
- All stages for that order displayed together
- Makes it easy to see complete order progress

## UI Layout

### Before (2-Column):
```
┌─────────────────┬─────────────────┐
│ Current Prods   │ Ready to Deliver│
│ (scrollable)    │ (scrollable)    │
│                 │                 │
│ Item 1          │ Item A          │
│ Item 2          │ Item B          │
│ Item 3          │                 │
└─────────────────┴─────────────────┘
```

### After (Tabbed Full-Width):
```
┌─────────────────────────────────────┐
│ [Current Prods] [Ready to Deliver]  │
├─────────────────────────────────────┤
│ Filter by Order: [Dropdown ▼]      │
├─────────────────────────────────────┤
│ Order #9 - Dining Table             │
│ ┌─────────────────────────────────┐ │
│ │ [1] Material Preparation  ✓     │ │
│ │ [2] Cutting & Shaping     ✓     │ │
│ │ [3] Assembly              ⏳    │ │
│ │ [4] Sanding...            ⏸     │ │
│ │ [5] Finishing             ⏸     │ │
│ │ [6] Quality Check         ⏸     │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Order #12 - Wooden Chair            │
│ ┌─────────────────────────────────┐ │
│ │ [1] Material Preparation  ✓     │ │
│ │ [2] Cutting & Shaping     ⏳    │ │
│ │ ...                             │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

## Benefits

### For Staff:
1. ✅ **Full-width view** - See all stage details without scrolling horizontally
2. ✅ **Order filtering** - Focus on one order at a time
3. ✅ **Organized layout** - All productions for an order grouped together
4. ✅ **Tab separation** - Current work vs ready items clearly separated
5. ✅ **Easier updates** - Larger checkboxes, clearer layout

### For Workflow:
1. ✅ **Better focus** - Work on one order at a time
2. ✅ **Less confusion** - Tab system prevents information overload
3. ✅ **Faster updates** - Find and update stages quickly
4. ✅ **Clear priorities** - See what needs attention immediately

## Implementation Steps

1. ✅ Add state variables (`activeTab`, `selectedOrder`)
2. ⏳ Add tab navigation buttons at top
3. ⏳ Add order filter dropdown
4. ⏳ Wrap current productions in tab conditional
5. ⏳ Wrap ready to deliver in tab conditional
6. ⏳ Update production filter to include order filter
7. ⏳ Change column width from `col-lg-6` to `col-12`
8. ✅ Remove BOM materials display (already done)

## Testing Checklist

- [ ] Tabs switch correctly
- [ ] Order filter shows all orders with in-progress productions
- [ ] Filtering by order shows only that order's productions
- [ ] "All Orders" shows everything
- [ ] Ready to Deliver tab shows completed items
- [ ] Checkboxes still work to mark stages complete
- [ ] Stage descriptions display correctly
- [ ] Duration shows in days/hours format
- [ ] Mobile responsive (tabs stack on small screens)

## Notes

- State variables already added in line 63-64
- Tab structure partially implemented
- Need to complete the top section reorganization
- Full-width layout provides better UX for production tracking
