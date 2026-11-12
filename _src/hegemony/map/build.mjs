// 세계 영토 지도(기원전 3000 ~ 2026) 빌드
//  raw/ 의 시점별 국경 → {lang}/hegemony/map/data/*.json + index.json + index.html
//  · 색: 나라(주권 주체)마다 하나. 어느 시점에든 국경을 맞댄 나라끼리는 서로 다른 색이 되도록 배정
//  · 0.5° 격자 표본으로 인접 관계·면적·이름표 위치를 계산
import fs from 'fs'; import path from 'path'; import {fileURLToPath} from 'url';
import Flatbush from 'flatbush'; import {geoArea} from 'd3-geo'; import {feature} from 'topojson-client'; import {topology} from 'topojson-server';
const HERE=path.dirname(fileURLToPath(import.meta.url));
const RAW=path.join(HERE,'raw'), ROOT=path.join(HERE,'../../..');
const J=f=>JSON.parse(fs.readFileSync(path.join(HERE,f),'utf8'));
const TX=J('ko.json'), PG=J('ko.page.json');

// ---- 시점 목록
const HB=[-3000,-2000,-1500,-1000,-700,-500,-400,-323,-300,-200,-100,-1,100,200,300,400,500,600,700,800,900,1000,1100,1200,1279,1300,1400,1492,1500,1530,1600,1650,1700,1715,1783,1815,1880];
const CS={1886:'1886-01-01',1900:'1900-07-01',1914:'1914-07-01',1920:'1920-07-01',1930:'1930-07-01',1938:'1938-12-31',1945:'1945-09-02',1950:'1950-07-01',1960:'1960-12-31',1970:'1970-07-01',1980:'1980-07-01',1991:'1991-12-31',2000:'2000-07-01',2010:'2010-07-01',2019:'2019-12-31'};
const SNAPS=[...HB.map(y=>({y,src:'hb',file:`h${y}.json`})),...Object.entries(CS).map(([y,d])=>({y:+y,src:'cs',file:`c${y}.json`,date:d})),{y:2026,src:'ne',file:'n_usa.json',date:'2026-10'}];

// ---- 이름 정리: 출처마다 다른 표기를 하나로 모은다(색과 한글 이름을 시점 사이에 유지하려고)
const ALIAS=J('alias.json');
const canon=n=>{n=(n||'').replace(/\s+/g,' ').trim(); return ALIAS[n]||n;};
// 2026: 유엔의 표기를 우선하는 곳(ADM0_A3 → 칠할 주체). 근거는 ko.json unRules
const UN_OVERRIDE={TWN:'China',KOS:'Serbia',SOL:'Somalia',CYN:'Cyprus',PSX:'Palestine',SAH:'Western Sahara'};

function rings(g){return !g?[]:g.type==='Polygon'?g.coordinates:g.type==='MultiPolygon'?g.coordinates.flat():[];}
function pip(rs,x,y){let inside=false;for(const r of rs){for(let i=0,j=r.length-1;i<r.length;j=i++){const [xi,yi]=r[i],[xj,yj]=r[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))inside=!inside;}}return inside;}
function fix(f){ // d3용 감기 방향 보정
  const gm=f.geometry; if(!gm) return f; const ps=gm.type==='Polygon'?[gm.coordinates]:gm.type==='MultiPolygon'?gm.coordinates:[];
  for(const p of ps) for(let i=0;i<p.length;i++){ if(geoArea({type:'Polygon',coordinates:[p[i]]})>2*Math.PI) p[i]=p[i].slice().reverse(); }
  return f; }
