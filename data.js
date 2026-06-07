// =============================================
// INDIA HEALTH PULSE — DATA
// Source: NFHS-5 (2019-21), NHP, data.gov.in
// =============================================
 
const STATE_DATA = {
  'Kerala':         { imr: 6,  anaemia: 37, immunization: 89, institutional: 99, beds: 3.1, doctors: 1.8 },
  'Goa':            { imr: 8,  anaemia: 42, immunization: 88, institutional: 98, beds: 2.8, doctors: 1.6 },
  'Tamil Nadu':     { imr: 15, anaemia: 51, immunization: 80, institutional: 99, beds: 2.1, doctors: 1.2 },
  'Delhi':          { imr: 17, anaemia: 54, immunization: 75, institutional: 97, beds: 2.4, doctors: 1.5 },
  'Maharashtra':    { imr: 19, anaemia: 53, immunization: 78, institutional: 96, beds: 1.8, doctors: 1.0 },
  'Karnataka':      { imr: 21, anaemia: 59, immunization: 76, institutional: 94, beds: 1.5, doctors: 0.9 },
  'Andhra Pradesh': { imr: 23, anaemia: 60, immunization: 74, institutional: 94, beds: 1.4, doctors: 0.8 },
  'West Bengal':    { imr: 22, anaemia: 62, immunization: 72, institutional: 92, beds: 1.3, doctors: 0.7 },
  'Gujarat':        { imr: 24, anaemia: 65, immunization: 71, institutional: 91, beds: 1.2, doctors: 0.7 },
  'Rajasthan':      { imr: 35, anaemia: 68, immunization: 65, institutional: 85, beds: 0.9, doctors: 0.5 },
  'Jharkhand':      { imr: 38, anaemia: 70, immunization: 62, institutional: 81, beds: 0.7, doctors: 0.4 },
  'Odisha':         { imr: 35, anaemia: 66, immunization: 63, institutional: 85, beds: 0.8, doctors: 0.4 },
  'Bihar':          { imr: 46, anaemia: 74, immunization: 58, institutional: 76, beds: 0.5, doctors: 0.3 },
  'Madhya Pradesh': { imr: 45, anaemia: 73, immunization: 59, institutional: 80, beds: 0.6, doctors: 0.3 },
  'Uttar Pradesh':  { imr: 50, anaemia: 76, immunization: 56, institutional: 77, beds: 0.5, doctors: 0.3 },
};
 
const NATIONAL_AVG = {
  imr: 35.4,
  anaemia: 57,
  immunization: 76,
  institutional: 88,
  beds: 1.3,
  doctors: 0.7,
};
 
const SCHEME_DATA = {
  'Bihar':          78,
  'Jharkhand':      74,
  'Uttar Pradesh':  71,
  'Odisha':         68,
  'Madhya Pradesh': 65,
  'Rajasthan':      62,
  'Andhra Pradesh': 52,
  'Karnataka':      48,
  'West Bengal':    45,
  'Gujarat':        44,
  'Maharashtra':    41,
  'Tamil Nadu':     38,
  'Kerala':         29,
  'Delhi':          26,
  'Goa':            21,
};
 
const INDICATOR_CONFIG = {
  imr: {
    label: 'IMR (per 1000)',
    key: 'imr',
    lowerBetter: true,
    max: 55,
    unit: '',
    nationalAvg: 35.4,
  },
  anaemia: {
    label: 'Anaemia (%)',
    key: 'anaemia',
    lowerBetter: true,
    max: 80,
    unit: '%',
    nationalAvg: 57,
  },
  immunization: {
    label: 'Immunization (%)',
    key: 'immunization',
    lowerBetter: false,
    max: 100,
    unit: '%',
    nationalAvg: 76,
  },
  institutional: {
    label: 'Inst. Births (%)',
    key: 'institutional',
    lowerBetter: false,
    max: 100,
    unit: '%',
    nationalAvg: 88,
  },
};
 
const PRIORITY_ZONES = [
  {
    state: 'Uttar Pradesh',
    tag: 'critical',
    tagLabel: 'Critical',
    note: 'Highest IMR (50), lowest immunization, severe anaemia burden'
  },
  {
    state: 'Bihar',
    tag: 'critical',
    tagLabel: 'Critical',
    note: 'IMR of 46, only 0.3 doctors per 1000 — extreme infrastructure gap'
  },
  {
    state: 'Madhya Pradesh',
    tag: 'high',
    tagLabel: 'High',
    note: 'IMR 45, anaemia at 73% — consistently below national average'
  },
  {
    state: 'Jharkhand',
    tag: 'high',
    tagLabel: 'High',
    note: 'Low immunization (62%) and institutional births (81%)'
  },
  {
    state: 'Rajasthan',
    tag: 'moderate',
    tagLabel: 'Moderate',
    note: 'IMR 35, infrastructure improving but anaemia remains high'
  },
];
 
const GAP_ANALYSIS = [
  { state: 'Uttar Pradesh', need: 'Very High', coverage: '71%', note: 'High burden, quality of care gap persists' },
  { state: 'Bihar',         need: 'Very High', coverage: '78%', note: 'Highest coverage but poorest health outcomes' },
  { state: 'Tamil Nadu',    need: 'Medium',    coverage: '38%', note: 'Own state scheme (CMCHIS) partially substitutes' },
  { state: 'Kerala',        need: 'Low',       coverage: '29%', note: 'Karunya Health scheme covers similar population' },
];
 
// Utility: compute risk score for a state (0-100)
function computeRiskScore(stateName) {
  const d = STATE_DATA[stateName];
  if (!d) return 0;
  const score =
    (d.imr / 55) * 40 +
    (d.anaemia / 80) * 30 +
    ((100 - d.immunization) / 100) * 20 +
    ((100 - d.institutional) / 100) * 10;
  return Math.round(score);
}
 
function getRiskLevel(score) {
  if (score >= 55) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}
 
// Get all states sorted by risk score descending
function getAllStatesByRisk() {
  return Object.keys(STATE_DATA)
    .map(s => ({ state: s, score: computeRiskScore(s), data: STATE_DATA[s] }))
    .sort((a, b) => b.score - a.score);
}
 
// Get top N and bottom N states for a given indicator
function getTopBottom(indicatorKey, lowerBetter, n = 5) {
  const sorted = Object.entries(STATE_DATA).sort((a, b) =>
    lowerBetter
      ? a[1][indicatorKey] - b[1][indicatorKey]
      : b[1][indicatorKey] - a[1][indicatorKey]
  );
  return {
    top: sorted.slice(0, n),
    bottom: sorted.slice(-n).reverse(),
  };
}
 
