import { useMemo } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Sparkles, Trash2 } from 'lucide-react';
import { EXAMPLES, REGEX_EXAMPLES } from '../engine/examples.js';
import { interpret } from '../engine/generate.js';
import { SUPPORTED_TEMPLATES } from '../engine/languages.js';

const TYPES = [
  { id: 'DFA', title: 'DFA', desc: 'Deterministic: exactly one move per state and symbol. No ε.' },
  { id: 'NFA', title: 'NFA', desc: 'Nondeterministic: several (or no) moves per symbol. No ε.' },
  { id: 'ENFA', title: 'ε-NFA', desc: 'NFA that may also jump on ε without reading input.' },
];

export default function InputPanel({ form, setForm, onGenerate, onReset, onExample, loading, hasResult }) {
  const isRegex = form.inputType === 'regex';

  const validation = useMemo(() => {
    if (!form.text.trim()) return { level: 'empty' };
    const r = interpret(form);
    return r.ok ? { level: 'ok', interpretation: r.interpretation } : { level: 'error', error: r.error };
  }, [form]);

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));

  return (
    <aside className="card space-y-5 p-5" aria-label="Input panel">
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          onGenerate();
        }}
      >
        <fieldset>
          <legend className="section-title mb-2">Input type</legend>
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1 dark:bg-navy-950">
            {[
              ['language', 'Formal language'],
              ['regex', 'Regular expression'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={form.inputType === id}
                onClick={() => set({ inputType: id })}
                className={`rounded-lg px-2 py-2 text-xs font-semibold transition ${
                  form.inputType === id
                    ? 'bg-indigo-600 text-white shadow'
                    : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-white/10'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label htmlFor="lang-input" className="section-title mb-2 block">
            {isRegex ? 'Regular expression' : 'Language description'}
          </label>
          <textarea
            id="lang-input"
            rows={3}
            className={`field font-mono ${validation.level === 'error' ? '!border-rose-400' : ''}`}
            placeholder={isRegex ? '(0|1)*01' : 'All binary strings ending with 01'}
            value={form.text}
            onChange={(e) => set({ text: e.target.value })}
            spellCheck="false"
            aria-invalid={validation.level === 'error'}
            aria-describedby="input-feedback"
          />
          <div id="input-feedback" className="mt-2 text-xs" aria-live="polite">
            {validation.level === 'ok' && (
              <p className="flex items-start gap-1.5 text-emerald-600 dark:text-emerald-300">
                <CheckCircle2 size={14} className="mt-0.5 shrink-0" />
                <span>
                  {isRegex ? 'Valid expression.' : 'Recognised as:'}{' '}
                  {!isRegex && <span className="font-mono">{validation.interpretation.description}</span>}
                </span>
              </p>
            )}
            {validation.level === 'error' && (
              <p className="flex items-start gap-1.5 text-rose-600 dark:text-rose-300">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" />
                <span>{validation.error.message}</span>
              </p>
            )}
            {validation.level === 'empty' && (
              <p className="text-slate-500 dark:text-slate-400">
                {isRegex ? (
                  <>
                    Syntax: <code className="font-mono">|</code> union, <code className="font-mono">*</code> star,{' '}
                    <code className="font-mono">+</code> one or more, <code className="font-mono">?</code> optional,{' '}
                    <code className="font-mono">( )</code> grouping, <code className="font-mono">ε</code> empty string,{' '}
                    <code className="font-mono">.</code> any symbol.
                  </>
                ) : (
                  <>Supported: {SUPPORTED_TEMPLATES.slice(0, 5).join(' · ')} …</>
                )}
              </p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="alphabet-input" className="section-title mb-2 block">Alphabet (Σ)</label>
          <input
            id="alphabet-input"
            className="field font-mono"
            placeholder="Auto-detect, or e.g. 0, 1"
            value={form.alphabet}
            onChange={(e) => set({ alphabet: e.target.value })}
            autoComplete="off"
            spellCheck="false"
          />
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {validation.level === 'ok' ? (
              <>
                {form.alphabet.trim() ? 'Using' : 'Detected'}:{' '}
                <span className="font-mono font-semibold">{`{${validation.interpretation.alphabet.join(', ')}}`}</span>
              </>
            ) : (
              'Single symbols separated by commas. Leave empty to detect automatically.'
            )}
          </p>
        </div>

        <fieldset>
          <legend className="section-title mb-2">Automaton type</legend>
          <div className="grid gap-2" role="radiogroup">
            {TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={form.type === t.id}
                onClick={() => set({ type: t.id })}
                className={`rounded-xl border p-3 text-left transition ${
                  form.type === t.id
                    ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500'
                    : 'border-slate-200 hover:border-indigo-300 dark:border-white/10 dark:hover:border-indigo-400/50'
                }`}
              >
                <span className="block text-sm font-bold">{t.title}</span>
                <span className="block text-xs text-slate-500 dark:text-slate-400">{t.desc}</span>
              </button>
            ))}
          </div>
        </fieldset>

        <div className="flex gap-2">
          <button type="submit" className="btn-primary flex-1" disabled={loading || validation.level === 'empty'}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {loading ? 'Generating…' : 'Generate automaton'}
          </button>
          <button type="button" className="btn-ghost !px-3" onClick={onReset} aria-label="Reset and clear automaton" title="Reset" disabled={loading}>
            <Trash2 size={16} />
          </button>
        </div>
        {hasResult && (
          <p className="text-xs text-slate-500 dark:text-slate-400">Changed the type? Press Generate again to rebuild.</p>
        )}
      </form>

      <div>
        <h2 className="section-title mb-2">Example problems</h2>
        <ul className="space-y-1.5">
          {EXAMPLES.map((ex) => (
            <li key={ex.id}>
              <button
                type="button"
                onClick={() => onExample(ex)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-left text-sm transition hover:border-indigo-400 hover:bg-indigo-500/5 dark:border-white/10"
              >
                {ex.label}
              </button>
            </li>
          ))}
        </ul>
        <h3 className="section-title mb-2 mt-4">Regular expressions</h3>
        <div className="flex flex-wrap gap-2">
          {REGEX_EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              type="button"
              onClick={() => onExample(ex)}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 font-mono text-xs transition hover:border-indigo-400 hover:bg-indigo-500/5 dark:border-white/10"
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
