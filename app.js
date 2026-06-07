// =============================================
// INDIA HEALTH PULSE — APP LOGIC
// =============================================

// Track which charts have been initialized
const chartsInitialized = {};

// ─── TAB NAVIGATION ──────────────────────────────────────
const PAGE_TITLES = {
  overview:       'National Overview',
  state:          'State Deep Dive',
  infrastructure: 'Infrastructure Analysis',
  risk:           'Risk Flags',
  scheme:         'Scheme Coverage',
};

function switchTab(tabName, btnEl) {
  // Hide all tabs
  document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
  // Deactivate all nav items
  document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));

  // Show selected tab
  const tab = document.getElementById('tab-' + tabName);
  if (tab) tab.classList.add('active');

  // Activate nav button
  if (btnEl) btnEl.classList.add('active');

  // Update page title
  document.getElementById('page-title').textContent = PAGE_TITLES[tabName] || tabName;

  // Lazy-init charts for the tab
  lazyInitCharts(tabName);
}

function lazyInitCharts(tabName) {
  if (tabName === 'overview' && !chartsInitialized.overview) {
    initIMRChart();
    chartsInitialized.overview = true;
  }
  if (tabName === 'state' && !chartsInitialized.state) {
    renderState();
    chartsInitialized.state = true;
  }
  if (tabName === 'infrastructure' && !chartsInitialized.infrastructure) {
    initDoctorsChart();
    initBedsChart();
    initScatterChart();
    renderPriorityZones();
    chartsInitialized.infrastructure = true;
  }
  if (tabName === 'risk' && !chartsInitialized.risk) {
    renderRiskTable();
    initRiskChart();
    chartsInitialized.risk = true;
  }
  if (tabName === 'scheme' && !chartsInitialized.scheme) {
    initSchemeChart();
    renderGapList();
    chartsInitialized.scheme = true;
  }
}

// ─── SIDEBAR TOGGLE ──────────────────────────────────────
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const main    = document.querySelector('.main');

  if (window.innerWidth <= 900) {
    sidebar.classList.toggle('open');
  } else {
    sidebar.classList.toggle('hidden');
    main.classList.toggle('full');
  }
}

// ─── BAR ROW BUILDER ─────────────────────────────────────
function makeBarRow(label, value, max, color, unit = '') {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return `
    <div class="bar-row">
      <div class="bar-label" title="${label}">${label}</div>
      <div class="bar-track">
        <div class="bar-fill" style="width:${pct}%; background:${color};"></div>
      </div>
      <div class="bar-val">${value}${unit}</div>
    </div>`;
}

// ─── OVERVIEW: TOP/BOTTOM BARS ───────────────────────────
function updateTopBottom() {
  const indKey = document.getElementById('ind-select').value;
  const cfg    = INDICATOR_CONFIG[indKey];
  const { top, bottom } = getTopBottom(cfg.key, cfg.lowerBetter, 5);

  const topColor    = '#1D9E75';
  const bottomColor = '#D85A30';

  document.getElementById('top-bars').innerHTML =
    top.map(([state, d]) =>
      makeBarRow(state, d[cfg.key], cfg.max, topColor, cfg.unit)
    ).join('');

  document.getElementById('bottom-bars').innerHTML =
    bottom.map(([state, d]) =>
      makeBarRow(state, d[cfg.key], cfg.max, bottomColor, cfg.unit)
    ).join('');
}

