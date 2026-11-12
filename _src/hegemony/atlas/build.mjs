import fs from 'fs'; import Flatbush from 'flatbush'; import {topology} from 'topojson-server'; import path from 'path'; import {fileURLToPath} from 'url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
const RAW=process.argv[2]||path.join(HERE,'raw');           // prepare.sh가 만든 단순화 TopoJSON(w{연도}.json)
const ROOT=process.argv[3]||path.join(HERE,'../../..');         // 저장소 루트 → {lang}/hegemony/atlas/
const ONLY=process.argv.slice(4);                                   // 특정 언어만: node build.mjs raw . en
import {geoArea,geoCentroid,geoContains} from 'd3-geo'; import {feature} from 'topojson-client';
const YEARS=[1492,1530,1600,1650,1700,1715,1783,1815,1880,1914,1920,1938,1945,1960,1994,2010];
const base=(y,n,s)=>{
  const S=re=>re.test(s), N=re=>re.test(n);
  if(S(/United Kingdom of (the )?Netherlands/)) return 'nl';
  if(S(/United Kingdom|Great Britain|^England|British|\(UK\)|^UK$/)||N(/\(UK\)|\(GB\)|British/)) return 'gb';
  if(S(/^France|French/)||N(/\(France\)|\(FR\)/)) return 'fr';
  if(S(/^Spain|Spanish|Castil|Aragon|Viceroyalty of (New Spain|Peru|the Río de la Plata|New Granada)/)||N(/\(Spain\)/)) return 'es';
  if(S(/^Portugal|Portuguese/)||N(/\(Portugal\)/)) return 'pt';
  if(S(/^Netherlands|Neterlands|Dutch|^Holland|Netherlands Indies/)) return 'nl';
  if(S(/Russia|Muscovy|Moscow|USSR|Soviet/)&&!S(/White Russia/)) return 'ru';
  if(S(/Ottoman/)) return 'ot';
  if(S(/Ming|Qing|Manchu Empire|^China$|Chinese/)) return 'cn';
  if(S(/United States|^USA$/)) return 'us';
  if(S(/^Germany|German Empire|Prussia|Brandenburg/)) return 'de';
  if(S(/Austria|Austro|Habsburg/)&&!S(/Spanish/)) return 'at';
  if(S(/Japan/)) return 'jp';
  if(S(/^Italy|Italian/)) return 'it';
  if(S(/^Belgium|Belgian/)) return 'be';
  if(S(/Mughal/)) return 'mg';
  return null;
};
// [years, NAME regex, key, note id(→ {lang}.json fixes)]  — 보정 규칙 (원본 데이터의 소속 표기 오류·누락 수정)
const L=a=>new RegExp('^('+a+')$');
const FIX=[
 [[1600], L('Inca Empire'), 'es', 'inca'],
 [[1783], L('Quebec'), 'gb', 'quebec'],
 [[1815,1880,1914,1920,1938], L('Canada|Australia|Newfoundland|New Zealand|Union of South Africa|South Africa|Cape Colony'), 'gb', 'dominion'],
 [[1783], L("Rupert's Land"), 'gb', 'rupert'],
 [[1914], L('Kamerun|German South-West Africa|Togoland|German New Guinea'), 'de', 'decol'],
 [[1914,1920,1938], L('Philippines'), 'us', 'ph_us'],
 [[1945], L('Philippines'), 'us', 'ph_1945'],
 [[1920,1938], L('Sudan|Tanzania, United Republic of|Nigeria|Zambia|Kenya|Botswana|Uganda|Malawi|Zimbabwe|Ghana|Sierra Leone|Gambia, The|Jamaica|Ceylon|Guyana|Belize|Trinidad|Brunei|Swaziland|Lesotho|Israel|Jordan|Kuwait|Qatar|Trucial Oman|Papua New Guinea'), 'gb', 'gbcol'],
 [[1920,1938], L('Algeria|Tunisia|Morocco|Madagascar \\(France\\)|Madagascar|French Somaliland'), 'fr', 'frcol'],
 [[1920,1938], L('Angola|Mozambique|Guinea-Bissau'), 'pt', 'ptcol'],
 [[1920,1938], L('Burundi'), 'be', 'be_mandate'],
 [[1920,1938], L('Suriname'), 'nl', 'nlcol'],
 [[1920,1938], L('Equatorial Guinea|Spanish Sahara'), 'es', 'escol'],
 [[1938], L('Libya|Ethiopia'), 'it', 'itcol'],
 [[1945], L('India|Pakistan|Bangladesh|Burma|Malaysia|Singapore|Sri Lanka|Israel|Jordan|Kuwait|Qatar|United Arab Emirates|Bahrain|Belize|Trinidad|Brunei|Guyana|Cyprus|Malta'), 'gb', 'gb_1945'],
 [[1945], L('Indonesia'), 'nl', 'indo_1945', 'c'],
 [[1945], L('Zaire'), 'be', 'zaire_1945'],
 [[1945,1960], L('Rwanda|Burundi'), 'be', 'be_trust'],
 [[1945], L('Central African Republic|Djibouti|Guinea'), 'fr', 'frcol'],
 [[1945,1960], L('Suriname'), 'nl', 'nl_1960'],
 [[1945,1960], L('Western Sahara|Equatorial Guinea'), 'es', 'escol'],
 [[1960], L('Djibouti|Comoros'), 'fr', 'fr_1960'],
 [[1960], L('Algeria'), 'fr', 'algeria_1960', 'c'],
 [[1960], L('Angola|Mozambique|Guinea-Bissau|Cape Verde|Sao Tome and Principe'), 'pt', 'pt_1960'],
 [[1960], L('Zambia|Kenya|Tanzania, United Republic of|Uganda|Malawi|Zimbabwe|Botswana|Lesotho|Swaziland|Gambia, The|Sierra Leone|Jamaica|Trinidad|Guyana|Belize|Kuwait|Bahrain|Qatar|United Arab Emirates|Brunei|Malta|Mauritius|Fiji'), 'gb', 'gb_1960'],
 [[1994], L('Macau|Macao'), 'pt', 'macau'],
 [[1880,1914], L('Malta'), 'gb', 'malta'],
 [[1914,1920], L('Malaya|Malaysia'), 'gb', 'malaya'],
 [[1815,1880,1914], L('Ceylon'), 'gb', 'ceylon'],
 [[1650,1700,1715,1783,1815,1880], L('Philippines'), 'es', 'ph_es'],
 [[1492], L('Aragón|Aragon'), 'es', 'aragon'],
 [[1530,1600], L('Habsburg Netherlands'), 'es', 'habsburg_nl'],
 [[1530,1600,1650,1700], L('Naples|Sicily|Sardinia'), 'es', 'aragon_italy'],
 [[1600,1650,1700], L('Milan'), 'es', 'milan_es'],
 [[1650,1700], L('Luxembourg'), 'es', 'spanish_nl'],
 [[1920], L('Ireland'), 'gb', 'ireland_1920', 'c'],
 [[1783], L('Luisiana|Louisiana'), 'es', 'luisiana_1783'],
 [[1700], L('Dutch Formosa'), 'cn', 'formosa'],
 [[1715,1815], L('Egypt'), 'ot', 'egypt_ot'],
 [[1945], L('Egypt'), null, 'egypt_1945'],
 [[1815], L('United Provinces of the Río de la Plata'), null, 'rioplata_1815'],
];
function rewind(f){const gm=f.geometry;if(!gm)return f;const ps=gm.type==='Polygon'?[gm.coordinates]:gm.type==='MultiPolygon'?gm.coordinates:[];for(const p of ps)for(let i=0;i<p.length;i++){if(geoArea({type:'Polygon',coordinates:[p[i]]})>2*Math.PI)p[i]=p[i].slice().reverse();}return f;}
const LANGS=[['ko','한국어'],['en','English'],['id','Bahasa Indonesia']];
const J=f=>JSON.parse(fs.readFileSync(path.join(HERE,f),'utf8'));
const ST=J('struct.json');
// 경계선 자체를 고치는 조각. ../map/clip.mjs가 Cliopatria에서 잘라 만든다(세계 영토 지도와 같은 교정을 쓰기 위해)
const CLIPS=fs.existsSync(path.join(HERE,'clips.json'))?J('clips.json'):{};
// 1492~1880년 Cliopatria 교차검증 결과(verify.mjs가 만든다)
const VCLIO=fs.existsSync(path.join(HERE,'verify-clio.json'))?J('verify-clio.json'):{};
const statusAt=(k,y)=>ST.powers[k]?.[y]||null;
if(ST.years.map(y=>y.year).join()!==YEARS.join()) throw new Error('struct.json 연도 목록이 YEARS와 다름');
// 요충지 범위가 모든 시점을 정확히 한 번씩 덮는지 확인
for(const c of ST.choke) for(const y of YEARS){const n=c.r.filter(([a,b])=>a<=y&&y<=b).length; if(n!==1) throw new Error(`요충지 ${c.id} ${y}: 범위 ${n}개`);}

