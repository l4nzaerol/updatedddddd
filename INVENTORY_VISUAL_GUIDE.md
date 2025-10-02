# Inventory Dashboard - Visual Structure Guide

## Page Layout Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  ← Back to Dashboard                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Inventory Management                    [+ Add Material]       │
│                                          [Export Stock CSV]     │
│                                          [Export Replen CSV]    │
│                                          [Export Usage CSV]     │
│                                          [Upload Usage CSV]     │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  Search: [________________]  Filter: [All Types ▼]              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                      KPI DASHBOARD CARDS                         │
├────────────────┬────────────────┬────────────────┬──────────────┤
│  📦 Total      │  ⚠️ Reorder    │  📚 Overstock  │  📅 Coverage │
│  Inventory     │  Alerts        │  Items         │  Median      │
│                │                │                │              │
│  [PURPLE]      │  [PINK]        │  [ORANGE]      │  [BLUE]      │
│  42 items      │  5 items       │  2 items       │  15.3 days   │
│  30 materials  │  Action req!   │  Review levels │  Duration    │
│  12 products   │                │                │              │
└────────────────┴────────────────┴────────────────┴──────────────┘

┌──────────────────────────────────────────────────────────────────┐
│  📦 RAW MATERIALS                                    30 items    │
│  Production inputs and components                                │
├──────────────────────────────────────────────────────────────────┤
│ SKU  │ Material Name    │ Location  │ Stock │ Daily │ Days │... │
├──────┼──────────────────┼───────────┼───────┼───────┼──────┼────┤
│ [PW] │ Pinewood 1x4x8ft │ 📍 Wind-2 │  800  │  2.5  │ 320d │ ✅ │
│ [PLY]│ Plywood 4.2mm    │ 📍 Wind-2 │  400  │  1.2  │ 333d │ ✅ │
│ [ACR]│ Acrylic 1.5mm    │ 📍 Wind-2 │  200  │  0.8  │ 250d │ ✅ │
│ [PN] │ Pin Nail F30     │ 📍 Wind-2 │30000  │ 15.0  │2000d │ ✅ │
│ ...  │ ...              │ ...       │  ...  │  ...  │ ...  │... │
└──────┴──────────────────┴───────────┴───────┴───────┴──────┴────┘

┌──────────────────────────────────────────────────────────────────┐
│  ✅ FINISHED PRODUCTS                                12 items    │
│  Ready for sale and delivery                                     │
├──────────────────────────────────────────────────────────────────┤
│ SKU    │ Product Name  │ Location  │ Stock │ Sales │ Days │...  │
├────────┼───────────────┼───────────┼───────┼───────┼──────┼─────┤
│ [FG-A] │ Alkansya      │ 📦 Wind-2 │   0   │  0.0  │  ∞   │ 🔴  │
│ ...    │ ...           │ ...       │  ...  │  ...  │ ...  │...  │
└────────┴───────────────┴───────────┴───────┴───────┴──────┴─────┘
```

## Color Scheme

### KPI Cards (Gradient Backgrounds):
- **Card 1 - Total Inventory**: Purple gradient (#667eea → #764ba2)
- **Card 2 - Reorder Alerts**: Pink gradient (#f093fb → #f5576c)
- **Card 3 - Overstock**: Orange gradient (#ffecd2 → #fcb69f)
- **Card 4 - Coverage**: Blue gradient (#4facfe → #00f2fe)

### Status Indicators:
- **🔴 Red (Danger)**: Reorder now - Stock below reorder point
- **⚠️ Yellow (Warning)**: Overstock - Stock above max level
- **✅ Green (Success)**: OK - Stock at optimal levels

### Section Themes:
- **Raw Materials**: Blue theme with 📦 icon
- **Finished Products**: Green theme with ✅ icon

## Table Row Structure

### Raw Materials Row:
```
┌─────────────────────────────────────────────────────────────────┐
│ [Status Border: Red/Yellow/Green - 4px left border]            │
├─────────────────────────────────────────────────────────────────┤
│ [PW-1x4x8]  │ Pinewood 1x4x8ft                                  │
│ Badge       │ Bold name                                         │
│             │ Small description text                            │
│             │                                                   │
│ 📍 Windfield 2  │  800 units  │  2.5  │  320 days  │  ✅ OK  │
│ Location badge  │  Large bold │  Daily│  Badge     │  Status │
│                 │  + unit     │  use  │  colored   │  badge  │
│                 │                                               │
│ Reorder: ✓ Sufficient  │  [✏️ Edit] [🗑️]                      │
│ OR: 150 units needed   │  Action buttons                       │
└─────────────────────────────────────────────────────────────────┘
```

### Finished Products Row:
```
┌─────────────────────────────────────────────────────────────────┐
│ [Status Border: Red/Yellow/Green - 4px left border]            │
├─────────────────────────────────────────────────────────────────┤
│ [FG-ALKANSYA]  │ Alkansya (Finished Good)                      │
│ Green badge    │ Bold name                                      │
│                │ Small description text                         │
│                │                                                │
│ 📦 Windfield 2  │  0 units   │  0.0  │  ∞ days   │  🔴 Reorder│
│ Location badge  │  Large bold│  Sales│  Badge    │  Status    │
│                 │  + unit    │  rate │  colored  │  badge     │
│                 │                                               │
│ Production: 100 units to produce  │  [✏️ Edit] [🗑️]            │
│ OR: ✓ Sufficient                  │  Action buttons            │
└─────────────────────────────────────────────────────────────────┘
```

## Interactive Elements

### Hover Effects:
1. **KPI Cards**: Lift up 5px with enhanced shadow
2. **Table Rows**: Slide right 4px with background color change
3. **Buttons**: Standard Bootstrap hover states

### Transitions:
- All animations: 0.3s ease
- Smooth, professional feel
- No jarring movements

## Responsive Behavior

### Desktop (>992px):
- 4 KPI cards in a row
- Full table with all columns visible
- Side-by-side action buttons

### Tablet (768px - 991px):
- 2 KPI cards per row
- Horizontal scroll for tables
- Stacked action buttons

### Mobile (<768px):
- 1 KPI card per row
- Horizontal scroll for tables
- Full-width action buttons

## Empty States

### No Items Match Filters:
```
┌─────────────────────────────────────────────┐
│                                             │
│              📥 (Large icon)                │
│                                             │
│        No items match your filters          │
│   Try adjusting your search criteria or     │
│           add new materials                 │
│                                             │
│         [+ Add Material Button]             │
│                                             │
└─────────────────────────────────────────────┘
```

## Data Flow

```
User Input (Search/Filter)
         ↓
    Filtered Data
         ↓
    Grouped by Category
         ↓
┌────────┴────────┐
│                 │
Raw Materials   Finished Products
(Display First)  (Display Last)
```

## Key Metrics Displayed

### Per Item:
- SKU (unique identifier)
- Name and description
- Location (warehouse/shelf)
- Current stock quantity
- Daily usage/sales rate
- Days of coverage remaining
- Status (OK/Warning/Critical)
- Reorder/Production quantity needed
- Action buttons (Edit/Delete)

### Dashboard Level:
- Total inventory items
- Count by category
- Critical alerts count
- Overstock count
- Median coverage days

---

**Visual Design Goals Achieved:**
✅ Clear hierarchy (Materials → Products)
✅ Easy scanning (large numbers, clear labels)
✅ Status at a glance (colors, icons, badges)
✅ Action-oriented (prominent buttons)
✅ Professional appearance (gradients, shadows)
✅ Engaging interface (animations, hover effects)
