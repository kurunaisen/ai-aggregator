# Interactive setup for custom:yandex (Dashboard does not expose email_optional etc.).
# Run in PowerShell from the project folder:
#   cd C:\Users\izi\ai-aggregator
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
#   .\scripts\update-yandex-oauth-interactive.ps1

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "=== Yandex OAuth fix for Supabase (custom:yandex) ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "These settings are NOT in the Supabase Dashboard UI."
Write-Host "This script calls the Supabase Admin API once from your PC."
Write-Host ""

Write-Host "Supabase Project URL examples:"
Write-Host "  https://jgrbbwkwyogarfgtqrpw.supabase.co"
Write-Host "  jgrbbwkwyogarfgtqrpw"
Write-Host ""

function Normalize-SupabaseUrl {
  param([string]$InputUrl)

  $url = $InputUrl.Trim().Trim('"').Trim("'").TrimEnd("/")

  if ($url -match '^[a-z0-9]{10,}$') {
    return "https://$url.supabase.co"
  }

  if ($url -match '^([a-z0-9-]+)\.supabase\.co$') {
    return "https://$url"
  }

  if ($url.StartsWith("http://")) {
    $url = "https://" + $url.Substring(7)
  } elseif (-not $url.StartsWith("https://")) {
    $url = "https://$url"
  }

  if ($url -notmatch '^https://[a-z0-9-]+\.supabase\.co$') {
    Write-Error "Invalid Supabase URL. Use https://YOUR-REF.supabase.co or only YOUR-REF"
  }

  return $url
}

$supabaseUrl = Normalize-SupabaseUrl (Read-Host "Supabase Project URL")
Write-Host "Using: $supabaseUrl" -ForegroundColor DarkGray

function Get-JwtRole {
  param([string]$Token)

  $parts = $Token.Trim().Split(".")
  if ($parts.Length -lt 2) { return $null }

  $payload = $parts[1]
  $padding = "=" * ((4 - ($payload.Length % 4)) % 4)
  try {
    $json = [System.Text.Encoding]::UTF8.GetString([Convert]::FromBase64String($payload + $padding))
    $data = $json | ConvertFrom-Json
    return [string]$data.role
  } catch {
    return $null
  }
}

$serviceRole = Read-Host "Supabase service_role key (Settings -> API -> secret, NOT anon/public)"
$keyRole = Get-JwtRole $serviceRole
if ($keyRole -eq "anon") {
  Write-Host ""
  Write-Host "ERROR: You pasted the anon/public key." -ForegroundColor Red
  Write-Host "Admin API needs service_role key (marked secret in Supabase Dashboard)." -ForegroundColor Red
  Write-Host "Settings -> API -> service_role -> Reveal -> copy that key." -ForegroundColor Yellow
  exit 1
}
if ($keyRole -and $keyRole -ne "service_role") {
  Write-Host ""
  Write-Host "WARNING: JWT role is '$keyRole', expected service_role." -ForegroundColor Yellow
}
$yandexClientId = Read-Host "Yandex Client ID (oauth.yandex.ru)"
$yandexSecret = Read-Host "Yandex Client Secret" -AsSecureString
$yandexSecretPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
  [Runtime.InteropServices.Marshal]::SecureStringToBSTR($yandexSecret)
)

$defaultSiteUrl = "https://ai-aggregator-eosin.vercel.app"
$siteUrlInput = Read-Host "Site URL for userinfo proxy [$defaultSiteUrl]"
$siteUrl = if ($siteUrlInput.Trim()) { $siteUrlInput.Trim() } else { $defaultSiteUrl }
Write-Host "Userinfo proxy: $siteUrl/api/auth/yandex/userinfo" -ForegroundColor DarkGray

$bodyCreate = & "$PSScriptRoot/yandex-oauth-provider-body.ps1" -ClientId $yandexClientId.Trim() -ClientSecret $yandexSecretPlain -SiteUrl $siteUrl |
  ConvertTo-Json -Depth 6
