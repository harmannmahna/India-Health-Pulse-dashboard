// =============================================
// INDIA HEALTH PULSE — CHARTS (Chart.js)
// =============================================

// Color helpers
const COLORS = {
  teal:       '#1D9E75',
  tealDark:   '#0f6e56',
  orange:     '#D85A30',
  amber:      '#EF9F27',
  blue:       '#378ADD',
  navy:       '#0f2545',
  red:        '#A32D2D',
  gridLine:   'rgba(15,37,69,0.06)',
  tickColor:  '#8896aa',
};

// Bar color based on value vs national average
function imrBarColor(val) {
  if (val > 40) return COLORS.red;
  if (val > 25) return COLORS.orange;
  if (val > 15) return COLORS.amber;
  return COLORS.teal;
}

// Shared chart defaults
Chart.defaults.font.family = "'Segoe UI', system-ui, sans-serif";
Chart.defaults.font.size = 12;
Chart.defaults.color = COLORS.tickColor;

// ─── IMR BAR CHART ───────────────────────────────────────
let imrChartInstance = null;

function initIMRChart() {
  const ctx = document.getElementById('imrChart');
  if (!ctx) return;

  const states = Object.keys(STATE_DATA);
  const vals   = states.map(s => STATE_DATA[s].imr);
  const colors = vals.map(imrBarColor);

  if (imrChartInstance) imrChartInstance.destroy();

  imrChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: states,
      datasets: [{
        label: 'IMR per 1000',
        data: vals,
        backgroundColor: colors,
        borderWidth: 0,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => `IMR: ${ctx.parsed.y} per 1000 live births`,
          }
        }
      },
      scales: {
        x: {
          ticks: { maxRotation: 45, autoSkip: false, font: { size: 10 } },
          grid: { display: false },
        },
        y: {
          ticks: { font: { size: 11 } },
          grid: { color: COLORS.gridLine },
          title: {
            display: true,
            text: 'per 1000 live births',
            font: { size: 11 },
          },
          // Add reference line via annotation-free approach
          afterDataLimits(scale) { scale.max = 60; }
        }
      }
    }
  });
}

// ─── STATE VS NATIONAL CHART ─────────────────────────────
let stateChartInstance = null;

function initStateChart(stateName) {
  const ctx = document.getElementById('stateChart');
  if (!ctx) return;

  const d = STATE_DATA[stateName];
  const labels = ['IMR', 'Anaemia %', 'Immunization %', 'Inst. Births %'];

  const stateVals   = [d.imr, d.anaemia, d.immunization, d.institutional];
  const nationalVals = [
    NATIONAL_AVG.imr,
    NATIONAL_AVG.anaemia,
    NATIONAL_AVG.immunization,
    NATIONAL_AVG.institutional,
  ];

  if (stateChartInstance) stateChartInstance.destroy();

  stateChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: stateName,
          data: stateVals,
          backgroundColor: COLORS.navy,
          borderWidth: 0,
          borderRadius: 4,
        },
        {
          label: 'National Avg',
          data: nationalVals,
          backgroundColor: 'rgba(29,158,117,0.45)',
          borderWidth: 0,
          borderRadius: 4,
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { boxWidth: 12, boxHeight: 12, font: { size: 12 } },
        }
      },
      scales: {
        x: { grid: { display: false } },
        y: { grid: { color: COLORS.gridLine } },
      }
    }
  });
}

// ─── DOCTORS BAR CHART ───────────────────────────────────
let doctorsChartInstance = null;

function initDoctorsChart() {
  const ctx = document.getElementById('doctorsChart');
  if (!ctx) return;

  const states = Object.keys(STATE_DATA);
  const vals   = states.map(s => STATE_DATA[s].doctors);
  const colors = vals.map(v => v >= 1.0 ? COLORS.teal : v >= 0.6 ? COLORS.amber : COLORS.orange);

  if (doctorsChartInstance) doctorsChartInstance.destroy();

  doctorsChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: states,
      datasets: [{
        label: 'Doctors per 1000',
        data: vals,
        backgroundColor: colors,
        borderWidth: 0,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => `${c.parsed.y} doctors per 1000` } }
      },
      scales: {
        x: { ticks: { maxRotation: 45, autoSkip: false, font: { size: 10 } }, grid: { display: false } },
        y: {
          grid: { color: COLORS.gridLine },
          title: { display: true, text: 'per 1000 population', font: { size: 11 } },
        }
      }
    }
  });
}

