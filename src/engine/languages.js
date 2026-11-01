// Formal-language templates.
//
// Natural-language descriptions can NOT be converted in general, so we only
// support an explicit set of templates. Each recognised phrase is turned into
// a formal definition (shown to the user for confirmation) plus either a
// regular expression or a directly constructed DFA.

import { normalize } from './automaton.js';

const TOKEN = String.raw`(?:"([^"]+)"|'([^']+)'|“([^”]+)”|([A-Za-z0-9]+))`;
const SYM_PREFIX = String.raw`(?:the\s+)?(?:symbols?\s+|digits?\s+|letters?\s+|characters?\s+)?`;
const COUNT_SYM = String.raw`${SYM_PREFIX}(?:(zeros?|ones?)|([A-Za-z0-9])(?:'?s)?)\b`;
const LEAD = String.raw`(?:(?:contain(?:s|ing)?|with|having|has)\s+(?:an?\s+|the\s+)?)?`;
const DIVISIBLE = String.raw`(?:is\s+|are\s+)?(?:divisible\s+by|a\s+multiple\s+of|multiple\s+of)\s+(\d+)`;

const pick = (m, from) => m.slice(from, from + 4).find((x) => x !== undefined);
const wordSymbol = (word) => (/^zero/i.test(word) ? '0' : '1');

export const SUPPORTED_TEMPLATES = [
  'ends with <string>',
  'starts with <string>',
  'contains <string>',
  'does not contain <string>',
  'even / odd number of <symbol>',
  'number of <symbol> divisible by <k>',
  'even / odd length',
  'length divisible by <k>',
  'length exactly <n>',
];

// Order matters: more specific phrases first. Each matched phrase is removed
// from the text so a second, different match signals a combined condition.
const MATCHERS = [
  {
    kind: 'not-contains',
    re: new RegExp(
      String.raw`(?:do(?:es)?\s*n[o']?t\s+contain|do(?:es)?n't\s+contain|not\s+contain(?:ing)?|without|avoid(?:s|ing)?)\s+(?:the\s+)?(?:sub-?string\s+)?${TOKEN}`,
      'i',
    ),
    read: (m) => ({ pattern: pick(m, 1) }),
  },
  {
    kind: 'count-mod',
    re: new RegExp(String.raw`${LEAD}number\s+of\s+${COUNT_SYM}\s+${DIVISIBLE}`, 'i'),
    read: (m) => ({ symbol: m[1] ? wordSymbol(m[1]) : m[2], k: Number(m[3]), r: 0 }),
  },
  {
    kind: 'count-parity',
    re: new RegExp(String.raw`${LEAD}(even|odd)\s+number\s+of\s+${COUNT_SYM}`, 'i'),
    read: (m) => ({ symbol: m[2] ? wordSymbol(m[2]) : m[3], k: 2, r: /^even$/i.test(m[1]) ? 0 : 1 }),
  },
  {
    kind: 'length-mod',
    re: new RegExp(String.raw`length\s+${DIVISIBLE}`, 'i'),
    read: (m) => ({ k: Number(m[1]), r: 0 }),
  },
  {
    kind: 'length-parity',
    re: /(even|odd)\s+length|length\s+(?:is\s+)?(even|odd)/i,
    read: (m) => ({ k: 2, r: /even/i.test(m[1] ?? m[2]) ? 0 : 1 }),
  },
  {
    kind: 'length-exact',
    re: /(?:of\s+length|length\s+(?:is\s+)?(?:exactly\s+|equal\s+to\s+)?|exactly\s+)(\d+)(?:\s+(?:symbols?|characters?|bits?|letters?))?/i,
    read: (m) => ({ n: Number(m[1]) }),
  },
  {
    kind: 'ends',
    re: new RegExp(String.raw`end(?:s|ing)?\s+(?:with|in|on)\s+(?:the\s+)?(?:sub-?string\s+)?${TOKEN}`, 'i'),
    read: (m) => ({ pattern: pick(m, 1) }),
  },
  {
    kind: 'starts',
    re: new RegExp(
      String.raw`(?:start|begin)(?:s|ning|ing)?\s+with\s+(?:the\s+)?(?:sub-?string\s+)?${TOKEN}`,
      'i',
    ),
    read: (m) => ({ pattern: pick(m, 1) }),
  },
  {
    kind: 'contains',
    re: new RegExp(
      String.raw`contain(?:s|ing)?\s+(?:the\s+)?(?:sub-?string\s+)?(?:sub-?sequence\s+)?${TOKEN}`,
      'i',
    ),
    read: (m) => ({ pattern: pick(m, 1) }),
  },
];

