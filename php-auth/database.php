<?php
session_start();

define('DB_FILE', __DIR__ . '/data.sqlite');

function getPDO() {
    static $pdo;
    if ($pdo) {
        return $pdo;
    }

    $isNew = !file_exists(DB_FILE);
    $pdo = new PDO('sqlite:' . DB_FILE);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    if ($isNew) {
        createSchema($pdo);
    }

    return $pdo;
}

function createSchema(PDO $pdo) {
    $pdo->exec(
        'CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            is_admin INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL
        )'
    );

    createInitialAdmin($pdo);
}

function createInitialAdmin(PDO $pdo) {
    $email = 'admin@rp-cidade.local';
    $password = password_hash('Admin@1234', PASSWORD_DEFAULT);

    $statement = $pdo->prepare('SELECT COUNT(*) FROM users WHERE email = ?');
    $statement->execute([$email]);
    $count = (int) $statement->fetchColumn();

    if ($count === 0) {
        $statement = $pdo->prepare(
            'INSERT INTO users (name, email, password, is_admin, created_at) VALUES (?, ?, ?, 1, ?)' 
        );
        $statement->execute([
            'Administrador',
            $email,
            $password,
            date('c'),
        ]);
    }
}
