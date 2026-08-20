import * as THREE from 'three';

const VERT = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

/* Signed fields (velocity, pressure, divergence, curl) are stored raw in half-float
   targets. When only UNSIGNED_BYTE targets are renderable they are remapped into
   [0,1] around 0.5, which also gives free clamping at the encoding range. */
const CODEC = `
#ifdef BYTE_MODE
const float SR = 256.0;
vec2 dec2(vec4 t) { return (t.xy - 0.5) * (2.0 * SR); }
vec4 enc2(vec2 v) { return vec4(v / (2.0 * SR) + 0.5, 0.0, 1.0); }
float dec1(vec4 t) { return (t.x - 0.5) * (2.0 * SR); }
vec4 enc1(float v) { return vec4(v / (2.0 * SR) + 0.5, 0.0, 0.0, 1.0); }
#else
vec2 dec2(vec4 t) { return t.xy; }
vec4 enc2(vec2 v) { return vec4(v, 0.0, 1.0); }
float dec1(vec4 t) { return t.x; }
vec4 enc1(float v) { return vec4(v, 0.0, 0.0, 1.0); }
#endif
`;

const NOISE = `
float hash21(vec2 p) {
  p = fract(p * vec2(127.3317, 311.7231));
  p += dot(p, p + 34.7137);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}
float fbm(vec2 p) {
  float s = 0.0;
  float a = 0.5;
  for (int i = 0; i < 5; i++) {
    s += a * vnoise(p);
    p = p * 2.037 + vec2(17.13, 9.71);
    a *= 0.5;
  }
  return s;
}
`;

const SEG_DIST = `
float segDist(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-7), 0.0, 1.0);
  return length(pa - ba * h);
}
`;

const SAMPLE_VEL = `
vec2 sampleVel(sampler2D tex, vec2 uv) {
  vec2 m = vec2(1.0);
  if (uv.x < 0.0) { uv.x = 0.0; m.x = -1.0; }
  else if (uv.x > 1.0) { uv.x = 1.0; m.x = -1.0; }
  if (uv.y < 0.0) { uv.y = 0.0; m.y = -1.0; }
  else if (uv.y > 1.0) { uv.y = 1.0; m.y = -1.0; }
  return m * dec2(texture2D(tex, uv));
}
`;

const FRAG_SPLAT_VELOCITY = CODEC + SEG_DIST + `
uniform sampler2D uTarget;
uniform vec2 uA;
uniform vec2 uB;
uniform vec2 uForce;
uniform float uRadius;
uniform float uAspect;
varying vec2 vUv;
void main() {
  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  float d = segDist(p, vec2(uA.x * uAspect, uA.y), vec2(uB.x * uAspect, uB.y));
  float f = exp(-(d * d) / max(uRadius, 1e-7));
  vec2 v = dec2(texture2D(uTarget, vUv)) + uForce * f;
  float m = length(v);
  if (m > 235.0) v *= 235.0 / m;
  gl_FragColor = enc2(v);
}
`;

const FRAG_SPLAT_DYE = SEG_DIST + `
uniform sampler2D uTarget;
uniform vec2 uA;
uniform vec2 uB;
uniform float uRadius;
uniform float uAspect;
uniform float uAmount;
uniform float uPhase;
varying vec2 vUv;
void main() {
  vec2 p = vec2(vUv.x * uAspect, vUv.y);
  float d = segDist(p, vec2(uA.x * uAspect, uA.y), vec2(uB.x * uAspect, uB.y));
  float f = exp(-(d * d) / max(uRadius, 1e-7));
  vec4 base = texture2D(uTarget, vUv);
  float dens = min(1.0, base.r + f * uAmount);
  float heat = min(1.0, base.g + f * uAmount * 1.45);
  float phase = mix(base.b, uPhase, clamp(f * 1.25, 0.0, 1.0));
  gl_FragColor = vec4(dens, heat, phase, 1.0);
}
`;

const FRAG_ADVECT_VELOCITY = CODEC + `
uniform sampler2D uVelocity;
uniform vec2 uTexel;
uniform float uDt;
uniform float uDecay;
varying vec2 vUv;
void main() {
  vec2 vel = dec2(texture2D(uVelocity, vUv));
  vec2 coord = clamp(vUv - uDt * vel * uTexel, vec2(0.0), vec2(1.0));
  gl_FragColor = enc2(dec2(texture2D(uVelocity, coord)) * uDecay);
}
`;

const FRAG_ADVECT_DYE = CODEC + `
uniform sampler2D uVelocity;
uniform sampler2D uSource;
uniform vec2 uTexel;
uniform float uDt;
uniform vec3 uDecay;
varying vec2 vUv;
void main() {
  vec2 vel = dec2(texture2D(uVelocity, vUv));
  vec2 coord = clamp(vUv - uDt * vel * uTexel, vec2(0.0), vec2(1.0));
  vec3 s = texture2D(uSource, coord).rgb * uDecay;
  gl_FragColor = vec4(s, 1.0);
}
`;

const FRAG_DIVERGENCE = CODEC + SAMPLE_VEL + `
uniform sampler2D uVelocity;
uniform vec2 uTexel;
varying vec2 vUv;
void main() {
  float L = sampleVel(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
  float R = sampleVel(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
  float B = sampleVel(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
  float T = sampleVel(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
  gl_FragColor = enc1(0.5 * (R - L + T - B));
}
`;

const FRAG_CURL = CODEC + SAMPLE_VEL + `
uniform sampler2D uVelocity;
uniform vec2 uTexel;
varying vec2 vUv;
void main() {
  float L = sampleVel(uVelocity, vUv - vec2(uTexel.x, 0.0)).y;
  float R = sampleVel(uVelocity, vUv + vec2(uTexel.x, 0.0)).y;
  float B = sampleVel(uVelocity, vUv - vec2(0.0, uTexel.y)).x;
  float T = sampleVel(uVelocity, vUv + vec2(0.0, uTexel.y)).x;
  gl_FragColor = enc1(0.5 * ((R - L) - (T - B)));
}
`;

const FRAG_VORTICITY = CODEC + `
uniform sampler2D uVelocity;
uniform sampler2D uCurl;
uniform vec2 uTexel;
uniform float uAmount;
uniform float uDt;
varying vec2 vUv;
float curlAt(vec2 uv) {
  return dec1(texture2D(uCurl, clamp(uv, vec2(0.0), vec2(1.0))));
}
void main() {
  float L = curlAt(vUv - vec2(uTexel.x, 0.0));
  float R = curlAt(vUv + vec2(uTexel.x, 0.0));
  float B = curlAt(vUv - vec2(0.0, uTexel.y));
  float T = curlAt(vUv + vec2(0.0, uTexel.y));
  float C = curlAt(vUv);
  vec2 g = 0.5 * vec2(abs(R) - abs(L), abs(T) - abs(B));
  vec2 N = g / (length(g) + 1e-4);
  vec2 force = uAmount * C * vec2(N.y, -N.x);
  vec2 v = dec2(texture2D(uVelocity, vUv)) + force * uDt;
  float m = length(v);
  if (m > 235.0) v *= 235.0 / m;
  gl_FragColor = enc2(v);
}
`;

