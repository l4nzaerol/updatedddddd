# Inventory Reports Data Guide

## 🎯 **Ensuring Accurate Data Display**

This guide helps you ensure the inventory reports display accurate data based on three months of Alkansya production and usage data.

## 📊 **What You Should See**

### **Dashboard Overview**
- **Total Items**: Number of inventory items in the system
- **Reorder Alerts**: Items that need immediate reordering
- **Low Stock**: Items approaching reorder point
- **Total Finished Goods**: Mass-produced products count
- **Alkansya Production Stats**: 3-month production data

### **Alkansya Analytics Tab**
- **Total Output**: 3-month production total (should be 8,000+ units)
- **Average Daily**: Daily production average (should be 25-35 units)
- **Last 7 Days**: Recent production (should be 200+ units)
- **Production Days**: Active production days
- **Material Usage Analysis**: BOM materials with usage data

## 🔧 **Troubleshooting Steps**

### **1. Check Database Data**
```bash
# Run from backend directory
php ensure_inventory_data.php
```

### **2. Verify Seeders**
```bash
# Ensure all seeders are run
php artisan db:seed --class=EnhancedInventorySeeder
php artisan db:seed --class=AlkansyaFactorySeeder
```

### **3. Test API Endpoints**
```bash
# Test individual endpoints
curl http://localhost:8000/api/inventory/dashboard
curl http://localhost:8000/api/inventory/alkansya-daily-output/statistics
curl http://localhost:8000/api/inventory/alkansya-daily-output/materials-analysis
```

### **4. Clear Cache**
```bash
# Clear application cache
php artisan cache:clear
php artisan config:clear
```

## 📈 **Expected Data Ranges**

### **Alkansya Production (3 Months)**
- **Total Output**: 7,500 - 10,000 units
- **Average Daily**: 25 - 35 units per day
- **Production Days**: 80 - 90 days
- **Last 7 Days**: 150 - 250 units

### **Material Usage**
- **Plywood 18mm**: 200-400 units used
- **Hardwood 2x4**: 150-300 units used
- **Acrylic Sheet**: 100-200 units used
- **Pinewood 1x4**: 300-500 units used

### **Inventory Levels**
- **Raw Materials**: 15-25 items
- **Finished Goods**: 3-5 items
- **Reorder Alerts**: 2-5 items
- **Critical Items**: 1-3 items

## 🚨 **Common Issues & Solutions**

### **Issue: Empty Data**
**Solution**: Run the data verification script
```bash
php ensure_inventory_data.php
```

### **Issue: No Alkansya Production Data**
**Solution**: Run the Alkansya seeder
```bash
php artisan db:seed --class=AlkansyaFactorySeeder
```

### **Issue: No Inventory Items**
**Solution**: Run the inventory seeder
```bash
php artisan db:seed --class=EnhancedInventorySeeder
```

### **Issue: API Endpoints Not Working**
**Solution**: Check backend server and routes
```bash
php artisan route:list | grep inventory
```

## 📊 **Data Sources**

### **Production Data**
- **Source**: `alkansya_daily_outputs` table
- **Seeder**: `AlkansyaFactorySeeder`
- **Period**: Last 3 months
- **Range**: 200-400 units per day

### **Material Usage**
- **Source**: `inventory_usages` table
- **Generated**: Automatically during production
- **Period**: Last 3 months
- **Based on**: BOM (Bill of Materials)

### **Inventory Items**
- **Source**: `inventory_items` table
- **Seeder**: `EnhancedInventorySeeder`
- **Categories**: Raw materials, Finished goods
- **Stock Levels**: Realistic for 3-month production

## 🎯 **Verification Checklist**

- [ ] Backend server is running on port 8000
- [ ] Database has Alkansya production data (3 months)
- [ ] Database has inventory items (15+ items)
- [ ] Database has material usage records
- [ ] API endpoints return valid JSON
- [ ] Frontend can fetch data successfully
- [ ] Reports display accurate statistics
- [ ] Charts show production trends
- [ ] Material usage analysis is populated

## 🔄 **Refresh Data**

If data seems outdated:
1. Click "Retry" button in the reports
2. Clear browser cache (Ctrl+F5)
3. Check backend logs for errors
4. Verify database connectivity

## 📞 **Support**

If issues persist:
1. Check browser console for errors
2. Check backend logs: `tail -f storage/logs/laravel.log`
3. Verify all seeders have run successfully
4. Ensure database has the required tables and data

---

**Note**: The inventory reports are designed to show real-time data based on actual Alkansya production and material usage over the past three months. If you see empty data, it usually means the seeders haven't been run or the database doesn't have the required production data.
