# Valdora (protótipo)

RPG 2D em pixel art para navegador, **original**, feito em HTML/JS puro (canvas, sem build).
Você coleta recursos, funde barras e forja equipamentos, assa peixe, enfrenta monstros e um chefe,
vende tudo na vila e guarda o resto no cofre.

Histórico de cada rodada de desenvolvimento: [`CHANGELOG.md`](CHANGELOG.md).

## Rodar
```
python -m http.server 8080 -d valdora
```
Abra http://localhost:8080. O progresso fica salvo no navegador (localStorage, chave `valdora.save.v2`):
salvamento automático a cada 10 s, ao subir de nível, ao negociar, ao morrer, ao sair da página e em **Salvar e sair**.

## Como jogar
- **Tutorial:** fale com o **Guarda Ivo** (com "!" na praça). São 9 tarefas curtas com recompensa
  (coletar, minerar, fundir, forjar, cozinhar, lutar, esquivar no boneco de treino, vender). A tarefa atual aparece sob a barra de vida.
- **Andar:** WASD/setas ou clique no chão. Clique no minimapa para ir até um ponto.
- **Interagir:** clique em árvores, veios, cardumes (ondulações na água), monstros, fogueiras, fornalha, bigorna,
  cofre, placas e NPCs. Passe o mouse para ver nome, nível exigido e, nos monstros, sua chance de acerto.
- **Mochila:** 20 espaços, itens empilham. Clique numa comida/poção para comer; clique direito larga a pilha no chão.
- **Itens no chão:** os espólios dos monstros caem no chão (drops raros com facho de luz). Clique para pegar ou passe por cima.
  Somem depois de 2 min (raros: 5 min).
- **Cofre** (ao lado da casa vermelha): 48 espaços extras.
- **Ferraria:** na **fornalha**, minério vira barra; na **bigorna**, barras viram a próxima melhoria de arma, armadura e ferramentas
  (alternativa mais barata à loja). O aço usa carvalho (carvão) e a lumita usa cedro. A espada e a armadura chegam à lumita (tier 4).
- **Combate em ticks** (1 tick = 0,5 s): você ataca a cada 3 ticks. Acerto = 60% + 3% × (seu acerto − defesa do alvo), entre 10% e 95%.
  Estilos (aba Combate): **Agressivo**, **Preciso**, **Defensivo**. Monstros agressivos atacam quem chega perto; você revida sozinho.
  Comer atrasa o próximo golpe. Ao desmaiar, você volta à vila e perde 10% das moedas.
- **Cancelar golpe:** começar a andar durante a preparação do golpe cancela o golpe (folha `hero_N_cancel`, 2 quadros);
  durante a finalização, só a interrompe. Q e R cancelados devolvem quase toda a recarga (fica 1,5 s). Robô andando contra o
  Senhor das Ruínas (sem esqueletos): esquiva 92–100% com reação de 0,15 a 0,6 s (antes 61–100%); Golem Ancião 98–100%.
- **Boneco de treino:** a leste da praça (`deco_dummy`, balança com `wobble`). Golpeie e saia da área vermelha 3×3
  em 1,4 s; sair conta como esquiva (passo 8 do tutorial: 2 esquivas, +15 moedas e uma poção de vida). Ícone `icon_dodge_area`.
- **Poeira de impacto:** `fx_dust_slam_light` no Planalto e na toca, `fx_dust_slam` no resto; desenhada na camada do chão
  (antes das entidades), um pouco à frente do pé, com uma cópia leve por cima.
- **Esquiva justa:** a linha `special` toca no ritmo do aviso, para o impacto (quadro 6) cair ~0,1 s antes do fim
  (Senhor e golpes de 2 ticks: ~0,85 s; tremor do Golem Ancião: ~1,35 s). Robô andando de verdade (caminho até 2–3 tiles):
  esquiva 100% do tremor do Golem com até 0,6 s de reação (antes: 0% acima de 0,45 s) e 60–100% do golpe do Senhor
  (as falhas vêm de esqueletos invocados e de golpes já em curso). O golpe do Senhor e dos monstros com "special" marca no chão
  os 4 tiles ao redor; o ícone `icon_dodge` flutua sobre quem está carregando; `fx_dust_slam` (poeira e rachaduras) no impacto.
- **Chefes:** dano normal maior (Senhor das Ruínas 14, Golem Ancião 16). Robô no nível recomendado, 10 lutas por
  estilo: **sem esquivar** do golpe especial, 33–52 s e 2–9 comidas por luta; **esquivando** (sai 2–3 tiles no aviso, com 0,3 s
  de reação), 43–60 s e 0–0,7 comida. O golpe especial é a maior parte do dano: aprender a esquivar é o que vence o chefe.
- **Chefes:** Senhor das Ruínas com 300 de vida (antes 200) e Golem Ancião com 400 (antes 300), ataque +2. Com o
  robô usando Q/R no nível recomendado (Combate 25/31, espada e armadura de tier 3/2, sem esquivar): 34–43 s e 2–3 comidas contra
  o Senhor; 43–50 s e ~6 comidas contra o Golem; nenhum desmaio.
