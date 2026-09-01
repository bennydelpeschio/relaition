@echo off
REM Avvia il ricevitore webhook di RelAItion.
REM Resta in ascolto su http://127.0.0.1:8788 e accoda le chiamate in arrivo,
REM che il builder preleva per avviare il flusso. Chiudi la finestra per fermarlo.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "relaition-webhook.ps1"
pause
