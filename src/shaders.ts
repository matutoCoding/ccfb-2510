// 全部 GLSL 着色器(WebGL2 / GLSL ES 3.00)

import { WAVE_GLSL, CAUSTIC_GLSL } from './waves';

const HEADER = `#version 300 es
precision highp float;
precision highp int;
`;

/** 天空颜色函数,天空盒与水面反射共用 */
const SKY_GLSL = /* glsl */ `
uniform vec3 uSunDir;       // 光线传播方向,太阳在 -uSunDir
uniform float uNight;       // 0 白天 1 夜晚
uniform float uSunIntensity;

float hash13(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}

vec3 skyColor(vec3 dir) {
  float y = clamp(dir.y, -1.0, 1.0);
  // 白天渐变
  vec3 dayZen = vec3(0.18, 0.42, 0.78);
  vec3 dayHor = vec3(0.75, 0.85, 0.92);
  vec3 day = mix(dayHor, dayZen, pow(max(y, 0.0), 0.55));
  // 地面以下
  day = mix(day, vec3(0.35, 0.38, 0.33), smoothstep(0.0, -0.25, y));
  // 太阳
  vec3 sunPos = -uSunDir;
  float sd = max(dot(dir, sunPos), 0.0);
  float disc = smoothstep(0.9993, 0.9997, sd);
  float glow = pow(sd, 600.0) * 0.9 + pow(sd, 24.0) * 0.12;
  day += (vec3(1.0, 0.95, 0.85) * (disc * 8.0 + glow)) * uSunIntensity;
  // 夜晚
  vec3 nightZen = vec3(0.01, 0.02, 0.05);
  vec3 nightHor = vec3(0.05, 0.08, 0.14);
  vec3 night = mix(nightHor, nightZen, pow(max(y, 0.0), 0.5));
  night = mix(night, vec3(0.02, 0.03, 0.04), smoothstep(0.0, -0.25, y));
  // 星星
  vec3 sp = floor(dir * 220.0);
  float star = step(0.9985, hash13(sp)) * max(y, 0.0);
  night += vec3(star) * 0.8;
  // 月亮(固定在太阳对面附近)
  vec3 moonPos = normalize(vec3(0.4, 0.55, -0.6));
  float md = max(dot(dir, moonPos), 0.0);
  night += vec3(0.9, 0.95, 1.0) * (smoothstep(0.9995, 0.9998, md) * 2.0 + pow(md, 800.0) * 0.3);
  return mix(day, night, uNight);
}
`;

// ---------- 天空(全屏三角形) ----------
export const SKY_VERT = HEADER + /* glsl */ `
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.9999, 1.0);
}
`;

export const SKY_FRAG = HEADER + /* glsl */ `
in vec2 vUv;
out vec4 fragColor;
uniform mat4 uInvViewProj;
${SKY_GLSL}
void main() {
  // 用远/近平面各取一点求视线方向
  vec4 p1 = uInvViewProj * vec4(vUv * 2.0 - 1.0, 1.0, 1.0);
  vec4 p0 = uInvViewProj * vec4(vUv * 2.0 - 1.0, -1.0, 1.0);
  vec3 dir = normalize(p1.xyz / p1.w - p0.xyz / p0.w);
  fragColor = vec4(skyColor(dir), 1.0);
}
`;

// ---------- 池体(池底/池壁/台阶/压顶,含焦散与水下灯) ----------
export const POOL_VERT = HEADER + /* glsl */ `
layout(location=0) in vec3 aPos;
layout(location=1) in vec3 aNrm;
uniform mat4 uViewProj;
out vec3 vWorldPos;
out vec3 vNormal;
void main() {
  vWorldPos = aPos;
  vNormal = aNrm;
  gl_Position = uViewProj * vec4(aPos, 1.0);
}
`;

