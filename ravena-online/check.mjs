// Checks that the static playable prototype keeps its UI contract intact.
// This is NOT a browser integration test; verify actual rendering on PC/mobile separately.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { runInNewContext } from "node:vm";

const dir=dirname(fileURLToPath(import.meta.url));
const html=readFileSync(join(dir,"index.html"),"utf8");
const css=readFileSync(join(dir,"style.css"),"utf8");
const game=readFileSync(join(dir,"game.js"),"utf8");
const worldSource=readFileSync(join(dir,"world-data.js"),"utf8");
const chronicles=readFileSync(join(dir,"ui-chronicles.js"),"utf8");
const navigation=readFileSync(join(dir,"navigation.js"),"utf8");
const layoutSource=readFileSync(join(dir,"world-layout.js"),"utf8");
const atlasSource=readFileSync(join(dir,"ui-world-map.js"),"utf8");
const capitalLayoutSource=readFileSync(join(dir,"capital-layout.js"),"utf8");
const capitalSceneSource=readFileSync(join(dir,"capital-scene.js"),"utf8");
const villageLayoutSource=readFileSync(join(dir,"village-layout.js"),"utf8");
const villageSceneSource=readFileSync(join(dir,"village-scene.js"),"utf8");
const graphics=readFileSync(join(dir,"graphics.js"),"utf8");
const combatSource=readFileSync(join(dir,"combat-rules.js"),"utf8");
const enemiesSource=readFileSync(join(dir,"enemies.js"),"utf8");
const legacyRules=readFileSync(join(dir,"legacy-ravena-rules.js"),"utf8");
const legacyWorld=readFileSync(join(dir,"legacy-ravena-world.js"),"utf8");
const legacyUI=readFileSync(join(dir,"legacy-ravena-ui.js"),"utf8");

for(const source of ["game.js","world-data.js","ui-chronicles.js","navigation.js",
  "graphics.js","combat-rules.js","enemies.js","world-layout.js","ui-world-map.js",
  "capital-layout.js","capital-scene.js","village-layout.js","village-scene.js",
  "legacy-ravena-rules.js","legacy-ravena-world.js","legacy-ravena-ui.js"]){
  execFileSync(process.execPath,["--check",join(dir,source)],{stdio:"inherit"});
}
// Unit tests for server-authoritative movement and proximity snapshots.
execFileSync(process.execPath,["--test",join(dir,"server","zone-engine.test.mjs")],{stdio:"inherit"});
const scope={};
runInNewContext(worldSource,{globalThis:scope});
const world=scope.RavenaWorldData;
assert.ok(world,"World registry must be loaded");
runInNewContext(layoutSource,{globalThis:scope});
const layout=scope.RavenaMapLayout;
assert.ok(layout && layout.version===1,"Versioned macro map missing");
runInNewContext(capitalLayoutSource,{globalThis:scope});
runInNewContext(capitalSceneSource,{globalThis:scope});
const capital=scope.RavenaCapitalLayout;
assert.ok(capital?.id==="capital-azarath" && capital.version===1,
  "Capital layout must have a stable id and version");
assert.ok(scope.RavenaCapitalScene?.create,"Capital scene renderer is missing");
runInNewContext(villageLayoutSource,{globalThis:scope});
runInNewContext(villageSceneSource,{globalThis:scope});
const village=scope.RavenaVillageLayout;
assert.ok(village?.data?.id==="vila-das-mares" && village.data.version===1,
  "Village layout registry missing or unversioned");
assert.ok(scope.RavenaVillageScene?.create,"Village scenery renderer is missing");
assert.ok(world.settlements["vila-das-mares"].architecture,
  "Village settlement must reference its modular architecture");
runInNewContext(navigation,{globalThis:scope});
const nav=scope.RavenaNavigation;
assert.ok(nav && typeof nav.findPath==="function","Reusable navigation module missing");
runInNewContext(graphics,{globalThis:scope});
runInNewContext(combatSource,{globalThis:scope});
runInNewContext(enemiesSource,{globalThis:scope});
const combat=scope.RavenaCombat;
assert.ok(combat,"Combat rules module missing");
assert.ok(scope.RavenaEnemies?.create,"Enemy runtime module missing");
assert.ok(scope.RavenaVisuals?.create,"Graphics module missing");
runInNewContext(legacyRules,{globalThis:scope});
runInNewContext(legacyWorld,{globalThis:scope});
runInNewContext(legacyUI,{globalThis:scope});
const ravena=scope.RavenaLegacyRules;
assert.ok(ravena && scope.RavenaMonuments?.create && scope.RavenaLegacyUI?.create,
  "Ravena temple, blessings and UI must be modular");
