-- Script para crear tabla de eventos/auditoría
-- Sistema de Registro de Eventos DitzlerTotes
-- SQL Server

USE Ditzler;
GO

-- =============================================
-- TABLA DE EVENTOS/AUDITORÍA
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Eventos' AND xtype='U')
BEGIN
    CREATE TABLE Eventos (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TipoEvento NVARCHAR(50) NOT NULL, -- 'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW'
        Modulo NVARCHAR(50) NOT NULL, -- 'USUARIOS', 'TOTES', 'CLIENTES', 'SISTEMA'
        Descripcion NVARCHAR(500) NOT NULL,
        UsuarioId INT NULL, -- ID del usuario que realizó la acción
        UsuarioNombre NVARCHAR(200) NOT NULL, -- Nombre completo del usuario
        UsuarioEmail NVARCHAR(255) NULL, -- Email del usuario
        UsuarioRol NVARCHAR(20) NOT NULL, -- Rol del usuario
        ObjetoId NVARCHAR(50) NULL, -- ID del objeto afectado (ej: ID del tote, cliente, etc.)
        ObjetoTipo NVARCHAR(50) NULL, -- Tipo de objeto afectado
        ValoresAnteriores NVARCHAR(MAX) NULL, -- JSON con valores anteriores (para updates)
        ValoresNuevos NVARCHAR(MAX) NULL, -- JSON con valores nuevos
        DireccionIP NVARCHAR(45) NULL, -- IP del usuario
        UserAgent NVARCHAR(500) NULL, -- Información del navegador
        Exitoso BIT DEFAULT 1, -- Si la operación fue exitosa
        MensajeError NVARCHAR(500) NULL, -- Mensaje de error si falló
        FechaEvento DATETIME DEFAULT GETDATE(),
        Sesion NVARCHAR(100) NULL -- ID de sesión
    );
    
    -- Crear índices para optimizar consultas
    CREATE INDEX IX_Eventos_TipoEvento ON Eventos(TipoEvento);
    CREATE INDEX IX_Eventos_Modulo ON Eventos(Modulo);
    CREATE INDEX IX_Eventos_UsuarioId ON Eventos(UsuarioId);
    CREATE INDEX IX_Eventos_UsuarioEmail ON Eventos(UsuarioEmail);
    CREATE INDEX IX_Eventos_FechaEvento ON Eventos(FechaEvento);
    CREATE INDEX IX_Eventos_ObjetoId ON Eventos(ObjetoId);
    CREATE INDEX IX_Eventos_ObjetoTipo ON Eventos(ObjetoTipo);
    CREATE INDEX IX_Eventos_Exitoso ON Eventos(Exitoso);
    CREATE INDEX IX_Eventos_UsuarioRol ON Eventos(UsuarioRol);
    
    -- Índices compuestos para consultas complejas
    CREATE INDEX IX_Eventos_TipoModulo ON Eventos(TipoEvento, Modulo);
    CREATE INDEX IX_Eventos_UsuarioFecha ON Eventos(UsuarioId, FechaEvento);
    CREATE INDEX IX_Eventos_ModuloFecha ON Eventos(Modulo, FechaEvento);
    CREATE INDEX IX_Eventos_ExitosoFecha ON Eventos(Exitoso, FechaEvento);
    
    PRINT 'Tabla Eventos creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'La tabla Eventos ya existe.';
END
GO

-- =============================================
-- PROCEDIMIENTO ALMACENADO PARA REGISTRAR EVENTOS
-- =============================================
IF EXISTS (SELECT * FROM sys.procedures WHERE name = 'SP_RegistrarEvento')
BEGIN
    DROP PROCEDURE SP_RegistrarEvento;
END
GO

CREATE PROCEDURE SP_RegistrarEvento
    @TipoEvento NVARCHAR(50),
    @Modulo NVARCHAR(50),
    @Descripcion NVARCHAR(500),
    @UsuarioId INT = NULL,
    @UsuarioNombre NVARCHAR(200),
    @UsuarioEmail NVARCHAR(255) = NULL,
    @UsuarioRol NVARCHAR(20),
    @ObjetoId NVARCHAR(50) = NULL,
    @ObjetoTipo NVARCHAR(50) = NULL,
    @ValoresAnteriores NVARCHAR(MAX) = NULL,
    @ValoresNuevos NVARCHAR(MAX) = NULL,
    @DireccionIP NVARCHAR(45) = NULL,
    @UserAgent NVARCHAR(500) = NULL,
    @Exitoso BIT = 1,
    @MensajeError NVARCHAR(500) = NULL,
    @Sesion NVARCHAR(100) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO Eventos (
        TipoEvento, Modulo, Descripcion, UsuarioId, UsuarioNombre, 
        UsuarioEmail, UsuarioRol, ObjetoId, ObjetoTipo, ValoresAnteriores, 
        ValoresNuevos, DireccionIP, UserAgent, Exitoso, MensajeError, 
        FechaEvento, Sesion
    )
    VALUES (
        @TipoEvento, @Modulo, @Descripcion, @UsuarioId, @UsuarioNombre,
        @UsuarioEmail, @UsuarioRol, @ObjetoId, @ObjetoTipo, @ValoresAnteriores,
        @ValoresNuevos, @DireccionIP, @UserAgent, @Exitoso, @MensajeError,
        GETDATE(), @Sesion
    );
END
GO

PRINT 'Procedimiento almacenado SP_RegistrarEvento creado exitosamente.';
GO

-- =============================================
-- VISTA PARA CONSULTAS SIMPLIFICADAS DE EVENTOS
-- =============================================
IF EXISTS (SELECT * FROM sys.views WHERE name = 'VW_EventosResumen')
BEGIN
    DROP VIEW VW_EventosResumen;
END
GO

CREATE VIEW VW_EventosResumen AS
SELECT 
    Id,
    TipoEvento,
    Modulo,
    Descripcion,
    UsuarioNombre,
    UsuarioRol,
    ObjetoId,
    ObjetoTipo,
    Exitoso,
    FechaEvento,
    CASE 
        WHEN DATEDIFF(MINUTE, FechaEvento, GETDATE()) < 60 
        THEN CAST(DATEDIFF(MINUTE, FechaEvento, GETDATE()) AS NVARCHAR) + ' minutos atrás'
        WHEN DATEDIFF(HOUR, FechaEvento, GETDATE()) < 24 
        THEN CAST(DATEDIFF(HOUR, FechaEvento, GETDATE()) AS NVARCHAR) + ' horas atrás'
        ELSE CAST(DATEDIFF(DAY, FechaEvento, GETDATE()) AS NVARCHAR) + ' días atrás'
    END AS TiempoTranscurrido
FROM Eventos;
GO

PRINT 'Vista VW_EventosResumen creada exitosamente.';
GO

-- =============================================
-- INSERTAR EVENTO INICIAL
-- =============================================
EXEC SP_RegistrarEvento 
    @TipoEvento = 'SISTEMA',
    @Modulo = 'SISTEMA',
    @Descripcion = 'Sistema de auditoría inicializado correctamente',
    @UsuarioNombre = 'Sistema',
    @UsuarioRol = 'Sistema',
    @Exitoso = 1;

PRINT 'Sistema de eventos/auditoría configurado exitosamente.';
PRINT 'Tabla: Eventos';
PRINT 'Procedimiento: SP_RegistrarEvento';
PRINT 'Vista: VW_EventosResumen';
GO