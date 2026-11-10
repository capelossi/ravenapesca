"use strict";
(() => {
  const $ = id => document.getElementById(id);
  const canvas = $("world");
  const world = globalThis.RavenaWorldData;
  const layout = globalThis.RavenaMapLayout;
  if(!world || !Array.isArray(world.regions) || !world.story){
    $("create-error").textContent="Dados do mundo indisponíveis. Atualize a página para tentar novamente.";
    return;
  }
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
  m.ore=mat("ore crystal","#a8c5d4");
  m.ore.emissiveColor=new B.Color3(.13,.19,.25);
  m.lantern=mat("warm lantern","#f3c577");
  m.lantern.emissiveColor=new B.Color3(.46,.27,.09);
  m.gold.specularColor=new B.Color3(.4,.3,.1);
  m.npcRing=mat("npc interaction ring","#d6aa5b");
  m.npcRing.alpha=.25;
  m.npcRing.emissiveColor=new B.Color3(.35,.21,.05);

  const ground=B.MeshBuilder.CreateGround("clickable-ground",{width:184,height:184,subdivisions:2},scene);
  ground.material=m.ground;
  ground.isPickable=true;
  ground.metadata={ground:true};
  ground.receiveShadows=true;
  const visuals=globalThis.RavenaVisuals.create({
    B,scene,engine,ground,sun,dir,shadows,materials:m
  });
  const combat=globalThis.RavenaCombat;

  const obstacles=[];
  const interactables=[];
  const oreNodes=[];
  const waterRipples=[];
  let hero=null, config=null, path=[], waypoint=null, nextInteraction=null, level=1,xp=0,hp=100,mp=100;
  const emptyBag=()=>({ore:0,dagger:0,fur:0,essence:0,lambari:0,tilapia:0,carpa:0,lendario:0});
  let bag=emptyBag(),fishing=null,lastAttackAt=0,lastSpecialAt=0,lastHudTick=0;
  let totalFish=0,totalOre=0,targetUntil=0,lastEnemyHit=0;
  let quest=0, dialogueOpen=false, toastUntil=0, lastTime=0, pulse=0, lastSave=0, currentZone="", lastMove=0;
  // O Atlas usa IDs e pontos de interesse independentes do motor de renderização.
  const atlas=globalThis.RavenaMapUI.create({
    onNavigate:place=>{
      const accepted=goto(place.x,place.z);
      if(accepted)toast("Caminhando até: "+place.name+". Sem teleporte.",4);
      return accepted;
    }
  });
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
    // Roads, cobblestones, windows and tiny props do not need shadow-map draws.
    if(sz[1]>=1.25)shadows.addShadowCaster(o);
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
     const left=box("roof left",[x-w*.23,y+.12,z],[w*.57,.22,d+.5],material);
    left.rotation.z=-.55;const right=box("roof right",[x+w*.23,y+.12,z],[w*.57,.22,d+.5],material);
    right.rotation.z=.55;
  }
  // O desenho das estradas, das trilhas e dos pontos-chave vive no manifesto do Atlas.
  function distanceToRoute(x,z,road){
    let min=Infinity;
    for(let i=1;i<road.points.length;i++){
      const [ax,az]=road.points[i-1],[bx,bz]=road.points[i];
      const dx=bx-ax,dz=bz-az,len=dx*dx+dz*dz;
      const t=len?Math.max(0,Math.min(1,((x-ax)*dx+(z-az)*dz)/len)):0;
      min=Math.min(min,Math.hypot(x-(ax+dx*t),z-(az+dz*t)));
    }
    return min;
  }
  function onTrail(x,z,range=3){
    return layout.paths.some(route=>
      (route.id==="trilha-do-bosque"||route.id==="rota-da-forja")&&
      distanceToRoute(x,z,route)<range);
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
  // Os caminhos do macro mapa também são corredores reais no terreno.
  for(const trail of layout.paths){
    for(let i=1;i<trail.points.length;i++){
      const [ax,az]=trail.points[i-1],[bx,bz]=trail.points[i];
      const dx=bx-ax,dz=bz-az,len=Math.hypot(dx,dz);
      if(len<.1)continue;
      const segment=box("macro route "+trail.id,
        [(ax+bx)/2,.065,(az+bz)/2],
        [trail.type==="main"?5.8:trail.type==="local"?4.8:4.1,.09,len+.75],
        trail.type==="trail"?m.sand:m.road);
      segment.rotation.y=Math.atan2(dx,dz);
    }
  }
  scatterRoad(0,0,17,39,205);
  scatterRoad(0,0,40,11,130);
  // Estrada das Lanternas: ligação a pé entre a Capital e a cidade portuária.
  road(35,-11,8,24);
  road(38,-21,26,7);
  road(33,15,8,28);
  scatterRoad(35,-11,8,24,85);
  scatterRoad(38,-21,26,7,75);
  // Town is central, forest to west, lake to east, forge to south.
  // Três casas genéricas foram substituídas por edifícios nomeados da Capital.
  // Mantemos os bairros residenciais menores até o refinamento de interiores.
  house(-12,13,1.1,m.roofDark);
  house(12,13,.97);
  house(23,-8,.8,m.roofDark);
  // Vila das Marés: pequena cidade vizinha, carregada junto com a Capital.
  // Edifícios e bairros vêm do cadastro externo em world-data.js.
  for(const building of world.settlements["vila-das-mares"].houses){
    house(building.x,building.z,building.size,
      building.roof==="blue"?m.roofDark:m.roof);
  }
  for(let i=0;i<4;i++){
    box("castle wall",[-23+i*4.8,.9,28],[4.6,1.8,2.1],m.stone,true);
    box("castle wall",[8+i*4.8,.9,28],[4.6,1.8,2.1],m.stone,true);
  }
  for(const x of [-24,24]){
    cyl("watchtower",[x,3,28],5.1,5.1,6,m.stone,10);
    cyl("watchtower roof",[x,7,28],.25,6.7,4,m.roof,10);
    obstacle(x,28,3);
  }
  // Portão Sul transitável: dois pilares e uma viga deixam a passagem central livre.
  for(const side of [-1,1]){
    box("gate pier",[side*3.5,2.65,28],[2.1,5.3,2.5],m.stone);
    obstacle(side*3.5,28,1.1);
  }
  box("gate lintel",[0,6.1,28],[9.1,2,2.8],m.stone);
  sign("PORTÃO SUL DE AZARATH",0,25,"#eed3aa");
  for(const x of [-16,16]) {
    box("flag pole",[x,3,22],[.18,6,.18],m.wood);
    box("banner",[x,4.2,22],[1.7,2.7,.12],m.red);
  }
  // Forest (northwest).
  for(let i=0;i<56;i++){
    const x=-60+rnd()*48,z=-55+rnd()*37;
    if(onTrail(x,z,5)||Math.abs(x+26)<8&&Math.abs(z+28)<8)continue;
    tree(x,z,.7+rnd()*.45);
    if(rnd()>.7)flower(x+1.5,z-1);
  }
  for(let i=0;i<14;i++){
    const x=-59+rnd()*48,z=-56+rnd()*36;
    if(!onTrail(x,z,5))rock(x,z,.6+rnd()*1.3);
  }
  sign("FLORESTA DOS SUSSURROS",-41,-21,"#bfe2bf");
  // Lake east: large flat water disks, docks, fishing spots.
  disc("shore",55,1,24,m.sand,.04);
  disc("lake",55,1,21,m.water,.055);
  disc("inner lake",55,1,18,m.water2,.058);
  // The center of the lake is not walkable; the pier and shoreline remain accessible.
  obstacle(55,1,17);
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
  sign("VILA DAS MARÉS",35,-12,"#f5d49b");
  sign("LAGO DA MÃE DAS ÁGUAS",43,16,"#a0d7e0");
  // Farol das Marés, barcos e praça costeira: marcos visuais da cidade.
  cyl("lighthouse stone tower",[48,3,24],3.7,4.7,6,m.stone,12);
  cyl("lighthouse crown",[48,6.4,24],5.2,5.2,.9,m.roofDark,12);
  cyl("lighthouse lantern",[48,7.15,24],2.4,2.4,.9,m.gold,10);
  cyl("lighthouse roof",[48,8.05,24],.1,5.1,1.3,m.roof,10);
  obstacle(48,24,2.5);
  for(const [x,z] of [[47,-5],[48,6]]){
    const hull=box("fishing boat hull",[x,.18,z],[2.6,.5,4.1],m.wood);
    hull.rotation.y=.3;
    cyl("fishing boat mast",[x,1.45,z],.14,.16,2.7,m.wood);
    const sail=box("boat sail",[x+.55,1.55,z],[1.3,1.8,.08],m.white);
    sail.rotation.y=.3;
  }
  // Forge and mountains south.
  for(let i=0;i<15;i++){
    const x=-40+rnd()*85,z=39+rnd()*23;
    if(!onTrail(x,z,6))rock(x,z,1.8+rnd()*3.8);
  }
  house(6,48,1.15,m.roofDark);
  house(-12,52,1,m.roofDark);
  for(let i=0;i<4;i++){
    box("forge table",[12+i*2.2,.65,41],[1.8,1.3,1.4],m.darkStone);
    box("forge ember",[12+i*2.2,1.35,41],[1.1,.2,1],m.fire);
  }
  sign("MONTANHAS DA FORJA",0,38,"#efc18b");
  // Mining nodes remain traversable, unlike the surrounding boulders.
  const oreCandidates=[[22,51],[-5,60],[30,43],[-25,52],[27,58],[6,63],[18,61]];
  for(const [x,z] of oreCandidates){
    if(blocked(x,z,1.3))continue;
    const shards=[];
    for(let j=0;j<3;j++){
      const shard=B.MeshBuilder.CreatePolyhedron("ore crystal",{type:1,size:.55+j*.11},scene);
      shard.position.set(x+(j-1)*.55,.36+j*.08,z+(j%2)*.38);
      shard.scaling.y=1.3+j*.25;shard.material=m.ore;shard.isPickable=false;
      shards.push(shard);
    }
    oreNodes.push({x,z,shards,cooldownUntil:0});
  }
  // Animated concentric ripples above the lake's static water surface.
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3;
    const ripple=B.MeshBuilder.CreateTorus("water ripple",{diameter:1.5,thickness:.035,tessellation:24},scene);
    ripple.position.set(55+Math.cos(a)*10,.12,1+Math.sin(a)*10);
    ripple.material=m.water2;
    ripple.isPickable=false;
    waterRipples.push({mesh:ripple,offset:i*.7});
  }
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

  // Lightweight articulated character rig: separate shoulder/hip pivots permit walking
  // and idle animation without external skeletal assets in the prototype.
  // Market square, fountain and garden beds establish a recognizable capital.
  function marketStall(x,z,awning){
    for(const side of [-1,1])for(const dz of [-1,1])
      box("market post",[x+side*1.35,1.25,z+dz*.9],[.15,2.5,.15],m.wood);
    box("market canopy",[x,2.66,z],[3.2,.19,2.45],awning);
    box("market counter",[x,.87,z],[2.8,1.1,1.25],m.wood);
    for(let j=0;j<4;j++)sphere("market produce",[x-1+j*.65,1.5,z+.34],.34,
      j%2?m.gold:m.leaves2);
    obstacle(x,z,1.65);
  }
  // Módulo de arquitetura da Capital: separado do mundo, do personagem e do RPG.
  // Layout, acessos e edificações podem mudar sem reescrever o motor de gameplay.
  const cityLayout=globalThis.RavenaCapitalLayout;
  const capitalScene=globalThis.RavenaCapitalScene.create({
    B,scene,m,box,cyl,sphere,roof,sign,marketStall,layout:cityLayout
  });
  for(const building of cityLayout.buildings)
    obstacle(building.x,building.z,Math.max(building.width,building.depth)*.52);
  const coastalMarket=world.settlements["vila-das-mares"].market;
  marketStall(coastalMarket.x,coastalMarket.z,m.roofDark);
  sign("MERCADO DO SAL",coastalMarket.x,coastalMarket.z-5,"#dce7c4");
  cyl("well rim",[0,.5,13],3.1,3.1,1,m.stone,12);
  cyl("well water",[0,1.03,13],2.45,2.45,.05,m.water,18);
  obstacle(0,13,1.85);
  for(const [x,z] of [[-8,8],[8,8],[-7,20],[7,-21],[-17,0],[19,-2]]){
    cyl("planter",[x,.25,z],1.65,1.4,.5,m.stone,8);
    sphere("garden shrubs",[x,.85,z],1.7,m.leaves2);
    for(let i=0;i<4;i++)flower(x+(rnd()-.5)*1.3,z+(rnd()-.5)*1.3);
    obstacle(x,z,.85);
  }

  function makeActor(name,x,z,kind="mago",skin=m.skin0,hair=m.hair0,appearance={}){
    const root=new B.TransformNode(name+" root",scene);
    root.position.set(x,0,z);
    const clothing=kind==="mago"?m.robe:kind==="espadachim"?m.armor:m.leather;
    const bodyType=appearance.bodyType==="masculino"?"masculino":"feminino";
    const hairStyle=["longo","curto","trancas"].includes(appearance.hairStyle)?appearance.hairStyle:"longo";
    function attach(mesh,parent,pos,material){
      mesh.parent=parent;
      if(pos)mesh.position.set(...pos);
      if(material)mesh.material=material;
      mesh.isPickable=false;
      return mesh;
    }
    function cub(label,pos,dimensions,material,parent=root){
      return attach(B.MeshBuilder.CreateBox(name+" "+label,
        {width:dimensions[0],height:dimensions[1],depth:dimensions[2]},scene),parent,pos,material);
    }
    function ball(label,pos,d,material,parent=root){
      return attach(B.MeshBuilder.CreateSphere(name+" "+label,{diameter:d,segments:12},scene),parent,pos,material);
    }
    function tube(label,pos,top,bottom,h,material,parent=root){
      return attach(B.MeshBuilder.CreateCylinder(name+" "+label,
        {diameterTop:top,diameterBottom:bottom,height:h,tessellation:11},scene),parent,pos,material);
    }
    const torso=tube("tailored coat",[0,1.95,0],bodyType==="masculino"?1.14:.98,bodyType==="masculino"?.91:.75,1.55,clothing);
    const chest=cub("chest armor",[0,2.02,.25],[1,.54,.26],kind==="espadachim"?m.darkStone:m.leather);
    cub("gold breastplate clasp",[0,2.31,.41],[.19,.18,.11],m.gold);
    const belt=tube("waist belt",[0,1.24,0],.88,.88,.2,m.leather);
    const buckle=cub("belt buckle",[0,1.24,.42],[.24,.18,.08],m.gold);
    const head=ball("head",[0,3.1,.06],.86,skin);
    const hairCap=ball("hair cap",[0,3.41,-.04],.91,hair);
    hairCap.scaling.y=.58;
    for(const side of [-1,1]){
      if(hairStyle!=="curto"){
        const strand=ball("hair strand",[side*.37,3.06,-.24],hairStyle==="trancas"?.23:.34,hair);
        strand.scaling.y=hairStyle==="trancas"?1.95:1.55;
        if(hairStyle==="trancas"){
          for(let t=0;t<3;t++)ball("braid knot",[side*.37,3.02-t*.20,-.24],.22,hair);
        }
      }
      ball("eye",[side*.175,3.15,.444],.09,m.black);
      ball("brow",[side*.17,3.27,.425],.065,hair);
    }
    const nose=ball("nose",[0,3.03,.49],.115,skin);
    nose.scaling.set(.75,1,1);
    const capePivot=new B.TransformNode(name+" cape joint",scene);
    capePivot.parent=root;capePivot.position.set(0,2.42,-.31);
    const cape=tube("trailing cloak",[0,-.72,-.12],.98,1.82,1.69,
      kind==="mago"?m.cape:kind==="espadachim"?m.red:m.wood,capePivot);
    cape.scaling.z=.67;
    const arms=[],legs=[];
    for(const side of [-1,1]){
      const legJoint=new B.TransformNode(name+" hip",scene);
      legJoint.parent=root;legJoint.position.set(side*.28,1.18,0);
      tube("leg",[0,-.49,0],.37,.31,.96,m.black,legJoint);
      cub("boot",[0,-1.03,.16],[.43,.34,.63],m.leather,legJoint);
      legs.push(legJoint);
      const armJoint=new B.TransformNode(name+" shoulder",scene);
      armJoint.parent=root;armJoint.position.set(side*.72,2.43,0);
      tube("sleeve",[0,-.51,0],.38,.29,1.02,clothing,armJoint);
      ball("glove",[0,-1.03,.02],.32,m.leather,armJoint);
      arms.push(armJoint);
      ball("shoulder plate",[side*.69,2.39,0],.53,kind==="espadachim"?m.stone:m.leather);
    }
    const rightArm=arms[1];
    if(kind==="mago"){
      tube("arcane staff",[.12,-.16,.5],.1,.14,3.17,m.wood,rightArm);
      const gem=ball("staff gem",[.12,1.43,.5],.52,m.lavender,rightArm);
      ball("staff halo",[.12,1.43,.5],.69,m.gold,rightArm).scaling.y=.22;
    }else if(kind==="espadachim"){
      cub("blade",[.12,-1.63,.45],[.18,1.9,.22],m.stone,rightArm);
      cub("crossguard",[.12,-.7,.45],[.68,.13,.22],m.gold,rightArm);
      cub("hilt",[.12,-.42,.45],[.14,.5,.19],m.leather,rightArm);
    }else{
      tube("hammer handle",[.12,-.38,.48],.14,.14,1.8,m.wood,rightArm);
      cub("hammer head",[.12,-1.28,.48],[1.02,.42,.52],m.darkStone,rightArm);
      cub("hammer cap",[.12,-1.05,.48],[.38,.12,.58],m.gold,rightArm);
    }
    root.metadata={rig:{arms,legs,capePivot,torso,baseY:torso.position.y},kind,bodyType,hairStyle};
    return root;
  }
  function animateActor(actor,seconds,moving=false){
    const rig=actor?.metadata?.rig;if(!rig)return;
    const stride=moving?Math.sin(seconds*11)*.64:0;
    rig.legs[0].rotation.x=stride;
    rig.legs[1].rotation.x=-stride;
    rig.arms[0].rotation.x=-stride*.65;
    rig.arms[1].rotation.x=stride*.45;
    rig.torso.position.y=rig.baseY+(moving?Math.abs(Math.sin(seconds*11))*.045:Math.sin(seconds*1.9)*.025);
    rig.capePivot.rotation.x=.09+Math.sin(seconds*(moving?8:1.7))*(moving?.13:.035);
    rig.capePivot.rotation.z=Math.sin(seconds*1.3)*.025;
  }
  function actorLabel(text,x,z,color="#f0dfb7"){
    const label=sign(text,x,z,color);
    return label;
  }
  function addNPC({id,name,x,z,story,kind="forjador"}){
    const root=makeActor(name,x,z,kind,m.skin1,m.hair1);
    root.scaling.scaleInPlace(.86);
    disc(name+" ring",x,z,1.05,m.npcRing,.09);
    interactables.push({id,name,x,z,root,story});
    actorLabel(name,x,z);
  }
  for(const npc of world.npcs)addNPC(npc);
  // A fauna hostil é um módulo independente do Babylon scene-building principal.
  const enemies=globalThis.RavenaEnemies.create({B,scene,materials:m,world,combat});
  const marker=B.MeshBuilder.CreateTorus("destination",{diameter:1.6,thickness:.075,tessellation:36},scene);
  marker.rotation.x=Math.PI/2;marker.position.y=.13;marker.material=m.gold;marker.setEnabled(false);
  const markerInner=disc("destination sparkle",0,0,.19,m.lavender,.14);
  markerInner.setEnabled(false);

  // Serviço de navegação intercambiável: no futuro será substituído por NavMesh.
  function route(start,end){
    return globalThis.RavenaNavigation.findPath(
      {x:start.x,z:start.z},{x:end.x,z:end.z},blocked
    ).map(p=>new B.Vector3(p.x,0,p.z));
  }
  function goto(x,z){
    if(!hero||dialogueOpen||fishing)return false;
    const start=hero.position, target=new B.Vector3(x,0,z);
    const candidate=route(start,target);
    if(!candidate.length){toast("Não foi possível traçar uma rota até este ponto.");return false;}
    path=candidate;marker.position.x=path[path.length-1].x;
    marker.position.z=path[path.length-1].z;
    markerInner.position.x=marker.position.x;markerInner.position.z=marker.position.z;
    marker.setEnabled(true);markerInner.setEnabled(true);
    nextInteraction=null;
    return true;
  }
  const damageRange=()=>combat.classDefinition(config?.kind).range;
  function showTarget(enemy){
    $("combat-target").classList.remove("hidden");
    $("target-name").textContent=enemy.label+" · Nv. "+enemy.level;
    $("target-hp").textContent=enemy.hp+" / "+enemy.maxHp;
    $("target-fill").style.width=(enemy.hp/enemy.maxHp*100)+"%";
    targetUntil=performance.now()+2900;
  }
  function strike(damage,range,title){
    const result=enemies.hit(hero.position.x,hero.position.z,range,damage,performance.now());
    if(!result.ok){toast(result.reason);return false;}
    enemies.ring(result.enemy.x,result.enemy.z,
      config.kind==="mago"?m.lavender:m.gold,performance.now(),460);
    showTarget(result.enemy);
    if(result.killed){
      if(result.reward)addItem(result.reward.key,result.reward.count);
      gainXP(result.xp);
      toast(title+" "+result.enemy.label+" derrotado! +"+result.xp+" XP"+
        (result.reward?" · Item coletado":""));
    }else toast(title+" "+result.enemy.label+": "+result.enemy.hp+" HP.");
    return true;
  }
  function attack(){
    if(!hero||dialogueOpen||fishing)return;
    const now=performance.now();
    if(now-lastAttackAt<650)return;
    if(strike(combat.classDefinition(config.kind).basic,damageRange(),"Ataque!"))
      lastAttackAt=now;
  }
  function special(){
    if(!hero||dialogueOpen||fishing)return;
    const now=performance.now();
    if(now-lastSpecialAt<2800){toast("Habilidade em recarga.");return;}
    if(mp<20){toast("Você precisa de 20 pontos de energia.");return;}
    const title={mago:"Explosão Arcana!",espadachim:"Corte Veloz!",forjador:"Golpe de Martelo!"}[config.kind];
    const skill=combat.classDefinition(config.kind);
    if(strike(skill.special,skill.specialRange,title)){
      mp-=20;lastSpecialAt=now;updateStats();save();
    }
  }
  function gainXP(amount){
    xp+=amount;while(xp>=level*100){xp-=level*100;level++;hp=100+level*15;mp=100+level*10;toast("Você subiu para o nível "+level+"!");}
    updateStats();save();
  }
  function updateStats(){
    $("player-name").textContent=config?.name??"Aventureiro";
    $("player-class").textContent=({mago:"Mago",espadachim:"Espadachim",forjador:"Forjador"}[config?.kind]??"") +" · Nível "+level;
    $("hp-text").textContent=Math.ceil(hp)+" / "+(100+Math.max(0,level-1)*15);
    $("mp-text").textContent=Math.floor(mp)+" / "+(100+Math.max(0,level-1)*10);
    $("hp-fill").style.width=(hp/(100+Math.max(0,level-1)*15)*100)+"%";
    $("mp-fill").style.width=(mp/(100+Math.max(0,level-1)*10)*100)+"%";
    $("xp-fill").style.width=(xp/(level*100)*100)+"%";
    $("xp-text").textContent=xp+" / "+(level*100);
  }
  function toast(message,seconds=3){
    $("toast").textContent=message;$("toast").classList.remove("hidden");toastUntil=performance.now()+seconds*1000;
  }
  function save(){
    if(!hero||!config)return;
    try{localStorage.setItem("ravena-online-alpha1",JSON.stringify({config,x:hero.position.x,z:hero.position.z,xp,level,quest,storySchema:world.schemaVersion,bag,totalFish,totalOre}));}catch{}
  }
  const bagCatalog=[
    ["ore","⛏","Minério bruto"],["dagger","⚔","Adaga forjada"],
    ["fur","🐾","Couro de lobo"],["essence","✧","Essência do Véu"],
    ["lambari","🐟","Lambari"],["tilapia","🐟","Tilápia"],
    ["carpa","🐠","Carpa"],["lendario","✦","Peixe lendário"]
  ];
  function renderBag(){
    const container=$("inventory-items");
    container.replaceChildren();
    let visible=0;
    for(const [key,icon,label] of bagCatalog){
      const count=bag[key]||0;if(!count)continue;
      visible++;
      const row=document.createElement("div");row.className="inventory-item";
      const a=document.createElement("div");a.className="inventory-symbol";a.textContent=icon;
      const b=document.createElement("div");b.className="inventory-title";b.textContent=label;
      const c=document.createElement("strong");c.className="inventory-quantity";c.textContent="× "+count;
      row.append(a,b,c);container.appendChild(row);
    }
    if(!visible){
      const empty=document.createElement("div");empty.className="inventory-empty";
      empty.textContent="A mochila está vazia. Explore o Lago e as Montanhas da Forja para encontrar recursos.";
      container.appendChild(empty);
    }
  }
  function toggleBag(force){
    const visible=force??$("inventory-panel").classList.contains("hidden");
    $("inventory-panel").classList.toggle("hidden",!visible);
    if(visible){atlas.close();renderBag();}
  }
  function addItem(key,count=1){
    if(!(key in bag))return;
    bag[key]=Math.max(0,(bag[key]||0)+count);
    renderBag();save();
  }
  function forgeAction(){
    if(!hero||dialogueOpen||fishing)return;
    const x=hero.position.x,z=hero.position.z,now=performance.now();
    const nearOre=oreNodes.find(n=>Math.hypot(x-n.x,z-n.z)<5);
    if(nearOre){
      if(now<nearOre.cooldownUntil){toast("Este veio foi minerado. Ele se recupera em alguns segundos.");return;}
      nearOre.cooldownUntil=now+17000;
      nearOre.shards.forEach(mesh=>mesh.setEnabled(false));
      const count=config.kind==="forjador"?3:2;
      addItem("ore",count);totalOre+=count;gainXP(7);
      advanceStory("mine:any");
      toast("Mineração concluída! +"+count+" minério · +7 XP");
      return;
    }
    if(Math.hypot(x-15,z-41)<8){
      if(bag.ore<3){toast("A forja precisa de 3 minérios. Procure os cristais nas montanhas.");return;}
      addItem("ore",-3);
      const count=config.kind==="forjador"?2:1;
      addItem("dagger",count);gainXP(18);
      advanceStory("craft:dagger");
      toast("Você forjou "+count+" adaga"+(count>1?"s":"")+"! +18 XP");
      return;
    }
    toast("Para minerar, aproxime-se de cristais nas montanhas; para forjar, vá até as brasas da oficina.");
  }
  function fishAction(){
    if(!hero||dialogueOpen)return;
    if(fishing){toast("Aguarde o peixe morder a isca.");return;}
    const x=hero.position.x,z=hero.position.z;
    if(x<29||x>40||Math.abs(z-1)>7){toast("Aproxime-se do píer do Lago da Mãe das Águas para pescar.");return;}
    path=[];marker.setEnabled(false);markerInner.setEnabled(false);
    fishing={end:performance.now()+2700,x:hero.position.x,z:hero.position.z};
    toast("Você lançou a linha... Observe a água!",2.6);
  }
  function finishFishing(){
    fishing=null;
    const roll=Math.random();
    const fish=roll<.48?["lambari","Lambari",7]:
      roll<.80?["tilapia","Tilápia",12]:
      roll<.975?["carpa","Carpa",19]:["lendario","Peixe lendário",65];
    addItem(fish[0],1);totalFish++;gainXP(fish[2]);
    advanceStory("fish:any");
    toast("Pescaria! Você capturou: "+fish[1]+" · +"+fish[2]+" XP",5);
  }
  // Progresso narrativo guiado por gatilhos com IDs estáveis do catálogo.
  // Não depende da profissão nem da ordem em que o jogador visita as cidades.
  function advanceStory(trigger){
    const stage=world.story.stages[quest];
    if(!stage)return false;
    const triggers=Array.isArray(stage.trigger)?stage.trigger:[stage.trigger];
    if(!triggers.includes(trigger))return false;
    quest++;
    gainXP(stage.xp);
    updateQuest();
    toast(stage.notice,5);
    save();
    return true;
  }
  function area(x,z){
    return world.regions.find(region=>{
      const b=region.bounds;
      return !!b && x>=b.minX && x<=b.maxX && z>=b.minZ && z<=b.maxZ;
    }) || world.regions.find(region=>region.id===world.start.region);
  }
  function updateZone(){
    if(!hero)return;
    const region=area(hero.position.x,hero.position.z);
    if(region.id!==currentZone){
      currentZone=region.id;
      $("zone").textContent=region.name;
      toast(region.name,2);
      advanceStory("enter:"+region.id);
      save();
    }
    const p=hero.position;
    if(atlas.visible)atlas.update(p.x,p.z,region.id);
    $("map-player").style.left=(50+p.x/90*40)+"%";
    $("map-player").style.top=(50+p.z/90*40)+"%";
  }
  function updateQuest(){
    const stage=world.story.stages[quest]||world.story.epilogue;
    $("quest-chapter").textContent="✧ "+world.story.chapterTitle.toUpperCase();
    $("quest-title").textContent=stage.title;
    $("quest-description").textContent=stage.description;
    if(!$("chronicle-panel").classList.contains("hidden"))
      globalThis.RavenaJournal?.render(quest,currentZone);
  }
  function talk(npc){
    if(!npc)return;
    dialogueOpen=true;path=[];marker.setEnabled(false);markerInner.setEnabled(false);
    $("npc-name").textContent=npc.name;$("npc-text").textContent=npc.story;
    $("dialogue").classList.remove("hidden");
    if(npc.id)advanceStory("talk:"+npc.id);
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
  $("button-help").addEventListener("click",()=>toast("Clique/toque: mover · M: mapa do mundo · E: NPC · J: crônicas · 1: ataque · 2: habilidade · 3: mochila · 4: forja · 5: pesca",7));
  $("button-map").addEventListener("click",()=>{
    toggleBag(false);
    $("settings-panel").classList.add("hidden");
    globalThis.RavenaJournal?.close();
    if(hero)atlas.update(hero.position.x,hero.position.z,currentZone);
    atlas.toggle();
  });
  function qualityUI(){
    const descriptions={
      leve:"Leve: resolução reduzida, sem sombras complexas ou brilho.",
      equilibrado:"Alta: sombras suaves, boa definição e renderização equilibrada.",
      ultra:"Ultra: definição máxima, sombras e brilho mágico adicional."
    };
    for(const button of document.querySelectorAll("[data-quality]")){
      const active=button.dataset.quality===visuals.quality;
      button.classList.toggle("selected",active);
      button.setAttribute("aria-pressed",String(active));
    }
    $("graphics-description").textContent=descriptions[visuals.quality];
  }
  qualityUI();
  document.querySelectorAll("[data-quality]").forEach(button=>button.addEventListener("click",()=>{
    visuals.apply(button.dataset.quality);qualityUI();
    toast("Qualidade: "+button.textContent.trim(),2);
  }));
  $("button-settings").addEventListener("click",()=>{
    const panel=$("settings-panel");panel.classList.toggle("hidden");
    if(!panel.classList.contains("hidden")){atlas.close();toggleBag(false);globalThis.RavenaJournal?.close();}
    qualityUI();
  });
  $("settings-close").addEventListener("click",()=>$("settings-panel").classList.add("hidden"));
  $("button-journal").addEventListener("click",()=>{
    atlas.close();toggleBag(false);
    globalThis.RavenaJournal?.toggle(quest,currentZone);
  });
  $("button-profile").addEventListener("click",()=>toast(config.name+" · "+config.kind+" · Nível "+level+" | "+totalFish+" peixes · "+totalOre+" minérios coletados.",5));
  $("button-inventory").addEventListener("click",()=>toggleBag());
  $("inventory-close").addEventListener("click",()=>toggleBag(false));
  document.querySelectorAll("[data-action]").forEach(button=>button.addEventListener("click",()=>{
    const action=button.dataset.action;
    if(action==="attack")attack();
    else if(action==="heal")special();
    else if(action==="inventory")toggleBag();
    else if(action==="forge")forgeAction();
    else if(action==="fish")fishAction();
  }));
  const classes=document.querySelectorAll(".class");
  let selected="mago",skin=0,hair=0,bodyType="feminino",hairStyle="longo";
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
  document.querySelectorAll("[data-body]").forEach(button=>button.addEventListener("click",()=>{
    bodyType=button.dataset.body;
    document.querySelectorAll("[data-body]").forEach(b=>b.classList.toggle("selected",b===button));
  }));
  document.querySelectorAll("[data-style]").forEach(button=>button.addEventListener("click",()=>{
    hairStyle=button.dataset.style;
    document.querySelectorAll("[data-style]").forEach(b=>b.classList.toggle("selected",b===button));
  }));
  const saved=(()=>{try{return JSON.parse(localStorage.getItem("ravena-online-alpha1")||"null")}catch{return null}})();
  if(saved?.config?.name)$("name").value=saved.config.name;
  if(["feminino","masculino"].includes(saved?.config?.bodyType)){
    bodyType=saved.config.bodyType;
    document.querySelectorAll("[data-body]").forEach(b=>b.classList.toggle("selected",b.dataset.body===bodyType));
  }
  if(["longo","curto","trancas"].includes(saved?.config?.hairStyle)){
    hairStyle=saved.config.hairStyle;
    document.querySelectorAll("[data-style]").forEach(b=>b.classList.toggle("selected",b.dataset.style===hairStyle));
  }
  if(["mago","espadachim","forjador"].includes(saved?.config?.kind)){
    selected=saved.config.kind;
    classes.forEach(b=>b.classList.toggle("selected",b.dataset.class===selected));
  }
  if([0,1,2].includes(saved?.config?.skin)){
    skin=saved.config.skin;
    document.querySelectorAll(".tone").forEach(b=>b.classList.toggle("selected",Number(b.dataset.tone)===skin));
  }
  if([0,1,2].includes(saved?.config?.hair)){
    hair=saved.config.hair;
    document.querySelectorAll(".hair").forEach(b=>b.classList.toggle("selected",Number(b.dataset.hair)===hair));
  }
  function start(){
    const name=$("name").value.trim();
    if(!/^[\p{L}\p{N}_]{3,16}$/u.test(name)){$("create-error").textContent="Use 3 a 16 letras, números ou _ no nome.";return;}
    config={name,kind:selected,skin,hair,bodyType,hairStyle};
    if(hero){hero.dispose();}
    hero=makeActor(name,0,-3,selected,m["skin"+skin],m["hair"+hair],config);
    const sameSaved=saved?.config?.name===name&&saved?.config?.kind===selected;
    if(sameSaved){level=Math.max(1,Number(saved.level)||1);xp=Math.max(0,Number(saved.xp)||0);quest=saved.storySchema===world.schemaVersion?
        Math.min(world.story.stages.length,Math.max(0,Number(saved.quest)||0)):0;
      bag=emptyBag();
      for(const key of Object.keys(bag))bag[key]=Math.max(0,Math.floor(Number(saved.bag?.[key])||0));
      totalFish=Math.max(0,Math.floor(Number(saved.totalFish)||0));
      totalOre=Math.max(0,Math.floor(Number(saved.totalOre)||0));
      if(Number.isFinite(saved.x)&&Number.isFinite(saved.z)&&!blocked(saved.x,saved.z))hero.position.set(saved.x,0,saved.z);}
    if(!sameSaved){level=1;xp=0;quest=0;bag=emptyBag();totalFish=0;totalOre=0;}
    hp=100+Math.max(0,level-1)*15;mp=100+Math.max(0,level-1)*10;
    renderBag();
    $("creation").classList.add("hidden");$("hud").classList.remove("hidden");
    updateStats();updateQuest();currentZone="";updateZone();save();
    toast("Bem-vindo a Azarath, "+name+"! Clique no chão para caminhar.",5);
  }
  $("start").addEventListener("click",start);
  window.addEventListener("keydown",e=>{
    if(!hero||["INPUT","TEXTAREA"].includes(document.activeElement?.tagName))return;
    if(e.key.toLowerCase()==="e")interact();
    if(e.key==="1")attack();
    if(e.key==="2")special();
    if(e.key==="3"||e.key.toLowerCase()==="i")toggleBag();
    if(e.key.toLowerCase()==="j"){
      atlas.close();toggleBag(false);globalThis.RavenaJournal?.toggle(quest,currentZone);
    }
    if(e.key.toLowerCase()==="m"){
      toggleBag(false);
      $("settings-panel").classList.add("hidden");
      globalThis.RavenaJournal?.close();
      atlas.update(hero.position.x,hero.position.z,currentZone);
      atlas.toggle();
    }
    if(e.key==="4")forgeAction();
    if(e.key==="5")fishAction();
    if(e.key==="Escape"){closeDialogue();toggleBag(false);globalThis.RavenaJournal?.close();atlas.close();$("settings-panel").classList.add("hidden");}
  });
  // Pointer only moves on a ground hit; picking characters can never teleport the player.
  let down=null;
  canvas.addEventListener("pointerdown",e=>down={x:e.clientX,y:e.clientY,t:performance.now()});
  canvas.addEventListener("pointerup",e=>{
    if(!hero||dialogueOpen||!down||fishing)return;
    if(e.pointerType==="mouse"&&e.button!==0){down=null;return;}
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
      down=null;
      const d=Math.hypot(e.touches[0].clientX-e.touches[1].clientX,e.touches[0].clientY-e.touches[1].clientY);
      if(pinch!==null)camera.radius=B.Scalar.Clamp(camera.radius+(pinch-d)*.04,18,48);
      pinch=d;
    }else pinch=null;
  },{passive:true});
  canvas.addEventListener("touchend",()=>pinch=null,{passive:true});
  // Continuous movement with per-frame time, obstacle safety and smooth camera.
  engine.runRenderLoop(()=>{
    const now=performance.now(),dt=Math.min((now-lastTime)/1000||.016,.05);lastTime=now;pulse+=dt;
    visuals.tick(dt);
    if(now-lastMove>1800){
      $("graphics-fps").textContent=Math.round(engine.getFps())+" FPS · "+visuals.quality.toUpperCase();
      lastMove=now;
    }
    if(hero){
      let didMove=false;
      if(path.length&&!dialogueOpen&&!fishing){
        const next=path[0],dx=next.x-hero.position.x,dz=next.z-hero.position.z,d=Math.hypot(dx,dz);
        const speed=config.kind==="espadachim"?7.1:6.7;
        const step=Math.min(d,speed*dt);
        if(d<=.09){path.shift();}
        else{
          const xx=hero.position.x+dx/d*step,zz=hero.position.z+dz/d*step;
          if(!blocked(xx,zz,.12)){
            hero.position.x=xx;hero.position.z=zz;
            didMove=true;
            const angle=Math.atan2(dx,dz);
            let delta=(angle-hero.rotation.y+3*Math.PI)%(2*Math.PI)-Math.PI;
            hero.rotation.y+=delta*Math.min(1,dt*9);
          }else {path=[];toast("Caminho obstruído.");}
        }
        if(!path.length){marker.setEnabled(false);markerInner.setEnabled(false);}
      }
      animateActor(hero,pulse,didMove);
      if(fishing){
        if(hero.metadata?.rig)hero.metadata.rig.arms[1].rotation.x=-.85;
        if(now>=fishing.end)finishFishing();
      }
      const target=new B.Vector3(hero.position.x,1.6,hero.position.z);
      camera.target=B.Vector3.Lerp(camera.target,target,Math.min(1,dt*5));
      if(marker.isEnabled()){marker.rotation.z=pulse*.9;marker.scaling.setAll(1+Math.sin(pulse*5)*.09);}
      updateZone();
      const nearby=interactables.some(n=>Math.hypot(n.x-hero.position.x,n.z-hero.position.z)<4.6);
      $("interaction").classList.toggle("hidden",!nearby||dialogueOpen);
      if(now-lastSave>12000){save();lastSave=now;}
    }else camera.target=B.Vector3.Lerp(camera.target,new B.Vector3(0,1.6,0),Math.min(1,dt*3));
    const heroPosition=hero?{x:hero.position.x,z:hero.position.z}:null;
    const zone=hero?area(hero.position.x,hero.position.z):null;
    enemies.tick(dt,now,heroPosition,zone,(damage,mob)=>{
      if(!hero||dialogueOpen)return;
      hp=Math.max(0,hp-damage);
      lastEnemyHit=now;
      enemies.ring(hero.position.x,hero.position.z,m.fire,now,340);
      updateStats();
      if(hp<=0){
        path=[];fishing=null;marker.setEnabled(false);markerInner.setEnabled(false);
        hero.position.set(world.start.x,0,world.start.z);
        hp=100+Math.max(0,level-1)*15;
        mp=100+Math.max(0,level-1)*10;
        toast("Você desmaiou diante de "+mob.label+" e retornou à Capital. Seu progresso foi preservado.",6);
        save();
      }else toast(mob.label+" atingiu você: -"+damage+" de vida.",2);
    });
    enemies.animateEffects(now);
    if(targetUntil&&now>targetUntil){
      $("combat-target").classList.add("hidden");targetUntil=0;
    }
    for(const npc of interactables)animateActor(npc.root,pulse*.72+npc.x*.5,false);
    for(const r of waterRipples){
      const phase=pulse*.52+r.offset;
      const scale=1+(phase%2.5)*.55;
      r.mesh.scaling.set(scale,1,scale);
      r.mesh.position.y=.12+Math.sin(phase*2)*.018;
    }
    for(const node of oreNodes){
      if(node.cooldownUntil&&now>=node.cooldownUntil){
        node.shards.forEach(mesh=>mesh.setEnabled(true));
        node.cooldownUntil=0;
      }
    }
    if(hero&&now-lastHudTick>500){
      if(mp<100+Math.max(0,level-1)*10)
        mp=Math.min(100+Math.max(0,level-1)*10,mp+1.25);
      if(now-lastEnemyHit>7000&&hp<100+Math.max(0,level-1)*15)
        hp=Math.min(100+Math.max(0,level-1)*15,hp+(zone?.kind==="city"?2:1));
      updateStats();lastHudTick=now;
    }
    if(toastUntil&&now>toastUntil){$("toast").classList.add("hidden");toastUntil=0;}
    scene.render();
  });
  window.addEventListener("resize",()=>engine.resize());
  window.addEventListener("beforeunload",save);
})();