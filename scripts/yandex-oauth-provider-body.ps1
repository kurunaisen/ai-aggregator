# Shared Yandex OAuth2 provider payload for Supabase custom:yandex.
param(
  [Parameter(Mandatory = $true)][string]$ClientId,
  [Parameter(Mandatory = $true)][string]$ClientSecret,
  [switch]$ForUpdate
)

$payload = @{
  provider_type = "oauth2"
  name = "Yandex ID"
  client_id = $ClientId
  client_secret = $ClientSecret
  authorization_url = "https://oauth.yandex.ru/authorize"
  token_url = "https://oauth.yandex.ru/token"
  userinfo_url = "https://login.yandex.ru/info?format=json"
  scopes = @("login:email", "login:info")
  pkce_enabled = $false
  enabled = $true
  email_optional = $true
  authorization_params = @{
    force_confirm = "yes"
  }
  custom_claims_allowlist = @(
    "default_email",
    "display_name",
    "real_name",
    "first_name",
    "login",
    "default_avatar_id"
  )
  attribute_mapping = @{
    sub = "id"
    name = "display_name"
    preferred_username = "login"
  }
}

if (-not $ForUpdate) {
  $payload.identifier = "custom:yandex"
}

$payload
