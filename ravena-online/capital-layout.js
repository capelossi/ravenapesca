// Ravena Online — layout modular da Capital de Azarath (Fase 1.2).
// As unidades são coordenadas da pré-alfa; dados podem virar chunks GLB.
globalThis.RavenaCapitalLayout=Object.freeze({
  version:1,
  id:"capital-azarath",
  phase:"greybox-architecture",
  theme:"limestone-gold-timber",
  avenues:[
    {id:"rua-guilda",x:-15,z:-5,width:4,depth:11},
    {id:"rua-estalagem",x:14,z:-5,width:4,depth:11},
    {id:"acesso-conselho",x:0,z:-24,width:5,depth:13},
    {id:"praca-mercado",x:-20,z:5,width:14,depth:14},
    {id:"largo-central",x:0,z:-3,width:13,depth:11}
  ],
  buildings:[
    {id:"guilda-aventureiros",name:"Guilda dos Aventureiros",kind:"guild",
      x:-15,z:-17,width:8.5,depth:7.2,height:6.4,roof:"blue",accent:"red",
      approach:{x:-15,z:-9.5},decor:"guild-banner",
      description:"Salão de contratos e encontro dos aventureiros. Interior futuro."},
    {id:"estalagem-corvo",name:"Estalagem Corvo Dourado",kind:"inn",
      x:14,z:-17,width:8,depth:7.2,height:6.0,roof:"red",accent:"gold",
      approach:{x:14,z:-9.5},decor:"inn-sign",
      description:"Hospedagem e encontros. Interior e serviços futuros."},
    {id:"palacio-conselho",name:"Palácio do Conselho",kind:"council",
      x:0,z:-36,width:12,depth:9,height:8.8,roof:"blue",accent:"gold",
      approach:{x:0,z:-28.3},decor:"council-crest",
      description:"Centro político de Azarath e cenário de campanhas futuras."}
  ],
  stalls:[
    {id:"banca-tecidos",x:-18,z:7,awning:"red"},
    {id:"banca-especiarias",x:-23,z:11,awning:"blue"}
  ],
  plazas:[
    {id:"praca-central",x:0,z:-3,radius:6.5},
    {id:"feira-da-capital",x:-19,z:5,radius:6}
  ],
  lanterns:[
    {x:-10,z:-3},{x:-10,z:-10},{x:9,z:-3},{x:9,z:-10},
    {x:-7,z:-25},{x:7,z:-25},{x:-25,z:2},{x:-25,z:15},
    {x:0,z:21},{x:-3,z:4},{x:3,z:4}
  ],
  symbols:[
    {id:"estandarte-guilda",x:-19,z:-11,label:"GUILDA",style:"guild"},
    {id:"placa-mercado",x:-20,z:0,label:"FEIRA DE AZARATH",style:"market"},
    {id:"pedra-marco",x:4,z:8,label:"MARCO ZERO",style:"landmark"}
  ]
});
