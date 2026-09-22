@echo off
cd /d "%~dp0"
start "Quiz 提交管家" http://127.0.0.1:4321
node server.mjs
