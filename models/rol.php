<?php
class Rol {
    private PDO $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    public function listar(?string $codigoEmpresa = null): array {
        try {
            if ($codigoEmpresa) {
                $st = $this->pdo->prepare("SELECT * FROM rol WHERE codigo_empresa = :ce ORDER BY nombre ASC");
                $st->execute([':ce' => $codigoEmpresa]);
                return $st->fetchAll();
            }
            $st = $this->pdo->query("SELECT * FROM rol ORDER BY nombre ASC");
            return $st->fetchAll();
        } catch (Throwable $e) {
            error_log("Rol listar: " . $e->getMessage());
            return [];
        }
    }

    public function obtener(string $codigo): ?array {
        try {
            $st = $this->pdo->prepare("SELECT * FROM rol WHERE codigo = ?");
            $st->execute([$codigo]);
            $r = $st->fetch();
            return $r ?: null;
        } catch (Throwable $e) {
            error_log("Rol obtener: " . $e->getMessage());
            return null;
        }
    }

    public function crear(array $d): bool {
        try {
            // Validar campos requeridos
            if (empty($d['codigo']) || empty($d['nombre'])) {
                error_log("Rol crear: Faltan campos requeridos (codigo o nombre)");
                return false;
            }

            // Verificar código duplicado
            $existe = $this->pdo->prepare("SELECT codigo FROM rol WHERE codigo = ?");
            $existe->execute([$d['codigo']]);
            if ($existe->fetch()) {
                error_log("Rol crear: El código {$d['codigo']} ya existe");
                return false;
            }

            // Verificar qué columnas existen en la tabla
            $columns = $this->pdo->query("DESCRIBE rol")->fetchAll(PDO::FETCH_COLUMN);
            
            $campos = ['codigo', 'nombre', 'descripcion', 'activo'];
            $valores = [':codigo', ':nombre', ':descripcion', ':activo'];
            $params = [
                ':codigo' => trim($d['codigo']),
                ':nombre' => trim($d['nombre']),
                ':descripcion' => $d['descripcion'] ?? null,
                ':activo' => $d['activo'] ?? 1
            ];
            
            // Agregar campos opcionales solo si existen en la tabla
            if (in_array('codigo_empresa', $columns)) {
                $campos[] = 'codigo_empresa';
                $valores[] = ':codigo_empresa';
                $params[':codigo_empresa'] = $d['codigo_empresa'] ?? null;
            }
            
            if (in_array('permisos', $columns)) {
                $campos[] = 'permisos';
                $valores[] = ':permisos';
                $permisos = $d['permisos'] ?? null;
                if (is_array($permisos)) {
                    $permisos = json_encode($permisos);
                }
                $params[':permisos'] = $permisos;
            }
            
            $camposStr = implode(', ', $campos);
            $valoresStr = implode(', ', $valores);
            
            $sql = "INSERT INTO rol ($camposStr, fecha_creacion) VALUES ($valoresStr, NOW())";
            
            $st = $this->pdo->prepare($sql);
            $result = $st->execute($params);
            
            if (!$result) {
                $errorInfo = $st->errorInfo();
                error_log("Rol crear - Error SQL: " . json_encode($errorInfo));
            }
            
            return $result;
        } catch (Throwable $e) {
            error_log("Rol crear - Exception: " . $e->getMessage());
            error_log("Datos recibidos: " . json_encode($d));
            return false;
        }
    }

    public function actualizar(string $codigo, array $d): bool {
        try {
            // Verificar qué columnas existen en la tabla
            $columns = $this->pdo->query("DESCRIBE rol")->fetchAll(PDO::FETCH_COLUMN);
            
            $campos = [];
            $params = [':codigo' => $codigo];
            
            // Campos básicos
            if (isset($d['nombre'])) {
                $campos[] = "nombre = :nombre";
                $params[':nombre'] = $d['nombre'];
            }
            if (isset($d['descripcion'])) {
                $campos[] = "descripcion = :descripcion";
                $params[':descripcion'] = $d['descripcion'];
            }
            if (isset($d['activo'])) {
                $campos[] = "activo = :activo";
                $params[':activo'] = $d['activo'];
            }
            
            // Campos opcionales solo si existen en la tabla
            if (in_array('codigo_empresa', $columns) && isset($d['codigo_empresa'])) {
                $campos[] = "codigo_empresa = :codigo_empresa";
                $params[':codigo_empresa'] = $d['codigo_empresa'];
            }
            
            if (in_array('permisos', $columns) && isset($d['permisos'])) {
                $permisos = is_array($d['permisos']) ? json_encode($d['permisos']) : $d['permisos'];
                $campos[] = "permisos = :permisos";
                $params[':permisos'] = $permisos;
            }
            
            if (empty($campos)) {
                return false;
            }
            
            // Agregar updated_at si existe
            if (in_array('updated_at', $columns)) {
                $campos[] = "updated_at = NOW()";
            }
            
            $camposStr = implode(', ', $campos);
            $sql = "UPDATE rol SET $camposStr WHERE codigo = :codigo";
            
            $st = $this->pdo->prepare($sql);
            return $st->execute($params);
        } catch (Throwable $e) {
            error_log("Rol actualizar: " . $e->getMessage());
            return false;
        }
    }

    public function eliminar(string $codigo): bool {
        try {
            $st = $this->pdo->prepare("DELETE FROM rol WHERE codigo = ?");
            return $st->execute([$codigo]);
        } catch (Throwable $e) {
            error_log("Rol eliminar: " . $e->getMessage());
            return false;
        }
    }
}
