<?php

class Finca
{
    /** @var PDO */
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Obtener una finca por código.
     */
    public function obtenerPorCodigo(string $codigo): ?array
    {
        $st = $this->pdo->prepare("SELECT * FROM finca WHERE codigo = ?");
        $st->execute([trim($codigo)]);
        $r = $st->fetch(PDO::FETCH_ASSOC);
        return $r ?: null;
    }

    /**
     * Listar fincas.
     * Si pasas $codigoEmpresa, solo devuelve las de esa empresa.
     */
    public function listar(?string $codigoEmpresa = null): array
    {
        if ($codigoEmpresa) {
            $st = $this->pdo->prepare(
                "SELECT *
                 FROM finca
                 WHERE codigo_empresa = :ce
                 ORDER BY fecha_creacion DESC"
            );
            $st->execute([':ce' => $codigoEmpresa]);
        } else {
            $st = $this->pdo->query(
                "SELECT * FROM finca ORDER BY fecha_creacion DESC"
            );
        }
        return $st->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Crear finca.
     * $data: [codigo, nombre, telefono?, direccion?, activo?, codigo_empresa]
     */
    public function crear(array $data): bool
    {
        $codigo         = trim($data['codigo'] ?? '');
        $nombre         = trim($data['nombre'] ?? '');
        $codigoEmpresa  = trim($data['codigo_empresa'] ?? '');

        if ($codigo === '' || $nombre === '' || $codigoEmpresa === '') {
            return false;
        }

        // Validar duplicado por código
        if ($this->obtenerPorCodigo($codigo)) {
            return false;
        }

        $sql = "INSERT INTO finca
                    (codigo, nombre, telefono, direccion, activo, fecha_creacion, codigo_empresa)
                VALUES
                    (:codigo, :nombre, :telefono, :direccion, :activo, NOW(), :codigo_empresa)";

        $st = $this->pdo->prepare($sql);
        return $st->execute([
            ':codigo'         => $codigo,
            ':nombre'         => $nombre,
            ':telefono'       => $data['telefono'] ?? null,
            ':direccion'      => $data['direccion'] ?? null,
            ':activo'         => isset($data['activo']) ? (int)$data['activo'] : 1,
            ':codigo_empresa' => $codigoEmpresa
        ]);
    }

    /**
     * Actualizar finca por código.
     * $data puede incluir: nombre, telefono, direccion, activo, codigo_empresa.
     */
    public function actualizarPorCodigo(string $codigo, array $data): bool
    {
        $codigo = trim($codigo);
        if ($codigo === '') return false;

        $camposPermitidos = ['nombre', 'telefono', 'direccion', 'activo', 'codigo_empresa'];
        $set    = [];
        $params = [':codigo' => $codigo];

        foreach ($camposPermitidos as $c) {
            if (array_key_exists($c, $data)) {
                $set[] = "$c = :$c";
                $params[":$c"] = $data[$c];
            }
        }

        if (!$set) return false;

        $sql = "UPDATE finca SET " . implode(', ', $set) . ", updated_at = NOW()
                WHERE codigo = :codigo";

        $st = $this->pdo->prepare($sql);
        return $st->execute($params);
    }

    /**
     * Eliminar finca por código (hard delete).
     */
    public function eliminarPorCodigo(string $codigo): bool
    {
        $codigo = trim($codigo);
        if ($codigo === '') return false;

        $st = $this->pdo->prepare("DELETE FROM finca WHERE codigo = ?");
        return $st->execute([$codigo]);
    }
}
