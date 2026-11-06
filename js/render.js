import { BOARD, DESTINATIONS, LEVELS, SAFETY, formatTime, getLevel, pointOnEdge, signalPosition } from './state.js';

const INK = '#e1e9e2';
const MUTED = '#a2afa5';

function line(context, a, b, color, width = 2) {
  context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y);
  context.strokeStyle = color; context.lineWidth = width; context.stroke();
}

function label(context, text, x, y, color = INK, size = 14, align = 'left') {
  context.font = `${size}px Bahnschrift, sans-serif`;
  context.textAlign = align; context.textBaseline = 'middle'; context.fillStyle = color;
  context.fillText(text, x, y);
}

function drawTrack(context, level, edge) {
  const a = level.nodes[edge.from]; const b = level.nodes[edge.to];
  const dx = (b.x - a.x) / edge.length; const dy = (b.y - a.y) / edge.length;
  for (let distance = 10; distance < edge.length - 8; distance += 18) {
    const p = { x: a.x + dx * distance, y: a.y + dy * distance };
    line(context, { x: p.x - dy * 7, y: p.y + dx * 7 }, { x: p.x + dy * 7, y: p.y - dx * 7 }, '#444f47', 3);
  }
  [-3, 3].forEach((offset) => line(context,
    { x: a.x - dy * offset, y: a.y + dx * offset },
    { x: b.x - dy * offset, y: b.y + dx * offset }, '#77847b', 1.5));

    const p = pointOnEdge(level, edge.id, edge.length * 0.42);
  context.save(); context.translate(p.x, p.y); context.rotate(p.angle);
  context.beginPath(); context.moveTo(-5, -4); context.lineTo(1, 0); context.lineTo(-5, 4);
  context.strokeStyle = '#a0ada3'; context.lineWidth = 1.5; context.stroke(); context.restore();
}

function drawSwitch(context, level, id, index) {
  const node = level.nodes[id]; const turnout = level.switches[id]; const route = turnout.routes[index];
  route.from.forEach((edgeId) => {
    const edge = level.edges[edgeId];
    line(context, pointOnEdge(level, edgeId, Math.max(0, edge.length - 42)), node, '#e6eee7', 3);
  });
  const outgoing = pointOnEdge(level, route.to, 44);
  line(context, node, outgoing, '#e6eee7', 3);
  context.save(); context.translate(outgoing.x, outgoing.y); context.rotate(outgoing.angle);
  context.beginPath(); context.moveTo(6, 0); context.lineTo(-4, -4); context.lineTo(-4, 4); context.closePath();
  context.fillStyle = '#e6eee7'; context.fill(); context.restore();
  context.beginPath(); context.arc(node.x, node.y, 13, 0, Math.PI * 2);
  context.fillStyle = '#202522'; context.fill(); context.strokeStyle = '#e6eee7'; context.lineWidth = 2; context.stroke();
  context.beginPath(); context.arc(node.x, node.y, 3, 0, Math.PI * 2); context.fillStyle = '#e6eee7'; context.fill();
  context.fillStyle = '#202522'; context.fillRect(node.x - 17, node.y - 40, 34, 20);
  label(context, turnout.label, node.x, node.y - 29, INK, 14, 'center');
}

function drawSignal(context, level, signal, green) {
  const p = signalPosition(level, signal);
  const track = pointOnEdge(level, signal.edge, signal.distance);
  line(context, track, p, '#76877b', 1);
  context.save(); context.translate(p.x, p.y);
  context.fillStyle = '#131a15'; context.strokeStyle = '#a5b2a9'; context.lineWidth = 1;
  context.fillRect(-7, -15, 14, 29); context.strokeRect(-7, -15, 14, 29);
  context.beginPath(); context.arc(0, -7, 4.5, 0, Math.PI * 2); context.fillStyle = green ? '#623b37' : '#f17a71'; context.fill();
  context.beginPath(); context.arc(0, 6, 4.5, 0, Math.PI * 2); context.fillStyle = green ? '#8bd9a5' : '#344d3c'; context.fill();
  label(context, signal.id, 0, -25, MUTED, 12, 'center');
  context.restore();
}

function drawTrain(context, train) {
  const color = DESTINATIONS[train.target].color;
  context.save(); context.translate(train.x, train.y); context.rotate(train.angle);
  context.fillStyle = '#111813'; context.fillRect(-19, -11, 38, 22);
  context.fillStyle = color; context.fillRect(-17, -8, 33, 16);
  context.beginPath(); context.moveTo(16, -8); context.lineTo(21, -4); context.lineTo(21, 4); context.lineTo(16, 8); context.closePath(); context.fill();
  context.fillStyle = '#26342b'; context.fillRect(9, -5, 6, 10);
  [-10, -3].forEach((x) => { context.fillStyle = '#f3f7ed'; context.fillRect(x, -5, 4, 10); });
  if (train.waiting === 'signal') { context.strokeStyle = '#ff817b'; context.lineWidth = 2.5; context.strokeRect(-20, -11, 42, 22); }
  context.restore();
  const width = 59;
  context.fillStyle = '#202522'; context.fillRect(train.x - width / 2, train.y - 35, width, 18);
  label(context, train.id, train.x, train.y - 26, INK, 12, 'center');
  if (train.brake || train.waiting === 'signal') {
    context.fillStyle = '#202522'; context.fillRect(train.x - 24, train.y + 17, 48, 19);
    label(context, train.brake ? 'FÉK' : 'TILOS', train.x, train.y + 27, train.brake ? '#e8bf64' : '#ff9690', 12, 'center');
  }
}

