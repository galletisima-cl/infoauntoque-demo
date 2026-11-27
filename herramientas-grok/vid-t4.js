const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--autoplay-policy=no-user-gesture-required']});
const p=await b.newPage({viewport:{width:400,height:820},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('dialog',d=>{errs.push('DIALOG');d.accept()});
await p.goto('http://localhost:8767/amor/mascota/');await p.waitForTimeout(700);
await p.evaluate(()=>evolucionar(true));await p.waitForTimeout(6000);
await p.fill('input[placeholder="Ej: Mochi"]','Pichón');await p.click('text=Ponerle nombre');await p.waitForTimeout(1000);
for(let i=0;i<5;i++){await p.evaluate(()=>evolucionar(true));await p.waitForTimeout(6300)}
await p.click('[data-a=fondo]');await p.waitForTimeout(600);await p.screenshot({path:'/home/claude/vid/f0.png'});
const ks=['comic','grid','volcan','pradera'];
for(const [i,k] of ks.entries()){await p.click(`#fondosLista [data-f=${k}]`);await p.waitForTimeout(300);await p.click('#shFondo .cerrar');await p.waitForTimeout(1500);
 const st=await p.$('#stage');await st.screenshot({path:`/home/claude/vid/f${i+1}.png`});await p.click('[data-a=fondo]');await p.waitForTimeout(300)}
await p.click('#shFondo .cerrar');
await p.click('#btnReset');await p.waitForTimeout(300);const t1=await p.textContent('#btnReset');await p.click('#btnReset');await p.waitForTimeout(800);
console.log('reset:',t1,await p.evaluate(()=>S.fase+' '+S.fondo));
console.log(errs);await b.close()})();
