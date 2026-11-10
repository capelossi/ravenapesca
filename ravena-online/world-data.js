// Ravena Online: dados do mundo separados do motor 3D.
// IDs estáveis permitem evoluir regiões, NPCs e missões sem quebrar saves.
globalThis.RavenaWorldData = Object.freeze({
  schemaVersion: 1,
  worldId: "azarath",
  title: "Ravena Online — O Despertar de Azarath",
  epoch: "A Era das Marés Silenciosas",
  start: { region: "capital-azarath", x: 0, z: -3 },
  lore: {
    premise: "Há décadas, as rotas entre Azarath e a Vila das Marés vivem do comércio. Agora, o lago começou a devolver objetos de um reino que ninguém se lembra de ter existido.",
    conflict: "O despertar dos antigos Faróis do Véu enfraquece a barreira entre Azarath e um mundo de ecos. Guildas disputam os fragmentos enquanto os moradores lutam para preservar suas cidades.",
    ravena: "Ravena não é a vilã nem a heroína: é a guardiã de memórias esquecidas. Suas escolhas alteram alianças, não a liberdade de profissão.",
    waterMother: "A Mãe das Águas protege o lago. O seu santuário oferece pistas sobre a origem dos fragmentos, sem exigir que todo aventureiro seja pescador."
  },
  regions: [
    { id: "vila-das-mares", name: "Vila das Marés", kind: "city", level: [1,12],
      bounds: { minX: 26, maxX: 84, minZ: -29, maxZ: 29 },
      neighbors: ["capital-azarath"], description: "Cidade portuária, comércio e expedições ao Lago da Mãe das Águas." },
    { id: "montanhas-da-forja", name: "Montanhas da Forja", kind: "wilderness", level: [4,18],
      bounds: { minX: -85, maxX: 85, minZ: 33, maxZ: 85 },
      neighbors: ["capital-azarath"], description: "Minas, oficinas e os primeiros ecos do Véu." },
    { id: "floresta-dos-sussurros", name: "Floresta dos Sussurros", kind: "wilderness", level: [3,16],
      bounds: { minX: -85, maxX: -29, minZ: -85, maxZ: -11 },
      neighbors: ["capital-azarath"], description: "Ruínas antigas e guardiões que ouviram o primeiro chamado." },
    { id: "capital-azarath", name: "Capital de Azarath", kind: "city", level: [1,20],
      neighbors: ["vila-das-mares", "floresta-dos-sussurros", "montanhas-da-forja"],
      description: "Capital política e econômica, com conselho, guildas, feira e portões." }
  ],
  settlements: {
    "vila-das-mares": {
      name: "Vila das Marés",
      anchor: { x: 37, z: -13 },
      road: { from: "capital-azarath", type: "walking", label: "Estrada das Lanternas" },
      districts: [
        { id:"praca-das-redes", name:"Praça das Redes", x:34, z:-15, activity:"Missões e comércio" },
        { id:"cais", name:"Cais da Mãe das Águas", x:34, z:1, activity:"Pesca e barcos" },
        { id:"mercado", name:"Mercado do Sal", x:27, z:-27, activity:"Comércio de peixes e suprimentos" },
        { id:"farol", name:"Farol das Marés", x:48, z:24, activity:"Segredos e expedições futuras" }
      ],
      houses: [
        { x: 30, z: -21, size: .77, roof:"blue" },
        { x: 40, z: -24, size: .73, roof:"red" },
        { x: 49, z: -25, size: .67, roof:"blue" },
        { x: 29, z: 18, size: .75, roof:"red" },
        { x: 45, z: 23, size: .74, roof:"blue" },
        { x: 47, z: 29, size: .67, roof:"red" }
      ],
      market: { x: 27, z:-26 }
    }
  },
  npcs: [
    {
      id:"capita-elyra", name:"Capitã Elyra", x:-5, z:-7, kind:"espadachim",
      story:"Sou Elyra, da guarda da Capital. Recebemos notícia de uma luz impossível vinda da Vila das Marés. Siga a Estrada das Lanternas para leste e converse com a Prefeita Marina. Ninguém precisa ser pescador para atender ao chamado."
    },
    {
      id:"prefeita-marina", name:"Prefeita Marina", x:35, z:-12, kind:"espadachim",
      story:"Bem-vindo à Vila das Marés! Vivemos da pesca, do comércio e das viagens pelo lago, mas temos magos, espadachins e forjadores entre nós. Desde que o farol brilhou sozinho, objetos estranhos aparecem nas redes. Fale com Orien no cais."
    },
    {
      id:"pescador-orien", name:"Pescador Orien", x:33, z:1, kind:"mago",
      story:"No píer, pressione 5 para lançar a linha e espere a fisgada. A vila possui mercado, hospedaria e expedições — a pescaria é uma profissão livre, não o objetivo de todo aventureiro. Dizem que o Lago da Mãe das Águas guarda memórias em suas profundezas."
    },
    {
      id:"faroleira-iara", name:"Faroleira Iara", x:44, z:20, kind:"mago",
      story:"A luz do farol voltou a acender depois de décadas. Basta observar seu reflexo sobre a água para perceber as figuras do mundo antigo. Você não precisa pescar para investigar: a pista está diante de todos que se aproximam."
    },
    {
      id:"mercadora-naila", name:"Mercadora Naila", x:30, z:-28, kind:"forjador",
      story:"O Mercado do Sal recebe peixes, ferramentas e mercadorias de Azarath. Quando a economia online estiver pronta, comerciantes e aventureiros poderão negociar aqui. Por enquanto, visite a mochila para conferir seus recursos."
    },
    {
      id:"mestre-ferreiro", name:"Mestre Ferreiro", x:3, z:46, kind:"forjador",
      story:"Pressione 4 perto dos cristais para minerar. Depois leve 3 minérios às brasas da oficina e pressione 4 para forjar. Os forjadores aproveitam melhor os materiais. O metal destas montanhas começou a vibrar quando o farol despertou."
    },
    {
      id:"guardiao-floresta", name:"Guardião da Floresta", x:-38, z:-22, kind:"mago",
      story:"As árvores da Floresta dos Sussurros guardam vozes anteriores à Capital. A história deste capítulo ainda não foi liberada, mas suas trilhas já fazem parte de Azarath."
    }
  ],
  story: {
    chapter: 1,
    chapterTitle: "Capítulo I — A Luz Sobre o Lago",
    stages: [
      { id:"audiencia", title:"O chamado de Elyra",
        description:"Fale com a Capitã Elyra na praça da Capital de Azarath.",
        trigger:"talk:capita-elyra", xp:20, notice:"Elyra revelou as primeiras pistas da luz misteriosa." },
      { id:"estrada-das-lanternas", title:"Uma cidade além da capital",
        description:"Siga pela estrada a leste e entre na Vila das Marés.",
        trigger:"enter:vila-das-mares", xp:15, notice:"Você descobriu a cidade vizinha de Azarath!" },
      { id:"prefeita", title:"Rumores da Vila das Marés",
        description:"Fale com a Prefeita Marina na Praça das Redes, perto das casas.",
        trigger:"talk:prefeita-marina", xp:20, notice:"Marina contou a história do farol e das redes misteriosas." },
      { id:"testemunha", title:"O pescador e a lenda",
        description:"Encontre Pescador Orien no cais e pergunte sobre o lago.",
        trigger:"talk:pescador-orien", xp:10, notice:"Orien acredita que há uma memória escondida sob as águas." },
      { id:"rede-misteriosa", title:"Um sinal nas águas",
        description:"Capture um peixe no píer (5) OU converse com a Faroleira Iara perto do farol.",
        trigger:["fish:any","talk:faroleira-iara"], xp:15, notice:"Algo no lago reagiu à sua presença. Procure a forja!" },
      { id:"rumo-forja", title:"O metal que responde",
        description:"Viaje até as Montanhas da Forja, ao sul da Capital.",
        trigger:"enter:montanhas-da-forja", xp:15, notice:"O mesmo brilho do farol ecoa nos minérios da montanha." },
      { id:"coletar-minerio", title:"Fragmentos do Véu",
        description:"Minere cristais (4) OU converse com o Mestre Ferreiro para analisar os fragmentos.",
        trigger:["mine:any","talk:mestre-ferreiro"], xp:15, notice:"Você encontrou um minério ressonante." },
      { id:"primeira-forja", title:"A primeira lâmina",
        description:"Forje uma adaga (4) OU volte ao Mestre Ferreiro e receba seu relatório.",
        trigger:["craft:dagger","talk:mestre-ferreiro"], xp:25, notice:"O metal ganhou forma. A Capitã Elyra deve saber disso." },
      { id:"retorno-capital", title:"A resposta de Azarath",
        description:"Volte à capital e fale novamente com a Capitã Elyra.",
        trigger:"talk:capita-elyra", xp:35, notice:"Capítulo I concluído! O mistério do Farol das Marés apenas começou." }
    ],
    epilogue: {
      id:"interludio",
      title:"Interlúdio — Ecos do Véu",
      description:"Capítulo I concluído. Explore as cidades, aprimore profissões e prepare-se para a continuação da história."
    }
  },
  plannedExpansion: [
    { id:"ruinas-do-veu", name:"Ruínas do Véu", level:[12,28], neighbor:"floresta-dos-sussurros", phase:"future" },
    { id:"deserto-de-selkar", name:"Deserto de Selkar", level:[25,45], neighbor:"montanhas-da-forja", phase:"future" },
    { id:"ilhas-do-horizonte", name:"Ilhas do Horizonte", level:[35,60], neighbor:"vila-das-mares", phase:"future" },
    { id:"terras-da-noite", name:"Terras da Noite", level:[50,80], neighbor:"ruinas-do-veu", phase:"future" }
  ]
});
