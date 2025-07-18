const express = require('express');
const path = require('path');
const sql = require('mssql');
const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de conexión a SQL Server
const sqlConfig = {
  user: 'sa',
  password: '123',
  database: 'Ditzler',
  server: 'localhost',
  port: 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,

    connectTimeout: 30000, // Aumentar el tiempo de espera para la conexión
    requestTimeout: 30000 // Aumentar el tiempo de espera para las solicitudes
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

// Servir archivos estáticos desde el directorio raíz
app.use(express.static(path.join(__dirname, '/')));

// Middleware para procesar datos JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta principal
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Ruta para el panel de administrador
app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/dashboard.html'));
});

// Ruta para la gestión de clientes
app.get('/clientes', (req, res) => {
  res.sendFile(path.join(__dirname, 'pages/clientes.html'));
});

// Endpoint para probar la conexión a la base de datos
app.get('/api/test-db-connection', async (req, res) => {
  let pool;
  try {
    console.log('Probando conexión a la base de datos...');
    pool = await new sql.ConnectionPool(sqlConfig).connect();
    console.log('Conexión a la base de datos establecida correctamente');
    
    // Ejecutar una consulta simple para verificar que todo funciona
    const result = await pool.request().query('SELECT TOP 1 * FROM Usuarios');
    
    res.json({
      success: true,
      message: 'Conexión a la base de datos establecida correctamente',
      data: result.recordset.length > 0 ? 'Se encontraron registros en la tabla Usuarios' : 'No se encontraron registros en la tabla Usuarios'
    });
  } catch (err) {
    console.error('Error al conectar con la base de datos:', err);
    res.status(500).json({
      success: false,
      message: 'Error al conectar con la base de datos',
      error: err.message,
      code: err.code
    });
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
});

// Endpoint para login con modo de contingencia
app.post('/api/login', async (req, res) => {
  console.log('Solicitud recibida en /api/login');
  const { email, password } = req.body;
  console.log('Intento de login:', email);

  let pool;
  try {
    pool = await new sql.ConnectionPool(sqlConfig).connect();
    console.log('Conexión a la base de datos establecida para el login.');

    const result = await pool.request()
      .input('email', sql.VarChar, email)
      .input('password', sql.VarChar, password)
      .query('SELECT * FROM Usuarios WHERE Email = @email AND Password = @password AND Estado = \'Activo\'');

    console.log('Resultado de la consulta:', result.recordset);

    if (result.recordset.length > 0) {
      const user = result.recordset[0];
      const isAdmin = user.Rol === 'Admin';
      const fullname = `${user.Nombre} ${user.Apellido}`;

      console.log('Usuario autenticado desde DB:', { username: user.Nombre, isAdmin, fullname, role: user.Rol });

      res.json({ 
        success: true, 
        username: user.Nombre, 
        isAdmin: isAdmin,
        fullname: fullname,
        role: user.Rol
      });
    } else {
      console.log('Credenciales inválidas o usuario inactivo.');
      res.status(401).json({ success: false, message: 'Credenciales inválidas o el usuario está inactivo.' });
    }
  } catch (err) {
    console.error('Error en el proceso de login:', err);
    res.status(500).json({ 
      success: false, 
      message: 'Error interno del servidor durante el login.',
      error: err.message,
      code: err.code
    });
  } finally {
    if (pool) {
      try {
        await pool.close();
        console.log('Conexión de login cerrada.');
      } catch (err) {
        console.error('Error al cerrar la conexión de login:', err);
      }
    }
  }
});

// API para gestión de usuarios usando SQL Server (solo accesible para administradores)
app.post('/api/admin/users', async (req, res) => {
  // Verificar si el solicitante es un administrador (en una aplicación real se usaría JWT o sesiones)
  if (!req.headers.authorization) {
    return res.status(401).json({ success: false, message: 'No autorizado' });
  }
  
  let pool;
  try {
    const { action, userData } = req.body;
    pool = await new sql.ConnectionPool(sqlConfig).connect();
    
    // Crear nuevo usuario
    if (action === 'create' && userData) {
      // Validar formato de email usando la función de la base de datos
      const emailValidationResult = await pool.request()
        .input('email', sql.VarChar, userData.email)
        .query('SELECT dbo.FN_ValidarEmail(@email) as isValid');
      
      if (!emailValidationResult.recordset[0].isValid) {
        return res.status(400).json({ 
          success: false, 
          message: 'El formato del email no es válido' 
        });
      }
      
      // Verificar si ya existe un usuario con el mismo email
      const checkUser = await pool.request()
        .input('email', sql.VarChar, userData.email)
        .query('SELECT COUNT(*) as count FROM Usuarios WHERE Email = @email');
      
      if (checkUser.recordset[0].count > 0) {
        return res.status(400).json({ success: false, message: 'Ya existe un usuario con ese email' });
      }
      
      // Insertar nuevo usuario usando parámetros para evitar inyección SQL
      const insertResult = await pool.request()
        .input('nombre', sql.VarChar, userData.nombre)
        .input('apellido', sql.VarChar, userData.apellido)
        .input('email', sql.VarChar, userData.email)
        .input('password', sql.VarChar, userData.password)
        .input('rol', sql.VarChar, userData.rol || 'Operario')
        .query(`
          INSERT INTO Usuarios (Nombre, Apellido, Email, Password, Rol, Estado, FechaCreacion, FechaModificacion)
          VALUES (@nombre, @apellido, @email, @password, @rol, 'Activo', GETDATE(), GETDATE())
        `);
      
      res.json({ success: true, message: 'Usuario creado correctamente' });
    }
    // Obtener lista de usuarios
    else if (action === 'list') {
      const users = await pool.request().query('SELECT * FROM Usuarios ORDER BY FechaCreacion DESC');
      res.json({ success: true, users: users.recordset });
    }
    // Actualizar usuario existente
    else if (action === 'update' && userData && userData.id) {
      // Validar formato de email si se está actualizando
      if (userData.email) {
        const emailValidationResult = await pool.request()
          .input('email', sql.VarChar, userData.email)
          .query('SELECT dbo.FN_ValidarEmail(@email) as isValid');
        
        if (!emailValidationResult.recordset[0].isValid) {
          return res.status(400).json({ 
            success: false, 
            message: 'El formato del email no es válido' 
          });
        }
        
        // Verificar si el email ya existe en otro usuario
        const checkEmailResult = await pool.request()
          .input('email', sql.VarChar, userData.email)
          .input('userId', sql.Int, userData.id)
          .query('SELECT COUNT(*) as count FROM Usuarios WHERE Email = @email AND Id != @userId');
        
        if (checkEmailResult.recordset[0].count > 0) {
          return res.status(400).json({ 
            success: false, 
            message: 'Ya existe otro usuario con ese email' 
          });
        }
      }
      
      await pool.request()
        .input('nombre', sql.VarChar, userData.nombre)
        .input('apellido', sql.VarChar, userData.apellido)
        .input('email', sql.VarChar, userData.email)
        .input('rol', sql.VarChar, userData.rol)
        .input('estado', sql.VarChar, userData.estado)
        .input('userId', sql.Int, userData.id)
        .query(`
          UPDATE Usuarios 
          SET Nombre = @nombre,
              Apellido = @apellido,
              Email = @email,
              Rol = @rol,
              Estado = @estado,
              FechaModificacion = GETDATE()
          WHERE Id = @userId
        `);
      
      res.json({ success: true, message: 'Usuario actualizado correctamente' });
    }
    // Eliminar usuario
    else if (action === 'delete' && userData && userData.id) {
      await pool.request()
        .input('userId', sql.Int, userData.id)
        .query('DELETE FROM Usuarios WHERE Id = @userId');
      res.json({ success: true, message: 'Usuario eliminado correctamente' });
    }
    else {
      res.status(400).json({ success: false, message: 'Acción no válida' });
    }
  } catch (err) {
    // En caso de error en la conexión o consulta, registrar el error y responder
    console.error('Error en operación de usuarios:', err);
    
    // Manejo específico de errores de restricciones
    let errorMessage = 'Error al conectar con la base de datos.';
    
    if (err.message) {
      if (err.message.includes('CK_Usuarios_Email_Format')) {
        errorMessage = 'El formato del email no es válido';
      } else if (err.message.includes('UNIQUE KEY constraint')) {
        errorMessage = 'Ya existe un usuario con esos datos';
      } else if (err.message.includes('CHECK constraint')) {
        errorMessage = 'Los datos no cumplen con las validaciones requeridas';
      }
    }
    
    res.status(500).json({ success: false, message: errorMessage });
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
});

// API para gestión de clientes usando SQL Server
app.post('/api/admin/clientes', async (req, res) => {
  // Verificar si el solicitante es un administrador
  if (!req.headers.authorization) {
    return res.status(401).json({ success: false, message: 'No autorizado' });
  }
  
  let pool;
  try {
    const { action, clientData } = req.body;
    pool = await new sql.ConnectionPool(sqlConfig).connect();
    
    // Crear nuevo cliente
    if (action === 'create' && clientData) {
      // Validar formato de email si se proporciona
      if (clientData.email && clientData.email.trim() !== '') {
        const emailValidationResult = await pool.request()
        .input('email', sql.VarChar, clientData.email)
        .query('SELECT FN_ValidarEmail(@email) as isValid');
        
        if (!emailValidationResult.recordset[0].isValid) {
          return res.status(400).json({ 
            success: false, 
            message: 'El formato del email no es válido' 
          });
        }
        
        // Verificar si el email ya existe
        const checkClient = await pool.request()
          .input('email', sql.NVarChar, clientData.email)
          .query('SELECT COUNT(*) as count FROM Clientes WHERE email = @email');
        
        if (checkClient.recordset[0].count > 0) {
          return res.status(400).json({ success: false, message: 'Ya existe un cliente con este email' });
        }
      }
      
      // Insertar nuevo cliente
      await pool.request()
        .input('logo', sql.NVarChar, clientData.logo || '')
        .input('nombre_empresa', sql.NVarChar, clientData.nombreEmpresa)
        .input('contacto_principal', sql.NVarChar, clientData.contactoPrincipal)
        .input('email', sql.NVarChar, clientData.email)
        .input('telefono', sql.NVarChar, clientData.telefono)
        .input('tipo', sql.NVarChar, clientData.tipo)
        .input('estado', sql.NVarChar, clientData.estado)
        .query(`INSERT INTO Clientes (logo, nombre_empresa, contacto_principal, email, telefono, tipo, estado)
                VALUES (@logo, @nombre_empresa, @contacto_principal, @email, @telefono, @tipo, @estado)`);
      
      res.json({ success: true, message: 'Cliente creado correctamente' });
    }
    // Obtener lista de clientes
    else if (action === 'list') {
      const clientes = await pool.request().query('SELECT * FROM Clientes ORDER BY nombre_empresa');
      res.json({ success: true, clientes: clientes.recordset });
    }
    // Actualizar cliente existente
    else if (action === 'update' && clientData && clientData.id) {
      // Validar formato de email si se está actualizando
      if (clientData.email && clientData.email.trim() !== '') {
        const emailValidationResult = await pool.request()
          .input('email', sql.NVarChar, clientData.email)
          .query('SELECT dbo.FN_ValidarEmail(@email) as isValid');
        
        if (!emailValidationResult.recordset[0].isValid) {
          return res.status(400).json({ 
            success: false, 
            message: 'El formato del email no es válido' 
          });
        }
        
        // Verificar si el email ya existe en otro cliente
        const checkEmailResult = await pool.request()
          .input('email', sql.NVarChar, clientData.email)
          .input('clientId', sql.Int, clientData.id)
          .query('SELECT COUNT(*) as count FROM Clientes WHERE email = @email AND id != @clientId');
        
        if (checkEmailResult.recordset[0].count > 0) {
          return res.status(400).json({ 
            success: false, 
            message: 'Ya existe otro cliente con ese email' 
          });
        }
      }
      
      await pool.request()
        .input('id', sql.Int, clientData.id)
        .input('logo', sql.NVarChar, clientData.logo || '')
        .input('nombre_empresa', sql.NVarChar, clientData.nombreEmpresa)
        .input('contacto_principal', sql.NVarChar, clientData.contactoPrincipal)
        .input('email', sql.NVarChar, clientData.email)
        .input('telefono', sql.NVarChar, clientData.telefono)
        .input('tipo', sql.NVarChar, clientData.tipo)
        .input('estado', sql.NVarChar, clientData.estado)
        .query(`UPDATE Clientes 
                SET logo = @logo, nombre_empresa = @nombre_empresa, contacto_principal = @contacto_principal,
                    email = @email, telefono = @telefono, tipo = @tipo, estado = @estado
                WHERE id = @id`);
      
      res.json({ success: true, message: 'Cliente actualizado correctamente' });
    }
    // Eliminar cliente
    else if (action === 'delete' && clientData && clientData.id) {
      await pool.request()
        .input('id', sql.Int, clientData.id)
        .query('DELETE FROM Clientes WHERE id = @id');
      res.json({ success: true, message: 'Cliente eliminado correctamente' });
    }
    else {
      res.status(400).json({ success: false, message: 'Acción no válida' });
    }
  } catch (err) {
    console.error('Error en operación de clientes:', err);
    
    // Manejo específico de errores de restricciones
    let errorMessage = 'Error al conectar con la base de datos.';
    
    if (err.message) {
      if (err.message.includes('CK_Clientes_Email_Format')) {
        errorMessage = 'El formato del email no es válido';
      } else if (err.message.includes('UNIQUE KEY constraint')) {
        errorMessage = 'Ya existe un cliente con esos datos';
      } else if (err.message.includes('CHECK constraint')) {
        errorMessage = 'Los datos no cumplen con las validaciones requeridas';
      }
    }
    
    res.status(500).json({ success: false, message: errorMessage });
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
});

// API para operadores - Estadísticas
app.get('/api/operador/stats', async (req, res) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ success: false, message: 'No autorizado' });
  }
  
  let pool;
  try {
    const operadorName = req.headers.authorization.replace('Bearer ', '');
    pool = await new sql.ConnectionPool(sqlConfig).connect();
    
    // Obtener estadísticas específicas del operador
    const misTotesResult = await pool.request()
      .input('operador', sql.VarChar, operadorName)
      .query('SELECT COUNT(*) as total FROM Totes WHERE Operador = @operador AND Estado != \'Fuera de Servicio\'');
    
    const totesDisponiblesResult = await pool.request()
      .query('SELECT COUNT(*) as total FROM Totes WHERE Estado = \'Disponible\'');
    
    const totesLavadoResult = await pool.request()
      .query('SELECT COUNT(*) as total FROM Totes WHERE Estado = \'En Lavado\'');
    
    const totesClienteResult = await pool.request()
      .query('SELECT COUNT(*) as total FROM Totes WHERE Estado = \'Con Cliente\'');
    
    // Totes por estado del operador
    const misTotesPorEstadoResult = await pool.request()
      .input('operador', sql.VarChar, operadorName)
      .query(`
        SELECT Estado, COUNT(*) as cantidad 
        FROM Totes 
        WHERE Operador = @operador AND Estado != 'Fuera de Servicio'
        GROUP BY Estado
      `);
    
    // Tareas pendientes (totes que requieren atención)
    const tareasPendientesResult = await pool.request()
      .input('operador', sql.VarChar, operadorName)
      .query(`
        SELECT TOP 5 Codigo, 
               CASE 
                 WHEN DATEDIFF(day, FechaDespacho, GETDATE()) > 30 THEN 'Fuera de plazo'
                 WHEN Estado = 'En Mantenimiento' THEN 'Requiere mantenimiento'
                 WHEN FechaVencimiento < GETDATE() THEN 'Producto vencido'
                 ELSE 'Revisar estado'
               END as descripcion
        FROM Totes 
        WHERE Operador = @operador 
          AND (DATEDIFF(day, FechaDespacho, GETDATE()) > 30 
               OR Estado = 'En Mantenimiento' 
               OR FechaVencimiento < GETDATE())
      `);
    
    res.json({
      success: true,
      misTotesTotal: misTotesResult.recordset[0].total,
      totesDisponibles: totesDisponiblesResult.recordset[0].total,
      totesEnLavado: totesLavadoResult.recordset[0].total,
      totesConCliente: totesClienteResult.recordset[0].total,
      misTotesPorEstado: misTotesPorEstadoResult.recordset,
      tareasPendientes: tareasPendientesResult.recordset.length,
      tareas: tareasPendientesResult.recordset
    });
    
  } catch (err) {
    console.error('Error al obtener estadísticas del operador:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
});

// API para operadores - Obtener totes asignados
app.get('/api/operador/totes', async (req, res) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ success: false, message: 'No autorizado' });
  }
  
  let pool;
  try {
    const operadorName = req.headers.authorization.replace('Bearer ', '');
    pool = await new sql.ConnectionPool(sqlConfig).connect();
    
    const result = await pool.request()
      .input('operador', sql.VarChar, operadorName)
      .query(`
        SELECT *
        FROM Totes
        WHERE Operador = @operador AND Estado != 'Fuera de Servicio'
        ORDER BY FechaModificacion DESC
      `);
    
    res.json(result.recordset);
    
  } catch (err) {
    console.error('Error al obtener totes del operador:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
});

