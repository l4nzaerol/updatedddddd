@echo off
echo ========================================
echo   Seeding Database with Test Data
echo ========================================
echo.

cd capstone-back

echo Step 1: Migrating database...
php artisan migrate:fresh
echo.

echo Step 2: Seeding data...
php artisan db:seed
echo.

echo ========================================
echo   Database seeding complete!
echo ========================================
echo.
echo DATA CREATED:
echo.
echo 1. USERS
echo    - Admin user (admin@example.com / password)
echo    - Customer user (customer@example.com / password)
echo.
echo 2. PRODUCTS
echo    - Dining Table (with BOM: Wood Plank, Wood Glue, Nails, etc.)
echo    - Wooden Chair (with BOM: Wood Plank, Nails, Screws, etc.)
echo    - Alkansya (with BOM: Wood Plank, Wood Glue, Paint, etc.)
echo.
echo 3. INVENTORY ITEMS
echo    - ~15-20 materials with stock levels
echo.
echo 4. ORDERS ^& PRODUCTIONS
echo    - 10 customer orders (2 pending, 8 accepted)
echo    - ~10 productions (Tables, Chairs, Alkansya)
echo.
echo 5. INVENTORY USAGE (Material Consumption) - NEW COMPREHENSIVE SEEDER
echo    - From customer orders: ~50-100 records (Tables, Chairs, Alkansya)
echo    - From daily Alkansya production: ~225-375 records (3 months)
echo    - Total: ~275-475 inventory usage records
echo    - Includes automatic verification and detailed statistics
echo.
echo 6. PRODUCTION ANALYTICS
echo    - 3 months of Alkansya daily output (~75 days)
echo    - 30-50 Alkansya per day (Mon-Sat, no Sundays)
echo    - Total: ~3,000 Alkansya produced
echo.
echo ========================================
echo   Material Usage Reports Ready!
echo ========================================
echo.
echo You can now view:
echo - Inventory ^> Material Usage tab
echo - Production ^> Resource Utilization tab
echo.
echo Both tabs will show material consumption data
echo for Tables, Chairs, and Alkansya!
echo.
pause
