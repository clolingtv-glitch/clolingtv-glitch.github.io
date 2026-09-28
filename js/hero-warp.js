(() => {
  'use strict';

  // 커서 이동 흔적을 시간에 따라 감쇠시키는 독립 구현입니다.
  // 외부 라이브러리 설치 없이 기존 제목과 폰트를 사용합니다.
  const options = {
    strength: 0.8,       // 왜곡 강도. 권장 0.3 ~ 1.2
    radius: 0.24,        // 제목 높이에 대한 반응 반경
    duration: 0.7        // 잔상이 사라지는 시간(초)
  };
  const MAX_TRAIL = 32;

  async function init() {
    const title = document.getElementById('hero-title');
    if (!title || title.dataset.warpReady) return;
    const lines = Array.from(title.children).filter(el => el.tagName === 'SPAN');
    if (!lines.length) return;
    title.dataset.warpReady = 'true';
    await document.fonts.ready;

    const canvas = document.createElement('canvas');
    canvas.className = 'hero-warp__canvas';
    canvas.setAttribute('aria-hidden', 'true');
    const gl = canvas.getContext('webgl2', { alpha: true, premultipliedAlpha: false });
    if (!gl) return; // WebGL이 없으면 원래 HTML 제목을 표시합니다.

const vertex = `#version 300 es
in vec2 position;
in vec2 uv;
out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;
const fragment = `#version 300 es
precision highp float;
uniform sampler2D uTextTexture;
uniform vec2 uResolution;
uniform vec4 uTrail[32];
uniform vec2 uDirection[32];
uniform float uStrength;
uniform float uRadius;
in vec2 vUv;
out vec4 fragColor;
void main() {
  float aspect = uResolution.x / max(uResolution.y, 1.0);
  vec2 field = vec2(0.0);
  for (int i = 0; i < 32; i++) {
    vec4 point = uTrail[i];
    vec2 delta = (vUv - point.xy) * vec2(aspect, 1.0);
    float distanceToPoint = length(delta);
    float area = 1.0 - smoothstep(0.0, uRadius, distanceToPoint);
    float age = point.z;
    float envelope = smoothstep(0.0, 0.12, age) * pow(1.0 - age, 2.0);
    float influence = area * area * envelope * point.w;
    vec2 pull = uDirection[i] * 0.035;
    vec2 swell = delta * 0.16 * sin(age * 3.14159265);
    field += (pull + swell) * influence;
  }
  field *= uStrength;
  float magnitude = length(field);
  field *= min(1.0, 0.065 / max(magnitude, 0.00001));
  vec2 sampleUV = vUv - field / vec2(aspect, 1.0);
  if (any(lessThan(sampleUV, vec2(0.0))) || any(greaterThan(sampleUV, vec2(1.0)))) {
    fragColor = vec4(0.0);
  } else {
    fragColor = texture(uTextTexture, sampleUV);
  }
}
`;


    function compile(type, source) {
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const message = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error(message);
      }
      return shader;
    }

    let program;
    try {
      const vs = compile(gl.VERTEX_SHADER, vertex);
      const fs = compile(gl.FRAGMENT_SHADER, fragment);
      program = gl.createProgram();
      gl.attachShader(program, vs);
      gl.attachShader(program, fs);
      gl.linkProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
    } catch (error) {
      console.warn('제목 효과를 초기화하지 못했습니다.', error);
      return;
    }
    gl.useProgram(program);
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 0, 0, 3, -1, 2, 0, -1, 3, 0, 2]), gl.STATIC_DRAW);
    for (const [name, offset] of [['position', 0], ['uv', 8]]) {
      const loc = gl.getAttribLocation(program, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 16, offset);
    }
    const uniforms = {};
    for (const name of ['uTextTexture', 'uResolution', 'uTrail[0]', 'uDirection[0]', 'uStrength', 'uRadius']) {
      uniforms[name] = gl.getUniformLocation(program, name);
    }
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.uniform1i(uniforms.uTextTexture, 0);
    gl.uniform1f(uniforms.uStrength, options.strength);
    gl.uniform1f(uniforms.uRadius, options.radius);

    title.classList.add('hero-warp');
    title.append(canvas);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    const raster = document.createElement('canvas');
    const ctx = raster.getContext('2d');
    let frame = 0;
    let ready = false, visible = true, lost = false;
    let padding = 0, width = 1, height = 1;
    let previousPointer = null;
    const trail = [];
    const trailData = new Float32Array(MAX_TRAIL * 4);
    const directionData = new Float32Array(MAX_TRAIL * 2);

    function render(now = performance.now()) {
      trailData.fill(0);
      directionData.fill(0);
      trail.forEach((point, i) => {
        const age = Math.min(1, (now - point.born) / (options.duration * 1000));
        trailData.set([point.x, point.y, age, point.force], i * 4);
        directionData.set([point.dx, point.dy], i * 2);
      });
      gl.uniform4fv(uniforms['uTrail[0]'], trailData);
      gl.uniform2fv(uniforms['uDirection[0]'], directionData);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }

    function stop() {
      cancelAnimationFrame(frame);
      frame = 0;
      trail.length = 0;
      previousPointer = null;
      title.classList.remove('is-warping');
    }

    function resize() {
      if (lost) return;
      stop();
      const rect = title.getBoundingClientRect();
      const css = getComputedStyle(title);
      const root = parseFloat(getComputedStyle(document.documentElement).fontSize);
      if (!rect.width || !rect.height) return;
      padding = parseFloat(css.fontSize) * 0.25;
      width = rect.width + padding * 2;
      height = rect.height + padding * 2;
      // 고해상도 화면 대응. GPU의 최대 텍스처 크기를 넘지 않게 제한합니다.
      const max = Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), 8192);
      const dpr = Math.min(devicePixelRatio || 1, 2, max / width, max / height);
      canvas.width = raster.width = Math.max(1, Math.round(width * dpr));
      canvas.height = raster.height = Math.max(1, Math.round(height * dpr));
      Object.assign(canvas.style, {
        left: `${-padding / root}rem`, top: `${-padding / root}rem`,
        width: `${width / root}rem`, height: `${height / root}rem`
      });
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      for (const line of lines) {
        const style = getComputedStyle(line);
        const range = document.createRange();
        range.selectNodeContents(line);
        const bounds = range.getBoundingClientRect();
        const text = line.textContent;
        ctx.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        ctx.fillStyle = style.color;
        ctx.textBaseline = 'alphabetic';
        ctx.textAlign = 'left';
        ctx.fontKerning = style.fontKerning;
        if ('letterSpacing' in ctx) ctx.letterSpacing = style.letterSpacing === 'normal' ? '0px' : style.letterSpacing;
        const metrics = ctx.measureText(text);
        const ascent = metrics.fontBoundingBoxAscent ?? metrics.actualBoundingBoxAscent;
        const descent = metrics.fontBoundingBoxDescent ?? metrics.actualBoundingBoxDescent;
        const y = bounds.top - rect.top + padding + (bounds.height - ascent - descent) / 2 + ascent;
        ctx.fillText(text, bounds.left - rect.left + padding, y);
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, raster);
      gl.uniform2f(uniforms.uResolution, width, height);
      ready = true;
      render();
    }

    function tick(now) {
      frame = 0;
      if (lost || reduced.matches || document.hidden || !visible) { stop(); return; }
      while (trail.length && now - trail[0].born >= options.duration * 1000) trail.shift();
      if (!trail.length) { stop(); return; }
      render(now);
      frame = requestAnimationFrame(tick);
    }

    function onPointer(event) {
      if (event.pointerType === 'touch' || reduced.matches || !ready || lost || !visible || document.hidden) return;
      const box = title.getBoundingClientRect();
      const inside = lines.some(line => {
        const range = document.createRange();
        range.selectNodeContents(line);
        const b = range.getBoundingClientRect();
        return event.clientX >= b.left && event.clientX <= b.right && event.clientY >= b.top && event.clientY <= b.bottom;
      });
      if (!inside) { previousPointer = null; return; }
      const now = performance.now();
      const x = (event.clientX - box.left + padding) / width;
      const y = 1 - (event.clientY - box.top + padding) / height;
      if (!previousPointer) { previousPointer = {x, y, time: now}; return; }
      const dx = (x - previousPointer.x) * width / height;
      const dy = y - previousPointer.y;
      const distance = Math.hypot(dx, dy);
      if (distance < 0.001 || now - previousPointer.time < 14) return;
      trail.push({x, y, dx: dx / distance, dy: dy / distance, born: now,
        force: Math.min(1, distance * 45)});
      if (trail.length > MAX_TRAIL) trail.shift();
      previousPointer = {x, y, time: now};
      if (!frame) {
        render(now); // 원래 제목을 숨기기 전에 같은 위치에 먼저 그립니다.
        title.classList.add('is-warping');
        frame = requestAnimationFrame(tick);
      }
    }

    title.addEventListener('pointerenter', onPointer);
    title.addEventListener('pointermove', onPointer);
    title.addEventListener('pointerleave', () => { previousPointer = null; });
    title.addEventListener('pointercancel', () => { previousPointer = null; });
    window.addEventListener('blur', stop);
    window.addEventListener('resize', resize);
    document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
    reduced.addEventListener('change', stop);
    canvas.addEventListener('webglcontextlost', () => { lost = true; stop(); });
    new ResizeObserver(resize).observe(title);
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (!visible) stop();
    }).observe(title);
    document.fonts.addEventListener('loadingdone', resize);
    resize();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init, { once: true });
  else init();
})();
