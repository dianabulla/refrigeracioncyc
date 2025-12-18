<?php

class Sensor
{
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /** Obtener sensor por código */
    public function obtenerPorCodigo(string $codigo): ?array
    {
        $st = $this->pdo->prepare("SELECT * FROM sensor WHERE codigo = ?");
        $st->execute([trim($codigo)]);
        $r = $st->fetch(PDO::FETCH_ASSOC);
        return $r ?: null;
    }

    /** Listar sensores (opcional por cuarto frío) */
    public function listar(?string $codigoCuarto = null): array
    {
        if ($codigoCuarto) {
            $st = $this->pdo->prepare(
                "SELECT * FROM sensor 
                 WHERE codigo_cuarto = :cc
                 ORDER BY fecha_creacion DESC"
            );
            $st->execute([':cc' => $codigoCuarto]);
            return $st->fetchAll(PDO::FETCH_ASSOC);
        }

        return $this->pdo
            ->query("SELECT * FROM sensor ORDER BY fecha_creacion DESC")
            ->fetchAll(PDO::FETCH_ASSOC);
    }

    /** Crear sensor */
    public function crear(array $data): bool
    {
        $codigo   = trim($data['codigo'] ?? '');
        $nombre   = trim($data['nombre'] ?? '');
        $tipo     = trim($data['tipo'] ?? '');
        $modelo   = trim($data['modelo'] ?? '');
        $cuarto   = trim($data['codigo_cuarto'] ?? '');

        if ($codigo === '' || $nombre === '' || $tipo === '' || $cuarto === '') {
            return false;
        }

        if ($this->obtenerPorCodigo($codigo)) return false;

        $sql = "INSERT INTO sensor 
                (codigo, nombre, tipo, modelo, fecha_instalacion, fecha_verificacion, valor_actual, 
                 activo, fecha_creacion, codigo_cuarto)
                VALUES
                (:codigo, :nombre, :tipo, :modelo, :fecha_instalacion, :fecha_verificacion, 
                 :valor_actual, :activo, NOW(), :codigo_cuarto)";

        $st = $this->pdo->prepare($sql);

        return $st->execute([
            ':codigo'             => $codigo,
            ':nombre'             => $nombre,
            ':tipo'               => $tipo,
            ':modelo'             => $modelo,
            ':fecha_instalacion'  => $data['fecha_instalacion'] ?? null,
            ':fecha_verificacion' => $data['fecha_verificacion'] ?? null,
            ':valor_actual'       => $data['valor_actual'] ?? null,
            ':activo'             => isset($data['activo']) ? (int)$data['activo'] : 1,
            ':codigo_cuarto'      => $cuarto,
        ]);
    }

    /** Actualizar sensor por código */
    public function actualizarPorCodigo(string $codigo, array $data): bool
    {
        $codigo = trim($codigo);
        if ($codigo === '') return false;

        $permitidos = [
            'nombre','tipo','modelo','fecha_instalacion','fecha_verificacion',
            'valor_actual','activo','codigo_cuarto'
        ];

        $set = [];
        $params = [':codigo' => $codigo];

        foreach ($permitidos as $c) {
            if (isset($data[$c])) {
                $set[] = "$c = :$c";
                $params[":$c"] = $data[$c];
            }
        }

        if (!$set) return false;

        $sql = "UPDATE sensor SET ".implode(',', $set).", updated_at = NOW()
                WHERE codigo = :codigo";

        $st = $this->pdo->prepare($sql);
        return $st->execute($params);
    }

    /** Eliminar sensor */
    public function eliminarPorCodigo(string $codigo): bool
    {
        $codigo = trim($codigo);
        if ($codigo === '') return false;

        $st = $this->pdo->prepare("DELETE FROM sensor WHERE codigo = ?");
        return $st->execute([$codigo]);
    }
}
