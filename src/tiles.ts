// 马赛克瓷砖贴图:Canvas2D 程序生成,颜色/砖缝/单片尺寸可调

import { TileParams } from './types';
import { hexToRgb } from './util';

export const TILES_PER_TEX = 16; // 一张贴图 16×16 片
export const TEX_SIZE = 512;

/** 生成瓷砖贴图,返回 canvas(调用方上传为纹理)。
 *  同时返回贴图覆盖的实际物理尺寸(米),供着色器换算 UV。 */
export function generateTileTexture(tile: TileParams): { canvas: HTMLCanvasElement; worldSize: number } {
  const c = document.createElement('canvas');
  c.width = TEX_SIZE; c.height = TEX_SIZE;
  const ctx = c.getContext('2d')!;
  const n = TILES_PER_TEX;
  const cell = TEX_SIZE / n;
  // 砖缝宽(mm)-> 像素
  const groutPx = Math.max(0.5, (tile.groutWidth / tile.tileSize) * cell);

  ctx.fillStyle = tile.groutColor;
  ctx.fillRect(0, 0, TEX_SIZE, TEX_SIZE);

  const [rA, gA, bA] = hexToRgb(tile.colorA).map(v => v * 255);
  const [rB, gB, bB] = hexToRgb(tile.colorB).map(v => v * 255);
  const [rC, gC, bC] = hexToRgb(tile.colorC).map(v => v * 255);

  // 简单可复现随机
  let seed = 12345;
  const rand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  for (let iy = 0; iy < n; iy++) {
    for (let ix = 0; ix < n; ix++) {
      const pick = rand();
      let r = rA, g = gA, b = bA;
      if (pick < tile.mixC) { r = rC; g = gC; b = bC; }
      else if (pick < tile.mixC + tile.mixB) { r = rB; g = gB; b = bB; }
      // 单片明度抖动
      const j = 1 + (rand() * 2 - 1) * tile.jitter;
      r = Math.min(255, r * j); g = Math.min(255, g * j); b = Math.min(255, b * j);
      ctx.fillStyle = `rgb(${r | 0},${g | 0},${b | 0})`;
      const x = ix * cell + groutPx / 2;
      const y = iy * cell + groutPx / 2;
      const s = cell - groutPx;
      ctx.fillRect(x, y, s, s);
      // 轻微高光,模拟釉面
      ctx.fillStyle = 'rgba(255,255,255,0.06)';
      ctx.fillRect(x, y, s, s * 0.35);
    }
  }

  const worldSize = (tile.tileSize / 1000) * n; // 米
  return { canvas: c, worldSize };
}
