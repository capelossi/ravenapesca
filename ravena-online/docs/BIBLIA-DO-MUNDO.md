# BÍBLIA DO MUNDO — RAVENA ONLINE
**Título de trabalho:** O Despertar de Azarath  
**Ciclo narrativo:** A Era das Marés Silenciosas  
**Estado:** documento de design. Capítulo I tem gatilhos demonstrativos implementados no protótipo; a narrativa completa e as expansões são planos, não conteúdo já jogável.

## 1. Fantasia do jogador
O jogador chega como um aventureiro sem renome em Azarath e escolhe como construir sua história: luta, magia, artesanato, exploração, pesca, comércio ou relações com outros aventureiros. O mundo não é estruturado em torno da pescaria. Ela é uma profissão importante e uma das atividades de uma cidade vizinha.

**Regra:** nenhuma classe precisa pescar para ser competitiva; a missão tutorial de captura é um encontro opcionalmente substituível por outras provas na versão definitiva. Na pré-alfa, o Capítulo I ainda exige a captura de um peixe como demonstração de mecânica.

**Tom:** fantasia medieval misteriosa e luminosa, contrastando cidades acolhedoras, ruínas sombrias e magia ancestral. Violência estilizada, sem violência gráfica explícita.

## 2. O mundo, a memória e a Ravena
- **O Véu:** fronteira entre o mundo presente e ecos do passado. Seu desgaste explica ruínas, criaturas e fenômenos.
- **Os Faróis:** pontos de orientação que selavam o Véu. Um deles voltou a iluminar sozinho na costa do Lago da Mãe das Águas.
- **A Ravena:** uma guardiã dos registros e memórias; observa decisões e tenta impedir a repetição de uma antiga catástrofe. Não é inimiga automática nem instrumento para retirar escolhas do jogador.
- **A Mãe das Águas:** presença ancestral ligada ao lago, aos ciclos naturais e ao mistério dos objetos encontrados nas redes; seu santuário é um eixo narrativo, não uma obrigação de profissão.
- **Azarath:** reino de comércio, guildas, rotas e conflitos políticos. Suas cidades possuem interesses próprios.

## 3. Geografia inicial e conexões
### Capital de Azarath
Centro político e social. Conselho, guilda de aventureiros, mercado, bancos, estalagens, mural de contratos e ponto inicial. O jogador começa aqui, encontra a Capitã Elyra e aprende a se mover.

### Vila das Marés (cidade vizinha, não minigame separado)
**Localização:** a leste da capital, ligada pela **Estrada das Lanternas**. É uma cidade inteira, com famílias, hospedaria, mercado de sal e peixe, farol, porto, artesãos, guardas, pescadores e viajantes.

**Bairros planejados:**
1. Praça das Redes — prefeitura, quadro de avisos, serviços.
2. Mercado do Sal — peixe fresco, reagentes, ferramentas, comerciantes.
3. Cais da Mãe das Águas — barcos, pescaria, balsa e expedições.
4. Farol das Marés — mistério, arquivos de navegação, acesso futuro a ilhas.
5. Bairro dos Remendos — moradias e alfaiataria (expansão).
6. Pousada do Faroleiro — descanso e ponto social (expansão).

**Atividades:** pescaria por níveis e raridade; contratos de entrega; reparo de embarcações; comércio; culinária; exploração; missões de proteção; eventos climáticos; em expansões, barcos e ilhas. Um espadachim pode ser contratado para defender o cais, um mago pode estudar o farol e um forjador pode criar redes e peças de barcos.

### Floresta dos Sussurros
Ruínas, coleta, fauna, espíritos e segredos do Véu. Entrada a oeste; caminhos futuros para masmorras e ruínas.

### Montanhas da Forja
Minerais, oficinas e mestres artesãos. Região de progressão e equipamentos, interligada à capital.

### Expansões (não implementadas)
Ruínas do Véu, Deserto de Selkar, Ilhas do Horizonte e Terras da Noite. Cada região deve ter limites de nível recomendados, necessidades econômicas, facções, cadeia de quests e conexões justificadas.

## 4. Campanha principal em cinco atos
**Ato I — A Luz Sobre o Lago:** Elyra convoca o jogador; a Vila das Marés relata o farol aceso; Orien mostra os sinais na água; a forja confirma a ressonância dos minérios; o jogador retorna à capital com a primeira prova. **É o único ato com progressão básica demonstrativa no código atual.**

