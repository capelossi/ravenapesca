"use strict";
(() => {
  const $ = id => document.getElementById(id);
  const canvas = $("world");
  if (!window.BABYLON) {
    $("create-error").textContent = "Não foi possível carregar o motor 3D. Confira sua conexão e atualize a página.";
    return;
  }

  const B = BABYLON;
  const engine = new B.Engine(canvas, true, { preserveDrawingBuffer: false, stencil: true, adaptToDeviceRatio: false });
  engine.setHardwareScalingLevel(Math.max(1, (window.devicePixelRatio || 1) / (window.innerWidth < 750 ? 1.25 : 1.6)));
  const scene = new B.Scene(engine);
  scene.clearColor = new B.Color4(.58,.69,.78,1);
  scene.ambientColor = new B.Color3(.75,.75,.83);
  scene.fogMode = B.Scene.FOGMODE_EXP2;
  scene.fogDensity = .0078;
  scene.fogColor = new B.Color3(.55,.64,.71);
  const sun = new B.HemisphericLight("sky",new B.Vector3(-.2,1,.3),scene);
  sun.intensity = 1.1;
  sun.groundColor = new B.Color3(.42,.38,.36);
  const dir = new B.DirectionalLight("sun",new B.Vector3(-.7,-1,-.45),scene);
  dir.position = new B.Vector3(25,60,35); dir.intensity = 1.25;
  const shadows = new B.ShadowGenerator(1024,dir);
  shadows.useBlurExponentialShadowMap = true;
  shadows.blurKernel = 8;
  const camera = new B.ArcRotateCamera("cam", -Math.PI*.75, 1.03, 31,new B.Vector3(0,1,0),scene);
  camera.lowerRadiusLimit = 18;camera.upperRadiusLimit = 48;
  camera.lowerBetaLimit = .8; camera.upperBetaLimit = 1.22;
  camera.panningSensibility = 0;
  camera.wheelPrecision = 65;
  camera.inputs.removeByType("ArcRotateCameraPointersInput");
  camera.attachControl(canvas,true);
  camera.fov=.77;
  const mat=(name,hex,rough=1) => {
    const m=new B.StandardMaterial(name,scene);
    m.diffuseColor=B.Color3.FromHexString(hex);
    m.specularColor=new B.Color3(.12,.12,.12);
    m.ambientColor=m.diffuseColor.scale(.35);
    return m;
  };
  const m={
    ground:mat("grass","#668052"),forest:mat("forest","#405d45"),
    road:mat("stone road","#9f998c"), roadEdge:mat("road edge","#817e73"),
    stone:mat("limestone","#b5a994"), darkStone:mat("dark stone","#6e7376"),
    wall:mat("wall","#b3a38a"),roof:mat("terracotta","#8b4f46"),
    roofDark:mat("roof blue","#4b5666"),wood:mat("wood","#674537"),beams:mat("timber","#49352e"),
    leaves:mat("leaves","#43705a"),leaves2:mat("leaves light","#75905b"),leaves3:mat("leaves dark","#345643"),
    trunk:mat("trunk","#655044"),water:mat("lake","#428fa3"),water2:mat("lake shallow","#68b2b1"),
    sand:mat("shore","#c2ae7e"),gold:mat("gold","#d6aa5b"),grassFlower:mat("flowers","#bf7c98"),
    red:mat("banner","#732c47"),black:mat("iron","#292d34"),fire:mat("lava","#e77839"),
    lavender:mat("arcane","#9751c6"),skin0:mat("skin0","#f4c9a0"),skin1:mat("skin1","#b98256"),skin2:mat("skin2","#71442f"),
    hair0:mat("hair0","#6f304b"),hair1:mat("hair1","#4d3023"),hair2:mat("hair2","#d8ad57"),
    cape:mat("cape","#4f263f"),robe:mat("mage robe","#39334f"),armor:mat("armor","#485663"),leather:mat("leather","#71523d"),
    white:mat("cloud","#f4e6cd"),npc:mat("npc robe","#6d775c")
  };
  m.water.alpha=.84; m.water2.alpha=.8;
  m.lavender.emissiveColor=new B.Color3(.24,.08,.45);
  m.fire.emissiveColor=new B.Color3(.53,.15,.03);
  m.gold.specularColor=new B.Color3(.4,.3,.1);

  const ground=B.MeshBuilder.CreateGround("clickable-ground",{width:184,height:184,subdivisions:2},scene);
  ground.material=m.ground;
  ground.isPickable=true;
  ground.metadata={ground:true};
  ground.receiveShadows=true;

  const obstacles=[];
  const interactables=[];
  const mobs=[];
  let hero=null, config=null, path=[], waypoint=null, nextInteraction=null, level=1,xp=0,hp=100,mp=100;
  let quest=0, dialogueOpen=false, toastUntil=0, lastTime=0, pulse=0, lastSave=0, currentZone="", lastMove=0;
  const bounded=(x,z)=> Math.abs(x)<88 && Math.abs(z)<88;
  function obstacle(x,z,r){obstacles.push({x,z,r});}
  function blocked(x,z,pad=.65) {
    if(!bounded(x,z))return true;
    for(const o of obstacles) if((o.x-x)**2+(o.z-z)**2<(o.r+pad)**2)return true;
    return false;
  }
  function box(name,pos,sz,material,collides=false) {
    const o=B.MeshBuilder.CreateBox(name,{width:sz[0],height:sz[1],depth:sz[2]},scene);
    o.position=new B.Vector3(...pos);o.material=material;o.receiveShadows=true;
    o.isPickable=false;
    if(collides)obstacle(pos[0],pos[2],Math.max(sz[0],sz[2])*.52);
    shadows.addShadowCaster(o);
    return o;
  }
  function sphere(name,pos,d,material) {
    const o=B.MeshBuilder.CreateSphere(name,{diameter:d,segments:8},scene);
    o.position=new B.Vector3(...pos);o.material=material;o.isPickable=false;
    return o;
  }
  function cyl(name,pos,top,bottom,h,material,tess=8) {
    const o=B.MeshBuilder.CreateCylinder(name,{diameterTop:top,diameterBottom:bottom,height:h,tessellation:tess},scene);
    o.position=new B.Vector3(...pos);o.material=material;o.isPickable=false;return o;
  }
  function disc(name,x,z,r,material,y=.02) {
    const o=B.MeshBuilder.CreateDisc(name,{radius:r,tessellation:32},scene);
    o.rotation.x=Math.PI/2;o.position=new B.Vector3(x,y,z);
    o.material=material;o.isPickable=false;return o;
  }
  function roof(x,z,w,d,y,material) {
    const roof=B.MeshBuilder.CreateCylinder("roof",{diameterTop:0,diameterBottom:1,height:1,tessellation:4},scene);
    roof.dispose();
    const left=box("roof left",[x-w*.23,y+.12,z],[w*.57,.22,d+.5],material);
    left.rotation.z=-.55;const right=box("roof right",[x+w*.23,y+.12,z],[w*.57,.22,d+.5],material);
    right.rotation.z=.55;
  }
  // Seeded variation gives the same world layout after refresh.
  let seed=72491;const rnd=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  function flower(x,z){sphere("flower",[x,.13,z],.2,rnd()>.5?m.grassFlower:m.gold);}
  function tree(x,z,s=1) {
    cyl("tree trunk",[x,1.7*s,z],.42*s,.53*s,3.4*s,m.trunk,7);
    sphere("leaf canopy",[x,4.3*s,z],4*s,[m.leaves,m.leaves2,m.leaves3][Math.floor(rnd()*3)]);
    sphere("leaf crown",[x+.8*s,5.3*s,z+.4*s],2.6*s,m.leaves2);
    obstacle(x,z,1.3*s);
  }
  function rock(x,z,s=1){const o=sphere("rock",[x,.35*s,z],s,m.darkStone);o.scaling.y=.75;obstacle(x,z,s*.45);}
  function sign(text,x,z,color="#ffe6a7"){
    const plane=B.MeshBuilder.CreatePlane("sign",{width:5,height:1.1},scene);
    plane.position=new B.Vector3(x,4.3,z);
    plane.billboardMode=B.Mesh.BILLBOARDMODE_ALL;
    plane.isPickable=false;
    const texture=new B.DynamicTexture("sign texture",{width:512,height:112},scene,false);
    const ctx=texture.getContext();ctx.clearRect(0,0,512,112);
    ctx.fillStyle="rgba(12,18,30,.75)";ctx.fillRect(0,18,512,76);
    ctx.strokeStyle="#ba965b";ctx.lineWidth=3;ctx.strokeRect(3,21,506,70);
    ctx.font="bold 35px Georgia";ctx.fillStyle=color;ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(text,256,56);
    texture.update();const sm=new B.StandardMaterial("sign",scene);sm.diffuseTexture=texture;sm.emissiveColor=new B.Color3(.72,.72,.72);sm.backFaceCulling=false;plane.material=sm;
  }
  function house(x,z,scale=1,roofmat=m.roof) {
    const w=5.3*scale,d=5.3*scale,h=5*scale;
    box("timber house",[x,h/2,z],[w,h,d],m.stone,true);
    for(const side of [-1,1]){
      box("beam",[x+side*w*.47,h/2,z],[.23*scale,h,.26*scale],m.beams);
      box("beam",[x,h/2,z+side*d*.48],[.24*scale,h,.24*scale],m.beams);
    }
    box("horizontal beam",[x,h*.75,z+d*.5],[w,.2*scale,.2*scale],m.beams);
    box("front door",[x,h*.26,z+d*.51],[1.1*scale,2.5*scale,.1*scale],m.wood);
    for(const side of [-1,1])box("window",[x+side*w*.30,h*.72,z+d*.515],[.8*scale,.9*scale,.08*scale],m.gold);
    roof(x,z,w,d,h,roofmat);
  }
  function road(x,z,w,d){const r=box("road",[x,.022,z],[w,.04,d],m.road);r.receiveShadows=true;}
  function scatterRoad(x,z,w,d,count){
    for(let i=0;i<count;i++){
      const px=x+(rnd()-.5)*w, pz=z+(rnd()-.5)*d;
      const cobble=box("cobble",[px,.055,pz],[.45+rnd()*.8,.06,.4+rnd()*.6],rnd()>.5?m.road:m.roadEdge);
      cobble.rotation.y=rnd()*.6;
    }
  }
  road(0,0,16,42);
  road(0,0,43,11);
  road(22,0,38,7);
  road(-27,-4,36,7);
  road(0,25,8,52);
  road(-26,-21,12,39);
  road(31,16,9,35);
  scatterRoad(0,0,17,39,205);
  scatterRoad(0,0,40,11,130);
  // Town is central, forest to west, lake to east, forge to south.
  house(-11,-13,1.1);
  house(13,-12,.96,m.roofDark);
  house(-12,13,1.1,m.roofDark);
  house(12,13,.97);
  house(-23,6,.8);
  house(23,-8,.8,m.roofDark);
  for(let i=0;i<4;i++){
    box("castle wall",[-23+i*4.8,.9,28],[4.6,1.8,2.1],m.stone,true);
    box("castle wall",[8+i*4.8,.9,28],[4.6,1.8,2.1],m.stone,true);
  }
  for(const x of [-24,24]){
    cyl("watchtower",[x,3,28],5.1,5.1,6,m.stone,10);
    cyl("watchtower roof",[x,7,28],.25,6.7,4,m.roof,10);
    obstacle(x,28,3);
  }
  const gateArch=box("gate stone",[0,5.5,28],[9,11,2.4],m.stone);
  box("gate opening",[0,2.6,29],[5.1,5.2,2.7],m.black);
  obstacle(0,28,1.5);
  for(const x of [-16,16]) {
    box("flag pole",[x,3,22],[.18,6,.18],m.wood);
    box("banner",[x,4.2,22],[1.7,2.7,.12],m.red);
  }
  // Forest (northwest).
  for(let i=0;i<56;i++){
    const x=-60+rnd()*48,z=-55+rnd()*37;
    if(Math.abs(x+26)<8&&Math.abs(z+28)<8)continue;
    tree(x,z,.7+rnd()*.45);
    if(rnd()>.7)flower(x+1.5,z-1);
  }
  for(let i=0;i<14;i++)rock(-59+rnd()*48,-56+rnd()*36,.6+rnd()*1.3);
  sign("FLORESTA DOS SUSSURROS",-41,-21,"#bfe2bf");
  // Lake east: large flat water disks, docks, fishing spots.
  disc("shore",55,1,24,m.sand,.04);
  disc("lake",55,1,21,m.water,.055);
  disc("inner lake",55,1,18,m.water2,.058);
  for(let i=0;i<16;i++){
    const a=i*Math.PI*2/16;
    const x=55+Math.cos(a)*24,z=1+Math.sin(a)*24;
    if(Math.abs(z)<7 && x<55)continue;
    tree(x,z,.62+rnd()*.28);
  }
  for(let i=0;i<7;i++)box("dock plank",[31+i*1.6,.22,1],[1.5,.27,4.5],m.wood);
  for(const x of [31,36,41]){
    for(const z of [-1.8,1.8])cyl("pier post",[x,.65,z],.34,.34,1.3,m.trunk);
  }
  sign("LAGO DA MÃE DAS ÁGUAS",39,-14,"#a0d7e0");
  // Forge and mountains south.
  for(let i=0;i<15;i++){
    const x=-40+rnd()*85,z=39+rnd()*23;
    rock(x,z,1.8+rnd()*3.8);
  }
  house(6,48,1.15,m.roofDark);
  house(-12,52,1,m.roofDark);
  for(let i=0;i<4;i++){
    box("forge table",[12+i*2.2,.65,41],[1.8,1.3,1.4],m.darkStone);
    box("forge ember",[12+i*2.2,1.35,41],[1.1,.2,1],m.fire);
  }
  sign("MONTANHAS DA FORJA",0,38,"#efc18b");
  // Roadside décor.
  for(const x of [-6,6,20,-20])for(const z of [-18,19]){
    cyl("lantern pole",[x,2,z],.2,.25,4,m.black);
    sphere("lantern",[x,4.15,z],.65,m.gold);
  }
  for(let i=0;i<45;i++){
    const x=-32+rnd()*65,z=-23+rnd()*47;
    if(blocked(x,z,1))continue;
    if(rnd()>.6)flower(x,z);
  }

  function makeActor(name,x,z,kind="mago",skin=m.skin0,hair=m.hair0){
    const root=new B.TransformNode(name+" root",scene);root.position.set(x,0,z);
    function part(mesh){mesh.parent=root;return mesh;}
    const clothing=kind==="mago"?m.robe:kind==="espadachim"?m.armor:m.leather;
    const body=part(B.MeshBuilder.CreateCylinder(name+" torso",{diameterTop:1.02,diameterBottom:.83,height:1.65,tessellation:8},scene));
    body.position.y=1.9;body.material=clothing;
    const head=part(B.MeshBuilder.CreateSphere(name+" head",{diameter:.78,segments:12},scene));
    head.position.y=3.04;head.material=skin;
    const h=part(B.MeshBuilder.CreateSphere(name+" hair",{diameter:.83,segments:10},scene));
    h.position.y=3.32;h.scaling.y=.53;h.material=hair;
    const cap=part(B.MeshBuilder.CreateCylinder(name+" cloak",{diameterTop:.9,diameterBottom:1.65,height:1.7,tessellation:12},scene));
    cap.position.set(0,1.57,-.3);cap.material=kind==="mago"?m.cape:kind==="espadachim"?m.red:m.wood;
    for(const side of [-1,1]){
      const leg=part(B.MeshBuilder.CreateCylinder(name+" leg",{diameter:.33,height:1.22,tessellation:8},scene));
      leg.position.set(side*.27,.64,0);leg.material=m.black;
      const arm=part(B.MeshBuilder.CreateCylinder(name+" arm",{diameter:.32,height:1.3,tessellation:8},scene));
      arm.position.set(side*.74,1.95,0);arm.rotation.z=side*.15;arm.material=clothing;
      const boot=part(B.MeshBuilder.CreateBox(name+" boot",{width:.42,height:.33,depth:.63},scene));
      boot.position.set(side*.27,.19,.13);boot.material=m.leather;
    }
    if(kind==="mago"){
      const staff=part(B.MeshBuilder.CreateCylinder(name+" staff",{diameter:.1,height:3.3,tessellation:7},scene));
      staff.position.set(.92,1.6,.45);staff.material=m.wood;
      const gem=part(B.MeshBuilder.CreateSphere(name+" gem",{diameter:.52,segments:12},scene));
      gem.position.set(.92,3.42,.45);gem.material=m.lavender;
    }else if(kind==="espadachim"){
      const blade=part(B.MeshBuilder.CreateBox(name+" sword",{width:.18,height:2.1,depth:.22},scene));
      blade.material=m.stone;blade.position.set(.95,1.23,.4);blade.rotation.z=-.18;
      const guard=part(B.MeshBuilder.CreateBox(name+" guard",{width:.7,height:.13,depth:.17},scene));
      guard.position.set(.83,.5,.4);guard.material=m.gold;
    }else{
      const handle=part(B.MeshBuilder.CreateCylinder(name+" hammer handle",{diameter:.13,height:1.9},scene));
      handle.position.set(.96,1.35,.4);handle.material=m.wood;
      const hammer=part(B.MeshBuilder.CreateBox(name+" hammer head",{width:.98,height:.43,depth:.43},scene));
      hammer.position.set(.96,2.28,.4);hammer.material=m.darkStone;
    }
    return root;
  }
  function actorLabel(text,x,z,color="#f0dfb7"){
    const label=sign(text,x,z,color);
    return label;
  }
  function addNPC(name,x,z,story,kind="forjador",give=0){
    const root=makeActor(name,x,z,kind,m.skin1,m.hair1);
    root.scaling.scaleInPlace(.86);
    const light=disc(name+" ring",x,z,1.05,m.gold,.09);light.material.alpha=.22;
    interactables.push({name,x,z,root,story,give});
    actorLabel(name,x,z);
  }
  addNPC("Capitã Elyra",-5,-7,"Bem-vindo a Azarath, aventureiro! Siga as estradas: a oeste ficam as florestas, a leste está o lago e ao sul, a forja. O destino do reino será escrito por suas escolhas.","espadachim",20);
  addNPC("Mestre Ferreiro",3,46,"Uma boa espada não nasce pronta. Minérios e materiais serão parte do sistema de profissão. No futuro você poderá fabricar e vender equipamentos para outros jogadores.","forjador",15);
  addNPC("Pescador Orien",33,1,"O Lago da Mãe das Águas esconde espécies raras. A pescaria será uma profissão e não o centro do jogo. Volte aqui quando as missões de pesca estiverem prontas.","mago",15);
  addNPC("Guardião da Floresta",-38,-22,"As criaturas das árvores mudam com a luz. Ainda estamos construindo as missões de caça, coleta e os grandes chefes destas terras.","mago",15);
  // Training enemies and their static HP.
  function addMob(x,z) {
    const root=new B.TransformNode("training golem",scene);root.position.set(x,0,z);
    const torso=sphere("golem body",[0,1.1,0],1.75,m.darkStone);torso.parent=root;
    const head=sphere("golem face",[0,2.3,0],.96,m.stone);head.parent=root;
    for(const s of [-1,1]){
      const limb=box("golem arm",[s*1.1,1.35,0],[.7,1.4,.75],m.darkStone);limb.parent=root;
    }
    mobs.push({x,z,root,hp:45,maxHp:45,alive:true});
    obstacle(x,z,1.0);
  }
  addMob(-30,-10);addMob(-35,-3);addMob(33,39);
  const marker=B.MeshBuilder.CreateTorus("destination",{diameter:1.6,thickness:.075,tessellation:36},scene);
  marker.rotation.x=Math.PI/2;marker.position.y=.13;marker.material=m.gold;marker.setEnabled(false);
  const markerInner=disc("destination sparkle",0,0,.19,m.lavender,.14);
  markerInner.setEnabled(false);

  // Grid A* path search: collision-aware pathing for click-to-move.
  const CELL=2;
  const toCell=v=>Math.round(v/CELL);
  const key=(x,z)=>x+","+z;
  function route(start,end){
    let sx=toCell(start.x),sz=toCell(start.z),tx=toCell(end.x),tz=toCell(end.z);
    if(blocked(tx*CELL,tz*CELL,.4)){
      let found=null;
      for(let r=1;r<=7&&!found;r++){
        for(let dx=-r;dx<=r&&!found;dx++)for(let dz=-r;dz<=r&&!found;dz++){
          const x=(tx+dx)*CELL,z=(tz+dz)*CELL;
          if(!blocked(x,z,.4)){found={x:tx+dx,z:tz+dz};}
        }
      }
      if(!found)return [];
      tx=found.x;tz=found.z;
    }
    const opens=[{x:sx,z:sz,g:0,f:0}];const visited=new Map();const cost=new Map([[key(sx,sz),0]]);
    let endpoint=null,iter=0;
    while(opens.length&&iter++<9500){
      let best=0;for(let i=1;i<opens.length;i++)if(opens[i].f<opens[best].f)best=i;
      const n=opens.splice(best,1)[0],k=key(n.x,n.z);
      if(visited.has(k))continue;visited.set(k,n);
      if(n.x===tx&&n.z===tz){endpoint=n;break;}
      for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
        const nx=n.x+dx,nz=n.z+dz,nk=key(nx,nz);
        if(Math.abs(nx)>43||Math.abs(nz)>43||visited.has(nk)||blocked(nx*CELL,nz*CELL,.25))continue;
        if(dx&&dz&&(blocked((n.x+dx)*CELL,n.z*CELL,.25)||blocked(n.x*CELL,(n.z+dz)*CELL,.25)))continue;
        const ng=n.g+(dx&&dz?1.414:1);if(ng>=(cost.get(nk)??1e9))continue;
        cost.set(nk,ng);
        opens.push({x:nx,z:nz,g:ng,f:ng+Math.hypot(tx-nx,tz-nz),parent:k});
      }
    }
    if(!endpoint)return [];
    const points=[];
    for(let n=endpoint;n;n=n.parent?visited.get(n.parent):null)points.push(new B.Vector3(n.x*CELL,0,n.z*CELL));
    points.reverse();if(points.length>1)points.shift();
    // Smooth only when straight segments are obstacle-free.
    function clear(a,b){
      const len=B.Vector3.Distance(a,b),steps=Math.ceil(len/.5);
      for(let i=1;i<steps;i++){const t=i/steps;if(blocked(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t,.25))return false;}
      return true;
    }
    const smooth=[];let anchor=new B.Vector3(start.x,0,start.z);
    for(let i=0;i<points.length;){
      let far=i;
      for(let j=i+1;j<Math.min(points.length,i+10);j++)if(clear(anchor,points[j]))far=j;
      smooth.push(points[far]);anchor=points[far];i=far+1;
    }
    if(clear(anchor,end)&&!blocked(end.x,end.z,.4))smooth.push(new B.Vector3(end.x,0,end.z));
    return smooth;
  }
  function goto(x,z){
    if(!hero||dialogueOpen)return;
    const start=hero.position, target=new B.Vector3(x,0,z);
    const candidate=route(start,target);
    if(!candidate.length){toast("Este local está bloqueado.");return;}
    path=candidate;marker.position.x=path[path.length-1].x;
    marker.position.z=path[path.length-1].z;
    markerInner.position.x=marker.position.x;markerInner.position.z=marker.position.z;
    marker.setEnabled(true);markerInner.setEnabled(true);
    nextInteraction=null;
  }
  const damageRange=()=>config?.kind==="mago"?7:config?.kind==="espadachim"?3.2:2.8;
  function attack(){
    if(!hero||dialogueOpen)return;
    const nearest=mobs.filter(a=>a.alive).sort((a,b)=>Math.hypot(hero.position.x-a.x,hero.position.z-a.z)-Math.hypot(hero.position.x-b.x,hero.position.z-b.z))[0];
    if(!nearest||Math.hypot(hero.position.x-nearest.x,hero.position.z-nearest.z)>damageRange()){toast("Aproxime-se de um golem de treino.");return;}
    nearest.hp-=config.kind==="espadachim"?23:config.kind==="mago"?20:13;
    if(nearest.hp<=0){nearest.alive=false;nearest.root.setEnabled(false);const i=obstacles.findIndex(o=>o.x===nearest.x&&o.z===nearest.z);if(i>=0)obstacles.splice(i,1);gainXP(35);toast("Golem derrotado! +35 XP");}
    else toast("Golpe acertou! "+Math.max(0,nearest.hp)+" de vida restante.");
  }
  function gainXP(amount){
    xp+=amount;while(xp>=level*100){xp-=level*100;level++;hp=100+level*15;mp=100+level*10;toast("Você subiu para o nível "+level+"!");}
    updateStats();save();
  }
  function updateStats(){
    $("player-name").textContent=config?.name??"Aventureiro";
    $("player-class").textContent=({mago:"Mago",espadachim:"Espadachim",forjador:"Forjador"}[config?.kind]??"") +" · Nível "+level;
    $("hp-text").textContent=hp+" / "+(100+Math.max(0,level-1)*15);
    $("mp-text").textContent=mp+" / "+(100+Math.max(0,level-1)*10);
    $("hp-fill").style.width="100%";$("mp-fill").style.width="100%";
    $("xp-fill").style.width=(xp/(level*100)*100)+"%";
    $("xp-text").textContent=xp+" / "+(level*100);
  }
  function toast(message,seconds=3){
    $("toast").textContent=message;$("toast").classList.remove("hidden");toastUntil=performance.now()+seconds*1000;
  }
  function save(){
    if(!hero||!config)return;
    try{localStorage.setItem("ravena-online-alpha1",JSON.stringify({config,x:hero.position.x,z:hero.position.z,xp,level,quest}));}catch{}
  }
  function area(x,z){
    if(x>27 && z>-25&&z<25)return "Lago da Mãe das Águas";
    if(z>33)return "Montanhas da Forja";
    if(x< -28 && z< -12)return "Floresta dos Sussurros";
    return "Capital de Azarath";
  }
  function updateZone(){
    if(!hero)return;
    const z=area(hero.position.x,hero.position.z);
    if(z!==currentZone){
      currentZone=z;$("zone").textContent=z;
      if(z==="Lago da Mãe das Águas"&&quest<2){quest=2;gainXP(15);toast("Nova região descoberta: "+z);}
      else if(z==="Montanhas da Forja"&&quest<3){quest=3;gainXP(15);toast("Nova região descoberta: "+z);}
      else toast(z,2);
      updateQuest();save();
    }
    const p=hero.position;
    $("map-player").style.left=(50+p.x/90*40)+"%";
    $("map-player").style.top=(50+p.z/90*40)+"%";
  }
  function updateQuest(){
    const titles=["O primeiro passo","Conheça Azarath","Além das muralhas","Um novo destino"];
    const desc=[
      "Fale com a Capitã Elyra, perto da praça central. Pressione E quando estiver perto.",
      "Explore a capital e descubra o Lago da Mãe das Águas, a leste.",
      "O mundo se expande. Encontre a forja ao sul e converse com o ferreiro.",
      "Explore o mundo! Experimente atacar golens de treino com a tecla 1."
    ];
    $("quest-title").textContent=titles[Math.min(quest,3)];
    $("quest-description").textContent=desc[Math.min(quest,3)];
  }
  function talk(npc){
    if(!npc)return;
    dialogueOpen=true;path=[];marker.setEnabled(false);markerInner.setEnabled(false);
    $("npc-name").textContent=npc.name;$("npc-text").textContent=npc.story;
    $("dialogue").classList.remove("hidden");
    if(npc.name==="Capitã Elyra"&&quest===0){quest=1;gainXP(20);updateQuest();}
    else if(npc.give&&npc.name!=="Capitã Elyra"&&npc.name==="Mestre Ferreiro"&&quest>=2){quest=3;gainXP(npc.give);updateQuest();}
  }
  function interact(){
    if(!hero)return;
    if(dialogueOpen){closeDialogue();return;}
    const nearby=interactables.filter(n=>Math.hypot(n.x-hero.position.x,n.z-hero.position.z)<4.6)
      .sort((a,b)=>Math.hypot(a.x-hero.position.x,a.z-hero.position.z)-Math.hypot(b.x-hero.position.x,b.z-hero.position.z))[0];
    if(nearby)talk(nearby);
    else toast("Aproxime-se de um personagem para conversar.");
  }
  function closeDialogue(){dialogueOpen=false;$("dialogue").classList.add("hidden");save();}
  $("dialogue-close").addEventListener("click",closeDialogue);
  $("button-help").addEventListener("click",()=>toast("Clique ou toque no chão: mover | E: NPC | 1: atacar | Roda do mouse: zoom",5));
  $("button-profile").addEventListener("click",()=>toast(config.name+" · "+config.kind+" · Nível "+level+" | Personagem salvo neste navegador.",5));
  const classes=document.querySelectorAll(".class");
  let selected="mago",skin=0,hair=0;
  classes.forEach(button=>button.addEventListener("click",()=>{
    classes.forEach(b=>b.classList.remove("selected"));
    button.classList.add("selected");selected=button.dataset.class;
  }));
  for(const [selector,variable] of [[".tone","skin"],[".hair","hair"]]){
    document.querySelectorAll(selector).forEach(button=>button.addEventListener("click",()=>{
      document.querySelectorAll(selector).forEach(b=>b.classList.remove("selected"));
      button.classList.add("selected");
      if(variable==="skin")skin=Number(button.dataset.tone);else hair=Number(button.dataset.hair);
    }));
  }
  const saved=(()=>{try{return JSON.parse(localStorage.getItem("ravena-online-alpha1")||"null")}catch{return null}})();
  if(saved?.config?.name)$("name").value=saved.config.name;
  function start(){
    const name=$("name").value.trim();
    if(!/^[\p{L}\p{N}_]{3,16}$/u.test(name)){$("create-error").textContent="Use 3 a 16 letras, números ou _ no nome.";return;}
    config={name,kind:selected,skin,hair};
    if(hero){hero.dispose();}
    hero=makeActor(name,0,-3,selected,m["skin"+skin],m["hair"+hair]);
    const sameSaved=saved?.config?.name===name&&saved?.config?.kind===selected;
    if(sameSaved){level=Number(saved.level)||1;xp=Number(saved.xp)||0;quest=Number(saved.quest)||0;
      if(Number.isFinite(saved.x)&&Number.isFinite(saved.z)&&!blocked(saved.x,saved.z))hero.position.set(saved.x,0,saved.z);}
    hp=100+Math.max(0,level-1)*15;mp=100+Math.max(0,level-1)*10;
    $("creation").classList.add("hidden");$("hud").classList.remove("hidden");
    updateStats();updateQuest();currentZone="";updateZone();save();
    toast("Bem-vindo a Azarath, "+name+"! Clique no chão para caminhar.",5);
  }
  $("start").addEventListener("click",start);
  window.addEventListener("keydown",e=>{
    if(!hero||["INPUT","TEXTAREA"].includes(document.activeElement?.tagName))return;
    if(e.key.toLowerCase()==="e")interact();
    if(e.key==="1")attack();
    if(e.key==="2")toast("Habilidades mágicas: em desenvolvimento.");
    if(e.key==="4")toast("Sistema de forja: próxima etapa.");
    if(e.key==="5")toast("A pescaria estará disponível no mapa do lago.");
    if(e.key==="Escape")closeDialogue();
  });
  // Pointer only moves on a ground hit; picking characters can never teleport the player.
  let down=null;
  canvas.addEventListener("pointerdown",e=>down={x:e.clientX,y:e.clientY,t:performance.now()});
  canvas.addEventListener("pointerup",e=>{
    if(!hero||dialogueOpen||!down)return;
    const dist=Math.hypot(e.clientX-down.x,e.clientY-down.y);down=null;
    if(dist>14)return;
    const hit=scene.pick(scene.pointerX,scene.pointerY,mesh=>!!mesh.metadata?.ground);
    if(!hit?.hit||!hit.pickedPoint)return;
    goto(hit.pickedPoint.x,hit.pickedPoint.z);
  });
  // Touch pinch zoom.
  let pinch=null;
  canvas.addEventListener("touchmove",e=>{
    if(e.touches.length===2){
      const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
      if(pinch!==null)camera.radius=B.Scalar.Clamp(camera.radius+(pinch-d)*.04,18,48);
      pinch=d;
    }else pinch=null;
  },{passive:true});
  canvas.addEventListener("touchend",()=>pinch=null,{passive:true});
  // Continuous movement with per-frame time, obstacle safety and smooth camera.
  engine.runRenderLoop(()=>{
    const now=performance.now(),dt=Math.min((now-lastTime)/1000||.016,.05);lastTime=now;pulse+=dt;
    if(hero){
      if(path.length&&!dialogueOpen){
        const next=path[0],dx=next.x-hero.position.x,dz=next.z-hero.position.z,d=Math.hypot(dx,dz);
        const speed=config.kind==="espadachim"?7.1:6.7;
        const step=Math.min(d,speed*dt);
        if(d<=.09){path.shift();}
        else{
          const xx=hero.position.x+dx/d*step,zz=hero.position.z+dz/d*step;
          if(!blocked(xx,zz,.12)){
            hero.position.x=xx;hero.position.z=zz;
            const angle=Math.atan2(dx,dz);
            let delta=(angle-hero.rotation.y+3*Math.PI)%(2*Math.PI)-Math.PI;
            hero.rotation.y+=delta*Math.min(1,dt*9);
          }else {path=[];toast("Caminho obstruído.");}
        }
        if(!path.length){marker.setEnabled(false);markerInner.setEnabled(false);}
      }
      const target=new B.Vector3(hero.position.x,1.6,hero.position.z);
      camera.target=B.Vector3.Lerp(camera.target,target,Math.min(1,dt*5));
      if(marker.isEnabled()){marker.rotation.z=pulse*.9;marker.scaling.setAll(1+Math.sin(pulse*5)*.09);}
      updateZone();
      const nearby=interactables.some(n=>Math.hypot(n.x-hero.position.x,n.z-hero.position.z)<4.6);
      $("interaction").classList.toggle("hidden",!nearby||dialogueOpen);
      if(now-lastSave>12000){save();lastSave=now;}
    }else camera.target=B.Vector3.Lerp(camera.target,new B.Vector3(0,1.6,0),Math.min(1,dt*3));
    if(toastUntil&&now>toastUntil){$("toast").classList.add("hidden");toastUntil=0;}
    scene.render();
  });
  window.addEventListener("resize",()=>engine.resize());
  window.addEventListener("beforeunload",save);
})();