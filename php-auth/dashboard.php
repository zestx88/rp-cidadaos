<?php
require_once __DIR__ . '/auth.php';
requireLogin();
$user = getAuthenticatedUser();
?><!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dashboard - RP Cidade</title>
    <link rel="stylesheet" href="style.css" />
</head>
<body>
<div class="page-container">
    <header class="page-header">
        <div>
            <h1>Bem-vindo, <?= sanitize($user['name']) ?></h1>
            <p>Você está conectado como <?= sanitize($user['email']) ?>.</p>
        </div>
        <div class="page-actions">
            <?php if (isAdmin()): ?>
                <a class="btn-secondary" href="admin.php">Painel Admin</a>
            <?php endif; ?>
            <a class="btn-danger" href="logout.php">Sair</a>
        </div>
    </header>

    <main>
        <section class="card">
            <h2>Resumo da sua conta</h2>
            <ul class="info-list">
                <li><strong>Nome:</strong> <?= sanitize($user['name']) ?></li>
                <li><strong>E-mail:</strong> <?= sanitize($user['email']) ?></li>
                <li><strong>Tipo de conta:</strong> <?= isAdmin() ? 'Administrador' : 'Usuário comum' ?></li>
                <li><strong>Cadastrado em:</strong> <?= sanitize(date('d/m/Y H:i', strtotime($user['created_at']))) ?></li>
            </ul>
        </section>
    </main>
</div>
</body>
</html>
