-- =============================================
-- SCRIPT CORREGIDO DE BASE DE DATOS DITZLER TOTES
-- Sistema de Gestión Ditzler Chile
-- SQL Server
-- Versión corregida con nombres de columnas consistentes
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
        Rol NVARCHAR(20) NOT NULL DEFAULT 'Operador',
        Estado NVARCHAR(20) NOT NULL DEFAULT 'Activo',
        FechaCreacion DATETIME DEFAULT GETDATE(),
        FechaModificacion DATETIME DEFAULT GETDATE()
    );
    
    -- Crear índices para optimizar consultas
    CREATE INDEX IX_Usuarios_Email ON Usuarios(Email);
    CREATE INDEX IX_Usuarios_Rol ON Usuarios(Rol);
    CREATE INDEX IX_Usuarios_Estado ON Usuarios(Estado);
    CREATE INDEX IX_Usuarios_FechaCreacion ON Usuarios(FechaCreacion);
    CREATE INDEX IX_Usuarios_NombreApellido ON Usuarios(Nombre, Apellido);
    
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
    VALUES ('Admin', 'Sistema', 'admin123', 'admin@ditzler.com', 'Admin', 'Activo', GETDATE(), GETDATE());
    
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
-- ACTUALIZACIÓN DE DATOS EXISTENTES
-- =============================================

PRINT 'Actualizando datos existentes para cumplir con las restricciones...';
GO

-- Actualizar estados de usuarios que no cumplan con las restricciones
UPDATE Usuarios 
SET Estado = 'Activo' 
WHERE Estado NOT IN ('Activo', 'Inactivo') OR Estado IS NULL;

-- Actualizar roles de usuarios que no cumplan con las restricciones
UPDATE Usuarios 
SET Rol = 'Admin' 
WHERE Rol NOT IN ('Admin', 'Operador') OR Rol IS NULL;

-- Actualizar estados de clientes que no cumplan con las restricciones
UPDATE Clientes 
SET estado = 'Activo' 
WHERE estado NOT IN ('Activo', 'Inactivo') OR estado IS NULL;

-- Actualizar tipos de clientes que no cumplan con las restricciones
UPDATE Clientes 
SET tipo = 'Empresa' 
WHERE tipo NOT IN ('Empresa', 'Particular') OR tipo IS NULL;

-- Actualizar estados de totes que no cumplan con las restricciones
UPDATE Totes 
SET Estado = 'Disponible' 
WHERE Estado NOT IN ('Disponible', 'En Uso', 'Mantenimiento', 'Fuera de Servicio') OR Estado IS NULL;

PRINT 'Datos existentes actualizados correctamente.';
GO

-- =============================================
-- RESTRICCIONES DE INTEGRIDAD Y VALIDACIÓN
-- =============================================

PRINT 'Aplicando restricciones de integridad y validación...';
GO

-- Función para validar email
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'FN' AND name = 'FN_ValidarEmail')
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

-- 1. Validación de formato de email para Usuarios
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Usuarios_Email_Format')
BEGIN
    ALTER TABLE Usuarios ADD CONSTRAINT CK_Usuarios_Email_Format 
    CHECK (dbo.FN_ValidarEmail(Email) = 1);
    PRINT 'Restricción CK_Usuarios_Email_Format agregada.';
END
GO

-- 2. Validación de formato de email para Clientes (opcional)
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Clientes_Email_Format')
BEGIN
    ALTER TABLE Clientes ADD CONSTRAINT CK_Clientes_Email_Format 
    CHECK (email IS NULL OR dbo.FN_ValidarEmail(email) = 1);
    PRINT 'Restricción CK_Clientes_Email_Format agregada.';
END
GO

-- 3. Validación de longitud mínima de contraseña para Usuarios
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Usuarios_Password_Length')
BEGIN
    ALTER TABLE Usuarios ADD CONSTRAINT CK_Usuarios_Password_Length 
    CHECK (LEN(Password) >= 6);
    PRINT 'Restricción CK_Usuarios_Password_Length agregada.';
END
GO

-- 4. Validación de estados válidos para Usuarios
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Usuarios_Estado_Valid')
BEGIN
    ALTER TABLE Usuarios ADD CONSTRAINT CK_Usuarios_Estado_Valid 
    CHECK (Estado IN ('Activo', 'Inactivo'));
    PRINT 'Restricción CK_Usuarios_Estado_Valid agregada.';
END
GO

-- 5. Validación de roles válidos para Usuarios
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Usuarios_Rol_Valid')
BEGIN
    ALTER TABLE Usuarios ADD CONSTRAINT CK_Usuarios_Rol_Valid 
    CHECK (Rol IN ('Admin', 'Operador'));
    PRINT 'Restricción CK_Usuarios_Rol_Valid agregada.';
END
GO

-- 6. Validación de estados válidos para Clientes
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Clientes_Estado_Valid')
BEGIN
    ALTER TABLE Clientes ADD CONSTRAINT CK_Clientes_Estado_Valid 
    CHECK (estado IN ('Activo', 'Inactivo'));
    PRINT 'Restricción CK_Clientes_Estado_Valid agregada.';
