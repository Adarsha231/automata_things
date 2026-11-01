export default function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-600 dark:text-slate-300" aria-label="Legend">
      <li className="flex items-center gap-2">
        <svg width="40" height="22" aria-hidden="true">
          <line x1="1" y1="11" x2="12" y2="11" stroke="#38bdf8" strokeWidth="2.4" />
          <path d="M12,6 L19,11 L12,16 z" fill="#38bdf8" />
          <circle cx="29" cy="11" r="8" className="fill-indigo-100 stroke-indigo-500 dark:fill-navy-700" strokeWidth="2" />
        </svg>
        Initial state
      </li>
      <li className="flex items-center gap-2">
        <svg width="22" height="22" aria-hidden="true">
          <circle cx="11" cy="11" r="9" className="fill-indigo-100 stroke-indigo-500 dark:fill-navy-700" strokeWidth="2" />
        </svg>
        Intermediate
      </li>
      <li className="flex items-center gap-2">
        <svg width="22" height="22" aria-hidden="true">
          <circle cx="11" cy="11" r="9.5" className="fill-emerald-50 stroke-emerald-500 dark:fill-navy-700" strokeWidth="2" />
          <circle cx="11" cy="11" r="5.5" fill="none" className="stroke-emerald-500" strokeWidth="1.6" />
        </svg>
        Final (accepting)
      </li>
      <li className="flex items-center gap-2">
        <svg width="22" height="22" aria-hidden="true">
          <circle cx="11" cy="11" r="9" fill="#6366f1" stroke="#c7d2fe" strokeWidth="2" />
        </svg>
        Active in simulation
      </li>
    </ul>
  );
}
