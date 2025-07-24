-- =============================================
-- SCRIPT DE TABLA EVENTOS
-- Sistema de Gestión de Totes - Ditzler
-- Tabla: Eventos
-- Incluye: Tabla, Índices, Restricciones, Procedimientos
-- =============================================

USE Ditzler;
GO

-- =============================================
-- TABLA DE EVENTOS
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Eventos' AND xtype='U')
BEGIN
    CREATE TABLE Eventos (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        ToteId INT NULL,
        TipEvento NVARCHAR(50) NOT NULL,
        Descripcion NVARCHAR(500) NOT NULL,
        Usuario NVARCHAR(255) NULL,
        FechaEvento DATETIME NOT NULL DEFAULT GETDATE(),
        DatosAdicionales NVARCHAR(MAX) NULL,
        IpAddress NVARCHAR(45) NULL,
        UserAgent NVARCHAR(500) NULL,
        Severidad NVARCHAR(20) NOT NULL DEFAULT 'Info',
        Modulo NVARCHAR(50) NULL,
        Accion NVARCHAR(100) NULL,
        ResultadoExitoso BIT NOT NULL DEFAULT 1,
        TiempoEjecucion INT NULL,
        SessionId NVARCHAR(100) NULL
    );
    PRINT 'Tabla Eventos creada exitosamente.';
END
GO

-- =============================================
-- ÍNDICES PARA TABLA EVENTOS
-- =============================================

-- Índice en ToteId
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Eventos_ToteId')
BEGIN
    CREATE INDEX IX_Eventos_ToteId ON Eventos(ToteId);
    PRINT 'Índice IX_Eventos_ToteId creado.';
END
GO

-- Índice en Tipo de Evento
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Eventos_TipEvento')
BEGIN
    CREATE INDEX IX_Eventos_TipEvento ON Eventos(TipEvento);
    PRINT 'Índice IX_Eventos_TipEvento creado.';
END
GO

-- Índice en Usuario
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Eventos_Usuario')
BEGIN
    CREATE INDEX IX_Eventos_Usuario ON Eventos(Usuario);
    PRINT 'Índice IX_Eventos_Usuario creado.';
END
GO

-- Índice en Fecha de Evento
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Eventos_FechaEvento')
BEGIN
    CREATE INDEX IX_Eventos_FechaEvento ON Eventos(FechaEvento);
    PRINT 'Índice IX_Eventos_FechaEvento creado.';
END
GO

-- Índice en Severidad
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Eventos_Severidad')
BEGIN
    CREATE INDEX IX_Eventos_Severidad ON Eventos(Severidad);
    PRINT 'Índice IX_Eventos_Severidad creado.';
END
GO

-- Índice en Módulo
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Eventos_Modulo')
BEGIN
    CREATE INDEX IX_Eventos_Modulo ON Eventos(Modulo);
    PRINT 'Índice IX_Eventos_Modulo creado.';
END
GO

-- Índice en Acción
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Eventos_Accion')
BEGIN
    CREATE INDEX IX_Eventos_Accion ON Eventos(Accion);
    PRINT 'Índice IX_Eventos_Accion creado.';
END
GO

-- Índice en Resultado Exitoso
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Eventos_ResultadoExitoso')
BEGIN
    CREATE INDEX IX_Eventos_ResultadoExitoso ON Eventos(ResultadoExitoso);
    PRINT 'Índice IX_Eventos_ResultadoExitoso creado.';
END
GO

-- Índice compuesto para consultas de auditoría
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Eventos_Auditoria')
BEGIN
    CREATE INDEX IX_Eventos_Auditoria ON Eventos(FechaEvento, Usuario, TipEvento, Severidad);
    PRINT 'Índice compuesto IX_Eventos_Auditoria creado.';
END
GO

-- Índice compuesto para consultas por tote
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Eventos_ToteHistorial')
BEGIN
    CREATE INDEX IX_Eventos_ToteHistorial ON Eventos(ToteId, FechaEvento, TipEvento);
    PRINT 'Índice compuesto IX_Eventos_ToteHistorial creado.';
END
GO

-- =============================================
-- RESTRICCIONES PARA TABLA EVENTOS
-- =============================================

-- Restricción de tipo de evento válido
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Eventos_TipEvento_Valid')
BEGIN
    ALTER TABLE Eventos ADD CONSTRAINT CK_Eventos_TipEvento_Valid CHECK (TipEvento IN (
        'Creacion', 'Actualizacion', 'Eliminacion', 'CambioEstado', 'Despacho', 
        'Recepcion', 'Mantenimiento', 'Login', 'Logout', 'Error', 'Alerta', 
        'Backup', 'Restauracion', 'Configuracion', 'Reporte', 'Exportacion', 
        'Importacion', 'Sincronizacion', 'Validacion', 'Notificacion'
    ));
    PRINT 'Restricción CK_Eventos_TipEvento_Valid creada.';
