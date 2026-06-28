# Creates or updates Yandex as OAuth2 custom provider in Supabase (NOT OIDC).
# Usage:
#   $env:SUPABASE_URL="https://xxxx.supabase.co"
#   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."
#   $env:YANDEX_CLIENT_ID="..."
#   $env:YANDEX_CLIENT_SECRET="..."
#   .\scripts\setup-yandex-oauth.ps1

param(
  [string]$SupabaseUrl = $env:SUPABASE_URL,
  [string]$ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY,
  [string]$ClientId = $env:YANDEX_CLIENT_ID,
  [string]$ClientSecret = $env:YANDEX_CLIENT_SECRET
)

if (-not $SupabaseUrl -or -not $ServiceRoleKey -or -not $ClientId -or -not $ClientSecret) {
  Write-Error "Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, YANDEX_CLIENT_ID, YANDEX_CLIENT_SECRET"
  exit 1
}

$bodyCreate = & "$PSScriptRoot/yandex-oauth-provider-body.ps1" -ClientId $ClientId -ClientSecret $ClientSecret |
  ConvertTo-Json -Depth 6
$bodyUpdate = & "$PSScriptRoot/yandex-oauth-provider-body.ps1" -ClientId $ClientId -ClientSecret $ClientSecret -ForUpdate |
  ConvertTo-Json -Depth 6

. "$PSScriptRoot/supabase-admin-headers.ps1"
. "$PSScriptRoot/yandex-oauth-constants.ps1"
$headers = New-SupabaseAdminHeaders -ServiceRoleKey $ServiceRoleKey

Write-Host "Upserting custom OAuth2 provider custom:yandex ..."
try {
  $response = Invoke-RestMethod -Method Post -Uri "$SupabaseUrl/auth/v1/admin/custom-providers" -Headers $headers -Body $bodyCreate
} catch {
  Write-Host "Provider may already exist, trying update..."
  $response = Invoke-RestMethod -Method Put -Uri "$SupabaseUrl/auth/v1/admin/custom-providers/$YandexProviderPathSegment" -Headers $headers -Body $bodyUpdate
}

$response | ConvertTo-Json -Depth 6
Write-Host ""
Write-Host "=== Yandex OAuth (oauth.yandex.ru) ==="
Write-Host "Callback URL: $SupabaseUrl/auth/v1/callback"
Write-Host "Permissions: login:email, login:info"
Write-Host "Verify scopes: https://oauth.yandex.ru/client/$ClientId/info"
Write-Host ""
Write-Host "email_optional=true — required because Yandex returns default_email, not email."
Write-Host "App reads default_email from user_metadata after sign-in."
