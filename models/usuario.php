<?php
// models/usuario.php

class Usuario
{
    /** @var PDO */
    private $pdo;

    public function __construct(PDO $pdo)
    {
        $this->pdo = $pdo;
    }

    /* ==========================
       LOGIN DESDE AuthController
       ========================== */

    /**
     * Verifica el login de un usuario normal.
     * Acepta email o código como usuario.
     * Devuelve el row (SIN password) si es correcto, o null si falla.
     */
    public function verificarLogin(string $user, string $password): ?array
    {
        $user = trim($user);
        if ($user === '' || $password === '') {
            return null;
        }

        $sql = "SELECT * FROM usuario
                WHERE email = :u OR codigo = :u
                LIMIT 1";
        $st = $this->pdo->prepare($sql);
        $st->execute([':u' => $user]);
        $row = $st->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        if (!password_verify($password, $row['password'])) {
            return null;
        }

        // No devolvemos el hash de la contraseña
        unset($row['password']);
        return $row;
    }

    /* ==========================
       CRUD BÁSICO
       ========================== */

    /**
     * Obtener usuario por ID.
     */
    public function obtenerPorId(int $id): ?array
    {
        $st = $this->pdo->prepare(
            "SELECT id, codigo, nombre, email, activo, fecha_creacion, updated_at, codigo_finca, codigo_rol
             FROM usuario
             WHERE id = :id"
        );
        $st->execute([':id' => $id]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * Obtener usuario por código.
     */
    public function obtenerPorCodigo(string $codigo): ?array
    {
        $codigo = trim($codigo);
        if ($codigo === '') return null;

        $st = $this->pdo->prepare(
            "SELECT id, codigo, nombre, email, activo, fecha_creacion, updated_at, codigo_finca, codigo_rol
             FROM usuario
             WHERE codigo = :codigo
             LIMIT 1"
        );
        $st->execute([':codigo' => $codigo]);
        $row = $st->fetch(PDO::FETCH_ASSOC);
        return $row ?: null;
    }

    /**
     * Listar usuarios (opcionalmente filtrando por finca o rol).
     */
    public function listar(?string $codigoFinca = null, ?string $codigoRol = null): array
    {
        $sql = "SELECT id, codigo, nombre, email, activo, fecha_creacion, updated_at, codigo_finca, codigo_rol
                FROM usuario
                WHERE 1=1";
        $params = [];

        if ($codigoFinca) {
            $sql .= " AND codigo_finca = :finca";
            $params[':finca'] = $codigoFinca;
        }
        if ($codigoRol) {
            $sql .= " AND codigo_rol = :rol";
            $params[':rol'] = $codigoRol;
        }

        $sql .= " ORDER BY fecha_creacion DESC";

        $st = $this->pdo->prepare($sql);
        $st->execute($params);
        return $st->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Crear usuario.
     * $data: [codigo, nombre, email, password, activo?, codigo_finca?, codigo_rol?]
     */
    public function crear(array $data): bool
    {
        $codigo   = trim($data['codigo'] ?? '');
        $nombre   = trim($data['nombre'] ?? '');
        $email    = trim($data['email']  ?? '');
        $password = $data['password']    ?? '';

        if ($codigo === '' || $nombre === '' || $email === '' || $password === '') {
            return false;
        }

        // Evitar duplicados por código
        if ($this->obtenerPorCodigo($codigo)) {
            return false;
        }

        $hash = password_hash($password, PASSWORD_DEFAULT);

        $sql = "INSERT INTO usuario
                    (codigo, nombre, email, password, activo, fecha_creacion, codigo_finca, codigo_rol)
                VALUES
                    (:codigo, :nombre, :email, :password, :activo, NOW(), :codigo_finca, :codigo_rol)";
        $st = $this->pdo->prepare($sql);

        return $st->execute([
            ':codigo'       => $codigo,
            ':nombre'       => $nombre,
            ':email'        => $email,
            ':password'     => $hash,
            ':activo'       => isset($data['activo']) ? (int)$data['activo'] : 1,
            ':codigo_finca' => $data['codigo_finca'] ?? null,
            ':codigo_rol'   => $data['codigo_rol']   ?? null,
        ]);
    }

    /**
     * Actualizar usuario por ID.
     * $data puede incluir: nombre, email, password, activo, codigo_finca, codigo_rol
     */
    public function actualizarPorId(int $id, array $data): bool
    {
        if ($id <= 0) return false;

        $campos = [];
        $params = [':id' => $id];

        if (array_key_exists('nombre', $data)) {
            $campos[] = "nombre = :nombre";
            $params[':nombre'] = trim($data['nombre'] ?? '');
        }
        if (array_key_exists('email', $data)) {
            $campos[] = "email = :email";
            $params[':email'] = trim($data['email'] ?? '');
        }
        if (array_key_exists('activo', $data)) {
            $campos[] = "activo = :activo";
            $params[':activo'] = (int)$data['activo'];
        }
        if (array_key_exists('codigo_finca', $data)) {
            $campos[] = "codigo_finca = :codigo_finca";
            $params[':codigo_finca'] = $data['codigo_finca'];
        }
        if (array_key_exists('codigo_rol', $data)) {
            $campos[] = "codigo_rol = :codigo_rol";
            $params[':codigo_rol'] = $data['codigo_rol'];
        }
        if (!empty($data['password'])) {
            $campos[] = "password = :password";
            $params[':password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        }

        if (empty($campos)) {
            return false;
        }

        $sql = "UPDATE usuario SET "
             . implode(', ', $campos)
             . ", updated_at = NOW()
               WHERE id = :id";

        $st = $this->pdo->prepare($sql);
        return $st->execute($params);
    }

    /**
     * Eliminar usuario por ID.
     * (Si quieres soft-delete, aquí se podría cambiar por activo=0).
     */
    public function eliminarPorId(int $id): bool
    {
        if ($id <= 0) return false;

        $st = $this->pdo->prepare("DELETE FROM usuario WHERE id = :id");
        return $st->execute([':id' => $id]);
    }
}
