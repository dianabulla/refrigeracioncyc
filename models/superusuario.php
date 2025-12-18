<?php
class SuperUsuario {
    private $pdo;
    public function __construct($pdo){ $this->pdo = $pdo; }

    /**
     * Cuenta cuántos superusuarios existen.
     * NOTE: útil para el "bootstrap" (permitir crear el primero sin auth).
     */
    public function contar(): int {
        return (int)$this->pdo->query("SELECT COUNT(*) FROM superusuario")->fetchColumn();
    }

    /**
     * Crea un superusuario.
     * SECURITY: Se hace password_hash y se usan prepared statements.
     */
    public function crear(array $d): array {
        // FIX: Normalizar y validar inputs
        $email    = strtolower(trim($d['email'] ?? '')); // NOTE: emails en minúscula
        $password = $d['password'] ?? '';
        $codigo   = trim($d['codigo'] ?? '');
        $nombre   = trim($d['nombre'] ?? '');
        $telefono = isset($d['telefono']) ? trim((string)$d['telefono']) : null;

        if ($email === '' || $password === '' || $codigo === '' || $nombre === '') {
            return ['ok'=>false,'error'=>'Campos requeridos: codigo, nombre, email, password'];
        }
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['ok'=>false,'error'=>'Formato de email inválido'];
        }
        if (strlen($password) < 6) {
            return ['ok'=>false,'error'=>'La contraseña debe tener al menos 6 caracteres'];
        }

        // OPTIONAL (rápido): validar duplicado antes de intentar insertar
        // NOTE: esto permite dar un error más claro incluso sin depender del mensaje SQL
        $existeEmail = $this->obtenerPorEmail($email);
        if ($existeEmail) {
            return ['ok'=>false,'error'=>'El email ya existe'];
        }
        $existeCodigo = $this->obtenerPorCodigo($codigo);
        if ($existeCodigo) {
            return ['ok'=>false,'error'=>'El código ya existe'];
        }

