param([switch]$NoQR)

$ErrorActionPreference = "Stop"
$ProjectDir = Join-Path $PSScriptRoot "src\Jarash.Web"

# Get local IPv4 addresses (exclude loopback, docker, virtual)
$ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object {
  $_.IPAddress -notmatch '^127\.' -and $_.IPAddress -notmatch '^169\.254' -and $_.InterfaceAlias -notmatch 'Loopback|Bluetooth|Hyper-V|VirtualBox|Docker|vEthernet|Tailscale'
} | Select-Object -ExpandProperty IPAddress

if (-not $ips) {
  Write-Host "⚠️  لم يتم العثور على IP محلي. تأكد من اتصالك بالشبكة." -ForegroundColor Yellow
  $ips = @("localhost")
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  🏨  JARASH — تشغيل من الهاتف" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

Write-Host "`n📡  روابط الاتصال من الجوال:" -ForegroundColor Green

$port = 5173
foreach ($ip in $ips) {
  $url = "http://$ip`:$port"
  Write-Host "     → $url" -ForegroundColor White
  if (-not $NoQR) {
    try {
      $qrUrl = "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=$([System.Web.HttpUtility]::UrlEncode($url))"
      $tempQr = Join-Path $env:TEMP "jarash_qr.png"
      Invoke-WebRequest -Uri $qrUrl -OutFile $tempQr -TimeoutSec 5 -ErrorAction Stop
      Start-Process $tempQr -ErrorAction SilentlyContinue
    } catch {
      # QR code generation failed silently — not critical
    }
  }
}

if ($ips.Count -gt 1) {
  Write-Host "`n📌  روابط إضافية (اختي بديلة إذا لم يعمل أحدها):" -ForegroundColor Yellow
  for ($i = 1; $i -lt $ips.Count; $i++) {
    Write-Host "     → http://$($ips[$i]):$port" -ForegroundColor DarkGray
  }
}

Write-Host "`n⏳  جاري تشغيل السيرفر..." -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

try {
  Set-Location -LiteralPath $ProjectDir
  npx.cmd vite --host 0.0.0.0 --force
} catch {
  Write-Host "❌  فشل في تشغيل السيرفر: $_" -ForegroundColor Red
  Read-Host "اضغط Enter للخروج"
}