// API para operadores - Actualizar estado de tote
app.put('/api/operador/totes/update-status', async (req, res) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ success: false, message: 'No autorizado' });
  }
  
  let pool;
  try {
    const operadorName = req.headers.authorization.replace('Bearer ', '');
    const { toteId, nuevoEstado, ubicacion, observaciones } = req.body;
    
    pool = await new sql.ConnectionPool(sqlConfig).connect();
    
    // Verificar que el tote pertenece al operador
    const checkResult = await pool.request()
      .input('toteId', sql.Int, toteId)
      .input('operador', sql.VarChar, operadorName)
      .query('SELECT COUNT(*) as count FROM Totes WHERE Id = @toteId AND Operador = @operador');
    
    if (checkResult.recordset[0].count === 0) {
      return res.status(403).json({ success: false, message: 'No tiene permisos para modificar este tote' });
    }
    
    // Actualizar el tote
    await pool.request()
      .input('toteId', sql.Int, toteId)
      .input('estado', sql.VarChar, nuevoEstado)
      .input('ubicacion', sql.VarChar, ubicacion)
      .query(`
        UPDATE Totes 
        SET Estado = @estado,
            Ubicacion = @ubicacion,
            FechaModificacion = GETDATE()
        WHERE Id = @toteId
      `);
    
    res.json({ success: true, message: 'Estado del tote actualizado correctamente' });
    
  } catch (err) {
    console.error('Error al actualizar estado del tote:', err);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
});

