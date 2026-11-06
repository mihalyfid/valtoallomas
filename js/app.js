import { BOARD, LEVELS, advanceGame, createGame, cycleSwitch, formatTime, getLevel, logEvent, restoreGame, toggleBrake, toggleSignal } from './state.js';
import { hitTest, renderBoard, renderEvents, renderHUD, renderPreview, renderRankings, renderSchedule } from './render.js';

const SAVE_KEY = 'valtoallomas.save.v1';
const RANK_KEY = 'valtoallomas.rankings.v1';
const selectors = {
  menuView: '#menu-view', gameView: '#game-view', form: '#start-form', name: '#player-name',
  nameError: '#name-error', loadButton: '#load-button', saveSummary: '#save-summary',
  previewCanvas: '#preview-canvas', previewTitle: '#preview-title', previewDifficulty: '#preview-difficulty', previewDescription: '#preview-description',
  gameCanvas: '#game-canvas', gameTitle: '#game-title', gamePlayer: '#game-player', gameDifficulty: '#game-difficulty',
  gameStatus: '#game-status', hudTime: '#hud-time', hudDelivered: '#hud-delivered', hudErrors: '#hud-errors',
  hudWait: '#hud-wait', hudNext: '#hud-next', pauseButton: '#pause-button', boardHint: '#board-hint',
  scheduleList: '#schedule-list', eventList: '#event-list', notification: '#notification',
  rulesDialog: '#rules-dialog', rankingsDialog: '#rankings-dialog', rankLevel: '#rank-level',
  rankingsBody: '#rankings-body', rankingsEmpty: '#rankings-empty', resultDialog: '#result-dialog',
  resultTitle: '#result-title', resultDescription: '#result-description', resultTime: '#result-time',
  resultDelivered: '#result-delivered', resultErrors: '#result-errors', resultNote: '#result-note', exitDialog: '#exit-dialog',
};
const dom = Object.fromEntries(Object.entries(selectors).map(([key, selector]) => [key, document.querySelector(selector)]));
let game = null;
let preview = createGame('easy', 'Előnézet');
let view = 'menu';
let lastTimestamp = null;
let lastHUD = -Infinity;
let notificationUntil = 0;
let shownResult = null;
let dialogResume = null;
let previewDirty = true;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function notify(message, type = 'info') {
  dom.notification.textContent = message; dom.notification.dataset.type = type;
  dom.notification.hidden = false; notificationUntil = performance.now() + (type === 'error' ? 12000 : 6500);
}

function showView(next) {
  view = next; dom.menuView.hidden = next !== 'menu'; dom.gameView.hidden = next !== 'game';
  lastTimestamp = null; lastHUD = -Infinity;
  window.scrollTo(0, 0);
  if (next === 'menu') previewDirty = true;
}

function refreshSaveInfo() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    dom.loadButton.disabled = !raw;
    if (!raw) { dom.saveSummary.textContent = 'Nincs mentett játékállás.'; return; }
    const payload = JSON.parse(raw);
    const saved = restoreGame(payload);
    dom.saveSummary.textContent = `${saved.playerName} · ${getLevel(saved.levelId).difficulty} · ${formatTime(saved.time)}`;
  } catch {
    dom.saveSummary.textContent = 'A mentés vagy a helyi tárhely nem olvasható. Új menetet továbbra is indíthatsz.';
    dom.loadButton.disabled = false;
  }
}

function saveGame() {
  if (!game) return false;
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 1, savedAt: new Date().toISOString(), state: game }));
    refreshSaveInfo(); notify(`Menet elmentve: ${formatTime(game.time)}.`); return true;
  } catch {
    notify('Nem sikerült menteni. A böngésző helyi tárhelye megtelt vagy nem hozzáférhető.', 'error'); return false;
  }
}

function loadRankings() {
  const raw = localStorage.getItem(RANK_KEY);
  if (!raw) return Object.fromEntries(LEVELS.map((level) => [level.id, []]));
  const data = JSON.parse(raw);
  if (!data || data.version !== 1 || !data.levels) throw new Error('A helyi ranglista nem olvasható.');
  const levels = {};
  for (const level of LEVELS) {
    const entries = data.levels[level.id];
    if (!Array.isArray(entries) || entries.length > 20 || entries.some((entry) =>
      !entry || typeof entry.runId !== 'string' || entry.runId.length > 100 ||
      typeof entry.name !== 'string' || !entry.name.trim() || entry.name.length > 40 ||
      !Number.isFinite(entry.time) || entry.time < 0 || entry.time > 86400 ||
      !Number.isInteger(entry.errors) || entry.errors < 0 || entry.errors > 6 ||
      typeof entry.date !== 'string' || !Number.isFinite(Date.parse(entry.date)))) throw new Error('A helyi ranglista sérült.');
    levels[level.id] = entries.toSorted((a, b) => a.errors - b.errors || a.time - b.time);
  }
  return levels;
}

