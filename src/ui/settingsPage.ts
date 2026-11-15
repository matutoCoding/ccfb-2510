// 设置页:默认画质、操控偏好、数据管理

import { Page } from '../main';
import { getSettings, saveSettings, exportAllJSON, downloadJSON, importJSON, clearAllData } from '../store';
import { QUALITY_LABEL, Quality } from '../types';
import { el, button, selectRow, checkRow, confirmDialog, toast } from './widgets';

export function settingsPage(root: HTMLElement): Page {
  const page = el('div', { class: 'page', style: 'max-width:560px' });
  const settings = getSettings();

  page.append(el('h2', {}, ['设置']));

  page.append(el('h3', {}, ['画质']));
  page.append(selectRow('默认画质',
    (['low', 'medium', 'high'] as Quality[]).map(q => [q, QUALITY_LABEL[q]] as [string, string]),
    settings.quality,
    v => { settings.quality = v as Quality; saveSettings(settings); toast('已保存'); },
  ));
  page.append(checkRow('帧率不足时自动降档', settings.autoQuality, v => {
    settings.autoQuality = v; saveSettings(settings);
  }));
  page.append(el('p', { style: 'color:var(--fg-dim);font-size:13px' }, [
    '低档适合手机:减少波列与网格、关闭抗锯齿;中档目标 60fps;高档启用全部波列与更高渲染分辨率。',
  ]));

  page.append(el('h3', {}, ['操控']));
  page.append(checkRow('反转垂直旋转方向', settings.invertY, v => {
    settings.invertY = v; saveSettings(settings);
  }));

  page.append(el('h3', {}, ['数据']));
  page.append(el('div', { style: 'display:flex;gap:8px;flex-wrap:wrap' }, [
    button('导出全部项目', () => {
      downloadJSON(exportAllJSON(), `泳池项目备份_${new Date().toISOString().slice(0, 10)}.json`);
    }),
    button('导入项目', () => fileInput.click()),
    button('清空所有项目', async () => {
      if (await confirmDialog('确定删除所有项目?此操作不可恢复,建议先导出备份。')) {
        clearAllData();
        toast('已清空');
      }
    }, 'danger'),
  ]));
  const fileInput = el('input', { type: 'file', accept: '.json', style: 'display:none' });
  fileInput.addEventListener('change', async () => {
    const f = fileInput.files?.[0];
    if (!f) return;
    try {
      const n = importJSON(await f.text());
      toast(`成功导入 ${n} 个项目`);
    } catch (e: any) {
      toast(`导入失败:${e.message}`);
    }
    fileInput.value = '';
  });
  page.append(fileInput);

  page.append(el('p', { style: 'color:var(--fg-dim);font-size:13px;margin-top:20px' }, [
    '所有数据保存在浏览器本地(localStorage),不会上传。换设备请用导出/导入迁移。',
  ]));

  root.append(page);
  return { destroy() {} };
}