        try{
            $sql = "INSERT INTO superusuario (codigo,nombre,email,telefono,password,activo,fecha_creacion,updated_at)
                    VALUES (:codigo,:nombre,:email,:telefono,:password,:activo,NOW(),NULL)";
            $st = $this->pdo->prepare($sql);
            $st->execute([
                ':codigo'   => $codigo,
                ':nombre'   => $nombre,
                ':email'    => $email,
                ':telefono' => $telefono !== '' ? $telefono : null,
                ':password' => password_hash($password, PASSWORD_BCRYPT), // SECURITY
                ':activo'   => isset($d['activo']) ? (int)$d['activo'] : 1
            ]);
            $id = (int)$this->pdo->lastInsertId();
            return ['ok'=>true,'data'=>$this->obtenerPorId($id)];
        }catch(PDOException $e){
            error_log("SuperUsuario crear: ".$e->getMessage());
            // FIX: mensaje amigable ante llaves únicas (codigo/email)
            $msg = (stripos($e->getMessage(),'Duplicate')!==false || stripos($e->getMessage(),'1062')!==false)
                 ? 'El código ya existe'
                 : 'Error al crear';
            return ['ok'=>false,'error'=>$msg];
        }
    }

    /**
     * Actualiza campos no sensibles (no password).
     * NOTE: Si necesitas cambiar password, usa cambiarPassword().
     */
    public function actualizar(int $id, array $d): array {
        if ($id <= 0) return ['ok'=>false,'error'=>'ID inválido'];

        // Campos permitidos
        $set = [];
        $params = [':id'=>$id];

        // FIX: normalización de email si viene en actualización
        if (array_key_exists('email',$d) && $d['email'] !== null) {
            $d['email'] = strtolower(trim($d['email']));
            if (!filter_var($d['email'], FILTER_VALIDATE_EMAIL)) {
                return ['ok'=>false,'error'=>'Formato de email inválido'];
            }
        }

        foreach (['codigo','nombre','email','telefono','activo'] as $k){
            if (array_key_exists($k,$d)){
                $set[] = "$k = :$k";
                $val = is_string($d[$k]) ? trim((string)$d[$k]) : $d[$k];
                $params[":$k"] = ($val === '') ? null : $val;
            }
        }
        if (!$set) return ['ok'=>false,'error'=>'Nada para actualizar'];

        $sql = "UPDATE superusuario SET ".implode(',', $set).", updated_at=NOW() WHERE id=:id";
        try{
            $st = $this->pdo->prepare($sql);
            $st->execute($params);
            return ['ok'=>true,'data'=>$this->obtenerPorId($id)];
        }catch(PDOException $e){
            error_log("SuperUsuario actualizar: ".$e->getMessage());
            $msg = (stripos($e->getMessage(),'Duplicate')!==false || stripos($e->getMessage(),'1062')!==false)
                 ? 'El código ya existe'
                 : 'Error al actualizar';
            return ['ok'=>false,'error'=>$msg];
        }
    }

    /**
     * Cambia la contraseña (hash bcrypt).
     */
    public function cambiarPassword(int $id, string $password): array {
        if ($id <= 0) return ['ok'=>false,'error'=>'ID inválido'];
        if (strlen($password) < 6) return ['ok'=>false,'error'=>'La contraseña debe tener al menos 6 caracteres'];

        try{
            $st = $this->pdo->prepare("UPDATE superusuario SET password=:p, updated_at=NOW() WHERE id=:id");
            $st->execute([':p'=>password_hash($password,PASSWORD_BCRYPT), ':id'=>$id]);
            return ['ok'=>true,'data'=>['id'=>$id]];
        }catch(PDOException $e){
            error_log("SuperUsuario cambiarPassword: ".$e->getMessage());
            return ['ok'=>false,'error'=>'Error al cambiar contraseña'];
        }
    }

    /**
     * Soft-delete: desactiva (activo=0).
     * TODO: Si en el futuro quieres hard-delete, crea un método aparte.
     */
    public function eliminar(int $id): array {
        if ($id <= 0) return ['ok'=>false,'error'=>'ID inválido'];
        try{
            $st = $this->pdo->prepare("UPDATE superusuario SET activo=0, updated_at=NOW() WHERE id=:id");
            $st->execute([':id'=>$id]);
            return ['ok'=>true,'data'=>['id'=>$id,'activo'=>0]];
        }catch(PDOException $e){
            error_log("SuperUsuario eliminar: ".$e->getMessage());
            return ['ok'=>false,'error'=>'Error al eliminar (soft-delete)'];
        }
    }

    /**
     * Obtiene un superusuario por ID.
     */
    public function obtenerPorId(int $id): ?array {
        $st = $this->pdo->prepare("SELECT id,codigo,nombre,email,telefono,activo,fecha_creacion,updated_at FROM superusuario WHERE id=?");
        $st->execute([$id]);
        $r = $st->fetch(PDO::FETCH_ASSOC);
        return $r ?: null;
    }

    /**
     * Obtiene un superusuario por codigo (único).
     */
    public function obtenerPorCodigo(string $codigo): ?array {
        $st = $this->pdo->prepare("SELECT id,codigo,nombre,email,telefono,activo,fecha_creacion,updated_at FROM superusuario WHERE codigo=?");
        $st->execute([trim($codigo)]);
        $r = $st->fetch(PDO::FETCH_ASSOC);
        return $r ?: null;
    }

    /**
     * NEW: Obtiene un superusuario por email (útil para login/validación).
     */
    public function obtenerPorEmail(string $email): ?array {
        $email = strtolower(trim($email)); // FIX: normalizar
        $st = $this->pdo->prepare("SELECT id,codigo,nombre,email,telefono,activo,fecha_creacion,updated_at FROM superusuario WHERE email=?");
        $st->execute([$email]);
        $r = $st->fetch(PDO::FETCH_ASSOC);
        return $r ?: null;
    }

    /**
     * Lista superusuarios con filtros (activo, búsqueda libre, paginación).
     */
    public function listar(array $f=[]): array {
        $sql = "SELECT id,codigo,nombre,email,telefono,activo,fecha_creacion,updated_at FROM superusuario WHERE 1=1";
        $p = [];

        if (isset($f['activo']) && $f['activo']!=='') {
            $sql .= " AND activo = :activo";
            $p[':activo'] = (int)$f['activo'];
        }
        if (!empty($f['q'])) {
            $sql .= " AND (codigo LIKE :q OR nombre LIKE :q OR email LIKE :q)";
            $p[':q'] = '%'.$f['q'].'%';
        }

        $order = in_array(($f['order'] ?? ''), ['id','codigo','nombre','email','fecha_creacion'], true) ? $f['order'] : 'fecha_creacion';
        $dir   = strtoupper($f['dir'] ?? 'DESC'); $dir = ($dir==='ASC' ? 'ASC' : 'DESC');
        $sql .= " ORDER BY $order $dir";

        $limit  = isset($f['limit'])  ? max(1, (int)$f['limit'])  : 50;
        $offset = isset($f['offset']) ? max(0, (int)$f['offset']) : 0;
        $sql .= " LIMIT $limit OFFSET $offset";

        $st = $this->pdo->prepare($sql);
        $st->execute($p);
        return $st->fetchAll(PDO::FETCH_ASSOC);
    }

    /**
     * Autentica por email+password (bcrypt).
     * SECURITY: Nunca devuelvas el hash. Se remueve antes de responder.
     */
    public function autenticar(string $email, string $password): array {
        $email = strtolower(trim($email)); // FIX: normalizar
        $st = $this->pdo->prepare("SELECT id,codigo,nombre,email,telefono,activo,password FROM superusuario WHERE email=? LIMIT 1");
        $st->execute([$email]);
        $r = $st->fetch(PDO::FETCH_ASSOC);
        if (!$r) return ['ok'=>false,'error'=>'Email o contraseña inválidos'];

        if (!$r['activo']) return ['ok'=>false,'error'=>'Cuenta inactiva'];

        if (password_verify($password, $r['password'])) {
            unset($r['password']); // SECURITY: no exponer hash
            return ['ok'=>true,'data'=>$r];
        }
        return ['ok'=>false,'error'=>'Email o contraseña inválidos'];
    }
}
