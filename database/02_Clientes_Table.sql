-- =============================================
-- SCRIPT DE TABLA CLIENTES
-- Sistema de Gestión de Totes - Ditzler
-- Tabla: Clientes
-- Incluye: Tabla, Índices, Restricciones, Procedimientos
-- =============================================

USE Ditzler;
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
-- ÍNDICES PARA TABLA CLIENTES
-- =============================================

-- Índice único en Email
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'UQ_Clientes_Email')
BEGIN
    CREATE UNIQUE INDEX UQ_Clientes_Email ON Clientes(email) WHERE email IS NOT NULL;
    PRINT 'Índice único UQ_Clientes_Email creado.';
END
GO

-- Índice en nombre de empresa
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Clientes_NombreEmpresa')
BEGIN
    CREATE INDEX IX_Clientes_NombreEmpresa ON Clientes(nombre_empresa);
    PRINT 'Índice IX_Clientes_NombreEmpresa creado.';
END
GO

-- Índice en estado
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Clientes_Estado')
BEGIN
    CREATE INDEX IX_Clientes_Estado ON Clientes(estado);
    PRINT 'Índice IX_Clientes_Estado creado.';
END
GO

-- Índice en tipo
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Clientes_Tipo')
BEGIN
    CREATE INDEX IX_Clientes_Tipo ON Clientes(tipo);
    PRINT 'Índice IX_Clientes_Tipo creado.';
END
GO

-- Índice en ciudad
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Clientes_Ciudad')
BEGIN
    CREATE INDEX IX_Clientes_Ciudad ON Clientes(ciudad);
    PRINT 'Índice IX_Clientes_Ciudad creado.';
END
GO

-- Índice en fecha de registro
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Clientes_FechaRegistro')
BEGIN
    CREATE INDEX IX_Clientes_FechaRegistro ON Clientes(fecha_registro);
    PRINT 'Índice IX_Clientes_FechaRegistro creado.';
END
GO

-- =============================================
-- RESTRICCIONES PARA TABLA CLIENTES
-- =============================================

-- Restricción de validación de email (solo si no es NULL)
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Clientes_Email_Valid')
BEGIN
    ALTER TABLE Clientes ADD CONSTRAINT CK_Clientes_Email_Valid CHECK (email IS NULL OR dbo.FN_ValidarEmail(email) = 1);
    PRINT 'Restricción CK_Clientes_Email_Valid creada.';
END
GO

-- Restricción de estado válido
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Clientes_Estado_Valid')
BEGIN
    ALTER TABLE Clientes ADD CONSTRAINT CK_Clientes_Estado_Valid CHECK (estado IN ('Activo', 'Inactivo'));
    PRINT 'Restricción CK_Clientes_Estado_Valid creada.';
END
GO

-- Restricción de longitud de nombre de empresa
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Clientes_Nombre_Length')
BEGIN
    ALTER TABLE Clientes ADD CONSTRAINT CK_Clientes_Nombre_Length CHECK (LEN(nombre_empresa) >= 2 AND LEN(nombre_empresa) <= 255);
    PRINT 'Restricción CK_Clientes_Nombre_Length creada.';
END
GO

-- Restricción de longitud de contacto principal
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Clientes_Contacto_Length')
BEGIN
    ALTER TABLE Clientes ADD CONSTRAINT CK_Clientes_Contacto_Length CHECK (LEN(contacto_principal) >= 2 AND LEN(contacto_principal) <= 255);
    PRINT 'Restricción CK_Clientes_Contacto_Length creada.';
END
GO

-- Restricción de formato de teléfono
IF NOT EXISTS (SELECT * FROM sys.check_constraints WHERE name = 'CK_Clientes_Telefono_Format')
BEGIN
    ALTER TABLE Clientes ADD CONSTRAINT CK_Clientes_Telefono_Format CHECK (telefono IS NULL OR LEN(telefono) >= 7);
    PRINT 'Restricción CK_Clientes_Telefono_Format creada.';
END
GO

-- =============================================
-- PROCEDIMIENTOS ALMACENADOS PARA CLIENTES
-- =============================================