function drawExplosion(context, point) {
  context.save(); context.translate(point.x, point.y);
  context.beginPath();
  for (let i = 0; i < 24; i += 1) {
    const radius = i % 2 ? 13 : 30;
    const x = Math.cos(i * Math.PI / 12) * radius;
    const y = Math.sin(i * Math.PI / 12) * radius;
    if (i === 0) context.moveTo(x, y); else context.lineTo(x, y);
  }
  context.closePath(); context.fillStyle = '#ec9865'; context.fill();
  label(context, '!', 0, 1, '#202522', 26, 'center'); context.restore();
}

export function renderBoard(canvas, state, { preview = false, clock = 0, reducedMotion = false } = {}) {
  const level = getLevel(state.levelId);
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Ebben a böngészőben a Canvas 2D nem használható.');
  const rect = canvas.getBoundingClientRect();
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  context.save(); context.setTransform(canvas.width / BOARD.width, 0, 0, canvas.height / BOARD.height, 0, 0);
  context.clearRect(0, 0, BOARD.width, BOARD.height);
  context.fillStyle = '#202522'; context.fillRect(0, 0, BOARD.width, BOARD.height);
  context.fillStyle = '#333d35';
  for (let x = 30; x < BOARD.width; x += 40) {
    for (let y = 65; y < BOARD.height - 30; y += 40) context.fillRect(x, y, 1, 1);
  }
  label(context, level.name, 30, 32, '#bac7bd', 15);
  label(context, preview ? 'Pálya előnézete' : formatTime(state.time), 970, 32, MUTED, 13, 'right');
  Object.values(level.edges).forEach((edge) => drawTrack(context, level, edge));
  let entryIndex = 0; let platformIndex = 0;
  Object.values(level.nodes).forEach((node) => {
    if (node.kind === 'entry') {
      const text = `${String.fromCharCode(65 + entryIndex)} bejárat`; entryIndex += 1;
      context.fillStyle = '#b7c7bc'; context.fillRect(node.x - 5, node.y - 8, 6, 16);
      label(context, text, node.x - 15, node.y + 35, MUTED, 13);
    }
    if (node.kind === 'platform') {
      platformIndex += 1;
      context.fillStyle = DESTINATIONS[node.target].color; context.fillRect(node.x - 5, node.y - 27, 12, 54);
      label(context, `${platformIndex}. peron`, node.x + 17, node.y - 7, INK, 13);
      label(context, DESTINATIONS[node.target].name, node.x + 17, node.y + 13, DESTINATIONS[node.target].color, 12);
    }
  });
  Object.keys(level.switches).forEach((id) => drawSwitch(context, level, id, state.switches[id]));
  level.signals.forEach((signal) => drawSignal(context, level, signal, state.signals[signal.id]));
  const warningIds = new Set(state.warnings.flat());
  state.trains.forEach((train) => {
    if (train.status === 'active') {
      if (warningIds.has(train.id)) {
        context.save();
        context.globalAlpha = reducedMotion ? 1 : 0.65 + Math.sin(clock / 140) * 0.3;
        context.setLineDash([7, 5]); context.strokeStyle = '#e8bf64'; context.lineWidth = 2;
        context.beginPath(); context.arc(train.x, train.y, SAFETY.warning / 2, 0, Math.PI * 2); context.stroke();
        context.restore();
      }
      drawTrain(context, train);
    } else if (train.status === 'derailed') {
      line(context, { x: train.x - 8, y: train.y - 8 }, { x: train.x + 8, y: train.y + 8 }, '#ec9865', 3);
      line(context, { x: train.x - 8, y: train.y + 8 }, { x: train.x + 8, y: train.y - 8 }, '#ec9865', 3);
    }
  });
  if (state.collision) drawExplosion(context, state.collision);
  if (!preview && state.status === 'paused') {
    context.fillStyle = '#111a14'; context.fillRect(380, 530, 240, 32);
    label(context, 'Szünet · a váltók állíthatók', 500, 547, '#e8bf64', 14, 'center');
  }
  context.restore();
}

export function hitTest(state, x, y, trainsOnly = false) {
  const level = getLevel(state.levelId);
  if (trainsOnly) {
    const train = state.trains.find((item) => item.status === 'active' && Math.hypot(item.x - x, item.y - y) < 25);
    return train ? { kind: 'train', id: train.id } : null;
  }
  for (const signal of level.signals) {
    const p = signalPosition(level, signal);
    if (Math.hypot(p.x - x, p.y - y) < 22) return { kind: 'signal', id: signal.id };
  }
  for (const id of Object.keys(level.switches)) {
    const node = level.nodes[id];
    if (Math.hypot(node.x - x, node.y - y) < 22) return { kind: 'switch', id };
  }
  return null;
}

