# Test Productions API

## Check if API is working

### Test 1: Check if productions exist in database
```bash
cd capstone-back
php artisan tinker --execute="echo \App\Models\Production::count();"
```
Expected: 5

### Test 2: Check Laravel logs
```bash
cd capstone-back
Get-Content storage/logs/laravel.log -Tail 50
```
Look for:
- "Productions index called"
- "Productions count: 5"
- Any error messages

### Test 3: Test API directly (if you have curl or Postman)
```bash
# Get your token first from localStorage in browser
# Then test:
curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:8000/api/productions
```

## Common Issues

### Issue 1: Token expired or missing
**Symptom**: 401 Unauthorized
**Solution**: 
1. Logout and login again
2. Check localStorage has 'token'

### Issue 2: CORS error
**Symptom**: CORS policy error in console
**Solution**: Check cors.php configuration

### Issue 3: Server not running
**Symptom**: Connection refused
**Solution**: 
```bash
cd capstone-back
php artisan serve
```

### Issue 4: Database connection
**Symptom**: Database error in logs
**Solution**: Check .env file

## Quick Fix

1. **Clear browser cache**: Ctrl + Shift + Delete
2. **Logout and login again**
3. **Check browser console** (F12) for errors
4. **Check Laravel logs** for backend errors

## Expected Response

```json
[
  {
    "id": 1,
    "product_name": "Dining Table",
    "status": "In Progress",
    "current_stage": "Material Preparation",
    "quantity": 1,
    "overall_progress": 10,
    "processes": [...]
  },
  ...
]
```
