// 渲染器:场景FBO -> 合成FBO(水面+泛光) -> FXAA -> 屏幕
// 焦散在池体片元着色器里由波列实时计算,与水面网格共用同一高度场

import { Project, Quality } from '../types';
import { buildPoolGeometry, buildWaterGrid, buildWaterMask, PoolGeometry } from '../geometry';
import { generateTileTexture } from '../tiles';
import { makeWaves, WaveSet, MAX_WAVES } from '../waves';
import { hexToRgb, lerp, clamp } from '../util';
import { OrbitCamera } from './camera';
import {
  createProgram, uploadMesh, deleteMesh, createFbo, deleteFbo,
  Program, GpuMesh, Fbo, U,
} from './gl';
import {
  SKY_VERT, SKY_FRAG, POOL_VERT, POOL_FRAG, WATER_VERT, WATER_FRAG,
  BLIT_VERT, BLIT_FRAG, FXAA_FRAG, GLOW_VERT, GLOW_FRAG, MASK_VERT, MASK_FRAG,
} from '../shaders';

interface QualitySpec {
  renderScale: number;  // 渲染分辨率倍率
  maxDpr: number;
  waves: number;        // 波列数量
  waterSpacing: number; // 水面网格间距(米)
  fxaa: boolean;
}

const QUALITY_SPECS: Record<Quality, QualitySpec> = {
  low:    { renderScale: 0.7,  maxDpr: 1,   waves: 2, waterSpacing: 0.22, fxaa: false },
  medium: { renderScale: 1.0,  maxDpr: 1.5, waves: 4, waterSpacing: 0.12, fxaa: true },
  high:   { renderScale: 1.0,  maxDpr: 2,   waves: 8, waterSpacing: 0.06, fxaa: true },
};

export class PoolRenderer {
  private gl: WebGL2RenderingContext;
  readonly canvas: HTMLCanvasElement;
  camera = new OrbitCamera();
  quality: Quality = 'medium';

  private project: Project;
  private geom: PoolGeometry;
  private waves: WaveSet;

  private skyProg: Program;
  private poolProg: Program;
  private waterProg: Program;
  private blitProg: Program;
  private fxaaProg: Program;
  private glowProg: Program;
  private maskProg: Program;

  private floorMesh: GpuMesh;
  private wallMesh: GpuMesh;
  private zoneMesh: GpuMesh;
  private copingMesh: GpuMesh;
  private waterMesh: GpuMesh;
  private maskMesh: GpuMesh;

  private tileTex: WebGLTexture;
  private tileWorld = 0.4;

  private sceneFbo: Fbo | null = null;
  private compFbo: Fbo | null = null;

  private time = 0;
  fps = 0;
  private fpsEma = 0;

  constructor(canvas: HTMLCanvasElement, project: Project, quality: Quality) {
    this.canvas = canvas;
    this.project = project;
    this.quality = quality;
    const gl = canvas.getContext('webgl2', {
      antialias: false, alpha: false, depth: true, stencil: true,
      preserveDrawingBuffer: false, powerPreference: 'high-performance',
    });
    if (!gl) throw new Error('当前浏览器不支持 WebGL2');
    this.gl = gl;

    this.skyProg = createProgram(gl, SKY_VERT, SKY_FRAG);
    this.poolProg = createProgram(gl, POOL_VERT, POOL_FRAG);
    this.waterProg = createProgram(gl, WATER_VERT, WATER_FRAG);
    this.blitProg = createProgram(gl, BLIT_VERT, BLIT_FRAG);
    this.fxaaProg = createProgram(gl, BLIT_VERT, FXAA_FRAG);
    this.glowProg = createProgram(gl, GLOW_VERT, GLOW_FRAG);
    this.maskProg = createProgram(gl, MASK_VERT, MASK_FRAG);

    this.geom = buildPoolGeometry(project);
    this.waves = makeWaves(project.water.windSpeed, project.water.waveAmp, QUALITY_SPECS[quality].waves);

    this.floorMesh = uploadMesh(gl, this.geom.floor.positions, this.geom.floor.normals, this.geom.floor.indices);
    this.wallMesh = uploadMesh(gl, this.geom.walls.positions, this.geom.walls.normals, this.geom.walls.indices);
    this.zoneMesh = uploadMesh(gl, this.geom.zones.positions, this.geom.zones.normals, this.geom.zones.indices);
    this.copingMesh = uploadMesh(gl, this.geom.coping.positions, this.geom.coping.normals, this.geom.coping.indices);
    this.waterMesh = this.buildWaterMesh();
    const mask0 = buildWaterMask(project.vertices, this.geom.waterLevel);
    this.maskMesh = uploadMesh(gl, mask0.positions, null, mask0.indices);

    this.tileTex = gl.createTexture()!;
    this.updateTileTexture();

    // 默认机位
    const c = this.geom.center;
    const span = Math.max(this.geom.bounds.maxX - this.geom.bounds.minX, this.geom.bounds.maxZ - this.geom.bounds.minZ);
    this.camera.target = [c[0], c[1], c[2]];
    this.camera.dist = span * 1.5 + 2;
  }

