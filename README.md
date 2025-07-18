# DitzlerTotes - Sistema de Gestión Integral

## Descripción
Sistema completo de gestión para DitzlerTotes que incluye administración de usuarios, gestión de clientes y control de totes. La aplicación utiliza SQL Server como base de datos con restricciones avanzadas, triggers de sincronización automática y validaciones completas tanto en frontend como backend.

## Estructura del Proyecto

```
DitzlerTotes/
├── index.html                    # Página principal de inicio de sesión
├── server.js                     # Servidor Express con API REST completa
├── package.json                  # Configuración y dependencias del proyecto
├── css/
│   ├── styles.css               # Estilos globales de la aplicación
│   ├── dashboard-styles.css     # Estilos del panel de control
│   ├── admin-users-styles.css   # Estilos para gestión de usuarios
│   ├── clientes-styles.css      # Estilos para gestión de clientes
│   ├── totes-styles.css         # Estilos para gestión de totes
│   ├── dark-mode.css            # Estilos para modo oscuro
│   └── modern-buttons.css       # Estilos modernos para botones
├── js/
│   ├── script.js                # Lógica de inicio de sesión
│   ├── dashboard.js             # Lógica del panel de control
│   ├── admin-users.js           # Gestión de usuarios con validaciones
│   ├── clientes.js              # Gestión de clientes con validaciones
│   ├── totes.js                 # Gestión de totes con validaciones
│   └── dark-mode.js             # Funcionalidad de modo oscuro
├── pages/
│   ├── dashboard.html           # Panel de control principal
│   ├── admin-users.html         # Gestión de usuarios
│   ├── clientes.html            # Gestión de clientes
│   └── totes.html               # Gestión de totes
├── database/
│   ├── complete_database_script.sql  # Script completo de base de datos
│   ├── add_sync_triggers.sql          # Triggers de sincronización
│   └── insert_totes_sample.sql        # Datos de ejemplo para totes
├── assets/
│   └── images/                  # Recursos gráficos
└── node_modules/                # Dependencias (generado por npm)
```

## Funcionalidades

### 🔐 Autenticación y Seguridad
- Inicio de sesión con validación de credenciales en base de datos
- Verificación de permisos por roles (Admin, Operator, Viewer)
- Sesiones seguras con validación de estado
- Modo oscuro/claro personalizable

### 👥 Gestión de Usuarios
- CRUD completo de usuarios con validaciones avanzadas
- Validación de email con función de base de datos (`FN_ValidarEmail`)
- Contraseñas con longitud mínima y encriptación
- Roles y permisos granulares
- Validaciones HTML5 y JavaScript en tiempo real

### 🏢 Gestión de Clientes
- Administración completa de clientes corporativos
- Validación de datos de contacto y email opcional
- Categorización por tipo de cliente (Corporativo, PYME)
- Estados de cliente (Activo, Inactivo, Suspendido)
- Sincronización automática con tabla de totes

### 📦 Control de Totes
- Gestión completa del ciclo de vida de totes
- Estados: Disponible, En Uso, En Lavado, Con Cliente, En Mantenimiento, Fuera de Servicio
- Validaciones de fechas (envasado no futura, vencimiento posterior)
- Códigos únicos con validación de duplicados
- Alertas automáticas de vencimiento
- Soft delete para mantener historial

### 🔄 Sincronización Automática
- Triggers que actualizan automáticamente nombres en totes
- Cambios en clientes se reflejan instantáneamente
- Cambios en usuarios se propagan automáticamente
- Eliminación de actualizaciones manuales

### 📊 Panel de Control
- Dashboard con estadísticas en tiempo real
- Visualización de estados de totes
- Alertas de vencimientos próximos
- Historial de actividad del sistema

## Cómo Usar

### Instalación

#### Requisitos Previos
- Node.js 14 o superior
- SQL Server 2016 o superior
- SQL Server Management Studio (SSMS) o Azure Data Studio
- Permisos de administrador en SQL Server

#### Pasos de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone [url-del-repositorio]
   cd DitzlerTotes
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar la base de datos**
   - Abrir SQL Server Management Studio
   - Ejecutar el script `database/complete_database_script.sql`
   - Ejecutar `database/add_sync_triggers.sql` para habilitar sincronización automática