function mkIndex(feats){
  const items=feats.map((f,i)=>{const rs=rings(f.geometry);let x0=180,y0=90,x1=-180,y1=-90;for(const r of rs)for(const [x,y] of r){if(x<x0)x0=x;if(y<y0)y0=y;if(x>x1)x1=x;if(y>y1)y1=y;}let a=geoArea(f);if(a>2*Math.PI)a=4*Math.PI-a;return {i,f,rs,bb:[x0,y0,x1,y1],a};}).filter(o=>o.rs.length&&o.bb[0]<=o.bb[2]);
  const ix=new Flatbush(Math.max(items.length,1)); if(!items.length) ix.add(0,0,0,0); for(const o of items) ix.add(...o.bb); ix.finish(); return {ix,items};
}
function at(I,x,y){const c=I.ix.search(x,y,x,y).map(i=>I.items[i]).filter(o=>o&&pip(o.rs,x,y)); if(!c.length) return null; c.sort((a,b)=>a.a-b.a); return c[0];}
const STEP=0.5, R=6371.0088, rad=Math.PI/180, NX=360/STEP, NY=180/STEP;
const cellArea=lat=>R*R*STEP*rad*Math.abs(Math.sin((lat+STEP/2)*rad)-Math.sin((lat-STEP/2)*rad));
const load=f=>{const t=JSON.parse(fs.readFileSync(path.join(RAW,f)));return feature(t,t.objects[Object.keys(t.objects)[0]]).features.map(fix).filter(x=>x.geometry);};

// ---- 1) 시점별 지물 읽기
const ENT=new Map(); const ent=n=>{ if(!ENT.has(n)) ENT.set(n,{id:ENT.size,n,maxA:0,nb:new Set()}); return ENT.get(n); };
const out=[];
for(const s of SNAPS){
  let feats=load(s.file), F=[];
  if(s.src==='hb'){
    for(const f of feats){const n=(f.properties.NAME||'').trim(); if(!n) continue; const sub=(f.properties.SUBJECTO||'').trim();
      F.push({geometry:f.geometry,e:canon(sub||n),n,b:f.properties.BORDERPRECISION??null});}
  } else if(s.src==='cs'){
    const byGw=new Map(feats.map(f=>[+f.properties.gwcode,f.properties.country_name]));
    for(const f of feats){const p=f.properties; const own=byGw.get(+p.owner)||p.country_name;
      F.push({geometry:f.geometry,e:canon(own),n:p.country_name,st:p.status&&p.status!=='independent'?p.status:undefined});}
  } else {
    for(const f of feats){const p=f.properties; if(p.ADM0_A3==='ATA') continue; const ov=UN_OVERRIDE[p.ADM0_A3];
      if(p.TYPE==='Indeterminate'&&!ov) continue; // 주인이 정해지지 않은 작은 땅은 분쟁 지역 층에서만 보여 준다
      F.push({geometry:f.geometry,e:canon(ov||p.SOVEREIGNT),n:p.NAME_LONG||p.NAME,ko:p.NAME_KO,a3:p.ADM0_A3,un:ov?1:undefined});}
  }
  // 격자 표본
  const I=mkIndex(F.map(x=>({type:'Feature',geometry:x.geometry,properties:{}})));
  const grid=new Int32Array(NX*NY).fill(-1); const area=new Map(), cells=new Map();
  for(let j=0;j<NY;j++){const lat=-90+STEP/2+j*STEP, ca=cellArea(lat);
    for(let i=0;i<NX;i++){const lon=-180+STEP/2+i*STEP; const o=at(I,lon,lat); if(!o) continue; const fe=F[o.i]; const E=ent(fe.e);
      grid[j*NX+i]=E.id; area.set(E.id,(area.get(E.id)||0)+ca); (cells.get(E.id)||cells.set(E.id,[]).get(E.id)).push(i,j);}}
  for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const a=grid[j*NX+i]; if(a<0) continue; const b=grid[j*NX+((i+1)%NX)], c=j+1<NY?grid[(j+1)*NX+i]:-1;
    for(const o of [b,c]) if(o>=0&&o!==a){s.edges=(s.edges||new Set()).add(a<o?a+'_'+o:o+'_'+a);}}
  for(const f of F) ent(f.e); // 격자에 안 잡힌 작은 나라도 등록
  // 이름표 위치: 가장 큰 연결 덩어리의 중심에 가까운 칸
  const labels={};
  for(const [id,arr] of cells){ const n=arr.length/2; const set=new Set(); for(let q=0;q<n;q++) set.add(arr[2*q+1]*NX+arr[2*q]);
    let best=null; const seen=new Set();
    for(const start of set){ if(seen.has(start)) continue; const comp=[start]; seen.add(start);
      for(let h=0;h<comp.length;h++){const c=comp[h], ci=c%NX, cj=(c-ci)/NX; for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const ni=(ci+di+NX)%NX, nj=cj+dj; if(nj<0||nj>=NY) continue; const k=nj*NX+ni; if(set.has(k)&&!seen.has(k)){seen.add(k);comp.push(k);}}}
      let w=0; for(const c of comp) w+=cellArea(-90+STEP/2+((c-c%NX)/NX)*STEP); if(!best||w>best.w) best={w,comp}; }
    // 덩어리 안에서 가장자리로부터 가장 먼 칸(여러 번 깎아 내기)
    let cur=new Set(best.comp), last=cur; while(cur.size){ last=cur; const nx=new Set(); for(const c of cur){const ci=c%NX, cj=(c-ci)/NX; let inner=true; for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const nj=cj+dj; if(nj<0||nj>=NY||!cur.has(nj*NX+((ci+di+NX)%NX))){inner=false;break;}} if(inner) nx.add(c);} cur=nx; }
    const pick=[...last]; pick.sort((a,b)=>a-b); const c=pick[pick.length>>1]; const ci=c%NX, cj=(c-ci)/NX;
    labels[id]=[+(-180+STEP/2+ci*STEP).toFixed(2), +(-90+STEP/2+cj*STEP).toFixed(2)]; }
  // 격자(0.5°)에 잡히지 않은 작은 나라: 도형 면적과 첫 꼭짓점 평균으로 보충
  const tiny=new Map(); for(const f of F){const id=ent(f.e).id; if(area.has(id)) continue; let ar=geoArea({type:'Feature',geometry:f.geometry}); if(ar>2*Math.PI) ar=4*Math.PI-ar; const t=tiny.get(id)||{a:0,best:0,ll:null}; const km2=ar*R*R; t.a+=km2; if(km2>=t.best){t.best=km2; const r=rings(f.geometry)[0]||[]; let sx=0,sy=0; for(const [x,y] of r){sx+=x;sy+=y;} t.ll=[+(sx/r.length).toFixed(2),+(sy/r.length).toFixed(2)];} tiny.set(id,t);}
  for(const [id,t] of tiny){ area.set(id,t.a); if(t.ll) labels[id]=t.ll; }
  s.F=F; s.area=area; s.labels=labels; out.push(s);
  console.log(s.y, s.src, 'features', F.length, 'entities', new Set(F.map(f=>f.e)).size);
}
const E=[...ENT.values()];
for(const s of out){ for(const [id,a] of s.area) if(a>E[id].maxA) E[id].maxA=a; for(const k of s.edges||[]){const [a,b]=k.split('_').map(Number); E[a].nb.add(b); E[b].nb.add(a);} }

