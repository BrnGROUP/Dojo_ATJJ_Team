/** ══════════════════════════════════════════
 *  BracketOS — Jiu-Jitsu Tournament Manager
 *  Pure JS, zero dependencies (except html2canvas for export)
 *  ══════════════════════════════════════════ */

/* ── DEFAULTS ─────────────────────────────── */
const DEFAULT_ATHLETES = [
  'João Silva', 'Pedro Costa', 'Lucas Alves', 'Rafael Lima',
  'Carlos Souza', 'Bruno Pereira', 'Mateus Santos', 'Igor Rocha'
];

/* ── CARD DIMENSIONS (px) ─────────────────── */
const CARD_H     = 84;   // height of a match card (approx 38+8+38)
const COL_W      = 180;  // match card width
const CONN_W     = 40;   // connector line width
const COL_TOTAL  = COL_W + CONN_W; // per column slot

/* ── STATE ────────────────────────────────── */
const state = {
  size: 8,
  athletes: [...DEFAULT_ATHLETES],
  rounds: [],       // Array<Array<Match>>
  currentPhase: 'setup',
  champion: null,
};

/* Match shape: { id, a, b, winner, fromL, fromR } */

/* ── DOM ──────────────────────────────────── */
const dom = {
  setupPanel:       () => document.getElementById('setup-panel'),
  bracketContainer: () => document.getElementById('bracket-container'),
  bracketStage:     () => document.getElementById('bracket-stage'),
  athletesGrid:     () => document.getElementById('athletes-grid'),
  athleteCount:     () => document.getElementById('athlete-count'),
  championBanner:   () => document.getElementById('champion-banner'),
  championName:     () => document.getElementById('champion-name'),
  toast:            () => document.getElementById('toast'),
};

/* ── INIT ─────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  renderAthleteInputs();
  bindSizeTabs();
  bindFooterButtons();
});

/* ── SIZE TABS ────────────────────────────── */
function bindSizeTabs() {
  document.querySelectorAll('.size-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const size = +tab.dataset.size;
      if (size === state.size) return;
      state.size = size;

      // Sync tab UI
      document.querySelectorAll('.size-tab').forEach(t => {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-pressed', String(t === tab));
      });

      // Resize athlete list
      while (state.athletes.length < size) state.athletes.push('');
      state.athletes = state.athletes.slice(0, size);
      renderAthleteInputs();
    });
  });
}

/* ── ATHLETE INPUTS ───────────────────────── */
function renderAthleteInputs() {
  const grid = dom.athletesGrid();
  grid.innerHTML = '';

  state.athletes.forEach((name, i) => {
    const card = document.createElement('div');
    card.className = 'athlete-card';
    card.innerHTML = `
      <span class="athlete-number">${i + 1}</span>
      <input
        class="athlete-input"
        id="athlete-input-${i}"
        type="text"
        placeholder="Nome do atleta…"
        value="${esc(name)}"
        maxlength="40"
        aria-label="Atleta ${i + 1}"
        autocomplete="off"
      />
      <button class="athlete-remove" aria-label="Remover atleta ${i + 1}" data-idx="${i}">
        <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
        </svg>
      </button>
    `;

    const input = card.querySelector('.athlete-input');
    input.addEventListener('input', e => {
      state.athletes[i] = e.target.value;
      updateCount();
    });
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const next = document.getElementById(`athlete-input-${i + 1}`);
        if (next) next.focus();
        else document.getElementById('btn-generate').focus();
      }
    });

    card.querySelector('.athlete-remove').addEventListener('click', () => {
      state.athletes.splice(i, 1);
      state.athletes.push('');
      renderAthleteInputs();
    });

    grid.appendChild(card);
  });

  updateCount();
}

function updateCount() {
  const filled = state.athletes.filter(a => a.trim()).length;
  dom.athleteCount().textContent = `${filled} / ${state.size} atletas`;
}

