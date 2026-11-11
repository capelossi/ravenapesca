// UI separada do motor de jogo: não altera dados, apenas apresenta o mundo e a campanha.
(() => {
  const world=globalThis.RavenaWorldData;
  const panel=document.getElementById("chronicle-panel");
  const content=document.getElementById("chronicle-content");
  if(!world||!panel||!content)return;

  function el(tag,className,text){
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(text!==undefined)node.textContent=String(text);
    return node;
  }
  function section(title){
    const article=el("section","chronicle-section");
    article.append(el("h3","chronicle-section-title",title));
    content.append(article);
    return article;
  }
  function render(quest=0,zoneId="capital-azarath"){
    content.replaceChildren();
    const story=world.story;
    const complete=Math.max(0,Math.min(Number(quest)||0,story.stages.length));
    const region=world.regions.find(r=>r.id===zoneId)||world.regions.at(-1);
    const campaign=section(story.chapterTitle);
    campaign.append(el("p","chronicle-lead",world.lore.premise));
    const step=story.stages[complete]||story.epilogue;
    campaign.append(el("div","chronicle-status",
      complete>=story.stages.length?"Capítulo concluído":("Etapa "+(complete+1)+" de "+story.stages.length)));
    campaign.append(el("h4","chronicle-objective",step.title));
    campaign.append(el("p","chronicle-copy",step.description));
    const progress=el("div","chronicle-progress");
    const fill=el("span","chronicle-progress-fill");
    fill.style.width=(100*complete/story.stages.length)+"%";
    progress.append(fill);campaign.append(progress);
    const history=section("Seu caminho");
    for(let i=0;i<story.stages.length;i++){
      const entry=story.stages[i];
      const item=el("div","chronicle-step "+(i<complete?"done":i===complete?"active":"future"),
        (i<complete?"✓ ":i===complete?"◉ ":"○ ")+entry.title);
      history.append(item);
    }
    const places=section("Onde você está");
    places.append(el("h4","chronicle-objective",region.name));
    places.append(el("p","chronicle-copy",region.description));
    const nearby=region.neighbors.map(id=>world.regions.find(r=>r.id===id)?.name).filter(Boolean);
    places.append(el("p","chronicle-route","Conexões: "+(nearby.join(" · ")||"sem conexão catalogada")));
    const secrets=section("Lendas do reino");
    for(const [name,text] of [
      ["A Ravena",world.lore.ravena],
      ["A Mãe das Águas",world.lore.waterMother],
      ["O Véu",world.lore.conflict]
    ]){
      secrets.append(el("h4","chronicle-objective",name));
      secrets.append(el("p","chronicle-copy",text));
    }
    const coming=section("Além do horizonte");
    coming.append(el("p","chronicle-copy","Regiões abaixo fazem parte do planejamento. Ainda não estão jogáveis."));
    for(const r of world.plannedExpansion)coming.append(el("div","chronicle-future",r.name+" · nível "+r.level[0]+"–"+r.level[1]));
  }
  function close(){panel.classList.add("hidden");}
  function open(quest,zoneId){render(quest,zoneId);panel.classList.remove("hidden");}
  function toggle(quest,zoneId){panel.classList.contains("hidden")?open(quest,zoneId):close();}
  document.getElementById("chronicle-close")?.addEventListener("click",close);
  globalThis.RavenaJournal=Object.freeze({open,close,toggle,render});
})();
