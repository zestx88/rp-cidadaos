<?php
require_once __DIR__ . '/auth.php';
requireAdmin();
$user = getAuthenticatedUser();
$pdo = getPDO();

if (isset($_GET['delete'])) {
    $deleteId = (int) $_GET['delete'];
    if ($deleteId !== (int) $user['id']) {
        $stmt = $pdo->prepare('DELETE FROM users WHERE id = ?');
        $stmt->execute([$deleteId]);
    }
    header('Location: admin.php');
    exit;
}

$users = $pdo->query('SELECT id, name, email, is_admin, created_at FROM users ORDER BY created_at DESC')->fetchAll(PDO::FETCH_ASSOC);
?><!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Admin - RP Cidade</title>
    <link rel="stylesheet" href="style.css" />
</head>
<body>
<div class="page-container">
    <header class="page-header">
        <div>
            <h1>Painel de Administração</h1>
            <p>Olá, <?= sanitize($user['name']) ?>. Aqui você pode revisar os usuários cadastrados.</p>
        </div>
        <div class="page-actions">
            <a class="btn-secondary" href="dashboard.php">Voltar ao Dashboard</a>
            <a class="btn-danger" href="logout.php">Sair</a>
        </div>
    </header>

    <main>
        <section class="card">
            <h2>Usuários registrados</h2>
            <table class="data-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Nome</th>
                        <th>E-mail</th>
                        <th>Tipo</th>
                        <th>Cadastrado</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($users as $row): ?>
                        <tr>
                            <td><?= sanitize($row['id']) ?></td>
                            <td><?= sanitize($row['name']) ?></td>
                            <td><?= sanitize($row['email']) ?></td>
                            <td><?= $row['is_admin'] ? 'Admin' : 'Usuário' ?></td>
                            <td><?= sanitize(date('d/m/Y H:i', strtotime($row['created_at']))) ?></td>
                            <td>
                                <?php if ((int) $row['id'] !== (int) $user['id']): ?>
                                    <a class="btn-danger btn-small" href="admin.php?delete=<?= sanitize($row['id']) ?>" onclick="return confirm('Excluir este usuário?');">Excluir</a>
                                <?php else: ?>
                                    <span class="muted">Seu usuário</span>
                                <?php endif; ?>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </section>
    </main>
</div>
</body>
</html>