/* ── FOOTER BUTTONS ───────────────────────── */
function bindFooterButtons() {
  document.getElementById('btn-add-athlete').addEventListener('click', () => {
    if (state.athletes.length >= 32) { showToast('Máximo de 32 atletas.', 'error'); return; }
    state.athletes.push('');
    if (state.athletes.length > state.size) {
      state.size = state.athletes.length <= 8 ? 8 : state.athletes.length <= 16 ? 16 : 32;
      syncSizeUI();
    }
    renderAthleteInputs();
    setTimeout(() => {
      document.getElementById(`athlete-input-${state.athletes.length - 1}`)?.focus();
    }, 40);
  });

  document.getElementById('btn-generate').addEventListener('click', generate);

  document.getElementById('btn-restart').addEventListener('click', () => {
    if (state.currentPhase === 'bracket') {
      if (!confirm('Reiniciar? Todo progresso será perdido.')) return;
    }
    resetAll();
  });

  document.getElementById('btn-print').addEventListener('click', () => window.print());
  document.getElementById('btn-export').addEventListener('click', exportPNG);
}

function syncSizeUI() {
  document.querySelectorAll('.size-tab').forEach(t => {
    const match = +t.dataset.size === state.size;
    t.classList.toggle('active', match);
    t.setAttribute('aria-pressed', String(match));
  });
}

function resetAll() {
  state.athletes   = [...DEFAULT_ATHLETES];
  state.rounds     = [];
  state.champion   = null;
  state.size       = 8;
  state.currentPhase = 'setup';
  syncSizeUI();
  renderAthleteInputs();

  dom.bracketContainer().hidden = true;
  dom.setupPanel().hidden       = false;
  dom.championBanner().hidden   = true;
  dom.bracketStage().innerHTML  = '';
}

/* ── GENERATE ─────────────────────────────── */
function generate() {
  // Pull names from inputs
  const inputs = dom.athletesGrid().querySelectorAll('.athlete-input');
  state.athletes = Array.from(inputs).map(i => i.value.trim());

  const named = state.athletes.filter(Boolean);
  if (named.length < 2) { showToast('Adicione pelo menos 2 atletas.', 'error'); return; }

  // bracket size = next power of 2
  const bSize   = nextPow2(named.length);
  const seeded  = [...named];
  shuffle(seeded);
  while (seeded.length < bSize) seeded.push('BYE');

  // Build rounds
  let round1 = [];
  for (let i = 0; i < bSize; i += 2) {
    round1.push(newMatch(seeded[i], seeded[i + 1]));
  }
  state.rounds = [round1];

  let prev = round1;
  while (prev.length > 1) {
    const next = [];
    for (let i = 0; i < prev.length; i += 2) {
      next.push(newMatch(null, null, prev[i].id, prev[i + 1].id));
    }
    state.rounds.push(next);
    prev = next;
  }

  autoAdvanceByes();

  state.currentPhase = 'bracket';
  dom.setupPanel().hidden       = true;
  dom.bracketContainer().hidden = false;
  dom.championBanner().hidden   = true;

  renderBracket();
  showToast('Chave gerada! 🥋', 'success');
}

let _mid = 0;
function newMatch(a, b, fromL = null, fromR = null) {
  return { id: `m${++_mid}`, a, b, winner: null, fromL, fromR };
}

function autoAdvanceByes() {
  let changed = true;
  while (changed) {
    changed = false;
    state.rounds.forEach((round, rIdx) => {
      round.forEach(m => {
        if (m.winner) return;
        if (m.a === 'BYE' && m.b !== null && m.b !== 'BYE') {
          setWinner(rIdx, m, m.b); changed = true;
        } else if (m.b === 'BYE' && m.a !== null && m.a !== 'BYE') {
          setWinner(rIdx, m, m.a); changed = true;
        } else if (m.a === 'BYE' && m.b === 'BYE') {
          setWinner(rIdx, m, 'BYE'); changed = true;
        }
      });
    });
  }
}

function setWinner(roundIdx, match, winner) {
  match.winner = winner;
  const next = state.rounds[roundIdx + 1];
  if (!next) return;
  next.forEach(nm => {
    if (nm.fromL === match.id) nm.a = winner;
    if (nm.fromR === match.id) nm.b = winner;
  });
}

/* ── RENDER BRACKET ───────────────────────── */
/**
 * Layout strategy:
 * The bracket is a standard single-elimination tree.
 * Matches are distributed: left half (indices 0..n/2-1) shown on left side,
 * right half (indices n/2..n-1) shown on right side.
 * The FINAL card is a special center column.
 *
 * For EACH round column, the height allocated per match-wrapper doubles with
 * each subsequent round so the cards appear vertically centered between the
 * two parent cards they receive winners from.
 *
 * Match-wrapper height formula:
 *   baseSlotHeight = CARD_H + 16 (card + bottom gap in round 0)
 *   round 0: rows = bracketSize/2, slotH = baseSlotH
 *   round 1: rows = bracketSize/4, slotH = baseSlotH * 2
 *   round n: slotH = baseSlotH * 2^n
 */