// ---- 2) 색 배정: OKLCH 팔레트, 이웃과 가장 먼 색을 고른다
function oklch2hex(L,C,h){const a=C*Math.cos(h*rad), b=C*Math.sin(h*rad);
  const l=(L+0.3963377774*a+0.2158037573*b)**3, m=(L-0.1055613458*a-0.0638541728*b)**3, s=(L-0.0894841775*a-1.2914855480*b)**3;
  const lin=[4.0767416621*l-3.3077115913*m+0.2309699292*s,-1.2684380046*l+2.6097574011*m-0.3413193965*s,-0.0041960863*l-0.7034186147*m+1.7076147010*s];
  return '#'+lin.map(v=>{v=Math.min(1,Math.max(0,v)); v=v<=0.0031308?12.92*v:1.055*v**(1/2.4)-0.055; return Math.round(v*255).toString(16).padStart(2,'0');}).join('');}
const PAL=[]; for(const [L,C,off] of [[0.70,0.13,0],[0.57,0.14,6],[0.82,0.10,3],[0.64,0.07,9]]) for(let h=0;h<360;h+=12) PAL.push({L,C,h:(h+off)%360,lab:[L,C*Math.cos((h+off)*rad),C*Math.sin((h+off)*rad)],hex:oklch2hex(L,C,(h+off)%360),used:0});
const dist=(p,q)=>Math.hypot((p.lab[0]-q.lab[0])*1.2,p.lab[1]-q.lab[1],p.lab[2]-q.lab[2]);
const GROUP=new Map(); for(const [g,ms] of Object.entries(TX.groups||{})){GROUP.set(g,g); for(const m of ms) GROUP.set(canon(m),g);}
const NSRE=new RegExp(TX.nonstate.regex,'i'), NSSET=new Set(TX.nonstate.list.map(canon));
for(const e of E){ e.ns=NSRE.test(e.n)||NSSET.has(e.n); e.g=GROUP.get(e.n)||e.n; }
// 묶음 단위 노드로 합친다
const NODE=new Map(); for(const e of E){ let n=NODE.get(e.g); if(!n){n={k:e.g,maxA:0,nb:new Set(),ns:e.ns,members:[]};NODE.set(e.g,n);} n.members.push(e); n.maxA=Math.max(n.maxA,e.maxA); }
for(const e of E) for(const i of e.nb){ const o=E[i].g; if(o!==e.g) NODE.get(e.g).nb.add(o); }
const order=[...NODE.values()].sort((a,b)=>(a.ns-b.ns)||b.maxA-a.maxA);
for(const e of order){ if(e.ns){ e.c=-1; for(const m of e.members) m.c=-1; continue; }
  const nbc=[...e.nb].map(k=>NODE.get(k).c).filter(c=>c!==undefined&&c>=0).map(c=>PAL[c]);
  let best=-1,bs=-1; PAL.forEach((p,i)=>{ const d=nbc.length?Math.min(...nbc.map(q=>dist(p,q))):1; const sc=d-p.used*0.004; if(sc>bs){bs=sc;best=i;} });
  e.c=best; PAL[best].used++; for(const m of e.members) m.c=best; }
