// 세계 영토 지도(기원전 3000 ~ 2026) 빌드
//  raw/ 의 시점별 국경 → {lang}/hegemony/map/data/*.json + index.json + index.html
//  · 색: 나라(주권 주체)마다 하나. 어느 시점에든 국경을 맞댄 나라끼리는 서로 다른 색이 되도록 배정
//  · 0.5° 격자 표본으로 인접 관계·면적·이름표 위치를 계산
import fs from 'fs'; import path from 'path'; import {fileURLToPath} from 'url';
import Flatbush from 'flatbush'; import {geoArea} from 'd3-geo'; import {feature} from 'topojson-client'; import {topology} from 'topojson-server';
const HERE=path.dirname(fileURLToPath(import.meta.url));
const RAW=path.join(HERE,'raw'), ROOT=path.join(HERE,'../../..');
const J=f=>JSON.parse(fs.readFileSync(path.join(HERE,f),'utf8'));
const TX=J('ko.json'); // 구조(문화권 판정, 색 묶음)와 한국어 이름. 언어별 글은 {lang}.json · {lang}.page.json · fixes.{lang}.json
const LANGS=[['ko','한국어'],['en','English'],['id','Bahasa Indonesia']].filter(([c])=>!process.env.LANGS||process.env.LANGS.split(',').includes(c));

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
function at(I,x,y){const c=I.ix.search(x,y,x,y).map(i=>I.items[i]).filter(o=>o&&pip(o.rs,x,y)); if(!c.length) return null; c.sort((a,b)=>((b.f.properties.top|0)-(a.f.properties.top|0))||a.a-b.a); return c[0];} // 덧그린 패치가 먼저, 그다음 가장 작은 영역
const STEP=0.5, R=6371.0088, rad=Math.PI/180, NX=360/STEP, NY=180/STEP;
const cellArea=lat=>R*R*STEP*rad*Math.abs(Math.sin((lat+STEP/2)*rad)-Math.sin((lat-STEP/2)*rad));
const load=f=>{const t=JSON.parse(fs.readFileSync(path.join(RAW,f)));return feature(t,t.objects[Object.keys(t.objects)[0]]).features.map(fix).filter(x=>x.geometry);};

const NSRE=new RegExp(TX.nonstate.regex,'i'), NSSET=new Set(TX.nonstate.list.map(canon));
const isNs=n=>NSRE.test(n)||NSSET.has(n);
const CLIO=J('clio.json');
// ---- 보정(fixes.json). hegemony/atlas에서 검증한 보정을 옮겨 온 것 + 이 지도에서 따로 찾은 것
const FX=J('fixes.json'); const FXN={...FX.notes};
// 강대국 15곳의 식민지·속령 표기를 한 주체로 모으는 규칙(atlas build.mjs와 같은 규칙). 1492년 이후 historical-basemaps에만 쓴다
const base=(n,s)=>{ const S=re=>re.test(s), N=re=>re.test(n);
  if(S(/United Kingdom of (the )?Netherlands/)) return 'nl';
  if(S(/United Kingdom|Great Britain|^England|British|\(UK\)|^UK$/)||N(/\(UK\)|\(GB\)|British/)) return 'gb';
  if(S(/^France|French/)||N(/\(France\)|\(FR\)/)) return 'fr';
  if(S(/^Spain|Spanish|Castil|Viceroyalty of (New Spain|Peru|the Río de la Plata|New Granada)/)||N(/\(Spain\)/)) return 'es';
  if(S(/^Portugal|Portuguese/)||N(/\(Portugal\)/)) return 'pt';
  if(S(/^Netherlands|Neterlands|Dutch|^Holland|Netherlands Indies/)) return 'nl';
  if(S(/Russia|Muscovy|Moscow|USSR|Soviet/)&&!S(/White Russia/)) return 'ru';
  if(S(/Ottoman|^Turkey$/)) return 'ot';
  if(S(/Ming|Qing|Manchu Empire|^China$|Chinese/)) return 'cn';
  if(S(/United States|^USA$/)) return 'us';
  if(S(/^Germany|German Empire|Prussia|Brandenburg/)) return 'de';
  if(S(/Austria|Austro|Habsburg/)&&!S(/Spanish/)) return 'at';
  if(S(/Japan/)) return 'jp'; if(S(/^Italy|Italian/)) return 'it'; if(S(/^Belgium|Belgian/)) return 'be'; if(S(/Mughal/)) return 'mg';
  return null; };
