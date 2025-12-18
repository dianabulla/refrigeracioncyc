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
            // Verificar código duplicado
            $existe = $this->pdo->prepare("SELECT codigo FROM rol WHERE codigo = ?");
            $existe->execute([$d['codigo']]);
            if ($existe->fetch()) {
                return false; // Código ya existe
            }

            $st = $this->pdo->prepare(
                "INSERT INTO rol (codigo, nombre, descripcion, codigo_empresa, permisos, activo, fecha_creacion)
                 VALUES (:codigo, :nombre, :descripcion, :codigo_empresa, :permisos, :activo, NOW())"
            );
            
            // Convertir permisos a JSON si es array
            $permisos = $d['permisos'] ?? null;
            if (is_array($permisos)) {
                $permisos = json_encode($permisos);
            }
            
            return $st->execute([
                ':codigo' => $d['codigo'],
                ':nombre' => $d['nombre'],
                ':descripcion' => $d['descripcion'] ?? null,
                ':codigo_empresa' => $d['codigo_empresa'] ?? null,
                ':permisos' => $permisos,
                ':activo' => $d['activo'] ?? 1
            ]);
        } catch (Throwable $e) {
            error_log("Rol crear: " . $e->getMessage());
            return false;
        }
    }

    public function actualizar(string $codigo, array $d): bool {
        try {
            // Convertir permisos a JSON si es array
            $permisos = isset($d['permisos']) ? 
                (is_array($d['permisos']) ? json_encode($d['permisos']) : $d['permisos']) : null;
            
            $st = $this->pdo->prepare(
                "UPDATE rol SET 
                    nombre = :nombre,
                    descripcion = :descripcion,
                    codigo_empresa = :codigo_empresa,
                    permisos = :permisos,
                    activo = :activo,
                    updated_at = NOW()
                 WHERE codigo = :codigo"
            );
            return $st->execute([
                ':nombre' => $d['nombre'],
                ':descripcion' => $d['descripcion'] ?? null,
                ':codigo_empresa' => $d['codigo_empresa'] ?? null,
                ':permisos' => $permisos,
                ':activo' => $d['activo'] ?? 1,
                ':codigo' => $codigo
            ]);
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
