const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
let Database;
try {
  Database = require('better-sqlite3');
} catch (e) {
  console.warn('better-sqlite3 não disponível — fallback para DB JSON será usado.');
}
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const USERS_FILE = path.join(__dirname, 'users.json');
const jsonFile = path.join(__dirname, 'cidadaos.json');

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || 'rp-cidade-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 },
}));

const publicPaths = [
  '/login',
  '/login.html',
  '/register',
  '/register.html',
  '/auth.css',
  '/auth.js',
  '/app.js',
  '/style.css',
  '/favicon.ico',
  '/robots.txt',
  '/api/cursos',
];

const blockedStaticFiles = ['/server.js', '/package.json', '/package-lock.json', '/users.json', '/cidadaos.db', '/cidadaos.json'];
const blockedStaticPrefixes = ['/node_modules', '/php-auth', '/.git'];

app.use((req, res, next) => {
  if (blockedStaticFiles.includes(req.path) || blockedStaticPrefixes.some(prefix => req.path.startsWith(prefix))) {
    return res.status(404).end();
  }
  next();
});

app.use((req, res, next) => {
  if (publicPaths.includes(req.path) || req.path.startsWith('/api/auth') || req.path.startsWith('/api/me') || req.path.startsWith('/api/cursos')) {
    return next();
  }

  if (req.session && req.session.user) {
    return next();
  }

  if (req.method === 'GET') {
    return res.redirect('/login');
  }

  return res.status(401).json({ error: 'Não autorizado' });
});

app.use(express.static(path.join(__dirname)));

function loadUsers() {
  if (!fs.existsSync(USERS_FILE)) {
    const adminPassword = bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'Admin@1234', 10);
    const admin = {
      id: 1,
      name: 'Administrador',
      email: 'admin@rpcidade.local',
      password: adminPassword,
      role: 'admin',
      created_at: new Date().toISOString(),
    };
    fs.writeFileSync(USERS_FILE, JSON.stringify([admin], null, 2));
    return [admin];
  }
  return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8'));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function getUserByEmail(email) {
  const users = loadUsers();
  return users.find(u => u.email.toLowerCase() === email.toLowerCase());
}

function getUserById(id) {
  const users = loadUsers();
  return users.find(u => u.id === id);
}

function requireAdmin(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  if (req.session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  next();
}

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

app.post('/login', (req, res) => {
  const email = (req.body.email || '').trim();
  const password = req.body.password || '';
  const user = getUserByEmail(email);

  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.redirect('/login?error=1');
  }

  req.session.user = { id: user.id, name: user.name, email: user.email, role: user.role };
  res.redirect('/');
});

app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid');
    res.redirect('/login');
  });
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, 'register.html'));
});

app.post('/register', (req, res) => {
  const name = (req.body.name || '').trim();
  const email = (req.body.email || '').trim();
  const password = req.body.password || '';
  const confirm = req.body.confirm_password || '';

  if (!name || !email || !password || !confirm || password !== confirm || password.length < 8) {
    return res.redirect('/register?error=1');
  }

  if (getUserByEmail(email)) {
    return res.redirect('/register?error=2');
  }

  const users = loadUsers();
  const id = users.length ? Math.max(...users.map(u => u.id)) + 1 : 1;
  users.push({
    id,
    name,
    email,
    password: bcrypt.hashSync(password, 10),
    role: 'user',
    created_at: new Date().toISOString(),
  });
  saveUsers(users);

  res.redirect('/login?registered=1');
});

app.get('/api/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Não autorizado' });
  }
  return res.json(req.session.user);
});

