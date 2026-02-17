-- ========================================================
-- PARTE 3: AGREGAR CONSTRAINTS E ÍNDICES
-- Ejecutar DESPUÉS de populate_empresa_finca_data.sql
-- ========================================================

-- IMPORTANTE: Este archivo solo debe ejecutarse cuando:
-- 1. Las columnas ya fueron agregadas (add_empresa_finca_isolation.sql)
-- 2. Los datos ya fueron poblados (populate_empresa_finca_data.sql)
-- 3. Se verificó que NO hay registros NULL

-- ========================================================
-- VERIFICACIÓN PREVIA (CRÍTICO)
-- ========================================================
-- Ejecutar estos queries ANTES de continuar
-- Si alguno retorna > 0, NO ejecutar este archivo

SELECT COUNT(*) as usuarios_sin_empresa FROM usuario WHERE codigo_empresa IS NULL;
-- Debe retornar: 0

SELECT COUNT(*) as cuartos_sin_empresa FROM cuarto_frio WHERE codigo_empresa IS NULL;
-- Debe retornar: 0

SELECT COUNT(*) as sensores_sin_empresa FROM sensor WHERE codigo_empresa IS NULL;
-- Debe retornar: 0

SELECT COUNT(*) as sensores_sin_finca FROM sensor WHERE codigo_finca IS NULL;
-- Debe retornar: 0

SELECT COUNT(*) as reportes_sin_empresa FROM reporte WHERE codigo_empresa IS NULL;
-- Debe retornar: 0

SELECT COUNT(*) as reportes_sin_finca FROM reporte WHERE codigo_finca IS NULL;
-- Debe retornar: 0

SELECT COUNT(*) as componentes_sin_empresa FROM componente WHERE codigo_empresa IS NULL;
-- Debe retornar: 0

SELECT COUNT(*) as componentes_sin_finca FROM componente WHERE codigo_finca IS NULL;
-- Debe retornar: 0

SELECT COUNT(*) as mantenimientos_sin_empresa FROM mantenimiento WHERE codigo_empresa IS NULL;
-- Debe retornar: 0

SELECT COUNT(*) as mantenimientos_sin_finca FROM mantenimiento WHERE codigo_finca IS NULL;
-- Debe retornar: 0


-- ========================================================
-- SI TODAS LAS VERIFICACIONES RETORNAN 0, CONTINUAR:
-- ========================================================


-- ========================================================
-- 1. CONVERTIR USUARIO.CODIGO_EMPRESA A NOT NULL
-- ========================================================
ALTER TABLE `usuario`
MODIFY COLUMN `codigo_empresa` VARCHAR(50) NOT NULL;

-- Crear índice
ALTER TABLE `usuario`
ADD KEY `idx_usuario_empresa` (`codigo_empresa`);

-- Agregar FK
ALTER TABLE `usuario`
ADD CONSTRAINT `fk_usuario_empresa` 
FOREIGN KEY (`codigo_empresa`) REFERENCES `empresa` (`codigo`) 
ON UPDATE CASCADE 
ON DELETE RESTRICT;


-- ========================================================
-- 2. CONVERTIR CUARTO_FRIO.CODIGO_EMPRESA A NOT NULL
-- ========================================================
ALTER TABLE `cuarto_frio`
MODIFY COLUMN `codigo_empresa` VARCHAR(50) NOT NULL;

-- Crear índice
ALTER TABLE `cuarto_frio`
ADD KEY `idx_cuarto_empresa` (`codigo_empresa`);

-- Agregar FK
ALTER TABLE `cuarto_frio`
ADD CONSTRAINT `fk_cuarto_empresa` 
FOREIGN KEY (`codigo_empresa`) REFERENCES `empresa` (`codigo`) 
ON UPDATE CASCADE 
ON DELETE RESTRICT;


-- ========================================================
-- 3. CONVERTIR SENSOR A NOT NULL + AGREGAR FKs
-- ========================================================
ALTER TABLE `sensor`
MODIFY COLUMN `codigo_empresa` VARCHAR(50) NOT NULL,
MODIFY COLUMN `codigo_finca` VARCHAR(50) NOT NULL;

-- Crear índices
ALTER TABLE `sensor`
ADD KEY `idx_sensor_empresa` (`codigo_empresa`),
ADD KEY `idx_sensor_finca` (`codigo_finca`);

-- Agregar FKs
ALTER TABLE `sensor`
ADD CONSTRAINT `fk_sensor_empresa` 
FOREIGN KEY (`codigo_empresa`) REFERENCES `empresa` (`codigo`) 
ON UPDATE CASCADE 
ON DELETE RESTRICT,
ADD CONSTRAINT `fk_sensor_finca` 
FOREIGN KEY (`codigo_finca`) REFERENCES `finca` (`codigo`) 
ON UPDATE CASCADE 
ON DELETE RESTRICT;