// ─── BEDS BAR CHART ──────────────────────────────────────
let bedsChartInstance = null;

function initBedsChart() {
  const ctx = document.getElementById('bedsChart');
  if (!ctx) return;

  const states = Object.keys(STATE_DATA);
  const vals   = states.map(s => STATE_DATA[s].beds);
  const colors = vals.map(v => v >= 3.0 ? COLORS.teal : v >= 1.5 ? COLORS.blue : COLORS.orange);

  if (bedsChartInstance) bedsChartInstance.destroy();

  bedsChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: states,
      datasets: [{
        label: 'Beds per 1000',
        data: vals,
        backgroundColor: colors,
        borderWidth: 0,
        borderRadius: 4,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => `${c.parsed.y} beds per 1000` } }
      },
      scales: {
        x: { ticks: { maxRotation: 45, autoSkip: false, font: { size: 10 } }, grid: { display: false } },
        y: { grid: { color: COLORS.gridLine } },
      }
    }
  });
}

// ─── SCATTER: DOCTORS vs IMR ─────────────────────────────
let scatterChartInstance = null;

function initScatterChart() {
  const ctx = document.getElementById('scatterChart');
  if (!ctx) return;

  const points = Object.entries(STATE_DATA).map(([state, d]) => ({
    x: d.doctors,
    y: d.imr,
    label: state,
  }));

  if (scatterChartInstance) scatterChartInstance.destroy();

  scatterChartInstance = new Chart(ctx, {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'State',
        data: points,
        backgroundColor: points.map(p =>
          p.y > 40 ? COLORS.red :
          p.y > 25 ? COLORS.orange : COLORS.teal
        ),
        pointRadius: 6,
        pointHoverRadius: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: ctx => {
              const raw = ctx.raw;
              return `${raw.label}: ${raw.x} doctors/1000, IMR ${raw.y}`;
            }
          }
        }
      },
      scales: {
        x: {
          title: { display: true, text: 'Doctors per 1000', font: { size: 11 } },
          grid: { color: COLORS.gridLine },
          min: 0,
          max: 2.2,
        },
        y: {
          title: { display: true, text: 'IMR per 1000 births', font: { size: 11 } },
          grid: { color: COLORS.gridLine },
          min: 0,
          max: 60,
        }
      }
    }
  });
}

// ─── RISK SCORE BAR CHART ────────────────────────────────
let riskChartInstance = null;

function initRiskChart() {
  const ctx = document.getElementById('riskChart');
  if (!ctx) return;

  const sorted = getAllStatesByRisk();
  const labels = sorted.map(r => r.state);
  const scores = sorted.map(r => r.score);
  const colors = scores.map(s =>
    s >= 55 ? COLORS.red :
    s >= 35 ? COLORS.amber : COLORS.teal
  );

  if (riskChartInstance) riskChartInstance.destroy();

  riskChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Risk Score',
        data: scores,
        backgroundColor: colors,
        borderWidth: 0,
        borderRadius: 4,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => `Risk Score: ${c.parsed.x}/100` } }
      },
      scales: {
        x: { max: 100, grid: { color: COLORS.gridLine } },
        y: { ticks: { font: { size: 11 } }, grid: { display: false } },
      }
    }
  });
}

// ─── SCHEME COVERAGE CHART ───────────────────────────────
let schemeChartInstance = null;

function initSchemeChart() {
  const ctx = document.getElementById('schemeChart');
  if (!ctx) return;

  const entries = Object.entries(SCHEME_DATA);
  const labels  = entries.map(e => e[0]);
  const vals    = entries.map(e => e[1]);
  const colors  = vals.map(v =>
    v >= 65 ? COLORS.blue :
    v >= 45 ? COLORS.teal : COLORS.amber
  );

  if (schemeChartInstance) schemeChartInstance.destroy();

  schemeChartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Coverage %',
        data: vals,
        backgroundColor: colors,
        borderWidth: 0,
        borderRadius: 4,
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => `PM-JAY coverage: ${c.parsed.x}%` } }
      },
      scales: {
        x: {
          max: 100,
          ticks: { callback: v => v + '%' },
          grid: { color: COLORS.gridLine },
        },
        y: { ticks: { font: { size: 11 } }, grid: { display: false } },
      }
    }
  });
}
