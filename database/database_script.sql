-- =============================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS
-- Sistema de Gestión de Totes - Ditzler
-- Versión: Estructura actual del sistema funcionando
-- =============================================

USE master;
GO

-- Crear base de datos si no existe
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'Ditzler')
BEGIN
    CREATE DATABASE Ditzler;
    PRINT 'Base de datos Ditzler creada exitosamente.';
END
ELSE
BEGIN
    PRINT 'La base de datos Ditzler ya existe.';
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
        Rol NVARCHAR(20) NOT NULL DEFAULT 'Operador',
        Estado NVARCHAR(20) NOT NULL DEFAULT 'Activo',
        FechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
        FechaModificacion DATETIME NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Tabla Usuarios creada exitosamente.';
END
GO

-- =============================================
-- TABLA DE CLIENTES
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Clientes' AND xtype='U')
BEGIN
    CREATE TABLE Clientes (
        id INT IDENTITY(1,1) PRIMARY KEY,
        logo NVARCHAR(500) NULL,
        nombre_empresa NVARCHAR(255) NOT NULL,
        contacto_principal NVARCHAR(255) NOT NULL,
        email NVARCHAR(255) NULL,
        telefono NVARCHAR(20) NULL,
        direccion NVARCHAR(500) NULL,
        ciudad NVARCHAR(100) NULL,
        pais NVARCHAR(100) NULL,
        codigo_postal NVARCHAR(20) NULL,
        tipo NVARCHAR(50) NULL,
        estado NVARCHAR(20) NOT NULL DEFAULT 'Activo',
        fecha_registro DATETIME NOT NULL DEFAULT GETDATE(),
        fecha_modificacion DATETIME NOT NULL DEFAULT GETDATE(),
        notas NVARCHAR(MAX) NULL
    );
    PRINT 'Tabla Clientes creada exitosamente.';
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
        Estado NVARCHAR(50) NOT NULL DEFAULT 'Disponible',
        Ubicacion NVARCHAR(255) NULL,
        Cliente NVARCHAR(255) NULL,
        Operador NVARCHAR(255) NULL,
        Producto NVARCHAR(255) NULL,
        FechaCreacion DATETIME NOT NULL DEFAULT GETDATE(),
        FechaModificacion DATETIME NOT NULL DEFAULT GETDATE(),
        FechaEnvasado DATETIME NULL,
        FechaVencimiento DATETIME NULL,
        UsuarioCreacion NVARCHAR(255) NULL,
        UsuarioModificacion NVARCHAR(255) NULL,
        Activo BIT NOT NULL DEFAULT 1,
        Alerta BIT NOT NULL DEFAULT 0,
        FechaDespacho DATE NULL,
        Lote NVARCHAR(100) NULL
    );
    PRINT 'Tabla Totes creada exitosamente.';
END
GO

-- =============================================
-- TABLA DE EVENTOS/AUDITORÍA
-- =============================================
IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Eventos' AND xtype='U')
BEGIN
    CREATE TABLE Eventos (
        Id INT IDENTITY(1,1) PRIMARY KEY,
        TipoEvento NVARCHAR(50) NOT NULL,
        Modulo NVARCHAR(50) NOT NULL,
        Descripcion NVARCHAR(500) NOT NULL,
        UsuarioId INT NULL,
        UsuarioNombre NVARCHAR(200) NOT NULL,
        UsuarioEmail NVARCHAR(255) NULL,
        UsuarioRol NVARCHAR(20) NOT NULL,
        ObjetoId NVARCHAR(50) NULL,
        ObjetoTipo NVARCHAR(50) NULL,
        ValoresAnteriores NVARCHAR(MAX) NULL,
        ValoresNuevos NVARCHAR(MAX) NULL,
        DireccionIP NVARCHAR(45) NULL,
        UserAgent NVARCHAR(500) NULL,
        Exitoso BIT DEFAULT 1,
        MensajeError NVARCHAR(500) NULL,
        FechaEvento DATETIME DEFAULT GETDATE(),
        Sesion NVARCHAR(100) NULL
    );
    PRINT 'Tabla Eventos creada exitosamente.';
END
GO

