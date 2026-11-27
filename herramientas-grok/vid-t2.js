const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:400,height:820},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('http://localhost:8767/amor/mascota/');await p.waitForTimeout(700);
await p.evaluate(()=>evolucionar(true));await p.waitForTimeout(6000);
await p.fill('input[placeholder="Ej: Mochi"]','Pichón');await p.click('text=Ponerle nombre');await p.waitForTimeout(2500);
const shots=[];
for(let i=0;i<6;i++){await p.waitForTimeout(1200);await p.screenshot({path:`/home/claude/vid/e${i}.png`,clip:{x:12,y:200,width:376,height:340}});if(i<5){await p.evaluate(()=>evolucionar(true));await p.waitForTimeout(6500)}}
// batalla
await p.evaluate(()=>batalla());await p.waitForTimeout(3000);await p.screenshot({path:'/home/claude/vid/bat.png'});
console.log(errs);await b.close()})();
