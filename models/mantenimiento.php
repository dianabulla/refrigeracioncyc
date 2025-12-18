<?php
require_once __DIR__ . '/../config/db.php';

class Mantenimiento {

    private PDO $pdo;
    private string $tabla = "mantenimiento";

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    /** Obtener todos */
    public function listar() {
        $sql = "SELECT * FROM {$this->tabla} ORDER BY fecha_inicio DESC";
        return $this->pdo->query($sql)->fetchAll();
    }

    /** Obtener uno */
    public function obtener($codigo) {
        $sql = "SELECT * FROM {$this->tabla} WHERE codigo = ?";
        $st = $this->pdo->prepare($sql);
        $st->execute([$codigo]);
        return $st->fetch();
    }

    /** Crear */
    public function crear($data) {
        $sql = "INSERT INTO {$this->tabla}
        (codigo,nombre,descripcion,tipo,diagnostico,acciones,fecha_inicio,fecha_fin,codigo_cuarto,codigo_componente,activo)
        VALUES (:codigo,:nombre,:descripcion,:tipo,:diagnostico,:acciones,:fecha_inicio,:fecha_fin,:codigo_cuarto,:codigo_componente,1)";

        $st = $this->pdo->prepare($sql);
        return $st->execute($data);
    }

    /** Actualizar */
    public function actualizar($codigo, $data) {
        $data["codigo_original"] = $codigo;

        $sql = "UPDATE {$this->tabla} SET
            nombre=:nombre,
            descripcion=:descripcion,
            tipo=:tipo,
            diagnostico=:diagnostico,
            acciones=:acciones,
            fecha_inicio=:fecha_inicio,
            fecha_fin=:fecha_fin,
            codigo_cuarto=:codigo_cuarto,
            codigo_componente=:codigo_componente
        WHERE codigo=:codigo_original";

        $st = $this->pdo->prepare($sql);
        return $st->execute($data);
    }

    /** Eliminar */
    public function eliminar($codigo) {
        $sql = "DELETE FROM {$this->tabla} WHERE codigo = ?";
        $st = $this->pdo->prepare($sql);
        return $st->execute([$codigo]);
    }
}
