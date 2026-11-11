// Mapa-múndi do Ravena Online, sem Babylon: utiliza apenas o manifesto de layout.
// As rotas acionam o movimento normal por clique, nunca teleportam o personagem.
(() => {
  const NS="http://www.w3.org/2000/svg";
  const dom=id=>document.getElementById(id);
  const layout=globalThis.RavenaMapLayout;
  if(!layout || !dom("world-map-panel"))return;

  const palette={
    capital:{base:"#9a7e5d",accent:"#ebce8d"},
    port:{base:"#456879",accent:"#a5e6ec"},
    forest:{base:"#294c39",accent:"#98c7a2"},
    mountain:{base:"#675045",accent:"#ecc5a0"}
  };
  const scale=4,origin=360;
  const X=x=>origin+x*scale;
  const Y=z=>origin+z*scale;
  const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
  function node(tag,attrs={},parent=null){
    const x=document.createElementNS(NS,tag);
    for(const [key,value] of Object.entries(attrs))x.setAttribute(key,String(value));
    if(parent)parent.appendChild(x);
    return x;
  }
  function html(tag,className,text,container){
    const el=document.createElement(tag);
    if(className)el.className=className;
    if(text!==undefined)el.textContent=text;
    if(container)container.appendChild(el);
    return el;
  }
  function create({onNavigate}={}){
    const panel=dom("world-map-panel"),host=dom("atlas-svg-host"),list=dom("atlas-place-list");
    if(typeof onNavigate!=="function")throw Error("Atlas needs a navigation callback");
    host.replaceChildren();list.replaceChildren();
    const svg=node("svg",{viewBox:"0 0 720 720",role:"img","aria-label":"Mapa do reino com quatro regiões e suas estradas"},host);
    const defs=node("defs",{},svg);
    const grad=node("linearGradient",{id:"atlas-parchment",x1:"0%",y1:"0%",x2:"100%",y2:"100%"},defs);
    node("stop",{offset:"0%","stop-color":"#263f42"},grad);
    node("stop",{offset:"100%","stop-color":"#182630"},grad);
    node("rect",{x:0,y:0,width:720,height:720,rx:18,fill:"url(#atlas-parchment)"},svg);
    // Coordinates are mapped exactly to the playable 176 x 176 prototype.
    // Large colored zones are approximate city/wilderness planning regions, not collision bounds.
    node("rect",{x:X(-87),y:Y(-85),width:58*scale,height:74*scale,rx:34,fill:"#28503b","fill-opacity":".85"},svg);
    node("rect",{x:X(-85),y:Y(33),width:170*scale,height:52*scale,rx:30,fill:"#604d43","fill-opacity":".82"},svg);
    node("rect",{x:X(26),y:Y(-29),width:58*scale,height:58*scale,rx:24,fill:"#3c5961","fill-opacity":".8"},svg);
    node("circle",{cx:X(0),cy:Y(0),r:29*scale,fill:"#59635b","fill-opacity":".78"},svg);
    node("circle",{cx:X(55),cy:Y(1),r:23.8*scale,fill:"#b99a6d","fill-opacity":".84"},svg);
    node("circle",{cx:X(55),cy:Y(1),r:21*scale,fill:"#4b94a6","fill-opacity":".93"},svg);
    node("circle",{cx:X(55),cy:Y(1),r:17*scale,fill:"#31798c","fill-opacity":".7"},svg);
    for(let i=-80;i<=80;i+=20){
      node("line",{x1:X(i),y1:12,x2:X(i),y2:708,stroke:"#d3d0b5","stroke-opacity":".065","stroke-width":1},svg);
      node("line",{x1:12,y1:Y(i),x2:708,y2:Y(i),stroke:"#d3d0b5","stroke-opacity":".065","stroke-width":1},svg);
    }
    const routes=node("g",{},svg);
    for(const road of layout.paths){
      const coords=road.points.map(p=>X(p[0]).toFixed(1)+","+Y(p[1]).toFixed(1)).join(" ");
      node("polyline",{points:coords,fill:"none",stroke:"#181a1c","stroke-opacity":".6",
        "stroke-width":road.type==="main"?18:12,"stroke-linecap":"round","stroke-linejoin":"round"},routes);
      node("polyline",{points:coords,fill:"none",
        stroke:road.type==="main"?"#dfc78e":"#a0a388",
        "stroke-width":road.type==="main"?9:5,
        "stroke-dasharray":road.type==="trail"?"7 10":"none",
        "stroke-linecap":"round","stroke-linejoin":"round"},routes);
    }
    const iconText=(label,x,z,size=19,color="#f7e4b5")=>{
      const t=node("text",{x:X(x),y:Y(z),"text-anchor":"middle",
        "dominant-baseline":"middle",fill:color,"font-family":"Georgia,serif",
        "font-size":size,"font-weight":"bold","paint-order":"stroke",
        stroke:"#19232d","stroke-width":4},svg);
      t.textContent=label;return t;
    };
    iconText("CAPITAL",0,-22,21,"#f6dc9b");
    iconText("VILA DAS MARÉS",44,-27,18,"#cbf3f0");
    iconText("FLORESTA",-50,-66,17,"#c0dfb8");
    iconText("MONTANHAS",0,80,18,"#f3d5ab");
    iconText("N",0,-79,22,"#f2d9ab");
    const markers=new Map();
    let selected=null,position={x:0,z:-3},zoneId="capital-azarath";
    const markerLayer=node("g",{},svg);
    for(const place of layout.places){
      const group=node("g",{role:"button",tabindex:0,
        "aria-label":place.name+(place.phase==="planned"?" (planejado)":""),
        style:"cursor:pointer"},markerLayer);
      node("circle",{cx:X(place.x),cy:Y(place.z),r:place.phase==="planned"?8:10,
        fill:place.phase==="planned"?"#5f6b70":"#e8d19b",
        stroke:place.phase==="planned"?"#9ca5a4":"#151d27",
        "stroke-width":3,"stroke-dasharray":place.phase==="planned"?"3 3":"none"},group);
      node("circle",{cx:X(place.x),cy:Y(place.z),r:3,
        fill:place.phase==="planned"?"#b3c1c0":"#3b3a35"},group);
      group.addEventListener("click",()=>select(place.id));
      group.addEventListener("keydown",e=>{
        if(e.key==="Enter"||e.key===" "){e.preventDefault();select(place.id);}
      });
      markers.set(place.id,group);
    }
    const selectedRing=node("circle",{cx:-50,cy:-50,r:16,fill:"none",stroke:"#fbf1be","stroke-width":3},svg);
    const playerRing=node("circle",{cx:X(0),cy:Y(-3),r:12,fill:"#faf6d5",
      "fill-opacity":".1",stroke:"#e8ebc0","stroke-width":2},svg);
    const playerDot=node("path",{
      d:"M 0 -8 L 7 0 L 0 8 L -7 0 Z",fill:"#fff8ce",stroke:"#22344c","stroke-width":2,
      transform:"translate("+X(0)+" "+Y(-3)+")"},svg);
    const compass=html("div","atlas-compass","N ↑  •  L →",host);
    const regionsById=new Map(layout.regions.map(region=>[region.id,region]));
    const listItems=new Map();
    const sorted=[...layout.places].sort((a,b)=>{
      const x=layout.regions.findIndex(r=>r.id===a.region),y=layout.regions.findIndex(r=>r.id===b.region);
      return x-y||a.name.localeCompare(b.name,"pt-BR");
    });
    for(const place of sorted){
      const button=html("button","atlas-poi-button",undefined,list);
      button.type="button";button.dataset.place=place.id;
      const sign=html("span","atlas-poi-icon",place.phase==="planned"?"○":"◆",button);
      const text=html("span","atlas-poi-text",place.name,button);
      const status=html("small","atlas-poi-tag",place.phase==="planned"?"Planejado":"Greybox",button);
      button.addEventListener("click",()=>select(place.id));
      listItems.set(place.id,button);
    }
    function select(id){
      const place=layout.places.find(p=>p.id===id);
      if(!place)return;
      selected=place;
      const region=regionsById.get(place.region);
      dom("atlas-region-label").textContent=region?.label.toUpperCase()||"REGIÃO";
      dom("atlas-place-name").textContent=place.name;
      dom("atlas-place-description").textContent=place.detail;
      dom("atlas-place-status").textContent=place.phase==="planned"?
        "Área planejada — ainda não construída":"Ponto do greybox — construção provisória";
      const navigate=dom("atlas-navigate");
      navigate.disabled=place.phase==="planned";
      navigate.textContent=place.phase==="planned"?"Local ainda não disponível":"Traçar caminho a pé";
      selectedRing.setAttribute("cx",X(place.x));selectedRing.setAttribute("cy",Y(place.z));
      for(const [key,button] of listItems)button.classList.toggle("selected",key===id);
      for(const [key,group] of markers)group.setAttribute("opacity",key===id?"1":".9");
    }
    function update(x,z,newZoneId){
      if(!Number.isFinite(x)||!Number.isFinite(z))return;
      position={x,z};zoneId=newZoneId||zoneId;
      playerRing.setAttribute("cx",X(x));playerRing.setAttribute("cy",Y(z));
      playerDot.setAttribute("transform","translate("+X(x)+" "+Y(z)+")");
    }
    function open(){
      panel.classList.remove("hidden");
      if(!selected)select("praca-capital");
      update(position.x,position.z,zoneId);
    }
    function close(){panel.classList.add("hidden");}
    function toggle(){panel.classList.contains("hidden")?open():close();}
    dom("world-map-close").addEventListener("click",close);
    dom("atlas-navigate").addEventListener("click",()=>{
      if(!selected||selected.phase==="planned")return;
      const accepted=onNavigate(selected);
      if(accepted===true)close();
    });
    select("praca-capital");
    update(0,-3,"capital-azarath");
    return Object.freeze({open,close,toggle,update,select,get visible(){return !panel.classList.contains("hidden");}});
  }
  globalThis.RavenaMapUI=Object.freeze({create});
})();
