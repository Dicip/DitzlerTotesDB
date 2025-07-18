-- =============================================
-- SCRIPT PARA ACTUALIZAR ESTADOS DE ESPAÑOL
-- Cambiar 'Active' a 'Activo' e 'Inactive' a 'Inactivo'
-- =============================================

USE DitzlerTotes;
GO

-- Actualizar estados en tabla Usuarios
UPDATE Usuarios 
SET Estado = 'Activo' 
WHERE Estado = 'Active';

UPDATE Usuarios 
SET Estado = 'Inactivo' 
WHERE Estado = 'Inactive';

-- Actualizar estados en tabla Clientes (si existen registros con valores en inglés)
UPDATE Clientes 
SET estado = 'Activo' 
WHERE estado = 'Active';

UPDATE Clientes 
SET estado = 'Inactivo' 
WHERE estado = 'Inactive';

-- Verificar los cambios
SELECT 'Usuarios' as Tabla, Estado, COUNT(*) as Cantidad
FROM Usuarios 
GROUP BY Estado
UNION ALL
SELECT 'Clientes' as Tabla, estado as Estado, COUNT(*) as Cantidad
FROM Clientes 
GROUP BY estado;

PRINT 'Estados actualizados correctamente a español.';
GO