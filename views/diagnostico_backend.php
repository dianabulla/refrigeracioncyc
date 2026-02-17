<?php
/**
 * Script de diagnóstico del sistema
 * Verifica conexión a BD y datos básicos
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Diagnóstico del Sistema - Backend</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .card { background: white; padding: 20px; margin: 10px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: #28a745; }
        .error { color: #dc3545; }
        .warning { color: #ffc107; }
        h2 { border-bottom: 2px solid #007bff; padding-bottom: 10px; }
        pre { background: #f8f9fa; padding: 10px; border-radius: 4px; overflow-x: auto; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #007bff; color: white; }
    </style>
</head>
<body>
    <h1>🔍 Diagnóstico del Sistema</h1>

    <?php
    // 1. Verificar archivos de configuración
    echo '<div class="card">';
    echo '<h2>1. Archivos de Configuración</h2>';
    
    $archivos = [
        'config/db.php' => __DIR__ . '/../config/db.php',
        'config/auth.php' => __DIR__ . '/../config/auth.php',
        'config/env.php' => __DIR__ . '/../config/env.php'
    ];
    
    echo '<table>';
    echo '<tr><th>Archivo</th><th>Estado</th></tr>';
    foreach ($archivos as $nombre => $ruta) {
        $existe = file_exists($ruta);
        $clase = $existe ? 'success' : 'error';
        $estado = $existe ? '✅ Existe' : '❌ No existe';
        echo "<tr><td>$nombre</td><td class='$clase'>$estado</td></tr>";
    }
    echo '</table>';
    echo '</div>';

    // 2. Verificar conexión a base de datos
    echo '<div class="card">';
    echo '<h2>2. Conexión a Base de Datos</h2>';
    
    try {
        require_once __DIR__ . '/../config/db.php';
        $pdo = Database::connect();
        echo '<p class="success">✅ Conexión exitosa a la base de datos</p>';
        
        // 3. Verificar tablas
        echo '<h3>3. Tablas en la Base de Datos</h3>';
        $stmt = $pdo->query("SHOW TABLES");
        $tablas = $stmt->fetchAll(PDO::FETCH_COLUMN);
        
        if (count($tablas) > 0) {
            echo '<table>';
            echo '<tr><th>Tabla</th><th>Registros</th></tr>';
            foreach ($tablas as $tabla) {
                try {
                    $count = $pdo->query("SELECT COUNT(*) FROM `$tabla`")->fetchColumn();
                    echo "<tr><td>$tabla</td><td>$count</td></tr>";
                } catch (Exception $e) {
                    echo "<tr><td>$tabla</td><td class='error'>Error: {$e->getMessage()}</td></tr>";
                }
            }
            echo '</table>';
        } else {
            echo '<p class="error">❌ No se encontraron tablas en la base de datos</p>';
        }
        
        // 4. Verificar usuarios superusuario
        echo '<h3>4. Usuarios Superusuario</h3>';
        try {
            $stmt = $pdo->query("SELECT codigo, email FROM superusuario LIMIT 5");
            $superusuarios = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (count($superusuarios) > 0) {
                echo '<table>';
                echo '<tr><th>Código</th><th>Email</th></tr>';
                foreach ($superusuarios as $su) {
                    echo "<tr><td>{$su['codigo']}</td><td>{$su['email']}</td></tr>";
                }
                echo '</table>';
                echo '<p class="success">✅ Encontrados ' . count($superusuarios) . ' superusuarios</p>';
            } else {
                echo '<p class="warning">⚠️ No hay superusuarios en la base de datos</p>';
            }
        } catch (Exception $e) {
            echo '<p class="error">❌ Error al consultar superusuarios: ' . $e->getMessage() . '</p>';
        }
        
        // 5. Verificar empresas
        echo '<h3>5. Empresas</h3>';
        try {
            $stmt = $pdo->query("SELECT codigo, nombre FROM empresa LIMIT 5");
            $empresas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (count($empresas) > 0) {
                echo '<table>';
                echo '<tr><th>Código</th><th>Nombre</th></tr>';
                foreach ($empresas as $emp) {
                    echo "<tr><td>{$emp['codigo']}</td><td>{$emp['nombre']}</td></tr>";
                }
                echo '</table>';
                echo '<p class="success">✅ Encontradas ' . count($empresas) . ' empresas</p>';
            } else {
                echo '<p class="warning">⚠️ No hay empresas en la base de datos</p>';
            }
        } catch (Exception $e) {
            echo '<p class="error">❌ Error al consultar empresas: ' . $e->getMessage() . '</p>';
        }
        
        // 6. Verificar fincas
        echo '<h3>6. Fincas</h3>';
        try {
            $stmt = $pdo->query("SELECT codigo, nombre FROM finca LIMIT 5");
            $fincas = $stmt->fetchAll(PDO::FETCH_ASSOC);
            
            if (count($fincas) > 0) {
                echo '<table>';
                echo '<tr><th>Código</th><th>Nombre</th></tr>';
                foreach ($fincas as $finca) {
                    echo "<tr><td>{$finca['codigo']}</td><td>{$finca['nombre']}</td></tr>";
                }
                echo '</table>';
                echo '<p class="success">✅ Encontradas ' . count($fincas) . ' fincas</p>';
            } else {
                echo '<p class="warning">⚠️ No hay fincas en la base de datos</p>';
            }
        } catch (Exception $e) {
            echo '<p class="error">❌ Error al consultar fincas: ' . $e->getMessage() . '</p>';
        }
        
    } catch (Exception $e) {
        echo '<p class="error">❌ Error de conexión: ' . $e->getMessage() . '</p>';
        echo '<pre>' . $e->getTraceAsString() . '</pre>';
    }
    
    echo '</div>';

    // 7. Verificar estado de sesión
    echo '<div class="card">';
    echo '<h2>7. Estado de Sesión</h2>';
    
    if (session_status() === PHP_SESSION_NONE) {
        session_start();
    }
    
    echo '<p>Session ID: ' . session_id() . '</p>';
    echo '<p>Session Status: ' . (session_status() === PHP_SESSION_ACTIVE ? '✅ Activa' : '❌ Inactiva') . '</p>';
    
    if (isset($_SESSION['user'])) {
        echo '<p class="success">✅ Usuario autenticado:</p>';
        echo '<pre>' . print_r($_SESSION['user'], true) . '</pre>';
    } else {
        echo '<p class="warning">⚠️ No hay usuario autenticado</p>';
        echo '<p><a href="login.html">Ir a Login</a></p>';
    }
    
    echo '</div>';

    // 8. Información del servidor
    echo '<div class="card">';
    echo '<h2>8. Información del Servidor</h2>';
    echo '<table>';
    echo '<tr><td>PHP Version</td><td>' . phpversion() . '</td></tr>';
    echo '<tr><td>Server Software</td><td>' . ($_SERVER['SERVER_SOFTWARE'] ?? 'N/A') . '</td></tr>';
    echo '<tr><td>Document Root</td><td>' . $_SERVER['DOCUMENT_ROOT'] . '</td></tr>';
    echo '<tr><td>Script Path</td><td>' . __DIR__ . '</td></tr>';
    echo '</table>';
    echo '</div>';
    ?>

</body>
</html>
