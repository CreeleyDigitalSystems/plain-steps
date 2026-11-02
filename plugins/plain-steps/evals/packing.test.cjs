const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const root = path.resolve(__dirname, '..');
const qaDir = path.resolve(process.env.PLAIN_STEPS_QA_DIR || path.join(process.cwd(), 'work', 'plain-steps-qa'));
fs.mkdirSync(qaDir, { recursive: true });
const url = pathToFileURL(path.join(root, 'examples/packing/index.html')).href;
const KEY = 'plain-steps.packing.v1';
(async () => {
 const browser = await chromium.launch({headless:true, ...(process.env.CHROME_EXECUTABLE ? { executablePath: process.env.CHROME_EXECUTABLE } : {})});
 const results = [], errors = [], outbound = [];
 async function check(name, fn) { await fn(); results.push({name,passed:true}); }
 async function fresh(init) {
   const ctx = await browser.newContext({viewport:{width:1100,height:850}});
   const page = await ctx.newPage();
   page.on('pageerror', e => errors.push(String(e)));
   page.on('request', r => { if (!r.url().startsWith('file:')) outbound.push(r.url()); });
   if (init) await page.addInitScript(init, KEY);
   await page.goto(url);
   return {ctx,page};
 }
 async function add(page, text) {
   const button = page.getByRole('button', {name:'Add an item',exact:true});
   await button.click();
   await page.getByLabel('Item to pack').fill(text);
   await page.getByRole('button',{name:'Add item',exact:true}).click();
 }
 let {ctx,page} = await fresh();
 await check('home keyboard entry, exact two primary actions and clear input label', async () => {
   assert.equal(await page.locator('.home-actions button').count(),2);
   assert.deepEqual(await page.locator('.home-actions button').allTextContents(),['Add an item','Continue packing']);
   await page.keyboard.press('Tab');
   assert.equal(await page.locator(':focus').textContent(),'Skip to packing');
   await page.keyboard.press('Tab');
   assert.equal(await page.locator(':focus').textContent(),'Add an item');
   await page.keyboard.press('Enter');
   assert.equal(await page.locator(':focus').getAttribute('id'),'item-name');
 });
 await check('empty and long errors retain text, announce and focus input; Back retains draft', async () => {
   await page.getByRole('button',{name:'Add item',exact:true}).click();
   assert.equal(await page.locator('#item-error').isVisible(),true);
   assert.equal(await page.locator(':focus').getAttribute('id'),'item-name');
   await page.getByLabel('Item to pack').fill('x'.repeat(101));
   await page.getByRole('button',{name:'Add item',exact:true}).click();
   assert.match(await page.locator('#item-error').textContent(),/100 characters/);
   assert.equal(await page.getByLabel('Item to pack').inputValue(),'x'.repeat(101));
   await page.getByRole('button',{name:'Back to start',exact:true}).click();
   await page.getByRole('button',{name:'Add an item',exact:true}).click();
   assert.equal(await page.getByLabel('Item to pack').inputValue(),'x'.repeat(101));
   await page.getByLabel('Item to pack').fill('Toothbrush');
   await page.getByRole('button',{name:'Add item',exact:true}).click();
   assert.equal(await page.getByRole('checkbox',{name:'Toothbrush',exact:true}).count(),1);
 });
 await check('keyboard toggle, visible count and undo restore previous value/focus',async () => {
   const cb=page.getByRole('checkbox',{name:'Toothbrush',exact:true});
   await cb.focus(); await page.keyboard.press('Space'); assert.equal(await cb.isChecked(),true);
   assert.match(await page.locator('#packing-count').textContent(),/1 of 1/);
   await page.getByRole('button',{name:'Undo last toggle',exact:true}).click();
   assert.equal(await cb.isChecked(),false);
   assert.equal(await page.locator(':focus').getAttribute('id'),'item-1');
   assert.equal(await page.getByRole('button',{name:'Undo last toggle',exact:true}).isDisabled(),true);
 });
 await check('user text renders safely, without injected elements or network',async () => {
   await add(page,'<img src=x onerror=alert(1)>');
   assert.equal(await page.locator('img').count(),0);
   assert.equal(await page.getByRole('checkbox',{name:'<img src=x onerror=alert(1)>',exact:true}).count(),1);
 });
 await check('reload resumes saved items and persisted last-toggle undo',async () => {
   await page.getByRole('checkbox',{name:'Toothbrush',exact:true}).check();
   await page.reload();
   assert.match(await page.locator('#home-count').textContent(),/1 of 2/);
   await page.getByRole('button',{name:'Continue packing',exact:true}).click();
   assert.equal(await page.getByRole('checkbox',{name:'Toothbrush',exact:true}).isChecked(),true);
   await page.getByRole('button',{name:'Undo last toggle',exact:true}).click();
   assert.equal(await page.getByRole('checkbox',{name:'Toothbrush',exact:true}).isChecked(),false);
 });
 await check('compact preference works by keyboard and survives reload',async () => {
   await page.getByRole('button',{name:'Back to start',exact:true}).click();
   await page.getByRole('button',{name:'Display settings',exact:true}).click();
   await page.getByRole('radio',{name:'Roomy list',exact:true}).focus();
   await page.keyboard.press('ArrowDown');
   assert.equal(await page.getByRole('radio',{name:'Compact list',exact:true}).isChecked(),true);
   await page.reload();
   assert.equal(await page.locator('body').getAttribute('data-density'),'compact');
   await page.screenshot({path:path.join(qaDir, 'packing-home.png'),fullPage:true});
 });
 await check('320px reflow, compact targets and enlarged text remain usable',async () => {
   await page.getByRole('button',{name:'Continue packing',exact:true}).click();
   await add(page,'Long item '+ 'a'.repeat(90));
   await page.setViewportSize({width:320,height:700});
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   for (const label of await page.locator('.item label').all()) assert.ok((await label.boundingBox()).height>=44);
   for (const b of await page.getByRole('button').all()) assert.ok((await b.boundingBox()).height>=44);
   await page.screenshot({path:path.join(qaDir, 'packing-320.png'),fullPage:true});
   await page.evaluate(()=>document.documentElement.style.fontSize='36px');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   await page.screenshot({path:path.join(qaDir, 'packing-320-text200.png'),fullPage:true});
 });
 fs.writeFileSync(path.join(qaDir, 'packing-accessibility.txt'),await page.locator('main').ariaSnapshot());
 await ctx.close();
 await check('corrupt JSON is untouched while new session-only changes remain usable',async () => {
   ({ctx,page}=await fresh(key=>localStorage.setItem(key,'{corrupt-original')));
   assert.match(await page.locator('#save-status').textContent(),/could not be read/);
   await add(page,'Socks');
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),'{corrupt-original');
   assert.equal(await page.getByRole('checkbox',{name:'Socks',exact:true}).count(),1);
   assert.doesNotMatch(await page.locator('#save-status').textContent(),/^Saved on/);
   await ctx.close();
 });
 await check('invalid stored schema is untouched rather than reset',async () => {
   ({ctx,page}=await fresh(key=>localStorage.setItem(key,JSON.stringify({version:1,nights:3,items:[{id:'item-1',name:'Socks',packed:'yes'}],density:'roomy',undo:null}))));
   const before=await page.evaluate(key=>localStorage.getItem(key),KEY);
   await add(page,'Toothbrush');
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),before);
   assert.match(await page.locator('#save-status').textContent(),/could not be read/);
   await ctx.close();
 });
 await check('write failure is truthful and recoverable with successful retry/reload',async () => {
   ({ctx,page}=await fresh(()=>{
     const original=Storage.prototype.setItem;
     window.restoreWrites=()=>Storage.prototype.setItem=original;
     Storage.prototype.setItem=function(){throw new DOMException('Quota exceeded','QuotaExceededError');};
   }));
   await add(page,'Charger');
   assert.match(await page.locator('#save-status').textContent(),/Not saved/);
   await page.evaluate(()=>window.restoreWrites());
   await page.getByRole('button',{name:'Try saving again',exact:true}).click();
   assert.match(await page.locator('#save-status').textContent(),/^Saved on/);
   assert.equal(await page.locator(':focus').getAttribute('id'),'save-status');
   // Remove the init script by opening a new page in the same context after a real save.
   const next=await ctx.newPage(); await next.goto(url);
   assert.match(await next.locator('#home-count').textContent(),/0 of 1/);
   await ctx.close();
 });
 await check('read denial preserves prior storage and never pretends a save succeeded',async () => {
   ({ctx,page}=await fresh(key=>{
     localStorage.setItem(key,'prior-copy');
     const original=Storage.prototype.getItem;
     window.readOriginal=()=>original.call(localStorage,key);
     Storage.prototype.getItem=function(){throw new DOMException('Denied','SecurityError');};
   }));
   await add(page,'Socks');
   assert.equal(await page.evaluate(()=>window.readOriginal()),'prior-copy');
   assert.match(await page.locator('#save-status').textContent(),/unavailable/);
   await ctx.close();
 });
 await check('detected concurrent change is never overwritten',async () => {
   ({ctx,page}=await fresh());
   await page.evaluate(key=>localStorage.setItem(key,'other-page-copy'),KEY);
   await add(page,'Socks');
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),KEY),'other-page-copy');
   assert.match(await page.locator('#save-status').textContent(),/changed in another page/);
   await ctx.close();
 });
 assert.deepEqual(outbound,[]);
 assert.deepEqual(errors,[]);
 fs.writeFileSync(path.join(qaDir, 'packing-results.json'),JSON.stringify({date:new Date().toISOString(),browser:await browser.version(),delivery:'file URL, installed Google Chrome driven by Playwright, no server',results,uncaughtErrors:errors,outboundRequests:outbound,limitations:['Chromium only; physical devices, Safari, Firefox and real screen readers untested.','Keyboard plus DOM accessibility inspection is not a screen-reader session or usability study.','localStorage file URL behaviour varies by browser and location; saves are not a backup.','Conflict detection is best effort; no atomic multi-tab transaction is promised.']},null,2)+'\n');
 await browser.close();
 console.log(`${results.length} packing browser checks passed; no outbound requests or uncaught errors.`);
})().catch(e=>{ console.error(e); process.exitCode=1; });
