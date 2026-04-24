@echo off
git init
git add .
git commit -m "Initial commit - Mikrotik Manager Refactored"
git remote add origin https://github.com/mudio24/billing-rt-rw.net-connection-routeos.git
git branch -M main
git push -u origin main
echo Done!
pause
