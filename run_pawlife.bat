@echo off
title PawLife Pet Care Management System
echo ===============================================================
echo 🐾 PawLife Pet Care Management System - Spring Boot Backend
echo SLIIT Year 2 Semester 1 (SE2030) - Group MLB-B6G2-07
echo Port: http://localhost:3000
echo ===============================================================
cd /d "%~dp0"
call ".\.maven\apache-maven-3.9.6\bin\mvn.cmd" spring-boot:run
pause
