# Manual Integration Guide - Stage Breakdown Cards

## Component Created

✅ **File**: `casptone-front/src/components/Admin/Analytics/StageBreakdownCards.jsx`

This component displays production stages with names, percentages, and progress bars.

## Integration Steps

### Step 1: Import the Component

**File**: `casptone-front/src/components/Admin/ProductionPage.jsx`

**Location**: Around line 3-4 (after other imports)

**Add this line:**
```javascript
import StageBreakdownCards from "./Analytics/StageBreakdownCards";
```

**Full import section should look like:**
```javascript
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import AppLayout from "../Header";
import StageBreakdownCards from "./Analytics/StageBreakdownCards";  // ADD THIS LINE

import {
  BarChart,
  Bar,
  // ... rest of imports
```

### Step 2: Update the Analytics Section Layout

**File**: `casptone-front/src/components/Admin/ProductionPage.jsx`

**Location**: Around line 774-790

**Find this section:**
```javascript
            <div className="card-body">
              <div className="row">
                <div className="col-lg-8">
                  <h6>Daily Output</h6>
                  <div style={{ width: "100%", height: 260 }}>
                    // Daily Output Chart
                  </div>
                </div>
                <div className="col-lg-4">
                  <h6 className="mb-3 text-center fw-bold">Production Stage Breakdown</h6>
                  <div style={{ width: "100%", height: 340, position: 'relative' }}>
                    // Pie Chart
                  </div>
                </div>
              </div>
```

**Replace with:**
```javascript
            <div className="card-body">
              <div className="row">
                {/* Daily Output Chart */}
                <div className="col-lg-6 mb-4">
                  <div className="card shadow-sm h-100">
                    <div className="card-body">
                      <h6>Daily Output</h6>
                      <div style={{ width: "100%", height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dailyOutput} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="quantity" fill="#3498db" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Stage Breakdown Cards */}
                <div className="col-lg-6 mb-4">
                  <div className="card shadow-sm h-100">
                    <div className="card-body">
                      <StageBreakdownCards stageData={stageData} />
                    </div>
                  </div>
                </div>
              </div>
```

### Step 3: Verify stageData Variable

Make sure the `stageData` variable is available in the component. It should be computed from `analyticsData.stage_breakdown`.

**Check around line 200-300 for:**
```javascript
const stageData = useMemo(() => {
  return analyticsData.stage_breakdown || [];
}, [analyticsData]);
```

If it doesn't exist, add it after the state declarations.

## What the Component Does

### Features:
1. **Stage Cards**: Each production stage gets its own card
2. **Colored Indicators**: Brown/wood theme matching dashboard
3. **Percentages**: Shows percentage of total orders
4. **Order Count**: Shows number of orders in each stage
5. **Progress Bars**: Visual representation of percentage
6. **Responsive**: Adapts to screen size

### Visual Design:
```
┌─────────────────────────────────────────────┐
│ ● Material Preparation        14.3% (1)     │
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ │
├─────────────────────────────────────────────┤
│ ● Cutting & Shaping           14.3% (1)     │
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ │
├─────────────────────────────────────────────┤
│ ● Assembly                    28.6% (2)     │
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ │
└─────────────────────────────────────────────┘
```

## Expected Result

### Before:
- Daily Output: 8 columns wide
- Stage Breakdown: 4 columns wide (pie chart)
- Uneven layout

### After:
- Daily Output: 6 columns wide (in card)
- Stage Breakdown: 6 columns wide (in card with stage cards)
- Equal width, better alignment
- Stage names and percentages clearly visible

## Color Scheme

The component uses brown/wood tones:
- **Material Preparation**: Dark brown (#8b5e34)
- **Cutting & Shaping**: Medium brown (#a0785a)
- **Assembly**: Light brown (#b89176)
- **Sanding & Surface**: Tan (#d0aa92)
- **Finishing**: Beige (#c9a882)
- **Quality Check**: Cream (#e8d4c0)

## Troubleshooting

### Component Not Showing
- Check import path is correct
- Verify StageBreakdownCards.jsx file exists
- Check console for errors

### No Data Displaying
- Verify `stageData` prop is passed correctly
- Check `analyticsData.stage_breakdown` has data
- Console log: `console.log('stageData:', stageData)`

### Styling Issues
- Ensure Bootstrap CSS is loaded
- Check card classes are correct
- Verify color values are valid hex codes

## Quick Test

After integration, you should see:
- ✅ Two equal-width cards (50/50)
- ✅ Daily Output chart on left
- ✅ Stage breakdown cards on right
- ✅ Each stage shows name, percentage, count, and progress bar
- ✅ Brown color theme throughout
- ✅ Responsive layout

## Alternative: Copy-Paste Full Section

If you prefer, here's the complete section to replace (around line 774-874):

```jsx
            <div className="card-body">
              <div className="row">
                {/* Daily Output Chart */}
                <div className="col-lg-6 mb-4">
                  <div className="card shadow-sm h-100">
                    <div className="card-body">
                      <h6>Daily Output</h6>
                      <div style={{ width: "100%", height: 260 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={dailyOutput} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="quantity" fill="#3498db" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Stage Breakdown Cards */}
                <div className="col-lg-6 mb-4">
                  <div className="card shadow-sm h-100">
                    <div className="card-body">
                      <StageBreakdownCards stageData={stageData} />
                    </div>
                  </div>
                </div>
              </div>
```

## Files Involved

1. ✅ **Created**: `StageBreakdownCards.jsx` - New component
2. ⏳ **Edit**: `ProductionPage.jsx` - Add import and use component

## Summary

✅ **Component created** with unique stage card design
✅ **Shows stage names** with colored indicators
✅ **Displays percentages** prominently
✅ **Progress bars** for visual clarity
✅ **Brown theme** matching dashboard
✅ **Equal layout** (6-6 columns)

Follow the steps above to integrate the component into ProductionPage.jsx! 🎉