const courses = [
  {
    id: 1,
    title: 'Advocacia Básica',
    category: 'Direito',
    level: 'Iniciante',
    duration: '8 semanas',
    credits: 16,
    term: '1º Semestre',
    professor: 'Dr. Rafael Andrade',
    schedule: 'Segundas e Quartas, 19h às 22h',
    description: 'Introdução aos fundamentos do direito civil e penal, declaração de princípios e prática jurídica básica.',
    objectives: [
      'Compreender a estrutura do sistema jurídico brasileiro.',
      'Interpretar normas de direito civil e penal.',
      'Aplicar técnicas básicas de petições e defesas.',
    ],
    modules: [
      'Direito Constitucional',
      'Direito Penal Básico',
      'Direito Civil I',
      'Prática Jurídica',
    ],
    activities: [
      'Aulas teóricas e práticas',
      'Estudo de casos reais',
      'Produção de petições iniciais',
      'Simulação de audiências',
    ],
    bibliography: [
      'Curso de Direito Constitucional – Pedro Lenza',
      'Direito Penal – Rogério Greco',
      'Manual de Processo Civil – José Miguel',
    ],
  },
  {
    id: 2,
    title: 'Curso de Armas',
    category: 'Segurança',
    level: 'Intermediário',
    duration: '6 semanas',
    credits: 12,
    term: '1º Semestre',
    professor: 'Capitão Eduardo Mello',
    schedule: 'Terças e Quintas, 18h às 21h',
    description: 'Treinamento em legislação de armas, segurança no porte e uso responsável dentro das normas.',
    objectives: [
      'Conhecer a legislação de armas e porte.',
      'Aprender manuseio seguro e manutenção.',
      'Praticar transporte e armazenamento conforme normas.',
    ],
    modules: [
      'Legislação de Armas',
      'Segurança e Manuseio',
      'Transporte e Armazenamento',
      'Simulações Operacionais',
    ],
    activities: [
      'Aulas de legislação aplicada',
      'Treinamento de segurança',
      'Estudo de casos de armamento',
      'Exercícios práticos de manutenção',
    ],
    bibliography: [
      'Estatuto do Desarmamento Comentado',
      'Manual de Segurança com Armas de Fogo',
      'Legislação Penal Aplicada',
    ],
  },
  {
    id: 3,
    title: 'Administração',
    category: 'Gestão',
    level: 'Iniciante',
    duration: '10 semanas',
    credits: 20,
    term: '1º Semestre',
    professor: 'Profª Marina Lopes',
    schedule: 'Segundas e Quartas, 14h às 17h',
    description: 'Princípios de gestão, liderança, finanças básicas e organização de equipes administrativas.',
    objectives: [
      'Entender os fundamentos da administração.',
      'Desenvolver habilidades de liderança.',
      'Aprender conceitos de finanças e planejamento.',
    ],
    modules: [
      'Fundamentos da Administração',
      'Liderança e Gestão de Pessoas',
      'Finanças Básicas',
      'Planejamento Estratégico',
    ],
    activities: [
      'Estudos de caso corporativos',
      'Simulações de gestão',
      'Elaboração de planos financeiros',
      'Projetos de melhoria contínua',
    ],
    bibliography: [
      'Administração – Idalberto Chiavenato',
      'Gestão de Pessoas – Idalberto Chiavenato',
      'Finanças Corporativas – Alexandre Assaf Neto',
    ],
  },
  {
    id: 4,
    title: 'BOPE',
    category: 'Operacional',
    level: 'Avançado',
    duration: '12 semanas',
    credits: 24,
    term: '2º Semestre',
    professor: 'Major Ricardo Tavares',
    schedule: 'Quartas e Sextas, 19h às 22h',
    description: 'Introdução à rotina do BOPE, táticas, disciplina e segurança em operações especiais.',
    objectives: [
      'Conhecer doutrinas e táticas operacionais.',
      'Desenvolver disciplina e tomada de decisão.',
      'Planejar operações especiais com segurança.',
    ],
    modules: [
      'Doutrina BOPE',
      'Táticas Avançadas',
      'Equipamentos Especiais',
      'Operações de Alto Risco',
    ],
    activities: [
      'Treinamento tático',
      'Exercícios de disciplina',
      'Avaliações físicas e teóricas',
      'Planejamento de missão',
    ],
    bibliography: [
      'Manual de Operações Táticas',
      'Disciplina Operacional',
      'Segurança em Operações Especiais',
    ],
  },
];

app.get('/api/cursos', (req, res) => {
  res.json({ data: courses });
});

app.get('/api/cursos/:id', (req, res) => {
  const course = courses.find(c => c.id === Number(req.params.id));
  if (!course) {
    return res.status(404).json({ error: 'Curso não encontrado' });
  }
  res.json(course);
});

