<?php
// controllers/AuthController.php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/../models/Superusuario.php';

if (session_status() === PHP_SESSION_NONE) session_start();

$superusuarioModel = new Superusuario($pdo);
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($action) {

    /* 🔐 LOGIN --------------------------------------------------- */
    case 'login':
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(["error" => "Método no permitido"]);
            exit;
        }

        $data = json_decode(file_get_contents("php://input"), true);
        $email = trim($data['email'] ?? '');
        $password = trim($data['password'] ?? '');

        if (!$email || !$password) {
            http_response_code(400);
            echo json_encode(["error" => "Email y contraseña requeridos"]);
            exit;
        }

        $superusuario = $superusuarioModel->verificarLogin($email, $password);
        if ($superusuario) {
            // Regenerar ID de sesión por seguridad
            session_regenerate_id(true);
            $_SESSION['superusuario_id'] = $superusuario['id'];
            $_SESSION['superusuario_email'] = $superusuario['email'];

            echo json_encode([
                "success" => true,
                "message" => "Inicio de sesión exitoso",
                "data" => [
                    "id" => $superusuario['id'],
                    "nombre" => $superusuario['nombre'],
                    "email" => $superusuario['email']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["error" => "Credenciales inválidas"]);
        }
        break;

    /* 🔓 LOGOUT --------------------------------------------------- */
    case 'logout':
        session_unset();
        session_destroy();
        echo json_encode(["success" => true, "message" => "Sesión cerrada correctamente"]);
        break;

    /* 👤 PERFIL --------------------------------------------------- */
    case 'perfil':
        if (isset($_SESSION['superusuario_id'])) {
            echo json_encode([
                "id" => $_SESSION['superusuario_id'],
                "email" => $_SESSION['superusuario_email']
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["error" => "No hay sesión activa"]);
        }
        break;

    /* 🚫 ACCIÓN NO VÁLIDA ---------------------------------------- */
    default:
        http_response_code(400);
        echo json_encode(["error" => "Acción no válida"]);
        break;
}