- **Chefe — Senhor das Ruínas** (nordeste): a cada 4 golpes ele prepara um **golpe pesado** (aviso na tela);
  afaste-se um passo para esquivar. Com metade da vida ele invoca 2 esqueletos (que desabam quando ele cai). Renasce 2 min depois.
- **Chefe — Golem Ancião** (alto do Planalto): a cada 3 golpes bate os punhos e marca no chão um **tremor** de raio 2;
  saia do círculo vermelho antes do impacto. Abaixo de 30% de vida entra em **fúria** e ataca mais rápido. Renasce em 2,5 min.
- **Poções de efeito** (vendidas pelo Bento, às vezes caem de monstros): **Força** (+3 acerto, +2 dano) e **Pedra** (+5 defesa),
  90 s cada; o tempo restante aparece sob a barra de vida.
- **Quadro de caçadas** (ao lado da banca do Bento): 3 pedidos de "derrote N monstros" sorteados pelo seu nível de Combate,
  incluindo chefes quando você estiver perto do nível deles. O progresso conta sozinho; volte ao quadro para receber moedas e XP.
- **Acessórios com raridade** (Comum, Raro, Épico): anéis e amuletos, com bônus de acerto, dano, defesa ou coleta.
  Clique na mochila para equipar; clique no acessório (aba Combate) para guardar. Raros e épicos caem de monstros e chefes,
  com facho de luz na cor da raridade.
- **Artesanato** (botão na aba Mochila, funciona em qualquer lugar): Bolsa de couro e Mochila de pele (+4 espaços cada),
  Anel de cobre e Amuleto de âmbar.
- **Recompensas e ritmo:** barra de XP da habilidade a cada ganho, comemoração de nível com a lista do que foi liberado,
  golpes críticos (6%, ou 10% no estilo Agressivo) com pausa de impacto, bônus de XP ao descobrir cada criatura e
  **19 conquistas** com moedas (aba Diário), incluindo *Toca limpa*, *Uivo silenciado* e *Colosso estilhaçado*.
- **Masmorra — Cripta das Ruínas** (escada no nordeste): 3 salas iluminadas por braseiros, esqueletos e guardiões; o baú do fim
  só abre quando todos os mortos caem. A cripta se refaz a cada visita.
- **Dia e noite** (um dia a cada 10 min): à noite, fogueiras, fornalha, janelas, cristais de lumita e a lanterna do herói iluminam o mundo.
- **Tomé, o bardo** (na praça, junto à fogueira): canções com dicas e, por 10 moedas, o efeito **Inspiração**. Os NPCs falam em balões de vez em quando.
- **Santuário de Lumeira** (na praça, ao lado do poço): oferte moedas para ganhar títulos de prestígio (1.000, 4.000, 10.000 e 25.000 moedas). O título aparece sobre o nome e muda a cor dele; os dois mais altos dão halo à noite e faíscas de lumita. Depois da Lenda, a **chama votiva** (1.000 moedas = 10 min, até 2 h guardadas) mantém uma chama com o herói e aviva as velas. Não há bônus de combate.
- **Afixos:** acessórios que caem de chefes, da cripta e do baú podem vir com 1 ou 2 afixos (Feroz, Certeiro, Firme, Vigoroso,
  da Fartura). Peças com afixo são únicas (não empilham), brilham em dourado e valem o dobro no Bento.
- **Habilidades de combate** (barra no rodapé; teclas **Q/E/R** ou toque no botão): **Golpe giratório** (Combate 5, recarga 8 s:
  acerta todos os monstros ao redor), **Investida** (Combate 12, 12 s: avança até 5 tiles até o alvo, deixa um rastro e atordoa)
  e **Golpe esmagador** (Combate 20, 15 s: carga curta, acerto garantido com dano ×2,2, crítico e atordoamento). A recarga
  aparece como um relógio sobre o botão; monstros atordoados mostram estrelas e não atacam.