let clash=0, pairs=0; for(const e of E) for(const i of e.nb) if(i>e.id&&e.c>=0&&E[i].c>=0&&e.g!==E[i].g){pairs++; if(dist(PAL[e.c],PAL[E[i].c])<0.06) clash++;}
console.log('entities',E.length,'adjacent pairs',pairs,'near-identical neighbour colours',clash);

// ---- 3) 한글 이름: 직접 쓴 사전 → Natural Earth의 NAME_KO
const KO=new Map(Object.entries(TX.names));
{ const t=JSON.parse(fs.readFileSync(path.join(RAW,'n_usa.json'))); for(const g of t.objects[Object.keys(t.objects)[0]].geometries){const p=g.properties; for(const k of [p.NAME,p.NAME_LONG,p.ADMIN,p.SOVEREIGNT]) if(k&&p.NAME_KO&&!KO.has(canon(k))&&(k===p.NAME||k===p.NAME_LONG||k===p.ADMIN)) KO.set(canon(k),p.NAME_KO);} }
const ko=n=>KO.get(n)||KO.get(canon(n))||null;
if(process.env.MISSING){ console.log(E.slice().sort((a,b)=>b.maxA-a.maxA).filter(e=>!ko(e.n)).slice(0,+process.env.MISSING).map(e=>`${e.n} (${(e.maxA/1e6).toFixed(2)})`).join(' | ')); }

// ---- 4) 2026 분쟁 지역: 유엔(직접 정리) · 미국·한국(Natural Earth 관점 지도에서 읽음)
const IU=mkIndex(load('n_usa.json').map(f=>({type:'Feature',geometry:f.geometry,properties:f.properties})));
const kf=load('n_kor.json'), IK=mkIndex(kf.map(f=>({type:'Feature',geometry:f.geometry,properties:f.properties})));
const who=(I,ll)=>{ for(const d of [0,0.05,0.15,0.4]) for(const [dx,dy] of [[0,0],[d,0],[-d,0],[0,d],[0,-d]]){const o=at(I,ll[0]+dx,ll[1]+dy); if(o) return o.f.properties; if(!d) break;} return null; };
const SKIP=/Lease|Overlay/;
const disp=load('n_disputed.json').filter(f=>!SKIP.test(f.properties.TYPE||'')).map(f=>{const p=f.properties; const name=(p.BRK_NAME||p.NAME||'').replace(/^﻿/,'');
  const rs=rings(f.geometry); let sx=0,sy=0,n=0; for(const [x,y] of rs[0]||[]){sx+=x;sy+=y;n++;} const c=[sx/n,sy/n];
  const u=who(IU,c), k=who(IK,c); const nm=q=>q?(ko(canon(q.SOVEREIGNT))||q.SOVEREIGNT)+(q.NAME!==q.SOVEREIGNT&&q.ADMIN!==q.SOVEREIGNT?` (${q.NAME_KO||q.NAME})`:''):null;
  return {type:'Feature',geometry:f.geometry,properties:{n:name,ko:TX.disputedNames?.[name]||p.NAME_KO||null,note:p.NOTE_BRK||null,un:TX.unRules[name]||null,us:nm(u),kr:nm(k),ll:c.map(v=>+v.toFixed(2))}}; });
