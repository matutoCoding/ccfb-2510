// 项目列表页:增删改复制、导入导出

import { Page } from '../main';
import {
  listProjects, createProject, deleteProject, duplicateProject,
  getProject, exportProjectJSON, exportAllJSON, downloadJSON, importJSON,
} from '../store';
import { el, button, confirmDialog, toast } from './widgets';

export function projectsPage(root: HTMLElement): Page {
  const page = el('div', { class: 'page' });

  function render() {
    page.innerHTML = '';
    const list = listProjects();

    const header = el('div', { style: 'display:flex;gap:10px;align-items:center;margin-bottom:16px;flex-wrap:wrap' }, [
      el('h2', { style: 'margin:0;flex:1' }, ['我的项目']),
      button('新建项目', () => {
        const p = createProject();
        location.hash = `#/editor/${p.id}`;
      }, 'primary'),
      button('导入', () => fileInput.click()),
      button('导出全部', () => {
        downloadJSON(exportAllJSON(), `泳池项目备份_${new Date().toISOString().slice(0, 10)}.json`);
        toast('已导出全部项目');
      }),
    ]);
    page.append(header);

    const fileInput = el('input', { type: 'file', accept: '.json', style: 'display:none' });
    fileInput.addEventListener('change', async () => {
      const f = fileInput.files?.[0];
      if (!f) return;
      try {
        const n = importJSON(await f.text());
        toast(`成功导入 ${n} 个项目`);
        render();
      } catch (e: any) {
        toast(`导入失败:${e.message}`);
      }
      fileInput.value = '';
    });
    page.append(fileInput);

    if (list.length === 0) {
      page.append(el('div', { class: 'empty-state' }, [
        '还没有项目。点击「新建项目」开始设计第一个泳池。',
      ]));
      return;
    }

    const grid = el('div', { class: 'project-grid' });
    for (const p of list) {
      const card = el('div', { class: 'project-card' }, [
        el('div', { class: 'name' }, [p.name]),
        el('div', { class: 'meta' }, [
          `${p.width.toFixed(1)}m × ${p.height.toFixed(1)}m · 最深 ${p.maxDepth.toFixed(1)}m`,
        ]),
        el('div', { class: 'meta' }, [`更新于 ${new Date(p.updatedAt).toLocaleString('zh-CN')}`]),
        el('div', { class: 'actions' }, [
          button('池体编辑', () => location.hash = `#/editor/${p.id}`, 'small'),
          button('材质灯光', () => location.hash = `#/materials/${p.id}`, 'small'),
          button('预览', () => location.hash = `#/preview/${p.id}`, 'small primary'),
          button('复制', () => { duplicateProject(p.id); render(); toast('已复制'); }, 'small'),
          button('导出', () => {
            const proj = getProject(p.id);
            if (proj) downloadJSON(exportProjectJSON(proj), `${proj.name}.json`);
          }, 'small'),
          button('删除', async () => {
            if (await confirmDialog(`确定删除「${p.name}」?此操作不可恢复。`)) {
              deleteProject(p.id);
              render();
              toast('已删除');
            }
          }, 'small danger'),
        ]),
      ]);
      grid.append(card);
    }
    page.append(grid);
  }

  render();
  root.append(page);
  return { destroy() {} };
}
