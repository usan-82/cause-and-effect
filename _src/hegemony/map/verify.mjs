// 교차검증: 완성된 지도(ko/hegemony/map/data)를 독립 자료 Cliopatria(Seshat, CC BY 4.0)와 0.5° 격자로 맞대어 본다.
//  준비: prepare.sh가 raw/clio_s.geojson을 만든다.  결과: verify.json (build.mjs가 읽어 페이지에 싣는다)
import fs from 'fs'; import path from 'path'; import {fileURLToPath} from 'url';
import mapshaper from 'mapshaper';
import Flatbush from 'flatbush'; import {geoArea} from 'd3-geo'; import {feature} from 'topojson-client';
const HERE=path.dirname(fileURLToPath(import.meta.url)), OUT=path.join(HERE,'../../../ko/hegemony/map');
const IX=JSON.parse(fs.readFileSync(path.join(OUT,'index.json')));
const CL=JSON.parse(fs.readFileSync(path.join(HERE,'raw/clio_s.geojson'))).features.filter(f=>f.geometry&&f.properties.Type==='POLITY');
const rings=g=>!g?[]:g.type==='Polygon'?g.coordinates:g.type==='MultiPolygon'?g.coordinates.flat():[];
function pip(rs,x,y){let inside=false;for(const r of rs){for(let i=0,j=r.length-1;i<r.length;j=i++){const [xi,yi]=r[i],[xj,yj]=r[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))inside=!inside;}}return inside;}
function shoelace(rs){let a=0;for(const r of rs){let s=0;for(let i=0,j=r.length-1;i<r.length;j=i++)s+=(r[j][0]*r[i][1]-r[i][0]*r[j][1]);a+=Math.abs(s)/2;}return a;}
function mk(items){const it=items.map(o=>{const rs=rings(o.g);let x0=180,y0=90,x1=-180,y1=-90;for(const r of rs)for(const [x,y] of r){if(x<x0)x0=x;if(y<y0)y0=y;if(x>x1)x1=x;if(y>y1)y1=y;}return {...o,rs,bb:[x0,y0,x1,y1],a:shoelace(rs)};}).filter(o=>o.rs.length&&o.bb[0]<=o.bb[2]);
  const ix=new Flatbush(Math.max(1,it.length)); if(!it.length) ix.add(0,0,0,0); for(const o of it) ix.add(...o.bb); ix.finish(); return {ix,it};}
