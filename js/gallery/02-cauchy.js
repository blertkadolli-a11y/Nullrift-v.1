/* NULLRIFT — 02 CAUCHY LATTICE
 * WebGL2 dual-stage gravitational lens: pointer singularity warps a steel
 * coordinate lattice with frame-drag, horizon fold, Jacobian caustics, and
 * press-to-deepen impulse shell. Brand wordmark is relief in the continuum.
 */

const VS = `#version 300 es
precision highp float;
const vec2 P[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
out vec2 vUv;
void main() {
  vec2 p = P[gl_VertexID];
  gl_Position = vec4(p, 0.0, 1.0);
  vUv = p * 0.5 + 0.5;
}`;

const FS = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform vec2 uRes;
uniform float uTime;
uniform vec2 uPointer;
uniform float uPress;
uniform float uIntro;
uniform float uReduced;
uniform float uImpulse;
uniform sampler2D uWord;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

/* Dual-stage Cauchy lens: radial mass pull + azimuthal frame-dragging + horizon fold */
vec2 lensWarp(vec2 p, vec2 c, float mass, float twist) {
  vec2 d = p - c;
  float r2 = dot(d, d);
  float soft = 0.016 + mass * 0.014;
  float inv = mass / (r2 + soft);
  vec2 pull = d * inv;

  float ang = twist * inv * 0.62;
  float s = sin(ang);
  float co = cos(ang);
  vec2 spun = vec2(d.x * co - d.y * s, d.x * s + d.y * co);

  float r = sqrt(r2 + 1e-6);
  float rs = 0.07 + mass * 0.055;
  float fold = smoothstep(rs * 1.85, rs * 0.32, r);
  vec2 inverted = c + normalize(d + 1e-5) * (rs * rs * 0.52 / r);
  return mix(c + spun - pull * 0.9, inverted, fold * 0.75);
}

float lineAA(float v, float width) {
  float aa = fwidth(v) * 1.15;
  return smoothstep(width + aa, width - aa, abs(v));
}

float gridField(vec2 p, float dens, float thick) {
  vec2 g = abs(fract(p * dens) - 0.5);
  return max(lineAA(g.x, thick), lineAA(g.y, thick));
}

float radialField(vec2 p, vec2 c, float dens, float thick) {
  vec2 d = p - c;
  float r = length(d);
  float a = atan(d.y, d.x);
  float rings = lineAA(fract(r * dens) - 0.5, thick);
  float spokes = lineAA(fract((a / 6.2831853) * 28.0) - 0.5, thick * 1.35);
  return max(rings * 0.9, spokes * 0.4);
}