// atlas 시점 사이에 낀 시점(예: 1500, 1886)은 앞뒤 atlas 시점의 값이 같을 때만 따른다
const CAP={gb:[-0.1,51.5],fr:[2.35,48.85],es:[-3.7,40.4],pt:[-9.14,38.72],nl:[4.9,52.37],ru:[37.6,55.75],ot:[28.98,41.01],cn:[116.4,39.9],us:[-77.04,38.9],de:[13.4,52.52],at:[16.37,48.2],jp:[135.77,35.01],it:[12.5,41.9],be:[4.35,50.85],mg:[78,27.18]};
const AY=FX.atlasYears; const around=y=>{ if(y<AY[0]||y>AY.at(-1)) return null; let a=AY[0],b=AY.at(-1); for(const v of AY){ if(v<=y) a=v; } for(const v of AY.slice().reverse()){ if(v>=y) b=v; } return [a,b]; };
const inYears=(list,y)=>{ if(list.includes(y)) return true; const ab=around(y); return !!ab&&list.includes(ab[0])&&list.includes(ab[1]); };
const rangeAt=(r,y)=>r.find(([a,b])=>a<=y&&y<=b)||null;
const rangeFor=(p,y)=>{ if(p.exact) return rangeAt(p.r,y); const ab=around(y); if(!ab) return null; const A=rangeAt(p.r,ab[0]), B=rangeAt(p.r,ab[1]); if(!A||!B||A[2]!==B[2]) return null;
  if(p.polyYears&&!(p.polyYears.includes(ab[0])&&p.polyYears.includes(ab[1]))) return null; return A; };
function cwPoly(c){ const p={type:'Polygon',coordinates:[c[0][0]===c.at(-1)[0]&&c[0][1]===c.at(-1)[1]?c:[...c,c[0]]]}; if(geoArea(p)>2*Math.PI) p.coordinates[0]=p.coordinates[0].slice().reverse(); return p; }
const fArea=g=>{ let a=geoArea({type:'Feature',geometry:g}); return a>2*Math.PI?4*Math.PI-a:a; };
const GRL=load('n_usa.json').find(f=>f.properties.ADM0_A3==='GRL');
// 이름표 위치: 가장 큰 연결 덩어리 안에서 가장자리로부터 가장 먼 칸
function labelsOf(cells){ const labels={};
  for(const [id,arr] of cells){ const n=arr.length/2; const set=new Set(); for(let q=0;q<n;q++) set.add(arr[2*q+1]*NX+arr[2*q]);
    let best=null; const seen=new Set();
    for(const start of set){ if(seen.has(start)) continue; const comp=[start]; seen.add(start);
      for(let h=0;h<comp.length;h++){const c=comp[h], ci=c%NX, cj=(c-ci)/NX; for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const ni=(ci+di+NX)%NX, nj=cj+dj; if(nj<0||nj>=NY) continue; const k=nj*NX+ni; if(set.has(k)&&!seen.has(k)){seen.add(k);comp.push(k);}}}
      let w=0; for(const c of comp) w+=cellArea(-90+STEP/2+((c-c%NX)/NX)*STEP); if(!best||w>best.w) best={w,comp}; }
    // 덩어리 안에서 가장자리로부터 가장 먼 칸(여러 번 깎아 내기)
    let cur=new Set(best.comp), last=cur; while(cur.size){ last=cur; const nx=new Set(); for(const c of cur){const ci=c%NX, cj=(c-ci)/NX; let inner=true; for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1]]){const nj=cj+dj; if(nj<0||nj>=NY||!cur.has(nj*NX+((ci+di+NX)%NX))){inner=false;break;}} if(inner) nx.add(c);} cur=nx; }
    const pick=[...last]; pick.sort((a,b)=>a-b); const c=pick[pick.length>>1]; const ci=c%NX, cj=(c-ci)/NX;
    labels[id]=[+(-180+STEP/2+ci*STEP).toFixed(2), +(-90+STEP/2+cj*STEP).toFixed(2)]; }
  return labels; }
