# Staff Role - Quick Setup Guide

## 🚀 Quick Setup (5 Steps)

### Step 1: Run Migration
```bash
cd capstone-back
php artisan migrate
```
This adds 'staff' role to users table.

### Step 2: Register Middleware
Edit `capstone-back/app/Http/Kernel.php`:

Find `$middlewareAliases` array and add:
```php
protected $middlewareAliases = [
    // ... existing middleware
    'staff' => \App\Http\Middleware\StaffMiddleware::class,
];
```

### Step 3: Create Test Staff User
Run in MySQL or phpMyAdmin:
```sql
INSERT INTO users (name, email, password, role, created_at, updated_at)
VALUES (
    'Staff User',
    'staff@test.com',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password: password
    'staff',
    NOW(),
    NOW()
);
```

### Step 4: Test API
```bash
# Login
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "staff@test.com", "password": "password"}'

# Get dashboard (use token from login)
curl -X GET http://localhost:8000/api/staff/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Step 5: Build Frontend
Create these components:
1. `StaffDashboard.jsx`
2. `StaffProductionList.jsx`
3. `ProductionStageUpdate.jsx`

## 📊 Staff Dashboard Data

### API Response Example:
```json
{
  "stats": {
    "active_productions": 5,
    "completed_today": 2,
    "pending_stages": 8,
    "in_progress_stages": 3
  },
  "recent_productions": [
    {
      "id": 1,
      "order_id": 10,
      "product_id": 2,
      "status": "in_progress",
      "progress_percentage": 45,
      "product": {
        "name": "Dining Table"
      },
      "order": {
        "id": 10,
        "customer_name": "John Doe"
      }
    }
  ],
  "today_tasks": [...]
}
```

## 🎯 Staff Workflow

### Production Update:
1. Staff logs in
2. Sees dashboard with active productions
3. Clicks on a production (e.g., Table Order #10)
4. Sees stages:
   ```
   ✓ Material Preparation (100%)
   → Cutting & Shaping (50%) ← Current
   ○ Assembly (0%)
   ○ Sanding (0%)
   ○ Finishing (0%)
   ○ Quality Check (0%)
   ```
5. Clicks "Update" on current stage
6. Changes status to "completed"
7. Adds note: "Cutting completed, ready for assembly"
8. Saves
9. Next stage auto-starts

### Update API Call:
```javascript
await axios.patch(`/api/staff/production-stage/${stageId}`, {
  status: 'completed',
  progress_percentage: 100,
  notes: 'Cutting completed, ready for assembly'
});
```

## 🔐 Role Permissions

| Feature | Customer | Staff | Admin |
|---------|----------|-------|-------|
| View Products | ✅ | ✅ | ✅ |
| Place Orders | ✅ | ❌ | ✅ |
| View Own Orders | ✅ | ❌ | ✅ |
| Staff Dashboard | ❌ | ✅ | ✅ |
| Update Production | ❌ | ✅ | ✅ |
| Admin Dashboard | ❌ | ❌ | ✅ |
| Manage Products | ❌ | ❌ | ✅ |
| Manage Inventory | ❌ | ❌ | ✅ |

## 📱 Frontend Routes

### Add to your router:
```javascript
// Staff routes
{
  path: '/staff/dashboard',
  element: <StaffDashboard />,
  protected: true,
  role: 'staff'
},
{
  path: '/staff/productions',
  element: <StaffProductionList />,
  protected: true,
  role: 'staff'
}
```

## ✅ Testing Checklist

- [ ] Migration ran successfully
- [ ] Middleware registered
- [ ] Test staff user created
- [ ] Can login as staff
- [ ] Dashboard API returns data
- [ ] Can update production stage
- [ ] Production progress updates
- [ ] Customer sees updated tracking

---

**Quick Start**: Run migration → Create staff user → Test API → Build frontend! 🚀
