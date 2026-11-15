// 池体几何生成:池底(三角化+深度插值)、池壁、台阶、浅水平台、池沿压顶、水面网格

import { Project, PoolVertex, Vec2 } from './types';
import { triangulate, makeDepthSampler, offsetPolygon, polyArea, polyCentroid, lerp } from './util';

export interface MeshData {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
}

export interface PoolGeometry {
  floor: MeshData;
  walls: MeshData;
  zones: MeshData;    // 台阶 + 浅水平台
  coping: MeshData;   // 池沿压顶
  waterLevel: number; // 水面 y(世界坐标,负值)
  center: [number, number, number];
  maxDepth: number;
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  /** 水下灯安装位置(世界坐标)与朝向 */
  lightMounts: { pos: [number, number, number]; inward: [number, number, number] }[];
}

const RIM_Y = 0;           // 池沿高度
const WATER_DROP = 0.08;   // 水面低于池沿 8cm

class MeshBuilder {
  pos: number[] = [];
  nrm: number[] = [];
  idx: number[] = [];
  vert(x: number, y: number, z: number, nx: number, ny: number, nz: number): number {
    this.pos.push(x, y, z, );
    this.nrm.push(nx, ny, nz);
    return this.pos.length / 3 - 1;
  }
  tri(a: number, b: number, c: number) { this.idx.push(a, b, c); }
  build(): MeshData {
    return {
      positions: new Float32Array(this.pos),
      normals: new Float32Array(this.nrm),
      indices: new Uint32Array(this.idx),
    };
  }
}

/** 添加一个盒子(顶面在 y=top,向下延伸到 bottom) */
function addBox(mb: MeshBuilder, cx: number, cz: number, w: number, h: number, top: number, bottom: number) {
  const x0 = cx - w / 2, x1 = cx + w / 2;
  const z0 = cz - h / 2, z1 = cz + h / 2;
  const y0 = bottom, y1 = top;
  // 顶面
  let a = mb.vert(x0, y1, z0, 0, 1, 0), b = mb.vert(x1, y1, z0, 0, 1, 0),
      c = mb.vert(x1, y1, z1, 0, 1, 0), d = mb.vert(x0, y1, z1, 0, 1, 0);
  mb.tri(a, c, b); mb.tri(a, d, c);
  // 四个侧面
  const side = (p0: number[], p1: number[], n: number[]) => {
    const i0 = mb.vert(p0[0], y1, p0[1], n[0], 0, n[1]);
    const i1 = mb.vert(p1[0], y1, p1[1], n[0], 0, n[1]);
    const i2 = mb.vert(p1[0], y0, p1[1], n[0], 0, n[1]);
    const i3 = mb.vert(p0[0], y0, p0[1], n[0], 0, n[1]);
    mb.tri(i0, i2, i1); mb.tri(i0, i3, i2);
  };
  side([x0, z0], [x1, z0], [0, -1]);
  side([x1, z0], [x1, z1], [1, 0]);
  side([x1, z1], [x0, z1], [0, 1]);
  side([x0, z1], [x0, z0], [-1, 0]);
}

