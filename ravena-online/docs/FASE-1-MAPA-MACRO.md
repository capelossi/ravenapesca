# RAVENA ONLINE — Roteiro oficial da Fase 1: Mapa primeiro

**Estado:** Fases 1.1 e 1.2 com rascunho modular implementado; **Fase 1.3 (Vila das Marés e lago)** em andamento na branch experimental. Revisão física de caminhos, proporções e desempenho ainda necessária.  
**Propósito:** construir e aprovar o mundo antes de substituir os personagens provisórios por modelos de produção.  
**Definição:** a pescaria pertence à **Vila das Marés**, cidade vizinha da Capital de Azarath; não será uma tela ou jogo independente.

## 1. Esquema do continente inicial (não em escala)

```text
                              NORTE (-Z)
                                  ↑

       ┌─────────────────────────┐
       │ FLORESTA DOS SUSSURROS  │      CAPITAL DE AZARATH
       │ trilhas / ruínas /      │         ┌────────────┐       VILA DAS MARÉS
       │ lobos / magia           ├──trilha─┤ praça /    ├─estrada─┬─────────────────┐
       └─────────────────────────┘         │ guilda /   │         │ praça / mercado │
                                         │ estalagem  │         │ cais / farol    │
                                         └─────┬──────┘         │ LAGO DA MÃE     │
                                               │                │ DAS ÁGUAS       │
                                         estrada da forja       └─────────────────┘
                                               │
                                       MONTANHAS DA FORJA
                                       cristais / minas / oficinas

                           SUL (+Z) ↓
```

As regiões são conectadas por **caminhos a pé** no mesmo mundo. As mudanças de cenário deverão ser graduais. Futuramente, o continente usará *streaming* por setores e o jogador continuará a perceber um mundo conectado.

## 2. Escala de implementação do protótipo

O terreno atual possui **184 × 184 unidades de jogo**; a zona caminhável fica aproximadamente entre **-88 e +88 em X e Z**. Isso **não representa quilômetros ou o tamanho final do continente**. As coordenadas são **temporárias para greybox**. A expansão definitiva criará zonas/chunks com coordenadas locais, unidades de escala documentadas e conexões estáveis.

| Região | Centro de referência (X,Z) | Tipo | Conteúdo-base | Estado |
| --- | --- | --- | --- | --- |
| Capital de Azarath | (0, 0) | Cidade segura | Praça, muralhas, mercado e guilda | Estrutura demonstrativa |
| Vila das Marés | (40, -12) | Cidade segura | Praça, mercado, cais e farol | Estrutura demonstrativa |
| Floresta dos Sussurros | (-49, -39) | Exploração | Trilhas, ruínas planejadas e lobos | Trilhas / inimigos provisórios |
| Montanhas da Forja | (0, 57) | Exploração | Oficinas, cristais e minas planejadas | Oficina / mineração provisórias |
| Lago da Mãe das Águas | (55, 1) | Interior geográfico da Vila | Pesca, água, barcos e Mãe das Águas | Lago e píer provisórios |

### Distâncias e orientação
- **Capital → Vila**: seguir pelo leste (+X) na **Estrada das Lanternas**, até a praça.
- **Capital → Floresta**: seguir pela trilha a oeste (-X), entrando no bosque ao norte (-Z).
- **Capital → Forja**: seguir ao sul (+Z), pelo Portão Sul e pela Rota da Forja.
- **Dentro da Vila**: praça → Mercado do Sal → cais → Farol das Marés.

Os valores acima descrevem a estrutura de jogo; não são tempos estimados de viagem. A rota real pode variar por causa de obstáculos e mudanças de terreno.

## 3. Capital de Azarath — próximos distritos a refinar