**Ato II — Cartas da Cidade Submersa:** arquivos do farol revelam o nome de uma civilização esquecida. Escolhas de confiança entre prefeitura, conselho e guildas.

**Ato III — Os Quatro Faróis:** expedições conectam floresta, montanhas, deserto e ilhas. Chefes mundiais representam o desgaste do Véu; resolução cooperativa possível.

**Ato IV — A Guerra dos Ecos:** facções disputam tecnologia e relíquias; ações coletivas alteram eventos globais, sem bloquear a história de novos jogadores.

**Ato V — O Julgamento de Ravena:** jogador escolhe o destino dos registros do mundo; consequências narrativas por temporadas, sem vantagem permanente de poder por escolhas morais.

## 5. Capítulo I — jornada jogável na pré-alfa
Gatilhos administrados por `world-data.js`, identificados por ID estável e sem depender do nome visual:
1. Falar com Capitã Elyra em Azarath.
2. Atravessar a estrada e chegar à Vila das Marés.
3. Conhecer Prefeita Marina na Praça das Redes.
4. Falar com Orien no cais.
5. Capturar um peixe.
6. Viajar até as Montanhas da Forja.
7. Minerar um veio de cristal.
8. Forjar uma adaga.
9. Voltar a Elyra e encerrar o capítulo.

**Correção futura importante:** dar três alternativas equivalentes à etapa 5 (pescar, investigar o farol ou defender o mercado). A história deve incentivar a explorar a vila, mas não impor pescaria como profissão.

## 6. Classes, especializações e ofícios
- **Mago** — dano mágico, controle, suporte; futura especialização elemental/arcana.
- **Espadachim** — combate próximo, bloqueio, mobilidade; futura especialização duelista/guardião.
- **Forjador** — arquétipo inicial de combate com martelo **e** afinidade de ofício. A longo prazo, separar classe de combate e profissão para permitir que qualquer classe evolua ferraria livremente.
- **Outras classes futuras:** arqueiro, curandeiro, conjurador, sentinela (após equilibrar as três iniciais).
- **Profissões horizontais:** pescador, mineiro, ferreiro, lenhador, cozinheiro, alquimista, mercador e cartógrafo.
- **Economia:** locais específicos para comprar, vender e trocar; materiais com fontes distintas; não vender poder absoluto por dinheiro real.

## 7. Cidades vivas e escala social
Todo assentamento novo deve ter nome, prefeito/líder, identidade visual, lugares de encontro, oferta/demanda, NPCs e serviços, contexto histórico, conexão física com o mundo, atividades próprias e ao menos uma trama secundária. Um mapa vazio com NPCs de fachada não conta como cidade completa.

Sistemas sociais futuros: guildas, chat por proximidade/grupo/cidade, grupos de expedição, mercado, casas, títulos e ranking sazonal. Eventos de mundo com janelas de participação acessíveis, sem recompensas indispensáveis que forcem presença constante.

## 8. Princípios da experiência
1. O mundo deve ser explorável com clique para andar (mouse) e toque no celular.
2. Classes e profissões não restringem a liberdade de exploração.
3. O jogador entende onde está e por que a próxima missão importa.
4. Progressão respeita jogadores casuais e quem gosta de investir tempo.
5. Cidades possuem identidade, não são apenas skins do mesmo mapa.
6. Qualidade gráfica alta deve coexistir com opção de desempenho.
7. Cada expansão preserva saves e IDs de conteúdo antigos.
8. Todo conteúdo multiplayer e economia passa por autoridade do servidor.

## 9. Glossário de nomes canônicos
- Azarath: nome do reino e da capital.
- Vila das Marés: cidade vizinha da capital (núcleo portuário da pescaria).
- Estrada das Lanternas: conexão terrestre entre capital e vila.
- Lago da Mãe das Águas: lago que faz parte da cidade portuária.
- Farol das Marés: marco físico do cais e elemento de enredo.
- Mercado do Sal: centro comercial da vila.
- Floresta dos Sussurros: região de natureza e ruínas.
- Montanhas da Forja: mineração e artesanato.
- O Véu: fenômeno místico do universo.
- Ravena: guardiã das memórias.
