# How to Test the Price Calculator - Step by Step

## ✅ What I Just Added to Your Existing Modal

I've enhanced your **"Manage BOM"** modal (the one you showed in the screenshot) to include automatic price calculation!

## 🎯 How to Test It

### Step 1: Seed the Database (REQUIRED FIRST!)
```bash
cd capstone-back
php artisan db:seed --class=InventoryItemsSeeder
```
This adds unit costs to all materials.

### Step 2: Start Your Application
```bash
# Backend
cd capstone-back
php artisan serve

# Frontend (new terminal)
cd casptone-front
npm start
```

### Step 3: Test the Price Calculator

1. **Login as Admin**

2. **Go to Products Page**

3. **Click "Manage BOM"** on any existing product (or create a new product first)

4. **Add Materials** - Click "+ Add Material" or "Bulk Add Materials"
   - Select: Pinewood 1x4x8ft
   - Quantity: 0.5
   - Add more materials...

5. **Watch the Magic! ✨**
   - After adding materials, scroll down
   - You'll see a new section: **"💰 Price Calculator"**
   - Price calculates automatically after 0.5 seconds!

6. **See the Breakdown:**
```
┌─────────────────────────────────────┐
│ 💰 Suggested Pricing                │
├─────────────────────────────────────┤
│ Material Cost:        ₱209.10       │
│ Labor (30%):          ₱62.73        │
│ Production Cost:      ₱271.83       │
│ Profit (25%):         ₱67.96        │
│ Suggested Price:      ₱340          │
│                                     │
│ [✓ Update Product Price to ₱340]   │
└─────────────────────────────────────┘
```

7. **Use the Suggested Price:**
   - Click "✓ Update Product Price to ₱340"
   - Product price updates automatically!
   - Alert confirms: "Price updated to ₱340"

## 🎨 What You'll See

### Before Adding Materials:
- Your normal BOM modal
- No price calculator visible

### After Adding Materials:
- BOM table with materials
- **NEW:** Horizontal line separator
- **NEW:** "💰 Price Calculator" section
- **NEW:** Preset dropdown (Alkansya/Table/Chair/Custom)
- **NEW:** Labor % and Profit % inputs
- **NEW:** "Calculate Price" button
- **NEW:** Green card with price breakdown
- **NEW:** "Update Product Price" button

## 🧪 Test Scenarios

### Test 1: Alkansya
1. Open any product's BOM
2. Add these materials:
   - Pinewood 1x4x8ft: 0.5
   - Plywood 4.2mm: 0.25
   - Acrylic 1.5mm: 0.1
3. Select preset: **Alkansya**
4. Wait 0.5 seconds
5. **Expected:** Suggested Price = **₱340**

### Test 2: Table
1. Open product BOM
2. Add table materials (Mahogany, Plywood, etc.)
3. Select preset: **Table**
4. **Expected:** Suggested Price = **₱14,000+**

### Test 3: Custom Percentages
1. Add materials
2. Change Labor % to 50
3. Change Profit % to 40
4. Click "Calculate Price"
5. **Expected:** Higher suggested price

## ✅ Success Checklist

- [ ] Seeder ran successfully
- [ ] Can open BOM modal
- [ ] Can add materials
- [ ] Price calculator section appears
- [ ] Price calculates automatically
- [ ] Can select presets
- [ ] Can adjust labor % and profit %
- [ ] Can click "Update Product Price"
- [ ] Product price updates successfully
- [ ] Alert shows confirmation

## 🎥 Visual Flow

```
1. Click "Manage BOM" on product
         ↓
2. Modal opens with materials table
         ↓
3. Add materials (+ Add Material button)
         ↓
4. Scroll down - see "💰 Price Calculator"
         ↓
5. Price calculates automatically!
         ↓
6. Green card shows breakdown
         ↓
7. Click "Update Product Price"
         ↓
8. Product price updated! ✅
```

## 🔧 Troubleshooting

**Price shows ₱0?**
- Run the seeder: `php artisan db:seed --class=InventoryItemsSeeder`
- Check materials have unit_cost in database

**Calculator doesn't appear?**
- Make sure you added at least 1 material
- Check browser console (F12) for errors

**"Calculate Price" button does nothing?**
- Check backend is running on port 8000
- Verify API endpoint: `/api/price-calculator/calculate`
- Check browser console for errors

---

## 🎉 That's It!

Your existing modal now has the price calculator built-in. Just:
1. Run the seeder
2. Open any product's BOM
3. Add materials
4. Watch the price calculate automatically!

**The suggested price will appear right in the modal after you add materials!** 🚀
