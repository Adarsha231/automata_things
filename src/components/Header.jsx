import { useState } from 'react';
import { Menu, Moon, Sun, X } from 'lucide-react';

export const PAGES = [
  { id: 'home', label: 'Home' },
  { id: 'generator', label: 'Automata Generator' },
  { id: 'learn', label: 'Learn' },
  { id: 'about', label: 'About' },
];

function GithubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.1.79-.25.79-.56v-2c-3.2.7-3.87-1.37-3.87-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.15.08 1.76 1.19 1.76 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.28 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.78 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 23.5 12C23.5 5.65 18.35.5 12 .5z" />
    </svg>
  );
}

export default function Header({ page, onNavigate, theme, onToggleTheme }) {
  const [open, setOpen] = useState(false);

  const go = (id) => {
    onNavigate(id);
    setOpen(false);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-white/10 dark:bg-navy-950/80">
      <div className="mx-auto flex max-w-[1700px] items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <button onClick={() => go('home')} className="flex items-center gap-2.5" aria-label="ATC Automata Visualizer home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-600/30">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="5" />
            </svg>
          </span>
          <span className="text-left leading-tight">
            <span className="block text-sm font-extrabold tracking-tight sm:text-base">ATC Automata Visualizer</span>
            <span className="hidden text-[11px] text-slate-500 dark:text-slate-400 sm:block">Automata Theory &amp; Computability</span>
          </span>
        </button>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {PAGES.map((p) => (
            <button
              key={p.id}
              onClick={() => go(p.id)}
              aria-current={page === p.id ? 'page' : undefined}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                page === p.id
                  ? 'bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-200'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'
              }`}
            >
              {p.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <button className="btn-icon" onClick={onToggleTheme} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`} title="Toggle theme">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <a className="btn-icon" href="https://github.com/" target="_blank" rel="noreferrer" aria-label="GitHub (placeholder link)" title="GitHub (placeholder)">
            <GithubIcon />
          </a>
          <button className="btn-icon md:hidden" onClick={() => setOpen((o) => !o)} aria-label="Toggle menu" aria-expanded={open}>
            {open ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="animate-fade-in border-t border-slate-200 px-4 py-2 dark:border-white/10 md:hidden" aria-label="Mobile">
          {PAGES.map((p) => (
            <button
              key={p.id}
              onClick={() => go(p.id)}
              aria-current={page === p.id ? 'page' : undefined}
              className={`block w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold ${
                page === p.id ? 'bg-indigo-600/10 text-indigo-600 dark:text-indigo-200' : ''
              }`}
            >
              {p.label}
            </button>
          ))}
        </nav>
      )}
    </header>
  );
}
