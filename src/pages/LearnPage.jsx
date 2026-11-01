const Section = ({ id, title, children }) => (
  <section id={id} className="card scroll-mt-24 p-6">
    <h2 className="text-lg font-bold">{title}</h2>
    <div className="mt-2 space-y-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{children}</div>
  </section>
);

const Code = ({ children }) => <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs dark:bg-navy-800">{children}</code>;

const TOC = [
  ['states', 'States & transitions'],
  ['initial-final', 'Initial & final states'],
  ['dfa', 'DFA'],
  ['nfa', 'NFA'],
  ['enfa', 'ε-NFA'],
  ['table', 'Transition tables'],
  ['compare', 'DFA vs NFA vs ε-NFA'],
];

export default function LearnPage() {
  return (
    <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)]">
      <nav className="card h-fit p-4 lg:sticky lg:top-24" aria-label="Learn topics">
        <p className="section-title mb-2">Topics</p>
        <ul className="space-y-1 text-sm">
          {TOC.map(([id, label]) => (
            <li key={id}><a className="block rounded-md px-2 py-1 hover:bg-slate-100 dark:hover:bg-white/10" href={`#learn-${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(`learn-${id}`)?.scrollIntoView({ behavior: 'smooth' }); }}>{label}</a></li>
          ))}
        </ul>
      </nav>

      <div className="space-y-5">
        <header>
          <h1 className="text-3xl font-extrabold tracking-tight">Learn automata</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">A finite automaton is a tiny machine that reads a string one symbol at a time and decides whether to accept it. The set of accepted strings is its <em>language</em>.</p>
        </header>

        <Section id="learn-states" title="States and transitions">
          <p>A <strong>state</strong> (drawn as a circle, <Code>q0</Code>, <Code>q1</Code>, …) is the machine’s memory: it remembers just enough about the input read so far. A <strong>transition</strong> (an arrow labelled with a symbol) says “in this state, on this symbol, move to that state”.</p>
          <p>A transition from a state back to itself is a <strong>self-loop</strong>. When two symbols share the same arrow, the label lists both, like <Code>0,1</Code>.</p>
        </Section>

        <Section id="learn-initial-final" title="Initial and final states">
          <p>Every automaton has exactly one <strong>initial state</strong>, marked by an arrow coming from nowhere. It has any number of <strong>final (accepting) states</strong>, drawn as double circles. A string is accepted if the machine is in a final state after reading the whole input.</p>
        </Section>

        <Section id="learn-dfa" title="DFA — Deterministic Finite Automaton">
          <p>In a DFA there is <strong>exactly one</strong> transition for every state and every symbol, and no ε-moves. The run on any input is a single path, so simulating a DFA is just following arrows. A <em>complete</em> DFA may need a <strong>trap state</strong> (dashed here) for inputs that can never be accepted.</p>
          <p>Formally, a DFA is <Code>(Q, Σ, δ, q₀, F)</Code> with <Code>δ : Q × Σ → Q</Code>.</p>
        </Section>

        <Section id="learn-nfa" title="NFA — Nondeterministic Finite Automaton">
          <p>An NFA may have <strong>several</strong> transitions for the same state and symbol — or <strong>none</strong>. Think of it as exploring all choices at once: the machine is in a <em>set</em> of states, and the string is accepted if <em>any</em> of them is final at the end.</p>
          <p>Here <Code>δ : Q × Σ → 2<sup>Q</sup></Code>. Every NFA can be converted into an equivalent DFA with the <strong>subset construction</strong>, though the DFA may be exponentially larger.</p>
        </Section>

        <Section id="learn-enfa" title="ε-NFA — NFA with ε-transitions">
          <p>An ε-NFA may also move along <strong>ε-transitions</strong> without consuming any input. Before and after each step you take the <strong>ε-closure</strong>: all states reachable using only ε-arrows.</p>
          <p>Regular expressions convert naturally into ε-NFAs through <strong>Thompson’s construction</strong>: each operator (union, concatenation, star) becomes a small gadget glued together with ε-arrows. The generator on this site uses exactly that algorithm.</p>
        </Section>

        <Section id="learn-table" title="Transition tables">
          <p>A transition table lists, for each state (rows) and symbol (columns), where the machine goes. <Code>→</Code> marks the initial state and <Code>*</Code> marks final states.</p>
          <div className="overflow-x-auto"><table className="w-full max-w-xs border-collapse font-mono text-sm"><thead><tr className="bg-slate-100 text-left dark:bg-navy-800"><th className="px-3 py-1.5">State</th><th className="px-3 py-1.5">0</th><th className="px-3 py-1.5">1</th></tr></thead><tbody>
            <tr className="border-t border-slate-200 dark:border-white/10"><td className="px-3 py-1.5">→ q0</td><td className="px-3 py-1.5">q1</td><td className="px-3 py-1.5">q0</td></tr>
            <tr className="border-t border-slate-200 dark:border-white/10"><td className="px-3 py-1.5">q1</td><td className="px-3 py-1.5">q1</td><td className="px-3 py-1.5">q2</td></tr>
            <tr className="border-t border-slate-200 dark:border-white/10"><td className="px-3 py-1.5">* q2</td><td className="px-3 py-1.5">q1</td><td className="px-3 py-1.5">q0</td></tr>
          </tbody></table></div>
          <p>In NFAs a cell can hold several states, e.g. <Code>{'{q0, q1}'}</Code>, or <Code>∅</Code> for no move. ε-NFAs get an extra <Code>ε</Code> column.</p>
        </Section>

        <Section id="learn-compare" title="Differences between DFA, NFA and ε-NFA">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[480px] border-collapse text-left text-sm">
              <thead><tr className="bg-slate-100 dark:bg-navy-800"><th className="px-3 py-2"> </th><th className="px-3 py-2">DFA</th><th className="px-3 py-2">NFA</th><th className="px-3 py-2">ε-NFA</th></tr></thead>
              <tbody>
                {[
                  ['Moves per (state, symbol)', 'Exactly 1', '0, 1 or many', '0, 1 or many'],
                  ['ε-transitions', 'No', 'No', 'Yes'],
                  ['Current configuration', 'One state', 'Set of states', 'Set of states + ε-closure'],
                  ['Accepts when…', 'final state reached', 'any active state is final', 'any active state is final'],
                  ['Typical size', 'Can be large', 'Compact', 'Compact, easy to build from regex'],
                  ['Recognises', 'Regular languages', 'Regular languages', 'Regular languages'],
                ].map(([a, b, c, d]) => (
                  <tr key={a} className="border-t border-slate-200 dark:border-white/10"><th scope="row" className="px-3 py-2 font-semibold">{a}</th><td className="px-3 py-2">{b}</td><td className="px-3 py-2">{c}</td><td className="px-3 py-2">{d}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>All three have exactly the same power: they recognise precisely the <strong>regular languages</strong>. They only differ in convenience.</p>
        </Section>
      </div>
    </div>
  );
}