export const POOL_FRAG = HEADER + /* glsl */ `
in vec3 vWorldPos;
in vec3 vNormal;
out vec4 fragColor;

uniform sampler2D uTileTex;
uniform float uTileWorld;     // 贴图物理尺寸(米)
uniform float uUseTile;       // 1 瓷砖 0 纯色
uniform vec3 uPlainColor;
uniform vec3 uCamPos;
uniform vec3 uSunColor;
uniform vec3 uAmbient;
uniform float uNight;
uniform vec3 uWaterAbsorb;    // 水体吸收系数(rgb)
uniform float uFogDensity;
uniform vec3 uFogColor;
uniform float uCamUnder;      // 相机在水下
uniform int uLightCount;
uniform vec3 uLightPos[4];
uniform vec3 uLightColor[4];  // 已乘强度

${WAVE_GLSL}
${CAUSTIC_GLSL}

vec3 tileColor(vec3 wp, vec3 n) {
  vec3 an = abs(n);
  an /= (an.x + an.y + an.z + 1e-6);
  vec3 cx = texture(uTileTex, wp.zy / uTileWorld).rgb;
  vec3 cy = texture(uTileTex, wp.xz / uTileWorld).rgb;
  vec3 cz = texture(uTileTex, wp.xy / uTileWorld).rgb;
  return cx * an.x + cy * an.y + cz * an.z;
}

void main() {
  vec3 N = normalize(vNormal);
  if (!gl_FrontFacing) N = -N;
  vec3 base = uUseTile > 0.5 ? tileColor(vWorldPos, N) : uPlainColor;

  // 焦散:跟随波浪实时计算
  float caust = causticIntensity(vWorldPos);

  // 太阳漫反射 + 焦散汇聚
  float ndl = max(dot(N, -uSunDir), 0.0);
  vec3 sun = uSunColor * ndl * (1.0 + caust * 2.2);

  // 水下灯(衰减 + 焦散调制)
  vec3 lamp = vec3(0.0);
  for (int i = 0; i < 4; i++) {
    if (i >= uLightCount) break;
    vec3 L = uLightPos[i] - vWorldPos;
    float d = length(L);
    L /= d;
    float atten = 1.0 / (1.0 + 1.2 * d * d);          // 平方衰减
    atten *= exp(-d * 0.22);                           // 水体额外吸收
    float nl = max(dot(N, L), 0.0);
    lamp += uLightColor[i] * (nl * atten) * (0.7 + 0.9 * caust);
  }

  vec3 col = base * (uAmbient + sun + lamp);

  // 水深吸收(红光先衰减)
  float depth = max(uWaterLevel - vWorldPos.y, 0.0);
  col *= exp(-uWaterAbsorb * depth);

  // 相机在水下时的距离雾
  if (uCamUnder > 0.5) {
    float dist = length(uCamPos - vWorldPos);
    float f = 1.0 - exp(-dist * uFogDensity);
    col = mix(col, uFogColor, f);
  }

  fragColor = vec4(col, 1.0);
}
`;

// ---------- 水面 ----------
export const WATER_VERT = HEADER + /* glsl */ `
layout(location=0) in vec3 aPos;
uniform mat4 uViewProj;
${WAVE_GLSL}
out vec3 vWorldPos;
out vec3 vNormal;
void main() {
  vec3 p = aPos;
  p.y += waveH(p.xz);
  vWorldPos = p;
  vNormal = waveN(p.xz);
  gl_Position = uViewProj * vec4(p, 1.0);
}
`;

export const WATER_FRAG = HEADER + /* glsl */ `
in vec3 vWorldPos;
in vec3 vNormal;
out vec4 fragColor;

uniform sampler2D uSceneTex;
uniform vec2 uResolution;
uniform vec3 uCamPos;
uniform float uCamUnder;
uniform vec3 uWaterTint;    // 水色(乘算)
uniform float uRefrK;       // 折射扰动强度
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform vec3 uSunColor;

${SKY_GLSL}

void main() {
  vec3 N = normalize(vNormal);
  vec3 V = normalize(uCamPos - vWorldPos);
  vec2 suv = gl_FragCoord.xy / uResolution;
  vec3 col;

  if (uCamUnder < 0.5) {
    // ---- 水上视角:菲涅尔混合天空反射与水下折射 ----
    if (!gl_FrontFacing) N = -N;
    float F = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
    vec2 offset = N.xz * uRefrK;
    vec3 refr = texture(uSceneTex, suv + offset).rgb * uWaterTint;
    vec3 R = reflect(-V, N);
    vec3 sky = skyColor(R);
    col = mix(refr, sky, F);
    // 太阳高光
    float spec = pow(max(dot(R, -uSunDir), 0.0), 240.0);
    col += uSunColor * spec * 2.0 * (1.0 - uNight);
  } else {
    // ---- 水下视角:斯涅尔窗口 + 全内反射 ----
    vec3 Nf = gl_FrontFacing ? -N : N; // 法线朝向相机(向下)
    float cosI = clamp(dot(Nf, V), 0.0, 1.0);
    const float COS_CRIT = 0.660; // 临界角 48.75°
    if (cosI > COS_CRIT) {
      // 斯涅尔窗口:看到水上世界(场景纹理里是天空)
      vec2 offset = N.xz * uRefrK * 2.5;
      col = texture(uSceneTex, suv + offset).rgb;
      col *= vec3(0.85, 0.95, 1.0);
    } else {
      // 全内反射:反射回水下,近似为水色微光
      col = uFogColor * (0.55 + 0.45 * max(-N.y, 0.0));
    }
    float dist = length(uCamPos - vWorldPos);
    float f = 1.0 - exp(-dist * uFogDensity * 0.6);
    col = mix(col, uFogColor, f);
  }

  fragColor = vec4(col, 1.0);
}
`;

