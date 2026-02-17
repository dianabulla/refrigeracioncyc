<?php

class Refrigerante
{
    /** @var PDO */
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    public function obtenerPorId(int $id, ?string $codigoEmpresa = null): ?array
    {
        if ($codigoEmpresa) {
            $st = $this->pdo->prepare(
                "SELECT * FROM refrigerante WHERE id = :id AND codigo_empresa = :empresa LIMIT 1"
            );
            $st->execute([':id' => $id, ':empresa' => $codigoEmpresa]);
        } else {
            $st = $this->pdo->prepare("SELECT * FROM refrigerante WHERE id = :id LIMIT 1");
            $st->execute([':id' => $id]);
        }
        $r = $st->fetch(PDO::FETCH_ASSOC);
        return $r ?: null;
    }

    public function obtenerPorCodigo(string $codigo, ?string $codigoEmpresa = null): ?array
    {
        $codigo = trim($codigo);
        if ($codigoEmpresa) {
            $st = $this->pdo->prepare(
                "SELECT * FROM refrigerante WHERE codigo = :codigo AND codigo_empresa = :empresa LIMIT 1"
            );
            $st->execute([':codigo' => $codigo, ':empresa' => $codigoEmpresa]);
        } else {
            $st = $this->pdo->prepare("SELECT * FROM refrigerante WHERE codigo = :codigo LIMIT 1");
            $st->execute([':codigo' => $codigo]);
        }
        $r = $st->fetch(PDO::FETCH_ASSOC);
        return $r ?: null;
    }

    public function listar(?string $codigoEmpresa = null): array
    {
        if ($codigoEmpresa) {
            $st = $this->pdo->prepare(
                "SELECT * FROM refrigerante WHERE codigo_empresa = :empresa ORDER BY fecha_creacion DESC, id DESC"
            );
            $st->execute([':empresa' => $codigoEmpresa]);
        } else {
            $st = $this->pdo->query(
                "SELECT * FROM refrigerante ORDER BY fecha_creacion DESC, id DESC"
            );
        }
        return $st->fetchAll(PDO::FETCH_ASSOC);
    }

    public function crear(array $data, ?string $codigoEmpresa = null): array
    {
        $codigo = trim($data['codigo'] ?? '');
        $refrigeranteTemp = trim($data['refrigerante_temperatura'] ?? '');
        $referencia = trim($data['referencia'] ?? '');

        if ($codigo === '' || $refrigeranteTemp === '') {
            return ['ok' => false, 'error' => 'Campos requeridos: codigo, refrigerante_temperatura'];
        }

        if ($this->obtenerPorCodigo($codigo, $codigoEmpresa)) {
            return ['ok' => false, 'error' => 'El código ya existe'];
        }

        $sql = "INSERT INTO refrigerante
                    (codigo, refrigerante_temperatura, referencia, codigo_empresa, fecha_creacion)
                VALUES
                    (:codigo, :refrigerante_temperatura, :referencia, :codigo_empresa, NOW())";

        $st = $this->pdo->prepare($sql);

        try {
            $st->execute([
                ':codigo' => $codigo,
                ':refrigerante_temperatura' => $refrigeranteTemp,
                ':referencia' => $referencia !== '' ? $referencia : null,
                ':codigo_empresa' => $codigoEmpresa ?? ($data['codigo_empresa'] ?? null)
            ]);
            return ['ok' => true, 'data' => $this->obtenerPorCodigo($codigo, $codigoEmpresa)];
        } catch (PDOException $e) {
            error_log("Refrigerante crear: " . $e->getMessage());
            $msg = 'Error al crear refrigerante';
            if (stripos($e->getMessage(), 'Duplicate') !== false || stripos($e->getMessage(), '1062') !== false) {
                $msg = 'El código ya existe';
            }
            return ['ok' => false, 'error' => $msg];
        }
    }

    public function actualizar(array $where, array $data, ?string $codigoEmpresa = null): array
    {
        $camposPermitidos = ['refrigerante_temperatura', 'referencia'];
        $set = [];
        $params = [];

        foreach ($camposPermitidos as $campo) {
            if (array_key_exists($campo, $data)) {
                $set[] = "$campo = :$campo";
                $params[":$campo"] = $data[$campo];
            }
        }

        if (!$set) {
            return ['ok' => false, 'error' => 'Nada para actualizar'];
        }

        if (isset($where['id'])) {
            $sql = "UPDATE refrigerante SET " . implode(', ', $set) . ", updated_at = NOW() WHERE id = :id";
            $params[':id'] = (int)$where['id'];
        } elseif (isset($where['codigo'])) {
            $sql = "UPDATE refrigerante SET " . implode(', ', $set) . ", updated_at = NOW() WHERE codigo = :codigo";
            $params[':codigo'] = trim($where['codigo']);
        } else {
            return ['ok' => false, 'error' => 'Falta id o codigo para actualizar'];
        }

        if ($codigoEmpresa) {
            $sql .= " AND codigo_empresa = :empresa";
            $params[':empresa'] = $codigoEmpresa;
        }

        try {
            $st = $this->pdo->prepare($sql);
            $st->execute($params);
            $row = isset($where['id'])
                ? $this->obtenerPorId((int)$where['id'], $codigoEmpresa)
                : $this->obtenerPorCodigo((string)$where['codigo'], $codigoEmpresa);
            return ['ok' => true, 'data' => $row];
        } catch (PDOException $e) {
            error_log("Refrigerante actualizar: " . $e->getMessage());
            return ['ok' => false, 'error' => 'Error al actualizar refrigerante'];
        }
    }

    public function eliminar(array $where, ?string $codigoEmpresa = null): array
    {
        if (isset($where['id'])) {
            $sql = "DELETE FROM refrigerante WHERE id = :id";
            $params = [':id' => (int)$where['id']];
        } elseif (isset($where['codigo'])) {
            $sql = "DELETE FROM refrigerante WHERE codigo = :codigo";
            $params = [':codigo' => trim($where['codigo'])];
        } else {
            return ['ok' => false, 'error' => 'Falta id o codigo para eliminar'];
        }

        if ($codigoEmpresa) {
            $sql .= " AND codigo_empresa = :empresa";
            $params[':empresa'] = $codigoEmpresa;
        }

        try {
            $st = $this->pdo->prepare($sql);
            $st->execute($params);
            return ['ok' => true];
        } catch (PDOException $e) {
            error_log("Refrigerante eliminar: " . $e->getMessage());
            return ['ok' => false, 'error' => 'Error al eliminar refrigerante'];
        }
    }
}