- **Campanha "Os Marcos de Lumeira"** (rodada 78): depois do tutorial, o Guarda Ivo começa o **Ato I, Rachaduras**: fendas
  brilhantes nos Campos, o Marco dos Campos para consertar e defender e o bando do **Capataz Rasgo** no Bosque. Cenas curtas de diálogo
  (clique/Espaço/F avançam, Esc pula; NPCs falam do lado esquerdo da caixa e o herói do direito). O objetivo atual tem "!" ciano no mapa, losango no minimapa e uma seta na borda da tela.
  Marcos acesos curam mais rápido por perto (**bênção do marco**) e acalmam os monstros da região em volta (goblins no Bosque, lobos na Mata, esqueletos nas Ruínas, golems no Planalto) e, no fim do ato, viram **pedras de passagem** (viagem entre o
  santuário e os marcos acesos). **Ato II, A Mata que Escuta** (Combate 11+): a raizeira **Juna** (cabana na entrada da Mata Sombria),
  o cristal engolido pelo Alfa da lua cheia e o ritual noturno do Marco da Mata; depois dele, os lobos não atacam por conta própria
  perto do marco. A Juna ensina **alquimia** (Tônico de vigor, Elixir do lobo, Unguento de casca; XP de Culinária). O Diário mostra
  os cinco atos. **Ato III, Os Mortos Lembram** (Combate 18+): a cartógrafa **Odília**, as estelas com runas das Ruínas, o juramento
  da cripta e o Senhor das Ruínas; depois, os esqueletos não atacam por conta própria perto do Marco das Ruínas. **Ato IV, O Coração de Lumita** (Combate 26+): o garimpeiro
  **Brás**, a lanterna de lumita, os golems e o Golem Ancião; o Coração de lumita aceso acalma golems e slimes de lumita perto dele.
  **Ato V, Além do Selo** (Combate 34+; fim da campanha na rodada 83: ecos de cristal, a Serpente e o selo refeito; eco semanal da Serpente): a **Fenda Cintilante**, masmorra no alto do Planalto com a Serpente de Lumita
  no fundo. Ela dá fragmentos cintilantes e barras estelares para o **equipamento nível 5** (Lâmina e Couraça estelares), que sai da
  bigorna com 1 ou 2 modificadores sorteados.
- **Companheiro, o filhote da lua** (rodadas 95–96, `js/rules.js` `PET`, bloco "companheiro" do `js/game.js`): depois de *O uivo sob a lua*,
  a Juna entrega um filhote órfão (cena `c2_filhote`) e o jogador escolhe o nome (até 14 letras). Ele segue o herói e morde o alvo
  dele ou quem o ataca (a cada 4 ticks; acerto 6 + 1,6 × vínculo, dano 1 a 2 + vínculo/5; não dá XP ao herói). Vínculo 1–20 pelos
  abates dele; fases filhote/jovem/adulto nos vínculos 1, 7 e 14 (folhas `pet_moon_1..3`). Vida 16 + 3 × vínculo, defesa 2 + vínculo;
  regenera como o herói. Monstro que ele mordeu por último o ataca (ao lado dos dois, só 10% das vezes, `PET.draw`); nenhum monstro
  entra no tile dele. Ao cair, corre para a vila e descansa 2 min (vida e descanso ficam no save). Painel: ícone, nome e vida;
  clique abre a janela (retrato, vínculo, força e nome). Medido com robô no vínculo 20: −20% tempo e −30% comida no eco do Senhor,
  −22% tempo e −27% comida no Ato V (Fenda); −16%/−17% no eco do Golem e −14%/−18% no da Serpente (rodada 97).
  Ao descansar, ele dorme enrolado perto da fogueira, nas três fases (linha `sleep`, rodada 98). Tremores (golem, Serpente) o
  acertam a até 2,3 tiles, e ele sai do círculo durante o aviso (e espera fora dele). **Ficar/seguir** (rodada 99): tecla G ou botão
  na janela; esperando, ele só morde quem está ao lado e volta a seguir sozinho se o herói passar de 10 tiles (sem efeito no vínculo). Rodada 97: missões da Juna por fase (`f1_dentes`,
  `f2_faro`, `f3_uivo`, com `minBond` 1, 7 e 14; o passo `petkill` conta os abates em que a última mordida foi dele), aviso quando
  ele cresce e a conquista *Alfa de estimação* (vínculo 20).
- **Casa do herói** (rodada 100, regras em `js/home.js`): lote 6 × 5 em (38, 45), a sudoeste da vila. Depois do Ato II, a banca do Bento
  vende a escritura (1.500 moedas); a obra pede 30 madeiras de carvalho, 10 de cedro e 12 barras de ferro (clique no lote). Pronta, a janela
  "Casa" (clique na casa ou num pedestal) expõe até 9 dos 12 troféus (chefes, os três ecos, 4 relíquias entregues uma vez e os cinco
  marcos) e tem a cama: **Bem descansado** por 20 min a cada 30 min de jogo, +2 de vida máxima por troféu exposto e, com 5 ou mais
  troféus, 1 de vida a cada 3 ticks fora de luta (sem isso, a cada 4; `regenTicks`). O filhote caído dorme na cama de palha do
  quintal, e cochila nela quando o herói fica parado a até 4 tiles da cama (acorda ao sair ou se houver briga). **Visitas** (rodada 102):
  com o herói a até 5 tiles da cama e fora de luta, no máximo uma a cada 8 min de jogo, um NPC comenta um troféu exposto (12 falas,
  2 por NPC, `ValdoraHome.VISITS`), no registro com o retrato dele e um texto curto sobre a casa; nunca o mesmo NPC duas vezes seguidas. Banco (200 moedas) e vaso de
  hortelã (presente da Juna, *Uivo próprio*) são enfeites. Save: `player.home`.