// ─── STATE DEEP DIVE ─────────────────────────────────────
function renderState() {
  const select = document.getElementById('state-select');
  if (!select) return;
  const stateName = select.value;
  const d = STATE_DATA[stateName];
  if (!d) return;

  // Update chart title
  const chartTitle = document.getElementById('state-chart-title');
  if (chartTitle) chartTitle.textContent = `${stateName} vs National Average`;

  // Metric cards
  const diff = (val, nat, lowerBetter) => {
    const better = lowerBetter ? val < nat : val > nat;
    const arrow  = better ? '▲' : '▼';
    const cls    = better ? 'color:#1D9E75' : 'color:#A32D2D';
    const delta  = Math.abs(val - nat).toFixed(1);
    return `<span style="${cls};font-size:11px;">${arrow} ${delta} vs nat.</span>`;
  };

  document.getElementById('state-cards').innerHTML = `
    <div class="metric-card">
      <div class="metric-label">IMR per 1000</div>
      <div class="metric-value">${d.imr}</div>
      <div class="metric-sub">${diff(d.imr, NATIONAL_AVG.imr, true)}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Anaemia (Women %)</div>
      <div class="metric-value">${d.anaemia}%</div>
      <div class="metric-sub">${diff(d.anaemia, NATIONAL_AVG.anaemia, true)}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Immunization %</div>
      <div class="metric-value">${d.immunization}%</div>
      <div class="metric-sub">${diff(d.immunization, NATIONAL_AVG.immunization, false)}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Inst. Births %</div>
      <div class="metric-value">${d.institutional}%</div>
      <div class="metric-sub">${diff(d.institutional, NATIONAL_AVG.institutional, false)}</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Doctors per 1000</div>
      <div class="metric-value">${d.doctors}</div>
      <div class="metric-sub">WHO target: 1.0</div>
    </div>
    <div class="metric-card">
      <div class="metric-label">Beds per 1000</div>
      <div class="metric-value">${d.beds}</div>
      <div class="metric-sub">WHO target: 3.0</div>
    </div>`;

  // Infrastructure comparison bars
  document.getElementById('infra-bars').innerHTML = [
    makeBarRow(
      'Doctors/1000 (nat. avg 0.7)',
      d.doctors, 2.5,
      d.doctors >= NATIONAL_AVG.doctors ? '#1D9E75' : '#D85A30'
    ),
    makeBarRow(
      'Beds/1000 (nat. avg 1.3)',
      d.beds, 3.5,
      d.beds >= NATIONAL_AVG.beds ? '#1D9E75' : '#D85A30'
    ),
  ].join('');

  // Re-init state chart
  initStateChart(stateName);
}

// ─── INFRASTRUCTURE: PRIORITY ZONES ─────────────────────
function renderPriorityZones() {
  const el = document.getElementById('priority-zones');
  if (!el) return;

  el.innerHTML = PRIORITY_ZONES.map(p => `
    <div class="priority-item">
      <div>
        <div class="priority-state">${p.state}</div>
        <div class="priority-note-text">${p.note}</div>
      </div>
      <span class="priority-tag tag-${p.tag}">${p.tagLabel}</span>
    </div>`).join('');
}

// ─── RISK TABLE ──────────────────────────────────────────
function renderRiskTable() {
  const tbody = document.getElementById('risk-tbody');
  if (!tbody) return;

  const sorted = getAllStatesByRisk();
  const badgeClass = { high: 'badge-high', medium: 'badge-medium', low: 'badge-low' };
  const badgeLabel = { high: 'High', medium: 'Medium', low: 'Low' };

  tbody.innerHTML = sorted.map(({ state, score, data: d }) => {
    const level = getRiskLevel(score);
    return `
      <tr>
        <td>${state}</td>
        <td><strong>${score}</strong>/100</td>
        <td>${d.imr}</td>
        <td>${d.anaemia}%</td>
        <td>${d.immunization}%</td>
        <td>${d.institutional}%</td>
        <td><span class="badge ${badgeClass[level]}">${badgeLabel[level]}</span></td>
      </tr>`;
  }).join('');
}

// ─── SCHEME GAP LIST ─────────────────────────────────────
function renderGapList() {
  const el = document.getElementById('gap-list');
  if (!el) return;

  el.innerHTML = GAP_ANALYSIS.map(g => `
    <div class="priority-item">
      <div>
        <div class="priority-state">${g.state}</div>
        <div class="priority-note-text">${g.note}</div>
      </div>
      <div style="text-align:right; flex-shrink:0;">
        <div style="font-size:14px; font-weight:700; color:#0f2545;">${g.coverage}</div>
        <div style="font-size:11px; color:#8896aa; margin-top:2px;">Need: ${g.need}</div>
      </div>
    </div>`).join('');
}

// ─── CSV EXPORT ──────────────────────────────────────────
// Generates CSV dynamically when download button clicked
function generateCSV() {
  const headers = ['State','IMR','Anaemia%','Immunization%','InstBirths%','Doctors/1000','Beds/1000','RiskScore','RiskLevel'];
  const rows = Object.entries(STATE_DATA).map(([state, d]) => {
    const score = computeRiskScore(state);
    const level = getRiskLevel(score);
    return [state, d.imr, d.anaemia, d.immunization, d.institutional, d.doctors, d.beds, score, level].join(',');
  });
  return [headers.join(','), ...rows].join('\n');
}

// Override download button to generate CSV on-the-fly
document.addEventListener('DOMContentLoaded', () => {
  const dlBtn = document.querySelector('.download-btn');
  if (dlBtn) {
    dlBtn.removeAttribute('href');
    dlBtn.removeAttribute('download');
    dlBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const csv  = generateCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = 'india_health_pulse_nfhs5.csv';
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  // Initialize overview on load
  lazyInitCharts('overview');
  updateTopBottom();
});
