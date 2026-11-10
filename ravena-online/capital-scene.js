// Ravena Online — montagem visual do greybox da Capital.
// Sem dependências de missões/combate. Na produção, substituir fachadas por GLB.
(() => {
  function create({B,scene,m,box,cyl,sphere,roof,sign,marketStall,layout}){
    if(!layout?.buildings || !layout?.avenues)throw Error("Layout da Capital indisponível");
    const summaries=[];
    const named=(label,where,dims,material)=>{
      const mesh=box(label,where,dims,material);
      mesh.metadata={...(mesh.metadata||{}),capital:true};
      return mesh;
    };
    const roadMaterial=m.road;
    const trims=m.gold;
    for(const way of layout.avenues){
      named("azareth avenue "+way.id,[way.x,.11,way.z],
        [way.width,.11,way.depth],roadMaterial);
    }
    for(const plaza of layout.plazas){
      const floor=B.MeshBuilder.CreateCylinder("azareth plaza "+plaza.id,{
        diameter:plaza.radius*2,height:.07,tessellation:32
      },scene);
      floor.position.set(plaza.x,.13,plaza.z);
      floor.material=m.road;floor.isPickable=false;
      floor.metadata={capital:true,district:plaza.id};
      const ring=B.MeshBuilder.CreateTorus("azareth plaza border "+plaza.id,{
        diameter:plaza.radius*2-.5,thickness:.11,tessellation:42
      },scene);
      ring.rotation.x=Math.PI/2;ring.position.set(plaza.x,.185,plaza.z);
      ring.material=m.gold;ring.isPickable=false;
    }
    function building(entry){
      const {id,x,z,width:w,depth:d,height:h}=entry;
      const roofMaterial=entry.roof==="blue"?m.roofDark:m.roof;
      // A large single collision circle keeps the approach clear. The door is
      // external: interior loading belongs to a later production milestone.
      const base=named("azareth "+id+" walls",[x,h/2,z],[w,h,d],m.stone);
      base.metadata={capital:true,id};
      // Main obstacle is inserted in the caller, not for every decorative beam.
      named(id+" plinth",[x,.27,z],[w+.7,.52,d+.7],m.darkStone);
      named(id+" cornice",[x,h-.25,z],[w+.22,.31,d+.15],m.wall);
      for(const side of [-1,1]){
        named(id+" front corner",[x+side*(w/2-.18),h/2,z+d/2+.06],[.29,h,.23],m.beams);
        named(id+" back corner",[x+side*(w/2-.18),h/2,z-d/2-.06],[.29,h,.23],m.beams);
        named(id+" side upper beam",[x+side*(w/2-.06),h*.73,z],[.18,.17,d],m.beams);
        named(id+" front window",[x+side*w*.30,h*.57,z+d/2+.095],
          [.82,1.12,.15],m.gold);
        named(id+" window ledge",[x+side*w*.30,h*.32,z+d/2+.14],
          [1.05,.16,.27],m.darkStone);
        named(id+" side window",[x+side*(w/2+.07),h*.56,z-d*.12],
          [.16,.93,.78],m.gold);
      }
      // Decorative door, not a clickable portal yet.
      named(id+" main doorway",[x,1.55,z+d/2+.11],[1.47,3,.18],m.wood);
      named(id+" door frame",[x,3.06,z+d/2+.15],[1.88,.2,.24],m.gold);
      for(const side of [-1,1])
        named(id+" door pillar",[x+side*.87,1.5,z+d/2+.14],[.17,2.9,.22],m.gold);
      named(id+" door handle",[x+.39,1.65,z+d/2+.25],[.13,.18,.13],m.gold);
      roof(x,z,w,d,h,roofMaterial);
      if(entry.kind==="council"){
        // Higher civic profile: two corner watchlets and vertical finials.
        for(const side of [-1,1]){
          cyl("palace tower "+side,[x+side*(w*.43),h+.65,z-d*.22],
            1.55,1.75,2.1,m.stone,10);
          cyl("palace finial "+side,[x+side*(w*.43),h+2.15,z-d*.22],
            .12,1.75,1.3,m.gold,10);
        }
      }
      if(entry.kind==="guild"){
        for(const side of [-1,1]){
          named(id+" standard pole",[x+side*(w*.36),4.1,z+d/2+.3],[.13,3.2,.13],m.wood);
          named(id+" guild pennant",[x+side*(w*.36),4.65,z+d/2+.38],
            [1.12,1.65,.1],m.red);
        }
      }
      if(entry.kind==="inn"){
        named(id+" hanging sign beam",[x+w*.27,3.8,z+d/2+.4],[1.05,.13,.15],m.wood);
        named(id+" hanging placard",[x+w*.40,3.2,z+d/2+.47],[.8,.75,.12],m.gold);
      }
      // Entrance apron and front-facing sign do not obstruct walking.
      named(id+" steps",[entry.approach.x,.2,entry.approach.z+1.1],
        [2.8,.22,2.3],m.stone);
      sign(entry.name.toUpperCase(),entry.approach.x,entry.approach.z,"#f1d6a6");
      summaries.push({id,x,z,approach:entry.approach});
    }
    for(const b of layout.buildings)building(b);
    for(const stall of layout.stalls)
      marketStall(stall.x,stall.z,stall.awning==="blue"?m.roofDark:m.red);
    for(const p of layout.lanterns){
      const shaft=cyl("capital lantern", [p.x,2,p.z],.13,.18,4,m.black,7);
      shaft.isPickable=false;
      const lamp=sphere("capital lantern glow",[p.x,4.15,p.z],.57,m.gold);
      lamp.isPickable=false;
      named("capital lantern crown",[p.x,4.55,p.z],[.66,.14,.66],m.black);
    }
    // Central mosaic stays walkable and never claims a collision body.
    const circle=B.MeshBuilder.CreateTorus("Azarath compass",{
      diameter:5.6,thickness:.15,tessellation:48
    },scene);
    circle.rotation.x=Math.PI/2;circle.position.set(0,.24,-3);
    circle.material=trims;circle.isPickable=false;
    const arms=[
      {x:0,z:-3,width:.28,depth:4.2},
      {x:0,z:-3,width:4.2,depth:.28}
    ];
    for(const arm of arms)
      named("Azarath compass needle",[arm.x,.25,arm.z],
        [arm.width,.05,arm.depth],m.gold);
    for(const marker of layout.symbols)
      sign(marker.label,marker.x,marker.z,marker.style==="guild"?"#e1b7df":"#f3d6a3");

    return Object.freeze({buildings:summaries,avenues:layout.avenues.length,
      stalls:layout.stalls.length,lamps:layout.lanterns.length});
  }
  globalThis.RavenaCapitalScene=Object.freeze({create});
})();
