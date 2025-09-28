$ErrorActionPreference = "Stop"
Set-Location "C:\Users\saiar\OneDrive\Desktop\SocioDent copy\backend"
Write-Host "Starting backend server..."
Write-Host "Current directory: $(Get-Location)"
node combined-server.js
