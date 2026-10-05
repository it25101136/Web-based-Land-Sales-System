/* Tiny dependency-free SVG chart library (bar, line, donut, hbar). */
'use strict';
const Charts = {
  palette: ['#0E8F63', '#0B2545', '#D4A72C', '#12A874', '#1B3A69', '#F0C64F', '#4F9DDE', '#E23D50'],

  bar(data, { h = 220, fmtV = v => v, color = '#0E8F63' } = {}) {
    if (!data.length) return `<p style="color:var(--gray-400);font-size:13px">No data yet.</p>`;
    const max = Math.max(...data.map(d => d.v), 1);
    const bw = 100 / data.length;
    return `<svg viewBox="0 0 100 ${h / 3}" preserveAspectRatio="none" style="width:100%;height:${h}px;overflow:visible">
      ${[0, .25, .5, .75, 1].map(g => `<line x1="0" y1="${(h / 3) * g}" x2="100" y2="${(h / 3) * g}" stroke="#EEF2F6" stroke-width=".3"/>`).join('')}
      ${data.map((d, i) => {
      const bh = (d.v / max) * (h / 3 - 4);
      return `<rect x="${i * bw + bw * .22}" y="${h / 3 - bh}" width="${bw * .56}" height="${bh}" rx="1.2" fill="${color}">
          <title>${d.k}: ${fmtV(d.v)}</title></rect>`;
    }).join('')}
    </svg>
    <div style="display:flex;margin-top:6px">${data.map(d => `<div style="flex:1;text-align:center;font-size:10.5px;color:var(--gray-600);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${d.k}</div>`).join('')}</div>
    <div style="display:flex;margin-top:2px">${data.map(d => `<div style="flex:1;text-align:center;font-size:11px;font-weight:800;color:var(--navy)">${fmtV(d.v)}</div>`).join('')}</div>`;
  },

  line(data, { h = 220, fmtV = v => v, color = '#0E8F63' } = {}) {
    if (data.length < 2) return Charts.bar(data, { h, fmtV, color });
    const max = Math.max(...data.map(d => d.v), 1);
    const pts = data.map((d, i) => [(i / (data.length - 1)) * 100, (h / 3) - (d.v / max) * (h / 3 - 4)]);
    const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join(' ');
    return `<svg viewBox="0 0 100 ${h / 3}" preserveAspectRatio="none" style="width:100%;height:${h}px;overflow:visible">
      <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${color}" stop-opacity=".28"/><stop offset="100%" stop-color="${color}" stop-opacity="0"/></linearGradient></defs>
      ${[0, .25, .5, .75, 1].map(g => `<line x1="0" y1="${(h / 3) * g}" x2="100" y2="${(h / 3) * g}" stroke="#EEF2F6" stroke-width=".3"/>`).join('')}
      <path d="${path} L100 ${h / 3} L0 ${h / 3} Z" fill="url(#lg)"/>
      <path d="${path}" fill="none" stroke="${color}" stroke-width="1" vector-effect="non-scaling-stroke"/>
      ${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="1.1" fill="#fff" stroke="${color}" stroke-width=".6"><title>${data[i].k}: ${fmtV(data[i].v)}</title></circle>`).join('')}
    </svg>
    <div style="display:flex;margin-top:6px">${data.map(d => `<div style="flex:1;text-align:center;font-size:10.5px;color:var(--gray-600)">${d.k}</div>`).join('')}</div>`;
  },

  donut(data, { size = 190, fmtV = v => v } = {}) {
    const total = data.reduce((s, d) => s + d.v, 0) || 1;
    let a = -Math.PI / 2;
    const r = 42, cx = 50, cy = 50;
    const arcs = data.map((d, i) => {
      const ang = (d.v / total) * Math.PI * 2;
      const x1 = cx + r * Math.cos(a), y1 = cy + r * Math.sin(a);
      a += ang;
      const x2 = cx + r * Math.cos(a), y2 = cy + r * Math.sin(a);
      const large = ang > Math.PI ? 1 : 0;
      return `<path d="M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}"
        fill="none" stroke="${Charts.palette[i % 8]}" stroke-width="15" stroke-linecap="butt"><title>${d.k}: ${fmtV(d.v)}</title></path>`;
    }).join('');
    return `<div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap">
      <svg viewBox="0 0 100 100" style="width:${size}px;height:${size}px;flex:none">${arcs}
        <text x="50" y="48" text-anchor="middle" font-size="13" font-weight="800" fill="#0B2545">${total}</text>
        <text x="50" y="58" text-anchor="middle" font-size="6" fill="#94A3B8">TOTAL</text></svg>
      <div class="legend" style="flex-direction:column;gap:7px">
        ${data.map((d, i) => `<span><i style="background:${Charts.palette[i % 8]}"></i>${d.k} — <b style="color:var(--navy)">${fmtV(d.v)}</b></span>`).join('')}
      </div></div>`;
  },

  hbar(data, { fmtV = v => v } = {}) {
    if (!data.length) return `<p style="color:var(--gray-400);font-size:13px">No data yet.</p>`;
    const max = Math.max(...data.map(d => d.v), 1);
    return `<div style="display:flex;flex-direction:column;gap:11px">
      ${data.map((d, i) => `<div>
        <div style="display:flex;justify-content:space-between;font-size:12.5px;margin-bottom:4px">
          <b style="color:var(--navy)">${i + 1}. ${d.k}</b><span style="color:var(--gray-600);font-weight:700">${fmtV(d.v)}</span></div>
        <div style="height:9px;background:var(--gray-100);border-radius:99px;overflow:hidden">
          <div style="width:${(d.v / max) * 100}%;height:100%;background:linear-gradient(90deg,${Charts.palette[i % 8]},${Charts.palette[(i + 3) % 8]});border-radius:99px;transition:width .8s cubic-bezier(.22,.9,.32,1)"></div></div>
      </div>`).join('')}</div>`;
  }
};
