-- =============================================
-- SCRIPT DE TABLA USUARIOS
-- Sistema de Gestión de Totes - Ditzler
-- Tabla: Usuarios
-- Incluye: Tabla, Índices, Restricciones, Procedimientos
-- =============================================

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
-- ÍNDICES PARA TABLA USUARIOS
-- =============================================

-- Índice en Email
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Usuarios_Email')
BEGIN
    CREATE INDEX IX_Usuarios_Email ON Usuarios(Email);
    PRINT 'Índice IX_Usuarios_Email creado.';
END
GO

-- Índice en Estado
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Usuarios_Estado')
BEGIN
    CREATE INDEX IX_Usuarios_Estado ON Usuarios(Estado);
    PRINT 'Índice IX_Usuarios_Estado creado.';
END
GO

-- Índice en Rol
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Usuarios_Rol')
BEGIN
    CREATE INDEX IX_Usuarios_Rol ON Usuarios(Rol);
    PRINT 'Índice IX_Usuarios_Rol creado.';
END
GO

-- Índice único en Email
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_Usuarios_Email')
BEGIN
    CREATE UNIQUE INDEX UQ_Usuarios_Email ON Usuarios(Email);
    PRINT 'Índice único UQ_Usuarios_Email creado.';
END
GO

-- =============================================
-- RESTRICCIONES PARA TABLA USUARIOS
-- =============================================

-- Restricción de validación de email
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Usuarios_Email_Valid')
BEGIN
    ALTER TABLE Usuarios ADD CONSTRAINT CK_Usuarios_Email_Valid CHECK (dbo.FN_ValidarEmail(Email) = 1);
    PRINT 'Restricción CK_Usuarios_Email_Valid creada.';
END
GO

-- Restricción de estado válido
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Usuarios_Estado_Valid')
BEGIN
    ALTER TABLE Usuarios ADD CONSTRAINT CK_Usuarios_Estado_Valid CHECK (Estado IN ('Activo', 'Inactivo'));
    PRINT 'Restricción CK_Usuarios_Estado_Valid creada.';
END
GO

-- Restricción de longitud de campos
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Usuarios_Nombre_Length')
BEGIN
    ALTER TABLE Usuarios ADD CONSTRAINT CK_Usuarios_Nombre_Length CHECK (LEN(Nombre) <= 100 AND LEN(Apellido) <= 100 AND LEN(Email) <= 255);
    PRINT 'Restricción CK_Usuarios_Nombre_Length creada.';
END
GO

-- Restricción de longitud de contraseña
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Usuarios_Password_Length')
BEGIN
    ALTER TABLE Usuarios ADD CONSTRAINT CK_Usuarios_Password_Length CHECK (LEN(Password) >= 6);
    PRINT 'Restricción CK_Usuarios_Password_Length creada.';
END
GO

-- Restricción de rol válido
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Usuarios_Rol_Valid')
BEGIN
    ALTER TABLE Usuarios ADD CONSTRAINT CK_Usuarios_Rol_Valid CHECK (Rol IN ('Calidad/Despacho', 'Almacenaje', 'Producción', 'Lavado', 'Recepción', 'Operador', 'Admin'));
    PRINT 'Restricción CK_Usuarios_Rol_Valid creada.';
END
GO

-- =============================================
-- PROCEDIMIENTOS ALMACENADOS PARA USUARIOS
-- =============================================

-- Procedimiento para crear usuario
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_CrearUsuario')
BEGIN
    EXEC('CREATE PROCEDURE SP_CrearUsuario
        @Nombre NVARCHAR(100),
        @Apellido NVARCHAR(100),
        @Email NVARCHAR(255),
        @Password NVARCHAR(255),
        @Rol NVARCHAR(20) = ''Operador'',
        @Estado NVARCHAR(20) = ''Activo''
    AS
    BEGIN
        SET NOCOUNT ON;
        
        IF EXISTS (SELECT 1 FROM Usuarios WHERE Email = @Email)
        BEGIN
            RAISERROR(''Ya existe un usuario con ese email'', 16, 1);
            RETURN;
        END
        
        INSERT INTO Usuarios (Nombre, Apellido, Email, Password, Rol, Estado, FechaCreacion, FechaModificacion)
        VALUES (@Nombre, @Apellido, @Email, @Password, @Rol, @Estado, GETDATE(), GETDATE());
        
        SELECT SCOPE_IDENTITY() as UsuarioId;
    END');
    PRINT 'Procedimiento SP_CrearUsuario creado.';
END
GO

-- Procedimiento para actualizar usuario
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_ActualizarUsuario')
BEGIN
    EXEC('CREATE PROCEDURE SP_ActualizarUsuario
        @Id INT,
        @Nombre NVARCHAR(100),
        @Apellido NVARCHAR(100),
        @Email NVARCHAR(255),
        @Rol NVARCHAR(20),
        @Estado NVARCHAR(20)
    AS
    BEGIN
        SET NOCOUNT ON;
        
        IF NOT EXISTS (SELECT 1 FROM Usuarios WHERE Id = @Id)
        BEGIN
            RAISERROR(''Usuario no encontrado'', 16, 1);
            RETURN;
        END
        
        IF EXISTS (SELECT 1 FROM Usuarios WHERE Email = @Email AND Id != @Id)
        BEGIN
            RAISERROR(''Ya existe otro usuario con ese email'', 16, 1);
            RETURN;
        END
        
        UPDATE Usuarios 
        SET Nombre = @Nombre,
            Apellido = @Apellido,
            Email = @Email,
            Rol = @Rol,
            Estado = @Estado,
            FechaModificacion = GETDATE()
        WHERE Id = @Id;
    END');
    PRINT 'Procedimiento SP_ActualizarUsuario creado.';
END
GO

-- Procedimiento para validar login
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_ValidarLogin')
BEGIN
    EXEC('CREATE PROCEDURE SP_ValidarLogin
        @Email NVARCHAR(255),
        @Password NVARCHAR(255)
    AS
    BEGIN
        SET NOCOUNT ON;
        
        SELECT Id, Nombre, Apellido, Email, Rol, Estado
        FROM Usuarios 
        WHERE Email = @Email 
          AND Password = @Password 
          AND Estado = ''Activo'';
    END');
    PRINT 'Procedimiento SP_ValidarLogin creado.';
END
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
PRINT 'SCRIPT DE TABLA USUARIOS COMPLETADO';
PRINT 'Tabla: Usuarios';
PRINT 'Índices: 4 creados';
PRINT 'Restricciones: 5 creadas';
PRINT 'Procedimientos: 3 creados';
PRINT 'Función: FN_ValidarEmail';
PRINT '=============================================';
GO