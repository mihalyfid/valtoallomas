export const BOARD = Object.freeze({ width: 1000, height: 580 });
export const SAFETY = Object.freeze({ warning: 75, collision: 29, signalStop: 23 });
export const DESTINATIONS = Object.freeze({
  red: { name: 'Piros', color: '#f07570' },
  amber: { name: 'Sárga', color: '#e8bf64' },
  blue: { name: 'Kék', color: '#79b5e7' },
  green: { name: 'Zöld', color: '#88c6a1' },
});

function deepFreeze(value) {
  Object.values(value).forEach((child) => {
    if (child && typeof child === 'object') deepFreeze(child);
  });
  return Object.freeze(value);
}

function makeLevel(definition) {
  const nodes = Object.fromEntries(definition.nodes.map(([id, x, y, kind = 'junction', target = null]) =>
    [id, { id, x, y, kind, target }]));
  const edges = Object.fromEntries(definition.edges.map(([id, from, to]) => {
    const a = nodes[from];
    const b = nodes[to];
    return [id, { id, from, to, length: Math.hypot(b.x - a.x, b.y - a.y) }];
  }));
  const signals = definition.signals.map(([id, edge, fraction]) => ({
    id, edge, distance: edges[edge].length * fraction,
  }));
  return deepFreeze({ ...definition, nodes, edges, signals });
}

