# Fix Migration Error - Quick Guide

## ⚠️ The Problem
The migration failed because there's already a 'staff' user in the database, but the enum doesn't include 'staff' yet.

## ✅ Solution (Choose One)

### Option 1: Fresh Migration (Recommended for Development)
This will reset everything:

```bash
cd capstone-back
php artisan migrate:fresh --seed
```

**Warning**: This deletes all data and recreates tables.

### Option 2: Manual Fix (Keep Existing Data)

**Step 1**: Delete the staff user temporarily
```sql
DELETE FROM users WHERE role = 'staff';
```

**Step 2**: Run migration
```bash
php artisan migrate
```

**Step 3**: Run seeder to recreate users
```bash
php artisan db:seed --class=UsersTableSeeder
```

### Option 3: Direct Database Fix

**Step 1**: Run this SQL directly in phpMyAdmin or MySQL:
```sql
ALTER TABLE users MODIFY COLUMN role ENUM('customer', 'employee', 'staff') NOT NULL DEFAULT 'customer';
```

**Step 2**: Mark migration as done
```bash
php artisan migrate --pretend
```

## 🚀 Quick Fix Commands

### For Clean Start:
```bash
# Delete all tables and recreate
php artisan migrate:fresh

# Run all seeders
php artisan db:seed
```

### For Keeping Data:
```bash
# 1. Remove staff users
mysql -u root -p your_database -e "DELETE FROM users WHERE email = 'staff@gmail.com';"

# 2. Run migration
php artisan migrate

# 3. Recreate users
php artisan db:seed --class=UsersTableSeeder
```

## ✅ Verify Success

After fixing, verify:

```bash
# Check migration status
php artisan migrate:status

# Should show:
# ✓ 2025_10_02_000000_add_staff_role_to_users
```

Check users table:
```sql
SELECT id, name, email, role FROM users;
```

Should show:
```
1 | Admin        | admin@gmail.com    | employee
2 | Customer     | customer@gmail.com | customer
3 | Staff User   | staff@gmail.com    | staff
```

## 🎯 After Fix

Test the staff account:
```bash
# Login
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "staff@gmail.com", "password": "staff"}'

# Should return token and user with role: "staff"
```

---

**Recommended**: Use `php artisan migrate:fresh --seed` for quickest fix! 🚀
