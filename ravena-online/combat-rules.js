// Ravena Online — regras de combate independentes da cena 3D e do navegador.
// O protótipo calcula localmente; quando houver multiplayer, estas regras
// deverão rodar no servidor autoritativo, nunca confiar nas mensagens do cliente.
(() => {
  const kinds=Object.freeze({
    golem:Object.freeze({label:"Golem da Pedra",maxHp:65,damage:8,xp:38,range:2.3,aggro:7.5,speed:1.75,respawnMs:35000,drop:"ore",dropChance:.7}),
    wolf:Object.freeze({label:"Lobo dos Sussurros",maxHp:43,damage:6,xp:29,range:1.65,aggro:9,speed:3.35,respawnMs:26000,drop:"fur",dropChance:.65}),
    spirit:Object.freeze({label:"Eco do Véu",maxHp:52,damage:9,xp:41,range:2.8,aggro:8.2,speed:2.25,respawnMs:42000,drop:"essence",dropChance:.55})
  });
  const classDamage=Object.freeze({
    mago:{basic:20,special:29,specialRange:9,range:7,mana:20},
    espadachim:{basic:23,special:25,specialRange:4,range:3.2,mana:20},
    forjador:{basic:13,special:25,specialRange:4,range:2.8,mana:20}
  });
  function mobDefinition(kind){return kinds[kind]||null;}
  function classDefinition(kind){return classDamage[kind]||classDamage.mago;}
  function aggro(distance,type){const mob=mobDefinition(type);return !!mob&&distance<=mob.aggro;}
  function melee(distance,type){const mob=mobDefinition(type);return !!mob&&distance<=mob.range;}
  function damage(type,level=1){
    const stats=mobDefinition(type);
    if(!stats)return 0;
    return stats.damage+Math.max(0,Math.floor((level-1)/4));
  }
  function loot(type,roll=1){
    const stats=mobDefinition(type);
    if(!stats||!Number.isFinite(roll)||roll<0||roll>1)return null;
    return roll<stats.dropChance?{key:stats.drop,count:1}:null;
  }
  function normalizeHp(value,maxHp){
    if(!Number.isFinite(value)||!Number.isFinite(maxHp)||maxHp<=0)return 0;
    return Math.max(0,Math.min(maxHp,value));
  }
  globalThis.RavenaCombat=Object.freeze({
    kinds,classDamage,mobDefinition,classDefinition,aggro,melee,damage,loot,normalizeHp
  });
})();