- **Caçada do dia** (quadro de caçadas): um pedido por dia, com sequência de dias seguidos (até +50% e prêmios no 3.º e no 7.º dia).
  **Bestiário** dá prêmios ao descobrir 5, 10, 15 e 20 criaturas (`js/daily.js`).
- **Missões com história:** depois do tutorial, o **Guarda Ivo** oferece *Ecos da cripta* (esqueletos → baú da cripta → relato) e
  *Estrada do leste* (8 goblins → aviso; recompensa: 2 poções de força), **Tomé** oferece *A canção do Ancião* (3 tucunarés
  assados → Golem Ancião → canção completa) e o **Bento** oferece *A encomenda do Bento* (5 barras de ferro + 10 carvalhos;
  a banca abre direto na aba Encomendas quando há missão dele). "!" marca missão nova, "?" missão
  pronta para entregar; os passos aparecem no quadro verde sob a vida. Recompensa: moedas, XP e um acessório com 2 afixos.
- **Passivas dos estilos:** **Agressivo** — *Sangramento* (18% dos acertos: 3 pulsos de 15% do dano máximo em 1,5 s, com respingo);
  **Preciso** — *Olho de águia* (crítico 14% e bônus do crítico até o dano máximo inteiro); **Defensivo** — *Bloqueio*
  (20% de chance de aparar um golpe, com animação de guarda, e receber metade do dano). Medição da rodada 10 (robô, 120 duelos
  por estilo, mesmo monstro): o Agressivo mata ~3–14% mais rápido que o Preciso; o Defensivo leva 25–38% menos dano e mata ~25% mais devagar. Regras em `js/rules.js`; a passiva aparece na aba Equip. e na ficha.
- **Lua cheia** (evento noturno): o **Alfa da lua cheia** e três lobos surgem perto de uma toca da Mata Sombria;
  o Alfa **uiva** quando o jogador chega a 8 tiles e só então ataca; derrote-o em 3 min (+150 moedas, 400 xp de Combate e uma
  Presa lunar). A Mata Sombria tem 12 lobos. Com a missão *A balada da lua cheia* (Tomé: derrotar o Alfa 2 vezes) ativa, a
  Lua cheia sai em 85% dos eventos noturnos.
- **Zona segura por mapa:** a vila só protege no mapa de cima; dentro das masmorras as mesmas coordenadas não
  contam. Monstros de masmorra não somem quando perdem o jogador de vista (só os de evento).
- **Toca:** entrada `deco_den`, saída `deco_den_exit`, chão `den_floor`/`den_floor_2` (o claro avança
  sobre o escuro com borda pixelada) e 8 enfeites `deco_bones_1..3` com balanço leve; o golpe especial do Senhor das Ruínas
  mostra a espada fincada no chão nos quadros 6–7.
- **Matilha:** os lobos levantam com a linha `wake`; os acordados pelo uivo do Alfa passam a ter o Alfa como
  "casa" e correm até ele. Tochas `deco_den_torch` (chama em `flicker`) no lugar das fogueiras da toca. O Tomé passeia (linha
  `walk` do Blender, de frente), como o Bento e o Ivo.
- **Lobos dormindo:** na Toca, os lobos comuns dormem (linha `sleep`) e acordam com um susto (linha `hit`) quando
  o jogador chega a 2 passos, quando apanham ou quando o Alfa da lua cheia uiva (raio de 24 tiles).
- **Toca dos Lobos** (masmorra): entrada na Mata Sombria, liberada ao concluir *A balada da lua cheia*.
  3 salas iluminadas por fogueiras, 6 lobos, 2 lobos alfa e o Alfa da lua cheia (que uiva ao ver o jogador) guardando o baú
  (90–180 moedas, peles, Presa lunar, poções e às vezes um Anel do caçador). Refeita a cada visita, como a cripta.
- **Fúria e ecos:** abaixo de 30% de vida os chefes ficam furiosos (mais rápidos; o Senhor das Ruínas ganha aura roxa e ergue 3 esqueletos).
  Depois de vencer os dois chefes, o **Quadro de caçadas** desperta os **ecos semanais** (versões mais fortes, uma vitória por semana)
  que deixam o *Eco cristalizado*, usado no **Amuleto dos ecos** (artesanato).
- **Mini-chefes:** Colosso de lumita (cripta, só durante a missão *O guardião desperto*, que o Ivo oferece depois de *Ecos da cripta*)
  e o Alfa da lua cheia; ambos mostram a barra de vida no topo e brilham à noite.
- **Golpe especial dos chefes:** a carga começa junto com o aviso na tela e o golpe acerta no 6.º quadro da animação; saia do
  alcance (ou do círculo do tremor) antes disso para esquivar. O **Golem de musgo** e o **Slime de lumita** também têm golpe
  especial (a cada 4 ataques, com aviso).
- **Selos:** cada afixo tem seu selo (Feroz, Certeiro, Firme, Vigoroso, da Fartura) e a forja perfeita tem o selo de obra-prima.
  Aparecem no canto do item na mochila, no boneco, nas linhas de equipamento e na ficha; passe o mouse para ver a dica com cada afixo.