console.log('disputed areas',disp.length,'with UN note',disp.filter(d=>d.properties.un).length);
// 미국·한국 관점이 갈리는 곳(격자 비교)
{ const diff={}; for(let lat=-89.75;lat<90;lat+=0.5)for(let lon=-179.75;lon<180;lon+=0.5){const a=at(IU,lon,lat),b=at(IK,lon,lat); const x=a?.f.properties.SOVEREIGNT||'-', y=b?.f.properties.SOVEREIGNT||'-'; if(x!==y){const k=x+' ↔ '+y; diff[k]=(diff[k]||0)+1;}} console.log('USA vs KOR POV differences (cells):',JSON.stringify(diff)); }

// ---- 5) 출력
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const OUT=path.join(ROOT,'ko','hegemony','map'); fs.mkdirSync(path.join(OUT,'data'),{recursive:true}); fs.mkdirSync(path.join(OUT,'lib'),{recursive:true});
const index={snaps:[],ents:E.map(e=>({n:e.n,ko:ko(e.n),...(e.c>=0?{c:PAL[e.c].hex}:{ns:1})}))};
let bytes=0;
for(const s of out){
  const fc={type:'FeatureCollection',features:s.F.map(f=>({type:'Feature',geometry:f.geometry,properties:{e:ENT.get(f.e).id,n:f.n,...(f.ko?{k:f.ko}:ko(f.n)?{k:ko(f.n)}:{}),...(f.b!=null?{b:f.b}:{}),...(f.st?{st:f.st}:{}),...(f.un?{un:1}:{})}}))};
  const objs={w:fc}; if(s.src==='ne') objs.d={type:'FeatureCollection',features:disp};
  const txt=JSON.stringify(topology(objs,1e5)); bytes+=txt.length; fs.writeFileSync(path.join(OUT,'data',`${s.y}.json`),txt);
  const top=[...s.area].sort((a,b)=>b[1]-a[1]).map(([id,a])=>[id,a>=1000?Math.round(a/1000):+(a/1000).toFixed(3)]);
  index.snaps.push({y:s.y,src:s.src,date:s.date||null,top,labels:s.labels});
}
fs.writeFileSync(path.join(OUT,'index.json'),JSON.stringify(index));
const land=JSON.parse(fs.readFileSync(path.join(HERE,'node_modules/world-atlas/land-110m.json'))); fs.writeFileSync(path.join(OUT,'data','land.json'),JSON.stringify(land));
fs.copyFileSync(path.join(HERE,'node_modules/d3/dist/d3.min.js'),path.join(OUT,'lib/d3.min.js'));
fs.copyFileSync(path.join(HERE,'node_modules/topojson-client/dist/topojson-client.min.js'),path.join(OUT,'lib/topojson-client.min.js'));
let html=fs.readFileSync(path.join(HERE,'template.html'),'utf8').replace('{{css}}',fs.readFileSync(path.join(HERE,'style.css'),'utf8')).replace('{{ui}}',JSON.stringify(PG.ui).replace(/</g,'\\u003c'))
  .replace('{{sourcesHtml}}',`<ol>${PG.sources.map(([t,u])=>`<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join('')}</ol>`);
for(const [k,v] of Object.entries(PG)) if(typeof v==='string') html=html.split('{{'+k+'}}').join(k.endsWith('Html')?v:esc(v));
if(html.includes('{{')) throw new Error('치환 안 된 자리표시자 '+html.match(/\{\{\w+\}\}/)[0]);
fs.writeFileSync(path.join(OUT,'index.html'),html);
console.log('data bytes',(bytes/1e6).toFixed(1)+'MB','index',(JSON.stringify(index).length/1e3).toFixed(0)+'KB');
