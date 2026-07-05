@echo off
title جرش - النظام الإداري للفنادق
cd /d "%~dp0"
start /B node serve.cjs
timeout /t 2 /nobreak >nul 2>&1
start http://localhost:3000