// ---- 1) 시점별 지물 읽기
const ENT=new Map(), EL=[]; const E0=i=>EL[i]; const ent=n=>{ if(!ENT.has(n)){ const o={id:ENT.size,n,maxA:0,nb:new Set()}; ENT.set(n,o); EL.push(o);} return ENT.get(n); };
const out=[];
for(const s of SNAPS){
  let feats=load(s.file), F=[];
  if(s.src==='hb'){
    const CLIP=fs.existsSync(path.join(RAW,'clip',`${s.y}.json`))?JSON.parse(fs.readFileSync(path.join(RAW,'clip',`${s.y}.json`))).features.map(fix):[];
    const cdef=(FX.clip||[]).filter(c=>c.y.includes(s.y)), REPL=new Set(cdef.filter(c=>c.replace).map(c=>c.from));
    s.clip=CLIP.map(f=>{const p=f.properties, c=cdef.find(c=>c.from===p.from)||{}; const nm=(c.rename||{})[p.n]||p.n; return {geometry:f.geometry,e:p.to&&p.to[0]==='@'?null:canon(p.to||CLIO.alias[nm]||nm),toKey:p.to&&p.to[0]==='@'?p.to:null,n:p.n,fx:p.note,top:1};});
    for(const f of feats){const sub=(f.properties.SUBJECTO||'').trim(); const n=(f.properties.NAME||'').trim()||(s.y>=1492&&base('',sub)?sub:''); if(!n) continue; // 이름 없이 소속만 적힌 식민지도 살린다
      let e=sub||n, k=s.y>=1492?base(n,sub):null, fx; if(k&&!inYears(FX.powerYears[k]||[],s.y)) k=null; // 그 강대국이 atlas에서 다뤄지는 시기에만 묶는다
      if(sub==='Mongol Empire'&&s.y>=1300) e=n;            // 1294년 이후 몽골 제국은 사실상 네 칸국으로 갈라져 있었다(교차검증에서 확인)
      let drop=REPL.has(canon(e));
      for(const r of FX.hb) if((r.exact?r.y.includes(s.y):inYears(r.y,s.y))&&(r.n?new RegExp('^('+r.n+')$').test(n):canon(e)===r.e)){ fx=r.note; if(r.drop) drop=true; else if(r.to&&r.to[0]==='@') k=r.to.slice(1); else if(r.to){ k=null; e=r.to; } break; }
      if(drop) continue;
      F.push({geometry:f.geometry,e:canon(e),n,b:f.properties.BORDERPRECISION??null,k,fx});}
  } else if(s.src==='cs'){
    const byGw=new Map(feats.map(f=>[+f.properties.gwcode,f.properties.country_name]));
    for(const f of feats){const p=f.properties; const own=byGw.get(+p.owner)||p.country_name;
      F.push({geometry:f.geometry,e:canon(own),n:p.country_name,st:p.status&&p.status!=='independent'?p.status:undefined});}
    // CShapes에는 그린란드가 없다(교차검증에서 확인). Natural Earth 도형으로 보충: 이 기간 내내 덴마크령
    F.push({geometry:GRL.geometry,e:'Denmark',n:'Greenland',st:s.y<1953?'colony':undefined});
  } else {
    for(const f of feats){const p=f.properties; if(p.ADM0_A3==='ATA') continue; const ov=UN_OVERRIDE[p.ADM0_A3];
      if(p.TYPE==='Indeterminate'&&!ov) continue; // 주인이 정해지지 않은 작은 땅은 분쟁 지역 층에서만 보여 준다
      F.push({geometry:f.geometry,e:canon(ov||p.SOVEREIGNT),n:p.NAME_LONG||p.NAME,ne:{ko:p.NAME_KO,en:p.NAME_EN,id:p.NAME_ID},a3:p.ADM0_A3,un:ov?1:undefined});}
  }
  // 강대국 키 → 이 시점의 본국 주체(그 키로 묶이는 지물 가운데 면적이 가장 큰 이름)
  const HOME={}; { const acc={};
    for(const f of F){ const k=s.src==='hb'?(f.fx?null:f.k):base(f.e,f.e); if(!k) continue; const o=acc[k]=acc[k]||new Map(); const v=o.get(f.e)||[0,0]; v[0]+=fArea(f.geometry);
      const c=CAP[k]; if(c&&!v[1]&&pip(rings(f.geometry),c[0],c[1])) v[1]=1; o.set(f.e,v); } // 수도가 들어 있는 주체를 본국으로 본다. 없으면 가장 넓은 주체
    for(const [k,o] of Object.entries(acc)) HOME[k]=[...o].sort((a,b)=>(b[1][1]-a[1][1])||b[1][0]-a[1][0])[0][0]; if(process.env.HOME_LOG) console.log('  home',s.y,JSON.stringify(HOME)); }
  const target=to=>!to?null:to[0]==='@'?(HOME[to.slice(1)]||null):canon(to);
  if(s.src==='hb') for(const f of F) if(f.k){ const h=HOME[f.k]; if(h) f.e=h; else if(f.fx) console.log('  보정 대상 없음',s.y,f.n,f.k); }
  for(const c of s.clip||[]){ if(c.toKey){ c.e=target(c.toKey); if(!c.e){ console.log('  조각 대상 없음',s.y,c.n,c.toKey); continue; } } F.push(c); } // Cliopatria 경계를 빌린 교정 조각
  for(const p of FX.patches){ const r=rangeFor(p,s.y); if(!r) continue; const e=target(r[2]); if(!e){ console.log('  패치 대상 없음',s.y,p.id,r[2]); continue; }
    FXN['p:'+p.id+':'+r[0]]=r[3]; F.push({geometry:cwPoly(p.poly),e,n:p.id,pid:p.id,fx:'p:'+p.id+':'+r[0],top:1}); }
  // 격자 표본
  const I=mkIndex(F.map(x=>({type:'Feature',geometry:x.geometry,properties:{top:x.top}})));
  const grid=new Int32Array(NX*NY).fill(-1); const area=new Map(), cells=new Map();
  for(let j=0;j<NY;j++){const lat=-90+STEP/2+j*STEP, ca=cellArea(lat);
    for(let i=0;i<NX;i++){const lon=-180+STEP/2+i*STEP; const o=at(I,lon,lat); if(!o) continue; const fe=F[o.i]; const E=ent(fe.e);
      grid[j*NX+i]=E.id; area.set(E.id,(area.get(E.id)||0)+ca); (cells.get(E.id)||cells.set(E.id,[]).get(E.id)).push(i,j);}}
  for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const a=grid[j*NX+i]; if(a<0) continue; const b=grid[j*NX+((i+1)%NX)], c=j+1<NY?grid[(j+1)*NX+i]:-1;
    for(const o of [b,c]) if(o>=0&&o!==a){s.edges=(s.edges||new Set()).add(a<o?a+'_'+o:o+'_'+a);}}
  for(const f of F) ent(f.e).main=true; // 격자에 안 잡힌 작은 나라도 등록
  const labels=labelsOf(cells);
  // 격자(0.5°)에 잡히지 않은 작은 나라: 도형 면적과 첫 꼭짓점 평균으로 보충
  const tiny=new Map(); for(const f of F){const id=ent(f.e).id; if(area.has(id)) continue; let ar=geoArea({type:'Feature',geometry:f.geometry}); if(ar>2*Math.PI) ar=4*Math.PI-ar; const t=tiny.get(id)||{a:0,best:0,ll:null}; const km2=ar*R*R; t.a+=km2; if(km2>=t.best){t.best=km2; const r=rings(f.geometry)[0]||[]; let sx=0,sy=0; for(const [x,y] of r){sx+=x;sy+=y;} t.ll=[+(sx/r.length).toFixed(2),+(sy/r.length).toFixed(2)];} tiny.set(id,t);}
  for(const [id,t] of tiny){ area.set(id,t.a); if(t.ll) labels[id]=t.ll; }
  // 보충 층(Cliopatria에만 있는 땅). verify.mjs가 raw/sup/에 만들어 둔다. 이 지도가 나라로 칠한 칸은 건드리지 않는다
  const sf=path.join(RAW,'sup',`${s.y}.json`);
  if(fs.existsSync(sf)){
    const S=JSON.parse(fs.readFileSync(sf)).features.map(fix).map(f=>({geometry:f.geometry,e:canon(CLIO.alias[f.properties.n]||f.properties.n),n:f.properties.n}));
    const IS=mkIndex(S.map(x=>({type:'Feature',geometry:x.geometry,properties:{}})));
    const g2=new Int32Array(NX*NY).fill(-1), sarea=new Map(), scells=new Map(), isSup=new Uint8Array(NX*NY);
    for(let j=0;j<NY;j++){const lat=-90+STEP/2+j*STEP, ca=cellArea(lat);
      for(let i=0;i<NX;i++){const q=j*NX+i, m=grid[q]; if(m>=0&&!isNs(E0(m).n)){g2[q]=m; continue;}
        const o=at(IS,-180+STEP/2+i*STEP,lat); if(!o) continue; const id=ent(S[o.i].e).id; g2[q]=id; isSup[q]=1; sarea.set(id,(sarea.get(id)||0)+ca); (scells.get(id)||scells.set(id,[]).get(id)).push(i,j);}}
    for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){const q=j*NX+i, a=g2[q]; if(a<0) continue; const q1=j*NX+((i+1)%NX), q2=j+1<NY?(j+1)*NX+i:-1;
      for(const qq of [q1,q2]){ if(qq<0) continue; const o=g2[qq]; if(o>=0&&o!==a&&(isSup[q]||isSup[qq])) (s.edges=s.edges||new Set()).add(a<o?a+'_'+o:o+'_'+a);}}
    s.S=S.filter(x=>sarea.has(ent(x.e).id)); s.sarea=sarea; s.slabels=labelsOf(scells);
  }
  s.F=F; s.area=area; s.labels=labels; out.push(s);
  console.log(s.y, s.src, 'features', F.length, 'entities', new Set(F.map(f=>f.e)).size);
}
const E=[...ENT.values()];
for(const s of out){ for(const [id,a] of [...s.area,...(s.sarea||[])]) if(a>E[id].maxA) E[id].maxA=a; for(const k of s.edges||[]){const [a,b]=k.split('_').map(Number); E[a].nb.add(b); E[b].nb.add(a);} }

