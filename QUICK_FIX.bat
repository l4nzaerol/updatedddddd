@echo off
echo ============================================
echo QUICK FIX - Clear Frontend Cache
echo ============================================
echo.

cd casptone-front

echo Step 1: Clearing npm cache...
call npm cache clean --force

echo.
echo Step 2: Removing node_modules...
if exist node_modules rmdir /s /q node_modules

echo.
echo Step 3: Removing package-lock.json...
if exist package-lock.json del package-lock.json

echo.
echo Step 4: Reinstalling dependencies...
call npm install

echo.
echo ============================================
echo DONE! Now:
echo 1. Close ALL browser tabs
echo 2. Clear browser cache (Ctrl+Shift+Delete)
echo 3. Run: npm start
echo 4. Open in Incognito mode first
echo ============================================
pause
