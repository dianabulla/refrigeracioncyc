<?php
// config/db.php
class Database {
    private static ?PDO $pdo = null;

    public static function connect(): PDO {
        if (self::$pdo instanceof PDO) {
            return self::$pdo;
        }

        // Ajusta estos datos a TU entorno real
                
$host = "localhost";
$user = "refrig_user";
$pass = "123456";
$db   = "refrigeracioncyc";

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
