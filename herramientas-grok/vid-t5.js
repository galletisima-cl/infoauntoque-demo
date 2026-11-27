const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--autoplay-policy=no-user-gesture-required']});
const c=await b.newContext({viewport:{width:400,height:820},deviceScaleFactor:2,timezoneId:'UTC'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{const D=Date;const fijo=new D('2026-11-27T15:00:00Z').getTime();const t0=D.now();window.Date=class extends D{constructor(...a){super(...(a.length?a:[fijo+(D.now()-t0)]))}static now(){return fijo+(D.now()-t0)}}});
await p.goto('http://localhost:8767/amor/mascota/');await p.waitForTimeout(700);
await p.evaluate(()=>evolucionar(true));await p.waitForTimeout(6000);
await p.fill('input[placeholder="Ej: Mochi"]','Pichón');await p.click('text=Ponerle nombre');await p.waitForTimeout(800);for(let j=0;j<5;j++){await p.evaluate(()=>evolucionar(true));await p.waitForTimeout(6300)}
for(const [i,k] of ['','volcan','pradera','navidad','ciudad','comic'].entries()){await p.evaluate(k=>{S.fondo=k;render()},k);await p.waitForTimeout(1500);await (await p.$('#stage')).screenshot({path:`/home/claude/vid/g${i}.png`})}
console.log(errs);await b.close()})();