// ---------- 全屏拷贝 ----------
export const BLIT_VERT = SKY_VERT;

export const BLIT_FRAG = HEADER + /* glsl */ `
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTex;
void main() { fragColor = texture(uTex, vUv); }
`;

// ---------- FXAA(精简版) ----------
export const FXAA_FRAG = HEADER + /* glsl */ `
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D uTex;
uniform vec2 uInvRes;
void main() {
  vec3 rgbNW = texture(uTex, vUv + vec2(-1.0, -1.0) * uInvRes).rgb;
  vec3 rgbNE = texture(uTex, vUv + vec2( 1.0, -1.0) * uInvRes).rgb;
  vec3 rgbSW = texture(uTex, vUv + vec2(-1.0,  1.0) * uInvRes).rgb;
  vec3 rgbSE = texture(uTex, vUv + vec2( 1.0,  1.0) * uInvRes).rgb;
  vec3 rgbM  = texture(uTex, vUv).rgb;
  vec3 luma = vec3(0.299, 0.587, 0.114);
  float lNW = dot(rgbNW, luma), lNE = dot(rgbNE, luma);
  float lSW = dot(rgbSW, luma), lSE = dot(rgbSE, luma), lM = dot(rgbM, luma);
  float lMin = min(lM, min(min(lNW, lNE), min(lSW, lSE)));
  float lMax = max(lM, max(max(lNW, lNE), max(lSW, lSE)));
  vec2 dir = vec2(-((lNW + lNE) - (lSW + lSE)), ((lNW + lSW) - (lNE + lSE)));
  float dirReduce = max((lNW + lNE + lSW + lSE) * 0.03125, 0.0078125);
  float rcpDirMin = 1.0 / (min(abs(dir.x), abs(dir.y)) + dirReduce);
  dir = clamp(dir * rcpDirMin, -8.0, 8.0) * uInvRes;
  vec3 rgbA = 0.5 * (texture(uTex, vUv + dir * (1.0/3.0 - 0.5)).rgb +
                     texture(uTex, vUv + dir * (2.0/3.0 - 0.5)).rgb);
  vec3 rgbB = rgbA * 0.5 + 0.25 * (texture(uTex, vUv + dir * -0.5).rgb +
                                   texture(uTex, vUv + dir *  0.5).rgb);
  float lB = dot(rgbB, luma);
  fragColor = vec4((lB < lMin || lB > lMax) ? rgbA : rgbB, 1.0);
}
`;

// ---------- 水下灯泛光(公告板,加色混合) ----------
export const GLOW_VERT = HEADER + /* glsl */ `
uniform vec3 uLightPos[4];
uniform vec3 uCamRight;
uniform vec3 uCamUp;
uniform mat4 uViewProj;
uniform float uGlowSize;
flat out vec3 vColor;
out vec2 vUv;
uniform vec4 uGlow[4]; // rgb * intensity, w = on
uniform int uLightCount;
void main() {
  int i = gl_VertexID / 6;
  int c = gl_VertexID % 6;
  // 用顶点ID展开两个三角形,无需顶点缓冲
  vec2 quad[6];
  quad[0]=vec2(-1.0,-1.0); quad[1]=vec2(1.0,-1.0); quad[2]=vec2(1.0,1.0);
  quad[3]=vec2(-1.0,-1.0); quad[4]=vec2(1.0,1.0); quad[5]=vec2(-1.0,1.0);
  vec2 q = quad[c];
  vec3 wp = uLightPos[i] + (uCamRight * q.x + uCamUp * q.y) * uGlowSize;
  vUv = q;
  vColor = uGlow[i].rgb;
  if (i >= uLightCount || uGlow[i].w < 0.5) wp = vec3(0.0, -1000.0, 0.0);
  gl_Position = uViewProj * vec4(wp, 1.0);
}
`;

export const GLOW_FRAG = HEADER + /* glsl */ `
flat in vec3 vColor;
in vec2 vUv;
out vec4 fragColor;
void main() {
  float r2 = dot(vUv, vUv);
  float a = exp(-r2 * 4.5) * smoothstep(1.0, 0.6, r2);
  fragColor = vec4(vColor * a, 1.0);
}
`;

// ---------- 水面遮罩(写模板,不着色) ----------
export const MASK_VERT = HEADER + /* glsl */ `
layout(location=0) in vec3 aPos;
uniform mat4 uViewProj;
void main() { gl_Position = uViewProj * vec4(aPos, 1.0); }
`;

export const MASK_FRAG = HEADER + /* glsl */ `
out vec4 fragColor;
void main() { fragColor = vec4(0.0); }
`;
