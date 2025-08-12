# DitzlerTotes - Sistema de Gestión Integral

## Descripción
Sistema completo de gestión para DitzlerTotes que incluye administración de usuarios, gestión de clientes y control de totes. La aplicación utiliza SQL Server como base de datos con restricciones avanzadas, triggers de sincronización automática y validaciones completas tanto en frontend como backend.

**Características destacadas:**
- ✅ Panel de operador optimizado para móviles y tablets
- ✅ Configuración de API con URLs relativas para compatibilidad con túneles públicos
- ✅ Sistema de auditoría completo con middleware personalizado
- ✅ Interfaz simplificada para operadores de totes con flujos de trabajo específicos

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
│   ├── operador-styles.css      # Estilos específicos para operarios
│ 
│   └── modern-buttons.css       # Estilos modernos para botones
├── js/
│   ├── script.js                # Lógica de inicio de sesión
│   ├── dashboard.js             # Lógica del panel de control
│   ├── admin-users.js           # Gestión de usuarios con validaciones
│   ├── clientes.js              # Gestión de clientes con validaciones
│   ├── totes.js                 # Gestión de totes con validaciones
│   ├── operador.js              # Lógica del dashboard de operarios
│   ├── totes-operador.js        # Gestión de totes para operarios
│ 
├── pages/
│   ├── dashboard.html           # Panel de control principal
│   ├── admin-users.html         # Gestión de usuarios
│   ├── clientes.html            # Gestión de clientes
│   ├── totes.html               # Gestión de totes
│   ├── operador.html            # Dashboard específico para operarios
│   ├── operador-totes.html      # Panel optimizado para operadores de totes (móvil/tablet)
│   ├── operador-preparados.html # Panel para operadores de preparados
│   ├── operador-despacho.html   # Panel para operadores de despacho
│   ├── eventos.html             # Interfaz de consulta de eventos y auditoría
│   └── totes-operador.html      # Gestión de totes para operarios (legacy)
├── public/
│   ├── eventos.html             # Interfaz de registro de eventos
│   └── js/
│       └── eventos.js           # Lógica del sistema de auditoría
├── middleware/
│   └── audit.js                 # Sistema de auditoría y logging
├── database/
│   ├── complete_database_script.sql  # Script completo de base de datos
│   ├── corrected_database_script.sql # Script corregido sin errores
│   └── COMPARACION_Y_CORRECCIONES.md # Documentación de correcciones
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
- Sistema de auditoría completo con registro de eventos

### 👥 Gestión de Usuarios
- CRUD completo de usuarios con validaciones avanzadas
- Validación de email con función de base de datos (`FN_ValidarEmail`)
- Contraseñas con longitud mínima y encriptación
- Roles y permisos granulares (Admin, Operario, Viewer)
- Validaciones HTML5 y JavaScript en tiempo real
- Auditoría automática de cambios de usuarios

### 🏢 Gestión de Clientes
- Administración completa de clientes corporativos
- Validación de datos de contacto y email opcional
- Categorización por tipo de cliente (Corporativo, PYME)
- Estados de cliente (Activo, Inactivo, Suspendido)
- Sincronización automática con tabla de totes
- Registro de eventos en todas las operaciones

### 📦 Control de Totes
- Gestión completa del ciclo de vida de totes
- Estados: Disponible, En Uso, En Lavado, Con Cliente, En Mantenimiento, Fuera de Servicio
- Validaciones de fechas (envasado no futura, vencimiento posterior)
- Códigos únicos con validación de duplicados
- Alertas automáticas de vencimiento
- Soft delete para mantener historial
- **Interfaz específica para operarios** con funcionalidades limitadas
- **Auditoría completa** de cambios de estado y ubicación

### 👷 Gestión de Operarios
- **Panel de Operador de Totes optimizado** para dispositivos móviles y tablets
- **Dos flujos principales de trabajo**:
  - 🔄 **Tote con Contenido Reutilizable**: Proceso para totes que van al patio para evaluación
  - 🧽 **Tote para Lavado Directo**: Proceso para totes que van directamente a lavado
- **Interfaz touch-friendly** con botones grandes e intuitivos
- **Modales de proceso** con pasos claros y escaneo de códigos
- **Actualización automática de estados** según el flujo seleccionado
- **Diseño responsivo** optimizado para uso en campo
- **Validación de permisos** para acceso solo a funciones asignadas
- **Registro automático** de todas las acciones en el sistema de auditoría

### 🔄 Sincronización Automática
- Triggers que actualizan automáticamente nombres en totes
- Cambios en clientes se reflejan instantáneamente
- Cambios en usuarios se propagan automáticamente
- Eliminación de actualizaciones manuales
- **Sincronización en tiempo real** entre interfaces de admin y operarios
- **APIs con URLs relativas** para compatibilidad con túneles públicos (Tunnelmole, ngrok)
- **Configuración automática** de endpoints según el entorno de ejecución

### 📊 Panel de Control
- Dashboard con estadísticas en tiempo real
- Visualización de estados de totes
- Alertas de vencimientos próximos
- Historial de actividad del sistema
- **Dashboards diferenciados** por rol de usuario

### 📋 Sistema de Auditoría y Eventos
- **Registro completo de eventos** del sistema
- **Auditoría automática** de todas las operaciones CRUD
- **Seguimiento de usuarios** con IP, navegador y timestamps
- **Categorización por módulos**: USUARIOS, TOTES, CLIENTES, SISTEMA
- **Tipos de eventos**: LOGIN, LOGOUT, CREATE, UPDATE, DELETE, VIEW, ERROR
- **Interfaz de consulta** con filtros avanzados y búsqueda
- **Exportación de logs** para análisis y cumplimiento
- **Detección de errores** y registro automático de fallos

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
   - Ejecutar el script `database/corrected_database_script.sql` (recomendado) o `database/complete_database_script.sql`

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

