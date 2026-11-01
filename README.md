<<<<<<< HEAD
# ATC Automata Visualizer

An interactive web app for **Automata Theory & Computability** students. Enter a regular expression (or a supported language description), pick **DFA, NFA or ε-NFA**, and get a draggable state diagram, a transition table, an explanation, and a step-by-step string simulator.

Built with React + Vite, Tailwind CSS, hand-written SVG (pan / zoom / drag / export) and Lucide icons. All automata logic runs in the browser — no backend is needed, so there is no Express server to start.

## Quick start

Requires **Node.js 18+**.

```bash
npm install
npm run dev        # http://localhost:5173
```

Other commands:

```bash
npm test           # engine tests + UI smoke tests (Vitest)
npm run build      # production build in dist/
npm run preview    # serve the production build
```

## Features

| Area | What you get |
|---|---|
| Input | Regular expression or formal-language description, alphabet field with auto-detection, live validation and syntax hints, 5 example problems + regex examples |
| Automata | DFA (complete, minimal, with trap state), NFA (ε-free), ε-NFA (Thompson output) |
| Diagram | Circular states `q0…`, labelled arrows (grouped as `0,1`), start arrow, double circles for finals, self-loops, ε labels, dashed trap state, collision-avoiding curved edges, legend |
| Interaction | Zoom, pan, fit-to-screen, reset layout, drag states (keyboard: arrow keys on a focused state), export **SVG** and **PNG** |
| Details | State count, alphabet, initial/final states, transition table (`→` initial, `*` final, multiple targets, `∅`, ε column), plain-language explanation |
| Simulator | Step-by-step playback, previous/next/play/pause, speed, active state sets highlighted on the diagram and table, ε-closure for ε-NFAs, verdict with reason and accepting path, full trace, suggested accepted/rejected strings |
| Pages | Home, Automata Generator, Learn (DFA, NFA, ε-NFA, states, tables, comparison), About |
| UX | Dark navy/indigo theme + light theme toggle, responsive layout, loading / empty / confirm / success / error states, keyboard and screen-reader friendly, reduced-motion support |

## Algorithms (src/engine)

| File | Purpose |
|---|---|
| `regex.js` | Recursive-descent regex parser with positioned error messages |
| `thompson.js` | **Thompson's construction** → ε-NFA |
| `automaton.js` | ε-closure, `move`, **subset construction**, ε-elimination, DFA completion, **Moore minimisation**, BFS state renumbering, trap-state detection |
| `simulate.js` | Step-by-step simulation with active-set tracking and ε-closure; accepting-path search |
| `languages.js` | Explicit **template set** for natural-language descriptions (see below) |
| `generate.js` | Pipeline (`interpret` → `buildAutomaton`) and explanations |
| `utils/layout.js` | Layered layout, barycentre ordering, curved-edge routing with node-collision avoidance |

### Regex syntax

`a|b` union (also `∪`) · `ab` concatenation · `*` zero or more · `+` one or more · `?` optional · `( )` grouping · `ε` empty string · `∅` empty language · `.` any symbol of the alphabet · `\x` escape. Symbols are single letters or digits.

### Supported language descriptions

Natural language cannot be converted reliably, so only these templates are recognised. The interpreted formal language is **shown for confirmation** before anything is drawn, and anything unsupported or combining several conditions is rejected with an explanation.

- `ends with <string>` · `starts with <string>` · `contains <string>` · `does not contain <string>`
- `even / odd number of <symbol>` · `number of <symbol> divisible by <k>`
- `even / odd length` · `length divisible by <k>` · `length exactly <n>`

Alphabet is auto-detected (`binary` → `{0,1}`, `over {a,b}`, or the symbols used) unless you fill in the Alphabet field.

### Limits

Regex ≤ 200 characters, ε-NFA ≤ 400 states, DFA ≤ 200 states (some expressions have exponentially large DFAs; use the NFA / ε-NFA view for those).

## Project structure

```
src/
  engine/        automata algorithms, templates, examples, tests
  components/    Header, InputPanel, AutomatonCanvas, DetailsPanel, TransitionTable, Simulator, Legend
  pages/         Home, Generator, Learn, About
  hooks/         useTheme
  utils/         layout geometry, SVG/PNG export
```

## Tests

`npm test` runs:

- every sample regex as DFA, NFA and ε-NFA against JavaScript's `RegExp` on all strings up to length 7,
- every language template against a plain-JS predicate,
- structural checks (complete DFA, ε only in ε-NFA, trap states),
- simulator checks (ε-closure, invalid symbols, empty string),
- validation / error messages and rejection of unsupported or ambiguous descriptions,
- UI smoke tests that render the app, generate automata, run a simulation and exercise the confirmation and error flows.
=======
# automata_things
>>>>>>> 4a4014e94b7b315cb9b2c406a37a9ff18006e80b
