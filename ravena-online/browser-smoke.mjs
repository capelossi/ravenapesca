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
    const debugUrl=URL+(URL.includes("?")?"&":"?")+"debug=1";
    await page.goto(debugUrl,{waitUntil:"domcontentloaded",timeout:40000});
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
    // Macro atlas: cities, POI states and on-foot movement, not teleportation.
    await page.locator("#button-map").click();
    await page.locator("#world-map-panel:not(.hidden)").waitFor({state:"visible"});
    assert.equal(await page.locator(".atlas-poi-button").count(),17);
    // Capital refinement: three built landmarks and the relocated fair.
    for(const [id,title] of [
      ["guilda-aventureiros","Guilda dos Aventureiros"],
      ["estalagem-corvo","Estalagem Corvo Dourado"],
      ["palacio-conselho","Palácio do Conselho"],
      ["mercado-azarath","Mercado de Azarath"]
    ]){
      await page.locator('[data-place="'+id+'"]').click();
      assert.equal(await page.locator("#atlas-place-name").innerText(),title);
      assert.equal(await page.locator("#atlas-navigate").isEnabled(),true,
        "Capital landmark should have an on-foot approach: "+id);
    }
    await page.locator('[data-place="praca-redes"]').click();
    assert.equal(await page.locator("#atlas-place-name").innerText(),"Praça das Redes");
    await page.locator('[data-place="pousada-vila"]').click();
    assert.equal(await page.locator("#atlas-navigate").isDisabled(),true,
      "Unbuilt destinations should not be navigable");
    // The player must ACTUALLY travel to the guild entrance, not teleport.
    await page.locator('[data-place="guilda-aventureiros"]').click();
    await page.locator("#atlas-navigate").click();
    await page.waitForFunction(()=>{
      const p=window.RavenaAlphaDebug?.snapshot();
      return p && Math.hypot(p.x+15,p.z+9.5)<1.8;
    },null,{timeout:17000});
    const position=await page.evaluate(()=>window.RavenaAlphaDebug?.snapshot());
    assert.equal(position.blockedAtHero,false,
      profile.name+": actor is inside an obstacle after walking to the guild");
    await page.locator("#button-map").click();
    await page.locator("#world-map-panel:not(.hidden)").waitFor({state:"visible"});
    await page.locator('[data-place="praca-redes"]').click();
    await page.locator("#atlas-navigate").click();
    await page.locator("#world-map-panel.hidden").waitFor({state:"hidden",timeout:10000});
    assert.match(await page.locator("#toast").innerText(),/Caminhando até.*Praça das Redes/);
    await page.locator("#button-map").click();
    await page.locator("#world-map-panel:not(.hidden)").waitFor({state:"visible"});
    await page.locator("#world-map-close").click();
    await page.locator('[data-action="attack"]').click();
    const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem("ravena-online-alpha1")||"null"));
    assert.equal(saved?.config?.name,"Testador");
    assert.ok(saved?.level>=1);
    assert.equal(errors.length,0,profile.name+": browser errors: "+errors.join(" | "));
    console.log("PASS "+profile.name+" startup, capital movement, atlas routes, HUD, quality, inventory, journal, attack and save");
    total++;
    await context.close();
  }
  console.log("Ravena Online browser smoke passed: "+total+" viewports.");
}finally{
  await browser.close();
}
