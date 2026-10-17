import { chromium } from 'playwright-core';
import fs from 'fs'; import path from 'path';
const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..'), BASE='https://yy8343.github.io/xhs-title/';
const SECRET='我的秘密主题ABC';
let fails=0; const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m); if(!c) fails++;};
const browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/google-chrome',args:['--no-sandbox']});
async function setup({blockGC=false, ua, init}={}){
  const ctx=await browser.newContext({userAgent:ua, permissions:['clipboard-read','clipboard-write']});
  const hits=[]; const errors=[];
  await ctx.route('https://yy8343.github.io/**', r=>{
    const u=new URL(r.request().url()); let p=u.pathname.replace('/xhs-title/','')||'index.html';
    const f=path.join(ROOT,p);
    if(blockGC && p==='js/count.js') return r.abort();
    if(!fs.existsSync(f)) return r.fulfill({status:404,body:'nf'});
    r.fulfill({status:200,body:fs.readFileSync(f),contentType:p.endsWith('.js')?'application/javascript':'text/html; charset=utf-8'});
  });
  await ctx.route('https://xhstitle.goatcounter.com/**', r=>{ return blockGC? r.abort(): r.fulfill({status:204,body:''}); });
  await ctx.route(u=>!u.href.startsWith('https://yy8343.github.io')&&!u.href.startsWith('https://xhstitle.goatcounter.com'), r=>r.abort());
  const page=await ctx.newPage();
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('request',q=>{ if(q.url().includes('goatcounter.com')&&!hits.includes(q.url())) hits.push(q.url()); });
  if(init) await page.addInitScript(init);
  return {ctx,page,hits,errors};
}
const evs=hits=>hits.map(h=>new URL(h)).map(u=>({p:u.searchParams.get('p'),e:u.searchParams.get('e'),t:u.searchParams.get('t'),q:u.searchParams.get('q'),raw:decodeURIComponent(u.href)}));
const wait=ms=>new Promise(r=>setTimeout(r,ms));

