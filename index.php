<?php
/**
 * Punto de entrada principal
 * Redirige automáticamente a la página de login o al panel de administración
 * según el estado de autenticación del usuario
 */

// Iniciar sesión
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Verificar si hay usuario logueado
if (isset($_SESSION['user']) && !empty($_SESSION['user'])) {
    // Usuario logueado: redirigir al panel de admin
    header('Location: views/admin.html');
    exit;
} else {
    // No hay sesión: mostrar página pública o redirigir a login
    // Por ahora mostramos el index.html público
    if (file_exists(__DIR__ . '/index.html')) {
        readfile(__DIR__ . '/index.html');
    } else {
        header('Location: views/login.html');
    }
    exit;
}