function recordScore() {
  const rankings = loadRankings();
  const entries = rankings[game.levelId];
  if (entries.some((entry) => entry.runId === game.runId)) return;
  entries.push({ runId: game.runId, name: game.playerName, time: game.time, errors: game.failed, date: new Date().toISOString() });
  rankings[game.levelId] = entries.toSorted((a, b) => a.errors - b.errors || a.time - b.time).slice(0, 20);
  localStorage.setItem(RANK_KEY, JSON.stringify({ version: 1, levels: rankings }));
}

function updateRankings() {
  try {
    const entries = loadRankings()[dom.rankLevel.value];
    renderRankings(entries, dom.rankingsBody, dom.rankingsEmpty);
    dom.rankingsEmpty.textContent = 'Még nincs sikeres menet ezen a pályán. Az első hely rád vár.';
  } catch {
    renderRankings([], dom.rankingsBody, dom.rankingsEmpty);
    dom.rankingsEmpty.textContent = 'A ranglista nem olvasható. A tárolt adatokat nem írtuk felül.';
  }
}

function openDialog(dialog) {
  if (game?.status === 'running') {
    dialogResume = { runId: game.runId, dialog };
    game.status = 'paused'; lastTimestamp = null;
  }
  dialog.showModal();
}

function closeDialogs() {
  dialogResume = null;
  document.querySelectorAll('dialog[open]').forEach((dialog) => dialog.close());
}

function returnToMenu() {
  closeDialogs(); game = null; shownResult = null; showView('menu'); refreshSaveInfo();
  dom.name.focus();
}

function startGame(levelId, name) {
  closeDialogs();
  const runId = typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  game = createGame(levelId, name, runId); shownResult = null;
  dom.notification.hidden = true; showView('game'); updateGameUI(); dom.pauseButton.focus();
}

function updateGameUI() {
  if (!game) return;
  renderHUD(game, dom); renderSchedule(game, dom.scheduleList); renderEvents(game, dom.eventList);
}

function showResult() {
  if (!game || !['won', 'completed', 'lost'].includes(game.status) || shownResult === game.runId) return;
  shownResult = game.runId;
  let note = 'A főmenüből másik pályát választhatsz, vagy újra megpróbálhatod ezt a menetet.';
  if (game.status === 'won') {
    try { recordScore(); note = 'Az eredményt elmentettük a pálya helyi dicsőséglistájára.'; }
    catch { note = 'A menet hibátlan, de a ranglista mentése nem sikerült. A helyi tárhely nem hozzáférhető vagy sérült.'; }
  }
  const titles = { won: 'Minden vonat célba ért.', completed: 'A menetrend véget ért.', lost: 'Ütközés történt.' };
  const descriptions = {
    won: `Szép munka, ${game.playerName}! Minden szerelvényt a megfelelő peronra vezettél.`,
    completed: 'Ez a menet hibákat tartalmaz. Nézd át a váltóutakat, és próbáld újra.',
    lost: 'Két szerelvény veszélyesen közel került egymáshoz. A szimuláció azonnal leállt.',
  };
  dom.resultTitle.textContent = titles[game.status]; dom.resultDescription.textContent = descriptions[game.status];
  dom.resultTime.textContent = formatTime(game.time); dom.resultDelivered.textContent = `${game.delivered} / ${getLevel(game.levelId).schedule.length}`;
  dom.resultErrors.textContent = game.failed; dom.resultNote.textContent = note;
  dom.resultDialog.showModal();
}

dom.form.addEventListener('submit', (event) => {
  event.preventDefault();
  try {
    const name = dom.name.value.trim();
    if (!name || name.length > 40) throw new Error('Adj meg egy 1–40 karakteres játékosnevet.');
    dom.nameError.textContent = ''; dom.name.removeAttribute('aria-invalid');
    startGame(new FormData(dom.form).get('level'), name);
  } catch (error) {
    dom.nameError.textContent = error.message; dom.name.setAttribute('aria-invalid', 'true'); dom.name.focus();
  }
});

dom.form.addEventListener('change', (event) => {
  if (event.target.name === 'level') {
    preview = createGame(event.target.value, 'Előnézet'); previewDirty = true;
  }
});
dom.name.addEventListener('input', () => {
  dom.nameError.textContent = ''; dom.name.removeAttribute('aria-invalid');
});
dom.rankLevel.addEventListener('change', updateRankings);