let useSqlite = false;
let db;
if (Database) {
  try {
    db = new Database(path.join(__dirname, 'cidadaos.db'));
    useSqlite = true;
  } catch (e) {
    console.warn('Falha ao abrir better-sqlite3, usando fallback JSON:', e.message);
    useSqlite = false;
  }
}

const seed = [
  ['Carlos Eduardo Silva', '123.456.789-00', '1990-03-15', '(11) 99999-0001', 1, 'PA-001234', 'Policial', 'LSPD', 8500, 'Rua das Palmeiras, 42 - Centro', 'Oficial de patrulha há 5 anos'],
  ['Mariana Costa Ferreira', '234.567.890-11', '1995-07-22', '(11) 98888-0002', 0, '', 'Médica', 'Hospital Central', 12000, 'Av. das Flores, 180 - Jardins', 'Especialista em emergências'],
  ['Roberto Alves Mendes', '345.678.901-22', '1988-11-05', '(11) 97777-0003', 1, 'PA-005678', 'Segurança Privada', 'Protemax Security', 5500, 'Rua do Comércio, 77 - Vila Nova', 'Licença renovada recentemente'],
  ['Fernanda Lima Souza', '456.789.012-33', '2000-01-30', '(11) 96666-0004', 0, '', 'Mecânica', 'Oficina do João', 4200, 'Alameda Industrial, 15 - Zona Sul', 'Especialista em veículos importados'],
  ['Diego Martins Rocha', '567.890.123-44', '1985-09-18', '(11) 95555-0005', 1, 'PA-009012', 'Detetive Particular', 'Solo', 7800, 'Rua Sete de Setembro, 300 - Downtown', 'Antecedentes criminais: nenhum'],
  ['Juliana Pereira Santos', '678.901.234-55', '1993-04-12', '(11) 94444-0006', 0, '', 'Advogada', 'Escritório Pereira & Assoc.', 15000, 'Av. Paulista, 1000 - Centro', 'Especialista em direito criminal'],
  ['André Luiz Oliveira', '789.012.345-66', '1979-12-28', '(11) 93333-0007', 0, '', 'Taxista', 'Autônomo', 3800, 'Rua das Acácias, 55 - Bairro Novo', 'Conhece todas as rotas da cidade'],
  ['Camila Rodrigues Nunes', '890.123.456-77', '1997-06-03', '(11) 92222-0008', 0, '', 'Jornalista', 'Diário da Cidade', 6500, 'Rua da Imprensa, 200 - Vila Alta', 'Repórter investigativa'],
  ['Paulo Henrique Gomes', '901.234.567-88', '1982-08-17', '(11) 91111-0009', 1, 'PA-003456', 'Caçador de Recompensas', 'Autônomo', 9200, 'Av. dos Caçadores, 88 - Periferia', 'Licença especial de porte'],
  ['Beatriz Teixeira Castro', '012.345.678-99', '2001-02-14', '(11) 90000-0010', 0, '', 'Estudante / Balconista', 'Mercearia Central', 2100, 'Rua das Flores, 7 - Residencial', 'Trabalhando para pagar faculdade'],
];

if (useSqlite) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cidadaos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome_completo TEXT NOT NULL,
      cpf TEXT UNIQUE NOT NULL,
      data_nascimento TEXT,
      telefone TEXT,
      porte_arma INTEGER DEFAULT 0,
      numero_porte TEXT,
      profissao TEXT,
      empresa TEXT,
      renda_semanal REAL DEFAULT 0,
      endereco TEXT,
      observacoes TEXT,
      criado_em TEXT DEFAULT (datetime('now','localtime'))
    )
  `);

  const count = db.prepare('SELECT COUNT(*) as c FROM cidadaos').get();
  if (count.c === 0) {
    const insert = db.prepare(`
      INSERT INTO cidadaos (nome_completo, cpf, data_nascimento, telefone, porte_arma, numero_porte, profissao, empresa, renda_semanal, endereco, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    seed.forEach(row => insert.run(...row));
  }
} else {
  if (!fs.existsSync(jsonFile)) {
    const rows = seed.map((r, i) => ({
      id: i + 1,
      nome_completo: r[0], cpf: r[1], data_nascimento: r[2], telefone: r[3], porte_arma: r[4], numero_porte: r[5], profissao: r[6], empresa: r[7], renda_semanal: r[8], endereco: r[9], observacoes: r[10], criado_em: new Date().toISOString()
    }));
    fs.writeFileSync(jsonFile, JSON.stringify(rows, null, 2));
  }
}

