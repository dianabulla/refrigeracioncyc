<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Verificar Estructura de Rol</title>
</head>
<body>
    <h1>Estructura de Tabla ROL</h1>
    <?php
    require_once __DIR__ . '/../config/db.php';
    $pdo = Database::connect();
    
    echo '<h2>Columnas de la tabla rol:</h2>';
    $stmt = $pdo->query("DESCRIBE rol");
    echo '<table border="1"><tr><th>Field</th><th>Type</th><th>Null</th><th>Key</th><th>Default</th></tr>';
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo '<tr>';
        echo '<td>' . $row['Field'] . '</td>';
        echo '<td>' . $row['Type'] . '</td>';
        echo '<td>' . $row['Null'] . '</td>';
        echo '<td>' . $row['Key'] . '</td>';
        echo '<td>' . $row['Default'] . '</td>';
        echo '</tr>';
    }
    echo '</table>';
    
    echo '<h2>Datos actuales:</h2>';
    $stmt = $pdo->query("SELECT * FROM rol LIMIT 5");
    $roles = $stmt->fetchAll(PDO::FETCH_ASSOC);
    echo '<pre>' . print_r($roles, true) . '</pre>';
    ?>
</body>
</html>
