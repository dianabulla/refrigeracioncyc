<?php
// config/env.php
// Simple loader de .env: lee ../.env y setea getenv/$_ENV/$_SERVER
$envPath = __DIR__ . '/../.env';
if (file_exists($envPath)) {
    $lines = file($envPath, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#') continue;
        if (strpos($line, '=') === false) continue;
        list($key, $val) = explode('=', $line, 2);
        $key = trim($key);
        $val = trim($val);
        // quitar comillas envolventes si existen
        if (strlen($val) >= 2) {
            if (($val[0] === '"' && $val[strlen($val)-1] === '"') || ($val[0] === "'" && $val[strlen($val)-1] === "'")) {
                $val = substr($val,1,-1);
            }
        }
        putenv("$key=$val");
        $_ENV[$key] = $val;
        $_SERVER[$key] = $val;
    }
}
