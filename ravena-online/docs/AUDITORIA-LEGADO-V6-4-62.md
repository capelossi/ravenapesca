# AUDITORIA DE PARIDADE — Ravena Pescaria RPG V6.4.62 × Ravena Online (pré-alfa 0.7)

> **ATUALIZAÇÃO DE 11/11/2026:** Este documento é o retrato histórico da versão 0.7, antes da restauração. Na branch `feature/restauracao-mae-aguas-templo-ravena`, já foram restaurados os derivados das duas artes originais, o pedestal submerso da Mãe das Águas, o Templo do Crepúsculo com portal/altar e as quatro bênçãos de dez minutos, além de um mercado de peixes local. Consulte [RESTAURACAO-CRITICA-LEGADO.md](RESTAURACAO-CRITICA-LEGADO.md) para o estado mais recente. **A pesca profunda, o Mercado Noturno, as varas e as oito skins ainda não foram migrados.**

**Auditoria:** 10/11/2026  
**Escopo:** análise do ZIP original `Ravena_V6_4_62_Atelie_Arte_e_Sprites.zip` e de quatro ZIPs de controle V6.4.36, V6.4.42, V6.4.53, V6.4.57, confrontados com os fontes `ravena-online/` nesta branch.  
**Conclusão:** **NÃO HÁ PARIDADE**. O Ravena Online é uma base 3D separada para um MMORPG maior, mas perdeu temporariamente marcos narrativos, arte e vários subsistemas da pescaria antiga. **Não confundir ausência no novo jogo com exclusão deliberada do projeto.**

## Verificação técnica executada
- ZIP V6.4.62 abre sem erro de CRC; contém 91 entradas de arquivo. `js/game.js` e `js/fishing-v5.js` passaram em `node --check`.
- A versão anterior conserva originais WebP de `mae-das-aguas-guardia-serena-v6436.webp`, `ravena-estatua-v6431.webp` e oito artes de personagem (quatro masculinas e quatro femininas) em `assets/skins/`.
- O código do V6.4.62 foi examinado: `const sanctuaryWorld`, `drawMotherOfWaters`, `drawRavenaSculpture`, `enterSanctuary`, `drawMarketInterior`, `renderMarket`, `renderRanking`, `RAVENA_BUFFS`, `goFish`, `skins` e progressão.
- O Ravena Online atual foi confrontado em `game.js`, `world-data.js`, `world-layout.js`, `village-layout.js`, `village-scene.js`, `index.html`, `graphics.js` e `server/zone-engine.mjs`. A pasta `ravena-online/` **não contém** `assets/` nem as artes do ZIP antigo.
- A CI recente do novo projeto passou nos testes estáticos e nos testes básicos de navegador desktop/mobile; isso **não testa paridade visual ou funcional com o legado**.
- A auditoria é do **código e dos recursos existentes**, não certificação de gameplay de ponta a ponta do ZIP antigo ou de escala de rede.

## Matriz de paridade