// ---- 2) 색 배정: OKLCH 팔레트, 이웃과 가장 먼 색을 고른다
function oklch2hex(L,C,h){const a=C*Math.cos(h*rad), b=C*Math.sin(h*rad);
  const l=(L+0.3963377774*a+0.2158037573*b)**3, m=(L-0.1055613458*a-0.0638541728*b)**3, s=(L-0.0894841775*a-1.2914855480*b)**3;
  const lin=[4.0767416621*l-3.3077115913*m+0.2309699292*s,-1.2684380046*l+2.6097574011*m-0.3413193965*s,-0.0041960863*l-0.7034186147*m+1.7076147010*s];
  return '#'+lin.map(v=>{v=Math.min(1,Math.max(0,v)); v=v<=0.0031308?12.92*v:1.055*v**(1/2.4)-0.055; return Math.round(v*255).toString(16).padStart(2,'0');}).join('');}
const PAL=[]; for(const [L,C,off] of [[0.70,0.13,0],[0.57,0.14,6],[0.82,0.10,3],[0.64,0.07,9]]) for(let h=0;h<360;h+=12) PAL.push({L,C,h:(h+off)%360,lab:[L,C*Math.cos((h+off)*rad),C*Math.sin((h+off)*rad)],hex:oklch2hex(L,C,(h+off)%360),used:0});
const dist=(p,q)=>Math.hypot((p.lab[0]-q.lab[0])*1.2,p.lab[1]-q.lab[1],p.lab[2]-q.lab[2]);
const GROUP=new Map(); for(const [g,ms] of Object.entries(TX.groups||{})){GROUP.set(g,g); for(const m of ms) GROUP.set(canon(m),g);}
for(const e of E){ e.ns=e.main?isNs(e.n):false; e.x=!e.main; e.g=GROUP.get(e.n)||e.n; }
// 묶음 단위 노드로 합친다
const NODE=new Map(); for(const e of E){ let n=NODE.get(e.g); if(!n){n={k:e.g,maxA:0,nb:new Set(),ns:e.ns,x:true,members:[]};NODE.set(e.g,n);} n.members.push(e); if(!e.x) n.x=false; n.maxA=Math.max(n.maxA,e.maxA); }
for(const e of E) for(const i of e.nb){ const o=E[i].g; if(o!==e.g) NODE.get(e.g).nb.add(o); }
const order=[...NODE.values()].sort((a,b)=>(a.ns-b.ns)||(a.x-b.x)||b.maxA-a.maxA); // 보충 층에만 나오는 나라는 나중에 칠해 본 지도의 색을 흔들지 않는다
for(const e of order){ if(e.ns){ e.c=-1; for(const m of e.members) m.c=-1; continue; }
  const nbc=[...e.nb].map(k=>NODE.get(k).c).filter(c=>c!==undefined&&c>=0).map(c=>PAL[c]);
  let best=-1,bs=-1; PAL.forEach((p,i)=>{ const d=nbc.length?Math.min(...nbc.map(q=>dist(p,q))):1; const sc=d-p.used*0.004; if(sc>bs){bs=sc;best=i;} });
  e.c=best; PAL[best].used++; for(const m of e.members) m.c=best; }
