// 项目存储:localStorage CRUD + 导入导出

import { Project, Settings, DEFAULT_SETTINGS, defaultProject, sanitizeProject, uid } from './types';

const PROJECTS_KEY = 'poolpreview.projects.v1';
const SETTINGS_KEY = 'poolpreview.settings.v1';

function readAll(): Project[] {
  try {
    const raw = localStorage.getItem(PROJECTS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.map(sanitizeProject).filter((p): p is Project => p !== null);
  } catch {
    return [];
  }
}

function writeAll(list: Project[]): void {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(list));
}

export interface ProjectMeta {
  id: string; name: string; updatedAt: number;
  vertexCount: number; maxDepth: number; width: number; height: number;
}

export function listProjects(): ProjectMeta[] {
  return readAll()
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map(p => {
      const xs = p.vertices.map(v => v.x), ys = p.vertices.map(v => v.y);
      return {
        id: p.id, name: p.name, updatedAt: p.updatedAt,
        vertexCount: p.vertices.length,
        maxDepth: Math.max(...p.vertices.map(v => v.depth), 0),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys),
      };
    });
}

export function getProject(id: string): Project | null {
  return readAll().find(p => p.id === id) ?? null;
}

export function saveProject(p: Project): void {
  p.updatedAt = Date.now();
  const list = readAll();
  const i = list.findIndex(x => x.id === p.id);
  if (i >= 0) list[i] = p; else list.push(p);
  writeAll(list);
}

export function createProject(name?: string): Project {
  const p = defaultProject(name ?? `泳池项目 ${new Date().toLocaleDateString('zh-CN')}`);
  saveProject(p);
  return p;
}

export function deleteProject(id: string): void {
  writeAll(readAll().filter(p => p.id !== id));
}

export function duplicateProject(id: string): Project | null {
  const src = getProject(id);
  if (!src) return null;
  const copy: Project = JSON.parse(JSON.stringify(src));
  copy.id = uid();
  copy.name = src.name + ' 副本';
  copy.createdAt = Date.now();
  saveProject(copy);
  return copy;
}

// ---- 导入导出 ----

export function exportProjectJSON(p: Project): string {
  return JSON.stringify({ app: 'pool-preview', version: 1, projects: [p] }, null, 2);
}

export function exportAllJSON(): string {
  return JSON.stringify({ app: 'pool-preview', version: 1, projects: readAll() }, null, 2);
}

export function downloadJSON(json: string, filename: string): void {
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

/** 导入 JSON 文本,返回导入数量(失败抛错) */
export function importJSON(text: string): number {
  const data = JSON.parse(text);
  const arr = Array.isArray(data) ? data : Array.isArray(data?.projects) ? data.projects : [data];
  const list = readAll();
  let count = 0;
  for (const raw of arr) {
    const p = sanitizeProject(raw);
    if (!p) continue;
    if (list.some(x => x.id === p.id)) p.id = uid(); // 避免覆盖已有项目
    list.push(p);
    count++;
  }
  if (count === 0) throw new Error('文件中没有可识别的泳池项目');
  writeAll(list);
  return count;
}

// ---- 设置 ----

export function getSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function saveSettings(s: Settings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

export function clearAllData(): void {
  localStorage.removeItem(PROJECTS_KEY);
}
