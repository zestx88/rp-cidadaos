<?php
require_once __DIR__ . '/auth.php';

if (isAuthenticated()) {
    header('Location: dashboard.php');
    exit;
}

$error = '';
$success = '';
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $name = sanitize($_POST['name'] ?? '');
    $email = filter_input(INPUT_POST, 'email', FILTER_VALIDATE_EMAIL);
    $password = $_POST['password'] ?? '';
    $confirm = $_POST['confirm_password'] ?? '';

    if (!$name || !$email || !$password || !$confirm) {
        $error = 'Preencha todos os campos.';
    } elseif ($password !== $confirm) {
        $error = 'Senhas não conferem.';
    } elseif (strlen($password) < 8) {
        $error = 'A senha deve ter pelo menos 8 caracteres.';
    } elseif (getUserByEmail($email)) {
        $error = 'Este e-mail já está cadastrado.';
    } else {
        registerUser($name, $email, $password);
        $success = 'Conta criada com sucesso. Faça login agora.';
    }
}
?><!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Cadastro - RP Cidade</title>
    <link rel="stylesheet" href="style.css" />
</head>
<body>
<div class="auth-container">
    <div class="auth-card">
        <h1>Cadastro</h1>
        <p class="subtitle">Crie sua conta para acessar o painel</p>
        <?php if ($error): ?>
            <div class="alert alert-error"><?= sanitize($error) ?></div>
        <?php elseif ($success): ?>
            <div class="alert alert-success"><?= sanitize($success) ?></div>
        <?php endif; ?>
        <form method="post" action="register.php">
            <label for="name">Nome completo</label>
            <input type="text" id="name" name="name" required placeholder="João Silva" />

            <label for="email">E-mail</label>
            <input type="email" id="email" name="email" required placeholder="email@exemplo.com" />

            <label for="password">Senha</label>
            <div class="password-group">
                <input type="password" id="password" name="password" required placeholder="********" />
                <button type="button" class="toggle-password" data-target="#password">Mostrar</button>
            </div>

            <label for="confirm_password">Confirmar senha</label>
            <div class="password-group">
                <input type="password" id="confirm_password" name="confirm_password" required placeholder="********" />
                <button type="button" class="toggle-password" data-target="#confirm_password">Mostrar</button>
            </div>

            <button type="submit" class="btn-primary">Cadastrar</button>
        </form>
        <p class="helper-text">Já tem conta? <a href="login.php">Entrar</a></p>
    </div>
</div>
<script src="app.js"></script>
</body>
</html>
