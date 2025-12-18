<?php

class CuartoFrio
{
    /** @var PDO */
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Obtener cuarto frío por código.
     */
    public function obtenerPorCodigo(string $codigo): ?array
    {
        $st = $this->pdo->prepare("SELECT * FROM cuarto_frio WHERE codigo = ?");
        $st->execute([trim($codigo)]);
        $r = $st->fetch(PDO::FETCH_ASSOC);
        return $r ?: null;
    }

    /**
     * Listar cuartos fríos.
     * Si pasas $codigoFinca, filtra por esa finca.
     */
    public function listar(?string $codigoFinca = null): array
    {
        if ($codigoFinca) {
            $st = $this->pdo->prepare(
                "SELECT *
                 FROM cuarto_frio
                 WHERE codigo_finca = :cf
                 ORDER BY fecha_creacion DESC"
            );
            $st->execute([':cf' => $codigoFinca]);
        } else {
            $st = $this->pdo->query(
                "SELECT * FROM cuarto_frio ORDER BY fecha_creacion DESC"
            );
        }
        return $st->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Crear cuarto frío.
     * $data: [codigo, nombre, activo?, codigo_finca]
     */
    public function crear(array $data): bool
    {
        $codigo      = trim($data['codigo'] ?? '');
        $nombre      = trim($data['nombre'] ?? '');
        $codigoFinca = trim($data['codigo_finca'] ?? '');

        if ($codigo === '' || $nombre === '' || $codigoFinca === '') {
            return false;
        }

        // Validar duplicado por código
        if ($this->obtenerPorCodigo($codigo)) {
            return false;
        }

        $sql = "INSERT INTO cuarto_frio
                    (codigo, nombre, activo, fecha_creacion, codigo_finca)
                VALUES
                    (:codigo, :nombre, :activo, NOW(), :codigo_finca)";

        $st = $this->pdo->prepare($sql);
        return $st->execute([
            ':codigo'      => $codigo,
            ':nombre'      => $nombre,
            ':activo'      => isset($data['activo']) ? (int)$data['activo'] : 1,
            ':codigo_finca'=> $codigoFinca
        ]);
    }

    /**
     * Actualizar cuarto frío por código.
     * Campos permitidos: nombre, activo, codigo_finca.
     */
    public function actualizarPorCodigo(string $codigo, array $data): bool
    {
        $codigo = trim($codigo);
        if ($codigo === '') return false;

        $camposPermitidos = ['nombre', 'activo', 'codigo_finca'];
        $set    = [];
        $params = [':codigo' => $codigo];

        foreach ($camposPermitidos as $c) {
            if (array_key_exists($c, $data)) {
                $set[] = "$c = :$c";
                $params[":$c"] = $data[$c];
            }
        }

        if (!$set) return false;

        $sql = "UPDATE cuarto_frio SET " . implode(', ', $set) . ", updated_at = NOW()
                WHERE codigo = :codigo";

        $st = $this->pdo->prepare($sql);
        return $st->execute($params);
    }

    /**
     * Eliminar cuarto frío por código (hard delete).
     */
    public function eliminarPorCodigo(string $codigo): bool
    {
        $codigo = trim($codigo);
        if ($codigo === '') return false;

        $st = $this->pdo->prepare("DELETE FROM cuarto_frio WHERE codigo = ?");
        return $st->execute([$codigo]);
    }
}