| Subsistema | V6.4.62 original | Ravena Online 0.7 | Estado |
|---|---|---|---|
| Mundo geral | Vila/lago 2D, mercado e santuário como cenas separadas | Mundo 3D com Capital, Vila das Marés, floresta, forja | **Evoluiu, não igual** |
| Mãe das Águas | WebP aprovado, mãe sentada abraçando criança, águas azuis, base submersa, reflexos | Lago tem água/píer; monumento não foi incluído | **AUSENTE** |
| Ilha caminhável | Última versão especifica **pedestal submerso sem ilha transitável** | Não há ilha da estátua | **Não exigir ilha transitável para paridade** |
| Ravena: escultura | `ravena-estatua-v6431.webp`, capuz, joia roxa/vermelha, anéis mágicos, pedestal | Referências textuais e narrativa apenas | **AUSENTE** |
| Templo do Crepúsculo | `scene='sanctuary'`, sala dedicada, arquitetura gótica, vitral, altar, colisões, portal de entrada/saída | Nenhum templo interno ou portal funcional | **AUSENTE** |
| Portal do templo | Portal gótico **único** perto da vila; porta vermelha extra removida na V6.4.14 | Nenhum portal do templo | **AUSENTE** |
| Bênçãos da Ravena | Sorte, Sabedoria, Fortuna, Águas; 10 min; uma de cada vez; oferenda de peixe | Sem altar e sem buffs | **AUSENTE** |
| Mercado Noturno | Cena interior com escadas, balcões distintos, compra/venda/troca local demo | Bancas decorativas, não há interior nem trade | **AUSENTE** |
| Loja de Pesca | Loja para comprar iscas e interação de venda; moeda local | Não há economia funcional nem iscas | **AUSENTE** |
| Lápide dos Campeões | Monumento com painel de ranking demonstrativo | Não existe lápide/ranking | **AUSENTE** |
| Pescaria | Minijogo de habilidade: segurar/soltar, fisgada, possibilidade de perder peixe | Captura automática após cerca de 2,7 segundos | **SIMPLIFICADO** |
| Espécies | 6 espécies nomeadas + 5 raridades, peso individual e valor | 4 categorias (lambari, tilápia, carpa e lendário genérico) | **INCOMPLETO** |
| Local de pesca | Píer e margem do lago | Apenas corredor do píer | **RESTRIÇÃO NOVA** |
| Varas de pesca | Cinco varas nos níveis 1, 10, 25, 50 e 75; bônus de raridade | Sem varas/equipamentos de pesca | **AUSENTE** |
| Iscas e moedas | Consumo de isca, compra, venda e saldo | Não há iscas ou saldo em moedas | **AUSENTE** |
| Mochila | Peixes individuais com raridade, peso, valor, filtros, limite 100 kg | Pilhas simples por espécie/material | **PARCIAL** |
| Perfis/níveis | XP até 100, títulos, capturas, recordes, vara equipada | Nome, classe, XP por nível, posição e inventário local | **PARCIAL / CURVA DIFERENTE** |
| Skins | 8 imagens originais, masculino/feminino; Clássico/Ravena/Fantasma/Abissal, níveis 1/25/50/75 | Formas geométricas com corpo/cabelo/cor; sem os oito sprites | **AUSENTE/REIMAGINADO** |
| Personagens base | Pescadores animados em Canvas (sprite em cache) | Avatar 3D procedural com três classes | **NOVO, NÃO EQUIVALENTE** |
| Movimentação | Joystick touch e teclado, colisões em cenas 2D | Clique/toque para andar com A* 3D; botão de NPC no mobile | **MUDANÇA INTENCIONAL** |
| Comércio entre jogadores | Demo de dois perfis locais, negociação somente dentro do mercado | Não existe trade do novo jogo | **AUSENTE** |
| Chat | UI global/próximo/privado e backend experimental opcional; modo solo não conecta | Sem chat conectado; núcleo lógico de zona sem WebSocket | **NÃO PORTADO** |
| Contas/servidor | Backend experimental isolado, chat/login/API econômica **não integrada ao gameplay** | Núcleo de simulação de movimento, sem auth/WSS/banco | **EXPERIMENTOS DIFERENTES** |
| Atmosfera | Noite mística, violeta/rubi, luz lunar e bosque, Ravena/água como marcos | Dia/noite e grafismo 3D inicial, mas sem os principais marcos | **PARCIAL** |
| Comércio/forja | Venda/troca/loja de pescaria; ferreiro não é sistema central no ZIP | Mineração e forja simples, classes, combate, mais regiões | **AVANÇO DO MMORPG** |
| Multiplayer real | Não conectado, dependia de servidor | Também não conectado | **PENDENTE NOS DOIS** |
| Salvamento | Várias chaves próprias (progressão, skins, trade demonstrativo etc.) | `ravena-online-alpha1` | **SEM MIGRAÇÃO** |

## Descobertas de design que precisam ser preservadas
1. **Mãe das Águas**: imagem aprovada com mãe e criança, vestido cobrindo pés, cascata azul, pedestal submerso; **sem exigir ilha caminhável** no design V6.4.62. Local: centro do Lago da Mãe das Águas; interações e efeitos podem ser redesenhados, mas a silhueta e identidade não devem se perder.
2. **Ravena**: guardiã com manto/capuz, joia e magia violeta. Templo do Crepúsculo como **área interna separada**, via **um único portal gótico**; a porta vermelha adicional foi removida na V6.4.14. Estrutura gótica, vitral e altar presentes no antigo.
3. **Quatro bênçãos**: Sorte (+3,5 pontos percentuais na rolagem de raro), Sabedoria (+20% XP por captura), Fortuna (+15% moedas em vendas ao sistema), Águas (1 isca a cada 10 capturas). Uma por vez, duração 10 minutos e oferenda de peixe; **rever balanceamento antes de uso em MMORPG**, especialmente economia online.
4. **Mercado Noturno**: manter ambiente distinto, escadaria, bancas para comprar/vender/trocar, e regra de negociar **dentro do mercado**. O trade antigo é apenas uma simulação local com dois perfis, não multiplayer seguro.
5. **Profissão de pescador**: manter a ideia de habilidade, raridade, peso, valor, varas evolutivas, iscas e mochila; adaptar a profissão para coexistir com magos, espadachins e forjadores. Pescaria não deve ser a única ocupação possível.
6. **Skins**: quatro linhas visuais por sexo, progressão 1/25/50/75, prévia ilustrada e visual em movimento como versões diferentes; o personagem 3D futuro precisa de arte coerente, não apenas reutilizar a miniatura 2D como um mesh.
7. **Lápide dos Campeões**: marco da vila com ranking; no MMORPG requer dados reais do servidor, não números fictícios apresentados como online.
8. **Saves antigos**: não apagar as chaves legadas e não apresentar progresso local como progresso de conta; futura migração requer importador com validação, idempotência e revisão de regras.

