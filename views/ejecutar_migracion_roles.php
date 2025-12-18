<?php
/**
 * Script para ejecutar la migración de roles con empresa y permisos
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

require_once __DIR__ . '/../config/db.php';

try {
    $pdo = Database::connect();
    
    echo "<h1>Migración: Roles con Empresa y Permisos</h1>";
    echo "<hr>";
    
    // 1. Verificar si ya existen las columnas
    echo "<h2>1. Verificando estructura actual...</h2>";
    $stmt = $pdo->query("DESCRIBE rol");
    $columns = $stmt->fetchAll(PDO::FETCH_COLUMN);
    
    $tieneEmpresa = in_array('codigo_empresa', $columns);
    $tienePermisos = in_array('permisos', $columns);
    
    echo "<ul>";
    echo "<li>Columna 'codigo_empresa': " . ($tieneEmpresa ? "✅ Ya existe" : "❌ No existe") . "</li>";
    echo "<li>Columna 'permisos': " . ($tienePermisos ? "✅ Ya existe" : "❌ No existe") . "</li>";
    echo "</ul>";
    
    // 2. Agregar columna codigo_empresa si no existe
    if (!$tieneEmpresa) {
        echo "<h2>2. Agregando columna 'codigo_empresa'...</h2>";
        $sql = "ALTER TABLE rol 
                ADD COLUMN codigo_empresa VARCHAR(50) NULL AFTER descripcion";
        $pdo->exec($sql);
        echo "<p style='color: green;'>✅ Columna 'codigo_empresa' agregada correctamente</p>";
        
        // Agregar índice
        echo "<p>Agregando índice...</p>";
        $pdo->exec("ALTER TABLE rol ADD INDEX idx_codigo_empresa (codigo_empresa)");
        echo "<p style='color: green;'>✅ Índice agregado</p>";
        
        // Agregar foreign key si la tabla empresa existe
        try {
            $pdo->exec("ALTER TABLE rol 
                        ADD CONSTRAINT fk_rol_empresa 
                        FOREIGN KEY (codigo_empresa) REFERENCES empresa(codigo) 
                        ON DELETE CASCADE ON UPDATE CASCADE");
            echo "<p style='color: green;'>✅ Foreign key agregada</p>";
        } catch (Exception $e) {
            echo "<p style='color: orange;'>⚠️ No se pudo agregar foreign key (puede ser que la tabla empresa no exista aún)</p>";
        }
    } else {
        echo "<h2>2. Columna 'codigo_empresa' ya existe</h2>";
    }
    
    // 3. Agregar columna permisos si no existe
    if (!$tienePermisos) {
        echo "<h2>3. Agregando columna 'permisos'...</h2>";
        $sql = "ALTER TABLE rol 
                ADD COLUMN permisos JSON NULL AFTER codigo_empresa";
        $pdo->exec($sql);
        echo "<p style='color: green;'>✅ Columna 'permisos' agregada correctamente</p>";
    } else {
        echo "<h2>3. Columna 'permisos' ya existe</h2>";
    }
    
    // 4. Mostrar estructura final
    echo "<h2>4. Estructura final de la tabla 'rol':</h2>";
    $stmt = $pdo->query("DESCRIBE rol");
    echo "<table border='1' cellpadding='5' cellspacing='0'>";
    echo "<tr><th>Campo</th><th>Tipo</th><th>Null</th><th>Key</th><th>Default</th><th>Extra</th></tr>";
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "<tr>";
        echo "<td><strong>{$row['Field']}</strong></td>";
        echo "<td>{$row['Type']}</td>";
        echo "<td>{$row['Null']}</td>";
        echo "<td>{$row['Key']}</td>";
        echo "<td>{$row['Default']}</td>";
        echo "<td>{$row['Extra']}</td>";
        echo "</tr>";
    }
    echo "</table>";
    
    // 5. Verificar si hay empresas para crear roles de ejemplo
    echo "<h2>5. Empresas disponibles:</h2>";
    $stmt = $pdo->query("SELECT codigo, nombre FROM empresa");
    $empresas = $stmt->fetchAll(PDO::FETCH_ASSOC);
    
    if (count($empresas) > 0) {
        echo "<table border='1' cellpadding='5' cellspacing='0'>";
        echo "<tr><th>Código</th><th>Nombre</th><th>Acción</th></tr>";
        foreach ($empresas as $emp) {
            $codigo = htmlspecialchars($emp['codigo']);
            $nombre = htmlspecialchars($emp['nombre']);
            echo "<tr>";
            echo "<td>{$codigo}</td>";
            echo "<td>{$nombre}</td>";
            echo "<td><a href='?crear_roles={$codigo}'>Crear roles de ejemplo</a></td>";
            echo "</tr>";
        }
        echo "</table>";
    } else {
        echo "<p style='color: orange;'>⚠️ No hay empresas creadas. Crea empresas primero para poder crear roles.</p>";
    }
    
    // 6. Crear roles de ejemplo si se solicitó
    if (isset($_GET['crear_roles'])) {
        $codigoEmpresa = $_GET['crear_roles'];
        echo "<h2>6. Creando roles de ejemplo para empresa: {$codigoEmpresa}</h2>";
        
        $roles = [
            [
                'codigo' => 'ROL_' . $codigoEmpresa . '_ADMIN',
                'nombre' => 'Administrador',
                'descripcion' => 'Acceso completo a todos los módulos',
                'permisos' => json_encode([
                    'ver_usuarios' => true, 'crear_usuarios' => true, 'editar_usuarios' => true, 'eliminar_usuarios' => true,
                    'ver_fincas' => true, 'crear_fincas' => true, 'editar_fincas' => true, 'eliminar_fincas' => true,
                    'ver_cuartos' => true, 'crear_cuartos' => true, 'editar_cuartos' => true, 'eliminar_cuartos' => true,
                    'ver_sensores' => true, 'crear_sensores' => true, 'editar_sensores' => true, 'eliminar_sensores' => true,
                    'ver_componentes' => true, 'crear_componentes' => true, 'editar_componentes' => true, 'eliminar_componentes' => true,
                    'ver_reportes' => true, 'exportar_reportes' => true,
                    'ver_mantenimientos' => true, 'crear_mantenimientos' => true, 'editar_mantenimientos' => true, 'eliminar_mantenimientos' => true
                ])
            ],
            [
                'codigo' => 'ROL_' . $codigoEmpresa . '_OPER',
                'nombre' => 'Operador',
                'descripcion' => 'Solo visualización y reportes',
                'permisos' => json_encode([
                    'ver_usuarios' => false, 'crear_usuarios' => false, 'editar_usuarios' => false, 'eliminar_usuarios' => false,
                    'ver_fincas' => true, 'crear_fincas' => false, 'editar_fincas' => false, 'eliminar_fincas' => false,
                    'ver_cuartos' => true, 'crear_cuartos' => false, 'editar_cuartos' => false, 'eliminar_cuartos' => false,
                    'ver_sensores' => true, 'crear_sensores' => false, 'editar_sensores' => false, 'eliminar_sensores' => false,
                    'ver_componentes' => true, 'crear_componentes' => false, 'editar_componentes' => false, 'eliminar_componentes' => false,
                    'ver_reportes' => true, 'exportar_reportes' => true,
                    'ver_mantenimientos' => true, 'crear_mantenimientos' => false, 'editar_mantenimientos' => false, 'eliminar_mantenimientos' => false
                ])
            ],
            [
                'codigo' => 'ROL_' . $codigoEmpresa . '_TEC',
                'nombre' => 'Técnico',
                'descripcion' => 'Gestión de sensores y mantenimientos',
                'permisos' => json_encode([
                    'ver_usuarios' => false, 'crear_usuarios' => false, 'editar_usuarios' => false, 'eliminar_usuarios' => false,
                    'ver_fincas' => true, 'crear_fincas' => false, 'editar_fincas' => false, 'eliminar_fincas' => false,
                    'ver_cuartos' => true, 'crear_cuartos' => false, 'editar_cuartos' => false, 'eliminar_cuartos' => false,
                    'ver_sensores' => true, 'crear_sensores' => true, 'editar_sensores' => true, 'eliminar_sensores' => false,
                    'ver_componentes' => true, 'crear_componentes' => true, 'editar_componentes' => true, 'eliminar_componentes' => false,
                    'ver_reportes' => true, 'exportar_reportes' => false,
                    'ver_mantenimientos' => true, 'crear_mantenimientos' => true, 'editar_mantenimientos' => true, 'eliminar_mantenimientos' => false
                ])
            ]
        ];
        
        $stmt = $pdo->prepare(
            "INSERT INTO rol (codigo, nombre, descripcion, codigo_empresa, permisos, activo, fecha_creacion) 
             VALUES (:codigo, :nombre, :descripcion, :codigo_empresa, :permisos, 1, NOW())"
        );
        
        echo "<ul>";
        foreach ($roles as $rol) {
            try {
                $stmt->execute([
                    ':codigo' => $rol['codigo'],
                    ':nombre' => $rol['nombre'],
                    ':descripcion' => $rol['descripcion'],
                    ':codigo_empresa' => $codigoEmpresa,
                    ':permisos' => $rol['permisos']
                ]);
                echo "<li style='color: green;'>✅ Rol '{$rol['nombre']}' creado: {$rol['codigo']}</li>";
            } catch (Exception $e) {
                if (strpos($e->getMessage(), 'Duplicate entry') !== false) {
                    echo "<li style='color: orange;'>⚠️ Rol '{$rol['nombre']}' ya existe: {$rol['codigo']}</li>";
                } else {
                    echo "<li style='color: red;'>❌ Error creando '{$rol['nombre']}': {$e->getMessage()}</li>";
                }
            }
        }
        echo "</ul>";
    }
    
    echo "<hr>";
    echo "<h2 style='color: green;'>✅ Migración completada exitosamente</h2>";
    echo "<p><a href='diagnostico_backend.php'>Ver diagnóstico completo del sistema</a></p>";
    
} catch (Exception $e) {
    echo "<h2 style='color: red;'>❌ Error en la migración</h2>";
    echo "<p style='color: red;'>{$e->getMessage()}</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}
?>

<style>
    body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
    h1, h2 { color: #333; }
    table { background: white; margin: 10px 0; }
    th { background: #007bff; color: white; }
    a { color: #007bff; text-decoration: none; padding: 5px 10px; background: #e7f3ff; border-radius: 3px; }
    a:hover { background: #007bff; color: white; }
</style>