let clash=0, pairs=0; for(const e of E) for(const i of e.nb) if(i>e.id&&e.c>=0&&E[i].c>=0&&e.g!==E[i].g){pairs++; if(dist(PAL[e.c],PAL[E[i].c])<0.06) clash++;}
console.log('entities',E.length,'adjacent pairs',pairs,'near-identical neighbour colours',clash);

// ---- 3) 언어별 이름: 직접 쓴 사전 → Natural Earth의 NAME_{KO,EN,ID} → (인도네시아어만) 규칙 변환
for(const [a,b] of Object.entries(CLIO.alias)) if(!ENT.get(canon(b))?.main&&!CLIO.ko[b]) console.log('clio.json alias 대상이 본 지도에 없음:',a,'→',b);
const NEP=JSON.parse(fs.readFileSync(path.join(RAW,'n_usa.json'))); const NEG=NEP.objects[Object.keys(NEP.objects)[0]].geometries.map(g=>g.properties);
// 인도네시아어: 사전에 없는 역사 국가 이름은 흔한 낱말만 규칙으로 바꾼다(고유명사는 그대로)
const ID_RULES=[[/^Grand Duchy of (.+)$/,'Kadipaten Agung $1'],[/^(?:Kingdom|Kingdoms) of (.+)$/,'Kerajaan $1'],[/^Empire of (.+)$/,'Kekaisaran $1'],[/^Sultanate of (.+)$/,'Kesultanan $1'],[/^Khanate of (?:the )?(.+)$/,'Kekhanan $1'],[/^Emirate of (.+)$/,'Keamiran $1'],
  [/^Duchy of (.+)$/,'Kadipaten $1'],[/^Principality of (.+)$/,'Kepangeranan $1'],[/^Republic of (.+)$/,'Republik $1'],[/^Viceroyalty of (?:the )?(.+)$/,'Kewalirajaan $1'],[/^Caliphate of (.+)$/,'Kekhalifahan $1'],[/^County of (.+)$/,'Kabupaten $1'],
  [/^(.+) Empire$/,'Kekaisaran $1'],[/^(.+) (?:Kingdom|kingdoms?)$/,'Kerajaan $1'],[/^(.+) Sultanate$/,'Kesultanan $1'],[/^(.+) (?:Khanate|Khaganate|khanates)$/,'Kekhanan $1'],[/^(.+) Caliphate$/,'Kekhalifahan $1'],[/^(.+) (?:Dynasty|dynasty)$/,'Dinasti $1'],
  [/^(.+) (?:Emirate|Emirates)$/,'Keamiran $1'],[/^(.+) Republic$/,'Republik $1'],[/^(.+) (?:Confederation|Confederacy|confederation)$/,'Konfederasi $1'],[/^(.+) city-states$/,'Negara-kota $1'],[/^(.+) (?:states|States)$/,'Negara-negara $1'],[/^(.+) (?:chiefdoms)$/,'Kepala-suku $1'],
  [/^(.+) tribes$/,'Suku-suku $1'],[/^(.+) hunter-gatherers$/,'Pemburu-peramu $1'],[/^(.+) (?:cultures?|Culture)$/,'Budaya $1'],[/^(.+) peoples?$/,'Bangsa $1'],[/^(.+) (?:Islands|Is\.)$/,'Kepulauan $1'],[/^(.+) Horde$/,'Gerombolan $1'],[/^(.+) farmers$/,'Petani $1'],[/^(.+) nomads$/,'Pengembara $1'],[/^(.+) principalities$/,'Kepangeranan-kepangeranan $1']];
