// 1492~1880년(날짜 단위 데이터셋이 없는 시기)의 강대국 소속을 독립 자료 Cliopatria와 맞대어 본다 → verify-clio.json
//  · 먼저 node build.mjs 로 ko/hegemony/atlas/data 를 만들어 둔다. Cliopatria는 ../map/prepare.sh 가 받아 둔 ../map/raw/clio_s.geojson 을 쓴다
//  · 0.5° 격자. 두 자료가 모두 나라를 그렸고 어느 한쪽이라도 강대국으로 본 칸 가운데, 같은 강대국(또는 둘 다 강대국 아님)으로 본 칸의 비율
import fs from 'fs'; import path from 'path'; import {fileURLToPath} from 'url';
import Flatbush from 'flatbush'; import {feature} from 'topojson-client';
const HERE=path.dirname(fileURLToPath(import.meta.url)), ROOT=path.join(HERE,'../../..');
const ST=JSON.parse(fs.readFileSync(path.join(HERE,'struct.json')));
const CL=JSON.parse(fs.readFileSync(path.join(HERE,'../map/raw/clio_s.geojson'))).features.filter(f=>f.geometry&&f.properties.Type==='POLITY');
const CLIPS=fs.existsSync(path.join(HERE,'clips.json'))?JSON.parse(fs.readFileSync(path.join(HERE,'clips.json'))):{};
// Cliopatria 이름 → 강대국 키
const ck=n=>{const S=re=>re.test(n);
  if(S(/Spanish|Spain|Castil|Iberian Union|Aragon/)) return 'es'; if(S(/Portug/)) return 'pt'; if(S(/Sweden/)) return null; if(S(/Brit|England|Great Britain|United Kingdom/)) return 'gb';
  if(S(/France|French/)) return 'fr'; if(S(/Dutch|Netherlands/)) return 'nl'; if(S(/Russia|Moscow|Muscovy/)) return 'ru'; if(S(/Ottoman/)) return 'ot';
  if(S(/Ming Dynasty|Southern Ming|^Qing/)) return 'cn'; if(S(/United States/)) return 'us'; if(S(/Prussia|German Empire|Brandenburg/)) return 'de'; if(S(/Habsburg|Austria/)) return 'at';
  if(S(/Japan|Shogunate/)) return 'jp'; if(S(/Mughal/)) return 'mg'; if(S(/Italy/)) return 'it'; if(S(/Belgi/)) return 'be'; return null;};
const rings=g=>!g?[]:g.type==='Polygon'?g.coordinates:g.type==='MultiPolygon'?g.coordinates.flat():[];
function pip(rs,x,y){let inside=false;for(const r of rs){for(let i=0,j=r.length-1;i<r.length;j=i++){const [xi,yi]=r[i],[xj,yj]=r[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))inside=!inside;}}return inside;}
function shoelace(rs){let a=0;for(const r of rs){let s=0;for(let i=0,j=r.length-1;i<r.length;j=i++)s+=(r[j][0]*r[i][1]-r[i][0]*r[j][1]);a+=Math.abs(s)/2;}return a;}
function mk(fs_){const it=fs_.map(f=>{const rs=rings(f.geometry);let x0=180,y0=90,x1=-180,y1=-90;for(const r of rs)for(const [x,y] of r){if(x<x0)x0=x;if(y<y0)y0=y;if(x>x1)x1=x;if(y>y1)y1=y;}return {p:f.properties,rs,bb:[x0,y0,x1,y1],a:shoelace(rs)};}).filter(o=>o.rs.length&&o.bb[0]<=o.bb[2]);
  const ix=new Flatbush(Math.max(1,it.length)); if(!it.length) ix.add(0,0,0,0); for(const o of it) ix.add(...o.bb); ix.finish(); return {ix,it};}
const at=(I,x,y)=>{const c=I.ix.search(x,y,x,y).map(i=>I.it[i]).filter(o=>o&&pip(o.rs,x,y)); if(!c.length) return null; c.sort((a,b)=>((b.p.pid?1:0)-(a.p.pid?1:0))||a.a-b.a); return c[0];};
const STEP=0.5,RR=6371.0088,rad=Math.PI/180; const cellArea=lat=>RR*RR*STEP*rad*Math.abs(Math.sin((lat+STEP/2)*rad)-Math.sin((lat-STEP/2)*rad));
const out={};
for(const {year:y} of ST.years){ if(y>1880) continue;
  const t=JSON.parse(fs.readFileSync(path.join(ROOT,`ko/hegemony/atlas/data/${y}.json`))); const A=mk(feature(t,t.objects.w).features.filter(f=>f.geometry));
  const C=mk(CL.filter(f=>f.properties.FromYear<=y&&f.properties.ToYear>=y&&!/^\(/.test(f.properties.Name)).map(f=>({geometry:f.geometry,properties:{n:f.properties.Name}})));
  const shown=k=>k&&ST.powers[k]?.[y]&&ST.powers[k][y]!=='end'?k:null; const D=new Map(); let same=0,diff=0;
  for(let lat=-90+STEP/2;lat<90;lat+=STEP){const ca=cellArea(lat); for(let lon=-180+STEP/2;lon<180;lon+=STEP){
    const a=at(A,lon,lat), c=at(C,lon,lat); if(!a||!c) continue;
    if(c.p.n==='Golden Horde'&&y>1502) continue; // Cliopatria 쪽 오류로 보이는 영역(킵차크 칸국은 1502년 소멸)은 비교에서 뺀다
    const ak=shown(a.p.p), kk=shown(ck(c.p.n)); if(!ak&&!kk) continue; if(ak===kk){same+=ca; continue;} diff+=ca;
    const hn=a.p.pid?'#'+a.p.pid:(a.p.n||''); const key=[hn,ak||'',c.p.n,kk||''].join('|'); D.set(key,(D.get(key)||0)+ca);}}
  out[y]={agree:+(same/(same+diff)).toFixed(3),clips:(CLIPS[y]||[]).length,
    diffs:[...D].sort((a,b)=>b[1]-a[1]).filter(x=>x[1]>=150000).slice(0,8).map(([k,a])=>{const [hn,hk,cn,ck2]=k.split('|'); return {hn,hk:hk||null,cn,ck:ck2||null,a:Math.round(a/1000)*1000};})};
  console.log(y,(out[y].agree*100).toFixed(1)+'%',out[y].diffs.map(d=>`${d.hn}(${d.hk||'-'})↔${d.cn}(${d.ck||'-'}) ${d.a/1000}k`).join(' | '));
}
fs.writeFileSync(path.join(HERE,'verify-clio.json'),JSON.stringify(out,null,1));
