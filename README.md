# RP Cidade

Este repositório contém dois módulos diferentes:

1. `server.js` - Um app Node.js para gerenciamento de cidadãos (dashboard, tabela e cadastro via API).
2. `php-auth/` - Um sistema de login em PHP separado, gerado a partir do compartilhamento Claude.

## Módulo PHP de login

O módulo `php-auth/` inclui:

- `database.php` — configuração e inicialização do banco SQLite
- `auth.php` — funções de autenticação e sessão
- `login.php` — formulário de login
- `register.php` — cadastro de novos usuários
- `dashboard.php` — área do usuário autenticado
- `admin.php` — painel de administração
- `logout.php` — sair da sessão
- `style.css` — estilos para o módulo PHP
- `app.js` — scripts de exibição de senha e força da senha

### Como usar o módulo PHP

Execute a partir da pasta `php-auth`:

```bash
cd php-auth
php -S localhost:8000
```

Abra no navegador:

```text
http://localhost:8000/login.php
```

### Conta administrativa padrão

- E-mail: `admin@rp-cidade.local`
- Senha: `Admin@1234`

## Observação

O módulo PHP está separado do app Node.js principal e funciona em um servidor PHP diferente. Ele não é executado pelo `server.js` do Node.