4. **Configurar conexión a base de datos**
   Actualizar las credenciales en `server.js`:
   ```javascript
   const sqlConfig = {
     user: 'sa',                    // Su usuario de SQL Server
     password: '123',               // Su contraseña
     database: 'Ditzler',           // Nombre de la base de datos
     server: 'localhost',           // Servidor
     port: 1433,                    // Puerto
     options: {
       encrypt: false,
       trustServerCertificate: true
     }
   };
   ```

### Ejecución del Servidor

1. Para iniciar el servidor en modo producción:
   ```
   npm start
   ```

2. Para iniciar el servidor en modo desarrollo (con recarga automática):
   ```
   npm run dev
   ```

3. Abra su navegador y vaya a `http://localhost:3000`

### Uso de la Aplicación

1. **Iniciar sesión**
   - Usuario por defecto: admin@ditzler.com
   - Contraseña: admin123
   - ⚠️ **Cambiar credenciales por defecto** por seguridad

2. **Navegación del sistema**
   - **Dashboard**: Estadísticas y resumen general
   - **Usuarios**: Gestión completa de usuarios del sistema
   - **Clientes**: Administración de clientes corporativos
   - **Totes**: Control y seguimiento de totes

3. **Características especiales**
   - Modo oscuro/claro en la esquina superior derecha
   - Validaciones en tiempo real en todos los formularios
   - Sincronización automática entre módulos
   - Alertas de vencimiento en totes

## Características Técnicas Avanzadas

### 🏗️ Arquitectura
- **Backend**: Express.js con API REST completa
- **Base de datos**: SQL Server con restricciones avanzadas
- **Frontend**: JavaScript vanilla con validaciones HTML5
- **Conexión**: mssql para Node.js con parámetros preparados

### 🔒 Seguridad Implementada
- **Prevención de inyección SQL**: Parámetros preparados en todas las consultas
- **Validación doble**: Frontend (HTML5/JS) y backend (SQL Server)
- **Funciones de base de datos**: `FN_ValidarEmail` para validación de emails
- **Restricciones CHECK**: Validación de fechas y formatos en base de datos

### 🔄 Sincronización Automática
- **Triggers de base de datos**: `TR_Clientes_UpdateTotes` y `TR_Usuarios_UpdateTotes`
- **Actualización en tiempo real**: Cambios se propagan automáticamente
- **Integridad referencial**: Mantenimiento automático de consistencia

### ✅ Validaciones Implementadas
- **Emails**: Regex consistente + función de base de datos
- **Fechas**: Validación de fechas futuras y rangos lógicos
- **Códigos únicos**: Verificación de duplicados en tiempo real
- **Campos obligatorios**: Validación HTML5 nativa

### 📊 Base de Datos
- **Tablas principales**: Usuarios, Clientes, Totes
- **Índices optimizados**: Para búsquedas y consultas frecuentes
- **Soft delete**: Mantenimiento de historial en totes
- **Auditoría automática**: Timestamps de creación y modificación

### 🎨 Interfaz de Usuario
- **Diseño responsivo**: Adaptable a diferentes pantallas
- **Modo oscuro/claro**: Personalización de tema
- **Validación en tiempo real**: Feedback inmediato al usuario
- **Mensajes específicos**: Errores descriptivos y claros

## Mejoras Futuras

### 🔐 Seguridad Avanzada
- Implementar hashing seguro para contraseñas (bcrypt, Argon2)
- Autenticación de dos factores (2FA)
- JWT (JSON Web Tokens) para gestión de sesiones
- Implementar HTTPS para comunicaciones seguras

### 📧 Notificaciones
- Sistema de notificaciones por email
- Alertas automáticas de vencimiento de totes
- Notificaciones de cambios importantes

### 📊 Reportes y Analytics
- Dashboard con gráficos avanzados
- Reportes de uso de totes
- Estadísticas de clientes
- Exportación a Excel/PDF

### 🧪 Testing y Calidad
- Pruebas unitarias y de integración
- Pruebas automatizadas de API
- Cobertura de código

### ⚡ Rendimiento
- Optimización de consultas SQL
- Caché de datos frecuentes
- Paginación en listados grandes
- Compresión de recursos

### 📱 Funcionalidades Adicionales
- API móvil para operadores
- Códigos QR para totes
- Sistema de logs para auditoría
- Backup automático de base de datos