// API para gestión de totes usando SQL Server (solo accesible para administradores)
app.post('/api/admin/totes', async (req, res) => {
  // Verificar si el solicitante es un administrador
  if (!req.headers.authorization) {
    return res.status(401).json({ success: false, message: 'No autorizado' });
  }
  
  let pool;
  try {
    const { action, toteData } = req.body;
    pool = await new sql.ConnectionPool(sqlConfig).connect();
    
    // Crear nuevo tote
    if (action === 'create' && toteData) {
      // Validar fechas según restricciones CHECK
      if (toteData.fechaVencimiento && toteData.fechaEnvasado) {
        const fechaVenc = new Date(toteData.fechaVencimiento);
        const fechaEnv = new Date(toteData.fechaEnvasado);
        
        if (fechaVenc <= fechaEnv) {
          return res.status(400).json({ 
            success: false, 
            message: 'La fecha de vencimiento debe ser posterior a la fecha de envasado' 
          });
        }
      }
      
      // Validar que la fecha de envasado no sea futura
      if (toteData.fechaEnvasado) {
        const fechaEnv = new Date(toteData.fechaEnvasado);
        const hoy = new Date();
        hoy.setHours(23, 59, 59, 999); // Fin del día actual
        
        if (fechaEnv > hoy) {
          return res.status(400).json({ 
            success: false, 
            message: 'La fecha de envasado no puede ser futura' 
          });
        }
      }
      
      // Verificar si el código de tote ya existe
      const checkTote = await pool.request()
        .input('codigo', sql.VarChar, toteData.codigo)
        .query('SELECT COUNT(*) as count FROM Totes WHERE Codigo = @codigo');
      
      if (checkTote.recordset[0].count > 0) {
        return res.status(400).json({ success: false, message: 'El código de tote ya existe' });
      }
      
      // Insertar nuevo tote
      await pool.request()
        .input('codigo', sql.VarChar, toteData.codigo)
        .input('estado', sql.VarChar, toteData.estado)
        .input('ubicacion', sql.VarChar, toteData.ubicacion)
        .input('cliente', sql.VarChar, toteData.cliente || null)
        .input('operador', sql.VarChar, toteData.operador)
        .input('producto', sql.VarChar, toteData.producto || null)
        .input('lote', sql.VarChar, toteData.lote || null)
        .input('fechaEnvasado', sql.Date, toteData.fechaEnvasado || null)
        .input('fechaVencimiento', sql.Date, toteData.fechaVencimiento || null)
        .input('fechaDespacho', sql.Date, toteData.fechaDespacho || null)
        .input('alerta', sql.Bit, toteData.alerta || 0)
        .input('usuarioCreacion', sql.VarChar, toteData.usuarioCreacion || 'admin')
        .query(`
          INSERT INTO Totes (Codigo, Estado, Ubicacion, Cliente, Operador, Producto, Lote, 
                            FechaEnvasado, FechaVencimiento, FechaDespacho, Alerta, UsuarioCreacion)
          VALUES (@codigo, @estado, @ubicacion, @cliente, @operador, @producto, @lote, 
                  @fechaEnvasado, @fechaVencimiento, @fechaDespacho, @alerta, @usuarioCreacion)
        `);
      
      res.json({ success: true, message: 'Tote creado correctamente' });
    }
    // Obtener lista de totes
    else if (action === 'list') {
      const totes = await pool.request().query(`
        SELECT Id, Codigo, Estado, Ubicacion, Cliente, Operador, Producto, Lote,
               FORMAT(FechaEnvasado, 'dd/MM/yyyy') as fEnvasado,
               FORMAT(FechaVencimiento, 'dd/MM/yyyy') as fVencimiento,
               FORMAT(FechaDespacho, 'dd/MM/yyyy') as fDespacho,
               Alerta
        FROM Totes 
        WHERE Activo = 1
        ORDER BY FechaCreacion DESC
      `);
      res.json({ success: true, totes: totes.recordset });
    }
    // Actualizar tote existente
    else if (action === 'update' && toteData && toteData.id) {
      // Validar fechas según restricciones CHECK
      if (toteData.fechaVencimiento && toteData.fechaEnvasado) {
        const fechaVenc = new Date(toteData.fechaVencimiento);
        const fechaEnv = new Date(toteData.fechaEnvasado);
        
        if (fechaVenc <= fechaEnv) {
          return res.status(400).json({ 
            success: false, 
            message: 'La fecha de vencimiento debe ser posterior a la fecha de envasado' 
          });
        }
      }
      
      // Validar que la fecha de envasado no sea futura
      if (toteData.fechaEnvasado) {
        const fechaEnv = new Date(toteData.fechaEnvasado);
        const hoy = new Date();
        hoy.setHours(23, 59, 59, 999); // Fin del día actual
        
        if (fechaEnv > hoy) {
          return res.status(400).json({ 
            success: false, 
            message: 'La fecha de envasado no puede ser futura' 
          });
        }
      }
      
      // Verificar si el código ya existe en otro tote
      const checkCodeResult = await pool.request()
        .input('codigo', sql.VarChar, toteData.codigo)
        .input('toteId', sql.Int, toteData.id)
        .query('SELECT COUNT(*) as count FROM Totes WHERE Codigo = @codigo AND Id != @toteId');
      
      if (checkCodeResult.recordset[0].count > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Ya existe otro tote con ese código' 
        });
      }
      
      await pool.request()
        .input('codigo', sql.VarChar, toteData.codigo)
        .input('estado', sql.VarChar, toteData.estado)
        .input('ubicacion', sql.VarChar, toteData.ubicacion)
        .input('cliente', sql.VarChar, toteData.cliente || null)
        .input('operador', sql.VarChar, toteData.operador)
        .input('producto', sql.VarChar, toteData.producto || null)
        .input('lote', sql.VarChar, toteData.lote || null)
        .input('fechaEnvasado', sql.Date, toteData.fechaEnvasado || null)
        .input('fechaVencimiento', sql.Date, toteData.fechaVencimiento || null)
        .input('fechaDespacho', sql.Date, toteData.fechaDespacho || null)
        .input('alerta', sql.Bit, toteData.alerta || 0)
        .input('usuarioModificacion', sql.VarChar, toteData.usuarioModificacion || 'admin')
        .input('toteId', sql.Int, toteData.id)
        .query(`
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
              UsuarioModificacion = @usuarioModificacion
          WHERE Id = @toteId
        `);
      
      res.json({ success: true, message: 'Tote actualizado correctamente' });
    }
    // Eliminar tote (soft delete)
    else if (action === 'delete' && toteData && toteData.id) {
      await pool.request()
        .input('usuarioModificacion', sql.VarChar, toteData.usuarioModificacion || 'admin')
        .input('toteId', sql.Int, toteData.id)
        .query(`
          UPDATE Totes 
          SET Activo = 0, 
              UsuarioModificacion = @usuarioModificacion
          WHERE Id = @toteId
        `);
      res.json({ success: true, message: 'Tote eliminado correctamente' });
    }
    // Buscar totes por filtros
    else if (action === 'search' && toteData) {
      let query = `
        SELECT Id, Codigo, Estado, Ubicacion, Cliente, Operador, Producto, Lote,
               FORMAT(FechaEnvasado, 'dd/MM/yyyy') as fEnvasado,
               FORMAT(FechaVencimiento, 'dd/MM/yyyy') as fVencimiento,
               FORMAT(FechaDespacho, 'dd/MM/yyyy') as fDespacho,
               Alerta
        FROM Totes 
        WHERE Activo = 1
      `;
      
      const request = pool.request();
      
      if (toteData.codigo) {
        query += ` AND Codigo LIKE @codigo`;
        request.input('codigo', sql.VarChar, `%${toteData.codigo}%`);
      }
      if (toteData.estado) {
        query += ` AND Estado = @estado`;
        request.input('estado', sql.VarChar, toteData.estado);
      }
      if (toteData.cliente) {
        query += ` AND Cliente LIKE @cliente`;
        request.input('cliente', sql.VarChar, `%${toteData.cliente}%`);
      }
      if (toteData.producto) {
        query += ` AND Producto LIKE @producto`;
        request.input('producto', sql.VarChar, `%${toteData.producto}%`);
      }
      
      query += ` ORDER BY FechaCreacion DESC`;
      
      const result = await request.query(query);
      res.json({ success: true, totes: result.recordset });
    }
    else {
      res.status(400).json({ success: false, message: 'Acción no válida' });
    }
  } catch (err) {
    console.error('Error en operación de totes:', err);
    
    // Manejo específico de errores de restricciones
    let errorMessage = 'Error al conectar con la base de datos.';
    
    if (err.message) {
      if (err.message.includes('CK_Totes_FechaVencimiento_Future')) {
        errorMessage = 'La fecha de vencimiento debe ser posterior a la fecha de envasado';
      } else if (err.message.includes('CK_Totes_FechaEnvasado_Valid')) {
        errorMessage = 'La fecha de envasado no puede ser futura';
      } else if (err.message.includes('CK_Totes_Peso_Positive')) {
        errorMessage = 'El peso debe ser un valor positivo';
      } else if (err.message.includes('CK_Totes_Capacidad_Positive')) {
        errorMessage = 'La capacidad debe ser un valor positivo';
      } else if (err.message.includes('UNIQUE KEY constraint')) {
        errorMessage = 'Ya existe un tote con esos datos';
      } else if (err.message.includes('CHECK constraint')) {
        errorMessage = 'Los datos no cumplen con las validaciones requeridas';
      }
    }
    
    res.status(500).json({ success: false, message: errorMessage });
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
});