  private buildWaterMesh(): GpuMesh {
    const spec = QUALITY_SPECS[this.quality];
    const m = buildWaterGrid(this.geom.bounds, spec.waterSpacing, this.geom.waterLevel);
    return uploadMesh(this.gl, m.positions, null, m.indices);
  }

  /** 瓷砖参数变化后重生成贴图 */
  updateTileTexture(): void {
    const gl = this.gl;
    const { canvas, worldSize } = generateTileTexture(this.project.tile);
    this.tileWorld = worldSize;
    gl.bindTexture(gl.TEXTURE_2D, this.tileTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    const ext = gl.getExtension('EXT_texture_filter_anisotropic');
    if (ext) {
      const max = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
      gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(8, max));
    }
  }

  /** 水/灯光等轻量参数更新(不重建几何) */
  updateParams(): void {
    this.waves = makeWaves(this.project.water.windSpeed, this.project.water.waveAmp, QUALITY_SPECS[this.quality].waves);
  }

  /** 池体形状变化后重建几何 */
  rebuildGeometry(): void {
    const gl = this.gl;
    this.geom = buildPoolGeometry(this.project);
    deleteMesh(gl, this.floorMesh); deleteMesh(gl, this.wallMesh);
    deleteMesh(gl, this.zoneMesh); deleteMesh(gl, this.copingMesh);
    deleteMesh(gl, this.waterMesh); deleteMesh(gl, this.maskMesh);
    this.floorMesh = uploadMesh(gl, this.geom.floor.positions, this.geom.floor.normals, this.geom.floor.indices);
    this.wallMesh = uploadMesh(gl, this.geom.walls.positions, this.geom.walls.normals, this.geom.walls.indices);
    this.zoneMesh = uploadMesh(gl, this.geom.zones.positions, this.geom.zones.normals, this.geom.zones.indices);
    this.copingMesh = uploadMesh(gl, this.geom.coping.positions, this.geom.coping.normals, this.geom.coping.indices);
    this.waterMesh = this.buildWaterMesh();
    const mask = buildWaterMask(this.project.vertices, this.geom.waterLevel);
    this.maskMesh = uploadMesh(gl, mask.positions, null, mask.indices);
  }

  setQuality(q: Quality): void {
    if (q === this.quality) return;
    this.quality = q;
    deleteMesh(this.gl, this.waterMesh);
    this.waterMesh = this.buildWaterMesh();
    this.updateParams();
    this.sceneFbo = null; // 触发重建
    this.compFbo = null;
  }

