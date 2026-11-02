# Valdora — histórico das rodadas

Mudanças de cada rodada, da mais nova para a mais antiga. O README descreve o jogo como ele é hoje.

## Resumo por tema (rodadas 21–39)
- **Fim de jogo:** Couraça de lumita (armadura tier 4, r21); fúria do Senhor das Ruínas com aura (r22); ecos semanais dos dois chefes
  no quadro de caçadas, Eco cristalizado e Amuleto dos ecos (r22–24); névoa ao surgir e ao se desfazer, sons próprios (r23–26).
- **Equilíbrio medido com robôs:** quarta hora contra os chefes (r21); ataque dos ecos (r22); amuleto dos ecos 4/4/6 → 3/3/5 (r23);
  Cota de ferro com Vitalidade 6 (r24); queima de 32% → 24% no nível exigido (r28); carne de javali com Culinária 2 e espetinho
  (cura 12) (r30); aviso de região acima do nível — 9 → 1 morte em 30 min no robô que respeita o nível (r31); balada da lua cheia
  de 23–49 → 4–12 min (r34–35); tabelas de coleta, culinária e fundição conferidas contra robôs (r26–28).
- **Clareza:** bestiário com renascimento, região e chefe (r21–22); dicas do Ivo no registro, na janela e no lobby (r25); chances de
  coleta e de queima na ficha e na mochila (r29); quanto cada comida cura (r30); avisos de região por tipo e ao carregar (r31–32);
  missão pronta para entregar no quadro verde e no diário (r34–36); Lua cheia a caminho (r35).
- **Vida da vila:** Tomé tocando com notas, sentado no tronco e levantando para a reverência (r25–27, r33, r37–38); continência do
  Ivo, joinha do Bento e brilho dourado (r34–36); varal de carne e tronco-banco na fogueira (r31–32); herói agachado assando (r29).
- **Celular:** painel em largura total (r24), letreiro e cartão do save ajustados (r32, r38), botão de dica (r33), alvos de toque de
  44 px e foco visível (r39).
- **Código e desempenho:** histórico fora do README (r21); `gearIcon`/`tierIcon` nos diálogos (r21–22); folhas tingidas em cache
  (−1 ms por quadro com eco, r25); corpos que não saíam da lista (r24); saves antigos (encomendas, conquistas) compatíveis
  (r27, r37–38); sessões de 60 min sem acúmulo (r33, r37).

## Rodada 105 (v1.04)
- **8 direções de verdade:** heróis (todas as ações e peças de roupa), moradores e monstros ganharam as 4 diagonais renderizadas no
  Blender. Heróis e moradores: câmera a 45/135/225/315° (`rig.DIRS`, `art/lay/run_diag.sh`); monstros: 5 vistas (de frente, diagonal
  de frente, de lado, diagonal de costas, de costas — `tools/b3d/mobrun.py`) com a mesma câmera, girando no lugar; o lado direito é
  o esquerdo espelhado. As vistas extras ficam em folhas `<monstro>__<vista>.png` (`"<monstro>@<vista>"`, `lazy`) que o jogo só
  carrega com o monstro por perto e solta após 40 s; só as folhas do herói escolhido ficam na memória.
- **Direção pelo ângulo:** `DIR_AT(dx, dy)` em 8 setores (herói, moradores, monstros, minimapa); folhas antigas de 4 linhas usam
  o lado mais próximo (`SHEET_ROW`, `DIR4`). Folhas de ação do herói (3 colunas) têm 4 ou 8 linhas (`ASPECT_FIT`).
- **Ações de qualquer ângulo:** encostar vale na diagonal (`adjacent`/`adjRect`) para coletar, cozinhar, falar, abrir e lutar; na
  diagonal, golpe só se um dos tiles do meio não for parede/água. Monstros andam e atacam na diagonal (sem cortar quina) e o passo
  diagonal dura √2; moradores passeiam na diagonal. Saiu a espera da "dança da diagonal" (rodadas 48/83).
- **Peixes saltando de frente:** o salto que fica tocando nos cardumes (`fx_fishspot`, `fx_fishspot_deep`) usava o ícone virado para a
  esquerda num arco para a direita (saltava de costas); agora espelha o peixe e o nariz segue a tangente do arco, como o `fish_jump`.
- **Publicação:** `tools/publicar.ps1` põe `?v=<data>` nos scripts e no estilo das páginas, para o navegador não misturar versões.
- **Fogo:** fogueira, braseiro e tocha deixam pedras, lenha e ferro iguais à arte parada; só a chama e as fagulhas mudam (`fire_only`).
- **Ctrl + clique (modo de ataque):** segurando Ctrl o cursor vira mira e o monstro mais perto do ponto (até 4 tiles) ganha contorno
  vermelho; o clique ataca esse monstro (`nearestMob`). No Mac, Ctrl+clique chega como clique direito e também vale.
- **Luta por clique:** um clique no monstro basta — o herói segue batendo até ele morrer, o herói morrer ou o jogador andar.
  Saiu o "revida sozinho": depois de matar, não puxa outro monstro sem um novo clique.
- **Itens no chão:** passar por cima já pega (no meio do passo), não só parando no tile.
- **Segurar para andar com o mouse:** botão esquerdo pressionado no chão (mais de 0,26 s) faz o herói seguir o cursor; ao soltar,
  anda até o tile onde soltou e o clique é engolido. Mesmo esquema do toque no celular, que também passou a ir até o ponto final.
- **Plantas de coleta redesenhadas** em pixel art (`tools/plants2d.py`): folhas em cacho com contorno, sombra e luz, paleta por região
  (campos, leste, Mata Sombria, planalto de lumita) e vento só na copa. As plantas 3D da rodada 104 ficaram em `art/backup_plants3d/`.
- Testes: 3 novos (direções, diagonais nas folhas, monstro atacando e andando na diagonal).

## Rodada 104 (v1.03)
- **Personagens e monstros em 3D (Blender):** heróis, moradores e os 20 monstros viraram modelos 3D com esqueleto, pés plantados
  (IK), braços e roupas com física (verlet); `tools/char3d.py` (moradores), `tools/mob3d.py` (monstros), `tools/b3d/`.
- **Arqueiro no lugar do Marinheiro:** tiro de até 4,3 tiles com a linha livre; a flecha voa e o dano entra na chegada;
  flechas de madeira/ferro/lumita (munição, maço de 10 no Bento, 15 no Artesanato); o Arqueiro começa com 30.
- **Equipamento de verdade:** armas, ferramentas e peitorais viram itens (comprados, forjados, achados ou dados pelo Ivo no
  tutorial); a ferramenta certa (ou a arma, ao lutar) entra na mão sozinha. Saves antigos: as peças viram itens, nada se perde.
- **Boneco com 9 espaços** (capacete, peitoral, calça, botas, capa, arma, munição, anel, amuleto) e 12 peças novas em couro,
  ferro e lumita; as roupas típicas dos heróis (túnica, manto, roupa de caçador, capuz, chapéu, capa) viraram itens do Bento.
- **Visual pelo que se veste:** todos começam só de roupa de baixo; corpo e cada peça são camadas renderizadas em todas as
  animações (`tools/b3d/layered.py` + `tools/outfit_pack.py`) e montadas no jogo por `js/outfit.js`, tingindo pelo material.
- **Herbalismo:** foice, quatro plantas (erva-cidreira, flor-de-mel, lírio-da-lua, flor de cristal) que balançam ao vento,
  poções na Juna e no Artesanato, folha de colheita dos heróis.
- **Movimento em 8 direções:** duas teclas juntas ou clique; caminho com diagonal sem cortar quina (`js/path.js`, opção `diag`).
- **Vento só no que é planta:** placa da vila, quadro, poço, barraca, varal e ossos ficam parados; árvores vergam a copa
  inteira a partir do tronco. O peixe salta de frente. Corrigida a aba Comprar do Bento (declaração presa num comentário).
- **Ferramentas:** `tools/devserver.py` (servidor local sem cache), `valdora/vitrine.html` (todas as animações 3D).

## Rodada 102 (v1.02)
- **Sombra** curta sob a casa (obra e casa pronta) e sob os pedestais, com a sombra por objeto que o jogo já tem.
- **Visitas ao quintal:** os 6 NPCs têm 2 falas cada, uma por troféu (Ivo: Capataz e Senhor; Tomé: Alfa e eco; Bento: âmbar e peixe dourado;
  Juna: coração de musgo e presa; Odília: maquete e Serpente; Brás: Colosso e Golem). Com o herói a até 5 tiles da cama, fora de luta e sem
  cena, no máximo uma visita a cada 8 min de jogo (`VISIT.every` 480 s; `visitAt`/`visitBy` no save), a fala vai para o registro com o retrato
  do NPC e "Ivo passou aqui" sobe sobre a casa. Não para o jogo. Conferido na tela. Teste novo.
- Testes 172 → 173. Novidades v1.02.

### Auditoria de diversão e retenção (rodada 102, como a da rodada 94)
- **O que mudou desde a 94:** o jogador agora tem algo *dele*: um filhote com nome que cresce, cai e volta, cochila em casa; uma casa com
  troféus que contam a campanha; NPCs que reconhecem isso. Os objetivos depois do Ato V deixaram de ser só números.
- **O que ainda falta:** (1) **motivo para voltar toda semana** além dos ecos: o que está em jogo na semana é sempre o mesmo; (2) **variedade
  de luta tardia**: os mesmos chefes e a mesma Fenda, só mais fortes; (3) **comparação/expressão social** (o jogo é solo; não há como mostrar
  o recorde da Fenda a ninguém); (4) o som segue fraco (fora do escopo).
