// 경계 교정용 조각 만들기: fixes.json의 clip 항목마다, 원자료(historical-basemaps)의 한 주체가 차지한 땅 가운데
// Cliopatria가 다른 나라로 그린 부분을 잘라 raw/clip/{연도}.json 으로 낸다. build.mjs가 읽어 덧그린다.
//  · clio가 이름이면 그 나라와 겹치는 부분만, '*'이면 겹치는 모든 나라(시대에 맞지 않는 주체를 통째로 갈아 끼울 때)
import fs from 'fs'; import path from 'path'; import {fileURLToPath} from 'url';
import mapshaper from 'mapshaper'; import {feature} from 'topojson-client';
const HERE=path.dirname(fileURLToPath(import.meta.url)); const J=f=>JSON.parse(fs.readFileSync(path.join(HERE,f),'utf8'));
const FX=J('fixes.json'), ALIAS=J('alias.json'); const canon=n=>{n=(n||'').replace(/\s+/g,' ').trim(); return ALIAS[n]||n;};
const CL=JSON.parse(fs.readFileSync(path.join(HERE,'raw/clio_s.geojson'))).features.filter(f=>f.geometry&&f.properties.Type==='POLITY');
const OUT=path.join(HERE,'raw/clip'); fs.rmSync(OUT,{recursive:true,force:true}); fs.mkdirSync(OUT,{recursive:true});
const CLIOA=J('clio.json').alias;
// atlas(패권의 지도)와 같은 교정을 쓰도록, 강대국 소속이 바뀌는 조각은 ../atlas/clips.json 에도 낸다
const keyOf=s=>{ const S=re=>re.test(s); if(S(/United Kingdom of (the )?Netherlands/)) return 'nl'; if(S(/United Kingdom|Great Britain|^England|British|^UK$/)) return 'gb'; if(S(/^France|French/)) return 'fr'; if(S(/^Spain|Spanish|Castil/)) return 'es'; if(S(/^Portugal|Portuguese/)) return 'pt';
  if(S(/^Netherlands|Dutch|^Holland/)) return 'nl'; if(S(/Russia|Muscovy|Moscow/)) return 'ru'; if(S(/Ottoman/)) return 'ot'; if(S(/Ming|Qing|Manchu Empire|^China$/)) return 'cn'; if(S(/United States/)) return 'us'; if(S(/^Germany|Prussia|Brandenburg/)) return 'de'; if(S(/Austria|Habsburg/)&&!S(/Spanish/)) return 'at'; if(S(/Japan/)) return 'jp'; if(S(/Mughal/)) return 'mg'; return null; };
const ATLAS={};
const byY={}; for(const c of FX.clip||[]) for(const y of c.y) (byY[y]=byY[y]||[]).push(c);
for(const [y,list] of Object.entries(byY)){
  const t=JSON.parse(fs.readFileSync(path.join(HERE,'raw',`h${y}.json`))); const hb=feature(t,t.objects[Object.keys(t.objects)[0]]).features.filter(f=>f.geometry);
  const entOf=f=>{const n=(f.properties.NAME||'').trim(), sub=(f.properties.SUBJECTO||'').trim(); let e=sub||n; if(sub==='Mongol Empire'&&+y>=1300) e=n; return canon(e);};
  const byN=new Map(); for(const f of CL){const p=f.properties; if(!(p.FromYear<=+y&&p.ToYear>=+y)||/^\(/.test(p.Name)) continue; const o=byN.get(p.Name); if(!o||p.FromYear>o.properties.FromYear) byN.set(p.Name,f);}
  const res=[];
  for(const c of list){
    const m=hb.filter(f=>entOf(f)===c.from); if(!m.length){console.log(y,'원자료에 없음:',c.from); continue;}
    const cs=[...byN.values()].filter(f=>c.clio==='*'?!(c.skip||[]).includes(f.properties.Name):f.properties.Name===c.clio); if(!cs.length){console.log(y,'Cliopatria에 없음:',c.clio); continue;}
    let o={}; try{ o=await mapshaper.applyCommands(`-i c.json -clean overlap-rule=min-area -clip m.json -explode -filter "this.area>${(c.minArea||4000)*1e6} && this.area/this.perimeter>${(c.thick||15)*1000}" -dissolve n -o out.json precision=0.001`,
      {'c.json':JSON.stringify({type:'FeatureCollection',features:cs.map(f=>({type:'Feature',properties:{n:f.properties.Name},geometry:f.geometry}))}),'m.json':JSON.stringify({type:'FeatureCollection',features:m.map(f=>({type:'Feature',properties:{},geometry:f.geometry}))})}); }catch(err){ if(!/Missing a field/.test(err.message)) throw err; }
    const fc=o['out.json']?JSON.parse(o['out.json']).features.filter(f=>f.geometry):[];
    if(FX.atlasYears.includes(+y)) for(const f of fc){ const nm=(c.rename||{})[f.properties.n]||f.properties.n; const to=c.to?(c.to[0]==='@'?c.to.slice(1):keyOf(c.to)):keyOf(canon(CLIOA[nm]||nm)); const fk=keyOf(c.from);
      if(to!==fk) (ATLAS[y]=ATLAS[y]||[]).push({type:'Feature',properties:{id:c.note,p:to,from:fk},geometry:f.geometry}); }
    for(const f of fc) res.push({type:'Feature',geometry:f.geometry,properties:{n:f.properties.n,from:c.from,to:c.to||null,note:c.note}});
    console.log(y,c.from,'→',fc.map(f=>f.properties.n).join(', ')||'(없음)');
  }
  if(res.length) fs.writeFileSync(path.join(OUT,`${y}.json`),JSON.stringify({type:'FeatureCollection',features:res}));
}
// 덧그리는 폴리곤 가운데 land 표시가 있는 것(바다에 걸치는 넓은 영역)은 육지 모양으로 잘라 raw/patch/{id}.json 으로 낸다
{ const PO=path.join(HERE,'raw/patch'); fs.rmSync(PO,{recursive:true,force:true}); fs.mkdirSync(PO,{recursive:true});
  const nt=JSON.parse(fs.readFileSync(path.join(HERE,'raw/n_usa.json'))); const land=nt.type==='Topology'?feature(nt,nt.objects[Object.keys(nt.objects)[0]]):nt;
  for(const p of FX.patches.filter(p=>p.land)){ const ring=[...p.poly,p.poly[0]];
    const o=await mapshaper.applyCommands('-i p.json -clip land.json -dissolve -o out.json precision=0.001',{'p.json':JSON.stringify({type:'Feature',properties:{},geometry:{type:'Polygon',coordinates:[ring]}}),'land.json':JSON.stringify(land)});
    const g=JSON.parse(o['out.json']); const geom=(g.features?g.features[0]?.geometry:g.geometries?.[0])||null; if(!geom){ console.log('육지와 겹치지 않음:',p.id); continue; }
    fs.writeFileSync(path.join(PO,`${p.id}.json`),JSON.stringify(geom)); console.log('육지로 자름:',p.id,geom.type); } }
fs.writeFileSync(path.join(HERE,'../atlas/clips.json'),JSON.stringify(ATLAS));
console.log('atlas 조각:',Object.entries(ATLAS).map(([y,a])=>y+':'+a.map(f=>f.properties.id+'('+(f.properties.from||'-')+'→'+(f.properties.p||'-')+')').join(',')).join('  '));
