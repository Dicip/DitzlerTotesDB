-- =============================================
-- SCRIPT COMPLETO DE BASE DE DATOS DITZLER TOTES
-- Sistema de Gestión Ditzler Chile
-- SQL Server
-- Consolidado de todos los scripts de la carpeta database
-- =============================================

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
-- USUARIO ADMINISTRADOR POR DEFECTO
-- =============================================
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

-- Vista para consultas simplificadas de eventos
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

-- =============================================
-- ACTUALIZACIÓN DE ESTADOS A ESPAÑOL
-- =============================================

-- Actualizar estados en tabla Usuarios
UPDATE Usuarios 
SET Estado = 'Activo' 
WHERE Estado = 'Active';

UPDATE Usuarios 
SET Estado = 'Inactivo' 
WHERE Estado = 'Inactive';

-- Actualizar estados en tabla Clientes (si existen registros con valores en inglés)
UPDATE Clientes 
SET estado = 'Activo' 
WHERE estado = 'Active';

UPDATE Clientes 
SET estado = 'Inactivo' 
WHERE estado = 'Inactive';

PRINT 'Estados actualizados correctamente a español.';
GO

-- =============================================
-- INSERTAR DATOS DE EJEMPLO EN TOTES
-- =============================================

-- Insertar totes de ejemplo
INSERT INTO Totes (Codigo, Estado, Ubicacion, Cliente, Operador, Producto, FechaCreacion, FechaVencimiento)
VALUES 
    ('TOT-001', 'Disponible', 'Almacén A-01', 'Empresa ABC S.A.', 'Admin Sistema', 'Componentes Electrónicos', GETDATE(), DATEADD(MONTH, 6, GETDATE())),
    ('TOT-002', 'En Uso', 'Línea Prod-1', 'Industrias XYZ Ltda.', 'Admin Sistema', 'Piezas Metálicas', GETDATE(), DATEADD(MONTH, 3, GETDATE())),
    ('TOT-003', 'Disponible', 'Almacén B-02', 'Manufacturas DEF Corp.', 'Admin Sistema', 'Materiales Plásticos', GETDATE(), DATEADD(MONTH, 12, GETDATE())),
    ('TOT-004', 'Mantenimiento', 'Taller', 'Empresa ABC S.A.', 'Admin Sistema', 'Componentes Electrónicos', GETDATE(), DATEADD(MONTH, 1, GETDATE())),
    ('TOT-005', 'En Uso', 'Distribución', 'Logística GHI S.A.S.', 'Admin Sistema', 'Productos Químicos', GETDATE(), DATEADD(MONTH, 9, GETDATE())),
    ('TOT-006', 'Disponible', 'Almacén C-03', 'Industrias XYZ Ltda.', 'Admin Sistema', 'Herramientas', GETDATE(), DATEADD(MONTH, 4, GETDATE())),
    ('TOT-007', 'Fuera de Servicio', 'Reparaciones', 'Manufacturas DEF Corp.', 'Admin Sistema', 'Materiales Plásticos', GETDATE(), DATEADD(MONTH, 2, GETDATE())),
    ('TOT-008', 'Disponible', 'Almacén A-04', 'Empresa JKL Inc.', 'Admin Sistema', 'Textiles', GETDATE(), DATEADD(MONTH, 8, GETDATE())),
    ('TOT-009', 'En Uso', 'Línea Prod-2', 'Distribuidora MNO', 'Admin Sistema', 'Alimentos Procesados', GETDATE(), DATEADD(MONTH, 5, GETDATE())),
    ('TOT-010', 'Disponible', 'Almacén B-05', 'Logística GHI S.A.S.', 'Admin Sistema', 'Productos Farmacéuticos', GETDATE(), DATEADD(MONTH, 7, GETDATE())),
    ('TOT-011', 'Mantenimiento', 'Limpieza', 'Empresa JKL Inc.', 'Admin Sistema', 'Textiles', GETDATE(), DATEADD(MONTH, 3, GETDATE())),
    ('TOT-012', 'En Uso', 'Cliente Premium', 'Industrias PQR S.A.', 'Admin Sistema', 'Autopartes', GETDATE(), DATEADD(MONTH, 6, GETDATE())),
    ('TOT-013', 'Disponible', 'Almacén C-06', 'Distribuidora MNO', 'Admin Sistema', 'Bebidas', GETDATE(), DATEADD(MONTH, 10, GETDATE())),
    ('TOT-014', 'Disponible', 'Almacén D-01', 'Empresa STU Corp.', 'Admin Sistema', 'Equipos Industriales', GETDATE(), DATEADD(MONTH, 11, GETDATE())),
    ('TOT-015', 'En Uso', 'Obra Construcción', 'Manufacturas VWX', 'Admin Sistema', 'Materiales de Construcción', GETDATE(), DATEADD(MONTH, 4, GETDATE()));

PRINT 'Se han insertado 15 totes de ejemplo exitosamente.';
PRINT 'Estados disponibles: Disponible, En Uso, Mantenimiento, Fuera de Servicio';
PRINT 'Códigos generados: TOT-001 a TOT-015';
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
GO

-- =============================================
-- VERIFICAR LOS CAMBIOS
-- =============================================
SELECT 'Usuarios' as Tabla, Estado, COUNT(*) as Cantidad
FROM Usuarios 
GROUP BY Estado
UNION ALL
SELECT 'Clientes' as Tabla, estado as Estado, COUNT(*) as Cantidad
FROM Clientes 
GROUP BY estado;
GO

PRINT '=============================================';
PRINT 'SCRIPT CONSOLIDADO COMPLETADO EXITOSAMENTE';
PRINT '=============================================';
PRINT 'Base de datos: Ditzler';
PRINT 'Tablas creadas: Usuarios, Clientes, Totes, Eventos';
PRINT 'Triggers de sincronización: Activados';
PRINT 'Sistema de auditoría: Configurado';
PRINT 'Datos de ejemplo: Insertados';
PRINT 'Estados: Actualizados a español';
PRINT 'Índices, vistas y procedimientos: Creados';
PRINT '=============================================';
PRINT 'SISTEMA LISTO PARA USAR';
PRINT '=============================================';
GO