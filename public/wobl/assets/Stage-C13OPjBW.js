const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/Inner-CBXi3glR.js","assets/rolldown-runtime-XKyaHtl9.js","assets/three-BNmSymXd.js","assets/index-BX8Q3zeZ.js","assets/index-52gI3HCV.css","assets/quality-CDuNpMQi.js","assets/Jar-DurbYmaP.js","assets/physics-DtvvYgji.js"])))=>i.map(i=>d[i]);
import{n as e,r as t}from"./rolldown-runtime-XKyaHtl9.js";import{A as n,B as r,C as i,D as a,E as o,F as s,G as c,H as l,I as u,J as d,K as f,L as p,M as m,N as h,O as g,T as _,U as v,Y as y,Z as b,a as x,b as S,c as C,d as w,f as ee,g as te,h as T,i as ne,k as E,l as re,m as D,n as O,o as k,p as ie,q as A,r as j,s as M,t as ae,u as oe,w as se,x as ce,y as N,z as le}from"./three-BNmSymXd.js";import{a as P,i as ue,n as de,o as fe,r as F,s as pe,t as I}from"./index-BX8Q3zeZ.js";import{a as L,i as me,n as R,r as he,t as z}from"./quality-CDuNpMQi.js";var B=t(b(),1);function ge({onDecline:e,threshold:t=47}){let n=(0,B.useRef)({t:0,n:0,slow:0});return x((r,i)=>{if(!P.intro.done||P.time-(P.introDoneAt||0)<3||i>.25)return;let a=n.current;if(a.t+=i,a.n++,a.t<2)return;let o=a.n/a.t;a.t=0,a.n=0,a.slow=o<t?a.slow+1:0,a.slow>=2&&(a.slow=0,e())}),null}var V=`/wobl/models/bear.glb`,_e=`/wobl/models/bear-low.glb`,ve=`/wobl/hdri/studio.hdr`;T.onProgress=(e,t,n)=>{P.loadProgress=Math.round(t/Math.max(1,n)*100)};var ye=()=>k(j,V),be=()=>k(j,_e);function xe(){let e=k(O,ve);return e.mapping=303,e}function Se(e){let t={};return e.scene.traverse(e=>e.name&&(t[e.name]=e)),t}function Ce(){k.preload(j,V),k.preload(j,_e),k.preload(O,ve)}var we=1/240,H=class{constructor(e=0,t=120,n=12){this.x=e,this.v=0,this.k=t,this.c=n,this.target=e}impulse(e){this.v+=e}update(e,t=this.target){let n=Math.min(e,1/20);for(;n>1e-6;){let e=Math.min(we,n),r=(t-this.x)*this.k-this.v*this.c;this.v+=r*e,this.x+=this.v*e,n-=e}return this.x}},Te=class{constructor(e=120,t=12){this.x=new Float64Array(3),this.v=new Float64Array(3),this.k=e,this.c=t}impulse(e,t,n){this.v[0]+=e,this.v[1]+=t,this.v[2]+=n}update(e,t=0,n=0,r=0){let i=Math.min(e,1/20),a=[t,n,r];for(;i>1e-6;){let e=Math.min(we,i);for(let t=0;t<3;t++){let n=(a[t]-this.x[t])*this.k-this.v[t]*this.c;this.v[t]+=n*e,this.x[t]+=this.v[t]*e}i-=e}return this.x}},U=(e,t,n,r)=>e+(t-e)*(1-Math.exp(-n*r)),W=(e,t,n)=>Math.min(n,Math.max(t,e)),G=(e,t,n)=>e+(t-e)*n,K=y(),Ee=`
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.999, 1.0); }
`,De=`
  uniform vec3 uFrom;
  uniform vec3 uTo;
  uniform vec3 uDeepFrom;
  uniform vec3 uDeepTo;
  uniform vec3 uPaper;
  uniform float uWipe;
  uniform float uPaperMix;
  uniform float uDeepMix;
  uniform vec2 uCenter;
  uniform float uAspect;
  uniform float uTime;
  uniform float uSpot;
  varying vec2 vUv;

  uniform float uFrame;
  float h(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
  // integer hash for the grain: sin-based hashes band into visible scanlines at pixel coordinates
  float grainHash(uvec2 p) {
    p = p * uvec2(1597334673u, 3812015801u);
    uint n = (p.x ^ p.y) * 1597334673u;
    return float(n) * (1.0 / 4294967295.0);
  }
  float n(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y);
  }

  void main() {
    vec2 p = (vUv - uCenter) * vec2(uAspect, 1.0);
    float d = length(p);
    float ang = atan(p.y, p.x);
    float live = sin(clamp(uWipe, 0.0, 1.0) * 3.14159);
    float wob = (n(vec2(ang * 2.2, uTime * 1.3)) - 0.5) * 0.12 + (n(vec2(ang * 7.0, -uTime * 2.0)) - 0.5) * 0.04;
    float radius = uWipe * (1.25 * max(uAspect, 1.0) + 0.4);
    float de = d + wob * live;
    float inside = 1.0 - smoothstep(radius - 0.004, radius + 0.004, de);
    vec3 flood = mix(uFrom, uTo, inside);
    vec3 deep = mix(uDeepFrom, uDeepTo, inside);
    vec3 col = mix(flood, deep, uDeepMix);
    // meniscus: a bright lip and a soft shadow riding the edge of the pour
    float lip = smoothstep(0.035, 0.0, abs(de - radius + 0.012)) * live;
    float shade = smoothstep(0.0, 0.09, radius - de) * (1.0 - smoothstep(0.09, 0.25, radius - de)) * live;
    col = mix(col, col * 0.86, shade * 0.6);
    col += lip * 0.12;
    // spotlight behind the subject + vignette
    vec2 q = (vUv - vec2(0.5, 0.52)) * vec2(uAspect, 1.0);
    col *= 1.0 + uSpot * 0.16 * exp(-dot(q, q) * 2.6);
    col *= 1.0 - 0.22 * smoothstep(0.35, 1.25, length((vUv - 0.5) * vec2(uAspect, 1.0)));
    col = mix(col, uPaper, uPaperMix);
    // film grain lives here (not in a DOM overlay): a blended full-screen DOM layer cost ~13fps at DPR 2
    float g = grainHash(uvec2(gl_FragCoord.xy) + uvec2(uint(uFrame) * 7919u, uint(uFrame) * 104729u)) - 0.5;
    col += g * 0.032 * (0.6 + 0.4 * (1.0 - uPaperMix));
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;function Oe(){let{size:e}=M(),t=(0,B.useRef)(),n=(0,B.useRef)({formula:P.formula,wipe:1}),i=(0,B.useMemo)(()=>{let e=F();return new r({uniforms:{uFrom:{value:new D(e.bg)},uTo:{value:new D(e.bg)},uDeepFrom:{value:new D(e.bgDeep)},uDeepTo:{value:new D(e.bgDeep)},uPaper:{value:new D(fe.paper)},uWipe:{value:1},uPaperMix:{value:0},uDeepMix:{value:0},uCenter:{value:new f(.5,.5)},uAspect:{value:1},uTime:{value:0},uSpot:{value:1},uFrame:{value:0}},vertexShader:Ee,fragmentShader:De,depthTest:!1,depthWrite:!1,toneMapped:!1})},[]);return x((t,r)=>{let a=i.uniforms,o=n.current;if(o.formula!==P.formula){a.uFrom.value.copy(a.uTo.value),a.uDeepFrom.value.copy(a.uDeepTo.value);let e=F();a.uTo.value.set(e.bg),a.uDeepTo.value.set(e.bgDeep),o.formula=P.formula,o.wipe=0,a.uCenter.value.set(P.bearScreen.x,1-P.bearScreen.y)}o.wipe<1&&(o.wipe=Math.min(1,o.wipe+r/(P.reduced?.35:1.15)),o.wipe>=1&&(a.uFrom.value.copy(a.uTo.value),a.uDeepFrom.value.copy(a.uDeepTo.value)));let s=o.wipe;a.uWipe.value=s<.5?2*s*s:1-(-2*s+2)**2/2,P.reduced&&(a.uWipe.value=s),a.uAspect.value=e.width/e.height,a.uTime.value=t.clock.elapsedTime,a.uFrame.value=(a.uFrame.value+1)%4096;let c=P.stage;c&&(a.uPaperMix.value=U(a.uPaperMix.value,c.paper,8,r),a.uDeepMix.value=U(a.uDeepMix.value,c.deep,8,r))},-1),(0,K.jsx)(`mesh`,{ref:t,frustumCulled:!1,renderOrder:-1e3,material:i,children:(0,K.jsx)(`planeGeometry`,{args:[2,2]})})}var ke=-2.4,q=`"Bricolage Grotesque Variable", "Arial Black", sans-serif`;function J(e,t,n){let r=e.getContext(`2d`),i=e.width,a=e.height;r.clearRect(0,0,i,a),r.fillStyle=`#fff`,r.textAlign=`center`,r.textBaseline=`alphabetic`;let o=n?Y(t):[t],s=1e3;r.font=`800 condensed ${s}px ${q}`;let c=Math.max(...o.map(e=>r.measureText(e).width));s=Math.floor(s*i*.985/c);let l=a/o.length*1.18;s=Math.min(s,l),r.font=`800 condensed ${s}px ${q}`;let u=r.measureText(`WOBL`).actualBoundingBoxAscent,d=u*1.08,f=(a-(d*o.length-(d-u)))/2+u;for(let e of o)r.fillText(e,i/2,f),f+=d}function Y(e){let t=Math.ceil(e.length/2);return[e.slice(0,t),e.slice(t)]}function X(e){return(0,B.useMemo)(()=>{let t=document.createElement(`canvas`);t.width=2048,t.height=e?2048:1060;let n=new w(t);return n.anisotropy=4,n.colorSpace=le,{canvas:t,texture:n}},[e])}function Ae(){let{size:e}=M(),t=e.width/e.height<.9,n=X(t),r=X(t),i=(0,B.useRef)(),a=(0,B.useRef)(),o=(0,B.useRef)({front:`A`,text:``,opA:0,opB:0,sqA:1,sqB:1}),s=(0,B.useMemo)(()=>new D(F().wordmark),[]),c=(0,B.useMemo)(()=>new g({map:n.texture,transparent:!0,toneMapped:!1,depthWrite:!1,color:s,opacity:0}),[n,s]),l=(0,B.useMemo)(()=>new g({map:r.texture,transparent:!0,toneMapped:!1,depthWrite:!1,color:s,opacity:0}),[r,s]);return(0,B.useEffect)(()=>{o.current.text=``},[t]),x((u,d)=>{let f=P.stage;if(!f)return;let p=o.current,m=f.wordMode>.5?F().name.toUpperCase():fe.wordmark;if(m!==p.text&&P.fontsReady){p.text=m,p.front=p.front===`A`?`B`:`A`;let e=p.front===`A`?n:r;J(e.canvas,m,t),e.texture.needsUpdate=!0,p.front===`A`?p.sqA=1.35:p.sqB=1.35}let h=f.word;p.opA=U(p.opA,p.front===`A`?h:0,7,d),p.opB=U(p.opB,p.front===`B`?h:0,7,d),p.sqA=U(p.sqA,p.front===`A`?1:.7,6,d),p.sqB=U(p.sqB,p.front===`B`?1:.7,6,d);let g=F(),_=1-Math.exp(-4*d);s.set(g.wordmark),c.color.lerp(s,_),l.color.lerp(s,_);let v=me-ke,y=2*Math.tan(se.degToRad(15))*v,b=y*(e.width/e.height),x=b*(t?.92:.94),S=x*(n.canvas.height/n.canvas.width),C=P.reduced?0:Math.sin(u.clock.elapsedTime*.21)*.018,w=(-P.pointer.nx*.035+C+(f.wordX||0))*b,ee=-P.pointer.ny*.01*y+(f.wordY||0)*y;for(let[e,t,n,r]of[[i,c,p.opA,p.sqA],[a,l,p.opB,p.sqB]]){let i=e.current;i.scale.set(x,S*r,1),i.position.set(w,ee,ke),t.opacity=n,i.visible=n>.004}},-1),(0,K.jsxs)(`group`,{children:[(0,K.jsx)(`mesh`,{ref:i,material:c,renderOrder:-900,children:(0,K.jsx)(`planeGeometry`,{args:[1,1]})}),(0,K.jsx)(`mesh`,{ref:a,material:l,renderOrder:-900,children:(0,K.jsx)(`planeGeometry`,{args:[1,1]})})]})}var je=`
uniform float uTime;
uniform vec3  uLean;      // displacement of the top of the head (height-weighted)
uniform float uSquash;    // +squash / -stretch about the feet
uniform vec3  uDentPos;   // poke point (rest space)
uniform vec3  uDentN;     // poke normal (rest space)
uniform float uDent;      // dent depth (spring)
uniform float uRipple;    // seconds since poke
uniform float uRippleAmp;
uniform float uBreath;    // signed breathing value
uniform mat3  uHeadRot;   // head rotation around the neck pivot
uniform vec3  uNeck;
uniform float uBlob;      // 0 = bear, 1 = sphere (preloader drop)
uniform float uWobble;    // jelly noise amplitude
`,Me=`
vec3 wobDeform(vec3 p0) {
  vec3 p = p0;
  const vec3 C = vec3(0.0, 0.95, 0.0);
  if (uBlob > 0.0001) {
    vec3 d = p - C;
    vec3 s = C + normalize(d + 1e-5) * vec3(0.66, 0.6, 0.6);
    s.y -= 0.32;
    p = mix(p, s, uBlob);
  }
  // breathing: belly swells
  float bw = exp(-pow((p0.y - 0.62) / 0.34, 2.0));
  p.xz *= 1.0 + uBreath * bw * 0.045;
  p.z += uBreath * bw * 0.018;
  // head turns around the neck
  float hw = smoothstep(uNeck.y - 0.16, uNeck.y + 0.16, p0.y) * (1.0 - uBlob);
  p = mix(p, uHeadRot * (p - uNeck) + uNeck, hw);
  // jelly noise
  vec3 radial = normalize(vec3(p.x, (p.y - C.y) * 0.45, p.z) + 1e-5);
  float w = sin(p0.y * 5.1 + uTime * 8.3) * 0.55 + sin(p0.x * 6.3 - uTime * 6.1 + p0.z * 3.0) * 0.45;
  p += radial * w * uWobble * 0.05;
  // poke dent + ripple
  float dd = distance(p0, uDentPos);
  p -= uDentN * uDent * exp(-dd * dd / 0.045) * 0.24;
  float rip = sin(dd * 21.0 - uRipple * 19.0) * exp(-uRipple * 2.4) * exp(-dd * 1.4) * uRippleAmp;
  p += radial * rip * 0.03;
  // inertial lean, feet stay planted
  float h = clamp(p.y / 1.95, 0.0, 1.25);
  p += uLean * h * h;
  // squash & stretch about the feet
  p.y *= 1.0 - uSquash;
  p.xz *= 1.0 + uSquash * 0.55;
  return p;
}

