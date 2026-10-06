$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

Write-Host "MileVoxa v4.7.1 final-audit cleanup" -ForegroundColor Cyan

if (Test-Path ".next") {
  Remove-Item ".next" -Recurse -Force
  Write-Host "REMOVED .next cache" -ForegroundColor Yellow
}

node .\scripts\cleanup-stale-tests-v4_7_1.cjs

Write-Host ""
Write-Host "Security dependency overrides:" -ForegroundColor Cyan
Write-Host "  sharp 0.35.5"
Write-Host "  source-map-js 1.2.2"
Write-Host ""
Write-Host "Now run:" -ForegroundColor Green
Write-Host "npm install"
Write-Host "npm run typecheck"
Write-Host "npm run test:action-center"
Write-Host "npm run test:load-decision"
Write-Host "npm run test:signout-feedback"
Write-Host "npm run test:launch-hardening"
Write-Host "npm run test:regression"
Write-Host "npm run build"
Write-Host "npm run audit:prod"
