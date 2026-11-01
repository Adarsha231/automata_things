import { EPS } from './automaton.js';

/**
 * Thompson's construction: regex AST → ε-NFA.
 * Every fragment has exactly one start and one accept state.
 */
export function thompson(ast, alphabet) {
  let count = 0;
  const transitions = [];
  const fresh = () => count++;
  const edge = (from, to, symbol) => transitions.push({ from, to, symbol });

  function build(node) {
    switch (node.type) {
      case 'sym': {
        const s = fresh();
        const a = fresh();
        edge(s, a, node.value);
        return { s, a };
      }
      case 'any': {
        const s = fresh();
        const a = fresh();
        for (const sym of alphabet) edge(s, a, sym);
        return { s, a };
      }
      case 'eps': {
        const s = fresh();
        const a = fresh();
        edge(s, a, EPS);
        return { s, a };
      }
      case 'empty': {
        return { s: fresh(), a: fresh() };
      }
      case 'cat': {
        const l = build(node.left);
        const r = build(node.right);
        edge(l.a, r.s, EPS);
        return { s: l.s, a: r.a };
      }
      case 'alt': {
        const s = fresh();
        const l = build(node.left);
        const r = build(node.right);
        const a = fresh();
        edge(s, l.s, EPS);
        edge(s, r.s, EPS);
        edge(l.a, a, EPS);
        edge(r.a, a, EPS);
        return { s, a };
      }
      case 'star': {
        const s = fresh();
        const i = build(node.child);
        const a = fresh();
        edge(s, i.s, EPS);
        edge(s, a, EPS);
        edge(i.a, i.s, EPS);
        edge(i.a, a, EPS);
        return { s, a };
      }
      case 'plus': {
        const s = fresh();
        const i = build(node.child);
        const a = fresh();
        edge(s, i.s, EPS);
        edge(i.a, i.s, EPS);
        edge(i.a, a, EPS);
        return { s, a };
      }
      case 'opt': {
        const s = fresh();
        const i = build(node.child);
        const a = fresh();
        edge(s, i.s, EPS);
        edge(s, a, EPS);
        edge(i.a, a, EPS);
        return { s, a };
      }
      default:
        throw new Error(`Unknown regex node: ${node.type}`);
    }
  }

  const frag = build(ast);
  return {
    type: 'ENFA',
    alphabet: [...alphabet],
    states: Array.from({ length: count }, (_, i) => i),
    start: frag.s,
    finals: [frag.a],
    transitions,
  };
}
