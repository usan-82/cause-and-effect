import fs from 'fs'; import path from 'path'; import {fileURLToPath} from 'url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
const RAW=process.argv[2]||path.join(HERE,'raw');           // prepare.sh가 만든 단순화 TopoJSON(w{연도}.json)
const OUT=process.argv[3]||path.join(HERE,'../../../ko/hegemony/atlas'); import {geoArea,geoCentroid,geoContains} from 'd3-geo'; import {feature} from 'topojson-client';
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
// [years, NAME regex, key, note]  — 보정 규칙 (원본 데이터의 소속 표기 오류·누락 수정)
const L=a=>new RegExp('^('+a+')$');
const FIX=[
 [[1600], L('Inca Empire'), 'es', '1530년 데이터가 그대로 남은 잉카 영역 → 스페인령 페루 부왕령'],
 [[1783], L('Quebec'), 'gb', '1763년 파리 조약 이후 영국령'],
 [[1815,1880,1914,1920,1938], L('Canada|Australia|Newfoundland|New Zealand|Union of South Africa|South Africa|Cape Colony'), 'gb', '영국 자치령·식민지'],
 [[1783], L("Rupert's Land"), 'gb', '허드슨만 회사령(영국)'],
 [[1914], L('Kamerun|German South-West Africa|Togoland|German New Guinea'), 'de', '독일 식민지'],
 [[1914,1920,1938], L('Philippines'), 'us', '1898년 이후 미국령'],
 [[1945], L('Philippines'), 'us', '독립은 1946년 7월'],
 [[1920,1938], L('Sudan|Tanzania, United Republic of|Nigeria|Zambia|Kenya|Botswana|Uganda|Malawi|Zimbabwe|Ghana|Sierra Leone|Gambia, The|Jamaica|Ceylon|Guyana|Belize|Trinidad|Brunei|Swaziland|Lesotho|Israel|Jordan|Kuwait|Qatar|Trucial Oman|Papua New Guinea'), 'gb', '영국 식민지·보호령·위임통치령'],
 [[1920,1938], L('Algeria|Tunisia|Morocco|Madagascar \\(France\\)|Madagascar|French Somaliland'), 'fr', '프랑스 식민지·보호령'],
 [[1920,1938], L('Angola|Mozambique|Guinea-Bissau'), 'pt', '포르투갈 식민지'],
 [[1920,1938], L('Burundi'), 'be', '벨기에 위임통치령'],
 [[1920,1938], L('Suriname'), 'nl', '네덜란드 식민지'],
 [[1920,1938], L('Equatorial Guinea|Spanish Sahara'), 'es', '스페인 식민지'],
 [[1938], L('Libya|Ethiopia'), 'it', '이탈리아 식민지·점령지(에티오피아 1936~41)'],
 [[1945], L('India|Pakistan|Bangladesh|Burma|Malaysia|Singapore|Sri Lanka|Israel|Jordan|Kuwait|Qatar|United Arab Emirates|Bahrain|Belize|Trinidad|Brunei|Guyana|Cyprus|Malta'), 'gb', '1945년 당시 영국령(데이터에는 독립 후 국경으로 표시)'],
 [[1945], L('Indonesia'), 'nl', '1945.8 독립 선언, 1949년까지 네덜란드와 분쟁'],
 [[1945], L('Zaire'), 'be', '벨기에령 콩고(독립 1960)'],
 [[1945,1960], L('Rwanda|Burundi'), 'be', '벨기에 신탁통치령(독립 1962)'],
 [[1945], L('Central African Republic|Djibouti|Guinea'), 'fr', '프랑스 식민지'],
 [[1945,1960], L('Suriname'), 'nl', '네덜란드령(독립 1975)'],
 [[1945,1960], L('Western Sahara|Equatorial Guinea'), 'es', '스페인 식민지'],
 [[1960], L('Algeria|Djibouti|Comoros'), 'fr', '1960년 당시 프랑스령(알제리 독립 1962)'],
 [[1960], L('Angola|Mozambique|Guinea-Bissau|Cape Verde|Sao Tome and Principe'), 'pt', '포르투갈 식민지(독립 1974~75)'],
 [[1960], L('Zambia|Kenya|Tanzania, United Republic of|Uganda|Malawi|Zimbabwe|Botswana|Lesotho|Swaziland|Gambia, The|Sierra Leone|Jamaica|Trinidad|Guyana|Belize|Kuwait|Bahrain|Qatar|United Arab Emirates|Brunei|Malta|Mauritius|Fiji'), 'gb', '1960년 당시 영국령·보호령(대부분 1961~71 독립)'],
 [[1994], L('Macau|Macao'), 'pt', '포르투갈령(반환 1999)'],
 [[1880,1914], L('Malta'), 'gb', '1800년 이후 영국령(1964 독립)'],
 [[1914,1920], L('Malaya|Malaysia'), 'gb', '영국 해협식민지·말레이 보호령'],
 [[1815,1880,1914], L('Ceylon'), 'gb', '1796년 점령, 1802년 영국 직할 식민지'],
 [[1650,1700,1715,1783,1815,1880], L('Philippines'), 'es', '1565~71년 이후 스페인 식민지(내륙·남부 이슬람 지역은 통제 밖)'],
 [[1700], L('Dutch Formosa'), 'cn', '네덜란드는 1662년 대만에서 축출, 1683년 청이 편입 — 원본의 "Dutch Formosa"는 시대 착오'],
 [[1715,1815], L('Egypt'), 'ot', '오스만 제국의 속주(1517~). 1805년 이후 무함마드 알리 왕조의 사실상 자치'],
 [[1945], L('Egypt'), null, '1922년 독립국(운하지대에는 영국군 주둔) — 원본은 영국령으로 표기'],
];
function rewind(f){const gm=f.geometry;if(!gm)return f;const ps=gm.type==='Polygon'?[gm.coordinates]:gm.type==='MultiPolygon'?gm.coordinates:[];for(const p of ps)for(let i=0;i<p.length;i++){if(geoArea({type:'Polygon',coordinates:[p[i]]})>2*Math.PI)p[i]=p[i].slice().reverse();}return f;}
const CHOKE=JSON.parse(fs.readFileSync(path.join(HERE,'choke.json')));
const KEYS=['gb','fr','es','pt','nl','ru','ot','cn','us','de','at','jp','it','be','mg'];
const content=JSON.parse(fs.readFileSync(path.join(HERE,'content.json')));
const out={labels:{},fixes:{},choke:{}};
for(const y of YEARS){
  const t=JSON.parse(fs.readFileSync(path.join(RAW,`w${y}.json`))); const k=Object.keys(t.objects)[0];
  t.objects={w:t.objects[k]}; const fixes={};
  for(const g of t.objects.w.geometries){
    const n=(g.properties.NAME||'').trim(), s=(g.properties.SUBJECTO||'').trim();
    let p=base(y,n,s), fx=null;
    for(const [ys,re,key,note] of FIX) if(ys.includes(y)&&re.test(n)){p=key;fx=note;}
    let dn=n;
    if(y===1914&&n==='Manchu Empire'){dn='Republic of China';fx='원본 표기 "Manchu Empire" → 중화민국(1912~)';}
    if(y===1920&&s==='USSR'){fx='소련 성립은 1922년 — 이 시점은 소비에트 러시아·연방 공화국들';}
    if(fx) fixes[n]=fx;
    g.properties={n:dn||null,s:s&&s!==n?s:null,p,b:g.properties.BORDERPRECISION??null,...(fx?{f:fx}:{})};
  }
  // labels: for each rival, centroid of its largest feature
  const fc=feature(t,t.objects.w); const best={};
  for(const f of fc.features){const p=f.properties.p; if(!p) continue; let a=geoArea(f); if(a>2*Math.PI) a=4*Math.PI-a; if(!best[p]||a>best[p].a) best[p]={a,c:geoCentroid(f)};}
  const rivals=content.years.find(c=>c.year===y).rivals;
  out.labels[y]=Object.fromEntries(rivals.filter(r=>best[r]).map(r=>[r,best[r].c.map(v=>+v.toFixed(2))]));
  out.fixes[y]=fixes;
  // 요충지 점검: 검증된 지배 세력 vs 지도 데이터
  const ff=feature(t,t.objects.w).features.map(rewind).filter(f=>f.geometry);
  out.choke[y]=CHOKE.map(c=>{
    const r=c.r.find(([a,b])=>y>=a&&y<=b);
    let hits=ff.filter(f=>geoContains(f,c.ll));
    if(!hits.length){outer:for(const d of [0.15,0.3,0.6]){for(const [dx,dy] of [[d,0],[-d,0],[0,d],[0,-d],[d,d],[-d,-d],[d,-d],[-d,d]]){const h=ff.filter(f=>geoContains(f,[c.ll[0]+dx,c.ll[1]+dy]));if(h.length){hits=h;break outer;}}}}
    hits.sort((a,b)=>geoArea(a)-geoArea(b)); const h=hits[0];
    const mk=h?h.properties.p:null, mn=h?(h.properties.n||'이름 없는 지역'):null;
    const shown=k=>k&&rivals.includes(k)?k:null;
    return {id:c.id,name:c.name,ll:c.ll,k:r[2],who:r[3],note:r[4]||'',mapName:mn,mapKey:mk,vis:!!h&&shown(mk)!==shown(r[2]),absent:!h,lab:(mk||null)!==(r[2]||null)};
  });
  fs.mkdirSync(path.join(OUT,'data'),{recursive:true}); fs.writeFileSync(path.join(OUT,'data',`${y}.json`),JSON.stringify(t));
  console.log(y,'fixes',Object.keys(fixes).length,'rivals',rivals.filter(r=>!best[r]));
}
fs.writeFileSync(path.join(OUT,'meta.json'),JSON.stringify(out));
fs.copyFileSync(path.join(HERE,'content.json'),path.join(OUT,'content.json'));
fs.copyFileSync(path.join(HERE,'template.html'),path.join(OUT,'index.html'));
fs.mkdirSync(path.join(OUT,'lib'),{recursive:true});
fs.copyFileSync(path.join(HERE,'node_modules/d3/dist/d3.min.js'),path.join(OUT,'lib/d3.min.js'));
fs.copyFileSync(path.join(HERE,'node_modules/topojson-client/dist/topojson-client.min.js'),path.join(OUT,'lib/topojson-client.min.js'));