document.addEventListener('click', (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button || button.disabled) return;
  try {
    switch (button.dataset.action) {
      case 'rules': openDialog(dom.rulesDialog); break;
      case 'rankings':
        dom.rankLevel.value = game?.levelId || preview.levelId; updateRankings(); openDialog(dom.rankingsDialog); break;
      case 'close-dialog': button.closest('dialog').close(); break;
      case 'pause':
        if (game && ['running', 'paused'].includes(game.status)) {
          game.status = game.status === 'running' ? 'paused' : 'running'; lastTimestamp = null;
          logEvent(game, game.status === 'paused' ? 'Szimuláció szüneteltetve.' : 'Szimuláció folytatva.'); updateGameUI();
        }
        break;
      case 'save': saveGame(); break;
      case 'load': {
        let raw;
        try { raw = localStorage.getItem(SAVE_KEY); }
        catch { throw new Error('A játékállás nem olvasható, mert a böngésző helyi tárhelye nem hozzáférhető.'); }
        if (!raw) throw new Error('Még nincs mentett játékállás ebben a böngészőben.');
        const restored = restoreGame(JSON.parse(raw));
        closeDialogs(); game = restored; shownResult = null; showView('game');
        dom.name.value = game.playerName; updateGameUI(); notify(`Játékállás betöltve: ${formatTime(game.time)}.`); break;
      }
      case 'reset': if (game) startGame(game.levelId, game.playerName); break;
      case 'menu': if (game && ['running', 'paused'].includes(game.status)) openDialog(dom.exitDialog); else returnToMenu(); break;
      case 'save-exit': if (saveGame()) returnToMenu(); break;
      case 'exit': case 'result-menu': returnToMenu(); break;
      default: break;
    }
  } catch (error) { notify(error instanceof SyntaxError ? 'A mentett adat nem érvényes JSON. A mentést nem írtuk felül.' : error.message, 'error'); }
});

document.querySelectorAll('dialog').forEach((dialog) => {
  dialog.addEventListener('close', () => {
    if (dialogResume?.dialog === dialog) {
      if (view === 'game' && game?.runId === dialogResume.runId && game.status === 'paused' && !document.hidden) game.status = 'running';
      dialogResume = null; lastTimestamp = null;
    }
    updateGameUI();
  });
});

function canvasPoint(event) {
  const bounds = dom.gameCanvas.getBoundingClientRect();
  return { x: (event.clientX - bounds.left) / bounds.width * BOARD.width,
    y: (event.clientY - bounds.top) / bounds.height * BOARD.height };
}

dom.gameCanvas.addEventListener('click', (event) => {
  if (!game) return;
  const point = canvasPoint(event); const hit = hitTest(game, point.x, point.y);
  if (hit?.kind === 'switch') cycleSwitch(game, hit.id);
  if (hit?.kind === 'signal') toggleSignal(game, hit.id);
  updateGameUI();
});
dom.gameCanvas.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  if (!game) return;
  const point = canvasPoint(event); const hit = hitTest(game, point.x, point.y, true);
  if (hit) toggleBrake(game, hit.id);
  updateGameUI();
});
dom.gameCanvas.addEventListener('mousemove', (event) => {
  if (!game) return;
  const point = canvasPoint(event); const hit = hitTest(game, point.x, point.y);
  dom.gameCanvas.style.cursor = hit ? 'pointer' : 'default';
  if (hit?.kind === 'switch') {
    const turnout = getLevel(game.levelId).switches[hit.id];
    dom.gameCanvas.title = `${turnout.label}: ${turnout.routes[game.switches[hit.id]].label}. Bal kattintás: következő váltóút.`;
  } else if (hit?.kind === 'signal') dom.gameCanvas.title = `${hit.id}: ${game.signals[hit.id] ? 'szabad' : 'tilos'}. Bal kattintás: átkapcsolás.`;
  else dom.gameCanvas.title = 'Bal kattintás: váltó / jelző. Jobb kattintás a vonaton: kézi fék.';
});

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    if (game?.status === 'running') {
      game.status = 'paused'; logEvent(game, 'A böngészőlap háttérbe került. Folytatáshoz kattints a Folytatás gombra.');
    }
    dialogResume = null;
  }
  lastTimestamp = null; updateGameUI();
});
window.addEventListener('resize', () => { previewDirty = true; });

// Egyetlen RAF-hurok él az alkalmazás teljes élettartamában.
function frame(timestamp) {
  try {
    if (view === 'game' && game) {
      if (lastTimestamp !== null && !document.hidden) {
        // Ritkább rajzoláskor sem dobjuk el az eltelt időt. A modell kis lépésekben dolgozza fel.
        let elapsed = Math.max(0, (timestamp - lastTimestamp) / 1000);
        while (elapsed > 0.0000001 && game.status === 'running') {
          const step = Math.min(elapsed, 0.25);
          advanceGame(game, step); elapsed -= step;
        }
      }
      renderBoard(dom.gameCanvas, game, { clock: timestamp, reducedMotion: reducedMotion.matches });
      if (timestamp - lastHUD > 100) { updateGameUI(); lastHUD = timestamp; }
      showResult();
    } else if (previewDirty) { renderPreview(preview, dom); previewDirty = false; }
    if (!dom.notification.hidden && timestamp > notificationUntil) dom.notification.hidden = true;
  } catch (error) {
    if (game?.status === 'running') game.status = 'paused';
    if (dom.notification.textContent !== error.message) notify(error.message || 'A megjelenítés nem sikerült.', 'error');
  }
  lastTimestamp = timestamp;
  requestAnimationFrame(frame);
}

refreshSaveInfo(); requestAnimationFrame(frame);
