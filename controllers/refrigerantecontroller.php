<?php

require_once __DIR__ . '/../models/refrigerante.php';

class RefrigeranteController
{
    /** @var Refrigerante */
    private $model;

    public function __construct(PDO $pdo)
    {
        $this->model = new Refrigerante($pdo);
    }

    public function listar(?string $codigoEmpresa = null): array
    {
        return $this->model->listar($codigoEmpresa);
    }

    public function obtenerPorId(int $id, ?string $codigoEmpresa = null): ?array
    {
        return $this->model->obtenerPorId($id, $codigoEmpresa);
    }

    public function obtenerPorCodigo(string $codigo, ?string $codigoEmpresa = null): ?array
    {
        return $this->model->obtenerPorCodigo($codigo, $codigoEmpresa);
    }

    public function crear(array $data, ?string $codigoEmpresa = null): array
    {
        return $this->model->crear($data, $codigoEmpresa);
    }

    public function actualizar(array $where, array $data, ?string $codigoEmpresa = null): array
    {
        return $this->model->actualizar($where, $data, $codigoEmpresa);
    }

    public function eliminar(array $where, ?string $codigoEmpresa = null): array
    {
        return $this->model->eliminar($where, $codigoEmpresa);
    }
}