- **Três propostas para a próxima grande feature:**
  1. **Semana da Fenda (mutadores semanais + placar local):** cada semana a Fenda ganha 1–2 mutadores sorteados pela semana (ex.: "tremores em
     dobro", "cristais curam monstros", "sem comida assada, só poções", "o filhote morde em dobro"); recorde da semana guardado e um placar
     com os 5 melhores tempos do jogador (por semana, com os mutadores), e um troféu de casa por 4 semanas batidas. **Custo:** médio (regras
     puras de mutador com semente da semana, como a caçada do dia; robô por mutador). **Impacto:** alto em retenção semanal, reusa a Fenda.
     **Arte do Flow:** 8 ícones de mutador (64×64), 1 troféu (96×96), 1 placa de placar na vila (128×128).
  2. **Festival da Colheita (evento sazonal de 2 semanas):** a vila decorada, barracas com minijogos curtos (pesca do peixe dourado com tempo,
     corte de abóboras, tiro ao alvo no boneco), moeda própria (fichas) e prêmios cosméticos (chapéu, manta do filhote, enfeites do quintal).
     **Custo:** médio-alto (minijogos novos, decoração por data). **Impacto:** alto no período, baixo fora dele. **Arte:** ~15 peças
     (decoração, 3 barracas, prêmios, ícones).
  3. **Região nova: Litoral das Marés (ato VI curto):** praia ao sul com maré que sobe e desce (caminhos que abrem e fecham), 3 monstros e um
     chefe, peixes novos e a profissão **Coleta de conchas/pérolas** que alimenta joias. **Custo:** alto (mapa, 4 folhas no Blender, quests,
     equilíbrio com robô). **Impacto:** alto em conteúdo, médio em retenção depois de terminado. **Arte:** ~25 peças.
  **Recomendação:** a **1 (Semana da Fenda)**. É a que ataca o ponto mais fraco (motivo para voltar toda semana), reaproveita o que já está
  medido (Fenda, robô, sementes, casa para o troféu) e cabe em 2–3 rodadas; a 3 é a melhor depois dela, para renovar o conteúdo.

### Passagem de bastão (rodada 102)
Estado (notas): visual 9 · combate 9 · interface 9,5 · narrativa 9,5 · profundidade 9,5 · retenção 8 · som 5,5 (ninguém ouve: não mexer).
- **Com o usuário:** uma pessoa jogando a casa, o filhote e as visitas (também a 375 px).
- **Próxima feature:** escolher entre as 3 propostas acima (recomendada: Semana da Fenda).
- Robôs e hook como nas rodadas 96–101.

## Rodada 101 (v1.01)
- **Arte da casa sem o quadrado de grama** (Flow; mesmos nomes, tamanho e escala): as três fases assentam no chão do mapa. Conferido na tela.
- **Cochilo do filhote:** com a casa pronta, se o herói fica parado (sem caminho, alvo ou tarefa) a até 4 tiles da cama por 2 s, o filhote
  vai até a cama de palha e dorme (linha `sleep`, 12 px acima da palha); levanta quando o herói sai ou quando aparece briga. Conferido.
- **Atos III–IV com a casa** (`r89_late.js`, filhote vínculo 8 no Ato III e 11 no IV, troféus que já existem em cada ato, efeito o tempo todo):
  | | Comida (média) | Quedas |
  |---|---|---|
  | Ato III, só o filhote (30 sementes) | 15,0 | 8 |
  | Ato III, + casa com 2 troféus, vida mais rápida sempre | 12,5 (−17%) | 7 |
  | Ato III, + casa com 2 troféus, sem vida mais rápida | 14,1 (−6%) | 8 |
  | Ato IV (10 sementes), só o filhote → + casa com 3 troféus | 7,9 → 7,9 | 0 → 0 |
  No começo o que pesa é a vida voltando mais rápido, não a vida extra. Agora ela só vale com **5 ou mais troféus expostos**
  (`ValdoraHome.regenTicks`); Ato III com a casa: 14,1 (−6%); Fenda com 9 troféus continua em 49,5 (−8%). Teste ampliado.
- **375 px:** a janela "Casa" cabe com rolagem; descanso e troféus legíveis e os botões com bom alvo de toque.
- Testes 172 (um teste ampliado). Novidades v1.01.

### Passagem de bastão (rodada 101)
Estado (notas): visual 9 · combate 9 · interface 9,5 · narrativa 9 · profundidade 9,5 · retenção 8 · som 5,5 (ninguém ouve: não mexer).
- **Com o usuário:** uma pessoa jogando a compra, a obra, o quintal e o cochilo (também a 375 px).
- **Ideias:** sombra curta da casa (o jogo já desenha sombra por objeto); visita de um NPC à casa quando há troféus novos.
- Robôs e hook como nas rodadas 96–100.

## Rodada 100 (v1.00)
- **Casa do herói, implementada pelo desenho da rodada 99** (arte final do Flow nos três lotes):
  - **Regras puras** em `js/home.js` (novo): lote, casa, pedestais, cama, custos, troféus e como liberam, expor/guardar, vida do descanso,
    intervalo de 30 min e `sanitize` do save (save antigo = sem lote; troféus repetidos ou desconhecidos somem). 2 testes novos.
  - **No mapa:** o lote (estacas), a obra e a casa trocam de arte conforme o save; 9 pedestais (sólidos só com a casa pronta), o troféu
    desenhado no tampo (`o.top` em `js/scenery.js`), a cama de palha, o banco e o vaso de hortelã.
  - **Compra:** linha "Escritura do lote" no topo da aba Comprar do Bento (depois de *O Marco da Mata*); a obra pela janela do lote;
    o banco também no Bento.
  - **Janela "Casa":** dormir (Bem descansado) e a lista dos 12 troféus com Expor / Guardar / Entregar / Bloqueado e como liberar.
  - **Filhote:** caído, dorme na cama do quintal (desenhado 12 px acima, em cima da palha) quando a casa está pronta.
  - **Efeito Bem descansado** (`BUFFS.descansado`): +2 de vida máxima por troféu exposto (até +18; `combatStats` agora soma `hp` dos
    efeitos) e vida voltando a cada 3 ticks fora de luta.
- **Calibração com robô** (vínculo 20, 9 troféus, efeito o tempo todo; Fenda com 20 sementes):
  | Fenda (Ato V) | Tempo | Comida | Quedas |
  |---|---|---|---|
  | só o filhote | 962 s | 53,8 | 19 |
  | filhote + descanso com regeneração em dobro (desenho) | 854 s | 37,3 (−31% a mais) | 3 |
  | filhote + descanso sem regeneração extra | 979 s | 52,9 | 20 |
  | **filhote + descanso, 1 de vida a cada 3 ticks (fica)** | 948 s | 49,5 (−8% a mais) | 14 |
  No eco do Senhor o descanso quase não muda (robô come abaixo de 40% da vida máxima, que sobe junto): 57 s / 10,3 peixes com o filhote.
  A regeneração em dobro do desenho tirava quase todas as quedas da Fenda: ficou 4 → 3 ticks.
- **Escala com a arte final:** casas a 5,5 × 3,67 tiles (o desenho de 157 px fica com ~3 tiles, como as casas da vila), pedestal de
  1,05 tile e troféus de 0,85 tile no tampo.
- Testes 170 → 172. Novidades v1.00.

### Passagem de bastão (rodada 100)
Estado (notas): visual 9 · combate 9 · interface 9,5 · narrativa 9 · profundidade 9,5 · retenção 8 · som 5,5 (ninguém ouve: não mexer).
- **Casa, o que falta:** (1) o quadrado de grama das artes da casa é um pouco mais claro que o chão do mapa e tem borda escura: pedir ao
  coordenador uma versão sem o quadrado (ou com a grama do mapa); (2) o filhote ir deitar na cama quando o herói para perto da casa
  (do desenho, ainda não feito); (3) uma pessoa jogando a compra, a obra e o quintal; (4) a 375 px, a janela "Casa" com 12 linhas.
- Robôs como nas rodadas 96–99; para medir com o efeito: `player.home = ValdoraHome.sanitize({ lot: 1, built: 1, slots: [...] })` e
  `player.buffs.descansado = 2400` (no `r90_boss.js`, troque `player.buffs = {}`).

## Rodada 99 (v0.99)
- **Conferido na tela:** contra o eco do Golem, durante o aviso o filhote fica fora do anel do tremor e volta depois; o jovem dorme enrolado
  em (45, 37) sem nada na frente; a 375 px (jogo num quadro de 375 × 740) o filhote dorme no canto esquerdo da tela e o painel recolhido
  mostra ícone, nome, barra e "na vila · 1:29" (apertado, mas legível).
- **Ficar/seguir:** tecla G (atalho novo, listado no lobby) e botão "Mandar ficar aqui / Chamar" na janela do companheiro. Esperando, ele
  só morde quem está ao lado; se o herói passar de 10 tiles, ele volta a seguir sozinho ("cansou de esperar"); ao cair, o comando zera.
  Não mexe no vínculo. O painel mostra "esperando". Conferido no jogo (fica parado com o herói a 4 tiles; G de novo, ele volta).
- Testes 169 → 170. Novidades v0.99.

### Casa do herói — desenho (implementação a partir da rodada 100)
**Por quê:** depois do Ato V os objetivos viram números; a casa dá um lugar para mostrar o que se conquistou e vira o lar do filhote.
- **Lote:** 6 × 5 tiles de grama livre em (38, 45)–(43, 49), a sudoeste da vila, logo abaixo da casa verde e no caminho da trilha da Juna
  (medido no mapa: sem objetos nem estrada). Antes da compra: estacas com corda e uma placa de madeira (sem texto pintado; o nome vem
  pela fonte do jogo, como a placa da vila).
- **Compra (Bento):** depois do Ato II (*O Marco da Mata* concluído), a banca do Bento ganha a linha "Escritura do lote" por
  **1.500 moedas**. Comprado, o lote vira obra; a **construção** é uma encomenda do Bento: 30 madeiras de carvalho, 10 de cedro e 12
  barras de ferro (os materiais da faixa de Corte 15 / Ferraria 8 que o jogador já tem no Ato II–III). Entregue, a casa aparece com
  fumaça na chaminé (efeito `smoke` que já existe) e um aviso no registro.
- **Casa:** desenho de 4,5 × 3 tiles (base 3 × 2 sólida) em (38, 45); a porta em (39, 46) abre a janela "Casa" (troféus, móveis e cama).
  Sem interior separado: tudo pela janela, como o cofre.
- **Quintal:** grade de **3 × 3 pedestais** em (41–43, 45–47), um troféu por pedestal; a cama do filhote em (39, 48) e um banco em
  (42, 49). Na janela "Casa", o jogador escolhe o troféu de cada pedestal entre os liberados (troca à vontade).
- **Troféus (12 para 9 pedestais) e a origem de cada um:**
  | Troféu | Como libera |
  |---|---|
  | Bandeira rasgada do Capataz | derrotar o Capataz Rasgo (Ato I) |
  | Pele prateada do Alfa (num cavalete) | derrotar o Alfa da lua cheia |
  | Elmo coroado do Senhor das Ruínas | derrotar o Senhor das Ruínas |
  | Punho de pedra do Golem Ancião | derrotar o Golem Ancião |
  | Escama da Serpente de Lumita | derrotar a Serpente de Lumita (Ato V) |
  | Estilhaço do Colosso | derrotar o Colosso de lumita |
  | Eco numa redoma | derrotar os três ecos semanais (Senhor, Golem e Serpente), um de cada |
  | Âmbar antigo | entregar 1 Âmbar antigo (relíquia rara) |
  | Presa lunar no cordão | entregar 1 Presa lunar |
  | Coração de musgo no vaso | entregar 1 Coração de musgo |
  | Peixe dourado na placa | entregar 1 Peixe dourado |
  | Maquete dos cinco marcos | acender os cinco marcos (campanha completa) |
  Os de "entregar" consomem o item uma vez (fica guardado na casa); os de chefe vêm de `player.kills`/`player.stats.bossTypes`.
- **Móveis (Bento, depois da casa pronta):** cama de palha do filhote (incluída na construção), banco do quintal (200 moedas, só
  enfeite) e vaso de hortelã (presente da Juna ao concluir *Uivo próprio*, só enfeite).
- **Bônus de descanso:** dormir na cama (janela "Casa", só fora de luta, uma vez a cada 30 min de jogo) dá **Bem descansado** por 20 min:
  **+2 de vida máxima por troféu exposto** (até +18) e regeneração dobrada fora de luta. Medir com robô na rodada 100 (Fenda e ecos):
  não pode somar mais de ~10% de comida economizada com o filhote no vínculo 20.
- **Filhote:** com a casa pronta, ele descansa na **cama de palha do quintal** (39, 48) em vez da fogueira (linha `sleep` das três
  fases); sem casa, continua na fogueira. Quando o herói está na vila e para perto da casa, o filhote vai deitar na cama até o herói sair.
- **Save:** `player.home = { lot: 0|1 (comprado), built: 0|1, slots: [id|null × 9], got: { id: 1 } (troféus de entrega já guardados),
  furn: { bench: 0|1, mint: 0|1 }, restAt: tempo de jogo do último descanso }` e o buff em `player.buffs.descansado` (já salvo).
  Saves antigos: `home` ausente = sem lote.
- **Regras puras** em `js/rules.js` ou módulo novo `js/home.js` (troféus liberados, bônus de vida, custo), com testes; desenho da casa
  e do quintal no padrão de `js/scenery.js`.

### Lista de arte do Flow para a casa (gerar antes da rodada 100)
Todas em pixel art no estilo das casas e decorações da vila, 3/4 de frente, base embaixo, fundo transparente, alfa sem meio-tom.
| Arquivo | Tamanho | Descrição |
|---|---|---|
| `house_hero_lot.png` | 288 × 192 | Lote vazio: grama aparada, quatro estacas com corda e uma placa de madeira lisa (sem letras) |
| `house_hero_build.png` | 288 × 192 | Casa em obra: estrutura de vigas, metade das paredes, andaime e pilha de tábuas |
| `house_hero.png` | 288 × 192 | Casa do herói pronta: pedra embaixo, madeira em cima, telhado de telha azul-ardósia, chaminé, porta de madeira à esquerda, janela com floreira, lanterna na porta (mesma escala da `house_juna`) |
| `deco_trophy_pedestal.png` | 96 × 96 | Pedestal de pedra baixo e vazio, com placa de bronze lisa |
| `trophy_capataz.png` | 96 × 96 | Bandeira goblin rasgada numa lança fincada (sem pedestal; vai em cima dele) |
| `trophy_alpha_pelt.png` | 96 × 96 | Pele prateada do Alfa estendida num cavalete de madeira, com o brilho de lua |
| `trophy_ruins_helm.png` | 96 × 96 | Elmo coroado e rachado do Senhor das Ruínas num suporte |
| `trophy_golem_fist.png` | 96 × 96 | Punho de pedra com musgo e veios verdes |
| `trophy_serpent_scale.png` | 96 × 96 | Escama ciano grande de lumita numa moldura de madeira em pé |
| `trophy_colossus_shard.png` | 96 × 96 | Estilhaço de lumita cristalina, cor de âmbar-ciano, num calço |
| `trophy_echo_dome.png` | 96 × 96 | Cristal de eco flutuando dentro de uma redoma de vidro |
| `trophy_amber.png` | 96 × 96 | Âmbar antigo com um inseto dentro, numa base de madeira |
| `trophy_moon_fang.png` | 96 × 96 | Presa lunar num cordão de couro, pendurada num suporte |
| `trophy_moss_heart.png` | 96 × 96 | Coração de musgo pulsando de leve num vaso de barro |
| `trophy_gold_fish.png` | 96 × 96 | Peixe dourado empalhado numa placa de madeira em pé |
| `trophy_markers.png` | 96 × 96 | Maquete de pedra com os cinco marcos acesos (pontos de luz ciano, verde, âmbar, roxo e branco) |
| `deco_pet_bed.png` | 128 × 128 | Cama redonda de palha com uma manta azul-clara (o filhote dorme em cima; desenho ocupa ~70 × 45 na parte de baixo) |
| `deco_home_bench.png` | 128 × 128 | Banco de madeira de quintal |
| `deco_mint_pot.png` | 96 × 96 | Vaso de barro com hortelã (presente da Juna) |
| `icon_home.png` | 64 × 64 | Ícone da casa (painel e janela) |
| `icon_rested.png` | 32 × 32 | Ícone do efeito Bem descansado (lua crescente sobre um travesseiro) |

### Passagem de bastão (rodada 99)
Estado (notas): visual 9 · combate 9 · interface 9,5 · narrativa 9 · profundidade 9 · retenção 7,5 · som 5,5 (ninguém ouve: não mexer).
- **Rodada 100:** implementar a Casa do herói pelo desenho acima (regras puras e testes primeiro; robô para o bônus de descanso).
- **Com o usuário:** uma pessoa jogando a entrega do filhote, *Dentes de leite*, o descanso e o G.
- Robôs e hook como nas rodadas 96–98; sem filhote: `petEnsure = function () { pet = null; }`. Para a tela sem mexer na janela do Chrome:
  um `iframe` de 375 × 740 numa página do localhost, com o `__vd` do quadro.

## Rodada 98 (v0.98)
- **Arte do descanso nas três fases:** `pet_moon_2_sleep` e `pet_moon_3_sleep` (Flow) viram a linha `sleep` do jovem e do adulto
  (`anim_pack.py` usa `pet_moon_N_sleep` para cada fase). O descanso vai para (45, 37), ao lado do Tomé e da fogueira, sem casa nem poste
  na frente (antes o telhado da casa verde cobria o filhote).
- **Pedaço solto sob a barriga** (caminhada em pé, quadro 3): era a pata do meio rasgando no corte seco entre o par da frente e o de trás
  (x = 0). `blender_anim.py` ganhou `LEG_CFG["soft"]` (mistura suave dos dois pares perto do meio; padrão 0, igual ao de antes) e o
  filhote usa 0,08; `CLEAN_FRAMES` em `anim_pack.py` passa `clean_small` nos quadros dele. As outras 107 folhas saíram idênticas e o
  `anim_data.js` só ganhou as linhas `sleep` do jovem e do adulto.
- **Tremores no filhote:** o tremor (Golem Ancião, Serpente e os ecos dos dois) acerta o filhote a até 2,3 tiles, com a mesma conta do herói e a
  defesa dele (`petSlam`). Na primeira medição ele caía em **todas** as lutas contra o eco do Golem e em 21 de 30 contra o da Serpente;
  agora, durante o aviso, ele sai do círculo e espera fora (antes voltava para morder e levava o golpe), e o pulo já em andamento para
  longe conta como esquiva. Nenhuma queda nas 60 lutas.
- **Ganho nos ecos difíceis (item 4):** testei acerto 6 + 2,2 × vínculo (no eco do Senhor o acerto já está no teto de 95%, então ele não
  muda): Golem e Serpente quase não mudaram, e a Fenda foi a −25% de tempo e **−32%** de comida. Voltei para 1,6.
  | Vínculo 20 (30–40 lutas; Fenda 20 sementes) | Tempo | Comida |
  |---|---|---|
  | Eco do Senhor | 55,3 s (−20%) | 9,6 (−30%) |
  | Eco do Golem | 73,8 s (−14%) | 10,2 (−22%) |
  | Eco da Serpente | 69,3 s (−8%) | 9,6 (−10%) |
  | Ato V (Fenda) | 1.006 s (−19%) | 55,5 (−26%) |
  Nos ecos do Golem e da Serpente o filhote ajuda menos porque passa parte da luta fugindo dos tremores. Isso combina com o
  jogo: o herói também precisa sair do círculo.
- Testes 168 → 169. Novidades v0.98.

### Passagem de bastão (rodada 98)
Estado (notas): visual 9 · combate 9 · interface 9,5 · narrativa 9 · profundidade 9 · retenção 7,5 · som 5,5 (ninguém ouve: não mexer).
- **Com o usuário:** uma pessoa jogando a entrega, *Dentes de leite* e o descanso (também a 375 px).
- **Ideias para o companheiro:** um comando simples (ficar/seguir) ou um uivo de ajuda com recarga; o ganho nos ecos da Serpente
  fica baixo de propósito (fuga dos tremores).
- Robôs e hook como nas rodadas 96–97; sem filhote: `petEnsure = function () { pet = null; }`.

## Rodada 97 (v0.97)
- **Arte do Flow no filhote (fase 1):** `pet_moon_1_stand` (caminhada e mordida) e `pet_moon_1_sleep` (linha `sleep` nova) no
  `anim_pack.py`, no lugar do jovem reduzido (que fica de reserva). A faixa padrão das pernas do rig `quad` (36% de baixo) pegava a
  barriga do filhote em pé e borrava: `blender_anim.py` ganhou `LEG_CFG` por job (`job["leg"]`: altura da faixa e amplitude), com o
  padrão de antes; o filhote usa 0,18 e 0,7. As 110 folhas antigas saíram idênticas (só `pet_moon_1_anim.png` mudou; o `anim_data.js`
  ganhou só a linha `sleep`).
- **Descanso:** caído, ele dorme enrolado ao lado da fogueira (antes ficava em pé atrás de um poste), sem barra de vida sobre ele (o
  painel mostra o tempo).
- **Missões da Juna por fase** (`minBond` novo em `js/quests.js`; evento `petkill` quando a última mordida é dele):
  *Dentes de leite* (vínculo 1: 10 abates dele → conversa; carne assada e tônico), *Faro de lobo* (vínculo 7: 25 abates, 3 peles de
  lobo → faixa de casca; elixires) e *Uivo próprio* (vínculo 14, Combate 20: 40 abates; 600 moedas, 2.400 XP). Aviso no registro e
  no cartão quando ele cresce de fase ("a Juna quer ver"; `player.pet.seenBond` no save). Conquista **Alfa de estimação** (vínculo 20,
  500 moedas). Conferido no jogo: o abate do filhote conta na missão e a Juna fica com "?".
- **Ecos do Golem e da Serpente com o filhote** (`r90_boss.js`, 30 lutas, configuração da rodada 90):
  | Eco | Sem filhote | Vínculo 14 | Vínculo 20 |
  |---|---|---|---|
  | Golem (Combate 40, Vit. 35, lumita) | 85,7 s · 13,0 peixes | 78,2 s · 11,0 | 71,8 s (−16%) · 10,8 (−17%) |
  | Serpente (Combate 40, Vit. 40, estelar) | 75,2 s · 10,7 peixes | 73,6 s · 10,5 | 64,9 s (−14%) · 8,8 (−18%) |
  Abaixo da faixa de 20–30% (defesas 30 e 34 contra o acerto dele), mas dentro do teto; o filhote não caiu em nenhuma luta. Não mexi:
  subir a força passaria do teto no eco do Senhor (−30% de comida).
- Testes 167 → 168. Novidades v0.97.

### Passagem de bastão (rodada 97)
Estado (notas): visual 9 · combate 9 · interface 9,5 · narrativa 9 · profundidade 9 · retenção 7,5 · som 5,5 (ninguém ouve: não mexer).
- **Próximos passos do companheiro:** (1) uma pessoa jogando a entrega e as missões da Juna (e no celular a 375 px); (2) os tremores
  (golem, Serpente) ainda não acertam o filhote; (3) as fases 2 e 3 descansam em pé (falta arte dormindo do jovem e do adulto).
- Medição sem filhote: `petEnsure = function () { pet = null; }` pelo hook. Robôs e servidor como na rodada 96.

## Rodada 96 (v0.96)
- **Companheiro, parte 2 — arte, nome e vida.**
  - **Folhas no Blender** (`tools/anim_pack.py`, rig `quad`): `pet_moon_1..3` (idle, walk, attack, hit, death), 128 px na mesma escala
    (`SPRITE_SIZE` 1,5: o desenho cresce dentro do quadro). O filhote sentado borrava a parte de baixo ao andar: a caminhada e a mordida
    dele usam os quadros do jovem reduzidos a 68% (`PET_CUB_K`), com o pé no mesmo ponto. As 108 folhas antigas saíram idênticas
    (pixel a pixel) e o `anim_data.js` só ganhou as 3 entradas novas. `petData()` usa a folha da fase, sem tinta.
  - **Bug antigo corrigido:** o filhote parado não era desenhado (o idle em loop somava `m.phase`, que ele não tinha: quadro NaN).
  - **Entrega e nome:** cena `c2_filhote` (Juna + o filhote falando com `portrait_pet_moon`); no fim abre a janela "Companheiro"
    (retrato, vida, vínculo, acerto/dano/defesa e campo do nome, até 14 letras, `RULES.petName`; Enter confirma). O painel mostra
    `icon_pet`, o nome e a vida; clique abre a janela (trocar o nome depois também).
  - **Vida do filhote:** 16 + 3 × vínculo, defesa 2 + vínculo, regenera como o herói. O monstro que ele mordeu por último o ataca
    (ao lado dos dois, só em 10% das vezes, `PET.draw`), com o dano no quadro de impacto; nenhum monstro entra no tile dele
    (`mobCan`), e ele sai do lugar se um monstro nascer em cima. Ao cair: quadros de queda, vai para a vila (ao lado do ponto de
    partida) e descansa 2 min com a vida voltando; depois corre para o lado do herói. Vida e descanso ficam no save.
  - **Calibração com robô** (vínculo 20; dano da mordida 2 + vínculo/2 → 2 + vínculo/5):
    | | Tempo | Comida |
    |---|---|---|
    | Eco do Senhor (`r90_boss.js`, Combate 38, Vit. 32, tier 4, 40 lutas) sem filhote | 68,8 s | 13,7 tucunarés |
    | com filhote, vínculo 20 | 55,3 s (−20%) | 9,6 (−30%) |
    | Ato V, Fenda (`r89_late.js`, 20 sementes) sem filhote | 1.248 s | 74,8 (37 quedas) |
    | com filhote, vínculo 20 | 977 s (−22%) | 54,5 (−27%, 19 quedas) |
    | com filhote, vínculo 14 | 1.100 s (−12%) | 61,2 (−18%) |
    Antes da calibração, com o filhote tanqueando quem passasse ao lado dele: −29% tempo e −63% comida no eco. Mesmo com mordida de
    dano 1, a Fenda dá −16%/−24%: boa parte da ajuda é presença (o tile que ele ocupa e os golpes que ele atrai).
- Testes 164 → 167. Novidades v0.96.

### Passagem de bastão (rodada 96)
Estado (notas): visual 9 · combate 9 · interface 9,5 · narrativa 9 · profundidade 9 · retenção 7,5 · som 5,5 (ninguém ouve: não mexer).
- **Companheiro, o que falta:** (1) arte de um filhote **em pé** (fase 1) para a caminhada no lugar do jovem reduzido (pedir ao
  coordenador); (2) missões curtas da Juna por fase e conquista do vínculo 20; (3) uma pessoa jogando a entrega (a cena acontece onde o
  herói estiver, normalmente na cabana da Juna).
- Medição: a variância por luta é alta (4–18 peixes no eco); use 40 lutas no eco e 20 sementes no Ato V. Sem filhote nas medições:
  `petEnsure = function () { pet = null; }` pelo hook (zerar `c2_uivo.done` quebra a janela das missões no Ato V).

## Rodada 96, primeira tentativa (sem versão nova)
- Rodada fechada só com a passagem de bastão: o contexto do diretor acabou antes de começar as folhas do Blender. Nenhum arquivo do jogo
  mudou; o jogo segue em v0.95 (164/164 testes).

### Passagem de bastão (rodada 96, primeira tentativa)
Estado (notas): visual 9 · combate 9 · interface 9,5 · narrativa 9 · profundidade 9 · retenção 7 · som 5,5 (ninguém ouve: não mexer).
- **Companheiro, o que falta (na ordem):**
  1. Folhas no Blender: `tools/blender_anim.py` + `tools/anim_pack.py` com rig `quad` (o do lobo) a partir de `assets/flow/pet_moon_2.png`
     (jovem em pé) e `pet_moon_3.png` (adulto). Se o filhote sentado (`pet_moon_1.png`) não andar bem só com a deformação, use a fase 2
     reduzida para andar e deixe a sentada como idle (decisão do coordenador); se ainda faltar, pedir ao coordenador um filhote em pé no Flow.
     Antes: copiar `js/anim_data.js` e, depois, conferir que as folhas antigas saíram idênticas (`anim_pack.py` refaz tudo em ~1 min).
     Trocar `petData()` em `js/game.js` (hoje `{ ...MOBS.wolf, tint: PET_TINT, scale: [0, 0.62, 0.8, 1][fase] }`) por `spr` próprio por fase.
  2. `portrait_pet_moon` (já registrado) numa cena curta da Juna na entrega (hoje é só aviso no registro, em `petEnsure()`); `icon_pet`
     no painel; nome escolhido pelo jogador (campo `player.pet.name`, até 14 letras).
  3. Vida do filhote (hoje invulnerável e fora da lista `mobs`): monstros ao lado dele passam a atacá-lo; ao cair, volta à vila e se
     recupera; vida no painel. Cuidado: ele pode ocupar o tile de um monstro (o `petMove` evita, os monstros não).
  4. Calibrar com robô: eco do Senhor no Combate 38 deu −16% tempo/−8% peixes no vínculo 14 e −28%/−37% no vínculo 20; o teto pedido é
     20–30% em comida e tempo (ecos e Fenda). Medir também a Fenda (`r89_late.js`, ato 5) com `player.pet.kills` alto.
- Ferramentas da medição (scratchpad): `r90_tut.js` + `r88_robot.js` (encadeados), `r89_late.js`, `r90_boss.js`, servidor `r88_serve.py`
  (porta 8091, CORS) e o hook `__vd` (`r95_hook.py add/remove`). Depois de mexer em JS, recarregar com Ctrl+Shift+R.

## Rodada 95 (v0.95)
- **Companheiro, parte 1 — o filhote da lua.** Ao concluir *O uivo sob a lua* (ou ao carregar um save que já concluiu), a Juna entrega
  um filhote órfão da matilha (aviso no registro e cartão). Regras puras em `js/rules.js` (`PET`, `petBond`, `petStats`, `petStage`);
  comportamento em `js/game.js` (bloco "companheiro"): segue a até 2 tiles, reaparece ao lado do herói se ficar a mais de 10 (viagem,
  masmorra, queda), morde a cada 4 ticks o alvo do herói (até 8 tiles) ou quem ataca o herói a até 3 tiles. Acerto 6 + 1,6 × vínculo,
  dano 1 até 2 + vínculo/2; **a mordida não dá XP ao herói** (abates dão espólios normalmente) e não aplica o sangramento do Agressivo.
  Vínculo 1–20 = 1 + √(abates/4); fases 1–3 (vínculo 7 e 14) com escala 0,62 / 0,8 / 1. Save: `player.pet = { name, kills }`.
  Nesta parte ele fica fora da lista de monstros: ninguém o ataca nem o seleciona (vida e queda na parte 2).
  - Arte: provisória (folha do lobo tingida de cinza-azulado). A arte do Flow chegou nesta rodada (`assets/flow/pet_moon_1..3.png`,
    `portrait_pet_moon.png`, `icon_pet.png`) e entra na rodada 96 (folhas no Blender, rig `quad`).
  - Conferido na tela: o filhote acompanha o herói e morde o javali alvo; reaparece ao lado depois de teleporte.
- **Primeira medição** (`r90_boss.js`, eco do Senhor, Combate 38, Vitalidade 32, lumita, 10 lutas):
  | | Vitórias | Tempo médio | Peixes |
  |---|---|---|---|
  | sem filhote | 10/10 | 67 s | 11,8 |
  | vínculo 14 (676 abates) | 10/10 | 56 s (−16%) | 10,9 (−8%) |
  | vínculo 20 (1.444 abates) | 10/10 | 48 s (−28%) | 7,4 (−37%) |
  No vínculo máximo passa um pouco do teto de 30% em comida: calibrar na rodada 96, junto com a vida do filhote (que vai tomar golpes).
- Teste novo (163 → 164). Novidades v0.95.

### Passagem de bastão (rodada 95)
Estado (notas): visual 9 · combate 9 · interface 9,5 · narrativa 9 · profundidade 9 · som 5,5 (ninguém ouve: não mexer).
- **Companheiro (rodadas 95–97):** parte 1 feita. Falta: (1) folhas do Blender a partir de `assets/flow/pet_moon_{1,2,3}.png` (rig `quad`,
  como o lobo; o filhote está sentado na arte, conferir a deformação ao andar), uma folha por fase, no lugar do lobo tingido em `petData()`;
  retrato `portrait_pet_moon` já registrado (usar numa cena da Juna) e `icon_pet` no painel; (2) vida do filhote, golpes que o atingem e
  queda (volta à vila e se recupera), retrato e vida no painel, nome escolhido pelo jogador; (3) calibrar com robô: 20–30% menos comida
  e tempo nos ecos e na Fenda, não mais (hoje −28% tempo / −37% peixes no vínculo 20); (4) missões curtas da Juna por fase e conquista.
- Robôs e hook como na rodada 94 (`r90_boss.js` cria o eco; para medir sem filhote: `player.pet = null; player.quests.c2_uivo.done = false`).

## Rodada 94 (v0.94)
- **Marco da Mata à noite** (robô do tutorial encadeado à campanha, carne assada, 10 sementes): as sementes caras (15–30 refeições no
  passo) tinham o mesmo padrão da Lua cheia (rodada 92): **os lobos e alfas que moram perto do marco entravam na luta** junto com as
  duas levas de 3 (dano atribuído a "lobo + lobo da leva + alfa"). Correção: quando cada leva sobe, os lobos da região (não da leva) a até
  9 tiles do marco saem de cena e voltam em 3 min (`yieldsToWave` em `js/campaign.js`). Nenhum número de monstro mudou. Teste novo.
  | | Refeições no passo do marco (10 sementes) | Atos I–II (mediana, faixa) |
  |---|---|---|
  | antes | 4–30 | 54,5 (23–78) |
  | depois | 4–20 | **50,5** (23–68), nenhuma morte, 13–20 min |
- **Letreiro e painel no celular perto de NPC** (375 px, cabana da Juna à noite): o letreiro fica à esquerda, de 77 a 152 px do topo,
  e a Juna (~185 px) fica livre; o painel recolhido mostra só nome, vida e moedas. Nada a mudar.
- **Auditoria de diversão e retenção** (o que falta depois de 2–3 horas): o laço de coleta → forja → luta e a campanha de 5 atos estão
  sólidos e medidos; o que falta é **vínculo e expressão**. Depois do Ato V, os objetivos são números (ecos semanais, caçada do dia,
  recorde da Fenda, títulos do santuário); não há nada que seja *do* jogador além do equipamento; o herói luta sempre sozinho num gênero
  em que a graça é ter companhia; e não há lugar para mostrar o que se conquistou (as relíquias raras viram moeda no Bento).
  Propostas no relatório da rodada (companheiro, casa do herói, placar de recordes com semana de mutadores); recomendação: companheiro.
- Testes 162 → 163. Novidades v0.94.

### Passagem de bastão (rodada 94)
Estado (notas): visual 9 · combate 9 · interface 9,5 · narrativa 9 · profundidade 9 · som 5,5 (ninguém ouve: não mexer).
- Equilíbrio maduro: Atos I–II do tutorial real ao fim do Ato II em mediana 50,5 refeições (23–68), sem mortes; chefes, ecos e Fenda
  conferidos com a Vitalidade real (rodadas 89–90). Referência e robôs: `r90_tut.js` + `r88_robot.js` (encadeados), `r89_late.js`,
  `r90_boss.js`, servidos por `r88_serve.py` (porta 8091) e carregados pelo hook `__vd`. Depois de mexer em JS, Ctrl+Shift+R.
- **A partir da rodada 95:** implementar a próxima grande feature escolhida pelo coordenador (recomendada: companheiro).

## Rodada 93 (v0.93)
- **Treino contra bandos de goblins entre o Capataz e *Raízes*** (robô do tutorial encadeado à campanha, carne assada, 10 sementes):
  a semente 8608 gastava 41 refeições treinando no acampamento goblin (2 a 4 goblins por luta). O robô vai lá porque o goblin é o monstro
  de XP mais perto no Combate 8–11, e o centro do acampamento fica a ~7 tiles do Marco do Bosque, que o jogador acabou de acender.
  - Era o único marco aceso que não acalmava os monstros em volta (o da Mata acalma lobos, o das Ruínas esqueletos, o Coração golems).
    **Correção:** com o Marco do Bosque aceso, goblins a até 9 tiles dele não atacam por conta própria (`calmEast` em `js/campaign.js`).
    Lutar com eles continua possível; o bando só não puxa o herói sozinho. Nenhum número de monstro mudou. Teste novo.
  - Comparação (10 sementes): treino só em javalis e slimes azuis daria mediana 42,5, mas não é escolha do jogo. Com o marco acalmando os
    goblins: **mediana 55,5**, faixa 23–78 (antes 53,5, faixa 23–98); nenhuma semente acima de 80; nenhuma morte; 14–20 min.
- **Interface:**
  - Nome da região no painel quebra em duas linhas em vez da reticência ("Ruínas / Esquecidas"); no celular continua só o ícone.
  - Letreiro de região sobe de 18% para 9% da tela quando há NPC de conversa a até 6 tiles do herói (`RULES.talkerNear`; classe
    `high`). Conferido na cabana da Juna à noite: o letreiro fica acima dela, que antes ficava coberta.
- **Auditoria visual (continuação):** Planalto à noite (acampamento do Brás, golems, cristais), Cripta por dentro (braseiros, escada,
  esqueletos) e o jogo a 375 px nas Ruínas de dia. Nada fora de escala nem luz errada; monstros colados no herói se sobrepõem pela ordem
  de profundidade, como esperado.
- Testes 161 → 162. Novidades v0.93.

### Passagem de bastão (rodada 93)
Estado (notas): visual 9 · combate 9 · interface 9,5 · narrativa 9 · profundidade 9 · som 5,5 (ninguém ouve: não mexer).
- Robôs no scratchpad: `r90_tut.js` + `r88_robot.js` (encadeados: `__T.run` e depois `__R.run` sem `setup`), `r89_late.js` (Atos III–V;
  `__L.honor = true`; estilo trocado depois do `setup`), `r90_boss.js` (chefe ou eco isolado), servidos por `r88_serve.py` (porta 8091)
  e carregados pelo hook `__vd`. Depois de mexer em `rules.js`/`data.js`/`events.js`/`campaign.js`, recarregue com Ctrl+Shift+R.
- Medição de referência atual dos Atos I–II (tutorial real → fim do Ato II, Preciso, carne assada, 8601–8610): mediana 55,5, 23–78.
- **Maiores ganhos pendentes:** (1) uma pessoa jogando o tutorial e o Ato I (com o usuário); (2) som (com o usuário); (3) o Marco da Mata
  à noite ainda pesa em algumas sementes (até 31 refeições).

## Rodada 92 (v0.92)
- **Estilo Agressivo nos Atos III–V** (`r89_late.js` com `player.style = "agressivo"`, Vitalidade pela proporção do estilo, chefes no
  nível recomendado; 5 sementes nos Atos III–IV, 3 no V):
  | Ato | Preciso | Agressivo |
  |---|---|---|
  | III | 0 mortes, 6,2 min, 8–20 tucunarés | 1 morte, 6,8 min, 9–20 |
  | IV | 0 mortes, 3,9 min, 5–13 | 0 mortes, 4,5 min, 7–11 |
  | V (Fenda, Combate 38) | 4 mortes em 19 descidas, 18,7 min | 2 mortes em 17 descidas, 16,3 min |
  Nos Atos I–II (rodada 91) o Agressivo ficou em mediana 60 refeições. Nenhuma mudança: o estilo é escolha de ritmo.
- **Sementes acima de 80 refeições no Preciso** (robô do tutorial encadeado à campanha, carne assada): a 8606 (85) gastava **71** refeições
  no Alfa da lua cheia e a 8610 (78), 43. O evento põe o Alfa e 3 lobos da lua na toca de um lobo comum, e **o bando que já morava ali
  entrava na luta**: até 7 lobos de uma vez, no Combate 11 em que *Raízes inquietas* (Combate 11+) deixa o herói. Treinar até o 14
  recomendado custava mais (mediana 74,5: o treino é nos bandos da Mata).
  - **Correção:** quando a Lua cheia começa, os lobos comuns a até 7 tiles da toca saem de cena e voltam em 3 min (`yieldsToMoon` em
    `js/events.js`). A luta fica como foi desenhada: Alfa + 3 lobos da lua. Nenhum número de monstro mudou. Teste novo.
  - Resultado (10 sementes): refeições no Alfa 6–38 (antes 5–71); total dos Atos I–II **mediana 53,5** (23–98), nenhuma morte, 13–20 min.
    A semente que segue alta (8608, 98) gasta no treino contra bandos de goblins antes de *Raízes* e no Marco da Mata, não no Alfa.
- **Auditoria visual rápida** (vila à noite com chuva, cabana da Juna e Mata à noite, Ruínas de dia, Fenda por dentro): luzes de
  postes, fogueira, forja, janelas, braseiros e marcos acesos no lugar; Juna, Odília, estelas e marcos na escala certa. Nada corrigido:
  o nome da região cortado no painel ("Ruínas Esquec…") é a reticência da rodada 49, com o nome inteiro no `title`; o letreiro de região
  cobre a Juna por 2–3 s ao chegar na cabana (some sozinho). Não auditei o celular nem o Planalto.
- Testes 160 → 161. Novidades v0.92.

### Passagem de bastão (rodada 92)
Estado (notas): visual 9 · combate 9 · interface 9,5 · narrativa 9 · profundidade 9 · som 5,5 (ninguém ouve: não mexer).
- Robôs no scratchpad: `r90_tut.js` + `r88_robot.js` (encadeados: `__T.run` e depois `__R.run` sem `setup`), `r89_late.js` (Atos III–V;
  `__L.honor = true`; troque `player.style` depois do `setup`), `r90_boss.js` (chefe ou eco isolado), servidos por `r88_serve.py`
  (porta 8091) e carregados pelo hook `__vd`. Depois de mexer em `rules.js`/`data.js`/`events.js`, recarregue com Ctrl+Shift+R.
- **Maiores ganhos pendentes:** (1) treino contra bandos de goblins entre o Capataz e *Raízes* (a semente 8608: 41 refeições);
  (2) auditoria visual do Planalto, da cripta e do celular; (3) uma pessoa jogando o tutorial e o Ato I; (4) som, quando alguém puder ouvir.

## Rodada 91 (v0.91)
- **Do fim do tutorial ao Capataz sem treino obrigatório** (decisão do coordenador: mais XP nas missões, não um passo de treino). Robô do
  tutorial real encadeado à campanha (`r90_tut.js` + `r88_robot.js` v2, carne assada, 10 sementes 8601–8610):
  | XP de Combate (fendas / Marco dos Campos) | Combate ao terminar o Marco | Treino antes do Capataz | Refeições Atos I–II (mediana) | Tempo |
  |---|---|---|---|---|
  | 250 / 450 (antes) | 6 | 1,9–3,4 min | 61 (33–81) | 18–23 min |
  | **400 / 900** | **7** | **0,9–1,5 min** | **48,5** (31–96) | 13–21 min |
  | 500 / 1.300 | 8 | nenhum | 51,5 (20–76) | 12–16 min |
  Escolhido 400 / 900: o herói chega perto do Combate 7 e o salto ao 8 sai das lutas do caminho. Nenhuma morte. Teste novo.
- **Estilo Agressivo** (mesmo robô, 400 / 900): mediana 60 refeições (29–88), nenhuma morte, 14–23 min: no limite de cima do alvo.
- **Primeira sessão estimada:** o robô faz o tutorial em 100–128 s de jogo. Somando a leitura (a ~15 letras por segundo: 1.256 letras no
  tutorial, ~1,5 min; 7.631 nas missões e nas 15 cenas dos Atos I–II, ~8,5 min), o tutorial fica em ~3,5–4 min e o caminho até o fim do
  Ato II em ~25–35 min para quem joga direto (o robô não hesita nem erra caminho; uma pessoa deve levar mais).
- Testes 159 → 160. Novidades v0.91.

### Passagem de bastão (rodada 91)
Estado (notas): visual 9 · combate 9 · interface 9,5 · narrativa 9 · profundidade 9 · som 5,5 (ninguém ouve: não mexer).
- Robôs no scratchpad: `r90_tut.js` + `r88_robot.js` (encadeados: `__T.run` e depois `__R.run` sem `setup`), `r89_late.js` (Atos III–V),
  `r90_boss.js` (chefe ou eco isolado), servidos por `r88_serve.py` (porta 8091) e carregados pelo hook `__vd`. Depois de mexer em
  `rules.js`/`data.js`, recarregue com Ctrl+Shift+R. Comentários no meio de linha: use `/* ... */`.
- **Maiores ganhos pendentes:** (1) Agressivo nos Atos III–V e na Fenda (só Atos I–II medidos); (2) uma pessoa de verdade jogando o
  tutorial (tempo real da primeira sessão); (3) som, quando alguém puder ouvir.

## Rodada 90 (v0.90)
- **Tutorial com robô** (`r90_tut.js`: jogo novo, as 9 tarefas do Ivo andando, coletando, fundindo, forjando, pescando, assando, lutando,
  esquivando no boneco com 0,4 s de reação e vendendo; 5 sementes): **100–128 s de jogo** (sem contar a leitura), nenhuma morte, nenhuma
  travada. Tempo por tarefa: conversa 1 s, madeira 6–21, cobre 17–31, barras 10–12, forja 4, lambari 16–34, slimes 19–23, boneco 13–16,
  venda 3. Avisos de região só numa semente (o robô passou pelo Bosque atrás de slimes).
  - **Atrito corrigido:** o tutorial termina com **Culinária 1** (o lambari dá 6 de XP; o nível 2 pede 15), mas a carne de javali pedia
    Culinária 2. Agora assa desde a 1 (dicas, README e teste acompanham).
  - O tutorial termina no **Combate 2** (as medições anteriores partiam do 5). Encadeando tutorial e campanha (robô v2, carne assada,
    10 sementes): Atos I–II com mediana **65,5** refeições (33–81), nenhuma morte, 18–23 min (a partir do Combate 5 eram 57,5).
- **Bandos de esqueletos no Ato III** (`r89_late.js`, 10 sementes, Combate 18 com a Vitalidade da rodada 89): 6 mortes em 10, média 10,5 min,
  e duas sementes levaram 21–26 min. Diagnóstico (foto a cada minuto): o herói parado no centro do bando (74,12), entre a entrada e o
  Senhor (84,8), derrubando **111 esqueletos em 14 min** com 5–7 em cima dele: os 8 esqueletos renasciam em 12 s (o padrão de todo
  monstro sem `respawn`), mais rápido do que se derruba um. Teste com o renascimento do esqueleto:
  | Renasce em | Mortes em 10 | Tempo do Ato III |
  |---|---|---|
  | 12 s (antes) | 6 | média 10,5 min (5,8–25,6) |
  | **20 s** | **0** | média 6,5 min (5,6–8,4) |
  | 30 s | 1 | média 6,5 min |
  Escolhido 20 s (só o esqueleto; vida, ataque e número do bando iguais). Teste novo.
- **Ecos semanais com a Vitalidade nova** (`r90_boss.js`: o eco no lugar do chefe, 10 lutas, Preciso, sem Q/R nem esquiva, até 20 tucunarés;
  Combate acima de 40 fica no 40, o máximo):
  | Eco | Vitalidade = Combate, tucunaré 12 | Vitalidade real até a v0.88 | v0.89–0.90 |
  |---|---|---|---|
  | Senhor (Combate 38, lumita) | 10/10, 10,2 peixes | 2/10 | 10/10, 54–78 s, 11,8 peixes (Vit. 32) |
  | Golem (Combate 40, lumita) | 10/10, 13,2 peixes | 1/10 | 10/10, 68–96 s, 12,9 peixes (Vit. 35) |
  | Serpente (Combate 40, estelar) | 10/10, 15,5 peixes | 6/10 | 10/10, 67–92 s, 11,4 peixes (Vit. 40) |
  Nenhuma mudança nos ecos. A caçada do dia usa monstros comuns perto do seu Combate e paga XP pela `rewardCombatXp` (dá Vitalidade).
- **Fenda com equipamento estelar** (Combate 40, Vitalidade 34, lâmina e couraça estelares sem afixos, 3 sementes): 12,6–13,2 min,
  5 descidas, **nenhuma morte**, 17–31 tucunarés (a rodada 83 media ~10 peixes por descida com tucunaré 12). Sem mudança.
- Testes 158 → 159. Novidades v0.90.

### Passagem de bastão (rodada 90)
Estado (notas): visual 9 · combate 9 · interface 9,5 · narrativa 9 · profundidade 9 · som 5,5 (ninguém ouve: não mexer).
- Robôs no scratchpad: `r90_tut.js` (tutorial), `r88_robot.js` (Atos I–II; `__R.v2 = true`), `r89_late.js` (Atos III–V; `__L.honor = true`),
  `r90_boss.js` (chefe ou eco isolado; `base` para os ecos), servidos por `r88_serve.py` (porta 8091) e carregados pelo hook `__vd`.
  Tutorial e campanha encadeiam: rode `__T.run` e depois `__R.run` sem `setup`. Depois de mexer em `rules.js`/`data.js`, Ctrl+Shift+R.
- Comentário `// ...` inserido no meio de uma linha engole o resto dela: aconteceu de novo nesta rodada, num robô. Use `/* ... */`.
- **Maiores ganhos pendentes:** (1) Atos I–II a partir do fim real do tutorial ficaram em 65,5 refeições com carne assada (alvo 40–60):
  ver o salto do Combate 2 ao 8 antes do Capataz; (2) o tempo de leitura e de coleta real no tutorial (o robô não lê nem espera);
  (3) som, quando alguém puder ouvir.

## Rodada 89 (v0.89)
- **Vitalidade acompanha o Combate em todos os estilos** (decisão do coordenador: saída (a), a correção sistêmica). Na rodada 88 o robô
  mostrou que quem joga no Preciso ou no Agressivo tinha Vitalidade ~2/3 do Combate (menos ainda contando o XP de Combate das missões,
  que não dava Vitalidade), enquanto chefes e Fenda foram medidos com Vitalidade = Combate.
  - XP de Vitalidade por dano no Preciso e no Agressivo: **0,85 → 1,7** (Combate continua 2,55; Defensivo continua 1,3 / 1,9 e segue o
    caminho mais rápido para a Vitalidade).
  - **Recompensas de Combate** (missões, quadro de caçadas, caçada do dia) agora dão também Vitalidade na proporção do estilo, até 1:1
    (`RULES.vitShare`; `rewardCombatXp` no `game.js`; a API das missões passa por ela). Com isso, no Preciso, Combate 38 vem com Vitalidade 32.
  - **Tucunaré assado 12 → 15** (empatava com a carne assada; agora empata com o espetinho, mas vem em quantidade da pesca).
  - Dica nova do Ivo (Combate 15+): o estilo Defensivo sobe a Vitalidade mais depressa. Só dica, sem mudar números.
  - A Fenda não mudou.
- **Como escolhi o multiplicador** (robô `r89_late.js`, Ato V no Combate 38, lumita, Vitalidade que o estilo gera, 3 sementes; mortes/descidas):
  | XP de Vitalidade | Vitalidade no 38 | Tucunaré 12 | Tucunaré 15 |
  |---|---|---|---|
  | 0,85 (antes) | 24 | não termina em 60 min (25–27 mortes) | — |
  | ~1,5 | 30 | 33 mortes / 48 descidas | 22 / 37 |
  | **1,7** | 32 | 19 / 34 | **4 / 19** (17–21 min) |
  | 1,9 | 33 | 6 / 21 | 4 / 19 |
  | 2,1 | 35 | 3 / 18 | — |
  | medição antiga (Vitalidade = Combate; 2 sementes) | 38 | 0 / 10 (~15 min) | — |
  1,7 com o tucunaré 15 é o menor multiplicador perto das medições antigas: ~0,2 morte por descida, nenhuma travada; sem mexer no tucunaré
  seria preciso ~2,1.
- **Chefes medidos de novo** (`r89_boss.js`: luta no lugar do chefe, 10 lutas, Preciso, sem Q/R nem esquiva, espada de aço e cota de ferro
  como na rodada 84, até 20 tucunarés):
  | Chefe | Vitalidade = Combate, tucunaré 12 (medição antiga) | Vitalidade real até a rodada 88 | Rodada 89 (1,7 + tucunaré 15) |
  |---|---|---|---|
  | Senhor das Ruínas, Combate 25 | 10/10, 51–73 s, 11,6 peixes (Vit. 25) | **5/10**, 16,9 peixes (Vit. 16) | 10/10, 53–73 s, 12,8 peixes (Vit. 21) |
  | Golem Ancião, Combate 31 | 10/10, 69–89 s, 14,6 peixes (Vit. 31) | **6/10**, 15,2 peixes (Vit. 20) | 10/10, 61–84 s, 12,8 peixes (Vit. 26) |
  A medição antiga bate com a da rodada 84; com a Vitalidade real, metade das lutas terminava em morte.
- **Campanha com robô depois da mudança:** Atos I–II (robô v2, 10 sementes) mediana **44** refeições com espetinho e 57,5 com carne assada
  (antes 45,5 com espetinho), nenhuma morte, 15–22 min, o Ato II termina no Combate 14 com Vitalidade 12 (antes 10): o começo não ficou
  fácil demais. Robô antigo nas sementes 8601–8603, comendo carne assada: 43 / 51 / 47. Ato III (Combate 18, Vit. 15; chefe no 25):
  6–7 min, 10–23 tucunarés, 0–1 morte (uma semente levou 25,6 min, quase tudo no passo do chefe). Ato IV (26 → 31): 3,5–3,7 min, 5–7 tucunarés, 0
  mortes. Ato V (38, Vit. 32): 16,5–21,4 min, 56–77 tucunarés, 1–2 mortes em 6–7 descidas.
- Teste novo (157 → 158): proporções dos estilos, `vitShare`, Vitalidade ≥ 32 no Combate 38 e tucunaré 15. Novidades v0.89.

### Passagem de bastão (rodada 89)
Estado (notas): visual 9 · combate 8,5 → 9 · interface 9,5 · narrativa 9 · profundidade 9 · som 5,5 (ninguém ouve: não mexer).
- Robôs no scratchpad: `r88_robot.js` (Atos I–II; `__R.v2 = true`), `r89_late.js` (Atos III–V; Vitalidade pela proporção do estilo;
  `__L.honor = true` sobe ao nível recomendado), `r89_boss.js` (luta isolada contra um chefe), servidos por `r88_serve.py` (porta 8091).
  O navegador guarda `rules.js` em cache: depois de mexer nele, recarregue com Ctrl+Shift+R.
- **Maiores ganhos pendentes:** (1) ecos semanais e caçadas de fim de jogo com a Vitalidade nova (não medidos); (2) a Fenda com equipamento
  estelar e o eco da Serpente; (3) tutorial com robô; (4) bandos de esqueletos no Ato III no Combate 18; (5) som, quando alguém puder ouvir.

## Rodada 88 (v0.88)
- **Comida no começo do jogo, medida com o robô da campanha** (o mesmo das rodadas 86–87, recriado em `r88_robot.js` no scratchpad com o
  ponto de partida explícito: fim do tutorial, Combate e Vitalidade 5, Culinária 2, espada de bronze e gibão, mochila sem comida; mesmas
  sementes 8601–8603). Antes: 71 / 122 / 85 refeições do fim do tutorial ao fim do Ato II.
  - **O que os números mostraram:** o dano levado nos Atos I–II fica em ~900–1.400 de vida, **qualquer que seja a comida**; refeições ≈ dano ÷
    cura. Vida máxima média na hora de comer: **32** (no Preciso a Vitalidade ganha 1/3 do XP do Combate). Com 3 sementes o ruído é enorme
    (curar 15 deu 82/68/60; curar 12, 50/59/68), então medi também 10 sementes (8601–8610) com o **robô v2** (não treina ao lado de
    monstros 5+ níveis acima, foge deles e chama a Lua cheia longe dos alfas; o v1 chegou a 279 e 570 refeições presos em esqueletos).
    | Opção (o que o robô come) | v1, 8601–8603 | v2, 10 sementes (mediana) |
    |---|---|---|
    | Hoje: carne assada 9 | 71 / 122 / 85 | 103 |
    | Cura maior da carne / cozinha acessível (12: espetinho e tucunaré já curam 12) | 50 / 59 / 68 | 75 |
    | Alimento intermediário 15–16 | 82 / 68 / 60 (15) · 30 / 62 / 49 (16) | 71 (16) |
    | Intermediário com cura aos poucos (10 + 1/s por 16 s) | — | 63,5 |
    | + Raízes inquietas no Combate 11 (comida 12) | 46 / 42 / 74 | 65,5 |
    | + Raízes inquietas no Combate 11 (comida 15) | 49 / 65 / 35 | **49,5** (39–56; uma semente 84) |
    "Cozinha mais acessível" não muda o dano: no robô ela vira "comer uma comida melhor", igual às linhas de cura. Acima de ~16, a cura
    transborda (vida máxima 32). O treino obrigatório antes da Juna (o Ato I termina no Combate 10–11) era ~1/5 das refeições.
  - **Escolha:** carne assada **9 → 12**, espetinho de javali **12 → 15** (o intermediário que já existia: carne + madeira, Culinária 2) e
    *Raízes inquietas* com **Combate 11+** (antes 12; cena do fim do Ato I e Diário acompanham). Nenhum monstro mudou. Resultado: 10 sementes
    com o espetinho, mediana 49,5; o robô v1 comendo carne assada, 46 / 42 / 74; nenhuma morte; os dois atos em 15–19 min; o Ato II
    termina no Combate 14. O tucunaré (12, Culinária 10) não mudou: as medições de chefe e da Fenda usam ele.
  - Dica do Ivo sobre a carne lê os valores dos itens (antes "cura 12" fixo); dica do espetinho e README atualizados.
- **Retrato do herói do lado direito da caixa de cena** (NPC à esquerda, herói à direita), sem espelhar: os três bustos olham para a
  esquerda, então olham para a fala, e a luz e os detalhes da arte ficam como foram desenhados. Regra pura `ValdoraScene.side(k)` (classe
  `right` no `#scene`). No celular (375 px), o busto sai por cima da caixa à direita, o nome fica alinhado à direita ao lado dele e o
  "Pular" passa para a esquerda. Conferido no computador e a 375 px (fala do herói e do Ivo).
- **Robô da campanha nos Atos III–V** (`r88_late.js`: anda, conversa, entra na cripta e na Fenda, abre baús, copia estelas, encaixa o selo;
  tucunarés dados, 20 por viagem, refeitos na vila; cada ato começa no nível mínimo com o equipamento da tabela; Vitalidade realista do
  Preciso, ~2/3 do nível de Combate):
  | Ato | Início | Tempo | Tucunarés | Mortes |
  |---|---|---|---|---|
  | III (estelas, cripta, Senhor) | Combate 18 (Vit. 11), sobe a 25 para o chefe | 6,3–8,6 min | 24–41 | 1–2 (estelas e cripta) |
  | IV (veio, golems, Golem Ancião) | Combate 26 (Vit. 17), sobe a 31 para o chefe | 4,1–4,6 min | 15–20 | 0 |
  | V (Fenda, ecos, Serpente) | Combate 38, lumita, Vit. 38 (como nas medições antigas; 8601–8602) | ~15 min | 36–41 | 0 |
  | V | Combate 38, lumita, **Vit. 24** (Preciso real) | não termina em 60 min | ~500 | 25–27 |
  - **Atrito corrigido:** os passos dos chefes não diziam o nível. No Combate ~21 (onde o Ato III deixa o jogador) o robô caía 3 vezes no
    Senhor das Ruínas em cada semente; no 25, 0–1. Agora *O guardião das Ruínas* recomenda Combate 25+, *O último guardião* 31+ e a Serpente
    38+ (introdução e passo), como o Alfa (14+) e a Fenda (38+). Teste novo.
  - **Achado grande, não corrigido:** as medições de chefe e da Fenda (rodadas 11–19 e 82–84) usavam Vitalidade = Combate. Quem joga no
    Preciso ou no Agressivo tem Vitalidade ~2/3 do Combate (24 no Combate 38: 66 de vida e −14 de defesa). Com Vitalidade 24 a Fenda não
    sai; com 28, 18–21 mortes por hora; com 32, 5–9 mortes; com 38, nenhuma. Ver o plano.
- Testes 154 → 157 (escada da comida e Raízes no 11; lado do herói na cena; chefes dizem o Combate recomendado). Novidades v0.88.

### Passagem de bastão (rodada 88)
Estado (notas): visual 9 · combate 8,5 · interface 9,5 · narrativa 9 · profundidade 9 · som 5,5 (ninguém ouve: não mexer).
- Robôs da rodada no scratchpad: `r88_robot.js` (Atos I–II; `__R.v2 = true` liga o robô v2), `r88_late.js` (Atos III–V; `__L.honor = true`
  sobe ao nível que o passo recomenda), servidos por `r88_serve.py` (porta 8091, CORS) e carregados pelo hook `__vd`.
- **Maiores ganhos pendentes:** (1) Vitalidade no fim de jogo (ver acima): decidir entre mais XP de Vitalidade no Preciso/Agressivo,
  recomendação de Vitalidade na Fenda ou Fenda mais fraca, medindo com `r88_late.js`; (2) tucunaré (12) empata com a carne assada:
  rever a escada da comida junto com (1); (3) tutorial com robô; (4) som, quando alguém puder ouvir.

## Rodada 87 (v0.87)
- **Zona segura da Juna** (decisão do coordenador): lobos e alfas não atacam por conta própria a até 8 tiles dela (a matilha da Lua
  cheia, não). Teste novo (153 → 154).
- **Robô da campanha de novo (mesmas 3 sementes, mesmo robô da rodada 86, recriado em `robot_campaign.js` no scratchpad):** refeições
  totais 79 / 137 / 107 (antes 75 / 108 / 117): a zona segura sozinha **não** trouxe o total para 40–60. Por missão, a comida varia muito
  entre sementes (Capataz 16–79, Raízes 2–50, Alfa 11–30) e vem sobretudo do **treino entre missões** (o robô treina em goblins, javalis e
  lobos até o Combate mínimo, sempre comendo carne assada de 9 de cura abaixo de 40%) e do Capataz, não dos lobos da cabana. Com o
  aviso combinado, "O uivo sob a lua" recomenda Combate 14+ na introdução e no passo (era 16+ no passo; o robô vence o Alfa sem morrer
  no 14–15). Números de luta inalterados. Nenhuma morte em nenhuma semente.
- Retratos dos heróis: os 3 registrados (`portrait_hero_1..3`) e conferidos na cena, no computador e a 375 px (sem espelhar).
- Novidades v0.87.

### Passagem de bastão (rodada 87)
Estado (notas): visual 9 · combate 8,5 · interface 9,5 · narrativa 9 · profundidade 9 · som 5,5 (ninguém ouve: não mexer).
- **Campanha "Os Marcos de Lumeira"** completa (Atos I–V, rodadas 78–83): dados em `VD.QUESTS` (campo `act`), `VD.SCENES`, `VD.CAMPAIGN`;
  mundo em `js/campaign.js` (marcos, fendas, estelas, onda, Capataz, zonas seguras, viagem, objetivos, selo); cenas em `js/scene.js`;
  NPCs da campanha: Juna (`herb`), Odília (`carto`), Brás (`miner`). Fim de jogo: Fenda Cintilante (`DUNGEONS.rift`), equipamento
  estelar com modificadores (`player.gearAff`), ecos semanais (Senhor, Golem, Serpente com sequência), caçada do dia e bestiário
  (`js/daily.js`).
- **Armadilhas:**
  - Patches só por `.py` com `assert`; comentário `// ...` inserido no meio de uma linha engole o resto dela (aconteceu 2 vezes: ver
    rodadas 79 e 81). Sempre rode `new Function(src)` ou recarregue o jogo depois de mexer em `game.js`.
  - O scratchpad tem scripts antigos com nomes genéricos (`p_tests.py` da rodada 66 rodou por engano na 78): use nomes com a rodada.
  - `anim_pack.py` refaz tudo (~1 min): faça backup do `anim_data.js` e compare as entradas (as antigas devem sair idênticas).
  - O Blender achata o alfa parcial (eco da Serpente): use `alpha` no dado do monstro.
  - Arte nova do Flow chega com os nomes dos placeholders: confira o enquadramento e o `SPRITE_SIZE` (ex.: tenda e cabana de 288×192).
  - Retratos: rode `python -I tools/register_portraits.py` (registra só os que existem; aceita `portrait_hero_N`).
  - Robôs: `ValdoraGame.seed(n)`; desligue o laço (`running = false`) e chame `update(1/30)`; o hook `__vd` é temporário (p_hook.py).
  - A correção da diagonal (rodada 83) mudou o ritmo das lutas contra monstros lentos e chefes: medições antigas não são comparáveis.
- **Maiores ganhos pendentes:** (1) comida no começo do jogo: o treino entre missões consome muito (cozinha mais acessível ou cura maior
  da carne assada, medir com o robô); (2) robô da campanha nos Atos III–V; (3) o tutorial com robô;
  (4) som, quando alguém puder ouvir.

## Rodada 86 (v0.86)
- **Revisão de ponta a ponta com robô (Atos I e II)**: robô novo que anda, conversa, abre janelas, examina fendas, conserta marcos e
  luta de verdade, a partir do fim do tutorial (Combate ~5, espada e gibão de bronze; troca de equipamento pelo nível como na tabela
  dos testes). Materiais e comida são **dados e contados** (o tempo de coleta não entra); come carne assada abaixo de 40%; sem Q/R.
  3 mundos fixos (sementes 8601–8603):
  | Missão | Tempo (min) | Mortes | Refeições |
  |---|---|---|---|
  | O tremor da madrugada | 0,8 | 0 | 0 |
  | O Marco dos Campos | 0,5–0,6 | 0 | 0 |
  | O bando do Capataz | 3,8–6,2 | 0 | 16–37 |
  | Raízes inquietas | 7,0–9,5 | 0 | 30–55 |
  | O uivo sob a lua | 1,6–2,2 (+ espera da noite) | 0 | 20–35 |
  | O Marco da Mata | 1,2 | 0 | 8–15 |
  Os dois atos em 15–20 min de jogo, Combate ~5 → 15, quase sem treino entre missões (2–3 min antes do Capataz e da Juna): o XP das
  missões carrega o ritmo. Nenhuma morte, mas **75–117 refeições** no total, quase tudo nos lobos da Mata e no Alfa (Combate 14–15).
  Materiais dados: 3 barras de bronze, 9 carvalhos, 4 peles e 3 barras de ferro.
- **Atritos achados e corrigidos:** os passos pediam carvalho (Corte 8), ferro (Mineração e Ferraria 8) e lumita (Mineração 18) sem
  dizer o nível; agora o texto diz (teste novo). O passo do Alfa recomenda Combate 16+.
- **Não mudou:** os números de luta. O consumo de comida na Mata é o ponto a discutir (lobos perto da cabana da Juna; o Alfa para quem
  chega com Combate 14).
- **Quadro de caçadas:** a linha do eco da Serpente mostra a sequência e o bônus da próxima vitória (ou a sequência atual, se já vencida).
- **Retrato do herói:** a cena usa `portrait_hero_N` quando registrado, sem espelhar (a arte já olha para a esquerda); o sprite antigo
  continua espelhado. `tools/register_portraits.py` não reconhecia `portrait_hero_N` (o padrão só aceitava letras); corrigido.
  Chegou o `portrait_hero_2` nesta rodada; os outros dois entram ao rodar o registro de novo.
- Tutorial fora do robô (entra direto no fim dele). Testes 152 → 153. Novidades v0.86.

## Rodada 85 (v0.85)
- **Retratos de busto (Flow) nas 6 cenas**, conferidos na tela: Ivo, Tomé, Bento, Juna, Odília e Brás carregam em 128 px (1:1) e a
  caixa ganha a classe `bust`. O retrato já fica à esquerda do texto, então os rostos (3/4 para a direita) olham para a fala; não precisou
  mudar o lado. No celular (375 px), o retrato de 128 px cobria o nome e o começo do texto: agora fica com 64 px (metade exata),
  saindo por cima da caixa, com o nome ao lado.
- **Sequência semanal do eco da Serpente** (`ValdoraDaily.echoStreak`, regra pura): vencer o eco em semanas seguidas soma +15% de
  moedas por semana a mais (até +60%) e dá uma barra estelar na 3.ª, 6.ª... semana; pular uma semana zera. Aviso com a sequência ao vencer.
- **Começo do jogo (revisão curta):** novo jogo sem "!" de campanha durante o tutorial; ao terminar, o "!" aparece no Ivo e a janela dele
  mostra o Ato I primeiro. O aviso de fim do tutorial agora aponta para a campanha e para a seta. A revisão completa com robô do
  tutorial ao Ato II não coube nesta rodada.
- Testes 151 → 152. Novidades v0.85.

## Rodada 84 (v0.84)
- **Robô com a correção da diagonal (rodada 83), 10 lutas por chefe, Preciso, sem Q nem esquiva, tucunaré abaixo de 40%:** Senhor das
  Ruínas (Combate 25, espada de aço, cota de ferro) 10/10, 48–77 s, ~10 peixes; Golem Ancião (Combate 31, mesmo equipamento)
  10/10, 68–89 s, ~16 peixes. Nenhuma luta travou (critério: 40 s sem dano no chefe). Não comparável quadro a quadro com as medições
  das rodadas 11–19 (aquele robô usava Q/R e outra comida).
- **Fenda:** entrada de (6,9) para (5,22), a ~9 tiles do Golem Ancião (antes ~6) e o eco da Serpente nasce ao norte dela;
  `tile_rift_glow` embaixo dos 12 braseiros e em ~4% dos tiles das salas (pelo hash da posição; 32 de 492 tiles na conta).
- **Recorde da Fenda:** o tempo da descida (da entrada até abrir o baú) fica em `stats.riftBest`, com aviso de novo recorde e linha
  "Fenda (recorde)" na ficha do personagem.
- **Retratos de busto na caixa de cena:** `portrait_<npc>` (ivo, tome, bento, juna, odilia, bras) é usado quando estiver registrado em
  `ASSETS`; sem ele, fica o sprite de corpo inteiro. `tools/register_portraits.py` registra só os que existem no disco (sem
  aviso de arte faltando no console); nesta rodada chegou o do Ivo, conferido na cena (128 px, 1:1). Rodar de novo quando chegarem os outros.
- Testes 150 → 151. Novidades v0.84.

## Rodada 83 (v0.83)
- **Bug de perseguição (afetava jogadores):** o robô travava em ~1 de cada 4 descidas da Fenda. Diagnóstico (foto do estado depois de
  90 s sem abate): herói e Serpente parados na diagonal, alternando passos sem nunca encostar; a Serpente com a vida cheia. A espera da
  rodada 48 ("monstro na diagonal: espera ele encostar") excluía chefes e durava só 3 ticks, menos que o passo de monstros lentos
  (Serpente 4, Golem Ancião 5). Agora vale para chefes e dura o passo do monstro + 1 tick. Robô na Fenda depois da correção (8 descidas
  por linha): **nenhuma travada**; Combate 35 (lumita) vence 5 e morre 3 (~19 peixes); 38 vence 8/8 (~15,5); 40 estelar 8/8 (~10).
  A recomendação fica em Combate 38+; os números dos monstros não mudaram.
- **Ato V, parte 2 — fim da campanha:**
  - *Ecos de cristal* (Odília): 6 espectros de luz; eles repetem "o selo partiu". Os marcos seguravam a luz por fora; um selo, por dentro.
  - *A Serpente de Lumita* (Brás): a Serpente dá o *Fragmento do selo*; encaixá-lo no **pedestal do selo**, no fundo da Fenda
    (cena, coluna de luz, pedestal aceso com fade), e voltar ao Brás. Cena final com Brás, Ivo, Juna e Tomé. Recompensa: 5.000 moedas,
    Anel ancestral com 2 afixos e o **eco semanal da Serpente** (quadro de caçadas; desperta ao norte da entrada da Fenda, translúcido
    com `alpha` no desenho porque o Blender achata o alfa parcial da arte).
- **Acabamento:** equipamento estelar só na bigorna (a banca mostra "só na bigorna"); os braseiros da Fenda não soltam brasas laranja.
  `tile_rift_glow.png` continua sem uso.
- Arte do Flow: eco da Serpente (folha `boss_heavy`), fragmento e pedestal do selo. `anim_data.js`: 106 → 107 folhas, antigas idênticas.
- Testes 149 → 150 (o teste antigo dos "2 ecos" conta só os ecos do quadro original). Novidades v0.83.

## Rodada 82 (v0.82)
- **Ato V, parte 1 — a Fenda Cintilante** (masmorra instanciada, entrada no alto do Planalto, liberada ao concluir o Ato IV):
  4 salas de rocha azul-violeta com cristais vivos de enfeite e braseiros de cristal (luz fria), 4 aranhas de quartzo, 2 sentinelas de
  cristal (golpe especial), 2 espectros de luz e a **Serpente de Lumita** (chefe, tremor em área e fúria) guardando o baú da Fenda
  (fragmentos cintilantes, barras estelares, chance de Anel ancestral e Coroa do Ancião). Refeita a cada visita.
  - Missão *A fenda se abre* (Brás, Combate 34+): descer, abrir o baú do fundo e voltar. 2 cenas.
- **Equipamento nível 5 (estelar):** Barra estelar na fornalha (3 fragmentos cintilantes + 1 barra de lumita, Ferraria 30); Lâmina
  estelar (+20 acerto, +8 dano) e Couraça estelar (+22 defesa) na bigorna. **Ao forjar, o metal sorteia 1 ou 2 modificadores**
  (os afixos dos acessórios, na força dos chefes), guardados em `player.gearAff` e somados ao combate. Conferido no jogo: Lâmina estelar
  com Feroz e Certeiro → acerto 59 → 67, dano máximo 18 → 22.
- **Robô na Fenda** (Preciso, sem Q nem esquiva, até 20 tucunarés, limpando sala por sala): com os números de partida, Combate 35, 38 e
  40 morriam em 4–5 de 6 descidas. Depois de reduzir vida e ataque (aranha 120/40 → 90/34, sentinela 190/42 → 150/36, espectro 110/46
  → 85/38, Serpente 900/50 → 480/40): Combate 35 (lâmina e couraça de lumita) limpa 2 de 8 e morre 2; 38, 6 de 8 sem morrer (~13
  peixes, 3–4 min); 40 com estelar, 6 de 8 (~8 peixes). As descidas restantes travam até o limite de 15 min (o robô fica preso numa
  perseguição; a investigar). Recomendação na missão e na região: Combate 38+.
- **Arte do Flow (Ato V, lotes 1 e 2):** 3 monstros e a Serpente (folhas no Blender: aranha `quad`, sentinela `heavy` com especial,
  espectro `slime`, Serpente `boss_heavy`), entrada, 3 cristais, braseiro, baú fechado/aberto, ícones e chão. `anim_data.js`: 102 → 106
  folhas, as antigas idênticas. `tile_rift_glow.png` ainda não está em uso.
- **Golems calmos perto do Brás** (a até 7 tiles dele): o acampamento ficava a ~5 tiles do bando.
- Testes 148 → 149 (o teste antigo da armadura tier 4 aceita o nível 5 depois). Novidades v0.82.

## Rodada 81 (v0.81)
- **Ato IV, "O Coração de Lumita"** (Combate 26+, depois do Ato III), com o **Brás, o garimpeiro** (NPC novo; acampamento na subida do
  Planalto, procurado em anel por um 3x2 livre):
  - *Veio vivo* (Ivo → Brás): 10 lumitas e 2 barras de aço para a lanterna de garimpo; com ela acesa, o Brás vê o coração rachado.
  - *Golems de pé* (Brás): 8 golems de musgo ("não são bichos, são turno de guarda").
  - *O último guardião* (Brás): o Golem Ancião dá a *Lasca do coração*; ela e 3 barras de lumita vão ao **Coração de lumita**, que é o
    marco do Planalto (arte própria: cristal flutuando sobre um pedestal). Aceso: bênção, pedra de passagem e golems e slimes de lumita
    que não atacam por conta própria a até 9 tiles. O antigo "Marco do Planalto" (enfeite) virou "Pedras dos garimpeiros".
  - 7 cenas; a cena final abre o Ato V. Recompensa final: Coroa do Ancião com 2 afixos.
- **Robô do Ato III** (copiar as 4 estelas, 10 rodadas, Preciso, sem Q nem esquiva): com um esqueleto acordando a cada estela e duas
  estelas a ~7 tiles do Senhor das Ruínas, Combate 18 morria 4 vezes em 10 (8 peixes); 20 e 22, 2 em 10. As duas estelas do leste foram
  para (91,16) e (78,16) e só a 1.ª e a 3.ª acordam esqueleto: Combate 18 morre 1 em 10 (~1,8 peixe); 20, 2 em 10 (~2,8). O robô não
  recua nem esquiva e é teleportado para dentro do bando das Ruínas; as mortes restantes vêm dos esqueletos que já vivem lá.
- **Ato V desenhado** (em `VD.CAMPAIGN`, aparece no Diário): Fenda Cintilante, masmorra instanciada aberta no Planalto; missões
  "A fenda se abre", "Ecos de cristal" e "A Serpente de Lumita"; equipamento nível 5 (estelar) com modificadores sorteados.
- Arte do Flow do Ato IV: Brás, acampamento (lamparina acesa à noite) e Coração de lumita (fade de 1,2 s ao acender).
- Testes 147 → 148. Novidades v0.81.

## Rodada 80 (v0.80)
- **Ato III, "Os Mortos Lembram"** (Combate 18+, depois do Ato II), com a **Odília, a cartógrafa** (NPC nova; tenda na saída nordeste
  dos Campos, perto das Ruínas):
  - *Inscrições* (Ivo → Odília): copiar 4 estelas com runas nas Ruínas (lua, olho, espiral e coroa); cada uma acende e acorda um esqueleto.
  - *O juramento* (Odília): o baú da cripta dá o *Juramento do guardião*; a Odília lê: o Senhor das Ruínas é o guarda do marco.
  - *O guardião das Ruínas* (Odília): vencer o Senhor das Ruínas, levar o juramento e 3 barras de aço ao **Marco das Ruínas** e contar à
    Odília. Marco aceso: bênção, pedra de passagem e **esqueletos que não atacam por conta própria a até 9 tiles dele**.
  - 7 cenas; a Odília fala rápido, cita a própria turma e promete notas de rodapé. O chefe já estava medido (rodadas 11–19).
- **Caçada do dia** (`js/daily.js`, novo, regras puras): um pedido por dia do calendário no topo do quadro de caçadas (monstro comum
  perto do seu Combate, 8–12, sorteado pelo hash da data, nunca pelo aleatório do jogo). Receber no dia seguinte ao último mantém a
  **sequência**: +10% por dia (até +50%), poção de força no 3.º dia e elixir do lobo + 2 poções no 7.º. Pular um dia zera.
- **Bestiário com prêmios:** ao descobrir 5, 10, 15 e 20 criaturas, moedas e prêmio (poções, elixires e um Anel ancestral com afixo).
  Vale também para saves antigos na próxima criatura nova.
- **Zoom inteiro:** a interface usa 1× ou 2× (automático: 2× a partir de 2400 × 1560; opções "Normal (1×)" e "Dobro (2×)"; os valores
  antigos 1,15/1,3 viram 1×). O lobby saiu de 1,2×/1,35× para 1× (2× a partir de 2400 × 1300). A fonte em pixel art fica nítida.
- **Arte do Flow (Ato III):** Odília (idle, fala, andar e olhar no Blender), tenda (lamparina acesa à noite) e as 4 estelas apagadas e
  acesas (fade de 1,2 s ao acender). `anim_data.js`: 98 → 100 folhas, as antigas idênticas.
- Save: campos novos `daily` e `bestiary`. Testes 144 → 147. Novidades v0.80.

## Rodada 79 (v0.79)
- **Ato II, "A Mata que Escuta"** (Combate 12+, depois do Ato I):
  - *Raízes inquietas* (Ivo → **Juna, a raizeira**, NPC novo na cabana da entrada da Mata Sombria): conhecer a Juna, levar 4 peles
    de lobo e 4 carvalhos para o unguento e ouvir o que ela descobriu. Libera a **alquimia da Juna**.
  - *O uivo sob a lua* (Juna): o Alfa da lua cheia engoliu o cristal do marco; derrotá-lo (evento ou Toca) dá o *Cristal uivante*.
    Com a missão ativa, a Lua cheia chega 4x mais rápido à noite, como já acontecia com a balada do Tomé.
  - *O Marco da Mata* (Juna): **só à noite**, cristal + 3 barras de ferro no marco (a janela avisa "volte à noite"), resistir à
    matilha e voltar à Juna. Marco aceso: bênção, pedra de passagem e **lobos que não atacam por conta própria a até 9 tiles dele**.
  - 7 cenas novas; a Juna é seca e desconfiada da vila ("diga ao Ivo que eu mandei lembranças; ele vai entender que é uma ofensa").
- **Alquimia** (janela da Juna, XP de Culinária): Tônico de vigor (+1 de vida por segundo por 90 s; efeito novo `regen`), Elixir do
  lobo (+2 acerto, +2 dano, 2 min) e Unguento de casca (+4 defesa, 2 min).
- **Robôs** (mundo fixo, 10 lutas por linha, Preciso, sem Q nem esquiva, Tucunaré assado abaixo de 40%): a matilha do Marco da Mata
  com os 6 lobos de uma vez derrubava Combate 12 (8 de 10), 14 (7 de 10) e 16 (2 de 10). Agora vem em **duas levas de 3** (o alfa na
  segunda): Combate 14 vence 10/10 com ~4 peixes, 16 com ~2,4 e 18 sem comer.
- **Arte do Flow no lugar dos placeholders** (lotes 1 e 2 do coordenador): marcos de lumita aceso e apagado (o apagado some em 1,2 s
  por cima quando acende), fendas aberta e cicatriz (decalques de chão; o brilho somado sai do veio, em PIL), **Capataz Rasgo** com
  folha própria no Blender (rig bípede; a faixa do braço começa depois da perna, `ARM` −0,26/−0,31, porque a clava fica baixa e na
  frente e a primeira tentativa entortava a perna), **Juna** (idle/fala/andar e as folhas `_look` a partir da folha de 4 direções:
  ela olha para o herói a até 4 passos, sem andar) e a **cabana da Juna** (luz na janela à noite). `anim_data.js`: 95 → 98 folhas,
  as 95 antigas idênticas (conferido entrada por entrada). Os placeholders em PIL saíram.
- **Fonte Valdora Pixel em toda a interface e no site**: tamanhos de 9–16 px viraram 12 px e de 18–30 px viraram 24 px (104
  declarações e 7 atalhos `font:`); nomes, balões, rótulos, contagem de itens no chão, marcas "!" e textos flutuantes do canvas também
  (nomes em pixel inteiro). O jogo espera a fonte carregar (até 1,5 s) antes do primeiro quadro. Conferido no computador e a 375 px.
- Seta de objetivo para acima da barra de habilidades. Testes 141 → 144. Novidades v0.79.

## Rodada 78 (v0.78)
Novo diretor. Foco das próximas rodadas: profundidade (nota 6,5). Esta rodada desenha a campanha inteira e entrega o Ato I.
- **Campanha "Os Marcos de Lumeira"** (desenho completo em `VD.CAMPAIGN`, `js/data.js`; aparece no Diário). Os fundadores ergueram cinco
  marcos de lumita em volta do vale para manter adormecida a luz viva sob Lumeira; os cristais estão se apagando, e é isso que acorda
  mortos, golems e o Alfa. Os dois chefes são os antigos guardiões.
  | Ato | Região · nível | NPC novo | Missões (plano) | O que muda no mundo |
  |---|---|---|---|---|
  | I. Rachaduras (**feito**) | Campos e Bosque · Combate 3–12 | — (Ivo, Tomé, Bento) | O tremor da madrugada, O Marco dos Campos, O bando do Capataz | 2 marcos acesos, bênção do marco, pedras de passagem |
  | II. A Mata que Escuta | Mata Sombria · 12–20 | Juna, a raizeira | Raízes inquietas, O uivo sob a lua, O Marco da Mata | alquimia da Juna; Mata mais calma à noite |
  | III. Os Mortos Lembram | Ruínas · 18–28 | Odília, a cartógrafa | Inscrições, O juramento, O guardião das Ruínas | o Senhor das Ruínas descansa; Marco das Ruínas |
  | IV. O Coração de Lumita | Planalto · 26–34 | Brás, o garimpeiro | Veio vivo, Golems de pé, O último guardião | o Golem Ancião se ajoelha; Marco do Planalto |
  | V. Além do Selo | Fenda Cintilante · 35+ | — | A fenda se abre | fim de jogo: equipamento nível 5 e modificadores sorteados |
- **Ato I** (3 missões, 9 passos, 9 cenas):
  - *O tremor da madrugada* (Ivo, depois do tutorial): examinar 3 fendas brilhantes nos Campos (cada uma solta um slime; a terceira dá a
    *Lasca rúnica*) e mostrar a lasca ao Tomé, que reconhece os marcos na canção mais velha da vila. Aceita a seguinte sozinha.
  - *O Marco dos Campos* (Tomé): consertar o marco com 3 barras de bronze, defender a pedra de 6 criaturas que sobem da terra, contar ao Ivo.
  - *O bando do Capataz* (Ivo, Combate 8+): o Bento conta que pegou "a pedra bonita" do marco do Bosque e os goblins a roubaram;
    6 goblins; o **Capataz Rasgo** (mini-chefe novo) sai do acampamento ao encontro do herói; pedra-guia + 5 carvalhos no Marco do Bosque;
    cena final com os três NPCs. Recompensa: Anel do caçador com afixo e as pedras de passagem.
- **Missões, extensões** (`js/quests.js`): passo de conversa com outro NPC (`to`), entrega num marco (`at`), itens ganhos ao concluir um
  passo (`gives`), itens que o NPC fica (`take`), próxima missão aceita sozinha (`next`), recompensa que libera algo (`unlock`), cena ao
  aceitar e em cada passo (`scene`). "?" aparece no NPC que conclui o passo; a campanha vem primeiro nas janelas e no quadro verde.
- **Cenas de diálogo** (`js/scene.js`, novo): caixa no rodapé com retrato, nome colorido e texto aparecendo aos poucos, na **fonte de texto
  corrido em pixel art** (Valdora Pixel, 24 px). Clique/Espaço/Enter/F avançam, Esc pula; o mundo pausa durante a cena. No celular, a caixa
  ocupa a largura toda com o retrato por cima (conferido a 375 px, sem rolagem lateral).
- **Campanha no mundo** (`js/campaign.js`, novo): marcos (apagados ou acesos), fendas desenhadas no chão com brilho pulsando e fagulhas,
  onda no marco dos Campos e Capataz que voltam se o herói fugir ou cair, **bênção do marco** (vida volta 2x mais rápido a até 2,6 tiles
  de um marco aceso, fora de luta), **pedras de passagem** (viagem entre o santuário e os marcos acesos; não vale em luta) e indicadores de
  objetivo: "!" ciano sobre o alvo, losango no minimapa e seta na borda da tela com a distância (para antes do painel lateral).
  Tudo sai do estado das missões: nenhum campo novo no save.
- **Arte (PIL)**: `deco_marker_dim` (o marco do Planalto com o cristal sem cor), `deco_crack`, `deco_crack_sealed` e `deco_crack_glow`
  (96 × 64). O Capataz usa a arte do goblin tingida e 30% maior até chegar a própria (pedido no relatório).
- **Equilíbrio medido com robôs** (mundo fixo `ValdoraGame.seed(n)`, 10 lutas por linha, estilo Preciso, sem Q nem esquiva, come abaixo de 40%):
  - Capataz 120 de vida/ataque 14/máx. 6 lutando dentro do acampamento: Combate 12 morria 1 em 10 e puxava 5–7 goblins. Mudanças: ele
    sai ao encontro do herói (3 tiles à frente, longe do bando) e ficou com 100/11/5. Resultado: Combate 8 (espada de bronze, gibão)
    vence 6 de 10; Combate 9–10 vence 10 de 10 com 5–6 carnes; Combate 12 com ~2. O passo recomenda Combate 10+.
  - Onda do marco (4 slimes e 2 slimes azuis): Combate 4 sem equipamento vence 10/10 com ~3 lambaris; Combate 6, ~0,5. Sem mudança.
  - Os marcos entram no fim do `genWorld`, depois de todo o sorteio: o mundo inicial do mundo fixo sai igual. Durante a partida, os tiles
    ocupados pelos marcos podem mudar o sorteio dos renascimentos (como qualquer objeto novo).
- **Outros:** os goblins chamados pelo Capataz fogem quando ele cai; mini-chefe pode ter luz própria (`light`); itens de missão não vendem
  e não caem no chão; o santuário mostra a viagem primeiro; Diário com seção da campanha (atos feitos, atual e os que vêm).
- Testes novos (133 → 141). Novidades v0.78 e cartão "Campanha" no Como jogar.
- **Para a próxima rodada:** a fonte Valdora Pixel só está nas cenas (o resto da interface usa tamanhos como 11, 13 e 15 px, que borram
  nela; trocar exige rever larguras). `quests.js` foi reescrito por inteiro nesta rodada (cópia da versão anterior no scratchpad).

## Rodada 77 (v0.77)
- **Poças refletem a luz à noite:** cada ponto de poça guarda `lit` (1 colado a um poste ou fogueira, 0 a 3 tiles); à noite e molhada,
  a poça ganha um brilho quente somado e um reflexo da chama em pé, desenhados por cima da escuridão. Teste novo (132 → 133).
- **Conferido no lobby:** cartão do save fora da vila ("Bosque dos Carvalhos", ícone de árvore), no computador e a 375 px (sem rolagem
  lateral); prévia do herói andando com a folha nova.
- **Passagem de bastão** (última rodada deste diretor): armadilhas conhecidas para quem continuar.
  - `tools/anim_pack.py` refaz **todas** as folhas (~55 s) e reescreve `js/anim_data.js` inteiro; antes de rodar, copie o
    `anim_data.js` e compare as entradas depois (as rodadas 67–75 conferiram que as antigas saem iguais). A limpeza
    `clean_top()`/`clean_small()` roda só nas fontes da caminhada e dos NPCs olhando.
  - Mundo fixo (`ValdoraGame.seed(n)`): enfeites usam `Math.random` de propósito (ambiente, olhar dos NPCs, poças pelo hash). A ronda
    do Ivo (rodada 73) mudou a ordem do aleatório do jogo durante a partida: medições anteriores a ela não são comparáveis quadro a
    quadro.
  - Hook de depuração: `window.__vd = (c) => eval(c); // DEBUG-TEMP` na última linha antes do `visibilitychange` do `game.js`;
    sempre remover no fim (procure `__vd`).
  - Com a janela do Chrome encoberta, o `requestAnimationFrame` cai para ~2 fps e as animações CSS param: use um `setInterval` que
    chame `update`/`draw` pelo hook, ou `wait`/`screenshot` das ferramentas do navegador. O navegador guarda JS e CSS em cache: recarregue
    com Ctrl+Shift+R.
  - `tests.html` não carrega `game.js` nem `lobby.js`: lógica dentro deles (props, ronda, região do save) só se testa no navegador.
  - Chave `blasthunters.save.v2` no localStorage é de outro projeto: nunca apagar.
- Novidades v0.77.

## Rodada 76 (v0.76)
- **Lobby, prévia do herói:** quando anda (alternando com o parado respirando), usa a folha `hero_N_walk6` (6 quadros, 4 direções),
  sem o pulinho procedural de antes; a folha antiga fica de reserva.
- **Lobby, cartão do save:** mostra a região onde o herói parou, com o ícone de 20 px (`ValdoraWorld.regionShape` + praça da vila),
  em verde escuro sobre o pergaminho. Na primeira tentativa o ícone saía em tamanho cheio (regra `#save-info img` mais forte) e o
  verde claro sumia no pergaminho; corrigido.
- **Poças com os postes à noite:** não entrou nesta rodada.
- Novidades v0.76.

## Rodada 75 (v0.75)
- **Risquinho acima da cabeça** (apontado pelo coordenador nas passagens da `hero_1_walk6`): era o resto do pé da linha de cima da folha,
  ligado ao cabelo só pela borda quase transparente do recorte, então escapava da limpeza. Agora `clean_small()` (depois de
  `clean_top()`, na origem, antes do rig) liga os grupos só por pixels com alfa > 96, apaga grupos com menos de 12 px que não sejam o
  corpo e, por fim, a borda fraca que ficou sozinha. Conferido ampliado 4× nas 3 caminhadas e nas 3 folhas `npc_*_look`.
- **Folha de 6 quadros com 6 colunas** (antes 8, com 2 vazias): `hero_N_walk6_anim.png` agora tem 612 × 408 px.
- **Poças depois da chuva** (`js/ambient.js`, `js/game.js`): ~4% dos tiles de estrada e terra têm um ponto de poça (pelo hash da
  posição, sem usar o aleatório do jogo). Enchem com a chuva e secam em ~90 s depois dela; têm brilho de reflexo e, chovendo, pingos
  em anel. Desenhadas na camada do chão, nunca nas masmorras.
- **Chuva no celular (375 px):** conferida, com gotas, céu fechado e a faixa de região por cima.
- Teste novo (131 → 132): poças enchem e secam em ~90 s. Novidades v0.75.

## Rodada 74 (v0.74)
- **Caminhada em 6 quadros (Blender)**, a partir dos 3 da `hero_N_sheet` (o Flow não acertou a folha nova): contato A (passada 1),
  descida A (passada 1 com a faixa das pernas e da barra encolhida a 90%), passagem (neutro com a faixa esticada a 107%, corpo
  erguido), contato B (passada 2), descida B e passagem. Rig `walkleg` em `tools/blender_anim.py`: só a faixa de baixo (36% do
  quadro) deforma; o tronco sobe ou desce inteiro, sem entortar. `anim_pack.py` monta `hero_N_walk6_anim.png` (4 direções, a direita
  espelhando a esquerda). No jogo, 6 quadros a cada 2 tiles (`floor(dist × 3) % 6`); a subida e descida feita no código (rodada 72)
  só vale sem a folha nova, e o lampejo branco do golpe recebido acompanha a folha nova.
- **NPCs olhando de lado/de costas com respiração:** folhas `npc_*_look` (linhas `idle_left`, `idle_right` espelhada, `idle_up`)
  feitas no Blender a partir do quadro em pé da folha de 4 direções, com a linha idle.
- **Pedaços soltos no alto das células:** os pés da linha de cima das folhas de 4 direções vazavam para a de baixo (pontinhos acima
  da cabeça). `clean_top()` apaga cada grupo de pixels ligados que fica inteiro nas 8 primeiras linhas; o resto fica.
- **Chuva à noite:** conferida no jogo, com gotas claras por cima da escuridão, postes e vagalumes. Poças depois da chuva ficaram
  para depois.
- Teste novo (130 → 131); o teste "NPCs têm idle" passou a ignorar as folhas `_look`. Novidades v0.74.

## Rodada 73 (v0.73)
- **Rotina dos NPCs** (`js/game.js`, `js/scenery.js`):
  - **Olham para o herói:** com o herói a até 4 passos, Ivo, Bento e Tomé se viram para ele pelo quadro em pé da folha de 4
    direções; de frente (herói embaixo) continua o idle animado. Não vale falando, sentado, cantando nem na reação.
  - **Ronda do Ivo:** em vez de passos soltos de ±2, percorre 4 pontos em volta de casa, voltando a ela entre um e outro.
    Simulação de 180 s com o herói longe: passou por 22 tiles diferentes em volta do cruzamento.
  - **Bento arruma a banca:** sozinho em casa, a cada 8–18 s se vira para a banca por 3 s (15 s no total em 180 s simulados).
  - O olhar e a banca usam `Math.random` (enfeite). A ronda muda a ordem do aleatório do jogo durante a partida: o mundo fixo das
    medições continua repetindo igual a si mesmo, mas não é mais comparável quadro a quadro com rodadas antigas.
- **Auditoria:** a área mais fraca sem depender de som virou o clima: o mundo era sempre o mesmo céu. **Chuva passageira**
  (`js/ambient.js`): a cada 6–10 min de jogo, 70–120 s de chuva fina que entra e sai em ~8 s; nunca nas masmorras. 230 gotas em
  vetor fixo, respingos no chão, céu um pouco mais fechado e nuvens mais escuras; com "reduzir movimento", 40% das gotas.
  `setRain(k)` força a chuva (testes). Conferido no jogo.
- **Caminhada de 6 quadros:** a folha do Flow não chegou nesta rodada; fica para a 74, com a subida e descida da rodada 72.
- Teste novo (129 → 130): chuva entra e sai em ~8 s e não nasce na masmorra. Novidades v0.73.

## Rodada 72 (v0.72)
- **Engasgos (investigação curta):** repeti o mesmo trajeto da câmera 3 vezes com o mesmo terreno (na 2.ª e na 3.ª todos os blocos já
  estão prontos e já foram desenhados na tela). Os quadros acima de 16 ms continuam (4, 4 e 5 em 601), espaçados de ~100 quadros e em
  posições diferentes a cada passagem. Então não são o chão novo nem o envio de imagem dos blocos. O padrão combina com coleta de
  memória ou com a fila da placa de vídeo cheia, que acontece quando a janela do Chrome está encoberta (o mesmo motivo do
  requestAnimationFrame a 2 fps). Fica registrado; vale olhar no painel Performance numa janela visível.
- **Golems e minimapa conferidos no jogo:** o Golem de musgo luta com a folha nova sem erro; o minimapa da cripta desenha as salas.
- **Caminhada do herói:** a folha tem 3 quadros por direção, tocados como 1-0-2-0 (duas passadas e o neutro), e o corpo não subia
  nem descia. Agora sobe até 2,2 px no quadro neutro (passagem) e desce na passada, centrado no meio de cada quadro; o nome e a
  ferramenta acompanham. Conferido gravando a caminhada na praça. A arte de origem é o limite (só duas passadas desenhadas): pedido
  de folha nova do Flow no relatório.
- Novidades v0.72.

## Rodada 71 (v0.71)
- **Braços dos golems (Blender):** nos kinds `heavy`/`boss_heavy` (Golem de musgo, Golem Ancião, Colosso de lumita), os dois braços
  giram espelhados em torno de dois ombros (±0,2; 0,66), a 60% do ângulo dos bípedes (mais que isso esticava a junta de pedra).
  Ataque: punhos sobem e descem; tremor (`special`): sobem até 42° e batem. O Golem Ancião fica com o parado e o golpe recebido de chefe.
- **Braço sem a perna:** `ARM` em `tools/anim_pack.py` define por arte onde começa o braço; esqueleto (−0,20 a −0,26) e guardião da
  cripta (−0,22 a −0,28) giram só a arma, e a perna da frente fica parada. Conferido nas folhas.
- **Ícones das abas:** usei os do Flow (`icon_tab_bag_flow.png`, `icon_tab_levels_flow.png`, 32 px reduzidos a 24 px com filtro). No
  painel, em tamanho real, leem melhor que os meus de 16 px (a mochila tem fivela e alças; o pergaminho de níveis combina com o
  ícone do Diário). Os meus ficam em `assets/ui/` sem uso.
- **Conferido na tela:** em luta contra o Senhor das Ruínas, o nome dele só aparece na barra do topo. Cabeçalho da janela no
  celular de 375 px: 58 px de altura (antes 75).
- **Pré-desenho do chão, medido** (`ground.setPrewarm`, câmera andando 4 px por quadro em 3 trajetos, 1.719 quadros, duas rodadas):
  com o pré-desenho, 27 blocos são feitos antes de aparecer e o pior quadro do chão cai de 31–36 ms para 22–25 ms. Mas os quadros acima
  de 16 ms quase não mudam (11–14 sem, 12 com): os que sobram acontecem em quadros sem bloco novo nenhum, então não vêm do chão novo.
  Prováveis causas: envio de imagem para a placa de vídeo ou coleta de memória, a investigar com o painel Performance numa janela
  visível. Testei desenhar 1 px do bloco novo para forçar o envio antes; não mudou nada e saiu.
- **Minimapa** (`js/overlay.js`): fundo pintado a 4 px por tile e reduzido com filtro; lagos pelo mesmo contorno suave do chão, com
  margem clara; manchas de tom; sem os pontinhos brancos das pedras; árvores como manchas redondas. Monstros, NPCs e chefes em pontos
  redondos com contorno escuro; o herói vira uma seta branca apontando para onde olha. Montagem do fundo: 16 ms, uma vez por mapa.
- Teste novo (128 → 129): sem pré-desenho, o bloco da frente só nasce quando aparece. Novidades v0.71.

## Rodada 70 (v0.70)
- **Pré-desenho do chão** (`js/terrain.js`): num quadro em que nenhum bloco novo foi desenhado e a câmera andou, o bloco 16×16
  seguinte na direção do movimento é desenhado fora da tela (no máximo 1 por quadro, só na direção do movimento, então o cache de 16
  não troca os blocos visíveis). O custo da primeira vez (até ~10 ms com margem de lago) sai do quadro em que o bloco aparece.
  `ground.prewarmed()` conta quantos foram adiantados (teste novo).
- **Nome do chefe:** em luta (`aggro`), o nome no mundo some; a barra do topo já mostra o nome, e os números de dano não caem mais
  em cima dele.
- **Janelas no celular (≤ 480 px):** a placa do topo usa a escala 1× (cantos de 12 px) e padding menor; o cabeçalho fica mais baixo.
- **Abas do painel com ícone:** ícone de 22 px em cima e rótulo pequeno embaixo. Mochila e Níveis com ícones novos em pixel art feitos
  em PIL (`assets/ui/icon_tab_bag.png`, `icon_tab_levels.png`, 16×16 ampliados 2×); Equip. com `item_armor` e Diário com
  `icon_journal_quests`. A aba fechada fica com o ícone acinzentado.
- **Animações (Blender, `tools/blender_anim.py`):** parâmetro novo `arm` nos bípedes (`biped`, `boss`): a faixa da frente do sprite
  (onde fica o braço com a arma) gira rígida em torno do ombro, sem dobrar a arma.
  - Ataque: a arma sobe até 48° na preparação e desce 26° além do ponto no golpe, voltando em 4 quadros.
  - Parado: respiração ~40% maior, troca de peso e a arma balança ±5°.
  - Golpe recebido: achata mais (8%), recua com um pulinho e a arma se solta para cima.
  - NPCs e herói de frente: respiração e "peso" no chão um pouco maiores.
  - Na primeira tentativa a arma dobrava (peso que variava ao longo dela; espada do Senhor em "L"). Corrigido com transição curta só
    perto do ombro. Efeito colateral aceito: a perna da frente do esqueleto e do guardião acompanha o golpe, como um passo.
  - `anim_data.js` regerado (89 folhas); conferido nas folhas de goblin, esqueleto, guardião da cripta, Senhor das Ruínas e Ivo.
- Testes: 127 → 128. Novidades v0.70.

## Rodada 69 (v0.69)
- **Placa de madeira 9-slice** (`assets/ui/plaque_9s.png`, feita pelo coordenador; cantos de 12 px desenhados a 2×, miolo repetido
  com `round`, nunca esticado): no topo das janelas, nas abas do lobby e na faixa de eventos/região.
- **Fonte de títulos no lobby:** as abas (a aberta em dourado) e o nome do herói. O lobby carrega a própria cópia da fonte (mesma
  imagem); sem ela, fica o texto. Cada título em imagem guarda o texto no `alt` (teste novo).
  - **Abas do painel do jogo ficaram no texto:** "MOCHILA" na fonte tem 80 px, e cada aba tem ~47 px.
- **375 px (iframe):** abas do lobby cabem (borda direita em 343 px, sem rolagem lateral); janela da banca com a placa e o título
  ocupando 12–363 px; a faixa de região passava por cima do painel e cortava o nome. Agora desce para 30% da altura (254–332 px, abaixo
  do cartão da missão, que termina em 155) e usa a largura toda; "BOSQUE DOS CARVALHOS" sai com 297 × 32 px, sem deformar
  (`object-fit`).
- **Praça:** os 4 cantos do cruzamento ganharam poste (47,35), (50,38), (47,38) e (50,35); o de (41,38) saiu da lista. À noite a
  entrada do Bosque fica iluminada pelo poste (60,35), conferido na tela.
- **Luta real contra o Senhor das Ruínas** (Combate 28, equipamento 3/3): o golpe pesado deixa a marca no tile da frente (criada e
  vista sob a espada fincada); na fúria, aura roxa, esqueletos erguidos, arco do herói visível e "bloqueou ×2" juntando os avisos.
  Achado: o número de dano no chefe nasce em cima do nome dele ("Senhor das Ruínas").
- **Desempenho da primeira renderização dos blocos 16×16** (`ground.chunkMs`, 26 blocos medidos): blocos com margem de lago 0,8–10,1 ms
  (média ~5,6); blocos com borda grama × pedra (praça, ruínas) 4,1–9,5 ms; blocos sem nenhuma das duas 0,3–1,0 ms. Só acontece na primeira vez que o bloco entra na tela (cache de 16
  blocos); o pior caso, dois blocos de lago juntos, passa de 16 ms e pode perder 1 quadro.
- **Som:** a revisão da mixagem ficou para quando alguém puder ouvir (camadas da rodada 67 não ouvidas).
- Teste novo (126 → 127). Novidades v0.69.

## Rodada 68 (v0.68)
- **Fonte de títulos em pixel art** (`assets/ui/font_title.png`, feita pelo coordenador: 61 glifos de 14×24, avanço de 11 px, só
  maiúsculas). `UI.titleHTML` monta uma `<img>` (com `alt` = texto) tingida por multiplicação e guardada em cache; caractere fora da
  folha volta para o texto normal. Usada na faixa de eventos e de região (2×, 32 px no celular), na comemoração de nível ("NÍVEL 12")
  e no título das janelas (1×).
- **Props:**
  - Na praça: banco (45,43) e floreira (46,29) com coordenadas novas e escala menor (banco 1,25 e floreira 1,2 tile). Agora entram os 8
    props da praça; o terceiro poste ficou de fora.
  - Fora da praça: banco na beira do Lago Grande (39,25), poste (60,35) e caixotes (61,38) na entrada do Bosque. Todos a até 6 tiles
    da vila, onde nenhum monstro nasce (`spawnOk`), e colocados depois dos canteiros de flores: o sorteio do mundo fixo não muda.
- **Marcas no chão:** o tremor do Golem Ancião (marca de 2,1 tiles) e o golpe pesado do Senhor das Ruínas e dos monstros com
  "special" (1,15 tile, no tile da frente, mesmo quando o herói esquiva).
- **Água funda na margem:** os tiles de terra vizinhos de lago fundo desenham a água funda por baixo da margem curva (só desenho).
- **Medição do golpe em 4 quadros** (passo fixo de 1/60 s, 10 golpes para baixo e 10 para cima): o dano sai sempre a 133 ms do
  início e sempre com o quadro do avanço (2) na tela, 20 de 20. Sequência: antecipação 67 + 67 ms (quadros 0 e 1), avanço 67 ms
  (quadro 2, mais a pausa de impacto), assentar 133 ms (quadro 3) e 100 ms do quadro final da folha antiga; 433 ms no total, igual ao
  golpe de antes. O tempo de jogo não mudou: a mudança é só de leitura.
- **Avisos:** os eventos de mundo já não repetem no canto (rodada 67); a faixa agora usa a fonte de títulos.
- Teste novo (125 → 126): fonte de títulos (61 glifos, larguras de "Nível 2" e "Ação!", caractere fora cai no texto).
- Novidades v0.68.

## Rodada 67 (v0.67)
Plano da rodada 66, mais a arte que chegou em paralelo (props da praça no Flow e a folha de números feita à mão).
- **Golpe de frente e de costas em 4 quadros (Blender):** ações novas `strike4d`/`strike4u` em `tools/blender_anim.py` (antecipação
  em 2 quadros a partir do quadro de preparação, avanço achatado e assentar a partir do quadro do golpe). `tools/anim_pack.py`
  monta `hero_N_strike4_anim.png` (linhas `strike_down` e `strike_up`) e o jogo usa nos golpes de espada e no esmagador. O
  `anim_data.js` foi regerado por inteiro e as outras 100+ folhas saíram idênticas (conferido entrada por entrada).
- **Arco largo da espada** (`js/hero.js`): meia-lua com cabeça clara e cauda dourada que afina, passando além da silhueta, nas 4
  direções (de costas, por trás do herói).
- **Herói não tampa o alvo de cima:** atacando um monstro logo acima, o herói recua 0,24 tile para baixo (só no desenho, suave).
- **Lagos e praça com contorno orgânico** (`js/terrain.js`, `makeField`): campo suave por tile (borrado e interpolado entre centros,
  com ruído fraco no centro e forte perto da borda do tile). Cada bloco de 3 px decide de que lado fica: quinas viram curvas e as
  retas ondulam. O centro de cada tile nunca troca de lado (teste novo), então caminhos, pesca, nascimentos e as medições com mundo
  fixo não mudam. Na margem: areia molhada, espuma em duas camadas, faixa escura curta e **ondas** (duas faixas que acendem uma depois
  da outra, desenhadas de canvas pequenos de 1 px por bloco). Na praça: a grama avança em curvas sobre a pedra, com borda escura e sombra
  curta.
- **Números de dano em pixel art:** `assets/ui/digits.png` (feita pelo coordenador), tingida por multiplicação e guardada por cor
  (branco, dourado, vermelho, laranja), avanço de 13 px. A fonte do navegador fica de reserva.
- **Marcas no chão:** o golpe esmagador deixa uma mancha com rachaduras que some em 2,6 s; ondas de choque e marcas passaram para a
  camada do chão (por baixo dos personagens).
- **Props da praça (Flow):** carroça de feno, 2 pilhas de caixotes e 2 postes de lanterna (com luz à noite). Entram depois de tudo que
  procura lugar na vila, só em pedra livre com os 4 vizinhos livres; floreira (47,29), terceiro poste (41,38) e banco (52,43) foram
  recusados por essa regra e ficaram de fora. A pedra da vila não sorteia enfeites, então o resto do mundo sai igual.
- **Avisos sem repetição:** eventos de mundo mostram só a faixa grande e o registro (o aviso no canto repetia o mesmo texto).
- **Som em camadas** (`js/audio.js`): "sala" curta (eco de 75 ms com realimentação e filtro) para os impactos; golpe = ar + estalo +
  baque grave; crítico com brilho metálico; dano recebido e tremor com corpo. Não ouvido aqui (conferido só no código).
- Testes novos (122 → 125): contorno suave não troca tile de lado, folhas `strike4` e arte registrada, marcas e ondas na camada do chão.
- Novidades v0.67.

## Rodada 66 (v0.66)
Rodada de acabamento visual e de sensação de combate (sem mexer em números de equilíbrio; o aleatório do jogo não é usado pelos
enfeites novos, então o mundo fixo das medições continua igual).
- **Números de dano** (`js/fx.js`): sem a caixa vermelha; cada tipo tem estilo próprio — causado (branco), crítico (dourado, maior,
  com "!" e uma estrela atrás; o texto "CRÍTICO!" separado saiu), recebido (vermelho com "−", sobe devagar e treme) e sangramento
  (laranja, menor). Nascem pequenos, passam do tamanho e assentam (0,2 s), em arco curto para lados alternados.
  - **Faixas:** textos que nascem quase no mesmo lugar sobem 0,34 tile acima um do outro; tipos de movimento diferentes (texto ×
    número, causado × recebido) pedem 0,9 tile, porque se cruzariam no caminho. "+11 moedas" não cai mais em cima do número.
  - **Avisos repetidos** viram um só com contador ("bloqueou ×3" quando três goblins batem no escudo ao mesmo tempo).
- **Nome do herói some na luta** (fica com 12% de opacidade enquanto há alvo ou golpe recebido nos últimos 3 s; volta suave), para a
  barra de vida do monstro e os números ficarem legíveis.
- **Chute de câmera** (`js/camera.js`): cada golpe dado empurra a câmera 3 px na direção do alvo (6 px no crítico e no esmagador);
  cada golpe levado, 2,5–5 px para longe do atacante. Volta em ~0,2 s, fica parado durante a pausa de impacto e segue a opção
  "tremor de tela".
- **Habilidades:** onda de choque no chão no Golpe giratório e no Golpe esmagador (anel duplo que abre e afina); quando a recarga
  acaba, o botão pisca dourado e toca um sininho curto (som `ready`), parado com "reduzir movimento".
- **Ambiente** (`js/ambient.js`, novo): sombras de nuvens (textura de ruído periódico 128 px ampliada 18×, andam com o mundo e derivam
  com o vento, só de dia e fora das masmorras); partículas de vento por região — pólen nos Campos e na vila, folhas girando no Bosque
  e na Mata, cinza nas Ruínas, faíscas de lumita no Planalto, poeira nas masmorras e vagalumes à noite (desenhados por cima da
  escuridão); vinheta suave nas bordas. Vetor fixo de 42 partículas, sem alocar por quadro (~0,04 ms de CPU por quadro).
- **Chão com profundidade** (`js/terrain.js`): a grama projeta uma sombra curta (luz do noroeste) sobre terra, pedra e areia; na beira
  da água, faixa escura e espuma clara em duas camadas contornam a margem; manchas largas de tom (mais quente/mais frio, ruído de 8
  tiles, contínuo entre blocos) quebram a grama uniforme. Tudo entra no cache dos blocos 16×16: custo só na primeira vez.
- **Lobby em telas grandes:** acima de 1500×860 o conteúdo cresce 20% (35% acima de 1900×1150); antes ocupava só a faixa de cima
  de um monitor 1080p.
- **Dica da segunda queda:** agora diz que o Defensivo dá +4 de defesa e apara golpes, "mas o Combate sobe na metade do ritmo"
  (1,3 contra 2,55 de XP de Combate por dano). Tamanho no registro: 3 linhas no computador (56 px, igual à frase antiga) e 4 linhas
  no celular de 375 px (55 px), dentro da caixa.
- **Cartão da missão no celular (375 px), medido de novo:** "Estrada do leste" com "(Combate 10+, um de cada vez)" fica com
  118 px de altura × 140 de largura (a rodada 65 media 131 px com o texto anterior).
- **Celular estreito (≤ 480 px):** o registro ficava por baixo da barra de habilidades (762–802 contra 744–798 px). Subiu para cima
  dela (672–738) e a dica do F subiu junto (632–662).
- Testes novos (116 → 122): estilos dos números, faixas e contador, nuvem sem costura, teto de partículas por região, tom do chão
  contínuo e chute de câmera.
- Novidades v0.66.

## Rodada 65 (v0.65)
- **Regras antigas com o robô realista** (come a 60%, recua com 2+ monstros, foge sem comida, segue a missão dos goblins; mundo
  fixo, 3 mundos × 8 sementes, trava contra rodadas simultâneas; pares = melhor/pior/igual contra o jogo atual):
  | Cenário | Mortes/30 min (erro padrão) | Sem morte | Pares |
  |---|---|---|---|
  | Jogo atual | 0,50 (0,12) | 13/24 | — |
  | Goblin com raio 3 (antes da rodada 60) | 0,46 (0,13) | 15/24 | 6/6/12 |
  | Lobos sem distância dos Campos (antes da 62) | 0,67 (0,19) | 13/24 | 5/5/14 |
  | Javalis sem distância do acampamento (antes da 63) | 0,50 (0,17) | 16/24 | 9/6/9 |
  Para quem joga bem, as três regras mudam pouco; nenhuma atrapalha. Como ajudam quem joga mal (rodadas 60–63), ficam.
- **Robô com poções e Defensivo** (mesmos mundos):
  | Robô | Mortes/30 min | Sem morte | Poções bebidas | Missão concluída | Abates |
  |---|---|---|---|---|---|
  | Realista | 0,50 | 13/24 | 0 | 21/24 | 194 |
  | + poção de vida abaixo de 30% sem comida | 0,42 (pares 2/0/22) | 14/24 | 32 | 20/24 | 197 |
  | + poção + estilo Defensivo | 0,13 (pares 9/1/14) | 21/24 | 9 | 1/24 | 219 |
  O Defensivo quase zera as mortes, mas o Combate sobe mais devagar (o estilo dá mais XP de Vitalidade) e o robô quase não chega
  ao nível de caçar goblins em 30 min. A dica da segunda queda (rodada 55) já sugere o Defensivo.
- **Texto da missão no jogo:** no computador, o painel e a janela do Ivo não transbordam (216 de 216 px e 355 de 355). No celular
  (375 px), a largura cabe (138 de 138), mas o cartão ficava com 131 px de altura na coluna de 140. O passo ficou mais curto:
  "(Combate 10+, um de cada vez)".
- Novidades v0.65.

## Rodada 64 (v0.64)
- **Goblins no Combate 8–10** (modo de teste com mundo fixo; robô que só caça goblins com a missão "Estrada do leste" e a aceita
  assim que é oferecida; trava contra rodadas simultâneas). Opções medidas:
  - **A:** a missão só é oferecida no Combate 10 (`minCombat`).
  - **B:** os goblins nascem espalhados num raio de ±7 tiles do acampamento (`home.r`; antes ±4).
  | Robô | Cenário | Mortes/30 min (erro padrão) | Pares melhor/pior/igual | Missão (8 goblins) em 30 min |
  |---|---|---|---|---|
  | Simples (come a 40%), 6 mundos × 8 | Como está | 3,92 (0,23) | — | 46/48 |
  | | A | 3,23 (0,25) | 22/13/13 | 23/48 |
  | | B | 3,73 (0,25) | 26/16/6 | 46/48 |
  | Realista (come a 60%, recua, foge sem comida), 3 mundos × 8 | Como está | 0,50 (0,12) | — | 21/24 |
  | | A | 0,29 (0,09) | 7/3/14 | 4/24 |
  | | B | 0,46 (0,12) | 5/5/14 | 19/24 |
  - B não muda as mortes de forma mensurável. A reduz, mas atrasa a missão e a recompensa (com o robô realista, quem completa em
    30 min cai de 21 para 4), e o ganho para quem joga bem é pequeno (−0,21 morte em 30 min).
  - **Decisão:** nenhuma das duas entrou. A missão agora diz "(Combate 10 recomendado; puxe um de cada vez)" no texto do passo,
    como o anúncio da invasão, sem bloquear nada. `minCombat` e `home.r` ficam no código, sem uso, para testes futuros.
- **Mata Sombria com robô realista** (Combate 14, Vitalidade 9, equipamento 2/2, tucunarés; 3 mundos × 8): 0,13 morte em 30 min,
  contra 4,13 do robô simples nos mesmos mundos (22 de 24 pares melhoraram), com os mesmos abates (252) e o mesmo Combate no fim
  (16,8). A região está boa para quem come cedo e recua; as mortes altas das rodadas 62–63 eram do jeito do robô.
- **Modo determinístico testado:** o gerador `mulberry32` passou para `ValdoraRules` (o `game.js` usa o mesmo). Teste novo em
  `tests.html`: a mesma semente repete os mesmos 50 números, outra semente muda a sequência, e todos ficam entre 0 e 1. No jogo,
  o mesmo mundo e a mesma semente repetiram o resultado exato.
- Novidades v0.64.

## Rodada 63 (v0.63)
- **Mundos fixos para medir:**
  - O aleatório do jogo passa por `RNG`, que `ValdoraGame.seed(n)` fixa só nas medições; `seed(null)` volta ao `Math.random`.
  - As regras de nascimento (`SPAWN_EDGE`, `SPAWN_AWAY`) agora sorteiam a nova posição com um gerador local, semeado pela posição
    recusada. Assim a regra não gasta o aleatório do jogo, e com e sem ela o mundo é o mesmo fora dos monstros movidos.
  - Para o jogo repetir igual, `start()` passou a zerar os relógios que vinham do jogo anterior (balões dos NPCs, dica do Ivo,
    avisos de região, salvamento automático). Os balões sorteavam números em momentos diferentes a cada partida.
  - Conferido: o mesmo mundo e a mesma semente deram 1 morte, 294 abates e Combate 10 três vezes seguidas. O laço do jogo fica
    pausado durante a medição.
- **Javalis longe do acampamento goblin** (mesmos 6 mundos × 8 sementes nos dois lados, robô de tempos de pessoa com tutorial, 30
  min, com a trava contra rodadas simultâneas):
  | Cenário | Mortes/rodada (erro padrão) | Mortes por goblin caçando javali | Mortes com goblin | Abates |
  |---|---|---|---|---|
  | Sem a regra (0 a 4 javalis a menos de 8 tiles do acampamento por mundo) | 3,48 (0,35) | 13 | 121 | 218 |
  | Javalis a 8+ tiles | 2,77 (0,31) | 2 | 108 | 219 |
  - Comparando as mesmas 48 rodadas uma a uma: 24 melhoraram, 12 pioraram e 12 ficaram iguais. A regra entrou com 8 tiles.
  - Conferido no jogo: os 8 javalis nascem e renascem a 10 tiles ou mais do acampamento.
  - **O que ainda mata:** 95 das 121 mortes com goblin aconteceram com o robô caçando os próprios goblins (nível 9) no Combate
    8–10, com 2 a 5 perseguindo. É o que um jogador faz na missão "Estrada do leste".
- **Mata Sombria para quem tem o nível** (robô começando no Combate 14, Vitalidade 9, equipamento 2/2, 6 tucunarés; mesmos 3
  mundos × 8 sementes; javalis a 8 tiles):
  | Lobos | Mortes/rodada (erro padrão) | Mortes com lobo | Abates | Combate no fim |
  |---|---|---|---|---|
  | Sem a regra | 5,25 (0,65) | 112 | 209 | 17,0 |
  | A 6+ tiles dos Campos (como está) | 4,58 (0,73) | 90 | 250 | 16,9 |
  A concentração dos lobos mais para dentro não deixou a Mata mais difícil para quem é do nível dela; ficou um pouco mais fácil e
  rendeu mais abates. Uma a uma: 11 melhoraram, 7 pioraram, 6 iguais.
- **Textos de erro e de bloqueio:**
  - Baú vazio da Toca dos Lobos dizia "A cripta se reorganiza"; agora diz "A toca se reorganiza".
  - Toca trancada: o nome da missão ficou entre aspas, (missão "A balada da lua cheia").
  - Conferidos e mantidos: "Não dá para chegar lá", "Não dá para chegar até ele daqui. Dê a volta.", baú selado ("Ainda há 3
    lobos de pé") e faltas de material.
- Novidades v0.63 e teste novo da rodada 63.

## Rodada 62 (v0.62)
- **Lobos longe dos Campos:**
  - Em 5 mundos novos, de 0 a 7 dos 14 lobos e alfas nasciam a até 5 tiles dos Campos ou da vila. Os lobos não têm ponto fixo;
    nascem e renascem soltos pela Mata Sombria.
  - Agora `ValdoraWorld.SPAWN_EDGE` exige 6 tiles para lobos e alfas, na criação do mundo e no renascimento. Depois de 300
    tentativas a regra é largada, para nunca travar a criação do mundo. Conferido: menor distância de 7 tiles, também depois de
    matar e renascer os 12 lobos.
  - **Medição** (robô de tempos de pessoa com tutorial, 30 min, 6 mundos × 8 sementes por cenário, com a trava contra rodadas
    simultâneas):
    | Cenário | Mortes/rodada | Mortes com lobo/rodada | Mortes com lobo dentro dos Campos | Mortes com goblin |
    |---|---|---|---|---|
    | Sem a regra | 0,77 | 0,29 | 7 | 23 |
    | Com a regra (6 tiles) | 1,73 | 0,25 | 0 | 69 |
  - A regra fez o que devia: nenhuma morte por lobo dentro dos Campos (antes 7, todas no mundo com 5 lobos colados na divisa).
  - O total de mortes não acompanha a regra: ele é dominado pelos goblins do Bosque e varia muito de mundo para mundo (de 0 a 32
    mortes por mundo nas 8 rodadas). Fica para a próxima rodada.
- **Saves antigos:** o save não guarda monstros, só o jogador. Um save feito antes da mudança (Combate 9, 321 moedas, tarefa 5,
  dentro da Mata Sombria) abriu sem erro, com posição, moedas, tarefa e itens intactos.
- **Textos do mapa:**
  - As placas agora dizem o Combate recomendado: "Oeste: Planalto de Lumita (Combate 18+)", "Leste: Bosque dos Carvalhos e
    acampamento goblin (Combate 6+)", "Sul: Mata Sombria, lobos (Combate 12+)" e "Ruínas Esquecidas, perigo! (Combate 15+)".
  - Etiquetas ao passar o mouse: masmorras com "Combate 18+" e "Combate 14+" (antes "nível"); a fogueira diz "Assar peixe e
    carne" (antes só peixe).
- Novidades v0.62 e teste novo da rodada 62.

## Rodada 61 (v0.61)
- **Comida na hora de lutar** (robô de tempos de pessoa com tutorial, 30 min, com trava contra rodadas simultâneas; "foge" = quando
  a comida acaba no meio da caçada, larga a luta, volta para a vila e vai pescar):
  | Mundo | Sem a regra: mortes/30 min (erro padrão) | Com a regra | Rodadas |
  |---|---|---|---|
  | 1 | 1,75 (0,33) | 0,25 (0,11) | 24 + 24 |
  | 2 | 0,08 (0,08) | 0,25 (0,18) | 12 + 12 |
  | 3 | 3,92 (0,51) | 0,33 (0,19) | 12 + 12 |
  - Fugir quando a comida acaba corta as mortes em 86% e 92% nos mundos perigosos, sem perder abates (283 → 289 e 235 → 240 em
    média). No mundo 2 a regra quase não roda, porque a comida não chega a acabar no meio da caçada.
  - **Achado novo:** os pontos de nascimento dos monstros mudam a cada mundo, e isso pesa mais que tudo. Sem a regra, o mesmo robô
    teve 0,08, 1,75 e 3,92 mortes nos três mundos. Nos dois perigosos, as mortes foram quase todas com lobos e alfas na perseguição,
    muitas dentro dos Campos (23 de 42 no mundo 1, 36 de 47 no mundo 3), e sem comida (42/42 e 45/47).
  - **No jogo:** atacar sem comida (fora da vila, depois da primeira refeição) faz o cesto do painel pulsar por 4 s, renovando a
    cada golpe, e o registro avisa "Sem comida na mochila! Termine esta luta e volte para pescar antes de puxar outro monstro."
    (no máximo 1 vez por minuto). Conferido: pulsa, avisa uma vez, não repete, para quando a luta acaba e não aparece com comida.
- **Invasão goblin com o raio novo** (5 goblins, robô com 6 lambaris lutando de frente, 10 invasões por nível):
  - Combate 6: 0 de 10 vencidas. Combate 8: 3/10. Combate 10: 5/10. Combate 12: 10/10.
  - Com o raio antigo (3), Combate 10 deu as mesmas 5/10: o raio não mexe na invasão.
  - O anúncio agora diz "(Combate 10 ou mais recomendado)".
  - Na primeira tentativa, parte das invasões teve 10 goblins: a limpeza entre tentativas soltava o evento natural do jogo.
    Corrigi a montagem e refiz tudo; as 40 dos Combates 6–12 tiveram 5 goblins.
- **Revisão das falas restantes:**
  - Conquista "Lenda de Lumeira" (os dois chefes) virou "Lenda de Valdora", porque tinha o mesmo nome do título máximo do santuário.
  - "Ouvido no passado" virou "Caçador de ecos".
  - "Consiga um drop raro" virou "Encontre um espólio raro".
  - Golpe esmagador: a descrição agora diz que atordoa.
  - Os nomes dos itens e as outras conquistas foram conferidos e ficaram como estavam.
- Novidades v0.61 e teste novo da rodada 61 (nenhuma conquista com nome de título do santuário).

## Rodada 60 (v0.60)
- **Bosque dos Carvalhos no nível mínimo** (robô de tempos de pessoa com tutorial, 30 min, as mesmas 24 sementes em cada cenário;
  em toda morte registrei Combate, Vitalidade, quantos monstros perseguiam e de que tipo, e comida e poções restantes):
  | Cenário | Mortes por 30 min (erro padrão) | Rodadas sem morte | Mortes com goblin | Sem comida | 2+ perseguindo |
  |---|---|---|---|---|---|
  | Como estava (mínimo 6, goblin a 3 tiles) | 0,96 (0,22) | 11/24 | 22/23 | 23/23 | 20/23 |
  | Mínimo do Bosque 8 | 0,46 (0,16) | 17/24 | 11/11 | 11/11 | 11/11 |
  | Goblin a 2 tiles | 0,46 (0,16) | 16/24 | 8/11 | 10/11 | 8/11 |
  | Os dois juntos | 0,54 (0,18) | 16/24 | 13/13 | 12/13 | 12/13 |
  - Quem mata é o bando de goblins, e só quando a comida já acabou: 23 das 23 mortes da base sem comida, 22 com goblins, 20
    com dois ou mais perseguindo. Combate 3–10 e Vitalidade 2–7 nas mortes da base.
  - Os dois ajustes cortam as mortes pela metade, e juntos não somam. Nenhum muda o ritmo: Combate 10 aos 30 min nos quatro.
  - Entrou o goblin a 2 tiles (`aggro` 3 → 2): mexe só nos goblins e mantém o Bosque liberado no Combate 6 para os javalis.
  - Um robô que bebe a poção de vida sem comida (com goblin a 2 tiles) morreu 10 vezes em 8 rodadas: a poção só alonga uma luta
    já perdida.
  - Uma primeira tentativa desta medição se misturou com uma rodada que continuou rodando em segundo plano depois de estourar o
    tempo de execução. Descartei e refiz tudo do zero.
- **Dica dos bandos** (uma vez por save, "Dica do Ivo"): ao entrar no Bosque com Combate 6 a 8, "os goblins andam em bando. Puxe um
  de cada vez pela beirada do acampamento e só vá com comida na mochila." Abaixo do 6, o aviso de região já fala dos bandos.
- **Vida baixa** agora lembra da poção: "Coma (1), beba uma poção de vida (2) ou recue".
- **Falas dos eventos:** "estrada leste" virou "estrada do leste". O registro da invasão e da Lua cheia agora lista a recompensa
  inteira, como o aviso na tela (poção de força; 400 xp de Combate e Presa lunar). Os outros textos dos eventos foram conferidos
  e conferem com o jogo (6 peixes dourados de 60 moedas, 90 s, 5 goblins).
- Novidades v0.60 e teste novo da rodada 60.

## Rodada 59 (v0.59)
- **Seta de volta no minimapa:** `icon_minimap_back` (16 px, desenhada à mão, aponta para a direita) é girada com
  `atan2(dy, dx)` do herói para o ponto seguro, sem suavização, e fica a 8 px do herói. Na divisa, onde o ponto está a 1 tile,
  ela não some embaixo do herói. Longe (mais de 14 px), a linha tracejada e o ponto verde continuam até o destino. Conferido:
  na divisa do Bosque a seta aponta para os Campos (à esquerda); dentro da Mata Sombria aponta para o ponto junto ao lago,
  16 tiles acima.
- **Medição com o tutorial** (robô de tempos de pessoa, 30 min, sementes 12345 e 777):
  | Semente | Ignora o primeiro aviso | Obedece |
  |---|---|---|
  | 12345 | 3 mortes (Bosque) | 5 mortes (Bosque) |
  | 777 | 3 mortes (Bosque ×2, Ruínas) | 1 morte (Campos) |
  Obedecer o primeiro aviso não muda a média (3 contra 3). 10 das 12 mortes foram no Bosque dos Carvalhos; nas duas em que
  registrei o Combate, ele era 8 e 9, acima do mínimo da região (6). O robô só escolhe alvos no Bosque a partir do Combate 6, então
  essas mortes provavelmente não vêm de entrar abaixo do nível: o perigo parece ser os bandos de goblins logo depois do mínimo.
  Nas outras 8 mortes não registrei o Combate.
- **"Como jogar" revisado:** "Lutar" dizia que críticos atordoam; quem atordoa são a Investida (E) e o Golpe esmagador (R). O
  texto agora cita as teclas, a passiva de cada estilo e troca "ticks" por "turnos rápidos". "Recompensas" troca "drops" por
  "espólios", como no resto do jogo. As dicas do painel e as Novidades antigas foram conferidas e ficaram como estavam.
- Novidades v0.59 e teste novo da rodada 59.

## Rodada 58 (v0.58)
- **Primeira entrada em região perigosa** (uma vez por região, por save):
  - O banner fica 7 s na tela, em vez de 3,2 s, e a linha de perigo pulsa (parada e vermelha com "reduzir movimento").
  - O minimapa mostra por 12 s uma linha tracejada verde até o tile andável mais perto numa região do seu nível (`safeSpot()`).
  - O aviso do registro sai mesmo que outra região tenha avisado há pouco.
  - Conferido: entrando no Bosque pela divisa, o alvo fica 1 tile atrás, nos Campos; teleportado para dentro da Mata Sombria, 3
    tiles até os Campos.
  - Medição inconclusiva: sem o tutorial, o robô de tempos de pessoa morreu 0–1 vez em 4 rodadas de 30 min, obedecendo ou não ao
    primeiro aviso. As 7 mortes da rodada 57 não se repetiram, então não dá para atribuir queda ao aviso. Ele fica como melhoria
    de leitura.
- **Santuário com jogador de mentira:** dois testes novos em `tests.html` com `ValdoraShrine.create`:
  - ofertar tira moedas, soma no total, dá o título ao cruzar 1.000 (um aviso só) e recusa sem moedas;
  - a chama votiva é recusada antes da Lenda e para em 12 chamas (2 h); ao apagar, avisa uma vez.
- **Textos fora do registro** (tutorial, janelas, missões, canções, falas):
  - Bento: "Encomendas novas no quadro do balcão." virou "Encomendas novas no balcão. Dê uma olhada!" (as encomendas ficam
    numa aba da banca, e "quadro" confundia com o Quadro de caçadas).
  - Ivo: "estrada leste" virou "estrada do leste", como na missão. "O quadro anda tremendo à noite" virou "O quadro de caçadas às
    vezes estremece", porque os ecos não dependem da noite.
  - Tomé: "Uma moeda por uma canção?" virou "Dez moedas por uma canção?", o preço do presente.
  - Tutorial: "Siga as tarefas no canto da tela" virou "no painel, à direita".
  - O resto (janelas, missões, canções e as outras falas) foi conferido e ficou como estava.
- Novidades v0.58 e testes novos da rodada 58.

## Rodada 57 (v0.57)
- **Testes das janelas:** o que cada botão faz saiu do `game.js` para `js/dlgactions.js` (`ValdoraDlgActions.create(api)`), para poder
  ser testado com um jogador de mentira. O script conferiu as trocas uma a uma (`hudDirty`, santuário, NPCs), e o `game.js` caiu para
  1.832 linhas. Cinco testes novos em `tests.html`:
  - guardar tudo deixa comida e poção;
  - organizar põe comida > materiais > barras;
  - retirar comida tira primeiro o tucunaré e deixa a poção;
  - vender tudo pula comida e barras;
  - o presente ao Tomé cobra 10 moedas, e não faz nada com 5;
  - fundir cria o trabalho;
  - trocar caçada e encomenda sorteiam outra;
  - o eco devolve "stop".
  No jogo, vender, guardar tudo, presente e oferta continuam iguais.
- **Primeira hora com tempos de pessoa** (robô que leva 1,5–4 s para decidir cada ação e 6–12 s lendo cada janela; 30 min):
  - O tutorial acabou aos 3,5 min.
  - Das 9 dicas, 3 caíram no meio de uma luta. Agora a dica espera 15 s enquanto houver monstro em perseguição. Conferido: 5 min
    de luta real sem dica, e a próxima veio 24 s depois de chegar à vila.
  - O robô morreu 7 vezes. Ele caça o monstro mais perto e entrou nas Ruínas e na Mata Sombria abaixo do nível; no mesmo período
    saíram 7 avisos de região, que o robô ignora e uma pessoa veria.
- **Revisão de textos** (86 mensagens do registro, português do Brasil, mesma voz):
  - "Sua mochila está cheia" tinha três versões; agora é sempre "Guarde itens no cofre ou venda ao Bento.".
  - "Você consumiu…" virou "Você comeu…" ou "Você bebeu…", com "+12 de vida".
  - Habilidade bloqueada: "Golpe giratório: libera no Combate 5." (antes "é liberado no Combate nível 5", que errava o gênero
    em "Investida").
  - Recurso acima do nível: "Veio de ferro pede Mineração 8.".
  - F sem nada por perto: "Nada para usar aqui. Chegue ao lado de alguém ou de algo útil e aperte F." (antes repetia "perto").
- Novidades v0.57.

## Rodada 56 (v0.56)
- **Masmorras no painel:** dentro da cripta e da toca, o painel mostra `icon_region_crypt`/`icon_region_den` e o nome. Ao sair, volta
  para Ruínas/Mata Sombria com o ícone certo e a mensagem de saída ("Você volta à luz das ruínas", "Você sai da toca para a Mata
  Sombria"). Nada mudou no código: o campo `icon` da rodada 55 já cobria as duas.
- **Dicas por situação** (uma vez por save, "Dica do Ivo"): na primeira carne de javali na mochila, o espetinho (Culinária 2, com
  uma madeira vira espetinho de cura 12), com `item_meat_skewer`. A dica sai ao pegar a carne, não ao juntar carne e madeira como
  estava no plano: com as duas na mochila o espetinho já sai sozinho e a mensagem do assar (rodada 30) explica; a dica serve para
  lembrar de levar a madeira. Ao chegar à Pesca 10, os cardumes fundos, com `icon_fish_spot`. As duas aparecem uma vez só.
- **Clique das janelas por tipo:** os 24 comandos do clique viraram 7 funções pequenas (`dlgShop`, `dlgBank`, `dlgWork`, `dlgQuest`,
  `dlgBard`, `dlgBoard`, `dlgShrine`), percorridas por `DLG_ACTIONS`. O eco ("despertar") devolve "stop" e mantém o retorno sem
  redesenhar. O script de edição separou os blocos sem reescrever nenhum e conferiu que os 24 foram classificados. Testado com
  cliques reais: vender, comprar, aceitar missão, guardar, retirar, guardar tudo, organizar, retirar comida, pedir canção, dar
  10 moedas ao Tomé, fundir, trocar caçada, ofertar 100 e fechar.
- Novidades v0.56 e teste novo da rodada 56.

## Rodada 55 (v0.55)
- **Ícones de região** (`icon_region_*`, 16 px; o de 32 é mostrado em 16, nítido em telas densas): campo `icon` em cada região de
  `VD.REGIONS`. Mapeamento: town → village, fields → fields, east → grove, south → darkwood, west → plateau, ruins → ruins,
  crypt → crypt, den → den (todos bateram pelo significado). No computador o ícone vem antes do nome; abaixo de 700 px só o
  ícone aparece, então a região voltou ao painel do celular sem transbordar (as três linhas em 122 px).
- **Dicas por situação** (uma vez por save, no registro, como "Dica do Ivo"): mochila cheia pela primeira vez (cofre de 48
  espaços, "Guardar materiais", Bento), com `icon_bank_move`; e a segunda queda, se o estilo não for o Defensivo (+4 de defesa e
  aparar golpes), com o ícone da passiva. `player.stats.deaths` passa a contar as quedas e vai no save.
- **Cliques das janelas:** o que é só de interface (fechar, trocar de aba e o filtro do cofre com o campo de texto) foi para
  `ValdoraDialogs.create()` (`uiClick`, `applyBankFilter`). O clique no `game.js` chama `DLG_VIEW.uiClick` primeiro; daí para baixo
  ficou só o que mexe no jogo. Conferido: filtro digitado ("tucunare" deixa só o Tucunaré assado), fechar e abas.
- Novidades v0.55 e teste novo da rodada 55.

## Rodada 54 (v0.54)
- **Primeira hora com o tutorial** (robô novato que segue as 9 tarefas e depois caça até o Combate 8; 15 min, 0 mortes, tutorial
  em 2,5–3 min):
  - As dicas do Ivo (a cada 4 min) eram sorteadas entre todas, e o novato ouvia sobre chefes em fúria e ecos semanais no Combate
    5–8. Agora `VD.TIP_MIN` dá o Combate mínimo de cada dica, a ordem pula as que ainda não servem, e a janela do Ivo só sorteia
    entre as do nível. No teste, as dicas viraram tecla F, estilos e boneco de treino.
  - Dois avisos de região chegavam juntos ao andar na divisa (lobos e golems em 2 s). Agora há também um intervalo de 15 s entre
    avisos de regiões diferentes (`warnT._any`), além de 1 por minuto por região.
  - Uma dica do Ivo colou num aviso de região (4,00 e 4,02 min). A dica agora espera 15 s quando há aviso nos últimos 10 s.
  - "Vida baixa" e "Comida acabando" não apareceram nos 15 min: com as poções do tutorial o robô não passou de 30% nem precisou
    comer. É o esperado: as dicas só aparecem quando servem.
- **Painel no celular** (iframe de 375 × 812; coluna de 140 px): com nome de 14 letras, medalha, chama e cesto, o nome era cortado
  ("Bartol…"), os minutos da chama cobriam a vida e a linha das moedas transbordava (130 px em 122). Abaixo de 700 px, o nível sai
  da linha do nome (está na aba Níveis), a chama mostra só o ícone (os minutos ficam no title) e a linha das moedas esconde hora e
  região. As três linhas agora cabem em 122 px.
- **Limpeza:** o desenho da janela (`renderDlg`, 70 linhas: título, abas, fala e corpo de todas as janelas) foi para
  `ValdoraDialogs.create(api).render(dlg)` em `js/dialogs.js`; o `game.js` caiu de 1.927 para ~1.865 linhas. Os cliques ficaram
  no `game.js`: cada um mexe em funções de estado (vender, comprar, cofre, fundir, forjar, missões), e movê-los exigiria passar
  ~25 funções. Conferido: as 10 janelas abrem sem erro e as abas da banca trocam.
- Novidades v0.54 e teste novo da rodada 54.

## Rodada 53 (v0.53)
- **Chama votiva no painel:** `icon_votive_hud` (desenhado à mão; o arquivo de 32 px é mostrado em 16 px, nítido em telas de alta densidade) com "N min" na ponta direita da
  barra de vida. A primeira tentativa, ao lado do nome, não cabia com nome de 14 letras (237 px de conteúdo em 200). A linha do
  nome já transbordava antes desta rodada, com a medalha e "Nível total", em nomes longos. Agora o nome usa 12 px e o rótulo vira
  "Nv. N" quando nome + medalha passam de 13 caracteres. Conferido com "Bartolomeuzito", medalha dourada, nível 62 e 99.999
  moedas: as três linhas do painel cabem em 200 px. A medalha não brilha mais com a chama, porque o ícone a substitui.
- **Primeira hora revisada** (robô novato do Combate 1 ao 8, come a 40%, 12 min, 116 abates, 1 morte): "Comida acabando" aparece
  uma vez, aos 1,2 min (Combate 2, 1 comida, Campos), logo depois da primeira refeição. "Vida baixa" aparece uma vez, aos 1,3 min
  (Combate 3, 18% de vida, sem comida). O cesto do painel acende e apaga 4 vezes em 12 min, sem piscar.
- **Limpeza:** oferta, chama votiva, moedas na tigela, faíscas da Lenda, chama ao lado do herói e etiqueta do título saíram do
  `game.js` para `ValdoraShrine.create()` em `js/shrine.js`. O `game.js` só chama `offer`, `votive`, `update`, `drawVotive` e
  `titleTags`. Comportamento conferido igual: oferta, moedas, recusa da chama antes da Lenda, chama e aviso de apagar.
- Novidades v0.53 e teste novo da rodada 53.

## Rodada 52 (v0.52)
- **Chama votiva visível:** `fx_votive_flame` (Blender, 1 tile, 6 quadros a 10 fps) é desenhado logo depois do herói, ~0,55 tile
  ao lado da cabeça e do ombro, do lado oposto ao olhar (olhando para a direita, fica à esquerda; nas outras direções, à direita).
  Flutua de leve. De costas também fica ao lado, porque acima da cabeça cairia sob o nome e o título. Não aparece na masmorra nem
  com o herói caído.
- **Velas votivas:** `fx_votive_candles` entra no `OVERLAY_HOST` e é desenhado por cima das chamas do santuário só com a chama
  acesa, com luz própria nos pavios (47,108), (63,113) e (93,110), que pulsa junto com as outras velas.
- **Aviso:** o título da medalha no painel atualiza a cada minuto ("Chama votiva: N min"). Conferido acelerado: 3 → 1 min, depois
  apaga, a medalha perde o brilho e o registro avisa uma vez.
- **Desempenho** (desenho do quadro, média de 300): vila de dia 0,29 ms sem efeitos e 0,31 ms com Lenda e chama; de noite 0,43 →
  0,44 ms com chama e moedas caindo; Mata Sombria à noite 0,45 ms. Sessão de 30 min lutando (255 abates): heap 80 → 85 MB, 12 itens
  no chão (somem sozinhos), listas de monstros e objetos estáveis, desenho de 1,01 ms no começo para 0,75 ms no fim.
- Novidades v0.52 e teste novo da rodada 52.

## Rodada 51 (v0.51)
- **Moedas na tigela:** `fx_offering_coins` (Blender, 8 quadros a 12 fps, sem loop) entra no `OVERLAY_HOST` e é desenhado no
  mesmo retângulo da arte do santuário a cada oferenda, no lugar das faíscas genéricas. Quando as moedas chegam (~0,4 s), a tigela
  (59,77 na arte) solta um brilho dourado que some em 0,8 s. Na primeira versão o brilho e o avivar das velas lavavam o santuário
  inteiro; ficaram menores (raio 0,5–0,85 tile, alfa 0,3; velas +30% em vez de +60%).
- **Medalha dourada:** `icon_title_badge_gold` para a Lenda; os outros títulos usam a medalha roxa (`ValdoraShrine.badge`). A
  medalha aparece no painel ao lado do nome, na ficha e no cartão do save.
- **Patrono da vila:** nome lilás (#e0a8ff), da fita da medalha, no lugar do dourado que se confundia com o nome comum.
- **Chama votiva** (só depois da Lenda; cosmética): 1.000 moedas = 10 min, até 2 h guardadas. Uma chama quente acompanha o herói
  de dia e de noite, as velas do santuário brilham 30% mais e a medalha do painel ganha brilho. Contador de chamas acesas na
  janela; `votiveT` e `votives` entram no save. Avisa no registro quando apaga.
- **Robô da quinta hora** (estados finais dos robôs da quarta hora, 60 min): sem a chama, sobram 16,5–18,7 mil moedas; mantendo
  a chama acesa (6–7 chamas, 83–100% do tempo), sobram 5,6–10,5 mil. A chama absorve 35–60% da renda. Nenhuma morte.
- Novidades v0.51 e teste novo da rodada 51.

## Rodada 50 (v0.50)
- **Velas vivas:** `fx_candle_flames` (Blender, 6 quadros a 10 fps, quadro de 128 px do tamanho da arte) é desenhado por cima de
  `deco_shrine_offering`, no mesmo retângulo. O carregador ganhou `OVERLAY_HOST`: folhas com `tiles: 0` que cobrem a arte de outra
  peça são carregadas no tamanho dela (as demais folhas com `tiles: 0`, como a faixa do lobby, seguem de fora). A luz das velas
  usa os pavios medidos, (34,91), (72,101) e (80,100), e pulsa conforme a altura da chama em cada quadro (20, 19, 23, 18, 20 e
  21 px), de dia e de noite.
- **Medalha do título:** `icon_title_badge` com o título na ficha do personagem (nome na cor do título) e no cartão do save do
  lobby. No pergaminho o título fica em roxo escuro, porque o dourado não se lia.
- **Títulos mais espaçados:** o robô da quarta hora (estado final dos robôs da terceira hora; oferta de 1.000 em 1.000 o que
  sobra acima do preço das próximas peças) chegava à Lenda (12.000) em 16–38 min. Ficaram 1.000 / **4.000 / 10.000 / 25.000**.
  Agora o Guardião chega em 10–32 min da quarta hora e a Lenda por volta da quinta: 74 min no Agressivo; Preciso e Defensivo
  estavam com 24.000 aos 90 min. Ofertar não atrasou a Espada de lumita (16 e 46 min, igual sem oferta).
- Novidades v0.50 e teste novo da rodada 50.

## Rodada 49 (v0.49)
- **Santuário de Lumeira** (`js/shrine.js`, novo): `deco_shrine_offering` (2x1, arte 2x2) na praça, à esquerda do poço (42,35).
  A posição é procurada numa lista: a base e a linha de cima livres, a frente andável. Clique abre "Santuário de Lumeira":
  total oferecido, título atual, barra até o próximo, botões "Ofertar 100", "Ofertar 1.000" e "Até o próximo título", e a lista
  dos títulos (`icon_gold_sink`; os que faltam ficam em cinza).
- **Clique em arte alta:** clicar na metade de cima de uma estação cuja arte é mais alta que a base (o santuário) também a aciona;
  antes, só a base contava.
- **Títulos (só prestígio, sem bônus de combate):** Devoto de Lumeira (1.000), Patrono da vila (3.000), Guardião da chama (6.000,
  halo quente à noite) e Lenda de Lumeira (12.000, halo ciano e faíscas de lumita). O título aparece sobre o nome, a cor do nome
  muda no mapa e no painel, e a ficha do personagem mostra o título. O total (`offered`) entra no save.
- **Luzes do santuário** (`js/lighting.js`, `js/overlay.js`): três velas quentes pulsando e o cristal ciano fraco. À noite pelo
  sistema de luzes normal; de dia por `glow()`, um brilho somado bem leve, para o santuário não ficar parado ao sol.
  Ofertar aviva as velas por 1,4 s e solta faíscas douradas.
- **Painel:** moedas, hora e cesto não quebram mais de linha. A região encolhe com reticências e mostra o nome inteiro ao passar o
  mouse.
- **Diagonal nos chefes:** 10 aproximações (5 por chefe) sem "dança"; o maior trecho na diagonal foi de 1 passo. Os chefes
  seguem fora da espera.
- **Ouro do fim de jogo** (números do robô da terceira hora da rodada 48): sobram 6,4 mil (Preciso), 7,2 mil (Agressivo) e 11,5
  mil (Defensivo) depois das compras. Dá para chegar a Guardião da chama na terceira hora e a Lenda na quarta.
- Novidades v0.49 e teste novo da rodada 49 (arte, títulos em ordem e nenhum campo de combate nos títulos).

## Rodada 48 (v0.48)
- **Comida acabando:** fora da vila, com 1 comida pronta ou menos (poções não contam), `icon_food_low` aparece ao lado das moedas
  com o número que sobra. Só depois da primeira refeição do save, para não aparecer no começo do jogo. Na primeira vez, o registro
  mostra "Comida acabando! Pesque ou cace e asse na fogueira antes de lutar mais".
- **Animação de comer:** as linhas `eat_*` (rodada 7) tocavam ao comer parado, mas no meio de um golpe a espada cobria os 0,5 s.
  As três formas de comer (tecla 1, botão ✚ e clique na mochila) passam por `eat()`. Agora comer interrompe o golpe, como andar.
  A pesca não é interrompida.
- **"Dança" na diagonal:** o herói e um lobo em perseguição andavam juntos para encostar, trocavam de lado e caíam de novo na
  diagonal, às vezes por 5 min sem ninguém atacar. Agora, com o monstro em perseguição na diagonal, o herói espera até 1,5 s por
  posição ele encostar. Os chefes ficam de fora. No robô da segunda hora, o maior trecho sem abate caiu de 5–6 min para 1–2 min.
- **Robô da segunda hora** (Preciso, come a 60%, recua com 2+ monstros, 30 min): abates de 57–80 → 69–107 e mortes de 0–1 → 0–2
  (média 0,3).
- **Robô da terceira hora** (Combate 16, equipamento 3/3, 300 moedas, 60 min): as 3.600 moedas da Couraça chegam aos 12–21 min.
  No Preciso e no Agressivo o que segura é a Vitalidade 15 (44–50 min, já com 5,7–6,7 mil moedas). No Defensivo, a compra sai aos
  12 min. O preço ficou como está.
- Novidades v0.48 e teste novo da rodada 48.

## Rodada 47 (v0.47)
- **Vida baixa:** abaixo de 30% da vida, `fx_low_hp_vignette` cobre a tela (`#lowhp`, `object-fit: fill`, sem receber cliques),
  abaixo da interface e acima do mapa. Pulsa entre 0,45 e 0,8; com "reduzir movimento" fica parada em 0,6. Os 0,35–0,7 pedidos
  quase sumiam sobre a grama, porque a arte já é suave (alfa ≈ 0,8 nos cantos). Some ao morrer e ao curar.
- **Dica de recuar:** na primeira vez em cada save, o registro mostra `icon_retreat` com "Vida baixa! Coma (1) ou recue…".
- **Robô da segunda hora com regras melhores** (Combate 12, equipamento 2/2, 300 moedas, 30 min, estilo Preciso):
  | Regras | Mortes em 30 min | Abates |
  |---|---|---|
  | come a 40% (rodada 46) | 2–9 (média ≈ 5) | 24–90 |
  | come a 60% | 3–4 | 88–100 |
  | come a 60%, recua com 2+ monstros e não sai para pescar em combate | 0–2 (média 1,4) | 22–74 |
  Todas as mortes que sobravam aconteciam no caminho para pescar: o robô largava a luta com lobos atrás. As mortes eram do robô,
  não do jogo.
- **Estilo Defensivo** (Vitalidade 13 no Combate 12, 60 min): Placas de aço aos 8 min, Espada de aço no Combate 16 (≈ 57 min) e
  nenhuma morte. A Couraça libera pelo nível (Vitalidade 15 por volta dos 40 min), mas o preço de 3.600 moedas a segura.
- Novidades v0.47 e teste novo da rodada 47.

## Rodada 46 (v0.46)
- **Cadeado:** na banca e na bigorna, a próxima peça bloqueada por nível troca o ícone por `icon_gear_locked` e mostra o que falta em
  laranja ("requer Combate 16 (você tem 12)", "Ferraria 17", "Vitalidade 10 para usar").
- **"???" do monstro que desiste:** `fx_mob_give_up` com a base no topo do sprite (altura do sprite nos grandes, como o golem),
  quando o monstro preso desiste (rodada 45) e quando ele larga a perseguição por distância (só os do mapa, não os de evento).
- **Armadura acompanha a Vitalidade:** nos estilos Agressivo e Preciso a Vitalidade sobe a 1/3 do Combate; calculado com a curva de
  XP, quando o Combate chega a 8/16/24 (espadas de ferro, aço e lumita) a Vitalidade está em 5/10/15. As Placas de aço pediam 16
  (≈ Combate 24) e a Couraça 24 (≈ Combate 36+). Agora Placas pedem **10** e a Couraça **15**; a Cota já pedia 6 (rodada 24).
  Teste novo confere essa regra.
- **Robô da segunda hora vendendo no Bento** (Combate 12, Vitalidade 9, equipamento 2/2, 300 moedas, vende a cada 2 min; 30 min):
  | Exigências (armadura 3 / espada 3) | Combate no fim | Vitalidade | Ouro no fim | Compras | Mortes |
  |---|---|---|---|---|---|
  | 16 / 16 (antes) | 14 | 10 | 1.337 | nenhuma | 9 |
  | 10 / 16 (agora) | 15 | 11 | 1.191–1.313 | Placas aos 13–16 min | 10 |
  | 13 / 14 (teste) | 16 | 11 | 1.995 | Espada de aço aos 13 min | 11 |
  O ouro sobra para os tier 3 (900 e 1.100) por volta dos 15 min; o que segurava era o nível. As mortes não mudaram com a armadura
  (o robô come só abaixo de 40% e luta com matilhas de lobos); a mudança é pela coerência da progressão.

## Rodada 45 (v0.45)
- **Assar tudo:** a fogueira já assava em fila (o alvo continua na fogueira até acabar o cru); agora o rodapé do F mostra
  `icon_cook_all` e "assar tudo (N)" (ou "assar na fogueira" com 1, "nada cru na mochila" com 0). No fim da fila, um resumo no
  registro com o ícone ("Assou 8: lambari assado ×5, carne assada ×2, queimado ×1") e, com 2 ou mais, `fx_cook_batch` na grelha.
  O chiado continua item a item. Se o jogador sair no meio, a contagem recomeça (fila parada há mais de 6 s).
- **Correção — impasse na diagonal:** o robô da segunda hora travou 20 min com um lobo na diagonal e os dois tiles do meio
  bloqueados pelo terreno: o herói não achava caminho e o lobo, em fúria, não conseguia dar o passo. Agora o monstro tenta um passo
  de lado depois de 1,5 s e desiste da perseguição depois de ~5 s; o herói solta o alvo depois de 2 s sem caminho ("Não dá para
  chegar até ele daqui. Dê a volta.").
- **Robô da segunda hora com o cofre** (Combate 12, Vitalidade 9, Pesca/Culinária 10, equipamento 2/2, 30 min, guarda quando passa
  de 14 espaços): 88 abates, Combate 15, **nenhuma viagem ao cofre** (no máximo 8 espaços: lumita, 56 peles de lobo, lambari,
  15 peixes queimados, presa lunar, tucunaré). 6 mortes na Mata Sombria — o robô fica em espada e armadura tier 2 (os tier 3 pedem
  Combate/Vitalidade 16) e come lambari. Couro (9) e pele de lobo (18) se vendem no Bento e têm destino em encomendas, na Bolsa e
  na Mochila de pele: o acúmulo é do robô, que não vende.

## Rodada 44 (v0.44)
- **Organizar o cofre:** botão com `icon_bank_sort` que junta o cofre no começo da grade em quatro grupos — comida, materiais,
  barras, raros (acessórios, itens raros e com afixo) — e em ordem alfabética dentro de cada grupo. Testado com 9 itens espalhados:
  Espetinho, Lambari | Cobre, Gosma, Madeira | Barra de bronze, Barra de ferro | Anel de cobre, Fragmento ancestral.
- **Lupa no filtro:** `icon_filter` (2x em telas densas) dentro do campo, com 22 px à esquerda; o fundo do campo continua o da madeira.
- **Cabeçalho do cofre:** o filtro passou para uma linha própria (com três controles na mesma linha ele encolhia para "fil" na
  janela de 360 px); no celular os botões do cabeçalho têm 44 px de altura.
- **Robô autossuficiente com o cofre** (30 min; volta ao cofre quando a mochila passa de 14 espaços): **não precisou do cofre
  nenhuma vez** — como os itens empilham, a mochila chegou a 8 espaços (gosma, âmbar, peixe queimado, 39 couros, 37 carnes de javali,
  madeira, lambari, 4 espetinhos). Combate 10 aos 23,5 min com 1 morte (rodada 41: 21,5 min e 0 mortes; a diferença está na variação
  entre partidas). O cofre só pesa a partir da segunda hora, com mais tipos de material.

## Rodada 43 (v0.43)
- **Retirar comida:** botão com `icon_bank_take` no cabeçalho do cofre; tira a comida que couber na mochila, da que mais cura para
  a que menos cura (poções ficam). Um efeito só: `fx_item_take` (6 quadros, 12 fps) abrindo da tampa do baú, e o ícone da primeira
  comida retirada crescendo de 14% para 70% do tile e descendo do centro nos quadros 1–4. Sem comida no cofre, aviso no registro.
  Testado: Espetinho 3 e Tucunaré 4 (cura 12) e Lambari 5 saíram; Poção de vida, Madeira e Cobre ficaram.
- **Filtro do cofre:** campo "filtrar" (busca, acessível por Tab, rótulo para leitor de tela) que apaga os espaços cujo nome não
  contém o texto, sem ligar para acentos e maiúsculas ("COBR" → Cobre; "poçao" → Poção de vida). O texto fica guardado enquanto a
  janela estiver aberta (sobrevive a guardar e retirar) e as setas pulam os espaços apagados. Digitar no campo não move o herói.
- **Cofre sem perdas:** 2.898 operações aleatórias (guardar/retirar um espaço, guardar materiais, retirar comida) ao longo de 63 min
  de jogo simulado, com 10 tipos de item: as quantidades somadas de mochila + cofre não mudaram em nenhum momento e nenhuma pilha se
  duplicou (memória JS 83 MB no fim).

## Rodada 42 (v0.42)
- **Guardar materiais:** o botão do cofre (antes "Guardar tudo, menos comida") ganhou `icon_bank_move` e agora guarda tudo menos
  comida, poções e acessórios. Um efeito só por clique: `fx_item_store` (6 quadros, 12 fps) sobre a tampa do baú e o ícone do
  primeiro item guardado encolhendo (70% → 14% do tile) e subindo até o centro nos quadros 0–3.
- **Setas entre grades:** na janela do cofre, passar do fim da mochila leva ao cofre e voltar do começo do cofre leva ao último
  espaço da mochila (cada grade mantém um espaço no Tab).
- **Revisão de sons** (renderização offline dos efeitos com as mesmas funções de `js/audio.js`; pico / RMS): golpe 0,11 / 0,005,
  crítico 0,18 / 0,008, tremor 0,26 / 0,019 (o mais alto, de propósito), moeda 0,07, missão 0,11, nível 0,08, raro 0,08, alaúde
  0,10 / 0,013, aviso 0,09, eco surgindo 0,09 / 0,011 (o ruído foi de 0,22 para 0,18 e os tons de 0,12 para 0,10), eco se desfazendo
  0,14 / 0,011, assar 0,13, fundir 0,07. Os sons novos ficam na faixa dos antigos.

## Rodada 41 (v0.41)
- **Gancho da plaquinha:** `deco_version_hook` (16 px, 2x em telas densas) entre a borda inferior direita da faixa e a cordinha; a
  plaquinha subiu 10 px e o subtítulo desce 24 px. No celular o gancho some (a plaquinha fica no fluxo).
- **Teclado:** cartão "Teclado" no "Como jogar" e linha nas opções, os dois com `icon_keyboard_help`.
- **Mochila e cofre com foco itinerante:** só um espaço de cada grade entra no Tab (o último em foco, ou o primeiro com item); as setas
  andam entre os espaços com item (grade de 4) sem mover o herói; Enter/Espaço usam. Antes o Tab passava pelos 20 espaços.
- **Robô autossuficiente de novo** (30 min, alvo até Combate + 1 e respeitando o nível da região): 0 mortes, Combate 10 aos 21,5 min e
  12 aos 29,7 min, 2,4 min pescando/assando, 11 lambaris e 1 espetinho. Rodada 31: 1 morte e Combate 10 aos 21,8 min — sem regressão.

## Rodada 40 (v0.40)
- **Faixa ondulando:** `fx_banner_wave` (8 quadros de 640 × 120 lado a lado, 6 fps, campo novo `cellH`) como sprite CSS
  (`background-size: 800% 100%` + `steps(8, jump-none)`), aplicado só depois que a folha carrega; a faixa estática (limpa das franjas
  magenta) fica como reserva e é a que aparece com "reduzir movimento" ligado no sistema. A URL vai absoluta para o `var(--wave)`
  (dentro do CSS ela seria resolvida a partir de `css/`). O jogo ignora folhas `fx` com `tiles: 0` (não carrega 5.120 px à toa).
- **Plaquinha da versão:** `icon_version_tag` (2x em telas densas) pendurada na ponta direita da faixa, texto #2a1a0c em 11 px; a
  posição é calculada pela faixa (e recalculada no resize); o subtítulo desce 14 px para não ser coberto. No celular fica logo abaixo.
- **Teclado:** espaços da mochila e do cofre com `tabindex`/`role="button"`; Enter/Espaço neles equivale ao clique e o foco volta ao
  mesmo espaço depois que a mochila se redesenha. Com um botão em foco, Enter/Espaço apertam o botão (antes Espaço disparava o
  ataque ao monstro mais perto). Esc já fechava janelas.
- **README:** "Como jogar" sem os rótulos de rodada e com níveis recomendados, comida, fim de jogo, vila e teclado; "Estrutura"
  com a tela inicial nova.

## Rodada 39 (v0.39)
- **Faixa do título:** `deco_lobby_banner` atrás de "VALDORA" (classe `banner`, proporção 640 × 120, título na área lisa ~120–520 ×
  20–92, sombra escura de 2 px). No celular a faixa encolhe pela largura (327 × 61 px em 375 px de tela, título em ~26 px sem cortar).
- **Continuar:** `icon_continue_play` à esquerda do texto do botão.
- **Acessibilidade:** contorno dourado de 2 px no foco por teclado (botões, abas, campos, minimapa); no celular, botão de fechar
  janela com 44 × 44 px, abas do painel e das janelas com 44 px de altura e botões das linhas das janelas com pelo menos 40 × 44 px.
  O texto escuro (#3a2a16) sobre o pergaminho do cartão do save tem contraste alto (bem acima de 7:1).
- Este resumo por tema no topo do histórico.

## Rodada 38 (v0.38)
- **Tomé levanta antes da reverência:** com ele sentado no tronco, a entrega da missão toca `stand_up` (4 quadros, 10 fps): quadros 0–1
  na altura do tronco (0,3 tile acima), no quadro 2 ele desce para o tile de baixo do tronco (ou o de onde veio, ou um vizinho livre)
  e termina no chão; depois vem a `bow` com o brilho. Sem tile livre, continua sentado (sem reverência). O tile da esquerda do tronco
  fica atrás do telhado da casa, por isso a preferência pelo de baixo.
- **Cartão do save em pergaminho:** `icon_save_card_bg` como fundo (100% × 100%), texto escuro (#3a2a16), medalhas em âmbar escuro;
  no celular, margens em px para o texto não encostar nas pontas enroladas, sem a linha "Salvo em" e com 2 conquistas.
- **Save antigo** (conquistas gravadas como `1`): a tela inicial mostra as 3 primeiras da lista ("Primeiro corte", "Minerador",
  "Pescador"); a aba Conquistas continua marcando todas.

## Rodada 37 (v0.37)
- **Reverência do Tomé:** linha `bow` de `npc_bard` na reação ao entregar uma missão dele (com o brilho à direita, ~0,6 tile acima do
  pé, perto do chapéu). As reações dos três NPCs estão completas (continência, joinha, reverência). Sentado no tronco ele não se curva,
  e as notas musicais param durante a reverência.
- **Conquistas:** o registro mostra `icon_achievement_new`; cada conquista agora guarda a data (`player.ach[id] = Date.now()`; saves
  antigos com `1` continuam valendo). A ficha do save no lobby mostra as 3 últimas, com a medalha.
- **Sessão longa com reações** (60 min caçando golems, uma encomenda entregue por minuto com joinha e brilho, "Estrada do leste"
  entregue a cada 5 min): partículas 46–84 nas medições logo após as entregas (sem crescer), corpos 0–1, itens no chão 4–5,
  monstros 69–74, objetos 466, registro em 9 linhas, memória JS 71–79 MB. Nada acumula.

## Rodada 36 (v0.36)
- **Brilho da reação:** `fx_thumbs_spark` (Blender, 1 tile, 6 quadros, sem loop) no quadro 3 da reação — à esquerda e 0,9 tile
  acima do pé do Bento (mão do joinha) e acima do elmo do Ivo na continência.
- **Encomenda entregue:** a linha do registro ganhou `icon_order_done`.
- **Diário, aba Missões:** prontas para entregar primeiro (ícone `icon_quest_turnin`, borda e texto dourados, "pronta para entregar"),
  depois em andamento, depois concluídas. `QUEST.ready(id)` passou a ser exportado (o quadro verde e o diário usam a mesma regra).
- Conferidos na tela, depois da troca de código da rodada 35: a continência do Ivo ao entregar "Estrada do leste" e o joinha do Bento
  ao entregar "A encomenda do Bento" (a missão), os dois com o brilho.

## Rodada 35 (v0.35)
- **Reação dos NPCs** (genérica: `REACT` em `game.js`): o Bento faz joinha (`npc_merchant` linha `thumbs`, 6 quadros, segura o último
  0,6 s) ao entregar uma missão dele ou uma encomenda; o Ivo continua com a continência. Os dois param de andar durante a reação.
- **Quadro verde da balada:** com `icon_event_soon`, "a Lua cheia vem à noite" de dia e "pode surgir a qualquer momento" à noite;
  o quadro se atualiza quando anoitece ou quando a Lua cheia começa/termina.
- **Atalho noturno só para a Lua cheia:** com a balada ativa, à noite o relógio corre 4× e o evento que dispara é sempre a Lua cheia;
  de dia, e sem a missão, os eventos seguem o ritmo normal (antes a invasão e o cardume dourado também aceleravam à noite).
- **A canção do Ancião inteira** (robô, Pesca e Culinária 10, Combate 31, espada 4, armadura 3, partindo da praça): 3 tucunarés
  pescados aos 18 s, assados aos 36 s, entregues ao Tomé aos 38 s, luta com o Golem Ancião aos 53 s e missão pronta aos 91 s
  (sem esquivar: 5 espetinhos, nenhuma morte). Com a volta ao Tomé, cerca de 2 min de ações: na faixa das outras missões.

## Rodada 34 (v0.34)
- **Continência do Ivo:** linha `salute` de `npc_guard` (6 quadros, 8 fps, segura o quadro 5 por 0,6 s) ao entregar uma missão dele;
  ele fica parado durante a continência.
- **Quadro verde:** passo final ("talk") ou entrega já possível mostra `icon_quest_turnin` e "· pronta para entregar" em dourado.
- **Tomé sentado:** nome e "!" descem 0,28 tile.
- **Robô de missões** (ações perfeitas; tempo até a missão ficar pronta para entregar):
  | Missão | Nível usado | Tempo | Mortes / comidas | Recompensa |
  |---|---|---|---|---|
  | Estrada do leste (8 goblins) | Combate 9, equip. 2/2 | 80 s | 0 / 5 | 200 moedas, 600 xp, 2 poções de força |
  | A encomenda do Bento (5 barras de ferro + 10 carvalhos) | Mineração/Corte/Ferraria 8 | 102 s | — | 450 moedas, 900 xp, amuleto com afixo |
  | O guardião desperto (Colosso) | Combate 22, equip. 3/3 | 157 s | 0 / 9 | 600 moedas, 2000 xp, Anel ancestral |
  | Ecos da cripta (5 esqueletos + baú) | Combate 18, equip. 3/3 | 200 s | 0 / 10 | 300 moedas, 800 xp, anel com 2 afixos |
  | A balada da lua cheia (Alfa 2×) | Combate 18 | **23–49 min** (quase tudo esperando a Lua cheia) → **4–12 min** | — | 400 moedas, 1200 xp, Presa lunar, amuleto |
  A balada era a única fora da curva: com ela ativa, o próximo evento agora chega 4× mais rápido à noite (`js/events.js`); com 85%
  de chance de ser Lua cheia, a missão caiu para 4,3–12 min (média 7,9 em 5 rodadas). A canção do Ancião (3 tucunarés + Golem
  Ancião) não foi medida inteira; pelas medições anteriores, cerca de 2–3 min de ações.

## Rodada 33 (v0.33)
- **Tomé no tronco:** quando está em casa e livre, em 45% das voltas ele vai para o lado do tronco-banco, sobe nele (ocupa o tile do
  tronco enquanto isso) e toca sentado por 20–40 s com a linha `sit` (base 0,3 tile acima do pé, no topo do tronco). Com o jogador
  perto ou conversando, continua sentado; ao levantar, volta ao tile de onde veio (ou a um vizinho livre) e retoma as voltas.
  Medido: sentou aos 32,5 s e levantou aos 63,5 s.
- **Minimapa:** a fala de boas-vindas do Ivo ficou mais curta; a explicação do minimapa virou uma dica no registro (com
  `icon_minimap_help`) 1,5 s depois de concluir a primeira tarefa.
- **Celular:** botão de dica (`icon_minimap_help`) acima do ✚: cada toque mostra a próxima dica do Ivo no registro.
- **Sessão longa** (60 min simulados caçando golems, 360 abates, invasão goblin no meio): corpos 0, partículas 0–11, textos
  flutuantes 0–3, itens no chão 2–5, monstros 69 (74 durante a invasão), objetos 466, registro preso em 9 linhas e memória JS entre
  71 e 76 MB. Nada acumula.

## Rodada 32 (v0.32)
- **Aviso por tipo:** `icon_danger_generic` (caveira) no letreiro e no registro das regiões sem matilha (Bosque, Ruínas, Planalto,
  Cripta); a matilha (`icon_danger_pack`) fica para Mata Sombria e Toca. Sem "⚠" nem `icon_dodge`.
- **Aviso ao carregar:** quem continua o jogo já dentro de uma região acima do nível recebe o letreiro e a linha no registro. Dentro
  das masmorras o aviso já funcionava (a região vira "crypt"/"den" ao entrar); conferido na Cripta com Combate 1.
- **Tronco-banco** `deco_campfire_log` (estático, 1,4 tile) abaixo da fogueira da vila; lados e topo do fogo continuam livres para assar.
- **Letreiro no celular (≤ 480 px):** alinhado à esquerda, título em 22 px e a linha do perigo quebrando em até 3 linhas antes da
  coluna do HUD (antes a linha saía da tela à direita). Animação própria (`bannerM`) sem o centralizado.
- **Ivo:** a fala de boas-vindas apresenta o minimapa (vila, lagos, monstros) e avisa que cada região mostra o nível recomendado.

## Rodada 31 (v0.31)
- **Aviso de região acima do nível:** cada região ganhou `min` (Combate recomendado) e `danger` em `REGIONS`. Ao entrar com Combate
  menor, o letreiro mostra a linha laranja (com `icon_danger_pack` nas regiões de matilha: Mata Sombria e Toca) e o registro diz o
  perigo e o nível ("Matilhas de lobos por aqui; volte no Combate 12 (você tem 1)"), no máximo uma vez por minuto por região.
- **Varal de carne** `deco_meat_rack` (2 tiles, linha `sway` do Blender com fase pela posição) à direita da fogueira da vila, deixando
  livres os lados do fogo para assar. Na primeira posição tentada (sudoeste) ficava atrás do telhado da casa.
- **Peixe queimado** vale 1 moeda no Bento (antes 0 e ficava acumulando).
- **Mochila:** a quantidade foi para o canto de baixo (em cima ficam a cura e a frigideira).
- **Robô autossuficiente com e sem o aviso** (30 min, jogo novo, pesca/assa/espetinho como na rodada 30):
  | Alvo do robô | Mortes | Combate 10 em | Comidas | Lobos mortos |
  |---|---|---|---|---|
  | até Combate + 2, ignora o aviso | 9 | 25,1 min | 62 lambaris, 5 espetinhos, 3 carnes | 7 |
  | até Combate + 1 e respeita o nível da região (como quem lê o aviso) | 1 | 21,8 min | 10 lambaris, 2 espetinhos | 0 |
  As mortes da rodada 30 eram do robô entrando cedo demais (goblins no Combate 6–8, lobos no 10). Quem respeita o nível
  recomendado sobe mais rápido e quase não morre; o aviso deixa esse nível visível.

## Rodada 30 (v0.30)
- **Espetinho de javali** (`item_meat_skewer`): na fogueira, carne de javali com 1 madeira na mochila vira espetinho (cura 12, 15 xp)
  em vez de carne assada (cura 9); sem madeira, sai a carne comum. Na primeira vez o registro explica (com `icon_heal_small`).
- **Carne de javali assa a partir de Culinária 2** (antes 5): o robô autossuficiente só chegava ao 5 depois dos 30 min, com 80 lambaris.
- **Quanto cura:** coração `icon_heal_small` com o valor no canto de cada comida da mochila; o botão ✚ do celular mostra o coração e
  quanto cura a melhor comida (ou "Sem comida pronta" na dica).
- **Robô contra lobos** (Mata Sombria, só lobos, 8 comidas + 4 a cada 75 s, come abaixo de 40%; 3 × 10 min por caso):
  | Combate / Vit. / armadura | Lambari (cura 5) | Carne assada (9) | Espetinho (12) |
  |---|---|---|---|
  | 12 / 9 / 2 (nível da região) | 12 mortes | — | 1 morte |
  | 10 / 7 / 2 (abaixo da região) | 19 mortes | 5 mortes | 8–15 mortes |
  No nível da Mata Sombria o espetinho resolve; abaixo dele, nenhuma comida segura as matilhas. O robô autossuficiente (alvo até
  Combate + 2) continua morrendo entre 20 e 30 min (3–5 vezes) porque entra na Mata Sombria no Combate 10 e quase não caça javalis
  (o alvo mais perto quase sempre é slime ou goblin); um jogador vê o aviso de nome vermelho.
- Conferidos na tela os 3 heróis assando nas 4 direções.

## Rodada 29 (v0.29)
- **Herói assando:** `hero_N_cook` (Flow, 3 quadros × 4 direções, células de 96 px, registradas com as outras folhas de ação) em loop
  0,1,2,1 a 7 fps enquanto ele assa (a ação de assar agora usa a chave "cook"); o nome desce para a altura do corpo agachado.
- **Posição na fogueira:** o caminho prefere os tiles ao lado ou acima do fogo, como nos NPCs; o chiado da grelha fica à vista.
- **Mochila:** `icon_cook_level` no canto dos crus que já não queimam no seu nível; a dica do cru mostra a chance de queimar
  (ou "requer Culinária N").
- **Ficha (P):** seção "Chances no seu nível" com a chance de coleta de cada recurso liberado (com ferramenta, acessórios e obra-prima)
  e a de queimar cada comida.
- **Robô de jogo novo autossuficiente** (30 min, sem comida dada: quando tem menos de 2 comidas, pesca lambari até 8 e assa; vende
  o que sobra quando a mochila enche):
  | Aos | Combate / Vit. | Pesca / Culinária | Mortes | Comidas comidas | Tempo pescando + assando |
  |---|---|---|---|---|---|
  | 10 min | 7 / 5 | 3 / 2 | 0 | 5 | 2,0 min |
  | 20 min | 9 / 6 | 3 / 3 | 1 | 14 | 2,7 min |
  | 30 min | 11 / 7 | 4 / 4 | 4 | 41 | 5,8 min |
  Combate 10 aos 20,4 min (rodada 24, com comida dada: 21,8 min). As mortes vêm dos lobos (nível 12) com lambari (cura 5): a
  comida de quem não pesca tucunaré ainda é fraca para a Mata Sombria. Fica para a rodada 30.

## Rodada 28 (v0.28)
- **Chiado na grelha:** `fx_cook_sizzle` (Blender, 1 tile, 8 quadros, loop, base no fogo) aparece sobre a fogueira por 1,8 s a cada
  item assado — peixe ou carne.
- **Queima mais branda:** `RULES.burnChance(nível, exigido)` = 24% no nível exigido, −3 pontos por nível, zero 8 níveis acima (antes
  32% e −3,5). Robô (200 assados por caso): tucunaré no Culinária 10 → 22% queimados (antes 25% subindo do 10 ao 12); lambari no 1 → 25%.
- **Aviso com `icon_burnt`:** ao começar a assar um item, o registro mostra a chance de queimar no seu nível (uma vez por item e nível);
  "Queimou!" no registro no máximo a cada 20 s (o texto flutuante continua em todos). Dica nova do Ivo sobre a queima.
- **Minimapa:** cardumes em 7 px quando o lago tem mais de um (10 px quando está sozinho).
- **Tabela de `tests.html`:** linhas de assar (no nível exigido e +8) e de fundir cada barra, com 3 ticks + 0,1 s por item. Bate com o
  robô da rodada 27: barra de ferro 40,5 mil xp/h (robô 40,8 mil), barra de aço 67,5 mil (robô 68 mil). A nota lembra que o ritmo real
  depende da coleta.

## Rodada 27 (v0.27)
- **Cardume que se afasta:** `fx_fish_jump` (Blender, 1 tile, 8 quadros, centro na água) toca no ponto antigo e no novo; o aviso
  "O cardume se afastou" ganhou o ícone `icon_fish_spot` e aparece no máximo a cada 30 s (antes repetia a cada cardume esgotado).
- **Minimapa:** cada cardume aparece com o `icon_fish_spot` em 10 px (só no mapa de cima).
- **Tomé:** com a linha `play`, o nome e o "!" sobem 0,45 tile e as notas saem mais à direita (não cobrem mais o nome).
- **Saves antigos:** encomendas salvas antes da rodada 26 ganham a marca `big` ao carregar (pela tabela `ORDER_POOL`). Teste com um
  save no formato da v0.20 (sem `echo`, sem `stats.echoes`, encomendas sem `big` e uma encomenda de item inexistente): abre sem
  erro, a encomenda inválida é trocada e as marcas saem certas.
- **Robô de culinária e ferraria** (5 min por caso, matéria-prima à vontade, ao lado da fogueira/fornalha):
  | Atividade | XP/h | Produção/h |
  |---|---|---|
  | Tucunaré, Culinária 10 | 28,8 mil | 1.800 assados, 600 queimados |
  | Tucunaré, Culinária 20 | 38,4 mil | 2.400 assados, 0 queimados |
  | Carne de javali, Culinária 10 | 24,9 mil | 2.076 assadas, 324 queimadas |
  | Barra de ferro, Ferraria 10 | 40,8 mil | 2.268 barras |
  | Barra de aço, Ferraria 15 / 20 | 68 mil | 2.270 barras |
  Processar é rápido (1,5–1,6 s por item) e limitado pela coleta: 2.268 barras de aço por hora pedem 4.536 ferros e 4.536
  carvalhos, cerca de 5 h de mineração e 2,5 h de corte. Por isso a ferraria rende mais XP por hora "na fornalha", mas não
  por hora de jogo. A tabela de `tests.html` cobre só coleta e combate.

## Rodada 26 (v0.26)
- **Notas do Tomé:** `fx_music_notes` (Blender, 1 tile, 12 quadros, loop) sobe do ombro dele enquanto está na linha `play`. O ♪ saiu
  do texto desenhado no balão (a fonte do canvas não tinha o caractere); a janela de canções (HTML) continua com ♪.
- **Encomendas grandes:** `icon_order_up` antes da quantidade quando o pedido passou do tamanho normal por causa do seu nível (`big`).
- **Sons dos ecos** (sintetizados em `js/audio.js`): `echo_rise` (acorde subindo com sopro) ao despertar e `echo_fade` (acorde descendo)
  ao se desfazer.
- **Dica do Ivo fixa por visita:** sorteada ao abrir a janela, não a cada redesenho (comprar, trocar de aba...).
- **Robô de coleta da segunda hora** (10 min por caso, sem idas ao cofre) contra a tabela de `tests.html`:
  | Atividade | Robô | Tabela |
  |---|---|---|
  | Carvalho, Corte 8, machado 2 | 12,9 mil xp/h, 5,9 mil moedas/h | 13,9 mil / 6,3 mil |
  | Carvalho, Corte 18, machado 3 | 19,1 mil / 8,7 mil | 20,5 mil / 9,3 mil |
  | Veio de ferro, Mineração 8, picareta 2 | 10,7 mil / 7,1 mil | 11,8 mil / 7,8 mil |
  | Veio de ferro, Mineração 18, picareta 3 | 13,0 mil / 8,7 mil | 14,8 mil / 9,9 mil |
  | Cardume raso, Pesca 10, vara 2 | 11,7 mil / 3,9 mil | 12,5 mil / 4,2 mil (Pesca 11, vara 3) |
  | Cardume fundo, Pesca 10 / 20 | 15,9 mil / 21,6 mil xp/h | 18,8 mil (Pesca 11, vara 3); antes saía igual ao raso, 12,5 mil |
  Corte e mineração batem com a tabela (o robô fica 7–12% abaixo, pela caminhada entre recursos). A tabela errava a pesca funda:
  usava sempre o último peixe da lista (lambari). Agora faz a média como o `gather.js` (metade das vezes o melhor peixe).

## Rodada 25 (v0.25)
- **Tomé tocando:** linha `play` de `npc_bard` (8 quadros, 8 fps, loop, de frente) com a janela de canções aberta ou quando ele canta
  no balão (falas com ♪); nas outras falas continua o `talk`.
- **Dicas com ícone** `icon_tip`: no registro, uma "Dica do Ivo" a cada 4 min de jogo depois do tutorial (em sequência, fora das
  masmorras), na janela do Ivo (pergaminho ao lado da fala) e na tela inicial (clique para a próxima). `log()` aceita um ícone.
- **Encomendas do Bento:** pedidos sorteados com peso 1 + nível/4 (os do seu nível saem mais) e quantidade que cresce até 3× com a
  diferença de nível. Com tudo no nível 15: barra de aço 16%, pele de lobo 13%, tucunaré 12% ... gosma 4% (7–14 unidades, antes 3–6).
- **Desempenho:** os monstros tingidos (ecos) usavam `ctx.filter` a cada quadro. Agora cada folha ganha uma cópia tingida feita uma
  vez (`tinted()` em `js/actors.js`). Quadro de noite com o Eco do Senhor em fúria e leitura síncrona da GPU: 10,9 ms → 9,8 ms (sem eco: 9,3 ms).
  O corpo do eco ao morrer agora também sai tingido (antes caía com as cores do chefe comum).
- **Robô do tutorial** (ações perfeitas, sem ler as falas): os 9 passos em 1,8 min de jogo — falar 0:01, madeira 0:14, cobre 0:35,
  barras 0:45, forja 0:50, lambari assado 1:12, slimes 1:30, esquiva 1:45, venda 1:47. Termina com 228 moedas, espada de bronze
  e 3 poções de vida. Uma pessoa lendo e andando com cliques deve levar de 6 a 12 min.

## Rodada 24 (v0.24)
- **Eco se desfazendo:** quando o jogador se afasta, `fx_echo_fade` (Blender, 3 tiles, 8 quadros, base no pé) toca no lugar do eco; o
  corpo some nos 3 primeiros quadros (corpo "fantasma" com o primeiro quadro do idle) e o registro avisa que o quadro pode despertá-lo de novo.
- **Sino dos ecos** `icon_echo_week` no cabeçalho "Ecos semanais" do quadro de caçadas (e no aviso antes de liberar) e na linha
  "1 vez por semana" do bestiário.
- **Celular (≤ 480 px):** com o painel aberto, as abas viram uma janela de largura total sobre o mapa (acima do registro e da barra de
  habilidades), com rolagem própria; a coluna de 140 px quebrava o bestiário a cada palavra.
- **Falas e dicas:** Bento (Couraça, cristais de eco), Ivo (quadro tremendo, fúria dos chefes), Tomé (verso e canção *Lamento dos Ecos*)
  e duas dicas novas (fúria abaixo de 1/3 da vida; ecos semanais).
- **Correção:** os esqueletos invocados que desabam com o chefe empurravam um corpo sem `life`, que nunca saía da lista; e o fade
  da queda procedural ficava negativo (o canvas ignora e o corpo voltava inteiro). Os dois corpos agora usam `pushCorpse()`.
- **Robô de jogo novo** (30 min, sem tutorial, só combate, alvo mais perto com nível ≤ Combate + 2, 8 lambaris a cada 5 min, compra
  espada e armadura no Bento assim que pode):
  | Caso | Combate 5 / 8 / 10 | Aos 30 min | Mortes | Comidas |
  |---|---|---|---|---|
  | Cota de ferro com Vitalidade 8 | 3,7 / 11,1 / 18,9 min | Combate 12, Vit. 8, armadura 1 até 28 min | 8 (lobos, a partir dos 20 min) | 40 |
  | Cota de ferro com Vitalidade 6 | 3,6 / 12,3 / 21,8 min | Combate 11, Vit. 7, armadura 2 aos 15 min | 0 | 18 |
  A Vitalidade cresce a 1/3 do Combate nos estilos Agressivo e Preciso, e a Cota (Vit. 8) só chegava depois dos lobos da Mata Sombria (nível 12).
  Com Vitalidade 6 ela chega junto com a espada de ferro.

## Rodada 23 (v0.23)
- **Despertar do eco:** `fx_echo_summon` (Blender, 3 tiles, 10 quadros, base no pé) toca no ponto onde o eco surge; o eco fica
  invisível até o quadro 4 e entra em fade por 0,5 s (`m.appear`), sem agir nem ser desenhado antes disso.
- **Eco desperto à vista:** linha "Eco desperto" no quadro verde sob a vida (nome, lugar e vida restante) e anel ciano pulsando
  no minimapa; o quadro se atualiza sozinho quando o eco surge, morre ou se desfaz.
- **Ícones próprios** `item_echo_crystal` e `item_amulet_echo` (32 e 64); os filtros de cor saíram dos dois itens.
- **Amuleto dos ecos** de +4/+4/+6 para +3 acerto, +3 dano, +5 defesa. Robô contra o Golem Ancião (Combate 34, Couraça, 12 lutas):
  sem amuleto 37,2 s; Coroa do Ancião 33,9 s (-9%, mais defesa e coleta); Amuleto dos ecos 31,9 s (-14%; antes 31,8 s com +4/+4/+6
  contra 35,6 s da Coroa em 8 lutas). Fica o amuleto de ataque garantido; a Coroa, o de defesa e coleta, por sorte.
- **Economia dos ecos** (6 lutas cada): Eco do Senhor 46 s, ~525 moedas + ~1,3 mil em drops, ~1,9 mil xp; Eco do Golem 67 s,
  ~760 moedas + ~1,3 mil em drops, ~2,2 mil xp. Os dois juntos por semana valem ~3,9 mil (≈ 11 min de caça de golems, que rende
  ~21 mil por hora em moedas e drops) mais o Amuleto dos ecos: é um bônus semanal, não a melhor fonte de lucro.
- **Celular** (quadro de 375 px): quadro de caçadas com os ecos rola dentro da janela, aviso do eco aparece com o painel recolhido,
  bestiário legível com o painel aberto.

## Rodada 22 (v0.22)
- **Fúria do Senhor das Ruínas** abaixo de 30% de vida: toca a linha `enrage` do Blender, ganha a aura `fx_enrage_aura` (desenhada atrás
  e, fraca, na frente do chefe) com luz roxa à noite, ataca mais rápido e ergue 3 esqueletos. A fúria agora é genérica (`enrage` nos dados).
- **Slime de lumita:** a poça `fx_crystal_glint` brilha nos 2,5 s antes do `rise_up` (luz ciano à noite); as luzes dos avisos vêm de `marker.light`.
- **Ícone por tier** de equipamento (`GEAR.tiers[].icon`, `ValdoraDialogs.tierIcon`): a Couraça de lumita usa `item_armor_lumita` na banca,
  na bigorna, no painel e na ficha.
- **Ecos semanais** (desafio da quarta hora): depois de vencer os dois chefes, o Quadro de caçadas desperta o *Eco do Senhor das Ruínas*
  (nv 36, 480 de vida) ou o *Eco do Golem Ancião* (nv 42, 640) no lugar do chefe. Uma vitória por semana (reinicia na segunda-feira);
  se o jogador se afastar, o eco se desfaz e pode ser despertado de novo. Drops: *Eco cristalizado* garantido, barras de lumita e raros.
  Dois Ecos + 2 barras de lumita viram o **Amuleto dos ecos** (épico: +4 acerto, +4 dano, +6 defesa; Artesanato 14). Conquista *Ouvido no passado*.
- **Bestiário:** lista as masmorras onde o monstro também vive (o Alfa: "Mata Sombria (Lua cheia) · Toca dos Lobos") e mostra
  "1 vez por semana" nos ecos. Os ecos não contam para a conquista *Naturalista* nem entram nas caçadas.
- **Robô** (Combate 34, Vitalidade 33, espada 4, Couraça; 4–6 lutas por caso, esquivando / parado):
  | Luta | Tempo | Comidas | Dano recebido |
  |---|---|---|---|
  | Senhor das Ruínas com fúria, Combate 22 | 34 s / 32 s | 2,3 / 3,0 | 59 / 66 |
  | Senhor das Ruínas com fúria, Combate 26 | 34 s / 30 s | 0 / 1,5 | 20 / 49 |
  | Senhor das Ruínas com fúria, Combate 34 | 29 s / 24 s | 0 / 0 | 18 / 9 |
  | Eco do Senhor (ataque 44) | 46 s / 41 s | 2 / 9 | 68 / 152 |
  | Eco do Golem (ataque 38) | 59 s / 59 s | 0,8 / 9,5 | 41 / 164 |
  O ataque do Eco do Senhor subiu de 32 para 44: com 32 ele quase não acertava a defesa 50 da quarta hora (0 comidas esquivando).

## Rodada 21 (v0.21)
- Slime de lumita renasce de uma poça de cristal (linha `rise_up` do Blender, 6 quadros, 10 fps); a própria poça é o aviso, sem poeira (`riseFx: false` em `data.js`).
- `fx_rock_rubble` refeita (pedras maiores e mais claras, quiques mais altos, contorno grosso) — mesmo nome e tempos, entrou sem mudar código.
- Bestiário mais completo: região, selo de chefe/mini-chefe e, com o ícone `icon_respawn`, se o monstro renasce e em quanto tempo
  (mapa aberto: "renasce em N s"; masmorra: "a cada visita"; evento ou missão: "não renasce").
- **Couraça de lumita** (quarto tier da armadura: +17 defesa, Vitalidade 24, 5 barras de lumita na bigorna com Ferraria 24
  ou 3.600 moedas no Bento). A armadura parava no aço enquanto a espada chegava à lumita; agora as barras de lumita dos chefes têm destino.
- **Robô da quarta hora** (6 lutas por caso, 14 tucunarés na mochila, Q/E/R na recarga, come abaixo de 45%):
  | Caso | Senhor das Ruínas (esquiva / parado) | Golem Ancião (esquiva / parado) |
  |---|---|---|
  | 3.ª hora: Combate 31, Vit. 30, espada 4, armadura 3 | 29 s, 0,2 comida / 27 s, 0,2 | 42 s, 0 / 36 s, 3,3 comidas |
  | 4.ª hora: Combate 34, Vit. 33, espada 4, armadura 3 | 28 s, 0 / 26 s, 0 | 41 s, 0 / 33 s, 2,8 |
  | 4.ª hora com a Couraça (armadura 4) | 28 s, 0 / 24 s, 0 | 37 s, 0 / 35 s, 2,2 |
  | Senhor no nível esperado: Combate 22 / 26, armadura 3 | 34 s, 0,3 / 31 s, 2,7 (C22) · 30 s, 0,2 / 29 s, 0,2 (C26) | — |
  A Couraça corta ~10% do dano do Golem parado (não trivializa a luta). O Senhor das Ruínas vira caça fácil a partir do
  Combate 26 — esperado para um chefe de nível 28, mas a quarta hora pede conteúdo novo (ver plano da rodada 22).
- Limpeza: o ícone de equipamento (`gearIcon`) da banca e da forja passou para `js/dialogs.js`; o histórico das rodadas saiu do README para este arquivo.

## Rodada 20
- Aviso de renascimento por monstro (`marker` em `data.js`): esqueleto com fogo-fátuo (6 s, loop) e golem com
  `fx_rock_rubble` (2 s, toca uma vez e segura o montinho), ambos voltando com `rise_up` e poeira clara. Marco
  `deco_plateau_cairn` no ponto de caça dos golems, com luz ciano à noite. Golem com raio de ataque 2 (antes 3): mesmas curas
  (12 em 10 min no Combate 22 com armadura tier 3) e ~7% mais XP por hora. **Golem Ancião no fim da terceira hora**
  (Combate 31, espada 4, armadura 3, usando Q/R): sem esquivar 35–45 s e 3,7 comidas; esquivando andando 45–50 s e nenhuma.
  Eventos do mundo saíram para `js/events.js`; a seção "Estrutura" foi reorganizada.

## Rodada 19
- Esqueletos que vão renascer marcam o túmulo com o fogo-fátuo `fx_soul_wisp` nos 6 s finais (com luz
  roxa à noite) e voltam com a linha `rise_up` + poeira clara; os esqueletos invocados pelo Senhor também saem da terra.
  Arco quebrado `deco_ruins_arch` (3 tiles, passa-se por baixo) junto da lápide. Medições: Alfa da lua (110 de vida) com
  Combate 18 em 42 s e 3 curas; Colosso subiu para 230 de vida e dano 12 (antes caía em 36 s com 1 cura; agora ~50 s).
  **Achado da terceira hora:** os 5 golems nasciam espalhados por toda a borda oeste (de y 20 a 56) — o robô matava 8 em
  10 min (7 mil xp/h). Agora 6 golems e 5 slimes de lumita ficam agrupados no meio do Planalto: 53 golems em 10 min,
  45 mil xp/h, e Combate 22 → 31 (nível do Golem Ancião) em ~1 h.

## Rodada 18
- Robô de masmorra escolhendo o alvo pelo **caminho de verdade** (o da rodada 17 travava porque mirava
  monstros atrás de paredes). Com Combate 16, espada tier 3 e armadura tier 2: cripta limpa em 90–140 s (1–3 curas);
  *Ecos da cripta* inteira em ~3 min; *O guardião desperto* na primeira tentativa (Colosso com 6 curas, sem esquivar).
  Achados e ajustes: (1) nas Ruínas, o Senhor entrava em 30% dos golpes que o caçador de esqueletos levava — os esqueletos
  agora nascem na parte oeste (casa em 74,12), longe do chefe; (2) esqueleto com dano 5 (antes 6) e aggro 3 (antes 4):
  de 5,3 para ~3 curas por minuto no Agressivo e ~1,7 no Defensivo, sem desmaios; (3) Espaço agora ataca o monstro mais
  perto **pelo caminho**; (4) Alfa da lua cheia com 110 de vida (antes 75: caía em 19 s com Combate 18). Lua cheia medida
  com o relógio forçado à noite: 19/40 eventos sem a missão do Tomé e 36/40 com ela (esperado 50% e 85%).
  Arte: `cheer_walk_*` (comemora andando), lápide `deco_crypt_signpost` com "Cripta" entalhado no canvas, `icon_key_m`
  no título do diário.

## Rodada 17
- Comemoração `hero_N_cheer` (0,5 s) ao concluir tarefa do tutorial ou missão; mural `deco_quest_board_ivo`
  ao lado do Ivo (lê-se como placa); ícone `icon_journal_quests` no título "Missões"; tecla **M** abre o diário; cada avanço
  de missão mostra um texto discreto sobre o herói ("Estrada do leste: 3/8"). O fim do tutorial agora recomenda treinar
  nos slimes antes dos javalis. **Robô da segunda hora** (partindo do fim da primeira: Combate 10, espada e armadura tier 2):
  Combate 16 em ~32 min nos lobos; 5 esqueletos de *Ecos da cripta* em ~1 min; Combate 22 em mais ~25 min nos esqueletos.
  A limpeza da cripta pelo robô passou do limite de 15 min (o caminho guloso dele trava nos corredores), então o resto da
  cadeia (*Ecos* → *O guardião desperto*) não foi medido.

## Rodada 16
- Aba Diário com **Missões** (ativas: quem deu, passo, progresso e recompensa; concluídas com o selo
  `icon_quest_done`). Tremor do Golem com o anel `fx_ground_warning_ring` (5 tiles) por cima dos tiles em brasa. Poste
  `deco_training_post` com "Treino" pintado no canvas, a 2 passos do boneco (clicar lê a placa). 6 dicas novas do Ivo.
  **Robô da primeira hora** (personagem novo, sem saber nada além do óbvio): tutorial em 2 min (135 moedas); *Estrada do
  leste* aos ~14 min; Mineração 8 aos 28 min, Ferraria 8 aos 47 min, Corte 8 aos 64 min e *A encomenda do Bento* aos 64 min
  (~2.000 moedas, nível total 45). A encomenda pede três habilidades no 8 e é o objetivo natural da primeira hora.

## Rodada 15
- Áreas de perigo desenhadas com `fx_ground_warning` (1 tile, loop) em cada tile — boneco 3×3, Senhor e
  golpes especiais nos 4 tiles ao redor, tremor do Golem nos tiles a até 2,3 de distância (com o contorno do círculo) —,
  todos os tiles da mesma área na mesma fase. O boneco gira o braço (`swing`) nos 0,3 s finais do aviso. Ícone
  `icon_tutorial_step` no quadro do tutorial e no cartão do Ivo. Apertar qualquer direção cancela a preparação do golpe,
  mesmo contra um obstáculo. Saves de antes do passo do boneco são renumerados ao carregar (campo `tutV`).
  **Robô do tutorial** (mecânicas reais, personagem novo): os 9 passos levam ~2 a 25 s de ação cada (forja e cozinha são os
  mais longos) e rendem ~130 moedas no total, mais as poções. Achado: com a missão do Bento disponível, a banca abria em
  "Encomendas" e o passo "venda algo" ficava escondido; agora só abre lá quando há missão pronta para entregar.

## Rodada 11
- **Blender e Flow:** Bento e Ivo andam pelas folhas `npc_merchant_sheet`/`npc_guard_sheet` (mesmo formato das
  hero_N_sheet; parados continuam no idle/talk do Blender); `mob_wolf_alpha` com `howl` (uivo curto, 1,6× mais rápido, ao entrar
  em combate); `fx_spark_block` no ponto de contato do aparo; `fx_crystal_shards` na morte do Colosso (base no pé, último quadro
  segurado 4 s com fade).

## Rodada 9
- **Blender:** investida com a espada (`hero_N_dash`, no lugar das linhas `dash_*` da `hero_N_anim`); Bento e Ivo
  com `walk` (dão voltas curtas pela praça e param quando o jogador chega a 3 tiles, conversa ou mira neles); `mob_golem` e
  `mob_slime_crystal` com `special`; `fx_smoke_small` nas fogueiras (desenhada em duas camadas, pois a folha é bem rala);
  `fx_leaves` toca uma vez quando a árvore esgota; `well` com `sway` (só o balde).

## Rodada 8
- **Blender:** `deco_board`, `deco_town_sign` e `stall` com `sway` (só papel, tábua e toldo se mexem; o nome
  "Lumeira" é repintado em cada quadro acompanhando a tábua); `rock`, `rock_iron` e `rock_lumita` com `hit` (4 quadros) no
  golpe da picareta, no lugar do tremor em código; `npc_*` com `talk` enquanto a janela do NPC está aberta ou ele fala num balão;
  `hero_N` com `dash_<direção>` na Investida (o rastro continua em código); `hero_N_spin.png` (8 quadros) no Golpe giratório;
  `chest_open` (`open`, impacto no quadro 3: o espólio e a luz saem nesse quadro; depois fica `chest_open.png`).

## Rodada 7
- Selos `badge_ferocious`, `badge_precise`, `badge_steady`, `badge_vigorous`, `badge_bounty`, `badge_masterwork`
  (mapa afixo → selo em `BADGES`, `js/assets.js`) e o portal `deco_town_sign` na entrada sul da vila (o nome é pintado pelo jogo).

## Rodadas 1–14 (resumo)
As rodadas anteriores (e as que não aparecem acima) estão resumidas nas **Novidades** do lobby (`js/lobby.js`, lista `NEWS`, de v0.1 em diante).
