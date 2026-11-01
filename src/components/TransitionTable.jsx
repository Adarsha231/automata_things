import { EPS, stateName, targets } from '../engine/automaton.js';

export default function TransitionTable({ automaton, activeStates = [] }) {
  const columns = automaton.type === 'ENFA' ? [...automaton.alphabet, EPS] : automaton.alphabet;
  const finals = new Set(automaton.finals);
  const active = new Set(activeStates);

  const cell = (s, sym) => {
    const t = [...new Set(targets(automaton, s, sym))].sort((a, b) => a - b);
    if (t.length === 0) return '∅';
    if (automaton.type === 'DFA') return stateName(t[0]);
    return `{${t.map(stateName).join(', ')}}`;
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-white/10">
      <table className="w-full min-w-[220px] border-collapse text-sm">
        <caption className="sr-only">Transition table of the {automaton.type}</caption>
        <thead>
          <tr className="bg-slate-100 text-left dark:bg-navy-800">
            <th scope="col" className="px-3 py-2 font-semibold">State</th>
            {columns.map((c) => (
              <th key={c} scope="col" className="px-3 py-2 font-mono font-semibold">{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {automaton.states.map((s) => (
            <tr
              key={s}
              className={`border-t border-slate-200 transition-colors dark:border-white/10 ${
                active.has(s) ? 'bg-indigo-100 dark:bg-indigo-500/25' : ''
              }`}
            >
              <th scope="row" className="whitespace-nowrap px-3 py-2 text-left font-mono font-semibold">
                {s === automaton.start ? '→ ' : ''}
                {finals.has(s) ? '* ' : ''}
                {stateName(s)}
              </th>
              {columns.map((c) => (
                <td key={c} className="whitespace-nowrap px-3 py-2 font-mono text-slate-700 dark:text-slate-300">
                  {cell(s, c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
