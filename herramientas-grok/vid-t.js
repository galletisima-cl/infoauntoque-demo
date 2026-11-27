const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:400,height:820},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
await p.goto('http://localhost:8767/amor/mascota/');await p.waitForTimeout(700);
await p.evaluate(()=>evolucionar(true));await p.waitForTimeout(6000);
await p.fill('input[placeholder="Ej: Mochi"]','Pichón');await p.click('text=Ponerle nombre');await p.waitForTimeout(2500);
await p.screenshot({path:'/home/claude/vid/m1.png'});
for(let i=0;i<5;i++){await p.evaluate(()=>evolucionar(true));await p.waitForTimeout(6500)}
await p.waitForTimeout(1500);await p.screenshot({path:'/home/claude/vid/m2.png'});
console.log(errs);await b.close()})();