// 나머지 부분이 고유명사 한두 낱말일 때만 바꾼다(영어 형용사가 섞이면 어색해지므로 영어 이름을 그대로 둔다)
const ID_SKIP=/\b(Eastern|Western|Northern|Southern|Central|North|South|East|West|Upper|Lower|Great|Greater|Old|New|American|African|European|Asian|Roman|Islamic|Hindu|Buddhist|Christian|Arabian|Saharan|Australian|Indian|Burmese|Malaysian|minor|and|of|the)\b/;
const idRule=n=>{ for(const [re,to] of ID_RULES){ const m=n.match(re); if(!m) continue; const r=m[1]; if(ID_SKIP.test(r)||!/^\p{Lu}[\p{L}'’.\-]*( \p{Lu}[\p{L}'’.\-]*)?$/u.test(r)) return null; return n.replace(re,to); } return null; };
function namer(lang){ const L=lang==='ko'?TX:J(lang+'.json'); const M=new Map(Object.entries(L.names||{}));
  if(lang==='ko') for(const [k,v] of Object.entries(CLIO.ko)) if(!M.has(k)) M.set(k,v);
  if(lang!=='en'){ const F='NAME_'+lang.toUpperCase(); for(const p of NEG) for(const k of [p.NAME,p.NAME_LONG,p.ADMIN]) if(k&&p[F]&&!M.has(canon(k))) M.set(canon(k),p[F]); }
  return n=>M.get(n)||M.get(canon(n))||(lang==='id'?idRule(n):null)||null; }
const ko=namer('ko');
if(process.env.MISSINGX){ console.log(JSON.stringify(E.filter(e=>e.x&&!ko(e.n)).sort((a,b)=>b.maxA-a.maxA).map(e=>e.n))); }
if(process.env.MISSING){ const f=namer(process.env.MISSING_LANG||'ko'); console.log(E.slice().sort((a,b)=>b.maxA-a.maxA).filter(e=>!f(e.n)).slice(0,+process.env.MISSING).map(e=>`${e.n} (${(e.maxA/1e6).toFixed(2)})`).join(' | ')); }

