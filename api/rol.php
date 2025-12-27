<?php
header("Content-Type: application/json; charset=utf-8");

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../config/auth.php';
require_once __DIR__ . '/../models/rol.php';

requireAuth(); // Usuarios autenticados pueden ver roles

$pdo = Database::connect();
$model = new Rol($pdo);

$method = $_SERVER['REQUEST_METHOD'];

function out($d,$s=200){ http_response_code($s); echo json_encode($d); exit; }

try {

    // GET
    if ($method === "GET") {
        $codigo = $_GET['codigo'] ?? null;

        if ($codigo) {
            $r = $model->obtener($codigo);
            
            // Verificar que el rol pertenece a la empresa del usuario
            $empresaUsuario = getUserEmpresa();
            if ($r && $empresaUsuario !== null && ($r['codigo_empresa'] ?? null) !== $empresaUsuario) {
                out(['ok'=>false,'error'=>'Acceso denegado'], 403);
            }
            
            return $r ? out($r) : out(['ok'=>false,'error'=>"No existe"],404);
        }

        // Filtrar roles por empresa del usuario
        $empresaUsuario = getUserEmpresa();
        return out($model->listar($empresaUsuario));
    }

    // POST
    if ($method === "POST") {
        $d = json_decode(file_get_contents("php://input"), true);

        if (empty($d['codigo']) || empty($d['nombre'])) {
            out(['ok'=>false,'error'=>'Código y nombre son obligatorios'],422);
        }

        // Verificar si la tabla tiene el campo codigo_empresa
        try {
            $columns = $pdo->query("DESCRIBE rol")->fetchAll(PDO::FETCH_COLUMN);
            $tieneCodigoEmpresa = in_array('codigo_empresa', $columns);
            
            // Si tiene el campo y el usuario no es superusuario, asignar su empresa
            if ($tieneCodigoEmpresa) {
                $empresaUsuario = getUserEmpresa();
                if ($empresaUsuario !== null) {
                    $d['codigo_empresa'] = $empresaUsuario;
                }
                
                // Si aún no tiene empresa y el campo es obligatorio, error
                if (empty($d['codigo_empresa'])) {
                    out(['ok'=>false,'error'=>'Debe especificar la empresa para el rol'],422);
                }
            }
        } catch (Throwable $e) {
            error_log("Error verificando estructura de tabla rol: " . $e->getMessage());
        }

        // Log para debugging
        error_log("Intentando crear rol con datos: " . json_encode($d));

        $ok = $model->crear($d);
        
        if (!$ok) {
            out(['ok'=>false,'error'=>'No se pudo crear el rol. Verifique que el código no exista. Revise los logs del servidor para más detalles.'],500);
        }
        
        return out(['ok'=>true,'message'=>'Rol creado correctamente']);
    }

    // PUT
    if ($method === "PUT") {
        $codigo = $_GET['codigo'] ?? null;
        if (!$codigo) out(['ok'=>false,'error'=>'Debe enviar ?codigo'],422);

        $d = json_decode(file_get_contents("php://input"), true);

        $ok = $model->actualizar($codigo,$d);
        return $ok ? out(['ok'=>true,'message'=>'Actualizado'])
                   : out(['ok'=>false,'error'=>'No se pudo actualizar'],500);
    }

    // DELETE
    if ($method === "DELETE") {
        $codigo = $_GET['codigo'] ?? null;
        if (!$codigo) out(['ok'=>false,'error'=>'Debe enviar ?codigo'],422);

        $ok = $model->eliminar($codigo);
        return $ok ? out(['ok'=>true,'message'=>'Eliminado'])
                   : out(['ok'=>false,'error'=>'No se pudo eliminar'],500);
    }

    out(["error"=>"Método no permitido"],405);

} catch(Throwable $e) {
    out(['error'=>$e->getMessage()],500);
}
