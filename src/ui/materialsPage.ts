// 材质灯光页:瓷砖/水体/灯光参数,右侧实时 3D 预览

import { Page } from '../main';
import { getProject, saveProject, getSettings } from '../store';
import { Project, UnderwaterLight, uid } from '../types';
import { PoolRenderer } from '../engine/renderer';
import { bindCameraControls } from '../engine/camera';
import { el, button, sliderRow, colorRow, selectRow, checkRow, numberRow, toast } from './widgets';

export function materialsPage(root: HTMLElement, id: string | null): Page {
  const project = id ? getProject(id) : null;
  if (!project) {
    root.append(el('div', { class: 'page' }, [el('p', {}, ['项目不存在。'])]));
    return { destroy() {} };
  }
  const proj: Project = project;

  const page = el('div', { class: 'page-nopad', style: 'display:flex;padding:14px;gap:14px' });
  const side = el('div', { class: 'panel panel-side' });
  const main = el('div', { class: 'panel panel-main' });
  const canvas = el('canvas', { class: 'preview-canvas' }) as HTMLCanvasElement;
  const wrap = el('div', { class: 'canvas-wrap' }, [canvas]);
  main.append(wrap);
  page.append(side, main);
  root.append(page);

  let renderer: PoolRenderer;
  try {
    renderer = new PoolRenderer(canvas, proj, getSettings().quality);
  } catch (e: any) {
    side.append(el('p', {}, [e.message]));
    return { destroy() {} };
  }
  renderer.camera.invertY = getSettings().invertY;
  const unbind = bindCameraControls(canvas, renderer.camera);

  let raf = 0;
  let last = performance.now();
  const loop = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    renderer.frame(dt);
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  let saveTimer = 0;
  function changed(save = true) {
    if (save) {
      clearTimeout(saveTimer);
      saveTimer = window.setTimeout(() => saveProject(proj), 400);
    }
  }
  let tileTimer = 0;
  function tileChanged() {
    clearTimeout(tileTimer);
    tileTimer = window.setTimeout(() => renderer.updateTileTexture(), 150);
    changed();
  }

  function renderSide() {
    side.innerHTML = '';
    side.append(el('h2', {}, ['材质与灯光']));

    // ---- 瓷砖 ----
    side.append(el('h3', {}, ['池底马赛克']));
    const t = proj.tile;
    side.append(colorRow('主色', t.colorA, v => { t.colorA = v; tileChanged(); }));
    side.append(colorRow('配色 B', t.colorB, v => { t.colorB = v; tileChanged(); }));
    side.append(sliderRow({ label: 'B 占比', min: 0, max: 0.5, step: 0.01, value: t.mixB, onInput: v => { t.mixB = v; tileChanged(); } }));
    side.append(colorRow('配色 C', t.colorC, v => { t.colorC = v; tileChanged(); }));
    side.append(sliderRow({ label: 'C 占比', min: 0, max: 0.5, step: 0.01, value: t.mixC, onInput: v => { t.mixC = v; tileChanged(); } }));
    side.append(sliderRow({ label: '色差抖动', min: 0, max: 0.5, step: 0.01, value: t.jitter, onInput: v => { t.jitter = v; tileChanged(); } }));
    side.append(colorRow('砖缝颜色', t.groutColor, v => { t.groutColor = v; tileChanged(); }));
    side.append(sliderRow({ label: '砖缝宽', min: 1, max: 6, step: 0.5, value: t.groutWidth, unit: 'mm', onInput: v => { t.groutWidth = v; tileChanged(); } }));
    side.append(sliderRow({ label: '单片尺寸', min: 10, max: 100, step: 5, value: t.tileSize, unit: 'mm', onInput: v => { t.tileSize = v; tileChanged(); } }));

    // ---- 水体 ----
    side.append(el('h3', {}, ['水体与波浪']));
    const w = proj.water;
    side.append(colorRow('水色', w.color, v => { w.color = v; changed(); }));
    side.append(sliderRow({ label: '清澈度', min: 0, max: 1, step: 0.01, value: w.clarity, onInput: v => { w.clarity = v; changed(); } }));
    side.append(sliderRow({ label: '风速', min: 0, max: 12, step: 0.1, value: w.windSpeed, unit: ' m/s', onInput: v => { w.windSpeed = v; renderer.updateParams(); changed(); } }));
    side.append(sliderRow({ label: '波高倍率', min: 0.2, max: 2, step: 0.05, value: w.waveAmp, onInput: v => { w.waveAmp = v; renderer.updateParams(); changed(); } }));

    // ---- 光照 ----
    side.append(el('h3', {}, ['光照']));
    const L = proj.lighting;
    side.append(checkRow('夜景模式', L.night, v => { L.night = v; changed(); }));
    side.append(checkRow('太阳光', L.sunOn, v => { L.sunOn = v; changed(); }));
    side.append(sliderRow({
      label: '时间', min: 6, max: 20, step: 0.25, value: L.timeOfDay,
      format: v => `${Math.floor(v)}:${String(Math.round((v % 1) * 60)).padStart(2, '0')}`,
      onInput: v => { L.timeOfDay = v; changed(); },
    }));
    side.append(sliderRow({ label: '太阳强度', min: 0, max: 2, step: 0.05, value: L.sunIntensity, onInput: v => { L.sunIntensity = v; changed(); } }));

    // ---- 水下灯 ----
    side.append(el('h3', {}, ['水下灯(最多 4 个)']));
    L.lights.forEach((l, i) => {
      const box = el('div', { style: 'border:1px solid var(--border);border-radius:8px;padding:8px;margin:8px 0' });
      box.append(el('div', { style: 'display:flex;align-items:center;gap:8px;margin-bottom:4px' }, [
        el('b', { style: 'flex:1' }, [`灯 ${i + 1}`]),
        (() => { const c = el('input', { type: 'checkbox' }); c.checked = l.on; c.addEventListener('change', () => { l.on = c.checked; changed(); }); return c; })(),
        button('删除', () => { L.lights.splice(i, 1); changed(); renderSide(); }, 'small danger'),
      ]));
      box.append(selectRow('所在边', proj.vertices.map((_, ei) => [String(ei), `边 ${ei + 1}`]), String(Math.min(l.edge, proj.vertices.length - 1)), v => { l.edge = +v; changed(); }));
      box.append(sliderRow({ label: '边上位置', min: 0.05, max: 0.95, step: 0.01, value: l.t, onInput: v => { l.t = v; changed(); } }));
      box.append(sliderRow({ label: '安装水深', min: 0.3, max: 2.5, step: 0.05, value: l.depth, unit: 'm', onInput: v => { l.depth = v; changed(); } }));
      box.append(colorRow('灯光颜色', l.color, v => { l.color = v; changed(); }));
      box.append(sliderRow({ label: '亮度', min: 0, max: 2, step: 0.05, value: l.intensity, onInput: v => { l.intensity = v; changed(); } }));
      side.append(box);
    });
    if (L.lights.length < 4) {
      side.append(button('+ 添加水下灯', () => {
        const nl: UnderwaterLight = { id: uid(), edge: 0, t: 0.5, depth: 0.8, color: '#cfe8ff', intensity: 1, on: true };
        L.lights.push(nl);
        changed(); renderSide();
      }, 'small'));
    }

    side.append(el('div', { style: 'margin-top:14px' }, [
      button('全屏预览 →', () => location.hash = `#/preview/${proj.id}`, 'primary'),
    ]));
  }

  renderSide();

  return {
    destroy() {
      cancelAnimationFrame(raf);
      clearTimeout(saveTimer);
      clearTimeout(tileTimer);
      unbind();
      renderer.dispose();
      saveProject(proj);
    },
  };
}