// A. 正常流程 + 事件
{
  const {ctx,page,hits,errors}=await setup({init:`delete Navigator.prototype.share;`});
  await page.goto(BASE+'?src=xhs&ref=share'); await page.waitForLoadState('load');
  ok(await page.title()==='小红书标题生成器（免费·不限次）｜一键生成爆款标题+正文','title 已更新');
  await page.fill('#topic',SECRET+'，好物！'); await page.selectOption('#who','宝妈');
  await page.click('#genBtn');
  ok(await page.locator('#out li').count()===10,'生成 10 组');
  const txt=await page.locator('#out').innerText();
  ok(!txt.includes('们们'),'无"们们"');
  const btns=await page.locator('#out li button').allInnerTexts();
  ok(btns[0]==='复制标题'&&btns[1]==='复制正文','按钮文字为 复制标题/复制正文: '+btns.slice(0,2).join(','));
  const tagline=(await page.locator('#out li .b').first().innerText()).split('\n').pop();
  ok(/^#我的秘密主题ABC好物 #我的秘密主题ABC好物分享 #宝妈 #干货分享 #经验分享$/.test(tagline),'话题标签去标点: '+tagline);
  await page.locator('#out li button').nth(0).click(); await wait(300);
  ok((await page.locator('#out li button').nth(0).innerText())==='已复制','复制标题 显示已复制');
  const clip1=await page.evaluate(()=>navigator.clipboard.readText());
  ok(clip1===await page.locator('#out li .t').first().innerText(),'剪贴板=标题');
  await page.locator('#out li button').nth(1).click(); await wait(300);
  await page.click('#shareBtn'); await wait(300);
  const clip2=await page.evaluate(()=>navigator.clipboard.readText());
  ok(clip2===BASE+'?ref=share','分享(无 navigator.share)→复制带 ref=share 的链接: '+clip2);
  ok((await page.locator('#toast').innerText()).includes('链接已复制'),'分享提示');
  ok(await page.inputValue('#f_source')==='xhs','表单 source=xhs');
  ok(await page.inputValue('#f_next')===BASE+'?subscribed=1','表单 _next 跳回本站');
  await wait(800);
  const E=evs(hits); const names=E.map(e=>e.p);
  console.log('  上报:',JSON.stringify(names));
  for(const n of ['/xhs-title/','src-xhs','ref-share','env-other','generate','copy-title','copy-body','share-click','share-copylink']) ok(names.includes(n),'上报 '+n);
  ok(E.find(e=>e.p==='/xhs-title/').e===null,'浏览量不是事件且路径不含参数');
  ok(E.filter(e=>e.p!=='/xhs-title/').every(e=>e.e==='true'),'事件带 e=true');
  ok(!E.some(e=>e.raw.includes('秘密')||e.raw.includes('ABC')||e.raw.includes('宝妈')),'payload 不含输入主题/人群/生成内容');
  console.log('  示例 payload:',hits.find(h=>h.includes('p=generate')));
  ok(errors.length===0,'无页面报错 '+errors.join(';'));
  await ctx.close();
}
// B. 屏蔽 GoatCounter（脚本+上报都失败）
{
  const {ctx,page,errors,hits}=await setup({blockGC:true});
  await page.goto(BASE+'?src=x'); await page.waitForLoadState('load');
  await page.fill('#topic','减脂早餐'); await page.click('#genBtn');
  ok(await page.locator('#out li').count()===10,'屏蔽统计：仍生成 10 组');
  await page.locator('#out li button').nth(0).click(); await wait(300);
  ok((await page.evaluate(()=>navigator.clipboard.readText())).includes('减脂早餐'),'屏蔽统计：复制正常');
  await page.click('#shareBtn'); await wait(300);
  ok((await page.evaluate(()=>navigator.clipboard.readText())).endsWith('?ref=share'),'屏蔽统计：分享正常');
  ok(errors.length===0,'屏蔽统计：无页面报错 '+errors.join(';'));
  ok(hits.length===0,'屏蔽统计：没有发出上报（脚本没加载）');
  await ctx.close();
}
// B2. 脚本加载成功但上报端点被屏蔽
{
  const {ctx,page,errors}=await setup({init:`window.__blockOnly=1`});
  await ctx.unroute('https://xhstitle.goatcounter.com/**'); await ctx.route('https://xhstitle.goatcounter.com/**',r=>r.abort());
  await page.goto(BASE); await page.click('#genBtn');
  ok(await page.locator('#out li').count()===10,'上报端点被屏蔽：工具正常');
  ok(errors.length===0,'上报端点被屏蔽：无页面报错');
  await ctx.close();
}
// C. 复制失败降级提示
{
  const {ctx,page,hits}=await setup({init:`Object.defineProperty(navigator,'clipboard',{get(){return {writeText:()=>Promise.reject(new Error('denied'))}}});document.execCommand=()=>false;delete Navigator.prototype.share;`});
  await page.goto(BASE); await page.click('#genBtn');
  await page.locator('#out li button').nth(0).click(); await wait(300);
  ok((await page.locator('#out li button').nth(0).innerText())==='复制标题','复制失败不显示"已复制"');
  ok((await page.locator('#toast').innerText()).includes('复制失败'),'复制失败有提示');
  ok((await page.evaluate(()=>String(getSelection())))===await page.locator('#out li .t').first().innerText(),'复制失败时自动选中文字');
  await page.click('#shareBtn'); await wait(300);
  ok((await page.locator('#toast').innerText()).includes('请手动复制链接'),'分享复制失败有提示');
  await wait(500); const n=evs(hits).map(e=>e.p);
  ok(n.includes('copy-fail')&&!n.includes('copy-title')&&n.includes('share-fail'),'失败只报 copy-fail/share-fail');
  await ctx.close();
}
// C2. 只有 execCommand 可用（老 WebView）
{
  const {ctx,page}=await setup({init:`Object.defineProperty(navigator,'clipboard',{get(){return undefined}});window.__copied=null;const o=document.execCommand.bind(document);document.execCommand=(c)=>{if(c==='copy'){window.__copied=document.activeElement&&document.activeElement.value;return true}return o(c)};`});
  await page.goto(BASE); await page.click('#genBtn');
  await page.locator('#out li button').nth(0).click(); await wait(300);
  ok((await page.locator('#out li button').nth(0).innerText())==='已复制' && (await page.evaluate(()=>window.__copied))===await page.locator('#out li .t').first().innerText(),'无 Clipboard API 时降级 execCommand 复制成功');
  await ctx.close();
}
// D. navigator.share 可用
{
  const {ctx,page,hits}=await setup({init:`window.__shared=null;Navigator.prototype.share=function(d){window.__shared=d;return Promise.resolve()};`});
  await page.goto(BASE); await page.click('#shareBtn'); await wait(800);
  const d=await page.evaluate(()=>window.__shared);
  ok(d&&d.url===BASE+'?ref=share','navigator.share 优先，url 带 ref=share');
  const n=evs(hits).map(e=>e.p); ok(n.includes('share-click')&&n.includes('share-native-ok'),'上报 share-native-ok');
  await ctx.close();
}
{
  const {ctx,page,hits}=await setup({init:`Navigator.prototype.share=function(){const e=new Error('x');e.name='AbortError';return Promise.reject(e)};`});
  await page.goto(BASE); await page.click('#shareBtn'); await wait(800);
  ok(evs(hits).map(e=>e.p).includes('share-native-cancel'),'系统分享取消→share-native-cancel，不复制');
  await ctx.close();
}
// E. 回访 + 停留30秒 + 非法 src + 微信 UA
{
  const y=new Date(Date.now()-86400000); const ys=y.getFullYear()+'-'+String(y.getMonth()+1).padStart(2,'0')+'-'+String(y.getDate()).padStart(2,'0');
  const {ctx,page,hits}=await setup({ua:'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 MicroMessenger/8.0.50 NetType/WIFI',
    init:`if(!sessionStorage.getItem('x')){sessionStorage.setItem('x',1);localStorage.setItem('xt_last_visit','${ys}')}`});
  await page.clock.install();
  await page.goto(BASE+'?src=%3Cscript%3E&ref=evil'); await page.waitForLoadState('load');
  await page.clock.runFor(31000); await wait(500);
  const n=evs(hits).map(e=>e.p); console.log('  上报:',JSON.stringify(n));
  ok(n.includes('returning'),'昨天来过→returning');
  ok(n.includes('engaged-30s'),'可见满30秒→engaged-30s');
  ok(n.includes('env-wechat')&&!evs(hits).some(e=>e.raw.includes('MicroMessenger/8')),'微信 UA→env-wechat，不上报 UA 原文');
  ok(!n.some(x=>x&&x.startsWith('src-'))&&!n.includes('ref-share'),'非法 src / ref 不上报');
  const ls=await page.evaluate(()=>JSON.stringify(localStorage));
  ok(/^\{"xt_last_visit":"\d{4}-\d{2}-\d{2}"\}$/.test(ls),'localStorage 只有日期: '+ls);
  await page.reload(); await wait(500);
  ok(evs(hits).filter(e=>e.p==='returning').length===1,'同一天再打开不重复记 returning');
  await ctx.close();
}
// F. 登记成功提示
{
  const {ctx,page}=await setup(); await page.goto(BASE+'?subscribed=1');
  ok(await page.locator('#thanks').isVisible(),'?subscribed=1 显示登记成功');
  ok(!(await page.content()).match(/AI/),'页面文案不含 "AI"');
  await ctx.close();
}
await browser.close();
console.log(fails?`\n${fails} FAILED`:'\nALL PASS'); process.exit(fails?1:0);
