# Updates existing custom:yandex provider (fixes missing-email sign-in).
# Usage: same env vars as setup-yandex-oauth.ps1

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

$bodyUpdate = & "$PSScriptRoot/yandex-oauth-provider-body.ps1" -ClientId $ClientId -ClientSecret $ClientSecret -ForUpdate |
  ConvertTo-Json -Depth 6

. "$PSScriptRoot/supabase-admin-headers.ps1"
. "$PSScriptRoot/yandex-oauth-constants.ps1"
$headers = New-SupabaseAdminHeaders -ServiceRoleKey $ServiceRoleKey

Write-Host "Updating custom:yandex provider..."
$response = Invoke-RestMethod -Method Put -Uri "$SupabaseUrl/auth/v1/admin/custom-providers/$YandexProviderPathSegment" -Headers $headers -Body $bodyUpdate

$response | ConvertTo-Json -Depth 6
Write-Host "Done. Try Yandex sign-in again."
