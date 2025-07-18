const sql = require('mssql');

// Configuración de conexión a SQL Server
const sqlConfig = {
  user: 'sa',
  password: '123',
  database: 'Ditzler',
  server: 'localhost',
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: 'SQLEXPRESS'
  }
};

async function testConnection() {
  try {
    console.log('Intentando conectar a SQL Server...');
    await sql.connect(sqlConfig);
    console.log('Conexión exitosa a SQL Server');
    
    // Probar una consulta simple
    const result = await sql.query`SELECT TOP 1 * FROM Usuarios`;
    console.log('Resultado de la consulta:', result.recordset);
    
    await sql.close();
  } catch (err) {
    console.error('Error al conectar a SQL Server:', err);
  }
}

testConnection();