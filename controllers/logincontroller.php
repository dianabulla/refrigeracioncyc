<?php
session_start();
require_once __DIR__ . "/../config/db.php";

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = trim($_POST['email'] ?? '');
    $password = trim($_POST['password'] ?? '');

    if ($email === '' || $password === '') {
        $_SESSION['error'] = "Debe ingresar usuario y contraseña.";
        header("Location: ../views/login.php");
        exit;
    }

    try {
        $usuario = null;
        $tipo = null;

        // 1. Buscar en superusuario
        $stmt = $pdo->prepare("SELECT * FROM superusuario WHERE email = :email LIMIT 1");
        $stmt->execute([':email' => $email]);
        $super = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($super && password_verify($password, $super['password'])) {
            if ((int)$super['activo'] !== 1) {
                $_SESSION['error'] = "El superusuario está inactivo.";
                header("Location: ../views/login.php");
                exit;
            }
            $usuario = $super;
            $tipo = 'superusuario';
        }

        // 2. Si no es superusuario, buscar en usuario
        if (!$usuario) {
            $stmt = $pdo->prepare("SELECT * FROM usuario WHERE email = :email LIMIT 1");
            $stmt->execute([':email' => $email]);
            $user = $stmt->fetch(PDO::FETCH_ASSOC);

            if ($user && password_verify($password, $user['password'])) {
                if ((int)$user['activo'] !== 1) {
                    $_SESSION['error'] = "El usuario está inactivo.";
                    header("Location: ../views/login.php");
                    exit;
                }
                $usuario = $user;
                $tipo = 'usuario';
            }
        }

        // 3. Si encontramos un usuario válido
        if ($usuario) {
            $_SESSION['user'] = [
                'id'    => $usuario['id'],
                'nombre'=> $usuario['nombre'],
                'email' => $usuario['email'],
                'rol'   => $tipo === 'superusuario' 
                            ? 'superusuario' 
                            : $usuario['codigo_rol'], // en usuario viene de la FK rol
            ];

            // Redirección según tipo
            if ($tipo === 'superusuario') {
                header("Location: ../views/superadmin.php");
            } else {
                header("Location: ../views/admin.php");
            }
            exit;
        }

        // 4. Si no coincide en ninguna tabla
        $_SESSION['error'] = "Credenciales incorrectas.";
        header("Location: ../views/login.php");
        exit;

    } catch (Exception $e) {
        error_log("Error en login: " . $e->getMessage());
        $_SESSION['error'] = "Error interno, contacte al administrador.";
        header("Location: ../views/login.php");
        exit;
    }
} else {
    header("Location: ../views/login.php");
    exit;
}
