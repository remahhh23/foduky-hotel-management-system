@echo off
title جرش - النظام الإداري للفنادق
setlocal enabledelayedexpansion

:: ============================================
::  🏨  جرش — المُشغّل المحمول (Portable Launcher)
::  يعمل من أي مجلد — فقط اسحب واركض
:: ============================================

set "ROOT=%~dp0"
set "WEB=%ROOT%src\Jarash.Web"
set "PORT=5173"

cd /d "%ROOT%"

:: ── التحقق من Node.js ──
where node >nul 2>nul
if errorlevel 1 (
    cls
    echo.
    echo ╔══════════════════════════════════════════╗
    echo ║                                          ║
    echo ║        ❌  Node.js غير مثبت              ║
    echo ║                                          ║
    echo ║  الرجاء تثبيت Node.js من:                ║
    echo ║  https://nodejs.org                      ║
    echo ║                                          ║
    echo ║  اختر الإصدار LTS      ✓                 ║
    echo ║  التثبيت: Next - Next - Install          ║
    echo ║  ثم أعد تشغيل هذا الملف                  ║
    echo ║                                          ║
    echo ╚══════════════════════════════════════════╝
    echo.
    pause
    exit /b 1
)

:: ── التحقق من الاعتماديات ──
if not exist "%WEB%\node_modules" (
    cls
    echo.
    echo ╔══════════════════════════════════════════╗
    echo ║                                          ║
    echo ║     ⏳  جاري تثبيت الاعتماديات...        ║
    echo ║                                          ║
    echo ║  قد تستغرق بضع دقائق في المرة الأولى     ║
    echo ║                                          ║
    echo ╚══════════════════════════════════════════╝
    echo.
    cd /d "%WEB%"
    call npm install --no-fund --no-audit --loglevel=warn
    if errorlevel 1 (
        echo.
        echo ❌ فشل تثبيت الاعتماديات
        pause
        exit /b 1
    )
    cd /d "%ROOT%"
    echo ✅ تم تثبيت الاعتماديات
)

:: ── القائمة الرئيسية ──
:menu
cls
echo.
echo ╔══════════════════════════════════════════╗
echo ║                                          ║
echo ║     🏨  جرش — النظام الإداري للفنادق    ║
echo ║                                          ║
echo ╚══════════════════════════════════════════╝
echo.
echo  اختر وضع التشغيل:
echo  ──────────────────────────────────────────
echo.
echo   [1] ▶  وضع التطوير — Vite (إعادة تحميل تلقائي)
echo               الأفضل أثناء التعديل على النظام
echo.
echo   [2] ▶  تشغيل شامل — serve.cjs (سيرفر + بصمة + تخزين)
echo               يشتغل كل شيء بأمر واحد — للاستخدام اليومي
echo.
echo   [3] ▶  بناء المشروع فقط (Build)
echo               يُنشئ ملفات dist للرفع أو النقل
echo.
echo  ──────────────────────────────────────────
echo.
choice /c 123 /n /m "  اختر رقم 1 أو 2 أو 3 : "

if errorlevel 3 goto build_only
if errorlevel 2 goto production
if errorlevel 1 goto development

:: ══════════════════════════════════
::  وضع التطوير
:: ══════════════════════════════════
:development
cls
echo.
echo ╔══════════════════════════════════════════╗
echo ║     🚀  وضع التطوير — Vite Dev Server   ║
echo ╚══════════════════════════════════════════╝
echo.
call :show_ips %PORT%
echo.
echo  اضغط Ctrl+C لإيقاف السيرفر
echo.

cd /d "%WEB%"
start "" http://localhost:%PORT%
npx.cmd vite --host 0.0.0.0 --port %PORT% --force

if errorlevel 1 (
    echo.
    echo ❌ فشل تشغيل السيرفر
    pause
)
goto end

:: ══════════════════════════════════
::  تشغيل شامل — serve.cjs
:: ══════════════════════════════════
:production
cls
echo.
echo ╔══════════════════════════════════════════╗
echo ║     🔨  التحقق من البناء...             ║
echo ╚══════════════════════════════════════════╝
echo.

:: بناء المشروع إذا كانت dist غير موجودة
if not exist "%WEB%\dist\index.html" (
    echo ⏳ جاري بناء المشروع...
    cd /d "%WEB%"
    call npx.cmd vite build
    if errorlevel 1 (
        echo ❌ فشل البناء
        pause
        exit /b 1
    )
    cd /d "%ROOT%"
    echo ✅ تم البناء بنجاح
) else (
    echo ✅ البناء موجود
)
echo.
echo ╔══════════════════════════════════════════╗
echo ║     🚀  السيرفر الشامل (موقع + بصمة)    ║
echo ╚══════════════════════════════════════════╝
echo.
echo  اضغط Ctrl+C لإيقاف السيرفر
echo.

start "" http://localhost:3000
node "%ROOT%serve.cjs"

if errorlevel 1 (
    echo.
    echo ❌ فشل تشغيل السيرفر
    pause
)
goto end

:: ══════════════════════════════════
::  بناء فقط
:: ══════════════════════════════════
:build_only
cls
echo.
echo ╔══════════════════════════════════════════╗
echo ║     🔨  جاري بناء المشروع...            ║
echo ╚══════════════════════════════════════════╝
echo.
cd /d "%WEB%"
call npx.cmd vite build
if errorlevel 1 (
    echo ❌ فشل البناء
    pause
    exit /b 1
)
echo ✅ تم البناء بنجاح
echo 📁  المسار: %WEB%\dist
echo.
pause
goto end

:: ══════════════════════════════════
::  عرض عناوين IP
:: ══════════════════════════════════
:show_ips
echo  📡  روابط الاتصال من الجوال:
echo.
for /f "tokens=*" %%a in ('powershell -NoProfile -Command "& {Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notmatch '^127\.' -and $_.IPAddress -notmatch '^169\.254' -and $_.InterfaceAlias -notmatch 'Loopback|Bluetooth|Hyper-V|VirtualBox|Docker|vEthernet|Tailscale' } | ForEach-Object { Write-Output $_.IPAddress }}"') do (
    set "ip=%%a"
    if not "!ip!"=="" (
        echo      📱  http://!ip!:%~1
    )
)
echo.
echo      💻  http://localhost:%~1
echo.
goto :eof

:: ══════════════════════════════════
::  نهاية
:: ══════════════════════════════════
:end
echo.
pause
