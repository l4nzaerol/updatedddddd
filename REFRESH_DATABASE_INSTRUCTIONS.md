# Refresh Database to Show Pending Orders

## The Issue
The current database has all 7 orders marked as "accepted". To see pending orders in the dashboard, we need to refresh the database with the updated seeder.

## Updated Seeder
The `CustomerOrdersSeeder.php` has been updated to create:
- **3 Pending Orders** (acceptance_status = 'pending') - waiting for admin acceptance
- **3 In Progress Orders** (acceptance_status = 'accepted') - currently being produced  
- **1 Completed Order** (acceptance_status = 'accepted', status = 'completed')

## Steps to Refresh Database

### Option 1: Refresh Entire Database (Recommended)
```bash
cd capstone-back
php artisan migrate:fresh --seed
```

This will:
1. Drop all tables
2. Run all migrations
3. Run all seeders (including the updated CustomerOrdersSeeder)

### Option 2: Refresh Only Orders
If you want to keep other data and only refresh orders:

```bash
cd capstone-back

# Delete existing orders
php artisan tinker
>>> DB::table('order_tracking')->delete();
>>> DB::table('production_processes')->delete();
>>> DB::table('productions')->delete();
>>> DB::table('order_items')->delete();
>>> DB::table('orders')->delete();
>>> exit

# Run the seeder
php artisan db:seed --class=CustomerOrdersSeeder
```

### Option 3: Manual SQL (Quick Fix)
If you just want to test without reseeding:

```bash
cd capstone-back
php artisan tinker
>>> DB::table('orders')->limit(3)->update(['acceptance_status' => 'pending', 'accepted_by' => null, 'accepted_at' => null]);
>>> exit
```

This will mark the first 3 orders as pending.

## After Refreshing

1. **Clear Laravel cache** (if needed):
   ```bash
   php artisan cache:clear
   php artisan config:clear
   ```

2. **Restart the Laravel server**:
   ```bash
   php artisan serve
   ```

3. **Clear browser cache** or do a hard refresh (Ctrl+Shift+R)

4. **Check the dashboard** - You should now see:
   - Pending Orders: **3**
   - In Progress: **3** 
   - Completed Orders: **1**

## Verify the Data

Run this test script to verify:
```bash
php test_orders.php
```

You should see:
```
Total orders: 7

Orders by acceptance_status:
  - pending: 3
  - accepted: 4

Orders by status:
  - pending: 6
  - completed: 1
```

## Expected Dashboard Display

After refresh, the admin dashboard should show:
- **Total Productions**: 4 (only accepted orders create productions)
- **Completed Productions**: 1
- **In Progress**: 3
- **Pending Orders**: 3 ✅
- **Completed Orders**: 1
- **On Hold**: 0
