<?php
// config/db.php
require_once __DIR__ . '/env.php';

class Database {
    private static ?PDO $pdo = null;

    public static function connect(): PDO {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        // Leer credenciales del .env, con valores por defecto para desarrollo
        $host   = $_ENV['DB_HOST'] ?? getenv('DB_HOST') ?? '127.0.0.1';
        $port   = $_ENV['DB_PORT'] ?? getenv('DB_PORT') ?? '3306';
        $dbname = $_ENV['DB_NAME'] ?? getenv('DB_NAME') ?? 'refrigeracioncyc';
        $user   = $_ENV['DB_USER'] ?? getenv('DB_USER') ?? 'root';
        $pass   = $_ENV['DB_PASS'] ?? getenv('DB_PASS') ?? '';

        $dsn = "mysql:host={$host};port={$port};dbname={$dbname};charset=utf8mb4";

        $options = [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_EMULATE_PREPARES   => false,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        ];

        try {
            self::$pdo = new PDO($dsn, $user, $pass, $options);
            return self::$pdo;
        } catch (PDOException $e) {
            error_log('DB connection error: ' . $e->getMessage());

            if (!headers_sent()) {
                http_response_code(500);
                header('Content-Type: application/json; charset=utf-8');
            }

            echo json_encode([
                'ok'    => false,
                'error' => 'Database connection failed.'
            ]);
            exit;
        }
    }

    public static function close(): void {
        self::$pdo = null;
    }
}
