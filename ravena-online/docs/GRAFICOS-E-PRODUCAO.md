# RAVENA ONLINE — Direção gráfica e plano de produção

## Propósito desta etapa

O protótipo contém duas cidades conectadas, ambientes gerados com primitivas, texturas procedurais, ciclo visual dia/noite, perfil de qualidade por dispositivo, combate local com três tipos de criaturas e esqueleto lógico de servidor. **Não é ainda o visual definitivo das artes conceituais nem um MMO online.**

A direção de arte desejada é **fantasia medieval isométrica de alto detalhe** com iluminação cinematográfica, arquitetura legível, personagens estilizados e uma atmosfera um pouco sombria ligada à Ravena. Priorizar silhueta e legibilidade sobre efeitos que encobrem o jogo.

## Identidade visual por região

| Região | Materiais | Iluminação | Elementos únicos |
|---|---|---|---|
| Capital de Azarath | Calçamento de pedra, madeira nobre, telhas vermelhas | Sol dourado, tochas em portões | Torreões, praças, guildas, mural de missões |
| Vila das Marés | Madeira gasta, pedra clara, telhas azul ardósia | Brisa fria, farol, reflexos de lago | Docas, barcos, mercadores, redes, hospedaria |
| Floresta dos Sussurros | Musgo, raízes, rochas e ruínas | Luz filtrada entre árvores, bioluminescência sutil | Lobos, ecos do Véu, ruínas |
| Montanhas da Forja | Basalto, metais, fornalhas e cristais | Brilho de brasas e cristais, sombras fortes | Oficinas, minas, veios de minério |

## Padrão de personagens

O jogo precisa de modelos próprios e animados (formato GLB/GLTF), com:
- Esqueleto compartilhado entre avatares compatíveis para reutilizar movimentos.
- Animações de idle, corrida, golpe, magia, mineração, forja, pesca, reação e derrota.
- Camadas de roupa/equipamento que não atravessem o corpo durante a animação.
- Variações visuais de cabelo, pele, acessórios, corpo e silhueta da classe.
- Níveis de detalhe de personagens para avatares próximos e distantes.
- Controles de visibilidade de capa, brilho mágico e efeitos por perfil de qualidade.

**Estado atual:** os bonecos geométricos apenas demonstram posicionamento e articulação; não substituem os avatares finais.

## Materiais e texturas

Produzir materiais PBR: baseColor, normal, roughness/metallic, emissive somente onde necessário; otimizar atlas e reuso. Projetar shaders com alternativa leve. Não incorporar imagens de jogos comerciais, marcas ou modelos sem licença.

As texturas de teste presentes em `graphics.js` são geradas no navegador: grama, calçamento e telhados. Elas evitam arquivos externos nesta fase, mas serão substituídas por materiais de produção.

## Qualidade e desempenho

Os perfis do protótipo estão em `graphics.js`:
- **Leve:** reduz resolução interna e desativa iluminação com sombras e pós-processamento mais pesados.
- **Alta (equilibrado):** sombras e resolução intermediária.
- **Ultra:** resolução maior, sombras e halo nas fontes emissivas.

**Metas de projeto, ainda não validadas:** 30 FPS estáveis em celular intermediário, 60 FPS no PC intermediário. Medir o uso de memória e carregamento, em vez de declarar FPS garantidos.

Para o mundo completo:
- Streaming por setores e descarte de objetos fora da área ativa.
- Instancing para vegetação, lanternas, cercas e elementos repetidos.
- Occlusion culling, LOD, geometria combinada de estruturas estáticas e limite de materiais.
- Texturas comprimidas, atlas, budgets de VRAM por dispositivo e caches locais.
- Animações com custo reduzido para NPCs distantes e limites de partículas/efeitos por perfil.
- Testes regulares de Android e Chrome desktop reais, inclusive dispositivos lentos.

## Pipeline sugerido

1. **Modelagem:** Blender ou ferramenta equivalente para cenários, roupas e personagens.
2. **Texturização:** PBR otimizado, atlases por família de assets; comprimir imagens.
3. **Animação:** rig humanoide comum e variações por classe/profissão.
4. **Exportação:** glTF 2.0 / GLB, escalas padronizadas, metadados e colisões.
5. **Integração:** gerenciador de assets com preload do distrito atual e descarte de regiões distantes.
6. **QA:** perfis Leve/Alta/Ultra, queda de FPS, variação dia/noite, uso de bateria e telas móveis.

## Backlog visual por prioridade

**Marco 1 — Identidade das cidades:** fachada de guilda, mercado, cais e farol com materiais próprios; transição a pé legível da Capital para a Vila das Marés.

**Marco 2 — Avatares reais:** uma versão masculina e outra feminina de cada arquétipo, com animações e customização em tempo real.

**Marco 3 — Combate com feedback:** efeitos de acerto, rastreio visual do alvo, animações especiais, barras legíveis, sinais de ataques inimigos e feedback de dano sem poluir a tela.

**Marco 4 — Região exterior profunda:** floresta com variação de terreno, encontro de monstros, pontos de interesse e masmorra curta.

**Marco 5 — Expansão sustentável:** carregamento dinâmico por região e preparação para servidores separados por zona.

## Limitações conscientemente assumidas

Não renderizar tudo em 4K, nem dezenas de milhares de objetos sem LOD, nem todas as cidades em uma única cena. Isso impediria a escala real no navegador. Visuais de qualidade exigem assets preparados e uma arquitetura de streaming, não apenas aumentar a contagem de polígonos.

Não declarar o jogo finalizado com base em imagens conceituais ou em testes de sintaxe: validar ao menos um fluxo no navegador (criação de personagem, clique para andar, combate, troca de qualidade e retorno ao personagem) em PC e mobile.
