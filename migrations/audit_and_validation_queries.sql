-- ========================================================
-- SCRIPTS DE AUDITORÍA Y VALIDACIÓN
-- Para usar después de implementar aislamiento
-- ========================================================

-- ========================================================
-- 1. VERIFICAR INTEGRIDAD: Registros sin empresa/finca
-- ========================================================

-- Reportes sin empresa/finca
SELECT COUNT(*) as reportes_sin_empresa FROM reporte 
WHERE codigo_empresa IS NULL OR codigo_empresa = '';

SELECT COUNT(*) as reportes_sin_finca FROM reporte 
WHERE codigo_finca IS NULL OR codigo_finca = '';

-- Sensores sin empresa/finca
SELECT COUNT(*) as sensores_sin_empresa FROM sensor 
WHERE codigo_empresa IS NULL OR codigo_empresa = '';

SELECT COUNT(*) as sensores_sin_finca FROM sensor 
WHERE codigo_finca IS NULL OR codigo_finca = '';

-- Componentes sin empresa/finca
SELECT COUNT(*) as componentes_sin_empresa FROM componente 
WHERE codigo_empresa IS NULL OR codigo_empresa = '';

SELECT COUNT(*) as componentes_sin_finca FROM componente 
WHERE codigo_finca IS NULL OR codigo_finca = '';

-- Mantenimientos sin empresa/finca
SELECT COUNT(*) as mantenimientos_sin_empresa FROM mantenimiento 
WHERE codigo_empresa IS NULL OR codigo_empresa = '';

SELECT COUNT(*) as mantenimientos_sin_finca FROM mantenimiento 
WHERE codigo_finca IS NULL OR codigo_finca = '';

-- Cuartos fríos sin empresa
SELECT COUNT(*) as cuartos_sin_empresa FROM cuarto_frio 
WHERE codigo_empresa IS NULL OR codigo_empresa = '';

-- Usuarios sin empresa
SELECT COUNT(*) as usuarios_sin_empresa FROM usuario 
WHERE codigo_empresa IS NULL OR codigo_empresa = '';

-- ========================================================
-- 2. REPORTE DE AUDITORÍA POR USUARIO
-- ========================================================

SELECT 
    a.codigo_usuario,
    u.nombre as usuario_nombre,
    u.email,
    COUNT(*) as total_acciones,
    COUNT(CASE WHEN a.accion = 'READ' THEN 1 END) as lecturas,
    COUNT(CASE WHEN a.accion = 'CREATE' THEN 1 END) as creaciones,
    COUNT(CASE WHEN a.accion = 'UPDATE' THEN 1 END) as actualizaciones,
    COUNT(CASE WHEN a.accion = 'DELETE' THEN 1 END) as eliminaciones,
    MAX(a.fecha_hora) as ultimo_acceso
FROM auditoria_acceso a
LEFT JOIN usuario u ON a.codigo_usuario = u.codigo
GROUP BY a.codigo_usuario, u.nombre, u.email
ORDER BY ultimo_acceso DESC;

-- ========================================================
-- 3. REPORTE: Acceso Cruzado (intentos de acceso a otros datos)
-- ========================================================

SELECT 
    a.codigo_usuario,
    u.email as usuario,
    a.codigo_empresa as empresa_accedida,
    a.codigo_finca as finca_accedida,
    u.codigo_empresa as empresa_usuario,
    u.codigo_finca as finca_usuario,
    COUNT(*) as intentos,
    MAX(a.fecha_hora) as ultimo_intento
FROM auditoria_acceso a
LEFT JOIN usuario u ON a.codigo_usuario = u.codigo
WHERE (a.codigo_empresa != u.codigo_empresa OR a.codigo_finca != u.codigo_finca)
AND u.codigo IS NOT NULL
GROUP BY a.codigo_usuario, u.email, a.codigo_empresa, a.codigo_finca
ORDER BY intentos DESC;

-- ========================================================
-- 4. REPORTE: Cambios Recientes
-- ========================================================