export function parseAlphabet(text) {
  const tokens = text.split(/[\s,;{}]+/).filter(Boolean);
  const symbols = [];
  for (const t of tokens) {
    if ([...t].length !== 1 || t === 'ε') {
      return {
        error: `"${t}" is not a single symbol. Separate symbols with commas, e.g. 0, 1 or a, b, c.`,
      };
    }
    if (!symbols.includes(t)) symbols.push(t);
  }
  return { symbols: symbols.sort() };
}

function detectAlphabetFromText(text) {
  if (/\bbinary\b/i.test(text)) return ['0', '1'];
  const m = text.match(/(?:over|alphabet|Σ\s*=?)\s*(?:the\s+alphabet\s*)?\{?\s*([A-Za-z0-9](?:\s*,\s*[A-Za-z0-9])*)\s*\}?/i);
  if (m) return m[1].split(/\s*,\s*/).sort();
  return null;
}

const sigma = (alpha) => (alpha.length === 1 ? alpha[0] : `(${alpha.join('|')})`);
const group = (alpha, symbol) => {
  const others = alpha.filter((a) => a !== symbol);
  const o = others.length === 0 ? '' : others.length === 1 ? others[0] : `(${others.join('|')})`;
  return { o, ostar: o ? `${o}*` : '' };
};

function substringDFA(pattern, alphabet, avoid) {
  const m = pattern.length;
  const transitions = [];
  for (let j = 0; j <= m; j++) {
    for (const c of alphabet) {
      let next = m;
      if (j < m) {
        const str = pattern.slice(0, j) + c;
        for (let l = Math.min(m, str.length); l >= 0; l--) {
          if (str.endsWith(pattern.slice(0, l))) {
            next = l;
            break;
          }
        }
      }
      transitions.push({ from: j, to: next, symbol: c });
    }
  }
  const finals = avoid ? Array.from({ length: m }, (_, i) => i) : [m];
  return normalize({
    type: 'DFA',
    alphabet,
    states: Array.from({ length: m + 1 }, (_, i) => i),
    start: 0,
    finals,
    transitions,
  });
}

const setNotation = (alpha) => `{${alpha.join(', ')}}`;

/**
 * Interpret a formal-language description.
 * Returns { ok: true, interpretation } or { ok: false, error: { message, hints } }.
 */
