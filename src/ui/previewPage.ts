// 预览页:全屏 3D,视角书签,截图(带项目参数),画质切换,帧率显示

import { Page } from '../main';
import { getProject, saveProject, getSettings, saveSettings } from '../store';
import { Project, Quality, QUALITY_LABEL, uid } from '../types';
import { PoolRenderer } from '../engine/renderer';
import { bindCameraControls } from '../engine/camera';
import { el, button, toast } from './widgets';

export function previewPage(root: HTMLElement, id: string | null): Page {
  const project = id ? getProject(id) : null;
  if (!project) {
    root.append(el('div', { class: 'page' }, [el('p', {}, ['项目不存在。'])]));
    return { destroy() {} };
  }
  const proj: Project = project;
  const settings = getSettings();

  const page = el('div', { class: 'page-nopad' });
  const canvas = el('canvas', { class: 'preview-canvas' }) as HTMLCanvasElement;
  page.append(canvas);
  root.append(page);

  let renderer: PoolRenderer;
  try {
    renderer = new PoolRenderer(canvas, proj, settings.quality);
  } catch (e: any) {
    page.append(el('p', { style: 'padding:20px' }, [e.message]));
    return { destroy() {} };
  }
  renderer.camera.invertY = settings.invertY;
  const unbind = bindCameraControls(canvas, renderer.camera);

  // ---- 覆盖层 ----
  const overlay = el('div', { class: 'preview-overlay' });
  const fpsChip = el('span', { class: 'chip' }, ['-- fps']);
  const qualitySel = el('select') as HTMLSelectElement;
  for (const q of ['low', 'medium', 'high'] as Quality[]) {
    const o = el('option', { value: q }, [`画质:${QUALITY_LABEL[q]}`]);
    if (q === settings.quality) o.selected = true;
    qualitySel.append(o);
  }
  qualitySel.addEventListener('change', () => {
    renderer.setQuality(qualitySel.value as Quality);
    settings.quality = qualitySel.value as Quality;
    saveSettings(settings);
    toast(`画质已切换为「${QUALITY_LABEL[qualitySel.value as Quality]}」`);
  });
  const nightBtn = button(proj.lighting.night ? '☀ 切到白天' : '☾ 切到夜景', () => {
    proj.lighting.night = !proj.lighting.night;
    nightBtn.textContent = proj.lighting.night ? '☀ 切到白天' : '☾ 切到夜景';
    saveProject(proj);
  });
  const backBtn = button('← 返回', () => location.hash = `#/materials/${proj.id}`);
  const bmBtn = button('书签', () => bmPanel.classList.toggle('open'));
  const shotBtn = button('截图', takeScreenshot);

  overlay.append(backBtn, el('span', { class: 'chip' }, [proj.name]), fpsChip, qualitySel, nightBtn, bmBtn, shotBtn);
  page.append(overlay);

  const hint = el('div', { class: 'preview-hint' }, ['拖动旋转 · 滚轮/双指缩放 · 右键或 Shift+拖动平移 · 向下看可潜入水下']);
  page.append(hint);

  // ---- 书签面板 ----
  const bmPanel = el('div', { class: 'bookmark-panel' });
  function renderBookmarks() {
    bmPanel.innerHTML = '';
    bmPanel.append(el('div', { style: 'display:flex;gap:6px;margin-bottom:8px' }, [
      el('b', { style: 'flex:1' }, ['视角书签']),
      button('+ 存当前', () => {
        const name = `视角 ${proj.bookmarks.length + 1}`;
        proj.bookmarks.push({ id: uid(), name, cam: renderer.camera.getPose() });
        saveProject(proj);
        renderBookmarks();
        toast(`已保存「${name}」`);
      }, 'small primary'),
    ]));
    if (proj.bookmarks.length === 0) {
      bmPanel.append(el('div', { style: 'color:var(--fg-dim);font-size:13px' }, ['调好角度后点「存当前」。']));
    }
    for (const bm of proj.bookmarks) {
      const item = el('div', { class: 'bookmark-item' }, [
        el('span', { class: 'bm-name' }, [bm.name]),
        button('删', () => {
          proj.bookmarks = proj.bookmarks.filter(x => x.id !== bm.id);
          saveProject(proj);
          renderBookmarks();
        }, 'small danger'),
      ]);
      item.addEventListener('click', e => {
        if ((e.target as HTMLElement).tagName === 'BUTTON') return;
        renderer.camera.setPose(bm.cam);
      });
      bmPanel.append(item);
    }
  }
  renderBookmarks();
  page.append(bmPanel);

  // ---- 截图:画面 + 项目参数 ----
  function takeScreenshot() {
    const L = proj.lighting;
    const xs = proj.vertices.map(v => v.x), ys = proj.vertices.map(v => v.y);
    const dims = `${(Math.max(...xs) - Math.min(...xs)).toFixed(1)}m × ${(Math.max(...ys) - Math.min(...ys)).toFixed(1)}m`;
    const depths = proj.vertices.map(v => v.depth);
    const lines = [
      `${proj.name}`,
      `尺寸 ${dims} · 水深 ${Math.min(...depths).toFixed(1)}–${Math.max(...depths).toFixed(1)}m`,
      `风速 ${proj.water.windSpeed.toFixed(1)}m/s · 清澈度 ${(proj.water.clarity * 100) | 0}% · ${L.night ? '夜景' : `白天 ${Math.floor(L.timeOfDay)}:00`}`,
      `水下灯 ${L.lights.filter(l => l.on).length} 盏 · 画质 ${QUALITY_LABEL[renderer.quality]}`,
      new Date().toLocaleString('zh-CN'),
    ];
    const shot = renderer.screenshot(lines);
    shot.toBlob(blob => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${proj.name}_效果图.png`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast('截图已保存');
    }, 'image/png');
  }

  // ---- 主循环 + 自动降档 ----
  let raf = 0;
  let last = performance.now();
  let lowFpsSince = 0;
  const loop = (now: number) => {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    renderer.frame(dt);
    fpsChip.textContent = `${renderer.fps} fps`;
    if (settings.autoQuality && renderer.quality !== 'low') {
      if (renderer.fps > 0 && renderer.fps < 45) {
        if (lowFpsSince === 0) lowFpsSince = now;
        else if (now - lowFpsSince > 3000) {
          const next: Quality = renderer.quality === 'high' ? 'medium' : 'low';
          renderer.setQuality(next);
          qualitySel.value = next;
          toast(`帧率不足,已自动降到「${QUALITY_LABEL[next]}」画质`);
          lowFpsSince = 0;
        }
      } else lowFpsSince = 0;
    }
    raf = requestAnimationFrame(loop);
  };
  raf = requestAnimationFrame(loop);

  return {
    destroy() {
      cancelAnimationFrame(raf);
      unbind();
      renderer.dispose();
      saveProject(proj);
    },
  };
}
