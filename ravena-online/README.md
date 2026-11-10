# Ravena Online — O Despertar de Azarath

> **Pré-alfa de exploração 3D / modo solo, não é um MMORPG online pronto.** Este protótipo foi criado separadamente do jogo de pescaria original, para preservar o conteúdo existente.

## Teste no navegador

1. Abra `ravena-online/index.html` em uma hospedagem estática (Cloudflare Pages/GitHub Pages).
2. Conexão à internet é necessária para carregar Babylon.js pela CDN.
3. Selecione **Mago**, **Espadachim** ou **Forjador**, escolha nome, pele e cabelo.
4. Clique no terreno para caminhar. Um marcador mostra o destino; o personagem tenta contornar objetos com o serviço modular de navegação A*.
5. Aproxime-se de NPCs e pressione **E** para conversar. Nas regiões selvagens, **1** executa ataque básico contra lobos, golens e ecos. **2** usa habilidade especial.
6. Saia da Capital de Azarath e siga a Estrada das Lanternas a leste: a **Vila das Marés é uma cidade vizinha**, com casas, mercado, prefeitura, cais e farol. Explore também a floresta a oeste e a forja ao sul.
7. O personagem, classe, nível, XP, mochila, aparência, contadores e posição são salvos localmente no navegador.
8. Vá até o píer do lago e pressione **5** (ou toque no ícone de pesca) para lançar a linha. Espere cerca de 3 segundos para capturar um peixe.
9. Nas montanhas, aproxime-se dos cristais e pressione **4** para extrair minérios; perto das brasas da forja, pressione **4** para criar adagas usando 3 minérios. **Forjadores** ganham bônus de produção.

## Recursos implementados nesta pré-alfa

- Mundo 3D procedural contínuo no Babylon.js e câmera isométrica que acompanha o personagem.
- Clique/toque no terreno para mover, navegação A* simplificada e obstáculos físicos aproximados.
- Tela de criação de personagem com três arquétipos, tipos de corpo, estilos de cabelo (longo, curto e tranças) e paletas de pele e cabelo.
- Personagens procedurais com pivôs animados para pernas, braços, capa e respiração (ainda não são modelos 3D finais).
- Praça com bancas de mercado, fonte, jardins e NPCs; cristais de minério e ondulações da água.
- Capital de Azarath e **Vila das Marés**, cidade portuária vizinha ligada por estrada caminhável, com casas, praça, bancas de mercado, porto, farol e o Lago da Mãe das Águas. Floresta e montanhas também estão representadas.
- Sete NPCs e **Capítulo I — A Luz Sobre o Lago** com nove etapas, diálogos, exploração e dois caminhos possíveis para obter informações sem exigir pesca ou forja.
- Diário de Crônicas, acessível por J ou pelo botão, com lore, regiões conectadas, missão ativa e próximos territórios planejados.
- **Três famílias de inimigos**: Lobos dos Sussurros (floresta), Golens da Pedra (montanhas) e Ecos do Véu (regiões selvagens). IA local de perseguição e ataques, recompensas, saque, reaparecimento e derrota com retorno à capital.
- HUD de alvo com vida do inimigo e efeitos simples de combate.
- Pesca funcional de pré-alfa com 4 espécies e chance de peixe lendário, minério coletável com regeneração, forja simples de adagas e mochila persistida.
- Ataque básico e habilidade especial para cada classe, com recarga e gasto/regeneração de energia.
- Minimap simplificado, HUD, botões de habilidades acionáveis por toque ou clique e controles responsivos.
- **Ambiente aprimorado**: texturas procedurais de grama, calçamento e telhados, ciclo dia/entardecer/noite e três perfis gráficos (**Leve, Alta, Ultra**) acessíveis pelo botão ⚙.
- Indicador de FPS no desktop e ajuste de resolução/sombras/efeitos por perfil.

## Controles

| Ação | Controle |
| --- | --- |
| Andar | Clique ou toque no chão |
| Zoom | Roda do mouse / gesto de pinça |
| Falar com NPC próximo | E |
| Atacar inimigo próximo | 1 ou ícone de espada |
| Habilidade especial (gasta energia) | 2 ou ícone de brilho |
| Mochila | 3 ou I, ou ícone de mochila |
| Diário de Crônicas | J ou botão Crônicas |
| Minerar e forjar | 4, perto de cristais ou da oficina |
| Pescar | 5, no píer do lago |
| Diálogo: fechar | Escape ou botão Continuar |
| Alterar gráficos | Botão ⚙ Gráficos (Leve, Alta, Ultra) |
| Mais informações | Botão Controles |

