// Ravena Online — módulos de apresentação gráfica.
// Toda escolha fica no cliente; estado multiplayer/combate não depende do preset.
(() => {
  const QUALITY=Object.freeze({
    leve:{scaleMobile:1.65,scaleDesktop:1.6,fog:.0105,shadows:false,glow:false,texture:256},
    equilibrado:{scaleMobile:1.35,scaleDesktop:1.2,fog:.0084,shadows:true,glow:false,texture:384},
    ultra:{scaleMobile:1,scaleDesktop:1,fog:.0066,shadows:true,glow:true,texture:512}
  });
  const preferred=()=> {
    try {
      const saved=localStorage.getItem("ravena-graphics-v1");
      if(saved in QUALITY)return saved;
    }catch{}
    return (window.innerWidth<=760||navigator.hardwareConcurrency<=4)?"leve":"equilibrado";
  };
  function makeTexture(B,scene,name,size,draw,uScale=1,vScale=1){
    const tx=new B.DynamicTexture(name,{width:size,height:size},scene,true);
    const ctx=tx.getContext();
    draw(ctx,size);
    tx.update(false);
    tx.wrapU=B.Texture.WRAP_ADDRESSMODE;
    tx.wrapV=B.Texture.WRAP_ADDRESSMODE;
    tx.uScale=uScale;tx.vScale=vScale;
    return tx;
  }
  let rngState=94127;
  function rnd(){rngState=(Math.imul(1664525,rngState)+1013904223)>>>0;return rngState/4294967296;}
  function terrain(ctx,size){
    ctx.fillStyle="#657e54";ctx.fillRect(0,0,size,size);
    for(let i=0;i<1100;i++){
      const x=rnd()*size,y=rnd()*size,w=1+rnd()*8;
      ctx.fillStyle=["#708b5a","#536c49","#8a996a","#617b53","#556b49"][Math.floor(rnd()*5)];
      ctx.globalAlpha=.26+rnd()*.28;
      ctx.fillRect(x,y,w,w*.37);
    }
    ctx.globalAlpha=1;
    for(let i=0;i<90;i++){
      const x=rnd()*size,y=rnd()*size;
      ctx.strokeStyle=rnd()>.5?"#a1aa70":"#385f3f";ctx.lineWidth=1;
      ctx.beginPath();ctx.moveTo(x,y+3);ctx.lineTo(x-2,y);ctx.moveTo(x,y+3);ctx.lineTo(x+2,y);ctx.stroke();
    }
  }
  function cobble(ctx,size){
    ctx.fillStyle="#777468";ctx.fillRect(0,0,size,size);
    let row=0;
    for(let y=0;y<size+26;y+=33){
      const offset=row++%2?23:0;
      for(let x=-offset;x<size+45;x+=46){
        const c=["#beb8aa","#aba79a","#96978c","#aaa99e","#b9b1a3"][Math.floor(rnd()*5)];
        ctx.fillStyle=c;ctx.fillRect(x+2,y+2,42,29);
        ctx.fillStyle="rgba(255,255,255,.14)";ctx.fillRect(x+2,y+2,42,2);
        ctx.fillStyle="rgba(0,0,0,.09)";ctx.fillRect(x+2,y+29,42,2);
      }
    }
  }
  function shingle(ctx,size,dark){
    ctx.fillStyle=dark?"#2c3444":"#512c30";ctx.fillRect(0,0,size,size);
    for(let y=0;y<size+18;y+=24){
      const shift=(Math.floor(y/24)%2)*18;
      for(let x=-shift;x<size+40;x+=36){
        const shades=dark?["#536173","#485363","#465161","#607082"]:["#9c5851","#834b48","#ae6154","#754347"];
        ctx.fillStyle=shades[Math.floor(rnd()*4)];
        ctx.fillRect(x+1,y+1,34,22);
        ctx.fillStyle="rgba(255,235,197,.13)";
        ctx.fillRect(x+1,y+1,34,2);
      }
    }
  }
  function attach(B,scene,material,name,size,draw,u,v){
    if(!material)return;
    material.diffuseTexture=makeTexture(B,scene,name,size,draw,u,v);
    material.diffuseColor=new B.Color3(1,1,1);
    material.specularColor=new B.Color3(.12,.12,.1);
  }
  function create({B,scene,engine,ground,sun,dir,shadows,materials}){
    if(!B||!scene||!engine)throw Error("RavenaVisuals: cena não informada");
    const mobile=()=>window.innerWidth<=760;
    const mode=preferred(),size=512;
    attach(B,scene,materials.ground,"grama pintada",size,terrain,22,22);
    attach(B,scene,materials.road,"calçamento de Azarath",size,cobble,1,1);
    attach(B,scene,materials.roof,"telhas de cerâmica",size,(ctx,s)=>shingle(ctx,s,false),1,1);
    attach(B,scene,materials.roofDark,"telhas azul ardósia",size,(ctx,s)=>shingle(ctx,s,true),1,1);
    const groundTexture=materials.ground?.diffuseTexture;
    if(groundTexture)groundTexture.hasAlpha=false;
    let glow=null,quality=mode,phase=0;
    function apply(next){
      if(!(next in QUALITY))return quality;
      const preset=QUALITY[next];quality=next;
      engine.setHardwareScalingLevel(mobile()?preset.scaleMobile:preset.scaleDesktop);
      scene.fogDensity=preset.fog;
      const map=shadows?.getShadowMap();
      if(map){
        map.renderList=map.renderList||[];
        shadows.setDarkness(.24);
        shadows.useBlurExponentialShadowMap=preset.shadows;
        shadows.blurKernel=preset.shadows?(next==="ultra"?16:8):0;
        shadows.getShadowMap().isEnabled=preset.shadows;
      }
      if(preset.glow){
        if(!glow)glow=new B.GlowLayer("realce mágico",scene,{blurKernelSize:24});
        glow.intensity=.32;
        glow.isEnabled=true;
      }else if(glow)glow.isEnabled=false;
      try{localStorage.setItem("ravena-graphics-v1",next);}catch{}
      engine.resize();
      return quality;
    }
    function tick(seconds){
      phase+=Math.max(0,seconds);
      // 7-minute cycle with a long golden hour and moonlit nights.
      const t=phase/420*Math.PI*2;
      const daylight=.56+.44*Math.sin(t-.4);
      const k=Math.max(.16,Math.min(1,daylight));
      dir.intensity=.35+k*1.08;
      sun.intensity=.5+k*.7;
      const daySky=new B.Color3(.59,.73,.82),nightSky=new B.Color3(.12,.19,.3);
      const mix=B.Color3.Lerp(nightSky,daySky,k);
      scene.clearColor=new B.Color4(mix.r,mix.g,mix.b,1);
      scene.fogColor=B.Color3.Lerp(nightSky,new B.Color3(.54,.64,.72),k);
      return {time:phase,daylight:k,period:k>.73?"Dia":k>.38?"Entardecer":"Noite"};
    }
    apply(quality);
    return Object.freeze({get quality(){return quality;},modes:Object.keys(QUALITY),apply,tick});
  }
  globalThis.RavenaVisuals=Object.freeze({create,QUALITY});
})();