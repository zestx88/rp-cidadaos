/* ═══════════════════════════════════════════
   RPCITY — APP.JS
   ═══════════════════════════════════════════ */

const API = window.location.protocol === 'file:' ? 'http://localhost:3000/api' : '/api';

// ── State ──
let state = {
  view: 'dashboard',
  page: 1,
  limit: 10,
  search: '',
  sort: 'id',
  order: 'asc',
  porteFiltro: false,
  deleteId: null,
  editId: null,
};

// ── DOM refs ──
const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ══════════════════════════════
// NAVIGATION
// ══════════════════════════════
$$('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const v = btn.dataset.view;
    switchView(v);
  });
});

function switchView(v) {
  state.view = v;
  $$('.view').forEach(el => el.classList.remove('active'));
  $$('.nav-btn').forEach(el => el.classList.remove('active'));
  $(`view-${v}`).classList.add('active');
  document.querySelector(`[data-view="${v}"]`).classList.add('active');

  const titles = { dashboard: 'Dashboard', cidadaos: 'Cidadãos', portes: 'Portes de Arma' };
  $('page-title').textContent = titles[v];

  if (v === 'dashboard') loadDashboard();
  if (v === 'cidadaos') loadCidadaos();
  if (v === 'portes') loadPortes();
}

// ══════════════════════════════
// DASHBOARD
// ══════════════════════════════
async function loadDashboard() {
  const data = await fetch(`${API}/dashboard`).then(r => r.json());

  $('stat-total').textContent = data.total;
  $('stat-portes').textContent = data.comPorte;
  $('stat-renda').textContent = 'R$ ' + Math.round(data.rendaMedia).toLocaleString('pt-BR');
  const pct = data.total ? ((data.comPorte / data.total) * 100).toFixed(1) : '0.0';
  $('stat-pct').textContent = pct + '%';

  // Bar chart
  const maxCount = data.profissoes[0]?.total || 1;
  $('profissoes-chart').innerHTML = data.profissoes.length
    ? data.profissoes.map(p => `
        <div class="bar-row">
          <span class="bar-label" title="${p.profissao}">${p.profissao}</span>
          <div class="bar-track"><div class="bar-fill" style="width:${(p.total / maxCount * 100).toFixed(0)}%"></div></div>
          <span class="bar-count">${p.total}</span>
        </div>
      `).join('')
    : '<p style="color:var(--text-muted);font-size:13px">Nenhum dado disponível</p>';

  // Donut
  const sem = data.total - data.comPorte;
  const com = data.comPorte;
  const total = data.total || 1;
  drawDonut([
    { label: 'Sem Porte', value: sem, color: '#525c74' },
    { label: 'Com Porte', value: com, color: '#f75f5f' },
  ], total);
}

function drawDonut(segments, total) {
  const svg = $('donut-svg');
  const cx = 60, cy = 60, r = 46, stroke = 14;
  const circ = 2 * Math.PI * r;
  let offset = -0.25 * circ;
  let paths = '';

  for (const seg of segments) {
    const frac = seg.value / total;
    const dash = frac * circ;
    paths += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${seg.color}" 
      stroke-width="${stroke}" stroke-dasharray="${dash} ${circ - dash}"
      stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})" style="transition:stroke-dasharray 0.8s"/>`;
    offset += dash;
  }
  paths += `<text x="${cx}" y="${cy - 6}" text-anchor="middle" fill="#e8ecf4" font-size="18" font-weight="700" font-family="JetBrains Mono">${total}</text>
             <text x="${cx}" y="${cy + 12}" text-anchor="middle" fill="#8891a8" font-size="9" font-family="JetBrains Mono">TOTAL</text>`;

  svg.innerHTML = paths;

  $('donut-legend').innerHTML = segments.map(s => `
    <div class="legend-item">
      <div class="legend-dot" style="background:${s.color}"></div>
      <div>
        <div style="font-size:12px;color:var(--text-pri)">${s.label}</div>
        <div style="font-size:11px;color:var(--text-muted);font-family:'JetBrains Mono'">${s.value} pessoas</div>
      </div>
    </div>
  `).join('');
}