export function interpretLanguage(text, alphabetText = '') {
  const original = text.trim();
  if (!original) return { ok: false, error: { message: 'Describe a language, e.g. "All binary strings ending with 01".' } };
  if (original.length > 300) return { ok: false, error: { message: 'That description is too long. Keep it under 300 characters.' } };

  // 1. Recognise templates.
  let rest = ` ${original} `;
  const found = [];
  for (const matcher of MATCHERS) {
    const m = rest.match(matcher.re);
    if (m) {
      found.push({ kind: matcher.kind, ...matcher.read(m) });
      rest = rest.replace(m[0], ' ');
    }
  }
  if (found.length === 0) {
    return {
      ok: false,
      error: {
        message:
          'I could not map that description to a supported template. Arbitrary natural language cannot be converted reliably, so no automaton was drawn.',
        hints: SUPPORTED_TEMPLATES,
        suggestion: 'Rephrase using one of the templates below, or switch to Regular Expression input.',
      },
    };
  }
  if (found.length > 1) {
    return {
      ok: false,
      error: {
        message: `That description combines several conditions (${found.map((f) => f.kind.replace('-', ' ')).join(' + ')}). Combined conditions are ambiguous and not supported, so no automaton was drawn.`,
        hints: SUPPORTED_TEMPLATES,
        suggestion: 'Describe a single condition, or write a regular expression that combines them.',
      },
    };
  }
  const spec = found[0];

  // 2. Determine the alphabet.
  const notes = [];
  let alphabet;
  if (alphabetText.trim()) {
    const parsed = parseAlphabet(alphabetText);
    if (parsed.error) return { ok: false, error: { message: parsed.error } };
    alphabet = parsed.symbols;
  } else {
    const fromText = detectAlphabetFromText(original);
    const used = [...new Set([...(spec.pattern ?? ''), ...(spec.symbol ? [spec.symbol] : [])])];
    if (fromText) alphabet = [...new Set([...fromText, ...used])].sort();
    else if (used.every((c) => c === '0' || c === '1')) alphabet = ['0', '1'];
    else alphabet = used.sort();
    if (alphabet.length === 0) alphabet = ['0', '1'];
    notes.push(`Alphabet detected automatically as ${setNotation(alphabet)}. Edit the Alphabet field to override it.`);
  }

  // 3. Validate symbols against the alphabet.
  const check = (chars, what) => {
    const bad = [...new Set([...chars].filter((c) => !alphabet.includes(c)))];
    if (bad.length) {
      return {
        ok: false,
        error: {
          message: `${what} uses ${bad.map((c) => `"${c}"`).join(', ')}, which ${bad.length > 1 ? 'are' : 'is'} not in the alphabet ${setNotation(alphabet)}.`,
          suggestion: 'Add the missing symbols to the Alphabet field or change the description.',
        },
      };
    }
    return null;
  };
  if (spec.pattern !== undefined) {
    if (!spec.pattern) return { ok: false, error: { message: 'The pattern is empty.' } };
    const bad = check(spec.pattern, `The pattern "${spec.pattern}"`);
    if (bad) return bad;
    if (spec.pattern.length > 12) return { ok: false, error: { message: 'Patterns longer than 12 symbols are not supported.' } };
  }
  if (spec.symbol !== undefined) {
    const bad = check(spec.symbol, `The symbol "${spec.symbol}"`);
    if (bad) return bad;
  }
  if (spec.k !== undefined && (spec.k < 1 || spec.k > 12)) {
    return { ok: false, error: { message: 'The modulus k must be between 1 and 12.' } };
  }
  if (spec.n !== undefined && spec.n > 12) {
    return { ok: false, error: { message: 'Exact lengths above 12 are not supported.' } };
  }

  // 4. Build the formal definition.
  const A = setNotation(alphabet);
  const S = sigma(alphabet);
  let description;
  let regex = null;
  let dfa = null;
  switch (spec.kind) {
    case 'ends':
      description = `L = { w ∈ ${A}* : w ends with ${spec.pattern} }`;
      regex = `${S}*${spec.pattern}`;
      break;
    case 'starts':
      description = `L = { w ∈ ${A}* : w starts with ${spec.pattern} }`;
      regex = `${spec.pattern}${S}*`;
      break;
    case 'contains':
      description = `L = { w ∈ ${A}* : ${spec.pattern} is a substring of w }`;
      regex = `${S}*${spec.pattern}${S}*`;
      break;
    case 'not-contains':
      description = `L = { w ∈ ${A}* : ${spec.pattern} is not a substring of w }`;
      dfa = substringDFA(spec.pattern, alphabet, true);
      notes.push('Built directly as the complement of the substring-matching DFA (no short regular expression is used).');
      break;
    case 'count-parity':
    case 'count-mod': {
      const { ostar } = group(alphabet, spec.symbol);
      const unit = `${spec.symbol}${ostar}`;
      regex = `${ostar}${unit.repeat(spec.r)}(${unit.repeat(spec.k)})*`;
      const cond = spec.k === 2 ? (spec.r === 0 ? 'even' : 'odd') : null;
      description = cond
        ? `L = { w ∈ ${A}* : #${spec.symbol}(w) is ${cond} }`
        : `L = { w ∈ ${A}* : #${spec.symbol}(w) ≡ ${spec.r} (mod ${spec.k}) }`;
      break;
    }
    case 'length-parity':
    case 'length-mod': {
      regex = `${S.repeat(spec.r)}(${S.repeat(spec.k)})*`;
      description =
        spec.k === 2
          ? `L = { w ∈ ${A}* : |w| is ${spec.r === 0 ? 'even' : 'odd'} }`
          : `L = { w ∈ ${A}* : |w| ≡ ${spec.r} (mod ${spec.k}) }`;
      break;
    }
    case 'length-exact':
      regex = spec.n === 0 ? 'ε' : S.repeat(spec.n);
      description = `L = { w ∈ ${A}* : |w| = ${spec.n} }`;
      break;
    default:
      return { ok: false, error: { message: 'Unsupported template.' } };
  }

  return {
    ok: true,
    interpretation: {
      kind: spec.kind,
      source: 'language',
      original,
      description,
      regex,
      dfa,
      alphabet,
      notes,
    },
  };
}
