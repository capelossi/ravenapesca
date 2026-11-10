// Ravena Online — núcleo de uma futura zona multiplayer.
// Sem WebSocket, autenticação ou persistência: é APENAS a simulação pura.
// O servidor real será o responsável por associar sessões autenticadas aos IDs.
export function createZone({world,maxPlayers=100,speed=6.7,visibility=28,cellSize=12}={}){
  if(!world?.start||!world?.worldId)throw Error("Manifesto do mundo obrigatório");
  const players=new Map();
  const TILE=cellSize;
  const index=new Map();
  const stamp=()=>Date.now();
  const bounded=(n)=>Number.isFinite(n)&&Math.abs(n)<88;
  const gridKey=(x,z)=>Math.floor(x/TILE)+":"+Math.floor(z/TILE);
  const cleanName=name=> typeof name==="string"&&/^[\p{L}\p{N}_]{3,16}$/u.test(name)?name:null;
  function join({id,name,kind="mago"}={}){
    if(typeof id!=="string"||id.length<12||id.length>128)return {ok:false,reason:"invalid-id"};
    const normalized=cleanName(name);
    if(!normalized)return {ok:false,reason:"invalid-name"};
    if(!["mago","espadachim","forjador"].includes(kind))return {ok:false,reason:"invalid-class"};
    if(players.has(id))return {ok:false,reason:"duplicate-session"};
    if(players.size>=maxPlayers)return {ok:false,reason:"zone-capacity"};
    players.set(id,{id,name:normalized,kind,x:world.start.x,z:world.start.z,target:null,lastMove:0,joined:stamp()});
    return {ok:true,x:world.start.x,z:world.start.z};
  }
  function leave(id){return players.delete(id);}
  function queueMove(id,target,now=stamp()){
    const player=players.get(id);
    if(!player)return {ok:false,reason:"unknown-player"};
    if(!target||!bounded(target.x)||!bounded(target.z))return {ok:false,reason:"invalid-target"};
    if(!Number.isFinite(now)||now<player.lastMove)return {ok:false,reason:"invalid-time"};
    if(now-player.lastMove<85)return {ok:false,reason:"rate-limit"};
    player.lastMove=now;
    // Client input declares a destination, NOT a verified position.
    // Collision with buildings requires server NavMesh in the next milestone.
    player.target={x:target.x,z:target.z};
    return {ok:true};
  }
  function tick(dt){
    if(!Number.isFinite(dt)||dt<=0)return;
    const stepSeconds=Math.min(dt,.05);
    for(const player of players.values()){
      if(!player.target)continue;
      const dx=player.target.x-player.x,dz=player.target.z-player.z;
      const length=Math.hypot(dx,dz);
      if(length<=.05){player.target=null;continue;}
      const step=Math.min(length,speed*stepSeconds);
      player.x+=dx/length*step;
      player.z+=dz/length*step;
      if(Math.hypot(player.target.x-player.x,player.target.z-player.z)<=.05)
        player.target=null;
    }
    index.clear();
    for(const p of players.values()){
      const key=gridKey(p.x,p.z);
      if(!index.has(key))index.set(key,[]);
      index.get(key).push(p);
    }
  }
  function playerState(p){
    return {id:p.id,name:p.name,kind:p.kind,x:Number(p.x.toFixed(2)),z:Number(p.z.toFixed(2))};
  }
  function state(id){
    const p=players.get(id);return p?playerState(p):null;
  }
  function snapshot(viewerId){
    const viewer=players.get(viewerId);
    if(!viewer)return null;
    // Spatial hash: include only players in nearby cells and within radius.
    const r=Math.ceil(visibility/TILE),gx=Math.floor(viewer.x/TILE),gz=Math.floor(viewer.z/TILE);
    const peers=[];
    const seen=new Set();
    for(let x=gx-r;x<=gx+r;x++)for(let z=gz-r;z<=gz+r;z++){
      for(const p of index.get(x+":"+z)||[]){
        if(p.id===viewer.id||seen.has(p.id))continue;
        if(Math.hypot(p.x-viewer.x,p.z-viewer.z)>visibility)continue;
        seen.add(p.id);peers.push(playerState(p));
      }
    }
    return {type:"zone_snapshot",worldId:world.worldId,self:playerState(viewer),players:peers};
  }
  return Object.freeze({join,leave,queueMove,tick,state,snapshot,get size(){return players.size;}});
}
