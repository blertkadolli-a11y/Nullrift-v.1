import{r as e}from"./rolldown-runtime-XKyaHtl9.js";import{A as t,B as n,E as r,F as i,P as a,R as o,U as s,V as c,W as l,Y as u,Z as d,_ as f,a as p,b as m,d as h,g,j as _,l as v,m as y,q as b,s as x,u as S,v as C,x as w}from"./three-BNmSymXd.js";import{a as T,i as E,r as D,s as O}from"./index-BX8Q3zeZ.js";import{o as k,r as A}from"./quality-CDuNpMQi.js";var j=e(d(),1),M=u();function N(e=160){let t=document.createElement(`canvas`);t.width=t.height=e;let n=t.getContext(`2d`),r=n.createImageData(e,e),i=[];for(let t=0;t<9;t++)i.push([Math.random()*e,Math.random()*e]);for(let t=0;t<e;t++)for(let n=0;n<e;n++){let a=1e9,o=1e9;for(let[r,s]of i)for(let i=-1;i<=1;i++)for(let c=-1;c<=1;c++){let l=n-(r+c*e),u=t-(s+i*e),d=l*l+u*u;d<a?(o=a,a=d):d<o&&(o=d)}let s=Math.sqrt(o)-Math.sqrt(a),c=Math.max(0,1-s/16)**3*255,l=(t*e+n)*4;r.data[l]=r.data[l+1]=r.data[l+2]=c,r.data[l+3]=255}n.putImageData(r,0,0);let a=new h(t);return a.wrapS=a.wrapT=o,a}var P=`
  varying vec3 vDir;
  varying vec2 vUv;
  void main() {
    vDir = normalize(position);
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`,F=`
  uniform vec3 uDeep;
  uniform vec3 uMid;
  uniform vec3 uGlow;
  uniform sampler2D uCaustic;
  uniform float uTime;
  varying vec3 vDir;
  varying vec2 vUv;
  void main() {
    // a tunnel of gel: deep and dark at the edges, glowing where we're heading,
    // light leaking in from "above" (the bear's skin)
    float up = vDir.y * 0.5 + 0.5;
    float fwd = max(0.0, -vDir.z);
    vec3 col = mix(uDeep * 0.7, uMid, smoothstep(0.45, 1.0, fwd) * 0.9 + up * 0.18);
    col = mix(col, uGlow, pow(fwd, 14.0) * 0.6);
    vec2 uv = vUv * vec2(6.0, 3.0);
    float c1 = texture2D(uCaustic, uv + vec2(uTime * 0.015, uTime * 0.01)).r;
    float c2 = texture2D(uCaustic, uv * 1.31 - vec2(uTime * 0.012, -uTime * 0.008)).r;
    float caus = smoothstep(0.0, 0.9, c1 * c2 * 2.2);
    col += uGlow * caus * (0.05 + up * 0.22);
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`,I=`
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * mat3(instanceMatrix) * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`,L=`
  uniform vec3 uGlow;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float ndv = max(dot(normalize(vN), normalize(vV)), 0.0);
    float rim = pow(1.0 - ndv, 3.0);
    vec3 L = normalize(vec3(-0.4, 0.7, 0.6));
    float spec = pow(max(dot(reflect(-L, normalize(vN)), normalize(vV)), 0.0), 40.0);
    gl_FragColor = vec4(uGlow * rim * 0.9 + vec3(spec), rim * 0.8 + spec);
    #include <colorspace_fragment>
  }
`;function R(e){switch(e){case`crystal`:{let e=new _(1,0);return e.scale(.55,1,.55),e}case`leaf`:{let e=new s(1,16,8);return e.scale(1,.14,.45),e}case`flower`:{let e=new c;for(let t=0;t<=80;t++){let n=t/80*Math.PI*2,r=.45+.55*Math.abs(Math.cos(n*5/2)),i=Math.cos(n)*r,a=Math.sin(n)*r;t===0?e.moveTo(i,a):e.lineTo(i,a)}let t=new f(e,{depth:.12,bevelEnabled:!0,bevelSize:.06,bevelThickness:.06,bevelSegments:2});return t.center(),t}default:return new m(1,3)}}var z=e=>new b(e%2==0?-.95:.95,e%3==0?.32:-.28,k-6.5-e*7.6),B=new y,V=e=>new n({uniforms:{uGlow:{value:new y(e)}},vertexShader:I,fragmentShader:L,transparent:!0,depthWrite:!1,blending:2});function H(){let e=document.createElement(`canvas`);e.width=e.height=128;let t=e.getContext(`2d`),n=t.createRadialGradient(64,64,0,64,64,64);return n.addColorStop(0,`rgba(255,255,255,0.9)`),n.addColorStop(.25,`rgba(255,255,255,0.35)`),n.addColorStop(1,`rgba(255,255,255,0)`),t.fillStyle=n,t.fillRect(0,0,128,128),new h(e)}function U(){let{camera:e,size:o,scene:s}=x(),c=E(e=>e.formula),u=A(),d=(0,j.useRef)(),f=O[c],h=(0,j.useMemo)(()=>new n({uniforms:{uDeep:{value:new y},uMid:{value:new y},uGlow:{value:new y},uCaustic:{value:N()},uTime:{value:0}},vertexShader:P,fragmentShader:F,side:1,depthWrite:!1}),[]),_=(0,j.useMemo)(()=>{let e=Math.round(90*u.dive),t=new w(new m(1,2),new n({uniforms:{uGlow:{value:new y(`#ffffff`)}},vertexShader:I,fragmentShader:L,transparent:!0,depthWrite:!1,blending:2}),e),r=Array.from({length:e},()=>({x:(Math.random()-.5)*7,y:(Math.random()-.5)*5,z:k+2-Math.random()*44,r:.025+Math.random()**3*.16,s:.15+Math.random()*.35,w:Math.random()*6.28}));return t.frustumCulled=!1,{mesh:t,data:r}},[u.dive]),U=(0,j.useMemo)(H,[]),W=(0,j.useMemo)(()=>f.ingredients.map((e,n)=>{let r=Math.round(34*u.dive),i=e.shape===`crystal`,a=i?new y(e.color).lerp(new y(f.glow),.55):new y(e.color),o=new t({color:a,roughness:i?.02:.28,metalness:i?.55:0,flatShading:i,emissive:i?new y(f.gummyDeep):a,emissiveIntensity:i?.6:.45,envMapIntensity:i?2.6:1.8,transparent:!0,opacity:i?.88:.92}),s=new l({map:U,color:e.color,transparent:!0,depthWrite:!1,blending:2,opacity:.55}),c=e.shape===`bubble`,d=new w(R(e.shape),c?V(e.color):o,r);return d.frustumCulled=!1,{mesh:d,anchor:z(n),items:Array.from({length:r},(t,n)=>({a:Math.random()*Math.PI*2,r:.25+Math.random()**.7*.95,y:(Math.random()-.5)*1.1,sp:(.15+Math.random()*.35)*(n%2?1:-1),s:(e.shape===`leaf`?.13:e.shape===`crystal`?.05:.07)+Math.random()*(e.shape===`crystal`?.045:.07),rot:new g(Math.random()*6,Math.random()*6,Math.random()*6),spin:(Math.random()-.5)*1.5})),mat:o,glow:s}}),[f,u.dive,U]),G=(0,j.useRef)(null);(0,j.useEffect)(()=>{let e=G.current;e&&e!==W&&e.forEach(e=>(e.mesh.geometry.dispose(),e.mat.dispose(),e.mesh.material.dispose(),e.glow.dispose())),G.current=W},[W]);let K=(0,j.useMemo)(()=>{let e=Math.round(700*u.dive),t=new Float32Array(e*3);for(let n=0;n<e;n++)t[n*3]=(Math.random()-.5)*8,t[n*3+1]=(Math.random()-.5)*5,t[n*3+2]=k+2-Math.random()*44;let n=new S;return n.setAttribute(`position`,new v(t,3)),{g:n,m:new a({size:.05,color:`#ffffff`,transparent:!0,opacity:.6,depthWrite:!1,blending:2,sizeAttenuation:!0})}},[u.dive]),q=(0,j.useMemo)(()=>new C(`#000000`,.09),[]),J=(0,j.useMemo)(()=>({m4:new r,q:new i,v:new b,sc:new b,e:new g}),[]);return(0,j.useEffect)(()=>{T.precompile?.()},[W]),p((t,n)=>{let{m4:r,q:i,v:a,sc:c,e:l}=J,u=T.dive,f=!!u&&u.inner>.5;d.current.visible=f,s.fog=f?q:null;let p=T.diveLabels;if(!f||T.reduced){if(p)for(let e of p)e.style.opacity=+!!f;if(!f)return}let m=t.clock.elapsedTime,g=D();h.uniforms.uTime.value=m,h.uniforms.uDeep.value.set(g.gummyDeep),h.uniforms.uMid.value.set(g.gummy).lerp(B.set(g.gummyDeep),.35),h.uniforms.uGlow.value.set(g.glow),q.color.set(g.gummyDeep).lerp(B.set(g.gummy),.2),_.mesh.material.uniforms.uGlow.value.set(g.glow),_.data.forEach((e,t)=>{e.y+=e.s*n,e.y>2.6&&(e.y=-2.6),a.set(e.x+Math.sin(m*.8+e.w)*.08,e.y,e.z);let o=1+Math.sin(m*5+e.w)*.06;c.set(e.r*o,e.r/o,e.r),r.compose(a,i.identity(),c),_.mesh.setMatrixAt(t,r)}),_.mesh.instanceMatrix.needsUpdate=!0,W.forEach((t,n)=>{t.items.forEach((n,o)=>{let s=n.a+m*n.sp;a.set(t.anchor.x+Math.cos(s)*n.r,t.anchor.y+n.y+Math.sin(m*.7+o)*.05,t.anchor.z+Math.sin(s)*n.r),l.set(n.rot.x+m*n.spin,n.rot.y+m*n.spin*.7,n.rot.z),i.setFromEuler(l);let u=Math.min(1,Math.max(0,(a.distanceTo(e.position)-.5)/.9));c.setScalar(n.s*u),r.compose(a,i,c),t.mesh.setMatrixAt(o,r)}),t.mesh.instanceMatrix.needsUpdate=!0;let s=p&&p[n];if(!s||T.reduced)return;a.copy(t.anchor),a.y+=.55;let d=e.position.z-a.z;a.project(e);let f=o.width<700,h=Math.min(o.width-(f?125:60),Math.max(f?125:60,(a.x*.5+.5)*o.width)),g=Math.min(o.height-150,Math.max(110,(-a.y*.5+.5)*o.height)),_=Math.min(1,Math.max(0,(d-.7)/1))*Math.min(1,Math.max(0,(8.4-d)/1.4))*(1-Math.min(1,u.membrane*2));s.style.opacity=_.toFixed(3),s.style.transform=`translate3d(${h.toFixed(1)}px, ${g.toFixed(1)}px, 0)`,s.dataset.side=a.x>0?`l`:`r`})}),(0,M.jsxs)(`group`,{ref:d,visible:!1,children:[(0,M.jsx)(`mesh`,{material:h,position:[0,0,k-19],renderOrder:-500,frustumCulled:!1,children:(0,M.jsx)(`sphereGeometry`,{args:[34,48,24]})}),(0,M.jsx)(`primitive`,{object:_.mesh}),W.map((e,t)=>(0,M.jsxs)(`group`,{children:[(0,M.jsx)(`primitive`,{object:e.mesh}),(0,M.jsx)(`sprite`,{material:e.glow,position:e.anchor,scale:2.6})]},c+`-`+t)),(0,M.jsx)(`points`,{geometry:K.g,material:K.m,frustumCulled:!1}),(0,M.jsx)(`pointLight`,{position:[0,2,k-8],intensity:6,distance:30,color:f.glow}),(0,M.jsx)(`pointLight`,{position:[0,2,k-26],intensity:6,distance:30,color:f.glow})]})}export{U as default};