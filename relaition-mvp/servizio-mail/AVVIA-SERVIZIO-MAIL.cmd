@echo off
REM Avvia il servizio locale di invio email di RelAItion.
REM Doppio click su questo file: chiede provider, utente e password, verifica
REM subito la connessione inviando un messaggio di prova a te stesso, poi resta
REM in ascolto finche' non chiudi la finestra.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "relaition-mail.ps1"
pause