-- =============================================
-- FUNCIÓN DE VALIDACIÓN DE EMAIL
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'FN' AND name = 'FN_ValidarEmail')
BEGIN
    EXEC('CREATE FUNCTION FN_ValidarEmail(@email NVARCHAR(255))
    RETURNS BIT
    AS
    BEGIN
        DECLARE @result BIT = 0;
        
        IF @email IS NOT NULL 
           AND LEN(@email) > 5
           AND CHARINDEX(''@'', @email) > 1
           AND CHARINDEX(''@'', @email) < LEN(@email)
           AND CHARINDEX(''.'', @email, CHARINDEX(''@'', @email)) > CHARINDEX(''@'', @email) + 1
           AND RIGHT(@email, 1) != ''.''
           AND LEFT(@email, 1) != ''@''
        BEGIN
            SET @result = 1;
        END
        
        RETURN @result;
    END');
    PRINT 'Función FN_ValidarEmail creada exitosamente.';
END
GO

-- =============================================
-- PROCEDIMIENTO ALMACENADO PARA AUDITORÍA
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_RegistrarEvento')
BEGIN
    EXEC('CREATE PROCEDURE SP_RegistrarEvento
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
    END');
    PRINT 'Procedimiento SP_RegistrarEvento creado exitosamente.';
END
GO

-- =============================================
-- ÍNDICES
-- =============================================

-- Índices para tabla Usuarios
CREATE INDEX IX_Usuarios_Email ON Usuarios(Email);
CREATE INDEX IX_Usuarios_Estado ON Usuarios(Estado);
CREATE INDEX IX_Usuarios_Rol ON Usuarios(Rol);
CREATE UNIQUE INDEX UQ_Usuarios_Email ON Usuarios(Email);

-- Índices para tabla Clientes
CREATE UNIQUE INDEX UQ_Clientes_Email ON Clientes(Email);

-- Índices para tabla Totes
CREATE INDEX IX_Totes_Cliente ON Totes(Cliente);
CREATE INDEX IX_Totes_Estado ON Totes(Estado);
CREATE INDEX IX_Totes_FechaCreacion ON Totes(FechaCreacion);
CREATE INDEX IX_Totes_FechaDespacho ON Totes(FechaDespacho);
CREATE INDEX IX_Totes_FechaEnvasado ON Totes(FechaEnvasado);
CREATE INDEX IX_Totes_FechaVencimiento ON Totes(FechaVencimiento);
CREATE INDEX IX_Totes_Lote ON Totes(Lote);
CREATE INDEX IX_Totes_Operador ON Totes(Operador);
CREATE INDEX IX_Totes_Producto ON Totes(Producto);
CREATE INDEX IX_Totes_Ubicacion ON Totes(Ubicacion);
CREATE UNIQUE INDEX UQ_Totes_Codigo ON Totes(Codigo);

-- Índices para tabla Eventos
CREATE INDEX IX_Eventos_FechaEvento ON Eventos(FechaEvento);
CREATE INDEX IX_Eventos_Modulo ON Eventos(Modulo);
CREATE INDEX IX_Eventos_TipoEvento ON Eventos(TipoEvento);
CREATE INDEX IX_Eventos_UsuarioId ON Eventos(UsuarioId);

-- =============================================
-- RESTRICCIONES (CHECK CONSTRAINTS)
-- =============================================

-- Restricciones para tabla Clientes
ALTER TABLE Clientes ADD CONSTRAINT CK_Clientes_Email_Valid CHECK (dbo.FN_ValidarEmail(Email) = 1);
ALTER TABLE Clientes ADD CONSTRAINT CK_Clientes_Estado_Valid CHECK (Estado IN ('Activo', 'Inactivo'));
ALTER TABLE Clientes ADD CONSTRAINT CK_Clientes_Nombre_Length CHECK (LEN(Nombre) <= 255);

-- Restricciones para tabla Totes
ALTER TABLE Totes ADD CONSTRAINT CK_Totes_Codigo_Length CHECK (LEN(Codigo) <= 50);
ALTER TABLE Totes ADD CONSTRAINT CK_Totes_Estado_Valid CHECK (Estado IN ('Disponible', 'En Uso', 'En Lavado', 'Mantenimiento', 'Fuera de Servicio'));

-- Restricciones para tabla Usuarios
ALTER TABLE Usuarios ADD CONSTRAINT CK_Usuarios_Email_Valid CHECK (dbo.FN_ValidarEmail(Email) = 1);
ALTER TABLE Usuarios ADD CONSTRAINT CK_Usuarios_Estado_Valid CHECK (Estado IN ('Activo', 'Inactivo'));
ALTER TABLE Usuarios ADD CONSTRAINT CK_Usuarios_Nombre_Length CHECK (LEN(Nombre) <= 100 AND LEN(Apellido) <= 100 AND LEN(Email) <= 255);
ALTER TABLE Usuarios ADD CONSTRAINT CK_Usuarios_Password_Length CHECK (LEN(Password) >= 6);
ALTER TABLE Usuarios ADD CONSTRAINT CK_Usuarios_Rol_Valid CHECK (Rol IN ('Calidad/Despacho', 'Almacenaje', 'Producción', 'Lavado', 'Recepción', 'Operador', 'Admin'));

-- =============================================
-- FUNCIONES ADICIONALES
-- =============================================

-- Función para generar códigos de tote
CREATE FUNCTION FN_GenerarCodigoTote(@Prefijo NVARCHAR(10) = 'TOT')
RETURNS NVARCHAR(50)
AS
BEGIN
    DECLARE @Codigo NVARCHAR(50);
    DECLARE @Numero INT;
    DECLARE @Fecha NVARCHAR(8) = FORMAT(GETDATE(), 'yyyyMMdd');
    
    SELECT @Numero = ISNULL(MAX(CAST(RIGHT(Codigo, 4) AS INT)), 0) + 1
    FROM Totes
    WHERE Codigo LIKE @Prefijo + @Fecha + '%';
    
    SET @Codigo = @Prefijo + @Fecha + RIGHT('0000' + CAST(@Numero AS NVARCHAR(4)), 4);
    
    RETURN @Codigo;
END;
GO

-- Función para calcular días hasta vencimiento
CREATE FUNCTION FN_DiasHastaVencimiento(@FechaVencimiento DATE)
RETURNS INT
AS
BEGIN
    RETURN DATEDIFF(DAY, GETDATE(), @FechaVencimiento);
END;
GO

-- =============================================
-- PROCEDIMIENTOS ALMACENADOS ADICIONALES
-- =============================================

-- Procedimiento para buscar totes
CREATE PROCEDURE SP_BuscarTotes
    @Codigo NVARCHAR(50) = NULL,
    @Estado NVARCHAR(50) = NULL,
    @Cliente NVARCHAR(255) = NULL,
    @FechaDesde DATE = NULL,
    @FechaHasta DATE = NULL,
    @SoloActivos BIT = 1
AS
BEGIN
    SELECT * FROM Totes
    WHERE (@Codigo IS NULL OR Codigo LIKE '%' + @Codigo + '%')
      AND (@Estado IS NULL OR Estado = @Estado)
      AND (@Cliente IS NULL OR Cliente LIKE '%' + @Cliente + '%')
      AND (@FechaDesde IS NULL OR FechaCreacion >= @FechaDesde)
      AND (@FechaHasta IS NULL OR FechaCreacion <= @FechaHasta)
      AND (@SoloActivos = 0 OR Activo = 1)
    ORDER BY FechaCreacion DESC;
END;
GO

-- Procedimiento para estadísticas del dashboard
CREATE PROCEDURE SP_EstadisticasDashboard
AS
BEGIN
    -- Total de totes activos
    SELECT COUNT(*) as TotalTotes FROM Totes WHERE Activo = 1;
    
    -- Totes por estado
    SELECT Estado, COUNT(*) as Cantidad FROM Totes WHERE Activo = 1 GROUP BY Estado;
    
    -- Totes próximos a vencer (próximos 7 días)
    SELECT COUNT(*) as TotesProximosVencer 
    FROM Totes 
    WHERE Activo = 1 AND FechaVencimiento BETWEEN GETDATE() AND DATEADD(DAY, 7, GETDATE());
    
    -- Eventos recientes (últimos 10)
    SELECT TOP 10 * FROM Eventos ORDER BY FechaEvento DESC;
END;
GO

-- =============================================
-- USUARIO ADMINISTRADOR POR DEFECTO
-- =============================================
IF NOT EXISTS (SELECT * FROM Usuarios WHERE Email = 'admin@ditzler.com')
BEGIN
    INSERT INTO Usuarios (Nombre, Apellido, Password, Email, Rol, Estado, FechaCreacion, FechaModificacion)
    VALUES ('Admin', 'Sistema', 'admin123', 'admin@ditzler.com', 'Admin', 'Activo', GETDATE(), GETDATE());
    
    PRINT 'Usuario administrador creado exitosamente.';
    PRINT 'Email: admin@ditzler.com';
    PRINT 'Password: admin123';
END
GO

PRINT '=============================================';
PRINT 'SCRIPT DE CREACIÓN COMPLETADO EXITOSAMENTE';
PRINT 'Base de datos: Ditzler';
PRINT 'Tablas creadas: Usuarios, Clientes, Totes, Eventos';
PRINT 'Función: FN_ValidarEmail';
PRINT 'Procedimiento: SP_RegistrarEvento';
PRINT 'Usuario admin creado con email: admin@ditzler.com';
PRINT '=============================================';
GO