// Ravena Online — controle de interface do altar e mercado, sem HTML dinâmico inseguro.
(() => {
  const $=id=>document.getElementById(id);
  function create({rules,getState,onOffer,onSell}){
    if(!rules||!getState||!onOffer||!onSell)throw Error("Interface legada sem serviços");
    const altar=$("ravena-altar-panel"),market=$("ravena-fish-market-panel");
    const fishSelect=$("ravena-fish-select");
    let selected="sorte",pending=null;
    const hidden=el=>el.classList.contains("hidden");
    const close=()=>{
      altar.classList.add("hidden");
      market.classList.add("hidden");
      $("ravena-confirmation").classList.add("hidden");
      pending=null;
    };
    function refreshBlessing(){
      const state=getState(),active=rules.active(state.blessing);
      const text=active?
        rules.BLESSINGS[active].icon+" "+rules.BLESSINGS[active].name+
        " • "+Math.ceil(rules.remainingSeconds(state.blessing)/60)+" min restantes":
        "Nenhuma bênção ativa. Faça uma oferenda à Ravena.";
      $("ravena-current").textContent=text;
      const hud=$("ravena-blessing-hud");
      hud.textContent=active?"🔮 "+rules.BLESSINGS[active].name+" • "+
        Math.ceil(rules.remainingSeconds(state.blessing)/60)+" min":"";
      hud.classList.toggle("hidden",!active);
    }
    function refreshFish(){
      const previous=fishSelect.value;
      fishSelect.replaceChildren();
      const state=getState();
      let total=0;
      for(const key of rules.FISH_KEYS){
        const count=Math.max(0,Number(state.bag[key])||0);
        if(!count)continue;
        const option=document.createElement("option");
        option.value=key;option.textContent=rules.labelFish[key]+" · "+count+" na mochila";
        fishSelect.appendChild(option);total+=count;
      }
      if(total===0){
        const option=document.createElement("option");
        option.textContent="Você não tem peixes. Visite o píer da Vila das Marés.";
        option.value="";fishSelect.appendChild(option);
      }else if(rules.validFish(previous)&&Number(state.bag[previous])>0){
        fishSelect.value=previous;
      }
      $("ravena-offer").disabled=total===0;
    }
    function refreshMarket(){
      const state=getState(),list=$("ravena-market-items");
      $("ravena-coin-balance").textContent="🪙 "+(state.coins||0)+" moedas";
      list.replaceChildren();
      let count=0;
      for(const key of rules.FISH_KEYS){
        const qty=Math.max(0,Math.floor(Number(state.bag[key])||0));
        if(!qty)continue;
        count++;
        const row=document.createElement("div");row.className="ravena-market-row";
        const desc=document.createElement("div");
        const name=document.createElement("strong");
        name.textContent="🐟 "+rules.labelFish[key]+" · ×"+qty;
        const price=document.createElement("small");
        price.textContent="🪙 "+rules.saleValue(rules.fishPrice(key),state.blessing)+" por peixe";
        desc.append(name,price);
        const button=document.createElement("button");
        button.type="button";button.textContent="Vender 1";
        button.addEventListener("click",()=>{
          const result=onSell(key);
          if(result?.ok){refreshMarket();refreshFish();refreshBlessing();}
          else if(result?.reason){
            const note=$("ravena-coin-balance");note.textContent=result.reason;
          }
        });
        row.append(desc,button);list.appendChild(row);
      }
      if(!count){
        const empty=document.createElement("p");empty.className="ravena-intro";
        empty.textContent="Sua mochila não possui peixes para vender. Pesque no cais primeiro.";
        list.appendChild(empty);
      }
    }
    function refresh(){
      refreshBlessing();
      if(!hidden(altar))refreshFish();
      if(!hidden(market))refreshMarket();
    }
    function openAltar(){
      close();refreshBlessing();refreshFish();
      altar.classList.remove("hidden");
    }
    function openMarket(){
      close();refreshMarket();
      market.classList.remove("hidden");
    }
    for(const button of document.querySelectorAll("[data-ravena-blessing]")){
      button.addEventListener("click",()=>{
        selected=button.dataset.ravenaBlessing;
        for(const other of document.querySelectorAll("[data-ravena-blessing]"))
          other.classList.toggle("selected",other===button);
        $("ravena-confirmation").classList.add("hidden");
        pending=null;
      });
    }
    $("ravena-offer").addEventListener("click",()=>{
      const key=fishSelect.value;
      if(!rules.validFish(key))return;
      const state=getState();
      if(!Number(state.bag[key])){refreshFish();return;}
      pending={key,selected};
      $("ravena-confirmation-text").textContent=
        "Consumir 1 "+rules.labelFish[key]+" e ativar "+rules.BLESSINGS[selected].name+
        " por 10 minutos? A bênção anterior será substituída.";
      $("ravena-confirmation").classList.remove("hidden");
      $("ravena-offer").disabled=true;
    });
    $("ravena-confirm-no").addEventListener("click",()=>{
      pending=null;
      $("ravena-confirmation").classList.add("hidden");
      refreshFish();
    });
    $("ravena-confirm-yes").addEventListener("click",()=>{
      if(!pending)return;
      const result=onOffer(pending.key,pending.selected);
      pending=null;
      $("ravena-confirmation").classList.add("hidden");
      refreshFish();refreshBlessing();
      if(result?.ok)close();
      else if(result?.reason)$("ravena-current").textContent=result.reason;
    });
    $("ravena-altar-close").addEventListener("click",close);
    $("ravena-market-close").addEventListener("click",close);
    return Object.freeze({openAltar,openMarket,close,refresh,
      get visible(){return !hidden(altar)||!hidden(market);}
    });
  }
  globalThis.RavenaLegacyUI=Object.freeze({create});
})();
