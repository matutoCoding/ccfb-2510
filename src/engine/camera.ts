// 轨道相机:旋转/平移/缩放,支持潜入水下,鼠标+触摸

import { Mat4, m4LookAt, m4Perspective, m4Mul, m4Invert, Vec3 } from '../util';
import { CameraPose } from '../types';

export class OrbitCamera {
  target: Vec3 = [0, -0.8, 0];
  theta = Math.PI * 0.25; // 方位角
  phi = Math.PI * 0.28;   // 俯仰角(从水平面起)
  dist = 12;
  fov = (55 * Math.PI) / 180;
  invertY = false;

  eye(): Vec3 {
    const cp = Math.cos(this.phi), sp = Math.sin(this.phi);
    return [
      this.target[0] + this.dist * cp * Math.cos(this.theta),
      this.target[1] + this.dist * sp,
      this.target[2] + this.dist * cp * Math.sin(this.theta),
    ];
  }

  view(): Mat4 {
    return m4LookAt(this.eye(), this.target, [0, 1, 0]);
  }

  proj(aspect: number): Mat4 {
    return m4Perspective(this.fov, aspect, 0.05, 300);
  }

  viewProj(aspect: number): Mat4 {
    return m4Mul(this.proj(aspect), this.view());
  }

  invViewProj(aspect: number): Mat4 {
    return m4Invert(this.viewProj(aspect));
  }

  /** 相机右/上方向(世界系) */
  basis(): { right: Vec3; up: Vec3 } {
    const eye = this.eye();
    const f: Vec3 = [
      this.target[0] - eye[0], this.target[1] - eye[1], this.target[2] - eye[2],
    ];
    const fl = Math.hypot(...f) || 1;
    const fwd: Vec3 = [f[0] / fl, f[1] / fl, f[2] / fl];
    const r: Vec3 = [fwd[2], 0, -fwd[0]];
    const rl = Math.hypot(...r) || 1;
    const right: Vec3 = [r[0] / rl, 0, r[2] / rl];
    const up: Vec3 = [
      right[1] * fwd[2] - right[2] * fwd[1],
      right[2] * fwd[0] - right[0] * fwd[2],
      right[0] * fwd[1] - right[1] * fwd[0],
    ];
    return { right, up };
  }

  rotate(dx: number, dy: number): void {
    this.theta -= dx * 0.005;
    const s = this.invertY ? -1 : 1;
    this.phi += dy * 0.005 * s;
    // 允许潜到水下:俯仰范围放宽
    this.phi = Math.max(-1.35, Math.min(1.5, this.phi));
  }

  zoom(delta: number): void {
    this.dist *= delta > 0 ? 1.1 : 0.9;
    this.dist = Math.max(0.5, Math.min(80, this.dist));
  }

  pan(dx: number, dy: number): void {
    const { right, up } = this.basis();
    const k = this.dist * 0.0016;
    this.target[0] -= right[0] * dx * k;
    this.target[2] -= right[2] * dx * k;
    this.target[0] += up[0] * dy * k;
    this.target[1] += up[1] * dy * k;
    this.target[2] += up[2] * dy * k;
    this.target[1] = Math.max(-6, Math.min(6, this.target[1]));
  }

  getPose(): CameraPose {
    return {
      tx: this.target[0], ty: this.target[1], tz: this.target[2],
      theta: this.theta, phi: this.phi, dist: this.dist,
    };
  }

  setPose(p: CameraPose): void {
    this.target = [p.tx, p.ty, p.tz];
    this.theta = p.theta; this.phi = p.phi; this.dist = p.dist;
  }
}

/** 把轨道相机操控绑定到画布(鼠标 + 触摸),返回解绑函数 */
export function bindCameraControls(canvas: HTMLCanvasElement, cam: OrbitCamera): () => void {
  let dragging = false;
  let panning = false;
  let lastX = 0, lastY = 0;
  const touches = new Map<number, { x: number; y: number }>();
  let pinchDist = 0;

  const onPointerDown = (e: PointerEvent) => {
    canvas.setPointerCapture(e.pointerId);
    touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size === 2) {
      const [a, b] = [...touches.values()];
      pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      dragging = false;
      return;
    }
    dragging = true;
    panning = e.button === 2 || e.shiftKey;
    lastX = e.clientX; lastY = e.clientY;
  };
  const onPointerMove = (e: PointerEvent) => {
    if (touches.has(e.pointerId)) touches.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.size === 2) {
      const [a, b] = [...touches.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDist > 0 && d > 0) {
        cam.dist *= pinchDist / d;
        cam.dist = Math.max(0.5, Math.min(80, cam.dist));
      }
      pinchDist = d;
      return;
    }
    if (!dragging) return;
    const dx = e.clientX - lastX, dy = e.clientY - lastY;
    lastX = e.clientX; lastY = e.clientY;
    if (panning) cam.pan(dx, dy);
    else cam.rotate(dx, dy);
  };
  const onPointerUp = (e: PointerEvent) => {
    touches.delete(e.pointerId);
    if (touches.size === 0) { dragging = false; pinchDist = 0; }
  };
  const onWheel = (e: WheelEvent) => {
    e.preventDefault();
    cam.zoom(e.deltaY);
  };
  const onContext = (e: Event) => e.preventDefault();

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('wheel', onWheel, { passive: false });
  canvas.addEventListener('contextmenu', onContext);
  return () => {
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('pointermove', onPointerMove);
    canvas.removeEventListener('pointerup', onPointerUp);
    canvas.removeEventListener('pointercancel', onPointerUp);
    canvas.removeEventListener('wheel', onWheel);
    canvas.removeEventListener('contextmenu', onContext);
  };
}
