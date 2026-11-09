import fs from 'fs'; import path from 'path'; import {fileURLToPath} from 'url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
const RAW=process.argv[2]||path.join(HERE,'raw');           // prepare.sh가 만든 단순화 TopoJSON(w{연도}.json)
const ROOT=process.argv[3]||path.join(HERE,'../../..');         // 저장소 루트 → {lang}/hegemony/atlas/
const ONLY=process.argv.slice(4);                                   // 특정 언어만: node build.mjs raw . en
import {geoArea,geoCentroid,geoContains} from 'd3-geo'; import {feature} from 'topojson-client';
const YEARS=[1492,1530,1600,1650,1700,1715,1783,1815,1880,1914,1920,1938,1945,1960,1994,2010];
const base=(y,n,s)=>{
  const S=re=>re.test(s), N=re=>re.test(n);
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
 [[1945], L('Indonesia'), 'nl', 'indo_1945'],
 [[1945], L('Zaire'), 'be', 'zaire_1945'],
 [[1945,1960], L('Rwanda|Burundi'), 'be', 'be_trust'],
 [[1945], L('Central African Republic|Djibouti|Guinea'), 'fr', 'frcol'],
 [[1945,1960], L('Suriname'), 'nl', 'nl_1960'],
 [[1945,1960], L('Western Sahara|Equatorial Guinea'), 'es', 'escol'],
 [[1960], L('Algeria|Djibouti|Comoros'), 'fr', 'fr_1960'],
 [[1960], L('Angola|Mozambique|Guinea-Bissau|Cape Verde|Sao Tome and Principe'), 'pt', 'pt_1960'],
 [[1960], L('Zambia|Kenya|Tanzania, United Republic of|Uganda|Malawi|Zimbabwe|Botswana|Lesotho|Swaziland|Gambia, The|Sierra Leone|Jamaica|Trinidad|Guyana|Belize|Kuwait|Bahrain|Qatar|United Arab Emirates|Brunei|Malta|Mauritius|Fiji'), 'gb', 'gb_1960'],
 [[1994], L('Macau|Macao'), 'pt', 'macau'],
 [[1880,1914], L('Malta'), 'gb', 'malta'],
 [[1914,1920], L('Malaya|Malaysia'), 'gb', 'malaya'],
 [[1815,1880,1914], L('Ceylon'), 'gb', 'ceylon'],
 [[1650,1700,1715,1783,1815,1880], L('Philippines'), 'es', 'ph_es'],
 [[1700], L('Dutch Formosa'), 'cn', 'formosa'],
 [[1715,1815], L('Egypt'), 'ot', 'egypt_ot'],
 [[1945], L('Egypt'), null, 'egypt_1945'],
];
function rewind(f){const gm=f.geometry;if(!gm)return f;const ps=gm.type==='Polygon'?[gm.coordinates]:gm.type==='MultiPolygon'?gm.coordinates:[];for(const p of ps)for(let i=0;i<p.length;i++){if(geoArea({type:'Polygon',coordinates:[p[i]]})>2*Math.PI)p[i]=p[i].slice().reverse();}return f;}
const LANGS=[['ko','한국어'],['en','English'],['id','Bahasa Indonesia']];
const J=f=>JSON.parse(fs.readFileSync(path.join(HERE,f),'utf8'));
const ST=J('struct.json');
if(ST.years.map(y=>y.year).join()!==YEARS.join()) throw new Error('struct.json 연도 목록이 YEARS와 다름');
// 요충지 범위가 모든 시점을 정확히 한 번씩 덮는지 확인
for(const c of ST.choke) for(const y of YEARS){const n=c.r.filter(([a,b])=>a<=y&&y<=b).length; if(n!==1) throw new Error(`요충지 ${c.id} ${y}: 범위 ${n}개`);}