// ---- 4) 2026 분쟁 지역: 유엔(직접 정리) · 미국·한국(Natural Earth 관점 지도에서 읽음)
const IU=mkIndex(load('n_usa.json').map(f=>({type:'Feature',geometry:f.geometry,properties:f.properties})));
const kf=load('n_kor.json'), IK=mkIndex(kf.map(f=>({type:'Feature',geometry:f.geometry,properties:f.properties})));
const who=(I,ll)=>{ for(const d of [0,0.05,0.15,0.4]) for(const [dx,dy] of [[0,0],[d,0],[-d,0],[0,d],[0,-d]]){const o=at(I,ll[0]+dx,ll[1]+dy); if(o) return o.f.properties; if(!d) break;} return null; };
const SKIP=/Lease|Overlay/;
const disp=load('n_disputed.json').filter(f=>!SKIP.test(f.properties.TYPE||'')).map(f=>{const p=f.properties; const name=(p.BRK_NAME||p.NAME||'').replace(/^﻿/,'');
  const rs=rings(f.geometry); let sx=0,sy=0,n=0; for(const [x,y] of rs[0]||[]){sx+=x;sy+=y;n++;} const c=[sx/n,sy/n];
  return {geometry:f.geometry,name,p,u:who(IU,c),k:who(IK,c),c}; });
const dispFor=(lang,L,loc)=>disp.map(d=>{ const F='NAME_'+lang.toUpperCase(); const nm=q=>q?(loc(canon(q.SOVEREIGNT))||q.SOVEREIGNT)+(q.NAME!==q.SOVEREIGNT&&q.ADMIN!==q.SOVEREIGNT?` (${q[F]||q.NAME})`:''):null;
  const local=L.disputedNames?.[d.name]||(lang==='en'?null:d.p[F])||null;
  return {type:'Feature',geometry:d.geometry,properties:{n:d.name,ko:local&&local!==d.name?local:null,note:d.p.NOTE_BRK||null,un:L.unRules[d.name]||null,us:nm(d.u),kr:nm(d.k),ll:d.c.map(v=>+v.toFixed(2))}}; });
console.log('disputed areas',disp.length,'with UN note',disp.filter(d=>TX.unRules[d.name]).length);
// 미국·한국 관점이 갈리는 곳(격자 비교)
{ const diff={}; for(let lat=-89.75;lat<90;lat+=0.5)for(let lon=-179.75;lon<180;lon+=0.5){const a=at(IU,lon,lat),b=at(IK,lon,lat); const x=a?.f.properties.SOVEREIGNT||'-', y=b?.f.properties.SOVEREIGNT||'-'; if(x!==y){const k=x+' ↔ '+y; diff[k]=(diff[k]||0)+1;}} console.log('USA vs KOR POV differences (cells):',JSON.stringify(diff)); }

