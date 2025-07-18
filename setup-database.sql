-- Conectarse a la base de datos master para crear la base de datos Ditzler
USE master;
GO

-- Crear la base de datos si no existe
IF NOT EXISTS (SELECT * FROM sys.databases WHERE name = 'Ditzler')
BEGIN
  CREATE DATABASE Ditzler;
END;
GO

-- Usar la base de datos Ditzler
USE Ditzler;
GO

-- Crear la tabla de usuarios si no existe
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Usuarios' and xtype='U')
BEGIN
    CREATE TABLE Usuarios (
        ID INT PRIMARY KEY IDENTITY(1,1),
        Nombre NVARCHAR(50) NOT NULL,
        Apellido NVARCHAR(50) NOT NULL,
        Password NVARCHAR(255) NOT NULL, -- Considera usar un hash en un entorno de producción
        Email NVARCHAR(100) UNIQUE NOT NULL,
        Rol NVARCHAR(20) NOT NULL DEFAULT 'Viewer',
        Estado NVARCHAR(10) NOT NULL DEFAULT 'Active',
        FechaCreacion DATETIME DEFAULT GETDATE()
    );
END;
GO

-- Insertar un usuario administrador si no existe
IF NOT EXISTS (SELECT * FROM Usuarios WHERE Nombre = 'Admin')
BEGIN
    INSERT INTO Usuarios (Nombre, Apellido, Password, Email, Rol, Estado)
    VALUES ('Admin', 'User', 'admin123', 'admin@example.com', 'Admin', 'Active');
END;
GO

-- Insertar un usuario de solo lectura si no existe
IF NOT EXISTS (SELECT * FROM Usuarios WHERE Nombre = 'Viewer')
BEGIN
    INSERT INTO Usuarios (Nombre, Apellido, Password, Email, Rol, Estado)
    VALUES ('Viewer', 'User', 'viewer123', 'viewer@example.com', 'Viewer', 'Active');
END;
GO

SELECT 'Base de datos y tabla creadas y pobladas correctamente.';
GO