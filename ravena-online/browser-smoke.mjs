// Smoke test real Chromium; complementary to check.mjs's static Node checks.
// Run with: npm install --no-save playwright && node ravena-online/browser-smoke.mjs
import assert from "node:assert/strict";
import {chromium} from "playwright";

const URL=process.env.RAVENA_TEST_URL||"http://127.0.0.1:8000/ravena-online/";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const profiles=[
  {name:"desktop",width:1280,height:800,isMobile:false,hasTouch:false},
  {name:"mobile",width:393,height:852,isMobile:true,hasTouch:true}
];
let total=0;
try{
  for(const profile of profiles){
    const context=await browser.newContext({
      viewport:{width:profile.width,height:profile.height},
      isMobile:profile.isMobile,hasTouch:profile.hasTouch
    });
    const page=await context.newPage(),errors=[];
    page.on("pageerror",error=>errors.push(error.message));
    page.on("console",message=>{if(message.type()==="error")errors.push("Console: "+message.text());});
    await page.goto(URL,{waitUntil:"domcontentloaded",timeout:40000});
    await page.waitForFunction(()=>Boolean(window.BABYLON),{timeout:20000});
    await page.locator("#name").fill("Testador");
    await page.locator("#start").click();
    await page.locator("#hud:not(.hidden)").waitFor({state:"visible",timeout:30000});
    await page.waitForTimeout(1700);
    assert.match(await page.locator("#player-name").innerText(),/Testador/);
    const world=page.locator("#world");
    assert.ok(await world.isVisible(),"3D world should be visible");
    await page.locator("#button-settings").click();
    await page.locator("#settings-panel:not(.hidden)").waitFor({state:"visible"});
    await page.locator('[data-quality="leve"]').click();
    assert.equal(await page.locator('[data-quality="leve"]').getAttribute("aria-pressed"),"true");
    await page.locator("#settings-close").click();
    await page.locator("#button-inventory").click();
    await page.locator("#inventory-panel:not(.hidden)").waitFor({state:"visible"});
    await page.locator("#inventory-close").click();
    await page.locator("#button-journal").click();
    await page.locator("#chronicle-panel:not(.hidden)").waitFor({state:"visible"});
    assert.match(await page.locator("#chronicle-content").innerText(),/Luz Sobre o Lago|A Luz Sobre o Lago/);
    await page.locator("#chronicle-close").click();
    await page.locator('[data-action="attack"]').click();
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("ravena-online-alpha1")||"null"));
    assert.equal(saved?.config?.name,"Testador");
    assert.ok(saved?.level>=1);
    assert.equal(errors.length,0,profile.name+": browser errors: "+errors.join(" | "));
    console.log("PASS "+profile.name+" startup, HUD, quality, inventory, journal, attack and save");
    total++;
    await context.close();
  }
  console.log("Ravena Online browser smoke passed: "+total+" viewports.");
}finally{
  await browser.close();
}
