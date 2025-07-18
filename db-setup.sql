-- Script para crear la base de datos y tabla de usuarios en SQL Server

-- Crear la base de datos si no existe
IF NOT EXISTS (SELECT name FROM master.dbo.sysdatabases WHERE name = 'ditzler')
BEGIN
    CREATE DATABASE ditzler;
    PRINT 'Base de datos "ditzler" creada.';
END
ELSE
    PRINT 'La base de datos "ditzler" ya existe.';
GO

-- Usar la base de datos
USE ditzler;
GO

-- Crear la tabla de usuarios si no existe
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='usuarios' AND xtype='U')
BEGIN
    CREATE TABLE usuarios (
        id INT IDENTITY(1,1) PRIMARY KEY,
        username NVARCHAR(50) NOT NULL UNIQUE,
        password NVARCHAR(100) NOT NULL,
        fullname NVARCHAR(100),
        email NVARCHAR(100),
        created_at DATETIME DEFAULT GETDATE(),
        last_login DATETIME,
        is_active BIT DEFAULT 1
    );
    PRINT 'Tabla "usuarios" creada.';
    
    -- Insertar algunos usuarios de prueba
    INSERT INTO usuarios (username, password, fullname, email, created_at)
    VALUES 
        ('admin', 'admin123', 'Administrador Principal', 'admin@ditzlertotes.com', GETDATE()),
        ('supervisor', 'super123', 'Supervisor de Sistema', 'supervisor@ditzlertotes.com', GETDATE()),
        ('manager', 'manager123', 'Gerente de Operaciones', 'manager@ditzlertotes.com', GETDATE());
    
    PRINT 'Usuarios de prueba insertados.';
END
ELSE
    PRINT 'La tabla "usuarios" ya existe.';
GO

-- Verificar los usuarios creados
SELECT * FROM usuarios;
GO

-- Instrucciones para el usuario:
/*
Para ejecutar este script en SQL Server Management Studio:
1. Abra SQL Server Management Studio
2. Conéctese a su instancia de SQL Server
3. Abra este archivo (db-setup.sql)
4. Haga clic en "Ejecutar" o presione F5

Para ejecutar este script desde la línea de comandos:
1. Abra una ventana de comandos
2. Ejecute el siguiente comando:
   sqlcmd -S [nombre_servidor] -U [usuario] -P [contraseña] -i db-setup.sql

Recuerde actualizar la configuración de conexión en el archivo server.js con sus credenciales correctas:
- user: Su nombre de usuario de SQL Server
- password: Su contraseña de SQL Server
- server: El nombre de su servidor SQL Server
*/