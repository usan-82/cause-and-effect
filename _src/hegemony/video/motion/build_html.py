import sys, os
R, out = sys.argv[1], sys.argv[2]
lib = os.path.join(R, "ko/hegemony/atlas-simple/lib")
d3 = open(f"{lib}/d3.min.js").read(); tj = open(f"{lib}/topojson-client.min.js").read()
topo = open(os.path.join(R, "ko/hegemony/atlas-simple/data/1492.json")).read()
html = r"""<!doctype html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@500;700;900&display=swap" rel="stylesheet">
<style>html,body{margin:0;width:1920px;height:1080px;overflow:hidden;background:#f4efe6}
text{font-family:'Noto Sans KR',sans-serif}</style>
<script>window.onerror=(m)=>{window.__err=String(m)};</script>
<script>""" + d3 + "</script><script>" + tj + "</script></head><body><svg id='v' width='1920' height='1080'></svg><script>const TOPO=" + topo + r""";
const W=1920,H=1080, C={bg:'#f4efe6',ink:'#1b1a18',ind:'#2b3a67',red:'#c0392b',och:'#c8922a',teal:'#1f7a73',land:'#d9d2c3',sea:'#e4ebee',ming:'#c22f6f',mute:'#8a857a'};
function rewind(f){const g=f.geometry;if(!g)return f;const ps=g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[];
 for(const p of ps)for(let i=0;i<p.length;i++){if(d3.geoArea({type:'Polygon',coordinates:[p[i]]})>2*Math.PI)p[i]=p[i].slice().reverse();}return f;}
const FE=topojson.feature(TOPO,TOPO.objects.w).features.map(rewind);
const OUT=d3.geoGraticule().extent([[-180,-58],[180,84]]).outline();
const S0=d3.geoNaturalEarth1().fitSize([W,W*0.5],OUT).scale();
const cl=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)), seg=(t,a,b)=>cl((t-a)/(b-a));
const io=x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2, oc=x=>1-Math.pow(1-x,3);
const back=x=>{const c1=1.70158,c3=c1+1;return 1+c3*Math.pow(x-1,3)+c1*Math.pow(x-1,2);};
const lerp=(a,b,p)=>a+(b-a)*p, mix=(c1,c2,p)=>d3.interpolateRgb(c1,c2)(p);
function proj(center,k,dx=0){return d3.geoNaturalEarth1().scale(S0*k).center(center).translate([W/2+dx,H/2]);}
function mapLayer(pj,fill){const P=d3.geoPath(pj);let s=`<rect width="${W}" height="${H}" fill="${C.sea}"/>`;
 for(const f of FE)s+=`<path d="${P(f)}" fill="${fill(f.properties.k)}" stroke="#fff" stroke-width="${f.properties.k?1.4:0.5}"/>`;return s;}
function txt(x,y,s,size,col,w=900,anchor='middle',op=1,extra=''){return `<text x="${x}" y="${y}" font-size="${size}" font-weight="${w}" fill="${col}" text-anchor="${anchor}" opacity="${op}" ${extra}>${s}</text>`;}
function chip(x,y,s,size,bg,fg,op=1,sc=1){const w=s.length*size*0.95+size*1.4,h=size*1.7;
 return `<g transform="translate(${x},${y}) scale(${sc})" opacity="${op}"><rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="${h/2}" fill="${bg}"/>${txt(0,size*0.36,s,size,fg)}</g>`;}
// 픽토그램: 명의 배
function junk(x,y,s,op=1){return `<g transform="translate(${x},${y}) scale(${s})" opacity="${op}">
 <path d="M-60,0 L60,0 L75,-18 L80,-34 L52,-22 L-62,-22 L-72,-30 Z" fill="${C.ind}"/>
 ${[-38,0,36].map((mx,i)=>{const h=[58,78,62][i];return `<rect x="${mx-2}" y="${-22-h-8}" width="4" height="${h+8}" fill="${C.ink}"/>
 <rect x="${mx-18}" y="${-22-h}" width="34" height="${h-6}" rx="3" fill="${C.och}"/>`+[0.25,0.5,0.75].map(f=>`<rect x="${mx-18}" y="${-22-h+(h-6)*f}" width="34" height="3" fill="${C.ink}" opacity=".55"/>`).join('');}).join('')}</g>`;}
// 픽토그램: 정화
function zhenghe(x,y,s,op=1){return `<g transform="translate(${x},${y}) scale(${s})" opacity="${op}">
 <path d="M-95,260 L-70,40 Q0,10 70,40 L95,260 Z" fill="${C.red}"/>
 <rect x="-36" y="70" width="72" height="72" rx="6" fill="${C.ind}"/><circle cx="0" cy="106" r="20" fill="#f0e2c8"/><circle cx="0" cy="106" r="8" fill="${C.och}"/>
 <rect x="-70" y="150" width="140" height="10" fill="${C.ink}"/>
 <path d="M-18,38 Q0,52 18,38 L14,24 L-14,24 Z" fill="#f0e2c8"/>
 <circle cx="0" cy="-10" r="48" fill="#e7b98c"/>
 <circle cx="-16" cy="-8" r="4.5" fill="${C.ink}"/><circle cx="16" cy="-8" r="4.5" fill="${C.ink}"/><path d="M-10,14 Q0,19 10,14" stroke="${C.ink}" stroke-width="3" fill="none"/>
 <path d="M-46,-26 Q-46,-74 0,-74 Q46,-74 46,-26 Z" fill="${C.ink}"/>
 <path d="M-40,-40 Q-74,-56 -78,-26 Q-74,-18 -64,-24 Q-62,-36 -42,-30 Z" fill="${C.ink}"/><path d="M40,-40 Q74,-56 78,-26 Q74,-18 64,-24 Q62,-36 42,-30 Z" fill="${C.ink}"/>
 <circle cx="-74" cy="-26" r="5" fill="${C.och}"/><circle cx="74" cy="-26" r="5" fill="${C.och}"/></g>`;}
function arc(p0,p1,bend){const mx=(p0[0]+p1[0])/2,my=(p0[1]+p1[1])/2,dx=p1[0]-p0[0],dy=p1[1]-p0[1];return [p0,[mx-dy*bend,my+dx*bend],p1];}
function qpt(q,u){const a=1-u;return [a*a*q[0][0]+2*a*u*q[1][0]+u*u*q[2][0], a*a*q[0][1]+2*a*u*q[1][1]+u*u*q[2][1]];}
function partial(pts,u){ // 꺾인 선의 앞부분 u만큼
 const L=[0];for(let i=1;i<pts.length;i++)L.push(L[i-1]+Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]));
 const tot=L[L.length-1]*u, out=[pts[0]];for(let i=1;i<pts.length;i++){if(L[i]<=tot)out.push(pts[i]);else{const r=(tot-L[i-1])/(L[i]-L[i-1]);out.push([lerp(pts[i-1][0],pts[i][0],r),lerp(pts[i-1][1],pts[i][1],r)]);break;}}return out;}
const sm=d3.line().curve(d3.curveCatmullRom.alpha(.5));
function dense(pj,geo){const pts=geo.map(p=>pj(p));const L=d3.line().curve(d3.curveCatmullRom.alpha(.5));
 const tmp=document.createElementNS('http://www.w3.org/2000/svg','path');tmp.setAttribute('d',L(pts));const len=tmp.getTotalLength(),o=[];for(let i=0;i<=120;i++){const q=tmp.getPointAtLength(len*i/120);o.push([q.x,q.y]);}return o;}

const SC={
s1(t){ // 10.5초
 const z=io(seg(t,0,3.0)), k=lerp(1.0,2.5,z), c=[lerp(40,112,z),lerp(15,27,z)], pj=proj(c,k);
 const mf=oc(seg(t,1.6,2.8));
 let s=mapLayer(pj,key=>key==='cn'?mix(C.land,C.ming,mf):C.land);
 const nj=pj([118.8,32.1]);
 // 사신 화살표
 const src=[[126.9,37.5],[135.6,34.7],[127.7,26.2],[108.3,14.5],[102.25,2.2]];
 src.forEach((p,i)=>{const a0=5.6+i*0.35,u=oc(seg(t,a0,a0+1.4));if(u<=0)return;
  const q=arc(pj(p),nj,i%2?0.18:-0.18);const pts=d3.range(0,1.0001,0.02).map(v=>qpt(q,v));const pp=partial(pts,u);
  s+=`<path d="${sm(pp)}" fill="none" stroke="${C.ind}" stroke-width="7" stroke-dasharray="16 11" stroke-linecap="round"/>`;
  const h=pp[pp.length-1];s+=`<circle cx="${pj(p)[0]}" cy="${pj(p)[1]}" r="11" fill="${C.ind}"/>`;
  if(u<1)s+=`<g transform="translate(${h[0]},${h[1]})"><rect x="-17" y="-12" width="34" height="24" rx="5" fill="${C.och}" stroke="#fff" stroke-width="4"/></g>`;});
 if(t>5.4){const pu=seg(t,7.4,8.4);s+=`<circle cx="${nj[0]}" cy="${nj[1]}" r="${16+pu*60}" fill="none" stroke="${C.ming}" stroke-width="6" opacity="${(1-pu)*(pu>0)}"/>`;
  s+=`<circle cx="${nj[0]}" cy="${nj[1]}" r="13" fill="${C.ink}" stroke="#fff" stroke-width="5"/>`+txt(nj[0]+26,nj[1]+14,'난징',38,C.ink,900,'start',oc(seg(t,5.4,5.9)),'paint-order="stroke" stroke="#fff" stroke-width="9"');}
 const lp=pj([108,33]), ls=back(seg(t,2.4,3.0));
 if(ls>0)s+=`<g transform="translate(${lp[0]},${lp[1]}) scale(${ls})">`+txt(0,26,'명',92,'#fff',900,'middle',1,`paint-order="stroke" stroke="${C.ming}" stroke-width="12"`)+'</g>';
 s+=chip(260,110,'600년쯤 전',46,C.ink,'#fff',oc(seg(t,0.3,0.9)));
 s+=chip(W-430,H-110,'동아시아의 중심',46,C.ming,'#fff',oc(seg(t,3.2,3.8)),lerp(.8,1,back(seg(t,3.2,3.8))));
 return s;},
s2(t){ // 10초
 const pj=proj([80,8],1.75,330);
 let s=`<g opacity="${oc(seg(t,0,0.6))}">`+mapLayer(pj,key=>key==='cn'?C.ming:C.land)+'</g>';
 s+=`<rect x="0" y="0" width="640" height="${H}" fill="${C.bg}" opacity=".96"/>`;
 const NJ=[118.8,32.1], ends=[[[75.8,11.25]],[[75.8,11.25],[56.3,27.1]],[[75.8,11.25]],[[75.8,11.25],[56.3,27.1]],[[75.8,11.25],[45.0,12.8],[40.1,-3.2]],[[75.8,11.25],[45.3,2.0]],[[75.8,11.25],[56.3,27.1]]];
 const base=[NJ,[122,28],[118,22],[111,14],[108,8],[104,1.5],[100,4],[94,6],[86,5],[80.2,6.0],[77,8]];
 const routes=ends.map(e=>{let r=base.concat([e[0]]);for(let j=1;j<e.length;j++){const a=e[j-1],b=e[j];r.push([(a[0]+b[0])/2,(a[1]+b[1])/2-3]);r.push(b);}return dense(pj,r);});
 let n=0;
 routes.forEach((pts,i)=>{const a0=i===0?1.4:3.2+(i-1)*0.75, dur=i===0?1.8:0.75, u=io(seg(t,a0,a0+dur));if(u<=0)return;n=i+1;
  const pp=partial(pts,u), last=i===n-1;
  s+=`<path d="${sm(pp)}" fill="none" stroke="${C.red}" stroke-width="${u<1?7:4}" opacity="${u<1?1:.45}" stroke-dasharray="${u<1?'0':'12 10'}" stroke-linecap="round"/>`;
  if(u<1){const h=pp[pp.length-1];s+=junk(h[0],h[1]+10,0.75);}});
 const nj=pj(NJ);s+=`<circle cx="${nj[0]}" cy="${nj[1]}" r="12" fill="${C.ink}" stroke="#fff" stroke-width="5"/>`;
 const zs=back(seg(t,0.1,0.9));if(zs>0)s+=zhenghe(320,470,1.25*zs);
 s+=chip(320,840,'정화',72,C.red,'#fff',oc(seg(t,0.7,1.2)),lerp(.7,1,back(seg(t,0.7,1.2))));
 s+=txt(320,950,'명 황제의 함대를 이끈 환관',40,C.ink,700,'middle',oc(seg(t,1.0,1.6)));
 if(n>0){const pop=back(seg(t,(n===1?1.4:3.2+(n-2)*0.75),(n===1?1.4:3.2+(n-2)*0.75)+0.35));
  s+=`<g transform="translate(${W-250},${200}) scale(${lerp(.6,1,pop)})"><circle r="120" fill="${C.ind}"/>`+txt(0,-28,'인도양',36,'#fff',700)+txt(0,62,`${n}번`,104,'#fff',900)+'</g>';}
 return s;},
s3(t){ // 11초
 let s='';const x0=330,x1=1590,y=470,slots=8,gx=(x1-x0)/(slots-1);
 const lift=io(seg(t,5.0,5.8)), dy=-lift*230, fade=1-lift*0.65;
 s+=`<g transform="translate(0,${dy})" opacity="${fade}">`;
 const bar=oc(seg(t,0,0.9));s+=`<rect x="${x0-60}" y="${y+70}" width="${(x1-gx-x0+120)*bar}" height="12" rx="6" fill="${C.ink}"/>`;
 s+=txt(x0,y+150,'1405',46,C.ink,900,'middle',oc(seg(t,0.5,1)))+txt(x1-gx,y+150,'1433',46,C.ink,900,'middle',oc(seg(t,0.5,1)));
 s+=txt((x0+x1-gx)/2,y+150,'28년',46,C.red,900,'middle',oc(seg(t,1.0,1.5)));
 for(let i=0;i<7;i++){const a=0.6+i*0.32,p=back(seg(t,a,a+0.35));if(p>0){s+=junk(x0+i*gx,y+40,0.9*p);s+=txt(x0+i*gx,y-110,String(i+1),40,C.ind,900,'middle',cl(p));}}
 const gp=seg(t,3.0,3.6);if(gp>0){const gx8=x0+7*gx;s+=`<rect x="${gx8-80}" y="${y-110}" width="160" height="170" rx="18" fill="none" stroke="${C.mute}" stroke-width="5" stroke-dasharray="14 10" opacity="${oc(gp)}"/>`;
  const ghost=seg(t,3.1,3.9);s+=junk(gx8,y+40,0.9,0.35*Math.sin(ghost*Math.PI));
  const xp=back(seg(t,3.8,4.2));if(xp>0)s+=`<g transform="translate(${gx8},${y-25}) scale(${xp})"><path d="M-48,-48 L48,48 M48,-48 L-48,48" stroke="${C.red}" stroke-width="16" stroke-linecap="round"/></g>`;}
 s+='</g>';
 const q=back(seg(t,4.2,4.7));if(q>0&&t<5.0+0.01||t>=5.0){const qo=1;}
 if(t>=4.2){const sc=lerp(.5,1,back(seg(t,4.2,4.7)));s+=`<g transform="translate(${W/2},${lerp(860,500,lift)}) scale(${sc})">`+txt(0,30,'왜 멈췄을까?',92,C.ink,900)+'</g>';}
 if(t>=5.8){const zp=back(seg(t,5.8,6.5));s+=zhenghe(560,720,0.9*zp);
  const bp=oc(seg(t,6.4,7.0));s+=`<g opacity="${bp}"><path d="M690,640 Q700,590 760,590 L1540,590 Q1600,590 1600,650 L1600,760 Q1600,820 1540,820 L800,820 Q760,820 750,860 Q735,820 700,810 Q690,770 690,720 Z" fill="#fff" stroke="${C.ink}" stroke-width="5"/>`+
   txt(1145,680,'정화는 왜,',62,C.ink,900)+txt(1145,770,'무엇을 얻으려고 떠났을까?',62,C.red,900)+'</g>';}
 return s;}};
window.draw=(sc,t)=>{document.getElementById('v').innerHTML=`<rect width="${W}" height="${H}" fill="${C.bg}"/>`+SC[sc](t);};
</script></body></html>"""
open(out, "w").write(html); print("ok")