export function buildPoolGeometry(p: Project): PoolGeometry {
  const verts = p.vertices;
  const poly: Vec2[] = verts.map(v => ({ x: v.x, y: v.y }));
  const ccw = polyArea(poly) > 0;
  const tris = triangulate(poly);
  const depthAt = makeDepthSampler(verts, tris);
  const centroid = polyCentroid(poly);
  const waterLevel = RIM_Y - WATER_DROP;

  // ---- 池底:三角化多边形,顶点深度插值,法线按面积累加 ----
  const floorPos: number[] = [];
  const floorNrm: number[] = new Array(verts.length * 3).fill(0);
  for (const v of verts) floorPos.push(v.x, -v.depth, v.y);
  for (let t = 0; t < tris.length; t += 3) {
    const [ia, ib, ic] = [tris[t], tris[t + 1], tris[t + 2]];
    const A = [verts[ia].x, -verts[ia].depth, verts[ia].y];
    const B = [verts[ib].x, -verts[ib].depth, verts[ib].y];
    const C = [verts[ic].x, -verts[ic].depth, verts[ic].y];
    const u = [B[0] - A[0], B[1] - A[1], B[2] - A[2]];
    const w = [C[0] - A[0], C[1] - A[1], C[2] - A[2]];
    const n = [
      u[1] * w[2] - u[2] * w[1],
      u[2] * w[0] - u[0] * w[2],
      u[0] * w[1] - u[1] * w[0],
    ];
    // 保证朝上
    const s = n[1] >= 0 ? 1 : -1;
    for (const i of [ia, ib, ic]) {
      floorNrm[i * 3] += n[0] * s;
      floorNrm[i * 3 + 1] += n[1] * s;
      floorNrm[i * 3 + 2] += n[2] * s;
    }
  }
  for (let i = 0; i < verts.length; i++) {
    const l = Math.hypot(floorNrm[i * 3], floorNrm[i * 3 + 1], floorNrm[i * 3 + 2]) || 1;
    floorNrm[i * 3] /= l; floorNrm[i * 3 + 1] /= l; floorNrm[i * 3 + 2] /= l;
  }
  const floor: MeshData = {
    positions: new Float32Array(floorPos),
    normals: new Float32Array(floorNrm),
    indices: new Uint32Array(tris),
  };

  // ---- 池壁:每条边从池沿到池底的竖直四边形,法线朝内 ----
  const wb = new MeshBuilder();
  const n = verts.length;
  for (let i = 0; i < n; i++) {
    const a = verts[i], b = verts[(i + 1) % n];
    const ex = b.x - a.x, ey = b.y - a.y;
    const el = Math.hypot(ex, ey) || 1;
    // 朝内法线(指向质心)
    let nx = ccw ? -ey / el : ey / el;
    let nz = ccw ? ex / el : -ex / el;
    const mx = (a.x + b.x) / 2, mz = (a.y + b.y) / 2;
    if ((centroid.x - mx) * nx + (centroid.y - mz) * nz < 0) { nx = -nx; nz = -nz; }
    const i0 = wb.vert(a.x, RIM_Y, a.y, nx, 0, nz);
    const i1 = wb.vert(b.x, RIM_Y, b.y, nx, 0, nz);
    const i2 = wb.vert(b.x, -b.depth, b.y, nx, 0, nz);
    const i3 = wb.vert(a.x, -a.depth, a.y, nx, 0, nz);
    if (ccw) { wb.tri(i0, i1, i2); wb.tri(i0, i2, i3); }
    else { wb.tri(i0, i2, i1); wb.tri(i0, i3, i2); }
  }
  const walls = wb.build();

  // ---- 台阶与浅水平台 ----
  const zb = new MeshBuilder();
  for (const s of p.steps) {
    const count = Math.max(1, s.steps);
    // 区域内地势最深处的深度,台阶盒子向下嵌入
    let floorMax = 0;
    for (const [fx, fy] of [[s.x, s.y], [s.x + s.w, s.y], [s.x, s.y + s.h], [s.x + s.w, s.y + s.h], [s.x + s.w / 2, s.y + s.h / 2]]) {
      floorMax = Math.max(floorMax, depthAt(fx, fy));
    }
    const embed = Math.max(s.bottomDepth + 0.15, floorMax + 0.05);
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 1 : i / (count - 1);
      const d = lerp(s.topDepth, s.bottomDepth, t);
      // 沿 dir 方向排布
      let cx = s.x + s.w / 2, cz = s.y + s.h / 2, w = s.w, h = s.h;
      if (s.dir === 0) { w = s.w / count; cx = s.x + w * (i + 0.5); }
      else if (s.dir === 1) { w = s.w / count; cx = s.x + s.w - w * (i + 0.5); }
      else if (s.dir === 2) { h = s.h / count; cz = s.y + h * (i + 0.5); }
      else { h = s.h / count; cz = s.y + s.h - h * (i + 0.5); }
      addBox(zb, cx, cz, w, h, -d, -embed);
    }
  }
  for (const s of p.shallows) {
    let floorMax = 0;
    for (const [fx, fy] of [[s.x, s.y], [s.x + s.w, s.y], [s.x, s.y + s.h], [s.x + s.w, s.y + s.h], [s.x + s.w / 2, s.y + s.h / 2]]) {
      floorMax = Math.max(floorMax, depthAt(fx, fy));
    }
    const embed = Math.max(s.depth + 0.15, floorMax + 0.05);
    addBox(zb, s.x + s.w / 2, s.y + s.h / 2, s.w, s.h, -s.depth, -embed);
  }
  const zones = zb.build();

  // ---- 池沿压顶:外扩 0.35m 的环形 ----
  const cb = new MeshBuilder();
  const outer = offsetPolygon(poly, 0.35);
  const rimTop = RIM_Y + 0.02;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const a = poly[i], b = poly[j], ao = outer[i], bo = outer[j];
    const i0 = cb.vert(a.x, rimTop, a.y, 0, 1, 0);
    const i1 = cb.vert(b.x, rimTop, b.y, 0, 1, 0);
    const i2 = cb.vert(bo.x, rimTop, bo.y, 0, 1, 0);
    const i3 = cb.vert(ao.x, rimTop, ao.y, 0, 1, 0);
    if (ccw) { cb.tri(i0, i2, i1); cb.tri(i0, i3, i2); }
    else { cb.tri(i0, i1, i2); cb.tri(i0, i2, i3); }
  }
  const coping = cb.build();

  // ---- 水下灯安装点 ----
  const lightMounts = p.lighting.lights.map(l => {
    const i = Math.min(l.edge, n - 1);
    const a = verts[i], b = verts[(i + 1) % n];
    const t = Math.min(1, Math.max(0, l.t));
    const px = lerp(a.x, b.x, t), py = lerp(a.y, b.y, t);
    const ex = b.x - a.x, ey = b.y - a.y;
    const el = Math.hypot(ex, ey) || 1;
    let nx = ccw ? -ey / el : ey / el;
    let nz = ccw ? ex / el : -ex / el;
    const mx = px, mz = py;
    if ((centroid.x - mx) * nx + (centroid.y - mz) * nz < 0) { nx = -nx; nz = -nz; }
    return {
      pos: [px + nx * 0.04, -l.depth, py + nz * 0.04] as [number, number, number],
      inward: [nx, 0, nz] as [number, number, number],
    };
  });

  const xs = verts.map(v => v.x), ys = verts.map(v => v.y);
  const maxDepth = Math.max(...verts.map(v => v.depth), 0.5);
  return {
    floor, walls, zones, coping,
    waterLevel,
    center: [centroid.x, -maxDepth / 2, centroid.y],
    maxDepth,
    bounds: {
      minX: Math.min(...xs), maxX: Math.max(...xs),
      minZ: Math.min(...ys), maxZ: Math.max(...ys),
    },
    lightMounts,
  };
}

