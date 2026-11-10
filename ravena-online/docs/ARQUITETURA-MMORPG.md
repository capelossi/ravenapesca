# ARQUITETURA DE EXPANSÃO — RAVENA ONLINE
**Escopo atual:** protótipo estático, 3D e solo. Não há um servidor MMORPG funcional. Este documento define contratos para crescer com segurança.

## Estado inicial
- `index.html` — interface, criação de personagem e telas.
- `style.css` — interface responsiva.
- `world-data.js` — registro de cidades, regiões, NPCs, posições, capítulo e expansões; **nenhum código de renderização**.
- `game.js` — motor Babylon.js, mundo procedural atual, navegação A* simplificada e ações locais.
- `check.mjs` — teste de sintaxe e contratos básicos, sem substituir testes em navegador.
- `docs/BIBLIA-DO-MUNDO.md` — lore e direção criativa.

## Contratos do conteúdo
**IDs:** nomes exibidos podem mudar; `id` não deve mudar sem migração do save. Regiões usam `id`, `name`, `kind`, `bounds` quando aplicável, `neighbors`, `level` e `description`. A capital é o *fallback* quando uma coordenada não pertence a outra região.

**Cidades:** toda cidade deve ter `anchor`, `districts`, `houses`, `market` e uma conexão com o grafo de navegação. Dados de renderização específicos (arte, meshes, interiores) devem permanecer fora dos registros narrativos no longo prazo.

**NPCs:** `id`, `name`, `x`, `z`, `kind`, `story`. Futuramente: `dialogueTreeId`, `shopId`, `scheduleId`, `factionId`, `spawnId`.

**Missões:** `id`, `title`, `description`, `trigger`, `xp`, `notice`. O protótipo usa índice numérico + versão de schema para saves antigos; a versão em servidor deverá usar `questId` e `completedObjectiveIds`, com migrações para múltiplos ramos e coop.

**Eventos no protótipo:** `talk:<npc-id>`, `enter:<region-id>`, `fish:any`, `mine:any`, `craft:dagger`. Nunca usar texto visível como ID de negócio.

## Mapa em escala
Em vez de um único mundo com todos os objetos carregados ao mesmo tempo, evoluir para:
1. Zonas configuradas por manifesto com limites e pontos de conexão.
2. Terreno e construções por *chunks* com níveis de detalhe (LOD).
3. Navegação por NavMesh por chunk, conectando bordas e portais.
4. Interiores sob demanda e regiões isoladas onde houver razão técnica, preservando a percepção de mundo conectado.
5. Prefetch de chunks adjacentes e streaming de assets.
6. Descarte controlado de texturas, malhas e partículas ao sair de regiões.
7. Profiler e metas de qualidade por dispositivo, sem prometer FPS universal.

Na versão inicial de teste, Capital e Vila das Marés convivem em uma única cena. Isto é intencional para validar jogabilidade e transição a pé; não é escalável para todo o continente.

## Multiplayer autoritativo (futuro)
**Cliente:** renderização, câmera, inputs e previsão/interpolação limitada. Nunca assume ser dono de HP, posição validada, saldo, loot ou estoque.

**Gateway de identidade:** login, sessões, limites, banimentos, verificação e controle de abuso; JWT curto ou sessão segura, renovação controlada.

**Servidor de zona (Colyseus/Node ou equivalente):** movimento validado, combate e efeitos de mundo, NPCs, eventos, presença de jogadores e interesse espacial. Sincronizar apenas entidades próximas, não a região inteira para todos.

**Serviço de progressão:** personagens, inventário, missões, XP, habilidades, profissões e achievements; persistência e regras de negócio.

**Serviço econômico:** mercado, trades e crafting com transações PostgreSQL, bloqueio de itens e logs; nunca confiar em moeda ou item enviado do navegador. Idempotência e auditoria.

**Chat/social:** canais por zona, grupo e guilda, moderação, proteção contra spam e abuso; políticas compatíveis com diferentes idades e jurisdições.

**Banco:** contas, personagens, posições, xp, progressão narrativa, itens instanciados, catálogo de receitas, mercado, guildas, auditoria e versões de schema. Backups e migrações.

## Modelo orientativo de domínio
```text
Account(id, status)
Character(id, accountId, name, bodyPreset, classId, level, xp, zoneId, position)
InventoryStack(id, characterId, itemDefId, count)
ItemInstance(id, ownerId, itemDefId, durability, modifiers)
QuestProgress(characterId, questId, completedObjectives, state, version)
ProfessionProgress(characterId, professionId, level, xp)
MarketListing(id, sellerId, itemInstanceId, price, status, version)
WorldRegion(id, connections, spawnPoints, difficultyBand)
Guild(id, leaderId, treasury, members)
```

## Backlog por etapas e critérios de aceite
**Marco A — Mundo e enredo (ATUAL):** uma capital e uma vila vizinha, estrada contínua, NPCs com IDs e prólogo em progressão. Pronto para teste visual; precisa validação manual em desktop e mobile.

**Marco B — Vertical slice RPG:** uma cidade aprofundada; avatar GLB animado por classe; duas habilidades reais por classe; quatro tipos de inimigos com IA; inventário/equipamento jogável; profissões básicas; quests com escolhas; checkpoints. Critério: loop de 30 minutos sem comandos falsos.

**Marco C — Online fechado:** dois jogadores conectados na mesma zona, movimento interpolado, autenticação, chat e salvamento servidor. Critério: reconexão sem duplicação de itens ou perda de progressão.

**Marco D — Economia:** profissões profundas, bancas, comércio atômico, guildas, leilão. Critério: testes de concorrência e anti-duplicação.

**Marco E — Expansão:** mais mapas com streaming, chefes mundiais, grupos, ciclos, eventos e observabilidade. Critério: orçamento de CPU/RAM/rede medido sob carga de usuários simulados.

## Critérios de qualidade
- Sem travamentos críticos, sem progressão duplicada, sem perda silenciosa de save.
- Input mouse, toque, zoom e botões mobile funcionais.
- Sem vazamento de recursos de GPU ao navegar entre zonas (quando houver streaming).
- Interface de texto legível em tela pequena e acessível por teclado.
- Testes unitários para regras de negócio e testes e2e de navegação, craft, missões e saves.
- Logs de servidor sem dados privados de jogadores.
- Sem lançar marketplace real antes de testes de segurança.

## Separação do PescaVena
O PescaVena antigo fica intacto. A pescaria do Ravena Online é uma profissão dentro da Vila das Marés, não um iframe ou jogo à parte. Sistemas e arte do PescaVena podem servir como inspiração, mas precisam migrar para um catálogo de itens e persistência comuns ao MMORPG.

## Limites atuais
Não existe ainda deploy verificado, personagens 3D finais, infraestrutura MMO ou load-test. A branch é de desenvolvimento; publicar não deve apagar o site anterior.
