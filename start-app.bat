@echo off
title TodoList App Launcher

echo Starting Backend Server...
cd backend
start "Backend Server" node server.js

echo Waiting for server to start...
timeout /t 2 /nobreak >nul

echo Opening Frontend in Browser...
start http://localhost:3000

echo.
echo App is running! The server window is running in the background.
echo Close the new command prompt window to stop the server.