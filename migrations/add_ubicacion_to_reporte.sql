-- Agregar campo ubicacion a tabla reporte
ALTER TABLE reporte ADD COLUMN ubicacion VARCHAR(50) DEFAULT 'exterior' COMMENT 'Ubicación del sensor al momento del reporte: exterior, interior, tuberia, otro';

-- Crear índice para búsquedas por ubicación (opcional)
CREATE INDEX idx_reporte_ubicacion ON reporte(ubicacion);

-- Actualizar reportes existentes basándose en la ubicación de su sensor (opcional)
-- UPDATE reporte r 
-- INNER JOIN sensor s ON r.codigo_sensor = s.codigo 
-- SET r.ubicacion = s.ubicacion;