vec3 wobNormal(vec3 p0, vec3 n0, vec3 P) {
  vec3 t = normalize(abs(n0.y) < 0.95 ? cross(n0, vec3(0.0, 1.0, 0.0)) : cross(n0, vec3(1.0, 0.0, 0.0)));
  vec3 b = cross(n0, t);
  const float e = 0.012;
  vec3 pt = wobDeform(p0 + t * e);
  vec3 pb = wobDeform(p0 + b * e);
  vec3 n = normalize(cross(pt - P, pb - P));
  return dot(n, n0) < -0.2 ? -n : n;
}
`,Ne=`
float wHash(vec3 p) {
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float wNoise(vec3 x) {
  vec3 i = floor(x);
  vec3 f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(wHash(i + vec3(0, 0, 0)), wHash(i + vec3(1, 0, 0)), f.x),
                 mix(wHash(i + vec3(0, 1, 0)), wHash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(wHash(i + vec3(0, 0, 1)), wHash(i + vec3(1, 0, 1)), f.x),
                 mix(wHash(i + vec3(0, 1, 1)), wHash(i + vec3(1, 1, 1)), f.x), f.y), f.z);
}
vec3 wNoise3(vec3 x) {
  return vec3(wNoise(x), wNoise(x + vec3(31.7, 11.3, 5.1)), wNoise(x + vec3(-7.9, 23.4, 17.2))) * 2.0 - 1.0;
}
`,Pe=`
  ${je}
  ${Me}
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vRestPos;
  void main() {
    vec3 P = wobDeform(position);
    vec3 N = wobNormal(position, normal, P);
    vRestPos = position;
    vec4 wp = modelMatrix * vec4(P, 1.0);
    vWorldPos = wp.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * N);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`,Fe=`
  uniform mat4 projectionMatrix;
  uniform mat4 modelMatrix;
  uniform sampler2D buffer;
  uniform sampler2D envMap;
  uniform float uEnvIntensity;
  uniform vec3 uTint;
  uniform vec3 uAtten;
  uniform float uAttenDist;
  uniform float uThickness;
  uniform float uIor;
  uniform float uRough;
  uniform float uAberr;
  uniform vec3 uGlow;
  uniform float uRim;
  uniform float uCore;
  uniform float uSugar;
  uniform float uSheen;
  uniform vec3 uKeyDir;
  uniform vec3 uKeyColor;
  uniform vec3 uRimDir;
  uniform vec3 uRimColor;
  uniform float uOpacity;
  uniform float uLens;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying vec3 vRestPos;

  ${Ne}
  #include <common>
  #include <cube_uv_reflection_fragment>

  float ign(vec2 p) { return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }

  void main() {
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 N = normalize(vWorldNormal);
    if (!gl_FrontFacing) N = -N;
    // sugar micro-relief
    N = normalize(N + wNoise3(vRestPos * 85.0) * 0.045 * uSugar);
    float NdV = clamp(dot(N, V), 0.0, 1.0);

    // ---------------------------------------------------------------- refraction
    mat4 vp = projectionMatrix * viewMatrix;
    vec4 c0 = vp * vec4(vWorldPos, 1.0);
    // ball-lens cheat: a thick convex jelly magnifies and flips what's behind it toward the rim
    vec3 nv = normalize((viewMatrix * vec4(N, 0.0)).xyz);
    vec2 lens = -nv.xy * uLens * (1.0 - NdV * 0.5);
    float scale = length(modelMatrix[0].xyz);
    float th = uThickness * scale * (0.35 + 0.65 * NdV);
    float rnd = ign(gl_FragCoord.xy);
    vec3 trans = vec3(0.0);
    for (float i = 0.0; i < SAMPLES; i++) {
      float sp = (i + rnd) / SAMPLES;
      vec3 j = vec3(fract(rnd * 7.13 + i * 0.618), fract(rnd * 3.71 + i * 0.414), fract(rnd * 5.37 + i * 0.732)) - 0.5;
      vec3 sn = normalize(N + j * uRough);
      float t = th * (0.85 + 0.3 * sp);
      vec3 rr = refract(-V, sn, 1.0 / uIor) * t;
      vec3 rb = refract(-V, sn, 1.0 / (uIor * (1.0 + 2.0 * uAberr * sp))) * t;
      vec4 cr = c0 + vp * vec4(rr, 0.0);
      vec4 cb = c0 + vp * vec4(rb, 0.0);
      vec2 uvr = clamp(cr.xy / cr.w * 0.5 + 0.5 + lens, 0.001, 0.999);
      vec2 uvb = clamp(cb.xy / cb.w * 0.5 + 0.5 + lens * (1.0 + uAberr * 2.0), 0.001, 0.999);
      trans.r += texture2D(buffer, uvr).r;
      trans.g += texture2D(buffer, mix(uvr, uvb, 0.5)).g;
      trans.b += texture2D(buffer, uvb).b;
    }
    trans /= SAMPLES;
    // Beer–Lambert: thick middle gets deep and saturated, thin edges stay bright
    vec3 coef = -log(max(uAtten, vec3(1e-3))) / uAttenDist;
    trans *= exp(-coef * th) * uTint;
    // light scattered inside never lets the jelly go muddy
    trans = max(trans, uGlow * uTint * 0.16);

    // ---------------------------------------------------------------- reflection
    float F0 = pow((uIor - 1.0) / (uIor + 1.0), 2.0);
    float F = F0 + (1.0 - F0) * pow(1.0 - NdV, 5.0);
    vec3 R = reflect(-V, N);
    vec3 env = textureCubeUV(envMap, R, 0.12).rgb * uEnvIntensity;
    vec3 irr = textureCubeUV(envMap, N, 1.0).rgb * uEnvIntensity;

    // key light spec (GGX-ish via normalized Blinn-Phong) + rim light
    vec3 H = normalize(uKeyDir + V);
    float NdH = max(dot(N, H), 0.0);
    float spec = pow(NdH, 180.0) * 2.4 + pow(NdH, 24.0) * 0.18;
    vec3 col = mix(trans, env, F);
    col += uKeyColor * spec * (0.25 + F);
    float rimL = pow(1.0 - NdV, 2.0) * max(dot(N, uRimDir), 0.0);
    col += uRimColor * rimL * 0.9;
    // a touch of diffuse scatter so the jelly reads as a solid, not a lens
    col += irr * uTint * 0.06;

    // sugar sheen: soft white fuzz at grazing angles
    col += vec3(1.0) * pow(1.0 - NdV, 3.5) * uSheen;

    // subsurface glow
    col += uGlow * (pow(1.0 - NdV, 2.4) * uRim + pow(NdV, 4.0) * uCore);

    gl_FragColor = vec4(col, uOpacity);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;function Ie({samples:e=4,deformUniforms:t}){let n=new r({uniforms:{...t,buffer:{value:null},envMap:{value:null},uEnvIntensity:{value:1},uTint:{value:new D(`#ffffff`)},uAtten:{value:new D(`#a050ff`)},uAttenDist:{value:1.2},uThickness:{value:1.1},uIor:{value:1.42},uRough:{value:.03},uAberr:{value:.06},uGlow:{value:new D(`#ffd0ff`)},uRim:{value:.45},uCore:{value:.08},uSugar:{value:1},uSheen:{value:.22},uKeyDir:{value:new A(-.45,.65,.6).normalize()},uKeyColor:{value:new D(`#fff6ee`)},uRimDir:{value:new A(.6,.35,-.7).normalize()},uRimColor:{value:new D(`#ffffff`)},uOpacity:{value:1},uLens:{value:.07}},defines:{SAMPLES:e.toFixed(1)},vertexShader:Pe,fragmentShader:Fe});return n.toneMapped=!0,n}function Le(e,t){e.uniforms.envMap.value=t;let n=t.image.height,r=Math.log2(n)-2,i=1/n,a=1/(3*Math.max(2**r,112));e.defines.CUBEUV_TEXEL_WIDTH=a,e.defines.CUBEUV_TEXEL_HEIGHT=i,e.defines.CUBEUV_MAX_MIP=r.toFixed(1),e.defines.ENVMAP_TYPE_CUBE_UV=``,e.needsUpdate=!0}var Re=new A(0,.95,0),ze=new A,Be=new A,Ve=(e,t,n)=>{let r=Math.min(1,Math.max(0,(n-e)/(t-e)));return r*r*(3-2*r)};function He(e,t,n=new A){n.copy(e);let r=t.uBlob.value;r>1e-4&&(ze.copy(e).sub(Re).normalize().multiply(Be.set(.66,.6,.6)).add(Re),ze.y-=.32,n.lerp(ze,r));let i=Math.exp(-(((e.y-.62)/.34)**2)),a=t.uBreath.value;n.x*=1+a*i*.045,n.z*=1+a*i*.045,n.z+=a*i*.018;let o=t.uNeck.value,s=Ve(o.y-.16,o.y+.16,e.y)*(1-r);ze.copy(n).sub(o).applyMatrix3(t.uHeadRot.value).add(o),n.lerp(ze,s);let c=Math.min(1.25,Math.max(0,n.y/1.95));n.addScaledVector(t.uLean.value,c*c);let l=t.uSquash.value;return n.y*=1-l,n.x*=1+l*.55,n.z*=1+l*.55,n}function Ue(){return{uTime:{value:0},uLean:{value:new A},uSquash:{value:0},uDentPos:{value:new A(0,1,.5)},uDentN:{value:new A(0,0,1)},uDent:{value:0},uRipple:{value:10},uRippleAmp:{value:0},uBreath:{value:0},uHeadRot:{value:new _},uNeck:{value:new A(0,1.1,0)},uBlob:{value:0},uWobble:{value:0}}}var Z={OFFENDED:`OFFENDED`,JUDGING:`JUDGING YOU`,SUSPICIOUS:`SUSPICIOUS`,DROWSY:`DROWSY`,ASLEEP:`ASLEEP`,STARTLED:`STARTLED`,DIZZY:`DIZZY`,RECOVERING:`RECOVERING`,SULK:`NOT TALKING TO YOU`,FINE:`FINE. HI.`,CURIOUS:`CURIOUS`},We=class{constructor(){this.t=0,this.state=`awake`,this.stateT=0,this.eyeYaw=new H(0,200,26),this.eyePitch=new H(0,200,26),this.headYaw=new H(0,60,13),this.headPitch=new H(0,60,13),this.headRoll=new H(0,40,8),this.bodyYaw=new H(0,16,7),this.bodyPitch=new H(0,16,7),this.lean=new Te(70,6),this.squash=new H(0,150,7),this.dent=new H(0,170,9),this.lidU=new H(0,220,26),this.lidL=new H(0,220,26),this.pupil=new H(1,120,14),this.turn=new H(0,14,6),this.mCurve=new H(.5,140,13),this.mOpen=new H(0,160,14),this.mWidth=new H(1,140,13),this.mSkew=new H(0,120,12),this.hop={y:0,v:0},this.ripple=10,this.rippleAmp=0,this.dentPoint=[0,1.2,.5],this.dentNormal=[0,0,1],this.nextBlink=2,this.blink=0,this.nextSaccade=1,this.sacc=[0,0],this.flips=[],this.lastSign=0,this.pokes=[],this.nextHop=1.5,this.energy=0,this.awayT=0,this.events=[],this.out={eyeYaw:0,eyePitch:0,headYaw:0,headPitch:0,headRoll:0,bodyYaw:0,bodyPitch:0,lidU:0,lidL:0,pupil:1,spiral:0,lean:[0,0,0],squash:0,dent:0,dentPoint:this.dentPoint,dentNormal:this.dentNormal,ripple:10,rippleAmp:0,breath:0,wobble:0,hopY:0,zzz:0,mood:`WAKING`,gazeDeg:0,energy:0}}set(e){this.state!==e&&(this.state=e,this.stateT=0)}poke(e,t,n=1){let r=W(n,.6,1.8);this.dentPoint[0]=e.x,this.dentPoint[1]=e.y,this.dentPoint[2]=e.z,this.dentNormal[0]=t.x,this.dentNormal[1]=t.y,this.dentNormal[2]=t.z,this.dent.impulse(9*r),this.squash.impulse(2.2*r),this.lean.impulse(-t.x*1.4*r,0,-t.z*1.4*r),this.headRoll.impulse((e.x>0?1:-1)*2.5*r),this.ripple=0,this.rippleAmp=1,this.pokes.push(this.t),this.pokes=this.pokes.filter(e=>this.t-e<5),this.events.push(`squish`),this.state===`asleep`?this.wake():this.pokes.length>=5&&this.state!==`sulk`?(this.set(`sulk`),this.pokes=[]):this.state!==`sulk`&&this.set(`offended`)}wake(){this.set(`startled`),this.squash.impulse(-3.2),this.hop.v=2.2,this.events.push(`boing`)}update(e,t){let n=t.personality,r=this.out,i=t.reduced;this.t+=e,this.stateT+=e;let a=this.t,o=n.speed;this.eyeYaw.k=this.eyePitch.k=G(70,320,o),this.eyeYaw.c=this.eyePitch.c=2*Math.sqrt(this.eyeYaw.k)*.85,this.headYaw.k=this.headPitch.k=G(22,90,o),this.headYaw.c=this.headPitch.c=2*Math.sqrt(this.headYaw.k)*.8,this.bodyYaw.k=this.bodyPitch.k=G(7,26,o),this.bodyYaw.c=this.bodyPitch.c=2*Math.sqrt(this.bodyYaw.k)*.75;let s=i?0:n.jelly;if(this.lean.c=G(16,4.5,s),this.squash.c=G(18,5.5,s),t.mode!==`intro`){let e=t.pointerVx,n=Math.sign(e);Math.abs(e)>1100&&n!==0&&n!==this.lastSign&&(this.flips.push(a),this.lastSign=n),this.flips=this.flips.filter(e=>a-e<1.2),this.flips.length>=6&&this.state!==`dizzy`&&this.state!==`asleep`&&!i&&(this.set(`dizzy`),this.flips=[],this.events.push(`dizzy`))}let c=this.state,l=n.sleepAfter??8,u=n.baseMood||Z.CURIOUS;t.mode===`intro`?u=`WAKING UP`:c===`awake`?(t.mode===`footer`?(t.pointerNear<.5?this.awayT+=e:this.awayT=0,this.awayT>2.5&&this.set(`asleep`)):t.idle>l-2.5&&this.set(`drowsy`),this.suspicion=t.hover?(this.suspicion||0)+e:0,this.suspicion>.9&&(u=Z.SUSPICIOUS)):c===`drowsy`?(u=Z.DROWSY,t.idle<.2?this.set(`awake`):t.idle>l&&this.set(`asleep`)):c===`asleep`?(u=Z.ASLEEP,(t.mode===`footer`?t.pointerNear>.62:t.idle<.15&&t.pointerSpeed>40)&&this.stateT>.6&&this.wake()):c===`startled`?(u=Z.STARTLED,this.stateT>1&&this.set(`awake`)):c===`offended`?(u=Z.OFFENDED,this.stateT>.45&&this.set(`judging`)):c===`judging`?(u=Z.JUDGING,this.stateT>2.8&&this.set(`awake`)):c===`dizzy`?(u=Z.DIZZY,this.stateT>3&&this.set(`recovering`)):c===`recovering`?(u=Z.RECOVERING,this.stateT>1.2&&this.set(`awake`)):c===`sulk`&&(u=this.stateT>3.2?Z.FINE:Z.SULK,this.stateT>4.4&&this.set(`awake`)),this.state===`awake`&&t.ritual>=0&&u!==Z.SUSPICIOUS&&(u=[`CHEWING`,`DOING NOTHING`,`SMUG ABOUT IT`][t.ritual]||u),t.mode===`footer`&&this.state===`drowsy`&&this.set(`asleep`),t.mode===`footer`&&c===`awake`&&this.stateT<.05&&t.pointerNear<.3&&this.set(`asleep`);let d=this.state,f=d===`asleep`,p=W(t.gazeYaw,-1.1,1.1),m=W(t.gazePitch,-.6,.6);if(this.nextSaccade-=e,this.nextSaccade<0){let e=G(.04,.16,n.saccade);this.sacc[0]=(Math.random()-.5)*2*e,this.sacc[1]=(Math.random()-.5)*e,this.nextSaccade=G(3.5,.45,n.saccade)*(.6+Math.random()*.8)}let h=0,g=0,_=0;if(f)p=0,m=-.35,h=-.28,g=.2,_=.06;else if(d===`drowsy`)h=-.12*W((t.idle-(l-2.5))/2.5,0,1),g=.08;else if(d===`dizzy`){let e=Math.max(0,1-this.stateT/3);p+=Math.sin(a*9)*.25*e,g=Math.sin(a*6.5)*.28*e}else d===`judging`?(g=-.14,h=-.05):d===`startled`&&(h=.1);let v=p+(f?0:this.sacc[0]),y=m+(f?0:this.sacc[1]);this.eyeYaw.update(e,v),this.eyePitch.update(e,y),this.headYaw.update(e,W(p*.6,-.6,.6)),this.headPitch.update(e,W(m*.5,-.3,.3)+h),this.headRoll.update(e,g+this.headYaw.v*-.02),this.bodyYaw.update(e,W(p*.28,-.45,.45)),this.bodyPitch.update(e,W(m*.1,-.1,.1)+_),this.turn.update(e,d===`sulk`&&this.stateT<3.2?Math.PI*.92:d===`sulk`?.55:0),this.nextBlink-=e,this.nextBlink<0&&!f&&(this.blink=1,this.nextBlink=1.6+Math.random()*4*(1.2-n.speed*.4),Math.random()<.18&&(this.nextBlink=.22)),this.blink=Math.max(0,this.blink-e*7);let b=this.blink>0?Math.sin(this.blink*Math.PI):0,x=n.droop,S=0,C=1;u===Z.SUSPICIOUS&&(x=Math.max(x,.42),S=.28,C=.82),d===`drowsy`&&(x=G(n.droop,.85,W((t.idle-(l-2.5))/2.5,0,1))),f&&(x=1,S=.15),d===`startled`&&(x=-.3,C=.62),d===`offended`&&(x=1,S=.55),d===`judging`&&(x=.5,S=.3,C=.72),d===`recovering`&&(x=.55),u===`DOING NOTHING`&&(x=Math.max(x,.55)),u===`SMUG ABOUT IT`&&(x=Math.max(x,.32)),d===`sulk`&&(x=.45,S=.2),x=Math.max(x,b),this.lidU.update(e,x),this.lidL.update(e,Math.max(S,b*.25));let w=1+t.pointerNear*.12;if(this.pupil.update(e,C*w),this.lean.impulse(-this.headYaw.v*.05,0,this.headPitch.v*.05),this.lean.impulse(-t.moveV.x*.9*e*60*.02,0,0),t.pointerNear>.4&&!f){let e=9e-5*t.pointerNear*s;this.lean.impulse(t.pointerVx*e,0,0)}let ee=[0,0,0];if(d===`dizzy`){let e=Math.max(0,1-this.stateT/3)*.16;ee=[Math.cos(a*7)*e,0,Math.sin(a*7)*e]}this.lean.update(e,ee[0],ee[1],ee[2]);let te=W(t.scrollV*.004,-.1,.1)*s;this.squash.update(e,te),this.dent.update(e,0),this.ripple+=e,this.rippleAmp=Math.max(0,this.rippleAmp-e*.5),n.bounce>.01&&d===`awake`&&!i&&(this.nextHop-=e,this.nextHop<0&&this.hop.y===0&&(this.hop.v=1.5+n.bounce*.7,this.squash.impulse(-1.6*n.bounce),this.nextHop=1.1+Math.random()*1.4)),(this.hop.y>0||this.hop.v>0)&&(this.hop.v-=12*e,this.hop.y+=this.hop.v*e,this.hop.y<=0&&(this.squash.impulse(Math.min(3,-this.hop.v*.9)),this.hop.y=0,this.hop.v=0));let T=f?1.7:d===`drowsy`?1.2:n.breath,ne=f?.16:n.breathRate;this.breathPhase=(this.breathPhase||0)+e*ne*Math.PI*2;let E=Math.sin(this.breathPhase)*T*(i?.4:1),re=Math.hypot(this.lean.x[0],this.lean.x[2])*3+Math.abs(this.squash.x)*4+Math.abs(this.dent.x)*.6+Math.abs(this.squash.v)*.05+(d===`dizzy`?.5:0);this.energy=U(this.energy,W(re,0,1),6,e);let D={CURIOUS:[.55,0,.8,0],DREAMY:[.3,0,.6,0],"LOCKED IN":[0,0,.62,0],SERENE:[.45,0,.7,0],SMUG:[.9,0,1,.45],SUSPICIOUS:[-.15,0,.5,.5],"JUDGING YOU":[-.4,0,.75,-.2],OFFENDED:[-.9,.25,.75,0],STARTLED:[0,1,.42,0],DIZZY:[Math.sin(a*9)*.7,.25,.8,Math.sin(a*6)*.4],RECOVERING:[-.1,.1,.6,.2],ASLEEP:[0,.32+E*.08,.3,0],DROWSY:[.1,.12,.45,0],"NOT TALKING TO YOU":[-.7,0,.7,.3],CHEWING:[.2,Math.max(0,Math.sin(a*9))*.55,.55,Math.sin(a*4.5)*.2],"DOING NOTHING":[.35,0,.55,0],"SMUG ABOUT IT":[1,0,1.05,.5],"FINE. HI.":[.25,0,.6,.4],"WAKING UP":[0,.6,.4,0]},O=D[u]||D.CURIOUS;this.mCurve.update(e,O[0]),this.mOpen.update(e,O[1]),this.mWidth.update(e,O[2]),this.mSkew.update(e,O[3]);let k=W(this.eyeYaw.x-this.headYaw.x-this.bodyYaw.x,-.55,.55),ie=W(this.eyePitch.x-this.headPitch.x-this.bodyPitch.x,-.4,.4);r.eyeYaw=k,r.eyePitch=ie,r.headYaw=this.headYaw.x-this.bodyYaw.x,r.headPitch=this.headPitch.x-this.bodyPitch.x,r.headRoll=this.headRoll.x,r.bodyYaw=this.bodyYaw.x+this.turn.x,r.bodyPitch=this.bodyPitch.x,r.lidU=this.lidU.x,r.lidL=this.lidL.x,r.pupil=this.pupil.x,r.spiral=+(d===`dizzy`),r.lean=this.lean.x,r.squash=this.squash.x,r.dent=Math.max(0,this.dent.x),r.ripple=this.ripple,r.rippleAmp=this.rippleAmp,r.breath=E,r.wobble=(i?0:.08*s)+this.energy*.5+(d===`dizzy`?.3:0),r.hopY=this.hop.y,r.zzz=+!!f,r.mood=u,r.gazeDeg=this.eyeYaw.x*180/Math.PI,r.energy=this.energy,r.state=d,r.mouthCurve=this.mCurve.x,r.mouthOpen=Math.max(0,this.mOpen.x),r.mouthWidth=this.mWidth.x,r.mouthSkew=this.mSkew.x}};function Ge(){let e=document.createElement(`canvas`);e.width=e.height=256;let t=e.getContext(`2d`);t.translate(128,128),t.lineCap=`round`,t.strokeStyle=`#0d0a14`,t.lineWidth=15,t.beginPath();for(let e=0;e<Math.PI*7;e+=.05){let n=6+e*5.4,r=Math.cos(e)*n,i=Math.sin(e)*n;e===0?t.moveTo(r,i):t.lineTo(r,i)}t.stroke();let n=new w(e);return n.colorSpace=le,n}function Ke(){let e=document.createElement(`canvas`);e.width=e.height=128;let t=e.getContext(`2d`),n=t.createRadialGradient(64,64,0,64,64,64);return n.addColorStop(0,`rgba(0,0,0,0.85)`),n.addColorStop(.35,`rgba(0,0,0,0.45)`),n.addColorStop(1,`rgba(0,0,0,0)`),t.fillStyle=n,t.fillRect(0,0,128,128),new w(e)}function qe(){let e=document.createElement(`canvas`);e.width=e.height=128;let t=e.getContext(`2d`);t.fillStyle=`#ffffff`,t.font=`800 104px "Bricolage Grotesque Variable", system-ui, sans-serif`,t.textAlign=`center`,t.textBaseline=`middle`,t.fillText(`z`,64,70);let n=new w(e);return n.colorSpace=le,n}var Je=1.95,Ye=.95,Q=new A,$=new A,Xe=new s,Ze=new te,Qe=new o,$e=new p,et=new m,tt=new f,nt=new D(`#ffffff`),rt=[`speed`,`droop`,`saccade`,`breath`,`breathRate`,`bounce`,`jelly`,`sleepAfter`];function it(e,t,n){for(let r of rt)e[r]=U(e[r],t[r],2.5,n);return e}var at=`
  ${je}
  ${Me}
  attribute float aRand;
  uniform float uSize;
  uniform float uPixel;
  varying float vGlint;
  varying float vRand;
  varying float vFacing;
  void main() {
    vec3 P = wobDeform(position);
    vec3 N = normalize(normalMatrix * normal);
    vec4 mv = modelViewMatrix * vec4(P + normal * 0.006, 1.0);
    vec3 V = normalize(-mv.xyz);
    vec3 L = normalize(vec3(-0.4, 0.8, 0.6));
    vec3 R = reflect(-L, N);
    float spec = pow(max(dot(R, V), 0.0), 28.0);
    float tw = 0.5 + 0.5 * sin(uTime * (2.0 + aRand * 5.0) + aRand * 40.0);
    vGlint = spec * (0.4 + tw);
    vFacing = smoothstep(0.0, 0.35, dot(N, V));
    vRand = aRand;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = uPixel * uSize * (0.6 + aRand * 0.9) * (1.0 + vGlint * 1.6) * (6.0 / -mv.z);
  }
`,ot=`
  uniform float uOpacity;
  varying float vGlint;
  varying float vRand;
  varying float vFacing;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float core = smoothstep(0.5, 0.0, d);
    // tiny 4-point star on glints
    float star = max(smoothstep(0.08, 0.0, abs(c.x)) * smoothstep(0.5, 0.0, abs(c.y)),
                     smoothstep(0.08, 0.0, abs(c.y)) * smoothstep(0.5, 0.0, abs(c.x)));
    float a = (core * 0.2 + (core + star * 0.8) * vGlint) * vFacing * uOpacity;
    if (a < 0.003) discard;
    gl_FragColor = vec4(vec3(1.0), a);
  }
`,st=`
  ${je}
  ${Me}
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec3 P = wobDeform(position);
    P = vec3(0.0, 0.85, 0.05) + (P - vec3(0.0, 0.85, 0.0)) * 0.72;
    vec4 mv = modelViewMatrix * vec4(P, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`,ct=`
  uniform vec3 uColor;
  uniform float uStrength;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float f = pow(clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0), 2.2);
    gl_FragColor = vec4(uColor * f * uStrength, 1.0);
  }
`;function lt(){let e=ye(),t=(0,B.useMemo)(()=>Se(e),[e]),i=be(),{camera:l,size:u,gl:d,scene:f}=M(),m=he(),_=t.Bear.geometry,y=(0,B.useMemo)(()=>{let e=null;return i.scene.traverse(t=>t.isMesh&&!e&&(e=t.geometry)),e},[i]),b=(0,B.useMemo)(()=>{let e=e=>{let n=t[e];return{pos:n.position.clone(),quat:n.quaternion.clone()}},n=new a(t.Bear.geometry),r=new p(new A(0,1.24,3),new A(0,0,-1)).intersectObject(n)[0],i=r?{pos:r.point.clone().addScaledVector(r.face.normal,-.012),normal:r.face.normal.clone()}:{pos:new A(0,1.225,.5),normal:new A(0,0,1)};return{L:e(`EyeL`),R:e(`EyeR`),neck:t.Neck.position.clone(),mouth:i}},[t]),w=(0,B.useMemo)(()=>{let e=Ue();return e.uNeck.value.copy(b.neck),e},[b]),te=xe(),T=(0,B.useMemo)(()=>{let e=new C(d),t=e.fromEquirectangular(te);return e.dispose(),t.texture},[te,d]);(0,B.useEffect)(()=>{f.environment=T,f.environmentIntensity=1},[f,T]);let ne=(0,B.useMemo)(()=>{let e=Ie({samples:P.debug?.samples?Number(P.debug.samples):m.samples,deformUniforms:w}),t=pe[P.formula],n=e.uniforms;return n.uTint.value.set(t.gummy).lerp(nt,.62),n.uAtten.value.set(t.gummy).lerp(nt,.22),n.uAttenDist.value=2.4,n.uThickness.value=1.05,n.uIor.value=1.42,n.uRough.value=.035,n.uAberr.value=m.aberration,n.uGlow.value.set(t.glow),Le(e,T),e},[w,m.samples,m.aberration,T]),O=(0,B.useMemo)(()=>{let e=new a(_),t=new ae(e).build(),n=m.sparkles,i=new Float32Array(n*3),o=new Float32Array(n*3),s=new Float32Array(n),c=new A,l=new A;for(let e=0;e<n;e++)t.sample(c,l),i.set([c.x,c.y,c.z],e*3),o.set([l.x,l.y,l.z],e*3),s[e]=Math.random();let u=new oe;return u.setAttribute(`position`,new re(i,3)),u.setAttribute(`normal`,new re(o,3)),u.setAttribute(`aRand`,new re(s,1)),{g:u,m:new r({uniforms:{...w,uSize:{value:2.2},uPixel:{value:1},uOpacity:{value:1}},vertexShader:at,fragmentShader:ot,transparent:!0,depthWrite:!1,blending:2})}},[_,w,m.sparkles]),k=(0,B.useMemo)(()=>new r({uniforms:{...w,uColor:{value:new D(pe[P.formula].glow)},uStrength:{value:.55}},vertexShader:st,fragmentShader:ct,blending:2,depthWrite:!1,transparent:!0}),[w]),j=(0,B.useMemo)(()=>{let e=pe[P.formula];return{sclera:new E({color:`#fffaf2`,roughness:.18,clearcoat:1,clearcoatRoughness:.05,sheen:.3,sheenColor:new D(`#ffffff`)}),pupil:new E({color:`#0c0912`,roughness:.08,clearcoat:1,clearcoatRoughness:.02,metalness:0}),glint:new g({color:`#ffffff`,toneMapped:!1}),lid:new E({color:new D(e.gummy),roughness:.3,sheen:1,sheenColor:new D(`#ffffff`),sheenRoughness:.45,side:2}),spiral:new g({map:Ge(),transparent:!0,depthWrite:!1}),z:new g({map:qe(),transparent:!0,depthWrite:!1,toneMapped:!1}),lash:new g({color:`#1a0b16`})}},[]),N=(0,B.useMemo)(()=>({sclera:new v(1,40,28),pupil:new v(1,32,20),glint:new v(1,12,8),lidU:new v(1,40,14,0,Math.PI*2,0,Math.PI/2),lidL:new v(1,40,14,0,Math.PI*2,Math.PI/2,Math.PI/2),disc:new ie(1,40),lash:new c(.62,.075,8,28,Math.PI),z:new h(1,1)}),[]),le=(0,B.useMemo)(()=>{let e=new ee(.5,1,6,18);return e.rotateZ(Math.PI/2),{g:e,m:new r({uniforms:{uCurve:{value:.5},uOpen:{value:0},uWidth:{value:1},uSkew:{value:0}},vertexShader:`
        uniform float uCurve; uniform float uOpen; uniform float uWidth; uniform float uSkew;
        varying vec3 vN; varying vec3 vV;
        void main() {
          vec3 p = position;
          float x = p.x * uWidth;
          float y = p.y * (0.26 + uOpen * 1.5) + uCurve * (x * x) * 0.55 - uCurve * 0.12 + uSkew * x * 0.25;
          vec3 q = vec3(x, y, p.z * 0.3);
          vec4 mv = modelViewMatrix * vec4(q, 1.0);
          vN = normalize(normalMatrix * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,fragmentShader:`
        uniform float uOpen;
        varying vec3 vN; varying vec3 vV;
        void main() {
          float f = pow(1.0 - max(dot(normalize(vN), normalize(vV)), 0.0), 3.0);
          vec3 base = mix(vec3(0.07, 0.02, 0.06), vec3(0.32, 0.04, 0.12), uOpen * 0.6);
          gl_FragColor = vec4(base + f * 0.25, 1.0);
          #include <colorspace_fragment>
        }`})}},[]),ue=(0,B.useMemo)(()=>{let e=new S(1,2),t=new r({vertexShader:`
        varying vec3 vN; varying vec3 vV;
        void main() {
          vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
          vN = normalize(normalMatrix * mat3(instanceMatrix) * normal);
          vV = normalize(-mv.xyz);
          gl_Position = projectionMatrix * mv;
        }`,fragmentShader:`
        varying vec3 vN; varying vec3 vV;
        void main() {
          float ndv = max(dot(normalize(vN), normalize(vV)), 0.0);
          float rim = pow(1.0 - ndv, 2.5);
          float spec = pow(max(dot(reflect(-normalize(vec3(-0.4, 0.8, 0.6)), normalize(vN)), normalize(vV)), 0.0), 30.0);
          gl_FragColor = vec4(vec3(rim * 0.9 + spec * 1.5), 1.0);
        }`,transparent:!0,depthWrite:!1,blending:2}),n=new ce(e,t,46),i=new A,a=new o;for(let e=0;e<46;e++){let t=e%3==0,r=t?[0,1.42,0]:[0,.66,.02],o=t?[.34,.28,.26]:[.4,.42,.3];do i.set(Math.random()*2-1,Math.random()*2-1,Math.random()*2-1);while(i.lengthSq()>1);i.set(r[0]+i.x*o[0],r[1]+i.y*o[1],r[2]+i.z*o[2]);let c=.008+Math.random()**3*.035;a.compose(i,new s,new A(c,c*(.85+Math.random()*.3),c)),n.setMatrixAt(e,a)}return n.frustumCulled=!1,n.visible=!1,n},[]),fe=(0,B.useMemo)(()=>new g({map:Ke(),transparent:!0,depthWrite:!1,opacity:.3,color:`#000000`,toneMapped:!1}),[]),I=(0,B.useMemo)(()=>{let e=new n({color:pe[P.formula].gummy,roughness:.12,emissive:pe[P.formula].glow,emissiveIntensity:.35}),t=new ce(new S(1,2),e,14);return t.frustumCulled=!1,t.count=0,{mesh:t,mat:e,items:Array.from({length:14},()=>({p:new A,v:new A,r:0,life:0})),active:!1,t:0}},[]),L=(0,B.useRef)(),R=(0,B.useRef)(),z=(0,B.useRef)(),ge=(0,B.useRef)(),V=(0,B.useRef)(),_e={L:(0,B.useRef)(),R:(0,B.useRef)()},ve={L:(0,B.useRef)(),R:(0,B.useRef)()},Ce={L:(0,B.useRef)(),R:(0,B.useRef)()},we={L:(0,B.useRef)(),R:(0,B.useRef)()},Te={L:(0,B.useRef)(),R:(0,B.useRef)()},G={L:(0,B.useRef)(),R:(0,B.useRef)()},Ee={L:(0,B.useRef)(),R:(0,B.useRef)()},De={L:(0,B.useRef)(),R:(0,B.useRef)()},Oe=[(0,B.useRef)(),(0,B.useRef)(),(0,B.useRef)()],ke=(0,B.useRef)(),q=(0,B.useRef)(),J=(0,B.useRef)(),Y=(0,B.useMemo)(()=>new We,[]),X=(0,B.useMemo)(()=>({personality:{...pe[P.formula].personality},roll:new H(0,30,8),prev:new A,moveV:{x:0,y:0},targetColors:null,formula:-1,colGummy:new D,colTint:new D,colGlow:new D,colLid:new D,colBg:new D,lastIdle:0,readoutT:0}),[]);(0,B.useEffect)(()=>(P.bearAPI={brain:Y,rig:L,body:R,uniforms:w},()=>P.bearAPI=null),[Y,w]),x((e,t)=>{let n=Math.min(t,1/20),r=e.clock.elapsedTime;P.time=r;let i=P.stage;if(!L.current||!i)return;if(!P.bearCompiled){L.current.visible=!1,!P.bearCompiling&&P.precompile&&(P.bearCompiling=!0,P.precompile().then(()=>{P.bearCompiled=!0,P.bearReady=!0}));return}let a=F();it(X.personality,a.personality,n),X.personality.baseMood=a.baseMood;let o=1-Math.exp(-3.2*n),s=ne.uniforms;s.uAtten.value.lerp(X.colGummy.set(a.gummy).lerp(nt,.22),o),s.uTint.value.lerp(X.colTint.set(a.gummy).lerp(nt,.62),o),s.uGlow.value.lerp(X.colGlow.set(a.glow),o),k.uniforms.uColor.value.lerp(X.colGlow,o),j.lid.color.lerp(X.colLid.set(a.gummy).lerp(X.colBg.set(a.bg),.18),o);let c=2*Math.tan(se.degToRad(15))*me,f=c*(u.width/u.height),p=i.s*c/Je,m=P.intro;L.current.position.set(i.x*f/2,i.y*c/2+(m.done?0:m.y*c*.5),i.z||0);let h=se.smoothstep(i.visible,0,1);L.current.scale.setScalar(p*Math.max(1e-4,h)),L.current.visible=h>.001,X.moveV.x=U(X.moveV.x,(L.current.position.x-X.prev.x)/Math.max(n,.001),10,n),X.prev.copy(L.current.position);let g=P.pointer;Q.set(0,.55*p,.3*p).add(L.current.position);let _=0,v=0;P.tilt.enabled?(_=P.tilt.x*.9,v=P.tilt.y*.6):P.jarTarget&&i.watch>.5?($.copy(P.jarTarget).sub(Q),_=Math.atan2($.x,Math.max(.5,$.z+3)),v=Math.atan2($.y,3)):(tt.set(g.nx,g.ny),$e.setFromCamera(tt,l),et.set($.set(0,0,1),-(Q.z+2.4)),$e.ray.intersectPlane(et,$)&&($.sub(Q),_=Math.atan2($.x,$.z)-i.yaw,v=Math.atan2($.y,Math.hypot($.x,$.z))),g.active||(_*=.2,v*=.2)),$.copy(L.current.position).project(l);let x=$.x*.5+.5,S=-$.y*.5+.5,C=i.s*.5;P.bearScreen.x=x,P.bearScreen.y=S,P.bearScreen.r=C;let ee=u.width/u.height,te=(g.nx*.5+.5-x)*ee,T=-g.ny*.5+.5-S,E=W(1-(Math.hypot(te,T)-C*.7)/(C*1.6),0,1),re=!1;for(L.current.visible&&g.active&&E>.3&&y&&!P.debug?.noray&&(tt.set(g.nx,g.ny),$e.setFromCamera(tt,l),re=_t($e,y,z.current)!==null),P.bearScreen.hover=re;P.pokes.length;){let e=P.pokes.shift();if(!L.current.visible||!y)continue;tt.set(e.x,e.y),$e.setFromCamera(tt,l);let t=_t($e,y,z.current);if(t){let e=.8+Math.min(1,g.speed/2500);Y.poke(t.point,t.normal,e),P.lastPoke=r}}let D=Math.min(r-Math.max(g.lastMove,P.lastScroll||0,P.lastPoke||0),999),ie=m.done?i.footer>.5?`footer`:`normal`:`intro`;Y.update(n,{gazeYaw:_,gazePitch:v,pointerSpeed:g.speed,pointerVx:g.vx,pointerVy:g.vy,pointerNear:g.active?E:0,hover:re,idle:P.pointer.touch&&!P.tilt.enabled?Math.min(D,2):D,scrollV:P.scroll.v,moveV:X.moveV,personality:X.personality,mode:ie,reduced:P.reduced,ritual:i.paper>.5&&i.x>.3?P.ritualStep??-1:-1});let A=Y.out;for(;Y.events.length;)de(Y.events.shift());let M=i.footer>.5&&(A.state===`asleep`||A.state===`drowsy`)?Math.PI/2:0;X.roll.update(n,M*i.footer),R.current.rotation.set(A.bodyPitch+(i.pitch||0),A.bodyYaw+i.yaw,X.roll.x+(i.roll||0),`YXZ`);let ae=X.roll.x/(Math.PI/2);R.current.position.y=A.hopY+i.footer*se.lerp(Ye,.6,ae),w.uTime.value=r,w.uLean.value.set(A.lean[0],A.lean[1],A.lean[2]),w.uSquash.value=m.done?A.squash:m.squash+A.squash,w.uDentPos.value.fromArray(A.dentPoint),w.uDentN.value.fromArray(A.dentNormal),w.uDent.value=A.dent,w.uRipple.value=A.ripple,w.uRippleAmp.value=A.rippleAmp,w.uBreath.value=A.breath,w.uBlob.value=m.done?0:m.blob,w.uWobble.value=A.wobble+(m.done?0:m.wobble||0),Ze.set(-A.headPitch,A.headYaw,A.headRoll,`YXZ`),Xe.setFromEuler(Ze),Qe.makeRotationFromQuaternion(Xe),w.uHeadRot.value.setFromMatrix4(Qe);let oe=m.done?1:m.eyes;for(let e of[`L`,`R`]){let t=b[e],n=_e[e].current;if(!n)continue;He(Q.copy(t.pos).addScaledVector($.set(0,0,1).applyQuaternion(t.quat),-.035),w,n.position),n.quaternion.copy(Xe),n.scale.setScalar(.098*Math.max(1e-4,oe)),ve[e].current.rotation.set(-A.eyePitch,A.eyeYaw,0,`YXZ`),G[e].current.scale.set(.7*A.pupil,.7*A.pupil,.38),G[e].current.visible=A.spiral<.5,Ee[e].current.visible=A.lidU<.72&&A.spiral<.5,De[e].current.visible=A.lidU>.86&&A.spiral<.5;let i=W(A.lidU,-.3,1);Ce[e].current.rotation.x=-.95+i*2.52,we[e].current.rotation.x=se.lerp(Math.PI*.48,.05,W(A.lidL,0,1));let a=Te[e].current;a.visible=A.spiral>.5,a.rotation.z=(e===`L`?-1:1)*r*9}if(ke.current){let e=ke.current;He(b.mouth.pos,w,e.position),e.quaternion.copy(Xe),e.scale.setScalar(.105*Math.max(1e-4,oe));let t=le.m.uniforms;t.uCurve.value=A.mouthCurve,t.uOpen.value=A.mouthOpen,t.uWidth.value=A.mouthWidth,t.uSkew.value=A.mouthSkew}if(J.current){let e=1/(1+(Math.max(0,A.hopY)+(m.done?0:m.y*2.2))*1.4);J.current.scale.set(1.75*e*(1+A.squash*.6),.34*e,1),J.current.material.opacity=.32*e*(1-i.footer)*(m.done?1:Math.min(1,1-m.blob*.4)),J.current.visible=J.current.material.opacity>.01}if(P.intro.splat&&!I.active&&(P.intro.splat=!1,I.active=!0,I.t=0,I.mat.color.set(a.gummy),I.mat.emissive.set(a.glow),I.items.forEach((e,t)=>{let n=t/I.items.length*Math.PI*2+Math.random()*.4;e.p.set(Math.cos(n)*.5,.12,Math.sin(n)*.3+.1),e.v.set(Math.cos(n)*(1.4+Math.random()*1.6),2.2+Math.random()*2.4,Math.sin(n)*.8+.6),e.r=.035+Math.random()*.06,e.life=.7+Math.random()*.5})),I.active){I.t+=n;let e=0;I.items.forEach((t,r)=>{t.v.y-=11*n,t.p.addScaledVector(t.v,n),t.p.y<.03&&(t.p.y=.03,t.v.multiplyScalar(.3),t.v.y=Math.abs(t.v.y)*.4);let i=Math.max(0,1-I.t/t.life);i>0&&e++,Qe.compose(t.p,Xe.identity(),$.setScalar(t.r*Math.min(1,i*2.5))),I.mesh.setMatrixAt(r,Qe)}),I.mesh.count=I.items.length,I.mesh.instanceMatrix.needsUpdate=!0,e||(I.active=!1,I.mesh.count=0)}Q.set(.15,.8,.35).applyQuaternion(R.current.quaternion).add(R.current.position),Oe.forEach((e,t)=>{let n=e.current,a=(r*.35+t/3)%1;n.visible=A.zzz>.5&&(i.footer<.5||X.roll.x>1.2),n.position.set(Q.x+.15+a*.55+Math.sin(a*6+t)*.08,Q.y+.15+a*.9,Q.z),n.scale.setScalar(.2+a*.28),n.material.opacity=Math.sin(a*Math.PI)*.9}),O.m.uniforms.uPixel.value=d.getPixelRatio(),O.m.uniforms.uOpacity.value=m.done?1:1-m.blob;let ce=P.dive?.active?Math.min(1,Math.max(0,(P.dive.p-.12)/.18)):0;k.uniforms.uStrength.value=.55+ce*1.4,X.readoutT-=n,X.readoutT<0&&(X.readoutT=.1,P.readout.mood=A.mood,P.readout.gaze=A.gazeDeg,P.readout.wobble=A.energy,P.readout.state=A.state)},-1),(0,B.useEffect)(()=>{let e={active:()=>!!L.current?.visible,hide:()=>{ue.visible=!!L.current?.visible,z.current&&(z.current.visible=!1),ge.current&&(ge.current.visible=!1),q.current&&(q.current.visible=!1),V.current&&(V.current.visible=!!L.current?.visible)},show:()=>{ue.visible=!1,z.current&&(z.current.visible=!0),ge.current&&(ge.current.visible=!0),q.current&&(q.current.visible=!0),V.current&&(V.current.visible=!1)},setBuffer:e=>ne.uniforms.buffer.value=e};return P.refractors.push(e),()=>P.refractors.splice(P.refractors.indexOf(e),1)},[ne,ue]);let Ae=e=>(0,K.jsxs)(`group`,{ref:_e[e],children:[(0,K.jsx)(`mesh`,{geometry:N.sclera,material:j.sclera}),(0,K.jsx)(`group`,{ref:ve[e],children:(0,K.jsx)(`mesh`,{ref:G[e],geometry:N.pupil,material:j.pupil,position:[0,0,.66],scale:[.7,.7,.38]})}),(0,K.jsxs)(`group`,{ref:Ee[e],children:[(0,K.jsx)(`mesh`,{geometry:N.glint,material:j.glint,position:[-.28,.32,.97],scale:.12}),(0,K.jsx)(`mesh`,{geometry:N.glint,material:j.glint,position:[.2,-.26,1],scale:.045})]}),(0,K.jsx)(`mesh`,{ref:Te[e],geometry:N.disc,material:j.spiral,position:[0,0,1.02],scale:.8,visible:!1}),(0,K.jsx)(`mesh`,{ref:Ce[e],geometry:N.lidU,material:j.lid,scale:1.1}),(0,K.jsx)(`mesh`,{ref:we[e],geometry:N.lidL,material:j.lid,scale:1.09}),(0,K.jsx)(`mesh`,{ref:De[e],geometry:N.lash,material:j.lash,position:[0,.02,1.1],rotation:[0,0,Math.PI],visible:!1})]});return(0,K.jsxs)(`group`,{ref:L,children:[(0,K.jsxs)(`group`,{position:[0,-.95,0],children:[(0,K.jsx)(`mesh`,{ref:J,material:fe,position:[0,.02,-.35],renderOrder:-10,children:(0,K.jsx)(`planeGeometry`,{args:[1,1]})}),(0,K.jsx)(`primitive`,{object:I.mesh})]}),Oe.map((e,t)=>(0,K.jsx)(`mesh`,{ref:e,geometry:N.z,material:j.z.clone(),visible:!1},t)),(0,K.jsx)(`group`,{ref:R,children:(0,K.jsxs)(`group`,{position:[0,-.95,0],children:[(0,K.jsx)(`mesh`,{ref:z,geometry:_,material:P.debug?.basic?void 0:ne}),!P.debug?.nospark&&(0,K.jsx)(`points`,{ref:ge,geometry:O.g,material:O.m,frustumCulled:!1}),(0,K.jsx)(`mesh`,{ref:V,geometry:_,material:k,visible:!1,renderOrder:-1}),(0,K.jsx)(`primitive`,{object:ue}),(0,K.jsxs)(`group`,{ref:q,children:[(0,K.jsx)(`mesh`,{ref:ke,geometry:le.g,material:le.m}),!P.debug?.noeyes&&Ae(`L`),!P.debug?.noeyes&&Ae(`R`)]})]})})]})}var ut=new o,dt=new u,ft=new A,pt=new A,mt=new A,ht=new A,gt=new l;function _t(e,t,n){if(!n||(n.updateWorldMatrix(!0,!1),ut.copy(n.matrixWorld).invert(),dt.copy(e.ray).applyMatrix4(ut),t.boundingSphere||t.computeBoundingSphere(),gt.copy(t.boundingSphere),!dt.intersectsSphere(gt)))return null;let r=t.attributes.position,i=t.index,a=1/0,o=null,s=i?i.count/3:r.count/3;for(let e=0;e<s;e++){let t=i?i.getX(e*3):e*3,n=i?i.getX(e*3+1):e*3+1,s=i?i.getX(e*3+2):e*3+2;ft.fromBufferAttribute(r,t),pt.fromBufferAttribute(r,n),mt.fromBufferAttribute(r,s);let c=dt.intersectTriangle(ft,pt,mt,!0,ht);if(c){let e=c.distanceTo(dt.origin);e<a&&(a=e,o={point:c.clone(),normal:new A().subVectors(pt,ft).cross(mt.sub(ft)).normalize()})}}return o}function vt(){let{gl:e,size:t}=M(),n=(0,B.useMemo)(()=>new d(4,4,{type:N,minFilter:i,magFilter:i,depthBuffer:!0}),[]);(0,B.useEffect)(()=>{let e=he().fbo;n.setSize(Math.max(4,Math.round(t.width*e)),Math.max(4,Math.round(t.height*e)))},[t,n]),(0,B.useEffect)(()=>()=>n.dispose(),[n]);let{scene:r,camera:a}=M();return(0,B.useEffect)(()=>(P.precompile=()=>new Promise(t=>{let n=[];r.traverse(e=>{e.visible||(n.push(e),e.visible=!0)});try{e.compile(r,a)}catch{}n.forEach(e=>e.visible=!1);let i=performance.now(),o=()=>{let n=!0;try{let t=e.getContext();for(let r of e.info.programs)r.program&&t.isProgram(r.program)&&!r.isReady()&&(n=!1)}catch{n=!0}n||performance.now()-i>2500?t():setTimeout(o,20)};o()}),()=>P.precompile=null),[e,r,a]),x(({scene:t,camera:r})=>{let i=P.refractors,a=!1;if(i&&!P.debug?.nofbo)for(let e of i)a=a||e.active();if(a){for(let e of i)e.hide();e.setRenderTarget(n),e.clear(),e.render(t,r),e.setRenderTarget(null);for(let e of i)e.show(),e.setBuffer(n.texture)}e.render(t,r)},1),null}var yt=`
  uniform vec3 uColor;
  uniform vec3 uGlow;
  uniform float uAmount;
  uniform float uTime;
  uniform float uAspect;
  varying vec2 vUv;
  float h(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  float n(vec2 p) { vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
    return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
  float caustic(vec2 p) {
    float c = 0.0;
    for (int i = 0; i < 3; i++) {
      p += vec2(n(p + uTime * 0.3), n(p.yx - uTime * 0.25)) * 1.4;
      c += pow(1.0 - abs(sin(p.x * 1.7 + p.y * 1.3)), 6.0);
      p *= 1.7;
    }
    return c / 3.0;
  }
  void main() {
    vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);
    float r = length(p);
    float a = clamp(uAmount, 0.0, 1.0);
    // the hole we punch through: starts as a pinhole, opens as the amount drops
    float veil = smoothstep(0.0, 1.0, a * 1.25 - r * (1.0 - a) * 1.4);
    vec3 col = mix(uColor, uGlow, caustic(p * 3.0) * 0.55 + (1.0 - r) * 0.25);
    float ring = smoothstep(0.06, 0.0, abs(r - (1.0 - a) * 0.9)) * a;
    col += ring * 0.35;
    gl_FragColor = vec4(col, clamp(veil + ring * 0.5, 0.0, 1.0));
    #include <colorspace_fragment>
  }
`;function bt(){let{size:e}=M(),t=(0,B.useRef)(),n=(0,B.useMemo)(()=>new r({uniforms:{uColor:{value:new D},uGlow:{value:new D},uAmount:{value:0},uTime:{value:0},uAspect:{value:1}},vertexShader:`varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,fragmentShader:yt,transparent:!0,depthTest:!1,depthWrite:!1,toneMapped:!1}),[]);return x(r=>{let i=F(),a=n.uniforms;a.uColor.value.set(i.gummy),a.uGlow.value.set(i.glow),a.uAmount.value=P.dive?P.dive.membrane:0,t.current.visible=a.uAmount.value>.002,a.uTime.value=r.clock.elapsedTime,a.uAspect.value=e.width/e.height},-1),(0,K.jsx)(`mesh`,{ref:t,frustumCulled:!1,renderOrder:2e3,material:n,visible:!1,children:(0,K.jsx)(`planeGeometry`,{args:[2,2]})})}var xt=e({default:()=>wt});Ce();var St=(0,B.lazy)(()=>I(()=>import(`./Inner-CBXi3glR.js`),__vite__mapDeps([0,1,2,3,4,5]))),Ct=(0,B.lazy)(()=>I(()=>import(`./Jar-DurbYmaP.js`),__vite__mapDeps([6,1,2,3,4,5,7])));function wt(){let[e,t]=(0,B.useState)(P.tier),n=ue(e=>e.jarNear),r=ue(e=>e.innerNear),i=z[e];return(0,K.jsx)(`div`,{className:`stage`,"aria-hidden":`true`,children:(0,K.jsxs)(ne,{dpr:P.debug?.dpr?[1,Number(P.debug.dpr)]:i.dpr,camera:{position:[0,0,me],fov:30,near:.05,far:200},gl:{antialias:P.debug?.aa?P.debug.aa===`1`:window.devicePixelRatio<1.25&&e!==`low`,alpha:!1,powerPreference:`high-performance`,toneMapping:7,stencil:!1},onCreated:({gl:e})=>{P.gl=e,e.toneMappingExposure=1},children:[!P.debug?.nopm&&(0,K.jsx)(ge,{onDecline:()=>{if(e===`low`)return;let n=R(e);P.tier=n,t(n)}}),(0,K.jsx)(L,{}),!P.debug?.nobg&&(0,K.jsx)(Oe,{}),(0,K.jsxs)(B.Suspense,{fallback:null,children:[!P.debug?.noword&&(0,K.jsx)(Ae,{}),!P.debug?.nolights&&(0,K.jsx)(Tt,{}),!P.debug?.nobear&&(0,K.jsx)(lt,{},e)]}),r&&(0,K.jsx)(B.Suspense,{fallback:null,children:(0,K.jsx)(St,{})}),n&&(0,K.jsx)(B.Suspense,{fallback:null,children:(0,K.jsx)(Ct,{})}),!P.debug?.nomem&&(0,K.jsx)(bt,{}),(0,K.jsx)(vt,{})]})})}function Tt(){return(0,K.jsxs)(K.Fragment,{children:[(0,K.jsx)(`ambientLight`,{intensity:.25}),(0,K.jsx)(`directionalLight`,{position:[-3.5,5,6],intensity:2.2,color:`#fff4ea`}),(0,K.jsx)(`directionalLight`,{position:[4,3,-5],intensity:2.4,color:`#ffffff`})]})}export{wt as default,Ke as n,be as r,xt as t};