-- Procedimiento para crear cliente
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_CrearCliente')
BEGIN
    EXEC('CREATE PROCEDURE SP_CrearCliente
        @logo NVARCHAR(500) = NULL,
        @nombre_empresa NVARCHAR(255),
        @contacto_principal NVARCHAR(255),
        @email NVARCHAR(255) = NULL,
        @telefono NVARCHAR(20) = NULL,
        @direccion NVARCHAR(500) = NULL,
        @ciudad NVARCHAR(100) = NULL,
        @pais NVARCHAR(100) = NULL,
        @codigo_postal NVARCHAR(20) = NULL,
        @tipo NVARCHAR(50) = NULL,
        @estado NVARCHAR(20) = ''Activo'',
        @notas NVARCHAR(MAX) = NULL
    AS
    BEGIN
        SET NOCOUNT ON;
        
        -- Validar que no exista cliente con el mismo email (si se proporciona)
        IF @email IS NOT NULL AND EXISTS (SELECT 1 FROM Clientes WHERE email = @email)
        BEGIN
            RAISERROR(''Ya existe un cliente con ese email'', 16, 1);
            RETURN;
        END
        
        -- Validar que no exista cliente con el mismo nombre de empresa
        IF EXISTS (SELECT 1 FROM Clientes WHERE nombre_empresa = @nombre_empresa)
        BEGIN
            RAISERROR(''Ya existe un cliente con ese nombre de empresa'', 16, 1);
            RETURN;
        END
        
        INSERT INTO Clientes (
            logo, nombre_empresa, contacto_principal, email, telefono, 
            direccion, ciudad, pais, codigo_postal, tipo, estado, 
            fecha_registro, fecha_modificacion, notas
        )
        VALUES (
            @logo, @nombre_empresa, @contacto_principal, @email, @telefono,
            @direccion, @ciudad, @pais, @codigo_postal, @tipo, @estado,
            GETDATE(), GETDATE(), @notas
        );
        
        SELECT SCOPE_IDENTITY() as ClienteId;
    END');
    PRINT 'Procedimiento SP_CrearCliente creado.';
END
GO

-- Procedimiento para actualizar cliente
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_ActualizarCliente')
BEGIN
    EXEC('CREATE PROCEDURE SP_ActualizarCliente
        @id INT,
        @logo NVARCHAR(500) = NULL,
        @nombre_empresa NVARCHAR(255),
        @contacto_principal NVARCHAR(255),
        @email NVARCHAR(255) = NULL,
        @telefono NVARCHAR(20) = NULL,
        @direccion NVARCHAR(500) = NULL,
        @ciudad NVARCHAR(100) = NULL,
        @pais NVARCHAR(100) = NULL,
        @codigo_postal NVARCHAR(20) = NULL,
        @tipo NVARCHAR(50) = NULL,
        @estado NVARCHAR(20),
        @notas NVARCHAR(MAX) = NULL
    AS
    BEGIN
        SET NOCOUNT ON;
        
        -- Validar que el cliente existe
        IF NOT EXISTS (SELECT 1 FROM Clientes WHERE id = @id)
        BEGIN
            RAISERROR(''Cliente no encontrado'', 16, 1);
            RETURN;
        END
        
        -- Validar email único (si se proporciona)
        IF @email IS NOT NULL AND EXISTS (SELECT 1 FROM Clientes WHERE email = @email AND id != @id)
        BEGIN
            RAISERROR(''Ya existe otro cliente con ese email'', 16, 1);
            RETURN;
        END
        
        -- Validar nombre de empresa único
        IF EXISTS (SELECT 1 FROM Clientes WHERE nombre_empresa = @nombre_empresa AND id != @id)
        BEGIN
            RAISERROR(''Ya existe otro cliente con ese nombre de empresa'', 16, 1);
            RETURN;
        END
        
        UPDATE Clientes 
        SET logo = @logo,
            nombre_empresa = @nombre_empresa,
            contacto_principal = @contacto_principal,
            email = @email,
            telefono = @telefono,
            direccion = @direccion,
            ciudad = @ciudad,
            pais = @pais,
            codigo_postal = @codigo_postal,
            tipo = @tipo,
            estado = @estado,
            notas = @notas,
            fecha_modificacion = GETDATE()
        WHERE id = @id;
    END');
    PRINT 'Procedimiento SP_ActualizarCliente creado.';
END
GO

-- Procedimiento para buscar clientes
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_BuscarClientes')
BEGIN
    EXEC('CREATE PROCEDURE SP_BuscarClientes
        @nombre_empresa NVARCHAR(255) = NULL,
        @ciudad NVARCHAR(100) = NULL,
        @estado NVARCHAR(20) = NULL,
        @tipo NVARCHAR(50) = NULL,
        @solo_activos BIT = 1
    AS
    BEGIN
        SET NOCOUNT ON;
        
        SELECT * FROM Clientes
        WHERE (@nombre_empresa IS NULL OR nombre_empresa LIKE ''%'' + @nombre_empresa + ''%'')
          AND (@ciudad IS NULL OR ciudad = @ciudad)
          AND (@estado IS NULL OR estado = @estado)
          AND (@tipo IS NULL OR tipo = @tipo)
          AND (@solo_activos = 0 OR estado = ''Activo'')
        ORDER BY nombre_empresa;
    END');
    PRINT 'Procedimiento SP_BuscarClientes creado.';
END
GO

-- Procedimiento para obtener estadísticas de clientes
IF NOT EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_EstadisticasClientes')
BEGIN
    EXEC('CREATE PROCEDURE SP_EstadisticasClientes
    AS
    BEGIN
        SET NOCOUNT ON;
        
        -- Total de clientes
        SELECT COUNT(*) as TotalClientes FROM Clientes;
        
        -- Clientes por estado
        SELECT estado, COUNT(*) as Cantidad FROM Clientes GROUP BY estado;
        
        -- Clientes por tipo
        SELECT tipo, COUNT(*) as Cantidad FROM Clientes WHERE tipo IS NOT NULL GROUP BY tipo;
        
        -- Clientes por ciudad (top 10)
        SELECT TOP 10 ciudad, COUNT(*) as Cantidad 
        FROM Clientes 
        WHERE ciudad IS NOT NULL 
        GROUP BY ciudad 
        ORDER BY COUNT(*) DESC;
        
        -- Clientes registrados por mes (últimos 12 meses)
        SELECT 
            FORMAT(fecha_registro, ''yyyy-MM'') as Mes,
            COUNT(*) as ClientesRegistrados
        FROM Clientes 
        WHERE fecha_registro >= DATEADD(MONTH, -12, GETDATE())
        GROUP BY FORMAT(fecha_registro, ''yyyy-MM'')
        ORDER BY Mes;
    END');
    PRINT 'Procedimiento SP_EstadisticasClientes creado.';
END
GO

PRINT '=============================================';
PRINT 'SCRIPT DE TABLA CLIENTES COMPLETADO';
PRINT 'Tabla: Clientes';
PRINT 'Índices: 6 creados';
PRINT 'Restricciones: 5 creadas';
PRINT 'Procedimientos: 4 creados';
PRINT '=============================================';
GO