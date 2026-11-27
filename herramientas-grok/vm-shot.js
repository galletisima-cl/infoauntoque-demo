const {chromium}=require('/opt/npm-tools/node_modules/playwright');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});
for(const [f,w,h,o] of [['lamina_anime.html',1280,1200,'vm-anime-ramas.png'],['poster_anime.html',1280,900,'vm-anime-transformacion.png']]){
const p=await b.newPage({viewport:{width:w,height:h},deviceScaleFactor:1.5});await p.goto('file:///home/claude/vm/'+f);await p.waitForTimeout(300);await p.screenshot({path:o,fullPage:true})}
await b.close()})();
