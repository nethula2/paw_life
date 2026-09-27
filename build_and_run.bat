@echo off
echo ===============================================================
echo 🐾 Compiling and Starting PawLife Spring Boot Backend...
echo ===============================================================
cd /d "%~dp0"
call ".\.maven\apache-maven-3.9.6\bin\mvn.cmd" compile spring-boot:run
pause
