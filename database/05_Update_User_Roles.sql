-- =============================================
-- SCRIPT DE ACTUALIZACIÓN DE ROLES DE USUARIO
-- Sistema de Gestión de Totes - Ditzler
-- Actualización: Nuevos roles de usuario
-- =============================================

USE Ditzler;
GO

-- =============================================
-- ACTUALIZAR USUARIO ADMIN EXISTENTE
-- =============================================
UPDATE Usuarios 
SET Rol = 'Administrador'
WHERE Email = 'admin@ditzler.com';
PRINT 'Usuario administrador actualizado a nuevo rol.';
GO

-- =============================================
-- CREAR USUARIOS CON NUEVOS ROLES
-- =============================================

-- Operador Totes
IF NOT EXISTS (SELECT * FROM Usuarios WHERE Email = 'operador.totes@ditzler.com')
BEGIN
    INSERT INTO Usuarios (Nombre, Apellido, Password, Email, Rol, Estado, FechaCreacion, FechaModificacion)
    VALUES ('Juan', 'Pérez', 'totes123', 'operador.totes@ditzler.com', 'Operador Totes', 'Activo', GETDATE(), GETDATE());
    
    PRINT 'Usuario Operador Totes creado exitosamente.';
    PRINT 'Email: operador.totes@ditzler.com';
    PRINT 'Password: totes123';
END
GO

-- Operador Preparados
IF NOT EXISTS (SELECT * FROM Usuarios WHERE Email = 'operador.preparados@ditzler.com')
BEGIN
    INSERT INTO Usuarios (Nombre, Apellido, Password, Email, Rol, Estado, FechaCreacion, FechaModificacion)
    VALUES ('María', 'González', 'preparados123', 'operador.preparados@ditzler.com', 'Operador Preparados', 'Activo', GETDATE(), GETDATE());
    
    PRINT 'Usuario Operador Preparados creado exitosamente.';
    PRINT 'Email: operador.preparados@ditzler.com';
    PRINT 'Password: preparados123';
END
GO

-- Operador Despacho
IF NOT EXISTS (SELECT * FROM Usuarios WHERE Email = 'operador.despacho@ditzler.com')
BEGIN
    INSERT INTO Usuarios (Nombre, Apellido, Password, Email, Rol, Estado, FechaCreacion, FechaModificacion)
    VALUES ('Carlos', 'Rodríguez', 'despacho123', 'operador.despacho@ditzler.com', 'Operador Despacho', 'Activo', GETDATE(), GETDATE());
    
    PRINT 'Usuario Operador Despacho creado exitosamente.';
    PRINT 'Email: operador.despacho@ditzler.com';
    PRINT 'Password: despacho123';
END
GO

-- =============================================
-- VERIFICAR USUARIOS CREADOS
-- =============================================
SELECT Id, Nombre, Apellido, Email, Rol, Estado 
FROM Usuarios 
WHERE Estado = 'Activo'
ORDER BY Rol, Nombre;

PRINT '============================================='
PRINT 'ACTUALIZACIÓN DE ROLES COMPLETADA'
PRINT 'Roles disponibles:';
PRINT '- Administrador';
PRINT '- Operador Totes';
PRINT '- Operador Preparados';
PRINT '- Operador Despacho';
PRINT '============================================='
GO