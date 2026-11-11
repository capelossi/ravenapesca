// Fluxo real em Chromium: mundo → portal → altar → oferenda → save → retorno.
// Opera somente em modo pré-alfa com ?debug=1; não usa teleporte no runtime.
import assert from "node:assert/strict";
import {chromium} from "playwright";
import {resolve} from "node:path";

const BASE=process.env.RAVENA_TEST_URL||"http://127.0.0.1:8000/ravena-online/";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const VIEWPORTS=[
 {name:"desktop",width:1280,height:800,isMobile:false,hasTouch:false},
 {name:"mobile",width:393,height:852,isMobile:true,hasTouch:true}
];
const pause=100;
try {
 for(const profile of VIEWPORTS){
  const context=await browser.newContext({
    viewport:{width:profile.width,height:profile.height},
    isMobile:profile.isMobile,hasTouch:profile.hasTouch
  });
  const page=await context.newPage();
  const errors=[];
  page.on("pageerror",error=>errors.push("Uncaught: "+error.message));
  page.on("console",msg=>{if(msg.type()==="error")errors.push(msg.text());});
  await page.route("https://cdn.babylonjs.com/babylon.js",route=>route.fulfill({
    path:resolve("node_modules/babylonjs/babylon.js"),contentType:"application/javascript"
  }));
  const url=BASE+(BASE.includes("?")?"&":"?")+"debug=1";
  await page.goto(url,{waitUntil:"domcontentloaded",timeout:40000});
  await page.waitForFunction(()=>!!window.BABYLON,{timeout:20000});
  // Create a legitimate local checkpoint just outside the restored forest portal.
  // The game still validates collision and movement through its normal pathfinder.
  await page.evaluate(()=>{
    localStorage.setItem("ravena-online-alpha1",JSON.stringify({
      config:{name:"Templario",kind:"mago",skin:0,hair:0,
        bodyType:"feminino",hairStyle:"longo"},
      x:-35,z:-19,level:1,xp:0,quest:0,storySchema:1,
      bag:{lambari:2,tilapia:1},totalFish:2,totalOre:0,
      coins:0,blessing:{type:null,expiresAt:0},sanctuaryInside:false,
      sanctuaryReturn:{x:-35,z:-19}
    }));
  });
  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#start").click();
  await page.locator("#hud:not(.hidden)").waitFor({state:"visible",timeout:30000});
  await page.waitForTimeout(900);
  const spawn=await page.evaluate(()=>window.RavenaAlphaDebug?.snapshot());
  assert.ok(spawn && spawn.sanctuaryInside===false);
  assert.ok(Math.hypot(spawn.x+35,spawn.z+19)<3,
    profile.name+": legacy checkpoint outside forest rejected: "+JSON.stringify(spawn));
  const walking=await page.evaluate(()=>window.RavenaAlphaDebug?.walkTo(-35,-22));
  assert.equal(walking,true,profile.name+": cannot navigate to forest portal");
  await page.waitForFunction(()=>
    document.querySelector("#interaction")?.textContent?.includes("Entrar no Templo")
      && !document.querySelector("#interaction").classList.contains("hidden"),
    null,{timeout:12000});
  await page.locator("#interaction").click();
  await page.waitForFunction(()=>window.RavenaAlphaDebug?.snapshot().sanctuaryInside===true,
    null,{timeout:5000});
  assert.match(await page.locator("#zone").innerText(),/Templo do Crepúsculo/i);
  assert.equal(await page.locator("#hud .minimap").isVisible(),false);
  // Both artworks are copied from the original ZIP as light WebP versions.
  await page.waitForFunction(()=>{
    const x=window.RavenaAlphaDebug?.artLoaded();
    return x?.mae && x?.ravena;
  },null,{timeout:18000});
  let visibleArt=await page.evaluate(()=>window.RavenaAlphaDebug.artLoaded());
  assert.equal(visibleArt.mae,true);
  assert.equal(visibleArt.ravena,true);
  const altarRoute=await page.evaluate(()=>window.RavenaAlphaDebug?.walkTo(0,-142));
  assert.equal(altarRoute,true,profile.name+": temple navigation to altar unavailable");
  await page.waitForFunction(()=>
    document.querySelector("#interaction")?.textContent?.includes("oferenda à Ravena") &&
      !document.querySelector("#interaction").classList.contains("hidden"),
    null,{timeout:12000});
  await page.locator("#interaction").click();
  await page.locator("#ravena-altar-panel:not(.hidden)").waitFor({state:"visible"});
  assert.equal(await page.locator("[data-ravena-blessing]").count(),4);
  await page.locator('[data-ravena-blessing="sabedoria"]').click();
  await page.locator("#ravena-fish-select").selectOption("lambari");
  await page.locator("#ravena-offer").click();
  await page.locator("#ravena-confirmation:not(.hidden)").waitFor({state:"visible"});
  await page.locator("#ravena-confirm-yes").click();
  await page.locator("#ravena-altar-panel.hidden").waitFor({state:"hidden"});
  const state=await page.evaluate(()=>JSON.parse(localStorage.getItem("ravena-online-alpha1")));
  assert.equal(state.blessing.type,"sabedoria");
  assert.ok(state.blessing.expiresAt-Date.now()>580000,
    "Blessing should last close to ten minutes");
  assert.equal(state.bag.lambari,1,"Offering must consume exactly one fish");
  assert.equal(state.sanctuaryInside,true,"Temple status must persist in the save");
  assert.equal(await page.locator("#ravena-blessing-hud").isVisible(),true);
  // Recover a saved character while still inside the sanctuary.
  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#start").click();
  await page.waitForFunction(()=>window.RavenaAlphaDebug?.snapshot().sanctuaryInside===true,
    null,{timeout:18000});
  const resume=await page.evaluate(()=>window.RavenaAlphaDebug.snapshot());
  assert.equal(resume.blessingType,"sabedoria");
  assert.equal(resume.bag.lambari,1,"Reload must not consume another offering");
  // The exit is adjacent to the temple's restore spawn, no teleport button.
  await page.waitForFunction(()=>document.querySelector("#interaction")?.textContent
    ?.includes("Voltar a Azarath"),null,{timeout:8000});
  await page.locator("#interaction").click();
  await page.waitForFunction(()=>window.RavenaAlphaDebug?.snapshot().sanctuaryInside===false,
    null,{timeout:8000});
  const returning=await page.evaluate(()=>window.RavenaAlphaDebug.snapshot());
  assert.ok(Math.hypot(returning.x+35,returning.z+19)<7,
    profile.name+": exit must restore forest portal position");
  assert.equal(returning.blessingType,"sabedoria",
    "Blessing must remain active after leaving the temple");
  // Test the other critical effect (Fortuna) in the NPC market with a
  // checkpoint loaded near Mercadora Naila. Other blessings are unit-tested.
  await page.evaluate(()=>{
    const save=JSON.parse(localStorage.getItem("ravena-online-alpha1"));
    save.x=30;save.z=-30;save.sanctuaryInside=false;
    save.blessing={type:"fortuna",expiresAt:Date.now()+600000};
    localStorage.setItem("ravena-online-alpha1",JSON.stringify(save));
  });
  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#start").click();
  try{
    await page.waitForFunction(()=>document.querySelector("#interaction")?.textContent
      ?.includes("Mercado do Sal"),null,{timeout:13000});
  }catch(error){
    const details=await page.evaluate(()=>({
      snapshot:window.RavenaAlphaDebug?.snapshot(),
      label:document.querySelector("#interaction")?.textContent,
      className:document.querySelector("#interaction")?.className,
      zone:document.querySelector("#zone")?.textContent,
      saved:JSON.parse(localStorage.getItem("ravena-online-alpha1")||"null")
    }));
    throw Error("Mercadora Naila not reachable: "+JSON.stringify(details)+" | "+error.message);
  }
  await page.locator("#interaction").click();
  await page.locator("#ravena-fish-market-panel:not(.hidden)").waitFor({state:"visible"});
  assert.match(await page.locator("#ravena-coin-balance").innerText(),/0 moedas/);
  await page.locator(".ravena-market-row").filter({hasText:"Lambari"})
    .getByRole("button",{name:"Vender 1"}).click();
  const trade=await page.evaluate(()=>JSON.parse(localStorage.getItem("ravena-online-alpha1")));
  assert.equal(trade.coins,18,"Fortuna must increase 16 coins by 15% rounded");
  assert.equal(trade.bag.lambari,0,"Selling must remove exactly one fish");
  await page.reload({waitUntil:"domcontentloaded"});
  await page.locator("#start").click();
  const marketSave=await page.evaluate(()=>JSON.parse(localStorage.getItem("ravena-online-alpha1")));
  assert.equal(marketSave.coins,18,"Market coins must persist");
  assert.equal(errors.length,0,profile.name+": "+errors.join(" | "));
  console.log("PASS "+profile.name+
    " original art, portal, temple, altar, ten-minute save, exit and Fortuna market");
  await context.close();
 }
 console.log("Ravena legacy browser smoke: all viewports passed.");
}finally {
 await browser.close();
}
