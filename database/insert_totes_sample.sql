-- Script para insertar datos de ejemplo en la tabla Totes
-- Ejecutar después de crear la base de datos con complete_database_script.sql

USE DitzlerTotes;
GO

-- Insertar totes de ejemplo
INSERT INTO Totes (Codigo, Estado, Cliente, Producto, FechaCreacion, FechaVencimiento, Observaciones)
VALUES 
    ('TOT-001', 'Disponible', 'Empresa ABC S.A.', 'Componentes Electrónicos', GETDATE(), DATEADD(MONTH, 6, GETDATE()), 'Tote en perfecto estado'),
    ('TOT-002', 'En Uso', 'Industrias XYZ Ltda.', 'Piezas Metálicas', GETDATE(), DATEADD(MONTH, 3, GETDATE()), 'Asignado a línea de producción 1'),
    ('TOT-003', 'Disponible', 'Manufacturas DEF Corp.', 'Materiales Plásticos', GETDATE(), DATEADD(MONTH, 12, GETDATE()), 'Revisado y limpio'),
    ('TOT-004', 'Mantenimiento', 'Empresa ABC S.A.', 'Componentes Electrónicos', GETDATE(), DATEADD(MONTH, 1, GETDATE()), 'Requiere reparación menor'),
    ('TOT-005', 'En Uso', 'Logística GHI S.A.S.', 'Productos Químicos', GETDATE(), DATEADD(MONTH, 9, GETDATE()), 'En proceso de distribución'),
    ('TOT-006', 'Disponible', 'Industrias XYZ Ltda.', 'Herramientas', GETDATE(), DATEADD(MONTH, 4, GETDATE()), 'Nuevo, sin uso'),
    ('TOT-007', 'Fuera de Servicio', 'Manufacturas DEF Corp.', 'Materiales Plásticos', GETDATE(), DATEADD(MONTH, 2, GETDATE()), 'Daño estructural, evaluar reparación'),
    ('TOT-008', 'Disponible', 'Empresa JKL Inc.', 'Textiles', GETDATE(), DATEADD(MONTH, 8, GETDATE()), 'Limpieza especializada completada'),
    ('TOT-009', 'En Uso', 'Distribuidora MNO', 'Alimentos Procesados', GETDATE(), DATEADD(MONTH, 5, GETDATE()), 'Certificado para uso alimentario'),
    ('TOT-010', 'Disponible', 'Logística GHI S.A.S.', 'Productos Farmacéuticos', GETDATE(), DATEADD(MONTH, 7, GETDATE()), 'Validado para productos sensibles'),
    ('TOT-011', 'Mantenimiento', 'Empresa JKL Inc.', 'Textiles', GETDATE(), DATEADD(MONTH, 3, GETDATE()), 'Programado para limpieza profunda'),
    ('TOT-012', 'En Uso', 'Industrias PQR S.A.', 'Autopartes', GETDATE(), DATEADD(MONTH, 6, GETDATE()), 'Asignado a cliente premium'),
    ('TOT-013', 'Disponible', 'Distribuidora MNO', 'Bebidas', GETDATE(), DATEADD(MONTH, 10, GETDATE()), 'Apto para líquidos'),
    ('TOT-014', 'Disponible', 'Empresa STU Corp.', 'Equipos Industriales', GETDATE(), DATEADD(MONTH, 11, GETDATE()), 'Reforzado para cargas pesadas'),
    ('TOT-015', 'En Uso', 'Manufacturas VWX', 'Materiales de Construcción', GETDATE(), DATEADD(MONTH, 4, GETDATE()), 'En obra de construcción');

GO

PRINT 'Se han insertado 15 totes de ejemplo exitosamente.';
PRINT 'Estados disponibles: Disponible, En Uso, Mantenimiento, Fuera de Servicio';
PRINT 'Códigos generados: TOT-001 a TOT-015';

GO