<?php
require_once __DIR__ . '/database.php';

function sanitize($value) {
    return htmlspecialchars(trim($value), ENT_QUOTES, 'UTF-8');
}

function getUserByEmail($email) {
    $pdo = getPDO();
    $stmt = $pdo->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$email]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

function getUserById($id) {
    $pdo = getPDO();
    $stmt = $pdo->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

function registerUser($name, $email, $password) {
    $pdo = getPDO();
    $stmt = $pdo->prepare('INSERT INTO users (name, email, password, is_admin, created_at) VALUES (?, ?, ?, 0, ?)');
    $stmt->execute([
        $name,
        $email,
        password_hash($password, PASSWORD_DEFAULT),
        date('c'),
    ]);
    return $pdo->lastInsertId();
}

function loginUser($email, $password) {
    $user = getUserByEmail($email);
    if (!$user) {
        return null;
    }

    if (!password_verify($password, $user['password'])) {
        return null;
    }

    $_SESSION['user_id'] = $user['id'];
    return $user;
}

function getAuthenticatedUser() {
    if (empty($_SESSION['user_id'])) {
        return null;
    }
    return getUserById($_SESSION['user_id']);
}

function isAuthenticated() {
    return (bool) getAuthenticatedUser();
}

function isAdmin() {
    $user = getAuthenticatedUser();
    return $user && (int) $user['is_admin'] === 1;
}

function requireLogin() {
    if (!isAuthenticated()) {
        header('Location: login.php');
        exit;
    }
}

function requireAdmin() {
    requireLogin();
    if (!isAdmin()) {
        header('Location: dashboard.php');
        exit;
    }
}

function logout() {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params['path'], $params['domain'], $params['secure'], $params['httponly']
        );
    }
    session_destroy();
}
