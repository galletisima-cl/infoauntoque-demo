const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--autoplay-policy=no-user-gesture-required']});
const c=await b.newContext({viewport:{width:400,height:820},deviceScaleFactor:2});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('response',r=>{if(r.status()>=400)errs.push(r.status()+' '+r.url())});
await p.goto('http://localhost:8767/amor/mascota/');await p.waitForTimeout(700);
await p.evaluate(()=>evolucionar(true));await p.waitForTimeout(6000);
await p.fill('input[placeholder="Ej: Mochi"]','Pichón');await p.click('text=Ponerle nombre');await p.waitForTimeout(800);for(let j=0;j<4;j++){await p.evaluate(()=>evolucionar(true));await p.waitForTimeout(6300)}
await p.evaluate(()=>{S.fondo='volcan';S.enfermo=false;S.herido=false;render()});await p.waitForTimeout(500);
// Botón Ataques
await p.evaluate(()=>{S.dur=false;$$('.full').forEach(x=>x.classList.remove('on'));ACC.ataques()});await p.waitForTimeout(600);await p.screenshot({path:'/home/claude/bat/s0.png'});
await p.evaluate(()=>$('#atqOk').click());await p.waitForTimeout(400);
await p.evaluate(()=>{S.dur=false;enemigoForzado=CHILENOS.find(c=>c.id==='caleuche');batalla()});
for(let i=1;i<=3;i++){await p.waitForTimeout(1100);await p.screenshot({path:`/home/claude/bat/s${i}.png`})}
await p.waitForSelector('#bMenu button[data-m]',{timeout:20000});await p.waitForTimeout(300);await p.screenshot({path:'/home/claude/bat/s4.png'});
const tests=[['rayo',500],['rayo',900],['chispas',900],['siesta',1500]];let k=0;
for(const [n,t] of tests){await p.evaluate(n=>{const y=$('#ySpr'),e=$('#eSpr');n.startsWith('rival')?ANIM[n](e,y,-1):ANIM[n](y,e,1,{n:3,crit:true,uno(){}})},n);await p.waitForTimeout(t);await p.screenshot({path:`/home/claude/bat/a${k++}.png`});await p.waitForTimeout(2600)}
console.log(errs);await b.close()})();
