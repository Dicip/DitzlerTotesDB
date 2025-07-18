# DitzlerTotes - Panel de Administración

## Descripción
Este proyecto implementa un panel de administración para DitzlerTotes, que incluye funcionalidades de inicio de sesión para administradores y gestión de usuarios a través de una interfaz web. La aplicación utiliza SQL Server como base de datos para almacenar la información de los usuarios.

## Estructura del Proyecto

```
DitzlerTotes/
├── index.html              # Página principal de inicio de sesión de administradores
├── server.js               # Servidor Express y API REST con conexión a SQL Server
├── package.json            # Configuración y dependencias del proyecto
├── db-setup.sql            # Script para configurar la base de datos SQL Server
├── css/
│   ├── styles.css         # Estilos globales de la aplicación
│   └── dashboard-styles.css # Estilos específicos para el dashboard
├── js/
│   ├── script.js          # Lógica para la página de inicio de sesión
│   ├── dashboard.js       # Lógica para el panel de control
│   └── admin-users.js     # Lógica para la gestión de usuarios
├── pages/
│   ├── dashboard.html     # Panel de control del administrador
│   └── admin-users.html   # Página de gestión de usuarios
├── assets/
│   └── images/            # Imágenes y recursos gráficos
└── node_modules/          # Dependencias instaladas (generado por npm)
```

## Funcionalidades

### Autenticación de Administradores
- Inicio de sesión con nombre de usuario y contraseña
- Opción "Recordarme" para mantener la sesión activa
- Recuperación de contraseña (simulada)
- Verificación de permisos de administrador

### Gestión de Usuarios
- Visualización de lista de usuarios desde la base de datos
- Creación de nuevos usuarios por parte de administradores
- Edición de información de usuarios existentes
- Eliminación de usuarios

### Panel de Control
- Visualización de información del administrador
- Historial de actividad reciente
- Acceso a módulos de administración

## Cómo Usar

### Instalación

1. Asegúrese de tener Node.js y SQL Server instalados en su sistema.
2. Clone o descargue este repositorio.
3. Abra una terminal en la carpeta del proyecto.
4. Instale las dependencias ejecutando:
   ```
   npm install
   ```
5. Configure la base de datos SQL Server:
   - Ejecute el script `db-setup.sql` en SQL Server Management Studio o mediante sqlcmd
   - Actualice la configuración de conexión en `server.js` con sus credenciales de SQL Server

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

1. En la página principal, puede iniciar sesión con alguno de los administradores predefinidos:
   - Usuario: admin, Contraseña: admin123
   - Usuario: supervisor, Contraseña: super123
   - Usuario: manager, Contraseña: manager123
2. Una vez autenticado, accederá al panel de administración donde podrá gestionar usuarios y acceder a otras funcionalidades.

## Notas Técnicas

- Este proyecto utiliza Express.js como servidor web y para implementar la API REST.
- Se utiliza SQL Server como base de datos para almacenar la información de usuarios.
- La conexión a la base de datos se realiza mediante el paquete mssql para Node.js.
- La autenticación de administradores verifica las credenciales contra la base de datos.
- La gestión de usuarios se realiza a través de una API REST que interactúa con SQL Server.
- El diseño es responsivo y se adapta a diferentes tamaños de pantalla.

## Mejoras Futuras

- Implementar hashing seguro para contraseñas (bcrypt, Argon2, etc.)
- Agregar validación por correo electrónico para nuevos usuarios
- Implementar autenticación de dos factores para administradores
- Expandir las funcionalidades del panel de administración
- Agregar JWT (JSON Web Tokens) para gestión de sesiones
- Implementar HTTPS para comunicaciones seguras
- Agregar roles y permisos más granulares para diferentes tipos de administradores
- Crear pruebas unitarias y de integración
- Optimizar el rendimiento y la carga de recursos
- Implementar un sistema de logs para auditoría