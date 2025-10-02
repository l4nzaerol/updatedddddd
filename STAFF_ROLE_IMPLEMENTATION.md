# Staff Role Implementation Guide

## ✅ What Has Been Created

### 1. Database Migration
- **File**: `2025_10_02_000000_add_staff_role_to_users.php`
- **Purpose**: Adds 'staff' role to users table
- **Roles**: customer, employee (admin), staff

### 2. Staff Middleware
- **File**: `app/Http/Middleware/StaffMiddleware.php`
- **Purpose**: Protects staff routes
- **Access**: Both staff and employee (admin) can access

### 3. Staff Controller
- **File**: `app/Http/Controllers/StaffController.php`
- **Methods**:
  - `getDashboard()` - Staff dashboard stats
  - `updateProductionStage()` - Update production progress
  - `getMyTasks()` - Get assigned tasks

### 4. API Routes
- **Added to**: `routes/api.php`
- **Routes**:
  - `GET /api/staff/dashboard` - Dashboard data
  - `GET /api/staff/my-tasks` - Staff's tasks
  - `PATCH /api/staff/production-stage/{stageId}` - Update stage

## 🎯 Staff Capabilities

### What Staff Can Do:
✅ Access staff dashboard
✅ View production list
✅ Update production stages manually
✅ Mark stages as: pending, in_progress, completed, on_hold
✅ Add notes to production stages
✅ View assigned tasks

### What Staff Cannot Do:
❌ Access admin dashboard
❌ Manage products
❌ Manage orders
❌ Manage inventory
❌ View reports
❌ Manage users

## 📊 Staff Dashboard Features

### Statistics:
- Active productions count
- Completed today count
- Pending stages count
- In-progress stages count

### Recent Productions:
- Last 10 productions
- With order and product details

### Today's Tasks:
- Stages assigned to staff
- Pending and in-progress only

## 🔧 Next Steps (To Complete)

### Backend:
1. Run migration:
   ```bash
   php artisan migrate
   ```

2. Register middleware in `app/Http/Kernel.php`:
   ```php
   protected $middlewareAliases = [
       // ...
       'staff' => \App\Http\Middleware\StaffMiddleware::class,
   ];
   ```

3. Create staff user seeder (optional)

### Frontend:
1. Create Staff Dashboard component
2. Create Staff Login page
3. Create Production Update interface
4. Add route protection for staff

## 🎨 Frontend Components Needed

### 1. StaffDashboard.jsx
```jsx
- Display statistics
- Show recent productions
- Show today's tasks
- Quick actions
```

### 2. StaffProductionList.jsx
```jsx
- List all productions
- Filter by status
- Update stage button
```

### 3. ProductionStageUpdate.jsx
```jsx
- Select stage status
- Update progress percentage
- Add notes
- Save button
```

## 📱 Staff User Flow

1. **Login** with staff credentials
2. **Redirect** to staff dashboard
3. **View** active productions
4. **Click** on production to update
5. **Select** stage to update
6. **Change** status (pending → in_progress → completed)
7. **Add** notes if needed
8. **Save** changes
9. **Production** progress updates automatically

## 🔐 Authentication Flow

```
User Login
    ↓
Check role
    ↓
role === 'staff'?
    ↓
YES → Redirect to /staff/dashboard
NO  → Check if employee or customer
```

## 📝 API Usage Examples

### Get Staff Dashboard:
```javascript
const response = await axios.get('/api/staff/dashboard', {
  headers: { Authorization: `Bearer ${token}` }
});

// Response:
{
  stats: {
    active_productions: 5,
    completed_today: 2,
    pending_stages: 8,
    in_progress_stages: 3
  },
  recent_productions: [...],
  today_tasks: [...]
}
```

### Update Production Stage:
```javascript
const response = await axios.patch(`/api/staff/production-stage/${stageId}`, {
  status: 'in_progress',
  progress_percentage: 50,
  notes: 'Started cutting wood'
}, {
  headers: { Authorization: `Bearer ${token}` }
});
```

## 🎯 Production Update Process

### Manual Update Flow:
1. Staff opens production list
2. Selects a production (Table or Chair)
3. Sees all stages:
   - Material Preparation
   - Cutting & Shaping
   - Assembly
   - Sanding
   - Finishing
   - Quality Check
4. Clicks on current stage
5. Updates status to "in_progress"
6. Adds progress percentage
7. Saves
8. System auto-updates overall production progress
9. Customer sees updated tracking

## 📊 Database Schema

### Users Table:
```sql
- id
- name
- email
- password
- role (customer, employee, staff) ← NEW
- created_at
- updated_at
```

### Production Stage Logs:
```sql
- id
- production_id
- stage_name
- status (pending, in_progress, completed, on_hold)
- progress_percentage
- notes
- assigned_worker_id ← Links to staff user
- actual_start_time
- actual_end_time
- created_at
- updated_at
```

## 🚀 Testing

### Create Staff User:
```sql
INSERT INTO users (name, email, password, role, created_at, updated_at)
VALUES ('John Staff', 'staff@example.com', '$2y$10$...', 'staff', NOW(), NOW());
```

### Test API:
```bash
# Login as staff
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email": "staff@example.com", "password": "password"}'

# Get dashboard
curl -X GET http://localhost:8000/api/staff/dashboard \
  -H "Authorization: Bearer {token}"

# Update stage
curl -X PATCH http://localhost:8000/api/staff/production-stage/1 \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"status": "in_progress", "progress_percentage": 50}'
```

---

**Status**: Backend Complete ✅
**Next**: Frontend Implementation
**Priority**: Staff Dashboard UI
