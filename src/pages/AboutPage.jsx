import { SUPPORTED_TEMPLATES } from '../engine/languages.js';

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight">About ATC Automata Visualizer</h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">A study aid for Automata Theory and Computability. Everything runs in your browser — no data is sent anywhere.</p>
      </header>

      <section className="card space-y-3 p-6 text-sm leading-relaxed">
        <h2 className="text-lg font-bold">How automata are generated</h2>
        <ol className="list-decimal space-y-1.5 pl-5">
          <li>The regular expression is parsed by a recursive-descent parser into a syntax tree.</li>
          <li><strong>Thompson’s construction</strong> turns the tree into an ε-NFA.</li>
          <li>For an <strong>NFA</strong>, ε-transitions are eliminated using ε-closures and useless states are dropped.</li>
          <li>For a <strong>DFA</strong>, the <strong>subset construction</strong> is applied, a trap state completes the machine, and <strong>Moore’s algorithm</strong> minimises it.</li>
          <li>Simulation tracks the set of active states and applies the <strong>ε-closure</strong> after every move.</li>
        </ol>
      </section>

      <section className="card space-y-3 p-6 text-sm leading-relaxed">
        <h2 className="text-lg font-bold">Regular expression syntax</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li><code className="font-mono">a|b</code> (or <code className="font-mono">a∪b</code>) — union</li>
          <li><code className="font-mono">ab</code> — concatenation</li>
          <li><code className="font-mono">a*</code> zero or more · <code className="font-mono">a+</code> one or more · <code className="font-mono">a?</code> optional</li>
          <li><code className="font-mono">( )</code> grouping · <code className="font-mono">ε</code> empty string · <code className="font-mono">∅</code> empty language · <code className="font-mono">.</code> any alphabet symbol</li>
          <li>Symbols are single letters or digits. Use <code className="font-mono">\</code> to escape.</li>
        </ul>
      </section>

      <section className="card space-y-3 p-6 text-sm leading-relaxed">
        <h2 className="text-lg font-bold">Supported language descriptions</h2>
        <p>Arbitrary English cannot be turned into an automaton reliably, so descriptions are matched against a fixed list of templates. The interpreted formal language is always shown for your confirmation, and unsupported or ambiguous input is rejected with an explanation instead of guessing.</p>
        <ul className="list-disc space-y-1 pl-5 font-mono text-xs">
          {SUPPORTED_TEMPLATES.map((t) => <li key={t}>{t}</li>)}
        </ul>
        <p>Combined conditions (for example “starts with 1 <em>and</em> ends with 0”) are not supported — write a regular expression instead.</p>
      </section>

      <section className="card space-y-2 p-6 text-sm leading-relaxed">
        <h2 className="text-lg font-bold">Limits</h2>
        <p>Expressions are limited to 200 characters, and a DFA to 200 states, to keep diagrams legible. Some expressions (like <code className="font-mono">(a|b)*a(a|b)(a|b)(a|b)(a|b)(a|b)(a|b)(a|b)</code>) have exponentially large DFAs — try the NFA or ε-NFA view for those.</p>
      </section>
    </div>
  );
}