SELECT 
    a.fecha_hora,
    a.accion,
    a.codigo_usuario,
    u.email as usuario_email,
    a.tabla_afectada,
    a.registro_id,
    a.codigo_empresa,
    a.codigo_finca,
    a.ip_origen
FROM auditoria_acceso a
LEFT JOIN usuario u ON a.codigo_usuario = u.codigo
WHERE a.fecha_hora >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
ORDER BY a.fecha_hora DESC
LIMIT 100;

-- ========================================================
-- 5. VALIDAR CONSTRAINTS: Verificar FK corruptos
-- ========================================================

-- Sensores con cuarto_frio inválido
SELECT s.id, s.codigo FROM sensor s
WHERE NOT EXISTS (SELECT 1 FROM cuarto_frio cf WHERE cf.codigo = s.codigo_cuarto);

-- Reportes con sensor inválido
SELECT r.id, r.codigo FROM reporte r
WHERE NOT EXISTS (SELECT 1 FROM sensor s WHERE s.codigo = r.codigo_sensor);

-- Usuarios con finca inválida
SELECT u.id, u.codigo FROM usuario u
WHERE NOT EXISTS (SELECT 1 FROM finca f WHERE f.codigo = u.codigo_finca);

-- Usuarios con empresa inválida
SELECT u.id, u.codigo FROM usuario u
WHERE NOT EXISTS (SELECT 1 FROM empresa e WHERE e.codigo = u.codigo_empresa);

-- Usuarios con rol inválido
SELECT u.id, u.codigo FROM usuario u
WHERE NOT EXISTS (SELECT 1 FROM rol r WHERE r.codigo = u.codigo_rol);

-- ========================================================
-- 6. ESTADÍSTICAS: Datos por Empresa/Finca
-- ========================================================

SELECT 
    e.codigo as empresa_codigo,
    e.nombre as empresa_nombre,
    COUNT(DISTINCT f.id) as total_fincas,
    COUNT(DISTINCT u.id) as total_usuarios,
    COUNT(DISTINCT s.id) as total_sensores,
    COUNT(DISTINCT r.id) as total_reportes
FROM empresa e
LEFT JOIN finca f ON f.codigo_empresa = e.codigo
LEFT JOIN usuario u ON u.codigo_empresa = e.codigo
LEFT JOIN sensor s ON s.codigo_empresa = e.codigo
LEFT JOIN reporte r ON r.codigo_empresa = e.codigo
GROUP BY e.codigo, e.nombre
ORDER BY e.nombre;

-- ========================================================
-- 7. ESTADÍSTICAS: Datos por Finca
-- ========================================================

SELECT 
    f.codigo as finca_codigo,
    f.nombre as finca_nombre,
    e.nombre as empresa_nombre,
    COUNT(DISTINCT u.id) as total_usuarios,
    COUNT(DISTINCT cf.id) as total_cuartos_frios,
    COUNT(DISTINCT s.id) as total_sensores,
    COUNT(DISTINCT r.id) as total_reportes,
    COUNT(DISTINCT c.id) as total_componentes,
    COUNT(DISTINCT m.id) as total_mantenimientos
FROM finca f
LEFT JOIN empresa e ON e.codigo = f.codigo_empresa
LEFT JOIN usuario u ON u.codigo_finca = f.codigo
LEFT JOIN cuarto_frio cf ON cf.codigo_finca = f.codigo
LEFT JOIN sensor s ON s.codigo_finca = f.codigo
LEFT JOIN reporte r ON r.codigo_finca = f.codigo
LEFT JOIN componente c ON c.codigo_finca = f.codigo
LEFT JOIN mantenimiento m ON m.codigo_finca = f.codigo
GROUP BY f.codigo, f.nombre, e.nombre
ORDER BY e.nombre, f.nombre;

-- ========================================================
-- 8. DETECTAR ANOMALÍAS: Usuarios sin Finca/Empresa
-- ========================================================

SELECT 
    u.id,
    u.codigo,
    u.email,
    u.codigo_empresa,
    u.codigo_finca,
    u.activo
