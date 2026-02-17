-- ========================================================
-- MIGRACION FASE 1: Agregar Columnas NULL
-- Objetivo: Agregar codigo_empresa y codigo_finca a todas 
--           las tablas operativas SIN restricciones
-- ========================================================

-- ========================================================
-- 1. ACTUALIZAR TABLA USUARIO
-- ========================================================
ALTER TABLE `usuario`
ADD COLUMN `codigo_empresa` VARCHAR(50) NULL AFTER `codigo_finca`;

-- ========================================================
-- 2. ACTUALIZAR TABLA CUARTO_FRIO
-- ========================================================
ALTER TABLE `cuarto_frio`
ADD COLUMN `codigo_empresa` VARCHAR(50) NULL AFTER `codigo_finca`;

-- ========================================================
-- 3. ACTUALIZAR TABLA SENSOR
-- ========================================================
ALTER TABLE `sensor`
ADD COLUMN `codigo_empresa` VARCHAR(50) NULL AFTER `codigo_cuarto`,
ADD COLUMN `codigo_finca` VARCHAR(50) NULL AFTER `codigo_empresa`;

-- ========================================================
-- 4. ACTUALIZAR TABLA REPORTE
-- ========================================================
ALTER TABLE `reporte`
ADD COLUMN `codigo_empresa` VARCHAR(50) NULL AFTER `codigo_cuarto`,
ADD COLUMN `codigo_finca` VARCHAR(50) NULL AFTER `codigo_empresa`;

-- ========================================================
-- 5. ACTUALIZAR TABLA COMPONENTE
-- ========================================================
ALTER TABLE `componente`
ADD COLUMN `codigo_empresa` VARCHAR(50) NULL AFTER `codigo_cuarto`,
ADD COLUMN `codigo_finca` VARCHAR(50) NULL AFTER `codigo_empresa`;

-- ========================================================
-- 6. ACTUALIZAR TABLA MANTENIMIENTO
-- ========================================================
ALTER TABLE `mantenimiento`
ADD COLUMN `codigo_empresa` VARCHAR(50) NULL AFTER `codigo_componente`,
ADD COLUMN `codigo_finca` VARCHAR(50) NULL AFTER `codigo_empresa`;

-- ========================================================
-- 7. CREAR TABLA DE AUDITORÍA
-- ========================================================
CREATE TABLE IF NOT EXISTS `auditoria_acceso` (
  `id` INT(10) UNSIGNED NOT NULL AUTO_INCREMENT,
  `codigo_empresa` VARCHAR(50) NOT NULL,
  `codigo_finca` VARCHAR(50) NOT NULL,
  `codigo_usuario` VARCHAR(50) NOT NULL,
  `tipo_accion` ENUM('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT') NOT NULL,
  `tabla_afectada` VARCHAR(100) NULL,
  `registro_id` VARCHAR(50) NULL,
  `ip_address` VARCHAR(45) NULL,
  `fecha_hora` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_auditoria_empresa` (`codigo_empresa`),
  KEY `idx_auditoria_fecha` (`fecha_hora`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ========================================================
-- FASE 1 COMPLETADA
-- SIGUIENTE PASO: Ejecutar populate_empresa_finca_data.sql
-- ========================================================