const FRAG_PRESSURE = CODEC + `
uniform sampler2D uPressure;
uniform sampler2D uDivergence;
uniform vec2 uTexel;
varying vec2 vUv;
float pAt(vec2 uv) {
  return dec1(texture2D(uPressure, clamp(uv, vec2(0.0), vec2(1.0))));
}
void main() {
  float L = pAt(vUv - vec2(uTexel.x, 0.0));
  float R = pAt(vUv + vec2(uTexel.x, 0.0));
  float B = pAt(vUv - vec2(0.0, uTexel.y));
  float T = pAt(vUv + vec2(0.0, uTexel.y));
  float div = dec1(texture2D(uDivergence, vUv));
  gl_FragColor = enc1((L + R + B + T - div) * 0.25);
}
`;

const FRAG_GRADIENT = CODEC + `
uniform sampler2D uPressure;
uniform sampler2D uVelocity;
uniform vec2 uTexel;
varying vec2 vUv;
float pAt(vec2 uv) {
  return dec1(texture2D(uPressure, clamp(uv, vec2(0.0), vec2(1.0))));
}
void main() {
  float L = pAt(vUv - vec2(uTexel.x, 0.0));
  float R = pAt(vUv + vec2(uTexel.x, 0.0));
  float B = pAt(vUv - vec2(0.0, uTexel.y));
  float T = pAt(vUv + vec2(0.0, uTexel.y));
  vec2 v = dec2(texture2D(uVelocity, vUv)) - 0.5 * vec2(R - L, T - B);
  gl_FragColor = enc2(v);
}
`;

const FRAG_DECAY = CODEC + `
uniform sampler2D uTexture;
uniform float uValue;
varying vec2 vUv;
void main() {
  gl_FragColor = enc1(dec1(texture2D(uTexture, vUv)) * uValue);
}
`;

const FRAG_ZERO = CODEC + `
void main() {
  gl_FragColor = enc2(vec2(0.0));
}
`;

/* Divergence-free seed: velocity is the curl of an fbm stream function, so the
   pressure solver has almost nothing to correct and the field reads as already
   in motion on the very first frame. */
const FRAG_SEED_VELOCITY = CODEC + NOISE + `
uniform float uSeed;
uniform float uAspect;
uniform float uAmp;
varying vec2 vUv;
float pot(vec2 q) {
  float a = fbm(q * 2.55 + vec2(uSeed, uSeed * 0.61));
  float b = fbm(q * 5.90 - vec2(uSeed * 0.37, uSeed)) * 0.34;
  float swirl = sin(q.x * 2.1 + uSeed) * cos(q.y * 2.7 - uSeed * 0.5) * 0.22;
  return a + b + swirl;
}
void main() {
  vec2 q = vec2(vUv.x * uAspect, vUv.y);
  float e = 0.0045;
  float px1 = pot(q + vec2(e, 0.0));
  float px0 = pot(q - vec2(e, 0.0));
  float py1 = pot(q + vec2(0.0, e));
  float py0 = pot(q - vec2(0.0, e));
  vec2 v = vec2(py1 - py0, -(px1 - px0)) / (2.0 * e);
  float wall = smoothstep(0.0, 0.17, vUv.x) * smoothstep(1.0, 0.83, vUv.x)
             * smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
  gl_FragColor = enc2(v * uAmp * wall);
}
`;

const FRAG_SEED_DYE = NOISE + `
uniform float uSeed;
uniform float uAspect;
uniform float uGain;
varying vec2 vUv;
void main() {
  vec2 q = vec2(vUv.x * uAspect, vUv.y);
  float n = fbm(q * 2.9 + uSeed);
  float fine = fbm(q * 7.4 - uSeed * 0.3);
  float axis = (vUv.y - 0.54) - (vUv.x - 0.5) * 0.30 + (n - 0.5) * 0.62;
  float band = smoothstep(0.42, 0.0, abs(axis));
  float filaments = smoothstep(0.55, 0.95, fine) * smoothstep(0.62, 0.05, abs(axis));
  float vign = smoothstep(0.0, 0.22, vUv.x) * smoothstep(1.0, 0.78, vUv.x)
             * smoothstep(0.0, 0.18, vUv.y) * smoothstep(1.0, 0.82, vUv.y);
  float dens = clamp((band * 0.82 + filaments * 0.55) * vign, 0.0, 1.0) * uGain;
  float heat = dens * (0.35 + 0.4 * fine);
  float phase = fract(n * 1.4 + fine * 0.6);
  gl_FragColor = vec4(dens, heat, phase, 1.0);
}
`;