export const LEVELS = deepFreeze([
  makeLevel({
    id: 'easy', name: 'Kitérő vágány', difficulty: 'Könnyű', number: '01',
    description: 'Egy bejárat, fővágány és kitérő. Hangold össze a két váltót.',
    nodes: [
      ['entry', 55, 220, 'entry'], ['v1', 260, 220, 'switch'],
      ['main', 460, 220], ['b1', 370, 410], ['b2', 535, 410],
      ['v2', 665, 220, 'switch'], ['p1', 900, 220, 'platform', 'red'],
      ['p2', 900, 410, 'platform', 'blue'],
    ],
    edges: [
      ['in', 'entry', 'v1'], ['main1', 'v1', 'main'], ['main2', 'main', 'v2'],
      ['side1', 'v1', 'b1'], ['side2', 'b1', 'b2'], ['side3', 'b2', 'v2'],
      ['red', 'v2', 'p1'], ['blue', 'v2', 'p2'],
    ],
    switches: {
      v1: { label: 'V1', routes: [
        { from: ['in'], to: 'main1', label: 'Fővágány' },
        { from: ['in'], to: 'side1', label: 'Kitérő' },
      ] },
      v2: { label: 'V2', routes: [
        { from: ['main2'], to: 'red', label: 'Fővágány → Piros' },
        { from: ['side3'], to: 'blue', label: 'Kitérő → Kék' },
      ] },
    },
    signals: [['J1', 'in', 0.62], ['J2', 'main2', 0.60], ['J3', 'side3', 0.59]],
    schedule: [
      { id: 'SZ101', at: 2, edge: 'in', speed: 64, target: 'red' },
      { id: 'TE102', at: 24, edge: 'in', speed: 55, target: 'blue' },
      { id: 'GY103', at: 46, edge: 'in', speed: 76, target: 'red' },
      { id: 'SZ104', at: 68, edge: 'in', speed: 66, target: 'blue' },
    ],
  }),
  makeLevel({
    id: 'medium', name: 'Rendező-pályaudvar', difficulty: 'Közepes', number: '02',
    description: 'Két bejárat és keresztező vágányok. A keresztezéseknél is figyelj a forgalomra.',
    nodes: [
      ['north', 55, 170, 'entry'], ['south', 55, 440, 'entry'],
      ['v1', 270, 170, 'switch'], ['v2', 270, 440, 'switch'],
      ['v3', 650, 340, 'switch'], ['p1', 900, 100, 'platform', 'red'],
      ['p2', 900, 270, 'platform', 'amber'], ['p3', 900, 440, 'platform', 'blue'],
    ],
    edges: [
      ['inA', 'north', 'v1'], ['inB', 'south', 'v2'],
      ['directBlue', 'v1', 'p3'], ['directRed', 'v2', 'p1'],
      ['hubA', 'v1', 'v3'], ['hubB', 'v2', 'v3'],
      ['red', 'v3', 'p1'], ['amber', 'v3', 'p2'], ['blue', 'v3', 'p3'],
    ],
    switches: {
      v1: { label: 'V1', routes: [
        { from: ['inA'], to: 'directBlue', label: 'Kék közvetlen' },
        { from: ['inA'], to: 'hubA', label: 'V3 felé' },
      ] },
      v2: { label: 'V2', routes: [
        { from: ['inB'], to: 'directRed', label: 'Piros közvetlen' },
        { from: ['inB'], to: 'hubB', label: 'V3 felé' },
      ] },
      v3: { label: 'V3', routes: ['red', 'amber', 'blue'].map((target) =>
        ({ from: ['hubA', 'hubB'], to: target, label: DESTINATIONS[target].name })) },
    },
    signals: [['J1', 'inA', 0.62], ['J2', 'inB', 0.62], ['J3', 'hubA', 0.76], ['J4', 'hubB', 0.65]],
    schedule: [
      { id: 'SZ201', at: 2, edge: 'inA', speed: 70, target: 'blue' },
      { id: 'TE202', at: 12, edge: 'inB', speed: 60, target: 'red' },
      { id: 'GY203', at: 22, edge: 'inA', speed: 82, target: 'amber' },
      { id: 'SZ204', at: 32, edge: 'inB', speed: 68, target: 'blue' },
      { id: 'GY205', at: 42, edge: 'inA', speed: 78, target: 'red' },
    ],
  }),
  makeLevel({
    id: 'hard', name: 'Fejpályaudvari csúcsforgalom', difficulty: 'Nehéz', number: '03',
    description: 'Négy peron, két fővonal és sűrű menetrend. A váltókat a következő vonatra készítsd elő.',
    nodes: [
      ['north', 55, 160, 'entry'], ['south', 55, 420, 'entry'],
      ['v1', 245, 160, 'switch'], ['v2', 245, 420, 'switch'],
      ['v3', 565, 175, 'switch'], ['v4', 565, 415, 'switch'],
      ['p1', 900, 95, 'platform', 'red'], ['p2', 900, 235, 'platform', 'amber'],
      ['p3', 900, 375, 'platform', 'blue'], ['p4', 900, 515, 'platform', 'green'],
    ],
    edges: [
      ['inA', 'north', 'v1'], ['inB', 'south', 'v2'],
      ['upperA', 'v1', 'v3'], ['lowerA', 'v1', 'v4'],
      ['upperB', 'v2', 'v3'], ['lowerB', 'v2', 'v4'],
      ['red', 'v3', 'p1'], ['amber', 'v3', 'p2'],
      ['blue', 'v4', 'p3'], ['green', 'v4', 'p4'],
    ],
    switches: {
      v1: { label: 'V1', routes: [
        { from: ['inA'], to: 'upperA', label: '1–2. peron felé' },
        { from: ['inA'], to: 'lowerA', label: '3–4. peron felé' },
      ] },
      v2: { label: 'V2', routes: [
        { from: ['inB'], to: 'lowerB', label: '3–4. peron felé' },
        { from: ['inB'], to: 'upperB', label: '1–2. peron felé' },
      ] },
      v3: { label: 'V3', routes: ['red', 'amber'].map((target) =>
        ({ from: ['upperA', 'upperB'], to: target, label: DESTINATIONS[target].name })) },
      v4: { label: 'V4', routes: ['blue', 'green'].map((target) =>
        ({ from: ['lowerA', 'lowerB'], to: target, label: DESTINATIONS[target].name })) },
    },
    signals: [
      ['J1', 'inA', 0.60], ['J2', 'inB', 0.60],
      ['J3', 'upperA', 0.73], ['J4', 'lowerA', 0.72],
      ['J5', 'upperB', 0.72], ['J6', 'lowerB', 0.73],
    ],
    schedule: [
      { id: 'SZ301', at: 2, edge: 'inA', speed: 76, target: 'red' },
      { id: 'TE302', at: 5, edge: 'inB', speed: 72, target: 'blue' },
      { id: 'GY303', at: 13, edge: 'inA', speed: 84, target: 'amber' },
      { id: 'SZ304', at: 16, edge: 'inB', speed: 78, target: 'green' },
      { id: 'GY305', at: 24, edge: 'inA', speed: 88, target: 'blue' },
      { id: 'TE306', at: 30, edge: 'inB', speed: 80, target: 'red' },
    ],
  }),
]);