- **Ficha do personagem** (tecla P ou botão na aba Equip.): atributos, crítico, coleta, habilidades, equipamento com bônus e feitos.
- **Celular:** tocar = clicar; segurar o dedo faz o herói andar até ele; botões ⚔ (atacar o mais próximo) e ✚ (comer).
  Tocar num item da mochila abre o menu **Usar/Equipar · Largar no chão · Cancelar** (peças com afixo mantêm os afixos no chão).
  Segure o dedo ~0,5 s sobre um item, uma habilidade ou a passiva da ficha para ver a dica (o toque longo não usa nem larga o item).
  Em telas estreitas, o botão "Ocultar/Mostrar painel" recolhe o mapa e as abas (a escolha fica guardada no navegador).
- **Obra-prima:** cada forja tem ~12% de chance de sair perfeita (★), com bônus extra.
- **Atalhos:** F usa/conversa com o que estiver a até 2 tiles (NPC, estação, recurso, item no chão; a dica aparece no rodapé, ex.: "F falar com Bento") · I mochila · K níveis · C equipamento · J diário · P ficha · O artesanato · Q/E/R habilidades · 1 come a melhor comida · 2/3/4 poções · Espaço ataca o monstro mais próximo · Esc fecha janelas.
- **Opções (⚙):** volume, tremor de tela, **zoom do mundo** (automático: ~14 tiles na altura, para telas grandes não deixarem o mundo em miniatura) e **tamanho da interface** (automático pela altura da janela).
- **Eventos de mundo** (a cada ~4–6 min): **Invasão goblin** na estrada leste (derrote os 5 em 3 min: +100 moedas e poção de força)
  e **Cardume dourado** num lago fundo (6 peixes dourados de 60 moedas, por 90 s).
- **Som e opções:** botão ⚙ ao lado de "Salvar e sair" — volume de efeitos, de música e tremor de tela (guardado no navegador).
  Todos os sons e a música são **sintetizados pelo próprio jogo** (WebAudio), sem arquivos de áudio e sem licenças de terceiros;
  a música muda de clima conforme a região (cada uma com modo, progressão de acordes, baixo, pad, arpejo, melodia e percussão próprios).
- **Habilidades:** Corte, Mineração, Pesca, Culinária, Ferraria, Combate e Vitalidade (vida máx. = 18 + 2 × nível). Cada ponto de dano dá
  2,55 de XP de Combate e 1,7 de Vitalidade no Preciso e no Agressivo (1,3 e 1,9 no Defensivo); as recompensas de Combate (missões,
  caçadas) levam Vitalidade na mesma proporção, até 1:1. No Preciso, Combate 38 vem com Vitalidade ~32.
  XP para o nível N = 15 × (N−1)^2,5 (nível 10 ≈ 3,6 mil; 20 ≈ 23,6 mil; 30 ≈ 68 mil).
- **Encomendas:** o Bento faz 3 pedidos por vez que pagam acima do preço de venda e dão XP; pedidos do seu nível saem mais e os
  antigos crescem (caixote com seta marca as encomendas grandes).
- **Diário:** missões (prontas para entregar primeiro), conquistas e bestiário com monstros abatidos, taxas de drop (cada drop aparece
  depois de obtido), região, selo de chefe e se o monstro renasce e em quanto tempo.
- **Níveis recomendados:** cada região mostra o Combate recomendado ao entrar; abaixo dele, o letreiro e o registro avisam o perigo
  (matilhas na Mata Sombria e na Toca; caveira nas outras). O aviso também aparece ao carregar o jogo já dentro da região.
- **Comida:** cada comida mostra quanto cura (coração na mochila e no botão ✚ do celular). A carne de javali assa a partir de
  Culinária 1 (carne assada, cura 12); com uma madeira na mochila vira **espetinho** (cura 15). O tucunaré assado (Pesca e Culinária 10) também cura 15. A chance de queimar aparece ao começar a assar (24% no nível
  exigido, zero 8 níveis acima) e a frigideira marca na mochila os crus que já não queimam.
- **Fim de jogo:** Couraça de lumita (armadura tier 4); abaixo de 1/3 da vida os chefes entram em **fúria**; depois de vencer os dois
  chefes, o quadro de caçadas desperta os **ecos semanais** (uma vitória por semana), que deixam o Eco cristalizado para o
  **Amuleto dos ecos** (artesanato).
- **Vila:** o Ivo bate continência, o Bento faz joinha e o Tomé faz reverência quando você entrega uma missão deles; o Tomé às vezes
  toca sentado no tronco da fogueira. Dicas do Ivo aparecem no registro a cada 4 min, na janela dele, na tela inicial e no botão
  de dica do celular.
- **Teclado:** Tab percorre botões, abas e os espaços da mochila e do cofre; Enter/Espaço usa o que está em foco (o foco aparece com
  contorno dourado); Esc fecha janelas. Sem foco num botão, Espaço ataca o monstro mais perto.