const FRAG_DISPLAY = CODEC + `
uniform sampler2D uDye;
uniform sampler2D uVelocity;
uniform sampler2D uSubstrate;
uniform vec2 uDyeTexel;
uniform vec2 uSubTexel;
uniform vec2 uVelTexel;
uniform vec2 uPixel;
uniform float uAspect;
uniform float uTime;
uniform float uDistort;
uniform float uRelief;
uniform float uMicro;
varying vec2 vUv;

float hash21(vec2 p) {
  p = fract(p * vec2(127.3317, 311.7231));
  p += dot(p, p + 34.7137);
  return fract(p.x * p.y);
}
float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

/* Machine ruling crossed with anisotropic brushed grain: the substrate keeps
   catching specular even where no type is present. */
float ruling(vec2 uv) {
  float r = sin(uv.y * 940.0) * 0.5 + 0.5;
  r *= r;
  float brush = vnoise(vec2(uv.x * 22.0, uv.y * 320.0));
  return r * 0.42 + brush * 0.58;
}

float heightAt(vec2 uvDye, vec2 uvSub) {
  vec4 d = texture2D(uDye, uvDye);
  vec4 s = texture2D(uSubstrate, clamp(uvSub, vec2(0.0), vec2(1.0)));
  return d.r * 0.92 + d.g * 0.46 + s.g * 0.52 + s.r * 0.24;
}

float studio(vec3 r) {
  float y = r.y;
  float x = r.x;
  float key  = smoothstep(0.30, 0.015, abs(y - 0.30));
  float fill = smoothstep(0.22, 0.03, abs(y + 0.34)) * 0.42;
  float top  = smoothstep(0.88, 0.14, abs(y - 0.98)) * 0.28;
  float side = smoothstep(0.32, 0.04, abs(x + 0.46)) * 0.20;
  float grad = 0.095 + 0.34 * smoothstep(-0.75, 0.85, y);
  return key * 0.92 + fill + top + side + grad;
}

vec3 spectral(float t) {
  t = fract(t);
  vec3 c1 = vec3(0.86, 0.21, 0.61);
  vec3 c2 = vec3(0.41, 0.28, 0.87);
  vec3 c3 = vec3(0.17, 0.78, 0.75);
  vec3 c4 = vec3(0.93, 0.75, 0.33);
  float s = t * 4.0;
  if (s < 1.0) return mix(c1, c2, smoothstep(0.0, 1.0, s));
  if (s < 2.0) return mix(c2, c3, smoothstep(0.0, 1.0, s - 1.0));
  if (s < 3.0) return mix(c3, c4, smoothstep(0.0, 1.0, s - 2.0));
  return mix(c4, c1, smoothstep(0.0, 1.0, s - 3.0));
}

void main() {
  vec2 vel = dec2(texture2D(uVelocity, vUv));
  vec2 velUv = vel * uVelTexel;
  float speed = length(velUv);

  vec2 flow = velUv * uDistort;
  vec2 uvSub = clamp(vUv - flow, vec2(0.0), vec2(1.0));

  vec4 dC = texture2D(uDye, vUv);
  vec4 sC = texture2D(uSubstrate, uvSub);
  float polish = clamp(dC.r, 0.0, 1.0);
  float heat = clamp(dC.g, 0.0, 1.0);
  float phase = dC.b;

  vec2 ex = vec2(max(uDyeTexel.x, uSubTexel.x) * 1.25, 0.0);
  vec2 ey = vec2(0.0, max(uDyeTexel.y, uSubTexel.y) * 1.25);
  float hL = heightAt(vUv - ex, uvSub - ex);
  float hR = heightAt(vUv + ex, uvSub + ex);
  float hB = heightAt(vUv - ey, uvSub - ey);
  float hT = heightAt(vUv + ey, uvSub + ey);
  vec2 grad = 0.5 * vec2(hR - hL, hT - hB);

  float p0 = ruling(uvSub);
  float pX = ruling(uvSub + vec2(uPixel.x, 0.0));
  float pY = ruling(uvSub + vec2(0.0, uPixel.y));
  vec2 micro = vec2(pX - p0, pY - p0);

  vec2 g = grad * uRelief + micro * uMicro;
  vec3 N = normalize(vec3(-g.x, -g.y, 1.0));
  vec3 V = vec3(0.0, 0.0, 1.0);

  float wob = sin(uTime * 0.13) * 0.06;
  vec3 L1 = normalize(vec3(-0.54 + wob, 0.71, 0.44));
  vec3 L2 = normalize(vec3(0.66, -0.36 + wob * 0.5, 0.56));

  vec3 R = reflect(-V, N);
  vec2 cc = (vUv - 0.5) * vec2(uAspect, 1.0);
  float disp = dot(cc, cc) * 0.10;
  vec3 env3 = vec3(
    studio(R + vec3(cc * disp, 0.0)),
    studio(R),
    studio(R - vec3(cc * disp, 0.0))
  );

  vec3 H1 = normalize(L1 + V);
  vec3 H2 = normalize(L2 + V);
  float sp1 = pow(max(dot(N, H1), 0.0), 250.0) * 1.30;
  float sp2 = pow(max(dot(N, H2), 0.0), 32.0) * 0.30;
  float diff = max(dot(N, L1), 0.0);

  float polishMask = smoothstep(0.015, 0.42, polish);
  float wet = smoothstep(0.03, 0.55, heat);

  vec3 metalTint = vec3(0.795, 0.812, 0.852);
  vec3 metal = metalTint * env3 * (0.40 + 0.78 * polishMask)
             + vec3(0.98, 0.985, 1.0) * sp1 * (0.42 + 0.92 * polishMask)
             + vec3(0.86, 0.90, 1.0) * sp2 * (0.30 + 0.85 * polishMask)
             + metalTint * diff * 0.10;
  metal *= 0.72 + 0.46 * wet;

  vec3 dark = vec3(0.0085, 0.0092, 0.0118)
            + vec3(0.030, 0.031, 0.037) * sC.r * 0.62
            + vec3(0.011, 0.0115, 0.0135) * p0 * 0.42
            + vec3(0.014, 0.0145, 0.017) * sC.g * 0.30;

  vec3 col = mix(dark, metal, polishMask);

  float shear = length(grad) * 26.0;
  float fres = pow(1.0 - max(N.z, 0.0), 2.1);
  float speedN = clamp(speed * 3.2, 0.0, 1.0);
  float irid = smoothstep(0.18, 0.85, shear) * (0.30 + 0.70 * speedN) * polishMask;
  vec3 sp = spectral(phase * 0.85 + shear * 0.20 + fres * 0.55 + speedN * 0.28);
  sp = mix(vec3(dot(sp, vec3(0.299, 0.587, 0.114))), sp, 0.70);
  col += sp * irid * 0.36;
  col += sp * fres * polishMask * 0.045;

  float vig = smoothstep(1.18, 0.26, length(cc) / max(0.5 * sqrt(uAspect * uAspect + 1.0), 1e-3));
  col *= mix(0.58, 1.0, vig);

  col = col / (1.0 + col * 0.52);

  float grain = hash21(vUv / uPixel + vec2(fract(uTime * 11.0) * 41.7, fract(uTime * 7.3) * 93.1));
  col += (grain - 0.5) * 0.017;
  col += vec3(0.0035, 0.0038, 0.0048);

  gl_FragColor = vec4(max(col, vec3(0.0)), 1.0);
}
`;

function clamp(v, a, b) {
  return v < a ? a : (v > b ? b : v);
}

function measureTracked(g, text, tracking) {
  let total = 0;
  for (let i = 0; i < text.length; i++) {
    total += g.measureText(text.charAt(i)).width;
    if (i < text.length - 1) total += tracking;
  }
  return total;
}

function drawTracked(g, text, cx, y, tracking) {
  const total = measureTracked(g, text, tracking);
  let x = cx - total * 0.5;
  for (let i = 0; i < text.length; i++) {
    const ch = text.charAt(i);
    g.fillText(ch, x, y);
    x += g.measureText(ch).width + tracking;
  }
}