END
GO

-- Restricción de severidad válida
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Eventos_Severidad_Valid')
BEGIN
    ALTER TABLE Eventos ADD CONSTRAINT CK_Eventos_Severidad_Valid CHECK (Severidad IN ('Debug', 'Info', 'Warning', 'Error', 'Critical'));
    PRINT 'Restricción CK_Eventos_Severidad_Valid creada.';
END
GO

-- Restricción de longitud de descripción
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Eventos_Descripcion_Length')
BEGIN
    ALTER TABLE Eventos ADD CONSTRAINT CK_Eventos_Descripcion_Length CHECK (LEN(Descripcion) >= 5 AND LEN(Descripcion) <= 500);
    PRINT 'Restricción CK_Eventos_Descripcion_Length creada.';
END
GO

-- Restricción de tiempo de ejecución válido
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Eventos_TiempoEjecucion_Valid')
BEGIN
    ALTER TABLE Eventos ADD CONSTRAINT CK_Eventos_TiempoEjecucion_Valid CHECK (TiempoEjecucion IS NULL OR TiempoEjecucion >= 0);
    PRINT 'Restricción CK_Eventos_TiempoEjecucion_Valid creada.';
END
GO

-- Restricción de formato de IP válida
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Eventos_IpAddress_Valid')
BEGIN
    ALTER TABLE Eventos ADD CONSTRAINT CK_Eventos_IpAddress_Valid CHECK (
        IpAddress IS NULL OR 
        (LEN(IpAddress) >= 7 AND LEN(IpAddress) <= 45)
    );
    PRINT 'Restricción CK_Eventos_IpAddress_Valid creada.';
END
GO

-- =============================================
-- CLAVE FORÁNEA PARA TABLA EVENTOS
-- =============================================

-- Clave foránea hacia tabla Totes
IF NOT EXISTS (SELECT * FROM sys.foreign_keys WHERE name = 'FK_Eventos_Totes')
BEGIN
    ALTER TABLE Eventos ADD CONSTRAINT FK_Eventos_Totes FOREIGN KEY (ToteId) REFERENCES Totes(Id);
    PRINT 'Clave foránea FK_Eventos_Totes creada.';
END
GO

-- =============================================
-- PROCEDIMIENTOS ALMACENADOS PARA EVENTOS
-- =============================================

