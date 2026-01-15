<?php

class Reporte
{
    /** @var PDO */
    private $pdo;

    public function __construct(PDO $pdo) {
        $this->pdo = $pdo;
    }

    public function crear(array $d): bool {
        try {
            $sql = "INSERT INTO reporte (
                        codigo, nombre, tipo_reporte,
                        activo, fecha_creacion,
                        report_id, fecha_captura, fecha,
                        voltaje, amperaje, aire, otro, puerta,
                        presion_s, presion_e, temperatura, humedad,
                        codigo_sensor,
                        codigo_cuarto,
                        ubicacion
                    )
                    VALUES (
                        :codigo, :nombre, :tipo_reporte,
                        :activo, NOW(),
                        :report_id, :fecha_captura, :fecha,
                        :voltaje, :amperaje, :aire, :otro, :puerta,
                        :presion_s, :presion_e, :temperatura, :humedad,
                        :codigo_sensor,
                        :codigo_cuarto,
                        :ubicacion
                    )";

            $st = $this->pdo->prepare($sql);
            return $st->execute([
                ':codigo'        => trim($d['codigo'] ?? ''),
                ':nombre'        => $d['nombre'] ?? null,
                ':tipo_reporte'  => $d['tipo_reporte'] ?? null,
                ':activo'        => isset($d['activo']) ? (int)$d['activo'] : 1,
                ':report_id'     => $d['report_id'] ?? null,
                ':fecha_captura' => $d['fecha_captura'] ?? null,
                ':fecha'         => $d['fecha'] ?? null,
                ':voltaje'       => $d['voltaje'] ?? null,
                ':amperaje'      => $d['amperaje'] ?? null,
                ':aire'          => $d['aire'] ?? null,
                ':otro'          => $d['otro'] ?? null,
                ':puerta'        => $d['puerta'] ?? null,
                ':presion_s'     => $d['presion_s'] ?? null,
                ':presion_e'     => $d['presion_e'] ?? null,
                ':temperatura'   => $d['temperatura'] ?? null,
                ':humedad'       => $d['humedad'] ?? null,
                ':codigo_sensor' => $d['codigo_sensor'] ?? null,
                ':codigo_cuarto' => $d['codigo_cuarto'] ?? null,
                ':ubicacion'     => $d['ubicacion'] ?? 'exterior'
            ]);
        } catch (PDOException $e) {
            error_log("Reporte crear: " . $e->getMessage());
            return false;
        }
    }

    public function listar(array $f = []): array {
        try {
            $sql = "SELECT * FROM reporte WHERE 1=1";
            $p   = [];

            if (!empty($f['codigo_sensor'])) {
                $sql .= " AND codigo_sensor = ?";
                $p[] = $f['codigo_sensor'];
            }
            if (!empty($f['codigo_cuarto'])) {
                $sql .= " AND codigo_cuarto = ?";
                $p[] = $f['codigo_cuarto'];
            }
            if (!empty($f['desde'])) {
                $sql .= " AND fecha_captura >= ?";
                $p[] = $f['desde'];
            }
            if (!empty($f['hasta'])) {
                $sql .= " AND fecha_captura <= ?";
                $p[] = $f['hasta'];
            }

            $sql .= " ORDER BY fecha_captura DESC, id DESC";

            $st = $this->pdo->prepare($sql);
            $st->execute($p);
            return $st->fetchAll(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Reporte listar: " . $e->getMessage());
            return [];
        }
    }

    public function obtenerTodos(array $f = []): array {
        return $this->listar($f);
    }

    public function obtenerPorCodigo(string $codigo): ?array {
        try {
            $st = $this->pdo->prepare("SELECT * FROM reporte WHERE codigo = :c LIMIT 1");
            $st->execute([':c' => $codigo]);
            $r = $st->fetch(PDO::FETCH_ASSOC);
            return $r ?: null;
        } catch (PDOException $e) {
            error_log("Reporte obtenerPorCodigo: " . $e->getMessage());
            return null;
        }
    }

    public function eliminarPorCodigo(string $codigo): bool {
        try {
            $st = $this->pdo->prepare("DELETE FROM reporte WHERE codigo = :c");
            return $st->execute([':c' => $codigo]);
        } catch (PDOException $e) {
            error_log("Reporte eliminarPorCodigo: " . $e->getMessage());
            return false;
        }
    }
}