## Roteiro de recuperação sem desmontar o novo mundo

### P0 — Reconquistar a identidade do universo
- Integrar a **Mãe das Águas aprovada** no centro do lago como monumento visual 3D provisório ou sprite vertical sem colisão, com pedestal e luz discretos; preparar posterior escultura GLB.
- Reservar, implementar e testar **um portal único para o Templo do Crepúsculo**, mantendo o templo em instância interior própria, próximo da região portuária/floresta sem quebrar a geografia.
- Recriar altar/escultura da Ravena e cerimônia básica de interação. Testar câmera e colisões, especialmente no Android.
- Manter os recursos do legado em pasta própria com manifesto de origem; **não depender de URLs antigas ou apagar o ZIP**.

### P1 — Restaurar a pescaria como profissão da Vila das Marés
- Reintroduzir minijogo de fisgada/tensão com interface de toque, espécies originais e captura por raridade/peso/valor.
- Tornar segura e acessível a pesca na margem do lago (não apenas píer), com teste de colisão para impedir entrar na água.
- Implementar equipamento de cinco varas, iscas e inventário com peso, sem simplificar os itens antigos.
- Migrar bônus da Ravena para um serviço de efeitos modular; manter apenas um efeito por vez, temporizado e sem acúmulo.

### P2 — Recuperar a economia e os lugares sociais
- Criar um interior próprio para o Mercado Noturno, com escada, balcões e loja de iscas; adicionar Lápide dos Campeões.
- No modo solo, avisar explicitamente que anúncios/trades/ranking são demonstrativos ou simplesmente desativá-los até haver servidor; nunca exibir jogadores fictícios como reais.
- Portar as 8 artes do Ateliê e requisitos de desbloqueio para o futuro criador de personagem/equipamentos.

### P3 — Integração MMORPG genuína
- Projetar contas, inventário, combate, venda e buffs autoritativos com banco transacional e login seguro.
- Criar migração opcional, verificável e versionada de saves do antigo, sem declarar os IDs de itens anteriores como automaticamente compatíveis.
- Somente então ativar chat, trocas e multiplayer com servidor e políticas de segurança.

## Critérios de aceite da restauração
- Ao chegar à Vila das Marés, o jogador **vê a Mãe das Águas aprovada** como ponto central, sem cenário neon e sem caminhar pelo lago.
- O Templo do Crepúsculo é alcançável por **portal único**, com transição, interior, escultura da Ravena, altar, efeitos e saída funcional.
- Existe uma oferenda capaz de ativar uma das **quatro bênçãos** por 10 minutos no modo solo, com persistência e testes.
- Pescaria tem erro/acerto, captura com espécie/peso/raridade/valor, varas e inventário; é acessível por margem segura e cais.
- O Mercado Noturno possui localização, interior e balcões; nenhuma troca real sem servidor.
- Skins e níveis do legado são preservados como **referência/catálogo**, sem forçar a curva de XP do MMORPG a ser idêntica à do RPG de pesca.
- O teste automatizado verifica portal, altar, colisões, pescaria, mercado e save em viewport desktop e mobile, além de teste manual Android.

## Referências técnicas

**ZIP auditado:** `Ravena_V6_4_62_Atelie_Arte_e_Sprites.zip`; verificações cruzadas com `Ravena_V6_4_36_Mae_das_Aguas_Aprovada.zip`, `Ravena_V6_4_42_Bencaos_da_Ravena.zip`, `Ravena_V6_4_53_Mercado_Noturno_Reformado.zip` e `Ravena_V6_4_57_Santuario_e_Fluidez.zip`.

**Caminhos originais:** `pesca-rpg/assets/mae-das-aguas-guardia-serena-v6436.webp`; `pesca-rpg/assets/ravena-estatua-v6431.webp`; `pesca-rpg/assets/skins/`; `pesca-rpg/js/game.js`; `pesca-rpg/js/fishing-v5.js`; `pesca-rpg/server/index.js`; `pesca-rpg/CHANGELOG-V6.4.36.md`, `V6.4.42.md`, `V6.4.53.md`, `V6.4.57.md`, `V6.4.62.md`.

**Fontes novas:** `ravena-online/world-layout.js`, `village-scene.js`, `village-layout.js`, `game.js`, `world-data.js`, `server/zone-engine.mjs`, `index.html`.

**Lembrete:** ter criado um mundo 3D maior não substitui automaticamente as mecânicas e os marcos aprovados no legado. O objetivo da próxima etapa é **preservar a identidade sem voltar a fazer da pescaria o jogo inteiro**.