| Distrito / marco | Função | Entrega esperada |
| --- | --- | --- |
| Praça da Capital | Spawn, primeiros NPCs, orientação | Centro legível e vazio suficiente para movimentação |
| Guilda dos Aventureiros | Contratos, grupos, profissões | Prédio reconhecível e fachada antes dos interiores |
| Mercado de Azarath | Lojas e economia futura | Bancas e vias de circulação sem bloqueios |
| Portão Sul | Saída para forja e outros territórios | Passagem realmente transitável e sinalizada |
| Estalagem e praça social | Jogadores se encontram | Posicionamento reservado; interiores posteriores |
| Castelo e conselho | Centro político do reino | Silhueta e perímetro antes de salas internas |

**Prioridade de refinamento:** 1) acesso e escala; 2) circulação; 3) fachadas; 4) iluminação; 5) interações dos prédios. Não investir em decoração excessiva antes de confirmar as rotas.

**Divisão técnica do trabalho:** `capital-layout.js` guarda a planta e os pontos de acesso; `capital-scene.js` gera o greybox de guilda, estalagem, palácio, praça, feira e iluminação. O Atlas usa as entradas externas como destinos caminháveis. Nenhum interior ou loja de jogadores está funcional ainda.

## 4. Vila das Marés — cidade vizinha da capital

A vila é uma **cidade inteira**, não uma área de minigame. Seu lago é um destaque entre outros serviços e ofícios.

| Distrito | Papel no mundo | Estado |
| --- | --- | --- |
| Praça das Redes | Prefeitura, encontro, prólogo | NPCs e estrutura inicial |
| Mercado do Sal | Peixes, ferramentas, contratos | Bancas de teste |
| Cais da Mãe das Águas | Pesca, embarcações, embarque | Píer e água de teste |
| Farol das Marés | Mistério do Véu e arquivos | Torre e NPC |
| Pousada do Faroleiro | Descanso e socialização | Fachada e entrada já no greybox; interiores futuros |
| Oficinas do Porto | Reparos de barcos e fabricação | Planejadas |

**Identidade visual futura:** telhas azul ardósia, madeira salgada, mercado movimentado e reflexos frios no lago. A economia deverá conectar capital e vila, sem obrigar cada jogador a pescar.

## 5. Trilhas e navegação

O arquivo **`world-layout.js`** contém os IDs das quatro regiões iniciais, quatro caminhos principais/locais e vinte e dois pontos de interesse. O arquivo **`ui-world-map.js`** desenha o Atlas dentro do jogo. A tecla **M** e o botão **Mapa** abrem a interface; locais greybox podem solicitar rota **a pé, nunca teleporte**. Lugares planejados estão marcados e não oferecem rota.

O terreno possui estradas e trilhas provisórias derivadas do manifesto; árvores e rochas são evitadas nas trilhas de acesso. O Portão Sul possui abertura física, em vez de um bloco sólido. A navegação ainda usa grade A* e obstáculos aproximados: **NavMesh, colisões refinadas e QA com percursos longos virão antes de aprovar a fase**.

## 6. Ordem oficial de construção

### Fase 1.1 — Macro/greybox (presente)
- [x] Um mundo base com quatro regiões conectadas.
- [x] Capital e Vila das Marés representadas como cidades diferentes.
- [x] Estradas e trilhas registradas em dados.
- [x] Atlas do reino com pontos de interesse e status de construção.
- [x] Roteamento inicial por clique/toque e seleções no Atlas.
- [ ] Teste completo de deslocamento a pé entre todos os centros em PC e celular reais.
- [ ] Validação sistemática das colisões e das bordas do lago.
- [ ] Revisão de proporção e distância dos prédios antes de arte definitiva.

### Fase 1.2 — Refinar a Capital (em andamento)
- [x] Catálogo modular de três prédios de referência (guilda, estalagem e conselho), com IDs e entradas definidas.
- [x] Fachadas de greybox, bandeiras, avenidas, bancas e iluminação para diferenciar os distritos.
- [x] Acessos dos novos prédios no Atlas, com colisões retangulares nos blocos de arquitetura.
- [x] Dois novos moradores com diálogos explicando os locais.
- [ ] Validar manualmente a caminhada completa entre praça, guilda, mercado, estalagem, palácio e Portão Sul.
- [ ] Ajustar fachadas, proporções, câmera, terreno e rotas a partir dos testes em dispositivos reais.
- [ ] Construir os interiores e serviços apenas depois de aprovar as fachadas e entradas.

