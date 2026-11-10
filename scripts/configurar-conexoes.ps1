<# Configuração local. Não faz login, não testa endpoints nem modifica servidores. #>
[CmdletBinding()]
param([switch]$PermitirImportacoes)
$ErrorActionPreference = 'Stop'
$env:PSModulePath = Join-Path $PSHOME 'Modules'
if ([Environment]::OSVersion.Platform -ne [PlatformID]::Win32NT) { throw 'Este assistente usa DPAPI do Windows. Em outros sistemas, use variáveis de ambiente.' }
if ($env:OBSERVABILITY_PROFILE) { throw 'O assistente configura apenas o perfil padrão. Remova OBSERVABILITY_PROFILE nesta sessão antes de executá-lo; perfis alternativos exigem configuração separada.' }
$profileDir = Join-Path $env:LOCALAPPDATA 'ObservabilityDevToolkit'
$profileFile = Join-Path $profileDir 'connections.json'
Write-Host 'Configure uma vez; tokens serão protegidos pelo usuário Windows atual.'
Write-Host 'URLs vazias deixam o sistema sem configuração. Nenhum servidor será acessado.'
if (Test-Path -LiteralPath $profileFile) {
    $answer = Read-Host 'Já existe um perfil. Substituir ambas as conexões e o modo? Digite SIM para continuar'
    if ($answer -cne 'SIM') { Write-Host 'Perfil preservado.'; exit 0 }
}
$profileData = [ordered]@{ version = 1; allowWrites = [bool]$PermitirImportacoes }
foreach ($systemName in @('zabbix','grafana')) {
    $label = if ($systemName -eq 'zabbix') { 'Zabbix: URL completa terminando em /api_jsonrpc.php' } else { 'Grafana: URL base da instância' }
    $endpoint = (Read-Host $label).Trim()
    if (-not $endpoint) { continue }
    $uri = $null
    if (-not [Uri]::TryCreate($endpoint,[UriKind]::Absolute,[ref]$uri)) { throw 'URL inválida.' }
    if ($uri.UserInfo -or $uri.Query -or $uri.Fragment) { throw 'A URL não pode conter credenciais, query ou fragmento.' }
    if ($uri.Scheme -ne 'https' -and -not ($uri.Scheme -eq 'http' -and $uri.Host -in @('localhost','127.0.0.1','[::1]','::1'))) { throw 'Use HTTPS; HTTP é aceito somente em loopback.' }
    if ($systemName -eq 'zabbix' -and -not $uri.AbsolutePath.EndsWith('/api_jsonrpc.php')) { throw 'Informe o endpoint completo da API Zabbix.' }
    $token = Read-Host ('Token de API/conta de serviço para ' + $systemName) -AsSecureString
    if ($token.Length -eq 0) { throw 'Token vazio: configuração cancelada.' }
    try { $encrypted = ConvertFrom-SecureString -SecureString $token } finally { $token.Dispose() }
    $profileData[$systemName] = [ordered]@{ url = $endpoint; tokenDpapi = $encrypted }
}
if (-not $profileData.Contains('zabbix') -and -not $profileData.Contains('grafana')) { Write-Host 'Nenhuma conexão informada; perfil preservado.'; exit 0 }
New-Item -ItemType Directory -Path $profileDir -Force | Out-Null
$sid = [Security.Principal.WindowsIdentity]::GetCurrent().User
$acl = New-Object Security.AccessControl.DirectorySecurity
$acl.SetOwner($sid)
$acl.SetAccessRuleProtection($true,$false)
$rule = New-Object Security.AccessControl.FileSystemAccessRule($sid,'FullControl','ContainerInherit,ObjectInherit','None','Allow')
$acl.AddAccessRule($rule)
[IO.Directory]::SetAccessControl($profileDir,$acl)
$json = $profileData | ConvertTo-Json -Depth 5
$temporaryProfile = Join-Path $profileDir ([Guid]::NewGuid().ToString() + '.tmp')
[IO.File]::WriteAllText($temporaryProfile,$json,(New-Object Text.UTF8Encoding($false)))
# Protect an existing file too: it might have had explicit permissions.
$fileAcl = New-Object Security.AccessControl.FileSecurity
$fileAcl.SetOwner($sid)
$fileAcl.SetAccessRuleProtection($true,$false)
$fileAcl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($sid,'FullControl','Allow')))
try {
    [IO.File]::SetAccessControl($temporaryProfile,$fileAcl)
    if (Test-Path -LiteralPath $profileFile) {
        $destinationAcl = New-Object Security.AccessControl.FileSecurity
        $destinationAcl.SetOwner($sid)
        $destinationAcl.SetAccessRuleProtection($true,$false)
        $destinationAcl.AddAccessRule((New-Object Security.AccessControl.FileSystemAccessRule($sid,'FullControl','Allow')))
        [IO.File]::SetAccessControl($profileFile,$destinationAcl)
        [IO.File]::Replace($temporaryProfile,$profileFile,[NullString]::Value)
    }
    else { [IO.File]::Move($temporaryProfile,$profileFile) }
} finally {
    if (Test-Path -LiteralPath $temporaryProfile) { Remove-Item -LiteralPath $temporaryProfile -Force }
}
Write-Host 'Perfil local salvo. Reabra o cliente para carregar a conexão.'
if ($PermitirImportacoes) { Write-Host 'Importações habilitadas tecnicamente; cada alteração ainda requer o escopo autorizado.' }
else { Write-Host 'Modo somente leitura. Importações remotas estão desabilitadas.' }
