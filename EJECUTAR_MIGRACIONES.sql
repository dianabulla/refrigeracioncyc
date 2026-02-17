-- ============================================================================
--  INSTRUCCIONES DE EJECUCIÓN - AISLAMIENTO DE DATOS
--  Copiar y pegar estas líneas en phpMyAdmin o MySQL CLI
-- ============================================================================

-- PASO 1: Verificar conexión a base de datos
-- Ejecutar en: phpMyAdmin > Console (o MySQL CLI)
-- Resultado esperado: 1 row (si la BD existe)

SELECT DATABASE();


-- PASO 2: Seleccionar base de datos (si no está seleccionada)
-- Cambiar 'refrigeracioncyc' si tu BD tiene otro nombre

USE refrigeracioncyc;


-- PASO 3: CREAR MIGRACIONES - PARTE 1 (Agregar Columnas)
-- Archivo: migrations/add_empresa_finca_isolation.sql
-- Acción: Copiar TODO el contenido del archivo y ejecutar
-- Duración: ~3 segundos
-- Resultado: Columnas agregadas como NULL (permite datos existentes)

-- >>> COPIAR Y EJECUTAR: migrations/add_empresa_finca_isolation.sql <<<


-- PASO 4: VERIFICAR ALTERACIONES
-- Ejecutar para confirmar que las columnas fueron agregadas

SHOW COLUMNS FROM usuario WHERE Field = 'codigo_empresa';
-- Resultado: debe mostrar codigo_empresa | varchar(50) | YES (NULL permitido)

SHOW COLUMNS FROM sensor WHERE Field = 'codigo_empresa';
-- Resultado: debe mostrar codigo_empresa | varchar(50) | YES (NULL permitido)

SHOW COLUMNS FROM reporte WHERE Field = 'codigo_empresa';
-- Resultado: debe mostrar codigo_empresa | varchar(50) | YES (NULL permitido)


-- PASO 5: POBLAR DATOS - PARTE 2 (Llenar Columnas)
-- Archivo: migrations/populate_empresa_finca_data.sql
-- Acción: Copiar TODO el contenido del archivo y ejecutar
-- Duración: ~10 segundos
-- Resultado: Datos poblados usando relaciones FK existentes

-- >>> COPIAR Y EJECUTAR: migrations/populate_empresa_finca_data.sql <<<


-- PASO 6: VERIFICAR DATOS POBLADOS
-- Ejecutar para confirmar que los campos fueron llenados

-- Verificación 1: Usuarios con empresa
SELECT COUNT(*) as total_usuarios FROM usuario;
-- Resultado: X registros

SELECT COUNT(*) as usuarios_con_empresa FROM usuario 
WHERE codigo_empresa IS NOT NULL AND codigo_empresa != '';
-- Resultado: X registros (debe ser igual al anterior)

-- Verificación 2: Reportes con empresa y finca
SELECT COUNT(*) as reportes_con_empresa FROM reporte 
WHERE codigo_empresa IS NOT NULL AND codigo_empresa != '';
-- Resultado: X registros

SELECT COUNT(*) as reportes_con_finca FROM reporte 
WHERE codigo_finca IS NOT NULL AND codigo_finca != '';
-- Resultado: X registros (debe ser igual al anterior)

-- Verificación 3: Sensores con empresa y finca
SELECT COUNT(*) as sensores_con_empresa FROM sensor 
WHERE codigo_empresa IS NOT NULL AND codigo_empresa != '';
-- Resultado: X registros

SELECT COUNT(*) as sensores_con_finca FROM sensor 
WHERE codigo_finca IS NOT NULL AND codigo_finca != '';
-- Resultado: X registros (debe ser igual al anterior)


-- PASO 7: CREAR TABLA DE AUDITORÍA (Si no existe)
-- Ejecutar solo si la tabla auditoria_acceso NO fue creada en PASO 3

-- Copiar de migrations/add_empresa_finca_isolation.sql la sección:
-- "CREAR TABLA DE AUDITORÍA"


-- PASO 8: VERIFICAR INTEGRIDAD - REGISTROS SIN LLENAR
-- Buscar registros que no fueron poblados (debe retornar 0)

-- Usuarios sin empresa:
SELECT COUNT(*) FROM usuario WHERE codigo_empresa IS NULL OR codigo_empresa = '';

-- Reportes sin empresa:
SELECT COUNT(*) FROM reporte WHERE codigo_empresa IS NULL OR codigo_empresa = '';

-- Sensores sin empresa:
SELECT COUNT(*) FROM sensor WHERE codigo_empresa IS NULL OR codigo_empresa = '';

-- ⚠️  Si alguna query retorna > 0, NO continuar al PASO 9
-- Revisar populate_empresa_finca_data.sql y ejecutar nuevamente


-- PASO 9: AGREGAR CONSTRAINTS - PARTE 3 (NOT NULL y FKs)
-- Archivo: migrations/add_empresa_finca_constraints.sql
-- Acción: Copiar TODO el contenido del archivo y ejecutar
-- Duración: ~5 segundos
-- Resultado: Columnas convertidas a NOT NULL + FKs agregadas
-- CRÍTICO: Solo ejecutar si PASO 8 retorna 0 en todas las queries

-- >>> COPIAR Y EJECUTAR: migrations/add_empresa_finca_constraints.sql <<<


-- PASO 10: VERIFICAR CONSTRAINTS (Foreign Keys)
-- Confirmar que los constraints fueron creados

