$ErrorActionPreference = 'Stop'
try {
    $encrypted = [Console]::In.ReadToEnd()
    $secret = ConvertTo-SecureString -String $encrypted
    $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secret)
    try {
        [Console]::Out.Write([Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer))
    } finally {
        [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
        $secret.Dispose()
    }
} catch {
    [Console]::Error.WriteLine('Não foi possível desbloquear a credencial local.')
    exit 1
}
