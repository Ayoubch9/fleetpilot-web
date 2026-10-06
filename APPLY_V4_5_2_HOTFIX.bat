@echo off
setlocal
cd /d "%~dp0"
echo MileVoxa v4.5.2 Action Center hotfix
echo Removing two stale Action Center files from older/incomplete copies...
if exist "src\app\api\action-center\route.ts" del /f /q "src\app\api\action-center\route.ts"
if exist "src\components\action-center.tsx" del /f /q "src\components\action-center.tsx"
echo.
echo Cleanup complete.
echo Now run:
echo   npm run typecheck
echo   npm run test:action-center
echo   npm run build
endlocal
