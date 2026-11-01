// Core automaton data structure and algorithms.
//
// Shape:
//   { type: 'DFA' | 'NFA' | 'ENFA',
//     alphabet: string[],
//     states: number[],          // 0..n-1, displayed as q0..q(n-1)
//     start: number,
//     finals: number[],
//     transitions: { from, to, symbol }[]   // symbol === EPS for ε-moves
//   }

export const EPS = 'ε';

export const stateName = (i) => `q${i}`;

export function dedupeTransitions(list) {
  const seen = new Set();
  const out = [];
  for (const t of list) {
    const k = `${t.from}|${t.symbol}|${t.to}`;
    if (!seen.has(k)) {
      seen.add(k);
      out.push({ from: t.from, to: t.to, symbol: t.symbol });
    }
  }
  return out;
}

const indexCache = new WeakMap();

function indexOf(aut) {
  let idx = indexCache.get(aut);
  if (idx) return idx;
  idx = new Map();
  for (const t of aut.transitions) {
    const k = `${t.from}|${t.symbol}`;
    if (!idx.has(k)) idx.set(k, []);
    idx.get(k).push(t.to);
  }
  indexCache.set(aut, idx);
  return idx;
}

/** Targets reachable from state `s` by one transition labelled `sym`. */
export function targets(aut, s, sym) {
  return indexOf(aut).get(`${s}|${sym}`) ?? [];
}

/** ε-closure of a set of states. */
export function epsilonClosure(aut, states) {
  const result = new Set(states);
  const stack = [...result];
  while (stack.length) {
    const s = stack.pop();
    for (const t of targets(aut, s, EPS)) {
      if (!result.has(t)) {
        result.add(t);
        stack.push(t);
      }
    }
  }
  return result;
}

/** States reachable from `states` by reading one `sym` (no closure applied). */
export function move(aut, states, sym) {
  const out = new Set();
  for (const s of states) for (const t of targets(aut, s, sym)) out.add(t);
  return out;
}

const symbolRank = (aut, sym) => (sym === EPS ? 1e9 : aut.alphabet.indexOf(sym));

/**
 * Drops unreachable states and renumbers the rest in BFS order from the start
 * state, so diagrams and tables always read q0, q1, q2, ... left to right.
 */
export function normalize(aut) {
  const outgoing = new Map();
  for (const t of aut.transitions) {
    if (!outgoing.has(t.from)) outgoing.set(t.from, []);
    outgoing.get(t.from).push(t);
  }
  for (const list of outgoing.values()) {
    list.sort((a, b) => symbolRank(aut, a.symbol) - symbolRank(aut, b.symbol) || a.to - b.to);
  }
  const order = [aut.start];
  const id = new Map([[aut.start, 0]]);
  for (let i = 0; i < order.length; i++) {
    for (const t of outgoing.get(order[i]) ?? []) {
      if (!id.has(t.to)) {
        id.set(t.to, order.length);
        order.push(t.to);
      }
    }
  }
  const transitions = dedupeTransitions(
    aut.transitions
      .filter((t) => id.has(t.from))
      .map((t) => ({ from: id.get(t.from), to: id.get(t.to), symbol: t.symbol })),
  ).sort(
    (a, b) => a.from - b.from || symbolRank(aut, a.symbol) - symbolRank(aut, b.symbol) || a.to - b.to,
  );
  return {
    type: aut.type,
    alphabet: [...aut.alphabet],
    states: order.map((_, i) => i),
    start: 0,
    finals: aut.finals
      .filter((f) => id.has(f))
      .map((f) => id.get(f))
      .sort((a, b) => a - b),
    transitions,
  };
}

/** States from which no final state can be reached ("trap"/dead states). */
export function findDeadStates(aut) {
  const rev = new Map();
  for (const t of aut.transitions) {
    if (!rev.has(t.to)) rev.set(t.to, []);
    rev.get(t.to).push(t.from);
  }
  const alive = new Set(aut.finals);
  const stack = [...alive];
  while (stack.length) {
    const s = stack.pop();
    for (const p of rev.get(s) ?? []) {
      if (!alive.has(p)) {
        alive.add(p);
        stack.push(p);
      }
    }
  }
  return new Set(aut.states.filter((s) => !alive.has(s)));
}

/** Remove states that cannot reach a final state (keeps the start state). */
export function trimUseless(aut) {
  const dead = findDeadStates(aut);
  const keep = (s) => !dead.has(s) || s === aut.start;
  return normalize({
    ...aut,
    transitions: aut.transitions.filter((t) => keep(t.from) && keep(t.to)),
  });
}

