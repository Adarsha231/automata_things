import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, Check, Info, Loader2, Workflow } from 'lucide-react';
import InputPanel from '../components/InputPanel.jsx';
import AutomatonCanvas from '../components/AutomatonCanvas.jsx';
import DetailsPanel from '../components/DetailsPanel.jsx';
import Simulator from '../components/Simulator.jsx';
import { buildAutomaton, interpret } from '../engine/generate.js';

const EMPTY_HL = { states: [], edges: [] };
const DEFAULT_FORM = { inputType: 'language', text: '', alphabet: '', type: 'DFA' };

function ConfirmCard({ interpretation, type, onConfirm, onCancel }) {
  return (
    <div className="m-auto max-w-lg animate-pop rounded-2xl border border-indigo-500/40 bg-indigo-500/5 p-6" role="dialog" aria-labelledby="confirm-title">
      <h3 id="confirm-title" className="flex items-center gap-2 text-base font-bold">
        <Info size={18} className="text-indigo-500" /> Is this the language you meant?
      </h3>
      <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
        Your description: <em>“{interpretation.original}”</em>
      </p>
      <p className="mt-3 rounded-xl bg-white p-3 font-mono text-sm shadow-inner dark:bg-navy-950">{interpretation.description}</p>
      {interpretation.regex && (
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Equivalent regular expression: <code className="font-mono">{interpretation.regex}</code>
        </p>
      )}
      {interpretation.notes.map((n) => (
        <p key={n} className="mt-2 text-xs text-slate-500 dark:text-slate-400">{n}</p>
      ))}
      <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
        Natural language is only supported through fixed templates, so please confirm before drawing the {type === 'ENFA' ? 'ε-NFA' : type}.
      </p>
      <div className="mt-4 flex gap-2">
        <button className="btn-primary" onClick={onConfirm}>
          <Check size={16} /> Confirm &amp; generate
        </button>
        <button className="btn-ghost" onClick={onCancel}>Edit description</button>
      </div>
    </div>
  );
}

export default function GeneratorPage({ theme, preset }) {
  const [form, setForm] = useState(DEFAULT_FORM);
  const [status, setStatus] = useState('idle'); // idle | loading | confirm | success | error
  const [pending, setPending] = useState(null);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [highlight, setHighlight] = useState(EMPTY_HL);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const finish = useCallback((interpretation, type) => {
    try {
      const built = buildAutomaton(interpretation, type);
      setResult({ ...built, interpretation });
      setStatus('success');
    } catch (e) {
      setError({ message: e.message });
      setStatus('error');
    }
  }, []);

  const run = useCallback(
    (f) => {
      clearTimeout(timer.current);
      setStatus('loading');
      setError(null);
      setResult(null);
      setPending(null);
      setHighlight(EMPTY_HL);
      timer.current = setTimeout(() => {
        const r = interpret(f);
        if (!r.ok) {
          setError(r.error);
          setStatus('error');
        } else if (f.inputType === 'language') {
          setPending(r.interpretation);
          setStatus('confirm');
        } else {
          finish(r.interpretation, f.type);
        }
      }, 350);
    },
    [finish],
  );

  const reset = () => {
    clearTimeout(timer.current);
    setForm(DEFAULT_FORM);
    setStatus('idle');
    setResult(null);
    setPending(null);
    setError(null);
    setHighlight(EMPTY_HL);
  };

  const loadExample = (ex) => {
    const next = { ...form, inputType: ex.inputType, text: ex.text, alphabet: ex.alphabet };
    setForm(next);
    run(next);
  };

  // Presets coming from the home page.
  useEffect(() => {
    if (!preset) return;
    const next = { ...DEFAULT_FORM, ...preset.form };
    setForm(next);
    run(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset]);

  const onHighlight = useCallback((h) => setHighlight(h), []);

  return (
    <div className="mx-auto grid max-w-[1700px] gap-5 p-4 sm:p-6 lg:grid-cols-[320px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)_360px]">
      <div className="lg:row-span-2 xl:row-span-1">
        <InputPanel
          form={form}
          setForm={setForm}
          onGenerate={() => run(form)}
          onReset={reset}
          onExample={loadExample}
          loading={status === 'loading'}
          hasResult={Boolean(result)}
        />
      </div>

      <div className="min-w-0 space-y-5">
        <section className="card flex min-h-[480px] flex-col p-3 sm:p-4" aria-labelledby="canvas-title" aria-busy={status === 'loading'}>
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2 px-1">
            <h2 id="canvas-title" className="text-base font-bold">Automaton diagram</h2>
            {result && (
              <p className="max-w-full truncate font-mono text-xs text-slate-500 dark:text-slate-400" title={result.interpretation.description}>
                {result.interpretation.description}
              </p>
            )}
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            {status === 'idle' && (
              <div className="m-auto max-w-sm py-16 text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-500">
                  <Workflow size={28} />
                </span>
                <h3 className="mt-4 text-base font-bold">No automaton yet</h3>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Enter a regular expression or language description, pick DFA / NFA / ε-NFA and press{' '}
                  <strong>Generate</strong> — or load one of the example problems.
                </p>
              </div>
            )}
            {status === 'loading' && (
              <div className="m-auto flex flex-col items-center gap-3 py-16 text-slate-500" role="status">
                <Loader2 size={34} className="animate-spin text-indigo-500" />
                <p className="text-sm">Building the automaton…</p>
              </div>
            )}
            {status === 'confirm' && pending && (
              <ConfirmCard
                interpretation={pending}
                type={form.type}
                onConfirm={() => finish(pending, form.type)}
                onCancel={() => setStatus('idle')}
              />
            )}
            {status === 'error' && error && (
              <div className="m-auto max-w-lg animate-pop rounded-2xl border border-rose-500/40 bg-rose-500/5 p-6" role="alert">
                <h3 className="flex items-center gap-2 text-base font-bold text-rose-600 dark:text-rose-300">
                  <AlertTriangle size={18} /> Could not generate an automaton
                </h3>
                <p className="mt-2 text-sm">{error.message}</p>
                {error.suggestion && <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{error.suggestion}</p>}
                {error.hints && (
                  <>
                    <p className="section-title mt-4">Supported templates</p>
                    <ul className="mt-1 list-inside list-disc text-sm text-slate-600 dark:text-slate-300">
                      {error.hints.map((h) => (
                        <li key={h} className="font-mono text-xs">{h}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}
            {status === 'success' && result && (
              <div className="animate-fade-in flex min-h-0 flex-1 flex-col">
                {result.notes.length > 0 && (
                  <p className="mb-2 flex items-start gap-1.5 rounded-lg bg-indigo-500/10 px-3 py-2 text-xs text-indigo-700 dark:text-indigo-200">
                    <Info size={14} className="mt-0.5 shrink-0" /> {result.notes.join(' ')}
                  </p>
                )}
                <div className="min-h-0 flex-1">
                  <AutomatonCanvas automaton={result.automaton} highlight={highlight} theme={theme} />
                </div>
              </div>
            )}
          </div>
        </section>

        <Simulator automaton={result?.automaton ?? null} onHighlight={onHighlight} />
      </div>

      <div className="min-w-0 lg:col-start-2 xl:col-start-auto">
        <DetailsPanel result={result} highlight={highlight} />
      </div>
    </div>
  );
}
