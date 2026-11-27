const { chromium } = require('playwright'); const fs=require('fs');
(async()=>{const [html,scene,dur,outdir,only]=process.argv.slice(2);fs.mkdirSync(outdir,{recursive:true});
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1920,height:1080}});
 await p.goto('file://'+html);await p.evaluate(()=>document.fonts.ready);
 const n=Math.round(parseFloat(dur)*30); const list=only?only.split(',').map(Number):[...Array(n).keys()];
 for(const i of list){await p.evaluate(([s,t])=>window.draw(s,t),[scene,i/30]);
  const e=await p.evaluate(()=>window.__err||'');if(e){console.error(e);process.exit(1);}
  await p.screenshot({path:`${outdir}/${String(i).padStart(4,'0')}.jpg`,type:'jpeg',quality:92});}
 await b.close();})();
