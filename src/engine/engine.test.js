import { describe, expect, it } from 'vitest';
import { generate, interpret } from './generate.js';
import { simulate, sampleStrings } from './simulate.js';
import { parseRegex } from './regex.js';
import { EXAMPLES } from './examples.js';
import { findDeadStates } from './automaton.js';

const TYPES = ['DFA', 'NFA', 'ENFA'];

function allStrings(alphabet, maxLen) {
  let level = [''];
  const out = [''];
  for (let l = 0; l < maxLen; l++) {
    level = level.flatMap((s) => alphabet.map((a) => s + a));
    out.push(...level);
  }
  return out;
}

function expectEquivalent(form, predicate, maxLen = 7) {
  for (const type of TYPES) {
    const r = generate({ ...form, type });
    expect(r.ok, `${form.text} (${type}): ${r.error?.message}`).toBe(true);
    for (const s of allStrings(r.automaton.alphabet, maxLen)) {
      const got = simulate(r.automaton, s).accepted;
      expect(got, `${type} "${form.text}" on "${s}"`).toBe(predicate(s));
    }
  }
}

describe('regular expressions → automata (vs JavaScript RegExp)', () => {
  const cases = ['(0|1)*01', '(a|b)*abb', 'a(b|c)*', '(ab)+', 'a?b*', '(0|1)*1(0|1)(0|1)', '0*1*', '(00|11)*', '(a|b)*a(a|b)', 'a|b|ab'];
  for (const rx of cases) {
    it(rx, () => {
      const re = new RegExp(`^(?:${rx})$`);
      expectEquivalent({ inputType: 'regex', text: rx, alphabet: '' }, (s) => re.test(s));
    });
  }

  it('supports ε, wildcard and explicit alphabets', () => {
    expectEquivalent({ inputType: 'regex', text: '(a|ε)b', alphabet: '' }, (s) => /^(?:a|)b$/.test(s));
    expectEquivalent({ inputType: 'regex', text: '.a', alphabet: 'a, b' }, (s) => /^[ab]a$/.test(s));
  });
});

describe('formal language templates', () => {
  const count = (s, c) => [...s].filter((x) => x === c).length;
  const cases = [
    ['All binary strings ending with 01', (s) => s.endsWith('01')],
    ['All binary strings containing 101', (s) => s.includes('101')],
    ['Binary strings with an even number of 0s', (s) => count(s, '0') % 2 === 0],
    ['Binary strings starting with 1', (s) => s.startsWith('1')],
    ['Binary strings containing an even number of 1s', (s) => count(s, '1') % 2 === 0],
    ['strings with an odd number of 1s', (s) => count(s, '1') % 2 === 1],
    ['binary strings that do not contain 11', (s) => !s.includes('11')],
    ['binary strings where the number of 0s is divisible by 3', (s) => count(s, '0') % 3 === 0],
    ['binary strings of even length', (s) => s.length % 2 === 0],
    ['binary strings of length exactly 3', (s) => s.length === 3],
    ['binary strings whose length is divisible by 3', (s) => s.length % 3 === 0],
  ];
  for (const [text, pred] of cases) {
    it(text, () => expectEquivalent({ inputType: 'language', text, alphabet: '' }, pred));
  }

  it('works over a custom alphabet', () => {
    expectEquivalent({ inputType: 'language', text: 'strings over {a, b} ending with ab', alphabet: '' }, (s) => s.endsWith('ab'));
  });

  it('all five example problems generate', () => {
    for (const ex of EXAMPLES) {
      for (const type of TYPES) expect(generate({ ...ex, type }).ok, ex.label).toBe(true);
    }
  });
});

describe('automaton structure', () => {
  it('DFA is complete: exactly one move per state and symbol', () => {
    const { automaton: d } = generate({ inputType: 'regex', text: '(0|1)*01', alphabet: '', type: 'DFA' });
    for (const s of d.states) {
      for (const a of d.alphabet) {
        expect(d.transitions.filter((t) => t.from === s && t.symbol === a)).toHaveLength(1);
      }
    }
    expect(d.states).toHaveLength(3); // minimal DFA for "ends with 01"
  });

  it('ε-NFA contains ε-transitions, NFA does not', () => {
    const e = generate({ inputType: 'regex', text: '(0|1)*01', alphabet: '', type: 'ENFA' }).automaton;
    const n = generate({ inputType: 'regex', text: '(0|1)*01', alphabet: '', type: 'NFA' }).automaton;
    expect(e.transitions.some((t) => t.symbol === 'ε')).toBe(true);
    expect(n.transitions.some((t) => t.symbol === 'ε')).toBe(false);
  });

  it('marks the trap state of a "does not contain" DFA', () => {
    const { automaton } = generate({ inputType: 'language', text: 'binary strings not containing 11', alphabet: '', type: 'DFA' });
    expect(findDeadStates(automaton).size).toBe(1);
  });
});

describe('simulator', () => {
  it('tracks active sets and ε-closure for ε-NFAs', () => {
    const { automaton } = generate({ inputType: 'regex', text: '(0|1)*01', alphabet: '', type: 'ENFA' });
    const r = simulate(automaton, '1101');
    expect(r.accepted).toBe(true);
    expect(r.steps).toHaveLength(5);
    expect(r.steps[0].active.length).toBeGreaterThan(1); // closure of start
    expect(r.path).not.toBeNull();
    expect(simulate(automaton, '10').accepted).toBe(false);
  });

  it('rejects symbols outside the alphabet and accepts ε input', () => {
    const { automaton } = generate({ inputType: 'regex', text: '(ab)*', alphabet: '', type: 'DFA' });
    expect(simulate(automaton, 'abc').error).toMatch(/not in the alphabet/);
    expect(simulate(automaton, '').accepted).toBe(true);
  });

  it('produces sample strings', () => {
    const { automaton } = generate({ inputType: 'regex', text: '(0|1)*01', alphabet: '', type: 'DFA' });
    const s = sampleStrings(automaton);
    expect(s.accepted.every((x) => simulate(automaton, x).accepted)).toBe(true);
    expect(s.rejected.every((x) => !simulate(automaton, x).accepted)).toBe(true);
  });
});

describe('validation & honest errors', () => {
  it.each([
    ['(0|1', /Missing "\)"/],
    ['*a', /Nothing to repeat/],
    ['a)', /Unmatched/],
    ['a|', /Empty expression/],
    ['a#b', /Unsupported character/],
    ['', /Enter a regular expression/],
  ])('regex %j is rejected', (text, msg) => {
    const r = interpret({ inputType: 'regex', text, alphabet: '' });
    expect(r.ok).toBe(false);
    expect(r.error.message).toMatch(msg);
  });

  it('rejects symbols outside the provided alphabet', () => {
    const r = interpret({ inputType: 'regex', text: 'ab', alphabet: 'a' });
    expect(r.ok).toBe(false);
  });

  it('refuses unsupported natural language instead of guessing', () => {
    const r = interpret({ inputType: 'language', text: 'strings that look like prime numbers in binary', alphabet: '' });
    expect(r.ok).toBe(false);
    expect(r.error.hints.length).toBeGreaterThan(0);
  });

  it('refuses ambiguous combined conditions', () => {
    const r = interpret({ inputType: 'language', text: 'binary strings starting with 1 and ending with 0', alphabet: '' });
    expect(r.ok).toBe(false);
    expect(r.error.message).toMatch(/combines several conditions/);
  });

  it('parses nested expressions', () => {
    expect(() => parseRegex('((a|b)*c)+')).not.toThrow();
  });
});
