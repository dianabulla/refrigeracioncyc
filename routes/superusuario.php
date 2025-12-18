<?php
// routes/superusuario.php
session_start();

// Verificar autenticación y rol
if (!isset($_SESSION['user'])) {
    header('Location: ../login.html');
    exit();
}

// Solo permitir acceso a superusuario
if ($_SESSION['user']['rol'] !== 'superusuario') {
    header('HTTP/1.1 403 Forbidden');
    echo "Acceso denegado: no tienes permisos para acceder a esta sección.";
    exit();
}

// Servir la vista HTML
$vista = __DIR__ . '/../views/admin.html';

if (file_exists($vista)) {
    readfile($vista);
} else {
    http_response_code(404);
    echo "Vista no encontrada.";
}
?>
