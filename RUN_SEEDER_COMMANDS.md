# Run Seeder Commands - Quick Reference

## 🚀 One-Line Command (Recommended)

```bash
cd capstone-back && php artisan migrate:fresh && php artisan db:seed --class=ProductsTableSeeder && php artisan db:seed --class=AccurateOrdersSeeder
```

## 📋 Step-by-Step Commands

### Step 1: Navigate to Backend
```bash
cd capstone-back
```

### Step 2: Fresh Database (Optional - clears all data)
```bash
php artisan migrate:fresh
```

### Step 3: Seed Products
```bash
php artisan db:seed --class=ProductsTableSeeder
```

### Step 4: Seed Orders with Accurate Tracking
```bash
php artisan db:seed --class=AccurateOrdersSeeder
```

## 🔄 Alternative: Keep Existing Data

If you want to add orders WITHOUT clearing existing data:

```bash
cd capstone-back
php artisan db:seed --class=AccurateOrdersSeeder
```

**Note:** Make sure products exist first!

## ✅ Verify Success

### Check in Terminal
You should see output like:
```
=== Creating Accurate Orders with Synchronized Tracking ===

--- Creating Sample Orders ---

1. Creating PENDING order (not accepted)
   ✓ Order #1 | Dining Table x1 | Status: PENDING ACCEPTANCE
   
2. Creating PENDING order (placed 2 days ago)
   ✓ Order #2 | Wooden Chair x2 | Status: PENDING ACCEPTANCE
   
...

✓ All orders created successfully with accurate tracking!
```

### Check in Browser

**Customer View:**
1. Login: `customer@gmail.com` / `password`
2. Go to "My Orders"
3. Expand orders to see progress

**Admin View:**
1. Login: `admin@gmail.com` / `password`
2. Go to "Production Tracking"
3. Verify same data appears

## 🎯 Expected Results

After running the seeder:
- ✅ 10 orders created
- ✅ 2 pending orders (not accepted)
- ✅ 8 orders in production (0% to 100%)
- ✅ Customer and production pages show identical data
- ✅ No database errors

## 🔧 Troubleshooting Commands

### Check if Products Exist
```bash
php artisan tinker
>>> \App\Models\Product::count()
>>> \App\Models\Product::pluck('name')
>>> exit
```

### Check if Orders Were Created
```bash
php artisan tinker
>>> \App\Models\Order::count()
>>> \App\Models\Production::count()
>>> \App\Models\OrderTracking::count()
>>> exit
```

### Clear Only Orders (Keep Products)
```bash
php artisan tinker
>>> \App\Models\Order::truncate()
>>> \App\Models\Production::truncate()
>>> \App\Models\OrderTracking::truncate()
>>> exit
```

Then re-run:
```bash
php artisan db:seed --class=AccurateOrdersSeeder
```

## 📊 Database Check Queries

### Check Order Status Distribution
```bash
php artisan tinker
>>> \App\Models\Order::groupBy('status')->selectRaw('status, count(*) as count')->get()
```

### Check Production Progress
```bash
php artisan tinker
>>> \App\Models\Production::select('id', 'product_name', 'current_stage', 'overall_progress')->get()
```

### Verify Sync Between Production and Tracking
```bash
php artisan tinker
>>> $order = \App\Models\Order::with(['production', 'tracking'])->find(3)
>>> echo "Production Stage: " . $order->production->current_stage
>>> echo "Tracking Stage: " . $order->tracking->first()->current_stage
```

## 🎓 Login Credentials

### Customer Account
- **Email:** customer@gmail.com
- **Password:** password
- **Access:** My Orders page

### Admin Account
- **Email:** admin@gmail.com
- **Password:** password
- **Access:** Production Tracking dashboard

## 📝 Common Issues & Fixes

### Issue: "Products not found"
```bash
# Solution: Seed products first
php artisan db:seed --class=ProductsTableSeeder
```

### Issue: "Data truncated for column 'current_stage'"
**Status:** ✅ FIXED in AccurateOrdersSeeder
- Old seeder had this issue
- New seeder uses correct enum values

### Issue: "Class 'AccurateOrdersSeeder' not found"
```bash
# Solution: Run composer autoload
composer dump-autoload
```

### Issue: Data doesn't match between pages
```bash
# Solution: Clear browser cache and refresh
# Or re-run the seeder
php artisan migrate:fresh
php artisan db:seed --class=ProductsTableSeeder
php artisan db:seed --class=AccurateOrdersSeeder
```

## 🔄 Re-run Seeder Anytime

To reset and get fresh data:

```bash
# Full reset
php artisan migrate:fresh && php artisan db:seed --class=ProductsTableSeeder && php artisan db:seed --class=AccurateOrdersSeeder

# Or just clear orders
php artisan tinker
>>> \App\Models\Order::truncate()
>>> \App\Models\Production::truncate()
>>> \App\Models\OrderTracking::truncate()
>>> exit

php artisan db:seed --class=AccurateOrdersSeeder
```

## 📚 Documentation Files

- **Full Guide:** `ACCURATE_ORDERS_SEEDER_GUIDE.md`
- **Quick Start:** `QUICK_START_ACCURATE_SEEDER.md`
- **Fix Summary:** `SEEDER_FIX_SUMMARY.md`
- **This File:** `RUN_SEEDER_COMMANDS.md`

## 💡 Pro Tips

1. **Always seed products first** - Orders need products to exist
2. **Use migrate:fresh for clean slate** - Prevents data conflicts
3. **Check both views** - Verify customer and admin pages match
4. **Watch terminal output** - Confirms each order creation
5. **Clear browser cache** - If data looks stale

---

**Ready to run?** Copy and paste the one-line command at the top! 🚀
