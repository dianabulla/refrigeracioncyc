-- ========================================================
-- SCRIPT DE POBLACIÓN DE DATOS
-- Llenar codigo_empresa y codigo_finca en tablas existentes
-- Ejecutar DESPUÉS de ejecutar add_empresa_finca_isolation.sql
-- ========================================================

-- ========================================================
-- PASO 1: Llenar codigo_empresa en CUARTO_FRIO
-- (Derivar de finca -> empresa)
-- ========================================================
UPDATE `cuarto_frio` cf
JOIN `finca` f ON cf.`codigo_finca` = f.`codigo`
SET cf.`codigo_empresa` = f.`codigo_empresa`
WHERE cf.`codigo_empresa` IS NULL OR cf.`codigo_empresa` = '';

-- ========================================================
-- PASO 2: Llenar codigo_empresa y codigo_finca en SENSOR
-- (Derivar de cuarto_frio -> finca -> empresa)
-- ========================================================
UPDATE `sensor` s
JOIN `cuarto_frio` cf ON s.`codigo_cuarto` = cf.`codigo`
JOIN `finca` f ON cf.`codigo_finca` = f.`codigo`
SET s.`codigo_empresa` = f.`codigo_empresa`,
    s.`codigo_finca` = f.`codigo`
WHERE (s.`codigo_empresa` IS NULL OR s.`codigo_empresa` = '')
   OR (s.`codigo_finca` IS NULL OR s.`codigo_finca` = '');

-- ========================================================
-- PASO 3: Llenar codigo_empresa y codigo_finca en REPORTE
-- (Derivar de sensor o cuarto_frio)
-- ========================================================
UPDATE `reporte` r
JOIN `sensor` s ON r.`codigo_sensor` = s.`codigo`
SET r.`codigo_empresa` = s.`codigo_empresa`,
    r.`codigo_finca` = s.`codigo_finca`
WHERE (r.`codigo_empresa` IS NULL OR r.`codigo_empresa` = '')
   OR (r.`codigo_finca` IS NULL OR r.`codigo_finca` = '');

-- Para los reportes que no tenían sensor válido, intentar desde cuarto_frio
UPDATE `reporte` r
JOIN `cuarto_frio` cf ON r.`codigo_cuarto` = cf.`codigo`
JOIN `finca` f ON cf.`codigo_finca` = f.`codigo`
SET r.`codigo_empresa` = f.`codigo_empresa`,
    r.`codigo_finca` = f.`codigo`
WHERE (r.`codigo_empresa` IS NULL OR r.`codigo_empresa` = '')
   OR (r.`codigo_finca` IS NULL OR r.`codigo_finca` = '');

-- ========================================================
-- PASO 4: Llenar codigo_empresa y codigo_finca en COMPONENTE
-- (Derivar de cuarto_frio -> finca -> empresa)
-- ========================================================
UPDATE `componente` c
JOIN `cuarto_frio` cf ON c.`codigo_cuarto` = cf.`codigo`
JOIN `finca` f ON cf.`codigo_finca` = f.`codigo`
SET c.`codigo_empresa` = f.`codigo_empresa`,
    c.`codigo_finca` = f.`codigo`
WHERE (c.`codigo_empresa` IS NULL OR c.`codigo_empresa` = '')
   OR (c.`codigo_finca` IS NULL OR c.`codigo_finca` = '');

-- ========================================================
-- PASO 5: Llenar codigo_empresa y codigo_finca en MANTENIMIENTO
-- (Derivar de cuarto_frio o componente)
-- ========================================================
UPDATE `mantenimiento` m
JOIN `cuarto_frio` cf ON m.`codigo_cuarto` = cf.`codigo`
JOIN `finca` f ON cf.`codigo_finca` = f.`codigo`
SET m.`codigo_empresa` = f.`codigo_empresa`,
    m.`codigo_finca` = f.`codigo`
WHERE (m.`codigo_empresa` IS NULL OR m.`codigo_empresa` = '')
   OR (m.`codigo_finca` IS NULL OR m.`codigo_finca` = '');

-- Para mantenimientos sin cuarto_frio, intentar desde componente
UPDATE `mantenimiento` m
JOIN `componente` c ON m.`codigo_componente` = c.`codigo`
SET m.`codigo_empresa` = c.`codigo_empresa`,
    m.`codigo_finca` = c.`codigo_finca`
WHERE (m.`codigo_empresa` IS NULL OR m.`codigo_empresa` = '')
   OR (m.`codigo_finca` IS NULL OR m.`codigo_finca` = '');

-- ========================================================
-- PASO 6: Llenar codigo_empresa en USUARIO
-- (Ya tiene codigo_finca, derivar empresa de finca)
-- ========================================================
UPDATE `usuario` u
JOIN `finca` f ON u.`codigo_finca` = f.`codigo`
SET u.`codigo_empresa` = f.`codigo_empresa`
WHERE u.`codigo_empresa` IS NULL OR u.`codigo_empresa` = '';

-- ========================================================
-- VERIFICACIÓN: Buscar registros no poblados
-- ========================================================
-- Descomenta lo que necesites verificar:

-- SELECT 'cuarto_frio sin empresa' as tabla, COUNT(*) as cantidad 
-- FROM `cuarto_frio` WHERE `codigo_empresa` IS NULL OR `codigo_empresa` = '';

-- SELECT 'sensor sin empresa' as tabla, COUNT(*) as cantidad 
-- FROM `sensor` WHERE `codigo_empresa` IS NULL OR `codigo_empresa` = '';

-- SELECT 'reporte sin empresa' as tabla, COUNT(*) as cantidad 
-- FROM `reporte` WHERE `codigo_empresa` IS NULL OR `codigo_empresa` = '';

-- SELECT 'componente sin empresa' as tabla, COUNT(*) as cantidad 
-- FROM `componente` WHERE `codigo_empresa` IS NULL OR `codigo_empresa` = '';

-- SELECT 'mantenimiento sin empresa' as tabla, COUNT(*) as cantidad 
-- FROM `mantenimiento` WHERE `codigo_empresa` IS NULL OR `codigo_empresa` = '';

-- SELECT 'usuario sin empresa' as tabla, COUNT(*) as cantidad 
-- FROM `usuario` WHERE `codigo_empresa` IS NULL OR `codigo_empresa` = '';
