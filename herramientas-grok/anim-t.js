const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const p=await b.newPage({viewport:{width:400,height:820},deviceScaleFactor:2});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file:///home/claude/anim/virtual-monster-animado.html');await p.waitForTimeout(600);await p.screenshot({path:'/home/claude/anim/s1.png'});
await p.click('#evo');await p.waitForTimeout(1300);await p.screenshot({path:'/home/claude/anim/s2.png'});
await p.click('.tira button >> nth=5');await p.waitForTimeout(1200);await p.screenshot({path:'/home/claude/anim/s3.png'});
console.log(errs);await b.close()})();
