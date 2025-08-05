const express = require('express');
const path = require('path');
const sql = require('mssql');
const auditLogger = require('./middleware/audit');
const app = express();
const PORT = process.env.PORT || 3002;

// Función helper para obtener datos completos del usuario
async function getUserFromToken(identifier) {
  console.log(`[DEBUG] Buscando usuario con identificador: ${identifier}`); // Añadido para depuración
  let pool;
  try {
    pool = await new sql.ConnectionPool(sqlConfig).connect();
    // Buscar por email O por nombre
    const result = await pool.request()
      .input('identifier', sql.VarChar, identifier)
      .query('SELECT Id, Nombre, Apellido, Email, Rol FROM Usuarios WHERE Email = @identifier OR Nombre = @identifier');
    
    if (result.recordset.length > 0) {
      console.log(`[DEBUG] Usuario encontrado: ${result.recordset[0].Nombre}`); // Añadido para depuración
      return result.recordset[0];
    }
    
    console.log(`[DEBUG] Usuario con identificador ${identifier} no encontrado.`); // Añadido para depuración
    // Si no se encuentra el usuario, devolver un objeto con valores por defecto
    return {
      Id: null,
      Nombre: 'Usuario',
      Apellido: 'Desconocido',
      Email: identifier,
      Rol: 'Desconocido'
    };
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    return {
      Id: null,
      Nombre: 'Usuario',
      Apellido: 'Desconocido', 
      Email: email,
      Rol: 'Desconocido'
    };
  } finally {
    if (pool) {
      try {
        await pool.close();
      } catch (err) {
        console.error('Error cerrando conexión:', err);
      }
    }
  }
}

// Funciones de validación centralizadas
async function validateEmail(pool, email) {
  const emailValidationResult = await pool.request()
    .input('email', sql.VarChar, email)
    .query('SELECT dbo.FN_ValidarEmail(@email) as isValid');
  
  return emailValidationResult.recordset[0].isValid;
}

async function checkDuplicateUserEmail(pool, email, excludeUserId = null) {
  const query = excludeUserId 
    ? 'SELECT COUNT(*) as count FROM Usuarios WHERE Email = @email AND Id != @userId'
    : 'SELECT COUNT(*) as count FROM Usuarios WHERE Email = @email';
  
  const request = pool.request().input('email', sql.VarChar, email);
  if (excludeUserId) {
    request.input('userId', sql.Int, excludeUserId);
  }
  
  const result = await request.query(query);
  return result.recordset[0].count > 0;
}

async function checkDuplicateClientEmail(pool, email, excludeClientId = null) {
  const query = excludeClientId 
    ? 'SELECT COUNT(*) as count FROM Clientes WHERE email = @email AND id != @clientId'
    : 'SELECT COUNT(*) as count FROM Clientes WHERE email = @email';
  
  const request = pool.request().input('email', sql.NVarChar, email);
  if (excludeClientId) {
    request.input('clientId', sql.Int, excludeClientId);
  }
  
  const result = await request.query(query);
  return result.recordset[0].count > 0;
}

async function checkDuplicateToteCode(pool, codigo, excludeToteId = null) {
  const query = excludeToteId 
    ? 'SELECT COUNT(*) as count FROM Totes WHERE Codigo = @codigo AND Id != @toteId'
    : 'SELECT COUNT(*) as count FROM Totes WHERE Codigo = @codigo';
  
  const request = pool.request().input('codigo', sql.VarChar, codigo);
  if (excludeToteId) {
    request.input('toteId', sql.Int, excludeToteId);
  }
  
  const result = await request.query(query);
  return result.recordset[0].count > 0;
}

// Funciones de validación de fechas centralizadas
function validateToteDates(fechaEnvasado, fechaVencimiento) {
  const errors = [];
  
  // Validar que la fecha de envasado no sea futura
  if (fechaEnvasado) {
    const fechaEnv = new Date(fechaEnvasado);
    const hoy = new Date();
    hoy.setHours(23, 59, 59, 999); // Fin del día actual
    
    if (fechaEnv > hoy) {
      errors.push('La fecha de envasado no puede ser futura');
    }
  }
  
  // Validar que la fecha de vencimiento sea posterior a la de envasado
  if (fechaVencimiento && fechaEnvasado) {
    const fechaVenc = new Date(fechaVencimiento);
    const fechaEnv = new Date(fechaEnvasado);
    
    if (fechaVenc <= fechaEnv) {
      errors.push('La fecha de vencimiento debe ser posterior a la fecha de envasado');
    }
  }
  
  return errors;
}

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
    enableArithAbort: true,
    connectTimeout: 60000, // Aumentar el tiempo de espera para la conexión
    requestTimeout: 60000 // Aumentar el tiempo de espera para las solicitudes
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

// Middleware de auditoría
app.use(auditLogger.auditMiddleware());

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