// API para obtener estadísticas del dashboard
app.get('/api/dashboard/stats', async (req, res) => {
  let pool;
  try {
    pool = await new sql.ConnectionPool(sqlConfig).connect();
    
    // Obtener estadísticas de totes por estado
    const statusStats = await pool.request().query(`
      SELECT 
        Estado,
        COUNT(*) as cantidad
      FROM Totes 
      WHERE Activo = 1
      GROUP BY Estado
    `);
    
    // Obtener total de totes activos
    const totalTotes = await pool.request().query(`
      SELECT COUNT(*) as total FROM Totes WHERE Activo = 1
    `);
    
    // Obtener totes con clientes agrupados por cliente
    const totesConClientes = await pool.request().query(`
      SELECT 
        Cliente,
        COUNT(*) as cantidad
      FROM Totes 
      WHERE Activo = 1 AND Estado = 'Con Cliente'
      GROUP BY Cliente
    `);
    
    // Obtener totes fuera de plazo (más de 30 días desde despacho o vencidos)
    const totesFueraPlazo = await pool.request().query(`
      SELECT 
        Cliente,
        COUNT(*) as cantidad
      FROM Totes 
      WHERE Activo = 1 
        AND (FechaVencimiento < GETDATE() 
             OR DATEDIFF(day, FechaDespacho, GETDATE()) > 30)
      GROUP BY Cliente
    `);
    
    // Obtener total de totes fuera de plazo
    const totalFueraPlazo = await pool.request().query(`
      SELECT COUNT(*) as total 
      FROM Totes 
      WHERE Activo = 1 
        AND (FechaVencimiento < GETDATE() 
             OR DATEDIFF(day, FechaDespacho, GETDATE()) > 30)
    `);
    
    // Obtener usuarios activos
    const usuariosActivos = await pool.request().query(`
      SELECT COUNT(*) as total FROM Usuarios WHERE Estado = 'Activo'
    `);
    
    res.json({
      success: true,
      data: {
        statusStats: statusStats.recordset,
        totalTotes: totalTotes.recordset[0].total,
        totesConClientes: totesConClientes.recordset,
        totesFueraPlazo: totesFueraPlazo.recordset,
        totalFueraPlazo: totalFueraPlazo.recordset[0].total,
        usuariosActivos: usuariosActivos.recordset[0].total
      }
    });
    
  } catch (err) {
    console.error('Error al obtener estadísticas del dashboard:', err);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas del dashboard',
      error: err.message
    });
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (err) {
        console.error('Error al cerrar la conexión:', err);
      }
    }
  }
});

// Manejadores de errores globales
process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err);
  // No cerrar el proceso, solo registrar el error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada en:', promise, 'razón:', reason);
  // No cerrar el proceso, solo registrar el error
});

// Iniciar el servidor
const server = app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});

// Mantener el servidor activo
server.on('error', (err) => {
  console.error('Error del servidor:', err);
});

// Evitar que el proceso se cierre
process.stdin.resume();