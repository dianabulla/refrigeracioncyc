<?php
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../models/cuarto_frio.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Usuarios autenticados pueden gestionar cuartos fríos de su finca
requireAuth();

$pdo = Database::connect();
$cuartoModel = new CuartoFrio($pdo);

function respond($data, int $status = 200)
{
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {

    // -------- GET --------
    if ($method === 'GET') {
        // Verificar permiso para ver cuartos
        requirePermiso('ver_cuartos');

        $codigo      = $_GET['codigo'] ?? null;
        $codigoFinca = $_GET['codigo_finca'] ?? null;

        // Filtrar por finca del usuario si no es superusuario
        $fincaUsuario = getUserFinca();
        if ($fincaUsuario !== null) {
            $codigoFinca = $fincaUsuario;
        }

        if ($codigo) {
            $row = $cuartoModel->obtenerPorCodigo($codigo);
            // Verificar que el cuarto pertenece a la finca del usuario
            if ($row && $fincaUsuario !== null && ($row['codigo_finca'] ?? null) !== $fincaUsuario) {
                respond(['error' => 'Acceso denegado'], 403);
            }
            $row ? respond($row) : respond(['error' => 'Cuarto frío no encontrado'], 404);
        } else {
            $rows = $cuartoModel->listar($codigoFinca);
            respond($rows);
        }
    }

    // -------- POST (crear) --------
    if ($method === 'POST') {
        // Verificar permiso para crear cuartos
        requirePermiso('crear_cuartos');

        $data = json_decode(file_get_contents('php://input'), true);
        if (!is_array($data) || empty($data)) {
            $data = $_POST;
        }
        
        // AISLAMIENTO: Validar que la finca pertenece al usuario
        if (!isSuperusuario() && !empty($data['codigo_finca'])) {
            $sqlCheck = "SELECT f.codigo_empresa 
                         FROM finca f
                         WHERE f.codigo = ?";
            $stCheck = $pdo->prepare($sqlCheck);
            $stCheck->execute([$data['codigo_finca']]);
            $finca = $stCheck->fetch(PDO::FETCH_ASSOC);
            
            if (!$finca) {
                respond(['error' => 'Finca no encontrada'], 404);
            }
            
            $fincaUsuario = getUserFinca();
            $empresaUsuario = getUserEmpresa();
            
            if ($fincaUsuario && $data['codigo_finca'] !== $fincaUsuario) {
                respond(['error' => 'No puede crear cuartos en otra finca'], 403);
            }
            if (!$fincaUsuario && $empresaUsuario && $finca['codigo_empresa'] !== $empresaUsuario) {
                respond(['error' => 'No puede crear cuartos en finca de otra empresa'], 403);
            }
        } elseif (!isSuperusuario()) {
            // Si no especificó finca, asignar la del usuario
            $fincaUsuario = getUserFinca();
            if ($fincaUsuario) {
                $data['codigo_finca'] = $fincaUsuario;
            } else {
                respond(['error' => 'Debe especificar codigo_finca'], 422);
            }
        }

        $ok = $cuartoModel->crear($data);
        $ok ? respond(['ok' => true]) :
              respond(['error' => 'No se pudo crear (verifique campos requeridos o el código ya existe)'], 400);
    }

    // -------- PUT (actualizar) --------
    if ($method === 'PUT') {
        // Verificar permiso para editar cuartos
        requirePermiso('editar_cuartos');

        parse_str(file_get_contents('php://input'), $put);
        $codigo = $put['codigo'] ?? null;
        if (!$codigo) {
            respond(['error' => 'codigo requerido'], 422);
        }
        unset($put['codigo']);

        $ok = $cuartoModel->actualizarPorCodigo($codigo, $put);
        $ok ? respond(['ok' => true]) :
              respond(['error' => 'No se pudo actualizar'], 400);
    }

    // -------- DELETE (eliminar) --------
    if ($method === 'DELETE') {
        // Verificar permiso para eliminar cuartos
        requirePermiso('eliminar_cuartos');

        $codigo = $_GET['codigo'] ?? null;
        if (!$codigo) {
            respond(['error' => 'codigo requerido'], 422);
        }

        $ok = $cuartoModel->eliminarPorCodigo($codigo);
        $ok ? respond(['ok' => true]) :
              respond(['error' => 'No se pudo eliminar'], 400);
    }

    respond(['error' => 'Método no permitido'], 405);

} catch (Throwable $e) {
    error_log("Error en api/cuarto_frio.php: " . $e->getMessage());
    respond(['error' => 'Error interno del servidor'], 500);
}
