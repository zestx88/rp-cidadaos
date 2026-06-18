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

## Como acessar o módulo PHP

Para usar o sistema de login PHP, execute o servidor embutido do PHP dentro da pasta `php-auth`:

```bash
cd php-auth
php -S localhost:8000
```

Depois abra no navegador:

```text
http://localhost:8000/login.php
```

Se quiser usar o módulo PHP junto com o app Node, deixe o servidor Node rodando em `localhost:3000` e o servidor PHP em `localhost:8000`.

A partir do app Node principal, use o botão **Guia PHP** no topo para ver estas instruções rapidamente.
