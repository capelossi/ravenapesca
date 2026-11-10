import test from "node:test";
import assert from "node:assert/strict";
import {createZone} from "./zone-engine.mjs";

const world={worldId:"azarath",start:{region:"capital-azarath",x:0,z:-3}};
const alpha="session-alpha-123";
const bravo="session-bravo-123";
const charlie="session-charlie-123";
const delta="session-delta-123";

test("identidade efêmera, classes e capacidade",()=>{
  const zone=createZone({world,maxPlayers:2});
  assert.equal(zone.join({id:alpha,name:"A_ventureiro",kind:"mago"}).ok,true);
  assert.equal(zone.join({id:alpha,name:"Outro",kind:"mago"}).reason,"duplicate-session");
  assert.equal(zone.join({id:bravo,name:"%",kind:"mago"}).reason,"invalid-name");
  assert.equal(zone.join({id:bravo,name:"Boris",kind:"invalida"}).reason,"invalid-class");
  assert.equal(zone.join({id:bravo,name:"Boris",kind:"espadachim"}).ok,true);
  assert.equal(zone.join({id:charlie,name:"Clara",kind:"mago"}).reason,"zone-capacity");
  assert.equal(zone.size,2);
  assert.equal(zone.leave(bravo),true);
  assert.equal(zone.size,1);
});

test("movimento validado por velocidade e destino, nunca teleportado",()=>{
  const zone=createZone({world,speed:6.7});
  zone.join({id:alpha,name:"Atlas",kind:"mago"});
  assert.equal(zone.queueMove(alpha,{x:90,z:10},1000).reason,"invalid-target");
  assert.equal(zone.queueMove(alpha,{x:15,z:-3},1000).ok,true);
  zone.tick(.05);
  const first=zone.state(alpha);
  assert.ok(first.x>0&&first.x<=.34,"deslocamento máximo por tick");
  assert.equal(first.z,-3);
  assert.equal(zone.queueMove(alpha,{x:60,z:1},1010).reason,"rate-limit");
  assert.equal(zone.queueMove(alpha,{x:20,z:-3},1090).ok,true);
  for(let i=0;i<30;i++)zone.tick(.05);
  assert.ok(zone.state(alpha).x<12,"posição não pode saltar ao destino");
  assert.equal(zone.queueMove("session-unknown-123",{x:1,z:1},1200).reason,"unknown-player");
  assert.equal(zone.queueMove(alpha,{x:Infinity,z:1},1200).reason,"invalid-target");
});

test("interesse espacial: snapshots somente de jogadores próximos",()=>{
  const zone=createZone({world,visibility:12,cellSize:6});
  for(const [id,name] of [[alpha,"Atlas"],[bravo,"Boris"],[charlie,"Clara"],[delta,"Dario"]]){
    assert.equal(zone.join({id,name}).ok,true);
  }
  zone.queueMove(delta,{x:60,z:-3},1000);
  for(let i=0;i<210;i++)zone.tick(.05);
  const nearby=zone.snapshot(alpha);
  assert.ok(nearby);
  assert.equal(nearby.type,"zone_snapshot");
  assert.ok(nearby.players.some(p=>p.id===bravo));
  assert.ok(nearby.players.some(p=>p.id===charlie));
  assert.ok(!nearby.players.some(p=>p.id===delta),"jogador distante não deve ser enviado");
  assert.equal(zone.snapshot("missing"),null);
});
