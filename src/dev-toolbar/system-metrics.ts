/**
 * System Metrics — Astro dev toolbar app.
 *
 * Server RSS / heap / CPU% / load avg / uptime plus client JS heap when the
 * browser exposes `performance.memory`. Polls `/__editor/system` every 2s
 * while the panel is open.
 */

interface MemoryStats { rss: number; heapUsed: number; heapTotal: number; external: number; arrayBuffers: number }
interface CpuStats { percent: number; user: number; system: number }
interface SystemStats { loadAvg: [number, number, number]; freeMem: number; totalMem: number; cpuCount: number; uptimeSec: number; platform: string; nodeVersion: string }
interface SystemResponse { metrics: { memory: MemoryStats; cpu: CpuStats; system: SystemStats } }

const POLL_MS = 2000;

function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
function fmtDuration(sec: number): string {
  if (sec < 60) return `${sec}s`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ${sec % 60}s`;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h ${m}m`;
}
function clientHeap(): { used: number; total: number; limit: number } | null {
  const mem = (performance as any).memory;
  if (!mem || typeof mem.usedJSHeapSize !== 'number') return null;
  return { used: mem.usedJSHeapSize, total: mem.totalJSHeapSize, limit: mem.jsHeapSizeLimit };
}

export default {
  id: 'system-metrics',
  name: 'System Metrics',
  icon: `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,

  async init(canvas: ShadowRoot, app: any, _server: any) {
    const style = document.createElement('style');
    style.textContent = `
      astro-dev-toolbar-window { max-height: 80vh !important; overflow-y: auto; }
      .sm-root { font: 12px/1.4 system-ui, sans-serif; color: #e4e4e7; min-width: 460px; padding: 12px; }
      .sm-card { background: #18181b; border: 1px solid #27272a; border-radius: 6px; padding: 10px; margin-bottom: 10px; }
      .sm-head { font-size: 11px; text-transform: uppercase; letter-spacing: 0.04em; color: #a1a1aa; margin-bottom: 6px; display: flex; justify-content: space-between; }
      .sm-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6px 16px; }
      .sm-stat { display: flex; justify-content: space-between; }
      .sm-label { color: #a1a1aa; }
      .sm-value { color: #e4e4e7; font-variant-numeric: tabular-nums; }
      .sm-bar { height: 4px; background: #27272a; border-radius: 2px; margin-top: 4px; overflow: hidden; }
      .sm-bar-fill { height: 100%; background: #60a5fa; transition: width 0.2s ease; }
      .sm-bar-fill.is-hot { background: #f87171; }
      .sm-bar-fill.is-warm { background: #fbbf24; }
      .sm-status { color: #71717a; font-size: 10px; margin-top: 4px; }
      .sm-warn { color: #fbbf24; font-size: 10px; }
      .sm-empty { color: #71717a; font-style: italic; padding: 10px; text-align: center; }
    `;
    canvas.appendChild(style);

    const win = document.createElement('astro-dev-toolbar-window');
    win.innerHTML = `
      <div class="sm-root">
        <div class="sm-body"><div class="sm-empty">Loading…</div></div>
        <div class="sm-status" data-status></div>
      </div>
    `;
    canvas.appendChild(win);

    const root = win.querySelector('.sm-root') as HTMLElement;
    const body = root.querySelector('.sm-body') as HTMLElement;
    const status = root.querySelector('[data-status]') as HTMLElement;

    let timer: ReturnType<typeof setInterval> | null = null;
    let inflight = false;

    async function tick() {
      if (inflight) return;
      inflight = true;
      try {
        const res = await fetch('/__editor/system');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: SystemResponse = await res.json();
        render(data.metrics);
        status.textContent = `Updated ${new Date().toLocaleTimeString()}`;
      } catch (err: any) {
        status.textContent = `Fetch failed: ${err.message || err}`;
      } finally {
        inflight = false;
      }
    }

    app.onToggled(({ state }: { state: boolean }) => {
      if (state) {
        if (!timer) { tick(); timer = setInterval(tick, POLL_MS); }
      } else if (timer) { clearInterval(timer); timer = null; }
    });

    function render(m: SystemResponse['metrics']) {
      const heapPct = m.memory.heapTotal ? (m.memory.heapUsed / m.memory.heapTotal) * 100 : 0;
      const cpuPerCore = m.cpu.percent / m.system.cpuCount;
      const cpuClass = cpuPerCore > 80 ? 'is-hot' : cpuPerCore > 50 ? 'is-warm' : '';
      const memPct = ((m.system.totalMem - m.system.freeMem) / m.system.totalMem) * 100;
      const ch = clientHeap();
      const clientSection = ch
        ? `
          <div class="sm-card">
            <div class="sm-head"><span>Client (JS heap)</span><span>Chrome/Edge only</span></div>
            <div class="sm-grid">
              <div class="sm-stat"><span class="sm-label">Used</span><span class="sm-value">${fmtBytes(ch.used)}</span></div>
              <div class="sm-stat"><span class="sm-label">Total</span><span class="sm-value">${fmtBytes(ch.total)}</span></div>
              <div class="sm-stat"><span class="sm-label">Limit</span><span class="sm-value">${fmtBytes(ch.limit)}</span></div>
            </div>
            <div class="sm-bar"><div class="sm-bar-fill" style="width: ${Math.min(100, (ch.used / ch.limit) * 100).toFixed(1)}%"></div></div>
          </div>`
        : `<div class="sm-card"><div class="sm-head">Client (JS heap)</div><div class="sm-warn">performance.memory unavailable in this browser.</div></div>`;

      body.innerHTML = `
        <div class="sm-card">
          <div class="sm-head"><span>Server memory</span><span>process.memoryUsage()</span></div>
          <div class="sm-grid">
            <div class="sm-stat"><span class="sm-label">RSS</span><span class="sm-value">${fmtBytes(m.memory.rss)}</span></div>
            <div class="sm-stat"><span class="sm-label">Heap used</span><span class="sm-value">${fmtBytes(m.memory.heapUsed)}</span></div>
            <div class="sm-stat"><span class="sm-label">Heap total</span><span class="sm-value">${fmtBytes(m.memory.heapTotal)}</span></div>
            <div class="sm-stat"><span class="sm-label">External</span><span class="sm-value">${fmtBytes(m.memory.external)}</span></div>
            <div class="sm-stat"><span class="sm-label">Array buffers</span><span class="sm-value">${fmtBytes(m.memory.arrayBuffers)}</span></div>
            <div class="sm-stat"><span class="sm-label">Heap fill</span><span class="sm-value">${heapPct.toFixed(1)}%</span></div>
          </div>
          <div class="sm-bar"><div class="sm-bar-fill" style="width: ${heapPct.toFixed(1)}%"></div></div>
        </div>

        <div class="sm-card">
          <div class="sm-head"><span>Server CPU</span><span>${m.system.cpuCount} cores</span></div>
          <div class="sm-grid">
            <div class="sm-stat"><span class="sm-label">Process CPU</span><span class="sm-value">${m.cpu.percent.toFixed(1)}%</span></div>
            <div class="sm-stat"><span class="sm-label">Per-core avg</span><span class="sm-value">${cpuPerCore.toFixed(1)}%</span></div>
            <div class="sm-stat"><span class="sm-label">Load (1m)</span><span class="sm-value">${m.system.loadAvg[0].toFixed(2)}</span></div>
            <div class="sm-stat"><span class="sm-label">Load (5m)</span><span class="sm-value">${m.system.loadAvg[1].toFixed(2)}</span></div>
          </div>
          <div class="sm-bar"><div class="sm-bar-fill ${cpuClass}" style="width: ${Math.min(100, cpuPerCore).toFixed(1)}%"></div></div>
        </div>

        <div class="sm-card">
          <div class="sm-head"><span>System</span><span>${m.system.platform} · node ${m.system.nodeVersion}</span></div>
          <div class="sm-grid">
            <div class="sm-stat"><span class="sm-label">Uptime</span><span class="sm-value">${fmtDuration(m.system.uptimeSec)}</span></div>
            <div class="sm-stat"><span class="sm-label">Free RAM</span><span class="sm-value">${fmtBytes(m.system.freeMem)}</span></div>
            <div class="sm-stat"><span class="sm-label">Total RAM</span><span class="sm-value">${fmtBytes(m.system.totalMem)}</span></div>
            <div class="sm-stat"><span class="sm-label">Used</span><span class="sm-value">${memPct.toFixed(1)}%</span></div>
          </div>
        </div>

        ${clientSection}
      `;
    }
  },
};
