# Staff Account Information

## ✅ Staff Account Added to Seeder

### Account Details:
- **Email**: `staff@gmail.com`
- **Password**: `staff`
- **Role**: `staff`
- **Name**: Staff User

## 🚀 How to Create the Account

### Step 1: Run Migration (if not done yet)
```bash
cd capstone-back
php artisan migrate
```

### Step 2: Run Seeder
```bash
php artisan db:seed --class=UsersTableSeeder
```

Or refresh all seeders:
```bash
php artisan migrate:fresh --seed
```

## 🔐 Login Credentials

### Admin Account:
- Email: `admin@gmail.com`
- Password: `admin`
- Role: `employee` (admin)

### Staff Account:
- Email: `staff@gmail.com`
- Password: `staff`
- Role: `staff`

### Customer Account:
- Email: `customer@gmail.com`
- Password: `customer`
- Role: `customer`

## 📊 Staff Access

### Staff Can Access:
✅ Staff Dashboard (`/staff/dashboard`)
✅ Production List (`/staff/productions`)
✅ Update Production Stages
✅ View Assigned Tasks
✅ Add Notes to Productions

### Staff Cannot Access:
❌ Admin Dashboard
❌ Product Management
❌ Order Management
❌ Inventory Management
❌ Reports
❌ User Management

## 🧪 Testing Staff Login

### Test with cURL:
```bash
curl -X POST http://localhost:8000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "staff@gmail.com",
    "password": "staff"
  }'
```

### Expected Response:
```json
{
  "token": "1|abc123...",
  "user": {
    "id": 3,
    "name": "Staff User",
    "email": "staff@gmail.com",
    "role": "staff"
  }
}
```

### Test Dashboard Access:
```bash
curl -X GET http://localhost:8000/api/staff/dashboard \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🎯 Staff Workflow Example

1. **Login** with `staff@gmail.com` / `staff`
2. **Get Token** from login response
3. **Access Dashboard** at `/api/staff/dashboard`
4. **View Productions** - See active Table/Chair orders
5. **Update Stage** - Change status from pending to in_progress
6. **Add Notes** - Document progress
7. **Complete Stage** - Mark as completed
8. **Next Stage** - Move to next production step

## 📱 Frontend Integration

### Login Component:
```javascript
const handleStaffLogin = async () => {
  const response = await axios.post('/api/login', {
    email: 'staff@gmail.com',
    password: 'staff'
  });
  
  if (response.data.user.role === 'staff') {
    // Redirect to staff dashboard
    navigate('/staff/dashboard');
  }
};
```

### Route Protection:
```javascript
// In your router
{
  path: '/staff/*',
  element: <StaffLayout />,
  protected: true,
  allowedRoles: ['staff', 'employee']
}
```

## 🔄 Update Production Example

### Staff updates a stage:
```javascript
const updateStage = async (stageId) => {
  await axios.patch(`/api/staff/production-stage/${stageId}`, {
    status: 'in_progress',
    progress_percentage: 50,
    notes: 'Started cutting mahogany wood for table legs'
  }, {
    headers: { 
      Authorization: `Bearer ${token}` 
    }
  });
};
```

### Result:
- Stage status updated
- Progress bar shows 50%
- Notes saved
- Customer sees update in tracking
- Overall production progress recalculated

## ✅ Verification Checklist

After running seeder, verify:
- [ ] Staff user exists in database
- [ ] Can login with staff@gmail.com
- [ ] Role is set to 'staff'
- [ ] Token is generated
- [ ] Can access staff dashboard
- [ ] Can view productions
- [ ] Can update stages

## 🗄️ Database Check

### Verify staff user:
```sql
SELECT id, name, email, role 
FROM users 
WHERE email = 'staff@gmail.com';
```

### Expected Result:
```
id | name       | email              | role
---|------------|--------------------|----- 
3  | Staff User | staff@gmail.com    | staff
```

---

**Quick Start**: 
1. Run `php artisan db:seed --class=UsersTableSeeder`
2. Login with `staff@gmail.com` / `staff`
3. Access staff dashboard! 🚀
