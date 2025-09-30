# Manual Stage Update Testing Guide

## Changes Made

### Backend (ProductionController.php)
1. **Fixed validation** - Changed from string concatenation to `Rule::in()` for proper validation of stage names with special characters (commas, ampersands)
2. **Added error handling** - Wrapped stage update logic in try-catch with detailed logging
3. **Improved sync methods** - Added null checks and error handling in `syncProcessesToStage()` and `syncStageLogsToStage()`
4. **Added stage mappings** - Included "Ready for Delivery" and "Completed" in process order map
5. **Better error responses** - Returns detailed error messages to frontend

### Frontend (ProductionPage.jsx)
1. **Enhanced error display** - Shows specific error messages from backend
2. **Added console logging** - Logs update attempts and responses for debugging
3. **Validation error display** - Shows validation errors if present

## How to Test

### 1. Check Backend Logs
```bash
# In capstone-back directory
tail -f storage/logs/laravel.log
```

### 2. Test Manual Stage Update

#### Via Browser Console:
```javascript
// Open browser console on Production Page
// Try updating a production stage
const productionId = 1; // Replace with actual ID
const newStage = "Cutting & Shaping";

fetch('/api/productions/' + productionId, {
  method: 'PATCH',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': 'Bearer ' + localStorage.getItem('token')
  },
  body: JSON.stringify({ stage: newStage })
})
.then(r => r.json())
.then(data => console.log('Success:', data))
.catch(err => console.error('Error:', err));
```

#### Via UI:
1. Navigate to Admin → Production Tracking System
2. Find a production with status "In Progress"
3. Change the stage dropdown to any value:
   - Material Preparation
   - Cutting & Shaping
   - Assembly
   - Sanding & Surface Preparation
   - Finishing
   - Quality Check & Packaging
4. Check:
   - No error message appears
   - Stage updates in the UI
   - Analytics refresh automatically
   - Console shows "Stage update successful"

### 3. Test Different Stage Names

Test all these stage names to ensure validation works:
- ✅ Material Preparation
- ✅ Cutting & Shaping (has ampersand)
- ✅ Assembly
- ✅ Sanding & Surface Preparation (has ampersand)
- ✅ Finishing
- ✅ Quality Check & Packaging (has ampersand)
- ✅ Ready for Delivery
- ✅ Completed

### 4. Verify Process Sync

For productions with processes:
1. Update stage to "Assembly"
2. Check that:
   - Material Preparation process → completed
   - Cutting & Shaping process → completed
   - Assembly process → in_progress
   - Later processes → pending

### 5. Check Analytics Update

After manual stage update:
1. Analytics dashboard should reflect new stage distribution
2. Stage workload should update
3. Charts should show updated data

## Expected Behavior

### ✅ Success Case
- Stage updates without error
- Both `stage` and `current_stage` fields are updated
- Related processes/logs are synced
- Analytics refresh automatically
- No error toast appears

### ❌ Error Cases to Handle
- Invalid stage name → Validation error with specific message
- Non-existent production ID → 404 error
- Database error → 500 error with message

## Troubleshooting

### If you still get errors:

1. **Check Laravel logs**:
   ```bash
   tail -f storage/logs/laravel.log
   ```

2. **Check browser console** for detailed error messages

3. **Verify database**:
   ```sql
   -- Check if production exists
   SELECT id, stage, current_stage, status FROM productions WHERE id = 1;
   
   -- Check if processes exist
   SELECT * FROM production_processes WHERE production_id = 1;
   ```

4. **Test with curl**:
   ```bash
   curl -X PATCH http://localhost:8000/api/productions/1 \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{"stage":"Cutting & Shaping"}'
   ```

## Common Issues Fixed

1. **Validation Error**: "The selected stage is invalid"
   - **Cause**: String concatenation didn't properly handle commas in stage names
   - **Fix**: Use `Rule::in()` instead

2. **Null Reference Error**: "Call to a member function on null"
   - **Cause**: Missing null checks in sync methods
   - **Fix**: Added proper null checks and try-catch blocks

3. **Silent Failures**: Updates don't work but no error shown
   - **Cause**: Exceptions caught but not logged
   - **Fix**: Added comprehensive logging and error responses
