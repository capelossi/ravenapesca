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
const graphics=readFileSync(join(dir,"graphics.js"),"utf8");
const combatSource=readFileSync(join(dir,"combat-rules.js"),"utf8");
const enemiesSource=readFileSync(join(dir,"enemies.js"),"utf8");

for(const source of ["game.js","world-data.js","ui-chronicles.js","navigation.js",
  "graphics.js","combat-rules.js","enemies.js"]){
  execFileSync(process.execPath,["--check",join(dir,source)],{stdio:"inherit"});
}
const scope={};
runInNewContext(worldSource,{globalThis:scope});
const world=scope.RavenaWorldData;
assert.ok(world,"World registry must be loaded");
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
assert.ok(html.includes("babylon.js"),"Babylon.js dependency missing");

assert.ok(html.includes('<script src="world-data.js"></script>'),"World manifest must load first");
assert.ok(html.indexOf('src="world-data.js"')<html.indexOf('src="game.js"'),
  "World manifest must load before the game");
assert.ok(html.includes('<script src="ui-chronicles.js"></script>'),"Journal module missing");
assert.ok(html.includes('<script src="navigation.js"></script>'),"Navigation module missing");
for(const src of ["graphics.js","combat-rules.js","enemies.js"]){
  assert.ok(html.includes('<script src="'+src+'"></script>'),"Missing module "+src);
  assert.ok(html.indexOf('src="'+src+'"')<html.indexOf('src="game.js"'),
    "Modules must load before game: "+src);
}
assert.ok(html.indexOf('src="navigation.js"')<html.indexOf('src="game.js"'),
  "Navigation must load before game");
assert.ok(game.includes("RavenaNavigation.findPath"),"Game must use modular pathfinding");
assert.ok(game.includes("RavenaEnemies.create"),"Game must instantiate enemy runtime");
assert.ok(game.includes("RavenaVisuals.create"),"Game must initialize graphics settings");
assert.ok(game.includes("enemies.tick(dt"),"Enemy AI must run in gameplay loop");
assert.ok(css.includes(".chronicle-panel"),"Journal styles missing");
assert.ok(game.includes("for(const npc of world.npcs)"),"NPCs must be data-driven");
assert.ok(game.includes("if(npc.id)advanceStory"),"Narrative must depend on NPC ids");
assert.ok(!game.includes("n.name===npc.name"),"Narrative must not depend on translated display names");
assert.ok(game.includes("world.settlements"),"Village buildings must be data-driven");
assert.ok(game.includes('advanceStory("enter:"+region.id)'),"Zone events must drive story");
assert.ok(game.includes('advanceStory("fish:any")'),"Fishing must have narrative event");
assert.ok(game.includes('advanceStory("mine:any")'),"Mining must have narrative event");
assert.ok(game.includes('advanceStory("craft:dagger")'),"Crafting must have narrative event");

const unique=(values)=>new Set(values).size===values.length;
assert.ok(unique(world.regions.map(x=>x.id)),"Region IDs must be unique");
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
