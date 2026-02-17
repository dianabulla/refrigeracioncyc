-- ============================================
-- MIGRACIÓN: Sistema de Roles por Empresa con Permisos
-- ============================================

-- 1. Agregar columna codigo_empresa a la tabla rol
ALTER TABLE rol 
ADD COLUMN codigo_empresa VARCHAR(50) NULL AFTER descripcion,
ADD COLUMN permisos JSON NULL AFTER codigo_empresa,
ADD INDEX idx_codigo_empresa (codigo_empresa),
ADD CONSTRAINT fk_rol_empresa 
    FOREIGN KEY (codigo_empresa) REFERENCES empresa(codigo) 
    ON DELETE CASCADE ON UPDATE CASCADE;

-- 2. Comentario de la estructura de permisos JSON
-- Formato: {"ver_usuarios": true, "crear_usuarios": false, "editar_usuarios": true, ...}

-- 3. Crear roles de ejemplo por empresa
-- Nota: Ejecutar después de tener empresas creadas

-- Ejemplo para empresa COCOS:
/*
INSERT INTO rol (codigo, nombre, descripcion, codigo_empresa, permisos, activo) VALUES
('ROL_COCOS_ADMIN', 'Administrador', 'Acceso completo a la empresa COCOS', 'COCOS', 
 '{"ver_usuarios":true,"crear_usuarios":true,"editar_usuarios":true,"eliminar_usuarios":true,
   "ver_fincas":true,"crear_fincas":true,"editar_fincas":true,"eliminar_fincas":true,
   "ver_cuartos":true,"crear_cuartos":true,"editar_cuartos":true,"eliminar_cuartos":true,
   "ver_sensores":true,"crear_sensores":true,"editar_sensores":true,"eliminar_sensores":true,
   "ver_reportes":true,"exportar_reportes":true}', 1),

('ROL_COCOS_OPERADOR', 'Operador', 'Solo visualización y reportes', 'COCOS',
 '{"ver_usuarios":false,"crear_usuarios":false,"editar_usuarios":false,"eliminar_usuarios":false,
   "ver_fincas":true,"crear_fincas":false,"editar_fincas":false,"eliminar_fincas":false,
   "ver_cuartos":true,"crear_cuartos":false,"editar_cuartos":false,"eliminar_cuartos":false,
   "ver_sensores":true,"crear_sensores":false,"editar_sensores":false,"eliminar_sensores":false,
   "ver_reportes":true,"exportar_reportes":true}', 1);
*/

-- Ejemplo para empresa PEDRO:
/*
INSERT INTO rol (codigo, nombre, descripcion, codigo_empresa, permisos, activo) VALUES
('ROL_PEDRO_ADMIN', 'Administrador', 'Acceso completo a la empresa PEDRO', 'PEDRO',
 '{"ver_usuarios":true,"crear_usuarios":true,"editar_usuarios":true,"eliminar_usuarios":true,
   "ver_fincas":true,"crear_fincas":true,"editar_fincas":true,"eliminar_fincas":true,
   "ver_cuartos":true,"crear_cuartos":true,"editar_cuartos":true,"eliminar_cuartos":true,
   "ver_sensores":true,"crear_sensores":true,"editar_sensores":true,"eliminar_sensores":true,
   "ver_reportes":true,"exportar_reportes":true}', 1);
*/

-- 4. Actualizar roles existentes (si los hay) para asignarles una empresa
-- UPDATE rol SET codigo_empresa = 'CODIGO_EMPRESA_DEFAULT' WHERE codigo_empresa IS NULL;

-- ============================================
-- PERMISOS DISPONIBLES EN EL SISTEMA
-- ============================================
/*
MÓDULO USUARIOS:
- ver_usuarios: Ver listado de usuarios
- crear_usuarios: Crear nuevos usuarios
- editar_usuarios: Editar usuarios existentes
- eliminar_usuarios: Eliminar usuarios

MÓDULO FINCAS:
- ver_fincas: Ver listado de fincas
- crear_fincas: Crear nuevas fincas
- editar_fincas: Editar fincas existentes
- eliminar_fincas: Eliminar fincas

MÓDULO CUARTOS FRÍOS:
- ver_cuartos: Ver listado de cuartos
- crear_cuartos: Crear nuevos cuartos
- editar_cuartos: Editar cuartos existentes
- eliminar_cuartos: Eliminar cuartos

MÓDULO SENSORES:
- ver_sensores: Ver listado de sensores
- crear_sensores: Crear nuevos sensores
- editar_sensores: Editar sensores existentes
- eliminar_sensores: Eliminar sensores

MÓDULO COMPONENTES:
- ver_componentes: Ver listado de componentes
- crear_componentes: Crear nuevos componentes
- editar_componentes: Editar componentes existentes
- eliminar_componentes: Eliminar componentes

MÓDULO REPORTES:
- ver_reportes: Ver reportes
- exportar_reportes: Exportar reportes a PDF/Excel

MÓDULO MANTENIMIENTO:
- ver_mantenimientos: Ver historial de mantenimientos
- crear_mantenimientos: Registrar mantenimientos
- editar_mantenimientos: Editar mantenimientos
- eliminar_mantenimientos: Eliminar mantenimientos
*/
