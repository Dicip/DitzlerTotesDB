-- Script para agregar triggers de sincronización de datos
-- Ejecutar este script en la base de datos Ditzler
-- Fecha: $(date)

USE Ditzler;
GO

-- =============================================
-- TRIGGERS PARA SINCRONIZACIÓN DE DATOS
-- =============================================

-- Trigger para actualizar nombres de clientes en Totes cuando se modifica Clientes
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_Clientes_UpdateTotes')
BEGIN
    EXEC('CREATE TRIGGER TR_Clientes_UpdateTotes
    ON Clientes
    AFTER UPDATE
    AS
    BEGIN
        -- Solo actualizar si cambió el nombre de la empresa
        IF UPDATE(nombre_empresa)
        BEGIN
            UPDATE Totes
            SET Cliente = i.nombre_empresa,
                FechaModificacion = GETDATE(),
                UsuarioModificacion = ''sistema''
            FROM Totes t
            INNER JOIN inserted i ON t.Cliente = (SELECT nombre_empresa FROM deleted WHERE id = i.id)
            WHERE t.Activo = 1;
        END
    END');
    
    PRINT 'Trigger TR_Clientes_UpdateTotes creado.';
END
ELSE
BEGIN
    PRINT 'Trigger TR_Clientes_UpdateTotes ya existe.';
END
GO

-- Trigger para actualizar nombres de operadores en Totes cuando se modifica Usuarios
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_Usuarios_UpdateTotes')
BEGIN
    EXEC('CREATE TRIGGER TR_Usuarios_UpdateTotes
    ON Usuarios
    AFTER UPDATE
    AS
    BEGIN
        -- Solo actualizar si cambió el nombre o apellido
        IF UPDATE(Nombre) OR UPDATE(Apellido)
        BEGIN
            UPDATE Totes
            SET Operador = i.Nombre + '' '' + i.Apellido,
                FechaModificacion = GETDATE(),
                UsuarioModificacion = ''sistema''
            FROM Totes t
            INNER JOIN inserted i ON t.Operador = (SELECT Nombre + '' '' + Apellido FROM deleted WHERE Id = i.Id)
            WHERE t.Activo = 1;
        END
    END');
    
    PRINT 'Trigger TR_Usuarios_UpdateTotes creado.';
END
ELSE
BEGIN
    PRINT 'Trigger TR_Usuarios_UpdateTotes ya existe.';
END
GO

PRINT '============================================='
PRINT 'TRIGGERS DE SINCRONIZACIÓN COMPLETADOS'
PRINT '============================================='
PRINT 'Los cambios en nombres de clientes y usuarios'
PRINT 'ahora se reflejarán automáticamente en Totes'
PRINT '============================================='