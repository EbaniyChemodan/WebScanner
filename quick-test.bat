@echo off

start "Уязвимый сервер" cmd /K "node ./src/vulnerable_server/server.js"
start "Сканнер" cmd /K "node ./src/api/server.js"

echo >>> localhost:80 - Сканнер
echo >>> localhost:3001 - Уязвимый сервер

pause