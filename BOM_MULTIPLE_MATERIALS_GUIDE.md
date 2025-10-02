# How to Add Multiple Materials to Product BOM

## ✅ Current Implementation

The product creation modal **already supports adding multiple materials**! Here's how it works:

## Step-by-Step Guide

### 1. Open Add Product Modal
- Click the "+ Add Product" button on the Products page

### 2. Fill Product Details
- Enter Product Name, Price, Stock, Description, Image URL

### 3. Add Multiple Materials
- Scroll down to the **"📦 Materials Needed (BOM)"** section
- Click the **"+ Add Material"** button (green button in top-right)
- A new material card appears
- Click **"+ Add Material"** again to add another material
- Repeat as many times as needed - **unlimited materials can be added**

### 4. Configure Each Material
For each material card:
- **Select Material**: Choose from dropdown (shows name, SKU, unit)
- **Enter Quantity**: How many units needed per product
- **Remove**: Click trash icon (🗑️) to delete if not needed

### 5. Save Product
- Click "Save Product" button
- All valid materials (with both material and quantity filled) are saved
- Incomplete entries are automatically ignored

## Example: Creating a Chair Product

**Product Details:**
- Name: Oak Dining Chair
- Price: 2500
- Stock: 50

**Materials (BOM):**
1. Click "+ Add Material"
   - Material: Oak Wood (WD-001) - Board Feet
   - Quantity: 8

2. Click "+ Add Material" again
   - Material: Wood Screws (HW-005) - Pieces
   - Quantity: 20

3. Click "+ Add Material" again
   - Material: Wood Glue (CH-002) - Ounces
   - Quantity: 4

4. Click "+ Add Material" again
   - Material: Varnish (FN-001) - Ounces
   - Quantity: 6

**Result:** Product saved with 4 different materials!

## Key Features

✅ **Unlimited Materials** - Add as many as needed
✅ **Easy to Add** - Just click "+ Add Material" button
✅ **Easy to Remove** - Click trash icon on any material
✅ **Flexible** - Can leave entries incomplete (they'll be ignored)
✅ **Clear Display** - Each material in its own card
✅ **All in One Form** - No need to navigate multiple screens

## Visual Layout

```
┌─────────────────────────────────────────────────────┐
│  Add New Product                               [X]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Product Name *                                     │
│  [Oak Dining Chair                            ]     │
│                                                     │
│  Price *              Stock *                       │
│  [2500          ]     [50                     ]     │
│                                                     │
│  Description                                        │
│  [Handcrafted oak chair...                    ]     │
│                                                     │
│  Image URL                                          │
│  [https://...                                 ]     │
│                                                     │
│  ─────────────────────────────────────────────      │
│                                                     │
│  📦 Materials Needed (BOM)    [+ Add Material]      │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │ Material                    Qty    [🗑️]   │     │
│  │ [Oak Wood (WD-001) - BF ▼] [8  ]          │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │ Material                    Qty    [🗑️]   │     │
│  │ [Wood Screws (HW-005) ▼]   [20 ]          │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │ Material                    Qty    [🗑️]   │     │
│  │ [Wood Glue (CH-002) ▼]     [4  ]          │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
│  ┌───────────────────────────────────────────┐     │
│  │ Material                    Qty    [🗑️]   │     │
│  │ [Varnish (FN-001) ▼]       [6  ]          │     │
│  └───────────────────────────────────────────┘     │
│                                                     │
├─────────────────────────────────────────────────────┤
│                      [Cancel]  [Save Product]       │
└─────────────────────────────────────────────────────┘
```

## Tips

💡 **Tip 1**: You can add materials in any order
💡 **Tip 2**: If you make a mistake, just click the trash icon to remove
💡 **Tip 3**: You can save without any materials (BOM is optional)
💡 **Tip 4**: Incomplete material entries won't cause errors - they're just ignored
💡 **Tip 5**: The success message will tell you how many materials were saved

## Technical Details

### How It Works
- Each click of "+ Add Material" calls `handleAddBomItem()`
- This adds a new object to the `bomItems` array: `{ inventory_item_id: "", qty_per_unit: "" }`
- React renders a new card for each item in the array
- When you save, only complete entries (both fields filled) are sent to the API

### Code Reference
```javascript
// Adding a material
const handleAddBomItem = () => {
  setBomItems([...bomItems, { inventory_item_id: "", qty_per_unit: "" }]);
};

// The array can grow indefinitely - no limit!
```

## Troubleshooting

**Q: I don't see the "+ Add Material" button**
- Make sure you've opened the Add Product modal
- The button is in the top-right of the "Materials Needed (BOM)" section

**Q: Can I add the same material twice?**
- Yes, but it's not recommended
- Better to combine quantities in one entry

**Q: What if I forget to fill in a material?**
- No problem! Incomplete entries are automatically ignored when saving
- Only materials with both dropdown and quantity filled are saved

**Q: Is there a limit to how many materials I can add?**
- No limit! Add as many as your product needs
