const db = require('../src/config/db.js');

function parseDateStr(str) {
  if (!str || str === '—') return null;
  const s = String(str).trim();
  if (s.includes('/')) {
    const parts = s.split('/');
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const y = parseInt(parts[2], 10);
      if (y && !isNaN(d) && !isNaN(m)) return new Date(y, m, d);
    }
  }
  if (s.includes('-')) {
    const parts = s.split('T')[0].split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10) - 1;
      const d = parseInt(parts[2], 10);
      if (y && !isNaN(d) && !isNaN(m)) return new Date(y, m, d);
    }
  }
  return null;
}

function toIsoInput(str) {
  const dt = parseDateStr(str);
  if (!dt || isNaN(dt.getTime())) return '';
  const yyyy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getSectorPlanningDates(obj, sectorKey) {
  if (!obj) return { pi: '', pf: '', minProd: 0 };
  const rawKey = String(sectorKey || '').trim();
  const upperKey = rawKey.toUpperCase();
  const lowerKey = rawKey.toLowerCase();
  let dbKey = rawKey;
  if (lowerKey === 'pulsionadeira') dbKey = 'PULSIONADEIRA';
  else if (lowerKey === 'galvanizar') dbKey = 'GALVANIZAR';
  else if (lowerKey === 'cortealaser' || lowerKey === 'laser') dbKey = 'CorteaLaser';
  else dbKey = rawKey.charAt(0).toUpperCase() + rawKey.slice(1);

  const piCandidates = [
    `PlanejadoInicio${dbKey}`,
    `PlanejadoInicio${upperKey}`,
    `PlanejadoInicio${rawKey}`,
    `pi${dbKey}`,
    `pi${rawKey}`
  ];
  const pfCandidates = [
    `PlanejadoFinal${dbKey}`,
    `PlanejadoFinal${upperKey}`,
    `PlanejadoFinal${rawKey}`,
    `pf${dbKey}`,
    `pf${rawKey}`
  ];

  let pi = '';
  for (const k of piCandidates) {
    if (obj[k]) { pi = String(obj[k]); break; }
  }
  let pf = '';
  for (const k of pfCandidates) {
    if (obj[k]) { pf = String(obj[k]); break; }
  }

  return { pi, pf };
}

async function runFinalCheck() {
  const [rows] = await db.executeOnDefault("SELECT * FROM ordemservico WHERE IdOrdemServico = 32");
  const os = rows[0];

  const sectors = ['Corte', 'Pulsionadeira', 'Galvanizar'];

  console.log('====================================================');
  console.log('FINAL VERIFICATION FOR OS 32 DATES IN MODAL');
  console.log('====================================================');
  sectors.forEach(sec => {
    const { pi, pf } = getSectorPlanningDates(os, sec);
    const isoPi = toIsoInput(pi);
    const isoPf = toIsoInput(pf);
    console.log(`Recurso: [ ${sec} ]`);
    console.log(`  Value in MySQL DB:            Início = "${pi}", Fim = "${pf}"`);
    console.log(`  Passed to <input type="date">: Início = "${isoPi}", Fim = "${isoPf}"`);
    console.log(`  Visual Display in Browser:   Início = ${pi}, Fim = ${pf}`);
    console.log('----------------------------------------------------');
  });

  process.exit(0);
}

runFinalCheck();