END
GO

-- 7. Validación de tipos válidos para Clientes
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Clientes_Tipo_Valid')
BEGIN
    ALTER TABLE Clientes ADD CONSTRAINT CK_Clientes_Tipo_Valid 
    CHECK (tipo IN ('Empresa', 'Particular'));
    PRINT 'Restricción CK_Clientes_Tipo_Valid agregada.';
END
GO

-- 8. Validación de formato de teléfono para Clientes
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Clientes_Telefono_Format')
BEGIN
    ALTER TABLE Clientes ADD CONSTRAINT CK_Clientes_Telefono_Format 
    CHECK (telefono IS NULL OR telefono LIKE '%[0-9]%' AND telefono NOT LIKE '%[^0-9 \-+()]%');
    PRINT 'Restricción CK_Clientes_Telefono_Format agregada.';
END
GO

-- 9. Validación de longitud mínima del código de Tote
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Totes_Codigo_Length')
BEGIN
    ALTER TABLE Totes ADD CONSTRAINT CK_Totes_Codigo_Length 
    CHECK (LEN(Codigo) >= 3);
    PRINT 'Restricción CK_Totes_Codigo_Length agregada.';
END
GO

-- 10. Validación de estados válidos para Totes
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Totes_Estado_Valid')
BEGIN
    ALTER TABLE Totes ADD CONSTRAINT CK_Totes_Estado_Valid 
    CHECK (Estado IN ('Disponible', 'En Uso', 'Mantenimiento', 'Fuera de Servicio'));
    PRINT 'Restricción CK_Totes_Estado_Valid agregada.';
END
GO

-- 11. Validación de fecha de envasado no futura
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Totes_FechaEnvasado_Valid')
BEGIN
    ALTER TABLE Totes ADD CONSTRAINT CK_Totes_FechaEnvasado_Valid 
    CHECK (FechaEnvasado IS NULL OR FechaEnvasado <= GETDATE());
    PRINT 'Restricción CK_Totes_FechaEnvasado_Valid agregada.';
END
GO

-- 12. Validación de fecha de vencimiento posterior a fecha de envasado
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Totes_FechaVencimiento_Valid')
BEGIN
    ALTER TABLE Totes ADD CONSTRAINT CK_Totes_FechaVencimiento_Valid 
    CHECK (FechaVencimiento IS NULL OR FechaEnvasado IS NULL OR FechaVencimiento > FechaEnvasado);
    PRINT 'Restricción CK_Totes_FechaVencimiento_Valid agregada.';
END
GO