function setText(element, value) {
  const text = String(value);
  if (element.textContent !== text) element.textContent = text;
}

export function renderHUD(state, dom) {
  const level = getLevel(state.levelId);
  setText(dom.gameTitle, level.name); setText(dom.gameDifficulty, level.difficulty); setText(dom.gamePlayer, state.playerName);
  setText(dom.hudTime, formatTime(state.time)); setText(dom.hudDelivered, `${state.delivered} / ${level.schedule.length}`);
  setText(dom.hudErrors, state.failed); setText(dom.hudWait, formatTime(state.waitTime));
  const next = level.schedule[state.nextTrain];
  setText(dom.hudNext, next ? formatTime(Math.ceil(Math.max(0, next.at - state.time))) : '—');
  const names = { running: 'Fut a menet', paused: 'Szünet', won: 'Hibátlan menet', completed: 'Hibás menet', lost: 'Ütközés' };
  setText(dom.gameStatus, names[state.status]); dom.gameStatus.dataset.status = state.status;
  dom.pauseButton.disabled = !['running', 'paused'].includes(state.status);
  setText(dom.pauseButton, state.status === 'paused' ? 'Folytatás' : 'Szünet');
  const waiting = state.trains.filter((train) => train.status === 'active' && train.waiting);
  let hint = 'Bal kattintás: váltó / jelző. Jobb kattintás: kézi fék.';
  if (state.time < 2) hint = 'A jelzők kezdetben tilosat mutatnak. Kattints rájuk a szabad jelzéshez.';
  if (waiting.length) hint = `${waiting.map((train) => train.id).join(', ')} várakozik. Ellenőrizd a jelzőket és a kézi fékeket.`;
  if (state.warnings.length) hint = 'Ütközésveszély! Állíts meg egy vonatot jobb kattintással.';
  setText(dom.boardHint, hint);
}

export function renderSchedule(state, container) {
  const level = getLevel(state.levelId);
  const signature = `${state.runId}:${state.levelId}:` + state.trains.map((train) => `${train.id}/${train.status}/${train.brake}/${train.waiting}`).join('|');
  if (container.dataset.signature === signature) return;
  container.dataset.signature = signature;
  const items = level.schedule.map((scheduled) => {
    const train = state.trains.find((item) => item.id === scheduled.id);
    const statuses = { delivered: 'Célba ért', wrong: 'Téves peron', derailed: 'Kisiklott', collided: 'Ütközött' };
    const status = !train ? 'Érkezik' : train.status !== 'active' ? statuses[train.status] : train.brake ? 'Kézi fék' : train.waiting === 'signal' ? 'Tilosnál áll' : 'Halad';
    const item = document.createElement('li'); item.className = 'schedule-item';
    const top = document.createElement('div'); top.className = 'schedule-top';
    const name = document.createElement('strong'); name.textContent = scheduled.id;
    const time = document.createElement('span'); time.className = 'schedule-time'; time.textContent = formatTime(scheduled.at);
    top.append(name, time);
    const bottom = document.createElement('div'); bottom.className = 'schedule-bottom';
    const swatch = document.createElement('span'); swatch.className = 'destination-swatch'; swatch.style.backgroundColor = DESTINATIONS[scheduled.target].color; swatch.setAttribute('aria-hidden', 'true');
    const destination = document.createElement('span'); destination.textContent = DESTINATIONS[scheduled.target].name;
    const info = document.createElement('span'); info.className = 'schedule-state'; info.textContent = status;
    bottom.append(swatch, destination, info); item.append(top, bottom); return item;
  });
  container.replaceChildren(...items);
}

export function renderEvents(state, container) {
  const signature = JSON.stringify(state.logs.slice(0, 4));
  if (container.dataset.signature === signature) return;
  container.dataset.signature = signature;
  container.replaceChildren(...state.logs.slice(0, 4).map((event) => {
    const item = document.createElement('li'); item.dataset.type = event.type;
    const time = document.createElement('time'); time.textContent = formatTime(event.at);
    const text = document.createElement('span'); text.textContent = event.text;
    item.append(time, text); return item;
  }));
}

export function renderRankings(entries, body, empty) {
  empty.hidden = entries.length !== 0;
  body.replaceChildren(...entries.map((entry, index) => {
    const row = document.createElement('tr');
    [index + 1, entry.name, formatTime(entry.time), entry.errors,
      new Intl.DateTimeFormat('hu-HU', { dateStyle: 'short' }).format(new Date(entry.date))].forEach((value) => {
      const cell = document.createElement('td'); cell.textContent = String(value); row.append(cell);
    });
    return row;
  }));
}

export function renderPreview(state, dom) {
  const level = LEVELS.find((item) => item.id === state.levelId);
  setText(dom.previewTitle, level.name); setText(dom.previewDifficulty, level.difficulty);
  setText(dom.previewDescription, level.description);
  dom.previewCanvas.setAttribute('aria-label', `${level.name} vágányrajza. ${level.description}`);
  renderBoard(dom.previewCanvas, state, { preview: true });
}
