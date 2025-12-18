<?php

class Empresa
{
    /** @var PDO */
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /**
     * Obtener una empresa por código.
     */
    public function obtenerPorCodigo(string $codigo): ?array
    {
        $st = $this->pdo->prepare("SELECT * FROM empresa WHERE codigo = ?");
        $st->execute([trim($codigo)]);
        $r = $st->fetch(PDO::FETCH_ASSOC);
        return $r ?: null;
    }

    /**
     * Listar empresas. Si se pasa $codigoSuperusuario, filtra por ese dueño.
     */
    public function listar(?string $codigoSuperusuario = null): array
    {
        if ($codigoSuperusuario) {
            $st = $this->pdo->prepare(
                "SELECT * 
                 FROM empresa 
                 WHERE codigo_superusuario = :cs
                 ORDER BY fecha_creacion DESC"
            );
            $st->execute([':cs' => $codigoSuperusuario]);
        } else {
            $st = $this->pdo->query(
                "SELECT * FROM empresa ORDER BY fecha_creacion DESC"
            );
        }

        return $st->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Crear empresa.
     */
    public function crear(array $data, string $codigoSuperusuario): bool
    {
        $codigo = trim($data['codigo'] ?? '');
        $nombre = trim($data['nombre'] ?? '');

        if ($codigo === '' || $nombre === '') {
            return false;
        }

        // Verificar que no exista otra empresa con el mismo código
        if ($this->obtenerPorCodigo($codigo)) {
            return false;
        }

        $sql = "INSERT INTO empresa 
                    (codigo, nombre, nit, direccion, telefono, activo, fecha_creacion, codigo_superusuario)
                VALUES 
                    (:codigo, :nombre, :nit, :direccion, :telefono, :activo, NOW(), :codigo_superusuario)";

        $st = $this->pdo->prepare($sql);

        return $st->execute([
            ':codigo'             => $codigo,
            ':nombre'             => $nombre,
            ':nit'                => $data['nit'] ?? null,
            ':direccion'          => $data['direccion'] ?? null,
            ':telefono'           => $data['telefono'] ?? null,
            ':activo'             => isset($data['activo']) ? (int)$data['activo'] : 1,
            ':codigo_superusuario'=> $codigoSuperusuario
        ]);
    }

    /**
     * Actualizar empresa por código.
     */
    public function actualizarPorCodigo(string $codigo, array $data): bool
    {
        $codigo = trim($codigo);
        if ($codigo === '') {
            return false;
        }

        $sql = "UPDATE empresa SET
                    nombre    = :nombre,
                    nit       = :nit,
                    direccion = :direccion,
                    telefono  = :telefono,
                    activo    = :activo,
                    updated_at= NOW()
                WHERE codigo = :codigo";

        $st = $this->pdo->prepare($sql);

        return $st->execute([
            ':nombre'    => trim($data['nombre'] ?? ''),
            ':nit'       => $data['nit'] ?? null,
            ':direccion' => $data['direccion'] ?? null,
            ':telefono'  => $data['telefono'] ?? null,
            ':activo'    => isset($data['activo']) ? (int)$data['activo'] : 1,
            ':codigo'    => $codigo
        ]);
    }

    /**
     * Eliminar empresa por código (hard delete).
     */
    public function eliminarPorCodigo(string $codigo): bool
    {
        $codigo = trim($codigo);
        if ($codigo === '') {
            return false;
        }

        $st = $this->pdo->prepare("DELETE FROM empresa WHERE codigo = ?");
        return $st->execute([$codigo]);
    }
}
