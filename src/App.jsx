import { useEffect, useState } from 'react';
import Header, { PAGES } from './components/Header.jsx';
import HomePage from './pages/HomePage.jsx';
import GeneratorPage from './pages/GeneratorPage.jsx';
import LearnPage from './pages/LearnPage.jsx';
import AboutPage from './pages/AboutPage.jsx';
import { useTheme } from './hooks/useTheme.js';

const readHash = () => {
  const id = window.location.hash.replace('#/', '').replace('#', '');
  return PAGES.some((p) => p.id === id) ? id : 'home';
};

export default function App() {
  const [theme, toggleTheme] = useTheme();
  const [page, setPage] = useState(readHash);
  const [preset, setPreset] = useState(null);

  useEffect(() => {
    const onHash = () => setPage(readHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const navigate = (id) => {
    window.location.hash = `#/${id}`;
    setPage(id);
    window.scrollTo({ top: 0 });
  };

  const tryExample = (ex) => {
    setPreset({ form: { inputType: ex.inputType, text: ex.text, alphabet: ex.alphabet, type: 'DFA' }, nonce: Date.now() });
    navigate('generator');
  };

  return (
    <div className="min-h-screen">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-indigo-600 focus:px-3 focus:py-2 focus:text-white">
        Skip to content
      </a>
      <Header page={page} onNavigate={navigate} theme={theme} onToggleTheme={toggleTheme} />
      <main id="main">
        {page === 'home' && <HomePage onNavigate={navigate} onTryExample={tryExample} />}
        {/* Keep the generator mounted so work survives tab switches. */}
        <div hidden={page !== 'generator'}>
          <GeneratorPage theme={theme} preset={preset} />
        </div>
        {page === 'learn' && <LearnPage />}
        {page === 'about' && <AboutPage />}
      </main>
      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-500 dark:border-white/10 dark:text-slate-400">
        ATC Automata Visualizer · built for Automata Theory &amp; Computability students
      </footer>
    </div>
  );
}
