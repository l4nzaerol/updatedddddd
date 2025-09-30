# Fixed: Stage Column Issue

## Problem
Manual stage updates were failing with SQL error:
```
SQLSTATE[42S22]: Column not found: 1054 Unknown column 'stage' in 'field list'
```

## Root Cause
The database migration `2025_12_26_000000_add_enhanced_tracking_to_productions_table.php` **dropped** the old `stage` column and replaced it with `current_stage`, but the controller code was still trying to update both columns.

## Solution
Updated all references from `stage` to `current_stage` throughout the codebase.

## Files Modified

### 1. ProductionController.php
- ✅ `store()` method - Changed validation from `stage` to `current_stage`
- ✅ `update()` method - Only updates `current_stage` (removed `stage` assignment)
- ✅ `startProduction()` method - Uses `current_stage` instead of `stage`
- ✅ `updateProcess()` method - Updates `current_stage` when processes complete
- ✅ `dashboard()` method - Groups by `current_stage` instead of `stage`
- ✅ `resourceAllocation()` method - Groups by `current_stage`
- ✅ Notification logic - Uses `current_stage` for comparison

### 2. Production.php Model
- ✅ Removed `stage` from `$fillable` array
- ✅ Only `current_stage` is now fillable

## Database Schema (Current)
```php
// productions table has:
- current_stage (enum with values: Material Preparation, Cutting & Shaping, etc.)
- NO 'stage' column (was dropped in migration)
```

## Testing Steps

### 1. Test Manual Stage Update
```bash
# Navigate to: Admin → Production Tracking System
# Select a production and change its stage dropdown
# Should work without errors now
```

### 2. Verify in Database
```sql
-- Check the schema
DESCRIBE productions;
-- Should show 'current_stage' but NOT 'stage'

-- Test update
UPDATE productions SET current_stage = 'Assembly' WHERE id = 1;
-- Should work

-- This should fail:
UPDATE productions SET stage = 'Assembly' WHERE id = 1;
-- Error: Unknown column 'stage'
```

### 3. Test via API
```bash
curl -X PATCH http://localhost:8000/api/productions/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"stage":"Cutting & Shaping"}'
```

Expected: Success (backend converts `stage` param to `current_stage`)

## What Now Works

✅ Manual stage updates via dropdown
✅ Automatic stage progression
✅ Process synchronization
✅ Analytics using correct stage data
✅ Notifications on stage changes
✅ All CRUD operations on productions

## Key Changes Summary

**Before:**
```php
$production->stage = $normalizedStage;
$production->current_stage = $normalizedStage;
```

**After:**
```php
$production->current_stage = $normalizedStage;
// 'stage' column doesn't exist anymore
```

## Migration History

1. **Original**: `stage` column (enum with legacy values)
2. **Enhanced Tracking Migration**: Dropped `stage`, added `current_stage` with new values
3. **Now**: Only `current_stage` exists in database

## Frontend Compatibility

The frontend sends `{ stage: newStage }` in the request, which is fine because:
- Backend accepts both `stage` and `current_stage` in validation
- Backend normalizes and only updates `current_stage` in database
- This maintains backward compatibility

## Notes

- The `stage` parameter in API requests is still accepted for backward compatibility
- It gets mapped to `current_stage` internally
- All database operations use `current_stage` only
- Frontend can continue sending `stage` or switch to `current_stage`
