<?php
// controllers/authcontroller.php
// Clase pura (no se ejecuta nada al final). La instancia y el llamado se
// hacen desde api/login.php para evitar $pdo indefinido.

ini_set('display_errors', 1);
error_reporting(E_ALL);

require_once __DIR__ . '/../config/db.php';
if (file_exists(__DIR__ . '/../models/superusuario.php')) require_once __DIR__ . '/../models/superusuario.php';
if (file_exists(__DIR__ . '/../models/usuario.php'))      require_once __DIR__ . '/../models/usuario.php';

if (session_status() === PHP_SESSION_NONE) session_start();

class AuthController {
    private PDO $pdo;
    private $superModel = null;
    private $userModel  = null;

    // El controlador requiere un PDO válido (se lo pasamos desde api/login.php)
    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;

        // Instanciar modelos en forma tolerante a mayúsculas/minúsculas
        if (class_exists('superusuario')) $this->superModel = new superusuario($pdo);
        if (class_exists('Superusuario')) $this->superModel = $this->superModel ?: new Superusuario($pdo);

        if (class_exists('usuario'))      $this->userModel  = new usuario($pdo);
        if (class_exists('Usuario'))      $this->userModel  = $this->userModel ?: new Usuario($pdo);
    }

    // Helper de respuesta JSON
    private function respond($data, int $status=200){
        if (!headers_sent()) {
            header('Content-Type: application/json; charset=utf-8');
            http_response_code($status);
        }
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit;
    }

    // POST /api/login.php  (body JSON: email/usuario/codigo + password/clave)
    public function login() {
        $raw  = file_get_contents('php://input');
        $json = json_decode($raw, true);
        $isJ  = is_array($json);

        $u = $isJ ? ($json['email'] ?? $json['usuario'] ?? $json['codigo'] ?? null)
                  : ($_POST['email'] ?? $_POST['usuario'] ?? $_POST['codigo'] ?? null);
        $p = $isJ ? ($json['password'] ?? $json['clave'] ?? null)
                  : ($_POST['password'] ?? $_POST['clave'] ?? null);

        if (!$u || !$p) {
            $this->respond(['error'=>'Usuario y contraseña requeridos'], 400);
        }

        try {
            // 1) SUPERUSUARIO usando método del modelo si existe
            if ($this->superModel && method_exists($this->superModel,'verificarLogin')) {
                $su = $this->superModel->verificarLogin($u,$p);
                if ($su) return $this->ok($su,'superusuario');
            }
            // 1b) Fallback SQL por email o código
            $st = $this->pdo->prepare("SELECT * FROM superusuario WHERE email=:e OR codigo=:c LIMIT 1");
            $st->execute([':e'=>$u, ':c'=>$u]);
            $su = $st->fetch();
            if ($su && password_verify($p, $su['password'])) {
                return $this->ok($su,'superusuario');
            }

            // 2) USUARIO normal (si existe el modelo)
            if ($this->userModel && method_exists($this->userModel,'verificarLogin')) {
                $ux = $this->userModel->verificarLogin($u,$p);
                if ($ux) return $this->ok($ux,'usuario');
            }

            // 2b) Fallback SQL usuario (si la tabla existe)
            try {
                $this->pdo->query("SELECT 1 FROM `usuario` LIMIT 1");
                $hasUser = true;
            } catch (Throwable $e) {
                $hasUser = false;
            }

            if ($hasUser) {
                // OJO: tu tabla NO tiene columna 'usuario', así que buscamos por email o codigo.
                $st = $this->pdo->prepare(
                    "SELECT u.*, f.codigo_empresa 
                     FROM usuario u
                     LEFT JOIN finca f ON u.codigo_finca = f.codigo
                     WHERE u.email = :v OR u.codigo = :v
                     LIMIT 1"
                );
                $st->execute([':v' => $u]);
                $ux = $st->fetch();

                if ($ux && password_verify($p, $ux['password'])) {
                    return $this->ok($ux,'usuario');
                }
            }

            // Credenciales inválidas
            $this->respond(['error'=>'Credenciales inválidas'], 401);

        } catch (Throwable $e) {
            error_log('Auth login: '.$e->getMessage());
            $this->respond(['error'=>'Error interno del servidor'], 500);
        }
    }

    // Guarda la sesión y responde OK
    private function ok(array $row, string $rol){
        unset($row['password']);
        session_regenerate_id(true);

        // Guardamos también codigo_rol y codigo_finca para control de acceso
        $_SESSION['user'] = [
            'id'             => $row['id'] ?? null,
            'codigo'         => $row['codigo'] ?? ($row['usuario'] ?? null),
            'nombre'         => $row['nombre'] ?? ($row['usuario'] ?? null),
            'email'          => $row['email'] ?? null,
            // 'rol' = tipo de usuario a nivel del sistema: superusuario | usuario
            'rol'            => $rol,
            // rol de NEGOCIO (tabla rol), solo aplica a usuario normal
            'codigo_rol'     => $row['codigo_rol']   ?? null,
            'codigo_finca'   => $row['codigo_finca'] ?? null,
            'codigo_empresa' => $row['codigo_empresa'] ?? null,
            // por compatibilidad con config/auth.php (si en algún lado usas 'tipo')
            'tipo'           => $rol
        ];

        $this->respond([
            'ok'   => true,
            'rol'  => $rol,
            'user' => $_SESSION['user']
        ]);
    }

    public function logout(){
        session_unset();
        session_destroy();
        $this->respond(['ok'=>true,'message'=>'Sesión cerrada']);
    }

    public function profile(){
        if (empty($_SESSION['user'])) {
            $this->respond(['error'=>'No autenticado'],401);
        }
        $this->respond(['user'=>$_SESSION['user']]);
    }

    public function handleAction(string $a){
        switch($a){
            case 'login':   return $this->login();
            case 'logout':  return $this->logout();
            case 'perfil':
            case 'profile': return $this->profile();
            default:        return $this->respond(['error'=>'Acción no válida'],400);
        }
    }
}
// FIN de la clase. (No ejecutar nada aquí abajo)
