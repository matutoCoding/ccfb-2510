// 波浪模型:由风速生成波列参数,TS 与 GLSL 共用同一套高度场函数
// 焦散与水面网格用的是同一个 waveH/waveN,保证焦散严格跟随波浪实时变化

export const MAX_WAVES = 8;

export interface WaveSet {
  count: number;
  dir: Float32Array;   // 2 * MAX_WAVES,单位向量
  amp: Float32Array;   // 米
  len: Float32Array;   // 波长 米
  omega: Float32Array; // 角频率 rad/s
}

/** 由风速(m/s)与波高倍率生成波列。波数随画质档位变化。 */
export function makeWaves(windSpeed: number, waveAmp: number, count: number): WaveSet {
  const w = Math.max(0, windSpeed);
  const set: WaveSet = {
    count: Math.min(count, MAX_WAVES),
    dir: new Float32Array(MAX_WAVES * 2),
    amp: new Float32Array(MAX_WAVES),
    len: new Float32Array(MAX_WAVES),
    omega: new Float32Array(MAX_WAVES),
  };
  // 主波长随风速增大,振幅随风速近似线性(带饱和)
  const baseLen = 0.45 + w * 0.32;
  const baseAmp = Math.min(0.008 + w * 0.0075, 0.10) * waveAmp;
  // 方向:主风向 + 逐渐散开的分量
  const mainAngle = 0.6; // 主风向(弧度),固定一个方向即可
  for (let i = 0; i < set.count; i++) {
    const f = i / Math.max(1, set.count - 1); // 0..1
    const ang = mainAngle + (i % 2 === 0 ? 1 : -1) * f * 0.9 + i * 0.13;
    set.dir[i * 2] = Math.cos(ang);
    set.dir[i * 2 + 1] = Math.sin(ang);
    const len = baseLen * (1 - f * 0.55) * (1 + i * 0.07);
    set.len[i] = len;
    set.amp[i] = baseAmp * (1 - f * 0.62) / (1 + i * 0.35);
    const k = (2 * Math.PI) / len;
    set.omega[i] = Math.sqrt(9.81 * k) * 0.85; // 深水色散关系
  }
  return set;
}

/** GLSL:高度场与法线。水面顶点着色器与池底焦散共用,保证一致。 */
export const WAVE_GLSL = /* glsl */ `
const int MAX_WAVES = ${MAX_WAVES};
uniform int uWaveCount;
uniform vec2 uWaveDir[MAX_WAVES];
uniform float uWaveAmp[MAX_WAVES];
uniform float uWaveLen[MAX_WAVES];
uniform float uWaveOmega[MAX_WAVES];
uniform float uTime;

float waveH(vec2 p) {
  float h = 0.0;
  for (int i = 0; i < MAX_WAVES; i++) {
    if (i >= uWaveCount) break;
    float k = 6.28318530718 / uWaveLen[i];
    float ph = k * dot(uWaveDir[i], p) - uWaveOmega[i] * uTime;
    h += uWaveAmp[i] * sin(ph);
  }
  return h;
}

vec3 waveN(vec2 p) {
  float dx = 0.0, dz = 0.0;
  for (int i = 0; i < MAX_WAVES; i++) {
    if (i >= uWaveCount) break;
    float k = 6.28318530718 / uWaveLen[i];
    float ph = k * dot(uWaveDir[i], p) - uWaveOmega[i] * uTime;
    float c = uWaveAmp[i] * k * cos(ph);
    dx += uWaveDir[i].x * c;
    dz += uWaveDir[i].y * c;
  }
  return normalize(vec3(-dx, 1.0, -dz));
}
`;

/** GLSL:焦散。把太阳光线在水面折射后投射到池底平面,
 * 用 3 个采样点的映射面积比(雅可比)估算光强汇聚 —— 实时计算,非贴图。 */
export const CAUSTIC_GLSL = /* glsl */ `
uniform float uWaterLevel;
uniform vec3 uSunDir;      // 光线传播方向(向下),已归一化
uniform float uCausticStrength;

vec3 refractHit(vec2 xz, float floorY) {
  float h = waveH(xz);
  vec3 S = vec3(xz.x, uWaterLevel + h, xz.y);
  vec3 N = waveN(xz);
  vec3 R = refract(normalize(uSunDir), N, 0.7519); // 空气->水 1/1.33
  float ry = min(R.y, -0.08);
  float t = (floorY - S.y) / ry;
  return S + R * max(t, 0.0);
}

float causticIntensity(vec3 wp) {
  float e = 0.06;
  vec3 c0 = refractHit(wp.xz, wp.y);
  vec3 cx = refractHit(wp.xz + vec2(e, 0.0), wp.y);
  vec3 cz = refractHit(wp.xz + vec2(0.0, e), wp.y);
  vec2 d1 = cx.xz - c0.xz;
  vec2 d2 = cz.xz - c0.xz;
  float a0 = e * e;
  float a1 = abs(d1.x * d2.y - d1.y * d2.x);
  float ratio = a0 / max(a1, 1e-5);
  // ratio≈1 为均匀光,>1 汇聚,<1 发散;映射到可用亮度区间
  float c = clamp((ratio - 0.55) * 0.9, 0.0, 3.0);
  return pow(c, 1.4) * uCausticStrength;
}
`;