export function getLevel(id) {
  const level = LEVELS.find((item) => item.id === id);
  if (!level) throw new Error('Ismeretlen pálya.');
  return level;
}

export function createGame(levelId, playerName, runId = '') {
  const level = getLevel(levelId);
  const name = playerName.trim();
  if (!name || name.length > 40) throw new Error('Adj meg egy 1–40 karakteres játékosnevet.');
  return {
    runId, levelId, playerName: name, status: 'running', time: 0, nextTrain: 0,
    switches: Object.fromEntries(Object.keys(level.switches).map((id) => [id, 0])),
    signals: Object.fromEntries(level.signals.map(({ id }) => [id, false])),
    trains: [], delivered: 0, failed: 0, wrong: 0, derailed: 0, waitTime: 0,
    collision: null, warnings: [], logs: [{ at: 0, text: 'Menet indítva. A jelzők kezdetben tilosat mutatnak.', type: 'info' }],
  };
}

export function logEvent(state, text, type = 'info') {
  state.logs.unshift({ at: state.time, text, type });
  state.logs = state.logs.slice(0, 8);
}

export function pointOnEdge(level, edgeId, distance) {
  const edge = level.edges[edgeId];
  const a = level.nodes[edge.from];
  const b = level.nodes[edge.to];
  const fraction = Math.max(0, Math.min(1, distance / edge.length));
  return { x: a.x + (b.x - a.x) * fraction, y: a.y + (b.y - a.y) * fraction,
    angle: Math.atan2(b.y - a.y, b.x - a.x) };
}

export function signalPosition(level, signal) {
  const point = pointOnEdge(level, signal.edge, signal.distance);
  return { ...point, x: point.x + Math.sin(point.angle) * 27,
    y: point.y - Math.cos(point.angle) * 27 };
}

function updatePosition(level, train) {
  Object.assign(train, pointOnEdge(level, train.edge, train.distance));
}

export function cycleSwitch(state, id) {
  if (!['running', 'paused'].includes(state.status)) return;
  const turnout = getLevel(state.levelId).switches[id];
  if (!turnout) return;
  state.switches[id] = (state.switches[id] + 1) % turnout.routes.length;
  logEvent(state, `${turnout.label}: ${turnout.routes[state.switches[id]].label}.`);
}

export function toggleSignal(state, id) {
  if (!['running', 'paused'].includes(state.status) || !(id in state.signals)) return;
  state.signals[id] = !state.signals[id];
  logEvent(state, `${id}: ${state.signals[id] ? 'szabad' : 'tilos'}.`);
}

export function toggleBrake(state, id) {
  if (!['running', 'paused'].includes(state.status)) return;
  const train = state.trains.find((item) => item.id === id && item.status === 'active');
  if (!train) return;
  train.brake = !train.brake;
  train.waiting = train.brake ? 'manual' : null;
  logEvent(state, `${id}: kézi fék ${train.brake ? 'behúzva' : 'feloldva'}.`);
}

function processArrival(state, train, node) {
  if (node.kind === 'platform') {
    const correct = node.target === train.target;
    train.status = correct ? 'delivered' : 'wrong';
    if (correct) state.delivered += 1;
    else { state.failed += 1; state.wrong += 1; }
    logEvent(state, `${train.id}: ${correct ? 'helyesen célba ért' : 'téves peronra érkezett'}.`, correct ? 'success' : 'error');
    return null;
  }
  const level = getLevel(state.levelId);
  let next;
  if (node.kind === 'switch') {
    const route = level.switches[node.id].routes[state.switches[node.id]];
    if (route.from.includes(train.edge)) next = level.edges[route.to];
  } else {
    next = Object.values(level.edges).find((edge) => edge.from === node.id);
  }
  if (!next) {
    train.status = 'derailed'; state.failed += 1; state.derailed += 1;
    logEvent(state, `${train.id}: kisiklott. Nincs csatlakozó váltóút.`, 'error');
  }
  return next;
}

