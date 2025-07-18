@echo off
echo Configurando la base de datos para DitzlerTotes...
echo.

REM Ejecutar el script SQL usando sqlcmd
sqlcmd -S localhost\SQLEXPRESS -U sa -P 123 -i create-database-and-table.sql

IF %ERRORLEVEL% EQU 0 (
    echo.
    echo La base de datos se ha configurado correctamente.
) ELSE (
    echo.
    echo Error al configurar la base de datos. Verifique los mensajes anteriores.
)

echo.
echo Presione cualquier tecla para salir...
pause > nul