// ---- 1) 지도 데이터
//  · 1880년까지: historical-basemaps(이하 HB) + 연도별 보정(FIX)
//  · 1914년부터: CShapes 2.0(날짜 기준 국경·식민지 소유국)으로 다시 그림 + 최소한의 의도적 예외(CS_FIX)
//  · 모든 시점: 검증한 요충지·지역은 패치 폴리곤으로 지도 자체를 재표기(struct.json choke[].poly, patches[])
//  · 0.25° 격자 표본으로 세력별 면적을 계산하고, 1914년부터는 HB와 CShapes의 소속 일치율을 계산
const CS_DATE={1914:'1914-07-01',1920:'1920-07-01',1938:'1938-12-31',1945:'1945-09-02',1960:'1960-12-31',1994:'1994-07-01',2010:'2010-07-01'};
const GW={200:'gb',220:'fr',230:'es',235:'pt',210:'nl',211:'be',365:'ru',640:'ot',710:'cn',2:'us',255:'de',260:'de',265:'de',300:'at',305:'at',740:'jp',325:'it'};
// CShapes와 일부러 다르게 표시하는 곳 — 페이지의 교차검증 칸에 그대로 공개된다
const CS_FIX=[
 [[1914,1920], f=>[20,900,920,560].includes(+f.gwcode), 'gb', 'dominion', 0],
 [[1945], f=>+f.gwcode===850, 'nl', 'indo_1945', 1],
 [[1960], f=>/^Algeria/.test(f.country_name), 'fr', 'algeria_1960', 1],
 [[1938], f=>+f.gwcode===530, 'it', 'ethiopia_1938', 1],
 [[1945], f=>/^German Federal Republic/.test(f.country_name), undefined, 'germany_west_1945', 0],
];
function ringArea(r){return Math.abs(geoArea({type:'Polygon',coordinates:[r]}));}
function cwPoly(coords){ // d3: 바깥 고리가 시계 방향이어야 작은 폴리곤이 된다
  const p={type:'Polygon',coordinates:[coords[0][0]===coords.at(-1)[0]&&coords[0][1]===coords.at(-1)[1]?coords:[...coords,coords[0]]]};
  if(geoArea(p)>2*Math.PI) p.coordinates[0]=p.coordinates[0].slice().reverse();
  return p;
}
// 평면 짝-홀 판정(감기 방향과 무관) + 경계 상자 색인
function rings(f){const gm=f.geometry;if(!gm)return[];return gm.type==='Polygon'?gm.coordinates:gm.type==='MultiPolygon'?gm.coordinates.flat():[];}
function pip(rs,x,y){let inside=false;for(const r of rs){for(let i=0,j=r.length-1;i<r.length;j=i++){const [xi,yi]=r[i],[xj,yj]=r[j];if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi))inside=!inside;}}return inside;}
function indexOf(feats){
  const items=feats.map(f=>{const rs=rings(f);let x0=180,y0=90,x1=-180,y1=-90;for(const r of rs)for(const [x,y] of r){if(x<x0)x0=x;if(y<y0)y0=y;if(x>x1)x1=x;if(y>y1)y1=y;}let a=geoArea(f);if(a>2*Math.PI)a=4*Math.PI-a;return {f,rs,bb:[x0,y0,x1,y1],a};}).filter(o=>o.rs.length&&o.bb[0]<=o.bb[2]);
  const ix=new Flatbush(items.length); for(const o of items) ix.add(...o.bb); ix.finish(); return {ix,items};
}
function ownerAt(I,x,y,top){ // top: 패치처럼 위에 그려지는 것 우선, 그다음 가장 작은 영역
  const c=I.ix.search(x,y,x,y).map(i=>I.items[i]).filter(o=>pip(o.rs,x,y));
  if(!c.length) return null; c.sort((a,b)=>(top?(b.f.properties._top|0)-(a.f.properties._top|0):0)||a.a-b.a); return c[0].f;
}
const STEP=0.25, R=6371.0088, rad=Math.PI/180;
const cellArea=lat=>R*R*STEP*rad*Math.abs(Math.sin((lat+STEP/2)*rad)-Math.sin((lat-STEP/2)*rad));