## Mundo (96 × 72 tiles)
| Região | Nível | Recursos | Monstros |
|---|---|---|---|
| Vila de Lumeira (centro) | segura | fogueira, fornalha, bigorna, cofre, Bento, Guarda Ivo | — |
| Campos de Lumeira | 1-6 | Árvore (Corte 1), Cobre (Mineração 1), Lambari (Pesca 1) | Slime (nv 2), Slime azul (nv 4) |
| Bosque dos Carvalhos (leste) | 6-12 | Carvalho (Corte 8), Ferro (Mineração 8), Tucunaré (Pesca 10), carne de javali | Javali (nv 6), Goblin saqueador (nv 9, acampamento) |
| Mata Sombria (sul) | 12-20 | Cedro-rubro (Corte 18) | Lobo sombrio (nv 12), Lobo alfa (nv 15, raro) |
| Ruínas Esquecidas (nordeste) | 15-28 | Ferro | Esqueleto errante (nv 16), **Senhor das Ruínas** (chefe, nv 28) |
| Planalto de Lumita (oeste) | 18+ | Lumita (Mineração 18) | Golem de musgo (nv 20), Slime de lumita (nv 18), **Golem Ancião** (chefe, nv 34) |

Todos os números (itens, preços, receitas, níveis, monstros, drops, tutorial) ficam em **`js/data.js`**.

## Animação
- **Monstros e herói** usam folhas renderizadas no Blender (`assets/flow/anim/*_anim.png`, metadados em `js/anim_data.js`):
  idle, walk, attack (com quadro de impacto), hit e death. Cada célula cobre 1,6× o sprite, com os pés a 12,5% da base;
  o jogo reduz cada folha uma única vez para o tamanho exibido e desenha direto da região do quadro.
- **Máquina de estados** por entidade: idle → walk → attack → hit → death. O ataque não é cortado pela caminhada; o hit não
  interrompe ataque nem morte; a morte toca uma vez e o corpo some em fade. O tick de combate decide se acerta e o quadro de
  impacto decide quando o dano, o número e as faíscas aparecem (com pausa de impacto).
- **NPCs** (Bento, Ivo e Tomé) com idle animado. **Guardião da cripta** com arte e folha próprias.
- **Herói:** idle, hit e morte (nas 4 direções) pela folha anim; caminhada pela `hero_N_sheet` (quadro escolhido pela distância percorrida);
  cada ação tem a sua folha (3 quadros × 4 direções): `hero_N_attack` (espada), `hero_N_chop` (machado), `hero_N_mine` (picareta),
  `hero_N_hammer` (martelo) e `hero_N_fish` (arremesso; o último quadro fica segurando a vara enquanto espera o peixe).
- **Movimento:** velocidade constante entre tiles com arrancada e frenagem suaves, passos encadeados sem parada, giro antes de
  andar, poeira ao arrancar e ao virar. **Câmera** com mola e antecipação na direção do movimento. Cada golpe dá um "chute" curto na câmera na direção do impacto.
- **Chão:** a grama projeta sombra curta sobre terra, pedra e areia; manchas largas de tom quebram a grama. Margens de lago e borda da praça seguem um campo suave (`makeField`), em curvas, com espuma e ondas; o centro de cada tile não muda de lado (tudo no cache de blocos de `js/terrain.js`).
- **Texto corrido em pixel art:** `assets/fonts/valdora_pixel.ttf` (família "Valdora Pixel", nítida em 12/24/36 px), em toda a interface,
  no site e nos textos do canvas (rodada 79). Use só 12, 24 ou 36 px; a interface e o lobby usam só zoom inteiro (1× ou 2×, rodada 80).
- **Títulos e números em pixel art:** `assets/ui/font_title.png` (`UI.titleHTML`: faixas, nível, janelas) e `assets/ui/digits.png` (números de dano), tingidos por multiplicação.
- **Golpe de frente/costas:** 4 quadros do Blender (`hero_N_strike4`, ações `strike4d`/`strike4u`) e um arco largo da espada desenhado no código.
- **Chefes:** linha extra `special` (8 quadros, 8 fps, impacto no quadro 6) sincronizada com o aviso do golpe pesado/tremor.
- **Herói comendo:** linhas `eat_<direção>` tocam por 0,5 s ao comer ou beber parado.
- **Efeitos fx (Blender, `fx: true`, sem a margem dos personagens):** `fx_water`/`fx_water_deep` em cada tile de água (fase
  `(x + y) % 12`; lagos de cardume fundo usam a água funda), `fx_fishspot`/`fx_fishspot_deep` centrados no cardume (o cardume
  dourado ganha anéis dourados por cima) e `fx_smoke` na boca da chaminé de cada casa (origem a 12% da base, fase por casa).
- **Cenário vivo (Blender):** árvores (`tree`, `tree_oak`, `tree_cedar`), `deco_bush` e `deco_flowers` têm a linha `sway`
  (16 quadros, 6 fps, em loop: só a copa/folhagem se mexe, o tronco fica parado); `campfire` e `deco_brazier` têm `flicker`
  (8 quadros, 10 fps). Cada instância começa num quadro diferente (pela posição), na vila o balanço é um pouco mais lento, e a
  árvore golpeada acelera o balanço por um instante. Tocos e entulho são estáticos. Partículas, luz e câmera continuam no código.