assert.deepEqual(Object.keys(scope.RavenaVisuals.QUALITY),["leve","equilibrado","ultra"]);

const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]));
const referenced=[...game.matchAll(/\$\("([^"]+)"\)/g)].map(match=>match[1]);
for(const id of referenced)assert.ok(ids.has(id),'Missing HTML element with id="'+id+'"');

const actions=["attack","heal","inventory","forge","fish"];
for(const action of actions)
  assert.ok(html.includes('data-action="'+action+'"'),"Missing action button: "+action);

for(const id of ["inventory-panel","inventory-items","button-inventory","inventory-close",
 "chronicle-panel","chronicle-content","chronicle-close","button-journal","quest-chapter",
 "settings-panel","settings-close","button-settings","graphics-fps","graphics-description",
 "combat-target","target-name","target-fill","target-hp",
 "button-map","world-map-panel","world-map-close","atlas-svg-host",
 "atlas-navigate","atlas-place-name","atlas-place-description","atlas-place-list",
 "atlas-place-status","atlas-region-label",
 "ravena-altar-panel","ravena-altar-close","ravena-fish-select",
 "ravena-offer","ravena-confirmation","ravena-confirmation-text",
 "ravena-confirm-yes","ravena-confirm-no","ravena-current",
 "ravena-fish-market-panel","ravena-market-close","ravena-market-items",
 "ravena-coin-balance","ravena-blessing-hud",
 "world","creation","hud"])
  assert.ok(ids.has(id),"Essential UI element missing: "+id);

for(const archetype of ["mago","espadachim","forjador"])
  assert.ok(html.includes('data-class="'+archetype+'"'),"Archetype missing: "+archetype);

for(const phrase of ["function animateActor(","function fishAction(","function forgeAction(",
 "function renderBag(","function special(","function route(","function makeActor("])
  assert.ok(game.includes(phrase),"Gameplay mechanism missing: "+phrase);

assert.ok(game.includes('m.npcRing.alpha=.25'),"NPC rings must use their own material");
assert.ok(!game.includes("light.material.alpha=.22"),"Do not change shared gold material opacity");
assert.ok(css.includes(".inventory-panel"),"Inventory styling missing");
assert.ok(css.includes(".settings-panel"),"Graphics settings styles missing");
assert.ok(css.includes(".combat-target"),"Target HUD styles missing");
assert.ok(css.includes(".world-map-panel"),"Responsive atlas CSS missing");
assert.ok(html.includes("babylon.js"),"Babylon.js dependency missing");

assert.ok(html.includes('<script src="world-data.js"></script>'),"World manifest must load first");
assert.ok(html.indexOf('src="world-data.js"')<html.indexOf('src="game.js"'),
  "World manifest must load before the game");
assert.ok(html.includes('<script src="ui-chronicles.js"></script>'),"Journal module missing");
assert.ok(html.includes('<script src="navigation.js"></script>'),"Navigation module missing");
for(const src of ["graphics.js","combat-rules.js","enemies.js","world-layout.js",
 "ui-world-map.js","capital-layout.js","capital-scene.js",
  "village-layout.js","village-scene.js",
  "legacy-ravena-rules.js","legacy-ravena-world.js","legacy-ravena-ui.js"]){
  assert.ok(html.includes('<script src="'+src+'"></script>'),"Missing module "+src);
  assert.ok(html.indexOf('src="'+src+'"')<html.indexOf('src="game.js"'),
    "Modules must load before game: "+src);
}
assert.ok(html.indexOf('src="navigation.js"')<html.indexOf('src="game.js"'),
  "Navigation must load before game");
assert.ok(game.includes("RavenaNavigation.findPath"),"Game must use modular pathfinding");
assert.ok(game.includes("RavenaEnemies.create"),"Game must instantiate enemy runtime");
assert.ok(game.includes("RavenaVisuals.create"),"Game must initialize graphics settings");
assert.ok(game.includes("RavenaMapUI.create"),"Game must initialize world atlas");
assert.ok(game.includes("RavenaCapitalScene.create"),"Game must initialize Capital scene renderer");
assert.ok(game.includes("RavenaVillageScene.create"),"Game must initialize Village scene renderer");
assert.ok(game.includes("if(village.isLakeBlocked(x,z,pad))"),
  "Water collision must be part of world navigation");
assert.ok(game.includes("village.inPier(x,z,.15)"),
  "Fishing must use the authored pier footprint");
assert.ok(game.includes("for(const building of cityLayout.buildings)"),
  "Capital obstacles must be registered separately from decorative meshes");
assert.ok(game.includes("obstacleBox(building.x,building.z,building.width,building.depth)"),
  "Capital should use rectangular rather than circular building collisions");
assert.ok(game.includes('if(atlas.visible)atlas.update'),"Player marker must follow position");
assert.ok(game.includes('onTrail(x,z'),"Roads must clear vegetation and obstacles");
assert.ok(game.includes('gate pier'),"South city gate must remain traversable");
assert.ok(game.includes("enemies.tick(dt"),"Enemy AI must run in gameplay loop");
assert.ok(css.includes(".chronicle-panel"),"Journal styles missing");
assert.ok(game.includes("for(const npc of world.npcs)"),"NPCs must be data-driven");
assert.ok(game.includes("if(npc.id)advanceStory"),"Narrative must depend on NPC ids");
assert.ok(!game.includes("n.name===npc.name"),"Narrative must not depend on translated display names");
assert.ok(game.includes("RavenaVillageScene.create"),"Village buildings must use data-driven scenery");
assert.ok(game.includes("RavenaMonuments.create"),"Approved monument scene missing");
assert.ok(game.includes("RavenaLegacyUI.create"),"Altar and fish merchant UI missing");
assert.ok(game.includes("monuments.blockedInside"),"Temple must be enclosed by collision");
assert.ok(game.includes("monuments.setInterior"),"Separate temple layer must be activated");
assert.ok(game.includes("ravenaRules.makeOffering"),"Offerings must be checked before consuming fish");
assert.ok(game.includes("ravenaRules.fishingXp"),"Wisdom must affect fishing XP");
assert.ok(game.includes("ravenaRules.fishingRoll"),"Luck must affect fishing chance");
assert.ok(game.includes("ravenaRules.saleValue"),"Fortuna must affect market sale coins");
assert.ok(game.includes("ravenaRules.earnBait"),"Favor das Águas must award bait");
assert.ok(game.includes('advanceStory("enter:"+region.id)'),"Zone events must drive story");
assert.ok(game.includes('advanceStory("fish:any")'),"Fishing must have narrative event");
assert.ok(game.includes('advanceStory("mine:any")'),"Mining must have narrative event");
assert.ok(game.includes('advanceStory("craft:dagger")'),"Crafting must have narrative event");

const unique=(values)=>new Set(values).size===values.length;
assert.ok(unique(world.regions.map(x=>x.id)),"Region IDs must be unique");
assert.ok(unique(layout.regions.map(x=>x.id)),"Atlas region IDs must be unique");
assert.ok(unique(layout.places.map(x=>x.id)),"Atlas POI IDs must be unique");
assert.ok(unique(layout.paths.map(x=>x.id)),"Atlas route IDs must be unique");
assert.equal(layout.regions.length,4,"Map-first foundation has four regions");
assert.equal(layout.places.length,24,"Legacy shrine and temple portal add two POIs");
assert.equal(layout.startId,world.start.region,"Atlas initial region must match the world");
assert.ok(capital.avenues.length>=5,"Capital avenues missing");
assert.ok(capital.buildings.length>=3,"Capital needs guild, inn and council landmarks");
assert.ok(unique(capital.buildings.map(b=>b.id)),"Capital building IDs duplicated");
assert.ok(unique(capital.avenues.map(a=>a.id)),"Capital avenue IDs duplicated");
for(const building of capital.buildings){
  const point=layout.places.find(p=>p.id===building.id);
  assert.ok(point && point.phase==="greybox",
    "Capital landmark must exist in atlas as a greybox: "+building.id);
  assert.ok(Math.hypot(point.x-building.approach.x,point.z-building.approach.z)<.6,
    "Atlas approach and landmark entrance must match: "+building.id);
  assert.ok(building.width>=5&&building.depth>=5&&building.height>=5,
    "Capital buildings need meaningful visual mass: "+building.id);
  assert.ok(Math.hypot(world.start.x-building.x,world.start.z-building.z)>
    Math.max(building.width,building.depth)*.52+2,
    "A building cannot cover the character spawn point");
}
assert.ok(!game.includes("house(-11,-13,1.1)"),
  "Old generic building must not overlap the guild");
assert.ok(!game.includes('for(const building of world.settlements["vila-das-mares"].houses)'),
  "Old generic village houses must be replaced by modular village renderer");
assert.ok(!game.includes('obstacle(55,1,17)'),
  "The old circular water obstacle must not block the pier");
assert.ok(html.indexOf('src="village-layout.js"')<html.indexOf('src="game.js"'),
  "Village layout must load before game");
assert.ok(html.indexOf('src="village-scene.js"')<html.indexOf('src="game.js"'),
  "Village scenery must load before game");
assert.ok(html.indexOf('src="capital-layout.js"')<html.indexOf('src="game.js"'),
  "Capital layout must load before game");
assert.ok(html.indexOf('src="capital-scene.js"')<html.indexOf('src="game.js"'),
  "Capital scene must load before game");
for(const r of layout.regions)
  assert.ok(world.regions.some(z=>z.id===r.id),"Atlas region unknown: "+r.id);
for(const spot of layout.places){
  assert.ok(world.regions.some(r=>r.id===spot.region),"POI belongs to unknown region");
  assert.ok(Number.isFinite(spot.x)&&Number.isFinite(spot.z),"Invalid atlas POI position");
  assert.ok(spot.x>=layout.extent.minX&&spot.x<=layout.extent.maxX,"POI outside east-west bounds");
  assert.ok(spot.z>=layout.extent.minZ&&spot.z<=layout.extent.maxZ,"POI outside north-south bounds");
  assert.ok(["planned","greybox"].includes(spot.phase),"POI build phase not declared");
}
for(const road of layout.paths){
  assert.ok(layout.regions.some(z=>z.id===road.from),"Road starting region missing");
  assert.ok(layout.regions.some(z=>z.id===road.to),"Road destination region missing");
  assert.ok(road.points.length>=2&&road.points.every(p=>
    Array.isArray(p)&&p.length===2&&p.every(Number.isFinite)),
    "Route polyline must be valid: "+road.id);
}
assert.ok(unique(world.npcs.map(x=>x.id)),"NPC IDs must be unique");
assert.ok(unique(world.story.stages.map(x=>x.id)),"Quest IDs must be unique");
assert.ok(Array.isArray(world.enemies)&&world.enemies.length>=3,"Enemy spawns missing");
assert.ok(unique(world.enemies.map(x=>x.id)),"Enemy spawn IDs must be unique");
assert.equal(combat.classDefinition("mago").range,7,"Mage class range changed");
assert.equal(combat.classDefinition("espadachim").basic,23,"Swordsman balance changed");
assert.equal(combat.mobDefinition("wolf").label,"Lobo dos Sussurros");
assert.ok(combat.aggro(3,"wolf")&& !combat.aggro(20,"wolf"),"Enemy detection incorrect");
assert.ok(combat.melee(1.1,"golem")&&!combat.melee(6,"golem"),"Melee distance incorrect");
assert.equal(combat.normalizeHp(-8,50),0);
assert.equal(combat.normalizeHp(250,50),50);
assert.equal(combat.loot("golem",.1).key,"ore");
assert.equal(combat.loot("wolf",.99),null);
for(const e of world.enemies){
  assert.ok(combat.mobDefinition(e.kind),"Enemy has undefined type: "+e.kind);
  assert.ok(Number.isFinite(e.x)&&Number.isFinite(e.z),"Invalid enemy position");
}
const regionById=new Map(world.regions.map(r=>[r.id,r]));
const regionAt=(x,z)=>world.regions.find(r=>r.bounds &&
  x>=r.bounds.minX&&x<=r.bounds.maxX&&z>=r.bounds.minZ&&z<=r.bounds.maxZ)?.id
  ||world.start.region;
assert.equal(regionAt(0,-3),"capital-azarath");
assert.equal(regionAt(35,-12),"vila-das-mares");
assert.equal(regionAt(33,1),"vila-das-mares");
assert.equal(regionAt(48,24),"vila-das-mares");
assert.equal(regionAt(2,49),"montanhas-da-forja");
assert.equal(regionAt(-38,-22),"floresta-dos-sussurros");
for(const region of world.regions){
  for(const neighbor of region.neighbors||[]){
    assert.ok(regionById.has(neighbor),"Missing connected region: "+neighbor);
    assert.ok(regionById.get(neighbor).neighbors.includes(region.id),
      "Connections must be two-way: "+region.id+" / "+neighbor);
  }
}
for(const npc of world.npcs)
  assert.ok(regionById.has(regionAt(npc.x,npc.z)),"NPC outside of known world");
for(const enemy of world.enemies){
  const zone=regionById.get(regionAt(enemy.x,enemy.z));
  assert.equal(zone.kind,"wilderness","Hostile creatures should not spawn inside safe towns");
}
for(const step of world.story.stages){
  const triggers=Array.isArray(step.trigger)?step.trigger:[step.trigger];
  for(const t of triggers){
    if(t.startsWith("talk:"))
      assert.ok(world.npcs.some(n=>n.id===t.slice(5)),"Missing quest NPC "+t);
    if(t.startsWith("enter:"))
      assert.ok(regionById.has(t.slice(6)),"Missing quest region "+t);
  }
}
function simulate(triggers){
  let progress=0;
  for(const trigger of triggers){
    const objective=world.story.stages[progress];
    if(objective&&[objective.trigger].flat().includes(trigger))progress++;
  }
  return progress;
}
const prefix=["talk:capita-elyra","enter:vila-das-mares",
  "talk:prefeita-marina","talk:pescador-orien"];
assert.equal(simulate([...prefix,"fish:any","enter:montanhas-da-forja","mine:any",
  "craft:dagger","talk:capita-elyra"]),world.story.stages.length,
  "Fishing/crafting route should finish Chapter I");
assert.equal(simulate([...prefix,"talk:faroleira-iara","enter:montanhas-da-forja",
  "talk:mestre-ferreiro","talk:mestre-ferreiro","talk:capita-elyra"]),
  world.story.stages.length,"Alternative route should finish without fishing/crafting");
assert.ok(chronicles.includes("story.stages"),"Journal must read chapter data");
assert.ok(atlasSource.includes("onNavigate(selected)"),"Atlas must use on-foot route callback");
const shrine=scope.RavenaMonuments.TEMPLE;
assert.equal(shrine.id,"templo-do-crepusculo");
assert.ok(layout.places.some(p=>p.id==="portal-do-crepusculo" && p.phase==="greybox"),
  "Forest portal must be an active Atlas destination");
assert.ok(layout.places.some(p=>p.id==="mirante-mae-aguas" && p.phase==="greybox"),
  "Mother of Waters monument must be visible from a lake lookout");
assert.ok(layout.places.some(p=>p.id==="santuario-aguas" && p.phase==="planned"),
  "Future separate Water Mother shrine must not be falsely marked built");
const approved=["sorte","sabedoria","fortuna","aguas"];
assert.equal(Object.keys(ravena.BLESSINGS).join(","),approved.join(","));
assert.equal(ravena.DURATION_MS,600000);
const bagBless={lambari:2,tilapia:1};
const offer=ravena.makeOffering(bagBless,"lambari","sorte",1000);
assert.ok(offer.ok);
assert.equal(offer.blessing.type,"sorte");
assert.equal(offer.blessing.expiresAt,601000);
assert.equal(offer.consumes.count,1);
assert.equal(bagBless.lambari,2,"Pure rule must never mutate inventory");
assert.equal(ravena.makeOffering({lambari:0},"lambari","sorte",1000).ok,false);
assert.equal(ravena.active(offer.blessing,3000),"sorte");
assert.equal(ravena.active(offer.blessing,601000),null);
assert.ok(Math.abs(ravena.fishingRoll(.8,offer.blessing,3000)-.835)<1e-10);
assert.equal(ravena.fishingXp(65,{type:"sabedoria",expiresAt:900000},3000),78);
assert.equal(ravena.saleValue(100,{type:"fortuna",expiresAt:900000},3000),115);
assert.equal(ravena.earnBait(10,{type:"aguas",expiresAt:900000},3000),1);
assert.equal(ravena.earnBait(9,{type:"aguas",expiresAt:900000},3000),0);
assert.equal(ravena.earnBait(10,{type:"aguas",expiresAt:1},3000),0);
for(const [file,expectedBytes] of [
  ["mae-das-aguas-v6436.webp.b64",3474],
  ["ravena-estatua-v6431.webp.b64",2526]
]){
  const source=readFileSync(join(dir,"assets","legacy",file),"utf8").trim();
  const decoded=Buffer.from(source,"base64");
  assert.equal(decoded.length,expectedBytes,"Compressed approved artwork missing/corrupted: "+file);
  assert.equal(decoded.subarray(0,4).toString("ascii"),"RIFF","Original art must be WebP");
  assert.equal(decoded.subarray(8,12).toString("ascii"),"WEBP","Original art must be WebP");
}
const temple=scope.RavenaMonuments.TEMPLE;
assert.notEqual(scope.RavenaMonuments.WORLD_MASK,scope.RavenaMonuments.TEMPLE_MASK,
  "Temple must render in a separate camera layer");
const templeBlocked=(x,z)=>{
  const b=temple.bounds;
  return x<=b.minX+.25||x>=b.maxX-.25||
    z<=b.minZ+.25||z>=b.maxZ-.25||Math.hypot(x,z+149)<3.2;
};
for(const p of [temple.spawn,temple.altar,temple.exit])
  assert.ok(!templeBlocked(p.x,p.z),"Temple interaction must be reachable");
const routeTemple=nav.findPath(
  {x:temple.spawn.x,z:temple.spawn.z-temple.center.z},
  {x:temple.altar.x,z:temple.altar.z-temple.center.z},
  (x,z)=>templeBlocked(x,z+temple.center.z),
  {cell:1,maxCell:24,maxIterations:4500}
);
assert.ok(routeTemple.length>0,"Player must reach Ravena altar from temple entrance");
assert.ok(atlasSource.includes('place.phase==="planned"'),"Atlas must visually mark planned POIs");
assert.ok(html.indexOf('src="world-layout.js"')<html.indexOf('src="ui-world-map.js"'),
  "Layout module must load before Atlas UI");
// Route test uses the authored architectural blockers and known legacy
// public fixtures; it does not replace collision tests in Chromium.
const cityBlocks=capital.buildings.map(b=>({
  x:b.x,z:b.z,halfW:b.width/2,halfD:b.depth/2
}));
const cityCircles=[
 {x:-12,z:13,r:3.03},{x:12,z:13,r:2.7},{x:23,z:-8,r:2.25},
 {x:0,z:13,r:1.85},...capital.stalls.map(a=>({x:a.x,z:a.z,r:1.65}))
];
const blockedCity=(x,z,pad=.65)=>
  Math.abs(x)>=88||Math.abs(z)>=88||
  cityBlocks.some(b=>Math.abs(x-b.x)<b.halfW+pad&&Math.abs(z-b.z)<b.halfD+pad)||
  cityCircles.some(b=>Math.hypot(x-b.x,z-b.z)<b.r+pad);
for(const id of ["guilda-aventureiros","estalagem-corvo","palacio-conselho",
  "mercado-azarath","portao-sul"]){
  const poi=layout.places.find(p=>p.id===id);
  assert.ok(poi?.phase==="greybox","Built Capital POI missing: "+id);
  assert.ok(!blockedCity(poi.x,poi.z,.4),"Capital POI is inside an obstruction: "+id);
  const path=nav.findPath(world.start,{x:poi.x,z:poi.z},blockedCity);
  assert.ok(path.length>0,"There must be a walking route from spawn to "+id);
  assert.ok(Math.hypot(path.at(-1).x-poi.x,path.at(-1).z-poi.z)<2.1,
    "Path should end close to selected POI: "+id);
}
// A lagoon is solid water, except for the authored, visible jetty.
assert.equal(village.isLakeBlocked(55,1,.25),true,"Deep water must be blocked");
assert.equal(village.isLakeBlocked(45,1,.25),true,"Water beyond the jetty must remain blocked");
assert.equal(village.isLakeBlocked(40,1,.25),false,"The pier must stay walkable");
assert.equal(village.inPier(33,1,.15),true,"Fishing NPC stands on the walkable pier");
assert.equal(village.inPier(55,1,.15),false,"Open water must not be a fishing position");
assert.equal(village.isLakeBlocked(43,19,.45),false,"Lighthouse approach must be dry");
assert.ok(village.data.buildings.length>=5,"Village must have a civic, residential and harbor layout");
assert.ok(new Set(village.data.buildings.map(b=>b.id)).size===village.data.buildings.length,
  "Coastal building IDs must be unique");
for(const b of village.data.buildings){
  const poi=layout.places.find(p=>p.id===b.id);
  assert.ok(poi?.phase==="greybox","Coastal building must be visible in Atlas: "+b.id);
  assert.ok(Math.hypot(poi.x-b.approach.x,poi.z-b.approach.z)<.6,
    "Coastal Atlas location must match building entrance: "+b.id);
  assert.ok(!village.isLakeBlocked(b.approach.x,b.approach.z,.5),
    "Coastal entrance cannot be underwater: "+b.id);
  assert.ok(Math.abs(b.approach.x-b.x)>=b.width/2+.4||
            Math.abs(b.approach.z-b.z)>=b.depth/2+.4,
    "Coastal entrance must be outside its building: "+b.id);
}
const villageBlocks=village.data.buildings.map(b=>({
  x:b.x,z:b.z,halfW:b.width/2,halfD:b.depth/2
}));
const villageCircles=[
  {x:village.data.lighthouse.x,z:village.data.lighthouse.z,
    r:village.data.lighthouse.radius},
  {x:village.data.market.x,z:village.data.market.z,r:1.65},
  ...village.data.fishStalls.map(x=>({x:x.x,z:x.z,r:1.65}))
];
const blockedVillage=(x,z,pad=.65)=>
  !Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>=88||Math.abs(z)>=88||
  village.isLakeBlocked(x,z,pad)||
  villageBlocks.some(b=>Math.abs(x-b.x)<b.halfW+pad&&Math.abs(z-b.z)<b.halfD+pad)||
  villageCircles.some(b=>Math.hypot(x-b.x,z-b.z)<b.r+pad);
for(const id of ["entrada-vila","praca-redes","mercado-sal","cais-mae-aguas",
  "farol-mares","prefeitura-mares","pousada-vila","armazem-sal","oficina-naval","casas-pescadores"]){
  const p=layout.places.find(item=>item.id===id);
  assert.ok(p?.phase==="greybox","Missing Village POI: "+id);
  assert.ok(!blockedVillage(p.x,p.z,.4),"Village atlas POI blocked: "+id);
  const walkway=nav.findPath({x:35,z:-13},{x:p.x,z:p.z},blockedVillage);
  assert.ok(walkway.length>0,"Village needs footpath from square to "+id);
  assert.ok(Math.hypot(walkway.at(-1).x-p.x,walkway.at(-1).z-p.z)<2.2,
    "Village path ends far from POI: "+id);
}
const clear=nav.findPath({x:0,z:0},{x:14,z:0},()=>false);
assert.ok(clear.length>0,"Path to open terrain must exist");
const isBlocked=(x,z,pad=0)=>Math.hypot(x-6,z)<3+pad;
const detour=nav.findPath({x:0,z:0},{x:14,z:0},isBlocked);
assert.ok(detour.length>1,"Pathfinder must detour around rocks");
let from={x:0,z:0};
for(const to of detour){
  const distance=Math.hypot(to.x-from.x,to.z-from.z);
  for(let n=0;n<=Math.ceil(distance/.2);n++){
    const t=n/Math.max(1,Math.ceil(distance/.2));
    assert.ok(!isBlocked(from.x+(to.x-from.x)*t,from.z+(to.z-from.z)*t,.15),
      "A smoothed path must not cut through rock obstacles");
  }
  from=to;
}
assert.ok(!detour.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.z)),
  "Paths must be finite coordinates");

console.log("Ravena Online: world, combat rules, graphics, enemy spawns, story and UI checks passed.");
