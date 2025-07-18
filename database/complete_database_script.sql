-- Script completo de base de datos para DitzlerTotes
-- Sistema de Gestión Ditzler Chile
-- SQL Server
-- Fecha: $(date)

-- Crear la base de datos si no existe
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'Ditzler')
BEGIN
    CREATE DATABASE Ditzler;
END
GO

USE Ditzler;
GO

-- =============================================
-- TABLA DE USUARIOS
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Usuarios' AND xtype='U')
BEGIN
    CREATE TABLE Usuarios (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        Nombre NVARCHAR(100) NOT NULL,
        Apellido NVARCHAR(100) NOT NULL,
        Password NVARCHAR(255) NOT NULL,
        Email NVARCHAR(255) NOT NULL UNIQUE,
        Rol NVARCHAR(20) NOT NULL DEFAULT 'Viewer',
        Estado NVARCHAR(10) NOT NULL DEFAULT 'Active',
        FechaCreacion DATETIME DEFAULT GETDATE(),
        FechaModificacion DATETIME DEFAULT GETDATE()
    );
    
    -- Crear índices para optimizar consultas
    CREATE INDEX IX_Usuarios_Email ON Usuarios(Email);
    CREATE INDEX IX_Usuarios_Estado ON Usuarios(Estado);
    CREATE INDEX IX_Usuarios_Rol ON Usuarios(Rol);
    CREATE INDEX IX_Usuarios_FechaCreacion ON Usuarios(FechaCreacion);
    CREATE INDEX IX_Usuarios_NombreCompleto ON Usuarios(Nombre, Apellido);
    
    PRINT 'Tabla Usuarios creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'La tabla Usuarios ya existe.';
END
GO

-- =============================================
-- TABLA DE CLIENTES
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Clientes' AND xtype='U')
BEGIN
    CREATE TABLE Clientes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        logo NVARCHAR(255),
        nombre_empresa NVARCHAR(255) NOT NULL,
        contacto_principal NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NOT NULL UNIQUE,
        telefono NVARCHAR(20) NOT NULL,
        tipo NVARCHAR(50) NOT NULL,
        estado NVARCHAR(20) NOT NULL DEFAULT 'Activo',
        fecha_creacion DATETIME DEFAULT GETDATE(),
        fecha_modificacion DATETIME DEFAULT GETDATE()
    );
    
    -- Crear índices para optimizar consultas
    CREATE INDEX IX_Clientes_Email ON Clientes(email);
    CREATE INDEX IX_Clientes_Estado ON Clientes(estado);
    CREATE INDEX IX_Clientes_Tipo ON Clientes(tipo);
    CREATE INDEX IX_Clientes_NombreEmpresa ON Clientes(nombre_empresa);
    CREATE INDEX IX_Clientes_FechaCreacion ON Clientes(fecha_creacion);
    CREATE INDEX IX_Clientes_ContactoPrincipal ON Clientes(contacto_principal);
    CREATE INDEX IX_Clientes_EstadoTipo ON Clientes(estado, tipo);
    
    PRINT 'Tabla Clientes creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'La tabla Clientes ya existe.';
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
        Estado NVARCHAR(50) NOT NULL,
        Ubicacion NVARCHAR(100) NOT NULL,
        Cliente NVARCHAR(255),
        Operador NVARCHAR(100) NOT NULL,
        Producto NVARCHAR(255),
        Lote NVARCHAR(100),
        FechaEnvasado DATE,
        FechaVencimiento DATE,
        FechaDespacho DATE,
        Alerta BIT DEFAULT 0,
        Activo BIT DEFAULT 1,
        UsuarioCreacion NVARCHAR(100) DEFAULT 'admin',
        UsuarioModificacion NVARCHAR(100),
        FechaCreacion DATETIME DEFAULT GETDATE(),
        FechaModificacion DATETIME DEFAULT GETDATE()
    );
    
    -- Crear índices para optimizar consultas
    CREATE INDEX IX_Totes_Codigo ON Totes(Codigo);
    CREATE INDEX IX_Totes_Estado ON Totes(Estado);
    CREATE INDEX IX_Totes_Cliente ON Totes(Cliente);
    CREATE INDEX IX_Totes_Activo ON Totes(Activo);
    CREATE INDEX IX_Totes_FechaCreacion ON Totes(FechaCreacion);
    CREATE INDEX IX_Totes_FechaVencimiento ON Totes(FechaVencimiento);
    CREATE INDEX IX_Totes_Alerta ON Totes(Alerta);
    CREATE INDEX IX_Totes_Operador ON Totes(Operador);
    CREATE INDEX IX_Totes_Producto ON Totes(Producto);
    CREATE INDEX IX_Totes_Lote ON Totes(Lote);
    CREATE INDEX IX_Totes_FechaEnvasado ON Totes(FechaEnvasado);
    CREATE INDEX IX_Totes_FechaDespacho ON Totes(FechaDespacho);
    CREATE INDEX IX_Totes_Ubicacion ON Totes(Ubicacion);
    -- Índices compuestos para consultas complejas
    CREATE INDEX IX_Totes_EstadoActivo ON Totes(Estado, Activo);
    CREATE INDEX IX_Totes_ClienteEstado ON Totes(Cliente, Estado);
    CREATE INDEX IX_Totes_AlertaActivo ON Totes(Alerta, Activo);
    CREATE INDEX IX_Totes_VencimientoActivo ON Totes(FechaVencimiento, Activo);
    
    PRINT 'Tabla Totes creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'La tabla Totes ya existe.';