function renderBracket() {
  const stage = dom.bracketStage();
  stage.innerHTML = '';
  dom.championBanner().hidden = true;

  const rounds      = state.rounds;
  const totalRounds = rounds.length;
  const finalMatch  = rounds[totalRounds - 1][0];

  const leftSide  = [];
  const rightSide = [];

  for (let r = 0; r < totalRounds - 1; r++) {
    const round = rounds[r];
    const mid   = Math.ceil(round.length / 2);
    leftSide.push(round.slice(0, mid));
    rightSide.push(round.slice(mid));
  }

  // Calculate total bracket height based on first round's match count
  // (all columns must share the same total height for vertical centering)
  const baseH         = CARD_H + 24;  // card height + vertical gap
  const firstRoundLen = rounds[0].length;  // total matches in round 0
  const halfLen       = Math.ceil(firstRoundLen / 2);  // left or right side count
  const totalH        = baseH * halfLen;  // total height for all columns

  stage.style.height = `${totalH}px`;

  // LEFT COLUMNS
  leftSide.forEach((matches, colIdx) => {
    const col = buildCol(matches, colIdx, totalRounds, totalH, 'left');
    stage.appendChild(col);
  });

  // CENTER (FINAL)
  stage.appendChild(buildFinalCol(finalMatch, totalRounds));

  // RIGHT COLUMNS (reversed — converging to center)
  const reversedRight = [...rightSide].reverse();
  reversedRight.forEach((matches, revIdx) => {
    const originalRound = rightSide.length - 1 - revIdx;
    const col = buildCol(matches, originalRound, totalRounds, totalH, 'right');
    stage.appendChild(col);
  });

  checkChampion();
}

/* ── BUILD COLUMN ─────────────────────────── */
function buildCol(matches, roundIdx, totalRounds, totalH, side) {
  const col = document.createElement('div');
  col.className     = 'round-col';
  col.dataset.round = roundIdx;
  col.style.height  = `${totalH}px`;

  // Label
  const label = document.createElement('div');
  label.className   = 'round-label';
  label.textContent = roundLabel(roundIdx, totalRounds);
  col.appendChild(label);

  // Match wrappers container — fills remaining height, distributes evenly
  const list = document.createElement('div');
  list.className      = 'round-matches';
  list.style.flex     = '1';
  list.style.display  = 'flex';
  list.style.flexDirection = 'column';
  list.style.justifyContent = matches.length === 1 ? 'center' : 'space-evenly';

  matches.forEach(m => {
    const wrapper = document.createElement('div');
    wrapper.className = 'match-wrapper';

    const card = buildMatchCard(m, roundIdx);

    // Connector going right (left-side cols only)
    if (side === 'left') {
      wrapper.appendChild(card);
      wrapper.appendChild(buildConnectorSvg(m));
    } else {
      wrapper.appendChild(buildConnectorSvg(m));
      wrapper.appendChild(card);
    }

    list.appendChild(wrapper);
  });

  col.appendChild(list);
  return col;
}

/* ── BUILD MATCH CARD ─────────────────────── */
function buildMatchCard(match, roundIdx) {
  const card = document.createElement('div');
  card.className    = 'match-card';
  card.dataset.mid  = match.id;
  if (match.winner) card.classList.add('winner-declared');

  card.appendChild(buildSlot(match, 'a', roundIdx));
  card.appendChild(el('div', 'vs-divider', 'VS'));
  card.appendChild(buildSlot(match, 'b', roundIdx));

  return card;
}