const meta={fixes:{},choke:{},verify:{},area:{}}, DATA={};
const REUSE=!!process.env.REUSE; // 글만 고쳤을 때: 기존 한국어판의 meta.json과 지도를 그대로 쓴다
if(REUSE) Object.assign(meta,JSON.parse(fs.readFileSync(path.join(ROOT,'ko/hegemony/atlas/meta.json'),'utf8')));
for(const y of (REUSE?[]:YEARS)){
  const rivals=ST.years.find(c=>c.year===y).rivals;
  // (a) HB + 보정
  const th=JSON.parse(fs.readFileSync(path.join(RAW,`w${y}.json`))); th.objects={w:th.objects[Object.keys(th.objects)[0]]};
  const hbFixes={};
  for(const g of th.objects.w.geometries){
    const n=(g.properties.NAME||'').trim(), s=(g.properties.SUBJECTO||'').trim();
    let p=base(y,n,s), fx=null, cont=0;
    for(const [ys,re,key,note,c] of FIX) if(ys.includes(y)&&re.test(n)){p=key;fx=note;cont=c?1:0;}
    let dn=n;
    if(y===1914&&n==='Manchu Empire'){dn='Republic of China';fx='manchu';}
    if(y===1920&&s==='USSR'){fx='ussr_1920';}
    if(fx) hbFixes[n]=fx;
    g.properties={n:dn||null,s:s&&s!==n?s:null,p,h:base(y,n,s),b:g.properties.BORDERPRECISION??null,...(fx?{f:fx}:{}),...(cont?{c:1}:{})};
  }
  const hbFeats=feature(th,th.objects.w).features.map(rewind).filter(f=>f.geometry);
  // (b) 이 시점에 쓸 바탕 지도
  let topo, src, csFixes={};
  if(CS_DATE[y]){
    const tc=JSON.parse(fs.readFileSync(path.join(RAW,`c${y}.json`))); tc.objects={w:tc.objects[Object.keys(tc.objects)[0]]};
    for(const g of tc.objects.w.geometries){
      const q=g.properties; let p=GW[+q.owner]??null, fx=null, cont=0;
      for(const [ys,test,key,note,c] of CS_FIX) if(ys.includes(y)&&test(q)){if(key!==undefined)p=key;fx=note;cont=c;}
      if(fx) csFixes[q.country_name]=fx;
      g.properties={n:q.country_name,p,h:GW[+q.owner]??null,st:q.status,o:GW[+q.owner]??(q.status==='independent'?null:'x'),src:'cs',...(fx?{f:fx}:{}),...(cont?{c:1}:{})};
    }
    topo=tc; src='cs'; meta.fixes[y]=csFixes;
  } else { topo=th; src='hb'; meta.fixes[y]=hbFixes; }
  // (c) 패치(재표기): 요충지 폴리곤 + 지역 패치
  const patches=[];
  for(const c of ST.choke) if(c.poly&&(!c.polyYears||c.polyYears.includes(y))){const r=c.r.find(([a,b])=>a<=y&&y<=b); patches.push({type:'Feature',properties:{pid:c.id,kind:'choke',p:r[2],_top:1},geometry:cwPoly(c.poly)});}
  for(const c of ST.patches||[]){const r=c.r.find(([a,b])=>a<=y&&y<=b); if(r) patches.push({type:'Feature',properties:{pid:c.id,kind:'region',p:r[2],_top:1},geometry:cwPoly(c.poly)});}
  for(const f of CLIPS[y]||[]) patches.push({type:'Feature',properties:{pid:'clip_'+f.properties.id,kind:'region',p:f.properties.p,_top:1},geometry:rewind(f).geometry});
  const baseFeats=feature(topo,topo.objects.w).features.map(rewind).filter(f=>f.geometry);
  const finalFeats=[...baseFeats,...patches];
  // (d) 격자 표본: 면적과 교차검증
  const IF=indexOf(finalFeats), IH=CS_DATE[y]?indexOf(hbFeats):null, IB=CS_DATE[y]?indexOf(baseFeats):null;
  const shown=k2=>k2&&statusAt(k2,y)&&statusAt(k2,y)!=='end'?k2:null;
  const area={}; let agreeA=0, compA=0; const diff={};
  for(let lat=-90+STEP/2; lat<90; lat+=STEP){ const ca=cellArea(lat);
    for(let lon=-180+STEP/2; lon<180; lon+=STEP){
      const f=ownerAt(IF,lon,lat,true); const k=f?.properties.p;
      if(k && statusAt(k,y) && statusAt(k,y)!=='end') area[k]=(area[k]||0)+ca;
      if(IH){ const hf=ownerAt(IH,lon,lat,false), cf=ownerAt(IB,lon,lat,false); if(!hf||!cf) continue; // 해안선 해상도 차이는 제외
        const hk=shown(hf.properties.h), ck=shown(cf.properties.h); // 두 원본끼리 비교(보정 전) if(!hk&&!ck) continue;
        compA+=ca; if(hk===ck) agreeA+=ca; else { const key=`${hf?.properties.n||'-'}|${hk||'-'}|${cf?.properties.n||'-'}|${ck||'-'}`; diff[key]=(diff[key]||0)+ca; } }
    } }
  meta.area[y]=Object.fromEntries(Object.entries(area).map(([k2,v])=>[k2,Math.round(v/1000)*1000]));
  meta.verify[y]= CS_DATE[y]
    ? {src:'cs',date:CS_DATE[y],agree:+(agreeA/compA).toFixed(3),diffs:Object.entries(diff).sort((a,b)=>b[1]-a[1]).slice(0,8).map(([k2,v])=>{const [hn,hk,cn,ck]=k2.split('|');return {hn,hk:hk==='-'?null:hk,cn,ck:ck==='-'?null:ck,a:Math.round(v/1000)*1000};}),exceptions:Object.entries(csFixes).map(([n,f])=>({n,f})),patches:patches.length}
    : {src:'hb',fixes:Object.keys(hbFixes).length,patches:patches.length};
  // (e) 요충지 점검: 재표기한 최종 지도 기준
  meta.choke[y]=ST.choke.map(c=>{
    const r=c.r.find(([a,b])=>y>=a&&y<=b);
    let f=ownerAt(IF,c.ll[0],c.ll[1],true);
    if(!f){outer:for(const d of [0.15,0.3,0.6]){for(const [dx,dy] of [[d,0],[-d,0],[0,d],[0,-d],[d,d],[-d,-d],[d,-d],[-d,d]]){f=ownerAt(IF,c.ll[0]+dx,c.ll[1]+dy,true);if(f)break outer;}}}
    const mk=f?f.properties.p:null;
    return {id:c.id,ll:c.ll,k:r[2],mapName:f?(f.properties.n||''):null,mapKey:mk,vis:!!f&&shown(mk)!==shown(r[2]),absent:!f,patched:!!(c.poly&&(!c.polyYears||c.polyYears.includes(y)))};
  });
  // (f) 출력용 TopoJSON: 바탕 + 패치(패치 이름은 언어별 글에서 붙인다)
  const outFC={type:'FeatureCollection',features:finalFeats.map(f=>({type:'Feature',geometry:f.geometry,properties:Object.fromEntries(Object.entries(f.properties).filter(([k2])=>k2!=='_top'&&k2!=='h'))}))};
  DATA[y]=JSON.stringify(topology({w:outFC},1e5));
  console.log(y,src,'features',finalFeats.length,'patches',patches.length, CS_DATE[y]?`agree ${(agreeA/compA*100).toFixed(1)}%`:'');
}

