# ✅ FINAL TEST INSTRUCTIONS - Price Calculator

## 🎯 What I Just Fixed

I added the **Price Calculator** directly to your **"Add New Product"** modal (the one in your screenshot).

## 🚀 How to Test (3 Simple Steps)

### Step 1: Run the Seeder (MUST DO FIRST!)
```bash
cd capstone-back
php artisan db:seed --class=InventoryItemsSeeder
```
✅ This adds unit costs to all materials

### Step 2: Refresh Your Browser
- Press `Ctrl + Shift + R` (hard refresh)
- Or close and reopen the browser

### Step 3: Test the Calculator

1. **Click "+ Add Product"** (same button as your screenshot)

2. **Fill in basic info:**
   - Product Name: "Test Alkansya"
   - Price: 0 (leave it for now)
   - Stock: 10

3. **Click "+ Add Materials"** (green button)

4. **Select 8 materials** (check the boxes):
   - ✅ Pinewood 1x4x8ft
   - ✅ Plywood 4.2mm 4x8ft
   - ✅ Acrylic 1.5mm 4x8ft
   - ✅ Pin Nail F30
   - ✅ Black Screw 1 1/2
   - ✅ Stikwell 250
   - ✅ Grinder pad 4inch
   - ✅ Sticker 24 inch White

5. **Click "Add 8 Materials"**

6. **Set quantities** in the table:
   - Pinewood: 0.5
   - Plywood: 0.25
   - Acrylic: 0.1
   - Pin Nail: 0.02
   - Black Screw: 0.008
   - Stikwell: 0.1
   - Grinder pad: 0.5
   - Sticker: 0.02

7. **Scroll down** - You'll see a NEW section appear:

```
═══════════════════════════════════════
💰 Price Calculator
═══════════════════════════════════════

Preset: [Alkansya ▼]  Labor %: [25]  Profit %: [30]  [Calculate]

┌─────────────────────────────────────┐
│ 💰 Suggested Pricing                │
├─────────────────────────────────────┤
│ Material Cost:        ₱209.10       │
│ Labor (25%):          ₱52.28        │
│ Production Cost:      ₱261.38       │
│ Profit (30%):         ₱78.41        │
│ Suggested Price:      ₱340          │
│                                     │
│ [✓ Use This Price (₱340)]          │
│                                     │
│ Break-even: ₱261.38 • Profit: 30%  │
└─────────────────────────────────────┘
```

8. **Click "✓ Use This Price (₱340)"**
   - The "Price" field at the top will auto-fill with **340**!

9. **Click "Save Product"**
   - Product created with calculated price! ✅

## 🎬 What Happens Automatically

- ✅ **After 0.5 seconds** of adding/changing materials → Price calculates
- ✅ **Green card appears** with full breakdown
- ✅ **Click button** → Price field fills automatically
- ✅ **No manual calculation needed!**

## 📊 Expected Results

### For Alkansya (8 materials):
```
Material Cost:    ₱209.10
Labor (25%):      ₱52.28
Production Cost:  ₱261.38
Suggested Price:  ₱340
```

### For Table (12 materials):
```
Material Cost:    ₱7,480
Labor (40%):      ₱2,992
Production Cost:  ₱10,472
Suggested Price:  ₱14,140
```

## 🔍 Troubleshooting

### "Price shows ₱0.00"
**Fix:** Run the seeder
```bash
php artisan db:seed --class=InventoryItemsSeeder
```

### "Calculator doesn't appear"
**Fix:** 
- Make sure you added materials
- Scroll down in the modal
- Check browser console (F12)

### "Materials have no cost"
**Fix:**
- Verify seeder ran successfully
- Check database: `SELECT sku, unit_cost FROM inventory_items;`

### "API Error"
**Fix:**
- Backend must be running: `php artisan serve`
- Check: `http://localhost:8000/api/inventory`

## ✅ Success Checklist

When it works, you should see:
- [x] Materials table with 8 items
- [x] "💰 Price Calculator" section below materials
- [x] Preset dropdown (Alkansya/Table/Chair)
- [x] Labor % and Profit % inputs
- [x] Green card with price breakdown
- [x] "Use This Price" button
- [x] Clicking button fills the Price field
- [x] Can save product with calculated price

---

## 🎉 That's It!

**The price calculator is now in your "Add New Product" modal!**

Just:
1. Run seeder
2. Refresh browser
3. Add materials
4. Watch price calculate automatically! ✨