- Linhas extras por arte (`sway`, `hit`, `talk`, `walk`, `special`, `howl`, `wake`, `sleep`, `rise_up`, `open`...) e em que
  rodada cada uma entrou: ver `CHANGELOG.md`.
- Sem folha animada, o jogo usa a animação procedural (respiração, saltos com squash/stretch, bote, queda).

## Testes
Abra `http://localhost:8080/tests.html`: confere as regras de `js/rules.js` (curva de XP, afixos, atributos, coleta), a integridade dos dados (ícones, drops, receitas, folhas animadas), os módulos
de caminho, efeitos, ruído e luz, e mostra uma tabela estimada de **XP e moedas por hora** por atividade. Na rodada 7 a tabela foi conferida com um robô jogando
10 min simulados por atividade: a coleta bate com a estimativa (±15%); o combate rende 1,6–2,4× a estimativa em XP (a
estimativa supunha 9 s de procura entre monstros), mas consome muita comida. Na rodada 8 o XP de combate caiu 15% e a tabela
passou a supor 4 s de procura (o robô gasta ~1 s; uma pessoa, 3–5 s).

## Trocar imagens
- Todas as artes estão registradas em `js/assets.js` (`ASSETS`). Substitua o arquivo mantendo o nome **ou** aponte a chave para outro arquivo.
- `SPRITE_SIZE`: tamanho de cada arte em tiles (a arte é desenhada alinhada pela base).
- Personagens: lista `HEROES` (retrato + folha de animação 3 quadros × 4 direções, formato em `HERO_SHEET`).
- `ANIM`: animações de quadros (água, fogueira). Cardumes, brilho do fogo, fagulhas e decoração miúda do chão são desenhados por código.
- `tint`/`scale` em `js/data.js` continuam disponíveis para criar variações de monstros sem arte nova (hoje nenhum monstro usa).
- `gen.py` regenera as artes SVG antigas (`assets/*.svg`, usadas só com `USE_FLOW_ART = false`). Não toca em `assets/flow/`.

## Estrutura
Sem build: cada arquivo é um `<script>` comum, carregado nesta ordem pelo `index.html`. Os módulos do jogo expõem um objeto
`window.ValdoraX` com `create(api)`; o `game.js` cria cada um passando só o que ele precisa (funções e *getters* do estado).

**Página e dados**
- `index.html` — site/lobby (Jogar, Como jogar, Novidades), HUD e a ordem dos scripts. `css/style.css` — lobby, HUD e janelas (responsivo até ~375 px).
- `js/assets.js` — registro de artes, tamanhos (`SPRITE_SIZE`), heróis e selos. `js/data.js` — tabelas de jogo (itens, recursos,
  monstros, equipamento, receitas, missões, tutorial, dicas, conquistas). `js/anim_data.js` — metadados das folhas do Blender (gerado).
- `js/rules.js` — regras puras (XP, acerto, crítico, passivas, afixos, atributos, coleta), usadas pelo jogo e pelos testes.
- `js/world.js` — desenho do mundo: regiões, lagos, placas, acampamento, onde nasce cada monstro e as masmorras (`DUNGEONS`).

**Motor**
- `js/terrain.js` — chão em blocos 16×16 cacheados, transições entre terrenos e ruído. `js/path.js` — busca de caminho (BFS).
- `js/fx.js` — partículas, faíscas, poeira, ondas de choque e textos flutuantes (números de dano por tipo, em faixas que não se sobrepõem). `js/ambient.js` — sombras de nuvens, partículas de vento por região, vagalumes e vinheta (rodada 66). `js/lighting.js` — dia/noite e luzes. `js/audio.js` — sons e música sintetizados.
- `js/render.js` — desenho das folhas do Blender (`drawAnim`, `drawFx`), balanço do cenário, água, cardumes, fumaça e efeitos de toque único.
- `js/camera.js` — câmera com mola e antecipação. `js/overlay.js` — minimapa e luzes da noite/masmorra.

**Mundo vivo**
- `js/mobs.js` — IA dos monstros (perseguir, atacar, golpe especial com aviso, uivo, dormir/acordar, sair da terra) e máquina de estados.
- `js/actors.js` — desenho dos monstros e corpos. `js/hero.js` — desenho do herói (todas as folhas de ação).
- `js/scenery.js` — desenho dos objetos do mapa (casas, estações, NPCs, cenário animado, baú, boneco, marcas).
- `js/events.js` — eventos do mundo (invasão goblin, cardume dourado, Lua cheia).

**Sistemas de jogo**
- `js/gather.js` — corte, mineração, pesca e culinária. `js/crafting.js` — telas da fornalha, bigorna e artesanato.
- `js/shop.js` — banca do Bento. `js/quests.js` — missões (também as da campanha: conversa com outro NPC, entrega num marco, cenas).
  `js/dialogs.js` — janelas fixas e ficha do personagem.
