<?php
// models/componente.php

class Componente
{
    /** @var PDO */
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /** ➜ Obtener por ID */
    public function obtenerPorId(int $id): ?array
    {
        $st = $this->pdo->prepare("SELECT * FROM componente WHERE id = :id LIMIT 1");
        $st->execute([':id' => $id]);
        $r = $st->fetch(PDO::FETCH_ASSOC);
        return $r ?: null;
    }

    /** ➜ Obtener por código */
    public function obtenerPorCodigo(string $codigo): ?array
    {
        $st = $this->pdo->prepare("SELECT * FROM componente WHERE codigo = :codigo LIMIT 1");
        $st->execute([':codigo' => trim($codigo)]);
        $r = $st->fetch(PDO::FETCH_ASSOC);
        return $r ?: null;
    }

    /** ➜ Listar (opcional filtro por código de cuarto) */
    public function listar(?string $codigoCuarto = null): array
    {
        if ($codigoCuarto) {
            $sql = "SELECT * FROM componente WHERE codigo_cuarto = :cc ORDER BY fecha_creacion DESC, id DESC";
            $st  = $this->pdo->prepare($sql);
            $st->execute([':cc' => $codigoCuarto]);
        } else {
            $st = $this->pdo->query("SELECT * FROM componente ORDER BY fecha_creacion DESC, id DESC");
        }
        return $st->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * ➜ Crear componente
     * $d: [codigo, nombre, descripcion?, tipo?, codigo_cuarto, activo?]
     */
    public function crear(array $d): array
    {
        $codigo       = trim($d['codigo']        ?? '');
        $nombre       = trim($d['nombre']        ?? '');
        $codigoCuarto = $d['codigo_cuarto']      ?? null;

        if ($codigo === '' || $nombre === '' || !$codigoCuarto) {
            return ['ok' => false, 'error' => 'Campos requeridos: codigo, nombre, codigo_cuarto'];
        }

        // Verificar duplicado
        if ($this->obtenerPorCodigo($codigo)) {
            return ['ok' => false, 'error' => 'El código ya existe'];
        }

        $sql = "INSERT INTO componente
                    (codigo, nombre, descripcion, tipo, codigo_cuarto, activo, fecha_creacion)
                VALUES
                    (:codigo, :nombre, :descripcion, :tipo, :codigo_cuarto, :activo, NOW())";

        $st = $this->pdo->prepare($sql);

        try {
            $st->execute([
                ':codigo'        => $codigo,
                ':nombre'        => $nombre,
                ':descripcion'   => $d['descripcion']   ?? null,
                ':tipo'          => $d['tipo']          ?? null,
                ':codigo_cuarto' => $codigoCuarto,
                ':activo'        => isset($d['activo']) ? (int)$d['activo'] : 1
            ]);
            return ['ok' => true, 'data' => $this->obtenerPorCodigo($codigo)];
        } catch (PDOException $e) {
            error_log("Componente crear: " . $e->getMessage());
            $msg = 'Error al crear componente';
            if (stripos($e->getMessage(), 'foreign key') !== false) {
                $msg = 'El código de cuarto no existe';
            } elseif (stripos($e->getMessage(), 'Duplicate') !== false || stripos($e->getMessage(), '1062') !== false) {
                $msg = 'El código ya existe';
            }
            return ['ok' => false, 'error' => $msg];
        }
    }

    /**
     * ➜ Actualizar componente por ID o por código
     * $where = ['id' => int]  ó  ['codigo' => string]
     */
    public function actualizar(array $where, array $d): array
    {
        $camposPermitidos = ['nombre','descripcion','tipo','codigo_cuarto','activo'];
        $set   = [];
        $params = [];

        foreach ($camposPermitidos as $campo) {
            if (array_key_exists($campo, $d)) {
                $set[] = "$campo = :$campo";
                $params[":$campo"] = $d[$campo];
            }
        }

        if (!$set) {
            return ['ok' => false, 'error' => 'Nada para actualizar'];
        }

        if (isset($where['id'])) {
            $sql = "UPDATE componente SET " . implode(', ', $set) . ", updated_at = NOW() WHERE id = :id";
            $params[':id'] = (int)$where['id'];
        } elseif (isset($where['codigo'])) {
            $sql = "UPDATE componente SET " . implode(', ', $set) . ", updated_at = NOW() WHERE codigo = :codigo";
            $params[':codigo'] = trim($where['codigo']);
        } else {
            return ['ok' => false, 'error' => 'Falta id o codigo para actualizar'];
        }

        try {
            $st = $this->pdo->prepare($sql);
            $st->execute($params);
            // devolver registro actualizado si se puede
            $row = isset($where['id'])
                ? $this->obtenerPorId((int)$where['id'])
                : $this->obtenerPorCodigo((string)$where['codigo']);
            return ['ok' => true, 'data' => $row];
        } catch (PDOException $e) {
            error_log("Componente actualizar: " . $e->getMessage());
            $msg = 'Error al actualizar componente';
            if (stripos($e->getMessage(), 'foreign key') !== false) {
                $msg = 'El código de cuarto no existe';
            }
            return ['ok' => false, 'error' => $msg];
        }
    }

    /** ➜ Eliminar por ID o código */
    public function eliminar(array $where): array
    {
        if (isset($where['id'])) {
            $st = $this->pdo->prepare("DELETE FROM componente WHERE id = :id");
            $params = [':id' => (int)$where['id']];
        } elseif (isset($where['codigo'])) {
            $st = $this->pdo->prepare("DELETE FROM componente WHERE codigo = :codigo");
            $params = [':codigo' => trim($where['codigo'])];
        } else {
            return ['ok' => false, 'error' => 'Falta id o codigo para eliminar'];
        }

        try {
            $st->execute($params);
            return ['ok' => true];
        } catch (PDOException $e) {
            error_log("Componente eliminar: " . $e->getMessage());
            return ['ok' => false, 'error' => 'Error al eliminar componente'];
        }
    }
}
