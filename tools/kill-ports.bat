@echo off
echo.
echo ========================================
echo   LIBERANDO PUERTOS 5001 y 3000
echo ========================================
echo.

echo Buscando proceso en puerto 5001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5001') do (
    echo Deteniendo proceso %%a en puerto 5001...
    taskkill /F /PID %%a >nul 2>&1
    if errorlevel 1 (
        echo Puerto 5001 ya estaba libre
    ) else (
        echo Puerto 5001 liberado correctamente
    )
    goto :port3000
)
echo Puerto 5001 ya estaba libre

:port3000
echo.
echo Buscando proceso en puerto 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Deteniendo proceso %%a en puerto 3000...
    taskkill /F /PID %%a >nul 2>&1
    if errorlevel 1 (
        echo Puerto 3000 ya estaba libre
    ) else (
        echo Puerto 3000 liberado correctamente
    )
    goto :done
)
echo Puerto 3000 ya estaba libre

:done
echo.
echo ========================================
echo   PUERTOS LISTOS
echo ========================================
echo.
echo Ahora puedes ejecutar: npm run dev
echo.
pause