function moveTrain(state, level, train, seconds) {
  train.waiting = null;
  if (train.brake) { train.waiting = 'manual'; state.waitTime += seconds; return; }
  let travel = train.speed * seconds;

  while (travel > 0 && train.status === 'active') {
    const edge = level.edges[train.edge];
    const signal = level.signals.find((item) => item.edge === train.edge);
    const stop = signal ? Math.max(0, signal.distance - SAFETY.signalStop) : Infinity;
    if (signal && !state.signals[signal.id] && train.distance <= stop + 0.001 && train.distance + travel >= stop) {
      train.distance = stop; train.waiting = 'signal'; state.waitTime += seconds;
      updatePosition(level, train); return;
    }
    const remaining = edge.length - train.distance;
    if (travel < remaining) { train.distance += travel; travel = 0; }
    else {
      train.distance = edge.length; travel -= remaining;
      updatePosition(level, train);
      const next = processArrival(state, train, level.nodes[edge.to]);
      if (!next) return;
      train.edge = next.id; train.distance = 0;
    }
    updatePosition(level, train);
  }
}

function detectCollisions(state) {
  const active = state.trains.filter((train) => train.status === 'active');
  state.warnings = [];
  for (let i = 0; i < active.length; i += 1) {
    for (let j = i + 1; j < active.length; j += 1) {
      const a = active[i]; const b = active[j];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance < SAFETY.warning) state.warnings.push([a.id, b.id]);
      if (distance < SAFETY.collision) {
        state.collision = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, ids: [a.id, b.id] };
        a.status = 'collided'; b.status = 'collided'; state.failed += 2;
        state.status = 'lost';
        logEvent(state, `Ütközés: ${a.id} és ${b.id}. A menet leállt.`, 'error');
        return;
      }
    }
  }
}

export function advanceGame(state, seconds) {
  if (!Number.isFinite(seconds) || seconds < 0 || seconds > 1) throw new Error('Érvénytelen időlépés.');
  if (state.status !== 'running') return;
  const level = getLevel(state.levelId);
  let remaining = seconds;

  while (remaining > 0.0000001 && state.status === 'running') {
    const step = Math.min(remaining, 1 / 120);
    remaining -= step; state.time += step;
    while (state.nextTrain < level.schedule.length && level.schedule[state.nextTrain].at <= state.time + 0.0000001) {
      const item = level.schedule[state.nextTrain];
      const train = { ...item, distance: 0, status: 'active', brake: false, waiting: null };
      updatePosition(level, train); state.trains.push(train); state.nextTrain += 1;
      logEvent(state, `${train.id} belépett. Cél: ${DESTINATIONS[train.target].name}.`);
    }
    state.trains.filter((train) => train.status === 'active').forEach((train) => moveTrain(state, level, train, step));
    detectCollisions(state);
    if (state.status === 'running' && state.nextTrain === level.schedule.length && state.trains.every((train) => train.status !== 'active')) {
      state.status = state.failed === 0 ? 'won' : 'completed';
      logEvent(state, state.failed === 0 ? 'Minden vonat helyesen célba ért.' : 'A menetrend véget ért, de a menet hibákat tartalmaz.', state.failed === 0 ? 'success' : 'error');
    }
  }
}