FROM usuario u
WHERE u.codigo_empresa IS NULL 
   OR u.codigo_empresa = ''
   OR u.codigo_finca IS NULL 
   OR u.codigo_finca = ''
ORDER BY u.fecha_creacion DESC;

-- ========================================================
-- 9. REGISTRAR EVENTOS MANUALES EN AUDITORÍA
-- ========================================================

-- Ejemplo: Registrar un evento manual de verificación de seguridad
INSERT INTO auditoria_acceso 
(codigo_usuario, codigo_empresa, codigo_finca, accion, tabla_afectada, ip_origen, fecha_hora)
VALUES 
('admin', 'EMP001', 'FIN001', 'SECURITY_CHECK', 'auditoria_acceso', '127.0.0.1', NOW());

-- ========================================================
-- 10. LIMPIAR AUDITORÍA ANTIGUA (opcional)
-- ========================================================

-- Archivar auditoría de hace más de 1 año (ANTES DE EJECUTAR, CREAR TABLA DE BACKUP)
DELETE FROM auditoria_acceso 
WHERE fecha_hora < DATE_SUB(NOW(), INTERVAL 1 YEAR)
LIMIT 10000;  -- Por seguridad, eliminar en lotes

-- ========================================================
-- 11. EXPORTAR DATOS PARA COMPLIANCE
-- ========================================================

-- Exportar auditoría de una empresa específica
SELECT * FROM auditoria_acceso 
WHERE codigo_empresa = 'EMP001'
AND fecha_hora >= '2024-01-01'
AND fecha_hora <= '2024-12-31'
ORDER BY fecha_hora DESC
INTO OUTFILE '/tmp/auditoria_empresa_2024.csv'
FIELDS TERMINATED BY ','
LINES TERMINATED BY '\n';

-- ========================================================
-- 12. VALIDACIÓN: Matriz de Acceso
-- ========================================================

-- Mostrar qué empresa/finca tiene acceso cada usuario
SELECT 
    u.codigo as usuario_codigo,
    u.email,
    u.nombre,
    e.nombre as empresa,
    f.nombre as finca,
    u.activo,
    u.fecha_creacion
FROM usuario u
JOIN empresa e ON e.codigo = u.codigo_empresa
JOIN finca f ON f.codigo = u.codigo_finca
ORDER BY e.nombre, f.nombre, u.email;

-- ========================================================
-- 13. TEST: Consulta Segura (Ejemplo)
-- ========================================================

-- Simular acceso de usuario a sus reportes
-- Cambiar los valores según el usuario de prueba
SET @usuario_empresa = 'EMP001';
SET @usuario_finca = 'FIN001';

SELECT r.* FROM reporte r
WHERE r.codigo_empresa = @usuario_empresa
AND r.codigo_finca = @usuario_finca
AND r.activo = 1
ORDER BY r.fecha_creacion DESC
LIMIT 20;

-- Verificar que NO retorna datos de otras empresas/fincas
SELECT 
    COUNT(*) as total_reportes,
    COUNT(DISTINCT r.codigo_empresa) as empresas,
    COUNT(DISTINCT r.codigo_finca) as fincas
FROM reporte r
WHERE r.codigo_empresa = @usuario_empresa
AND r.codigo_finca = @usuario_finca;

-- ========================================================
-- NOTAS DE MANTENIMIENTO
-- ========================================================

/*
TAREAS REGULARMENTE:

Diaria:
- Revisar tabla auditoria_acceso para accesos anómalos
- Monitorear intentos de acceso cruzado

Semanal:
- Ejecutar query #12 para matriz de acceso
- Verificar usuarios inactivos en sistema

Mensual:
- Ejecutar estadísticas (#6, #7)
- Revisar logs de cambios recientes (#5)
- Validar integridad de constraints (#5)

Anualmente:
- Archivar auditoría antigua (#10)
- Exportar datos para compliance (#11)
- Revisar y actualizar permisos
*/
