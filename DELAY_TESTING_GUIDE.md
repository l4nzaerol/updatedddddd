# Delay Testing Guide

## 🎯 Purpose

This guide explains how to use the new `DelayTestingOrdersSeeder` to properly test delay tracking functionality without interference from other orders.

## 📋 Problem Solved

**Before:** When testing delays on Order #3, Order #7 would unexpectedly appear because the seeder used fixed dates that became outdated.

**After:** The new seeder uses **relative dates** (days from now), ensuring:
- Only the orders you're testing appear
- Dates are always current and realistic
- No unexpected orders show up during testing

## 🚀 How to Use

### Step 1: Clear Old Data (Optional but Recommended)

```bash
# In your backend directory
php artisan migrate:fresh
```

### Step 2: Run the Delay Testing Seeder

```bash
php artisan db:seed --class=DelayTestingOrdersSeeder
```

### Step 3: What Gets Created

The seeder creates **exactly 2 orders** for testing:

#### **Order #3: Dining Table (Early Stage)**
- **Started:** 3 days ago
- **Completed Processes:** Material Preparation ✅
- **Current Process:** Cutting & Shaping (IN PROGRESS)
- **Progress:** 17%
- **Purpose:** Test delay on early-stage process

#### **Order #7: Dining Table x2 (Advanced Stage)**
- **Started:** 10 days ago
- **Completed Processes:** 
  - Material Preparation ✅
  - Cutting & Shaping ✅
  - Assembly ✅
  - Sanding & Surface Preparation ✅
- **Current Process:** Finishing (IN PROGRESS)
- **Progress:** 67%
- **Purpose:** Test delay on later-stage process

## 🧪 Testing Scenarios

### Scenario 1: Test Delay on Order #3

1. **Go to Production Page**
2. **Find Order #3** - Dining Table
3. **Current process:** Cutting & Shaping (should be IN PROGRESS)
4. **Expected completion:** 2.8 days after Material Preparation completed
5. **To test delay:**
   - Wait until current date > expected completion date
   - OR manually change system date forward
   - Click "Complete" button
   - Modal should appear asking for delay reason

### Scenario 2: Test Delay on Order #7

1. **Go to Production Page**
2. **Find Order #7** - Dining Table x2
3. **Current process:** Finishing (should be IN PROGRESS)
4. **This order is further along** - good for testing late-stage delays
5. **To test delay:**
   - Same process as Scenario 1
   - Test that delay tracking works consistently across all stages

## ✅ Expected Behavior

### When Process is NOT Delayed:
```
1. Click "Complete" button
2. Confirmation dialog appears
3. Process marked as completed
4. Next process starts immediately
5. No delay modal
```

### When Process IS Delayed:
```
1. Click "Complete" button
2. Delay modal appears automatically
3. Must enter delay reason
4. Click "Submit & Complete Process"
5. Modal closes immediately
6. Process marked as completed with delay reason
7. Shows in analytics:
   - "DELAYED" badge (red)
   - Delay reason displayed
8. Next process starts from current date
```

## 📊 Verification Checklist

After running the seeder, verify:

- [ ] Only 2 orders appear in Production Tracking
- [ ] Order #3 shows "Cutting & Shaping" as current
- [ ] Order #7 shows "Finishing" as current
- [ ] No other orders (1, 2, 4, 5, 6, 8, 9, 10) appear
- [ ] Dates are relative to current date
- [ ] Progress percentages are correct

## 🔄 Re-running the Seeder

If you need to reset and test again:

```bash
# Option 1: Fresh migration (clears everything)
php artisan migrate:fresh
php artisan db:seed --class=ProductsTableSeeder
php artisan db:seed --class=DelayTestingOrdersSeeder

# Option 2: Just delete orders and re-seed
php artisan db:seed --class=DelayTestingOrdersSeeder
```

## 🐛 Troubleshooting

### Issue: Order #7 still appears when testing Order #3

**Cause:** Old seeder data still in database

**Solution:**
```bash
php artisan migrate:fresh
php artisan db:seed --class=ProductsTableSeeder
php artisan db:seed --class=DelayTestingOrdersSeeder
```

### Issue: Dates seem wrong

**Cause:** Seeder uses relative dates from "now"

**Solution:** Re-run the seeder to get fresh dates:
```bash
php artisan db:seed --class=DelayTestingOrdersSeeder
```

### Issue: Modal doesn't appear for delayed process

**Cause:** Process might not actually be delayed yet

**Solution:** Check console logs:
```javascript
Process delay check: {
  process: "Cutting & Shaping",
  expectedDate: "2025-10-06T00:00:00Z",
  actualDate: "2025-10-08T15:25:20Z",
  wasLate: true,  // Should be true for modal to appear
  isDelayed: true
}
```

## 📝 Key Differences from Old Seeder

| Feature | Old Seeder | New Seeder |
|---------|-----------|------------|
| Number of Orders | 10 orders | 2 orders (focused testing) |
| Date Type | Fixed dates | Relative dates (days from now) |
| Purpose | General demo | Delay testing specific |
| Interference | Other orders appear | Only test orders appear |
| Maintenance | Dates become outdated | Always current |

## 🎓 Best Practices

1. **Use this seeder for delay testing only**
2. **Use AccurateOrdersSeeder for general demos**
3. **Re-run seeder after significant date changes**
4. **Check console logs to verify delay detection**
5. **Test both early and late stage delays**

## 💡 Tips

- **Order #3** is best for testing first-time delay scenarios
- **Order #7** is best for testing delays in advanced production
- Both orders use Dining Table (14-day production cycle)
- Dates are calculated to be realistic for testing
- No Alkansya orders (they don't need delay tracking)

---

Happy Testing! 🚀