// ---- 1) 언어와 무관한 지도 데이터와 점검 결과
const meta={labels:{},fixes:{},choke:{}}, DATA={};
for(const y of YEARS){
  const t=JSON.parse(fs.readFileSync(path.join(RAW,`w${y}.json`))); const k=Object.keys(t.objects)[0];
  t.objects={w:t.objects[k]}; const fixes={};
  for(const g of t.objects.w.geometries){
    const n=(g.properties.NAME||'').trim(), s=(g.properties.SUBJECTO||'').trim();
    let p=base(y,n,s), fx=null;
    for(const [ys,re,key,note] of FIX) if(ys.includes(y)&&re.test(n)){p=key;fx=note;}
    let dn=n;
    if(y===1914&&n==='Manchu Empire'){dn='Republic of China';fx='manchu';}
    if(y===1920&&s==='USSR'){fx='ussr_1920';}
    if(fx) fixes[n]=fx;
    g.properties={n:dn||null,s:s&&s!==n?s:null,p,b:g.properties.BORDERPRECISION??null,...(fx?{f:fx}:{})};
  }
  const rivals=ST.years.find(c=>c.year===y).rivals;
  const fc=feature(t,t.objects.w); const best={};
  for(const f of fc.features){const p=f.properties.p; if(!p) continue; let a=geoArea(f); if(a>2*Math.PI) a=4*Math.PI-a; if(!best[p]||a>best[p].a) best[p]={a,c:geoCentroid(f)};}
  const missing=rivals.filter(r=>!best[r]); if(missing.length) console.warn(y,'지도에 없는 주역',missing);
  meta.labels[y]=Object.fromEntries(rivals.filter(r=>best[r]).map(r=>[r,best[r].c.map(v=>+v.toFixed(2))]));
  meta.fixes[y]=fixes;
  // 요충지 점검: 검증된 지배 세력 vs 지도 데이터
  const ff=feature(t,t.objects.w).features.map(rewind).filter(f=>f.geometry);
  const shown=k=>k&&rivals.includes(k)?k:null;
  meta.choke[y]=ST.choke.map(c=>{
    const r=c.r.find(([a,b])=>y>=a&&y<=b);
    let hits=ff.filter(f=>geoContains(f,c.ll));
    if(!hits.length){outer:for(const d of [0.15,0.3,0.6]){for(const [dx,dy] of [[d,0],[-d,0],[0,d],[0,-d],[d,d],[-d,-d],[d,-d],[-d,d]]){const h=ff.filter(f=>geoContains(f,[c.ll[0]+dx,c.ll[1]+dy]));if(h.length){hits=h;break outer;}}}}
    hits.sort((a,b)=>geoArea(a)-geoArea(b)); const h=hits[0];
    const mk=h?h.properties.p:null;
    return {id:c.id,ll:c.ll,k:r[2],mapName:h?(h.properties.n||''):null,mapKey:mk,vis:!!h&&shown(mk)!==shown(r[2]),absent:!h};
  });
  DATA[y]=JSON.stringify(t);
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
    short:tx.short, fixes:tx.fixes,
    choke:Object.fromEntries(ST.choke.map(c=>[c.id,Object.fromEntries(YEARS.map(y=>{const i=c.r.findIndex(([a,b])=>a<=y&&y<=b);const [who,note]=tx.choke[c.id].r[i];return [y,{name:tx.choke[c.id].name,who,note}];}))]))
  };
  const langs=LANGS.map(([c,n])=>c===lang?`<span aria-current="page">${esc(n)}</span>`:`<a href="../../../${c}/hegemony/atlas/" hreflang="${c}" lang="${c}">${esc(n)}</a>`).join('');
  let html=tpl.replace('{{css}}',css).replace('{{langs}}',langs).replace('{{ui}}',JSON.stringify(pg.ui).replace(/</g,'\\u003c'));
  for(const [k,v] of Object.entries(pg)) if(typeof v==='string') html=html.split('{{'+k+'}}').join(k.endsWith('Html')||k.startsWith('font')?v:esc(v));
  if(html.includes('{{')) throw new Error(`${lang}: 치환 안 된 자리표시자 `+html.match(/\{\{\w+\}\}/)[0]);
  const OUT=path.join(ROOT,lang,'hegemony','atlas');
  fs.mkdirSync(path.join(OUT,'data'),{recursive:true}); fs.mkdirSync(path.join(OUT,'lib'),{recursive:true});
  for(const y of YEARS) fs.writeFileSync(path.join(OUT,'data',`${y}.json`),DATA[y]);
  fs.writeFileSync(path.join(OUT,'meta.json'),JSON.stringify(meta));
  fs.writeFileSync(path.join(OUT,'content.json'),JSON.stringify(content));
  fs.writeFileSync(path.join(OUT,'index.html'),html);
  fs.copyFileSync(path.join(HERE,'node_modules/d3/dist/d3.min.js'),path.join(OUT,'lib/d3.min.js'));
  fs.copyFileSync(path.join(HERE,'node_modules/topojson-client/dist/topojson-client.min.js'),path.join(OUT,'lib/topojson-client.min.js'));
  console.log('built',path.relative(process.cwd(),OUT));
}