## Estrutura para expansão

- `world-data.js` define IDs de regiões, cidades, NPCs, coordenadas, conexões, campanha, diálogos e futuras expansões separadamente do motor gráfico.
- `ui-chronicles.js` cuida do diário sem misturar a renderização com os dados narrativos.
- `navigation.js` implementa navegação A* por grade em módulo independente com fila de prioridade; futuramente será trocado por NavMesh por regiões.
- `graphics.js` gera materiais de teste e controla iluminação, qualidade de imagem e ciclo de dia/noite.
- `combat-rules.js` define tipos de criaturas, vida, dano e tabelas de saque sem depender de Babylon.js.
- `enemies.js` instancia monstros visuais e simula a IA no modo solo.
- `server/zone-engine.mjs` é um **núcleo lógico sem conexões de rede** para posição autoritativa e filtros de proximidade, com testes em Node.js.
- `docs/BIBLIA-DO-MUNDO.md` traz história, facções, regiões, classes e os cinco atos planejados.
- `docs/ARQUITETURA-MMORPG.md` define contratos do conteúdo, streaming futuro por zonas, multiplayer autoritativo, segurança e marcos de lançamento.
- `docs/GRAFICOS-E-PRODUCAO.md` descreve a pipeline de assets GLB, materiais PBR, LOD e metas de qualidade.
- `node ravena-online/check.mjs` valida sintaxe, referências de interface, IDs, conexões, duas rotas narrativas, combate, perfis gráficos e testes da simulação de zona.
- `ravena-online/browser-smoke.mjs` executa testes de fluxo real em Chromium no desktop e no mobile por meio da GitHub Action (separada).

A pescaria **não é um jogo separado**: é uma das atividades da Vila das Marés. O capítulo introdutório permite descobrir o mistério por meio do farol ou da pesca; também admite investigar a forja sem obrigar o jogador a fabricar armas.

## Limitações importantes

- **Não há autenticação, servidor online, sincronização multiplayer, economia, guildas, PvP ou comércio real**. O arquivo de simulação de servidor é apenas uma base isolada. Habilidades ainda são simples testes de dano/energia, não árvores completas.
- Pesca, mineração, forja e inventário **já têm loops demonstrativos locais**, mas ainda não há profissões profundas com progressão própria, missões completas, receitas avançadas, equipamentos utilizáveis ou economia entre jogadores.
- Os personagens são representações 3D geométricas provisórias com animações articuladas simples; ainda não são modelos detalhados com animações esqueléticas, texturas PBR ou a personalização das referências visuais.
- A navegação usa obstáculos circulares simplificados e grade A*, sem NavMesh profissional; obstáculos próximos e rotas longas ainda exigem QA.
- Testes automatizados não garantem jogabilidade final. O teste de navegador é separado e sua execução deve ser verificada no GitHub Actions. Ainda é necessário testar manualmente movimentação, colisões, desempenho e sensação de combate em dispositivos reais.
- A entrada roda em uma URL/pasta própria e não altera a página principal do PescaVena.
- **Esta entrega não é um MMORPG de grande escala concluído.** Há apenas um protótipo conectado com duas cidades e duas regiões de exploração na mesma cena; os interiores, serviços de cidade, NPCs com rotinas, escolhas ramificadas reais e todo o backend MMORPG são futuros desenvolvimentos.

## Evolução planejada

1. **Qualidade gráfica:** modelos GLB/GLTF próprios, animações, materiais PBR, sombras configuráveis, efeitos, LOD e otimização no celular.
2. **Gameplay:** árvore de talentos, combate com animações e IA mais sofisticadas, evolução das profissões e receitas, itens equipáveis, saque com raridade, pesca com minijogo e missões profundas.
3. **Mapas:** terrenos autorais e regiões por chunks; casas e interiores.
4. **Servidor autoritativo:** backend Colyseus/Node, PostgreSQL, autenticação, sincronização, persistência, validação e anti-cheat.
5. **MMORPG real:** grupos, chat, comércio com transações, guildas, leilão e eventos de mundo.

## Segurança e arquitetura

Nunca confiar em saldo, HP, localização, ações de combate ou itens enviados pelo cliente em um multiplayer real. Preços e trocas precisam de transações atômicas no banco. O protótipo local não é uma arquitetura segura para economia compartilhada.

## Pasta separada

Todo o código inicial está em `ravena-online/`. A branch `feature/ravena-online-prototipo-3d` foi criada a partir de `main`. Revise a PR antes de mesclar e publicar. O jogo de pescaria existente permanece intacto.
