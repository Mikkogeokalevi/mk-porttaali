@echo off
cd /d "c:\Users\Tompe\Documents\mk-porttaali-main"

echo.
echo =========================================
echo Git-päivitysskripti GitHubiin
echo =========================================
echo.

REM Kysy commit-viesti käyttäjältä
set /p commit_message="Syötä lyhyt kuvaus tekemillesi muutoksille (commit-viesti): "

echo.
echo Lisätään kaikki muuttuneet tiedostot Gitin seurantaan...
git add .
if %errorlevel% neq 0 goto :error

echo.
echo Tallennetaan muutokset viestillä: "%commit_message%"
git commit -m "%commit_message%"
if %errorlevel% neq 0 goto :error

echo.
echo Haetaan viimeisimmät muutokset GitHubista (pull)...
git pull --rebase origin main
if %errorlevel% neq 0 goto :error

echo.
echo Lähetetään muutokset GitHubiin...
git push origin master:main
if %errorlevel% neq 0 goto :error

echo.
echo =========================================
echo GitHub-päivitys valmis onnistuneesti!
echo =========================================
echo.
pause
goto :eof

:error
echo.
echo =========================================
echo VIRHE: GitHub-päivitys epäonnistui!
echo Tarkista yllä olevat virheilmoitukset.
echo =========================================
echo.
pause