-- Procedimiento para registrar evento
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_RegistrarEvento')
BEGIN
    EXEC('CREATE PROCEDURE SP_RegistrarEvento
        @toteId INT = NULL,
        @tipEvento NVARCHAR(50),
        @descripcion NVARCHAR(500),
        @usuario NVARCHAR(255) = NULL,
        @datosAdicionales NVARCHAR(MAX) = NULL,
        @ipAddress NVARCHAR(45) = NULL,
        @userAgent NVARCHAR(500) = NULL,
        @severidad NVARCHAR(20) = ''Info'',
        @modulo NVARCHAR(50) = NULL,
        @accion NVARCHAR(100) = NULL,
        @resultadoExitoso BIT = 1,
        @tiempoEjecucion INT = NULL,
        @sessionId NVARCHAR(100) = NULL
    AS
    BEGIN
        SET NOCOUNT ON;
        
        -- Validar que el tote existe si se proporciona ToteId
        IF @toteId IS NOT NULL AND NOT EXISTS (SELECT 1 FROM Totes WHERE Id = @toteId)
        BEGIN
            RAISERROR(''El Tote especificado no existe'', 16, 1);
            RETURN;
        END
        
        INSERT INTO Eventos (
            ToteId, TipEvento, Descripcion, Usuario, FechaEvento, DatosAdicionales,
            IpAddress, UserAgent, Severidad, Modulo, Accion, ResultadoExitoso,
            TiempoEjecucion, SessionId
        )
        VALUES (
            @toteId, @tipEvento, @descripcion, @usuario, GETDATE(), @datosAdicionales,
            @ipAddress, @userAgent, @severidad, @modulo, @accion, @resultadoExitoso,
            @tiempoEjecucion, @sessionId
        );
        
        SELECT SCOPE_IDENTITY() as EventoId;
    END');
    PRINT 'Procedimiento SP_RegistrarEvento creado.';
END
GO

-- Procedimiento para buscar eventos
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_BuscarEventos')
BEGIN
    EXEC('CREATE PROCEDURE SP_BuscarEventos
        @toteId INT = NULL,
        @tipEvento NVARCHAR(50) = NULL,
        @usuario NVARCHAR(255) = NULL,
        @severidad NVARCHAR(20) = NULL,
        @modulo NVARCHAR(50) = NULL,
        @accion NVARCHAR(100) = NULL,
        @fechaDesde DATETIME = NULL,
        @fechaHasta DATETIME = NULL,
        @resultadoExitoso BIT = NULL,
        @top INT = 1000
    AS
    BEGIN
        SET NOCOUNT ON;
        
        SELECT TOP (@top)
            e.Id, e.ToteId, t.Codigo as CodigoTote, e.TipEvento, e.Descripcion,
            e.Usuario, e.FechaEvento, e.DatosAdicionales, e.IpAddress, e.UserAgent,
            e.Severidad, e.Modulo, e.Accion, e.ResultadoExitoso, e.TiempoEjecucion,
            e.SessionId
        FROM Eventos e
        LEFT JOIN Totes t ON e.ToteId = t.Id
        WHERE (@toteId IS NULL OR e.ToteId = @toteId)
          AND (@tipEvento IS NULL OR e.TipEvento = @tipEvento)
          AND (@usuario IS NULL OR e.Usuario LIKE ''%'' + @usuario + ''%'')
          AND (@severidad IS NULL OR e.Severidad = @severidad)
          AND (@modulo IS NULL OR e.Modulo = @modulo)
          AND (@accion IS NULL OR e.Accion LIKE ''%'' + @accion + ''%'')
          AND (@fechaDesde IS NULL OR e.FechaEvento >= @fechaDesde)
          AND (@fechaHasta IS NULL OR e.FechaEvento <= @fechaHasta)
          AND (@resultadoExitoso IS NULL OR e.ResultadoExitoso = @resultadoExitoso)
        ORDER BY e.FechaEvento DESC;
    END');
    PRINT 'Procedimiento SP_BuscarEventos creado.';
END
GO

-- Procedimiento para obtener historial de un tote
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_HistorialTote')
BEGIN
    EXEC('CREATE PROCEDURE SP_HistorialTote
        @toteId INT
    AS
    BEGIN
        SET NOCOUNT ON;
        
        -- Validar que el tote existe
        IF NOT EXISTS (SELECT 1 FROM Totes WHERE Id = @toteId)
        BEGIN
            RAISERROR(''El Tote especificado no existe'', 16, 1);
            RETURN;
        END
        
        -- Información del tote
        SELECT 
            Id, Codigo, Estado, Ubicacion, Cliente, Operador, Producto, Lote,
            FechaEnvasado, FechaVencimiento, FechaDespacho, Alerta, UsuarioCreacion,
            FechaCreacion, FechaModificacion, Activo, Observaciones
        FROM Totes 
        WHERE Id = @toteId;
        
        -- Historial de eventos
        SELECT 
            Id, TipEvento, Descripcion, Usuario, FechaEvento, DatosAdicionales,
            IpAddress, Severidad, Modulo, Accion, ResultadoExitoso, TiempoEjecucion
        FROM Eventos 
        WHERE ToteId = @toteId
        ORDER BY FechaEvento DESC;
    END');
    PRINT 'Procedimiento SP_HistorialTote creado.';
END
GO

-- Procedimiento para estadísticas de eventos
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_EstadisticasEventos')
BEGIN
    EXEC('CREATE PROCEDURE SP_EstadisticasEventos
        @fechaDesde DATETIME = NULL,
        @fechaHasta DATETIME = NULL
    AS
    BEGIN
        SET NOCOUNT ON;
        
        -- Si no se especifican fechas, usar últimos 30 días
        IF @fechaDesde IS NULL
            SET @fechaDesde = DATEADD(DAY, -30, GETDATE());
        IF @fechaHasta IS NULL
            SET @fechaHasta = GETDATE();
        
        -- Total de eventos en el período
        SELECT COUNT(*) as TotalEventos 
        FROM Eventos 
        WHERE FechaEvento BETWEEN @fechaDesde AND @fechaHasta;
        
        -- Eventos por tipo
        SELECT TipEvento, COUNT(*) as Cantidad 
        FROM Eventos 
        WHERE FechaEvento BETWEEN @fechaDesde AND @fechaHasta
        GROUP BY TipEvento 
        ORDER BY COUNT(*) DESC;
        
        -- Eventos por severidad
        SELECT Severidad, COUNT(*) as Cantidad 
        FROM Eventos 
        WHERE FechaEvento BETWEEN @fechaDesde AND @fechaHasta
        GROUP BY Severidad 
        ORDER BY 
            CASE Severidad 
                WHEN ''Critical'' THEN 1
                WHEN ''Error'' THEN 2
                WHEN ''Warning'' THEN 3
                WHEN ''Info'' THEN 4
                WHEN ''Debug'' THEN 5
            END;
        
        -- Eventos por usuario (top 10)
        SELECT TOP 10 Usuario, COUNT(*) as Cantidad 
        FROM Eventos 
        WHERE FechaEvento BETWEEN @fechaDesde AND @fechaHasta
          AND Usuario IS NOT NULL
        GROUP BY Usuario 
        ORDER BY COUNT(*) DESC;
        
        -- Eventos por módulo
        SELECT Modulo, COUNT(*) as Cantidad 
        FROM Eventos 
        WHERE FechaEvento BETWEEN @fechaDesde AND @fechaHasta
          AND Modulo IS NOT NULL
        GROUP BY Modulo 
        ORDER BY COUNT(*) DESC;
        
        -- Eventos por día
        SELECT 
            CAST(FechaEvento AS DATE) as Fecha,
            COUNT(*) as Cantidad
        FROM Eventos 
        WHERE FechaEvento BETWEEN @fechaDesde AND @fechaHasta
        GROUP BY CAST(FechaEvento AS DATE)
        ORDER BY Fecha;
        
        -- Eventos fallidos
        SELECT COUNT(*) as EventosFallidos 
        FROM Eventos 
        WHERE FechaEvento BETWEEN @fechaDesde AND @fechaHasta
          AND ResultadoExitoso = 0;
        
        -- Tiempo promedio de ejecución por tipo de evento
        SELECT 
            TipEvento,
            AVG(CAST(TiempoEjecucion AS FLOAT)) as TiempoPromedioMs,
            MIN(TiempoEjecucion) as TiempoMinimoMs,
            MAX(TiempoEjecucion) as TiempoMaximoMs,
            COUNT(*) as CantidadEventos
        FROM Eventos 
        WHERE FechaEvento BETWEEN @fechaDesde AND @fechaHasta
          AND TiempoEjecucion IS NOT NULL
        GROUP BY TipEvento 
        ORDER BY AVG(CAST(TiempoEjecucion AS FLOAT)) DESC;
    END');
    PRINT 'Procedimiento SP_EstadisticasEventos creado.';
END
GO

-- Procedimiento para limpiar eventos antiguos
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_LimpiarEventosAntiguos')
BEGIN
    EXEC('CREATE PROCEDURE SP_LimpiarEventosAntiguos
        @diasAntiguedad INT = 365,
        @mantenerCriticos BIT = 1,
        @mantenerErrores BIT = 1
    AS
    BEGIN
        SET NOCOUNT ON;
        
        DECLARE @fechaLimite DATETIME = DATEADD(DAY, -@diasAntiguedad, GETDATE());
        DECLARE @eventosEliminados INT = 0;
        
        -- Eliminar eventos antiguos según criterios
        DELETE FROM Eventos 
        WHERE FechaEvento < @fechaLimite
          AND (@mantenerCriticos = 0 OR Severidad != ''Critical'')
          AND (@mantenerErrores = 0 OR Severidad != ''Error'');
        
        SET @eventosEliminados = @@ROWCOUNT;
        
        SELECT @eventosEliminados as EventosEliminados, @fechaLimite as FechaLimite;
    END');
    PRINT 'Procedimiento SP_LimpiarEventosAntiguos creado.';
END
GO

-- Procedimiento para obtener eventos recientes
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_EventosRecientes')
BEGIN
    EXEC('CREATE PROCEDURE SP_EventosRecientes
        @cantidad INT = 50,
        @soloErrores BIT = 0
    AS
    BEGIN
        SET NOCOUNT ON;
        
        SELECT TOP (@cantidad)
            e.Id, e.ToteId, t.Codigo as CodigoTote, e.TipEvento, e.Descripcion,
            e.Usuario, e.FechaEvento, e.Severidad, e.Modulo, e.Accion, 
            e.ResultadoExitoso, e.TiempoEjecucion
        FROM Eventos e
        LEFT JOIN Totes t ON e.ToteId = t.Id
        WHERE (@soloErrores = 0 OR e.Severidad IN (''Error'', ''Critical'') OR e.ResultadoExitoso = 0)
        ORDER BY e.FechaEvento DESC;
    END');
    PRINT 'Procedimiento SP_EventosRecientes creado.';
END
GO

PRINT '=============================================';
PRINT 'SCRIPT DE TABLA EVENTOS COMPLETADO';
PRINT 'Tabla: Eventos';
PRINT 'Índices: 10 creados';
PRINT 'Restricciones: 5 creadas';
PRINT 'Clave foránea: 1 creada';
PRINT 'Procedimientos: 6 creados';
PRINT '=============================================';
GO