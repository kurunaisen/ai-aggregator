function New-SupabaseAdminHeaders {
  param([Parameter(Mandatory = $true)][string]$ServiceRoleKey)

  $key = $ServiceRoleKey.Trim()
  return @{
    Authorization = "Bearer $key"
    apikey        = $key
    "Content-Type" = "application/json"
  }
}
