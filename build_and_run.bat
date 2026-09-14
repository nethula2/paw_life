@echo off
echo ===============================================================
echo 🐾 Compiling PawLife Java Backend (OpenJDK 17 Temurin)...
echo ===============================================================
if not exist "bin" mkdir bin
"C:\Program Files\Eclipse Adoptium\jdk-17.0.15.6-hotspot\bin\javac.exe" -encoding UTF-8 -cp "lib/*" -d bin src/main/java/com/pawlife/*.java
if %ERRORLEVEL% EQU 0 (
    echo [BUILD SUCCESS] Starting PawLife Java Server...
    echo ===============================================================
    "C:\Program Files\Eclipse Adoptium\jdk-17.0.15.6-hotspot\bin\java.exe" -cp "lib/*;bin" com.pawlife.PawLifeServer
) else (
    echo [BUILD FAILED] Please check compilation errors above.
    pause
)
