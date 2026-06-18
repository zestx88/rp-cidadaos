<?php
require_once __DIR__ . '/auth.php';

if (isAuthenticated()) {
    header('Location: dashboard.php');
    exit;
}

$error = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
    $password = $_POST['password'] ?? '';

    if (!$email || !$password) {
        $error = 'Informe e-mail válido e senha.';
    } else {
        $user = loginUser($email, $password);
        if ($user) {
            header('Location: dashboard.php');
            exit;
        }
        $error = 'Email ou senha inválidos.';
    }
}
?><!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Login - RP Cidade</title>
    <link rel="stylesheet" href="style.css" />
</head>
<body>
<div class="auth-container">
    <div class="auth-card">
        <h1>Entrar</h1>
        <p class="subtitle">Acesse sua conta RP Cidade</p>
        <?php if ($error): ?>
            <div class="alert alert-error"><?= sanitize($error) ?></div>
        <?php endif; ?>
        <form method="post" action="login.php">
            <label for="email">E-mail</label>
            <input type="email" id="email" name="email" required placeholder="admin@rp-cidade.local" />

            <label for="password">Senha</label>
            <div class="password-group">
                <input type="password" id="password" name="password" required placeholder="********" />
                <button type="button" class="toggle-password" data-target="#password">Mostrar</button>
            </div>

            <button type="submit" class="btn-primary">Entrar</button>
        </form>
        <p class="helper-text">Ainda não tem conta? <a href="register.php">Cadastre-se</a></p>
        <p class="helper-text">Conta de administrador:<br><strong>admin@rp-cidade.local / Admin@1234</strong></p>
    </div>
</div>
<script src="app.js"></script>
</body>
</html>
