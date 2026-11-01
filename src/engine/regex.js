// Regular expression parser (recursive descent) → AST.
//
// Grammar (lowest to highest precedence):
//   alt   := cat ( ('|' | '∪') cat )*
//   cat   := rep rep*
//   rep   := atom ( '*' | '+' | '?' )*
//   atom  := symbol | 'ε' | '∅' | '.' | '(' alt ')' | '\' char
//
// '+' means "one or more" (like most programming languages); use '|' for union.

export class RegexError extends Error {
  constructor(message, index = 0) {
    super(message);
    this.name = 'RegexError';
    this.index = index;
  }
}

const SYMBOL = /[A-Za-z0-9]/;
const POSTFIX = ['*', '+', '?'];

export function parseRegex(source) {
  const s = source;
  let i = 0;

  const skip = () => {
    while (i < s.length && /\s/.test(s[i])) i++;
  };
  const peek = () => {
    skip();
    return s[i];
  };

  function parseAlt() {
    let left = parseCat();
    while (peek() === '|' || peek() === '∪') {
      i++;
      const right = parseCat();
      left = { type: 'alt', left, right };
    }
    return left;
  }

  function parseCat() {
    const items = [];
    for (;;) {
      const c = peek();
      if (c === undefined || c === ')' || c === '|' || c === '∪') break;
      items.push(parseRep());
    }
    if (items.length === 0) {
      throw new RegexError(
        `Empty expression near position ${i + 1}. Write ε for the empty string, e.g. (a|ε).`,
        i,
      );
    }
    return items.reduce((left, right) => ({ type: 'cat', left, right }));
  }

  function parseRep() {
    let node = parseAtom();
    while (POSTFIX.includes(peek())) {
      const op = s[i++];
      node = { type: op === '*' ? 'star' : op === '+' ? 'plus' : 'opt', child: node };
    }
    return node;
  }

  function parseAtom() {
    const c = peek();
    if (c === '(') {
      const open = i;
      i++;
      const inner = parseAlt();
      if (peek() !== ')') {
        throw new RegexError(`Missing ")" to close the "(" at position ${open + 1}.`, open);
      }
      i++;
      return inner;
    }
    if (c === 'ε') {
      i++;
      return { type: 'eps' };
    }
    if (c === '∅') {
      i++;
      return { type: 'empty' };
    }
    if (c === '.') {
      i++;
      return { type: 'any' };
    }
    if (c === '\\') {
      i++;
      const next = s[i];
      if (next === undefined) throw new RegexError('A trailing "\\" has nothing to escape.', i - 1);
      i++;
      return { type: 'sym', value: next };
    }
    if (POSTFIX.includes(c)) {
      throw new RegexError(`Nothing to repeat before "${c}" at position ${i + 1}.`, i);
    }
    if (c !== undefined && SYMBOL.test(c)) {
      i++;
      return { type: 'sym', value: c };
    }
    throw new RegexError(
      `Unsupported character "${c}" at position ${i + 1}. Use letters, digits, | * + ? ( ) . ε ∅.`,
      i,
    );
  }

  if (!s.trim()) throw new RegexError('Enter a regular expression, e.g. (0|1)*01.', 0);
  const ast = parseAlt();
  skip();
  if (i < s.length) {
    if (s[i] === ')') throw new RegexError(`Unmatched ")" at position ${i + 1}.`, i);
    throw new RegexError(`Unexpected "${s[i]}" at position ${i + 1}.`, i);
  }
  return ast;
}

/** Distinct literal symbols used by an AST, in sorted order. */
export function collectSymbols(ast) {
  const out = new Set();
  (function walk(n) {
    if (n.type === 'sym') out.add(n.value);
    if (n.left) walk(n.left);
    if (n.right) walk(n.right);
    if (n.child) walk(n.child);
  })(ast);
  return [...out].sort();
}

export function usesWildcard(ast) {
  let found = false;
  (function walk(n) {
    if (n.type === 'any') found = true;
    if (n.left) walk(n.left);
    if (n.right) walk(n.right);
    if (n.child) walk(n.child);
  })(ast);
  return found;
}