-- 13. Validación de tipos válidos para Eventos
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Eventos_TipoEvento_Valid')
BEGIN
    ALTER TABLE Eventos ADD CONSTRAINT CK_Eventos_TipoEvento_Valid 
    CHECK (TipoEvento IN ('LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 'VIEW', 'SISTEMA', 'ERROR'));
    PRINT 'Restricción CK_Eventos_TipoEvento_Valid agregada.';
END
GO

-- 14. Validación de módulos válidos para Eventos
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Eventos_Modulo_Valid')
BEGIN
    ALTER TABLE Eventos ADD CONSTRAINT CK_Eventos_Modulo_Valid 
    CHECK (Modulo IN ('USUARIOS', 'TOTES', 'CLIENTES', 'SISTEMA', 'EVENTOS'));
    PRINT 'Restricción CK_Eventos_Modulo_Valid agregada.';
END
GO

-- 15. Validación de campos obligatorios para Usuarios
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Usuarios_Campos_Obligatorios')
BEGIN
    ALTER TABLE Usuarios ADD CONSTRAINT CK_Usuarios_Campos_Obligatorios 
    CHECK (Nombre IS NOT NULL AND LEN(TRIM(Nombre)) > 0 AND 
           Apellido IS NOT NULL AND LEN(TRIM(Apellido)) > 0 AND 
           Email IS NOT NULL AND LEN(TRIM(Email)) > 0 AND 
           Password IS NOT NULL AND LEN(TRIM(Password)) > 0);
    PRINT 'Restricción CK_Usuarios_Campos_Obligatorios agregada.';
END
GO

-- 16. Validación de campos obligatorios para Clientes
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Clientes_Campos_Obligatorios')
BEGIN
    ALTER TABLE Clientes ADD CONSTRAINT CK_Clientes_Campos_Obligatorios 
    CHECK (nombre_empresa IS NOT NULL AND LEN(TRIM(nombre_empresa)) > 0 AND 
           contacto_principal IS NOT NULL AND LEN(TRIM(contacto_principal)) > 0 AND 
           tipo IS NOT NULL AND LEN(TRIM(tipo)) > 0 AND 
           estado IS NOT NULL AND LEN(TRIM(estado)) > 0);
    PRINT 'Restricción CK_Clientes_Campos_Obligatorios agregada.';
END
GO

-- 17. Validación de campos obligatorios para Totes
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Totes_Campos_Obligatorios')
BEGIN
    ALTER TABLE Totes ADD CONSTRAINT CK_Totes_Campos_Obligatorios 
    CHECK (Codigo IS NOT NULL AND LEN(TRIM(Codigo)) > 0 AND 
           Estado IS NOT NULL AND LEN(TRIM(Estado)) > 0 AND 
           Ubicacion IS NOT NULL AND LEN(TRIM(Ubicacion)) > 0 AND 
           Operador IS NOT NULL AND LEN(TRIM(Operador)) > 0);
    PRINT 'Restricción CK_Totes_Campos_Obligatorios agregada.';
END
GO

-- 18. Validación de campos obligatorios para Eventos
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Eventos_Campos_Obligatorios')
BEGIN
    ALTER TABLE Eventos ADD CONSTRAINT CK_Eventos_Campos_Obligatorios 
    CHECK (TipoEvento IS NOT NULL AND LEN(TRIM(TipoEvento)) > 0 AND 
           Modulo IS NOT NULL AND LEN(TRIM(Modulo)) > 0 AND 
           Descripcion IS NOT NULL AND LEN(TRIM(Descripcion)) > 0 AND 
           UsuarioNombre IS NOT NULL AND LEN(TRIM(UsuarioNombre)) > 0);
    PRINT 'Restricción CK_Eventos_Campos_Obligatorios agregada.';
END
GO

-- 19. Validación de longitud máxima para campos de Usuarios
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Usuarios_Longitud_Campos')
BEGIN
    ALTER TABLE Usuarios ADD CONSTRAINT CK_Usuarios_Longitud_Campos 
    CHECK (LEN(Nombre) <= 100 AND LEN(Apellido) <= 100 AND LEN(Email) <= 255);
    PRINT 'Restricción CK_Usuarios_Longitud_Campos agregada.';
END
GO

-- 20. Validación de longitud máxima para campos de Clientes
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Clientes_Longitud_Campos')
BEGIN
    ALTER TABLE Clientes ADD CONSTRAINT CK_Clientes_Longitud_Campos 
    CHECK (LEN(nombre_empresa) <= 255 AND LEN(contacto_principal) <= 100 AND 
           (email IS NULL OR LEN(email) <= 255) AND 
           (telefono IS NULL OR LEN(telefono) <= 20));
    PRINT 'Restricción CK_Clientes_Longitud_Campos agregada.';
END
GO

-- 21. Validación de longitud máxima para campos de Totes
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Totes_Longitud_Campos')
BEGIN
    ALTER TABLE Totes ADD CONSTRAINT CK_Totes_Longitud_Campos 
    CHECK (LEN(Codigo) <= 50 AND LEN(Estado) <= 50 AND LEN(Ubicacion) <= 100 AND 
           LEN(Operador) <= 100 AND 
           (Cliente IS NULL OR LEN(Cliente) <= 255) AND 
           (Producto IS NULL OR LEN(Producto) <= 255) AND 
           (Lote IS NULL OR LEN(Lote) <= 100));
    PRINT 'Restricción CK_Totes_Longitud_Campos agregada.';
END
GO

-- 22. Validación adicional para alertas (solo 0 o 1)
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Totes_Alerta_Valid')
BEGIN
    ALTER TABLE Totes ADD CONSTRAINT CK_Totes_Alerta_Valid 
    CHECK (Alerta IN (0, 1));
    PRINT 'Restricción CK_Totes_Alerta_Valid agregada.';
END
GO

-- =============================================
-- ÍNDICES ÚNICOS ADICIONALES
-- =============================================

PRINT 'Creando índices únicos adicionales...';
GO

-- Índice único para email de usuarios (si no existe)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_Usuarios_Email' AND object_id = OBJECT_ID('Usuarios'))
BEGIN
    CREATE UNIQUE INDEX UQ_Usuarios_Email ON Usuarios(Email);
    PRINT 'Índice único UQ_Usuarios_Email creado.';
END
GO

-- Índice único para código de totes (si no existe)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_Totes_Codigo' AND object_id = OBJECT_ID('Totes'))
BEGIN
    CREATE UNIQUE INDEX UQ_Totes_Codigo ON Totes(Codigo);
    PRINT 'Índice único UQ_Totes_Codigo creado.';
END
GO

-- Índice único para email de clientes (cuando no es NULL)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_Clientes_Email' AND object_id = OBJECT_ID('Clientes'))
BEGIN
    CREATE UNIQUE INDEX UQ_Clientes_Email ON Clientes(email) WHERE email IS NOT NULL;
    PRINT 'Índice único UQ_Clientes_Email creado.';
END
GO

PRINT '=============================================';
PRINT 'SCRIPT CORREGIDO COMPLETADO EXITOSAMENTE';
PRINT '=============================================';
PRINT 'Base de datos: Ditzler';
PRINT 'Tablas creadas: Usuarios, Clientes, Totes, Eventos';
PRINT 'Restricciones de integridad: 22 CHECK constraints aplicadas';
PRINT 'Índices únicos: 3 índices únicos creados';
PRINT 'Nombres de columnas corregidos y consistentes';
PRINT '=============================================';
PRINT 'SISTEMA LISTO PARA USAR CON VALIDACIONES COMPLETAS';
PRINT '=============================================';
GO