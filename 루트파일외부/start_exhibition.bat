
@echo off
echo Starting Exhibition Web Application...
cd exhibition-project

echo Installing dependencies...
call npm install

echo Starting Vision Service...
start /B python vision.py

echo Starting Development Server...
start /B npm run dev

echo Opening in browser...
timeout /t 5
start http://localhost:3000

echo Exhibition is running!
echo Press any key to close all processes...
pause > nul

taskkill /F /IM python.exe /T
taskkill /F /IM node.exe /T
exit