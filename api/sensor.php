<?php
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../models/sensor.php';

if (session_status() === PHP_SESSION_NONE) session_start();

requireAuth(); // Usuarios autenticados pueden gestionar sensores de sus cuartos

$pdo = Database::connect();
$model = new Sensor($pdo);

function respond($d, int $status=200){
    http_response_code($status);
    echo json_encode($d, JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {

    // GET
    if ($method === 'GET') {
        // Verificar permiso para ver sensores
        requirePermiso('ver_sensores');

        $codigo = $_GET['codigo'] ?? null;
        $cuarto = $_GET['codigo_cuarto'] ?? null;

        if ($codigo) {
            $r = $model->obtenerPorCodigo($codigo);
            
            // AISLAMIENTO: Verificar acceso al sensor
            if ($r && !isSuperusuario()) {
                $sqlCheck = "SELECT f.codigo_empresa, c.codigo_finca 
                             FROM sensor s
                             INNER JOIN cuarto_frio c ON s.codigo_cuarto = c.codigo
                             INNER JOIN finca f ON c.codigo_finca = f.codigo
                             WHERE s.codigo = ?";
                $stCheck = $pdo->prepare($sqlCheck);
                $stCheck->execute([$codigo]);
                $sensorFinca = $stCheck->fetch(PDO::FETCH_ASSOC);
                
                $fincaUsuario = getUserFinca();
                $empresaUsuario = getUserEmpresa();
                
                if ($fincaUsuario && $sensorFinca['codigo_finca'] !== $fincaUsuario) {
                    respond(['error'=>'Acceso denegado'], 403);
                }
                if (!$fincaUsuario && $empresaUsuario && $sensorFinca['codigo_empresa'] !== $empresaUsuario) {
                    respond(['error'=>'Acceso denegado'], 403);
                }
            }
            
            $r ? respond($r) : respond(['error'=>'No encontrado'], 404);
        }

        // Listar sensores con filtro por finca/empresa
        if (!isSuperusuario()) {
            $fincaUsuario = getUserFinca();
            $empresaUsuario = getUserEmpresa();
            
            $sql = "SELECT s.* FROM sensor s
                    INNER JOIN cuarto_frio c ON s.codigo_cuarto = c.codigo
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
                respond(['error'=>'Sin permisos'], 403);
            }
            
            if ($cuarto) {
                $sql .= " AND s.codigo_cuarto = ?";
                $params[] = $cuarto;
            }
            
            $sql .= " ORDER BY s.fecha_creacion DESC";
            $st = $pdo->prepare($sql);
            $st->execute($params);
            respond($st->fetchAll(PDO::FETCH_ASSOC));
        }
        
        respond($model->listar($cuarto));
    }

    // POST
    if ($method === 'POST') {
        // Verificar permiso para crear sensores
        requirePermiso('crear_sensores');

        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data)) $data = $_POST;
        
        // AISLAMIENTO: Validar que el cuarto pertenece a la finca del usuario
        if (!isSuperusuario() && !empty($data['codigo_cuarto'])) {
            $sqlCheck = "SELECT c.codigo_finca, f.codigo_empresa 
                         FROM cuarto_frio c
                         INNER JOIN finca f ON c.codigo_finca = f.codigo
                         WHERE c.codigo = ?";
            $stCheck = $pdo->prepare($sqlCheck);
            $stCheck->execute([$data['codigo_cuarto']]);
            $cuartoFinca = $stCheck->fetch(PDO::FETCH_ASSOC);
            
            if (!$cuartoFinca) {
                respond(['error'=>'Cuarto no encontrado'], 404);
            }
            
            $fincaUsuario = getUserFinca();
            $empresaUsuario = getUserEmpresa();
            
            if ($fincaUsuario && $cuartoFinca['codigo_finca'] !== $fincaUsuario) {
                respond(['error'=>'No puede crear sensores en cuartos de otra finca'], 403);
            }
            if (!$fincaUsuario && $empresaUsuario && $cuartoFinca['codigo_empresa'] !== $empresaUsuario) {
                respond(['error'=>'No puede crear sensores en cuartos de otra empresa'], 403);
            }
        }

        $ok = $model->crear($data);
        $ok ? respond(['ok'=>true]) : respond(['error'=>'No se pudo crear (verifique campos requeridos o el código ya existe)'], 400);
    }

    // PUT
    if ($method === 'PUT') {
        // Verificar permiso para editar sensores
        requirePermiso('editar_sensores');

        parse_str(file_get_contents('php://input'), $put);
        $codigo = $put['codigo'] ?? null;
        if (!$codigo) respond(['error'=>'codigo requerido'], 422);
        unset($put['codigo']);

        $ok = $model->actualizarPorCodigo($codigo, $put);
        $ok ? respond(['ok'=>true]) : respond(['error'=>'No se pudo actualizar'], 400);
    }

    // DELETE
    if ($method === 'DELETE') {
        // Verificar permiso para eliminar sensores
        requirePermiso('eliminar_sensores');

        $codigo = $_GET['codigo'] ?? null;
        if (!$codigo) respond(['error'=>'codigo requerido'], 422);

        $ok = $model->eliminarPorCodigo($codigo);
        $ok ? respond(['ok'=>true]) : respond(['error'=>'No se pudo eliminar'], 400);
    }

    respond(['error'=>'Método no permitido'], 405);

} catch (Throwable $e) {
    respond(['error'=>$e->getMessage()], 500);
}
