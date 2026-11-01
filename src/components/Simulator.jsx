import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Pause, Play, SkipBack, SkipForward, XCircle, AlertTriangle } from 'lucide-react';
import { formatPath, sampleStrings, simulate } from '../engine/simulate.js';
import { stateName } from '../engine/automaton.js';

const EMPTY = { states: [], edges: [] };

export default function Simulator({ automaton, onHighlight }) {
  const [input, setInput] = useState('');
  const [run, setRun] = useState(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(900);
  const [error, setError] = useState('');

  const samples = useMemo(() => (automaton ? sampleStrings(automaton) : { accepted: [], rejected: [] }), [automaton]);

  // Reset whenever the automaton changes (keeps simulator in sync with the diagram).
  useEffect(() => {
    setRun(null);
    setIdx(0);
    setPlaying(false);
    setError('');
  }, [automaton]);

  useEffect(() => {
    onHighlight(run ? { states: run.steps[idx].active, edges: run.steps[idx].edges } : EMPTY);
  }, [run, idx, onHighlight]);

  useEffect(() => {
    if (!playing || !run) return undefined;
    if (idx >= run.steps.length - 1) {
      setPlaying(false);
      return undefined;
    }
    const t = setTimeout(() => setIdx((i) => i + 1), speed);
    return () => clearTimeout(t);
  }, [playing, idx, run, speed]);

  const start = (str) => {
    const r = simulate(automaton, str);
    if (r.error) {
      setError(r.error);
      setRun(null);
      return;
    }
    setError('');
    setRun(r);
    setIdx(0);
    setPlaying(r.steps.length > 1);
  };

  const last = run ? run.steps.length - 1 : 0;
  const done = run && idx === last;
  const disabled = !automaton;

  return (
    <section className="card p-5" aria-labelledby="sim-title">
      <h2 id="sim-title" className="text-base font-bold">Test string simulator</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
        Enter a string and watch the active state{automaton?.type === 'DFA' ? '' : 's'} change on the diagram. Leave empty to test the empty string ε.
      </p>

      <form
        className="mt-4 flex flex-col gap-2 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          if (!disabled) start(input);
        }}
      >
        <label className="sr-only" htmlFor="sim-input">Test string</label>
        <input
          id="sim-input"
          className="field font-mono"
          placeholder={automaton ? `e.g. ${automaton.alphabet.join('')}${automaton.alphabet.join('')}` : 'Generate an automaton first'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={disabled}
          autoComplete="off"
          spellCheck="false"
          aria-invalid={Boolean(error)}
        />
        <button type="submit" className="btn-primary shrink-0" disabled={disabled}>
          <Play size={16} /> Run simulation
        </button>
      </form>

      {error && (
        <p role="alert" className="mt-2 flex items-center gap-1.5 text-sm text-rose-500">
          <AlertTriangle size={14} /> {error}
        </p>
      )}

      {automaton && (samples.accepted.length > 0 || samples.rejected.length > 0) && (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="section-title">Try</span>
          {samples.accepted.map((s) => (
            <button key={`a${s}`} className="rounded-full border border-emerald-500/40 px-2.5 py-1 font-mono text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-300" onClick={() => { setInput(s); start(s); }} title="This string is accepted">
              {s || 'ε'} ✓
            </button>
          ))}
          {samples.rejected.map((s) => (
            <button key={`r${s}`} className="rounded-full border border-rose-500/40 px-2.5 py-1 font-mono text-rose-600 hover:bg-rose-500/10 dark:text-rose-300" onClick={() => { setInput(s); start(s); }} title="This string is rejected">
              {s || 'ε'} ✗
            </button>
          ))}
        </div>
      )}

      {run && (
        <div className="mt-5 animate-fade-in space-y-4">
          {/* input tape */}
          <div className="flex flex-wrap items-center gap-1.5" aria-label="Input tape">
            {run.input.length === 0 && <span className="font-mono text-sm text-slate-500">ε (empty string)</span>}
            {run.input.map((c, i) => (
              <span
                key={i}
                className={`flex h-9 w-9 items-center justify-center rounded-lg border font-mono text-base font-bold transition ${
                  i < idx
                    ? 'border-indigo-400 bg-indigo-500/20 text-indigo-700 dark:text-indigo-200'
                    : i === idx
                      ? 'border-amber-400 bg-amber-400/20 ring-2 ring-amber-400/60'
                      : 'border-slate-300 text-slate-500 dark:border-white/15'
                }`}
              >
                {c}
              </span>
            ))}
          </div>

          {/* controls */}
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-icon" aria-label="Previous step" onClick={() => { setPlaying(false); setIdx((i) => Math.max(0, i - 1)); }} disabled={idx === 0}>
              <SkipBack size={16} />
            </button>
            <button className="btn-icon" aria-label={playing ? 'Pause' : 'Play'} onClick={() => { if (done) setIdx(0); setPlaying((p) => !p); }}>
              {playing ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button className="btn-icon" aria-label="Next step" onClick={() => { setPlaying(false); setIdx((i) => Math.min(last, i + 1)); }} disabled={done}>
              <SkipForward size={16} />
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-400">Step {idx} / {last}</span>
            <label className="ml-auto flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              Speed
              <select className="field !w-auto !py-1 text-xs" value={speed} onChange={(e) => setSpeed(Number(e.target.value))}>
                <option value={1500}>Slow</option>
                <option value={900}>Normal</option>
                <option value={400}>Fast</option>
              </select>
            </label>
          </div>

          {/* current step */}
          <div className="rounded-xl bg-slate-100 p-3 dark:bg-navy-800" aria-live="polite">
            <p className="text-sm">{run.steps[idx].description}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="section-title mr-1">Active</span>
              {run.steps[idx].active.length ? (
                run.steps[idx].active.map((s) => <span key={s} className="chip">{stateName(s)}</span>)
              ) : (
                <span className="text-sm text-rose-500">no active states</span>
              )}
            </div>
          </div>

          {/* verdict */}
          {done && (
            <div
              role="status"
              className={`animate-pop rounded-xl border p-4 ${
                run.accepted
                  ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                  : 'border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-200'
              }`}
            >
              <p className="flex items-center gap-2 text-base font-bold">
                {run.accepted ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
                {run.accepted ? 'Accepted' : 'Rejected'}
              </p>
              <p className="mt-1 text-sm">{run.reason}</p>
              {run.accepted && run.path && (
                <p className="mt-2 break-words font-mono text-xs">Accepting path: {formatPath(automaton, run.path)}</p>
              )}
            </div>
          )}

          {/* full trace */}
          <details className="text-sm">
            <summary className="cursor-pointer select-none font-semibold text-indigo-600 dark:text-indigo-300">Full trace</summary>
            <ol className="mt-2 max-h-52 space-y-1 overflow-auto pr-1 font-mono text-xs">
              {run.steps.map((s) => (
                <li key={s.index}>
                  <button
                    className={`w-full rounded-md px-2 py-1 text-left transition ${s.index === idx ? 'bg-indigo-500/20' : 'hover:bg-slate-100 dark:hover:bg-white/5'}`}
                    onClick={() => { setPlaying(false); setIdx(s.index); }}
                  >
                    {s.index}. {s.description}
                  </button>
                </li>
              ))}
            </ol>
          </details>
        </div>
      )}
    </section>
  );
}
