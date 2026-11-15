// WebGL2 基础封装

export function compileShader(gl: WebGL2RenderingContext, type: number, src: string): WebGLShader {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error(`着色器编译失败: ${log}\n${src.split('\n').slice(0, 8).join('\n')}`);
  }
  return sh;
}

export interface Program {
  prog: WebGLProgram;
  uniforms: Map<string, WebGLUniformLocation | null>;
}

export function createProgram(gl: WebGL2RenderingContext, vsSrc: string, fsSrc: string): Program {
  const vs = compileShader(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSrc);
  const prog = gl.createProgram()!;
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  gl.deleteShader(vs); gl.deleteShader(fs);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(`着色器链接失败: ${gl.getProgramInfoLog(prog)}`);
  }
  return { prog, uniforms: new Map() };
}

export function U(p: Program, gl: WebGL2RenderingContext, name: string): WebGLUniformLocation | null {
  if (!p.uniforms.has(name)) p.uniforms.set(name, gl.getUniformLocation(p.prog, name));
  return p.uniforms.get(name)!;
}

export interface GpuMesh {
  vao: WebGLVertexArrayObject;
  count: number;
  vbo: WebGLBuffer;
  nbo: WebGLBuffer | null;
  ibo: WebGLBuffer;
}

export function uploadMesh(gl: WebGL2RenderingContext, positions: Float32Array, normals: Float32Array | null, indices: Uint32Array): GpuMesh {
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);
  const vbo = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
  let nbo: WebGLBuffer | null = null;
  if (normals) {
    nbo = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, nbo);
    gl.bufferData(gl.ARRAY_BUFFER, normals, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
  }
  const ibo = gl.createBuffer()!;
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
  gl.bindVertexArray(null);
  return { vao, count: indices.length, vbo, nbo, ibo };
}

export function deleteMesh(gl: WebGL2RenderingContext, m: GpuMesh | null): void {
  if (!m) return;
  gl.deleteVertexArray(m.vao);
  gl.deleteBuffer(m.vbo);
  if (m.nbo) gl.deleteBuffer(m.nbo);
  gl.deleteBuffer(m.ibo);
}

export interface Fbo {
  fbo: WebGLFramebuffer;
  color: WebGLTexture;
  w: number; h: number;
}

export function createFbo(gl: WebGL2RenderingContext, w: number, h: number, stencil: boolean): Fbo {
  const color = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, color);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  const fbo = gl.createFramebuffer()!;
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, color, 0);
  const depth = gl.createRenderbuffer()!;
  gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
  const fmt = stencil ? gl.DEPTH24_STENCIL8 : gl.DEPTH_COMPONENT24;
  gl.renderbufferStorage(gl.RENDERBUFFER, fmt, w, h);
  gl.framebufferRenderbuffer(gl.FRAMEBUFFER, stencil ? gl.DEPTH_STENCIL_ATTACHMENT : gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return { fbo, color, w, h };
}

export function deleteFbo(gl: WebGL2RenderingContext, f: Fbo | null): void {
  if (!f) return;
  gl.deleteFramebuffer(f.fbo);
  gl.deleteTexture(f.color);
}
