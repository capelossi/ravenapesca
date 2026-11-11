# RESTAURAÇÃO CRÍTICA — V6.4.62 → RAVENA ONLINE

**Referências de origem:** `Ravena_V6_4_62_Atelie_Arte_e_Sprites.zip`, changelogs V6.4.36 (Mãe aprovada), V6.4.42 (bênçãos) e V6.4.57 (templo e fluidez). O ZIP antigo é o arquivo de referência do projeto; a integração no GitHub usa versões leves das duas ilustrações para preservar desempenho mobile.

## O que foi implementado nesta branch
### Mãe das Águas
- Pedestal submerso **no centro do Lago da Mãe das Águas** (x=55, z=1), sem criar ilha caminhável ou permitir atravessar a água.
- A ilustração original aprovada da mãe abraçando a criança foi recuperada de `assets/mae-das-aguas-guardia-serena-v6436.webp`, convertida em WebP leve e armazenada no repositório em `assets/legacy/mae-das-aguas-v6436.webp.b64`. A arte é renderizada como plano 3D com transparência na frente da geometria de base.
- Há uma escultura geométrica provisória caso o arquivo da ilustração não carregue.
- Atlas: `Mirante da Mãe das Águas` é acessível. O `Santuário da Mãe das Águas` segue como **futura construção**, pois não estava pronto como interior caminhável no ZIP de referência.

### Portal e Templo do Crepúsculo
- Portal violeta recuperado na Floresta dos Sussurros (x=-35, z=-24), com abertura por botão/contexto `E`.
- Interior gótico separado (outra camada de renderização/câmera), com chão, colunas, vitrais de teste, altar, pedestais, iluminação e portal de retorno.
- Caminhada por toque/clique dentro do templo usa o mesmo A* que o mundo principal em coordenadas locais e colisões próprias. **Não há passagem instantânea pelo Atlas**.
- Arte original `ravena-estatua-v6431.webp` recuperada em versão otimizada `assets/legacy/ravena-estatua-v6431.webp.b64`, com escultura geométrica fallback.
- A entrada e a saída preservam a posição de retorno e não apagam progresso. Recarregar o jogo dentro do templo restaura o personagem no início do interior, perto da saída.

### Altar e quatro bênçãos originais
Recuperadas do código original, versão V6.4.42:

| Bênção | Efeito no novo protótipo | Duração |
| --- | --- | --- |
| Sorte das Profundezas | +0,035 na rolagem de raridade de pesca | 10 minutos |
| Sabedoria Sombria | +20% de XP por captura, arredondado | 10 minutos |
| Fortuna da Ravena | +15% de moedas quando peixe é vendido ao **mercador local** | 10 minutos |
| Favor das Águas | +1 isca especial a cada 10 capturas enquanto ativa | 10 minutos |

- **Uma por vez, sem acumular.** Uma nova oferenda substitui a anterior.
- Cada oferenda exige escolher 1 peixe da mochila e **confirmar**. Apenas depois da confirmação o item é consumido.
- A validade usa `Date.now()` e é salva em `ravena-online-alpha1`, sem redefinir em reload.
- A captura sem isca segue disponível. A isca especial ganha no templo pode ser consumida em uma captura futura para pequeno bônus de raridade. Assim a gratificação de Favor das Águas tem efeito real sem bloquear a pescaria de jogadores novos.
- Fortuna opera exclusivamente sobre vendas locais demonstrativas à Mercadora Naila; **não existe comércio online entre jogadores**.

### Persistência e compatibilidade
Foram adicionados ao save existente somente novos campos: `coins`, `blessing`, `sanctuaryInside`, `sanctuaryReturn` e `bag.bait`. As chaves antigas de personagem, classe, nível, XP, inventário, missão e posição permanecem.

### Organização dos módulos
- `legacy-ravena-rules.js` — regras puras de bênçãos, oferenda, pesca e preço.
- `legacy-ravena-world.js` — pedestal da mãe, ilustrações 3D, portal e templo isolado por câmera, colisões e ambiente.
- `legacy-ravena-ui.js` — interface responsiva do altar, confirmação de oferenda, mercado e HUD de duração.
- `assets/legacy/*.webp.b64` — imagens derivadas das ilustrações **originais aprovadas**, codificadas como texto (porque a conexão do GitHub disponível grava arquivos UTF-8). O navegador decodifica em data URI e cria texturas WebP. A qualidade integral permanece no ZIP legado.

## Como jogar e testar
1. Crie/entre com seu personagem. O jogo permanece em **modo solo**.
2. No **Atlas**, vá até o ponto `Portal do Crepúsculo`, na Floresta, caminhando pela trilha.
3. Junto ao portal, toque em **Entrar no Templo do Crepúsculo** ou pressione `E`.
4. Dentro do templo, caminhe até o altar ao fundo; toque em **Fazer oferenda à Ravena**.
5. Escolha uma bênção e um peixe da mochila. Confirme. O painel de HUD mostrará nome e tempo restante.
6. Volte pelo portal próximo à entrada para reaparecer onde estava na floresta.
7. Para testar Fortuna, visite a Mercadora Naila no Mercado do Sal, Vila das Marés, e venda um peixe. A venda é local e salva moedas.

## Limitações e próximas recuperações
- **Ainda não migrados:** Mercado Noturno com escadaria e interior, Loja do Pescador completa, Lápide dos Campeões, 8 skins de Ateliê, cinco varas, raridades/pesos individuais e multiplayer real.
- As ilustrações originais nesta entrega são **planos transparentes em ambiente 3D**, não esculturas tridimensionais modeladas com rig e texturas PBR. Modelagem completa é uma etapa futura.
- O templo usa camada 3D separada, mas ainda não possui streaming de assets por setores.
- Os efeitos são implementados no **save local** do protótipo, não por servidor autoritativo.
- Antes de mesclar: CI estático, smoke do jogo anterior e smoke de portal/altar desktop+mobile; revisão manual no Android real.

## Compatibilidade com o jogo de pescaria
O PescaVena antigo **não é alterado**. O novo MMORPG preserva a história e integra os elementos críticos sem transformar a Vila das Marés em um minigame separado. A próxima fase retoma os sistemas profundos de pesca e o Mercado Noturno após aprovação da estátua e do templo.
