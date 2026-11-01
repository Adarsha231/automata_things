// High-level pipeline: input text → interpretation → automaton.

import {
  EPS,
  TooLargeError,
  findDeadStates,
  minimizeDFA,
  normalize,
  removeEpsilon,
  stateName,
  subsetConstruction,
  completeDFA,
} from './automaton.js';
import { RegexError, collectSymbols, parseRegex, usesWildcard } from './regex.js';
import { thompson } from './thompson.js';
import { interpretLanguage, parseAlphabet } from './languages.js';

export const MAX_REGEX_LENGTH = 200;
export const MAX_THOMPSON_STATES = 400;

function interpretRegex(text, alphabetText) {
  const src = text.trim();
  if (src.length > MAX_REGEX_LENGTH) {
    return { ok: false, error: { message: `Regular expressions are limited to ${MAX_REGEX_LENGTH} characters.` } };
  }
  let ast;
  try {
    ast = parseRegex(src);
  } catch (e) {
    if (e instanceof RegexError) return { ok: false, error: { message: e.message, index: e.index } };
    throw e;
  }
  const used = collectSymbols(ast);
  const notes = [];
  let alphabet;
  if (alphabetText.trim()) {
    const parsed = parseAlphabet(alphabetText);
    if (parsed.error) return { ok: false, error: { message: parsed.error } };
    alphabet = parsed.symbols;
    const missing = used.filter((c) => !alphabet.includes(c));
    if (missing.length) {
      return {
        ok: false,
        error: {
          message: `The expression uses ${missing.map((c) => `"${c}"`).join(', ')}, which ${missing.length > 1 ? 'are' : 'is'} not in the alphabet {${alphabet.join(', ')}}.`,
          suggestion: 'Add the missing symbols to the Alphabet field, or clear it to auto-detect.',
        },
      };
    }
  } else {
    alphabet = used;
    if (alphabet.length === 0) {
      return {
        ok: false,
        error: {
          message: 'No alphabet symbols were found in the expression, so the alphabet cannot be detected.',
          suggestion: 'Fill in the Alphabet field, e.g. 0, 1.',
        },
      };
    }
    notes.push(`Alphabet detected automatically as {${alphabet.join(', ')}}.`);
    if (usesWildcard(ast)) notes.push('"." matches any symbol of the detected alphabet.');
  }
  return {
    ok: true,
    interpretation: {
      kind: 'regex',
      source: 'regex',
      original: src,
      description: `L = L( ${src} )`,
      regex: src,
      dfa: null,
      alphabet,
      notes,
    },
  };
}

/** Step 1: turn raw form input into a formal interpretation (or an error). */
export function interpret({ inputType, text, alphabet = '' }) {
  try {
    return inputType === 'regex' ? interpretRegex(text, alphabet) : interpretLanguage(text, alphabet);
  } catch (e) {
    return { ok: false, error: { message: `Unexpected error: ${e.message}` } };
  }
}

/** Step 2: build an automaton of the requested type from an interpretation. */
export function buildAutomaton(interpretation, type) {
  const stats = {};
  const notes = [...interpretation.notes];
  let automaton;

  if (interpretation.dfa) {
    // Directly constructed DFA (e.g. "does not contain").
    const dfa = interpretation.dfa;
    stats.dfaStates = dfa.states.length;
    if (type === 'DFA') automaton = dfa;
    else {
      automaton = { ...dfa, type: type === 'NFA' ? 'NFA' : 'ENFA' };
      notes.push(
        `Every DFA is also a valid ${type === 'NFA' ? 'NFA' : 'ε-NFA'}: this automaton happens to be deterministic${type === 'ENFA' ? ' and uses no ε-transitions' : ''}.`,
      );
    }
    return { automaton, stats, notes };
  }

  const ast = parseRegex(interpretation.regex);
  const enfa = thompson(ast, interpretation.alphabet);
  stats.thompsonStates = enfa.states.length;
  if (enfa.states.length > MAX_THOMPSON_STATES) {
    throw new TooLargeError('This expression is too large to draw (more than 400 ε-NFA states).');
  }

  if (type === 'ENFA') {
    automaton = normalize(enfa);
  } else if (type === 'NFA') {
    automaton = removeEpsilon(enfa);
    stats.nfaStates = automaton.states.length;
  } else {
    const { dfa } = subsetConstruction(enfa);
    stats.dfaStatesRaw = dfa.states.length;
    automaton = minimizeDFA(completeDFA({ ...dfa, alphabet: interpretation.alphabet }));
    stats.dfaStates = automaton.states.length;
  }
  return { automaton, stats, notes };
}

/** Convenience: interpret + build in one call (used by tests and examples). */
export function generate(form) {
  const r = interpret(form);
  if (!r.ok) return r;
  try {
    const built = buildAutomaton(r.interpretation, form.type);
    return { ok: true, interpretation: r.interpretation, ...built };
  } catch (e) {
    return { ok: false, error: { message: e.message } };
  }
}

/** Plain-language explanation shown in the details panel. */
export function explain(automaton, interpretation, stats) {
  const finals = automaton.finals.map(stateName).join(', ') || 'none';
  const paras = [];

  if (interpretation.dfa) {
    paras.push(
      'Built directly: each state records how much of the forbidden substring has just been read (via KMP-style matching). Reaching the last state means the substring appeared, so that state is a trap.',
    );
  } else if (automaton.type === 'ENFA') {
    paras.push(
      `Built with Thompson's construction: every part of the expression becomes a small ε-NFA fragment with one entry and one exit, and the fragments are joined by ε-transitions (${stats.thompsonStates} states).`,
    );
  } else if (automaton.type === 'NFA') {
    paras.push(
      `Built with Thompson's construction (${stats.thompsonStates} states), then ε-transitions were removed by closing each state over ε and dropping useless states.`,
    );
  } else {
    paras.push(
      `Built with Thompson's construction (${stats.thompsonStates ?? '–'} ε-NFA states), converted with the subset construction${
        stats.dfaStatesRaw ? ` (${stats.dfaStatesRaw} states)` : ''
      }, completed with a trap state where needed, and minimised to ${automaton.states.length} state${automaton.states.length === 1 ? '' : 's'}.`,
    );
  }

  if (automaton.type === 'DFA') {
    paras.push(
      `Start in ${stateName(automaton.start)} and read the string left to right. Each symbol has exactly one arrow out of every state, so there is always a single current state. The string is accepted if it ends in a double-circled state (${finals}).`,
    );
  } else if (automaton.type === 'NFA') {
    paras.push(
      `An NFA may have several arrows (or none) for the same symbol, so we track the set of states it could be in. The string is accepted if, after the last symbol, at least one of those states is final (${finals}).`,
    );
  } else {
    paras.push(
      `An ε-NFA can also move along ε-arrows without reading anything, so after every step we take the ε-closure of the active set. The string is accepted if the final set contains an accepting state (${finals}).`,
    );
  }

  const dead = [...findDeadStates(automaton)];
  if (dead.length && automaton.type === 'DFA') {
    paras.push(
      `${dead.map(stateName).join(', ')} ${dead.length > 1 ? 'are' : 'is a'} trap state${dead.length > 1 ? 's' : ''} (dashed): once entered, no final state can ever be reached.`,
    );
  }
  if (automaton.finals.length === 0) paras.push('This language is empty: no string is accepted.');
  if (automaton.type === 'ENFA' && !automaton.transitions.some((t) => t.symbol === EPS)) {
    paras.push('This ε-NFA happens to contain no ε-transitions.');
  }
  return paras;
}