SELECT CONSTRAINT_NAME, TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME
FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
WHERE TABLE_NAME IN ('usuario', 'sensor', 'reporte', 'componente', 'mantenimiento')
AND REFERENCED_TABLE_NAME = 'empresa'
ORDER BY TABLE_NAME;

-- Resultado esperado: Debería haber FK para:
-- usuario -> empresa
-- sensor -> empresa
-- reporte -> empresa
-- componente -> empresa
-- mantenimiento -> empresa


-- PASO 11: MATRIZ DE ACCESO - VER QUÉ USUARIO VE QUÉ
-- Ejecutar para verificar la configuración final

SELECT 
    u.id,
    u.codigo as usuario_codigo,
    u.email,
    e.codigo as empresa,
    e.nombre as empresa_nombre,
    f.codigo as finca,
    f.nombre as finca_nombre
FROM usuario u
JOIN empresa e ON e.codigo = u.codigo_empresa
JOIN finca f ON f.codigo = u.codigo_finca
ORDER BY e.nombre, f.nombre, u.email;

-- Este query muestra la matriz de acceso


-- PASO 12: VALIDACIÓN FINAL
-- Ejecutar para confirmar que todo está listo

SELECT 
    'Base de Datos' as aspecto,
    'OK' as estado,
    NOW() as fecha_validacion
UNION ALL
SELECT 
    'Columnas usuario',
    IF(EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_NAME='usuario' AND COLUMN_NAME='codigo_empresa'),
       'OK', 'FALTA'),
    NOW()
UNION ALL
SELECT 
    'Columnas sensor',
    IF(EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
              WHERE TABLE_NAME='sensor' AND COLUMN_NAME='codigo_empresa'),
       'OK', 'FALTA'),
    NOW()
UNION ALL
SELECT 
    'Tabla auditoria_acceso',
    IF(EXISTS(SELECT 1 FROM INFORMATION_SCHEMA.TABLES 
              WHERE TABLE_NAME='auditoria_acceso'),
       'OK', 'FALTA'),
    NOW()
UNION ALL
SELECT 
    'Datos poblados',
    IF((SELECT COUNT(*) FROM usuario WHERE codigo_empresa IS NULL) = 0,
       'OK', 'ERROR'),
    NOW();


-- ============================================================================
-- PRÓXIMA FASE: BACKEND
-- ============================================================================

-- Una vez completada esta fase SQL, continuar con:
-- 1. Actualizar config/session_security.php (YA ESTÁ HECHO)
-- 2. Actualizar controllers/logincontroller.php (YA ESTÁ HECHO)
-- 3. Actualizar cada api/*.php según template
-- 4. Testear con múltiples usuarios

-- Ver: README_SECURITY.md para continuar


-- ============================================================================
-- REFERENCIAS ÚTILES
-- ============================================================================

-- Ver todas las columnas de una tabla:
DESCRIBE usuario;
DESCRIBE sensor;
DESCRIBE reporte;

-- Ver todas las foreign keys:
SELECT * FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
WHERE REFERENCED_TABLE_NAME = 'empresa';

-- Ver índices:
SHOW INDEXES FROM usuario;
SHOW INDEXES FROM sensor;
SHOW INDEXES FROM reporte;

-- Buscar registros con problemas:
SELECT * FROM usuario WHERE codigo_empresa IS NULL;
SELECT * FROM sensor WHERE codigo_empresa IS NULL OR codigo_finca IS NULL;
SELECT * FROM reporte WHERE codigo_empresa IS NULL OR codigo_finca IS NULL;

-- Contar datos por empresa:
SELECT e.codigo, e.nombre, COUNT(u.id) as usuarios
FROM empresa e
LEFT JOIN usuario u ON u.codigo_empresa = e.codigo
GROUP BY e.codigo, e.nombre;

-- Contar datos por finca:
SELECT f.codigo, f.nombre, COUNT(u.id) as usuarios
FROM finca f
LEFT JOIN usuario u ON u.codigo_finca = f.codigo
GROUP BY f.codigo, f.nombre;


-- ============================================================================
-- GUÍA DE ERRORES
-- ============================================================================

-- Error: "Duplicate column name"
-- Causa: La columna ya existe (migración ya fue ejecutada)
-- Solución: Ignorar, continuar al PASO 4

-- Error: "Cannot add or update a child row: a foreign key constraint fails"
-- Causa: Hay registros huérfanos en la BD
-- Solución: Ver migrations/populate_empresa_finca_data.sql para limpiar

-- Error: "Unknown column 'codigo_empresa'"
-- Causa: Migraciones no fueron ejecutadas
-- Solución: Ejecutar PASO 3 primero

-- Error: "Constraint already exists"
-- Causa: El FK ya fue creado
-- Solución: Ignorar, continuar

-- Error: COUNT(*) retorna > 0 en verificación de NULL
-- Causa: Hay registros sin llenar
-- Solución: Revisar populate_empresa_finca_data.sql y ejecutar nuevamente


-- ============================================================================
-- RESPALDO (Backup recomendado antes de ejecutar)
-- ============================================================================

-- Crear backup:
-- mysqldump -u root -p refrigeracioncyc > refrigeracioncyc_backup.sql

-- Restaurar desde backup:
-- mysql -u root -p refrigeracioncyc < refrigeracioncyc_backup.sql


-- ============================================================================
-- FIN DE INSTRUCCIONES
-- Una vez completados todos los pasos, continuar con:
-- README_SECURITY.md → PLAN_IMPLEMENTACION.md
-- ============================================================================
