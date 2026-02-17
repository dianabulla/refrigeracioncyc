-- Script SQL para generar datos de prueba en la tabla de reportes
-- Ejecutar este script si no tienes reportes en la base de datos

-- Primero verifica que tengas al menos un cuarto frío
-- SELECT * FROM cuarto_frio LIMIT 1;

-- Luego verifica que tengas al menos un sensor
-- SELECT * FROM sensor LIMIT 1;

-- Inserta reportes de prueba (ajusta codigo_sensor y codigo_cuarto según tu base de datos)
INSERT INTO reporte (
    codigo, nombre, tipo_reporte, activo, fecha_creacion, fecha_captura,
    voltaje, amperaje, temperatura, humedad, presion_s, presion_e,
    aire, puerta, otro, codigo_sensor, codigo_cuarto
)
VALUES
    ('REP001', 'Reporte Prueba 1', 'automatico', 1, NOW(), DATE_SUB(NOW(), INTERVAL 6 HOUR),
     220.5, 15.2, 4.5, 65.0, 35.2, 180.5, 'Normal', 'Cerrada', NULL, 
     'SENS001', 'CF001'),
    
    ('REP002', 'Reporte Prueba 2', 'automatico', 1, NOW(), DATE_SUB(NOW(), INTERVAL 5 HOUR),
     219.8, 15.5, 4.8, 66.2, 34.8, 179.2, 'Normal', 'Cerrada', NULL,
     'SENS001', 'CF001'),
    
    ('REP003', 'Reporte Prueba 3', 'automatico', 1, NOW(), DATE_SUB(NOW(), INTERVAL 4 HOUR),
     221.2, 14.9, 4.2, 64.5, 35.5, 181.0, 'Normal', 'Cerrada', NULL,
     'SENS001', 'CF001'),
    
    ('REP004', 'Reporte Prueba 4', 'automatico', 1, NOW(), DATE_SUB(NOW(), INTERVAL 3 HOUR),
     220.0, 15.3, 4.7, 65.8, 35.0, 180.0, 'Normal', 'Cerrada', NULL,
     'SENS001', 'CF001'),
    
    ('REP005', 'Reporte Prueba 5', 'automatico', 1, NOW(), DATE_SUB(NOW(), INTERVAL 2 HOUR),
     220.5, 15.1, 4.3, 64.8, 35.3, 180.8, 'Normal', 'Cerrada', NULL,
     'SENS001', 'CF001'),
    
    ('REP006', 'Reporte Prueba 6', 'automatico', 1, NOW(), DATE_SUB(NOW(), INTERVAL 1 HOUR),
     219.5, 15.4, 4.6, 66.0, 34.9, 179.5, 'Normal', 'Cerrada', NULL,
     'SENS001', 'CF001'),
    
    ('REP007', 'Reporte Prueba 7', 'automatico', 1, NOW(), NOW(),
     221.0, 15.0, 4.4, 65.5, 35.1, 180.2, 'Normal', 'Cerrada', NULL,
     'SENS001', 'CF001');

-- Verifica los datos insertados
SELECT * FROM reporte WHERE codigo_cuarto = 'CF001' ORDER BY fecha_captura DESC;

-- NOTA IMPORTANTE:
-- Antes de ejecutar este script, asegúrate de:
-- 1. Tener al menos un cuarto frío creado (ej: codigo = 'CF001')
-- 2. Tener al menos un sensor creado (ej: codigo = 'SENS001')
-- 3. Ajustar los códigos en el script según tu base de datos

-- Para ver tus cuartos fríos:
-- SELECT codigo, nombre FROM cuarto_frio;

-- Para ver tus sensores:
-- SELECT codigo, nombre, codigo_cuarto FROM sensor;
