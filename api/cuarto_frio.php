<?php
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../config/session_security.php';
require_once __DIR__ . '/../models/cuarto_frio.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Usuarios autenticados pueden gestionar cuartos fríos de su finca
requireAuth();

$pdo = Database::connect();
$cuartoModel = new CuartoFrio($pdo);

$empresaUsuario = getUserEmpresa();
$fincaUsuario = getUserFinca();
if (!isSuperusuario() && !$empresaUsuario) {
    respond(['error' => 'Usuario sin empresa asignada'], 403);
}

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

        // Filtrar por finca/empresa del usuario si no es superusuario
        if (!isSuperusuario()) {
            if ($fincaUsuario) {
                // Usuario de finca: solo su finca
                $codigoFinca = $fincaUsuario;
            } elseif ($empresaUsuario && !$codigoFinca) {
                // Usuario de empresa sin filtro específico: todas sus fincas
                // Esto se maneja en el modelo, permitimos que pase
            }
        }

        if ($codigo) {
            $row = $cuartoModel->obtenerPorCodigo($codigo);
            // Verificar que el cuarto pertenece a la finca/empresa del usuario
            if ($row && !isSuperusuario()) {
                $cuartoFinca = $row['codigo_finca'] ?? null;
                // Obtener empresa del cuarto
                if ($cuartoFinca) {
                    $sqlEmp = "SELECT codigo_empresa FROM finca WHERE codigo = ?";
                    $stEmp = $pdo->prepare($sqlEmp);
                    $stEmp->execute([$cuartoFinca]);
                    $fincaRow = $stEmp->fetch(PDO::FETCH_ASSOC);
                    $cuartoEmpresa = $fincaRow['codigo_empresa'] ?? null;
                    
                    // Usuario de finca: solo su finca
                    if ($fincaUsuario && $cuartoFinca !== $fincaUsuario) {
                        respond(['error' => 'Acceso denegado'], 403);
                    }
                    // Usuario de empresa: solo su empresa
                    if (!$fincaUsuario && $empresaUsuario && $cuartoEmpresa !== $empresaUsuario) {
                        respond(['error' => 'Acceso denegado'], 403);
                    }
                }
            }
            $row ? respond($row) : respond(['error' => 'Cuarto frío no encontrado'], 404);
        } else {
            // Para listar, si es usuario de empresa, obtener cuartos de todas sus fincas
            if (!isSuperusuario() && !$fincaUsuario && $empresaUsuario && !$codigoFinca) {
                $sqlFincas = "SELECT codigo FROM finca WHERE codigo_empresa = ?";
                $stFincas = $pdo->prepare($sqlFincas);
                $stFincas->execute([$empresaUsuario]);
                $fincas = $stFincas->fetchAll(PDO::FETCH_COLUMN);
                
                if (empty($fincas)) {
                    respond([]);
                }
                
                $placeholders = implode(',', array_fill(0, count($fincas), '?'));
                $sqlCuartos = "SELECT * FROM cuarto_frio WHERE codigo_finca IN ($placeholders) ORDER BY nombre";
                $stCuartos = $pdo->prepare($sqlCuartos);
                $stCuartos->execute($fincas);
                respond($stCuartos->fetchAll(PDO::FETCH_ASSOC));
            }
            
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
            
            if ($fincaUsuario && $data['codigo_finca'] !== $fincaUsuario) {
                respond(['error' => 'No puede crear cuartos en otra finca'], 403);
            }
            if (!$fincaUsuario && $empresaUsuario && $finca['codigo_empresa'] !== $empresaUsuario) {
                respond(['error' => 'No puede crear cuartos en otra empresa'], 403);
            }
        } elseif (!isSuperusuario()) {
            // Si no especificó finca, asignar la del usuario
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

        if (!isSuperusuario()) {
            $row = $cuartoModel->obtenerPorCodigo($codigo);
            if (!$row) {
                respond(['error' => 'Acceso denegado'], 403);
            }

            $sqlCheck = "SELECT c.codigo_finca, f.codigo_empresa
                         FROM cuarto_frio c
                         INNER JOIN finca f ON c.codigo_finca = f.codigo
                         WHERE c.codigo = ?";
            $stCheck = $pdo->prepare($sqlCheck);
            $stCheck->execute([$codigo]);
            $cuartoData = $stCheck->fetch(PDO::FETCH_ASSOC);

            if (!$cuartoData) {
                respond(['error' => 'Acceso denegado'], 403);
            }

            if ($fincaUsuario && $cuartoData['codigo_finca'] !== $fincaUsuario) {
                respond(['error' => 'Acceso denegado'], 403);
            }
            if (!$fincaUsuario && $empresaUsuario && $cuartoData['codigo_empresa'] !== $empresaUsuario) {
                respond(['error' => 'Acceso denegado'], 403);
            }
        }

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

        if (!isSuperusuario()) {
            $row = $cuartoModel->obtenerPorCodigo($codigo);
            if (!$row) {
                respond(['error' => 'Acceso denegado'], 403);
            }

            $sqlCheck = "SELECT c.codigo_finca, f.codigo_empresa
                         FROM cuarto_frio c
                         INNER JOIN finca f ON c.codigo_finca = f.codigo
                         WHERE c.codigo = ?";
            $stCheck = $pdo->prepare($sqlCheck);
            $stCheck->execute([$codigo]);
            $cuartoData = $stCheck->fetch(PDO::FETCH_ASSOC);

            if (!$cuartoData) {
                respond(['error' => 'Acceso denegado'], 403);
            }

            if ($fincaUsuario && $cuartoData['codigo_finca'] !== $fincaUsuario) {
                respond(['error' => 'Acceso denegado'], 403);
            }
            if (!$fincaUsuario && $empresaUsuario && $cuartoData['codigo_empresa'] !== $empresaUsuario) {
                respond(['error' => 'Acceso denegado'], 403);
            }
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
