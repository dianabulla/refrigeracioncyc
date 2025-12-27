<?php
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../models/mantenimiento.php';

if (session_status() === PHP_SESSION_NONE) session_start();
requireAuth(); // cualquier usuario autenticado puede gestionar mantenimientos

$pdo = Database::connect();
$model = new Mantenimiento($pdo);

$method = $_SERVER['REQUEST_METHOD'];

/** Helper de respuesta */
function respond($data, int $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

try {

    // -----------------------------------
    // GET → Listar o buscar por código
    // -----------------------------------
    if ($method === 'GET') {
        // Verificar permiso para ver mantenimientos
        requirePermiso('ver_mantenimientos');

        $codigo = $_GET['codigo'] ?? null;

        if ($codigo) {
            $row = $model->obtener($codigo);
            
            // AISLAMIENTO: Verificar acceso
            if ($row && !isSuperusuario()) {
                $sqlCheck = "SELECT c.codigo_finca, f.codigo_empresa 
                             FROM mantenimiento m
                             INNER JOIN cuarto_frio c ON m.codigo_cuarto = c.codigo
                             INNER JOIN finca f ON c.codigo_finca = f.codigo
                             WHERE m.codigo = ?";
                $stCheck = $pdo->prepare($sqlCheck);
                $stCheck->execute([$codigo]);
                $mantFinca = $stCheck->fetch(PDO::FETCH_ASSOC);
                
                $fincaUsuario = getUserFinca();
                $empresaUsuario = getUserEmpresa();
                
                if ($fincaUsuario && $mantFinca['codigo_finca'] !== $fincaUsuario) {
                    respond(['ok'=>false,'error'=>'Acceso denegado'],403);
                }
                if (!$fincaUsuario && $empresaUsuario && $mantFinca['codigo_empresa'] !== $empresaUsuario) {
                    respond(['ok'=>false,'error'=>'Acceso denegado'],403);
                }
            }
            
            return $row 
                ? respond($row)
                : respond(['ok' => false, 'error' => 'Mantenimiento no encontrado'], 404);
        }

        // Listar con filtro de finca/empresa
        if (!isSuperusuario()) {
            $fincaUsuario = getUserFinca();
            $empresaUsuario = getUserEmpresa();
            
            $sql = "SELECT m.* FROM mantenimiento m
                    INNER JOIN cuarto_frio c ON m.codigo_cuarto = c.codigo
                    INNER JOIN finca f ON c.codigo_finca = f.codigo
                    WHERE 1=1";
            $params = [];
            
            if ($fincaUsuario) {
                $sql .= " AND f.codigo = ?";
                $params[] = $fincaUsuario;
            } elseif ($empresaUsuario) {
                $sql .= " AND f.codigo_empresa = ?";
                $params[] = $empresaUsuario;
            } else {
                respond(['ok'=>false,'error'=>'Sin permisos'],403);
            }
            
            $sql .= " ORDER BY m.fecha_inicio DESC";
            $st = $pdo->prepare($sql);
            $st->execute($params);
            return respond($st->fetchAll(PDO::FETCH_ASSOC));
        }
        
        return respond($model->listar());
    }

    // -----------------------------------
    // POST → Crear mantenimiento
    // -----------------------------------
    if ($method === 'POST') {
        // Verificar permiso para crear mantenimientos
        requirePermiso('crear_mantenimientos');

        $data = json_decode(file_get_contents("php://input"), true) ?? $_POST;

        if (empty($data['codigo']) || empty($data['nombre'])) {
            respond(['ok' => false, 'error' => 'Código y nombre son obligatorios'], 422);
        }
        
        // AISLAMIENTO: Validar cuarto
        if (!isSuperusuario() && !empty($data['codigo_cuarto'])) {
            $sqlCheck = "SELECT c.codigo_finca, f.codigo_empresa 
                         FROM cuarto_frio c
                         INNER JOIN finca f ON c.codigo_finca = f.codigo
                         WHERE c.codigo = ?";
            $stCheck = $pdo->prepare($sqlCheck);
            $stCheck->execute([$data['codigo_cuarto']]);
            $cuartoFinca = $stCheck->fetch(PDO::FETCH_ASSOC);
            
            if (!$cuartoFinca) {
                respond(['ok'=>false,'error'=>'Cuarto no encontrado'],404);
            }
            
            $fincaUsuario = getUserFinca();
            $empresaUsuario = getUserEmpresa();
            
            if ($fincaUsuario && $cuartoFinca['codigo_finca'] !== $fincaUsuario) {
                respond(['ok'=>false,'error'=>'No puede crear mantenimientos en otra finca'],403);
            }
            if (!$fincaUsuario && $empresaUsuario && $cuartoFinca['codigo_empresa'] !== $empresaUsuario) {
                respond(['ok'=>false,'error'=>'No puede crear mantenimientos en otra empresa'],403);
            }
        }

        $ok = $model->crear([
            'codigo'            => trim($data['codigo']),
            'nombre'            => trim($data['nombre']),
            'descripcion'       => !empty($data['descripcion']) ? trim($data['descripcion']) : null,
            'tipo'              => !empty($data['tipo']) ? trim($data['tipo']) : null,
            'diagnostico'       => !empty($data['diagnostico']) ? trim($data['diagnostico']) : null,
            'acciones'          => !empty($data['acciones']) ? trim($data['acciones']) : null,
            'fecha_inicio'      => !empty($data['fecha_inicio']) ? $data['fecha_inicio'] : null,
            'fecha_fin'         => !empty($data['fecha_fin']) ? $data['fecha_fin'] : null,
            'codigo_cuarto'     => !empty($data['codigo_cuarto']) ? trim($data['codigo_cuarto']) : null,
            'codigo_componente' => !empty($data['codigo_componente']) ? trim($data['codigo_componente']) : null
        ]);

        return $ok
            ? respond(['ok'=>true, 'message'=>'Mantenimiento creado'])
            : respond(['ok'=>false, 'error'=>'No se pudo crear (verifique campos requeridos o el código ya existe)'],500);
    }

    // -----------------------------------
    // PUT → Actualizar mantenimiento
    // -----------------------------------
    if ($method === 'PUT') {
        // Verificar permiso para editar mantenimientos
        requirePermiso('editar_mantenimientos');

        $codigo = $_GET['codigo'] ?? null;
        if (!$codigo) respond(['ok'=>false,'error'=>'Debe enviar ?codigo='],422);

        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data) respond(['ok'=>false,'error'=>'JSON inválido'],422);

        $ok = $model->actualizar($codigo, [
            'nombre'            => !empty($data['nombre']) ? trim($data['nombre']) : null,
            'descripcion'       => !empty($data['descripcion']) ? trim($data['descripcion']) : null,
            'tipo'              => !empty($data['tipo']) ? trim($data['tipo']) : null,
            'diagnostico'       => !empty($data['diagnostico']) ? trim($data['diagnostico']) : null,
            'acciones'          => !empty($data['acciones']) ? trim($data['acciones']) : null,
            'fecha_inicio'      => !empty($data['fecha_inicio']) ? $data['fecha_inicio'] : null,
            'fecha_fin'         => !empty($data['fecha_fin']) ? $data['fecha_fin'] : null,
            'codigo_cuarto'     => !empty($data['codigo_cuarto']) ? trim($data['codigo_cuarto']) : null,
            'codigo_componente' => !empty($data['codigo_componente']) ? trim($data['codigo_componente']) : null
        ]);

        return $ok
            ? respond(['ok'=>true,'message'=>'Actualizado'])
            : respond(['ok'=>false,'error'=>'No se pudo actualizar'],500);
    }

    // -----------------------------------
    // DELETE → Eliminar por código
    // -----------------------------------
    if ($method === 'DELETE') {
        // Verificar permiso para eliminar mantenimientos
        requirePermiso('eliminar_mantenimientos');

        $codigo = $_GET['codigo'] ?? null;
        if (!$codigo) respond(['ok'=>false,'error'=>'Debe enviar ?codigo='],422);

        $ok = $model->eliminar($codigo);
        return $ok
            ? respond(['ok'=>true,'message'=>'Eliminado'])
            : respond(['ok'=>false,'error'=>'No se pudo eliminar'],500);
    }

    // Método no permitido
    respond(['error'=>'Método no permitido'],405);

} catch (Throwable $e) {
    respond(['error'=>$e->getMessage()],500);
}
