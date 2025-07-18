const express = require('express');
const path = require('path');
const sql = require('mssql');
const app = express();
const PORT = process.env.PORT || 3000;

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

// Endpoint para probar la conexión a la base de datos
app.get('/api/test-db-connection', async (req, res) => {
  try {
    console.log('Probando conexión a la base de datos...');
    await sql.connect(sqlConfig);
    console.log('Conexión a la base de datos establecida correctamente');
    
    // Ejecutar una consulta simple para verificar que todo funciona
    const result = await sql.query`SELECT TOP 1 * FROM Usuarios`;
    
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
    try {
      await sql.close();
  } catch (err) {
      console.error('Error al cerrar la conexión:', err);
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
      .query('SELECT * FROM Usuarios WHERE Email = @email AND Password = @password AND Estado = \'Active\'');

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
  
  try {
    const { action, userData } = req.body;
    await sql.connect(sqlConfig);
    
    // Crear nuevo usuario
    if (action === 'create' && userData) {
      // Verificar si el usuario ya existe
      const checkUser = await sql.query`
        SELECT COUNT(*) as count FROM Usuarios WHERE Nombre = ${userData.nombre}
      `;
      
      if (checkUser.recordset[0].count > 0) {
        return res.status(400).json({ success: false, message: 'El nombre de usuario ya existe' });
      }
      
      // Insertar nuevo usuario
      await sql.query`
        INSERT INTO Usuarios (Nombre, Apellido, Password, Email, Rol, Estado)
        VALUES (${userData.nombre}, ${userData.apellido}, ${userData.password}, 
                ${userData.email}, ${userData.rol || 'Viewer'}, 'Active')
      `;
      
      res.json({ success: true, message: 'Usuario creado correctamente' });
    }
    // Obtener lista de usuarios
    else if (action === 'list') {
      const users = await sql.query`SELECT * FROM Usuarios`;
      res.json({ success: true, users: users.recordset });
    }
    // Actualizar usuario existente
    else if (action === 'update' && userData && userData.id) {
      await sql.query`
        UPDATE Usuarios 
        SET Nombre = ${userData.nombre},
            Apellido = ${userData.apellido},
            Email = ${userData.email},
            Rol = ${userData.rol},
            Estado = ${userData.estado}
        WHERE Id = ${userData.id}
      `;
      
      res.json({ success: true, message: 'Usuario actualizado correctamente' });
    }
    // Eliminar usuario
    else if (action === 'delete' && userData && userData.id) {
      await sql.query`DELETE FROM Usuarios WHERE Id = ${userData.id}`;
      res.json({ success: true, message: 'Usuario eliminado correctamente' });
    }
    else {
      res.status(400).json({ success: false, message: 'Acción no válida' });
    }
  } catch (err) {
    // En caso de error en la conexión o consulta, registrar el error y responder
    console.error('Error en la base de datos:', err);
    res.status(500).json({ success: false, message: 'Error al conectar con la base de datos.' });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});