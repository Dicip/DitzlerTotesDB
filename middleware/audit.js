// Middleware de Auditoría para DitzlerTotes
// Registra automáticamente todos los eventos del sistema

const sql = require('mssql');

class AuditLogger {
    constructor() {
        this.sessionStore = new Map(); // Almacena información de sesiones
    }

    // Mapear tipos de eventos a valores válidos
    mapearTipoEvento(tipo) {
        const mapeo = {
            'CREATE': 'Creacion',
            'UPDATE': 'Actualizacion', 
            'DELETE': 'Eliminacion',
            'LOGIN': 'Login',
            'LOGOUT': 'Logout',
            'ERROR': 'Error',
            'ALERT': 'Alerta',
            'CONFIG': 'Configuracion',
            'REPORT': 'Reporte',
            'EXPORT': 'Exportacion',
            'IMPORT': 'Importacion',
            'VALIDATION': 'Validacion',
            'NOTIFICATION': 'Notificacion',
            'VIEW': 'Configuracion'
        };
        return mapeo[tipo] || 'Configuracion';
    }

    // Obtener información del cliente
    getClientInfo(req) {
        let ip = 'Unknown';
        
        try {
            const forwarded = req.headers['x-forwarded-for'];
            if (forwarded) {
                ip = forwarded.split(',')[0].trim();
            } else if (req.ip) {
                ip = req.ip;
            } else if (req.socket && req.socket.remoteAddress) {
                ip = req.socket.remoteAddress;
            } else if (req.connection && req.connection.remoteAddress) {
                ip = req.connection.remoteAddress;
            }
        } catch (error) {
            console.log('[AUDIT] Error obteniendo IP del cliente:', error.message);
            ip = 'Unknown';
        }
        
        // Validar y ajustar IP para cumplir con restricciones de BD (7-45 caracteres)
        if (!ip || ip === 'Unknown' || ip.length < 7 || ip.length > 45) {
            ip = '127.0.0.1'; // IP por defecto válida
        }
        
        const userAgent = req.headers['user-agent'] || 'Unknown';
        
        return {
            ip: ip,
            userAgent: userAgent.substring(0, 500) // Limitar longitud
        };
    }

