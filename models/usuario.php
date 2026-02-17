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
            WHERE email = :u1 OR codigo = :u2
            LIMIT 1";
        $st = $this->pdo->prepare($sql);
        $st->execute([':u1' => $user, ':u2' => $user]);
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
            "SELECT id, codigo, nombre, email, activo, fecha_creacion, updated_at, codigo_finca, codigo_rol, codigo_empresa
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
            "SELECT id, codigo, nombre, email, activo, fecha_creacion, updated_at, codigo_finca, codigo_rol, codigo_empresa
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
        $sql = "SELECT id, codigo, nombre, email, activo, fecha_creacion, updated_at, codigo_finca, codigo_rol, codigo_empresa
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
     * $data: [codigo, nombre, email, password, activo?, codigo_finca?, codigo_rol?, codigo_empresa?]
     * Si se proporciona codigo_finca, automáticamente obtiene codigo_empresa de esa finca
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
        
        // Si se proporciona codigo_finca, obtener automáticamente el codigo_empresa
        $codigoEmpresa = $data['codigo_empresa'] ?? null;
        $codigoFinca = $data['codigo_finca'] ?? null;
        
        if ($codigoFinca && !$codigoEmpresa) {
            $stFinca = $this->pdo->prepare("SELECT codigo_empresa FROM finca WHERE codigo = ?");
            $stFinca->execute([$codigoFinca]);
            $finca = $stFinca->fetch(PDO::FETCH_ASSOC);
            if ($finca) {
                $codigoEmpresa = $finca['codigo_empresa'];
            }
        }

        $sql = "INSERT INTO usuario
                    (codigo, nombre, email, password, activo, fecha_creacion, codigo_finca, codigo_rol, codigo_empresa)
                VALUES
                    (:codigo, :nombre, :email, :password, :activo, NOW(), :codigo_finca, :codigo_rol, :codigo_empresa)";
        $st = $this->pdo->prepare($sql);

        return $st->execute([
            ':codigo'       => $codigo,
            ':nombre'       => $nombre,
            ':email'        => $email,
            ':password'     => $hash,
            ':activo'       => isset($data['activo']) ? (int)$data['activo'] : 1,
            ':codigo_finca' => $codigoFinca,
            ':codigo_rol'   => $data['codigo_rol'] ?? null,
            ':codigo_empresa' => $codigoEmpresa,
        ]);
    }

    /**
     * Actualizar usuario por ID.
     * $data puede incluir: nombre, email, password, activo, codigo_finca, codigo_rol, codigo_empresa
     * Si se actualiza codigo_finca, automáticamente actualiza codigo_empresa también
     */
    public function actualizarPorId(int $id, array $data): bool
    {
        if ($id <= 0) return false;

        if (array_key_exists('codigo_finca', $data) && $data['codigo_finca'] === '') {
            $data['codigo_finca'] = null;
        }
        if (array_key_exists('codigo_empresa', $data) && $data['codigo_empresa'] === '') {
            $data['codigo_empresa'] = null;
        }
        if (array_key_exists('codigo_finca', $data) && is_string($data['codigo_finca'])) {
            $valor = strtolower(trim($data['codigo_finca']));
            if ($valor === '' || $valor === '0' || $valor === 'null' || $valor === 'undefined') {
                $data['codigo_finca'] = null;
            }
        }
        if (array_key_exists('codigo_empresa', $data) && is_string($data['codigo_empresa'])) {
            $valor = strtolower(trim($data['codigo_empresa']));
            if ($valor === '' || $valor === '0' || $valor === 'null' || $valor === 'undefined') {
                $data['codigo_empresa'] = null;
            }
        }

        // Si se actualiza codigo_finca, obtener automáticamente codigo_empresa
        if (array_key_exists('codigo_finca', $data) && $data['codigo_finca']) {
            $stFinca = $this->pdo->prepare("SELECT codigo_empresa FROM finca WHERE codigo = ?");
            $stFinca->execute([$data['codigo_finca']]);
            $finca = $stFinca->fetch(PDO::FETCH_ASSOC);
            if ($finca) {
                $data['codigo_empresa'] = $finca['codigo_empresa'];
            }
        }

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
        if (array_key_exists('codigo_empresa', $data)) {
            $campos[] = "codigo_empresa = :codigo_empresa";
            $params[':codigo_empresa'] = $data['codigo_empresa'];
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