/* R = crisp identity coverage, G = soft-shadow relief used for the normal field. */
function buildSubstrateCanvas(cw, ch) {
  let canvas;
  let g;
  try {
    canvas = document.createElement('canvas');
    canvas.width = cw;
    canvas.height = ch;
    g = canvas.getContext('2d', { alpha: false });
  } catch (e) {
    return null;
  }
  if (!g) return null;

  g.fillStyle = '#000000';
  g.fillRect(0, 0, cw, ch);
  g.globalCompositeOperation = 'lighter';
  g.textAlign = 'left';
  g.textBaseline = 'alphabetic';
  g.lineCap = 'butt';

  const narrow = cw < ch * 1.15;
  const word = 'NULLRIFT';
  const trackEm = narrow ? 0.13 : 0.19;
  const targetW = cw * (narrow ? 0.84 : 0.64);
  const stack = '"Space Grotesk", "Roboto Flex", "Inter", system-ui, sans-serif';

  g.font = '900 100px ' + stack;
  const baseW = measureTracked(g, word, 100 * trackEm);
  let fs = 100 * (targetW / Math.max(baseW, 1));
  fs = Math.min(fs, ch * 0.19);
  const track = fs * trackEm;
  const wordY = ch * (narrow ? 0.615 : 0.632);

  const markR = Math.min(cw, ch) * (narrow ? 0.125 : 0.112);
  const markX = cw * 0.5;
  const markY = ch * (narrow ? 0.335 : 0.315);

  const capFs = Math.max(8, Math.min(cw, ch) * (narrow ? 0.026 : 0.021));
  const capTrack = capFs * 0.42;
  const capY = wordY + fs * 0.86;

  const ruleTop = ch * 0.115;
  const ruleBottom = ch * 0.885;
  const ruleX0 = cw * 0.075;
  const ruleX1 = cw * 0.925;

  function paintIdentity(color, markAlphaColor) {
    g.strokeStyle = markAlphaColor;
    g.fillStyle = markAlphaColor;
    g.lineWidth = Math.max(1, markR * 0.145);
    g.beginPath();
    g.arc(markX, markY, markR, 0, Math.PI * 2);
    g.stroke();
    g.beginPath();
    g.moveTo(markX - markR * 0.88, markY + markR * 0.88);
    g.lineTo(markX + markR * 0.88, markY - markR * 0.88);
    g.stroke();

    g.fillStyle = color;
    g.font = '900 ' + fs.toFixed(2) + 'px ' + stack;
    drawTracked(g, word, cw * 0.5, wordY, track);
  }

  function paintRules(color, tickColor) {
    g.strokeStyle = color;
    g.lineWidth = Math.max(1, Math.min(cw, ch) * 0.0016);
    g.beginPath();
    g.moveTo(ruleX0, ruleTop);
    g.lineTo(ruleX1, ruleTop);
    g.moveTo(ruleX0, ruleBottom);
    g.lineTo(ruleX1, ruleBottom);
    g.stroke();

    g.strokeStyle = tickColor;
    g.beginPath();
    const ticks = narrow ? 12 : 24;
    for (let i = 0; i <= ticks; i++) {
      const t = i / ticks;
      const x = ruleX0 + (ruleX1 - ruleX0) * t;
      const len = (i % 4 === 0 ? 0.020 : 0.010) * ch;
      g.moveTo(x, ruleTop);
      g.lineTo(x, ruleTop + len);
      g.moveTo(x, ruleBottom);
      g.lineTo(x, ruleBottom - len);
    }
    g.stroke();

    g.fillStyle = tickColor;
    g.font = '500 ' + capFs.toFixed(2) + 'px "JetBrains Mono", "Inter", monospace';
    drawTracked(g, 'STABLE FLUIDS \u00B7 GPU', cw * 0.5, capY, capTrack);
  }

  paintIdentity('rgba(255,0,0,1)', 'rgba(255,0,0,0.62)');
  paintRules('rgba(255,0,0,0.30)', 'rgba(255,0,0,0.46)');

  const blurA = Math.max(2, Math.min(cw, ch) * 0.012);
  const blurB = Math.max(4, Math.min(cw, ch) * 0.034);
  const offset = cw * 3;

  g.save();
  g.shadowColor = 'rgba(0,255,0,1)';
  g.shadowBlur = blurA;
  g.shadowOffsetX = offset;
  g.translate(-offset, 0);
  paintIdentity('rgba(0,255,0,1)', 'rgba(0,255,0,0.70)');
  g.restore();

  g.save();
  g.shadowColor = 'rgba(0,255,0,0.42)';
  g.shadowBlur = blurB;
  g.shadowOffsetX = offset;
  g.translate(-offset, 0);
  paintIdentity('rgba(0,255,0,0.42)', 'rgba(0,255,0,0.30)');
  g.restore();

  return canvas;
}

