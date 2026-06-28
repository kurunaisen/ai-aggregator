# Shared Yandex OAuth2 provider payload for Supabase custom:yandex.
param(
  [Parameter(Mandatory = $true)][string]$ClientId,
  [Parameter(Mandatory = $true)][string]$ClientSecret,
  [string]$SiteUrl = $env:NEXT_PUBLIC_SITE_URL,
  [switch]$ForUpdate
)

if (-not $SiteUrl) {
  $SiteUrl = "https://ai-aggregator-eosin.vercel.app"
}

$SiteUrl = $SiteUrl.Trim().TrimEnd("/")

$payload = @{
  provider_type = "oauth2"
  name = "Yandex ID"
  client_id = $ClientId
  client_secret = $ClientSecret
  authorization_url = "https://oauth.yandex.ru/authorize"
  token_url = "https://oauth.yandex.ru/token"
  userinfo_url = "$SiteUrl/api/auth/yandex/userinfo"
  scopes = @("login:email", "login:info")
  pkce_enabled = $false
  enabled = $true
  email_optional = $true
  authorization_params = @{
    force_confirm = "yes"
  }
  custom_claims_allowlist = @(
    "id",
    "default_email",
    "display_name",
    "real_name",
    "first_name",
    "login",
    "default_avatar_id"
  )
  attribute_mapping = @{
    name = "display_name"
    preferred_username = "login"
  }
}

if (-not $ForUpdate) {
  $payload.identifier = "custom:yandex"
}

$payload