export function formatTime(seconds) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`;
}

export function restoreGame(payload) {
  const fail = () => { throw new Error('A mentés sérült vagy nem támogatott. Az eredeti mentés megmaradt.'); };
  const finite = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;
  const integer = (value, min, max) => Number.isInteger(value) && finite(value, min, max);
  if (!payload || payload.version !== 1 || !payload.state || typeof payload.state !== 'object') fail();
  const input = payload.state;
  if (typeof input.playerName !== 'string' || !input.playerName.trim() || input.playerName.length > 40 ||
    typeof input.runId !== 'string' || input.runId.length > 100) fail();
  const level = getLevel(input.levelId);
  const result = createGame(level.id, input.playerName, input.runId);
  if (!['running', 'paused', 'won', 'completed', 'lost'].includes(input.status) ||
    !finite(input.time, 0, 86400) || !finite(input.waitTime, 0, 86400 * 6) ||
    !integer(input.nextTrain, 0, level.schedule.length) ||
    !Array.isArray(input.trains) || input.trains.length !== input.nextTrain ||
    !input.switches || !input.signals) fail();
  for (const [id, turnout] of Object.entries(level.switches)) {
    if (!integer(input.switches[id], 0, turnout.routes.length - 1)) fail();
    result.switches[id] = input.switches[id];
  }
  for (const signal of level.signals) {
    if (typeof input.signals[signal.id] !== 'boolean') fail();
    result.signals[signal.id] = input.signals[signal.id];
  }
  result.trains = input.trains.map((train, index) => {
    if (!train || typeof train !== 'object') fail();
    const scheduled = level.schedule[index];
    const edge = level.edges[train.edge];
    if (!edge || train.id !== scheduled.id || train.target !== scheduled.target || train.speed !== scheduled.speed ||
      scheduled.at > input.time + 0.01 || !finite(train.distance, 0, edge.length) ||
      !['active', 'delivered', 'wrong', 'derailed', 'collided'].includes(train.status) ||
      typeof train.brake !== 'boolean' || ![null, 'manual', 'signal'].includes(train.waiting)) fail();
    const clean = { ...scheduled, edge: edge.id, distance: train.distance,
      status: train.status, brake: train.brake, waiting: train.waiting };
    updatePosition(level, clean);
    if (!finite(train.x, 0, BOARD.width) || !finite(train.y, 0, BOARD.height) ||
      Math.hypot(clean.x - train.x, clean.y - train.y) > 0.1) fail();
    if (['delivered', 'wrong'].includes(clean.status)) {
      const end = level.nodes[edge.to];
      if (end.kind !== 'platform' || Math.abs(clean.distance - edge.length) > 0.01 ||
        (clean.status === 'delivered') !== (end.target === clean.target)) fail();
    }
    return clean;
  });
  result.delivered = result.trains.filter((train) => train.status === 'delivered').length;
  result.wrong = result.trains.filter((train) => train.status === 'wrong').length;
  result.derailed = result.trains.filter((train) => train.status === 'derailed').length;
  result.failed = result.trains.filter((train) => ['wrong', 'derailed', 'collided'].includes(train.status)).length;
  for (const key of ['delivered', 'wrong', 'derailed', 'failed']) if (input[key] !== result[key]) fail();
  if (input.nextTrain < level.schedule.length && level.schedule[input.nextTrain].at <= input.time - 0.01) fail();
  const finished = result.trains.every((train) => train.status !== 'active') && input.nextTrain === level.schedule.length;
  if ((input.status === 'won' && (!finished || result.failed !== 0)) ||
    (input.status === 'completed' && (!finished || result.failed === 0)) ||
    (['running', 'paused'].includes(input.status) && finished)) fail();
  result.time = input.time; result.waitTime = input.waitTime;
  result.nextTrain = input.nextTrain; result.status = input.status;
  if (input.status === 'lost') {
    const hit = result.trains.filter((train) => train.status === 'collided');
    if (hit.length !== 2 || Math.hypot(hit[0].x - hit[1].x, hit[0].y - hit[1].y) >= SAFETY.collision) fail();
    result.collision = { x: (hit[0].x + hit[1].x) / 2, y: (hit[0].y + hit[1].y) / 2, ids: hit.map((train) => train.id) };
  } else if (result.trains.some((train) => train.status === 'collided')) fail();
  result.logs = [{ at: result.time, text: 'Mentett játékállás visszatöltve.', type: 'info' }];
  return result;
}
