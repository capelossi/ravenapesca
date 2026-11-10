// Fase 1.3 — desenho modular da Vila das Marés e Lago da Mãe das Águas.
// X é leste/oeste, Z norte/sul, em unidades locais do greybox.
// Apenas cadastro/colisão: nenhuma dependência de Babylon.js.
(() => {
  const data={
    version:1,id:"vila-das-mares",theme:"weathered-timber-slate-tidal",
    summary:"Cidade portuária independente da capital, ligada pela Estrada das Lanternas.",
    plaza:{x:35,z:-13,radius:5.2},
    water:{x:55,z:1,shoreRadius:24,outerRadius:21,innerRadius:18,collisionRadius:20.25},
    pier:{startX:31,endX:43,z:1,halfWidth:2.15,plankCount:7},
    lighthouse:{id:"farol-mares",x:48,z:24,height:9,radius:2.45,approach:{x:43,z:19}},
    buildings:[
      {id:"prefeitura-mares",name:"Prefeitura da Vila",kind:"townhall",
        x:42,z:-18.5,width:7,depth:6,height:6.4,roof:"blue",approach:{x:42,z:-13.8},
        description:"Conselho local, avisos de expedição e gestão do porto; interior futuro."},
      {id:"pousada-vila",name:"Pousada do Faroleiro",kind:"inn",
        x:52,z:-27,width:7,depth:5.2,height:5.9,roof:"red",approach:{x:52,z:-22.9},
        description:"Estalagem da cidade. Quartos e serviços serão construídos numa etapa posterior."},
      {id:"armazem-sal",name:"Armazém do Sal",kind:"warehouse",
        x:29,z:-20,width:5.5,depth:4.8,height:5,roof:"blue",approach:{x:29,z:-16.5},
        description:"Suprimentos, redes e mercadorias; ainda sem mercado online."},
      {id:"oficina-naval",name:"Oficina Naval",kind:"workshop",
        x:28,z:17,width:5.8,depth:5.2,height:5,roof:"red",approach:{x:28,z:20.7},
        description:"Consertos de embarcações e ferramentas, atualmente apenas fachada."},
      {id:"casas-pescadores",name:"Casas dos Pescadores",kind:"homes",
        x:36,z:24,width:5.9,depth:5.3,height:4.8,roof:"blue",approach:{x:36,z:27.8},
        description:"Bairro residencial do cais, com novas moradias planejadas."}
    ],
    market:{id:"mercado-sal",x:27,z:-26,awning:"blue"},
    noticeBoard:{x:33,z:-17},
    fishStalls:[{x:22,z:-26.5,awning:"blue"}],
    lamps:[
      {x:32,z:-10},{x:37,z:-18},{x:34,z:-4},{x:32,z:8},
      {x:34,z:15},{x:40,z:22},{x:39,z:-24}
    ],
    boats:[
      {x:46,z:-5,rotation:.33},
      {x:47.8,z:8,rotation:-.42}
    ],
    dockPosts:[31,35,39,43],
    decorations:{
      nets:[{x:25,z:-12},{x:37,z:17}],
      barrels:[{x:25,z:-27},{x:34,z:19},{x:44,z:14}]
    },
    approaches:[
      {id:"praca-redes",x:35,z:-13},
      {id:"cais-mae-aguas",x:35,z:1},
      {id:"mercado-sal",x:32,z:-27},
      {id:"farol-mares",x:43,z:19}
    ]
  };
  const inPier=(x,z,pad=0)=>{
    const p=data.pier;
    return x>=p.startX+Math.max(0,pad) &&
      x<=p.endX-Math.max(0,pad) &&
      Math.abs(z-p.z)<=p.halfWidth-Math.max(0,pad);
  };
  // Água bloqueada em toda a lagoa, exceto o corredor sobre o píer.
  // O corredor termina no extremo da estrutura; a água além permanece bloqueada.
  const isLakeBlocked=(x,z,pad=0)=>{
    if(!Number.isFinite(x)||!Number.isFinite(z))return true;
    const w=data.water;
    return Math.hypot(x-w.x,z-w.z)<w.collisionRadius+Math.max(0,pad) &&
      !inPier(x,z,Math.min(.8,Math.max(0,pad)));
  };
  const layout=Object.freeze(data);
  globalThis.RavenaVillageLayout=Object.freeze({data:layout,inPier,isLakeBlocked});
})();
