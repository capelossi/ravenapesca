// Checks that the static playable prototype keeps its UI contract intact.
// This is NOT a browser integration test; verify actual rendering on PC/mobile separately.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const dir=dirname(fileURLToPath(import.meta.url));
const html=readFileSync(join(dir,"index.html"),"utf8");
const css=readFileSync(join(dir,"style.css"),"utf8");
const game=readFileSync(join(dir,"game.js"),"utf8");

execFileSync(process.execPath,["--check",join(dir,"game.js")],{stdio:"inherit"});

const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match=>match[1]));
const referenced=[...game.matchAll(/\$\("([^"]+)"\)/g)].map(match=>match[1]);
for(const id of referenced)assert.ok(ids.has(id),'Missing HTML element with id="'+id+'"');

const actions=["attack","heal","inventory","forge","fish"];
for(const action of actions)
  assert.ok(html.includes('data-action="'+action+'"'),"Missing action button: "+action);

for(const id of ["inventory-panel","inventory-items","button-inventory","inventory-close","world","creation","hud"])
  assert.ok(ids.has(id),"Essential UI element missing: "+id);

for(const archetype of ["mago","espadachim","forjador"])
  assert.ok(html.includes('data-class="'+archetype+'"'),"Archetype missing: "+archetype);

for(const phrase of ["function animateActor(","function fishAction(","function forgeAction(",
 "function renderBag(","function special(","function route(","function makeActor("])
  assert.ok(game.includes(phrase),"Gameplay mechanism missing: "+phrase);

assert.ok(game.includes('m.npcRing.alpha=.25'),"NPC rings must use their own material");
assert.ok(!game.includes("light.material.alpha=.22"),"Do not change shared gold material opacity");
assert.ok(css.includes(".inventory-panel"),"Inventory styling missing");
assert.ok(html.includes("babylon.js"),"Babylon.js dependency missing");

console.log("Ravena Online: static checks passed.");
