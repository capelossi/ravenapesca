// Ravena Online — monumentos do PescaVena e interior do Templo do Crepúsculo.
// Mundo e templo são renderizados em camadas distintas pela mesma cena Babylon.
(() => {
  const WORLD_MASK=0x01000000,TEMPLE_MASK=0x02000000;
  const TEMPLE=Object.freeze({
    id:"templo-do-crepusculo",name:"Templo do Crepúsculo",
    center:{x:0,z:-140},spawn:{x:0,z:-129},
    entrance:{x:-35,z:-24},exit:{x:0,z:-128},altar:{x:0,z:-142},
    statue:{x:0,z:-151.8},
    bounds:{minX:-11,maxX:11,minZ:-154,maxZ:-125}
  });
  const MOTHER=Object.freeze({x:55,z:1,monumentRadius:3.4,lookout:{x:33,z:12}});
  function create({B,scene,camera,m,sign}){
    if(!B||!scene||!camera)throw Error("Monumentos: Babylon/câmera ausentes.");
    // All existing overworld geometry and NPC visuals are visible only in world.
    // The player is constructed later and keeps the Babylon default (both masks).
    for(const mesh of scene.meshes)mesh.layerMask=WORLD_MASK;
    const stone=(name,hex,emissive)=>{
      const mat=new B.StandardMaterial(name,scene);
      mat.diffuseColor=B.Color3.FromHexString(hex);
      mat.ambientColor=mat.diffuseColor.scale(.35);
      mat.specularColor=new B.Color3(.14,.13,.17);
      if(emissive)mat.emissiveColor=B.Color3.FromHexString(emissive);
      return mat;
    };
    const slate=stone("templo basalto","#282439");
    const wall=stone("templo arcadas","#3a3547");
    const obsidian=stone("templo obelisco","#201b2e");
    const violet=stone("templo magia violeta","#8d51c7","#492469");
    const warm=stone("templo chama","#bf89dc","#724a99");
    const ivory=stone("monumento pedra azulada","#9aa8ac");
    const silver=stone("monumento prata","#75838f");
    const deep=stone("monumento sombras","#4a5966");
    const gold=stone("templo filigrana","#b89670","#3c2a16");
    function setLayer(mesh,layer,pickable=false){
      mesh.layerMask=layer;mesh.isPickable=pickable;
      return mesh;
    }
    function box(label,x,y,z,w,h,d,material,layer){
      const mesh=B.MeshBuilder.CreateBox(label,{width:w,height:h,depth:d},scene);
      mesh.position.set(x,y,z);mesh.material=material;
      return setLayer(mesh,layer);
    }
    function cyl(label,x,y,z,top,bottom,height,material,layer,sides=12){
      const mesh=B.MeshBuilder.CreateCylinder(label,{
        diameterTop:top,diameterBottom:bottom,height,tessellation:sides
      },scene);
      mesh.position.set(x,y,z);mesh.material=material;
      return setLayer(mesh,layer);
    }
    function orb(label,x,y,z,d,material,layer){
      const mesh=B.MeshBuilder.CreateSphere(label,{diameter:d,segments:12},scene);
      mesh.position.set(x,y,z);mesh.material=material;
      return setLayer(mesh,layer);
    }
    function ring(label,x,y,z,diameter,thickness,material,layer,vertical=false){
      const mesh=B.MeshBuilder.CreateTorus(label,{
        diameter,thickness,tessellation:32
      },scene);
      mesh.position.set(x,y,z);mesh.material=material;
      if(vertical)mesh.rotation.x=Math.PI/2;
      return setLayer(mesh,layer);
    }
    // Approved legacy illustration: exact image when its .b64 file is present.
    // The low-poly 3D sculpture stays visible until the image loads successfully.
    function imageBillboard(name,file,x,y,z,width,height,layer,fallback){
      const plane=B.MeshBuilder.CreatePlane(name,{width,height},scene);
      plane.position.set(x,y,z);
      plane.billboardMode=B.Mesh.BILLBOARDMODE_ALL;
      setLayer(plane,layer);
      plane.setEnabled(false);
      Promise.resolve().then(()=>fetch("assets/legacy/"+file,{cache:"force-cache"}))
        .then(response=>{
          if(!response.ok)throw Error("HTTP "+response.status);
          return response.text();
        })
        .then(raw=>{
          const encoded=raw.trim();
          if(!/^[A-Za-z0-9+/=\r\n]+$/.test(encoded)||encoded.length<500)
            throw Error("Ilustração original inválida");
          const mat=new B.StandardMaterial("ilustração "+name,scene);
          mat.diffuseColor=new B.Color3(1,1,1);
          mat.emissiveColor=new B.Color3(.65,.65,.65);
          mat.disableLighting=true;
          mat.backFaceCulling=false;
          mat.useAlphaFromDiffuseTexture=true;
          const tex=new B.Texture("data:image/webp;base64,"+encoded,scene,
            true,false,B.Texture.TRILINEAR_SAMPLINGMODE,
            ()=>{plane.material=mat;plane.setEnabled(true);fallback.forEach(x=>x.setEnabled(false));},
            ()=>{console.warn("Arte original indisponível: "+name)});
          tex.hasAlpha=true;
          mat.diffuseTexture=tex;
        })
        .catch(err=>console.warn("Usando escultura 3D provisória para "+name+": "+err.message));
      return plane;
    }
    // Mãe das Águas no coração do lago, sobre base submersa e SEM ilha transitável,
    // igual à composição V6.4.36 aprovada no ZIP legado.
    const motherFallback=[];
    cyl("mae pedestal submerso",MOTHER.x,.20,MOTHER.z,8.1,9.5,.34,slate,WORLD_MASK);
    cyl("mae degrau pedestal",MOTHER.x,.42,MOTHER.z,7.8,8.45,.34,silver,WORLD_MASK);
    cyl("mae base de pedra",MOTHER.x,.78,MOTHER.z,6.5,7.6,.5,ivory,WORLD_MASK);
    for(let i=0;i<8;i++){
      const angle=i*Math.PI/4;
      orb("mae cristal azul",MOTHER.x+Math.cos(angle)*3.3,.86,
        MOTHER.z+Math.sin(angle)*3.3,.45,violet,WORLD_MASK);
    }
    const torso=cyl("mae corpo escultura",MOTHER.x,3.15,MOTHER.z,1.85,3.5,3.2,ivory,WORLD_MASK);
    motherFallback.push(torso);
    motherFallback.push(orb("mae cabeca",MOTHER.x,5.08,MOTHER.z,.95,ivory,WORLD_MASK));
    motherFallback.push(orb("mae crianca",MOTHER.x+.58,3.76,MOTHER.z+.65,.85,silver,WORLD_MASK));
    for(const side of [-1,1]){
      const arm=cyl("mae braco abraço",MOTHER.x+side*.58,3.5,MOTHER.z+.37,.35,.45,1.5,ivory,WORLD_MASK);
      arm.rotation.z=side*.32;motherFallback.push(arm);
    }
    motherFallback.push(ring("mae aura halo",MOTHER.x,5.55,MOTHER.z,2.8,.09,violet,WORLD_MASK,true));
    imageBillboard("Mãe das Águas — escultura aprovada","mae-das-aguas-v6436.webp.b64",
      MOTHER.x,4.38,MOTHER.z,7.2,8.65,WORLD_MASK,motherFallback);
    // Small magic effects are static for mobile performance.
    for(let i=0;i<5;i++){
      const a=i*2*Math.PI/5;
      const x=MOTHER.x+3.2*Math.cos(a),z=MOTHER.z+3.2*Math.sin(a);
      cyl("cascata da mãe",x,.34,z,.17,.35,.44,silver,WORLD_MASK);
    }

    // Forest portal: the player must walk to it. No remote instant travel.
    const entry=TEMPLE.entrance;
    for(const s of [-1,1])
      cyl("portal pedra do crepusculo",entry.x+s*1.45,1.68,entry.z,
        .75,.95,3.25,slate,WORLD_MASK);
    box("portal lintel",entry.x,3.46,entry.z,3.9,.58,.8,obsidian,WORLD_MASK);
    const worldRing=ring("portal Ravena exterior",entry.x,1.8,entry.z,
      2.82,.22,violet,WORLD_MASK,true);
    const portalCore=orb("portal energia exterior",entry.x,1.86,entry.z,.71,violet,WORLD_MASK);
    const portalSign=sign("PORTAL DO CREPÚSCULO",entry.x,entry.z-3.8,"#d8a2f0");
    portalSign.layerMask=WORLD_MASK;
    // Forest portal is safe to approach: no solid collision across the opening.
    const floor=B.MeshBuilder.CreateGround("chao Templo do Crepusculo",{
      width:28,height:36,subdivisions:2
    },scene);
    floor.position.set(TEMPLE.center.x,.025,TEMPLE.center.z);
    floor.material=slate;
    floor.receiveShadows=true;
    floor.metadata={ground:true,sanctuary:true};
    setLayer(floor,TEMPLE_MASK,true);
    // Temple interior: spatially separated, isolated with the camera layer mask.
    box("templo parede ocidental",-13,3,TEMPLE.center.z,.75,6.1,36,wall,TEMPLE_MASK);
    box("templo parede oriental",13,3,TEMPLE.center.z,.75,6.1,36,wall,TEMPLE_MASK);
    box("templo parede fundo",0,3,-158,26,.6,1,obsidian,TEMPLE_MASK);
    for(const x of [-9,9]){
      for(const z of [-152,-143,-134,-126]){
        cyl("templo coluna",x,2.45,z,.83,1.04,4.9,wall,TEMPLE_MASK,10);
        cyl("templo capital coluna",x,5.05,z,1.7,1.7,.5,gold,TEMPLE_MASK,10);
      }
    }
    for(const z of [-152,-145,-138,-131]){
      box("templo passarela",0,.105,z,7.4,.12,5.7,wall,TEMPLE_MASK);
      for(const side of [-1,1]){
        box("templo detalhe passarela",side*3.3,.19,z,.13,.07,5.6,gold,TEMPLE_MASK);
      }
    }
    for(const z of [-152,-142,-132]){
      ring("templo mosaico",0,.205,z,4.1,.12,violet,TEMPLE_MASK);
    }
    // Gothic arch and small stained-glass panels.
    for(const x of [-10.4,10.4]){
      for(const z of [-149,-137,-128]){
        box("templo janela vitral",x,3,z,.12,2.0,1.2,violet,TEMPLE_MASK);
        ring("templo brasa janela",x*.98,3.2,z,1.25,.08,gold,TEMPLE_MASK,true);
      }
    }
    // Statue is behind the altar, avoiding contact while preserving framing.
    cyl("altar patamar",0,.42,-149,8.3,8.9,.82,obsidian,TEMPLE_MASK,12);
    cyl("altar pedra",0,1.06,-148.5,4.9,5.4,.55,wall,TEMPLE_MASK,12);
    const ravenaFallback=[];
    ravenaFallback.push(cyl("ravena manto",0,3.12,-152,1.5,3.7,3.4,slate,TEMPLE_MASK));
    ravenaFallback.push(orb("ravena capuz",0,5.2,-152,.94,obsidian,TEMPLE_MASK));
    ravenaFallback.push(orb("ravena orb violeta",0,3.73,-151.15,.63,violet,TEMPLE_MASK));
    for(const side of [-1,1]){
      const sleeve=cyl("ravena manga",side*.83,3.45,-151.9,.36,.52,1.5,wall,TEMPLE_MASK);
      sleeve.rotation.z=side*.30;ravenaFallback.push(sleeve);
    }
    imageBillboard("Estátua da Ravena — arte legada","ravena-estatua-v6431.webp.b64",
      0,4.1,-152.2,7.45,7.5,TEMPLE_MASK,ravenaFallback);
    const offering=ring("circulo altar oferendas",0,1.4,-148.35,3.6,.12,violet,TEMPLE_MASK);
    const centerOrb=orb("altar magia",0,1.6,-148.45,.48,violet,TEMPLE_MASK);
    for(const x of [-4.7,4.7]){
      cyl("templo lampadario",x,1.25,-145.7,.65,.88,2.3,wall,TEMPLE_MASK);
      orb("templo brasa violeta",x,2.55,-145.7,.45,warm,TEMPLE_MASK);
    }
    // Exit portal at the south end of the interior.
    for(const x of [-1.25,1.25])
      cyl("templo portal coluna",x,1.6,TEMPLE.exit.z,.65,.73,3.2,wall,TEMPLE_MASK);
    ring("templo portal de saida",0,1.76,TEMPLE.exit.z,2.65,.18,violet,TEMPLE_MASK,true);
    const exitOrb=orb("templo saida luz",0,1.9,TEMPLE.exit.z,.65,warm,TEMPLE_MASK);
    // Camera-only separation; no duplicated NPCs or overworld meshes in temple.
    function setInterior(inside){
      camera.layerMask=inside?TEMPLE_MASK:WORLD_MASK;
    }
    function blockedInside(x,z,pad=.35){
      const b=TEMPLE.bounds;
      if(x<b.minX+pad||x>b.maxX-pad||z<b.minZ+pad||z>b.maxZ-pad)return true;
      // Do not step through the altar/pedestal; the interaction point is in front.
      if(Math.hypot(x,z+149)<2.9+pad)return true;
      return false;
    }
    function animate(now){
      const t=now*.001;
      worldRing.scaling.setAll(1+Math.sin(t*2.5)*.048);
      portalCore.scaling.setAll(1+Math.sin(t*3.1)*.11);
      offering.scaling.setAll(1+Math.sin(t*1.8)*.04);
      centerOrb.position.y=1.6+Math.sin(t*1.6)*.15;
      exitOrb.scaling.setAll(1+Math.sin(t*2)*.09);
    }
    setInterior(false);
    return Object.freeze({
      temple:TEMPLE,mother:MOTHER,worldMask:WORLD_MASK,templeMask:TEMPLE_MASK,
      setInterior,blockedInside,animate
    });
  }
  globalThis.RavenaMonuments=Object.freeze({create,TEMPLE,MOTHER,WORLD_MASK,TEMPLE_MASK});
})();
