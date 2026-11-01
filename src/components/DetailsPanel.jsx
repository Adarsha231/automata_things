import { Lightbulb } from 'lucide-react';
import { stateName } from '../engine/automaton.js';
import { explain } from '../engine/generate.js';
import TransitionTable from './TransitionTable.jsx';

const TYPE_LABEL = { DFA: 'DFA', NFA: 'NFA', ENFA: 'ε-NFA' };

function Stat({ label, children }) {
  return (
    <div className="rounded-xl bg-slate-100 p-3 dark:bg-navy-800">
      <dt className="section-title">{label}</dt>
      <dd className="mt-1 font-mono text-sm font-semibold text-slate-900 dark:text-white">{children}</dd>
    </div>
  );
}

export default function DetailsPanel({ result, highlight }) {
  if (!result) {
    return (
      <section className="card p-5" aria-labelledby="details-title">
        <h2 id="details-title" className="text-base font-bold">Automaton details</h2>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Generate an automaton to see its states, alphabet, transition table and an explanation here.
        </p>
      </section>
    );
  }
  const { automaton, interpretation, stats } = result;
  const paragraphs = explain(automaton, interpretation, stats);

  return (
    <section className="card animate-fade-in space-y-5 p-5" aria-labelledby="details-title">
      <h2 id="details-title" className="text-base font-bold">Automaton details</h2>

      <dl className="grid grid-cols-2 gap-3">
        <Stat label="Type">{TYPE_LABEL[automaton.type]}</Stat>
        <Stat label="States">{automaton.states.length}</Stat>
        <Stat label="Alphabet (Σ)">{`{${automaton.alphabet.join(', ')}}`}</Stat>
        <Stat label="Initial">{stateName(automaton.start)}</Stat>
        <div className="col-span-2">
          <Stat label="Final states">
            {automaton.finals.length ? `{${automaton.finals.map(stateName).join(', ')}}` : '∅ (none)'}
          </Stat>
        </div>
      </dl>

      <div>
        <h3 className="section-title mb-2">Transition table</h3>
        <TransitionTable automaton={automaton} activeStates={highlight?.states} />
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          → initial state · * final state{automaton.type !== 'DFA' ? ' · ∅ no transition' : ''}
          {automaton.type === 'DFA' ? ' · exactly one move per state and symbol' : ''}
        </p>
      </div>

      <div>
        <h3 className="section-title mb-2 flex items-center gap-1.5">
          <Lightbulb size={14} /> How it works
        </h3>
        <div className="space-y-2 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          {paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </div>
    </section>
  );
}
