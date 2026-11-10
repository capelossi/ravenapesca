# Ravena Online — O Despertar de Azarath

> **Pré-alfa de exploração 3D / modo solo, não é um MMORPG online pronto.** Este protótipo foi criado separadamente do jogo de pescaria original, para preservar o conteúdo existente.

## Teste no navegador

1. Abra `ravena-online/index.html` em uma hospedagem estática (Cloudflare Pages/GitHub Pages).
2. Conexão à internet é necessária para carregar Babylon.js pela CDN.
3. Selecione **Mago**, **Espadachim** ou **Forjador**, escolha nome, pele e cabelo.
4. Clique no terreno para caminhar. Um marcador mostra o destino; o personagem tenta contornar objetos via grade de pathfinding A*.
5. Aproxime-se de NPCs e pressione **E** para conversar. Pressione **1** perto dos golens para combater.
6. Explore a cidade central, a floresta a oeste, o lago a leste e a forja ao sul.
7. O personagem, classe, nível, XP, mochila, aparência, contadores e posição são salvos localmente no navegador.
8. Vá até o píer do lago e pressione **5** (ou toque no ícone de pesca) para lançar a linha. Espere cerca de 3 segundos para capturar um peixe.
9. Nas montanhas, aproxime-se dos cristais e pressione **4** para extrair minérios; perto das brasas da forja, pressione **4** para criar adagas usando 3 minérios. **Forjadores** ganham bônus de produção.

## Recursos implementados nesta pré-alfa

- Mundo 3D procedural contínuo no Babylon.js e câmera isométrica que acompanha o personagem.
- Clique/toque no terreno para mover, navegação A* simplificada e obstáculos físicos aproximados.
- Tela de criação de personagem com três arquétipos, tipos de corpo, estilos de cabelo (longo, curto e tranças) e paletas de pele e cabelo.
- Personagens procedurais com pivôs animados para pernas, braços, capa e respiração (ainda não são modelos 3D finais).
- Praça com bancas de mercado, fonte, jardins e NPCs; cristais de minério e ondulações da água.
- Construções de Azarath, floresta, lago (área profunda intransponível), docas e região da forja.
- NPCs com interação contextual, diálogos, missão tutorial e XP.
- Golens estáticos de treino, ataque por tecla, níveis e persistência local.
- Pesca funcional de pré-alfa com 4 espécies e chance de peixe lendário, minério coletável com regeneração, forja simples de adagas e mochila persistida.
- Ataque básico e habilidade especial para cada classe, com recarga e gasto/regeneração de energia.
- Minimap simplificado, HUD, botões de habilidades acionáveis por toque ou clique e controles responsivos.

## Controles

| Ação | Controle |
| --- | --- |
| Andar | Clique ou toque no chão |
| Zoom | Roda do mouse / gesto de pinça |
| Falar com NPC próximo | E |
| Atacar golem próximo | 1 ou ícone de espada |
| Habilidade especial (gasta energia) | 2 ou ícone de brilho |
| Mochila | 3 ou I, ou ícone de mochila |
| Minerar e forjar | 4, perto de cristais ou da oficina |
| Pescar | 5, no píer do lago |
| Diálogo: fechar | Escape ou botão Continuar |
| Mais informações | Botão Controles |

## Limitações importantes

- **Não há autenticação, servidor, sincronização multiplayer, economia, guildas, PvP ou comércio real**. Indicadores de habilidades ainda não são poderes completos.
- Pesca, mineração, forja e inventário **já têm loops demonstrativos locais**, mas ainda não há profissões profundas com progressão própria, missões completas, receitas avançadas, equipamentos utilizáveis ou economia entre jogadores.
- Os personagens são representações 3D geométricas provisórias com animações articuladas simples; ainda não são modelos detalhados com animações esqueléticas, texturas PBR ou a personalização das referências visuais.
- A navegação usa obstáculos circulares simplificados e grade A*, sem NavMesh profissional; obstáculos próximos e rotas longas ainda exigem QA.
- A sintaxe e contratos básicos de interface podem ser validados com `node ravena-online/check.mjs` (também há uma GitHub Action). **Não foi realizado teste manual end-to-end no navegador nesta entrega**: é necessário validar desktop, mobile, desempenho e compatibilidade antes de lançar.
- A entrada roda em uma URL/pasta própria e não altera a página principal do PescaVena.

## Evolução planejada

1. **Qualidade gráfica:** modelos GLB/GLTF próprios, animações, materiais PBR, sombras configuráveis, efeitos, LOD e otimização no celular.
2. **Gameplay:** árvore de talentos, combate com IA inimiga e VFX avançados, evolução das profissões e receitas, itens equipáveis, saque, pesca com minijogo e missões reais.
3. **Mapas:** terrenos autorais e regiões por chunks; casas e interiores.
4. **Servidor autoritativo:** backend Colyseus/Node, PostgreSQL, autenticação, sincronização, persistência, validação e anti-cheat.
5. **MMORPG real:** grupos, chat, comércio com transações, guildas, leilão e eventos de mundo.

## Segurança e arquitetura

Nunca confiar em saldo, HP, localização, ações de combate ou itens enviados pelo cliente em um multiplayer real. Preços e trocas precisam de transações atômicas no banco. O protótipo local não é uma arquitetura segura para economia compartilhada.

## Pasta separada

Todo o código inicial está em `ravena-online/`. A branch `feature/ravena-online-prototipo-3d` foi criada a partir de `main`. Revise a PR antes de mesclar e publicar. O jogo de pescaria existente permanece intacto.