function userHasEditRights(req) {
  return req.session.user && req.session.user.role === 'admin';
}

function requireAdminEdit(req, res, next) {
  if (!userHasEditRights(req)) {
    return res.status(403).json({ error: 'Apenas administradores podem alterar os dados.' });
  }
  next();
}

app.get('/api/cidadaos', (req, res) => {
  const { search, porte, sort, order, page = 1, limit = 10 } = req.query;
  const pageNum = parseInt(page) || 1;
  const lim = parseInt(limit) || 10;

  const validSorts = { nome: 'nome_completo', renda: 'renda_semanal', profissao: 'profissao', id: 'id' };
  const sortCol = validSorts[sort] || 'id';
  const sortDir = order === 'desc' ? 'desc' : 'asc';

  if (useSqlite) {
    let where = [];
    let params = [];
    if (search) {
      where.push('(nome_completo LIKE ? OR cpf LIKE ? OR profissao LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (porte === '1') where.push('porte_arma = 1');
    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
    const offset = (pageNum - 1) * lim;
    const total = db.prepare(`SELECT COUNT(*) as c FROM cidadaos ${whereClause}`).get(...params).c;
    const rows = db.prepare(`SELECT * FROM cidadaos ${whereClause} ORDER BY ${sortCol} ${sortDir.toUpperCase()} LIMIT ? OFFSET ?`).all(...params, lim, offset);
    return res.json({ data: rows, total, page: pageNum, pages: Math.ceil(total / lim) });
  }

  const all = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  let filtered = all.slice();
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(c => (c.nome_completo || '').toLowerCase().includes(s) || (c.cpf || '').toLowerCase().includes(s) || (c.profissao || '').toLowerCase().includes(s));
  }
  if (porte === '1') filtered = filtered.filter(c => c.porte_arma === 1 || c.porte_arma === '1');

  filtered.sort((a, b) => {
    const A = a[sortCol] || '';
    const B = b[sortCol] || '';
    if (typeof A === 'number' && typeof B === 'number') return sortDir === 'asc' ? A - B : B - A;
    return sortDir === 'asc' ? String(A).localeCompare(String(B)) : String(B).localeCompare(String(A));
  });

  const total = filtered.length;
  const start = (pageNum - 1) * lim;
  const rows = filtered.slice(start, start + lim);
  res.json({ data: rows, total, page: pageNum, pages: Math.ceil(total / lim) });
});

app.get('/api/cidadaos/:id', (req, res) => {
  const id = parseInt(req.params.id);
  if (useSqlite) {
    const row = db.prepare('SELECT * FROM cidadaos WHERE id = ?').get(id);
    if (!row) return res.status(404).json({ error: 'Não encontrado' });
    return res.json(row);
  }
  const all = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  const row = all.find(r => r.id === id);
  if (!row) return res.status(404).json({ error: 'Não encontrado' });
  res.json(row);
});

app.post('/api/cidadaos', requireAdminEdit, (req, res) => {
  const { nome_completo, cpf, data_nascimento, telefone, porte_arma, numero_porte, profissao, empresa, renda_semanal, endereco, observacoes } = req.body;
  if (useSqlite) {
    try {
      const result = db.prepare(`
        INSERT INTO cidadaos (nome_completo, cpf, data_nascimento, telefone, porte_arma, numero_porte, profissao, empresa, renda_semanal, endereco, observacoes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(nome_completo, cpf, data_nascimento, telefone, porte_arma ? 1 : 0, numero_porte || '', profissao, empresa, renda_semanal || 0, endereco, observacoes);
      return res.json({ id: result.lastInsertRowid });
    } catch (e) {
      if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'CPF já cadastrado' });
      return res.status(500).json({ error: e.message });
    }
  }

  const all = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  if (all.find(r => r.cpf === cpf)) return res.status(400).json({ error: 'CPF já cadastrado' });
  const id = all.length ? Math.max(...all.map(r => r.id)) + 1 : 1;
  const novo = { id, nome_completo, cpf, data_nascimento, telefone, porte_arma: porte_arma ? 1 : 0, numero_porte: numero_porte || '', profissao, empresa, renda_semanal: renda_semanal || 0, endereco, observacoes, criado_em: new Date().toISOString() };
  all.push(novo);
  fs.writeFileSync(jsonFile, JSON.stringify(all, null, 2));
  res.json({ id });
});

app.put('/api/cidadaos/:id', requireAdminEdit, (req, res) => {
  const id = parseInt(req.params.id);
  const { nome_completo, cpf, data_nascimento, telefone, porte_arma, numero_porte, profissao, empresa, renda_semanal, endereco, observacoes } = req.body;
  if (useSqlite) {
    try {
      db.prepare(`
        UPDATE cidadaos SET nome_completo=?, cpf=?, data_nascimento=?, telefone=?, porte_arma=?, numero_porte=?, profissao=?, empresa=?, renda_semanal=?, endereco=?, observacoes=?
        WHERE id=?
      `).run(nome_completo, cpf, data_nascimento, telefone, porte_arma ? 1 : 0, numero_porte || '', profissao, empresa, renda_semanal || 0, endereco, observacoes, id);
      return res.json({ ok: true });
    } catch (e) {
      if (e.message.includes('UNIQUE')) return res.status(400).json({ error: 'CPF já cadastrado' });
      return res.status(500).json({ error: e.message });
    }
  }

  const all = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  const idx = all.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Não encontrado' });
  if (all.some(r => r.cpf === cpf && r.id !== id)) return res.status(400).json({ error: 'CPF já cadastrado' });
  all[idx] = { ...all[idx], nome_completo, cpf, data_nascimento, telefone, porte_arma: porte_arma ? 1 : 0, numero_porte: numero_porte || '', profissao, empresa, renda_semanal: renda_semanal || 0, endereco, observacoes };
  fs.writeFileSync(jsonFile, JSON.stringify(all, null, 2));
  res.json({ ok: true });
});

app.delete('/api/cidadaos/:id', requireAdminEdit, (req, res) => {
  const id = parseInt(req.params.id);
  if (useSqlite) {
    db.prepare('DELETE FROM cidadaos WHERE id = ?').run(id);
    return res.json({ ok: true });
  }
  const all = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  const filtered = all.filter(r => r.id !== id);
  fs.writeFileSync(jsonFile, JSON.stringify(filtered, null, 2));
  res.json({ ok: true });
});

app.get('/api/dashboard', (req, res) => {
  if (useSqlite) {
    const total = db.prepare('SELECT COUNT(*) as c FROM cidadaos').get().c;
    const comPorte = db.prepare('SELECT COUNT(*) as c FROM cidadaos WHERE porte_arma = 1').get().c;
    const rendaMedia = db.prepare('SELECT AVG(renda_semanal) as m FROM cidadaos').get().m || 0;
    const profissoes = db.prepare(`
      SELECT profissao, COUNT(*) as total FROM cidadaos 
      WHERE profissao IS NOT NULL AND profissao != ''
      GROUP BY profissao ORDER BY total DESC LIMIT 5
    `).all();
    return res.json({ total, comPorte, rendaMedia, profissoes });
  }

  const all = JSON.parse(fs.readFileSync(jsonFile, 'utf8'));
  const total = all.length;
  const comPorte = all.filter(r => r.porte_arma === 1 || r.porte_arma === '1').length;
  const rendaMedia = all.reduce((s, r) => s + (parseFloat(r.renda_semanal) || 0), 0) / (all.length || 1);
  const profissoesMap = all.reduce((m, r) => { if (r.profissao) { m[r.profissao] = (m[r.profissao] || 0) + 1; } return m; }, {});
  const profissoes = Object.keys(profissoesMap).map(k => ({ profissao: k, total: profissoesMap[k] })).sort((a,b) => b.total - a.total).slice(0,5);
  res.json({ total, comPorte, rendaMedia, profissoes });
});

app.listen(PORT, () => {
  console.log(`\n🏙️  Sistema RP Cidadãos rodando em http://localhost:${PORT}\n`);
});
