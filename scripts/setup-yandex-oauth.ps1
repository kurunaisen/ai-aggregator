# Creates Yandex as OAuth2 custom provider in Supabase (NOT OIDC).
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

$authUrl = "$SupabaseUrl/auth/v1/admin/custom-providers"
$body = @{
  provider_type = "oauth2"
  identifier = "yandex"
  name = "Yandex ID"
  client_id = $ClientId
  client_secret = $ClientSecret
  authorization_url = "https://oauth.yandex.ru/authorize"
  token_url = "https://oauth.yandex.ru/token"
  userinfo_url = "https://login.yandex.ru/info?format=json"
  scopes = @("login:email", "login:info")
  pkce_enabled = $false
  attribute_mapping = @{
    sub = "id"
    email = "default_email"
    name = "display_name"
    given_name = "first_name"
    family_name = "last_name"
    preferred_username = "login"
  }
} | ConvertTo-Json -Depth 5

Write-Host "Creating custom OAuth2 provider custom:yandex ..."
$response = Invoke-RestMethod -Method Post -Uri $authUrl -Headers @{
  Authorization = "Bearer $ServiceRoleKey"
  "Content-Type" = "application/json"
} -Body $body

$response | ConvertTo-Json -Depth 5
Write-Host ""
Write-Host "Done. In Yandex OAuth app set redirect URI to:"
Write-Host "$SupabaseUrl/auth/v1/callback"
