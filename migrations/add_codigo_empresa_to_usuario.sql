-- Agregar columna codigo_empresa a la tabla usuario
-- Esto permite que usuarios de empresa (sin finca específica) 
-- puedan ver todas las fincas de su empresa

ALTER TABLE `usuario` 
ADD COLUMN `codigo_empresa` VARCHAR(50) NULL AFTER `codigo_finca`,
ADD INDEX `idx_usuario_empresa` (`codigo_empresa`),
ADD FOREIGN KEY `fk_usuario_empresa` (`codigo_empresa`) 
  REFERENCES `empresa`(`codigo`) ON DELETE SET NULL ON UPDATE CASCADE;

-- Actualizar usuarios existentes para obtener su codigo_empresa desde finca
UPDATE `usuario` u
INNER JOIN `finca` f ON u.codigo_finca = f.codigo
SET u.codigo_empresa = f.codigo_empresa
WHERE u.codigo_finca IS NOT NULL;

-- Verificar resultado
SELECT codigo, email, nombre, codigo_empresa, codigo_finca 
FROM usuario 
ORDER BY id DESC 
LIMIT 10;
