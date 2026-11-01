// @vitest-environment jsdom
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import App from './App.jsx';

beforeAll(() => {
  globalThis.ResizeObserver = class {
    constructor(cb) { this.cb = cb; }
    observe() { this.cb([{ contentRect: { width: 900, height: 520 } }]); }
    disconnect() {}
  };
  window.scrollTo = () => {};
});
afterEach(() => { cleanup(); vi.useRealTimers(); window.location.hash = ''; });

async function generate(text, type) {
  window.location.hash = '#/generator';
  vi.useFakeTimers();
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: /regular expression/i }));
  fireEvent.change(screen.getByLabelText(/regular expression/i, { selector: 'textarea' }), { target: { value: text } });
  if (type) fireEvent.click(screen.getByRole('radio', { name: new RegExp(type) }));
  fireEvent.click(screen.getByRole('button', { name: /generate automaton/i }));
  await act(async () => { vi.advanceTimersByTime(500); });
}

describe('App', () => {
  it('renders a DFA diagram, table and simulates a string', async () => {
    await generate('(0|1)*01', 'DFA');
    expect(document.querySelector('svg[role="img"] [data-content]')).not.toBeNull();
    expect(screen.getAllByRole('table').length).toBeGreaterThan(0);
    expect(document.body.textContent).toContain('→ q0');
    fireEvent.change(screen.getByLabelText('Test string'), { target: { value: '1101' } });
    fireEvent.click(screen.getByRole('button', { name: /run simulation/i }));
    for (let i = 0; i < 6; i++) await act(async () => { vi.advanceTimersByTime(1000); });
    expect(document.body.textContent).toContain('Accepted');
  });

  it('renders an ε-NFA with ε labels', async () => {
    await generate('(a|b)*abb', 'ε-NFA');
    expect(document.querySelector('svg[role="img"]').textContent).toContain('ε');
  });

  it('shows a helpful error for invalid regex', async () => {
    await generate('(0|1', 'DFA');
    expect(screen.getByRole('alert').textContent).toMatch(/Missing/);
  });

  it('asks for confirmation for formal-language input', async () => {
    window.location.hash = '#/generator';
    vi.useFakeTimers();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Binary strings ending with 01/ }));
    await act(async () => { vi.advanceTimersByTime(500); });
    expect(screen.getByRole('dialog').textContent).toMatch(/ends with 01/);
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }));
    expect(document.querySelector('svg[role="img"] [data-content]')).not.toBeNull();
  });
});
