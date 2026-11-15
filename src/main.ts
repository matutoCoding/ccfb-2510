// 入口:hash 路由 + 顶栏

import './ui/styles.css';
import { projectsPage } from './ui/projectsPage';
import { editorPage } from './ui/editorPage';
import { materialsPage } from './ui/materialsPage';
import { previewPage } from './ui/previewPage';
import { settingsPage } from './ui/settingsPage';

export interface Page {
  destroy(): void;
}

type PageFactory = (root: HTMLElement, param: string | null) => Page;

const routes: Record<string, PageFactory> = {
  '': projectsPage,
  'projects': projectsPage,
  'editor': editorPage,
  'materials': materialsPage,
  'preview': previewPage,
  'settings': settingsPage,
};

let current: Page | null = null;

function parseHash(): { name: string; param: string | null } {
  const h = location.hash.replace(/^#\/?/, '');
  const [name, param] = h.split('/');
  return { name: name ?? '', param: param ?? null };
}

function renderNav(active: string): HTMLElement {
  const nav = document.createElement('div');
  nav.className = 'topnav';
  const links: [string, string][] = [
    ['projects', '项目'],
    ['settings', '设置'],
  ];
  nav.append(Object.assign(document.createElement('span'), { className: 'brand', textContent: '泳池效果预览' }));
  for (const [key, label] of links) {
    const a = document.createElement('a');
    a.href = `#/${key}`;
    a.textContent = label;
    if (active === key || (active === '' && key === 'projects')) a.className = 'active';
    nav.append(a);
  }
  return nav;
}

function route(): void {
  const app = document.getElementById('app')!;
  if (current) { current.destroy(); current = null; }
  app.innerHTML = '';
  const { name, param } = parseHash();
  const factory = routes[name] ?? projectsPage;
  app.append(renderNav(name));
  const container = document.createElement('div');
  container.style.display = 'contents';
  app.append(container);
  current = factory(container, param);
}

window.addEventListener('hashchange', route);
route();