    // Generar ID de sesión único
    generateSessionId() {
        return 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Registrar evento en la base de datos
    async logEvent({
        tipoEvento,
        modulo,
        descripcion,
        usuarioId = null,
        usuarioNombre,
        usuarioEmail = null,
        usuarioRol,
        objetoId = null,
        objetoTipo = null,
        valoresAnteriores = null,
        valoresNuevos = null,
        direccionIP = null,
        userAgent = null,
        exitoso = true,
        mensajeError = null,
        sesion = null
    }) {
        let pool;
        try {
            const sqlConfig = {
                user: 'sa',
                password: '123',
                database: 'Ditzler',
                server: 'localhost',
                port: 1433,
                options: {
                    encrypt: false,
                    trustServerCertificate: true,
                    connectTimeout: 30000,
                    requestTimeout: 30000
                },
                pool: {
                    max: 10,
                    min: 0,
                    idleTimeoutMillis: 30000
                }
            };
            
            pool = await new sql.ConnectionPool(sqlConfig).connect();
            


        // Preparar datos adicionales como JSON
        const datosAdicionales = JSON.stringify({
            usuarioId,
            usuarioEmail,
            usuarioRol,
            objetoTipo,
            valoresAnteriores,
            valoresNuevos,
            mensajeError
        });

        const result = await pool.request()
            .input('toteId', sql.Int, objetoTipo === 'Tote' ? objetoId : null)
            .input('tipEvento', sql.NVarChar(50), this.mapearTipoEvento(tipoEvento))
            .input('descripcion', sql.NVarChar(500), descripcion)
            .input('usuario', sql.NVarChar(255), usuarioNombre)
            .input('datosAdicionales', sql.NVarChar(sql.MAX), datosAdicionales)
            .input('ipAddress', sql.NVarChar(45), direccionIP)
            .input('userAgent', sql.NVarChar(500), userAgent)
            .input('severidad', sql.NVarChar(20), exitoso ? 'Info' : 'Error')
            .input('modulo', sql.NVarChar(50), modulo)
            .input('accion', sql.NVarChar(100), tipoEvento)
            .input('resultadoExitoso', sql.Bit, exitoso)
            .input('tiempoEjecucion', sql.Int, null)
            .input('sessionId', sql.NVarChar(100), sesion)
            .execute('SP_RegistrarEvento');
                
            console.log(`[AUDIT] ${tipoEvento} - ${modulo}: ${descripcion}`);
        } catch (error) {
            console.error('[AUDIT ERROR] Error al registrar evento:', error.message);
            // No lanzar error para evitar interrumpir la operación principal
        } finally {
            if (pool) {
                try {
                    await pool.close();
                } catch (err) {
                    console.error('[AUDIT] Error al cerrar conexión:', err.message);
                }
            }
        }
    }

    // Middleware para auditar requests HTTP
    auditMiddleware() {
        return (req, res, next) => {
            const clientInfo = this.getClientInfo(req);
            
            // Agregar información de auditoría al request
            req.audit = {
                clientInfo,
                sessionId: req.session?.id || this.generateSessionId(),
                startTime: Date.now()
            };

            // Interceptar respuesta para logging
            const originalSend = res.send;
            res.send = function(data) {
                req.audit.endTime = Date.now();
                req.audit.responseTime = req.audit.endTime - req.audit.startTime;
                req.audit.statusCode = res.statusCode;
                
                originalSend.call(this, data);
            };

            next();
        };
    }

    // Auditar login
    async auditLogin(req, usuario, exitoso = true, mensajeError = null) {
        const clientInfo = this.getClientInfo(req);
        
        await this.logEvent({
            tipoEvento: 'LOGIN',
            modulo: 'USUARIOS',
            descripcion: exitoso ? 
                `Usuario ${usuario.Email} inició sesión exitosamente` : 
                `Intento de login fallido para ${usuario.Email || 'usuario desconocido'}`,
            usuarioId: exitoso ? usuario.Id : null,
            usuarioNombre: exitoso ? `${usuario.Nombre} ${usuario.Apellido}` : 'Usuario desconocido',
            usuarioEmail: usuario.Email,
            usuarioRol: exitoso ? usuario.Rol : 'Desconocido',
            direccionIP: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            exitoso,
            mensajeError,
            sesion: req.audit?.sessionId
        });
    }

    // Auditar logout
    async auditLogout(req, usuario) {
        const clientInfo = this.getClientInfo(req);
        
        await this.logEvent({
            tipoEvento: 'LOGOUT',
            modulo: 'USUARIOS',
            descripcion: `Usuario ${usuario.Email} cerró sesión`,
            usuarioId: usuario.Id,
            usuarioNombre: `${usuario.Nombre} ${usuario.Apellido}`,
            usuarioEmail: usuario.Email,
            usuarioRol: usuario.Rol,
            direccionIP: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            sesion: req.audit?.sessionId
        });
    }

    // Auditar creación de registros
    async auditCreate(req, usuario, modulo, objetoTipo, objetoId, valoresNuevos, descripcion) {
        const clientInfo = this.getClientInfo(req);
        
        await this.logEvent({
            tipoEvento: 'CREATE',
            modulo,
            descripcion: descripcion || `Nuevo ${objetoTipo.toLowerCase()} creado`,
            usuarioId: usuario.Id,
            usuarioNombre: `${usuario.Nombre} ${usuario.Apellido}`,
            usuarioEmail: usuario.Email,
            usuarioRol: usuario.Rol,
            objetoId: objetoId?.toString(),
            objetoTipo,
            valoresNuevos: JSON.stringify(valoresNuevos),
            direccionIP: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            sesion: req.audit?.sessionId
        });
    }

    // Auditar actualización de registros
    async auditUpdate(req, usuario, modulo, objetoTipo, objetoId, valoresAnteriores, valoresNuevos, descripcion) {
        const clientInfo = this.getClientInfo(req);
        
        await this.logEvent({
            tipoEvento: 'UPDATE',
            modulo,
            descripcion: descripcion || `${objetoTipo} actualizado`,
            usuarioId: usuario.Id,
            usuarioNombre: `${usuario.Nombre} ${usuario.Apellido}`,
            usuarioEmail: usuario.Email,
            usuarioRol: usuario.Rol,
            objetoId: objetoId?.toString(),
            objetoTipo,
            valoresAnteriores: JSON.stringify(valoresAnteriores),
            valoresNuevos: JSON.stringify(valoresNuevos),
            direccionIP: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            sesion: req.audit?.sessionId
        });
    }

    // Auditar eliminación de registros
    async auditDelete(req, usuario, modulo, objetoTipo, objetoId, valoresAnteriores, descripcion) {
        const clientInfo = this.getClientInfo(req);
        
        await this.logEvent({
            tipoEvento: 'DELETE',
            modulo,
            descripcion: descripcion || `${objetoTipo} eliminado`,
            usuarioId: usuario.Id,
            usuarioNombre: `${usuario.Nombre} ${usuario.Apellido}`,
            usuarioEmail: usuario.Email,
            usuarioRol: usuario.Rol,
            objetoId: objetoId?.toString(),
            objetoTipo,
            valoresAnteriores: JSON.stringify(valoresAnteriores),
            direccionIP: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            sesion: req.audit?.sessionId
        });
    }

    // Auditar visualización de datos sensibles
    async auditView(req, usuario, modulo, objetoTipo, objetoId, descripcion) {
        const clientInfo = this.getClientInfo(req);
        
        await this.logEvent({
            tipoEvento: 'VIEW',
            modulo,
            descripcion: descripcion || `Consulta de ${objetoTipo.toLowerCase()}`,
            usuarioId: usuario.Id,
            usuarioNombre: `${usuario.Nombre} ${usuario.Apellido}`,
            usuarioEmail: usuario.Email,
            usuarioRol: usuario.Rol,
            objetoId: objetoId?.toString(),
            objetoTipo,
            direccionIP: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            sesion: req.audit?.sessionId
        });
    }

    // Auditar errores del sistema
    async auditError(req, usuario, modulo, descripcion, mensajeError) {
        const clientInfo = this.getClientInfo(req);
        
        await this.logEvent({
            tipoEvento: 'ERROR',
            modulo,
            descripcion,
            usuarioId: usuario?.Id,
            usuarioNombre: usuario ? `${usuario.Nombre} ${usuario.Apellido}` : 'Sistema',
            usuarioEmail: usuario?.Email,
            usuarioRol: usuario?.Rol || 'Sistema',
            direccionIP: clientInfo.ip,
            userAgent: clientInfo.userAgent,
            exitoso: false,
            mensajeError,
            sesion: req.audit?.sessionId
        });
    }

    // Auditar eventos del sistema
    async auditSystem(descripcion, exitoso = true, mensajeError = null) {
        try {
            await this.logEvent({
                tipoEvento: 'SISTEMA',
                modulo: 'SISTEMA',
                descripcion,
                usuarioNombre: 'Sistema',
                usuarioRol: 'Sistema',
                direccionIP: '127.0.0.1',
                userAgent: 'Sistema',
                exitoso,
                mensajeError
            });
        } catch (error) {
            console.log('[AUDIT] Error en auditSystem:', error.message);
            // No relanzar el error para evitar bucles
        }
    }
}

// Exportar instancia singleton
module.exports = new AuditLogger();