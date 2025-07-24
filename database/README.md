# Scripts de Base de Datos - Sistema de Gestión de Totes Ditzler

## Descripción

Este directorio contiene los scripts SQL separados para crear y configurar la base de datos del Sistema de Gestión de Totes de Ditzler. Cada tabla tiene su propio script con todos sus componentes asociados.

## Estructura de Archivos

```
database/
├── 00_Master_Script.sql          # Script maestro con verificaciones
├── 01_Usuarios_Table.sql          # Tabla de usuarios del sistema
├── 02_Clientes_Table.sql          # Tabla de clientes
├── 03_Totes_Table.sql             # Tabla principal de totes
├── 04_Eventos_Table.sql           # Tabla de eventos y auditoría
└── README.md                      # Este archivo
```

## Orden de Ejecución

**IMPORTANTE:** Los scripts deben ejecutarse en el siguiente orden debido a las dependencias entre tablas:

1. `01_Usuarios_Table.sql` - Tabla base de usuarios
2. `02_Clientes_Table.sql` - Tabla de clientes
3. `03_Totes_Table.sql` - Tabla principal de totes
4. `04_Eventos_Table.sql` - Tabla de eventos (depende de Totes)

## Contenido de Cada Script

Cada script incluye:

### 📋 Tabla Principal
- Definición completa de la tabla
- Campos con tipos de datos apropiados
- Claves primarias y valores por defecto

### 🔍 Índices
- Índices únicos para campos clave
- Índices de rendimiento para consultas frecuentes
- Índices compuestos para consultas complejas

### ✅ Restricciones
- Validaciones de datos (CHECK constraints)
- Restricciones de longitud y formato
- Validaciones de negocio específicas

### 🔗 Claves Foráneas
- Relaciones entre tablas
- Integridad referencial

### ⚙️ Funciones (donde aplique)
- Funciones de utilidad específicas
- Validaciones personalizadas

### 📊 Procedimientos Almacenados
- Operaciones CRUD (Crear, Leer, Actualizar, Eliminar)
- Consultas de búsqueda y filtrado
- Procedimientos de estadísticas
- Operaciones de mantenimiento

## Métodos de Ejecución

### Opción 1: SQL Server Management Studio (SSMS)

1. Abrir SSMS y conectarse al servidor
2. Crear la base de datos `Ditzler` si no existe:
   ```sql
   CREATE DATABASE Ditzler;
   ```
3. Seleccionar la base de datos `Ditzler`
4. Abrir cada script en orden y ejecutarlo (F5)

### Opción 2: Línea de Comandos con SQLCMD

```bash
# Crear la base de datos
sqlcmd -S [SERVIDOR] -E -Q "CREATE DATABASE Ditzler"

# Ejecutar scripts en orden
sqlcmd -S [SERVIDOR] -d Ditzler -E -i "01_Usuarios_Table.sql"
sqlcmd -S [SERVIDOR] -d Ditzler -E -i "02_Clientes_Table.sql"
sqlcmd -S [SERVIDOR] -d Ditzler -E -i "03_Totes_Table.sql"
sqlcmd -S [SERVIDOR] -d Ditzler -E -i "04_Eventos_Table.sql"
```

### Opción 3: PowerShell

```powershell
# Definir variables
$servidor = "localhost"
$baseDatos = "Ditzler"

# Crear base de datos
Invoke-Sqlcmd -ServerInstance $servidor -Query "CREATE DATABASE $baseDatos" -ErrorAction SilentlyContinue

# Ejecutar scripts
$scripts = @(
    "01_Usuarios_Table.sql",
    "02_Clientes_Table.sql", 
    "03_Totes_Table.sql",
    "04_Eventos_Table.sql"
)

foreach ($script in $scripts) {
    Write-Host "Ejecutando $script..."
    Invoke-Sqlcmd -ServerInstance $servidor -Database $baseDatos -InputFile $script
}
```

## Detalles por Tabla