-- ========================================================
-- 4. CONVERTIR REPORTE A NOT NULL + AGREGAR FKs
-- ========================================================
ALTER TABLE `reporte`
MODIFY COLUMN `codigo_empresa` VARCHAR(50) NOT NULL,
MODIFY COLUMN `codigo_finca` VARCHAR(50) NOT NULL;

-- Crear índices
ALTER TABLE `reporte`
ADD KEY `idx_reporte_empresa` (`codigo_empresa`),
ADD KEY `idx_reporte_finca` (`codigo_finca`);

-- Agregar FKs
ALTER TABLE `reporte`
ADD CONSTRAINT `fk_reporte_empresa` 
FOREIGN KEY (`codigo_empresa`) REFERENCES `empresa` (`codigo`) 
ON UPDATE CASCADE 
ON DELETE RESTRICT,
ADD CONSTRAINT `fk_reporte_finca` 
FOREIGN KEY (`codigo_finca`) REFERENCES `finca` (`codigo`) 
ON UPDATE CASCADE 
ON DELETE RESTRICT;


-- ========================================================
-- 5. CONVERTIR COMPONENTE A NOT NULL + AGREGAR FKs
-- ========================================================
ALTER TABLE `componente`
MODIFY COLUMN `codigo_empresa` VARCHAR(50) NOT NULL,
MODIFY COLUMN `codigo_finca` VARCHAR(50) NOT NULL;

-- Crear índices
ALTER TABLE `componente`
ADD KEY `idx_componente_empresa` (`codigo_empresa`),
ADD KEY `idx_componente_finca` (`codigo_finca`);

-- Agregar FKs
ALTER TABLE `componente`
ADD CONSTRAINT `fk_componente_empresa` 
FOREIGN KEY (`codigo_empresa`) REFERENCES `empresa` (`codigo`) 
ON UPDATE CASCADE 
ON DELETE RESTRICT,
ADD CONSTRAINT `fk_componente_finca` 
FOREIGN KEY (`codigo_finca`) REFERENCES `finca` (`codigo`) 
ON UPDATE CASCADE 
ON DELETE RESTRICT;


-- ========================================================
-- 6. CONVERTIR MANTENIMIENTO A NOT NULL + AGREGAR FKs
-- ========================================================
ALTER TABLE `mantenimiento`
MODIFY COLUMN `codigo_empresa` VARCHAR(50) NOT NULL,
MODIFY COLUMN `codigo_finca` VARCHAR(50) NOT NULL;

-- Crear índices
ALTER TABLE `mantenimiento`
ADD KEY `idx_mantenimiento_empresa` (`codigo_empresa`),
ADD KEY `idx_mantenimiento_finca` (`codigo_finca`);

-- Agregar FKs
ALTER TABLE `mantenimiento`
ADD CONSTRAINT `fk_mantenimiento_empresa` 
FOREIGN KEY (`codigo_empresa`) REFERENCES `empresa` (`codigo`) 
ON UPDATE CASCADE 
ON DELETE RESTRICT,
ADD CONSTRAINT `fk_mantenimiento_finca` 
FOREIGN KEY (`codigo_finca`) REFERENCES `finca` (`codigo`) 
ON UPDATE CASCADE 
ON DELETE RESTRICT;


-- ========================================================
-- VERIFICACIÓN FINAL
-- ========================================================

-- Verificar que los constraints fueron creados
SELECT 
    CONSTRAINT_NAME, 
    TABLE_NAME, 
    COLUMN_NAME, 
    REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE()
AND REFERENCED_TABLE_NAME IN ('empresa', 'finca')
ORDER BY TABLE_NAME, COLUMN_NAME;

-- Debe mostrar:
-- componente -> empresa (fk_componente_empresa)
-- componente -> finca (fk_componente_finca)
-- cuarto_frio -> empresa (fk_cuarto_empresa)
-- mantenimiento -> empresa (fk_mantenimiento_empresa)
-- mantenimiento -> finca (fk_mantenimiento_finca)
-- reporte -> empresa (fk_reporte_empresa)
-- reporte -> finca (fk_reporte_finca)
-- sensor -> empresa (fk_sensor_empresa)
-- sensor -> finca (fk_sensor_finca)
-- usuario -> empresa (fk_usuario_empresa)


-- ========================================================
-- ÉXITO
-- ========================================================
-- Si llegaste aquí sin errores:
-- ✅ Columnas agregadas como NULL
-- ✅ Datos poblados usando relaciones FK existentes
-- ✅ Columnas convertidas a NOT NULL
-- ✅ Índices creados
-- ✅ Foreign Keys agregadas
-- ✅ Relaciones intactas

-- Próximo paso:
-- Continuar con: README_SECURITY.md (Fase 2)
-- ========================================================
