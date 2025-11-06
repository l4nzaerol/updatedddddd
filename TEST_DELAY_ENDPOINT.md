# Test Delay Tracking Endpoint

## Quick Test Steps

### 1. Check Laravel Logs

After refreshing the customer orders page, check:

```bash
tail -f storage/logs/laravel.log
```

Look for:
```
Processing tracking for product: {
  "product_name": "Dining Table",
  "is_tracked": true,
  "has_production": true,
  "production_id": 1,
  "has_processes": 6
}

Delayed process found: {
  "process_name": "Cutting & Shaping",
  "delay_reason": "Material shortage",
  ...
}

Total processes returned: {"count": 6}
```

### 2. Test API Directly

Open browser and go to:
```
http://localhost:8000/api/orders/3/tracking
```

You should see JSON like:
```json
{
  "trackings": [
    {
      "product_name": "Dining Table",
      "processes": [
        {
          "id": 1,
          "process_name": "Material Preparation",
          "status": "completed",
          "delay_reason": null
        },
        {
          "id": 2,
          "process_name": "Cutting & Shaping",
          "status": "completed",
          "delay_reason": "Material shortage delayed production",
          "completed_by_name": "Admin"
        }
      ]
    }
  ]
}
```

### 3. Check Database Directly

```sql
SELECT 
    pp.id,
    pp.process_name,
    pp.status,
    pp.delay_reason,
    pp.is_delayed,
    pp.completed_by_name,
    p.product_name,
    p.order_id
FROM production_processes pp
JOIN productions p ON pp.production_id = p.id
WHERE p.order_id = 3
ORDER BY pp.process_order;
```

### 4. If Processes is NULL

The issue is likely one of these:

**A. Production doesn't exist:**
```sql
SELECT * FROM productions WHERE order_id = 3;
```

**B. Processes don't exist:**
```sql
SELECT * FROM production_processes WHERE production_id = (
    SELECT id FROM productions WHERE order_id = 3 LIMIT 1
);
```

**C. Product name doesn't match:**
```sql
SELECT name FROM products WHERE id IN (
    SELECT product_id FROM order_items WHERE order_id = 3
);
```
Should contain "Table" or "Chair" (case-insensitive)

### 5. Manual Fix if Needed

If data is missing, run the seeder:
```bash
php artisan db:seed --class=DelayTestingOrdersSeeder
```

This creates Order #3 with:
- Dining Table product
- 6 production processes
- Some processes with delay reasons

### 6. Frontend Console Check

On customer orders page, press F12 and look for:
```javascript
=== TRACKING DATA RECEIVED ===
Tracking 0 - Dining Table: {
  has_processes: true,  // Should be true!
  processes_count: 6,
  processes: [...]
}
```

If `has_processes: false`, the backend isn't returning the data.

## Common Issues & Solutions

### Issue: `processes: null` in API response

**Cause 1:** Product name doesn't contain "table" or "chair"
**Solution:** Check product name in database

**Cause 2:** No production record exists
**Solution:** Run seeder or create production manually

**Cause 3:** Production has no processes
**Solution:** Run seeder or add processes manually

### Issue: Delay reason is empty in database

**Cause:** Process was completed without delay modal
**Solution:** 
1. Mark process as pending
2. Complete it again (modal should appear)
3. Enter delay reason

### Issue: Modal doesn't appear when completing late process

**Cause:** Date comparison failing
**Solution:** Check console logs in admin panel for delay detection

## Quick Verification Checklist

- [ ] Laravel logs show "Processing tracking for product"
- [ ] Laravel logs show process count > 0
- [ ] API endpoint returns processes array
- [ ] Database has delay_reason data
- [ ] Frontend console shows `has_processes: true`
- [ ] Frontend shows delay alert or success message
