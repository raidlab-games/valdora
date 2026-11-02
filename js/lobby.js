// Tela inicial do Valdora: abas (Jogar, Como jogar, Novidades), prévia animada do herói,
// cartão do jogo salvo e criação de personagem. Usa window.ValdoraGame (definido em game.js).
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const G = window.ValdoraGame;
  // rodada 111: o jogo não carregou (em geral, cópia velha da página presa no cache logo depois de uma publicação):
  // recarrega uma vez com um endereço novo, que traz a página e os scripts atuais; se mesmo assim falhar, avisa
  const fresh = new URL(location.href);
  if (!G) {
    if (!fresh.searchParams.has("fresh")) { fresh.searchParams.set("fresh", Date.now()); location.replace(fresh.href); }
    else addEventListener("DOMContentLoaded", () => { const m = document.createElement("p"); m.className = "acct-msg err"; m.textContent = "O jogo não carregou. Aperte Ctrl + F5 para recarregar."; document.body.prepend(m); });
    return;
  }
  if (fresh.searchParams.has("fresh")) { fresh.searchParams.delete("fresh"); history.replaceState(null, "", fresh.href); }
  const LORE = {
    hero_1: "Veio das montanhas do norte. Confia no aço, no escudo e na própria teimosia.",
    hero_2: "Cresceu na mata de Lumeira. Acerta o lobo antes que ele chegue perto e nunca sai sem a aljava cheia.",
    hero_3: "Estuda as pedras de lumita e os segredos que dormem nas ruínas.",
  };
  const NEWS = [
    ["v1.15", "Mercado da Casa de Leilões", ["A Celeste agora atende atrás de um balcão feito com a mesma madeira, pedra e ferragens das casas da vila",
      "O mercado abre em tela cheia, com busca e filtros por categoria, classe, raridade, nível e preço",
      "Venda seus itens escolhendo a quantidade, o preço e a duração do leilão (o jogo mostra a chance de vender)"]],
    ["v1.14", "Casa de Leilões caprichada", ["O martelo da Casa de Leilões foi refeito: montado na cumeeira, no mesmo desenho da casa",
      "A leiloeira Celeste agora fica na frente da casa: clique nela para abrir o leilão"]],
    ["v1.13", "Casa de Leilões e guardiões das vilas", ["Casa de Leilões na Lumeira: a leiloeira Celeste, atrás do balcão, tem lotes novos a cada 15 minutos e leiloa os seus itens",
      "Cada vila nova tem um guardião como o Ivo, com missões do bioma inteiro até derrotar o chefe: Lúcio (Breu), Tobias (Escarpa), Samira (Oásis) e Edda (Degelo)",
      "Cada toque em W/A/S/D anda só 1 quadrado; segurando a tecla, o herói continua andando"]],
    ["v1.12", "Ninjas encapuzados e menu dos itens", ["Ninjas encapuzados podem surgir enquanto você farma ou luta — bem mais com a mochila pesada. Eles têm o seu nível, não desistem e só somem quando você entra numa vila",
      "Clique num item da mochila para ver as opções: equipar, comer, beber, assar, guardar no cofre, vender, examinar, largar 1 ou tudo",
      "Passe o mouse num item para ver o resumo: o que ele dá e quanto ganha ou perde em relação ao que você está usando",
      "Monstros perseguem sem parar entre os passos e batem assim que chegam ao seu lado"]],
    ["v1.11", "Mochila, peso e itens para todas as classes", ["Mochila no personagem: mais espaços e mais carga (a de pano o Bento vende; as outras você cria no Artesanato)",
      "Peso: tudo o que você leva pesa. A barra embaixo do retrato mostra a carga; pesado demais, o herói anda igual a uma tartaruga",
      "Cada tipo de monstro solta peças próprias no nível dele, com itens das três classes (escudo, flechas, orbe e códice) até o nível 150",
      "Item da região: qualquer monstro de uma região pode soltar o item dela (ex.: Floco eterno na neve), usado nas mochilas e nos conjuntos",
      "Monstros agressivos mostram a vida com borda vermelha; plantas e arbustos não bloqueiam mais o caminho",
      "Pesca mais lenta e letreiros de troca de mapa com metade do tamanho"]],
    ["v1.10", "Alcance do cacto e da coleta", ["O cacto só espeta quando você anda contra ele; passar ou parar ao lado não machuca mais",
      "Cacto, rochas e minérios ficam no tile certo, na altura dos pés do herói",
      "Clicar em qualquer parte do cacto, minério ou planta já seleciona (antes só a área abaixo dele)",
      "Para coletar, o herói para encostado de lado ou de frente, e o F só aparece quando você está colado no recurso"]],
    ["v1.09", "Montanhas e minérios ligados ao ambiente", ["Paredões das montanhas refeitos em 3D: rocha fraturada em colunas, a beirada de cima com o chão do lugar (capim, mata, areia, neve) e cascalho no pé",
      "Escadas talhadas na própria rocha, e o pé e o topo da escada ficam sempre livres",
      "Todos os minérios refeitos: rocha da região saindo do chão com o minério à mostra — veios de cobre, ferro, mitril e ouro; cristais de lumita, ametista, adamante, rubi, gelo eterno e gelo astral; lascas de obsidiana",
      "Encostar num cacto espeta: um pouco de dano e som de espinho (espinho machuca, mas não mata)"]],
    ["v1.08", "Contas, servidores e personagens", ["Agora você entra com uma conta: usuário e senha ligados a um e-mail (dá para entrar com o usuário ou com o e-mail)",
      "Depois de entrar, escolha o servidor e então o personagem — até 4 por servidor, cada um com o próprio progresso",
      "O herói salvo neste navegador pode ser trazido para um servidor com um clique",
      "As estradas do Campo agora seguem até as outras vilas, com curvas, em vez de pararem na borda do mapa antigo; as saídas que sobravam levam a acampamentos",
      "A borda do Campo com os outros biomas ficou ondulada, sem linha reta",
      "Rochas e cactos novos, feitos em 3D: saem do próprio chão, com sombra, pedrinhas e capim em volta"]],
    ["v1.07", "Entrada sem travar", ["Corrigido o congelamento ao entrar: com chuva, um efeito dava erro e parava o jogo antes da interface aparecer",
      "Um erro num efeito visual nunca mais congela o jogo",
      "Depois de cada atualização, só as artes que mudaram são baixadas de novo (a entrada fica bem mais rápida)"]],
    ["v1.06", "Montanhas de verdade", ["Montanhas com contorno natural, paredão de rocha e uma escada talhada para subir",
      "No topo: um bando de monstros para caçar, um minério (às vezes raro) ou nada — refúgio, porque monstro não sobe montanha",
      "Montanhas pequenas em todos os biomas e muitas nas Montanhas de Ferro",
      "Rochas de obstáculo novas, saindo da terra (não se confundem mais com os veios de minério)",
      "Tecla M: só o mapa na tela, sem a interface por cima"]],
    ["v1.05", "O continente", ["O mapa virou um continente com mar, baías e ilhas — tecla M abre o mapa inteiro",
      "Cinco biomas: Campo (nível 5–30), Floresta Sombria (31–65), Montanhas de Ferro (66–101), Deserto Rubro (102–140) e Geleira do Norte (141–180)",
      "Cada bioma tem vila, monstros próprios, masmorra com chefe, minérios, madeiras e ervas — e um raro de nível maior no fundo",
      "Pedras nas vilas: ficam salvas ao chegar; viaje entre elas por 30 moedas e escolha onde renascer",
      "Equipamento de obsidiana, mitril, solar e glacial; nível máximo 200"]],
    ["v1.04", "Movimento em 8 direções", ["Heróis, moradores e monstros agora olham e andam nas diagonais, com animação própria para cada direção",
      "Cortar árvore, minerar, pescar, assar na fogueira, falar com alguém ou lutar: dá para fazer de qualquer lado, inclusive na diagonal",
      "Os monstros também te perseguem e atacam na diagonal; a dança de lado do herói e do monstro acabou",
      "Segure Ctrl e clique com o botão direito perto de um monstro: o herói ataca o mais próximo do ponto (não precisa acertar o monstro)",
      "Passar por cima de um item no chão já pega (antes só parando em cima)",
      "Segure o botão esquerdo do mouse no chão: o herói vai andando atrás do cursor e, ao soltar, segue até o ponto onde você soltou",
      "Plantas de coleta redesenhadas para combinar com cada região",
      "Os peixes dos cardumes saltam de frente (antes saltavam de costas)",
      "Espaço Secundária por classe: escudo para o Guerreiro, flechas para o Arqueiro, orbe ou livro para o Místico (todos aparecem no personagem)",
      "Montantes de duas mãos para o Guerreiro: batem mais forte, mas não deixam usar escudo",
      "Novo espaço de Bracelete no boneco",
      "No canto de cima, o retrato do seu personagem com o que ele veste, o nível e o ouro (o jogo salva sozinho; voltar ao menu fica nas opções ⚙)",
      "Fogueira, braseiro e tocha: só a chama se mexe"]],
    ["v1.03", "Arqueiro, equipamento de verdade e plantas", ["Novo herói: o Arqueiro (no lugar do Marinheiro) atira flechas de longe; com arco equipado, qualquer herói atira",
      "Todos começam só de roupa de baixo; o que você veste aparece no personagem (camisa, placas, calça, botas, capuz, elmo, capa, aljava e arma)",
      "Armas, ferramentas e peitorais viram itens: compre com o Bento, forje na bigorna ou ganhe do Ivo no tutorial; a ferramenta certa entra na mão sozinha",
      "Boneco com 9 espaços: capacete, peitoral, calça, botas, capa, arma, munição, anel e amuleto",
      "Herbalismo: colha ervas, flores, lírios-da-lua e flores de cristal com a foice para poções e capas",
      "Ande também na diagonal (duas teclas juntas ou clicando), heróis e monstros refeitos em 3D no Blender",
      "Só o que é planta balança com o vento; o peixe salta de frente"]],
    ["v1.02", "Visitas", ["Ivo, Tomé, Bento, Juna, Odília e Brás passam pelo seu quintal e comentam os troféus (no registro, sem parar o jogo)",
      "No máximo uma visita a cada 8 minutos de jogo, com você perto de casa e fora de luta",
      "A casa e os pedestais ganharam sombra no chão"]],
    ["v1.01", "Lar, doce lar", ["A casa assenta direto no chão da vila, sem o quadrado de grama",
      "Parado perto de casa, o filhote vai cochilar na cama de palha e levanta quando você sai",
      "Bem descansado: a vida volta mais rápido só com 5 troféus expostos (a vida extra continua +2 por troféu)"]],
    ["v1.00", "A casa do herói", ["Depois do Ato II, o Bento vende a escritura de um lote a sudoeste da vila; com madeira e ferro, a casa fica pronta",
      "Nove pedestais no quintal para os troféus dos chefes, dos ecos, das relíquias raras e dos cinco marcos",
      "Durma em casa para ficar Bem descansado (+2 de vida por troféu exposto); o filhote ganha uma cama de palha"]],
    ["v0.99", "Fica!", ["Tecla G (ou o botão na janela do companheiro): o filhote senta e espera; aperte de novo para chamar",
      "Esperando, ele só morde quem chegar perto; se você for longe demais, ele corre atrás de você"]],
    ["v0.98", "Sonecas e tremores", ["O jovem e o adulto também dormem enrolados quando descansam na vila, agora num canto livre perto da fogueira",
      "Os tremores do Golem e da Serpente acertam o filhote, e ele aprendeu a sair do círculo quando o aviso aparece",
      "Caminhada do filhote em pé sem o pedacinho solto sob a barriga"]],
    ["v0.97", "Ele cresce com você", ["Filhote em pé andando e mordendo, e enrolado dormindo ao lado da fogueira quando descansa na vila",
      "Três missões curtas da Juna, uma por fase do filhote: Dentes de leite, Faro de lobo e Uivo próprio",
      "Aviso quando ele cresce de fase e a conquista Alfa de estimação no vínculo 20"]],
    ["v0.96", "Um nome para o filhote", ["O filhote da lua tem arte própria nas três fases (filhote, jovem e adulto) e uma cena com a Juna na entrega",
      "Você escolhe o nome dele; o painel mostra o ícone e a vida (clique para ver o vínculo e trocar o nome)",
      "Ele agora pode cair: quem ele morde pode revidar, e ele volta à vila para se recuperar em 2 minutos",
      "Monstros não entram mais no tile dele; a mordida ficou mais leve (medido: 20–30% menos comida e tempo nos ecos e na Fenda)"]],
    ["v0.95", "O filhote da lua", ["Depois do Alfa da lua cheia, a Juna te entrega um filhote órfão da matilha: ele segue você e morde o seu alvo",
      "O vínculo (1–20) cresce com os abates feitos com ele junto; ele cresce em três fases"]],
    ["v0.94", "Matilha justa", ["No Marco da Mata, os lobos que moram perto saem de cena quando a matilha sobe: a luta é só a das duas levas"]],
    ["v0.93", "Bosque em paz", ["Marco do Bosque aceso: goblins não atacam por conta própria perto dele (como os outros marcos)",
      "O nome da região no painel quebra em duas linhas em vez de ser cortado",
      "O letreiro de região sobe quando há alguém para conversar perto do herói"]],
    ["v0.92", "Duelo sob a lua", ["Na Lua cheia, os lobos comuns da toca abrem espaço: o Alfa vem só com os três lobos da lua",
      "Estilo Agressivo conferido do tutorial à Fenda"]],
    ["v0.91", "Direto ao Capataz", ["As fendas e o Marco dos Campos dão mais XP de Combate (400 e 900): o herói chega ao Capataz perto do Combate 7, quase sem treino",
      "Ato I e II conferidos com robô do tutorial ao fim do Ato II, nos estilos Preciso e Agressivo"]],
    ["v0.90", "Caminho aberto", ["Esqueletos das Ruínas renascem em 20 s (antes 12): dá para atravessar o bando até o Senhor",
      "Carne de javali assa desde a Culinária 1 (o tutorial termina nela)",
      "Ecos semanais e Fenda estelar conferidos com a Vitalidade nova"]],
    ["v0.89", "Fôlego para o fim", ["Vitalidade sobe o dobro nos estilos Preciso e Agressivo (1,7 por dano, antes 0,85)",
      "Recompensas de Combate (missões e caçadas) também dão Vitalidade, na proporção do estilo",
      "Tucunaré assado cura 15 (antes 12)",
      "Dica nova do Ivo: o estilo Defensivo sobe a Vitalidade mais depressa"]],
    ["v0.88", "Mesa farta", ["Carne assada cura 12 (antes 9) e o espetinho de javali cura 15 (antes 12)",
      "\"Raízes inquietas\" (Ato II) abre no Combate 11: sem treino obrigatório entre os atos",
      "Os chefes da campanha dizem o Combate recomendado (Senhor 25+, Golem 31+, Serpente 38+)",
      "Nas cenas, o herói fala do lado direito da caixa, olhando para a fala"]],
    ["v0.87", "Paz na cabana", ["Os lobos não atacam por conta própria perto da Juna (zona segura, como a do Brás)",
      "\"O uivo sob a lua\" recomenda Combate 14+ (aviso, não bloqueio)",
      "Retratos de busto dos três heróis nas cenas"]],
    ["v0.86", "Campanha revisada", ["Um robô jogou os Atos I e II do começo ao fim: missões que pedem carvalho, ferro ou lumita agora dizem o nível de habilidade",
      "O Alfa da lua cheia do Ato II recomenda Combate 16+",
      "O quadro de caçadas mostra a sequência e o bônus do próximo eco da Serpente",
      "Pronto para os retratos dos heróis nas cenas"]],
    ["v0.85", "Rostos na conversa", ["Retratos de busto do Ivo, do Tomé, do Bento, da Juna, da Odília e do Brás nas cenas de diálogo (menores no celular)",
      "Eco da Serpente em semanas seguidas: até +60% de moedas e uma barra estelar a cada três semanas",
      "Ao terminar o tutorial, o registro aponta direto para a campanha"]],
    ["v0.84", "Fenda polida", ["A entrada da Fenda Cintilante saiu de perto do Golem Ancião",
      "Veios de cristal brilhantes no chão da Fenda, embaixo dos braseiros e aqui e ali",
      "Recorde da Fenda: o tempo da sua descida mais rápida aparece na ficha do personagem",
      "A caixa de cena está pronta para os retratos de busto dos personagens"]],
    ["v0.83", "Fim da campanha", ["Ato V completo: os ecos de cristal, a Serpente de Lumita e o selo dos fundadores refeito no fundo da Fenda",
      "Cena final com todos da vila, e o eco semanal da Serpente no quadro de caçadas",
      "Correção: o herói não fica mais \"dançando\" na diagonal com monstros lentos e chefes",
      "Equipamento estelar só na bigorna (cada peça sai com modificadores próprios)"]],
    ["v0.82", "A Fenda Cintilante", ["Ato V, parte 1: depois do Coração de lumita, o Brás manda você descer à Fenda Cintilante (Combate 38+ recomendado)",
      "Masmorra nova: aranhas de quartzo, sentinelas de cristal, espectros de luz e a Serpente de Lumita no fundo",
      "Equipamento nível 5: Lâmina estelar e Couraça estelar, forjadas com barra estelar e com 1 ou 2 modificadores sorteados",
      "Os golems não atacam mais perto do acampamento do Brás"]],
    ["v0.81", "Ato IV: O Coração de Lumita", ["O garimpeiro Brás, na subida do Planalto: lanterna de lumita, oito golems e o Golem Ancião (Combate 26+)",
      "O Coração de lumita volta a brilhar: os cinco marcos acesos e os golems calmos perto dele",
      "Estelas do Ato III mais longe da arena do Senhor das Ruínas, com menos esqueletos acordando",
      "O diário já mostra o Ato V: a Fenda Cintilante"]],
    ["v0.80", "Ato III e a caçada do dia", ["Ato III, \"Os Mortos Lembram\": a cartógrafa Odília, quatro estelas com runas nas Ruínas, o juramento da cripta e o Senhor das Ruínas como guardião (Combate 18+)",
      "Marco das Ruínas aceso: os esqueletos baixam as armas perto dele",
      "Caçada do dia no quadro, com sequência de dias seguidos (até +50% e prêmios no 3.º e no 7.º dia)",
      "Bestiário com prêmios a cada 5, 10, 15 e 20 criaturas descobertas",
      "Interface e site só em zoom inteiro (1× ou 2×): a fonte em pixel art fica nítida"]],
    ["v0.79", "Ato II: A Mata que Escuta", ["Juna, a raizeira, mora na beira da Mata Sombria: três missões novas da campanha (Combate 12+)",
      "O Alfa da lua cheia engoliu o cristal do marco; o ritual do Marco da Mata é à noite, com a matilha vindo em duas levas",
      "Alquimia da Juna: tônico de vigor (cura aos poucos), elixir do lobo e unguento de casca",
      "Arte nova: Capataz Rasgo, os marcos de lumita, as fendas dos Campos, a Juna e a cabana dela",
      "Fonte em pixel art em todo o jogo e no site"]],
    ["v0.78", "Campanha: Os Marcos de Lumeira", ["Ato I, \"Rachaduras\": três missões em sequência pelos Campos e pelo Bosque, com cenas de diálogo do Ivo, do Tomé e do Bento",
      "Fendas brilhantes nos Campos, o Marco dos Campos para consertar e defender, e o Capataz Rasgo, chefe do bando goblin",
      "Marcos acesos curam mais rápido por perto e abrem as pedras de passagem: viagem entre o santuário e os marcos",
      "Objetivo da campanha marcado no mapa, no minimapa e numa seta na borda da tela; o diário mostra os cinco atos"]],
    ["v0.77", "Luz nas poças", ["À noite, as poças perto dos postes e das fogueiras refletem a luz quente"]],
    ["v0.76", "Lobby em movimento", ["Na prévia do herói, a caminhada nova de 6 quadros", "O cartão do jogo salvo mostra a região onde você parou, com o ícone dela"]],
    ["v0.75", "Depois da chuva", ["Poças nas estradas e na terra enchem com a chuva, brilham, recebem pingos e secam aos poucos",
      "Caminhada e NPCs sem os risquinhos soltos acima da cabeça"]],
    ["v0.74", "Passo inteiro", ["Caminhada do herói em 6 quadros: contato, descida e passagem para cada pé",
      "Ivo, Bento e Tomé respiram quando olham para você de lado ou de costas"]],
    ["v0.73", "Vila atenta", ["Ivo faz a ronda pela praça; Bento de vez em quando se vira para arrumar a banca",
      "Chegando perto, Ivo, Bento e Tomé se viram para você",
      "Chuva passageira de vez em quando, com respingos e o céu mais fechado"]],
    ["v0.72", "Passo com peso", ["O herói sobe e desce de leve a cada passo ao andar"]],
    ["v0.71", "Golems de punho erguido", ["Golem de musgo, Golem Ancião e Colosso de lumita erguem os dois braços antes do golpe e do tremor",
      "Esqueleto e guardião da cripta erguem a arma sem levar a perna junto",
      "Minimapa redesenhado: lagos com margem, pontos com contorno e uma seta mostrando para onde você olha",
      "Abas do painel com ícones novos de mochila e de níveis"]],
    ["v0.70", "Monstros com braço", ["Goblins, esqueletos, guardiões e o Senhor das Ruínas erguem a arma antes do golpe e a descem com força",
      "Monstros e NPCs respiram e trocam o peso quando parados; golpes recebidos dão um tranco maior",
      "Abas do painel com ícones; em luta o nome do chefe fica só na barra do topo",
      "O chão à frente é preparado antes de aparecer, sem engasgo ao andar"]],
    ["v0.69", "Placas de madeira", ["Abas do lobby, topo das janelas e faixas de evento em placas de madeira com cantoneiras de ferro",
      "Abas do lobby e nome do herói na fonte de títulos",
      "Quatro postes de lanterna no cruzamento da praça",
      "No celular, a faixa de região desce para baixo do painel e mostra o nome inteiro"]],
    ["v0.68", "Letras da vila", ["Títulos em pixel art: faixas de evento e de região, comemoração de nível e o topo das janelas",
      "Banco e floreiras na praça, um banco na beira do lago e poste e caixotes na entrada do Bosque",
      "O tremor do Golem Ancião e o golpe pesado do Senhor das Ruínas deixam marca no chão",
      "Perto dos lagos fundos, a água da margem também é funda"]],
    ["v0.67", "Lagos de verdade", ["Margens dos lagos e borda da praça em curvas, com espuma e ondas que chegam à areia",
      "Golpe de frente e de costas em 4 tempos, com um arco largo da espada; atacando para cima, o herói recua um passo e não tampa o monstro",
      "Números de dano em pixel art, marcas no chão no golpe esmagador e golpes com mais corpo no som",
      "Praça com carroça de feno, caixotes e postes de lanterna que acendem à noite"]],
    ["v0.66", "Combate que se lê", ["Números de dano novos: brancos para o que você causa, dourados e maiores no crítico, vermelhos para o que você leva; textos no mesmo lugar não se sobrepõem mais",
      "A câmera acompanha cada golpe, o giro e o golpe esmagador abrem uma onda no chão e o botão da habilidade pisca quando a recarga acaba",
      "Mundo mais vivo: sombras de nuvens, pólen, folhas e vagalumes, margens com espuma e grama com sombra sobre a terra",
      "A dica do estilo Defensivo avisa que o Combate sobe mais devagar; no celular, o registro não fica mais embaixo da barra de habilidades"]],
    ["v0.65", "Missão mais curta", ["O passo da Estrada do leste ficou mais curto no painel: \"(Combate 10+, um de cada vez)\""]],
    ["v0.64", "Estrada do leste", ["A missão dos goblins avisa o nível recomendado (Combate 10) e lembra de puxar um de cada vez"]],
    ["v0.63", "Javalis em paz", ["Javalis nascem longe do acampamento goblin: caçar javali não acorda mais o bando",
      "Baú vazio da Toca dos Lobos fala da toca, não da cripta"]],
    ["v0.62", "Lobos no seu canto", ["Lobos e alfas nascem a pelo menos 6 passos dos Campos e da vila, e não perseguem mais iniciantes para dentro dos Campos",
      "Placas e etiquetas do mapa mostram o Combate recomendado de cada região"]],
    ["v0.61", "Leve comida", ["Atacar sem comida faz o cesto do painel pulsar, e o Ivo avisa para voltar a pescar antes do próximo monstro",
      "A invasão goblin avisa o nível recomendado (Combate 10 ou mais)", "Conquistas renomeadas: \"Lenda de Valdora\" (os dois chefes) e \"Caçador de ecos\""]],
    ["v0.60", "Bando menor", ["Goblins do Bosque só notam você a 2 passos (antes 3): o bando acorda menos de uma vez",
      "Dica do Ivo na primeira visita ao Bosque: puxe um goblin de cada vez e leve comida", "A dica de vida baixa lembra da poção de vida (tecla 2)"]],
    ["v0.59", "Seta de volta", ["Na primeira entrada numa região perigosa, uma seta verde no minimapa aponta o caminho de volta, mesmo na divisa",
      "\"Como jogar\" atualizado: as teclas das habilidades e quem atordoa de verdade"]],
    ["v0.58", "Volte por aqui", ["Na primeira vez numa região acima do seu nível, o aviso fica mais tempo na tela e o minimapa mostra o caminho de volta",
      "Falas revisadas: o Bento fala do balcão, o Tomé cobra dez moedas e o Ivo indica o painel à direita"]],
    ["v0.57", "Ivo espera a luta acabar", ["As dicas do Ivo não aparecem mais no meio de uma luta",
      "Mensagens revisadas: \"Você comeu\" e \"Você bebeu\", mochila cheia sempre com a mesma frase e recursos com o nível que pedem"]],
    ["v0.56", "Conselhos na hora", ["Na primeira carne de javali, o Ivo explica o espetinho (com uma madeira na mochila, cura 12)",
      "Na Pesca 10, o Ivo lembra dos cardumes fundos e dos tucunarés", "Cripta e Toca dos Lobos com ícone próprio no painel"]],
    ["v0.55", "Mapa no bolso", ["Cada região tem um ícone no painel; no celular ele substitui o nome", "O Ivo avisa uma vez quando a mochila enche (o cofre e o Bento resolvem)",
      "Depois da segunda queda, o Ivo lembra do estilo Defensivo"]],
    ["v0.54", "Dicas na hora certa", ["As dicas do Ivo acompanham o seu Combate: nada de chefes e ecos para quem acabou de chegar",
      "Avisos de região não chegam mais aos pares, e a dica espera um aviso recente passar", "Painel do celular: nome inteiro, chama só com o ícone e linha das moedas sem transbordar"]],
    ["v0.53", "Chama no painel", ["A chama votiva aparece na ponta da barra de vida, com os minutos que faltam",
      "Nomes longos cabem no painel junto com a medalha"]],
    ["v0.52", "Chama votiva", ["Com a chama votiva acesa, uma chama dourada flutua ao lado do herói, do lado oposto ao rosto",
      "Três velas extras acendem nos degraus do santuário enquanto ela durar", "A medalha do painel mostra os minutos que faltam"]],
    ["v0.51", "Moedas na tigela", ["Ao ofertar, cinco moedas caem girando na tigela do santuário, que brilha quando elas chegam",
      "Medalha dourada para a Lenda de Lumeira; o Patrono da vila ganhou nome lilás", "Depois da Lenda, a chama votiva: 1.000 moedas = 10 min de uma chama com você (só enfeite)"]],
    ["v0.50", "Velas acesas", ["As três velas do santuário agora tremulam, e a luz delas pulsa junto com a chama",
      "Medalha do título no cartão do save e na ficha do personagem", "Títulos do santuário: 1.000, 4.000, 10.000 e 25.000 moedas (antes 1.000 a 12.000)"]],
    ["v0.49", "Santuário de Lumeira", ["Santuário na praça, ao lado do poço: oferte moedas e ganhe títulos de prestígio",
      "Quatro títulos (1.000 a 12.000 moedas): título sobre o nome, cor do nome, halo à noite e faíscas de lumita", "Velas e cristal acesos de dia e de noite; a linha das moedas no painel não quebra mais"]],
    ["v0.48", "Cesto vazio", ["Fora da vila, com 1 comida ou menos, um cesto laranja aparece ao lado das moedas",
      "Comer no meio de um golpe interrompe o golpe e mostra o herói comendo", "Monstro em perseguição na diagonal: o herói espera ele encostar em vez de dançar em volta"]],
    ["v0.47", "Vida baixa", ["Bordas vermelhas pulsando quando a vida cai abaixo de 30% (paradas com \"reduzir movimento\")",
      "Na primeira vez, uma dica no registro lembra de comer (1) ou recuar"]],
    ["v0.46", "Cadeados e dúvidas", ["Cadeado na banca e na bigorna mostra o nível que falta para a próxima peça", "Monstro que desiste da perseguição solta três \"?\"",
      "Placas de aço com Vitalidade 10 (antes 16) e Couraça de lumita com 15 (antes 24)"]],
    ["v0.45", "Assar tudo", ["F na fogueira mostra \"assar tudo (N)\" e assa a fila inteira", "Resumo do que saiu da grelha e fumaça no fim",
      "Monstros não travam mais na diagonal com os dois lados bloqueados"]],
    ["v0.44", "Cofre em ordem", ["Botão Organizar: comida, materiais, barras e raros, cada grupo em ordem alfabética", "Lupa dentro do campo de filtro",
      "Cabeçalho do cofre em duas linhas, com botões de 44 px no celular"]],
    ["v0.43", "Despensa", ["Botão Retirar comida: tira do cofre a comida que cabe, da que mais cura para a que menos cura", "Campo para filtrar o cofre (sem ligar para acentos)",
      "Comida sai do baú com um brilho dourado"]],
    ["v0.42", "Cofre arrumado", ["Botão Guardar materiais: guarda tudo menos comida, poções e acessórios", "Item entra no baú com um brilho dourado",
      "No cofre, as setas passam da mochila para o cofre e de volta", "Som do eco um pouco mais baixo"]],
    ["v0.41", "Tudo no teclado", ["Seção Teclado no Como jogar e nas opções", "Na mochila, as setas andam entre os espaços e só um espaço entra no Tab",
      "Gancho de metal segurando a plaquinha da versão"]],
    ["v0.40", "Ao vento", ["A faixa do título ondula ao vento (parada para quem prefere menos movimento)", "Versão numa plaquinha de madeira pendurada na faixa",
      "Mochila e cofre pelo teclado: Tab chega nos espaços e Enter usa o item", "Enter/Espaço num botão em foco apertam o botão (antes Espaço atacava)"]],
    ["v0.39", "Faixa do reino", ["Título da tela inicial numa faixa de tecido com franjas douradas", "Botão Continuar com ícone",
      "Foco visível no teclado e botões de pelo menos 44 px no celular"]],
    ["v0.38", "De pé para agradecer", ["Tomé levanta do tronco e desce antes de fazer a reverência", "Cartão do save em pergaminho na tela inicial",
      "Cartão do save ajustado para o celular"]],
    ["v0.37", "Reverência", ["Tomé faz reverência com o chapéu ao receber uma missão concluída", "Medalha nas conquistas novas do registro",
      "Tela inicial mostra as 3 últimas conquistas do seu aventureiro"]],
    ["v0.36", "Brilho de dever cumprido", ["Estrela dourada no joinha do Bento e na continência do Ivo", "Encomenda entregue com ícone no registro",
      "Diário: missões prontas para entregar aparecem primeiro, com destaque dourado"]],
    ["v0.35", "Joinha do Bento", ["Bento faz joinha quando você entrega uma missão ou encomenda dele", "Quadro verde avisa quando a Lua cheia da balada vem (de dia) ou pode surgir (à noite)",
      "O atalho noturno da balada agora só adianta a Lua cheia"]],
    ["v0.34", "Missão cumprida", ["Ivo bate continência quando você entrega uma missão dele", "Quadro verde marca a missão pronta para entregar",
      "A balada da lua cheia espera bem menos: à noite, a Lua cheia chega mais rápido enquanto a missão está ativa", "Nome do Tomé desce quando ele se senta"]],
    ["v0.33", "Uma pausa no tronco", ["Tomé senta no tronco da fogueira para tocar entre as voltas pela praça", "Dica do minimapa ao concluir a primeira tarefa",
      "Botão de dica no celular", "Boas-vindas do Ivo mais curtas"]],
    ["v0.32", "Alerta em todo canto", ["Caveira de alerta nas regiões sem matilha (Bosque, Ruínas, Planalto e Cripta)", "Aviso também ao carregar o jogo já dentro de uma região perigosa",
      "Tronco-banco junto da fogueira da vila", "Letreiro de região cabe na tela do celular", "Ivo apresenta o minimapa e os níveis recomendados"]],
    ["v0.31", "Cuidado com a matilha", ["Aviso ao entrar numa região acima do seu Combate (com o nível recomendado)", "Varal de carne balançando ao lado da fogueira da vila",
      "O Bento compra peixe queimado", "Na mochila, a quantidade foi para baixo e a cura fica em cima"]],
    ["v0.30", "Espetinho de javali", ["Carne de javali + 1 madeira na mochila vira espetinho na fogueira (cura 12)", "Carne de javali assa a partir de Culinária 2 (antes 5)",
      "Coração com quanto cada comida cura na mochila e no botão ✚ do celular"]],
    ["v0.29", "Espeto na brasa", ["O herói se agacha e gira o espeto enquanto assa", "Ele assa de lado ou acima da fogueira para o chiado ficar à vista",
      "Frigideira na mochila marca os crus que já não queimam", "Ficha (P) mostra a chance de coleta de cada recurso e a de queimar"]],
    ["v0.28", "Brasa e grelha", ["A comida chia na grelha enquanto você assa", "Chance de queimar aparece ao começar a assar e cai mais devagar no início (24%, antes 32%)",
      "Aviso de comida queimada com ícone, sem repetir", "Cardumes menores no minimapa quando dividem o lago"]],
    ["v0.27", "Cardumes à vista", ["Peixe salta quando o cardume muda de lugar", "Cardumes marcados no minimapa",
      "Aviso do cardume no máximo a cada 30 s", "Nome do Tomé sobe enquanto ele toca", "Saves antigos ganham as marcas das encomendas grandes"]],
    ["v0.26", "Notas no ar", ["Notas douradas sobem do alaúde do Tomé", "Encomendas grandes do Bento marcadas com um caixote",
      "Sons próprios quando um eco desperta e quando se desfaz", "A dica do Ivo não muda mais enquanto a janela está aberta"]],
    ["v0.25", "Canções e conselhos", ["Tomé dedilha o alaúde enquanto canta", "Dicas do Ivo no registro (a cada 4 min), na janela dele e na tela inicial",
      "Encomendas do Bento acompanham o seu nível e pedem mais gosma e peles", "Ecos mais leves de desenhar (cor do eco pré-calculada)"]],
    ["v0.24", "Painel no celular", ["Em telas estreitas, as abas abrem em largura total", "O eco se desfaz em névoa quando você se afasta",
      "Sino dos ecos semanais no quadro e no bestiário", "Cota de ferro a partir de Vitalidade 6", "Falas e dicas novas sobre a fúria e os ecos"]],
    ["v0.23", "Névoa dos ecos", ["O eco surge de uma coluna de névoa ciano", "Eco desperto aparece no quadro verde e pulsa no minimapa",
      "Ícones próprios do Eco cristalizado e do Amuleto dos ecos", "Amuleto dos ecos ajustado: +3 acerto, +3 dano, +5 defesa"]],
    ["v0.22", "Ecos e fúria", ["Senhor das Ruínas entra em fúria abaixo de 30%: aura roxa e mais esqueletos", "Ecos semanais dos dois chefes no Quadro de caçadas (Eco cristalizado garantido)",
      "Amuleto dos ecos no artesanato", "Poça de cristal brilha antes de um slime de lumita renascer", "Ícone próprio da Couraça de lumita"]],
    ["v0.21", "Bestiário completo", ["Slimes de lumita renascem de uma poça de cristal", "Bestiário mostra região, chefes e se o monstro renasce (e em quanto tempo)",
      "Pedras do renascimento dos golems maiores e mais visíveis", "Nova armadura: Couraça de lumita (+17 defesa, 5 barras de lumita)"]],
    ["v0.20", "Golems que se montam", ["Pedras rolam para onde um golem vai voltar, e ele se monta do chão", "Marco de pedras com cristal no ponto de caça do Planalto",
      "Golems puxam menos uns aos outros (alcance menor)"]],
    ["v0.19", "Mortos que voltam", ["Fogo-fátuo roxo marca onde um esqueleto vai renascer; ele sai da terra (também os invocados pelo Senhor)",
      "Arco quebrado na entrada das Ruínas", "Golems e slimes de lumita agrupados no Planalto: caçar ficou 6× mais rápido",
      "Colosso de lumita mais resistente"]],
    ["v0.18", "Ruínas mais justas", ["Esqueletos ficam na parte oeste das Ruínas, longe do Senhor, e batem um pouco menos",
      "Espaço ataca o monstro mais perto pelo caminho, não o que está atrás da parede", "Lápide \"Cripta\" na entrada das Ruínas",
      "O herói comemora também andando; Alfa da lua cheia mais resistente"]],
    ["v0.17", "Comemoração", ["O herói salta com a arma erguida ao concluir missões e tarefas do tutorial",
      "Mural do Ivo na praça; tecla M abre o diário de missões", "Aviso discreto quando uma missão avança (ex.: \"Estrada do leste: 3/8\")"]],
    ["v0.16", "Diário de missões", ["Aba Diário com as missões ativas (passo, progresso e recompensa) e as concluídas",
      "Anel de brasa no tremor do Golem Ancião", "Poste \"Treino\" ao lado do boneco da praça", "Dicas novas do Ivo sobre esquiva, tecla F, passivas e a Toca dos Lobos"]],
    ["v0.15", "Chão que avisa", ["Áreas de perigo com rachaduras em brasa pulsando no chão (boneco, Senhor, golpes especiais e tremor)",
      "O boneco de treino gira o braço no revide", "Ícone de pergaminho na lista do tutorial",
      "Qualquer direção no teclado cancela a preparação do golpe, mesmo contra um obstáculo", "A banca do Bento abre em Vender durante o tutorial"]],
    ["v0.14", "Boneco de treino", ["Novo passo do tutorial: golpeie o boneco de treino e saia da área vermelha antes do revide",
      "Andar cancela a preparação do golpe (com animação): dá para esquivar no meio de um ataque", "Poeira clara no Planalto e na toca, desenhada no chão",
      "Tomé anda de verdade nas 4 direções"]],
    ["v0.13", "Esquiva justa", ["O golpe especial agora acerta perto do fim do aviso: dá tempo de sair andando (medido com o robô)",
      "Área de perigo no chão também no golpe do Senhor das Ruínas e ícone de esquiva sobre o chefe", "Poeira e rachaduras no impacto do tremor e da espada fincada",
      "A matilha acorda com o uivo e corre até o Alfa; lobos levantam com animação própria", "Tochas presas em raízes iluminam a Toca; Tomé também passeia pela praça"]],
    ["v0.12", "Lobos dormindo e chefes que punem", ["Toca dos Lobos com entrada, saída e chão próprios; lobos dormem e acordam com o uivo do Alfa",
      "Senhor das Ruínas crava a espada no chão no golpe especial", "Chefes batem mais forte: esquivar do golpe especial agora vale muito (medido com o robô)",
      "Conquistas novas: Toca limpa, Uivo silenciado e Colosso estilhaçado", "A vila só protege no mapa de cima; monstros de masmorra não somem ao perder o jogador"]],
    ["v0.11", "A Toca dos Lobos", ["Nova masmorra: Toca dos Lobos, na Mata Sombria (liberada pela balada do Tomé), com o Alfa da lua cheia no fundo",
      "Bento e Ivo andam de verdade nas 4 direções", "O Lobo alfa uiva ao entrar em combate; faísca azul no aparo; o Colosso se desfaz em cristais",
      "Dica da tecla F no rodapé: \"F: falar com Bento\"", "Chefes mais resistentes (medidos com o robô): lutas de 35 a 50 s no nível recomendado"]],
    ["v0.10", "Mini-chefes de verdade", ["Colosso de lumita e Alfa da lua cheia com arte e animação próprias; o Alfa uiva antes de atacar",
      "Bloqueio com animação, respingo no sangramento e ícones das passivas", "Passivas equilibradas com o robô: Preciso critica 14%, sangramento 18%",
      "Nova missão do Tomé: A balada da lua cheia", "Tecla F para usar ou conversar com o que está perto", "Celular: tocar num item abre o menu Usar / Largar"]],
    ["v0.9", "Estilos com passiva e a Lua cheia", ["Passivas: Sangramento (Agressivo), Olho de águia (Preciso) e Bloqueio (Defensivo)",
      "Evento noturno Lua cheia: o Alfa da lua cheia e sua matilha na Mata Sombria", "Missão O guardião desperto, com o Colosso de lumita na cripta",
      "Bento e Ivo passeiam pela praça; golem e slime de lumita têm golpe especial", "Investida com a espada, fumaça nas fogueiras, folhas caindo e balde do poço balançando",
      "Dicas também no celular: segure o dedo sobre o item"]],
    ["v0.8", "Mundo em movimento", ["Água, cardumes, fumaça das chaminés, placas, toldo e quadro de avisos animados no Blender",
      "Pedras reagem ao golpe, NPCs gesticulam ao conversar e o baú da cripta se abre de verdade",
      "Golpe giratório e Investida com animação própria; ícones novos na barra de habilidades",
      "Novas missões: Estrada do leste (Ivo) e A encomenda do Bento", "XP de combate 15% menor, para alinhar com a coleta"]],
    ["v0.7", "Habilidades e missões", ["Golpe giratório (Q), Investida (E) e Golpe esmagador (R), com recarga na barra de habilidades",
      "Duas missões com história: Ecos da cripta (Ivo) e A canção do Ancião (Tomé)", "Chefes com golpe especial animado: o impacto vem no quadro certo",
      "Árvores, arbustos, flores, fogueiras e braseiros animados no Blender", "Selos de afixo e de obra-prima, dicas detalhadas e o portal de Lumeira",
      "Painel recolhível no celular"]],
    ["v0.6", "Equilíbrio e afixos", ["Curva de XP e economia reequilibradas (tabela em tests.html)", "Acessórios com afixos aleatórios de chefes e da cripta",
      "Ficha do personagem (P)", "Ações com animação própria: machado, picareta, martelo e pesca", "NPCs e guardião da cripta animados", "Controles de toque no celular"]],
    ["v0.5", "Movimento e combate profissionais", ["Animações renderizadas no Blender para heróis e monstros", "Dano no quadro de impacto, pausa de impacto e faíscas",
      "Câmera com mola, zoom automático e interface escalável", "Dia e noite, Cripta das Ruínas, o bardo Tomé e forja obra-prima"]],
    ["v0.4", "Brilho e recompensas", ["Novo site e tela inicial com prévia animada do herói",
      "Acessórios com raridade (comum, raro, épico): anéis, amuletos e a Coroa do Ancião", "Artesanato: bolsas que aumentam a mochila e acessórios",
      "Golpes críticos, pausa de impacto, barra de XP e comemoração de nível com desbloqueios", "14 conquistas e bônus por descobrir criaturas",
      "Eventos de mundo: invasão goblin e cardume dourado", "Música procedural com acordes, melodia e percussão"]],
    ["v0.3", "Chefes e caçadas", ["Golem Ancião com tremor em área e fúria", "Quadro de caçadas com recompensas",
      "Poções de força e de pedra", "Efeitos sonoros e música sintetizados", "Lagos e ruínas com formas naturais"]],
    ["v0.2", "Ferraria e tutorial", ["Fornalha, bigorna e equipamentos forjados", "Senhor das Ruínas, goblins e esqueletos",
      "Tutorial do Guarda Ivo, cofre, espólios no chão e bestiário", "Transições suaves entre terrenos"]],
    ["v0.1", "Primeiros passos", ["Vila de Lumeira, loja do Bento e encomendas", "Coleta, culinária e combate em ticks", "Salvamento no navegador"]],
  ];
  const HOW = [
    ["Andar e agir", "WASD ou setas para andar (duas teclas juntas andam na diagonal). Clique em árvores, veios, cardumes, monstros e pessoas para interagir, de qualquer lado. Segure Ctrl e clique com o botão direito perto de um monstro para atacar o mais próximo do ponto. Segure o botão do mouse para ir andando atrás do cursor; ao soltar, o herói vai até onde você soltou. Passar por cima de um item já pega. M abre o mapa do continente; as Pedras das vilas levam de uma vila a outra. Clique no minimapa para viajar."],
    ["Coletar", "Corte, minere e pesque. Recursos se esgotam e voltam. Níveis mais altos liberam materiais melhores."],
    ["Forjar e criar", "Funda minério na fornalha, forje na bigorna e use o Artesanato (na mochila) para bolsas e acessórios."],
    ["Lutar", "Combate em turnos rápidos, com três estilos e uma passiva em cada. Coma peixe ou carne para curar (tecla 1). Golpe giratório (Q) acerta todos em volta; Investida (E) e Golpe esmagador (R) atordoam."],
    ["Campanha", "Depois do tutorial, o Guarda Ivo começa a campanha dos Marcos de Lumeira. Siga a seta azul e os losangos do minimapa até cada objetivo."],
    ["Chefes", "Fique atento aos avisos: afaste-se do golpe pesado e saia do círculo do tremor."],
    ["Recompensas", "Encomendas do Bento, caçadas do quadro, conquistas, eventos de mundo e espólios raros que brilham no chão."],
    ["Teclado", "Tab vai para botões e abas; na mochila, as setas andam entre os espaços e Enter usa o item. Esc fecha janelas. F usa o que está perto; Espaço ataca o monstro mais próximo."],
  ];

  let heroId = HEROES[0].id, confirmNew = false;

  // ---------- abas ----------
  // rodada 69: abas e nome do herói na fonte de títulos (a aba aberta em dourado); sem a fonte, fica o texto
  const UI = window.ValdoraUI;
  function paintNav() {
    for (const x of document.querySelectorAll("#lobby-nav button")) {
      const label = x.dataset.label || (x.dataset.label = x.textContent.trim());
      x.innerHTML = UI ? UI.titleHTML(label, x.classList.contains("on") ? "#ffd84a" : "#e8dcc0", 1) : esc(label); x.setAttribute("aria-label", label);
    }
  }
  for (const b of document.querySelectorAll("#lobby-nav button")) b.onclick = () => {
    for (const x of document.querySelectorAll("#lobby-nav button")) x.classList.toggle("on", x === b);
    for (const p of document.querySelectorAll("#lobby .page")) p.hidden = p.id !== "page-" + b.dataset.page;
    paintNav();
  };
  if (UI && ASSETS.ui_font_title) { // o jogo carrega a fonte depois; o lobby carrega a sua (mesma imagem, do cache)
    const fi = new Image();
    fi.onload = () => { const c = document.createElement("canvas"); c.width = fi.naturalWidth; c.height = fi.naturalHeight; c.getContext("2d").drawImage(fi, 0, 0);
      UI.setTitleFont(c); paintNav(); renderHeroes(); };
    fi.src = ASSETS.ui_font_title;
  }
  $("page-how").innerHTML = `<div class="how-grid">${HOW.map(([t, d]) => `<div class="card"><b>${t === "Teclado" && ASSETS.icon_keyboard_help ? `<img class="btn-icon" src="${ASSETS.icon_keyboard_help}" alt="">` : ""}${t}</b><p>${d}</p></div>`).join("")}</div>`; // rodada 41
  $("page-news").innerHTML = NEWS.map(([v, t, list], i) => `<div class="card news${i === 0 ? " latest" : ""}"><div class="news-h"><span class="tag">${v}</span><b>${t}</b></div>
    <ul>${list.map((x) => `<li>${x}</li>`).join("")}</ul></div>`).join("");

  // ---------- vaga-lumes ----------
  const ff = $("fireflies");
  for (let i = 0; i < 26; i++) {
    const s = document.createElement("span");
    s.style.cssText = `left:${Math.random() * 100}%;top:${40 + Math.random() * 60}%;animation-delay:${-Math.random() * 12}s;animation-duration:${8 + Math.random() * 8}s`;
    ff.appendChild(s);
  }

  // ---------- heróis ----------
  function renderHeroes() {
    $("heroes").innerHTML = "";
    for (const h of HEROES) {
      const b = document.createElement("button");
      b.className = "hero" + (h.id === heroId ? " sel" : "");
      b.innerHTML = `<img src="${ASSETS[h.id]}" alt=""><span>${esc(h.name)}</span>`;
      b.onclick = () => { heroId = h.id; renderHeroes(); };
      $("heroes").appendChild(b);
    }
    const h = HEROES.find((x) => x.id === heroId);
    $("hero-title").innerHTML = UI ? UI.titleHTML(h.name, "#ffd84a", 2) : esc(h.name); $("hero-desc").textContent = LORE[h.id] || "";
  }

  // prévia animada: o herói anda e vira nas 4 direções sobre um tufo de grama
  const sheets = {}, idles = {}, walks = {};
  for (const h of HEROES) {
    const im = new Image(); im.src = ASSETS[h.sheet]; sheets[h.id] = im;
    const A = window.ANIM_SHEETS && ANIM_SHEETS[h.id]; if (A) { const ia = new Image(); ia.src = A.dressed || A.src; idles[h.id] = { img: ia, A }; } // rodada 104: com a roupa típica
    const W6 = window.ANIM_SHEETS && ANIM_SHEETS[h.id + "_walk6"]; if (W6) { const iw = new Image(); iw.src = W6.dressed || W6.src; walks[h.id] = { img: iw, A: W6 }; } // rodada 76
  }
  const pc = $("hero-preview"), pg = pc.getContext("2d");
  function preview(t) {
    if (!$("lobby").hidden) {
      pg.clearRect(0, 0, pc.width, pc.height);
      const cx = pc.width / 2, base = pc.height - 30;
      const grd = pg.createRadialGradient(cx, base, 6, cx, base, 80);
      grd.addColorStop(0, "#5ea34acc"); grd.addColorStop(0.6, "#3d7a2f88"); grd.addColorStop(1, "#3d7a2f00");
      pg.fillStyle = grd; pg.beginPath(); pg.ellipse(cx, base, 86, 26, 0, 0, 7); pg.fill();
      pg.fillStyle = "#00000055"; pg.beginPath(); pg.ellipse(cx, base, 34, 9, 0, 0, 7); pg.fill();
      const im = sheets[heroId], idle = idles[heroId], cycle = Math.floor(t / 1800) % 8;
      if (idle && idle.img.complete && idle.img.naturalWidth && cycle % 2 === 1) { // alterna: parado (respirando) e andando
        const A = idle.A, dir = ["down", "right", "up", "left"][Math.floor(cycle / 2) % 4], R = A.rows["idle_" + dir], f = Math.floor(t / 1000 * R.fps) % R.frames;
        const sc = Math.max(1, Math.floor(170 / (A.cell / (window.ANIM_META ? ANIM_META.margin : 1.6)))), s = A.cell * sc / 1.6 * 1.6;
        pg.imageSmoothingEnabled = true;
        pg.drawImage(idle.img, f * A.cell, R.row * A.cell, A.cell, A.cell, cx - s / 2, base + 6 - s * (1 - (window.ANIM_META ? ANIM_META.ground : 0.125)), s, s);
      } else if (walks[heroId] && walks[heroId].img.complete && walks[heroId].img.naturalWidth) { // rodada 76: caminhada de 6 quadros
        const { img, A } = walks[heroId], dir = ["down", "right", "up", "left"][Math.floor(cycle / 2) % 4], R = A.rows["walk_" + dir], f = Math.floor(t / 1000 * R.fps) % R.frames;
        const M = window.ANIM_META || { margin: 1.6, ground: 0.125 }, s = A.cell * Math.max(1, Math.floor(170 / (A.cell / M.margin)));
        pg.imageSmoothingEnabled = false;
        pg.drawImage(img, f * A.cell, R.row * A.cell, A.cell, A.cell, cx - s / 2, base + 6 - s * (1 - M.ground), s, s);
      } else if (im && im.complete && im.naturalWidth) {
        const fw = im.naturalWidth / HERO_SHEET.cols, fh = im.naturalHeight / HERO_SHEET.rows.length;
        const order = ["down", "right", "up", "left"], dir = order[Math.floor(t / 1800) % 4];
        const col = HERO_SHEET.walk[Math.floor(t / 1000 * HERO_SHEET.fps) % HERO_SHEET.walk.length], row = HERO_SHEET.rows.indexOf(dir);
        const sc = Math.max(1, Math.floor(170 / fh)), w = fw * sc, h = fh * sc;
        pg.imageSmoothingEnabled = false;
        pg.drawImage(im, col * fw, row * fh, fw, fh, cx - w / 2, base - h + 6 + Math.abs(Math.sin(t / 125)) * -2, w, h);
      }
    }
    requestAnimationFrame(preview);
  }
  requestAnimationFrame(preview);

  // ---------- jogo salvo ----------
  function render() {
    if (window.ValdoraAccount) { $("save-slot").hidden = true; $("new-warn").hidden = true; $("play").textContent = "CRIAR E ENTRAR"; $("play").classList.remove("secondary"); return; }
    const s = G.readSave();
    $("save-slot").hidden = !s;
    confirmNew = false;
    $("play").textContent = s ? "NOVO JOGO" : "COMEÇAR AVENTURA";
    $("play").classList.toggle("secondary", !!s);
    $("new-warn").hidden = true;
    if (s) {
      const total = Object.keys(G.SKILLS).reduce((a, k) => a + G.level(+s.xp?.[k] || 0), 0);
      const hero = HEROES.find((h) => h.id === s.hero) || HEROES[0];
      const ach = s.ach ? Object.keys(s.ach).length : 0;
      // rodada 37: as 3 últimas conquistas (saves antigos guardavam 1 em vez da data: ficam na ordem da lista)
      const last = Object.entries(s.ach || {}).map(([id, v]) => [VD.ACHIEVEMENTS.find((a) => a.id === id), +v || 0]).filter(([a]) => a).sort((a, b) => b[1] - a[1]).slice(0, 3);
      const PR = window.ValdoraShrine && ValdoraShrine.rankOf(+s.offered || 0); // rodada 50: título do santuário no cartão
      // rodada 76: onde o herói parou (região com ícone), pelo mesmo desenho do mapa do jogo
      const W_ = window.ValdoraWorld, T_ = W_ && W_.TOWN, inTownS = T_ && s.x >= T_.x0 && s.x <= T_.x1 && s.y >= T_.y0 && s.y <= T_.y1;
      const regK = W_ && Number.isFinite(+s.x) ? (inTownS ? "town" : W_.regionShape(+s.x, +s.y)) : null, REG = regK && VD.REGIONS && VD.REGIONS[regK];
      const regHtml = REG ? `<span class="save-reg" title="${esc(REG.lvl || "")}">${ASSETS[REG.icon] ? `<img src="${ASSETS[REG.icon + "_32"] || ASSETS[REG.icon]}" alt="">` : ""}${esc(REG.name)}</span><br>` : "";
      $("save-info").innerHTML = `<img src="${ASSETS[hero.id]}" alt=""><div><b>${esc(s.name)}</b> <small>${esc(hero.name)}</small><br>${regHtml}
        ${PR ? `<span class="save-title" title="Título do Santuário de Lumeira">${ValdoraShrine.badge(PR) ? `<img src="${ValdoraShrine.badge(PR)}" alt="">` : "★ "}${esc(PR.title)}</span><br>` : ""}
        Nível total <b>${total}</b> · ${(+s.coins || 0)} moedas${ach ? ` · ${ach} conquista${ach > 1 ? "s" : ""}` : ""}<br><small class="saved">Salvo em ${new Date(s.t || 0).toLocaleString("pt-BR")}</small>
        ${last.length ? `<div class="save-achs">${last.map(([a]) => `<span title="${esc(a.desc)}">${ASSETS.icon_achievement_new ? `<img src="${ASSETS.icon_achievement_new}" alt="">` : "★"}${esc(a.name)}</span>`).join("")}</div>` : ""}</div>`;
    }
  }
  // rodada 25: uma dica do Ivo por visita (clique para a próxima)
  let tipI = Math.floor(Math.random() * VD.TIPS.length);
  const showTip = () => { $("lobby-tip").innerHTML = `${ASSETS.icon_tip ? `<img src="${ASSETS.icon_tip}" alt="">` : ""}<span><b>Dica do Ivo:</b> ${esc(VD.TIPS[tipI])}</span>`; };
  $("lobby-tip").onclick = () => { tipI = (tipI + 1) % VD.TIPS.length; showTip(); }; showTip();
  // rodada 39: faixa atrás do título e ícone no Continuar (só quando a arte existe)
  if (ASSETS.deco_lobby_banner) document.querySelector(".brand h1").classList.add("banner");
  // rodada 40: a faixa ondula quando a folha carrega (senão fica a estática); a versão vai na plaquinha de madeira
  const W = window.ANIM_SHEETS && window.ANIM_SHEETS.fx_banner_wave;
  if (W) { const src = new URL(W.src, location.href).href, im = new Image(); // URL absoluta: dentro de var() o CSS resolveria a partir de css/
    im.onload = () => { const h = document.querySelector(".brand h1.banner"); if (h) { h.style.setProperty("--wave", `url("${src}")`); h.classList.add("wave"); } }; im.src = src; }
  if (ASSETS.icon_version_tag) {
    const v = document.querySelector(".brand .ver"), h1 = document.querySelector(".brand h1"); v.classList.add("tag"); v.parentElement.classList.add("has-tag");
    const hang = () => { if (getComputedStyle(v).position !== "absolute") { v.style.left = v.style.top = ""; return; } // celular: fica no fluxo, abaixo da faixa
      v.style.left = `${h1.offsetLeft + h1.offsetWidth - 96}px`; v.style.top = `${h1.offsetTop + h1.offsetHeight - 4}px`; // rodada 41: o gancho fecha o vão
      if (hook) { hook.style.left = `${h1.offsetLeft + h1.offsetWidth - 72}px`; hook.style.top = `${h1.offsetTop + h1.offsetHeight - 14}px`; } };
    const hook = ASSETS.deco_version_hook ? document.createElement("img") : null; // gancho em S: curva de cima na borda da faixa, de baixo na cordinha
    if (hook) { hook.className = "ver-hook"; hook.alt = ""; hook.src = ASSETS.deco_version_hook; hook.srcset = `${ASSETS.deco_version_hook} 1x, ${ASSETS.deco_version_hook_2x} 2x`; v.parentElement.appendChild(hook); }
    hang(); addEventListener("resize", hang);
  }
  if (ASSETS.icon_continue_play) $("continue").innerHTML = `<img class="btn-icon" src="${ASSETS.icon_continue_play}" alt="">CONTINUAR`;
  // rodada 109: com contas (js/account.js), o lobby só guarda a escolha de aparência; criar e entrar passam pela conta
  window.ValdoraLobby = { hero: () => heroId, setHero: (id) => { if (HEROES.some((h) => h.id === id)) { heroId = id; renderHeroes(); } }, esc };
  $("play").onclick = () => {
    if (window.ValdoraAccount) return ValdoraAccount.create($("name").value, heroId);
    if (G.readSave() && !confirmNew) { confirmNew = true; $("new-warn").hidden = false; $("play").textContent = "CONFIRMAR NOVO JOGO"; return; }
    G.start({ name: $("name").value.trim().slice(0, 14) || "Aventureiro", hero: heroId });
  };
  $("continue").onclick = () => { const s = G.readSave(); if (s) G.start(s); };
  document.addEventListener("valdora:lobby", render);
  renderHeroes(); render();
})();
