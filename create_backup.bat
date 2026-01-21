@echo off
set "sourcedir=c:\Users\Tompe\Documents\mk-porttaali-main"

REM Haetaan nykyinen päivämäärä ja kellonaika YYYY-MM-DD_HH-MM-SS muotoon
for /f "tokens=1-4 delims=/ " %%a in ('date /t') do set CDATE=%%c-%%a-%%b
for /f "tokens=1-3 delims=:." %%a in ('time /t') do set CTIME=%%a-%%b-%%c

set "backup_folder_name=mk-porttaali-main_backup_%CDATE%_%CTIME%"
set "base_backup_path=c:\Users\Tompe\Documents\mk-porttaali-main_backup"
set "destinationdir=%base_backup_path%\%backup_folder_name%"

REM Varmistetaan, että päävarmuuskansiopolku on olemassa
if not exist "%base_backup_path%" (
    mkdir "%base_backup_path%"
    echo Luotiin päävarmuuskansiopolku: %base_backup_path%
)

REM Tarkistetaan, onko kohdekansio olemassa ja luodaan se, jos ei ole
if not exist "%destinationdir%" (
    mkdir "%destinationdir%"
    echo Luotiin uusi varmuuskansiopolku: %destinationdir%
) else (
    echo Kohdekansio %destinationdir% on jo olemassa.
    echo Tämä ei pitäisi tapahtua, jos aikaleima toimii oikein.
    echo Voit jatkaa tai painaa Ctrl+C peruuttaaksesi.
    pause
)

echo Luodaan varmuuskopio kohteesta %sourcedir% kohteeseen %destinationdir%...
xcopy "%sourcedir%" "%destinationdir%\" /E /I /H /K /Y

if %errorlevel% equ 0 (
    echo Varmuuskopiointi valmis onnistuneesti!
) else (
    echo Varmuuskopiointi epäonnistui virhekoodilla %errorlevel%.
)
echo.
pause