// ══════════════════════════════
// CIDADAOS TABLE
// ══════════════════════════════
async function loadCidadaos() {
  const params = new URLSearchParams({
    page: state.page,
    limit: state.limit,
    search: state.search,
    sort: state.sort,
    order: state.order,
    ...(state.porteFiltro ? { porte: '1' } : {}),
  });

  const body = $('table-body');
  body.innerHTML = `<tr><td colspan="8" class="loading-row">⟳ Carregando…</td></tr>`;

  const data = await fetch(`${API}/cidadaos?${params}`).then(r => r.json());
  renderTable(data);
}

function renderTable({ data, total, page, pages }) {
  const body = $('table-body');

  if (!data.length) {
    body.innerHTML = `<tr><td colspan="8" class="empty-row">Nenhum cidadão encontrado</td></tr>`;
    $('pagination').innerHTML = '';
    return;
  }

  body.innerHTML = data.map(c => `
    <tr>
      <td class="td-id">#${c.id}</td>
      <td class="td-name">${esc(c.nome_completo)}</td>
      <td class="td-cpf">${esc(c.cpf)}</td>
      <td>${esc(c.profissao || '—')}</td>
      <td>${esc(c.empresa || '—')}</td>
      <td class="td-renda">R$ ${(c.renda_semanal || 0).toLocaleString('pt-BR')}</td>
      <td>
        ${c.porte_arma
          ? `<span class="badge badge-sim">● Sim</span>`
          : `<span class="badge badge-nao">Não</span>`}
      </td>
      <td>
        <div class="action-btns">
          <button class="act-btn view" onclick="openFicha(${c.id})" title="Ver ficha">
            <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="act-btn edit" onclick="openEdit(${c.id})" title="Editar">
            <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button class="act-btn del" onclick="confirmDelete(${c.id})" title="Excluir">
            <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  renderPagination(page, pages);
}

function renderPagination(current, pages) {
  const p = $('pagination');
  if (pages <= 1) { p.innerHTML = ''; return; }

  let html = '';
  html += `<button class="page-btn" onclick="goPage(${current - 1})" ${current <= 1 ? 'disabled' : ''}>‹</button>`;

  for (let i = 1; i <= pages; i++) {
    if (pages > 7 && Math.abs(i - current) > 2 && i !== 1 && i !== pages) {
      if (i === 2 || i === pages - 1) html += `<span style="color:var(--text-muted);padding:0 4px">…</span>`;
      continue;
    }
    html += `<button class="page-btn ${i === current ? 'active' : ''}" onclick="goPage(${i})">${i}</button>`;
  }

  html += `<button class="page-btn" onclick="goPage(${current + 1})" ${current >= pages ? 'disabled' : ''}>›</button>`;
  p.innerHTML = html;
}

function goPage(p) {
  state.page = p;
  loadCidadaos();
}

// ── Search & Sort ──
let searchTimer;
$('search-input').addEventListener('input', e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    state.search = e.target.value;
    state.page = 1;
    loadCidadaos();
  }, 300);
});

$('sort-select').addEventListener('change', e => {
  state.sort = e.target.value;
  state.page = 1;
  loadCidadaos();
});

const sortBtn = $('sort-order-btn');
sortBtn.addEventListener('click', () => {
  state.order = state.order === 'asc' ? 'desc' : 'asc';
  sortBtn.style.color = state.order === 'desc' ? 'var(--accent)' : '';
  state.page = 1;
  loadCidadaos();
});

// ══════════════════════════════
// PORTES VIEW
// ══════════════════════════════
async function loadPortes() {
  const data = await fetch(`${API}/cidadaos?porte=1&limit=200`).then(r => r.json());
  const body = $('portes-body');

  if (!data.data.length) {
    body.innerHTML = `<tr><td colspan="7" class="empty-row">Nenhum cidadão com porte cadastrado</td></tr>`;
    return;
  }

  body.innerHTML = data.data.map(c => `
    <tr>
      <td class="td-id">#${c.id}</td>
      <td class="td-name">${esc(c.nome_completo)}</td>
      <td class="td-cpf">${esc(c.cpf)}</td>
      <td><span class="badge badge-sim">${esc(c.numero_porte || 'N/D')}</span></td>
      <td>${esc(c.profissao || '—')}</td>
      <td class="td-cpf">${esc(c.telefone || '—')}</td>
      <td>
        <div class="action-btns">
          <button class="act-btn view" onclick="openFicha(${c.id})">
            <svg viewBox="0 0 24 24"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="act-btn edit" onclick="openEdit(${c.id})">
            <svg viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ══════════════════════════════
// MODAL FORM
// ══════════════════════════════
$('btn-novo-cidadao').addEventListener('click', openNew);
$('btn-cancelar').addEventListener('click', closeModal);
$('modal-close').addEventListener('click', closeModal);
$('modal-overlay').addEventListener('click', e => { if (e.target === $('modal-overlay')) closeModal(); });

function openNew() {
  state.editId = null;
  $('modal-title').textContent = 'Novo Cidadão';
  $('btn-salvar').textContent = 'Cadastrar Cidadão';
  resetForm();
  $('modal-overlay').classList.add('open');
}

async function openEdit(id) {
  const c = await fetch(`${API}/cidadaos/${id}`).then(r => r.json());
  state.editId = id;
  $('modal-title').textContent = 'Editar Cidadão';
  $('btn-salvar').textContent = 'Salvar Alterações';
  fillForm(c);
  $('modal-overlay').classList.add('open');
}

function fillForm(c) {
  $('f-id').value = c.id;
  $('f-nome').value = c.nome_completo || '';
  $('f-cpf').value = c.cpf || '';
  $('f-nascimento').value = c.data_nascimento || '';
  $('f-telefone').value = c.telefone || '';
  $('f-profissao').value = c.profissao || '';
  $('f-empresa').value = c.empresa || '';
  $('f-renda').value = c.renda_semanal || '';
  $('f-endereco').value = c.endereco || '';
  $('f-obs').value = c.observacoes || '';
  setPorteToggle(c.porte_arma ? 1 : 0);
  $('f-numero-porte').value = c.numero_porte || '';
  $('form-error').textContent = '';
}

function resetForm() {
  $('cidadao-form').reset();
  $('f-id').value = '';
  setPorteToggle(0);
  $('form-error').textContent = '';
}

function closeModal() {
  $('modal-overlay').classList.remove('open');
}

// Porte toggle
$('porte-nao').addEventListener('click', () => setPorteToggle(0));
$('porte-sim').addEventListener('click', () => setPorteToggle(1));

function setPorteToggle(val) {
  $('f-porte').value = val;
  $('porte-nao').classList.toggle('active', val === 0);
  $('porte-sim').classList.toggle('active', val === 1);
  const grupo = $('grupo-numero-porte');
  if (val === 1) {
    grupo.style.opacity = '1';
    grupo.style.pointerEvents = 'auto';
  } else {
    grupo.style.opacity = '0.3';
    grupo.style.pointerEvents = 'none';
    $('f-numero-porte').value = '';
  }
}

// Submit
$('cidadao-form').addEventListener('submit', async e => {
  e.preventDefault();
  const payload = {
    nome_completo: $('f-nome').value.trim(),
    cpf: $('f-cpf').value.trim(),
    data_nascimento: $('f-nascimento').value,
    telefone: $('f-telefone').value.trim(),
    porte_arma: parseInt($('f-porte').value),
    numero_porte: $('f-numero-porte').value.trim(),
    profissao: $('f-profissao').value.trim(),
    empresa: $('f-empresa').value.trim(),
    renda_semanal: parseFloat($('f-renda').value) || 0,
    endereco: $('f-endereco').value.trim(),
    observacoes: $('f-obs').value.trim(),
  };

  const isEdit = !!state.editId;
  const url = isEdit ? `${API}/cidadaos/${state.editId}` : `${API}/cidadaos`;
  const method = isEdit ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();

    if (!res.ok) {
      $('form-error').textContent = data.error || 'Erro ao salvar';
      return;
    }
  } catch (err) {
    console.error('Erro ao enviar formulário:', err);
    $('form-error').textContent = 'Erro de rede ao salvar. Verifique se o servidor está rodando.';
    return;
  }

  closeModal();
  toast(isEdit ? 'Cidadão atualizado com sucesso!' : 'Cidadão cadastrado com sucesso!', 'success');

  if (state.view === 'cidadaos') loadCidadaos();
  if (state.view === 'portes') loadPortes();
  if (state.view === 'dashboard') loadDashboard();

  // Refresh all if visible
  loadDashboard();
  if (state.view === 'cidadaos') loadCidadaos();
  else if (state.view === 'portes') loadPortes();
});

// ══════════════════════════════
// FICHA
// ══════════════════════════════
async function openFicha(id) {
  const c = await fetch(`${API}/cidadaos/${id}`).then(r => r.json());
  const initials = c.nome_completo.split(' ').map(n => n[0]).slice(0, 2).join('');
  const nascFormatted = c.data_nascimento ? new Date(c.data_nascimento + 'T12:00:00').toLocaleDateString('pt-BR') : '—';
  const criado = c.criado_em ? new Date(c.criado_em).toLocaleDateString('pt-BR') : '—';

  $('ficha-body').innerHTML = `
    <div class="ficha-header">
      <div class="ficha-avatar">${initials}</div>
      <div>
        <div class="ficha-name">${esc(c.nome_completo)}</div>
        <div class="ficha-sub">ID #${c.id} · Cadastrado em ${criado}</div>
      </div>
      <div class="ficha-porte-badge">
        ${c.porte_arma
          ? `<span class="badge badge-sim">● Porte Autorizado</span>
             <span style="font-size:11px;color:var(--text-muted);font-family:'JetBrains Mono'">${esc(c.numero_porte || '')}</span>`
          : `<span class="badge badge-nao">Sem Porte</span>`}
      </div>
    </div>

    <div class="ficha-grid">
      <div>
        <div class="ficha-section-title">Dados Pessoais</div>
        <div class="ficha-field"><label>CPF do Jogo</label><span class="mono">${esc(c.cpf)}</span></div>
        <div class="ficha-field"><label>Data de Nascimento</label><span>${nascFormatted}</span></div>
        <div class="ficha-field"><label>Telefone</label><span class="mono">${esc(c.telefone || '—')}</span></div>
        <div class="ficha-field"><label>Endereço</label><span>${esc(c.endereco || '—')}</span></div>
      </div>
      <div>
        <div class="ficha-section-title">Trabalho & Renda</div>
        <div class="ficha-field"><label>Profissão</label><span>${esc(c.profissao || '—')}</span></div>
        <div class="ficha-field"><label>Empresa</label><span>${esc(c.empresa || '—')}</span></div>
        <div class="ficha-field"><label>Renda Semanal</label><span style="color:var(--green);font-family:'JetBrains Mono'">R$ ${(c.renda_semanal || 0).toLocaleString('pt-BR')}</span></div>
      </div>
    </div>

    ${c.observacoes ? `
      <div class="ficha-section-title">Observações Internas</div>
      <div class="ficha-obs">${esc(c.observacoes)}</div>
    ` : ''}

    <div class="ficha-footer-actions">
      <button class="btn-ghost" onclick="closeFicha()">Fechar</button>
      <button class="btn-primary" onclick="closeFicha(); openEdit(${c.id})">
        <svg viewBox="0 0 24 24" style="width:14px;height:14px;stroke:currentColor;fill:none;stroke-width:2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
        Editar Cidadão
      </button>
    </div>
  `;

  $('ficha-overlay').classList.add('open');
}

function closeFicha() {
  $('ficha-overlay').classList.remove('open');
}
$('ficha-close').addEventListener('click', closeFicha);
$('ficha-overlay').addEventListener('click', e => { if (e.target === $('ficha-overlay')) closeFicha(); });

// ══════════════════════════════
// DELETE
// ══════════════════════════════
function confirmDelete(id) {
  state.deleteId = id;
  $('confirm-overlay').classList.add('open');
}

$('confirm-cancel').addEventListener('click', () => {
  $('confirm-overlay').classList.remove('open');
  state.deleteId = null;
});

$('confirm-ok').addEventListener('click', async () => {
  if (!state.deleteId) return;
  await fetch(`${API}/cidadaos/${state.deleteId}`, { method: 'DELETE' });
  $('confirm-overlay').classList.remove('open');
  state.deleteId = null;
  toast('Cidadão excluído.', 'success');
  loadCidadaos();
  loadDashboard();
  if (state.view === 'portes') loadPortes();
});

// ══════════════════════════════
// TOAST
// ══════════════════════════════
let toastTimer;
function toast(msg, type = 'success') {
  const el = $('toast');
  el.textContent = msg;
  el.className = `toast ${type} show`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.classList.remove('show'); }, 3000);
}

// ══════════════════════════════
// HELPERS
// ══════════════════════════════
function esc(str) {
  if (!str && str !== 0) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ══════════════════════════════
// INIT
// ══════════════════════════════
loadDashboard();