const at=(I,x,y)=>{const c=I.ix.search(x,y,x,y).map(i=>I.it[i]).filter(o=>o&&pip(o.rs,x,y)); if(!c.length) return null; c.sort((a,b)=>a.a-b.a); return c[0];};
const STEP=0.5,R=6371.0088,rad=Math.PI/180; const cellArea=lat=>R*R*STEP*rad*Math.abs(Math.sin((lat+STEP/2)*rad)-Math.sin((lat-STEP/2)*rad));
const res={};
// 보충 층: Cliopatria에만 있는 땅(이 지도에서 빈 땅이거나 문화권인 곳)을 잘라 raw/sup/{연도}.json 으로 낸다. build.mjs가 읽는다.
//  · 두 자료의 해안선·국경이 어긋나 생기는 가는 띠는 버린다(넓이÷둘레가 THICK km 미만이거나 MINA km² 미만인 조각)
const SUP=path.join(HERE,'raw/sup'); fs.rmSync(SUP,{recursive:true,force:true}); fs.mkdirSync(SUP,{recursive:true});
const THICK=+(process.env.THICK||30), MINA=+(process.env.MINA||8000);
for(const s of IX.snaps){ if(process.env.ONLY&&!process.env.ONLY.split(",").includes(String(s.y))) continue;
  const y=s.y, cy=Math.min(y,2024);
  const t=JSON.parse(fs.readFileSync(path.join(OUT,'data',`${y}.json`)));
  const mine=mk(feature(t,t.objects.w).features.filter(f=>f.geometry).map(f=>({g:f.geometry,e:f.properties.e})));
  // Cliopatria: 괄호 이름은 여러 나라를 묶은 상위 단위라 제외
  const clio=mk(CL.filter(f=>f.properties.FromYear<=cy&&f.properties.ToYear>=cy&&!/^\(/.test(f.properties.Name)).map(f=>({g:f.geometry,n:f.properties.Name})));
  let both=0,mo=0,co=0,nsOnly=0; const pair=new Map(), mA=new Map(), cA=new Map(), coP=new Map(), moP=new Map();
  for(let lat=-90+STEP/2;lat<90;lat+=STEP){const ca=cellArea(lat); for(let lon=-180+STEP/2;lon<180;lon+=STEP){
    const m=at(mine,lon,lat), c=at(clio,lon,lat); const me=m&&!IX.ents[m.e].ns?m.e:null;
    if(me===null&&!c) continue;
    if(me!==null&&c){both+=ca; const k=me+'|'+c.n; pair.set(k,(pair.get(k)||0)+ca); mA.set(me,(mA.get(me)||0)+ca); cA.set(c.n,(cA.get(c.n)||0)+ca);}
    else if(me!==null){mo+=ca; moP.set(me,(moP.get(me)||0)+ca);}
    else {co+=ca; coP.set(c.n,(coP.get(c.n)||0)+ca); if(m) nsOnly+=ca;}
  }}
  const bestC=new Map(), bestM=new Map();
  for(const [k,a] of pair){const [e,n]=k.split('|'); const E=+e; if(!bestC.has(E)||a>bestC.get(E)[1]) bestC.set(E,[n,a]); if(!bestM.has(n)||a>bestM.get(n)[1]) bestM.set(n,[E,a]);}
  // 일치: 한쪽이 다른 쪽을 더 잘게 나눈 경우(식민지를 따로 그리는 등)는 일치로 본다. 어느 쪽으로도 대응하지 않는 칸만 불일치
  let agree=0, strict=0; const conf=[];
  for(const [k,a] of pair){const [e,n]=k.split('|'); const E=+e; const x=bestC.get(E)[0]===n, y2=bestM.get(n)[0]===E; if(x&&y2) strict+=a; if(x||y2) agree+=a; else conf.push([E,n,a]);}
  // 이름이 겹치는 나라는 해안선·섬 해상도 차이일 뿐이라 '없는 나라' 목록에서 뺀다
  const mineNames=s.top.map(([id])=>IX.ents[id]).filter(e=>!e.ns).map(e=>e.n.toLowerCase().replace(/ (empire|kingdom|dynasty|khanate|caliphate|sultanate)$/,'')).filter(n=>n.length>=4);
  const top=(m,n)=>[...m].sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k,a])=>[k,Math.round(a/1000)]);
  const K=v=>Math.round(v/1000);
  res[y]={n:clio.it.length,both:K(both),mine:K(mo),clio:K(co),agree:both?+(agree/both).toFixed(3):null,strict:both?+(strict/both).toFixed(3):null,
    clioOnly:top(coP,12).filter(x=>x[1]>=60&&!mineNames.some(n=>x[0].toLowerCase().includes(n)||n.includes(x[0].toLowerCase()))).slice(0,6), mineOnly:top(moP,5).filter(x=>x[1]>=60).map(([e,a])=>[+e,a]),
    conflicts:conf.sort((a,b)=>b[2]-a[2]).slice(0,5).filter(x=>x[2]>=80000).map(([E,n,a])=>[E,n,K(a),bestC.get(E)[0]])};
  { // 같은 이름이 두 번 걸리면(전환 연도) 나중 것을 쓴다
    const byN=new Map(); for(const f of CL){const p=f.properties; if(!(p.FromYear<=cy&&p.ToYear>=cy)||/^\(/.test(p.Name)) continue; const o=byN.get(p.Name); if(!o||p.FromYear>o.properties.FromYear) byN.set(p.Name,f);}
    const cfc={type:'FeatureCollection',features:[...byN.values()].map(f=>({type:'Feature',properties:{n:f.properties.Name},geometry:f.geometry}))};
    const mfc={type:'FeatureCollection',features:mine.it.filter(o=>!IX.ents[o.e].ns).map(o=>({type:'Feature',properties:{},geometry:o.g}))};
    if(cfc.features.length){
      let o={}; try{ o=await mapshaper.applyCommands(`-i c.json -clean overlap-rule=min-area -erase m.json -explode -filter "this.area>${MINA*1e6} && this.area/this.perimeter>${THICK*1000}" -dissolve n -o sup.json precision=0.001`,{'c.json':JSON.stringify(cfc),'m.json':JSON.stringify(mfc)}); }catch(err){ if(!/Missing a field/.test(err.message)) throw err; }
      const fc=o['sup.json']?JSON.parse(o['sup.json']):{features:[]}; fc.features=(fc.features||[]).filter(f=>f.geometry);
      if(fc.features.length) fs.writeFileSync(path.join(SUP,`${y}.json`),JSON.stringify(fc));
      res[y].sup=fc.features.length;
    }
  }
  const nm=e=>IX.ents[e].n;
  console.log(String(y).padStart(6),'clio',String(clio.it.length).padStart(4),'both',(both/1e6).toFixed(1).padStart(6),'mineOnly',(mo/1e6).toFixed(1).padStart(5),'clioOnly',(co/1e6).toFixed(1).padStart(5),'agree',(agree/both*100).toFixed(0).padStart(3)+'%','strict',(strict/both*100).toFixed(0).padStart(3)+'%','| clio-only:',res[y].clioOnly.slice(0,3).map(x=>x[0]+' '+x[1]).join(', '),'| sup',res[y].sup||0,'| conflict:',res[y].conflicts.slice(0,2).map(x=>nm(x[0])+'≠'+x[1]+' '+x[2]).join(', '));
}
fs.writeFileSync(path.join(HERE,'verify.json'),JSON.stringify(res));
