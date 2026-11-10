# Ravena Online — O Despertar de Azarath

> **Pré-alfa de exploração 3D / modo solo, não é um MMORPG online pronto.** Este protótipo foi criado separadamente do jogo de pescaria original, para preservar o conteúdo existente.

## Teste no navegador

1. Abra `ravena-online/index.html` em uma hospedagem estática (Cloudflare Pages/GitHub Pages).
2. Conexão à internet é necessária para carregar Babylon.js pela CDN.
3. Selecione **Mago**, **Espadachim** ou **Forjador**, escolha nome, pele e cabelo.
4. Clique no terreno para caminhar. Um marcador mostra o destino; o personagem tenta contornar objetos via grade de pathfinding A*.
5. Aproxime-se de NPCs e pressione **E** para conversar. Pressione **1** perto dos golens para combater.
6. Explore a cidade central, a floresta a oeste, o lago a leste e a forja ao sul.
7. O personagem, classe, nível, XP e posição são salvos localmente no navegador.

## Recursos implementados nesta pré-alfa

- Mundo 3D procedural contínuo no Babylon.js e câmera isométrica que acompanha o personagem.
- Clique/toque no terreno para mover, navegação A* simplificada e obstáculos físicos aproximados.
- Tela de criação de personagem com três arquétipos, cores básicas de pele e cabelo.
- Construções de Azarath, floresta, lago (área profunda intransponível), docas e região da forja.
- NPCs com interação contextual, diálogos, missão tutorial e XP.
- Golens estáticos de treino, ataque por tecla, níveis e persistência local.
- Minimap simplificado, HUD, barra de habilidades ilustrativa e controles adaptados a telas menores.

## Controles

| Ação | Controle |
| --- | --- |
| Andar | Clique ou toque no chão |
| Zoom | Roda do mouse / gesto de pinça |
| Falar com NPC próximo | E |
| Atacar golem próximo | 1 |
| Diálogo: fechar | Escape ou botão Continuar |
| Mais informações | Botão Controles |

## Limitações importantes

- **Não há autenticação, servidor, sincronização multiplayer, economia, guildas, PvP ou comércio real**. Indicadores de habilidades ainda não são poderes completos.
- A profissão de pescaria, crafting de equipamentos, inventário e sistema de missões complexo serão implementações posteriores. Os NPCs atuais explicam o universo e participam apenas de um tutorial.
- Os personagens são representações 3D geométricas provisórias; ainda não são os modelos com animações, texturas PBR e personalização avançada das referências visuais.
- A navegação usa obstáculos circulares simplificados e grade A*, sem NavMesh profissional. Os personagens ainda não possuem animações esqueléticas.
- Não foi realizado teste manual end-to-end de navegador nesta entrega; é necessário validar desktop, mobile, desempenho e compatibilidade antes de lançar.
- A entrada roda em uma URL/pasta própria e não altera a página principal do PescaVena.

## Evolução planejada

1. **Qualidade gráfica:** modelos GLB/GLTF próprios, animações, materiais PBR, sombras configuráveis, efeitos, LOD e otimização no celular.
2. **Gameplay:** inventário, árvore de talentos, combate com cooldown e VFX, crafting, mineração, pesca, equipamentos e saque.
3. **Mapas:** terrenos autorais e regiões por chunks; casas e interiores.
4. **Servidor autoritativo:** backend Colyseus/Node, PostgreSQL, autenticação, sincronização, persistência, validação e anti-cheat.
5. **MMORPG real:** grupos, chat, comércio com transações, guildas, leilão e eventos de mundo.

## Segurança e arquitetura

Nunca confiar em saldo, HP, localização, ações de combate ou itens enviados pelo cliente em um multiplayer real. Preços e trocas precisam de transações atômicas no banco. O protótipo local não é uma arquitetura segura para economia compartilhada.

## Pasta separada

Todo o código inicial está em `ravena-online/`. A branch `feature/ravena-online-prototipo-3d` foi criada a partir de `main`. Revise a PR antes de mesclar e publicar. O jogo de pescaria existente permanece intacto.