function buildSlot(match, side, roundIdx) {
  const name    = match[side];
  const isBye   = name === 'BYE';
  const isEmpty = name === null || name === undefined;
  const isWin   = match.winner && match.winner === name && !isBye;
  const isLose  = match.winner && match.winner !== name && !isEmpty && !isBye;

  const slot = document.createElement('div');
  slot.className = 'athlete-slot';

  if (isBye)    slot.classList.add('bye');
  if (isEmpty)  slot.classList.add('empty');
  if (isWin)    slot.classList.add('winner');
  if (isLose)   slot.classList.add('loser');

  slot.setAttribute('role', 'button');
  slot.setAttribute('tabindex', isEmpty || isBye || match.winner ? '-1' : '0');

  const seedEl  = el('span', 'slot-seed', side === 'a' ? '1' : '2');
  const nameEl  = el('span', 'slot-name', isEmpty ? '—' : isBye ? 'BYE' : name);
  const checkEl = document.createElement('span');
  checkEl.className = 'slot-check';
  checkEl.setAttribute('aria-hidden', 'true');
  checkEl.innerHTML = `<svg viewBox="0 0 14 14" fill="none"><path d="M2 7l4 4 6-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  slot.appendChild(seedEl);
  slot.appendChild(nameEl);
  slot.appendChild(checkEl);

  if (!isEmpty && !isBye && !match.winner) {
    const onClick = () => {
      setWinner(roundIdx, match, name);
      renderBracket();
      showToast(`${name} avançou! 🥋`, 'success');
    };
    slot.addEventListener('click', onClick);
    slot.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); }
    });
  }

  return slot;
}

/* ── FINAL COLUMN ─────────────────────────── */
function buildFinalCol(match, totalRounds) {
  const center = document.createElement('div');
  center.className = 'bracket-center';

  const label = el('div', 'final-label', '');
  center.appendChild(label);

  const card = document.createElement('div');
  card.className = 'final-card';

  const title = el('div', 'final-title', '🏆 FINAL');
  card.appendChild(title);
  card.appendChild(buildSlot(match, 'a', totalRounds - 1));
  card.appendChild(el('div', 'vs-divider', 'VS'));
  card.appendChild(buildSlot(match, 'b', totalRounds - 1));

  center.appendChild(card);
  return center;
}

/* ── CONNECTORS ───────────────────────────── */
function buildConnectorSvg(match) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', match.winner ? 'connector-right connected' : 'connector-right');
  svg.setAttribute('width', CONN_W.toString());
  svg.setAttribute('height', '20'); // fixed small height; positioned in center of wrapper
  svg.setAttribute('aria-hidden', 'true');
  svg.style.selfAlign = 'center';

  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', '0');
  line.setAttribute('y1', '10');
  line.setAttribute('x2', CONN_W.toString());
  line.setAttribute('y2', '10');
  svg.appendChild(line);

  return svg;
}

/* ── CHAMPION ─────────────────────────────── */
function checkChampion() {
  const last  = state.rounds[state.rounds.length - 1];
  const final = last?.[0];
  if (final?.winner && final.winner !== 'BYE') {
    state.champion = final.winner;
    dom.championName().textContent = final.winner.toUpperCase();
    dom.championBanner().hidden    = false;
    showToast(`🏆 Campeão: ${final.winner}!`, 'success');
  }
}

/* ── EXPORT ───────────────────────────────── */
async function exportPNG() {
  if (!window.html2canvas) {
    showToast('Aguarde a biblioteca carregar e tente novamente.', 'error'); return;
  }
  showToast('Gerando imagem…');
  try {
    const canvas = await html2canvas(dom.bracketContainer(), {
      backgroundColor: '#0D0D0D', scale: 2, useCORS: true, allowTaint: true,
    });
    const a = document.createElement('a');
    a.download = `chave-${Date.now()}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
    showToast('Exportado com sucesso!', 'success');
  } catch {
    showToast('Erro ao exportar.', 'error');
  }
}

/* ── TOAST ────────────────────────────────── */
let _tt = null;
function showToast(msg, type = 'info') {
  const t = dom.toast();
  t.textContent = msg;
  t.className   = `toast show ${type}`;
  clearTimeout(_tt);
  _tt = setTimeout(() => t.classList.remove('show'), 3200);
}

/* ── UTILS ────────────────────────────────── */
function nextPow2(n) { let p = 1; while (p < n) p <<= 1; return p; }
function shuffle(a)  { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } }
function esc(s)      { return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls)  e.className   = cls;
  if (text) e.textContent = text;
  return e;
}

function roundLabel(idx, total) {
  if (idx === total - 2) return 'Semifinal';
  if (idx === total - 3) return 'Quartas';
  if (idx === total - 4) return 'Oitavas';
  if (idx === 0 && total > 4) return 'Fase 1';
  if (idx === 0) return 'Quartas';
  return `Fase ${idx + 1}`;
}
