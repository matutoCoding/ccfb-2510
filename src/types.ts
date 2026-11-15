// 数据模型:项目、池体、材质、灯光、书签、全局设置

export interface Vec2 { x: number; y: number }

/** 俯视多边形顶点,x/y 为平面坐标(米),depth 为该处水深(米,正值向下) */
export interface PoolVertex { x: number; y: number; depth: number }

/** 台阶区:矩形区域,沿 dir 方向逐级下探 */
export interface StepsZone {
  id: string;
  x: number; y: number; w: number; h: number;
  steps: number;        // 台阶级数
  topDepth: number;     // 第一级踏面水深
  bottomDepth: number;  // 最后一级踏面水深
  dir: 0 | 1 | 2 | 3;   // 下探方向 0:+x 1:-x 2:+y 3:-y
}

/** 浅水区:矩形平台 */
export interface ShallowZone {
  id: string;
  x: number; y: number; w: number; h: number;
  depth: number;
}

/** 马赛克瓷砖参数(程序生成贴图) */
export interface TileParams {
  colorA: string; colorB: string; colorC: string; // 三色混铺
  mixB: number;      // 颜色B占比 0..0.5
  mixC: number;      // 颜色C占比 0..0.5
  jitter: number;    // 单片明度抖动 0..0.5
  groutColor: string;
  groutWidth: number; // 砖缝宽 mm
  tileSize: number;   // 单片边长 mm
}

export interface WaterParams {
  color: string;      // 水色(吸收色)
  clarity: number;    // 清澈度 0..1
  windSpeed: number;  // 风速 m/s,驱动波浪
  waveAmp: number;    // 波高倍率 0.2..2
}

export interface UnderwaterLight {
  id: string;
  edge: number;   // 所在多边形边索引
  t: number;      // 边上位置 0..1
  depth: number;  // 安装水深
  color: string;
  intensity: number; // 0..2
  on: boolean;
}

export interface LightingParams {
  sunOn: boolean;
  night: boolean;      // 夜景模式
  timeOfDay: number;   // 0..24,影响太阳角度
  sunIntensity: number;// 0..2
  lights: UnderwaterLight[];
}

export interface CameraPose {
  tx: number; ty: number; tz: number;
  theta: number; phi: number; dist: number;
}

export interface Bookmark { id: string; name: string; cam: CameraPose }

export interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  vertices: PoolVertex[];
  steps: StepsZone[];
  shallows: ShallowZone[];
  tile: TileParams;
  water: WaterParams;
  lighting: LightingParams;
  bookmarks: Bookmark[];
}

export type Quality = 'low' | 'medium' | 'high';

export interface Settings {
  quality: Quality;
  autoQuality: boolean; // 帧率不足自动降档
  invertY: boolean;
}

export const QUALITY_LABEL: Record<Quality, string> = { low: '低', medium: '中', high: '高' };

export function uid(): string {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
}

export function defaultTile(): TileParams {
  return {
    colorA: '#1a6f9e', colorB: '#2e8fb8', colorC: '#0d4a6e',
    mixB: 0.25, mixC: 0.12, jitter: 0.18,
    groutColor: '#c8c4bb', groutWidth: 2, tileSize: 25,
  };
}

export function defaultWater(): WaterParams {
  return { color: '#0a4d6e', clarity: 0.85, windSpeed: 3, waveAmp: 1 };
}

export function defaultLighting(): LightingParams {
  return {
    sunOn: true, night: false, timeOfDay: 14, sunIntensity: 1,
    lights: [{
      id: uid(), edge: 0, t: 0.5, depth: 0.8,
      color: '#cfe8ff', intensity: 1, on: true,
    }],
  };
}

export function defaultProject(name: string): Project {
  const now = Date.now();
  return {
    id: uid(), name, createdAt: now, updatedAt: now,
    // 默认 8m × 4m 矩形池,1.2m 渐变到 1.8m
    vertices: [
      { x: -4, y: -2, depth: 1.2 },
      { x: 4, y: -2, depth: 1.2 },
      { x: 4, y: 2, depth: 1.8 },
      { x: -4, y: 2, depth: 1.8 },
    ],
    steps: [{
      id: uid(), x: -4, y: -2, w: 1.2, h: 4, steps: 3,
      topDepth: 0.35, bottomDepth: 1.05, dir: 0,
    }],
    shallows: [],
    tile: defaultTile(),
    water: defaultWater(),
    lighting: defaultLighting(),
    bookmarks: [],
  };
}

export const DEFAULT_SETTINGS: Settings = { quality: 'medium', autoQuality: true, invertY: false };

/** 导入数据校验与补全 */
export function sanitizeProject(raw: any): Project | null {
  if (!raw || typeof raw !== 'object') return null;
  if (!Array.isArray(raw.vertices) || raw.vertices.length < 3) return null;
  const d = defaultProject(typeof raw.name === 'string' ? raw.name : '导入项目');
  const p: Project = {
    ...d,
    id: typeof raw.id === 'string' ? raw.id : uid(),
    name: typeof raw.name === 'string' ? raw.name : d.name,
    createdAt: typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
    updatedAt: typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now(),
    vertices: raw.vertices
      .filter((v: any) => isFinite(v?.x) && isFinite(v?.y))
      .map((v: any) => ({ x: +v.x, y: +v.y, depth: isFinite(v?.depth) ? +v.depth : 1.5 })),
    steps: Array.isArray(raw.steps) ? raw.steps.filter((s: any) => isFinite(s?.x) && isFinite(s?.w)).map((s: any) => ({
      id: typeof s.id === 'string' ? s.id : uid(),
      x: +s.x, y: +s.y, w: +s.w, h: +s.h || 1,
      steps: Math.max(1, Math.min(8, s.steps | 0 || 3)),
      topDepth: isFinite(s.topDepth) ? +s.topDepth : 0.35,
      bottomDepth: isFinite(s.bottomDepth) ? +s.bottomDepth : 1.0,
      dir: ([0, 1, 2, 3].includes(s.dir) ? s.dir : 0) as 0 | 1 | 2 | 3,
    })) : [],
    shallows: Array.isArray(raw.shallows) ? raw.shallows.filter((s: any) => isFinite(s?.x) && isFinite(s?.w)).map((s: any) => ({
      id: typeof s.id === 'string' ? s.id : uid(),
      x: +s.x, y: +s.y, w: +s.w, h: +s.h || 1,
      depth: isFinite(s.depth) ? +s.depth : 0.9,
    })) : [],
    tile: { ...d.tile, ...(raw.tile ?? {}) },
    water: { ...d.water, ...(raw.water ?? {}) },
    lighting: {
      ...d.lighting, ...(raw.lighting ?? {}),
      lights: Array.isArray(raw.lighting?.lights) ? raw.lighting.lights.map((l: any) => ({
        id: typeof l?.id === 'string' ? l.id : uid(),
        edge: Math.max(0, l?.edge | 0), t: isFinite(l?.t) ? +l.t : 0.5,
        depth: isFinite(l?.depth) ? +l.depth : 0.8,
        color: typeof l?.color === 'string' ? l.color : '#cfe8ff',
        intensity: isFinite(l?.intensity) ? +l.intensity : 1,
        on: l?.on !== false,
      })) : d.lighting.lights,
    },
    bookmarks: Array.isArray(raw.bookmarks) ? raw.bookmarks.filter((b: any) => b?.cam).map((b: any) => ({
      id: typeof b.id === 'string' ? b.id : uid(),
      name: typeof b.name === 'string' ? b.name : '书签',
      cam: { ...b.cam },
    })) : [],
  };
  if (p.vertices.length < 3) return null;
  return p;
}
