<?php
/**
 * Script para generar el archivo .env
 * Úsalo una sola vez, luego bórralo
 */

$envPath = __DIR__ . '/.env';

// Si el archivo ya existe y se envió el formulario, no hacer nada
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $host = $_POST['DB_HOST'] ?? 'localhost';
    $port = $_POST['DB_PORT'] ?? '3306';
    $name = $_POST['DB_NAME'] ?? 'refrigeracioncyc';
    $user = $_POST['DB_USER'] ?? 'root';
    $pass = $_POST['DB_PASS'] ?? '';

    $content = <<<ENV
DB_HOST=$host
DB_PORT=$port
DB_NAME=$name
DB_USER=$user
DB_PASS=$pass
APP_ENV=production
APP_DEBUG=false
ENV;

    // Crear el archivo
    if (file_put_contents($envPath, $content) !== false) {
        chmod($envPath, 0600);
        echo '<div style="background: #d4edda; color: #155724; padding: 20px; border-radius: 5px; margin: 20px; font-family: Arial;">
            <h2>✓ Archivo .env creado exitosamente</h2>
            <p>El archivo <strong>.env</strong> se ha generado correctamente.</p>
            <p style="color: red; font-weight: bold;">IMPORTANTE: Borra este archivo (setup_env.php) del servidor por seguridad.</p>
            <a href="/" style="display: inline-block; margin-top: 10px; padding: 10px 20px; background: #28a745; color: white; text-decoration: none; border-radius: 3px;">Volver al inicio</a>
        </div>';
        exit;
    } else {
        $error = 'Error al crear el archivo. Verifica permisos de escritura.';
    }
}

if (file_exists($envPath)) {
    echo '<div style="background: #cce5ff; color: #004085; padding: 20px; border-radius: 5px; margin: 20px; font-family: Arial;">
        <h2>✓ El archivo .env ya existe</h2>
        <p>No necesitas ejecutar este script nuevamente.</p>
        <p style="color: red; font-weight: bold;">IMPORTANTE: Borra este archivo (setup_env.php) del servidor por seguridad.</p>
    </div>';
    exit;
}
?>

<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configurar .env</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0;
        }
        .container {
            background: white;
            padding: 40px;
            border-radius: 10px;
            box-shadow: 0 10px 40px rgba(0,0,0,0.2);
            width: 100%;
            max-width: 400px;
        }
        h1 {
            text-align: center;
            color: #333;
            margin-bottom: 30px;
        }
        .form-group {
            margin-bottom: 20px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            color: #555;
            font-weight: bold;
        }
        input {
            width: 100%;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            box-sizing: border-box;
            font-size: 14px;
        }
        input:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 5px rgba(102, 126, 234, 0.5);
        }
        button {
            width: 100%;
            padding: 12px;
            background: #667eea;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            transition: background 0.3s;
        }
        button:hover {
            background: #764ba2;
        }
        .info {
            background: #e7f3ff;
            border-left: 4px solid #2196F3;
            padding: 15px;
            margin-top: 20px;
            border-radius: 3px;
            color: #0066cc;
            font-size: 12px;
        }
        .error {
            background: #ffebee;
            color: #c62828;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>⚙️ Configuración de Base de Datos</h1>
        
        <?php if (isset($error)): ?>
            <div class="error"><?php echo htmlspecialchars($error); ?></div>
        <?php endif; ?>

        <form method="POST">
            <div class="form-group">
                <label for="DB_HOST">Host (localhost):</label>
                <input type="text" id="DB_HOST" name="DB_HOST" value="localhost" required>
            </div>

            <div class="form-group">
                <label for="DB_PORT">Puerto (3306):</label>
                <input type="text" id="DB_PORT" name="DB_PORT" value="3306" required>
            </div>

            <div class="form-group">
                <label for="DB_NAME">Nombre BD:</label>
                <input type="text" id="DB_NAME" name="DB_NAME" value="refrigeracioncyc" required>
            </div>

            <div class="form-group">
                <label for="DB_USER">Usuario MySQL:</label>
                <input type="text" id="DB_USER" name="DB_USER" value="Refri_user" required>
            </div>

            <div class="form-group">
                <label for="DB_PASS">Contraseña:</label>
                <input type="password" id="DB_PASS" name="DB_PASS" value="123456">
            </div>

            <button type="submit">Generar .env</button>
        </form>

        <div class="info">
            <strong>ℹ️ Instrucciones:</strong><br>
            1. Verifica los datos<br>
            2. Haz clic en "Generar .env"<br>
            3. Borra este archivo (setup_env.php) por seguridad
        </div>
    </div>
</body>
</html>
