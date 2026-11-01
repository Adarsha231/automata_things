import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Download, Maximize2, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';
import { findDeadStates, stateName } from '../engine/automaton.js';
import { R, computeBounds, computeEdges, layoutAutomaton } from '../utils/layout.js';
import { downloadPng, downloadSvg } from '../utils/export.js';
import Legend from './Legend.jsx';

const PALETTES = {
  dark: {
    bg: '#0d1530',
    node: '#17214a',
    nodeStroke: '#818cf8',
    final: '#34d399',
    text: '#e0e7ff',
    edge: '#94a3b8',
    label: '#e2e8f0',
    labelBg: '#0d1530',
    active: '#6366f1',
    activeStroke: '#c7d2fe',
    activeEdge: '#a5b4fc',
    initial: '#38bdf8',
    dead: '#64748b',
  },
  light: {
    bg: '#ffffff',
    node: '#eef2ff',
    nodeStroke: '#4f46e5',
    final: '#059669',
    text: '#1e1b4b',
    edge: '#64748b',
    label: '#1e293b',
    labelBg: '#ffffff',
    active: '#6366f1',
    activeStroke: '#312e81',
    activeEdge: '#4338ca',
    initial: '#0284c7',
    dead: '#94a3b8',
  },
};

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const FONT = 'Inter, ui-sans-serif, system-ui, sans-serif';