### 01_Usuarios_Table.sql
- **Función:** `FN_ValidarEmail` - Validación de formato de email
- **Tabla:** `Usuarios` - Gestión de usuarios del sistema
- **Índices:** 4 índices (email único, estado, rol, fecha registro)
- **Restricciones:** 5 validaciones (email, estado, nombre, password, rol)
- **Procedimientos:** 3 (crear, actualizar, validar login)
- **Datos:** Usuario administrador por defecto

### 02_Clientes_Table.sql
- **Tabla:** `Clientes` - Información de clientes
- **Índices:** 6 índices (email único, nombre, estado, tipo, ciudad, fecha)
- **Restricciones:** 5 validaciones (email, estado, nombre, contacto, teléfono)
- **Procedimientos:** 4 (crear, actualizar, buscar, estadísticas)

### 03_Totes_Table.sql
- **Funciones:** 2 (generar código, calcular días vencimiento)
- **Tabla:** `Totes` - Gestión principal de totes
- **Índices:** 11 índices (código único, estado, cliente, ubicación, fechas, etc.)
- **Restricciones:** 5 validaciones (estado, alerta, código, fechas)
- **Procedimientos:** 5 (buscar, crear, actualizar, estadísticas, fuera de plazo)

### 04_Eventos_Table.sql
- **Tabla:** `Eventos` - Auditoría y registro de eventos
- **Índices:** 10 índices (tote, tipo, usuario, fecha, severidad, etc.)
- **Restricciones:** 5 validaciones (tipo evento, severidad, descripción, tiempo, IP)
- **Clave Foránea:** Relación con tabla Totes
- **Procedimientos:** 6 (registrar, buscar, historial, estadísticas, limpiar, recientes)

## Verificación de Instalación

Después de ejecutar todos los scripts, puede verificar la instalación ejecutando:

```sql
-- Verificar tablas
SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_TYPE = 'BASE TABLE';

-- Verificar procedimientos
SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_TYPE = 'PROCEDURE';

-- Verificar funciones
SELECT ROUTINE_NAME FROM INFORMATION_SCHEMA.ROUTINES WHERE ROUTINE_TYPE = 'FUNCTION';
```

## Características Principales

### 🔒 Seguridad
- Validaciones de datos en múltiples niveles
- Restricciones de integridad referencial
- Auditoría completa de eventos

### ⚡ Rendimiento
- Índices optimizados para consultas frecuentes
- Índices compuestos para consultas complejas
- Procedimientos almacenados para operaciones comunes

### 📈 Escalabilidad
- Estructura modular por tabla
- Fácil mantenimiento y actualización
- Separación de responsabilidades

### 🔍 Auditoría
- Registro completo de eventos
- Trazabilidad de cambios
- Información de sesión y usuario

## Mantenimiento

### Limpieza de Eventos Antiguos
```sql
-- Limpiar eventos de más de 1 año
EXEC SP_LimpiarEventosAntiguos @diasAntiguedad = 365;
```

### Estadísticas del Sistema
```sql
-- Estadísticas del dashboard
EXEC SP_EstadisticasDashboard;

-- Estadísticas de eventos
EXEC SP_EstadisticasEventos;
```

## Soporte

Para problemas o consultas sobre estos scripts:

1. Verificar que se ejecutaron en el orden correcto
2. Revisar los mensajes de error en la consola
3. Verificar permisos de base de datos
4. Consultar los logs de SQL Server

## Notas Importantes

- ⚠️ **Backup:** Siempre haga backup antes de ejecutar scripts en producción
- 🔄 **Idempotencia:** Los scripts pueden ejecutarse múltiples veces sin problemas
- 📝 **Logs:** Cada script genera mensajes informativos durante la ejecución
- 🔧 **Personalización:** Los scripts pueden modificarse según necesidades específicas

---

**Sistema de Gestión de Totes - Ditzler**  
*Versión de Scripts: 1.0*  
*Fecha de Creación: Diciembre 2024*