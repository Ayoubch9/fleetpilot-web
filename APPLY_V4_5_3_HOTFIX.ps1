$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot
$stale = @(
  "src\app\api\action-center\route.ts",
  "src\components\action-center.tsx"
)
Write-Host "MileVoxa v4.5.3 Action Center cleanup" -ForegroundColor Cyan
foreach ($f in $stale) {
  if (Test-Path $f) {
    Remove-Item -Force $f
    Write-Host "REMOVED stale file: $f" -ForegroundColor Yellow
  } else {
    Write-Host "OK - stale file absent: $f" -ForegroundColor Green
  }
}
Write-Host ""
Write-Host "Verifying stale imports..." -ForegroundColor Cyan
$matches = Get-ChildItem src -Recurse -File -Include *.ts,*.tsx | Select-String -Pattern "actionCenterIdentity|loadActionCenter|ActionCenterResult"
if ($matches) {
  Write-Host "WARNING: stale Action Center symbols still found:" -ForegroundColor Red
  $matches | ForEach-Object { Write-Host "$($_.Path):$($_.LineNumber): $($_.Line.Trim())" }
  exit 1
}
Write-Host "PASS - stale symbols are gone." -ForegroundColor Green
Write-Host ""
Write-Host "Now run:" -ForegroundColor Cyan
Write-Host "npm run typecheck"
Write-Host "npm run test:action-center"
Write-Host "npm run build"