export default function AutomatonCanvas({ automaton, highlight, theme }) {
  const pal = PALETTES[theme] ?? PALETTES.dark;
  const wrapRef = useRef(null);
  const svgRef = useRef(null);
  const drag = useRef(null);
  const pendingFit = useRef(false);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [view, setView] = useState({ x: 0, y: 0, k: 1 });
  const [positions, setPositions] = useState({});
  const [panning, setPanning] = useState(false);
  const [exportError, setExportError] = useState('');

  const edges = useMemo(() => (automaton ? computeEdges(automaton, positions) : []), [automaton, positions]);
  const dead = useMemo(() => (automaton ? findDeadStates(automaton) : new Set()), [automaton]);
  const finals = useMemo(() => new Set(automaton?.finals ?? []), [automaton]);
  const activeStates = useMemo(() => new Set(highlight?.states ?? []), [highlight]);
  const activeEdgeKeys = useMemo(
    () => new Set((highlight?.edges ?? []).map((e) => `${e.from}>${e.to}`)),
    [highlight],
  );

  // Track container size.
  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fit = useCallback(
    (pos = positions) => {
      if (!automaton || !size.w || !size.h) return;
      const b = computeBounds(pos, computeEdges(automaton, pos));
      const k = clamp(Math.min(size.w / b.w, size.h / b.h), 0.25, 1.3);
      setView({ k, x: (size.w - b.w * k) / 2 - b.minX * k, y: (size.h - b.h * k) / 2 - b.minY * k });
    },
    [automaton, positions, size.w, size.h],
  );

  // New automaton → fresh layout and fit.
  useEffect(() => {
    if (!automaton) {
      setPositions({});
      return;
    }
    setPositions(layoutAutomaton(automaton));
    pendingFit.current = true;
  }, [automaton]);

  useLayoutEffect(() => {
    if (pendingFit.current && size.w && Object.keys(positions).length) {
      pendingFit.current = false;
      fit(positions);
    }
  }, [positions, size.w, size.h, fit]);

  // Wheel zoom around the cursor (non-passive so we can preventDefault).
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const mx = e.clientX - r.left;
      const my = e.clientY - r.top;
      setView((v) => {
        const k = clamp(v.k * Math.exp(-e.deltaY * 0.0015), 0.2, 4);
        const f = k / v.k;
        return { k, x: mx - (mx - v.x) * f, y: my - (my - v.y) * f };
      });
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [automaton]);

  const zoomBy = (f) =>
    setView((v) => {
      const k = clamp(v.k * f, 0.2, 4);
      const cx = size.w / 2;
      const cy = size.h / 2;
      return { k, x: cx - (cx - v.x) * (k / v.k), y: cy - (cy - v.y) * (k / v.k) };
    });

  const resetLayout = () => {
    const pos = layoutAutomaton(automaton);
    setPositions(pos);
    fit(pos);
  };

  const toWorld = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    return { x: (e.clientX - r.left - view.x) / view.k, y: (e.clientY - r.top - view.y) / view.k };
  };

  const onNodeDown = (e, id) => {
    e.stopPropagation();
    svgRef.current.setPointerCapture(e.pointerId);
    const w = toWorld(e);
    drag.current = { type: 'node', id, dx: positions[id].x - w.x, dy: positions[id].y - w.y };
  };
  const onBgDown = (e) => {
    svgRef.current.setPointerCapture(e.pointerId);
    drag.current = { type: 'pan', sx: e.clientX, sy: e.clientY, vx: view.x, vy: view.y };
    setPanning(true);
  };
  const onMove = (e) => {
    const d = drag.current;
    if (!d) return;
    if (d.type === 'node') {
      const w = toWorld(e);
      setPositions((p) => ({ ...p, [d.id]: { x: w.x + d.dx, y: w.y + d.dy } }));
    } else {
      setView((v) => ({ ...v, x: d.vx + e.clientX - d.sx, y: d.vy + e.clientY - d.sy }));
    }
  };
  const onUp = () => {
    drag.current = null;
    setPanning(false);
  };
  const onNodeKey = (e, id) => {
    const step = e.shiftKey ? 30 : 10;
    const delta = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] }[e.key];
    if (!delta) return;
    e.preventDefault();
    setPositions((p) => ({ ...p, [id]: { x: p[id].x + delta[0], y: p[id].y + delta[1] } }));
  };

  // ---- Export -------------------------------------------------------------
  const buildExportSvg = () => {
    const b = computeBounds(positions, edges);
    const clone = svgRef.current.cloneNode(true);
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('viewBox', `${b.minX} ${b.minY} ${b.w} ${b.h}`);
    clone.setAttribute('width', Math.ceil(b.w));
    clone.setAttribute('height', Math.ceil(b.h));
    clone.removeAttribute('class');
    clone.removeAttribute('style');
    const content = clone.querySelector('[data-content]');
    content.removeAttribute('transform');
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('x', b.minX);
    rect.setAttribute('y', b.minY);
    rect.setAttribute('width', b.w);
    rect.setAttribute('height', b.h);
    rect.setAttribute('fill', pal.bg);
    clone.insertBefore(rect, content);
    clone.querySelectorAll('[data-no-export]').forEach((n) => n.remove());
    return { svg: new XMLSerializer().serializeToString(clone), w: Math.ceil(b.w), h: Math.ceil(b.h) };
  };
  const exportSvg = () => {
    try {
      downloadSvg(buildExportSvg().svg);
      setExportError('');
    } catch (e) {
      setExportError(e.message);
    }
  };
  const exportPng = async () => {
    try {
      const { svg, w, h } = buildExportSvg();
      await downloadPng(svg, w, h);
      setExportError('');
    } catch (e) {
      setExportError(e.message);
    }
  };

  if (!automaton) return null;

  const labelWidth = (text) => Math.max(18, text.length * 7.4 + 10);

  return (
    <div className="relative flex h-full min-h-[420px] flex-col">
      <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2" role="toolbar" aria-label="Diagram controls">
        <button className="btn-icon" onClick={() => zoomBy(1.2)} aria-label="Zoom in" title="Zoom in">
          <ZoomIn size={16} />
        </button>
        <button className="btn-icon" onClick={() => zoomBy(1 / 1.2)} aria-label="Zoom out" title="Zoom out">
          <ZoomOut size={16} />
        </button>
        <button className="btn-icon" onClick={() => fit()} aria-label="Fit to screen" title="Fit to screen">
          <Maximize2 size={16} />
        </button>
        <button className="btn-icon" onClick={resetLayout} aria-label="Reset layout" title="Reset layout">
          <RotateCcw size={16} />
        </button>
      </div>
      <div className="absolute right-3 top-3 z-10 flex gap-2">
        <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={exportSvg} aria-label="Export as SVG">
          <Download size={14} /> SVG
        </button>
        <button className="btn-ghost !px-3 !py-1.5 text-xs" onClick={exportPng} aria-label="Export as PNG">
          <Download size={14} /> PNG
        </button>
      </div>

      <div ref={wrapRef} className="canvas-grid relative min-h-0 flex-1 overflow-hidden rounded-xl">
        <svg
          ref={svgRef}
          role="img"
          aria-label={`${automaton.type} diagram with ${automaton.states.length} states. Initial state ${stateName(automaton.start)}. Final states ${automaton.finals.map(stateName).join(', ') || 'none'}.`}
          className={`absolute inset-0 h-full w-full touch-none select-none ${panning ? 'cursor-grabbing' : 'cursor-grab'}`}
          onPointerDown={onBgDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          fontFamily={FONT}
        >
          <defs>
            <marker id="arrow" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill={pal.edge} />
            </marker>
            <marker id="arrow-active" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill={pal.activeEdge} />
            </marker>
            <marker id="arrow-initial" viewBox="0 0 10 10" refX="10" refY="5" markerWidth="8" markerHeight="8" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill={pal.initial} />
            </marker>
          </defs>
          <g data-content transform={`translate(${view.x} ${view.y}) scale(${view.k})`}>
            {/* edges */}
            {edges.map((e) => {
              const active = activeEdgeKeys.has(e.key);
              return (
                <g key={e.key}>
                  <path
                    d={e.d}
                    fill="none"
                    stroke={active ? pal.activeEdge : pal.edge}
                    strokeWidth={active ? 3 : 1.7}
                    markerEnd={`url(#${active ? 'arrow-active' : 'arrow'})`}
                  />
                  <rect
                    x={e.lx - labelWidth(e.label) / 2}
                    y={e.ly - 10}
                    width={labelWidth(e.label)}
                    height={20}
                    rx={6}
                    fill={pal.labelBg}
                    fillOpacity={0.88}
                  />
                  <text
                    x={e.lx}
                    y={e.ly}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={14}
                    fontWeight={600}
                    fill={active ? pal.activeEdge : pal.label}
                  >
                    {e.label}
                  </text>
                </g>
              );
            })}

            {/* initial-state arrow */}
            {positions[automaton.start] && (
              <line
                x1={positions[automaton.start].x - R - 42}
                y1={positions[automaton.start].y}
                x2={positions[automaton.start].x - R - 1}
                y2={positions[automaton.start].y}
                stroke={pal.initial}
                strokeWidth={2.4}
                markerEnd="url(#arrow-initial)"
              />
            )}

            {/* states */}
            {automaton.states.map((s) => {
              const p = positions[s];
              if (!p) return null;
              const active = activeStates.has(s);
              const isFinal = finals.has(s);
              return (
                <g
                  key={s}
                  transform={`translate(${p.x} ${p.y})`}
                  onPointerDown={(e) => onNodeDown(e, s)}
                  onKeyDown={(e) => onNodeKey(e, s)}
                  tabIndex={0}
                  role="img"
                  aria-label={`State ${stateName(s)}${s === automaton.start ? ', initial' : ''}${isFinal ? ', final' : ''}${dead.has(s) ? ', trap' : ''}${active ? ', active' : ''}`}
                  className="cursor-pointer outline-none"
                >
                  {active && <circle r={R + 7} fill="none" stroke={pal.activeEdge} strokeOpacity={0.45} strokeWidth={5} />}
                  <circle
                    r={R}
                    fill={active ? pal.active : pal.node}
                    stroke={isFinal ? pal.final : pal.nodeStroke}
                    strokeWidth={2.2}
                    strokeDasharray={dead.has(s) ? '5 4' : undefined}
                  />
                  {isFinal && (
                    <circle r={R - 5} fill="none" stroke={isFinal ? pal.final : pal.nodeStroke} strokeWidth={2} />
                  )}
                  <text
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={15}
                    fontWeight={700}
                    fill={active ? '#ffffff' : pal.text}
                    style={{ pointerEvents: 'none' }}
                  >
                    {stateName(s)}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <Legend />
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Drag states to rearrange · scroll to zoom · drag background to pan
          {exportError && <span className="ml-2 text-rose-500">{exportError}</span>}
        </p>
      </div>
    </div>
  );
}
