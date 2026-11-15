// 池体编辑页:俯视多边形 + 逐顶点深度 + 台阶/浅水区矩形

import { Page } from '../main';
import { getProject, saveProject } from '../store';
import { Project, PoolVertex, StepsZone, ShallowZone, uid } from '../types';
import { el, button, numberRow, textRow, selectRow, toast } from './widgets';
import { polyArea } from '../util';

type Tool = 'select' | 'add' | 'steps' | 'shallow';
type Sel =
  | { type: 'vertex'; i: number }
  | { type: 'steps'; id: string }
  | { type: 'shallow'; id: string }
  | null;

export function editorPage(root: HTMLElement, id: string | null): Page {
  const project = id ? getProject(id) : null;
  if (!project) {
    root.append(el('div', { class: 'page' }, [el('p', {}, ['项目不存在。'])]));
    return { destroy() {} };
  }
  const proj: Project = project;

  let tool: Tool = 'select';
  let sel: Sel = null;
  let dragVertex = -1;
  let dragRect: { x0: number; y0: number; x1: number; y1: number } | null = null;
  let saveTimer = 0;

  const page = el('div', { class: 'page-nopad', style: 'display:flex;padding:14px;gap:14px' });
  const side = el('div', { class: 'panel panel-side' });
  const main = el('div', { class: 'panel panel-main' });
  const canvas = el('canvas', { id: 'editor-canvas' }) as HTMLCanvasElement;
  const wrap = el('div', { class: 'canvas-wrap' }, [canvas]);
  const toolbar = el('div', { class: 'editor-toolbar' });
  main.append(toolbar, wrap);
  page.append(side, main);
  root.append(page);

  const ctx = canvas.getContext('2d')!;

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => saveProject(proj), 400);
  }

  // ---- 坐标变换:世界(米)-> 画布像素 ----
  function viewTransform() {
    const xs = proj.vertices.map(v => v.x), ys = proj.vertices.map(v => v.y);
    const minX = Math.min(...xs, -1), maxX = Math.max(...xs, 1);
    const minY = Math.min(...ys, -1), maxY = Math.max(...ys, 1);
    const pad = 50;
    const w = canvas.width - pad * 2, h = canvas.height - pad * 2;
    const s = Math.min(w / (maxX - minX), h / (maxY - minY));
    const ox = pad + (w - (maxX - minX) * s) / 2 - minX * s;
    const oy = pad + (h - (maxY - minY) * s) / 2 - minY * s;
    return { s, ox, oy };
  }
  const toPx = (x: number, y: number, t: { s: number; ox: number; oy: number }) =>
    [x * t.s + t.ox, y * t.s + t.oy] as const;
  const toWorld = (px: number, py: number, t: { s: number; ox: number; oy: number }) =>
    ({ x: (px - t.ox) / t.s, y: (py - t.oy) / t.s });

  function resize() {
    const r = wrap.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(2, Math.round(r.width * dpr));
    canvas.height = Math.max(2, Math.round(r.height * dpr));
    draw();
  }

  // ---- 绘制 ----
  function depthColor(d: number): string {
    const t = Math.min(1, Math.max(0, (d - 0.2) / 2.2));
    const r = Math.round(30 + 20 * (1 - t));
    const g = Math.round(144 - 60 * t);
    const b = Math.round(200 - 60 * t);
    return `rgb(${r},${g},${b})`;
  }

  function draw() {
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);
    const t = viewTransform();

    // 网格(0.5m)
    ctx.strokeStyle = 'rgba(80,110,140,0.14)';
    ctx.lineWidth = 1;
    const w0 = toWorld(0, 0, t), w1 = toWorld(W, H, t);
    for (let x = Math.floor(w0.x * 2) / 2; x <= w1.x; x += 0.5) {
      const [px] = toPx(x, 0, t);
      ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, H); ctx.stroke();
    }
    for (let y = Math.floor(w0.y * 2) / 2; y <= w1.y; y += 0.5) {
      const [, py] = toPx(0, y, t);
      ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(W, py); ctx.stroke();
    }

    // 台阶/浅水区
    for (const s of proj.steps) drawZoneRect(s.x, s.y, s.w, s.h, 'rgba(220,170,60,0.18)', '#dcaa3c', `台阶×${s.steps}`, sel?.type === 'steps' && sel.id === s.id, t);
    for (const s of proj.shallows) drawZoneRect(s.x, s.y, s.w, s.h, 'rgba(60,190,220,0.15)', '#3ec8dc', `浅水 ${s.depth.toFixed(2)}m`, sel?.type === 'shallow' && sel.id === s.id, t);

    // 拖拽中的矩形
    if (dragRect) {
      const x = Math.min(dragRect.x0, dragRect.x1), y = Math.min(dragRect.y0, dragRect.y1);
      drawZoneRect(x, y, Math.abs(dragRect.x1 - dragRect.x0), Math.abs(dragRect.y1 - dragRect.y0),
        'rgba(255,255,255,0.08)', '#ffffff', '', true, t);
    }

    // 池体多边形
    const vs = proj.vertices;
    if (vs.length >= 2) {
      ctx.beginPath();
      vs.forEach((v, i) => {
        const [px, py] = toPx(v.x, v.y, t);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
      });
      if (vs.length >= 3) ctx.closePath();
      ctx.fillStyle = 'rgba(30,110,160,0.25)';
      ctx.fill();
      ctx.strokeStyle = '#4db8e8';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // 顶点 + 深度标注
    vs.forEach((v, i) => {
      const [px, py] = toPx(v.x, v.y, t);
      const selected = sel?.type === 'vertex' && sel.i === i;
      ctx.fillStyle = depthColor(v.depth);
      ctx.strokeStyle = selected ? '#ffd75e' : '#0a0f14';
      ctx.lineWidth = selected ? 3 : 1.5;
      ctx.beginPath();
      ctx.arc(px, py, selected ? 8 : 6, 0, Math.PI * 2);
      ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#dce7f0';
      ctx.font = `${Math.round(11 * (canvas.width / 800 + 0.6))}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(`${v.depth.toFixed(1)}`, px, py - 11);
    });

    // 尺寸标注
    if (vs.length >= 3) {
      const xs = vs.map(v => v.x), ys = vs.map(v => v.y);
      const w = Math.max(...xs) - Math.min(...xs);
      const h = Math.max(...ys) - Math.min(...ys);
      ctx.fillStyle = '#8ba0b4';
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${w.toFixed(1)}m × ${h.toFixed(1)}m · ${vs.length} 个顶点`, 12, H - 14);
    }
  }

  function drawZoneRect(x: number, y: number, w: number, h: number, fill: string, stroke: string, label: string, selected: boolean, t: { s: number; ox: number; oy: number }) {
    const [px0, py0] = toPx(x, y, t);
    const [px1, py1] = toPx(x + w, y + h, t);
    ctx.fillStyle = fill;
    ctx.fillRect(px0, py0, px1 - px0, py1 - py0);
    ctx.strokeStyle = stroke;
    ctx.lineWidth = selected ? 2.5 : 1.2;
    ctx.setLineDash([5, 4]);
    ctx.strokeRect(px0, py0, px1 - px0, py1 - py0);
    ctx.setLineDash([]);
    if (label) {
      ctx.fillStyle = stroke;
      ctx.font = '12px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(label, (px0 + px1) / 2, (py0 + py1) / 2);
    }
  }

  // ---- 命中测试 ----
  function hitVertex(wx: number, wy: number, tolM: number): number {
    let best = -1, bd = tolM * tolM;
    proj.vertices.forEach((v, i) => {
      const d = (v.x - wx) ** 2 + (v.y - wy) ** 2;
      if (d < bd) { bd = d; best = i; }
    });
    return best;
  }
  function distToEdge(wx: number, wy: number, a: PoolVertex, b: PoolVertex): { d: number; t: number } {
    const ex = b.x - a.x, ey = b.y - a.y;
    const l2 = ex * ex + ey * ey || 1e-9;
    const t = Math.max(0, Math.min(1, ((wx - a.x) * ex + (wy - a.y) * ey) / l2));
    const px = a.x + ex * t, py = a.y + ey * t;
    return { d: Math.hypot(wx - px, wy - py), t };
  }
  function hitEdge(wx: number, wy: number, tolM: number): { i: number; t: number } | null {
    const vs = proj.vertices;
    for (let i = 0; i < vs.length; i++) {
      const { d, t } = distToEdge(wx, wy, vs[i], vs[(i + 1) % vs.length]);
      if (d < tolM) return { i, t };
    }
    return null;
  }
  function inRect(wx: number, wy: number, r: { x: number; y: number; w: number; h: number }): boolean {
    return wx >= r.x && wx <= r.x + r.w && wy >= r.y && wy <= r.y + r.h;
  }

  // ---- 指针交互 ----
  function pointerWorld(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    const sx = canvas.width / r.width, sy = canvas.height / r.height;
    return toWorld((e.clientX - r.left) * sx, (e.clientY - r.top) * sy, viewTransform());
  }

  const onDown = (e: PointerEvent) => {
    canvas.setPointerCapture(e.pointerId);
    const w = pointerWorld(e);
    const t = viewTransform();
    const tolM = 12 / t.s;
    if (tool === 'select') {
      const vi = hitVertex(w.x, w.y, tolM);
      if (vi >= 0) {
        sel = { type: 'vertex', i: vi };
        dragVertex = vi;
      } else {
        const zs = proj.steps.find(s => inRect(w.x, w.y, s));
        const zh = proj.shallows.find(s => inRect(w.x, w.y, s));
        sel = zs ? { type: 'steps', id: zs.id } : zh ? { type: 'shallow', id: zh.id } : null;
      }
      renderSide(); draw();
    } else if (tool === 'add') {
      const hit = proj.vertices.length >= 3 ? hitEdge(w.x, w.y, tolM) : null;
      const v: PoolVertex = { x: +w.x.toFixed(2), y: +w.y.toFixed(2), depth: 1.5 };
      if (hit) {
        // 插到边上
        const a = proj.vertices[hit.i], b = proj.vertices[(hit.i + 1) % proj.vertices.length];
        v.depth = +(a.depth + (b.depth - a.depth) * hit.t).toFixed(2);
        proj.vertices.splice(hit.i + 1, 0, v);
        sel = { type: 'vertex', i: hit.i + 1 };
      } else {
        proj.vertices.push(v);
        sel = { type: 'vertex', i: proj.vertices.length - 1 };
      }
      scheduleSave(); renderSide(); draw();
    } else if (tool === 'steps' || tool === 'shallow') {
      dragRect = { x0: w.x, y0: w.y, x1: w.x, y1: w.y };
    }
  };

  const onMove = (e: PointerEvent) => {
    const w = pointerWorld(e);
    if (dragVertex >= 0) {
      const v = proj.vertices[dragVertex];
      v.x = +w.x.toFixed(2);
      v.y = +w.y.toFixed(2);
      scheduleSave(); draw();
    } else if (dragRect) {
      dragRect.x1 = w.x; dragRect.y1 = w.y;
      draw();
    }
  };

  const onUp = () => {
    if (dragRect) {
      const x = Math.min(dragRect.x0, dragRect.x1), y = Math.min(dragRect.y0, dragRect.y1);
      const w = Math.abs(dragRect.x1 - dragRect.x0), h = Math.abs(dragRect.y1 - dragRect.y0);
      if (w > 0.3 && h > 0.3) {
        if (tool === 'steps') {
          const s: StepsZone = { id: uid(), x: +x.toFixed(2), y: +y.toFixed(2), w: +w.toFixed(2), h: +h.toFixed(2), steps: 3, topDepth: 0.35, bottomDepth: 1.0, dir: 0 };
          proj.steps.push(s);
          sel = { type: 'steps', id: s.id };
        } else {
          const s: ShallowZone = { id: uid(), x: +x.toFixed(2), y: +y.toFixed(2), w: +w.toFixed(2), h: +h.toFixed(2), depth: 0.9 };
          proj.shallows.push(s);
          sel = { type: 'shallow', id: s.id };
        }
        scheduleSave();
      }
      dragRect = null;
      renderSide(); draw();
    }
    if (dragVertex >= 0) { dragVertex = -1; scheduleSave(); }
  };

  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);

  // ---- 侧栏 ----
  function renderSide() {
    side.innerHTML = '';
    side.append(el('h2', {}, ['池体编辑']));
    side.append(textRow('项目名称', proj.name, v => { proj.name = v; scheduleSave(); }));

    side.append(el('h3', {}, ['整体']));
    side.append(numberRow('全部深度(m)', proj.vertices[0]?.depth ?? 1.5, 0.3, 3.5, 0.1, v => {
      proj.vertices.forEach(x => x.depth = v);
      scheduleSave(); draw();
    }));
    side.append(el('div', { style: 'display:flex;gap:6px;margin:8px 0' }, [
      button('重置为矩形', () => {
        proj.vertices = [
          { x: -4, y: -2, depth: 1.2 }, { x: 4, y: -2, depth: 1.2 },
          { x: 4, y: 2, depth: 1.8 }, { x: -4, y: 2, depth: 1.8 },
        ];
        sel = null; scheduleSave(); renderSide(); draw();
      }, 'small'),
      button('3D 预览 →', () => location.hash = `#/preview/${proj.id}`, 'small primary'),
    ]));

    if (sel?.type === 'vertex') {
      const v = proj.vertices[sel.i];
      if (v) {
        side.append(el('h3', {}, [`顶点 ${sel.i + 1}`]));
        side.append(numberRow('X (m)', v.x, -50, 50, 0.1, x => { v.x = x; scheduleSave(); draw(); }));
        side.append(numberRow('Y (m)', v.y, -50, 50, 0.1, y => { v.y = y; scheduleSave(); draw(); }));
        side.append(numberRow('水深 (m)', v.depth, 0.2, 3.5, 0.05, d => { v.depth = d; scheduleSave(); draw(); }));
        side.append(button('删除此顶点', () => {
          if (proj.vertices.length <= 3) { toast('至少保留 3 个顶点'); return; }
          proj.vertices.splice(sel!.type === 'vertex' ? (sel as any).i : 0, 1);
          sel = null; scheduleSave(); renderSide(); draw();
        }, 'small danger'));
      }
    } else if (sel?.type === 'steps') {
      const s = proj.steps.find(x => x.id === (sel as any).id);
      if (s) {
        side.append(el('h3', {}, ['台阶区']));
        side.append(numberRow('级数', s.steps, 1, 8, 1, v => { s.steps = Math.round(v); scheduleSave(); draw(); }));
        side.append(numberRow('首级水深(m)', s.topDepth, 0.1, 2, 0.05, v => { s.topDepth = v; scheduleSave(); }));
        side.append(numberRow('末级水深(m)', s.bottomDepth, 0.2, 3, 0.05, v => { s.bottomDepth = v; scheduleSave(); }));
        side.append(selectRow('下探方向', [['0', '向东 →'], ['1', '向西 ←'], ['2', '向南 ↓'], ['3', '向北 ↑']], String(s.dir), v => { s.dir = +v as 0 | 1 | 2 | 3; scheduleSave(); }));
        side.append(button('删除台阶区', () => {
          proj.steps = proj.steps.filter(x => x.id !== s.id);
          sel = null; scheduleSave(); renderSide(); draw();
        }, 'small danger'));
      }
    } else if (sel?.type === 'shallow') {
      const s = proj.shallows.find(x => x.id === (sel as any).id);
      if (s) {
        side.append(el('h3', {}, ['浅水区']));
        side.append(numberRow('平台水深(m)', s.depth, 0.2, 2, 0.05, v => { s.depth = v; scheduleSave(); }));
        side.append(button('删除浅水区', () => {
          proj.shallows = proj.shallows.filter(x => x.id !== s.id);
          sel = null; scheduleSave(); renderSide(); draw();
        }, 'small danger'));
      }
    } else {
      side.append(el('p', { style: 'color:var(--fg-dim);font-size:13px' }, [
        '选择工具下点击顶点可编辑该处水深;「加点」工具点击空白追加顶点、点击边插入顶点;台阶/浅水工具拖拽出矩形区域。',
      ]));
    }
  }

  // ---- 工具栏 ----
  function renderToolbar() {
    toolbar.innerHTML = '';
    const tools: [Tool, string][] = [['select', '选择'], ['add', '加点'], ['steps', '台阶'], ['shallow', '浅水区']];
    for (const [k, label] of tools) {
      const b = button(label, () => { tool = k; renderToolbar(); }, tool === k ? 'active' : '');
      toolbar.append(b);
    }
  }

  renderToolbar();
  renderSide();
  const ro = new ResizeObserver(resize);
  ro.observe(wrap);
  resize();

  return {
    destroy() {
      ro.disconnect();
      clearTimeout(saveTimer);
      saveProject(proj);
    },
  };
}