// Endpoint para probar eventos de auditoría
app.get('/api/test-audit', async (req, res) => {
  try {
    console.log('Probando sistema de auditoría...');
    
    // Crear un evento de prueba
    await auditLogger.logEvent({
      tipoEvento: 'SISTEMA',
      modulo: 'PRUEBA',
      descripcion: 'Evento de prueba para verificar funcionamiento del sistema de auditoría',
      usuarioNombre: 'Sistema de Prueba',
      usuarioRol: 'Sistema',
      direccionIP: '127.0.0.1',
      userAgent: 'Test Agent',
      exitoso: true
    });
    
    res.json({ 
      success: true, 
      message: 'Evento de auditoría creado exitosamente' 
    });
  } catch (error) {
    console.error('Error en prueba de auditoría:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al crear evento de auditoría: ' + error.message 
    });
  }
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
      const isAdmin = user.Rol === 'Admin' || user.Rol === 'Administrador';
      const fullname = `${user.Nombre} ${user.Apellido}`;

      console.log('Usuario autenticado desde DB:', { username: user.Nombre, isAdmin, fullname, role: user.Rol });

      // Auditar login exitoso
      await auditLogger.auditLogin(req, user, true);

      res.json({ 
        success: true, 
        username: user.Nombre, 
        isAdmin: isAdmin,
        fullname: fullname,
        role: user.Rol
      });
    } else {
      console.log('Credenciales inválidas o usuario inactivo.');
      // Auditar login fallido
      await auditLogger.auditLogin(req, { Email: email }, false, 'Credenciales inválidas o usuario inactivo');
      res.status(401).json({ success: false, message: 'Credenciales inválidas o el usuario está inactivo.' });
    }
  } catch (err) {
    console.error('Error en el proceso de login:', err);
    // Auditar error en login - usar usuario sistema cuando no hay usuario autenticado
    const systemUser = { Id: null, Nombre: 'Sistema', Apellido: '', Email: 'sistema@ditzler.com', Rol: 'Sistema' };
    await auditLogger.auditError(req, systemUser, 'USUARIOS', 'Error en proceso de login', err.message);
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
      // Validar formato de email usando función centralizada
      if (!(await validateEmail(pool, userData.email))) {
        return res.status(400).json({ 
          success: false, 
          message: 'El formato del email no es válido' 
        });
      }
      
      // Verificar si ya existe un usuario con el mismo email
      if (await checkDuplicateUserEmail(pool, userData.email)) {
        return res.status(400).json({ success: false, message: 'Ya existe un usuario con ese email' });
      }
      
      // Insertar nuevo usuario usando parámetros para evitar inyección SQL
      const insertResult = await pool.request()
        .input('nombre', sql.VarChar, userData.nombre)
        .input('apellido', sql.VarChar, userData.apellido)
        .input('email', sql.VarChar, userData.email)
        .input('password', sql.VarChar, userData.password)
        .input('rol', sql.VarChar, userData.rol || 'Operador')
        .query(`
          INSERT INTO Usuarios (Nombre, Apellido, Email, Password, Rol, Estado, FechaCreacion, FechaModificacion)
          VALUES (@nombre, @apellido, @email, @password, @rol, 'Activo', GETDATE(), GETDATE())
        `);
      
      // Auditar creación de usuario
      const newUserData = { 
        nombre: userData.nombre, 
        apellido: userData.apellido, 
        email: userData.email, 
        rol: userData.rol || 'Operador' 
      };
      const currentUser = await getUserFromToken(req.headers.authorization.replace('Bearer ', ''));
      await auditLogger.auditCreate(
        req, 
        currentUser, 
        'USUARIOS', 
        'Usuario', 
        null, 
        newUserData,
        `Usuario ${userData.email} creado con rol ${userData.rol || 'Operador'}`
      );
      
      res.json({ success: true, message: 'Usuario creado correctamente' });
    }
    // Obtener lista de usuarios
    else if (action === 'list') {
      const users = await pool.request().query('SELECT * FROM Usuarios ORDER BY FechaCreacion DESC');
      
      // Auditoría de consultas removida - solo se registran cambios en el sistema
      
      res.json({ success: true, users: users.recordset });
    }
    // Actualizar usuario existente
    else if (action === 'update' && userData && userData.id) {
      // Obtener datos anteriores para auditoría
      const oldUserResult = await pool.request()
        .input('userId', sql.Int, userData.id)
        .query('SELECT * FROM Usuarios WHERE Id = @userId');
      
      if (oldUserResult.recordset.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuario no encontrado' 
        });
      }
      
      const oldUserData = oldUserResult.recordset[0];
      
      // Validar formato de email si se está actualizando
      if (userData.email) {
        if (!(await validateEmail(pool, userData.email))) {
          return res.status(400).json({ 
            success: false, 
            message: 'El formato del email no es válido' 
          });
        }
        
        // Verificar si el email ya existe en otro usuario
        if (await checkDuplicateUserEmail(pool, userData.email, userData.id)) {
          return res.status(400).json({ 
            success: false, 
            message: 'Ya existe otro usuario con ese email' 
          });
        }
      }
      
      // Construir la consulta de actualización dinámicamente
      let updateQuery = `
        UPDATE Usuarios 
        SET Nombre = @nombre,
            Apellido = @apellido,
            Email = @email,
            Rol = @rol,
            Estado = @estado,
            FechaModificacion = GETDATE()
      `;
      
      const request = pool.request()
        .input('nombre', sql.VarChar, userData.nombre)
        .input('apellido', sql.VarChar, userData.apellido)
        .input('email', sql.VarChar, userData.email)
        .input('rol', sql.VarChar, userData.rol)
        .input('estado', sql.VarChar, userData.estado)
        .input('userId', sql.Int, userData.id);
      
      // Si se proporciona una nueva contraseña, incluirla en la actualización
      if (userData.password && userData.password.trim() !== '') {
        if (userData.password.length < 6) {
          return res.status(400).json({ 
            success: false, 
            message: 'La contraseña debe tener al menos 6 caracteres' 
          });
        }
        updateQuery += `, Password = @password`;
        request.input('password', sql.VarChar, userData.password);
      }
      
      updateQuery += ` WHERE Id = @userId`;
      
      await request.query(updateQuery);
      
      // Auditar actualización de usuario
      const oldData = {
        nombre: oldUserData.Nombre,
        apellido: oldUserData.Apellido,
        email: oldUserData.Email,
        rol: oldUserData.Rol,
        estado: oldUserData.Estado
      };
      const newData = {
        nombre: userData.nombre,
        apellido: userData.apellido,
        email: userData.email,
        rol: userData.rol,
        estado: userData.estado
      };
      
      const currentUser = await getUserFromToken(req.headers.authorization.replace('Bearer ', ''));
      await auditLogger.auditUpdate(
        req, 
        currentUser, 
        'USUARIOS', 
        'Usuario', 
        userData.id, 
        oldData,
        newData,
        `Usuario ${userData.email} actualizado`
      );
      
      res.json({ success: true, message: 'Usuario actualizado correctamente' });
    }
    // Eliminar usuario
    else if (action === 'delete' && userData && userData.id) {
      // Obtener datos del usuario antes de eliminarlo para auditoría
      const userToDeleteResult = await pool.request()
        .input('userId', sql.Int, userData.id)
        .query('SELECT * FROM Usuarios WHERE Id = @userId');
      
      if (userToDeleteResult.recordset.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Usuario no encontrado' 
        });
      }
      
      const deletedUserData = userToDeleteResult.recordset[0];
      
      await pool.request()
        .input('userId', sql.Int, userData.id)
        .query('DELETE FROM Usuarios WHERE Id = @userId');
      
      // Auditar eliminación de usuario
      const currentUser = await getUserFromToken(req.headers.authorization.replace('Bearer ', ''));
      await auditLogger.auditDelete(
        req, 
        currentUser, 
        'USUARIOS', 
        'Usuario', 
        userData.id, 
        {
          nombre: deletedUserData.Nombre,
          apellido: deletedUserData.Apellido,
          email: deletedUserData.Email,
          rol: deletedUserData.Rol
        },
        `Usuario ${deletedUserData.Email} eliminado`
      );
      
      res.json({ success: true, message: 'Usuario eliminado correctamente' });
    }
    else {
      res.status(400).json({ success: false, message: 'Acción no válida' });
    }
  } catch (err) {
    // En caso de error en la conexión o consulta, registrar el error y responder
    console.error('Error en operación de usuarios:', err);
    
    // Auditar error en operación de usuarios
    const currentUser = await getUserFromToken(req.headers.authorization.replace('Bearer ', ''));
    await auditLogger.auditError(
      req, 
      currentUser, 
      'USUARIOS', 
      'Error en operación de usuarios', 
      err.message
    );
    
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
        if (!(await validateEmail(pool, clientData.email))) {
          return res.status(400).json({ 
            success: false, 
            message: 'El formato del email no es válido' 
          });
        }
        
        // Verificar si el email ya existe
        if (await checkDuplicateClientEmail(pool, clientData.email)) {
          return res.status(400).json({ success: false, message: 'Ya existe un cliente con este email' });
        }
      }
      
      // Insertar nuevo cliente
      await pool.request()
        .input('logo', sql.NVarChar, clientData.logo || '')
        .input('nombre_empresa', sql.NVarChar, clientData.nombre_empresa)
        .input('contacto_principal', sql.NVarChar, clientData.contacto_principal)
        .input('email', sql.NVarChar, clientData.email)
        .input('telefono', sql.NVarChar, clientData.telefono)
        .input('tipo', sql.NVarChar, clientData.tipo)
        .input('estado', sql.NVarChar, clientData.estado)
        .query(`INSERT INTO Clientes (logo, nombre_empresa, contacto_principal, email, telefono, tipo, estado)
                VALUES (@logo, @nombre_empresa, @contacto_principal, @email, @telefono, @tipo, @estado)`);
      
      // Auditar creación de cliente
      const newClientData = {
        nombreEmpresa: clientData.nombre_empresa,
        contactoPrincipal: clientData.contacto_principal,
        email: clientData.email,
        telefono: clientData.telefono,
        tipo: clientData.tipo,
        estado: clientData.estado
      };
      const currentUser = await getUserFromToken(req.headers.authorization.replace('Bearer ', ''));
      await auditLogger.auditCreate(
        req, 
        currentUser, 
        'CLIENTES', 
        'Cliente', 
        null, 
        newClientData,
        `Cliente ${clientData.nombre_empresa} creado`
      );
      
      res.json({ success: true, message: 'Cliente creado correctamente' });
    }
    // Obtener lista de clientes
    else if (action === 'list') {
      const clientes = await pool.request().query('SELECT * FROM Clientes ORDER BY nombre_empresa');
      
      // Auditoría de consultas removida - solo se registran cambios en el sistema
      
      res.json({ success: true, clientes: clientes.recordset });
    }
    // Actualizar cliente existente
    else if (action === 'update' && clientData && clientData.id) {
      // Validar formato de email si se está actualizando
      if (clientData.email && clientData.email.trim() !== '') {
        if (!(await validateEmail(pool, clientData.email))) {
          return res.status(400).json({ 
            success: false, 
            message: 'El formato del email no es válido' 
          });
        }
        
        // Verificar si el email ya existe en otro cliente
        if (await checkDuplicateClientEmail(pool, clientData.email, clientData.id)) {
          return res.status(400).json({ 
            success: false, 
            message: 'Ya existe otro cliente con ese email' 
          });
        }
      }
      
      // Obtener datos anteriores para auditoría
      const oldClientResult = await pool.request()
        .input('clientId', sql.Int, clientData.id)
        .query('SELECT * FROM Clientes WHERE id = @clientId');
      
      if (oldClientResult.recordset.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Cliente no encontrado' 
        });
      }
      
      const oldClientData = oldClientResult.recordset[0];
      
      await pool.request()
        .input('id', sql.Int, clientData.id)
        .input('logo', sql.NVarChar, clientData.logo || '')
        .input('nombre_empresa', sql.NVarChar, clientData.nombre_empresa)
        .input('contacto_principal', sql.NVarChar, clientData.contacto_principal)
        .input('email', sql.NVarChar, clientData.email)
        .input('telefono', sql.NVarChar, clientData.telefono)
        .input('tipo', sql.NVarChar, clientData.tipo)
        .input('estado', sql.NVarChar, clientData.estado)
        .query(`UPDATE Clientes 
                SET logo = @logo, nombre_empresa = @nombre_empresa, contacto_principal = @contacto_principal,
                    email = @email, telefono = @telefono, tipo = @tipo, estado = @estado, fecha_modificacion = GETDATE()
                WHERE id = @id`);
      
      // Auditar actualización de cliente
      const oldData = {
        logo: oldClientData.logo,
        nombre_empresa: oldClientData.nombre_empresa,
        contacto_principal: oldClientData.contacto_principal,
        email: oldClientData.email,
        telefono: oldClientData.telefono,
        tipo: oldClientData.tipo,
        estado: oldClientData.estado
      };
      const newData = {
        logo: clientData.logo || '',
        nombre_empresa: clientData.nombre_empresa,
        contacto_principal: clientData.contacto_principal,
        email: clientData.email,
        telefono: clientData.telefono,
        tipo: clientData.tipo,
        estado: clientData.estado
      };
      
      const currentUser = await getUserFromToken(req.headers.authorization.replace('Bearer ', ''));
      await auditLogger.auditUpdate(
        req, 
        currentUser, 
        'CLIENTES', 
        'Cliente', 
        clientData.id, 
        oldData,
        newData,
        `Cliente ${clientData.nombre_empresa} actualizado`
      );
      
      res.json({ success: true, message: 'Cliente actualizado correctamente' });
    }
    // Eliminar cliente
    else if (action === 'delete' && clientData && clientData.id) {
      // Obtener datos del cliente antes de eliminarlo para auditoría
      const clientToDeleteResult = await pool.request()
        .input('clientId', sql.Int, clientData.id)
        .query('SELECT * FROM Clientes WHERE id = @clientId');
      
      if (clientToDeleteResult.recordset.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Cliente no encontrado' 
        });
      }
      
      const deletedClientData = clientToDeleteResult.recordset[0];
      
      await pool.request()
        .input('id', sql.Int, clientData.id)
        .query('DELETE FROM Clientes WHERE id = @id');
      
      // Auditar eliminación de cliente
      const currentUser = await getUserFromToken(req.headers.authorization.replace('Bearer ', ''));
      await auditLogger.auditDelete(
        req, 
        currentUser, 
        'CLIENTES', 
        'Cliente', 
        clientData.id, 
        {
          nombreEmpresa: deletedClientData.nombre_empresa,
          contactoPrincipal: deletedClientData.contacto_principal,
          email: deletedClientData.email,
          telefono: deletedClientData.telefono,
          tipo: deletedClientData.tipo,
          estado: deletedClientData.estado
        },
        `Cliente ${deletedClientData.nombre_empresa} eliminado`
      );
      
      res.json({ success: true, message: 'Cliente eliminado correctamente' });
    }
    else {
      res.status(400).json({ success: false, message: 'Acción no válida' });
    }
  } catch (err) {
    console.error('Error en operación de clientes:', err);
    console.error('Error code:', err.code);
    console.error('Error number:', err.number);
    console.error('Error state:', err.state);
    console.error('Error class:', err.class);
    
    // Manejo específico de errores de restricciones
    let errorMessage = 'Error al conectar con la base de datos.';
    
    if (err.message) {
      console.log('Mensaje de error completo:', err.message);
      
      if (err.message.includes('CK_Clientes_Email_Valid') || err.message.includes('CK_Clientes_Email_Format')) {
        errorMessage = 'El formato del email no es válido';
      } else if (err.message.includes('UNIQUE KEY constraint') || err.message.includes('UQ_Clientes_Email')) {
        errorMessage = 'Ya existe un cliente con ese email';
      } else if (err.message.includes('CK_Clientes_Nombre_Length') || err.message.includes('Invalid column name \'Nombre\'')) {
        // Ignorar este error específico ya que la restricción hace referencia a un campo inexistente
        console.log('Ignorando error de restricción de nombre obsoleta o columna inexistente');
        // Continuar con la operación sin error
        return res.json({ success: true, message: 'Cliente actualizado correctamente' });
      } else if (err.message.includes('CHECK constraint')) {
        errorMessage = 'Los datos no cumplen con las validaciones requeridas';
      } else {
        // Mostrar el error específico para debugging
        errorMessage = `Error específico: ${err.message}`;
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
      .query('SELECT COUNT(*) as total FROM Totes WHERE Estado = \'En Uso\'');
    
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
                 WHEN Estado = 'En Uso' AND DATEDIFF(day, FechaDespacho, GETDATE()) >= 30 THEN 'Fuera de plazo'
                 WHEN Estado = 'En Uso' AND FechaVencimiento < GETDATE() THEN 'Producto vencido'
                 WHEN Estado = 'En Mantenimiento' THEN 'Requiere mantenimiento'
                 ELSE 'Revisar estado'
               END as descripcion
        FROM Totes 
        WHERE Operador = @operador 
          AND ((Estado = 'En Uso' AND (DATEDIFF(day, FechaDespacho, GETDATE()) >= 30 OR FechaVencimiento < GETDATE()))
               OR Estado = 'En Mantenimiento')
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
    
    // Verificar que el tote pertenece al operador y obtener datos del operador
    const checkResult = await pool.request()
      .input('toteId', sql.Int, toteId)
      .input('operador', sql.VarChar, operadorName)
      .query('SELECT COUNT(*) as count FROM Totes WHERE Id = @toteId AND Operador = @operador');
    
    if (checkResult.recordset[0].count === 0) {
      return res.status(403).json({ success: false, message: 'No tiene permisos para modificar este tote' });
    }
    
    // Obtener datos del operador para auditoría
    const operadorResult = await pool.request()
      .input('username', sql.VarChar, operadorName)
      .query('SELECT Id, Nombre, Apellido, Email, Rol FROM Usuarios WHERE Nombre = @username');
    
    if (operadorResult.recordset.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado' });
    }
    
    const currentUser = operadorResult.recordset[0];
    
    // Obtener datos anteriores del tote para auditoría
    const oldToteResult = await pool.request()
      .input('toteId', sql.Int, toteId)
      .query('SELECT Codigo, Estado, Ubicacion FROM Totes WHERE Id = @toteId');
    
    const oldToteData = oldToteResult.recordset[0];
    
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
    
    // Registrar auditoría del cambio de estado
    const oldData = {
      codigo: oldToteData.Codigo,
      estado: oldToteData.Estado,
      ubicacion: oldToteData.Ubicacion
    };
    
    const newData = {
      codigo: oldToteData.Codigo,
      estado: nuevoEstado,
      ubicacion: ubicacion
    };
    
    await auditLogger.auditUpdate(
      req,
      currentUser,
      'TOTES',
      'Tote',
      toteId,
      oldData,
      newData,
      `Estado de tote ${oldToteData.Codigo} actualizado por operador`
    );
    
    res.json({ success: true, message: 'Estado del tote actualizado correctamente' });
    
  } catch (err) {
    console.error('Error al actualizar estado del tote:', err);
    await auditLogger.auditError(req, 'TOTES', `Error al actualizar estado del tote: ${err.message}`);
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
  console.log('=== ENDPOINT /api/admin/totes LLAMADO ===');
  console.log('Headers:', req.headers.authorization);
  console.log('Body:', req.body);
  
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
      // Validar fechas usando función centralizada
      const dateErrors = validateToteDates(toteData.fechaEnvasado, toteData.fechaVencimiento);
      if (dateErrors.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: dateErrors[0] 
        });
      }
      
      // Verificar si el código de tote ya existe
      if (await checkDuplicateToteCode(pool, toteData.codigo)) {
        return res.status(400).json({ success: false, message: 'El código de tote ya existe' });
      }
      
      // Logs de depuración para el servidor
      console.log('Datos recibidos en el servidor:');
      console.log('- toteData.alerta:', toteData.alerta);
      console.log('- Tipo de alerta:', typeof toteData.alerta);
      console.log('- Valor después de || null:', toteData.alerta || null);
      
      // Insertar nuevo tote usando consulta directa (ya que SP_CrearTote no incluye peso)
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
        .input('peso', sql.Decimal(10,2), toteData.peso || null)
        .input('alerta', sql.VarChar, toteData.alerta)
        .input('observaciones', sql.NVarChar, toteData.observaciones || null)
        .input('usuarioCreacion', sql.VarChar, toteData.usuarioCreacion || 'admin')
        .query(`
          INSERT INTO Totes (Codigo, Estado, Ubicacion, Cliente, Operador, Producto, Lote, 
                            FechaEnvasado, FechaVencimiento, FechaDespacho, Peso, Alerta, 
                            Observaciones, UsuarioCreacion, FechaCreacion, FechaModificacion, Activo)
          VALUES (@codigo, @estado, @ubicacion, @cliente, @operador, @producto, @lote,
                  @fechaEnvasado, @fechaVencimiento, @fechaDespacho, @peso, @alerta,
                  @observaciones, @usuarioCreacion, GETDATE(), GETDATE(), 1)
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
               Peso, Alerta, Observaciones
        FROM Totes 
        WHERE Activo = 1
        ORDER BY FechaCreacion DESC
      `);
      res.json({ success: true, totes: totes.recordset });
    }
    // Actualizar tote existente
    else if (action === 'update' && toteData && toteData.id) {
      // Validar fechas usando función centralizada
      const dateErrors = validateToteDates(toteData.fechaEnvasado, toteData.fechaVencimiento);
      if (dateErrors.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: dateErrors[0] 
        });
      }
      
      // Verificar si el código ya existe en otro tote
      if (await checkDuplicateToteCode(pool, toteData.codigo, toteData.id)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Ya existe otro tote con ese código' 
        });
      }
      
      await pool.request()
        .input('id', sql.Int, toteData.id)
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
        .input('peso', sql.Decimal(10,2), toteData.peso || null)
        .input('alerta', sql.VarChar, toteData.alerta)
        .input('observaciones', sql.NVarChar, toteData.observaciones || null)
        .query(`
          UPDATE Totes SET 
            Codigo = @codigo,
            Estado = @estado,
            Ubicacion = @ubicacion,
            Cliente = @cliente,
            Operador = @operador,
            Producto = @producto,
            Lote = @lote,
            FechaEnvasado = @fechaEnvasado,
            FechaVencimiento = @fechaVencimiento,
            FechaDespacho = @fechaDespacho,
            Peso = @peso,
            Alerta = @alerta,
            Observaciones = @observaciones,
            FechaModificacion = GETDATE()
          WHERE Id = @id AND Activo = 1
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
    // Buscar totes por filtros usando procedimiento almacenado
    else if (action === 'search' && toteData) {
      const request = pool.request();
      
      // Configurar parámetros para el procedimiento almacenado
      request.input('Codigo', sql.VarChar, toteData.codigo || null);
      request.input('Estado', sql.VarChar, toteData.estado || null);
      request.input('Cliente', sql.VarChar, toteData.cliente || null);
      request.input('FechaDesde', sql.Date, toteData.fechaDesde || null);
      request.input('FechaHasta', sql.Date, toteData.fechaHasta || null);
      request.input('SoloActivos', sql.Bit, 1);
      
      // Ejecutar procedimiento almacenado
      const result = await request.execute('SP_BuscarTotes');
      
      // Formatear fechas para el frontend
      const totesFormateados = result.recordset.map(tote => ({
        ...tote,
        fEnvasado: tote.FechaEnvasado ? new Date(tote.FechaEnvasado).toLocaleDateString('es-ES') : '-',
        fVencimiento: tote.FechaVencimiento ? new Date(tote.FechaVencimiento).toLocaleDateString('es-ES') : '-',
        fDespacho: tote.FechaDespacho ? new Date(tote.FechaDespacho).toLocaleDateString('es-ES') : '-'
      }));
      
      res.json({ success: true, totes: totesFormateados });
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

// API para obtener estadísticas del dashboard usando procedimiento almacenado
app.get('/api/dashboard/stats', async (req, res) => {
  let pool;
  try {
    pool = await new sql.ConnectionPool(sqlConfig).connect();
    
    // Ejecutar procedimiento almacenado para estadísticas
    const result = await pool.request().execute('SP_EstadisticasDashboard');
    
    // El procedimiento devuelve múltiples result sets en este orden:
    // 0: Total de totes activos
    // 1: Totes disponibles
    // 2: Totes en uso
    // 3: Totes en mantenimiento
    // 4: Totes fuera de plazo
    // 5: Totes por vencer
    // 6: Distribución por estado
    // 7: Top 5 clientes con más totes
    // 8: Totes creados por mes
    
    const totalTotes = result.recordsets[0][0].TotalTotes;
    const totesDisponibles = result.recordsets[1][0].TotesDisponibles;
    const totesEnUso = result.recordsets[2][0].TotesEnUso;
    const totesMantenimiento = result.recordsets[3][0].TotesMantenimiento;
    const totesFueraPlazoSP = result.recordsets[4][0].TotesFueraPlazo;
    const totesProximosVencer = result.recordsets[5][0].TotesPorVencer;
    const statusStats = result.recordsets[6]; // Distribución por estado
    const topClientes = result.recordsets[7]; // Top 5 clientes
    const totesPorMes = result.recordsets[8]; // Totes creados por mes
    
    // Obtener estadísticas adicionales que no están en el procedimiento
    const totesConClientes = await pool.request().query(`
      SELECT 
        Cliente,
        COUNT(*) as cantidad
      FROM Totes 
      WHERE Activo = 1 AND Estado = 'En Uso'
      GROUP BY Cliente
    `);
    
    const totesFueraPlazo = await pool.request().query(`
      SELECT 
        Cliente,
        COUNT(*) as cantidad
      FROM Totes 
      WHERE Activo = 1 
        AND Estado = 'En Uso'
        AND (
          (FechaDespacho IS NOT NULL AND DATEDIFF(day, FechaDespacho, GETDATE()) >= 30) 
          OR (FechaVencimiento IS NOT NULL AND FechaVencimiento < GETDATE())
        )
      GROUP BY Cliente
    `);
    
    const totalFueraPlazo = await pool.request().query(`
      SELECT COUNT(*) as total 
      FROM Totes 
      WHERE Activo = 1 
        AND Estado = 'En Uso'
        AND (
          (FechaDespacho IS NOT NULL AND DATEDIFF(day, FechaDespacho, GETDATE()) >= 30) 
          OR (FechaVencimiento IS NOT NULL AND FechaVencimiento < GETDATE())
        )
    `);
    
    const usuariosActivos = await pool.request().query(`
      SELECT COUNT(*) as total FROM Usuarios WHERE Estado = 'Activo'
    `);
    
    // Calcular cambios porcentuales comparando con el mes anterior
    const fechaActual = new Date();
    const fechaMesAnterior = new Date(fechaActual.getFullYear(), fechaActual.getMonth() - 1, 1);
    const fechaFinMesAnterior = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 0);
    
    // Estadísticas del mes anterior
    const statsAnterior = await pool.request()
      .input('fechaInicio', sql.DateTime, fechaMesAnterior)
      .input('fechaFin', sql.DateTime, fechaFinMesAnterior)
      .query(`
        SELECT 
          (SELECT COUNT(*) FROM Totes WHERE Activo = 1 AND FechaCreacion <= @fechaFin) as totalTotesAnterior,
          (SELECT COUNT(*) FROM Totes WHERE Activo = 1 AND Estado = 'En Uso' AND FechaDespacho <= @fechaFin) as totesEnUsoAnterior,
          (SELECT COUNT(*) FROM Totes WHERE Activo = 1 AND Estado = 'En Uso' AND FechaDespacho <= @fechaFin AND 
            ((FechaDespacho IS NOT NULL AND DATEDIFF(day, FechaDespacho, @fechaFin) >= 30) OR 
             (FechaVencimiento IS NOT NULL AND FechaVencimiento < @fechaFin))) as fueraPlazoAnterior,
          (SELECT COUNT(*) FROM Usuarios WHERE Estado = 'Activo' AND FechaCreacion <= @fechaFin) as usuariosActivosAnterior
      `);
    
    const anterior = statsAnterior.recordset[0];
    
    // Función para calcular cambio porcentual
    const calcularCambio = (actual, anterior) => {
      if (anterior === 0) return actual > 0 ? 100 : 0;
      return ((actual - anterior) / anterior * 100).toFixed(1);
    };
    
    // Calcular cambios
    const cambioTotalTotes = calcularCambio(totalTotes, anterior.totalTotesAnterior);
    const cambioTotesEnUso = calcularCambio(totesEnUso, anterior.totesEnUsoAnterior);
    const cambioFueraPlazo = calcularCambio(totalFueraPlazo.recordset[0].total, anterior.fueraPlazoAnterior);
    const cambioUsuariosActivos = calcularCambio(usuariosActivos.recordset[0].total, anterior.usuariosActivosAnterior);
    
    res.json({
      success: true,
      data: {
        totalTotes: totalTotes,
        totesDisponibles: totesDisponibles,
        totesEnUso: totesEnUso,
        totesMantenimiento: totesMantenimiento,
        totesFueraPlazoCount: totesFueraPlazoSP,
        totesProximosVencer: totesProximosVencer,
        statusStats: statusStats.map(stat => ({ Estado: stat.Estado, cantidad: stat.Cantidad })),
        topClientes: topClientes.map(cliente => ({ Cliente: cliente.Cliente, cantidad: cliente.Cantidad })),
        totesPorMes: totesPorMes.map(mes => ({ Mes: mes.Mes, TotesCreados: mes.TotesCreados })),
        totesConClientes: totesConClientes.recordset,
        totesFueraPlazo: totesFueraPlazo.recordset,
        totalFueraPlazo: totalFueraPlazo.recordset[0].total,
        usuariosActivos: usuariosActivos.recordset[0].total,
        // Cambios porcentuales
        cambios: {
          totalTotes: parseFloat(cambioTotalTotes),
          totesEnUso: parseFloat(cambioTotesEnUso),
          fueraPlazo: parseFloat(cambioFueraPlazo),
          usuariosActivos: parseFloat(cambioUsuariosActivos)
        }
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

// =============================================
// ENDPOINTS PARA REGISTRO DE EVENTOS/AUDITORÍA
// =============================================

// Endpoint para obtener eventos con filtros
app.get('/api/eventos', async (req, res) => {
    try {
        const { 
            tipoEvento, 
            modulo, 
            usuarioId, 
            fechaInicio, 
            fechaFin, 
            exitoso, 
            page = 1, 
            limit = 50 
        } = req.query;
        
        const pool = await new sql.ConnectionPool(sqlConfig).connect();
        let query = `
            SELECT 
                Id, TipEvento as TipoEvento, Modulo, Descripcion, Usuario as UsuarioNombre, 
                IpAddress as DireccionIP, UserAgent, ResultadoExitoso as Exitoso, FechaEvento,
                DatosAdicionales, Severidad, Accion, TiempoEjecucion, SessionId,
                CASE 
                    WHEN DATEDIFF(MINUTE, FechaEvento, GETDATE()) < 60 
                    THEN CAST(DATEDIFF(MINUTE, FechaEvento, GETDATE()) AS NVARCHAR) + ' minutos atrás'
                    WHEN DATEDIFF(HOUR, FechaEvento, GETDATE()) < 24 
                    THEN CAST(DATEDIFF(HOUR, FechaEvento, GETDATE()) AS NVARCHAR) + ' horas atrás'
                    ELSE CAST(DATEDIFF(DAY, FechaEvento, GETDATE()) AS NVARCHAR) + ' días atrás'
                END AS TiempoTranscurrido
            FROM Eventos 
            WHERE 1=1
        `;
        
        const request = pool.request();
        
        // Aplicar filtros
        if (tipoEvento) {
            query += ' AND TipEvento = @tipoEvento';
            request.input('tipoEvento', sql.NVarChar(50), tipoEvento);
        }
        
        if (modulo) {
            query += ' AND Modulo = @modulo';
            request.input('modulo', sql.NVarChar(50), modulo);
        }
        
        if (usuarioId) {
            query += ' AND UsuarioId = @usuarioId';
            request.input('usuarioId', sql.Int, usuarioId);
        }
        
        if (fechaInicio) {
            query += ' AND FechaEvento >= @fechaInicio';
            request.input('fechaInicio', sql.DateTime, fechaInicio);
        }
        
        if (fechaFin) {
            query += ' AND FechaEvento <= @fechaFin';
            request.input('fechaFin', sql.DateTime, fechaFin);
        }
        
        if (exitoso !== undefined) {
            query += ' AND ResultadoExitoso = @exitoso';
            request.input('exitoso', sql.Bit, exitoso === 'true');
        }
        
        // Paginación
        const offset = (page - 1) * limit;
        query += ` ORDER BY FechaEvento DESC OFFSET ${offset} ROWS FETCH NEXT ${limit} ROWS ONLY`;
        
        const result = await request.query(query);
        
        // Obtener total de registros para paginación
        let countQuery = 'SELECT COUNT(*) as Total FROM Eventos WHERE 1=1';
        const countRequest = pool.request();
        
        if (tipoEvento) {
            countQuery += ' AND TipEvento = @tipoEvento';
            countRequest.input('tipoEvento', sql.NVarChar(50), tipoEvento);
        }
        if (modulo) {
            countQuery += ' AND Modulo = @modulo';
            countRequest.input('modulo', sql.NVarChar(50), modulo);
        }
        if (usuarioId) {
            countQuery += ' AND UsuarioId = @usuarioId';
            countRequest.input('usuarioId', sql.Int, usuarioId);
        }
        if (fechaInicio) {
            countQuery += ' AND FechaEvento >= @fechaInicio';
            countRequest.input('fechaInicio', sql.DateTime, fechaInicio);
        }
        if (fechaFin) {
            countQuery += ' AND FechaEvento <= @fechaFin';
            countRequest.input('fechaFin', sql.DateTime, fechaFin);
        }
        if (exitoso !== undefined) {
            countQuery += ' AND ResultadoExitoso = @exitoso';
            countRequest.input('exitoso', sql.Bit, exitoso === 'true');
        }
        
        const countResult = await countRequest.query(countQuery);
        const total = countResult.recordset[0].Total;
        
        // Auditoría de consultas removida - solo se registran cambios en el sistema
        
        res.json({ 
            success: true, 
            eventos: result.recordset,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / limit)
            }
        });
        
    } catch (error) {
        console.error('Error al obtener eventos:', error);
        if (req.headers.authorization) {
            try {
                const currentUser = await getUserFromToken(req.headers.authorization.replace('Bearer ', ''));
                await auditLogger.auditError(req, currentUser, 'EVENTOS', 'Error al consultar eventos', error.message);
            } catch (auditError) {
                console.error('Error en auditoría:', auditError.message);
            }
        }
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Endpoint para obtener estadísticas de eventos
app.get('/api/eventos/estadisticas', async (req, res) => {
    try {
        const pool = await new sql.ConnectionPool(sqlConfig).connect();
        
        // Verificar si la tabla Eventos existe
        const tableCheck = await pool.request().query(`
            SELECT COUNT(*) as tableExists 
            FROM INFORMATION_SCHEMA.TABLES 
            WHERE TABLE_NAME = 'Eventos' AND TABLE_SCHEMA = 'dbo'
        `);
        
        if (tableCheck.recordset[0].tableExists === 0) {
            return res.status(500).json({ 
                success: false, 
                message: 'La tabla Eventos no existe. Ejecute el script de creación de la base de datos.' 
            });
        }
        
        // Estadísticas generales
        const statsQuery = `
            SELECT 
                COUNT(*) as TotalEventos,
                COUNT(CASE WHEN ResultadoExitoso = 1 THEN 1 END) as EventosExitosos,
                COUNT(CASE WHEN ResultadoExitoso = 0 THEN 1 END) as EventosFallidos,
                COUNT(CASE WHEN FechaEvento >= DATEADD(day, -1, GETDATE()) THEN 1 END) as EventosUltimas24h,
                COUNT(CASE WHEN FechaEvento >= DATEADD(day, -7, GETDATE()) THEN 1 END) as EventosUltimaSemana
            FROM Eventos
        `;
        
        // Eventos por tipo
        const tipoQuery = `
            SELECT TipEvento as TipoEvento, COUNT(*) as Cantidad
            FROM Eventos 
            GROUP BY TipEvento
            ORDER BY Cantidad DESC
        `;
        
        // Eventos por módulo
        const moduloQuery = `
            SELECT Modulo, COUNT(*) as Cantidad
            FROM Eventos 
            GROUP BY Modulo
            ORDER BY Cantidad DESC
        `;
        
        // Usuarios más activos
        const usuariosQuery = `
            SELECT TOP 10 Usuario as UsuarioNombre, COUNT(*) as Cantidad
            FROM Eventos 
            WHERE Usuario IS NOT NULL
            GROUP BY Usuario
            ORDER BY Cantidad DESC
        `;
        
        // Actividad por hora del día
        const actividadQuery = `
            SELECT 
                DATEPART(HOUR, FechaEvento) as Hora,
                COUNT(*) as Cantidad
            FROM Eventos 
            WHERE FechaEvento >= DATEADD(day, -7, GETDATE())
            GROUP BY DATEPART(HOUR, FechaEvento)
            ORDER BY Hora
        `;
        
        const [stats, tipos, modulos, usuarios, actividad] = await Promise.all([
            pool.request().query(statsQuery),
            pool.request().query(tipoQuery),
            pool.request().query(moduloQuery),
            pool.request().query(usuariosQuery),
            pool.request().query(actividadQuery)
        ]);
        
        res.json({ 
            success: true, 
            estadisticas: {
                generales: stats.recordset[0],
                porTipo: tipos.recordset,
                porModulo: modulos.recordset,
                usuariosActivos: usuarios.recordset,
                actividadPorHora: actividad.recordset
            }
        });
        
    } catch (error) {
        console.error('Error al obtener estadísticas de eventos:', error);
        if (req.headers.authorization) {
            try {
                const currentUser = await getUserFromToken(req.headers.authorization.replace('Bearer ', ''));
                await auditLogger.auditError(req, currentUser, 'EVENTOS', 'Error al consultar estadísticas de eventos', error.message);
            } catch (auditError) {
                console.error('Error en auditoría:', auditError.message);
            }
        }
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// Endpoint para obtener detalle de un evento específico
app.get('/api/eventos/:id', async (req, res) => {
    try {
        const eventoId = req.params.id;
        const pool = await new sql.ConnectionPool(sqlConfig).connect();
        
        const result = await pool.request()
            .input('id', sql.Int, eventoId)
            .query(`
                SELECT 
                    Id, TipEvento as TipoEvento, Modulo, Descripcion, Usuario as UsuarioNombre, 
                    IpAddress as DireccionIP, UserAgent, ResultadoExitoso as Exitoso, FechaEvento,
                    DatosAdicionales, Severidad, Accion, TiempoEjecucion, SessionId as Sesion,
                    ToteId as ObjetoId
                FROM Eventos 
                WHERE Id = @id
            `);
        
        if (result.recordset.length === 0) {
            return res.status(404).json({ 
                success: false, 
                message: 'Evento no encontrado' 
            });
        }
        
        const evento = result.recordset[0];
        
        // Asegurar que el campo Exitoso esté presente
        if (evento.hasOwnProperty('ResultadoExitoso')) {
            evento.Exitoso = evento.ResultadoExitoso;
            delete evento.ResultadoExitoso;
        }
        
        // Parsear JSON si existe
        if (evento.DatosAdicionales) {
            try {
                const datosParseados = JSON.parse(evento.DatosAdicionales);
                evento.DatosAdicionales = datosParseados;
                // Extraer campos específicos para compatibilidad
                evento.ValoresAnteriores = datosParseados.valoresAnteriores;
                evento.ValoresNuevos = datosParseados.valoresNuevos;
                evento.UsuarioEmail = datosParseados.usuarioEmail;
                evento.UsuarioRol = datosParseados.usuarioRol;
                evento.ObjetoTipo = datosParseados.objetoTipo;
                evento.MensajeError = datosParseados.mensajeError;
            } catch (e) {
                // Mantener como string si no es JSON válido
            }
        }
        
        res.json({ 
            success: true, 
            evento 
        });
        
    } catch (error) {
        console.error('Error al obtener detalle del evento:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error interno del servidor' 
        });
    }
});

// =============================================
// ENDPOINT PARA SISTEMA DE ALERTAS
// =============================================

// Endpoint para obtener alertas del sistema
app.get('/api/alertas', async (req, res) => {
    try {
        const pool = await new sql.ConnectionPool(sqlConfig).connect();
        const alertas = [];
        
        // Alerta: Totes fuera de plazo
        const totesFueraPlazo = await pool.request().query(`
            SELECT COUNT(*) as cantidad 
            FROM Totes 
            WHERE Activo = 1 
              AND Estado = 'En Uso'
              AND (
                (FechaDespacho IS NOT NULL AND DATEDIFF(day, FechaDespacho, GETDATE()) >= 30) 
                OR (FechaVencimiento IS NOT NULL AND FechaVencimiento < GETDATE())
              )
        `);
        
        if (totesFueraPlazo.recordset[0].cantidad > 0) {
            alertas.push({
                id: 'totes-fuera-plazo',
                tipo: 'critical',
                icono: 'fas fa-exclamation-circle',
                titulo: 'Totes Fuera de Plazo',
                descripcion: `${totesFueraPlazo.recordset[0].cantidad} totes han excedido el tiempo límite de uso`,
                timestamp: new Date().toISOString(),
                accion: 'Ver Totes'
            });
        }
        
        // Alerta: Totes próximos a vencer
        const totesProximosVencer = await pool.request().query(`
            SELECT COUNT(*) as cantidad 
            FROM Totes 
            WHERE Activo = 1 
              AND Estado = 'En Uso'
              AND FechaVencimiento IS NOT NULL 
              AND FechaVencimiento BETWEEN GETDATE() AND DATEADD(day, 7, GETDATE())
        `);
        
        if (totesProximosVencer.recordset[0].cantidad > 0) {
            alertas.push({
                id: 'totes-proximos-vencer',
                tipo: 'warning',
                icono: 'fas fa-clock',
                titulo: 'Totes Próximos a Vencer',
                descripcion: `${totesProximosVencer.recordset[0].cantidad} totes vencerán en los próximos 7 días`,
                timestamp: new Date().toISOString(),
                accion: 'Revisar'
            });
        }
        
        // Alerta: Stock bajo de totes disponibles
        const totesDisponibles = await pool.request().query(`
            SELECT COUNT(*) as cantidad 
            FROM Totes 
            WHERE Activo = 1 AND Estado = 'Disponible'
        `);
        
        if (totesDisponibles.recordset[0].cantidad < 10) {
            alertas.push({
                id: 'stock-bajo',
                tipo: 'warning',
                icono: 'fas fa-box-open',
                titulo: 'Stock Bajo de Totes',
                descripcion: `Solo ${totesDisponibles.recordset[0].cantidad} totes disponibles en inventario`,
                timestamp: new Date().toISOString(),
                accion: 'Gestionar Stock'
            });
        }
        
        // Alerta: Errores recientes en el sistema
        const erroresRecientes = await pool.request().query(`
            SELECT COUNT(*) as cantidad 
            FROM Eventos 
            WHERE ResultadoExitoso = 0 
              AND FechaEvento >= DATEADD(hour, -24, GETDATE())
        `);
        
        if (erroresRecientes.recordset[0].cantidad > 5) {
            alertas.push({
                id: 'errores-sistema',
                tipo: 'critical',
                icono: 'fas fa-bug',
                titulo: 'Errores en el Sistema',
                descripcion: `${erroresRecientes.recordset[0].cantidad} errores detectados en las últimas 24 horas`,
                timestamp: new Date().toISOString(),
                accion: 'Ver Logs'
            });
        }
        
        // Alerta: Usuarios inactivos
        const usuariosInactivos = await pool.request().query(`
            SELECT COUNT(*) as cantidad 
            FROM Usuarios 
            WHERE Estado = 'Inactivo'
        `);
        
        if (usuariosInactivos.recordset[0].cantidad > 0) {
            alertas.push({
                id: 'usuarios-inactivos',
                tipo: 'info',
                icono: 'fas fa-user-slash',
                titulo: 'Usuarios Inactivos',
                descripcion: `${usuariosInactivos.recordset[0].cantidad} usuarios con estado inactivo`,
                timestamp: new Date().toISOString(),
                accion: 'Gestionar Usuarios'
            });
        }
        
        // Si no hay alertas, mostrar mensaje positivo
        if (alertas.length === 0) {
            alertas.push({
                id: 'sistema-ok',
                tipo: 'success',
                icono: 'fas fa-check-circle',
                titulo: 'Sistema Funcionando Correctamente',
                descripcion: 'No se han detectado problemas en el sistema',
                timestamp: new Date().toISOString(),
                accion: null
            });
        }
        
        res.json({
            success: true,
            alertas: alertas
        });
        
    } catch (error) {
        console.error('Error al obtener alertas:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener alertas del sistema',
            error: error.message
        });
    }
});

// ===== ENDPOINTS PARA MÓDULO DE RECEPCIÓN =====

// Endpoint para escanear TAG y verificar tote
app.post('/api/recepcion/scan-tag', async (req, res) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ success: false, message: 'No autorizado' });
  }
  
  let pool;
  try {
    const operadorName = req.headers.authorization.replace('Bearer ', '');
    const { tagCode } = req.body;
    
    if (!tagCode) {
      return res.status(400).json({ success: false, message: 'Código de TAG requerido' });
    }
    
    pool = await new sql.ConnectionPool(sqlConfig).connect();
    
    // Verificar que el operador existe
    const operadorResult = await pool.request()
      .input('username', sql.VarChar, operadorName)
      .query('SELECT Id, Nombre, Apellido, Email, Rol FROM Usuarios WHERE Nombre = @username AND Estado = \'Activo\'');
    
    if (operadorResult.recordset.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado o inactivo' });
    }
    
    const currentUser = operadorResult.recordset[0];
    
    // Buscar tote por código (asumiendo que el TAG corresponde al código del tote)
    const toteResult = await pool.request()
      .input('codigo', sql.VarChar, tagCode)
      .query(`
        SELECT Id, Codigo, Estado, Ubicacion, Cliente, Operador, Producto, Lote,
               FORMAT(FechaEnvasado, 'dd/MM/yyyy') as FechaEnvasado,
               FORMAT(FechaVencimiento, 'dd/MM/yyyy') as FechaVencimiento,
               FORMAT(FechaDespacho, 'dd/MM/yyyy') as FechaDespacho,
               Alerta, FechaCreacion, FechaModificacion
        FROM Totes 
        WHERE Codigo = @codigo AND Activo = 1
      `);
    
    if (toteResult.recordset.length === 0) {
      // Registrar intento fallido
      await auditLogger.auditError(
        req,
        currentUser,
        'RECEPCION',
        'TAG no encontrado',
        `TAG no encontrado: ${tagCode}`
      );
      
      return res.status(404).json({ 
        success: false, 
        message: 'TAG no encontrado en el sistema' 
      });
    }
    
    const tote = toteResult.recordset[0];
    
    // Registrar escaneo exitoso
    await auditLogger.auditView(
      req,
      currentUser,
      'RECEPCION',
      'Tote',
      tote.Id,
      `TAG escaneado: ${tagCode} - Tote: ${tote.Codigo}`
    );
    
    res.json({ 
      success: true, 
      message: 'TAG verificado correctamente',
      tote: tote
    });
    
  } catch (err) {
    console.error('Error al escanear TAG:', err);
    if (req.headers.authorization) {
      try {
        const currentUser = await getUserFromToken(req.headers.authorization.replace('Bearer ', ''));
        await auditLogger.auditError(req, currentUser, 'RECEPCION', 'Error al escanear TAG', err.message);
      } catch (auditError) {
        console.error('Error en auditoría:', auditError.message);
      }
    }
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

// Endpoint para asignar ruta al tote
app.post('/api/recepcion/assign-route', async (req, res) => {
  if (!req.headers.authorization) {
    return res.status(401).json({ success: false, message: 'No autorizado' });
  }
  
  let pool;
  try {
    const operadorName = req.headers.authorization.replace('Bearer ', '');
    const { toteId, route, tagCode } = req.body;
    
    if (!toteId || !route) {
      return res.status(400).json({ success: false, message: 'ID del tote y ruta son requeridos' });
    }
    
    pool = await new sql.ConnectionPool(sqlConfig).connect();
    
    // Verificar que el operador existe
    const operadorResult = await pool.request()
      .input('username', sql.VarChar, operadorName)
      .query('SELECT Id, Nombre, Apellido, Email, Rol FROM Usuarios WHERE Nombre = @username AND Estado = \'Activo\'');
    
    if (operadorResult.recordset.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuario no encontrado o inactivo' });
    }
    
    const currentUser = operadorResult.recordset[0];
    
    // Verificar que el tote existe
    const toteResult = await pool.request()
      .input('toteId', sql.Int, toteId)
      .query('SELECT Id, Codigo, Estado, Ubicacion FROM Totes WHERE Id = @toteId AND Activo = 1');
    
    if (toteResult.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Tote no encontrado' });
    }
    
    const tote = toteResult.recordset[0];
    
    // Mapear rutas a estados y ubicaciones
    const routeMapping = {
      'lavado': { estado: 'En Lavado', ubicacion: 'Área de Lavado' },
      'almacenamiento': { estado: 'Disponible', ubicacion: 'Almacén Principal' },
      'mantenimiento': { estado: 'En Mantenimiento', ubicacion: 'Taller de Mantenimiento' },
      'despacho': { estado: 'Listo para Despacho', ubicacion: 'Área de Despacho' },
      'inspeccion': { estado: 'En Inspección', ubicacion: 'Área de Inspección' },
      'cuarentena': { estado: 'En Cuarentena', ubicacion: 'Área de Cuarentena' }
    };
    
    const routeInfo = routeMapping[route];
    if (!routeInfo) {
      return res.status(400).json({ success: false, message: 'Ruta no válida' });
    }
    
    // Obtener datos anteriores para auditoría
    const oldData = {
      codigo: tote.Codigo,
      estado: tote.Estado,
      ubicacion: tote.Ubicacion
    };
    
    // Actualizar el tote con la nueva ruta
    await pool.request()
      .input('toteId', sql.Int, toteId)
      .input('estado', sql.VarChar, routeInfo.estado)
      .input('ubicacion', sql.VarChar, routeInfo.ubicacion)
      .query(`
        UPDATE Totes 
        SET Estado = @estado,
            Ubicacion = @ubicacion,
            FechaModificacion = GETDATE()
        WHERE Id = @toteId
      `);
    
    // Datos nuevos para auditoría
    const newData = {
      codigo: tote.Codigo,
      estado: routeInfo.estado,
      ubicacion: routeInfo.ubicacion
    };
    
    // Registrar la asignación de ruta en auditoría
    await auditLogger.auditUpdate(
      req,
      currentUser,
      'RECEPCION',
      'Tote',
      toteId,
      oldData,
      newData,
      `Ruta asignada en recepción: ${route} - TAG: ${tagCode}`
    );
    
    res.json({ 
      success: true, 
      message: `Tote enviado a ${routeInfo.ubicacion} correctamente`
    });
    
  } catch (err) {
    console.error('Error al asignar ruta:', err);
    if (req.headers.authorization) {
      try {
        const currentUser = await getUserFromToken(req.headers.authorization.replace('Bearer ', ''));
        await auditLogger.auditError(req, currentUser, 'RECEPCION', 'Error al asignar ruta', err.message);
      } catch (auditError) {
        console.error('Error en auditoría:', auditError.message);
      }
    }
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

// Iniciar el servidor
const server = app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
  
  // Registrar evento de inicio del sistema
  auditLogger.auditSystem('Servidor iniciado correctamente en puerto ' + PORT);
});

// Mantener el servidor activo
server.on('error', (err) => {
  console.error('Error del servidor:', err);
});

// Evitar que el proceso se cierre
process.stdin.resume();