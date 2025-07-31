-- =============================================
-- SCRIPT DE TABLA TOTES
-- Sistema de Gestión de Totes - Ditzler
-- Tabla: Totes
-- Incluye: Funciones, Tabla, Índices, Restricciones, Procedimientos
-- =============================================

USE Ditzler;
GO

-- =============================================
-- FUNCIONES RELACIONADAS CON TOTES
-- =============================================

-- Función para generar código de tote
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'FN' AND name = 'FN_GenerarCodigoTote')
BEGIN
    EXEC('CREATE FUNCTION FN_GenerarCodigoTote()
    RETURNS NVARCHAR(20)
    AS
    BEGIN
        DECLARE @codigo NVARCHAR(20);
        DECLARE @contador INT;
        
        -- Obtener el siguiente número secuencial
        SELECT @contador = ISNULL(MAX(CAST(SUBSTRING(Codigo, 6, LEN(Codigo)-5) AS INT)), 0) + 1
        FROM Totes 
        WHERE Codigo LIKE ''TOTE-%'' AND ISNUMERIC(SUBSTRING(Codigo, 6, LEN(Codigo)-5)) = 1;
        
        -- Generar código con formato TOTE-XXXX
        SET @codigo = ''TOTE-'' + RIGHT(''0000'' + CAST(@contador AS NVARCHAR), 4);
        
        RETURN @codigo;
    END');
    PRINT 'Función FN_GenerarCodigoTote creada.';
END
GO

-- Función para calcular días hasta vencimiento
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'FN' AND name = 'FN_DiasHastaVencimiento')
BEGIN
    EXEC('CREATE FUNCTION FN_DiasHastaVencimiento(@fechaVencimiento DATETIME)
    RETURNS INT
    AS
    BEGIN
        DECLARE @dias INT;
        
        IF @fechaVencimiento IS NULL
            SET @dias = NULL;
        ELSE
            SET @dias = DATEDIFF(day, GETDATE(), @fechaVencimiento);
        
        RETURN @dias;
    END');
    PRINT 'Función FN_DiasHastaVencimiento creada.';
END
GO

-- =============================================
-- TABLA DE TOTES
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Totes' AND xtype='U')
BEGIN
    CREATE TABLE Totes (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Codigo NVARCHAR(50) NOT NULL UNIQUE,
        Estado NVARCHAR(20) NOT NULL DEFAULT 'Disponible',
        Ubicacion NVARCHAR(100) NULL,
        Cliente NVARCHAR(255) NULL,
        Operador NVARCHAR(255) NULL,
        Producto NVARCHAR(255) NULL,
        Lote NVARCHAR(100) NULL,
        FechaEnvasado DATETIME NULL,
        FechaVencimiento DATETIME NULL,
        FechaDespacho DATETIME NULL,
        Alerta NVARCHAR(20) NULL,
        UsuarioCreacion NVARCHAR(255) NULL,
        FechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
        FechaModificacion DATETIME NOT NULL DEFAULT GETDATE(),
        Activo BIT NOT NULL DEFAULT 1,
        Observaciones NVARCHAR(MAX) NULL,
        Peso DECIMAL(10,2) NULL -- Peso del tote en kilogramos
    );
    PRINT 'Tabla Totes creada exitosamente.';
END
GO

-- Agregar columna Peso si no existe (para tablas existentes)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('Totes') AND name = 'Peso')
BEGIN
    ALTER TABLE Totes ADD Peso DECIMAL(10,2) NULL;
    PRINT 'Columna Peso agregada a la tabla Totes.';
END
GO

-- =============================================
-- ÍNDICES PARA TABLA TOTES
-- =============================================

-- Índice único en Código
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_Totes_Codigo')
BEGIN
    CREATE UNIQUE INDEX UQ_Totes_Codigo ON Totes(Codigo);
    PRINT 'Índice único UQ_Totes_Codigo creado.';
END
GO

