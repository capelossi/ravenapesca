// Ravena Online — simulador VISUAL LOCAL de criaturas.
// Quando houver multiplayer, a movimentação, a IA, o dano e o saque devem ser
// executados pelo servidor de zona, e o cliente apenas renderiza snapshots.
(() => {
  function create({B,scene,materials,world,combat}){
    if(!world?.enemies||!combat)throw Error("RavenaEnemies: catálogo de inimigos ausente");
    const all=[],effects=[];
    const m=materials;
    function ball(parent,label,x,y,z,d,material){
      const mesh=B.MeshBuilder.CreateSphere(label,{diameter:d,segments:10},scene);
      mesh.parent=parent;mesh.position.set(x,y,z);mesh.material=material;mesh.isPickable=false;return mesh;
    }
    function block(parent,label,x,y,z,w,h,d,material){
      const mesh=B.MeshBuilder.CreateBox(label,{width:w,height:h,depth:d},scene);
      mesh.parent=parent;mesh.position.set(x,y,z);mesh.material=material;mesh.isPickable=false;return mesh;
    }
    function createModel(entry){
      const stats=combat.mobDefinition(entry.kind);
      if(!stats)throw Error("Unknown mob definition "+entry.kind);
      const root=new B.TransformNode(entry.id,scene);
      root.position.set(entry.x,0,entry.z);
      if(entry.kind==="golem"){
        const body=ball(root,"golem",0,1.22,0,1.65,m.darkStone);body.scaling.y=1.12;
        ball(root,"golem head",0,2.36,.08,.91,m.stone);
        for(const side of [-1,1]){
          block(root,"stone arm",side*1.03,1.5,0,.65,1.25,.75,m.darkStone);
          block(root,"stone leg",side*.43,.38,0,.57,.7,.62,m.stone);
          ball(root,"golem eye",side*.18,2.43,.49,.15,m.fire);
        }
      }else if(entry.kind==="wolf"){
        const body=ball(root,"wolf body",0,.83,-.04,1.48,m.leather);
        body.scaling.z=1.45;body.scaling.y=.7;
        const head=ball(root,"wolf head",0,1.25,.95,.86,m.leaves3);
        head.scaling.z=1.25;
        for(const side of [-1,1]){
          ball(root,"wolf ear",side*.31,1.78,1,.3,m.darkStone);
          ball(root,"wolf eye",side*.22,1.31,1.39,.13,m.fire);
          for(const dz of [-.55,.55])block(root,"wolf paw",side*.49,.34,dz,.25,.64,.27,m.leaves3);
        }
        const tail=ball(root,"wolf tail",0,1.15,-1.26,.54,m.leaves3);tail.scaling.z=2;
      }else{
        const shroud=ball(root,"spirit body",0,1.44,0,1.6,m.lavender);shroud.scaling.y=1.5;
        const halo=B.MeshBuilder.CreateTorus("spirit halo",{diameter:1.5,thickness:.08,tessellation:24},scene);
        halo.parent=root;halo.position.set(0,2.35,0);halo.material=m.gold;halo.isPickable=false;
        for(const side of [-1,1])ball(root,"spirit eyes",side*.28,1.7,.75,.16,m.fire);
      }
      const shadow=B.MeshBuilder.CreateDisc("enemy circle",{radius:.9,tessellation:18},scene);
      shadow.parent=root;shadow.position.set(0,.08,0);shadow.rotation.x=Math.PI/2;
      shadow.material=m.npcRing;shadow.isPickable=false;
      return {
        id:entry.id,kind:entry.kind,label:stats.label,level:entry.level||1,root,
        x:entry.x,z:entry.z,homeX:entry.x,homeZ:entry.z,hp:stats.maxHp,maxHp:stats.maxHp,
        alive:true,respawnAt:0,lastHitAt:0,speed:stats.speed,visualClock:0
      };
    }
    for(const entry of world.enemies)all.push(createModel(entry));
    function target(x,z,range){
      let best=null,d=range;
      for(const mob of all){
        if(!mob.alive)continue;
        const dist=Math.hypot(mob.x-x,mob.z-z);
        if(dist<d){d=dist;best=mob;}
      }
      return best;
    }
    function hit(x,z,range,damage,now){
      const enemy=target(x,z,range);
      if(!enemy)return {ok:false,reason:"Aproxime-se de um monstro para atacar."};
      enemy.hp=combat.normalizeHp(enemy.hp-Math.max(0,damage),enemy.maxHp);
      if(enemy.hp===0){
        enemy.alive=false;enemy.root.setEnabled(false);
        enemy.respawnAt=now+combat.mobDefinition(enemy.kind).respawnMs;
        const reward=combat.loot(enemy.kind,Math.random());
        return {ok:true,killed:true,enemy,reward,xp:combat.mobDefinition(enemy.kind).xp};
      }
      return {ok:true,killed:false,enemy};
    }
    function stepTowards(mob,x,z,dt,speed){
      const dx=x-mob.x,dz=z-mob.z,d=Math.hypot(dx,dz);
      if(d<.12)return;
      const step=Math.min(d,speed*dt);
      mob.x+=dx/d*step;mob.z+=dz/d*step;
      mob.root.position.x=mob.x;mob.root.position.z=mob.z;
      mob.root.rotation.y=Math.atan2(dx,dz);
    }
    function tick(dt,now,hero,zone,onAttack){
      for(const mob of all){
        if(!mob.alive){
          if(now>=mob.respawnAt){
            mob.hp=mob.maxHp;mob.alive=true;mob.x=mob.homeX;mob.z=mob.homeZ;
            mob.root.position.set(mob.x,0,mob.z);mob.root.setEnabled(true);
          }
          continue;
        }
        mob.visualClock+=dt;
        if(mob.kind==="spirit")mob.root.position.y=.25+Math.sin(mob.visualClock*2.5)*.17;
        else mob.root.position.y=Math.sin(mob.visualClock*2.6)*.035;
        const distHome=Math.hypot(mob.x-mob.homeX,mob.z-mob.homeZ);
        const distance=hero?Math.hypot(hero.x-mob.x,hero.z-mob.z):Infinity;
        const wild=zone?.kind==="wilderness";
        if(wild&&distHome<14&&combat.aggro(distance,mob.kind)){
          if(combat.melee(distance,mob.kind)){
            if(now-mob.lastHitAt>=1950){
              mob.lastHitAt=now;
              onAttack?.(combat.damage(mob.kind,mob.level),mob);
            }
          }else stepTowards(mob,hero.x,hero.z,dt,mob.speed);
        }else if(distHome>.15)stepTowards(mob,mob.homeX,mob.homeZ,dt,mob.speed*.8);
      }
    }
    function ring(x,z,material,now,duration=380){
      const mesh=B.MeshBuilder.CreateTorus("battle ring",{diameter:1.1,thickness:.065,tessellation:24},scene);
      mesh.position.set(x,.23,z);mesh.material=material;mesh.isPickable=false;
      effects.push({mesh,start:now,duration});
    }
    function animateEffects(now){
      for(let i=effects.length-1;i>=0;i--){
        const fx=effects[i],progress=(now-fx.start)/fx.duration;
        if(progress>=1){fx.mesh.dispose();effects.splice(i,1);continue;}
        const scale=1+progress*2.8;
        fx.mesh.scaling.set(scale,1,scale);
        fx.mesh.visibility=1-progress;
      }
    }
    function dispose(){for(const fx of effects)fx.mesh.dispose();for(const mob of all)mob.root.dispose(false,true);}
    return Object.freeze({all,target,hit,tick,ring,animateEffects,dispose});
  }
  globalThis.RavenaEnemies=Object.freeze({create});
})();