### Fase 1.3 — Refinar Vila das Marés e Lago (em andamento)
- [x] Arquivos independentes de planta (`village-layout.js`) e geometria (`village-scene.js`).
- [x] Prefeitura, pousada, armazém, oficina naval e casas dos pescadores com fachadas e acessos sinalizados.
- [x] Praças, mercado, píer, barcos, farol e paisagismo de teste.
- [x] Colisão da lagoa separada dos obstáculos em terra, com corredor caminhável sobre o píer.
- [x] Atlas atualizado com locais construídos e Santuário da Mãe das Águas planejado e desabilitado.
- [x] Dois NPCs de contexto: Dona Celina e Mestre Naval Taren.
- [x] Caminhada **capital → Praça das Redes → píer e pesca** validada por Chromium automatizado em viewport desktop e móvel (GitHub Actions run 42906748689).
- [ ] Confirmar as rotas em celulares físicos e conferir manualmente as entradas de todos os distritos.
- [x] Primeira revisão da água: tons azul-esverdeados menos intensos, textura de ondulações e espuma discreta sem acrescentar obstáculos.
- [ ] Refazer a água com materiais definitivos e avaliar cor e brilho em Android real.
- [x] HUD móvel compacto: minimapa reduzido, controles inferiores separados das barras de vida e interação de NPC tocável.
- [x] Placas e nomes 3D agora aparecem somente de perto; no celular, a conversa mostra o NPC no botão contextual.
- [ ] Ajustar escala, terrenos, sombras e performance após novo teste visual no aparelho real.
- [ ] Adicionar interiores, viagens de barco e economia apenas depois de aprovar o mapa.

### Fase 1.4 — Floresta e Montanhas
- [ ] Terreno e trilhas com biomas distintos.
- [ ] Entradas de minas/ruínas planejadas para interiores posteriores.
- [ ] Locais de NPCs e monstros coerentes com os caminhos seguros.

### Fase 1.5 — Auditoria antes de personagens
- [ ] Verificação desktop + mobile reais.
- [ ] Rota completa por clique/toque entre todos os marcos principais.
- [ ] Profiler de FPS e memória, sem travamentos críticos.
- [ ] Limpeza de elementos que atrapalham câmera, colisão ou leitura visual.
- [ ] Aprovação do mapa macro antes de mexer no rig final do protagonista.

## 7. Próximas fases — após aprovação do mapa

**Fase 2 — Personagens:** substituir bonecos provisórios por modelos GLB de alta qualidade, criar rigs e animações, implementar customização de personagem consistente entre mapas.  
**Fase 3 — RPG:** combate completo, profissões, progressão, loots, NPCs e economia provisória.  
**Fase 4 — Mundo vivo:** quests secundárias, eventos, interiores, iluminação e ciclo ambiental.  
**Fase 5 — Online:** autenticação, zone servers, estado autoritativo, guildas e comércio atômico. Não publicar economia compartilhada antes de testes de segurança.

## 8. Contrato de aprovação

O mapa está suficientemente pronto para seguir aos personagens quando:
1. É possível atravessar capital ↔ vila ↔ cais e sair em direção à floresta/forja por rotas físicas, sem travessias indevidas de água.
2. Os quatro biomas e as duas cidades são visualmente identificáveis mesmo sem textura final.
3. Câmera, colisões, clique e toque respondem de maneira previsível.
4. Atlas e posições de NPCs não apontam para locais permanentemente bloqueados.
5. A versão **Leve** mantém o protótipo funcional em celular de teste real e os resultados ficam documentados.

**Observação:** os modelos 3D e os prédios atuais são rascunhos. O Santuário da Mãe das Águas aparece como ponto futuro e não está jogável. O Atlas ajuda a aprovar a planta, não significa que cada ambiente já tenha acabamento ou serviços funcionais.