// ---- 2) 언어별 페이지
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const tpl=fs.readFileSync(path.join(HERE,'template.html'),'utf8'), css=fs.readFileSync(path.join(HERE,'style.css'),'utf8');
for(const [lang] of LANGS.filter(([l])=>!ONLY.length||ONLY.includes(l))){
  const tx=J(`${lang}.json`), pg=J(`${lang}.page.json`);
  // 번역 누락 검사
  for(const y of ST.years){const t=tx.years[y.year]; if(!t) throw new Error(`${lang}: ${y.year} 글 없음`);
    const ko=J('ko.json').years[y.year]; for(const f of ['power','events','tech','ideas']) if(t[f].length!==ko[f].length) console.warn(`${lang} ${y.year} ${f}: 항목 수 ${t[f].length} (ko ${ko[f].length})`);}
  for(const c of ST.choke){const t=tx.choke[c.id]; if(!t||t.r.length!==c.r.length) throw new Error(`${lang}: 요충지 ${c.id} 범위 수 불일치`);}
  const usedFix=new Set(FIX.map(f=>f[3]).concat(['manchu','ussr_1920'])); for(const f of usedFix) if(!tx.fixes[f]) throw new Error(`${lang}: 보정 문구 ${f} 없음`);
  const content={
    years:ST.years.map(y=>({year:y.year,rivals:y.rivals,links:y.links,...tx.years[y.year]})),
    short:tx.short, fixes:tx.fixes, full:tx.full, notes:tx.notes||{},
    patches:Object.fromEntries((ST.patches||[]).map(c=>{const t=tx.patches?.[c.id]; if(!t||t.r.length!==c.r.length) throw new Error(`${lang}: 패치 ${c.id} 글 없음`);
      return [c.id,Object.fromEntries(YEARS.map(y=>{const i=c.r.findIndex(([a,b])=>a<=y&&y<=b);return i<0?null:[y,{name:t.name,who:t.r[i][0],note:t.r[i][1]}];}).filter(Boolean))];})),
    powers:Object.fromEntries(Object.entries(ST.powers).map(([k,stt])=>{
      for(const y of Object.keys(stt)) if(!tx.powers?.[k]?.[y]) throw new Error(`${lang}: 국가 흐름 ${k} ${y} 글 없음`);
      return [k,{st:stt,t:tx.powers[k]}];})),
    choke:Object.fromEntries(ST.choke.map(c=>[c.id,Object.fromEntries(YEARS.map(y=>{const i=c.r.findIndex(([a,b])=>a<=y&&y<=b);const [who,note]=tx.choke[c.id].r[i];return [y,{name:tx.choke[c.id].name,who,note}];}))]))
  };
  for(const [y,fsx] of Object.entries(CLIPS)) for(const f of fsx){ const id=f.properties.id, t=tx.clips?.[id]; if(!t) throw new Error(`${lang}: 조각 ${id} 글 없음`); (content.patches['clip_'+id]=content.patches['clip_'+id]||{})[y]={name:t[0],who:t[1],note:t[2]}; }
  const langs=LANGS.map(([c,n])=>c===lang?`<span aria-current="page">${esc(n)}</span>`:`<a href="../../../${c}/hegemony/atlas/" hreflang="${c}" lang="${c}">${esc(n)}</a>`).join('');
  const srcHtml=pg.sources?`<div class="srcs"><h4>${esc(pg.sourcesTitle)}</h4><p>${esc(pg.sourcesIntro)}</p><ol>${pg.sources.map(([t,u])=>`<li><a href="${esc(u)}" target="_blank" rel="noopener">${esc(t)}</a></li>`).join('')}</ol></div>`:'';
  for(const m of JSON.stringify(tx).matchAll(/\[\^(\w+)\]/g)) if(!(tx.notes||{})[m[1]]) throw new Error(`${lang}: 각주 ${m[1]} 없음`);
  const glossHtml=pg.glossary?`<div class="srcs gloss"><h4>${esc(pg.glossTitle)}</h4><dl>${pg.glossary.map(([t,d])=>`<dt>${esc(t)}</dt><dd>${esc(d)}</dd>`).join('')}</dl></div>`:'';
  let html=tpl.replace('{{sourcesHtml}}',srcHtml+glossHtml).replace('{{css}}',css).replace('{{langs}}',langs).replace('{{ui}}',JSON.stringify(pg.ui).replace(/</g,'\\u003c'));
  for(const [k,v] of Object.entries(pg)) if(typeof v==='string') html=html.split('{{'+k+'}}').join(k.endsWith('Html')||k.startsWith('font')?v:esc(v));
  if(html.includes('{{')) throw new Error(`${lang}: 치환 안 된 자리표시자 `+html.match(/\{\{\w+\}\}/)[0]);
  const OUT=path.join(ROOT,lang,'hegemony','atlas');
  fs.mkdirSync(path.join(OUT,'data'),{recursive:true}); fs.mkdirSync(path.join(OUT,'lib'),{recursive:true});
  for(const y of YEARS) if(DATA[y]) fs.writeFileSync(path.join(OUT,'data',`${y}.json`),DATA[y]);
  for(const [y,v] of Object.entries(VCLIO)) if(meta.verify[y]) meta.verify[y].clio=v;
  fs.writeFileSync(path.join(OUT,'meta.json'),JSON.stringify(meta));
  fs.writeFileSync(path.join(OUT,'content.json'),JSON.stringify(content));
  fs.writeFileSync(path.join(OUT,'index.html'),html);
  fs.copyFileSync(path.join(HERE,'node_modules/d3/dist/d3.min.js'),path.join(OUT,'lib/d3.min.js'));
  fs.copyFileSync(path.join(HERE,'node_modules/topojson-client/dist/topojson-client.min.js'),path.join(OUT,'lib/topojson-client.min.js'));
  console.log('built',path.relative(process.cwd(),OUT));
}
