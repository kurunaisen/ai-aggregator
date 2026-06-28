# Read-only checks for Yandex OAuth setup (no secrets written to disk).
$ErrorActionPreference = "Stop"

$siteUrl = "https://ai-aggregator-eosin.vercel.app"
$userinfoUrl = "$siteUrl/api/auth/yandex/userinfo"
$supabaseUrl = "https://jgrbbwkwyogarfgtqrpw.supabase.co"

Write-Host ""
Write-Host "=== Yandex OAuth diagnostics ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Userinfo proxy on site" -ForegroundColor Yellow
Write-Host "   $userinfoUrl"
try {
  $response = Invoke-WebRequest -Uri $userinfoUrl -Method Get -UseBasicParsing -TimeoutSec 30
  Write-Host "   HTTP $($response.StatusCode) (expected 401 without token)" -ForegroundColor $(if ($response.StatusCode -eq 401) { "Green" } else { "Yellow" })
  if ($response.Content) { Write-Host "   $($response.Content)" -ForegroundColor DarkGray }
} catch {
  $status = $_.Exception.Response.StatusCode.value__
  if ($status -eq 401) {
    Write-Host "   HTTP 401 - proxy is deployed" -ForegroundColor Green
  } elseif ($status -eq 404) {
    Write-Host "   HTTP 404 - deploy not finished or route missing" -ForegroundColor Red
  } else {
    Write-Host "   Failed: $($_.Exception.Message)" -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "2. Supabase custom:yandex userinfo_url" -ForegroundColor Yellow
Write-Host "   Paste service_role key (input hidden). Leave empty to skip."
$serviceRole = Read-Host "   service_role key"
if ($serviceRole.Trim()) {
  . "$PSScriptRoot/supabase-admin-headers.ps1"
  . "$PSScriptRoot/yandex-oauth-constants.ps1"
  $headers = New-SupabaseAdminHeaders -ServiceRoleKey $serviceRole
  $providerUrl = "$supabaseUrl/auth/v1/admin/custom-providers/$YandexProviderPathSegment"
  try {
    $response = Invoke-WebRequest -Method Get -Uri $providerUrl -Headers $headers -UseBasicParsing
    $provider = $response.Content | ConvertFrom-Json
    $configured = [string]$provider.userinfo_url
    Write-Host "   Configured: $configured" -ForegroundColor DarkGray
    if ($configured -eq $userinfoUrl) {
      Write-Host "   OK - points to proxy" -ForegroundColor Green
    } else {
      Write-Host "   MISMATCH - run scripts\run-yandex-oauth-fix.cmd" -ForegroundColor Red
      Write-Host "   Expected: $userinfoUrl" -ForegroundColor Yellow
    }
    Write-Host "   email_optional: $($provider.email_optional)" -ForegroundColor DarkGray
    Write-Host "   enabled: $($provider.enabled)" -ForegroundColor DarkGray
  } catch {
    Write-Host "   Failed to read provider: $($_.Exception.Message)" -ForegroundColor Red
  }
} else {
  Write-Host "   Skipped." -ForegroundColor DarkGray
}

Write-Host ""
Write-Host "3. Supabase Redirect URLs (manual check in Dashboard)" -ForegroundColor Yellow
Write-Host "   Site URL: $siteUrl"
Write-Host "   Redirect URLs must include: $siteUrl/auth/callback"
Write-Host ""
Write-Host "4. Yandex Redirect URI (should stay on Supabase, not your site)" -ForegroundColor Yellow
Write-Host "   $supabaseUrl/auth/v1/callback"
Write-Host ""