export default function create(ctx) {
  const root = ctx && ctx.root ? ctx.root : null;
  const reduced = !!(ctx && ctx.reduced);
  let preview = !!(ctx && ctx.preview);

  let disposed = false;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let renderWidth = 1;
  let renderHeight = 1;
  let aspect = 1;

  let renderer = null;
  let glCanvas = null;
  let scene = null;
  let camera = null;
  let quad = null;
  let geometry = null;
  let byteMode = false;
  let rtType = null;
  let contextLost = false;
  let ready = false;
  let active = false;
  let frameId = 0;
  let simTime = 0;

  let velocity = null;
  let dye = null;
  let pressure = null;
  let divergenceRT = null;
  let curlRT = null;

  let substrateTexture = null;
  let substrateCanvas = null;
  let substrateW = 0;
  let substrateH = 0;

  let simW = 0;
  let simH = 0;
  let dyeW = 0;
  let dyeH = 0;
  let jacobiIterations = 24;

  const seedBase = Math.random() * 100;

  let fallbackCanvas = null;
  let fallback2d = null;

  const pointer = { x: 0.5, y: 0.62 };
  const splatFrom = { x: 0.5, y: 0.62 };
  let pointerInside = false;
  let hasInteracted = false;
  let rect = null;
  let rectFrame = -1;
  let sinceSplat = 0;

  let idleT = Math.random() * 12;
  const idlePrev = { x: 0.5, y: 0.62 };
  let idleSeeded = false;
  let nextAccent = 1.4;

  const materials = {};

  function makeMaterial(fragment, uniforms) {
    return new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: fragment,
      uniforms: uniforms,
      defines: byteMode ? { BYTE_MODE: '1' } : {},
      depthTest: false,
      depthWrite: false,
      transparent: false
    });
  }

  function detectHalfFloat() {
    try {
      const gl = renderer.getContext();
      const caps = renderer.capabilities;
      const ext = renderer.extensions;
      if (caps.isWebGL2) {
        if (!ext.has('EXT_color_buffer_float') && !ext.has('EXT_color_buffer_half_float')) return false;
      } else if (!ext.has('OES_texture_half_float') || !ext.has('OES_texture_half_float_linear')) {
        return false;
      }
      const probe = new THREE.WebGLRenderTarget(4, 4, {
        type: THREE.HalfFloatType,
        format: THREE.RGBAFormat,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: false,
        stencilBuffer: false,
        generateMipmaps: false
      });
      renderer.setRenderTarget(probe);
      const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
      renderer.setRenderTarget(null);
      probe.dispose();
      return ok;
    } catch (e) {
      return false;
    }
  }

  function makeRT(w, h) {
    const rt = new THREE.WebGLRenderTarget(w, h, {
      type: rtType,
      format: THREE.RGBAFormat,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      wrapS: THREE.ClampToEdgeWrapping,
      wrapT: THREE.ClampToEdgeWrapping,
      depthBuffer: false,
      stencilBuffer: false,
      generateMipmaps: false
    });
    rt.texture.generateMipmaps = false;
    rt.texture.colorSpace = THREE.NoColorSpace;
    return rt;
  }

  function makeDouble(w, h) {
    return {
      read: makeRT(w, h),
      write: makeRT(w, h),
      swap: function () {
        const t = this.read;
        this.read = this.write;
        this.write = t;
      },
      dispose: function () {
        this.read.dispose();
        this.write.dispose();
      }
    };
  }

  function pass(material, target) {
    quad.material = material;
    renderer.setRenderTarget(target || null);
    renderer.render(scene, camera);
  }

  function initGL() {
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false,
        alpha: false,
        depth: false,
        stencil: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: reduced,
        powerPreference: 'high-performance',
        failIfMajorPerformanceCaveat: false
      });
    } catch (e) {
      renderer = null;
      return false;
    }
    if (!renderer) return false;

    glCanvas = renderer.domElement;
    glCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:block;';
    renderer.autoClear = false;
    renderer.setClearColor(0x000000, 1);

    byteMode = !detectHalfFloat();
    rtType = byteMode ? THREE.UnsignedByteType : THREE.HalfFloatType;

    geometry = new THREE.PlaneGeometry(2, 2);
    camera = new THREE.Camera();
    scene = new THREE.Scene();

    materials.splatVelocity = makeMaterial(FRAG_SPLAT_VELOCITY, {
      uTarget: { value: null },
      uA: { value: new THREE.Vector2() },
      uB: { value: new THREE.Vector2() },
      uForce: { value: new THREE.Vector2() },
      uRadius: { value: 0.002 },
      uAspect: { value: 1 }
    });
    materials.splatDye = makeMaterial(FRAG_SPLAT_DYE, {
      uTarget: { value: null },
      uA: { value: new THREE.Vector2() },
      uB: { value: new THREE.Vector2() },
      uRadius: { value: 0.002 },
      uAspect: { value: 1 },
      uAmount: { value: 0.5 },
      uPhase: { value: 0 }
    });
    materials.advectVelocity = makeMaterial(FRAG_ADVECT_VELOCITY, {
      uVelocity: { value: null },
      uTexel: { value: new THREE.Vector2() },
      uDt: { value: 0.016 },
      uDecay: { value: 0.995 }
    });
    materials.advectDye = makeMaterial(FRAG_ADVECT_DYE, {
      uVelocity: { value: null },
      uSource: { value: null },
      uTexel: { value: new THREE.Vector2() },
      uDt: { value: 0.016 },
      uDecay: { value: new THREE.Vector3(0.99, 0.96, 1.0) }
    });
    materials.divergence = makeMaterial(FRAG_DIVERGENCE, {
      uVelocity: { value: null },
      uTexel: { value: new THREE.Vector2() }
    });
    materials.curl = makeMaterial(FRAG_CURL, {
      uVelocity: { value: null },
      uTexel: { value: new THREE.Vector2() }
    });
    materials.vorticity = makeMaterial(FRAG_VORTICITY, {
      uVelocity: { value: null },
      uCurl: { value: null },
      uTexel: { value: new THREE.Vector2() },
      uAmount: { value: 22.0 },
      uDt: { value: 0.016 }
    });
    materials.pressure = makeMaterial(FRAG_PRESSURE, {
      uPressure: { value: null },
      uDivergence: { value: null },
      uTexel: { value: new THREE.Vector2() }
    });
    materials.gradient = makeMaterial(FRAG_GRADIENT, {
      uPressure: { value: null },
      uVelocity: { value: null },
      uTexel: { value: new THREE.Vector2() }
    });
    materials.decay = makeMaterial(FRAG_DECAY, {
      uTexture: { value: null },
      uValue: { value: 0.82 }
    });
    materials.zero = makeMaterial(FRAG_ZERO, {});
    materials.seedVelocity = makeMaterial(FRAG_SEED_VELOCITY, {
      uSeed: { value: seedBase },
      uAspect: { value: 1 },
      uAmp: { value: 26 }
    });
    materials.seedDye = makeMaterial(FRAG_SEED_DYE, {
      uSeed: { value: seedBase },
      uAspect: { value: 1 },
      uGain: { value: 0.85 }
    });
    materials.display = makeMaterial(FRAG_DISPLAY, {
      uDye: { value: null },
      uVelocity: { value: null },
      uSubstrate: { value: null },
      uDyeTexel: { value: new THREE.Vector2() },
      uSubTexel: { value: new THREE.Vector2() },
      uVelTexel: { value: new THREE.Vector2() },
      uPixel: { value: new THREE.Vector2() },
      uAspect: { value: 1 },
      uTime: { value: 0 },
      uDistort: { value: 0.042 },
      uRelief: { value: 5.6 },
      uMicro: { value: 0.5 }
    });

    quad = new THREE.Mesh(geometry, materials.display);
    quad.frustumCulled = false;
    scene.add(quad);

    glCanvas.addEventListener('webglcontextlost', onContextLost, false);
    glCanvas.addEventListener('webglcontextrestored', onContextRestored, false);

    if (root) root.appendChild(glCanvas);
    return true;
  }

  function onContextLost(e) {
    e.preventDefault();
    contextLost = true;
  }

  function onContextRestored() {
    contextLost = false;
    if (disposed || width < 8 || height < 8) return;
    try {
      substrateW = 0;
      substrateH = 0;
      simW = 0;
      buildSizes(width, height, true);
    } catch (e) {
      contextLost = true;
    }
  }

  function buildSubstrate() {
    if (!renderer) return;
    const target = clamp(Math.round(renderWidth), 640, 2048);
    const cw = target;
    const chh = clamp(Math.round(target * (height / Math.max(width, 1))), 400, 2048);
    if (cw === substrateW && chh === substrateH && substrateTexture) return;

    const canvas = buildSubstrateCanvas(cw, chh);
    if (!canvas) return;
    if (substrateTexture) substrateTexture.dispose();
    substrateCanvas = canvas;
    substrateW = cw;
    substrateH = chh;
    substrateTexture = new THREE.CanvasTexture(canvas);
    substrateTexture.minFilter = THREE.LinearFilter;
    substrateTexture.magFilter = THREE.LinearFilter;
    substrateTexture.wrapS = THREE.ClampToEdgeWrapping;
    substrateTexture.wrapT = THREE.ClampToEdgeWrapping;
    substrateTexture.generateMipmaps = false;
    substrateTexture.colorSpace = THREE.NoColorSpace;
    materials.display.uniforms.uSubstrate.value = substrateTexture;
    materials.display.uniforms.uSubTexel.value.set(1 / cw, 1 / chh);
  }

  /* Freshly allocated targets contain raw zeros, which decode to a large
     negative velocity in byte mode — every signed field needs an encoded zero. */
  function clearFields() {
    const signed = [velocity.read, velocity.write, pressure.read, pressure.write, divergenceRT, curlRT];
    for (let i = 0; i < signed.length; i++) pass(materials.zero, signed[i]);
    const dyes = [dye.read, dye.write];
    for (let i = 0; i < dyes.length; i++) {
      renderer.setRenderTarget(dyes[i]);
      renderer.clear(true, false, false);
    }
    renderer.setRenderTarget(null);
  }

  function seedFields(dyeGain, velAmp) {
    materials.seedVelocity.uniforms.uAspect.value = aspect;
    materials.seedVelocity.uniforms.uSeed.value = seedBase;
    materials.seedVelocity.uniforms.uAmp.value = velAmp;
    pass(materials.seedVelocity, velocity.write);
    velocity.swap();

    materials.seedDye.uniforms.uAspect.value = aspect;
    materials.seedDye.uniforms.uSeed.value = seedBase;
    materials.seedDye.uniforms.uGain.value = dyeGain;
    pass(materials.seedDye, dye.write);
    dye.swap();

    materials.decay.uniforms.uValue.value = 0.0;
    materials.decay.uniforms.uTexture.value = pressure.read.texture;
    pass(materials.decay, pressure.write);
    pressure.swap();
    materials.decay.uniforms.uValue.value = 0.82;
  }

  function buildSizes(w, h, force) {
    if (!renderer) return;
    const nw = Math.max(1, Math.round(w));
    const nh = Math.max(1, Math.round(h));
    /* A card is small in CSS pixels but still sits on a retina panel, so the
       display resolution has to stay at full device scale or the preview reads
       as a blurry thumbnail. The saving comes from the solver grids below,
       which is where the cost actually is — not from the framebuffer. */
    const rawDpr = Math.min(window.devicePixelRatio || 1, 2);
    const budget = preview ? 1900000 : 2600000;
    let effDpr = rawDpr;
    const rawPixels = nw * nh * rawDpr * rawDpr;
    if (rawPixels > budget) effDpr = Math.max(1, rawDpr * Math.sqrt(budget / rawPixels));

    const sameSize = nw === width && nh === height && Math.abs(effDpr - dpr) < 0.001;
    if (sameSize && !force && ready) return;

    width = nw;
    height = nh;
    dpr = effDpr;
    aspect = nw / nh;

    renderer.setPixelRatio(dpr);
    renderer.setSize(nw, nh, false);
    renderWidth = Math.max(1, Math.round(nw * dpr));
    renderHeight = Math.max(1, Math.round(nh * dpr));

    /* The dye grid is what the eye reads, so it stays generous; the velocity
       lattice is the expensive Jacobi solve and is what gets cut. */
    const small = Math.min(nw, nh) < 420 || nw < 560;
    const simLong = small ? 104 : 160;
    const dyeLong = small ? 384 : 512;

    let nSimW;
    let nSimH;
    let nDyeW;
    let nDyeH;
    if (nw >= nh) {
      nSimW = simLong;
      nSimH = Math.max(32, Math.round(simLong * nh / nw));
      nDyeW = dyeLong;
      nDyeH = Math.max(64, Math.round(dyeLong * nh / nw));
    } else {
      nSimH = simLong;
      nSimW = Math.max(32, Math.round(simLong * nw / nh));
      nDyeH = dyeLong;
      nDyeW = Math.max(64, Math.round(dyeLong * nw / nh));
    }

    const gridChanged = nSimW !== simW || nSimH !== simH || nDyeW !== dyeW || nDyeH !== dyeH;

    if (gridChanged || force || !velocity) {
      if (velocity) velocity.dispose();
      if (dye) dye.dispose();
      if (pressure) pressure.dispose();
      if (divergenceRT) divergenceRT.dispose();
      if (curlRT) curlRT.dispose();

      simW = nSimW;
      simH = nSimH;
      dyeW = nDyeW;
      dyeH = nDyeH;

      velocity = makeDouble(simW, simH);
      dye = makeDouble(dyeW, dyeH);
      pressure = makeDouble(simW, simH);
      divergenceRT = makeRT(simW, simH);
      curlRT = makeRT(simW, simH);
    }

    jacobiIterations = small ? 16 : (byteMode ? 18 : 26);

    const simTexel = new THREE.Vector2(1 / simW, 1 / simH);
    materials.advectVelocity.uniforms.uTexel.value.copy(simTexel);
    materials.advectDye.uniforms.uTexel.value.copy(simTexel);
    materials.divergence.uniforms.uTexel.value.copy(simTexel);
    materials.curl.uniforms.uTexel.value.copy(simTexel);
    materials.vorticity.uniforms.uTexel.value.copy(simTexel);
    materials.pressure.uniforms.uTexel.value.copy(simTexel);
    materials.gradient.uniforms.uTexel.value.copy(simTexel);
    materials.splatVelocity.uniforms.uAspect.value = aspect;
    materials.splatDye.uniforms.uAspect.value = aspect;

    const d = materials.display.uniforms;
    d.uDyeTexel.value.set(1 / dyeW, 1 / dyeH);
    d.uVelTexel.value.copy(simTexel);
    d.uPixel.value.set(1 / renderWidth, 1 / renderHeight);
    d.uAspect.value = aspect;
    d.uDistort.value = small ? 0.034 : 0.042;
    d.uRelief.value = small ? 4.6 : 5.6;

    buildSubstrate();

    if (gridChanged || force || !ready) {
      clearFields();
      if (reduced) {
        seedFields(0.95, 30);
        simulate(64, 1 / 60, true);
      } else if (!hasInteracted) {
        seedFields(0.78, 24);
        simulate(26, 1 / 60, true);
      } else {
        seedFields(0.42, 16);
        simulate(14, 1 / 60, true);
      }
    }

    ready = true;
    renderDisplay();
  }

  function splat(ax, ay, bx, by, fx, fy, radius, dyeAmount, phase) {
    const sv = materials.splatVelocity.uniforms;
    sv.uTarget.value = velocity.read.texture;
    sv.uA.value.set(ax, ay);
    sv.uB.value.set(bx, by);
    sv.uForce.value.set(fx, fy);
    sv.uRadius.value = radius;
    pass(materials.splatVelocity, velocity.write);
    velocity.swap();

    const sd = materials.splatDye.uniforms;
    sd.uTarget.value = dye.read.texture;
    sd.uA.value.set(ax, ay);
    sd.uB.value.set(bx, by);
    sd.uRadius.value = radius * 1.15;
    sd.uAmount.value = dyeAmount;
    sd.uPhase.value = phase;
    pass(materials.splatDye, dye.write);
    dye.swap();
  }

  function injectPointer(dt) {
    sinceSplat += dt;
    const dxs = (pointer.x - splatFrom.x) * aspect;
    const dys = pointer.y - splatFrom.y;
    const dist = Math.sqrt(dxs * dxs + dys * dys);
    if (dist < 0.0004) return;

    const rawSpeed = dist / Math.max(sinceSplat, 0.0001);
    const speed = Math.min(rawSpeed, 3.1);
    const inv = 1 / dist;
    const scale = simH;
    const mag = speed * scale * 0.58;
    const fx = dxs * inv * mag;
    const fy = dys * inv * mag;

    const norm = Math.min(speed / 3.1, 1);
    const radius = 0.0015 + norm * 0.0028;
    const dyeAmount = 0.20 + norm * 0.45;
    const phase = (simTime * 0.07 + norm * 0.45) % 1;

    splat(splatFrom.x, splatFrom.y, pointer.x, pointer.y, fx, fy, radius, dyeAmount, phase);
    splatFrom.x = pointer.x;
    splatFrom.y = pointer.y;
    sinceSplat = 0;
  }

  function injectIdle(dt) {
    idleT += dt;
    const t = idleT;
    const px = 0.5 + 0.30 * Math.sin(t * 0.29) * Math.cos(t * 0.163);
    const py = 0.53 + 0.23 * Math.sin(t * 0.211 + 1.1) * Math.cos(t * 0.087);
    if (!idleSeeded) {
      idlePrev.x = px;
      idlePrev.y = py;
      idleSeeded = true;
      return;
    }

    const dxs = (px - idlePrev.x) * aspect;
    const dys = py - idlePrev.y;
    const dist = Math.sqrt(dxs * dxs + dys * dys);

    let accent = 0;
    if (t > nextAccent) {
      nextAccent = t + (preview ? 1.5 : 3.1) + Math.random() * (preview ? 1.1 : 1.9);
      accent = 1;
    }

    /* A card runs a coarser lattice and a smaller dye buffer, so the same
       injection advects a fraction as far before it dissipates and the tile
       reads as black. These gains restore the full-page density; they touch
       the phantom pointer only, never a real one. */
    const gForce = preview ? 2.4 : 1;
    const gDye = preview ? 4.2 : 1;
    const gRadius = preview ? 2.1 : 1;

    /* The phantom pointer crawls, so any one cell sits inside the splat for many
       frames; the per-frame force has to be an order below a real drag or the
       idle state pins the velocity clamp. Accents are one-frame impulses. */
    if (dist > 0.00004) {
      const speed = Math.min(dist / Math.max(dt, 0.0001), 3.1);
      const inv = 1 / dist;
      const mag = simH * (speed * 0.05 + accent * 1.1) * gForce;
      splat(
        idlePrev.x, idlePrev.y, px, py,
        dxs * inv * mag, dys * inv * mag,
        (0.0018 + accent * 0.0024) * gRadius,
        (0.012 + accent * 0.45) * gDye,
        (t * 0.043) % 1
      );
    }
    idlePrev.x = px;
    idlePrev.y = py;
  }

  function simulate(steps, dt, skipInput) {
    for (let s = 0; s < steps; s++) {
      if (!skipInput) {
        if (pointerInside) {
          injectPointer(dt);
        } else if (preview || !hasInteracted) {
          /* On the full page the ambient drift is an attract loop: once the
             visitor has taken the field over it stays theirs. A card has no
             such arc — the pointer is only ever passing through, so the drift
             must always come back, or the tile dies the first time it is
             hovered and left. */
          injectIdle(dt);
        }
      }

      materials.curl.uniforms.uVelocity.value = velocity.read.texture;
      pass(materials.curl, curlRT);

      const vo = materials.vorticity.uniforms;
      vo.uVelocity.value = velocity.read.texture;
      vo.uCurl.value = curlRT.texture;
      vo.uDt.value = dt;
      pass(materials.vorticity, velocity.write);
      velocity.swap();

      materials.divergence.uniforms.uVelocity.value = velocity.read.texture;
      pass(materials.divergence, divergenceRT);

      materials.decay.uniforms.uTexture.value = pressure.read.texture;
      materials.decay.uniforms.uValue.value = 0.82;
      pass(materials.decay, pressure.write);
      pressure.swap();

      const pu = materials.pressure.uniforms;
      pu.uDivergence.value = divergenceRT.texture;
      for (let i = 0; i < jacobiIterations; i++) {
        pu.uPressure.value = pressure.read.texture;
        pass(materials.pressure, pressure.write);
        pressure.swap();
      }

      const gu = materials.gradient.uniforms;
      gu.uPressure.value = pressure.read.texture;
      gu.uVelocity.value = velocity.read.texture;
      pass(materials.gradient, velocity.write);
      velocity.swap();

      const frames = dt * 60;
      const av = materials.advectVelocity.uniforms;
      av.uVelocity.value = velocity.read.texture;
      av.uDt.value = dt;
      av.uDecay.value = Math.pow(0.9935, frames);
      pass(materials.advectVelocity, velocity.write);
      velocity.swap();

      const ad = materials.advectDye.uniforms;
      ad.uVelocity.value = velocity.read.texture;
      ad.uSource.value = dye.read.texture;
      ad.uDt.value = dt;
      ad.uDecay.value.set(Math.pow(0.9885, frames), Math.pow(0.952, frames), 1.0);
      pass(materials.advectDye, dye.write);
      dye.swap();
    }
  }

  function renderDisplay() {
    if (!renderer || !ready || contextLost) return;
    const d = materials.display.uniforms;
    d.uDye.value = dye.read.texture;
    d.uVelocity.value = velocity.read.texture;
    d.uTime.value = simTime;
    pass(materials.display, null);
    renderer.setRenderTarget(null);
  }

  function refreshRect() {
    if (!root) return;
    const r = root.getBoundingClientRect();
    if (r.width > 0 && r.height > 0) rect = r;
  }

  function localFromEvent(e) {
    if (rectFrame !== frameId || !rect) {
      refreshRect();
      rectFrame = frameId;
    }
    if (!rect) return false;
    pointer.x = clamp((e.clientX - rect.left) / rect.width, -0.5, 1.5);
    pointer.y = clamp(1 - (e.clientY - rect.top) / rect.height, -0.5, 1.5);
    return true;
  }

  function anchorPointer() {
    splatFrom.x = pointer.x;
    splatFrom.y = pointer.y;
    sinceSplat = 0;
  }

  function markInteracted() {
    if (hasInteracted) return;
    hasInteracted = true;
    anchorPointer();
  }

  function onPointerEnter(e) {
    rectFrame = -1;
    if (!localFromEvent(e)) return;
    pointerInside = true;
    anchorPointer();
  }

  function onPointerMove(e) {
    if (!localFromEvent(e)) return;
    if (!pointerInside) {
      pointerInside = true;
      anchorPointer();
    }
    markInteracted();
  }

  function onPointerDown(e) {
    rectFrame = -1;
    if (!localFromEvent(e)) return;
    pointerInside = true;
    anchorPointer();
    markInteracted();
  }

  /* Re-seed so the phantom pointer resumes from its own path rather than
     teleporting from wherever the real cursor left off. */
  function onPointerLeave() {
    pointerInside = false;
    idleSeeded = false;
  }

  function onPointerEnd(e) {
    if (e && e.pointerType === 'mouse') return;
    pointerInside = false;
    idleSeeded = false;
  }

  function onWindowScroll() {
    rectFrame = -1;
  }

  function attachListeners() {
    if (!root || reduced) return;
    root.addEventListener('pointerenter', onPointerEnter, { passive: true });
    root.addEventListener('pointermove', onPointerMove, { passive: true });
    root.addEventListener('pointerdown', onPointerDown, { passive: true });
    root.addEventListener('pointerleave', onPointerLeave, { passive: true });
    root.addEventListener('pointercancel', onPointerEnd, { passive: true });
    window.addEventListener('pointerup', onPointerEnd, { passive: true });
    window.addEventListener('pointercancel', onPointerEnd, { passive: true });
    window.addEventListener('scroll', onWindowScroll, { passive: true });
  }

  function detachListeners() {
    if (!root) return;
    root.removeEventListener('pointerenter', onPointerEnter);
    root.removeEventListener('pointermove', onPointerMove);
    root.removeEventListener('pointerdown', onPointerDown);
    root.removeEventListener('pointerleave', onPointerLeave);
    root.removeEventListener('pointercancel', onPointerEnd);
    window.removeEventListener('pointerup', onPointerEnd);
    window.removeEventListener('pointercancel', onPointerEnd);
    window.removeEventListener('scroll', onWindowScroll);
  }

  /* Software still life used only when WebGL is unavailable: same identity,
     same palette, so the slot never reads as broken. */
  function buildFallback(w, h) {
    if (!root) return;
    if (!fallbackCanvas) {
      fallbackCanvas = document.createElement('canvas');
      fallbackCanvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;display:block;';
      root.appendChild(fallbackCanvas);
      fallback2d = fallbackCanvas.getContext('2d');
    }
    if (!fallback2d) return;
    const scale = Math.min(window.devicePixelRatio || 1, 2);
    const cw = Math.max(1, Math.round(w * scale));
    const chh = Math.max(1, Math.round(h * scale));
    fallbackCanvas.width = cw;
    fallbackCanvas.height = chh;
    const g = fallback2d;
    g.fillStyle = '#030304';
    g.fillRect(0, 0, cw, chh);

    const grad = g.createLinearGradient(cw * 0.1, chh, cw * 0.9, 0);
    grad.addColorStop(0, 'rgba(12,13,16,1)');
    grad.addColorStop(0.42, 'rgba(126,131,140,0.55)');
    grad.addColorStop(0.55, 'rgba(226,230,238,0.68)');
    grad.addColorStop(0.68, 'rgba(96,101,112,0.45)');
    grad.addColorStop(1, 'rgba(9,10,12,1)');
    g.fillStyle = grad;
    g.fillRect(0, 0, cw, chh);

    const art = buildSubstrateCanvas(cw, chh);
    if (art) {
      g.globalCompositeOperation = 'screen';
      g.globalAlpha = 0.55;
      g.drawImage(art, 0, 0, cw, chh);
      g.globalAlpha = 1;
      g.globalCompositeOperation = 'source-over';
    }
    const vig = g.createRadialGradient(cw * 0.5, chh * 0.5, 0, cw * 0.5, chh * 0.5, Math.max(cw, chh) * 0.72);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.72)');
    g.fillStyle = vig;
    g.fillRect(0, 0, cw, chh);
  }

  function whenFontsReady(cb) {
    try {
      if (typeof document === 'undefined' || !document.fonts) {
        cb();
        return;
      }
      if (document.fonts.check('900 64px "Space Grotesk"')) {
        cb();
        return;
      }
      document.fonts.ready.then(function () { cb(); }, function () { cb(); });
    } catch (e) {
      cb();
    }
  }

  const glOk = root ? initGL() : false;
  if (glOk) attachListeners();

  whenFontsReady(function () {
    if (disposed) return;
    if (!glOk) {
      if (width >= 8 && height >= 8) buildFallback(width, height);
      return;
    }
    if (!ready || contextLost) return;
    substrateW = 0;
    substrateH = 0;
    buildSubstrate();
    renderDisplay();
  });

  return {
    /* The orchestrator forces a resize straight after this, which is what
       rebuilds the FBOs at the new budget. */
    setPreview: function (next) {
      preview = !!next;
    },

    resize: function (w, h) {
      if (disposed) return;
      const nw = Math.max(1, Math.floor(w || (root ? root.clientWidth : 0) || 1));
      const nh = Math.max(1, Math.floor(h || (root ? root.clientHeight : 0) || 1));
      if (nw < 8 || nh < 8) return;
      if (!glOk) {
        width = nw;
        height = nh;
        buildFallback(nw, nh);
        return;
      }
      if (contextLost) {
        width = nw;
        height = nh;
        return;
      }
      buildSizes(nw, nh, false);
    },

    update: function (dt, elapsed) {
      if (disposed || reduced || !glOk || !ready || contextLost || !active) return;
      frameId++;
      const step = Math.min(Math.max(dt || 0, 0.0005), 0.05);
      simTime = typeof elapsed === 'number' ? elapsed : simTime + step;
      simulate(1, step, false);
      renderDisplay();
    },

    activate: function () {
      if (disposed) return;
      active = true;
      rectFrame = -1;
      anchorPointer();
      idleSeeded = false;
      if (glOk && ready && !contextLost) renderDisplay();
    },

    deactivate: function () {
      active = false;
      pointerInside = false;
    },

    destroy: function () {
      if (disposed) return;
      disposed = true;
      active = false;
      detachListeners();

      if (glCanvas) {
        glCanvas.removeEventListener('webglcontextlost', onContextLost, false);
        glCanvas.removeEventListener('webglcontextrestored', onContextRestored, false);
      }

      if (velocity) velocity.dispose();
      if (dye) dye.dispose();
      if (pressure) pressure.dispose();
      if (divergenceRT) divergenceRT.dispose();
      if (curlRT) curlRT.dispose();
      velocity = null;
      dye = null;
      pressure = null;
      divergenceRT = null;
      curlRT = null;

      if (substrateTexture) substrateTexture.dispose();
      substrateTexture = null;
      substrateCanvas = null;

      for (const key in materials) {
        if (materials[key] && materials[key].dispose) materials[key].dispose();
      }
      if (geometry) geometry.dispose();
      if (scene && quad) scene.remove(quad);

      if (renderer) {
        try {
          renderer.setRenderTarget(null);
          renderer.dispose();
          renderer.forceContextLoss();
        } catch (e) { /* context already gone */ }
      }
      if (glCanvas && glCanvas.parentNode) glCanvas.parentNode.removeChild(glCanvas);
      if (fallbackCanvas && fallbackCanvas.parentNode) fallbackCanvas.parentNode.removeChild(fallbackCanvas);

      renderer = null;
      glCanvas = null;
      quad = null;
      scene = null;
      camera = null;
      geometry = null;
      fallbackCanvas = null;
      fallback2d = null;
      ready = false;
    }
  };
}
