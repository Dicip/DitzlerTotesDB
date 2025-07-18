-- Script para crear la base de datos y tabla de usuarios en SQL Server con la estructura correcta

-- Crear la base de datos si no existe
IF NOT EXISTS (SELECT name FROM master.dbo.sysdatabases WHERE name = 'Ditzler')
BEGIN
    CREATE DATABASE Ditzler;
    PRINT 'Base de datos "Ditzler" creada.';
END
ELSE
    PRINT 'La base de datos "Ditzler" ya existe.';
GO

-- Usar la base de datos
USE Ditzler;
GO

-- Crear la tabla de usuarios si no existe
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Usuarios' AND xtype='U')
BEGIN
    CREATE TABLE Usuarios (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Nombre NVARCHAR(50) NOT NULL,
        Apellido NVARCHAR(50) NOT NULL,
        Password NVARCHAR(100) NOT NULL,
        Email NVARCHAR(100) NOT NULL,
        Rol NVARCHAR(20) NOT NULL CHECK (Rol IN ('Admin', 'Editor', 'Viewer')),
        Estado NVARCHAR(20) NOT NULL CHECK (Estado IN ('Active', 'Inactive')),
        CONSTRAINT UQ_Email UNIQUE (Email)
    );
    PRINT 'Tabla "Usuarios" creada.';
    
    -- Insertar usuario administrador
    INSERT INTO Usuarios (Nombre, Apellido, Password, Email, Rol, Estado)
    VALUES ('Admin', 'Principal', 'admin123', 'admin@ditzlertotes.com', 'Admin', 'Active');
    
    PRINT 'Usuario administrador insertado.';
END
ELSE
BEGIN
    -- Verificar si la tabla tiene la estructura correcta
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Usuarios') AND name = 'Email')
    BEGIN
        -- Agregar columna Email si no existe
        ALTER TABLE Usuarios ADD Email NVARCHAR(100);
        PRINT 'Columna Email agregada a la tabla Usuarios.';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Usuarios') AND name = 'Rol')
    BEGIN
        -- Agregar columna Rol si no existe
        ALTER TABLE Usuarios ADD Rol NVARCHAR(20) DEFAULT 'Viewer';
        PRINT 'Columna Rol agregada a la tabla Usuarios.';
    END
    
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Usuarios') AND name = 'Estado')
    BEGIN
        -- Agregar columna Estado si no existe
        ALTER TABLE Usuarios ADD Estado NVARCHAR(20) DEFAULT 'Active';
        PRINT 'Columna Estado agregada a la tabla Usuarios.';
    END
    
    PRINT 'La tabla "Usuarios" ya existe y ha sido actualizada si era necesario.';
END
GO

-- Verificar los usuarios creados
SELECT * FROM Usuarios;
GO

-- Instrucciones para el usuario:
/*
Para ejecutar este script en SQL Server Management Studio:
1. Abra SQL Server Management Studio
2. Conéctese a su instancia de SQL Server
3. Abra este archivo (create-database-and-table.sql)
4. Haga clic en "Ejecutar" o presione F5

Para ejecutar este script desde la línea de comandos:
1. Abra una ventana de comandos
2. Ejecute el siguiente comando:
   sqlcmd -S localhost\SQLEXPRESS -U sa -P 123 -i create-database-and-table.sql
*/