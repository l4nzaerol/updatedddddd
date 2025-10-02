# Multi-Select BOM Feature Guide

## 🎉 New Feature: Select Multiple Materials at Once!

Instead of adding materials one by one, you can now **select multiple materials with checkboxes** and add them all at once!

## How It Works

### Step 1: Click "+ Add Materials"
When you click the "+ Add Materials" button, a **material picker** appears with checkboxes.

### Step 2: Select Multiple Materials
Check as many materials as you need:
- ☑️ Oak Wood (WD-001)
- ☑️ Wood Screws (HW-005)
- ☑️ Wood Glue (CH-002)
- ☑️ Varnish (FN-001)

The picker shows: **"4 selected"** in real-time!

### Step 3: Click "Add 4 Materials"
All selected materials are added to your BOM instantly, each with a default quantity of 1.

### Step 4: Adjust Quantities
Now you can edit the quantity for each material individually.

## Visual Example

```
┌─────────────────────────────────────────────────────┐
│  Add New Product                               [X]  │
├─────────────────────────────────────────────────────┤
│  Product Name: [Oak Dining Chair              ]    │
│  Price: [2500]    Stock: [50]                      │
│                                                     │
│  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    │
│                                                     │
│  📦 Materials Needed (BOM)    [+ Add Materials]    │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Select Materials              4 selected    │   │
│  ├─────────────────────────────────────────────┤   │
│  │ ☑️ Oak Wood (WD-001) - Board Feet          │   │
│  │ ☐ Pine Wood (WD-002) - Board Feet          │   │
│  │ ☑️ Wood Screws (HW-005) - Pieces           │   │
│  │ ☑️ Wood Glue (CH-002) - Ounces             │   │
│  │ ☐ Nails (HW-003) - Pieces                  │   │
│  │ ☑️ Varnish (FN-001) - Ounces               │   │
│  │ ☐ Sandpaper (SU-001) - Sheets              │   │
│  ├─────────────────────────────────────────────┤   │
│  │                  [Cancel] [Add 4 Materials] │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
│  After clicking "Add 4 Materials":                 │
│                                                     │
│  ┌─────────────────────────────────────────────┐   │
│  │ Material          │ Quantity per Unit │ Act │   │
│  ├─────────────────────────────────────────────┤   │
│  │ Oak Wood          │ [1  ]             │ 🗑️ │   │
│  │ WD-001 - BF       │                   │     │   │
│  ├─────────────────────────────────────────────┤   │
│  │ Wood Screws       │ [1  ]             │ 🗑️ │   │
│  │ HW-005 - Pieces   │                   │     │   │
│  ├─────────────────────────────────────────────┤   │
│  │ Wood Glue         │ [1  ]             │ 🗑️ │   │
│  │ CH-002 - Ounces   │                   │     │   │
│  ├─────────────────────────────────────────────┤   │
│  │ Varnish           │ [1  ]             │ 🗑️ │   │
│  │ FN-001 - Ounces   │                   │     │   │
│  └─────────────────────────────────────────────┘   │
│                                                     │
├─────────────────────────────────────────────────────┤
│                      [Cancel]  [Save Product]       │
└─────────────────────────────────────────────────────┘
```

## Key Benefits

✅ **Faster**: Select 10 materials in seconds instead of clicking 10 times
✅ **Easier**: Visual checkboxes are more intuitive
✅ **Flexible**: Can still add more materials later by clicking "+ Add Materials" again
✅ **Smart**: Shows real-time count of selected materials
✅ **Safe**: Cancel button if you change your mind

## Detailed Workflow

### Example: Creating a Chair with 5 Materials

1. **Open Product Modal**
   - Click "+ Add Product"

2. **Fill Product Info**
   - Name: Oak Dining Chair
   - Price: 2500
   - Stock: 50
   - Description: Handcrafted solid oak chair

3. **Click "+ Add Materials"**
   - Material picker appears

4. **Select Materials** (check the boxes):
   - ☑️ Oak Wood (WD-001) - Board Feet
   - ☑️ Wood Screws (HW-005) - Pieces  
   - ☑️ Wood Glue (CH-002) - Ounces
   - ☑️ Varnish (FN-001) - Ounces
   - ☑️ Sandpaper (SU-001) - Sheets

5. **Confirm Selection**
   - Click "Add 5 Materials"
   - Picker closes
   - 5 material cards appear

6. **Edit Quantities**
   - Oak Wood: Change from 1 to **8**
   - Wood Screws: Change from 1 to **20**
   - Wood Glue: Change from 1 to **4**
   - Varnish: Change from 1 to **6**
   - Sandpaper: Change from 1 to **3**

7. **Save**
   - Click "Save Product"
   - Success! "Product added successfully with 5 material(s)"

## Advanced Features

### Adding More Materials Later
You can click "+ Add Materials" multiple times:
1. First time: Add Oak Wood, Screws, Glue
2. Second time: Add Varnish, Sandpaper
3. All materials appear in the list

### Removing Materials
- Click the trash icon (🗑️) on any material card
- Material is removed instantly
- No confirmation needed

### Material Display
- Material name is **read-only** (displayed as text, not dropdown)
- This prevents accidental changes
- If you need to change the material, remove it and add the correct one

## Comparison: Old vs New

### Old Way (One at a Time)
1. Click "+ Add Material"
2. Select material from dropdown
3. Enter quantity
4. Click "+ Add Material" again
5. Select another material
6. Enter quantity
7. Repeat 10 times... 😫

### New Way (Multi-Select)
1. Click "+ Add Materials"
2. Check 10 materials ✓✓✓✓✓✓✓✓✓✓
3. Click "Add 10 Materials"
4. Edit quantities
5. Done! 🎉

## Tips & Tricks

💡 **Tip 1**: You can scroll through the material picker if you have many inventory items

💡 **Tip 2**: The picker shows materials in two columns for easier scanning

💡 **Tip 3**: All materials start with quantity = 1, so you only need to change the ones that need more

💡 **Tip 4**: If you accidentally select a material, just uncheck it before clicking "Add"

💡 **Tip 5**: The "Add X Materials" button is disabled until you select at least one material

## Technical Details

### Default Quantity
- All materials are added with `qty_per_unit = 1`
- This is a sensible default that you can easily change
- Prevents errors from empty quantity fields

### Material Selection State
- Checkboxes maintain their state while picker is open
- Clicking "Cancel" clears all selections
- Clicking "Add" clears selections and closes picker

### Duplicate Prevention
- You can add the same material multiple times
- Each appears as a separate card
- Not recommended, but won't cause errors

## Troubleshooting

**Q: The picker is empty**
- Make sure you have inventory items in your database
- Check that inventory items are properly seeded

**Q: I can't click "Add X Materials"**
- You need to select at least one material first
- Check at least one checkbox

**Q: How do I change a material after adding it?**
- Remove the material (trash icon)
- Click "+ Add Materials" again
- Select the correct material

**Q: Can I select all materials?**
- Yes! Just check all the boxes
- The system will add all of them

**Q: What if I close the picker by accident?**
- Just click "+ Add Materials" again
- Your previous selections are cleared (fresh start)
