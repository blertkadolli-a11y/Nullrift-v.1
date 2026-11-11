(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,60854,o=>{"use strict";let e=`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`,a=`
uniform sampler2D uTex;
uniform float uProgress;
uniform float uBand;
uniform float uOpacity;
uniform vec2 uCover;
varying vec2 vUv;

void main() {
  vec2 uv = (vUv - 0.5) * uCover + 0.5;
  vec3 c = texture2D(uTex, uv).rgb;

  float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));

  float bandY = mix(1.15, -0.15, uProgress);
  float y = vUv.y + sin(vUv.x * 3.14159) * 0.04;  // bowed, like a reflection on a curved panel
  float d = abs(y - bandY);
  float band = smoothstep(uBand, 0.0, d);

  float passed = smoothstep(bandY - 0.02, bandY + 0.02, y);
  float residual = mix(0.04, 0.35, passed);
  float full = smoothstep(0.85, 1.0, uProgress);
  float exposure = mix(residual, 1.0, full);

  vec3 col = c * exposure + c * band * (0.6 + pow(luma, 1.6) * 2.2);
  gl_FragColor = vec4(col, uOpacity);
}
`,t=`
uniform sampler2D uTex;
uniform sampler2D uNrm;
uniform float uHasNormal;
uniform vec3 uLight;     // xy in uv space, z is height above the surface
uniform float uAmbient;  // how much fill is in the room
uniform float uThrow;    // how far the lamp carries
uniform float uOpacity;
uniform vec2 uCover;
varying vec2 vUv;

void main() {
  vec2 uv = (vUv - 0.5) * uCover + 0.5;
  vec3 c = texture2D(uTex, uv).rgb;

  vec3 n = uHasNormal > 0.5
    ? normalize(texture2D(uNrm, uv).rgb * 2.0 - 1.0)
    : vec3(0.0, 0.0, 1.0);

  vec3 toLight = vec3(uLight.xy - vUv, max(uLight.z, 0.02));
  float dist = length(toLight);
  vec3 L = toLight / max(dist, 0.0001);

  float diff = max(dot(n, L), 0.0);
  float falloff = 1.0 - smoothstep(0.0, uThrow, dist);
  float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));

  // A low lamp throws a tight, hard pool; a high one washes the whole panel.
  float graze = 1.0 - clamp(uLight.z, 0.0, 1.0);
  float edge = pow(falloff, mix(1.0, 2.4, graze));

  // At grazing incidence a flat surface still catches light as a sheen, and
  // it catches it in proportion to how bright it already is. That is why the
  // raking pass finds a ripple in paint that the flood misses entirely.
  float sheen = pow(edge, 1.0 + graze * 1.6) * graze * 2.1;

  float lit = uAmbient
    + diff * edge * (1.0 + pow(luma, 1.4) * 1.6)
    + sheen * (0.18 + pow(luma, 1.2) * 1.5);

  gl_FragColor = vec4(c * lit, uOpacity);
}
`,l=`
uniform sampler2D uTex;
uniform vec2 uCover;
uniform vec2 uLampA;
uniform vec2 uLampB;
uniform float uLampCount;
uniform float uIgnition;
uniform float uAspect;
uniform float uOpacity;
varying vec2 vUv;

const vec3 LIGHT = vec3(0.984, 0.980, 0.965);

void lamp(vec2 at, float aspect, out float core, out float bloom, out float beam) {
  vec2 d = (vUv - at) * vec2(aspect, 1.0);
  float r = length(d);
  core  = smoothstep(0.026, 0.0, r);
  bloom = smoothstep(0.26, 0.0, r);
  beam  = smoothstep(0.72, 0.0, length(d * vec2(0.38, 2.6)));
}

void main() {
  vec2 uv = (vUv - 0.5) * uCover + 0.5;
  vec3 c = texture2D(uTex, uv).rgb;
  float luma = dot(c, vec3(0.2126, 0.7152, 0.0722));

  float core, bloom, beam;
  lamp(uLampA, uAspect, core, bloom, beam);

  if (uLampCount > 1.5) {
    float c2, b2, m2;
    lamp(uLampB, uAspect, c2, b2, m2);
    core += c2;
    bloom = max(bloom, b2);
    beam = max(beam, m2);
  }

  float strike = smoothstep(0.0, 0.28, uIgnition);
  float spread = smoothstep(0.10, 1.0, uIgnition);

  // The filament only fills in a lamp that is dark. Where the photograph
  // already has a lit lamp, adding a white core just erases its shape, so the
  // light goes into the bloom around it instead.
  float unlit = 1.0 - smoothstep(0.30, 0.78, luma);

  vec3 add = vec3(0.0);
  add += c * bloom * spread * (0.5 + pow(luma, 1.6) * 1.5);
  add += c * beam * spread * 0.34;
  add += LIGHT * core * strike * unlit * 1.1;
  add += LIGHT * bloom * bloom * strike * 0.1;

  vec3 col = c + add;

  // Soft knee. Anything under it is untouched; above it rolls off instead of
  // clipping, so the lamp keeps its shape rather than becoming a white patch.
  float m = max(col.r, max(col.g, col.b));
  float knee = 0.82;
  float rolled = knee + (1.0 - exp(-max(m - knee, 0.0) * 2.4)) * 0.18;
  col *= mix(1.0, rolled / max(m, 1e-4), step(knee, m));

  gl_FragColor = vec4(col, uOpacity);
}
`;o.s(["HEADLIGHT_FRAG",0,l,"RAKE_FRAG",0,t,"UNVEIL_FRAG",0,a,"VERT",0,e])}]);