-- Índice en Estado
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Totes_Estado')
BEGIN
    CREATE INDEX IX_Totes_Estado ON Totes(Estado);
    PRINT 'Índice IX_Totes_Estado creado.';
END
GO

-- Índice en Cliente
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Totes_Cliente')
BEGIN
    CREATE INDEX IX_Totes_Cliente ON Totes(Cliente);
    PRINT 'Índice IX_Totes_Cliente creado.';
END
GO

-- Índice en Ubicación
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Totes_Ubicacion')
BEGIN
    CREATE INDEX IX_Totes_Ubicacion ON Totes(Ubicacion);
    PRINT 'Índice IX_Totes_Ubicacion creado.';
END
GO

-- Índice en Fecha de Vencimiento
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Totes_FechaVencimiento')
BEGIN
    CREATE INDEX IX_Totes_FechaVencimiento ON Totes(FechaVencimiento);
    PRINT 'Índice IX_Totes_FechaVencimiento creado.';
END
GO

-- Índice en Fecha de Despacho
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Totes_FechaDespacho')
BEGIN
    CREATE INDEX IX_Totes_FechaDespacho ON Totes(FechaDespacho);
    PRINT 'Índice IX_Totes_FechaDespacho creado.';
END
GO

-- Índice en Activo
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Totes_Activo')
BEGIN
    CREATE INDEX IX_Totes_Activo ON Totes(Activo);
    PRINT 'Índice IX_Totes_Activo creado.';
END
GO

-- Índice en Operador
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Totes_Operador')
BEGIN
    CREATE INDEX IX_Totes_Operador ON Totes(Operador);
    PRINT 'Índice IX_Totes_Operador creado.';
END
GO

-- Índice en Producto
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Totes_Producto')
BEGIN
    CREATE INDEX IX_Totes_Producto ON Totes(Producto);
    PRINT 'Índice IX_Totes_Producto creado.';
END
GO

-- Índice en Lote
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Totes_Lote')
BEGIN
    CREATE INDEX IX_Totes_Lote ON Totes(Lote);
    PRINT 'Índice IX_Totes_Lote creado.';
END
GO

-- Índice compuesto para consultas de dashboard
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Totes_Dashboard')
BEGIN
    CREATE INDEX IX_Totes_Dashboard ON Totes(Activo, Estado, FechaVencimiento, FechaDespacho);
    PRINT 'Índice compuesto IX_Totes_Dashboard creado.';
END
GO

-- =============================================
-- RESTRICCIONES PARA TABLA TOTES
-- =============================================

-- Restricción de estado válido
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Totes_Estado_Valid')
BEGIN
    ALTER TABLE Totes ADD CONSTRAINT CK_Totes_Estado_Valid CHECK (Estado IN ('Disponible', 'En Uso', 'Mantenimiento', 'Fuera de Servicio'));
    PRINT 'Restricción CK_Totes_Estado_Valid creada.';
END
GO

-- Restricción de alerta válida
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Totes_Alerta_Valid')
BEGIN
    ALTER TABLE Totes ADD CONSTRAINT CK_Totes_Alerta_Valid CHECK (Alerta IS NULL OR Alerta IN ('Baja', 'Media', 'Alta', 'Crítica'));
    PRINT 'Restricción CK_Totes_Alerta_Valid creada.';
END
GO

-- Restricción de longitud de código
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Totes_Codigo_Length')
BEGIN
    ALTER TABLE Totes ADD CONSTRAINT CK_Totes_Codigo_Length CHECK (LEN(Codigo) >= 3 AND LEN(Codigo) <= 50);
    PRINT 'Restricción CK_Totes_Codigo_Length creada.';
END
GO

-- Restricción de fecha de envasado no futura
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Totes_FechaEnvasado_Valid')
BEGIN
    ALTER TABLE Totes ADD CONSTRAINT CK_Totes_FechaEnvasado_Valid CHECK (FechaEnvasado IS NULL OR FechaEnvasado <= GETDATE());
    PRINT 'Restricción CK_Totes_FechaEnvasado_Valid creada.';
