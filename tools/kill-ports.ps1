# Script para detener procesos en puertos 5001 y 3000
# Uso: .\kill-ports.ps1

Write-Host "🔍 Buscando procesos en puertos 5001 y 3000..." -ForegroundColor Cyan

# Puerto 5001 (Backend)
$port5001 = netstat -ano | findstr :5001
if ($port5001) {
    $pid5001 = ($port5001 -split '\s+')[-1]
    Write-Host "❌ Deteniendo proceso en puerto 5001 (PID: $pid5001)..." -ForegroundColor Yellow
    taskkill /F /PID $pid5001 2>$null
    if ($?) {
        Write-Host "✅ Puerto 5001 liberado" -ForegroundColor Green
    }
} else {
    Write-Host "✅ Puerto 5001 ya está libre" -ForegroundColor Green
}

# Puerto 3000 (Frontend)
$port3000 = netstat -ano | findstr :3000
if ($port3000) {
    $pid3000 = ($port3000 -split '\s+')[-1]
    Write-Host "❌ Deteniendo proceso en puerto 3000 (PID: $pid3000)..." -ForegroundColor Yellow
    taskkill /F /PID $pid3000 2>$null
    if ($?) {
        Write-Host "✅ Puerto 3000 liberado" -ForegroundColor Green
    }
} else {
    Write-Host "✅ Puerto 3000 ya está libre" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Puertos listos. Ahora puedes ejecutar: npm run dev" -ForegroundColor Cyan