/** Add a trap state so every state has exactly one move per symbol. */
export function completeDFA(dfa) {
  const missing = [];
  for (const s of dfa.states) {
    for (const a of dfa.alphabet) {
      if (targets(dfa, s, a).length === 0) missing.push([s, a]);
    }
  }
  if (missing.length === 0) return dfa;
  const trap = Math.max(...dfa.states) + 1;
  const transitions = [...dfa.transitions];
  for (const [s, a] of missing) transitions.push({ from: s, to: trap, symbol: a });
  for (const a of dfa.alphabet) transitions.push({ from: trap, to: trap, symbol: a });
  return { ...dfa, states: [...dfa.states, trap], transitions };
}

/** Moore partition-refinement minimisation of a DFA. */
export function minimizeDFA(dfa) {
  const d = normalize(completeDFA(dfa));
  const finals = new Set(d.finals);
  const delta = d.states.map((s) => d.alphabet.map((a) => targets(d, s, a)[0]));
  let block = d.states.map((s) => (finals.has(s) ? 1 : 0));
  let count = new Set(block).size;
  for (;;) {
    const sigs = new Map();
    const next = d.states.map((s) => {
      const sig = `${block[s]}|${delta[s].map((t) => block[t]).join(',')}`;
      if (!sigs.has(sig)) sigs.set(sig, sigs.size);
      return sigs.get(sig);
    });
    const nextCount = sigs.size;
    block = next;
    if (nextCount === count) break;
    count = nextCount;
  }
  const transitions = d.transitions.map((t) => ({ from: block[t.from], to: block[t.to], symbol: t.symbol }));
  return normalize({
    type: 'DFA',
    alphabet: d.alphabet,
    states: [...new Set(block)],
    start: block[d.start],
    finals: [...new Set(d.finals.map((f) => block[f]))],
    transitions,
  });
}

export class TooLargeError extends Error {}

/**
 * Subset construction. Works for NFAs and ε-NFAs (ε-closure is applied).
 * Returns a DFA that is partial (missing moves go to the empty set) plus the
 * subset each DFA state stands for.
 */
export function subsetConstruction(aut, maxStates = 200) {
  const key = (set) => [...set].sort((a, b) => a - b).join(',');
  const startSet = epsilonClosure(aut, [aut.start]);
  const ids = new Map([[key(startSet), 0]]);
  const sets = [startSet];
  const finals = new Set(aut.finals);
  const transitions = [];
  for (let i = 0; i < sets.length; i++) {
    for (const a of aut.alphabet) {
      const target = epsilonClosure(aut, move(aut, sets[i], a));
      if (target.size === 0) continue;
      const k = key(target);
      if (!ids.has(k)) {
        if (sets.length >= maxStates) {
          throw new TooLargeError(
            `The equivalent DFA would need more than ${maxStates} states, which is too many to draw legibly.`,
          );
        }
        ids.set(k, sets.length);
        sets.push(target);
      }
      transitions.push({ from: i, to: ids.get(k), symbol: a });
    }
  }
  const dfa = {
    type: 'DFA',
    alphabet: [...aut.alphabet],
    states: sets.map((_, i) => i),
    start: 0,
    finals: sets.map((s, i) => ([...s].some((q) => finals.has(q)) ? i : -1)).filter((i) => i >= 0),
    transitions,
  };
  return { dfa, subsets: sets.map((s) => [...s].sort((a, b) => a - b)) };
}

/** ε-NFA → NFA by ε-elimination (same states, ε-free transitions). */
export function removeEpsilon(enfa) {
  const finals = new Set(enfa.finals);
  const transitions = [];
  const newFinals = [];
  for (const p of enfa.states) {
    const closure = epsilonClosure(enfa, [p]);
    if ([...closure].some((q) => finals.has(q))) newFinals.push(p);
    for (const a of enfa.alphabet) {
      for (const t of epsilonClosure(enfa, move(enfa, closure, a))) {
        transitions.push({ from: p, to: t, symbol: a });
      }
    }
  }
  return trimUseless(
    normalize({
      type: 'NFA',
      alphabet: enfa.alphabet,
      states: enfa.states,
      start: enfa.start,
      finals: newFinals,
      transitions: dedupeTransitions(transitions),
    }),
  );
}