3. Abra su navegador y vaya a `http://localhost:3002`

### Configuración de Túnel Público (Opcional)

Para acceder a la aplicación desde dispositivos externos o compartir el acceso:

1. **Usando Tunnelmole** (recomendado):
   ```bash
   npx tunnelmole 3002
   ```
   Esto generará una URL pública como: `https://xxxxx-ip-xxx-xxx-xxx-xxx.tunnelmole.net`

2. **Usando ngrok**:
   ```bash
   ngrok http 3002
   ```

3. **Configuración automática**: La aplicación está configurada con URLs relativas, por lo que funcionará automáticamente con cualquier túnel público sin necesidad de cambios adicionales.

**Nota**: El sistema está optimizado para uso móvil, especialmente el panel de operadores de totes.

### Uso de la Aplicación

1. **Iniciar sesión**
   
   **Usuario Administrador:**
   - Email: admin@ditzler.com
   - Contraseña: admin123
   - Permisos: Acceso completo al sistema
   
   **Usuario Operario de Totes:**
   - Rol: "Operador Totes"
   - Acceso: Panel móvil optimizado con dos flujos principales
   - Funciones: Procesamiento de totes con contenido reutilizable y lavado directo
   
   **Usuario Operario (ejemplo):**
   - Email: diego@ditzler.com
   - Contraseña: [configurar según necesidades]
   - Permisos: Solo gestión de totes (estado y ubicación)
   
   ⚠️ **Cambiar credenciales por defecto** por seguridad

2. **Navegación del sistema**
   
   **Para Administradores:**
   - **Dashboard**: Estadísticas y resumen general del sistema
   - **Usuarios**: Gestión completa de usuarios del sistema
   - **Clientes**: Administración de clientes corporativos
   - **Totes**: Control y seguimiento completo de totes
   - **Registro de Eventos**: Auditoría y logs del sistema
   
   **Para Operarios de Totes:**
   - **Panel Mobile-First**: Interfaz optimizada para tablets y móviles
   - **Flujo "Tote con Contenido"**: Proceso para totes que van al patio
   - **Flujo "Lavado Directo"**: Proceso para totes que van directamente a lavado
   - **Modales interactivos**: Guías paso a paso con escaneo de códigos
   
   **Para Otros Operarios:**
   - **Dashboard**: Vista simplificada con estadísticas básicas
   - **Gestión de Totes**: Solo actualización de estado y ubicación
   - **Registro de Eventos**: Consulta de logs (solo lectura)

3. **Características especiales**
   - **Modo oscuro/claro** en la esquina superior derecha
   - **Validaciones en tiempo real** en todos los formularios
   - **Sincronización automática** entre módulos
   - **Alertas de vencimiento** en totes
   - **Sistema de auditoría** que registra todas las acciones
   - **Interfaces diferenciadas** según rol de usuario
   - **Filtros avanzados** en gestión de totes
   - **Navegación consistente** con acceso a eventos desde todas las secciones

## Características Técnicas Avanzadas

### 🏗️ Arquitectura
- **Backend**: Express.js con API REST completa
- **Base de datos**: SQL Server con restricciones avanzadas
- **Frontend**: JavaScript vanilla con validaciones HTML5
- **Conexión**: mssql para Node.js con parámetros preparados
- **Middleware personalizado**: Sistema de auditoría automática
- **Configuración flexible**: URLs relativas para compatibilidad con túneles públicos
- **Diseño mobile-first**: Optimizado para dispositivos táctiles

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

## Correcciones y Mejoras Implementadas

### 🔧 Correcciones Técnicas Recientes
- **Panel de Operador de Totes completamente rediseñado**: Interfaz móvil optimizada con flujos específicos
- **Configuración de API mejorada**: URLs relativas para compatibilidad con túneles públicos (Tunnelmole)
- **Sistema de auditoría**: Implementado sistema completo de logging y auditoría
- **Gestión de operarios**: Corregidos problemas de actualización de datos en interfaz de operarios
- **Navegación mejorada**: Agregados enlaces a "Registro de Eventos" en todas las secciones
- **Sincronización de base de datos**: Verificación y corrección de stored procedures
- **Manejo de errores**: Implementado logging automático de errores del sistema
- **Resolución de problemas de conexión**: Solucionados errores de login desde URLs públicas

### 🚀 Nuevas Funcionalidades Implementadas
- **Panel de Operador de Totes Mobile-First**: Interfaz completamente rediseñada para tablets y móviles
- **Flujos de trabajo específicos**: Dos procesos principales para manejo de totes
- **Modales interactivos**: Guías paso a paso para cada proceso
- **Sistema de eventos**: Registro completo de todas las acciones del sistema
- **Auditoría automática**: Tracking de cambios con información de usuario, IP y timestamp
- **Filtros avanzados**: Búsqueda y filtrado mejorado en gestión de totes
- **Validación de permisos**: Control granular de acceso según rol de usuario
- **Interfaz de eventos**: Consulta y visualización de logs del sistema
- **Configuración de túneles públicos**: Soporte nativo para Tunnelmole y herramientas similares

### 🛠️ Mejoras de Estabilidad
- **Manejo de conexiones**: Optimización de conexiones a base de datos
- **Prevención de errores**: Validación mejorada de parámetros en stored procedures
- **Logging robusto**: Sistema de auditoría que no interrumpe operaciones principales
- **Recuperación de errores**: Manejo graceful de fallos de conexión

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
- Backup automático de base de datos
- Integración con sistemas externos