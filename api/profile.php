<?php
// api/profile.php
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/../controllers/AuthController.php';

$auth = new AuthController($pdo);
$auth->profile();
