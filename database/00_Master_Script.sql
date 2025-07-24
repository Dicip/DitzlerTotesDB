-- =============================================
-- SCRIPT MAESTRO DE BASE DE DATOS
-- Sistema de Gestión de Totes - Ditzler
-- Ejecuta todos los scripts de creación en orden
-- =============================================

-- Verificar que estamos en la base de datos correcta
USE master;
GO

-- Crear la base de datos si no existe
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'Ditzler')
BEGIN
    CREATE DATABASE Ditzler;
    PRINT 'Base de datos Ditzler creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'Base de datos Ditzler ya existe.';
END
GO

-- Cambiar a la base de datos Ditzler
USE Ditzler;
GO

PRINT '=============================================';
PRINT 'INICIANDO CREACIÓN DE ESTRUCTURA DE BASE DE DATOS';
PRINT 'Sistema de Gestión de Totes - Ditzler';
PRINT 'Fecha: ' + CONVERT(VARCHAR, GETDATE(), 120);
PRINT '=============================================';
GO

-- =============================================
-- PASO 1: CREAR TABLA USUARIOS
-- =============================================
PRINT '';
PRINT 'PASO 1: Ejecutando script de tabla Usuarios...';
GO

-- Aquí se ejecutaría el contenido de 01_Usuarios_Table.sql
-- Para ejecutar este script maestro, debe ejecutar cada archivo por separado
-- o usar SQLCMD con la opción :r para incluir archivos

-- Ejemplo de uso con SQLCMD:
-- sqlcmd -S servidor -d Ditzler -E -i "01_Usuarios_Table.sql"

PRINT 'Para ejecutar este script maestro completamente, use los siguientes comandos:';
PRINT 'sqlcmd -S [SERVIDOR] -d Ditzler -E -i "01_Usuarios_Table.sql"';
PRINT 'sqlcmd -S [SERVIDOR] -d Ditzler -E -i "02_Clientes_Table.sql"';
PRINT 'sqlcmd -S [SERVIDOR] -d Ditzler -E -i "03_Totes_Table.sql"';
PRINT 'sqlcmd -S [SERVIDOR] -d Ditzler -E -i "04_Eventos_Table.sql"';
GO

-- =============================================
-- VERIFICACIÓN DE ESTRUCTURA
-- =============================================
PRINT '';
PRINT 'VERIFICANDO ESTRUCTURA DE BASE DE DATOS...';
GO

-- Verificar tablas creadas
SELECT 
    TABLE_NAME as 'Tabla',
    TABLE_TYPE as 'Tipo'
FROM INFORMATION_SCHEMA.TABLES 
WHERE TABLE_TYPE = 'BASE TABLE'
ORDER BY TABLE_NAME;
GO

-- Verificar funciones creadas
SELECT 
    ROUTINE_NAME as 'Función',
    ROUTINE_TYPE as 'Tipo'
FROM INFORMATION_SCHEMA.ROUTINES 
WHERE ROUTINE_TYPE = 'FUNCTION'
ORDER BY ROUTINE_NAME;
GO

-- Verificar procedimientos almacenados creados
SELECT 
    ROUTINE_NAME as 'Procedimiento',
    ROUTINE_TYPE as 'Tipo'
FROM INFORMATION_SCHEMA.ROUTINES 
WHERE ROUTINE_TYPE = 'PROCEDURE'
ORDER BY ROUTINE_NAME;
GO

-- Verificar índices creados
SELECT 
    t.name as 'Tabla',
    i.name as 'Índice',
    i.type_desc as 'Tipo'
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE i.name IS NOT NULL
ORDER BY t.name, i.name;
GO

-- Verificar restricciones creadas
SELECT 
    t.name as 'Tabla',
    cc.name as 'Restricción',
    cc.definition as 'Definición'
FROM sys.check_constraints cc
INNER JOIN sys.tables t ON cc.parent_object_id = t.object_id
ORDER BY t.name, cc.name;
GO

-- Verificar claves foráneas
SELECT 
    tp.name as 'Tabla_Principal',
    tr.name as 'Tabla_Referenciada',
    fk.name as 'Clave_Foránea'
FROM sys.foreign_keys fk
INNER JOIN sys.tables tp ON fk.parent_object_id = tp.object_id
INNER JOIN sys.tables tr ON fk.referenced_object_id = tr.object_id
ORDER BY tp.name;
GO

PRINT '';
PRINT '=============================================';
PRINT 'SCRIPT MAESTRO COMPLETADO';
PRINT 'Para una instalación completa, ejecute cada script individual:';
PRINT '1. 01_Usuarios_Table.sql';
PRINT '2. 02_Clientes_Table.sql';
PRINT '3. 03_Totes_Table.sql';
PRINT '4. 04_Eventos_Table.sql';
PRINT '=============================================';
GO