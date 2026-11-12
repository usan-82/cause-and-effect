// 경계 교정용 조각 만들기: fixes.json의 clip 항목마다, 원자료(historical-basemaps)의 한 주체가 차지한 땅 가운데
// Cliopatria가 다른 나라로 그린 부분을 잘라 raw/clip/{연도}.json 으로 낸다. build.mjs가 읽어 덧그린다.
//  · clio가 이름이면 그 나라와 겹치는 부분만, '*'이면 겹치는 모든 나라(시대에 맞지 않는 주체를 통째로 갈아 끼울 때)
import fs from 'fs'; import path from 'path'; import {fileURLToPath} from 'url';
import mapshaper from 'mapshaper'; import {feature} from 'topojson-client';
const HERE=path.dirname(fileURLToPath(import.meta.url)); const J=f=>JSON.parse(fs.readFileSync(path.join(HERE,f),'utf8'));
const FX=J('fixes.json'), ALIAS=J('alias.json'); const canon=n=>{n=(n||'').replace(/\s+/g,' ').trim(); return ALIAS[n]||n;};
const CL=JSON.parse(fs.readFileSync(path.join(HERE,'raw/clio_s.geojson'))).features.filter(f=>f.geometry&&f.properties.Type==='POLITY');
const OUT=path.join(HERE,'raw/clip'); fs.rmSync(OUT,{recursive:true,force:true}); fs.mkdirSync(OUT,{recursive:true});
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
    for(const f of fc) res.push({type:'Feature',geometry:f.geometry,properties:{n:f.properties.n,from:c.from,to:c.to||null,note:c.note}});
    console.log(y,c.from,'→',fc.map(f=>f.properties.n).join(', ')||'(없음)');
  }
  if(res.length) fs.writeFileSync(path.join(OUT,`${y}.json`),JSON.stringify({type:'FeatureCollection',features:res}));
}
