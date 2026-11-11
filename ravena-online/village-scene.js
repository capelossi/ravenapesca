// Ravena Online — Fase 1.3, cenografia modular da Vila das Marés.
// A arquitetura, a costa e o píer podem ser substituídos por GLB/chunks depois.
(() => {
  function create({B,scene,m,box,cyl,sphere,disc,roof,sign,tree,marketStall,
    obstacle,obstacleBox,waterRipples,layout}){
    if(!layout?.data || !layout.isLakeBlocked)throw Error("Mapa da Vila das Marés ausente");
    const v=layout.data,created=[];
    const make=(name,pos,size,material)=>{
      const obj=box("vila "+name,pos,size,material);
      obj.metadata={...(obj.metadata||{}),village:true};
      return obj;
    };
    // Praia: região rasa é apenas decorativa; a colisão protege a lagoa inteira.
    const water=v.water;
    disc("vila praia arenosa",water.x,water.z,water.shoreRadius,m.sand,.043);
    disc("vila agua principal",water.x,water.z,water.outerRadius,m.water,.053);
    disc("vila agua translúcida",water.x,water.z,water.innerRadius,m.water2,.057);
    const beachRing=B.MeshBuilder.CreateTorus("vila aro de margem",{
      diameter:water.shoreRadius*2-.2,thickness:.19,tessellation:64
    },scene);
    beachRing.rotation.x=Math.PI/2;beachRing.position.set(water.x,.08,water.z);
    beachRing.material=m.sand;beachRing.isPickable=false;
    // Fina linha de espuma, sem discos translúcidos excessivamente claros.
    const foamMaterial=new B.StandardMaterial("vila espuma discreta",scene);
    foamMaterial.diffuseColor=new B.Color3(.53,.69,.64);
    foamMaterial.emissiveColor=new B.Color3(.06,.09,.09);
    foamMaterial.specularColor=new B.Color3(.06,.12,.12);
    foamMaterial.alpha=.46;
    const foam=B.MeshBuilder.CreateTorus("vila espuma da margem",{
      diameter:water.outerRadius*2-.25,thickness:.21,tessellation:72
    },scene);
    foam.rotation.x=Math.PI/2;
    foam.position.set(water.x,.087,water.z);
    foam.material=foamMaterial;foam.isPickable=false;
    // Pedras e arbustos baixos na margem externa, sem colisão extra.
    for(let i=0;i<17;i++){
      const angle=i*Math.PI*2/17;
      if(Math.abs(angle-Math.PI)<.30)continue; // espaço do píer
      const r=water.shoreRadius+.25+(i%3)*.34;
      const x=water.x+Math.cos(angle)*r,z=water.z+Math.sin(angle)*r;
      const stone=sphere("vila seixos da margem",[x,.17,z],.40+(i%4)*.10,
        i%3===0?m.sand:m.darkStone);
      stone.scaling.y=.35;stone.isPickable=false;
    }

    // A água só possui passarela no corredor exato do píer, nunca no lago inteiro.
    const pier=v.pier;
    for(let i=0;i<pier.plankCount;i++){
      const x=pier.startX+(pier.endX-pier.startX)*i/(pier.plankCount-1);
      make("tabua do pier",[x,.27,pier.z],[1.75,.29,pier.halfWidth*2],m.wood);
      if(i===0||i===2||i===4||i===pier.plankCount-1){
        for(const edge of [-1,1])
          cyl("vila poste do pier",[x,.55,pier.z+edge*(pier.halfWidth+.15)],
            .26,.32,1.2,m.trunk,8);
      }
    }
    for(const x of [33,37,41])
      make("borda do cais",[x,.49,pier.z-2.1],[2.4,.09,.12],m.gold);
    sign("CAIS DA MÃE DAS ÁGUAS",33,-2.5,"#b5e7e8");

    // Cidade ao lado do lago: fachadas diferentes por serviço e volume.
    for(const b of v.buildings){
      const {x,z,width:w,depth:d,height:h,id}=b;
      const roofMat=b.roof==="blue"?m.roofDark:m.roof;
      make(id+" alvenaria",[x,h/2,z],[w,h,d],m.stone);
      make(id+" fundacao",[x,.25,z],[w+.5,.5,d+.5],m.darkStone);
      for(const side of [-1,1]){
        make(id+" coluna frontal",[x+side*(w/2-.17),h/2,z+d/2+.1],
          [.27,h,.22],m.beams);
        make(id+" coluna posterior",[x+side*(w/2-.17),h/2,z-d/2-.1],
          [.27,h,.22],m.beams);
        make(id+" janela",[x+side*w*.27,h*.62,z+d/2+.115],
          [.78,.96,.13],m.gold);
        make(id+" persiana",[x+side*w*.27,h*.84,z+d/2+.16],
          [.88,.15,.15],m.wood);
      }
      make(id+" friso",[x,h*.8,z+d/2+.12],[w+.1,.17,.18],m.wood);
      make(id+" porta",[x,1.35,z+d/2+.16],[1.37,2.7,.17],m.wood);
      make(id+" soleira",[x,.18,z+d/2+.7],[2.5,.23,1.15],m.stone);
      roof(x,z,w,d,h,roofMat);
      // Individualized silhouettes for civic/commercial buildings.
      if(b.kind==="townhall"){
        cyl("vila torreta da prefeitura",[x,h+1.05,z-d*.12],1.2,1.55,2.1,m.stone,10);
        cyl("vila haste prefeitura",[x,h+2.5,z-d*.12],.1,.13,1.4,m.wood,6);
        make("vila bandeira prefeitura",[x+.5,h+2.75,z-d*.12],
          [1.15,.68,.1],m.red);
      }
      if(b.kind==="inn"){
        make("vila placa pousada",[x+w*.38,3.3,z+d/2+.31],[.9,.75,.15],m.gold);
      }
      if(b.kind==="warehouse"){
        for(const off of [-1.2,0,1.2])
          make("vila carga",[x+off,.65,z+d/2+1.05],[.65,1.1,.68],m.wood);
      }
      if(b.kind==="workshop"){
        make("vila cavalete",[x+w*.33,.74,z+d/2+1.3],[1.45,.19,1.1],m.wood);
      }
      if(b.kind==="homes"){
        for(const side of [-1,1])
          make("vila varal",[x+side*1.45,2.15,z+d/2+.24],[.08,1.4,.08],m.wood);
      }
      obstacleBox(x,z,w,d);
      sign(b.name.toUpperCase(),b.approach.x,b.approach.z,"#c5eef0");
      created.push({id:b.id,x,z,approach:b.approach});
    }

    // Praça das Redes: círculo não bloqueante e peças reconhecíveis para orientação.
    const plaza=B.MeshBuilder.CreateCylinder("Vila Praça das Redes",{
      diameter:v.plaza.radius*2,height:.10,tessellation:40
    },scene);
    plaza.position.set(v.plaza.x,.13,v.plaza.z);
    plaza.material=m.road;plaza.isPickable=false;
    const plazaRing=B.MeshBuilder.CreateTorus("Vila anel da praça",{
      diameter:v.plaza.radius*2-.65,thickness:.13,tessellation:40
    },scene);
    plazaRing.rotation.x=Math.PI/2;
    plazaRing.position.set(v.plaza.x,.21,v.plaza.z);
    plazaRing.material=m.gold;plazaRing.isPickable=false;
    // Notice board next to the plaza, without an obstacle collision.
    const board=v.noticeBoard;
    for(const side of [-1,1])
      make("poste de avisos",[board.x+side*.75,1.25,board.z],[.13,2.5,.17],m.wood);
    make("quadro de avisos",[board.x,2.25,board.z],[1.95,1.25,.16],m.wood);
    make("carta de navegacao",[board.x,2.28,board.z+.10],[1.55,.8,.05],m.white);
    sign("PRAÇA DAS REDES",v.plaza.x,v.plaza.z-6,"#e9d4b2");

    // Market stalls are modular and do not mutate unrelated city geometry.
    marketStall(v.market.x,v.market.z,m.roofDark);
    for(const stall of v.fishStalls)
      marketStall(stall.x,stall.z,stall.awning==="blue"?m.roofDark:m.roof);
    sign("MERCADO DO SAL",v.market.x,v.market.z-6,"#bfe8e1");
    for(const p of v.decorations.barrels){
      cyl("vila barril",[p.x,.5,p.z],.62,.72,1.0,m.wood,10);
      make("aro de barril",[p.x,.93,p.z],[.76,.1,.76],m.black);
    }
    for(const n of v.decorations.nets){
      make("vila rede de pesca",[n.x,.095,n.z],[2.2,.035,1.05],m.sand);
      for(const side of [-1,1])
        cyl("vila boia",[n.x+side*.84,.26,n.z],.22,.27,.4,m.red,8);
    }

    // Farol das Marés: destaque de navegação e da história principal.
    const light=v.lighthouse;
    cyl("vila farol base",[light.x,3,light.z],3.7,4.8,6,m.stone,12);
    cyl("vila farol sacada",[light.x,6.35,light.z],5.4,5.4,.65,m.roofDark,12);
    cyl("vila farol lanterna",[light.x,7.2,light.z],2.25,2.25,.95,m.gold,10);
    cyl("vila farol teto",[light.x,8.02,light.z],.08,5.15,1.15,m.roofDark,12);
    cyl("vila farol haste",[light.x,8.9,light.z],.09,.09,.65,m.wood,8);
    obstacle(light.x,light.z,light.radius);
    for(let i=0;i<8;i++){
      const theta=i*Math.PI/4;
      const x=light.x+Math.cos(theta)*2.15,z=light.z+Math.sin(theta)*2.15;
      cyl("vila balaustre farol",[x,6.83,z],.12,.12,.82,m.black,7);
    }
    sign("FAROL DAS MARÉS",light.approach.x,light.approach.z,"#aee8ec");

    // Boats: decorative silhouettes on the lake, no misleading interactable controls.
    for(const boat of v.boats){
      const hull=make("barco de pesca casco",[boat.x,.2,boat.z],[2.2,.52,4.35],m.wood);
      hull.rotation.y=boat.rotation;
      const keel=make("barco borda",[boat.x,.56,boat.z],[2.42,.18,4.55],m.beams);
      keel.rotation.y=boat.rotation;
      cyl("barco mastro",[boat.x,1.25,boat.z],.12,.14,2.45,m.trunk,8);
      const sail=make("barco vela",[boat.x+.53,1.40,boat.z],[1.30,1.35,.08],m.white);
      sail.rotation.y=boat.rotation;
    }

    // Visual ambience: just a few trees, no crowded route blocking.
    for(const degrees of [-85,-56,-32,0,33,65,84]){
      const angle=degrees*Math.PI/180;
      const x=water.x+Math.cos(angle)*25.5;
      const z=water.z+Math.sin(angle)*25.5;
      tree(x,z,.60);
    }
    for(let i=0;i<6;i++){
      const angle=i*Math.PI/3;
      const ripple=B.MeshBuilder.CreateTorus("vila ondas de agua",{
        diameter:1.55,thickness:.035,tessellation:24
      },scene);
      ripple.position.set(water.x+Math.cos(angle)*11,.12,
        water.z+Math.sin(angle)*11);
      ripple.material=m.water2;ripple.isPickable=false;
      waterRipples.push({mesh:ripple,offset:i*.7});
    }
    for(const lamp of v.lamps){
      cyl("vila lampiao poste",[lamp.x,1.95,lamp.z],.14,.18,3.9,m.black,7);
      sphere("vila lampiao brilho",[lamp.x,4,lamp.z],.59,m.gold);
    }
    return Object.freeze({
      buildings:created,piers:1,lighthouse:light.id,boats:v.boats.length,
      districtCount:v.buildings.length,waterCollision:layout.isLakeBlocked
    });
  }
  globalThis.RavenaVillageScene=Object.freeze({create});
})();