/** 水面网格:覆盖包围盒的规则网格(用模板裁剪到多边形内)。
 *  分辨率按目标间距(米)生成。 */
export function buildWaterGrid(bounds: { minX: number; maxX: number; minZ: number; maxZ: number }, spacing: number, waterLevel: number): MeshData {
  const nx = Math.max(2, Math.ceil((bounds.maxX - bounds.minX) / spacing) + 1);
  const nz = Math.max(2, Math.ceil((bounds.maxZ - bounds.minZ) / spacing) + 1);
  const pos: number[] = [];
  for (let iz = 0; iz < nz; iz++) {
    for (let ix = 0; ix < nx; ix++) {
      const x = bounds.minX + (ix / (nx - 1)) * (bounds.maxX - bounds.minX);
      const z = bounds.minZ + (iz / (nz - 1)) * (bounds.maxZ - bounds.minZ);
      pos.push(x, waterLevel, z);
    }
  }
  const idx: number[] = [];
  for (let iz = 0; iz < nz - 1; iz++) {
    for (let ix = 0; ix < nx - 1; ix++) {
      const a = iz * nx + ix, b = a + 1, c = a + nx, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
  }
  return {
    positions: new Float32Array(pos),
    normals: new Float32Array(pos.length).fill(0), // 法线在顶点着色器里算
    indices: new Uint32Array(idx),
  };
}

/** 水面遮罩网格:多边形在水面高度的平面三角化(用于模板写入) */
export function buildWaterMask(verts: PoolVertex[], waterLevel: number): MeshData {
  const poly: Vec2[] = verts.map(v => ({ x: v.x, y: v.y }));
  const tris = triangulate(poly);
  const pos: number[] = [];
  for (const v of verts) pos.push(v.x, waterLevel, v.y);
  return {
    positions: new Float32Array(pos),
    normals: new Float32Array(pos.length).fill(0),
    indices: new Uint32Array(tris),
  };
}
