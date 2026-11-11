import{r as e}from"./rolldown-runtime-XKyaHtl9.js";import{A as t,B as n,E as r,F as i,K as a,O as o,S as s,Y as c,Z as l,a as u,d,g as f,m as p,q as m,s as h,w as g,z as _}from"./three-BNmSymXd.js";import{a as v,n as y,o as b,r as x,s as S}from"./index-BX8Q3zeZ.js";import{i as C,r as w}from"./quality-CDuNpMQi.js";import{n as T,r as E}from"./Stage-C13OPjBW.js";import{a as D,i as O,n as ee,o as te,r as k,t as A}from"./physics-DtvvYgji.js";var j=e(l(),1),M=`
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying float vY;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vY = position.y;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`,N=`
  uniform mat4 projectionMatrix;
  uniform sampler2D buffer;
  uniform sampler2D envMap;
  uniform float uHasEnv;
  uniform vec3 uTint;
  varying vec3 vWorldPos;
  varying vec3 vWorldNormal;
  varying float vY;
  #include <common>
  #include <cube_uv_reflection_fragment>
  void main() {
    vec3 V = normalize(cameraPosition - vWorldPos);
    vec3 N = normalize(vWorldNormal);
    if (!gl_FrontFacing) N = -N;
    float NdV = clamp(dot(N, V), 0.0, 1.0);
    vec3 vn = normalize((viewMatrix * vec4(N, 0.0)).xyz);
    vec4 c = projectionMatrix * viewMatrix * vec4(vWorldPos + refract(-V, N, 1.0 / 1.5) * 0.12, 1.0);
    // walls seen edge-on bend the view much more than walls seen face-on
    vec2 uv = clamp(c.xy / c.w * 0.5 + 0.5 - vn.xy * 0.05 * pow(1.0 - NdV, 2.0), 0.001, 0.999);
    vec3 col = texture2D(buffer, uv).rgb * uTint;
    // faint milky lift + darker, denser glass where the wall is seen edge-on
    col = col * 0.93 + 0.05;
    float edge = smoothstep(0.55, 0.92, 1.0 - NdV);
    col = mix(col, col * vec3(0.62, 0.72, 0.7), edge * 0.7);
    float F = 0.04 + 0.96 * pow(1.0 - NdV, 5.0);
    vec3 env = vec3(0.0);
    #ifdef ENVMAP_TYPE_CUBE_UV
      env = textureCubeUV(envMap, reflect(-V, N), 0.05).rgb;
    #endif
    col = mix(col, env * 1.2, min(1.0, F * 1.4));
    // studio streaks: two soft vertical highlights, as on a product shot
    float s1 = exp(-pow((vn.x + 0.55) / 0.06, 2.0));
    float s2 = exp(-pow((vn.x - 0.62) / 0.035, 2.0)) * 0.6;
    col += vec3(1.0) * (s1 + s2) * 0.75 * smoothstep(0.05, 0.25, vY) * (1.0 - smoothstep(1.9, 2.1, vY));
    col += vec3(1.0) * pow(1.0 - NdV, 3.0) * 0.12;
    gl_FragColor = vec4(col, 1.0);
    #include <tonemapping_fragment>
    #include <colorspace_fragment>
  }
`;function P(){return new n({uniforms:{buffer:{value:null},envMap:{value:null},uHasEnv:{value:0},uTint:{value:new p(`#f4fbff`)}},vertexShader:M,fragmentShader:N,transparent:!0})}function F(e,t){if(!t?.image?.height)return;e.uniforms.envMap.value=t;let n=t.image.height,r=Math.log2(n)-2;e.defines.CUBEUV_TEXEL_WIDTH=1/(3*Math.max(2**r,112)),e.defines.CUBEUV_TEXEL_HEIGHT=1/n,e.defines.CUBEUV_MAX_MIP=r.toFixed(1),e.defines.ENVMAP_TYPE_CUBE_UV=``,e.needsUpdate=!0}function I(){let e=document.createElement(`canvas`);e.width=2048,e.height=640;let t=new d(e);t.colorSpace=_,t.anisotropy=4;let n=null;return{texture:t,draw:r=>{if(n===r.id)return;n=r.id;let i=e.getContext(`2d`),a=e.width,o=e.height;i.clearRect(0,0,a,o),i.fillStyle=r.bg,i.beginPath(),i.roundRect(40,30,a-80,o-60,70),i.fill(),i.fillStyle=r.ink,i.textBaseline=`alphabetic`,i.textAlign=`center`,i.font=`800 condensed 300px "Bricolage Grotesque Variable", sans-serif`,i.fillText(b.wordmark,a/2,360),i.font=`italic 130px "Instrument Serif", serif`,i.fillText(r.name.toLowerCase(),a/2,500),i.font=`500 38px "JetBrains Mono Variable", monospace`,i.fillText(`${r.index} — ${b.descriptor.toUpperCase()}`,a*.34,120),i.fillText(`60 GUMMIES · CONCEPT`,a*.66,120),i.textAlign=`center`,i.globalAlpha=.7,i.fillText(`NOT A REAL PRODUCT`,a/2,570),i.globalAlpha=1,t.needsUpdate=!0}}}var L=c(),R=2.3,z=1,B=.07,V=.25;function H(){let e=[];e.push(new a(.001,0));for(let t=0;t<=6;t++){let n=t/6*Math.PI*.5;e.push(new a(.88+Math.sin(n)*.12,.12-Math.cos(n)*.12))}e.push(new a(z,R*.78));for(let t=1;t<=8;t++){let n=t/8;e.push(new a(z-(1-Math.cos(n*Math.PI*.5))*.16,R*.78+n*.2))}e.push(new a(.84,2.1799999999999997)),e.push(new a(.88,2.1999999999999997)),e.push(new a(.88,2.26)),e.push(new a(.85,R)),e.push(new a(.77,R)),e.push(new a(.77,1.9939999999999998));for(let t=8;t>=0;t--){let n=t/8;e.push(new a(.9299999999999999-(1-Math.cos(n*Math.PI*.5))*.16,R*.78+n*.2-.01))}return e.push(new a(.9299999999999999,.17)),e.push(new a(.83,B)),e.push(new a(.001,B)),e}function U(){let e=[],t=.9;e.push(new a(.001,.32)),e.push(new a(.8400000000000001,.32)),e.push(new a(t,.28));for(let n=0;n<=10;n++)e.push(new a(t+(n%2?.015:0),.26-n*.025));e.push(new a(.88,0)),e.push(new a(.8200000000000001,0)),e.push(new a(.8200000000000001,.25)),e.push(new a(.001,.25));let n=new s(e,72);return n.computeVertexNormals(),n}function W(){let{size:e,scene:n}=h(),a=E(),c=w(),l=(0,j.useRef)(),d=(0,j.useRef)(),_=(0,j.useRef)(),b=(0,j.useRef)(null),M=(0,j.useMemo)(()=>{let e=null;return a.scene.traverse(t=>t.isMesh&&!e&&(e=t.geometry.clone())),e.translate(0,-.8,0),e.scale(V,V,V),e},[a]),N=(0,j.useMemo)(()=>{let e=new s(H(),96);return e.computeVertexNormals(),e},[]),z=(0,j.useMemo)(U,[]),W=(0,j.useMemo)(()=>P(),[]);(0,j.useEffect)(()=>{n.environment&&F(W,n.environment)},[W,n.environment]);let G=(0,j.useMemo)(()=>I(),[]),K=(0,j.useMemo)(()=>new t({map:G.texture,roughness:.5,transparent:!0}),[G]),q=(0,j.useMemo)(()=>new t({color:`#ffffff`,roughness:.22,metalness:0,envMapIntensity:1.3}),[]),J=(0,j.useMemo)(()=>new o({map:T(),transparent:!0,depthWrite:!1,opacity:.32,color:`#000000`,toneMapped:!1}),[]),Y=(0,j.useMemo)(()=>{let e=new t({roughness:.1,metalness:0,envMapIntensity:1.6});return e.onBeforeCompile=e=>{e.fragmentShader=e.fragmentShader.replace(`#include <emissivemap_fragment>`,`#include <emissivemap_fragment>
        {
          float ndv = clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0);
          totalEmissiveRadiance += diffuseColor.rgb * (0.3 + pow(1.0 - ndv, 1.6) * 0.85);
          diffuseColor.rgb *= 0.55;
        }`)},e},[]),ne=()=>{let e=new te({gravity:new D(0,-14,0)});e.broadphase=new k(e),e.allowSleep=!0,e.solver.iterations=6,e.quatNormalizeFast=!0,e.quatNormalizeSkip=2,e.defaultContactMaterial.friction=.45,e.defaultContactMaterial.restitution=.3;let t=new A({mass:0,type:A.STATIC,shape:new ee});t.quaternion.setFromAxisAngle(new D(1,0,0),-Math.PI/2),t.position.set(0,B,0),e.addBody(t);let n=new D;return e.addEventListener(`postStep`,()=>{for(let t of e.bodies)if(t.mass!==0&&t.sleepState!==A.SLEEPING)for(let e=0;e<t.shapes.length;e++){let r=t.shapes[e].radius;t.quaternion.vmult(t.shapeOffsets[e],n);let i=t.position.x+n.x,a=t.position.y+n.y,o=t.position.z+n.z;if(a>2.5)continue;let s=.9299999999999999-Math.min(1,Math.max(0,(a-R*.78)/.2))*.16-r,c=Math.hypot(i,o);if(c>s){let e=i/c,n=o/c,r=c-s;t.position.x-=e*r,t.position.z-=n*r;let a=t.velocity.x*e+t.velocity.z*n;a>0&&(t.velocity.x-=e*a*1.3,t.velocity.z-=n*a*1.3,t.velocity.y*=.96)}}}),{w:e,bodies:[],squash:[],prevVy:[],queue:0,poured:0,spawnT:0}},X=(0,j.useMemo)(()=>S.map(e=>new p(e.gummy)),[]),Z=c.jarMax,Q=(e,t)=>{let n=(Math.random()-.5)*.7,r=(Math.random()-.5)*.7,a=2.9+Math.random()*.8,o=new f(Math.random()*6,Math.random()*6,Math.random()*6),s=new i().setFromEuler(o),c=t<e.bodies.length,l=c?e.bodies[t]:new A({mass:1,linearDamping:.2,angularDamping:.5,sleepSpeedLimit:.15,sleepTimeLimit:.6});if(!c){let t=V/.2;l.addShape(new O(.13*t),new D(0,-.04*t,0)),l.addShape(new O(.1*t),new D(0,.13*t,.01*t)),e.w.addBody(l),e.bodies.push(l),e.squash.push(0),e.prevVy.push(0);let n=e.bodies.length-1;_.current.setColorAt(n,X[n%X.length]),_.current.instanceColor.needsUpdate=!0}l.position.set(n,a,r),l.quaternion.set(s.x,s.y,s.z,s.w),l.velocity.set(0,-2,0),l.angularVelocity.set(Math.random()*2-1,Math.random()*2-1,Math.random()*2-1),l.wakeUp()},$=(0,j.useMemo)(()=>({m:new r,q:new i,v:new m,s:new m,wp:new m}),[]);(0,j.useEffect)(()=>{v.precompile?.()},[]),(0,j.useEffect)(()=>{let e={active:()=>!!l.current?.visible,hide:()=>d.current&&(d.current.visible=!1),show:()=>d.current&&(d.current.visible=!0),setBuffer:e=>W.uniforms.buffer.value=e};return v.refractors.push(e),()=>v.refractors.splice(v.refractors.indexOf(e),1)},[W]),u((t,n)=>{let r=v.stage,i=l.current;if(!i||!r)return;let a=r.jar>.02;if(i.visible=a,!a){v.jarTarget=null;return}let o=x();G.draw(o),q.color.set(o.gummyDeep);let s=e.width/e.height<.9,c=2*Math.tan(g.degToRad(15))*C,u=c*(e.width/e.height),d=(s?.32:.64)*c/R,f=g.smoothstep(r.jar,0,1);i.scale.setScalar(d),i.position.set((s?.16:.42)*u*.5,(s?-.5:-.12)*c*.5-R*d*.5-(1-f)*c*.7,0),i.rotation.y=Math.sin(t.clock.elapsedTime*.3)*.08-.15,b.current||(b.current=ne());let p=b.current;re(p,n,i,r)});function re(e,t,n,r){if(e.poured<64&&r.jar>.6&&(e.queue=Math.max(e.queue,64-e.poured)),v.jarPour&&(e.queue+=v.jarPour,v.jarPour=0,y(`pour`,.2)),e.spawnT-=t,e.queue>0&&e.spawnT<=0){let t=e.bodies.length<Z?e.bodies.length:e.poured%Z;Q(e,t),e.poured++,e.queue--,e.spawnT=.055,v.jarCount=Math.min(e.poured,Z)}e.w.step(1/60,Math.min(t,.05),3);let{m:i,q:a,v:o,s}=$,c=null,l=-1;for(let n=0;n<e.bodies.length;n++){let r=e.bodies[n],u=r.position,d=r.quaternion,f=r.velocity,p=f.y-e.prevVy[n];e.prevVy[n]<-2.2&&p>2.2&&(e.squash[n]=Math.min(.42,p*.06),Math.random()<.5&&y(`plop`,.03)),e.prevVy[n]=f.y,e.squash[n]*=Math.exp(-t*6);let m=e.squash[n]*Math.cos((.42-e.squash[n])*30);o.set(u.x,u.y,u.z),a.set(d.x,d.y,d.z,d.w),s.set(1+m*.5,1-m,1+m*.5),i.compose(o,a,s),_.current.setMatrixAt(n,i),u.y>l&&f.y<-.5&&(l=u.y,c=u),u.y<-3&&Q(e,n)}_.current.count=e.bodies.length,_.current.instanceMatrix.needsUpdate=!0,c?($.wp.set(c.x,c.y,c.z).applyMatrix4(n.matrixWorld),v.jarTarget=(v.jarTarget||new m).copy($.wp)):v.jarTarget&&($.wp.set(0,R*.4,0).applyMatrix4(n.matrixWorld),v.jarTarget.lerp($.wp,.05))}return(0,L.jsxs)(`group`,{ref:l,visible:!1,children:[(0,L.jsx)(`instancedMesh`,{ref:_,args:[M,Y,Z],frustumCulled:!1,count:0}),(0,L.jsx)(`mesh`,{ref:d,geometry:N,material:W,renderOrder:10}),(0,L.jsx)(`mesh`,{position:[0,R*.6,0],rotation:[0,-.25,0],renderOrder:11,material:K,children:(0,L.jsx)(`cylinderGeometry`,{args:[1.008,1.008,.78,72,1,!0,-1.25,2.5]})}),(0,L.jsx)(`mesh`,{geometry:z,material:q,position:[-1.05,0,-1.25],rotation:[.1,.3,.05]}),(0,L.jsx)(`mesh`,{material:J,position:[.15,.02,-1.2],scale:[3.6,.55,1],renderOrder:-10,children:(0,L.jsx)(`planeGeometry`,{args:[1,1]})})]})}export{W as default};