  resize(): void {
    const spec = QUALITY_SPECS[this.quality];
    const dpr = Math.min(window.devicePixelRatio || 1, spec.maxDpr) * spec.renderScale;
    const w = Math.max(2, Math.round(this.canvas.clientWidth * dpr));
    const h = Math.max(2, Math.round(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
      if (this.sceneFbo) { deleteFbo(this.gl, this.sceneFbo); this.sceneFbo = null; }
      if (this.compFbo) { deleteFbo(this.gl, this.compFbo); this.compFbo = null; }
    }
  }

  /** 渲染一帧。dt 单位秒。 */
  frame(dt: number): void {
    const gl = this.gl;
    this.time += dt;
    if (dt > 0) {
      const f = 1 / dt;
      this.fpsEma = this.fpsEma === 0 ? f : lerp(this.fpsEma, f, 0.05);
      this.fps = Math.round(this.fpsEma);
    }
    this.resize();
    const W = this.canvas.width, H = this.canvas.height;
    if (!this.sceneFbo || this.sceneFbo.w !== W || this.sceneFbo.h !== H) {
      if (this.sceneFbo) deleteFbo(gl, this.sceneFbo);
      if (this.compFbo) deleteFbo(gl, this.compFbo);
      this.sceneFbo = createFbo(gl, W, H, true); // 与 compFbo 同为 DEPTH24_STENCIL8,深度 blit 要求格式一致
      this.compFbo = createFbo(gl, W, H, true);
    }

    const aspect = W / H;
    const vp = this.camera.viewProj(aspect);
    const invVp = this.camera.invViewProj(aspect);
    const eye = this.camera.eye();
    const camUnder = eye[1] < this.geom.waterLevel ? 1 : 0;

    // 光照参数
    const L = this.project.lighting;
    const tod = L.timeOfDay;
    const az = ((tod - 12) / 12) * Math.PI;
    const el = Math.max(0.06, Math.sin(((tod - 6) / 12) * Math.PI)) * Math.PI * 0.42;
    const sunPos = [Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)];
    const sunDir = [-sunPos[0], -sunPos[1], -sunPos[2]];
    const night = L.night ? 1 : 0;
    const dayLight = clamp(Math.sin(((tod - 6) / 12) * Math.PI), 0, 1);
    const sunI = (L.sunOn ? L.sunIntensity : 0) * (0.25 + 0.75 * dayLight) * (1 - night);
    const sunColor: [number, number, number] = [1.0 * sunI, 0.93 * sunI, 0.82 * sunI];
    const ambient: [number, number, number] = night
      ? [0.035, 0.045, 0.07]
      : [0.22 + 0.1 * dayLight, 0.24 + 0.1 * dayLight, 0.28 + 0.08 * dayLight];

    // 水体参数
    const clarity = this.project.water.clarity;
    const [wr, wg, wb] = hexToRgb(this.project.water.color);
    const absorbK = lerp(0.9, 0.12, clarity);
    const absorb: [number, number, number] = [
      (1 - wr * 0.9) * absorbK * 0.5,
      (1 - wg * 0.9) * absorbK * 0.28,
      (1 - wb * 0.9) * absorbK * 0.15,
    ];
    const fogDensity = lerp(0.5, 0.06, clarity);
    const fogColor: [number, number, number] = night
      ? [0.01, 0.03, 0.05]
      : [wr * 0.35 + 0.02, wg * 0.4 + 0.04, wb * 0.5 + 0.06];
    const waterTint: [number, number, number] = [
      lerp(wr + 0.55, 1, clarity * 0.5),
      lerp(wg + 0.55, 1, clarity * 0.5),
      lerp(wb + 0.55, 1, clarity * 0.5),
    ];

    // 水下灯
    const lights = this.project.lighting.lights.slice(0, 4);
    const lightPos = new Float32Array(12);
    const lightColor = new Float32Array(12);
    const glow = new Float32Array(16);
    lights.forEach((l, i) => {
      const m = this.geom.lightMounts[i];
      if (!m) return;
      lightPos.set(m.pos, i * 3);
      const [lr, lg, lb] = hexToRgb(l.color);
      const on = l.on ? 1 : 0;
      const boost = night ? 1.6 : 0.55;
      lightColor.set([lr * l.intensity * boost * on, lg * l.intensity * boost * on, lb * l.intensity * boost * on], i * 3);
      glow.set([lr * l.intensity * on * (night ? 1.5 : 0.35), lg * l.intensity * on * (night ? 1.5 : 0.35), lb * l.intensity * on * (night ? 1.5 : 0.35), on], i * 4);
    });

    const setWaves = (prog: Program) => {
      gl.uniform1i(U(prog, gl, 'uWaveCount'), this.waves.count);
      gl.uniform2fv(U(prog, gl, 'uWaveDir[0]'), this.waves.dir);
      gl.uniform1fv(U(prog, gl, 'uWaveAmp[0]'), this.waves.amp);
      gl.uniform1fv(U(prog, gl, 'uWaveLen[0]'), this.waves.len);
      gl.uniform1fv(U(prog, gl, 'uWaveOmega[0]'), this.waves.omega);
      gl.uniform1f(U(prog, gl, 'uTime'), this.time);
    };
    const setSky = (prog: Program) => {
      gl.uniform3fv(U(prog, gl, 'uSunDir'), sunDir);
      gl.uniform1f(U(prog, gl, 'uNight'), night);
      gl.uniform1f(U(prog, gl, 'uSunIntensity'), Math.max(sunI, 0.001));
    };

    // ===== Pass 1: 场景(天空 + 池体) -> sceneFbo =====
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.sceneFbo.fbo);
    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.useProgram(this.skyProg.prog);
    gl.uniformMatrix4fv(U(this.skyProg, gl, 'uInvViewProj'), false, invVp);
    setSky(this.skyProg);
    gl.bindVertexArray(null);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(true);
    gl.depthFunc(gl.LESS);
    gl.useProgram(this.poolProg.prog);
    gl.uniformMatrix4fv(U(this.poolProg, gl, 'uViewProj'), false, vp);
    gl.uniform3fv(U(this.poolProg, gl, 'uCamPos'), eye);
    gl.uniform3fv(U(this.poolProg, gl, 'uSunColor'), sunColor);
    gl.uniform3fv(U(this.poolProg, gl, 'uAmbient'), ambient);
    gl.uniform1f(U(this.poolProg, gl, 'uNight'), night);
    gl.uniform3fv(U(this.poolProg, gl, 'uWaterAbsorb'), absorb);
    gl.uniform1f(U(this.poolProg, gl, 'uFogDensity'), fogDensity);
    gl.uniform3fv(U(this.poolProg, gl, 'uFogColor'), fogColor);
    gl.uniform1f(U(this.poolProg, gl, 'uCamUnder'), camUnder);
    gl.uniform1i(U(this.poolProg, gl, 'uLightCount'), lights.length);
    gl.uniform3fv(U(this.poolProg, gl, 'uLightPos[0]'), lightPos);
    gl.uniform3fv(U(this.poolProg, gl, 'uLightColor[0]'), lightColor);
    gl.uniform1f(U(this.poolProg, gl, 'uWaterLevel'), this.geom.waterLevel);
    gl.uniform3fv(U(this.poolProg, gl, 'uSunDir'), sunDir);
    gl.uniform1f(U(this.poolProg, gl, 'uCausticStrength'), lerp(0.4, 1.1, clarity));
    setWaves(this.poolProg);
    gl.uniform1f(U(this.poolProg, gl, 'uTileWorld'), this.tileWorld);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.tileTex);
    gl.uniform1i(U(this.poolProg, gl, 'uTileTex'), 0);

    const drawMesh = (m: GpuMesh, useTile: number, plain?: [number, number, number]) => {
      gl.uniform1f(U(this.poolProg, gl, 'uUseTile'), useTile);
      if (plain) gl.uniform3fv(U(this.poolProg, gl, 'uPlainColor'), plain);
      gl.bindVertexArray(m.vao);
      gl.drawElements(gl.TRIANGLES, m.count, gl.UNSIGNED_INT, 0);
    };
    drawMesh(this.floorMesh, 1);
    drawMesh(this.wallMesh, 1);
    if (this.zoneMesh.count > 0) drawMesh(this.zoneMesh, 1);
    drawMesh(this.copingMesh, 0, [0.72, 0.70, 0.66]);

    // ===== Pass 2: 合成(场景拷贝 + 水面 + 泛光) -> compFbo =====
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.compFbo!.fbo);
    gl.viewport(0, 0, W, H);
    // 拷贝颜色与深度
    gl.bindFramebuffer(gl.READ_FRAMEBUFFER, this.sceneFbo.fbo);
    gl.bindFramebuffer(gl.DRAW_FRAMEBUFFER, this.compFbo!.fbo);
    gl.blitFramebuffer(0, 0, W, H, 0, 0, W, H, gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT, gl.NEAREST);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.compFbo!.fbo);

    // 水面模板遮罩
    gl.enable(gl.STENCIL_TEST);
    gl.stencilFunc(gl.ALWAYS, 1, 0xff);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
    gl.stencilMask(0xff);
    gl.clear(gl.STENCIL_BUFFER_BIT);
    gl.colorMask(false, false, false, false);
    gl.depthMask(false);
    gl.disable(gl.DEPTH_TEST);
    gl.useProgram(this.maskProg.prog);
    gl.uniformMatrix4fv(U(this.maskProg, gl, 'uViewProj'), false, vp);
    gl.bindVertexArray(this.maskMesh.vao);
    gl.drawElements(gl.TRIANGLES, this.maskMesh.count, gl.UNSIGNED_INT, 0);
    gl.colorMask(true, true, true, true);

    // 水面
    gl.stencilFunc(gl.EQUAL, 1, 0xff);
    gl.stencilMask(0x00);
    gl.enable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.disable(gl.CULL_FACE);
    gl.useProgram(this.waterProg.prog);
    gl.uniformMatrix4fv(U(this.waterProg, gl, 'uViewProj'), false, vp);
    gl.uniform3fv(U(this.waterProg, gl, 'uCamPos'), eye);
    gl.uniform1f(U(this.waterProg, gl, 'uCamUnder'), camUnder);
    gl.uniform3fv(U(this.waterProg, gl, 'uWaterTint'), waterTint);
    gl.uniform1f(U(this.waterProg, gl, 'uRefrK'), 0.035);
    gl.uniform3fv(U(this.waterProg, gl, 'uFogColor'), fogColor);
    gl.uniform1f(U(this.waterProg, gl, 'uFogDensity'), fogDensity);
    gl.uniform3fv(U(this.waterProg, gl, 'uSunColor'), sunColor);
    gl.uniform2f(U(this.waterProg, gl, 'uResolution'), W, H);
    setWaves(this.waterProg);
    setSky(this.waterProg);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.sceneFbo.color);
    gl.uniform1i(U(this.waterProg, gl, 'uSceneTex'), 0);
    gl.bindVertexArray(this.waterMesh.vao);
    gl.drawElements(gl.TRIANGLES, this.waterMesh.count, gl.UNSIGNED_INT, 0);
    gl.disable(gl.STENCIL_TEST);
    gl.depthMask(true);

    // 水下灯泛光(加色)
    if (lights.length > 0) {
      const { right, up } = this.camera.basis();
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.depthMask(false);
      gl.useProgram(this.glowProg.prog);
      gl.uniformMatrix4fv(U(this.glowProg, gl, 'uViewProj'), false, vp);
      gl.uniform3fv(U(this.glowProg, gl, 'uCamRight'), right);
      gl.uniform3fv(U(this.glowProg, gl, 'uCamUp'), up);
      gl.uniform1f(U(this.glowProg, gl, 'uGlowSize'), 0.55);
      gl.uniform1i(U(this.glowProg, gl, 'uLightCount'), lights.length);
      gl.uniform3fv(U(this.glowProg, gl, 'uLightPos[0]'), lightPos);
      gl.uniform4fv(U(this.glowProg, gl, 'uGlow[0]'), glow);
      gl.bindVertexArray(null);
      gl.drawArrays(gl.TRIANGLES, 0, lights.length * 6);
      gl.disable(gl.BLEND);
      gl.depthMask(true);
    }

    // ===== Pass 3: FXAA / 拷贝 -> 屏幕 =====
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, W, H);
    gl.disable(gl.DEPTH_TEST);
    const spec = QUALITY_SPECS[this.quality];
    const prog = spec.fxaa ? this.fxaaProg : this.blitProg;
    gl.useProgram(prog.prog);
    if (spec.fxaa) gl.uniform2f(U(prog, gl, 'uInvRes'), 1 / W, 1 / H);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.compFbo!.color);
    gl.uniform1i(U(prog, gl, 'uTex'), 0);
    gl.bindVertexArray(null);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.enable(gl.DEPTH_TEST);
  }

  /** 截图:渲染一帧后合成参数信息到 2D 画布 */
  screenshot(lines: string[]): HTMLCanvasElement {
    this.frame(0);
    const out = document.createElement('canvas');
    out.width = this.canvas.width;
    out.height = this.canvas.height;
    const ctx = out.getContext('2d')!;
    ctx.drawImage(this.canvas, 0, 0);
    // 参数面板
    const pad = Math.round(out.width * 0.012);
    const lineH = Math.round(out.width * 0.018);
    const fontSize = Math.round(lineH * 0.72);
    ctx.font = `${fontSize}px system-ui, sans-serif`;
    const wMax = Math.max(...lines.map(l => ctx.measureText(l).width));
    const boxW = wMax + pad * 2;
    const boxH = lineH * lines.length + pad * 2;
    const x0 = pad, y0 = out.height - boxH - pad;
    ctx.fillStyle = 'rgba(8, 16, 24, 0.72)';
    ctx.beginPath();
    ctx.roundRect(x0, y0, boxW, boxH, 8);
    ctx.fill();
    ctx.fillStyle = '#e8f0f6';
    lines.forEach((l, i) => ctx.fillText(l, x0 + pad, y0 + pad + lineH * (i + 0.75)));
    return out;
  }

  dispose(): void {
    const gl = this.gl;
    deleteMesh(gl, this.floorMesh); deleteMesh(gl, this.wallMesh);
    deleteMesh(gl, this.zoneMesh); deleteMesh(gl, this.copingMesh);
    deleteMesh(gl, this.waterMesh); deleteMesh(gl, this.maskMesh);
    deleteFbo(gl, this.sceneFbo); deleteFbo(gl, this.compFbo);
    gl.deleteTexture(this.tileTex);
    for (const p of [this.skyProg, this.poolProg, this.waterProg, this.blitProg, this.fxaaProg, this.glowProg, this.maskProg]) {
      gl.deleteProgram(p.prog);
    }
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
}
