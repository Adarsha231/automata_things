import { ArrowRight, BookOpen, Download, GitBranch, PlayCircle, Workflow } from 'lucide-react';
import { EXAMPLES } from '../engine/examples.js';

const FEATURES = [
  { icon: Workflow, title: 'Real algorithms', text: "Thompson's construction, subset construction, ε-closure and DFA minimisation — not hand-drawn guesses." },
  { icon: GitBranch, title: 'DFA · NFA · ε-NFA', text: 'Generate the same language as any of the three machines and compare the diagrams and tables.' },
  { icon: PlayCircle, title: 'Step-by-step simulator', text: 'Watch the active state set change symbol by symbol, with ε-closure shown for ε-NFAs.' },
  { icon: Download, title: 'Export & explore', text: 'Drag, zoom and pan the diagram, then export it as SVG or PNG for your assignments.' },
];

export default function HomePage({ onNavigate, onTryExample }) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <section className="relative overflow-hidden rounded-3xl border border-indigo-500/20 bg-gradient-to-br from-indigo-600 via-indigo-700 to-navy-900 p-8 text-white shadow-2xl shadow-indigo-900/30 sm:p-14">
        <svg className="pointer-events-none absolute -right-10 -top-6 hidden opacity-25 md:block" width="420" height="260" viewBox="0 0 420 260" fill="none" stroke="white" strokeWidth="2.5" aria-hidden="true">
          <circle cx="60" cy="130" r="30" />
          <circle cx="200" cy="60" r="30" />
          <circle cx="200" cy="200" r="30" />
          <circle cx="200" cy="200" r="24" />
          <circle cx="350" cy="130" r="30" />
          <circle cx="350" cy="130" r="24" />
          <path d="M88 118 L172 72 M88 142 L172 190 M230 62 L322 116 M230 198 L322 144" />
        </svg>
        <p className="text-sm font-semibold uppercase tracking-widest text-indigo-200">Automata Theory &amp; Computability</p>
        <h1 className="mt-3 max-w-2xl text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">See how automata really work.</h1>
        <p className="mt-4 max-w-xl text-base text-indigo-100 sm:text-lg">
          Type a regular expression or a simple language description and get a clean, interactive state diagram, transition table and step-by-step simulation.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button className="btn bg-white text-indigo-700 shadow-lg hover:bg-indigo-50" onClick={() => onNavigate('generator')}>
            Open the generator <ArrowRight size={16} />
          </button>
          <button className="btn border border-white/30 text-white hover:bg-white/10" onClick={() => onNavigate('learn')}>
            <BookOpen size={16} /> Learn the basics
          </button>
        </div>
      </section>

      <section className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Features">
        {FEATURES.map(({ icon: Icon, title, text }) => (
          <article key={title} className="card p-5 transition hover:-translate-y-0.5 hover:shadow-lg">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-500"><Icon size={20} /></span>
            <h2 className="mt-3 text-base font-bold">{title}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{text}</p>
          </article>
        ))}
      </section>

      <section className="mt-10" aria-labelledby="try-title">
        <h2 id="try-title" className="text-xl font-bold">Try an example</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EXAMPLES.map((ex) => (
            <button key={ex.id} onClick={() => onTryExample(ex)} className="card group flex items-center justify-between p-4 text-left transition hover:border-indigo-400">
              <span className="text-sm font-semibold">{ex.label}</span>
              <ArrowRight size={16} className="text-indigo-500 transition group-hover:translate-x-1" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
