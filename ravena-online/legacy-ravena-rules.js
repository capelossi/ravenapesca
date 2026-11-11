// Ravena Online — paridade das bênçãos do PescaVena V6.4.42.
// Regras puras, independentes de Babylon e do DOM; modo solo/local apenas.
(() => {
  const DURATION_MS=10*60*1000;
  const FISH_KEYS=Object.freeze(["lambari","tilapia","carpa","lendario"]);
  const BLESSINGS=Object.freeze({
    sorte:Object.freeze({
      id:"sorte",name:"Sorte das Profundezas",icon:"🐟",
      description:"+3,5 pontos percentuais na rolagem de raridade da pesca."
    }),
    sabedoria:Object.freeze({
      id:"sabedoria",name:"Sabedoria Sombria",icon:"✨",
      description:"+20% de XP por captura."
    }),
    fortuna:Object.freeze({
      id:"fortuna",name:"Fortuna da Ravena",icon:"🪙",
      description:"+15% de moedas ao vender peixes ao mercado da vila."
    }),
    aguas:Object.freeze({
      id:"aguas",name:"Favor das Águas",icon:"🌊",
      description:"1 isca extra a cada 10 capturas durante a bênção."
    })
  });
  const FISH_PRICES=Object.freeze({lambari:16,tilapia:34,carpa:82,lendario:650});
  const labelFish=Object.freeze({lambari:"Lambari",tilapia:"Tilápia",carpa:"Carpa",lendario:"Peixe lendário"});
  const validFish=key=>FISH_KEYS.includes(key);
  const validBlessing=kind=>Object.hasOwn(BLESSINGS,kind);
  function active(record,now=Date.now()){
    if(!record||!validBlessing(record.type)||!Number.isFinite(record.expiresAt))return null;
    return now<record.expiresAt?record.type:null;
  }
  function remainingSeconds(record,now=Date.now()){
    return active(record,now)?Math.ceil((record.expiresAt-now)/1000):0;
  }
  function makeOffering(bag,fishKey,kind,now=Date.now()){
    if(!validFish(fishKey) || !validBlessing(kind))return {ok:false,reason:"Seleção inválida."};
    if(!Number.isFinite(now)||now<0)return {ok:false,reason:"Horário inválido."};
    if(!bag||!Number.isInteger(bag[fishKey])||bag[fishKey]<=0)
      return {ok:false,reason:"Você precisa ter um peixe na mochila."};
    return {ok:true,blessing:{type:kind,expiresAt:now+DURATION_MS},
      consumes:{key:fishKey,count:1}};
  }
  function fishingRoll(roll,record,now=Date.now()){
    const chance=Number.isFinite(roll)?Math.max(0,Math.min(1,roll)):0;
    return Math.min(1,chance+(active(record,now)==="sorte"?.035:0));
  }
  function fishingXp(base,record,now=Date.now()){
    const xp=Math.max(0,Math.round(Number(base)||0));
    return active(record,now)==="sabedoria"?Math.round(xp*1.2):xp;
  }
  function saleValue(base,record,now=Date.now()){
    const coins=Math.max(0,Math.round(Number(base)||0));
    return active(record,now)==="fortuna"?Math.round(coins*1.15):coins;
  }
  function earnBait(totalCatches,record,now=Date.now()){
    return active(record,now)==="aguas" &&
      Number.isInteger(totalCatches)&&totalCatches>0&&totalCatches%10===0?1:0;
  }
  function fishPrice(key){return FISH_PRICES[key]??null;}
  globalThis.RavenaLegacyRules=Object.freeze({
    DURATION_MS,FISH_KEYS,FISH_PRICES,BLESSINGS,labelFish,
    validFish,validBlessing,active,remainingSeconds,makeOffering,
    fishingRoll,fishingXp,saleValue,earnBait,fishPrice
  });
})();