END
GO

-- Restricción de fecha de vencimiento posterior a envasado
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Totes_FechaVencimiento_Valid')
BEGIN
    ALTER TABLE Totes ADD CONSTRAINT CK_Totes_FechaVencimiento_Valid CHECK (FechaVencimiento IS NULL OR FechaEnvasado IS NULL OR FechaVencimiento >= FechaEnvasado);
    PRINT 'Restricción CK_Totes_FechaVencimiento_Valid creada.';
END
GO

-- =============================================
-- PROCEDIMIENTOS ALMACENADOS PARA TOTES
-- =============================================

-- Procedimiento para buscar totes
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_BuscarTotes')
BEGIN
    EXEC('CREATE PROCEDURE SP_BuscarTotes
        @codigo NVARCHAR(50) = NULL,
        @estado NVARCHAR(20) = NULL,
        @cliente NVARCHAR(255) = NULL,
        @ubicacion NVARCHAR(100) = NULL,
        @operador NVARCHAR(255) = NULL,
        @producto NVARCHAR(255) = NULL,
        @lote NVARCHAR(100) = NULL,
        @fechaDesde DATETIME = NULL,
        @fechaHasta DATETIME = NULL,
        @soloActivos BIT = 1
    AS
    BEGIN
        SET NOCOUNT ON;
        
        SELECT 
            Id, Codigo, Estado, Ubicacion, Cliente, Operador, Producto, Lote,
            FechaEnvasado, FechaVencimiento, FechaDespacho, Alerta, UsuarioCreacion,
            FechaCreacion, FechaModificacion, Activo, Observaciones,
            dbo.FN_DiasHastaVencimiento(FechaVencimiento) as DiasHastaVencimiento
        FROM Totes
        WHERE (@codigo IS NULL OR Codigo LIKE ''%'' + @codigo + ''%'')
          AND (@estado IS NULL OR Estado = @estado)
          AND (@cliente IS NULL OR Cliente LIKE ''%'' + @cliente + ''%'')
          AND (@ubicacion IS NULL OR Ubicacion LIKE ''%'' + @ubicacion + ''%'')
          AND (@operador IS NULL OR Operador LIKE ''%'' + @operador + ''%'')
          AND (@producto IS NULL OR Producto LIKE ''%'' + @producto + ''%'')
          AND (@lote IS NULL OR Lote LIKE ''%'' + @lote + ''%'')
          AND (@fechaDesde IS NULL OR FechaCreacion >= @fechaDesde)
          AND (@fechaHasta IS NULL OR FechaCreacion <= @fechaHasta)
          AND (@soloActivos = 0 OR Activo = 1)
        ORDER BY FechaCreacion DESC;
    END');
    PRINT 'Procedimiento SP_BuscarTotes creado.';
END
GO

-- Procedimiento para crear tote
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_CrearTote')
BEGIN
    EXEC('CREATE PROCEDURE SP_CrearTote
        @codigo NVARCHAR(50) = NULL,
        @estado NVARCHAR(20) = ''Disponible'',
        @ubicacion NVARCHAR(100) = NULL,
        @cliente NVARCHAR(255) = NULL,
        @operador NVARCHAR(255) = NULL,
        @producto NVARCHAR(255) = NULL,
        @lote NVARCHAR(100) = NULL,
        @fechaEnvasado DATETIME = NULL,
        @fechaVencimiento DATETIME = NULL,
        @fechaDespacho DATETIME = NULL,
        @alerta NVARCHAR(20) = NULL,
        @usuarioCreacion NVARCHAR(255) = NULL,
        @observaciones NVARCHAR(MAX) = NULL
    AS
    BEGIN
        SET NOCOUNT ON;
        
        -- Generar código automáticamente si no se proporciona
        IF @codigo IS NULL OR @codigo = ''''
        BEGIN
            SET @codigo = dbo.FN_GenerarCodigoTote();
        END
        
        -- Validar que no exista el código
        IF EXISTS (SELECT 1 FROM Totes WHERE Codigo = @codigo)
        BEGIN
            RAISERROR(''Ya existe un tote con ese código'', 16, 1);
            RETURN;
        END
        
        INSERT INTO Totes (
            Codigo, Estado, Ubicacion, Cliente, Operador, Producto, Lote,
            FechaEnvasado, FechaVencimiento, FechaDespacho, Alerta, UsuarioCreacion,
            FechaCreacion, FechaModificacion, Activo, Observaciones
        )
        VALUES (
            @codigo, @estado, @ubicacion, @cliente, @operador, @producto, @lote,
            @fechaEnvasado, @fechaVencimiento, @fechaDespacho, @alerta, @usuarioCreacion,
            GETDATE(), GETDATE(), 1, @observaciones
        );
        
        SELECT SCOPE_IDENTITY() as ToteId, @codigo as Codigo;
    END');
    PRINT 'Procedimiento SP_CrearTote creado.';
END
GO

-- Procedimiento para actualizar tote
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_ActualizarTote')
BEGIN
    EXEC('CREATE PROCEDURE SP_ActualizarTote
        @id INT,
        @codigo NVARCHAR(50),
        @estado NVARCHAR(20),
        @ubicacion NVARCHAR(100) = NULL,
        @cliente NVARCHAR(255) = NULL,
        @operador NVARCHAR(255) = NULL,
        @producto NVARCHAR(255) = NULL,
        @lote NVARCHAR(100) = NULL,
        @fechaEnvasado DATETIME = NULL,
        @fechaVencimiento DATETIME = NULL,
        @fechaDespacho DATETIME = NULL,
        @alerta NVARCHAR(20) = NULL,
        @activo BIT = 1,
        @observaciones NVARCHAR(MAX) = NULL
    AS
    BEGIN
        SET NOCOUNT ON;
        
        -- Validar que el tote existe
        IF NOT EXISTS (SELECT 1 FROM Totes WHERE Id = @id)
        BEGIN
            RAISERROR(''Tote no encontrado'', 16, 1);
            RETURN;
        END
        
        -- Validar código único
        IF EXISTS (SELECT 1 FROM Totes WHERE Codigo = @codigo AND Id != @id)
        BEGIN
            RAISERROR(''Ya existe otro tote con ese código'', 16, 1);
            RETURN;
        END
        
        UPDATE Totes 
        SET Codigo = @codigo,
            Estado = @estado,
            Ubicacion = @ubicacion,
            Cliente = @cliente,
            Operador = @operador,
            Producto = @producto,
            Lote = @lote,
            FechaEnvasado = @fechaEnvasado,
            FechaVencimiento = @fechaVencimiento,
            FechaDespacho = @fechaDespacho,
            Alerta = @alerta,
            Activo = @activo,
            Observaciones = @observaciones,
            FechaModificacion = GETDATE()
        WHERE Id = @id;
    END');
    PRINT 'Procedimiento SP_ActualizarTote creado.';
END
GO

-- Procedimiento para estadísticas del dashboard
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_EstadisticasDashboard')
BEGIN
    EXEC('CREATE PROCEDURE SP_EstadisticasDashboard
    AS
    BEGIN
        SET NOCOUNT ON;
        
        -- Total de totes activos
        SELECT COUNT(*) as TotalTotes FROM Totes WHERE Activo = 1;
        
        -- Totes disponibles
        SELECT COUNT(*) as TotesDisponibles FROM Totes WHERE Activo = 1 AND Estado = ''Disponible'';
        
        -- Totes en uso
        SELECT COUNT(*) as TotesEnUso FROM Totes WHERE Activo = 1 AND Estado = ''En Uso'';
        
        -- Totes en mantenimiento
        SELECT COUNT(*) as TotesMantenimiento FROM Totes WHERE Activo = 1 AND Estado = ''Mantenimiento'';
        
        -- Totes fuera de plazo
        SELECT COUNT(*) as TotesFueraPlazo 
        FROM Totes 
        WHERE Activo = 1 
          AND Estado = ''En Uso''
          AND (
              (FechaDespacho IS NOT NULL AND DATEDIFF(day, FechaDespacho, GETDATE()) >= 30)
              OR (FechaVencimiento IS NOT NULL AND FechaVencimiento < GETDATE())
          );
        
        -- Totes por vencer (próximos 7 días)
        SELECT COUNT(*) as TotesPorVencer
        FROM Totes 
        WHERE Activo = 1 
          AND FechaVencimiento IS NOT NULL 
          AND FechaVencimiento BETWEEN GETDATE() AND DATEADD(day, 7, GETDATE());
        
        -- Distribución por estado
        SELECT Estado, COUNT(*) as Cantidad 
        FROM Totes 
        WHERE Activo = 1 
        GROUP BY Estado;
        
        -- Top 5 clientes con más totes
        SELECT TOP 5 Cliente, COUNT(*) as Cantidad 
        FROM Totes 
        WHERE Activo = 1 AND Cliente IS NOT NULL 
        GROUP BY Cliente 
        ORDER BY COUNT(*) DESC;
        
        -- Totes creados por mes (últimos 6 meses)
        SELECT 
            FORMAT(FechaCreacion, ''yyyy-MM'') as Mes,
            COUNT(*) as TotesCreados
        FROM Totes 
        WHERE FechaCreacion >= DATEADD(MONTH, -6, GETDATE())
        GROUP BY FORMAT(FechaCreacion, ''yyyy-MM'')
        ORDER BY Mes;
    END');
    PRINT 'Procedimiento SP_EstadisticasDashboard creado.';
END
GO

-- Procedimiento para obtener totes fuera de plazo
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_TotesFueraPlazo')
BEGIN
    EXEC('CREATE PROCEDURE SP_TotesFueraPlazo
    AS
    BEGIN
        SET NOCOUNT ON;
        
        SELECT 
            Id, Codigo, Estado, Ubicacion, Cliente, Operador, Producto, Lote,
            FechaEnvasado, FechaVencimiento, FechaDespacho, Alerta,
            CASE 
                WHEN FechaDespacho IS NOT NULL AND DATEDIFF(day, FechaDespacho, GETDATE()) >= 30 
                THEN ''Más de 30 días desde despacho''
                WHEN FechaVencimiento IS NOT NULL AND FechaVencimiento < GETDATE() 
                THEN ''Fecha de vencimiento expirada''
                ELSE ''Otro''
            END as MotivoFueraPlazo,
            CASE 
                WHEN FechaDespacho IS NOT NULL 
                THEN DATEDIFF(day, FechaDespacho, GETDATE())
                ELSE NULL
            END as DiasDesdeDespacho,
            CASE 
                WHEN FechaVencimiento IS NOT NULL 
                THEN DATEDIFF(day, GETDATE(), FechaVencimiento)
                ELSE NULL
            END as DiasHastaVencimiento
        FROM Totes 
        WHERE Activo = 1 
          AND Estado = ''En Uso''
          AND (
              (FechaDespacho IS NOT NULL AND DATEDIFF(day, FechaDespacho, GETDATE()) >= 30)
              OR (FechaVencimiento IS NOT NULL AND FechaVencimiento < GETDATE())
          )
        ORDER BY FechaDespacho DESC, FechaVencimiento ASC;
    END');
    PRINT 'Procedimiento SP_TotesFueraPlazo creado.';
END
GO

PRINT '=============================================';
PRINT 'SCRIPT DE TABLA TOTES COMPLETADO';
PRINT 'Funciones: 2 creadas';
PRINT 'Tabla: Totes';
PRINT 'Índices: 11 creados';
PRINT 'Restricciones: 5 creadas';
PRINT 'Procedimientos: 5 creados';
PRINT '=============================================';
GO