END
GO

-- =============================================
-- USUARIO ADMINISTRADOR POR DEFECTO
-- =============================================
-- Crear usuario administrador por defecto para acceso inicial
IF NOT EXISTS (SELECT * FROM Usuarios WHERE Email = 'admin@ditzler.com')
BEGIN
    INSERT INTO Usuarios (Nombre, Apellido, Password, Email, Rol, Estado, FechaCreacion, FechaModificacion)
    VALUES ('Admin', 'Sistema', 'admin123', 'admin@ditzler.com', 'Admin', 'Active', GETDATE(), GETDATE());
    
    PRINT 'Usuario administrador creado exitosamente.';
    PRINT 'Email: admin@ditzler.com';
    PRINT 'Password: admin123';
END
ELSE
BEGIN
    PRINT 'Ya existe un usuario administrador.';
END
GO

-- =============================================
-- ESTRUCTURA DE BASE DE DATOS COMPLETADA
-- =============================================
-- Las tablas están listas para recibir datos
-- Los usuarios, clientes y totes deben crearse según las necesidades del negocio

-- =============================================
-- TRIGGERS PARA ACTUALIZAR FECHA DE MODIFICACIÓN
-- =============================================

-- Trigger para tabla Usuarios
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_Usuarios_UpdateModificationDate')
BEGIN
    EXEC('CREATE TRIGGER TR_Usuarios_UpdateModificationDate
    ON Usuarios
    AFTER UPDATE
    AS
    BEGIN
        UPDATE Usuarios
        SET FechaModificacion = GETDATE()
        FROM Usuarios u
        INNER JOIN inserted i ON u.Id = i.Id;
    END');
    
    PRINT 'Trigger para Usuarios creado.';
END
GO

-- Trigger para tabla Clientes
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_Clientes_UpdateModificationDate')
BEGIN
    EXEC('CREATE TRIGGER TR_Clientes_UpdateModificationDate
    ON Clientes
    AFTER UPDATE
    AS
    BEGIN
        UPDATE Clientes
        SET fecha_modificacion = GETDATE()
        FROM Clientes c
        INNER JOIN inserted i ON c.id = i.id;
    END');
    
    PRINT 'Trigger para Clientes creado.';
END
GO

-- Trigger para tabla Totes
IF NOT EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_Totes_UpdateModificationDate')
BEGIN
    EXEC('CREATE TRIGGER TR_Totes_UpdateModificationDate
    ON Totes
    AFTER UPDATE
    AS
    BEGIN
        UPDATE Totes
        SET FechaModificacion = GETDATE()
        FROM Totes t
        INNER JOIN inserted i ON t.Id = i.Id;
    END');
    
    PRINT 'Trigger para Totes creado.';
END
GO

-- =============================================
-- VISTAS ÚTILES
-- =============================================

-- Vista para estadísticas de totes
IF NOT EXISTS (SELECT * FROM sys.views WHERE name = 'VW_TotesEstadisticas')
BEGIN
    EXEC('CREATE VIEW VW_TotesEstadisticas AS
    SELECT 
        Estado,
        COUNT(*) as Cantidad,
        COUNT(CASE WHEN Alerta = 1 THEN 1 END) as ConAlerta
    FROM Totes 
    WHERE Activo = 1
    GROUP BY Estado');
    
    PRINT 'Vista VW_TotesEstadisticas creada.';
END
GO

-- Vista para totes vencidos o próximos a vencer
IF NOT EXISTS (SELECT * FROM sys.views WHERE name = 'VW_TotesVencimiento')
BEGIN
    EXEC('CREATE VIEW VW_TotesVencimiento AS
    SELECT 
        Id,
        Codigo,
        Cliente,
        Producto,
        FechaVencimiento,
        DATEDIFF(day, GETDATE(), FechaVencimiento) as DiasParaVencer,
        CASE 
            WHEN FechaVencimiento < GETDATE() THEN ''Vencido''
            WHEN DATEDIFF(day, GETDATE(), FechaVencimiento) <= 7 THEN ''Próximo a vencer''
            ELSE ''Normal''
        END as EstadoVencimiento
    FROM Totes 
    WHERE Activo = 1 AND FechaVencimiento IS NOT NULL');
    
    PRINT 'Vista VW_TotesVencimiento creada.';
END
GO

-- =============================================
-- PROCEDIMIENTOS ALMACENADOS
-- =============================================

-- Procedimiento para buscar totes con filtros
IF NOT EXISTS (SELECT * FROM sys.procedures WHERE name = 'SP_BuscarTotes')
BEGIN
    EXEC('CREATE PROCEDURE SP_BuscarTotes
        @Codigo NVARCHAR(50) = NULL,
        @Estado NVARCHAR(50) = NULL,
        @Cliente NVARCHAR(255) = NULL,
        @FechaDesde DATE = NULL,
        @FechaHasta DATE = NULL,
        @SoloActivos BIT = 1
    AS
    BEGIN
        SELECT * FROM Totes
        WHERE (@Codigo IS NULL OR Codigo LIKE ''%'' + @Codigo + ''%'')
            AND (@Estado IS NULL OR Estado = @Estado)
            AND (@Cliente IS NULL OR Cliente LIKE ''%'' + @Cliente + ''%'')
            AND (@FechaDesde IS NULL OR FechaCreacion >= @FechaDesde)
            AND (@FechaHasta IS NULL OR FechaCreacion <= @FechaHasta)
            AND (@SoloActivos = 0 OR Activo = 1)
        ORDER BY FechaCreacion DESC;
    END');
    
    PRINT 'Procedimiento SP_BuscarTotes creado.';
END
GO

-- Procedimiento para obtener estadísticas del dashboard
IF NOT EXISTS (SELECT * FROM sys.procedures WHERE name = 'SP_EstadisticasDashboard')
BEGIN
    EXEC('CREATE PROCEDURE SP_EstadisticasDashboard
    AS
    BEGIN
        -- Total de totes activos
        SELECT COUNT(*) as TotalTotes FROM Totes WHERE Activo = 1;
        
        -- Totes por estado
        SELECT Estado, COUNT(*) as Cantidad FROM Totes WHERE Activo = 1 GROUP BY Estado;
        
        -- Totes con alerta
        SELECT COUNT(*) as TotesConAlerta FROM Totes WHERE Activo = 1 AND Alerta = 1;
        
        -- Totes próximos a vencer (7 días)
        SELECT COUNT(*) as TotesProximosVencer 
        FROM Totes 
        WHERE Activo = 1 
            AND FechaVencimiento IS NOT NULL 
            AND DATEDIFF(day, GETDATE(), FechaVencimiento) <= 7
            AND FechaVencimiento >= GETDATE();
        
        -- Total de clientes activos
        SELECT COUNT(*) as TotalClientes FROM Clientes WHERE estado = ''Activo'';
        
        -- Total de usuarios activos
        SELECT COUNT(*) as TotalUsuarios FROM Usuarios WHERE Estado = ''Active'';
    END');
    
    PRINT 'Procedimiento SP_EstadisticasDashboard creado.';
END
GO

-- Procedimiento para generar reporte de vencimientos
IF NOT EXISTS (SELECT * FROM sys.procedures WHERE name = 'SP_ReporteVencimientos')
BEGIN
    EXEC('CREATE PROCEDURE SP_ReporteVencimientos
        @DiasAnticipacion INT = 30
    AS
    BEGIN
        SELECT 
            Id,
            Codigo,
            Cliente,
            Producto,
            Lote,
            FechaVencimiento,
            DATEDIFF(day, GETDATE(), FechaVencimiento) as DiasParaVencer,
            CASE 
                WHEN FechaVencimiento < GETDATE() THEN ''Vencido''
                WHEN DATEDIFF(day, GETDATE(), FechaVencimiento) <= 7 THEN ''Crítico''
                WHEN DATEDIFF(day, GETDATE(), FechaVencimiento) <= 15 THEN ''Advertencia''
                ELSE ''Normal''
            END as Prioridad
        FROM Totes 
        WHERE Activo = 1 
            AND FechaVencimiento IS NOT NULL
            AND DATEDIFF(day, GETDATE(), FechaVencimiento) <= @DiasAnticipacion
        ORDER BY FechaVencimiento ASC;
    END');
    
    PRINT 'Procedimiento SP_ReporteVencimientos creado.';
END
GO

-- =============================================
-- FUNCIONES ÚTILES
-- =============================================

-- Función para validar formato de email
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'FN_ValidarEmail' AND type = 'FN')
BEGIN
    EXEC('CREATE FUNCTION FN_ValidarEmail(@Email NVARCHAR(255))
    RETURNS BIT
    AS
    BEGIN
        DECLARE @Result BIT = 0;
        
        IF @Email IS NOT NULL 
            AND LEN(@Email) > 5
            AND CHARINDEX(''@'', @Email) > 1
            AND CHARINDEX(''.'', @Email, CHARINDEX(''@'', @Email)) > CHARINDEX(''@'', @Email) + 1
            AND RIGHT(@Email, 1) != ''.''
            AND LEFT(@Email, 1) != ''@''
        BEGIN
            SET @Result = 1;
        END
        
        RETURN @Result;
    END');
    
    PRINT 'Función FN_ValidarEmail creada.';
END
GO

-- Función para calcular días hasta vencimiento
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'FN_DiasHastaVencimiento' AND type = 'FN')
BEGIN
    EXEC('CREATE FUNCTION FN_DiasHastaVencimiento(@FechaVencimiento DATE)
    RETURNS INT
    AS
    BEGIN
        DECLARE @Dias INT = NULL;
        
        IF @FechaVencimiento IS NOT NULL
        BEGIN
            SET @Dias = DATEDIFF(day, GETDATE(), @FechaVencimiento);
        END
        
        RETURN @Dias;
    END');
    
    PRINT 'Función FN_DiasHastaVencimiento creada.';
END
GO

-- Función para generar código único de tote
IF NOT EXISTS (SELECT * FROM sys.objects WHERE name = 'FN_GenerarCodigoTote' AND type = 'FN')
BEGIN
    EXEC('CREATE FUNCTION FN_GenerarCodigoTote(@Prefijo NVARCHAR(10) = ''TOT'')
    RETURNS NVARCHAR(50)
    AS
    BEGIN
        DECLARE @Codigo NVARCHAR(50);
        DECLARE @Numero INT;
        DECLARE @Fecha NVARCHAR(8) = FORMAT(GETDATE(), ''yyyyMMdd'');
        
        -- Obtener el siguiente número secuencial del día
        SELECT @Numero = ISNULL(MAX(CAST(RIGHT(Codigo, 4) AS INT)), 0) + 1
        FROM Totes 
        WHERE Codigo LIKE @Prefijo + @Fecha + ''%'';
        
        SET @Codigo = @Prefijo + @Fecha + RIGHT(''0000'' + CAST(@Numero AS NVARCHAR(4)), 4);
        
        RETURN @Codigo;
    END');
    
    PRINT 'Función FN_GenerarCodigoTote creada.';
END
GO

-- =============================================
-- RESTRICCIONES ADICIONALES
-- =============================================

-- Restricciones CHECK para validación de datos
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Usuarios_Email_Format')
BEGIN
    ALTER TABLE Usuarios ADD CONSTRAINT CK_Usuarios_Email_Format 
    CHECK (dbo.FN_ValidarEmail(Email) = 1);
    PRINT 'Restricción CK_Usuarios_Email_Format agregada.';
END

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Clientes_Email_Format')
BEGIN
    ALTER TABLE Clientes ADD CONSTRAINT CK_Clientes_Email_Format 
    CHECK (email IS NULL OR dbo.FN_ValidarEmail(email) = 1);
    PRINT 'Restricción CK_Clientes_Email_Format agregada.';
END

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Totes_FechaVencimiento_Future')
BEGIN
    ALTER TABLE Totes ADD CONSTRAINT CK_Totes_FechaVencimiento_Future 
    CHECK (FechaVencimiento IS NULL OR FechaVencimiento >= FechaCreacion);
    PRINT 'Restricción CK_Totes_FechaVencimiento_Future agregada.';
END

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Totes_FechaEnvasado_Valid')
BEGIN
    ALTER TABLE Totes ADD CONSTRAINT CK_Totes_FechaEnvasado_Valid 
    CHECK (FechaEnvasado IS NULL OR FechaEnvasado <= GETDATE());
    PRINT 'Restricción CK_Totes_FechaEnvasado_Valid agregada.';
END

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Totes_Peso_Positive')
BEGIN
    ALTER TABLE Totes ADD CONSTRAINT CK_Totes_Peso_Positive 
    CHECK (Peso IS NULL OR Peso > 0);
    PRINT 'Restricción CK_Totes_Peso_Positive agregada.';
END

IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Totes_Capacidad_Positive')
BEGIN
    ALTER TABLE Totes ADD CONSTRAINT CK_Totes_Capacidad_Positive 
    CHECK (Capacidad IS NULL OR Capacidad > 0);
    PRINT 'Restricción CK_Totes_Capacidad_Positive agregada.';
END

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
GO

PRINT '=============================================';
PRINT 'SCRIPT DE BASE DE DATOS COMPLETADO';
PRINT '=============================================';
PRINT 'Base de datos: Ditzler';
PRINT 'Tablas creadas: Usuarios, Clientes, Totes';
PRINT 'Índices, triggers y vistas creados';
PRINT 'Sistema listo para recibir datos';
PRINT '=============================================';
PRINT 'NOTA: Crear usuarios a través del sistema';
PRINT 'No se incluyen datos por defecto';
PRINT '=============================================';