// ---- 5) 출력
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const VER=fs.existsSync(path.join(HERE,'verify.json'))?J('verify.json'):{};
const usedFx=new Set(out.flatMap(s=>s.F.map(f=>f.fx).filter(Boolean)));
const land=fs.readFileSync(path.join(HERE,'node_modules/world-atlas/land-110m.json'));
for(const [lang] of LANGS){
  const L=lang==='ko'?TX:J(lang+'.json'), PG=J(lang+'.page.json'), FL=lang==='ko'?null:J(`fixes.${lang}.json`), loc=namer(lang);
  // 보정 주석과 덧그린 영역의 이름
  const note=k=>{ if(!FL) return FXN[k]; const m=k.match(/^p:(.+):(-?\d+)$/); const v=m?FL.patches?.[m[1]]?.r?.[m[2]]:FL.notes?.[k]; if(!v) throw new Error(`${lang}: 보정 주석 ${k} 없음`); return v; };
  const pname=id=>{ const v=FL?FL.patches?.[id]?.name:FX.patches.find(p=>p.id===id)?.ko; if(!v) throw new Error(`${lang}: 패치 이름 ${id} 없음`); return v; };
  const OUT=path.join(ROOT,lang,'hegemony','map'); fs.mkdirSync(path.join(OUT,'data'),{recursive:true}); fs.mkdirSync(path.join(OUT,'lib'),{recursive:true});
  const index={fx:Object.fromEntries([...usedFx].map(k=>[k,note(k)])),snaps:[],ents:E.map(e=>({n:e.n,ko:loc(e.n),...(e.c>=0?{c:PAL[e.c].hex}:{ns:1}),...(e.x?{x:1}:{})}))};
  for(const e of index.ents) if(e.ko===e.n) e.ko=null;
  let bytes=0, sbytes=0; for(const f of fs.readdirSync(path.join(OUT,'data'))) if(/^s-?\d+\.json$/.test(f)) fs.rmSync(path.join(OUT,'data',f));
  const dl=dispFor(lang,L,loc);
  for(const s of out){
    const kOf=f=>{ const v=f.pid?pname(f.pid):f.ne?(lang==='en'?null:f.ne[lang]):loc(f.n); return v&&v!==f.n?v:null; };
    const fc={type:'FeatureCollection',features:s.F.map(f=>{ const k=kOf(f); return {type:'Feature',geometry:f.geometry,properties:{e:ENT.get(f.e).id,n:f.pid&&k?k:f.n,...(k&&!f.pid?{k}:{}),...(f.b!=null?{b:f.b}:{}),...(f.st?{st:f.st}:{}),...(f.un?{un:1}:{}),...(f.fx?{fx:f.fx}:{}),...(f.top?{pt:1}:{})}}; })};
    const objs={w:fc}; if(s.src==='ne') objs.d={type:'FeatureCollection',features:dl};
    const txt=JSON.stringify(topology(objs,1e5)); bytes+=txt.length; fs.writeFileSync(path.join(OUT,'data',`${s.y}.json`),txt);
    const top=[...s.area].sort((a,b)=>b[1]-a[1]).map(([id,a])=>[id,a>=1000?Math.round(a/1000):+(a/1000).toFixed(3)]);
    let sup;
    if(s.S&&s.S.length){ const sfc={type:'FeatureCollection',features:s.S.map(f=>({type:'Feature',geometry:f.geometry,properties:{e:ENT.get(f.e).id,n:f.n}}))};
      const st=JSON.stringify(topology({s:sfc},1e5)); sbytes+=st.length; fs.writeFileSync(path.join(OUT,'data',`s${s.y}.json`),st);
      sup={top:[...s.sarea].sort((a,b)=>b[1]-a[1]).map(([id,a])=>[id,Math.round(a/1000)]),labels:s.slabels}; }
    index.snaps.push({y:s.y,src:s.src,date:s.date||null,top,labels:s.labels,...(VER[s.y]?{v:VER[s.y]}:{}),...(sup?{sup}:{})});
  }
  fs.writeFileSync(path.join(OUT,'index.json'),JSON.stringify(index));
  fs.writeFileSync(path.join(OUT,'data','land.json'),land);
  fs.copyFileSync(path.join(HERE,'node_modules/d3/dist/d3.min.js'),path.join(OUT,'lib/d3.min.js'));
  fs.copyFileSync(path.join(HERE,'node_modules/topojson-client/dist/topojson-client.min.js'),path.join(OUT,'lib/topojson-client.min.js'));
  const langs=[['ko','한국어'],['en','English'],['id','Bahasa Indonesia']].map(([c,n])=>c===lang?`<span aria-current="page">${esc(n)}</span>`:`<a href="../../../${c}/hegemony/map/" hreflang="${c}" lang="${c}">${esc(n)}</a>`).join('');
  let html=fs.readFileSync(path.join(HERE,'template.html'),'utf8').replace('{{css}}',fs.readFileSync(path.join(HERE,'style.css'),'utf8')).replace('{{ui}}',JSON.stringify(PG.ui).replace(/</g,'\\u003c'))
    .replace('{{langs}}',langs).split('{{lang}}').join(lang)
    .replace('{{sourcesHtml}}',`<ol>${PG.sources.map(([t,u])=>`<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join('')}</ol>`);
  html=html.replace('{{glossHtml}}',`<dl>${PG.glossary.map(([t,d])=>`<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join('')}</dl>`);
  for(const [k,v] of Object.entries(PG)) if(typeof v==='string') html=html.split('{{'+k+'}}').join(k.endsWith('Html')?v:esc(v));
  if(html.includes('{{')) throw new Error(lang+': 치환 안 된 자리표시자 '+html.match(/\{\{\w+\}\}/)[0]);
  fs.writeFileSync(path.join(OUT,'index.html'),html);
  const noName=E.filter(e=>!index.ents[e.id].ko).length;
  console.log(lang,'data bytes',(bytes/1e6).toFixed(1)+'MB','supplement',(sbytes/1e6).toFixed(2)+'MB','index',(JSON.stringify(index).length/1e3).toFixed(0)+'KB', lang==='en'?'':'현지어 이름 없는 주체 '+noName+'/'+E.length);
}