void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / max(uRes.y, 1.0);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  vec2 ptr = (uPointer - 0.5) * vec2(aspect, 1.0);

  float breathe = uReduced > 0.5 ? 0.0 : sin(uTime * 0.32) * 0.01;
  float mass = mix(0.05, 0.175, uPress) + breathe + uImpulse * 0.08;
  float twist = mix(0.4, 1.75, uPress) + uImpulse * 0.45;

  vec2 anti = -ptr * 0.45;
  vec2 w1 = lensWarp(p, ptr, mass, twist);
  vec2 w2 = lensWarp(w1, anti, mass * 0.4, -twist * 0.58);
  vec2 w = mix(p, w2, uIntro);

  /* Finite-difference Jacobian → caustic ridges where space folds */
  float e = 0.0014;
  vec2 wx = lensWarp(lensWarp(p + vec2(e, 0.0), ptr, mass, twist), anti, mass * 0.4, -twist * 0.58);
  vec2 wy = lensWarp(lensWarp(p + vec2(0.0, e), ptr, mass, twist), anti, mass * 0.4, -twist * 0.58);
  float j = abs((wx.x - w.x) * (wy.y - w.y) - (wx.y - w.y) * (wy.x - w.x)) / (e * e);
  float caustic = clamp(pow(j * 0.014, 1.3), 0.0, 4.0);

  float dist = length(p - ptr);
  float horizon = exp(-dist * dist / (0.01 + mass * 0.09));

  /* Expanding impulse shell */
  float shellR = 0.04 + uImpulse * 0.55;
  float shell = exp(-abs(dist - shellR) * 28.0) * uImpulse;

  float pulse = uReduced > 0.5 ? 0.0 : sin(uTime * 0.65 + w.x * 2.8) * 0.5 + 0.5;
  float dens = mix(13.5, 24.0, uPress);
  float major = gridField(w, dens, 0.017);
  float minor = gridField(w + 0.25, dens * 2.0, 0.0075) * 0.38;
  float diag = gridField(mat2(0.707, -0.707, 0.707, 0.707) * w, dens * 0.72, 0.009) * 0.25;
  float radial = radialField(w, ptr, 17.0, 0.011) * (0.12 + horizon * 0.65);

  float lattice = major + minor + diag + radial;

  float euclid = gridField(p, dens * 0.82, 0.009);
  float moire = abs(lattice - euclid) * (0.28 + uPress * 0.6);

  float pot = log(length(w - ptr) + 0.018) + 0.14 * noise(w * 3.8 + uTime * 0.07);
  float filaments = lineAA(fract(pot * 7.5) - 0.5, 0.032) * (0.18 + horizon * 0.85);

  vec2 tUv = vec2(uv.x, 1.0 - uv.y);
  tUv += (w - p) * 0.028 * uIntro;
  float word = texture(uWord, tUv).r;
  float wordEdge = smoothstep(0.12, 0.72, word);
  float wordCore = smoothstep(0.42, 0.95, word);

  vec3 bg = mix(vec3(0.015, 0.017, 0.02), vec3(0.032, 0.038, 0.048), uv.y);
  vec3 steel = vec3(0.58, 0.66, 0.76);
  vec3 copper = vec3(0.8, 0.6, 0.4);
  vec3 rift = vec3(0.4, 0.78, 0.8);

  vec3 col = bg;
  col += steel * lattice * (0.52 + pulse * 0.1);
  col += copper * moire * 0.38;
  col += rift * filaments * 0.7;
  col += mix(steel, copper, uPress) * caustic * 0.2;
  col += rift * horizon * (0.14 + uPress * 0.38);
  col += copper * shell * 0.85;
  col += steel * shell * lattice * 0.5;

  /* Brand relief: denser continuum inside glyphs */
  col += steel * wordEdge * lattice * 1.2;
  col += copper * wordCore * (0.22 + caustic * 0.12);
  col = mix(col, col * vec3(1.12, 1.06, 0.96) + copper * 0.06, wordEdge * 0.5);

  /* Split refraction: cyan vs copper (no purple R/B pair) */
  float aberr = horizon * (0.4 + uPress * 0.7) * uIntro;
  if (aberr > 0.001 && uReduced < 0.5) {
    vec2 dir = normalize(p - ptr + 1e-5) * aberr * 0.014;
    float cCh = gridField(lensWarp(lensWarp(p + dir, ptr, mass, twist), anti, mass * 0.4, -twist * 0.58), dens, 0.017);
    float wCh = gridField(lensWarp(lensWarp(p - dir, ptr, mass, twist), anti, mass * 0.4, -twist * 0.58), dens, 0.017);
    col += rift * cCh * 0.11;
    col += copper * wCh * 0.1;
  }

  float vig = smoothstep(1.32, 0.22, length((uv - 0.5) * vec2(1.12, 1.0)));
  col *= mix(0.52, 1.0, vig);
  col *= smoothstep(0.0, 1.0, uIntro);

  float g = (hash(gl_FragCoord.xy + fract(uTime) * 19.0) - 0.5) * 0.03;
  col += g;
  col = pow(max(col, 0.0), vec3(0.9));
  fragColor = vec4(col, 1.0);
}`;

function compile(gl, type, src) {
  const s = gl.createShader(type);
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s) || 'shader compile failed';
    gl.deleteShader(s);
    throw new Error(log);
  }
  return s;
}

const SUBTITLE = 'Cauchy Lattice · press to deepen the fold';

function paintFallback(root, w, h) {
  const cv = document.createElement('canvas');
  cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
  root.appendChild(cv);
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.max(1, Math.round(w * dpr));
  cv.height = Math.max(1, Math.round(h * dpr));
  const c = cv.getContext('2d');
  if (!c) return cv;
  c.setTransform(dpr, 0, 0, dpr, 0, 0);
  c.fillStyle = '#040506';
  c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(157,176,196,0.35)';
  c.lineWidth = 1;
  const step = Math.max(14, Math.min(w, h) / 22);
  c.beginPath();
  for (let x = 0; x <= w; x += step) {
    c.moveTo(x, 0);
    c.lineTo(x, h);
  }
  for (let y = 0; y <= h; y += step) {
    c.moveTo(0, y);
    c.lineTo(w, y);
  }
  c.stroke();
  const titlePx = Math.min(w * 0.12, h * 0.18);
  c.fillStyle = 'rgba(232,235,239,0.88)';
  c.font = '700 ' + titlePx + 'px "Space Grotesk", "Syne", sans-serif';
  c.textAlign = 'center';
  c.textBaseline = 'middle';
  c.fillText('NULLRIFT', w * 0.5, h * 0.48);
  c.fillStyle = 'rgba(232,235,239,0.4)';
  c.font = '300 ' + Math.max(10, Math.min(w * 0.022, h * 0.032, 17)) + 'px Inter, "Helvetica Neue", sans-serif';
  c.letterSpacing = '0.2em';
  c.fillText(SUBTITLE.toUpperCase(), w * 0.5, h * 0.48 + titlePx * 0.72);
  return cv;
}

/** DOM brand stack (title + subtitle) — matches original overlay under the lattice wordmark. */
function mountBrand(root) {
  const wrap = document.createElement('div');
  wrap.setAttribute('data-cauchy-brand', '');
  wrap.setAttribute('aria-hidden', 'true');
  wrap.style.cssText =
    'position:absolute;inset:0;z-index:2;display:grid;place-items:center;' +
    'pointer-events:none;padding:clamp(0.75rem,3%,1.75rem);';

  const inner = document.createElement('div');
  inner.style.cssText =
    'text-align:center;max-width:min(92%,54rem);transform:translate3d(-1.25%,0,0);' +
    'opacity:0;will-change:opacity,transform,filter;';

  /* Invisible spacer matches shader wordmark metrics so the subtitle sits under it. */
  const mark = document.createElement('div');
  mark.textContent = 'NULLRIFT';
  mark.style.cssText =
    'font-family:Syne,"Space Grotesk",sans-serif;font-weight:800;letter-spacing:-0.048em;' +
    'line-height:0.86;color:transparent;user-select:none;';

  const sub = document.createElement('p');
  sub.textContent = SUBTITLE;
  sub.style.cssText =
    'margin:0;font-family:Inter,"Helvetica Neue",sans-serif;font-weight:300;' +
    'letter-spacing:0.2em;text-transform:uppercase;color:rgba(232,235,239,0.4);' +
    'line-height:1.35;';

  inner.appendChild(mark);
  inner.appendChild(sub);
  wrap.appendChild(inner);
  root.appendChild(wrap);

  return {
    wrap: wrap,
    inner: inner,
    mark: mark,
    sub: sub,
    layout(w, h) {
      const titlePx = Math.min(w * 0.135, h * 0.2);
      const subPx = Math.max(10, Math.min(w * 0.022, h * 0.034, 17.28));
      const gap = Math.max(10, Math.min(w * 0.018, h * 0.03, 22.4));
      mark.style.fontSize = titlePx + 'px';
      sub.style.fontSize = subPx + 'px';
      sub.style.marginTop = gap + 'px';
    },
    setIntro(t) {
      const k = Math.max(0, Math.min(1, t));
      const ease = k * k * (3 - 2 * k);
      inner.style.opacity = String(ease);
      inner.style.filter = ease >= 0.99 ? 'none' : 'blur(' + ((1 - ease) * 12).toFixed(2) + 'px)';
      inner.style.transform =
        'translate3d(-1.25%, ' + ((1 - ease) * 14).toFixed(2) + 'px, 0)';
    },
    destroy() {
      if (wrap.parentNode) wrap.parentNode.removeChild(wrap);
    }
  };
}

export default function create(ctx) {
  const root = ctx.root;
  const reduced = !!ctx.reduced;
  let preview = !!ctx.preview;

  const canvas = document.createElement('canvas');
  canvas.style.cssText =
    'position:absolute;left:0;top:0;width:100%;height:100%;display:block;touch-action:none;';
  canvas.style.cursor = reduced ? 'default' : 'crosshair';
  canvas.setAttribute('aria-hidden', 'true');
  root.appendChild(canvas);

  const brand = mountBrand(root);
  if (reduced) brand.setIntro(1);

  const gl = canvas.getContext('webgl2', {
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    powerPreference: 'high-performance',
    preserveDrawingBuffer: false
  });

  if (!gl) {
    let fallback = null;
    brand.destroy();
    return {
      resize(w, h) {
        const cw = Math.max(1, Math.round(w || root.clientWidth || 1));
        const ch = Math.max(1, Math.round(h || root.clientHeight || 1));
        if (fallback && fallback.parentNode) fallback.parentNode.removeChild(fallback);
        canvas.style.display = 'none';
        fallback = paintFallback(root, cw, ch);
      },
      update() {},
      activate() {},
      deactivate() {},
      destroy() {
        if (fallback && fallback.parentNode) fallback.parentNode.removeChild(fallback);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    };
  }

  let prog = null;
  let uRes, uTime, uPointer, uPress, uIntro, uReduced, uImpulse, uWord;
  let wordTex = null;
  let wordCanvas = null;
  let wordCtx = null;
  let dead = false;

  try {
    prog = gl.createProgram();
    const vs = compile(gl, gl.VERTEX_SHADER, VS);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FS);
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(prog) || 'link failed');
    }
    gl.useProgram(prog);

    uRes = gl.getUniformLocation(prog, 'uRes');
    uTime = gl.getUniformLocation(prog, 'uTime');
    uPointer = gl.getUniformLocation(prog, 'uPointer');
    uPress = gl.getUniformLocation(prog, 'uPress');
    uIntro = gl.getUniformLocation(prog, 'uIntro');
    uReduced = gl.getUniformLocation(prog, 'uReduced');
    uImpulse = gl.getUniformLocation(prog, 'uImpulse');
    uWord = gl.getUniformLocation(prog, 'uWord');

    wordCanvas = document.createElement('canvas');
    wordCtx = wordCanvas.getContext('2d');
    wordTex = gl.createTexture();
  } catch (err) {
    dead = true;
    brand.destroy();
    let fallback = null;
    return {
      resize(w, h) {
        const cw = Math.max(1, Math.round(w || root.clientWidth || 1));
        const ch = Math.max(1, Math.round(h || root.clientHeight || 1));
        if (fallback && fallback.parentNode) fallback.parentNode.removeChild(fallback);
        canvas.style.display = 'none';
        fallback = paintFallback(root, cw, ch);
      },
      update() {},
      activate() {},
      deactivate() {},
      destroy() {
        if (fallback && fallback.parentNode) fallback.parentNode.removeChild(fallback);
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
      }
    };
  }

  let W = 0;
  let H = 0;
  let dpr = 1;
  let active = false;
  let destroyed = false;
  let time = 0;
  let intro = reduced ? 1 : 0;
  let introElapsed = 0;
  let impulse = 0;
  let fontsHooked = false;

  const pointer = {
    x: 0.55,
    y: 0.5,
    tx: 0.62,
    ty: 0.52,
    down: reduced ? 0.4 : 0,
    tDown: 0
  };

  /* Without a pointer the lens would park wherever it was last left, which
     reads as a frozen still. The singularity instead wanders a slow Lissajous
     and breathes its own mass, so the exhibit is alive at rest — and hands
     control straight back the moment a real pointer arrives. */
  let hovering = false;
  let idleT = Math.random() * 20;

  function driftIdle(dt) {
    idleT += dt;
    const t = idleT;
    pointer.tx = 0.5 + Math.sin(t * 0.19) * 0.26 + Math.sin(t * 0.071) * 0.08;
    pointer.ty = 0.5 + Math.cos(t * 0.147) * 0.2 + Math.sin(t * 0.053) * 0.06;
    /* A long, shallow swell in and out of the press state. */
    pointer.tDown = 0.16 + (Math.sin(t * 0.11) * 0.5 + 0.5) * 0.3;
  }

  function paintWord(w, h) {
    if (!wordCtx || destroyed) return;
    const tdpr = Math.min(window.devicePixelRatio || 1, 2);
    wordCanvas.width = Math.max(2, Math.floor(w * tdpr));
    wordCanvas.height = Math.max(2, Math.floor(h * tdpr));
    wordCtx.setTransform(1, 0, 0, 1, 0, 0);
    wordCtx.fillStyle = '#000';
    wordCtx.fillRect(0, 0, wordCanvas.width, wordCanvas.height);

    let fontSize = Math.min(wordCanvas.width * 0.135, wordCanvas.height * 0.2);
    wordCtx.font = '800 ' + fontSize + 'px Syne, "Space Grotesk", sans-serif';
    wordCtx.textAlign = 'center';
    wordCtx.textBaseline = 'middle';
    wordCtx.fillStyle = '#fff';
    const cx = wordCanvas.width * 0.485;
    const cy = wordCanvas.height * 0.48;
    const blurPx = Math.max(2, fontSize * 0.045);
    const maxTextW = wordCanvas.width * 0.9 - blurPx * 4;
    const measured = wordCtx.measureText('NULLRIFT').width;
    if (measured > maxTextW && measured > 0) {
      fontSize *= maxTextW / measured;
      wordCtx.font = '800 ' + fontSize + 'px Syne, "Space Grotesk", sans-serif';
    }
    wordCtx.fillText('NULLRIFT', cx, cy);
    wordCtx.filter = 'blur(' + Math.max(2, fontSize * 0.045) + 'px)';
    wordCtx.globalAlpha = 0.5;
    wordCtx.fillText('NULLRIFT', cx, cy);
    wordCtx.filter = 'none';
    wordCtx.globalAlpha = 1;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, wordTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, wordCanvas);
    gl.uniform1i(uWord, 0);
  }

  function drawFrame() {
    if (destroyed || dead) return;
    gl.useProgram(prog);
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, time);
    gl.uniform2f(uPointer, pointer.x, pointer.y);
    gl.uniform1f(uPress, pointer.down);
    gl.uniform1f(uIntro, intro);
    gl.uniform1f(uReduced, reduced ? 1 : 0);
    gl.uniform1f(uImpulse, impulse);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, wordTex);
    gl.uniform1i(uWord, 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function localNorm(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) / Math.max(r.width, 1);
    const y = 1.0 - (e.clientY - r.top) / Math.max(r.height, 1);
    return [
      Math.max(0, Math.min(1, x)),
      Math.max(0, Math.min(1, y))
    ];
  }

  function onMove(e) {
    if (!active || reduced || destroyed) return;
    hovering = true;
    const p = localNorm(e);
    pointer.tx = p[0];
    pointer.ty = p[1];
  }

  function onEnter() {
    if (!active || reduced || destroyed) return;
    hovering = true;
  }

  /* Resume the drift from where the pointer left the lens, so handing back to
     the idle loop is continuous rather than a jump. */
  function onLeave(e) {
    if (e && e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    hovering = false;
    pointer.tDown = 0;
  }

  function onDown(e) {
    if (!active || reduced || destroyed) return;
    e.preventDefault();
    pointer.tDown = 1;
    impulse = 1;
    const p = localNorm(e);
    pointer.tx = p[0];
    pointer.ty = p[1];
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (_) { /* optional */ }
  }

  function onUp() {
    pointer.tDown = 0;
  }

  if (!reduced) {
    canvas.addEventListener('pointerenter', onEnter, { passive: true });
    canvas.addEventListener('pointermove', onMove, { passive: true });
    canvas.addEventListener('pointerdown', onDown, { passive: false });
    canvas.addEventListener('pointerup', onUp, { passive: true });
    canvas.addEventListener('pointercancel', onUp, { passive: true });
    canvas.addEventListener('pointerleave', onLeave, { passive: true });
  }

  function resize(w, h) {
    if (destroyed) return;
    const cw = Math.max(1, Math.round(w || root.clientWidth || 1));
    const ch = Math.max(1, Math.round(h || root.clientHeight || 1));
    /* Full device scale in a card too — at 419x314 that is a fifth of the
       fragments a full page costs, so the shader stays cheap while the lens
       stays sharp. Halving it here was visible as a soft, aliased preview. */
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pw = Math.max(1, Math.round(cw * dpr));
    const ph = Math.max(1, Math.round(ch * dpr));
    if (cw === W && ch === H && canvas.width === pw && canvas.height === ph) return;
    W = cw;
    H = ch;
    canvas.width = pw;
    canvas.height = ph;
    gl.viewport(0, 0, pw, ph);
    paintWord(W, H);
    brand.layout(W, H);
    brand.setIntro(intro);

    if (!fontsHooked && document.fonts && document.fonts.ready) {
      fontsHooked = true;
      document.fonts.ready.then(function () {
        if (!destroyed && W > 0) {
          paintWord(W, H);
          brand.layout(W, H);
        }
      });
    }

    if (reduced) {
      pointer.x = 0.55;
      pointer.y = 0.5;
      pointer.down = 0.4;
      impulse = 0;
      intro = 1;
      brand.setIntro(1);
    }
    drawFrame();
  }

  function update(dt) {
    if (destroyed || reduced || !active) return;
    if (!(dt > 0)) dt = 1 / 60;
    dt = Math.min(0.05, dt);
    time += dt;
    introElapsed += dt;

    if (!hovering) driftIdle(dt);

    const damp = 1 - Math.exp(-dt * 11);
    const pressDamp = 1 - Math.exp(-dt * 7.5);
    pointer.x += (pointer.tx - pointer.x) * damp;
    pointer.y += (pointer.ty - pointer.y) * damp;
    pointer.down += (pointer.tDown - pointer.down) * pressDamp;
    impulse = Math.max(0, impulse - dt * 1.35);

    let t = Math.min(1, introElapsed / 1.55);
    intro = t * t * (3 - 2 * t);
    brand.setIntro(intro);

    drawFrame();
  }

  function activate() {
    if (destroyed) return;
    active = true;
  }

  function deactivate() {
    active = false;
    hovering = false;
    pointer.tDown = 0;
  }

  /* resize() re-derives dpr, and the orchestrator forces one right after. */
  function setPreview(next) {
    preview = !!next;
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    active = false;
    if (!reduced) {
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
    }
    brand.destroy();
    if (wordTex) gl.deleteTexture(wordTex);
    if (prog) gl.deleteProgram(prog);
    canvas.width = 0;
    canvas.height = 0;
    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }

  return {
    setPreview: setPreview,
    resize: resize,
    update: update,
    activate: activate,
    deactivate: deactivate,
    destroy: destroy
  };
}
