import { EPS, epsilonClosure, move, stateName } from './automaton.js';

const names = (states) => `{${[...states].map(stateName).join(', ')}}`;
const fmt = (aut, states) => (aut.type === 'DFA' ? stateName([...states][0]) : names(states));

/** Depth-first search for one accepting run (used to show a witness path). */
function findAcceptingPath(aut, input) {
  const finals = new Set(aut.finals);
  const seen = new Set();
  const out = new Map();
  for (const t of aut.transitions) {
    if (!out.has(t.from)) out.set(t.from, []);
    out.get(t.from).push(t);
  }
  function dfs(state, pos, path) {
    const key = `${state}|${pos}`;
    if (seen.has(key)) return null;
    seen.add(key);
    if (pos === input.length && finals.has(state)) return path;
    for (const t of out.get(state) ?? []) {
      let r = null;
      if (t.symbol === EPS) r = dfs(t.to, pos, [...path, t]);
      else if (pos < input.length && t.symbol === input[pos]) r = dfs(t.to, pos + 1, [...path, t]);
      if (r) return r;
    }
    return null;
  }
  return dfs(aut.start, 0, []);
}

/**
 * Step-by-step simulation. Tracks the full set of active states, applying
 * ε-closure for ε-NFAs. Returns { steps, accepted, reason, path } or { error }.
 */
export function simulate(aut, rawInput) {
  const input = [...rawInput.trim() === 'ε' ? '' : rawInput];
  const invalid = [...new Set(input.filter((c) => !aut.alphabet.includes(c)))];
  if (invalid.length) {
    return {
      error: `Symbol${invalid.length > 1 ? 's' : ''} ${invalid.map((c) => `"${c}"`).join(', ')} not in the alphabet {${aut.alphabet.join(', ')}}.`,
    };
  }
  const finals = new Set(aut.finals);
  const hasEps = aut.type === 'ENFA';

  let active = epsilonClosure(aut, [aut.start]);
  const steps = [
    {
      index: 0,
      symbol: null,
      active: [...active].sort((a, b) => a - b),
      edges: [],
      description: hasEps
        ? `Start in ${stateName(aut.start)}; its ε-closure is ${names(active)}.`
        : `Start in ${stateName(aut.start)}.`,
    },
  ];

  let diedAt = -1;
  for (let i = 0; i < input.length; i++) {
    const sym = input[i];
    const edges = aut.transitions.filter((t) => active.has(t.from) && t.symbol === sym);
    const moved = move(aut, active, sym);
    const next = epsilonClosure(aut, moved);
    const epsEdges = hasEps
      ? aut.transitions.filter((t) => t.symbol === EPS && next.has(t.from) && next.has(t.to))
      : [];
    let description;
    if (next.size === 0) {
      description = `Read "${sym}": no transition from ${fmt(aut, active)} — the run dies here.`;
      if (diedAt < 0) diedAt = i;
    } else if (hasEps) {
      description = `Read "${sym}": ${names(active)} → ${names(moved)}, then ε-closure → ${names(next)}.`;
    } else if (aut.type === 'DFA') {
      description = `Read "${sym}": ${fmt(aut, active)} → ${fmt(aut, next)}.`;
    } else {
      description = `Read "${sym}": ${names(active)} → ${names(next)}.`;
    }
    active = next;
    steps.push({
      index: i + 1,
      symbol: sym,
      active: [...active].sort((a, b) => a - b),
      edges: [...edges, ...epsEdges],
      description,
    });
  }

  const hitting = [...active].filter((q) => finals.has(q));
  const accepted = hitting.length > 0;
  let reason;
  if (accepted) {
    reason = `All ${input.length} symbol${input.length === 1 ? '' : 's'} consumed and ${
      aut.type === 'DFA' ? stateName(hitting[0]) : names(hitting)
    } ${hitting.length > 1 ? 'are' : 'is'} a final state, so the string is accepted.`;
    if (input.length === 0) reason = `The empty string leaves the automaton in ${names(hitting)}, a final state, so it is accepted.`;
  } else if (diedAt >= 0) {
    reason = `No state could read "${input[diedAt]}" (symbol ${diedAt + 1}), so every run died before the end. The string is rejected.`;
  } else {
    reason =
      aut.type === 'DFA'
        ? `The input was fully read and the automaton stopped in ${fmt(aut, active)}, which is not a final state. The string is rejected.`
        : `The input was fully read but the active states ${names(active)} contain no final state. The string is rejected.`;
  }

  const path = accepted ? findAcceptingPath(aut, input) : null;
  return { steps, accepted, reason, path, input };
}

/** Human-readable accepting path, e.g. "q0 –1→ q1 –0→ q2". */
export function formatPath(aut, path) {
  if (!path) return '';
  let out = stateName(aut.start);
  for (const t of path) out += ` –${t.symbol}→ ${stateName(t.to)}`;
  return out;
}

/** A few short strings the automaton accepts / rejects, for quick demos. */
export function sampleStrings(aut, { count = 4, maxLen = 5 } = {}) {
  const accepted = [];
  const rejected = [];
  if (aut.alphabet.length === 0) return { accepted, rejected };
  let level = [''];
  let tested = 0;
  for (let len = 0; len <= maxLen && (accepted.length < count || rejected.length < count); len++) {
    for (const s of level) {
      if (tested++ > 3000) return { accepted, rejected };
      const r = simulate(aut, s);
      if (r.accepted && accepted.length < count) accepted.push(s);
      if (!r.accepted && rejected.length < count) rejected.push(s);
    }
    if (len === maxLen) break;
    level = level.flatMap((s) => aut.alphabet.map((a) => s + a));
    if (level.length > 1024) level = level.slice(0, 1024);
  }
  return { accepted, rejected };
}
