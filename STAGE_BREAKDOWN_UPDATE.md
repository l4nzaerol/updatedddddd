# Production Stage Breakdown - Design Update Instructions

## Current Issue
The Production Stage Breakdown needs better alignment and a unique design showing stage names with percentages.

## Recommended Changes

### 1. Update Layout Structure

Change from:
```jsx
<div className="col-lg-8">  // Daily Output
<div className="col-lg-4">  // Stage Breakdown
```

To:
```jsx
<div className="col-lg-6">  // Daily Output (in card)
<div className="col-lg-6">  // Stage Breakdown (in card)
```

### 2. Wrap Charts in Individual Cards

**Daily Output Card:**
```jsx
<div className="col-lg-6 mb-4">
  <div className="card shadow-sm h-100">
    <div className="card-body">
      <h6>Daily Output</h6>
      {/* Chart content */}
    </div>
  </div>
</div>
```

**Stage Breakdown Card:**
```jsx
<div className="col-lg-6 mb-4">
  <div className="card shadow-sm h-100">
    <div className="card-body">
      <h6>Production Stage Breakdown</h6>
      {/* New design here */}
    </div>
  </div>
</div>
```

### 3. New Stage Breakdown Design

Replace the pie chart with stage cards showing percentages:

```jsx
<h6 className="mb-3">Production Stage Breakdown</h6>

{/* Stage Cards with Percentages */}
<div className="mb-3">
  {stageData && stageData.map((stage, index) => {
    const total = stageData.reduce((sum, s) => sum + s.value, 0);
    const percentage = total > 0 ? ((stage.value / total) * 100).toFixed(1) : 0;
    
    const stageColors = {
      'Material Preparation': '#8b5e34',
      'Cutting & Shaping': '#a0785a',
      'Assembly': '#b89176',
      'Sanding & Surface Preparation': '#d0aa92',
      'Finishing': '#c9a882',
      'Quality Check & Packaging': '#e8d4c0'
    };
    const color = stageColors[stage.name] || COLORS[index % COLORS.length];
    
    return (
      <div key={stage.name} className="mb-2">
        <div className="p-2 rounded" style={{ 
          backgroundColor: '#f8f9fa', 
          borderLeft: `4px solid ${color}` 
        }}>
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-2">
              <div style={{ 
                width: 12, 
                height: 12, 
                backgroundColor: color, 
                borderRadius: '50%' 
              }}></div>
              <span className="fw-semibold" style={{ fontSize: '0.85rem' }}>
                {stage.name}
              </span>
            </div>
            <div className="text-end">
              <span className="fw-bold" style={{ fontSize: '1rem', color: color }}>
                {percentage}%
              </span>
              <small className="text-muted ms-2">({stage.value})</small>
            </div>
          </div>
          {/* Progress bar */}
          <div className="mt-1">
            <div className="progress" style={{ height: 4 }}>
              <div 
                className="progress-bar" 
                style={{ width: `${percentage}%`, backgroundColor: color }}
              ></div>
            </div>
          </div>
        </div>
      </div>
    );
  })}
</div>
```

## Visual Design

### Stage Card Layout:
```
┌─────────────────────────────────────────────┐
│ ● Material Preparation        14.3% (1)     │
│ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ │
└─────────────────────────────────────────────┘
```

Each card shows:
- Colored dot indicator
- Stage name
- Percentage (bold, colored)
- Count in parentheses
- Progress bar below

## Color Scheme

Brown/Wood tones matching the dashboard:
- Material Preparation: `#8b5e34` (dark brown)
- Cutting & Shaping: `#a0785a` (medium brown)
- Assembly: `#b89176` (light brown)
- Sanding & Surface: `#d0aa92` (tan)
- Finishing: `#c9a882` (beige)
- Quality Check: `#e8d4c0` (cream)

## Manual Steps

### Step 1: Find the Analytics Section
Location: Around line 774 in `ProductionPage.jsx`

### Step 2: Update Column Sizes
Change:
- `col-lg-8` → `col-lg-6` (Daily Output)
- `col-lg-4` → `col-lg-6` (Stage Breakdown)

### Step 3: Wrap Daily Output in Card
Add card wrapper around the Daily Output chart

### Step 4: Wrap Stage Breakdown in Card
Add card wrapper around the Stage Breakdown

### Step 5: Replace Pie Chart Content
Replace the pie chart rendering with the new stage cards design

### Step 6: Add Stage Colors Object
Add the stageColors object with the brown color scheme

## Benefits

✅ **Better Alignment**: Equal width columns (50/50)
✅ **Consistent Cards**: Both charts in matching card containers
✅ **Clear Information**: Stage names with percentages visible
✅ **Progress Bars**: Visual representation of each stage
✅ **Color Coded**: Brown theme matching dashboard
✅ **Responsive**: Works on all screen sizes
✅ **Easy to Read**: No need to hover over pie slices

## Alternative: Keep Pie Chart + Add Cards

If you want to keep the pie chart, you can add the stage cards ABOVE the pie chart:

```jsx
<h6 className="mb-3">Production Stage Breakdown</h6>

{/* Stage Cards */}
<div className="mb-3">
  {/* Stage cards code here */}
</div>

{/* Pie Chart (smaller) */}
<div style={{ width: "100%", height: 200 }}>
  {/* Existing pie chart code */}
</div>
```

This gives both visual representations!

## Summary

The new design provides:
- Equal column widths (6-6 instead of 8-4)
- Individual cards for each chart
- Stage breakdown with names and percentages
- Progress bars for visual clarity
- Brown color scheme matching dashboard theme
- Better readability and professional appearance