- `js/campaign.js` — a campanha no mapa: marcos, fendas, onda, Capataz, bênção do marco, pedras de passagem e indicadores de objetivo
  (regras puras em `ValdoraCampaign.rules`, testadas). `js/scene.js` — cenas de diálogo (falas em `VD.SCENES`).

**Interface e entrada**
- `js/ui.js` — ícones, selos, dicas que seguem o ponteiro, painel recolhível e textos pintados em placas.
- `js/hud.js` — painel lateral (vida, moedas, tarefa/missões e as abas). `js/input.js` — teclado. `js/pointer.js` — mouse, toque e minimapa.

**Cola**
- `js/game.js` — estado do jogo e o laço: mundo e masmorras, ticks, combate do herói e habilidades, tutorial, salvamento,
  janelas e a ligação entre os módulos acima (~1.800 linhas, eram ~2.200 na rodada 6).
- `js/lobby.js` — tela inicial, prévia do herói, jogo salvo (pergaminho com as 3 últimas conquistas), faixa do título ondulando
  (folha `fx_banner_wave` como sprite CSS; o jogo não carrega folhas com `tiles: 0`) e dica do Ivo (usa `window.ValdoraGame`).
- `tests.html` + `js/tests.js` — testes de regras, dados, folhas e módulos, mais a tabela de equilíbrio.

## Pacote de arte em alta resolução (Google Flow)
As artes em `assets/flow/` foram geradas no Google Flow com prompts originais (pixel art 32-bit, fundo magenta) e processadas pelos scripts em `../tools/`:
- `cutout.py` remove o fundo magenta e enquadra o sprite; `split.py` divide folhas baixadas; `build_art.py` gera os sprites a partir de `../art/raw/`.
- `icons.py` recorta as folhas de ícones; `walk.py` monta as folhas de caminhada (3 quadros × 4 direções, 64 px por quadro); `tiles.py` gera os tiles de chão sem costura e o fundo do lobby.
- Em `js/assets.js`, `USE_FLOW_ART = true` usa os PNGs; `false` volta aos SVGs de `gen.py`. `gen.py` só escreve em `assets/*.svg` e não toca em `assets/flow/`.
- Em uso também: `mob_goblin`, `mob_skeleton`, `mob_boss_ruins`, `npc_guard`, `barrel`, `deco_bush`, `deco_flowers`, `deco_sign`, `deco_pillar`,
  `deco_ruin_wall`, `deco_board`, `furnace`, `anvil`, `chest`, `tool_hammer`, `item_fragment`, `item_meat*`, `item_potion_strength`,
  `item_potion_stone`, `mob_boss_golem`, `mob_slime_blue`, `mob_slime_crystal`, `mob_wolf_alpha` e os lingotes `item_bar_*`.

## Animações no Blender
As animações de monstros e heróis (parado, andar, atacar, levar golpe, morrer) são geradas no Blender 5.2 a partir das artes de `assets/flow/`:
- `../tools/blender_anim.py` roda dentro do Blender (sem interface): transforma cada sprite numa malha 2D subdividida e deforma os vértices quadro a quadro com rigs por tipo (`slime`, `quad` para quadrúpedes, `biped`, `heavy`, `hero`, `front`). Renderiza em câmera ortográfica (Workbench, sem anti-alias) para manter o pixel art nítido.
- Filhote da lua (rodadas 96–97): `pet_moon_1..3` com rig `quad`. Na fase 1, o idle, o golpe e a queda vêm da arte sentada; a
  caminhada e a mordida, de `pet_moon_1_stand` (perna curta: `job["leg"] = {"h": 0.18, "k": 0.7, "soft": 0.08}`: faixa, amplitude
  e passagem suave entre o par da frente e o de trás; `CLEAN_FRAMES` tira pedacinhos soltos); a linha `sleep` de cada fase, de
  `pet_moon_N_sleep`. Sem a arte em pé, a reserva é o jovem reduzido a 68% (`PET_CUB_K`).
- `../tools/anim_pack.py` chama o Blender, monta as folhas em `assets/flow/anim/*_anim.png` e gera `js/anim_data.js` (`window.ANIM_SHEETS`).
- Para refazer tudo depois de trocar uma arte: `python -I tools/anim_pack.py`, na pasta `testes` (leva cerca de 15 s).
- `../tools/blender_fx.py`: efeitos de cenário no Blender (água com UV ondulando sem costura, cardume com anéis e peixe saltando, fumaça de chaminé). Anéis e fumaça usam o EEVEE com emissão e alfa real; o resto usa o Workbench, que deixa o pixel nítido. Também é chamado por `anim_pack.py`.
- Cenário animado pelo Blender: folhagem (só a copa balança, o tronco fica parado), chamas, placas e toldo ao vento, pedras golpeadas, baú abrindo, NPCs falando.
