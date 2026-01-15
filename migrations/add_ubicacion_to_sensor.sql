-- Agregar campo ubicacion a tabla sensor
ALTER TABLE sensor ADD COLUMN ubicacion VARCHAR(50) DEFAULT 'exterior' COMMENT 'Ubicación del sensor: exterior, interior, tuberia, otro';

-- Crear índice para búsquedas por ubicación (opcional)
CREATE INDEX idx_sensor_ubicacion ON sensor(ubicacion);

-- Actualizar algunos sensores existentes si lo deseas (opcional)
-- UPDATE sensor SET ubicacion = 'interior' WHERE codigo LIKE 'SEN001%';
-- UPDATE sensor SET ubicacion = 'tuberia' WHERE codigo LIKE 'SEN11%';
