<?php
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../models/componente.php';

if (session_status() === PHP_SESSION_NONE) session_start();
requireAuth(); // cualquier usuario autenticado

$pdo        = Database::connect();
$componente = new Componente($pdo);

function respond($data, int $status = 200) {
    http_response_code($status);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];

try {

    /* 🟢 GET */
    if ($method === 'GET') {
        // Verificar permiso para ver componentes
        requirePermiso('ver_componentes');

        $id           = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        $codigo       = $_GET['codigo']        ?? null;
        $codigoCuarto = $_GET['codigo_cuarto'] ?? null;

        if ($id) {
            $row = $componente->obtenerPorId($id);
            
            // AISLAMIENTO: Verificar acceso
            if ($row && !isSuperusuario()) {
                $sqlCheck = "SELECT c.codigo_finca, f.codigo_empresa 
                             FROM componente comp
                             INNER JOIN cuarto_frio c ON comp.codigo_cuarto = c.codigo
                             INNER JOIN finca f ON c.codigo_finca = f.codigo
                             WHERE comp.id = ?";
                $stCheck = $pdo->prepare($sqlCheck);
                $stCheck->execute([$id]);
                $compFinca = $stCheck->fetch(PDO::FETCH_ASSOC);
                
                $fincaUsuario = getUserFinca();
                $empresaUsuario = getUserEmpresa();
                
                if ($fincaUsuario && $compFinca['codigo_finca'] !== $fincaUsuario) {
                    respond(['ok'=>false,'error'=>'Acceso denegado'],403);
                }
                if (!$fincaUsuario && $empresaUsuario && $compFinca['codigo_empresa'] !== $empresaUsuario) {
                    respond(['ok'=>false,'error'=>'Acceso denegado'],403);
                }
            }
            
            $row ? respond($row) : respond(['ok'=>false,'error'=>'Componente no encontrado'],404);
        }

        if ($codigo) {
            $row = $componente->obtenerPorCodigo($codigo);
            
            // AISLAMIENTO: Verificar acceso
            if ($row && !isSuperusuario()) {
                $sqlCheck = "SELECT c.codigo_finca, f.codigo_empresa 
                             FROM componente comp
                             INNER JOIN cuarto_frio c ON comp.codigo_cuarto = c.codigo
                             INNER JOIN finca f ON c.codigo_finca = f.codigo
                             WHERE comp.codigo = ?";
                $stCheck = $pdo->prepare($sqlCheck);
                $stCheck->execute([$codigo]);
                $compFinca = $stCheck->fetch(PDO::FETCH_ASSOC);
                
                $fincaUsuario = getUserFinca();
                $empresaUsuario = getUserEmpresa();
                
                if ($fincaUsuario && $compFinca['codigo_finca'] !== $fincaUsuario) {
                    respond(['ok'=>false,'error'=>'Acceso denegado'],403);
                }
                if (!$fincaUsuario && $empresaUsuario && $compFinca['codigo_empresa'] !== $empresaUsuario) {
                    respond(['ok'=>false,'error'=>'Acceso denegado'],403);
                }
            }
            
            $row ? respond($row) : respond(['ok'=>false,'error'=>'Componente no encontrado'],404);
        }

        // Listar con filtro de finca/empresa
        if (!isSuperusuario()) {
            $fincaUsuario = getUserFinca();
            $empresaUsuario = getUserEmpresa();
            
            $sql = "SELECT comp.* FROM componente comp
                    INNER JOIN cuarto_frio c ON comp.codigo_cuarto = c.codigo
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
            
            if ($codigoCuarto) {
                $sql .= " AND comp.codigo_cuarto = ?";
                $params[] = $codigoCuarto;
            }
            
            $sql .= " ORDER BY comp.fecha_creacion DESC, comp.id DESC";
            $st = $pdo->prepare($sql);
            $st->execute($params);
            respond($st->fetchAll(PDO::FETCH_ASSOC));
        }
        
        $lista = $componente->listar($codigoCuarto);
        respond($lista);
    }

    /* 🟡 POST */
    if ($method === 'POST') {
        // Verificar permiso para crear componentes
        requirePermiso('crear_componentes');

        $data = json_decode(file_get_contents('php://input'), true) ?? $_POST;
        
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
                respond(['ok'=>false,'error'=>'No puede crear componentes en otra finca'],403);
            }
            if (!$fincaUsuario && $empresaUsuario && $cuartoFinca['codigo_empresa'] !== $empresaUsuario) {
                respond(['ok'=>false,'error'=>'No puede crear componentes en otra empresa'],403);
            }
        }
        
        $r = $componente->crear($data);
        respond($r, $r['ok'] ? 201 : 400);
    }

    /* 🟠 PUT */
    if ($method === 'PUT') {
        // Verificar permiso para editar componentes
        requirePermiso('editar_componentes');

        $id           = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        $codigo       = $_GET['codigo'] ?? null;

        $raw = file_get_contents('php://input');
        $put = json_decode($raw, true);
        if (!is_array($put)) {
            parse_str($raw, $put);
        }

        if (!$id && !$codigo) {
            respond(['ok'=>false,'error'=>'Se requiere id o codigo'],422);
        }

        $where = $id ? ['id'=>$id] : ['codigo'=>$codigo];
        $r = $componente->actualizar($where, $put);
        respond($r, $r['ok'] ? 200 : 400);
    }

    /* 🔴 DELETE */
    if ($method === 'DELETE') {
        // Verificar permiso para eliminar componentes
        requirePermiso('eliminar_componentes');

        $id     = filter_input(INPUT_GET, 'id', FILTER_VALIDATE_INT);
        $codigo = $_GET['codigo'] ?? null;
        if (!$id && !$codigo) {
            respond(['ok'=>false,'error'=>'Se requiere id o codigo'],422);
        }
        $where = $id ? ['id'=>$id] : ['codigo'=>$codigo];
        $r = $componente->eliminar($where);
        respond($r, $r['ok'] ? 200 : 400);
    }

    respond(['ok'=>false,'error'=>'Método no permitido'],405);

} catch (Throwable $e) {
    error_log("Error en componente.php: ".$e->getMessage());
    respond(['ok'=>false,'error'=>'Error interno del servidor'],500);
}