$bodyUpdate = & "$PSScriptRoot/yandex-oauth-provider-body.ps1" -ClientId $yandexClientId.Trim() -ClientSecret $yandexSecretPlain -SiteUrl $siteUrl -ForUpdate |
  ConvertTo-Json -Depth 6

. "$PSScriptRoot/supabase-admin-headers.ps1"
. "$PSScriptRoot/yandex-oauth-constants.ps1"
$headers = New-SupabaseAdminHeaders -ServiceRoleKey $serviceRole

$providerUrl = "$supabaseUrl/auth/v1/admin/custom-providers/$YandexProviderPathSegment"

function Invoke-ProviderRequest {
  param(
    [string]$Method,
    [string]$Url,
    [string]$RequestBody
  )
  return Invoke-WebRequest -Method $Method -Uri $Url -Headers $headers -Body $RequestBody -UseBasicParsing
}

Write-Host ""
Write-Host "Sending config to Supabase..." -ForegroundColor Yellow

try {
  $list = Invoke-WebRequest -Method Get -Uri "$supabaseUrl/auth/v1/admin/custom-providers" -Headers $headers -UseBasicParsing
  Write-Host "Custom providers API: OK" -ForegroundColor DarkGray
} catch {
  $listStatus = $_.Exception.Response.StatusCode.value__
  Write-Host "Custom providers API check: HTTP $listStatus" -ForegroundColor DarkYellow
  if ($listStatus -eq 404) {
    Write-Host "Custom OAuth may be disabled on this project. Enable it in Supabase Dashboard -> Auth -> Custom Providers." -ForegroundColor Yellow
  }
}

$paths = @($providerUrl)

$lastError = $null
foreach ($path in $paths) {
  try {
    Write-Host "PUT $path" -ForegroundColor DarkGray
    $response = Invoke-ProviderRequest -Method Put -Url $path -RequestBody $bodyUpdate
    Write-Host ""
    Write-Host "OK ($path)" -ForegroundColor Green
    Write-Host $response.Content
    Write-Host ""
    Write-Host "Done. Open your site and try 'Voyti cherez Yandex' again." -ForegroundColor Green
    exit 0
  } catch {
    $lastError = $_
    if ($_.Exception.Response.StatusCode.value__ -eq 404) {
      Write-Host "Not found at $path, trying create..." -ForegroundColor DarkYellow
      try {
        $createUrl = "$supabaseUrl/auth/v1/admin/custom-providers"
        Write-Host "POST $createUrl" -ForegroundColor DarkGray
        $response = Invoke-ProviderRequest -Method Post -Url $createUrl -RequestBody $bodyCreate
        Write-Host ""
        Write-Host "Created provider." -ForegroundColor Green
        Write-Host $response.Content
        Write-Host ""
        Write-Host "Done. Try Yandex sign-in on the site." -ForegroundColor Green
        exit 0
      } catch {
        $lastError = $_
      }
    }
  }
}

Write-Host ""
Write-Host "Request failed:" -ForegroundColor Red
if ($lastError.Exception.Response) {
  $status = [int]$lastError.Exception.Response.StatusCode
  Write-Host "HTTP $status" -ForegroundColor Red
  try {
    $reader = New-Object System.IO.StreamReader($lastError.Exception.Response.GetResponseStream())
    $errorBody = $reader.ReadToEnd()
    if ($errorBody) {
      Write-Host $errorBody
    }
  } catch {}
  if ($status -eq 401 -or $status -eq 403) {
    Write-Host ""
    Write-Host "Usually this means wrong key: use service_role, not anon/public." -ForegroundColor Yellow
  }
} else {
  Write-Host $lastError.Exception.Message
}
Write-Host ""
Write-Host "Check: service_role key, project URL, provider exists in Auth -> Custom Providers."
exit 1
