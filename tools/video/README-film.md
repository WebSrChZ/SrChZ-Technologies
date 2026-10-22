# The Order of Chaos — filme institucional

Gera dois masters do mesmo filme, 60s, 30fps, H.264 com som:

| arquivo | formato | onde serve |
|---|---|---|
| `assets/video/srchz-order-of-chaos-16x9.mp4` | 1920×1080 | site, YouTube, apresentação, tela de evento |
| `assets/video/srchz-order-of-chaos-9x16.mp4` | 1080×1920 | Reels, TikTok, Stories, Shorts |
| `assets/video/srchz-order-of-chaos-*.pt-BR.srt` | — | legenda em pt-BR, igual nos dois |
| `assets/video/srchz-order-of-chaos-*-capa.jpg` | — | capa/thumbnail: o quadro da marca, em 4,9s |
| `assets/video/srchz-order-of-chaos.wav` | — | o desenho de som, já mixado (entra nos dois mp4) |

**Não é mockup.** O que aparece dentro da moldura são capturas reais das
páginas deste repositório. Mudar o texto do site muda o filme na próxima
renderização.

## As nove cenas

| # | t | cena | o que carrega |
|---|---|---|---|
| 01 | 0–5,5s | o sinal | BRAND / ENGINEERING / DATA / STRATEGY soltos, a rede apertando, a marca |
| 02 | 5,5–12s | o método | "A área muda. O método não." + Perception · Strategy · Execution |
| 03 | 12–18,6s | a interface | a home rolando: um site, três entradas |
| 04 | 18,6–26s | Branding & Growth | a página /growth e os serviços |
| 05 | 26–33s | Engenharia & END | a página /end e o diagrama de ensaio |
| 06 | 33–40s | Tecnologia & Dados/IA | a página /tech e o grafo de sistemas |
| 07 | 40–45s | alcance | a mesma home em pt, en, es e ja — quatro idiomas |
| 08 | 45–52s | um sistema | "Três práticas. Um método." |
| 09 | 52–60s | conversão | volta ao site, e o cartão final com o WhatsApp |

Os tempos estão no objeto `T` e no array `PANELS`, no fim de `film.html`.
Mudar uma frase, reordenar ou esticar uma cena é editar texto e renderizar de
novo — não é retrabalho de vídeo.

## Rodar

```bash
# 1. fontes (não moram no repo)
mkdir -p /tmp/video/fonts && cd /tmp/video/fonts
npm pack @fontsource/eb-garamond @fontsource/inter @fontsource/cormorant-garamond
for t in fontsource-*.tgz; do tar xzf $t; done   # a Cormorant e so da capa do Reels

cd <repo>
export VIDEO_WORK=/tmp/video
export VIDEO_FONTS=/tmp/video/fonts/package/files

# 2. capturar o site nos dois formatos (18 PNGs em $VIDEO_WORK/film)
node tools/video/film-capture.js

# 3. conferir a geometria antes de gastar uma renderização
node tools/video/film-render.js --check

# 4. o som (precisa vir antes: o render embute o wav que encontrar)
python3 tools/video/film-audio.py

# 5. renderizar os dois masters (ou --fmt v / --fmt h para um só)
node tools/video/film-render.js

# 6. legendas
node tools/video/film-subs.js

# 7. o corte de 30 s, tirado dos masters (ver "Corte de 30 s")
python3 tools/video/film-cut.py

# 8. a capa do Reels (ver "Capa do Reels")
node tools/video/film-cover.js
```

A etapa 3 abre 31 instantes do filme em cada formato e **falha** se algum
bloco sair do quadro ou encostar em outro. Foi ela que pegou o cartão técnico
em cima dos chips no 16:9, o texto do painel em cima dos chips no 9:16, a
pergunta final colada nas duas bordas e — quando a cena de idiomas entrou —
os chips empurrados para fora do quadro pela margem de uma `<div>` vazia.
Rodar antes custa 40 segundos; descobrir depois custa a renderização inteira.

## O som

`film-audio.py` sintetiza tudo do zero, trilha e afx: nenhum sample de banco,
nenhuma obra de terceiro dentro, e por isso nenhuma licença a pagar.

**Os afx** — corte de cena, impacto, tique de interface, sino e o *ping* do
ensaio na cena de END — são os da versão aprovada. As marcas vivem no array
`CUES` de `film.html`, não no script de áudio: se uma cena mudar de duração,
imagem e som andam juntos porque leem a mesma tabela.

**A trilha** substituiu o drone que havia por baixo — uma nota de lá pelos 60
segundos inteiros, que deixava o filme parado mesmo com a imagem andando.

- **O andamento sai do filme.** `fit_tempo()` procura o BPM em que os três
  impactos caem na cabeça do compasso. Neste corte dá 115,6 BPM, com os
  impactos nos compassos 0, 20 e 25 e erro de 20 ms no do meio — menos de um
  quadro. Cada impacto vira a entrada de uma seção.
- **Am – F – Dm – Esus4**, um acorde por compasso. Os quatro têm lá dentro
  porque o sino dos afx bate em lá 880 Hz; um acorde sem lá brigaria com cada
  badalada. Esus4 antes de cada impacto, Am no impacto: a tensão resolve onde
  a imagem bate.
- **Antes de cada impacto a trilha cresce, não esvazia.** Esvaziar antes do
  drop é convenção de pista, mas este filme cresce até cada impacto, e um vão
  ali brigava com a imagem.
- **A energia segue a curva `sub`** que movia o drone, comprimida de 6 para
  3,5 dB: com o arco inteiro, cada dB do clímax saía dos afx.
- **A trilha abaixa embaixo de cada afx** (`DUCK`), começando 12 ms antes —
  dá para antecipar porque o cue diz quando o evento vem. Ela sai em dois
  barramentos: no impacto, só os graves cedem (bumbo, baixo e pedal), pelo
  tempo do estrondo; acorde e arpejo entram inteiros junto com ele. Com os
  graves somando em cima do impacto, o pico bruto ia de 1,13 para 1,62 e o
  limitador esmagava justamente o impacto.

`VIDEO_BED=drone python3 film-audio.py` regera o áudio da versão anterior,
com o drone. É a prova de que os afx não mudaram: subtraído do áudio do master
aprovado, sobra −43 dB, que é o ruído da compressão AAC.

Medido contra a versão com drone: os afx ficam na mesma altura (mediana
−15,1 contra −14,9 dB) e com mais destaque sobre o fundo (6,2 contra 5,6 dB).
Os impactos saem cerca de 1 dB abaixo em nível absoluto, e isso não tem
conserto sem perder a trilha: o master normaliza em −16 LUFS, e a trilha
ocupa parte dessa loudness, que antes era quase toda dos afx — o drone, em
55 Hz, quase não conta no LUFS. Para os impactos voltarem ao nível exato a
trilha teria de cair uns 7 dB. `MUSIC` controla esse equilíbrio.

A mixagem é feita em duas passagens de `loudnorm` com um compressor leve na
frente, mirando **−16 LUFS** com pico real em **−1,5 dBTP**: as redes
normalizam perto de −14 e atenuam o que passa disso. Sem isso o arquivo saía
em −24,8 LUFS com 15,8 LU de faixa — os impactos dominavam e o leito sumia no
alto-falante do telefone. Fechar o compressor demais tem o problema oposto: a
primeira tentativa derrubou a faixa para 1,8 LU, uma parede plana em que o
impacto deixa de ser impacto. Com a trilha, a faixa fica em 4,9 LU.

Sem numpy de propósito — o container não tem, e Python puro resolve em uns
35 segundos um arquivo que sai uma vez.

### Trocar só o som de um master já aprovado

Se a imagem está aprovada e só o som muda, não renderize de novo: copie o
vídeo do master e troque o áudio. Foi assim que os masters atuais saíram.

```bash
ffmpeg -i master.mp4 -i srchz-order-of-chaos.wav -map 0:v:0 -map 1:a:0 \
  -c:v copy -c:a aac -b:a 192k -ar 48000 -movflags +faststart -shortest novo.mp4
```

Para provar que a imagem não mudou, compare o hash só do stream de vídeo —
tem de dar igual:

```bash
ffmpeg -loglevel error -i master.mp4 -map 0:v -c copy -f streamhash -hash md5 -
```

## Corte de 30 s

`film-cut.py` tira o corte de 30 s dos masters, nos dois formatos, com as
legendas: `srchz-order-of-chaos-30s-{16x9,9x16}.mp4` e `.pt-BR.srt`.

- **A imagem sai do master aprovado, não de uma renderização nova.** O site
  mudou desde a aprovação, e capturar de novo daria outro filme. São oito
  trechos, juntados com fusão de 11 quadros — o tempo que as cenas do filme
  levam para sumir — ou com corte seco onde o trecho seguinte começa num
  impacto, porque fundir ali amoleceria o impacto.
- **O som não é cortado do master.** Sai do mesmo `film-audio.py`, sobre a
  tabela de cues remontada para o corte (`VIDEO_CUES`): cada afx cai onde a
  imagem dele caiu, e a trilha ganha andamento próprio. Um afx que caía dentro
  de uma fusão fica de fora, porque seria som de algo que já está saindo da
  tela.
- **A conta que fecha o corte:** em 109,6 BPM os três impactos (3,5 / 21,03 /
  25,4 s) caem nos compassos 0, 8 e 10, e o filme termina em 30,0 s exatos.
  Cada troca de cena cai num tempo da música. A tabela `CUT` foi montada para
  isso, e o `film-audio.py` chega ao mesmo andamento sozinho, a partir dos
  impactos (erro de 13 ms no do meio).
- Ficam as três práticas, as três. Saem "Um site. Três entradas." e "Começa
  com uma conversa", que o convite final já cobre.
- CRF 16, e não o 18 do render: o corte reencoda um master que já é uma
  compressão, e a segunda geração precisa de folga.

Conferido: cada trecho bate com o quadro exato da origem — SSIM 0,999 contra
0,96 a 0,99 dos quadros vizinhos — e os impactos do corte ficam a menos de
0,6 dB dos do filme de 60 s.

## Capa do Reels

`film-cover.js` renderiza `film-cover.html` em 1080×1920 e grava
`srchz-order-of-chaos-reels-capa.jpg`. Serve para o de 60 s e para o de 30 s.

**A capa reproduz o topo da /growth.** O modelo foi um recorte 9:16 que o
usuário mandou da página: logo no alto, "High-Performance Ecosystems" entre
flores de lis, o nome em dourado e o cargo em caixa-alta espaçada. Só o cargo
muda, a pedido dele: Growth & Solutions Strategist. As posições do HTML são as
medidas daquele recorte, escaladas para 1080×1920, e a capa bate com ele a
menos de 3 px em cada linha. As fontes, as cores e os espaçamentos são os do
CSS da página: Cormorant Garamond 700 no nome, Inter 400 no resto e o mesmo
gradiente dourado nas duas linhas do nome.

Duas armadilhas que a capa já resolve:

- **A margem do logo.** A `srchz-mark.png` tem 720 px de largura, mas o desenho
  ocupa 496; o resto é transparente. Dimensionada pela largura do arquivo, a
  marca sai um terço menor do que parece.
- **A flor de lis.** A Inter não tem o ⚜. No celular ele vem de uma fonte do
  sistema e sai vazado e fino. Aqui a escolha automática seria a DejaVu, que
  desenha a flor cheia; a capa pede a FreeSerif, que desenha vazada.

**O grid do perfil corta o topo do logo.** O Instagram mostra a capa inteira na
aba Reels, mas no grid recorta os 1440 px do meio (3:4). O bloco do modelo vai
de y=159 a y=1658, 1499 px, então nenhum recorte 3:4 mostra tudo: o padrão
perde os 80 px de cima do logo. Foi a escolha do modelo, com o logo no alto.

O script recusa gerar a capa se uma fonte ou o logo não carregar, em vez de
deixar o nome sair em Georgia. Duas execuções dão o mesmo arquivo.

## Legenda queimada

Os masters saem limpos. Para uma cópia com a legenda no quadro — algumas redes
não leem `.srt` — é um comando, sem renderizar de novo:

```bash
ffmpeg -i assets/video/srchz-order-of-chaos-9x16.mp4 \
  -vf "subtitles=assets/video/srchz-order-of-chaos-9x16.pt-BR.srt:force_style=\
'FontName=Inter,FontSize=18,PrimaryColour=&H00FFFFFF&,BorderStyle=1,\
Outline=1,Shadow=1,MarginV=190'" \
  -c:a copy assets/video/srchz-order-of-chaos-9x16-legendado.mp4
```

`MarginV=190` levanta a legenda acima da tarja de baixo no 9:16; no 16:9 use
`MarginV=60`.

## Decisões que não são óbvias

**Quadro a quadro, não gravação de tela.** Cada quadro é `render(t)` mais um
screenshot: renderizar de novo produz arquivo idêntico, e o movimento não
depende da velocidade da máquina. Pelo mesmo motivo o movimento é calculado em
JavaScript a partir de `t`, e não com animação CSS — CSS não é amostrável
quadro a quadro de forma confiável.

**Os quadros vão direto para o ffmpeg.** 1650 quadros por formato em PNG dariam
uns 2,5 GB de arquivo intermediário que ninguém vai olhar. O screenshot é
escrito na entrada do ffmpeg, respeitando a contrapressão do pipe.

**O 16:9 usa a captura de desktop, não a de telefone.** Recortar o layout
mobile para paisagem daria uma coluna estreita no meio de uma tela larga, que
não é como o site se apresenta num monitor.

**Duas escalas de tipo.** `K` (0,82 no 16:9) vale onde a largura aperta — a
coluna ao lado da moldura, que tem 650px. `KT` (0,95) vale para as cenas de
tipo cheio, onde o 16:9 tem largura de sobra e encolher só deixaria o quadro
vazio.

**A rolagem é fração, não pixel.** A mesma página entra no quadro em escalas
diferentes nos dois formatos; um valor fixo em pixel passaria do fim da imagem
num deles e mostraria preto.

**O topo dos chips é medido, não fixo.** Vem do rodapé do bloco de texto em
`render()`. Um valor fixo só funcionaria para o título mais curto da lista.

**O impacto é um estouro de luz no centro, não um estrobo de quadro cheio.**
Tela branca inteira a 30fps incomoda no telefone, e branco não é da paleta.

**O brilho que passa pela marca é mascarado pelo alfa dela.** Sem a máscara, o
gradiente aparece como um retângulo branco por cima do logo.

**Títulos em EB Garamond, não na Cormorant Garamond do site.** A Cormorant
desenha circunflexo e agudo soltos, flutuando acima e à esquerda da letra —
"três" vira "trêˆs". EB Garamond é da mesma linhagem e acentua português
direito.

**O som é sintetizado, não licenciado.** Veja a seção "O som" acima. O filme
continua funcionando mudo: nenhuma informação depende de áudio.

**A cena de idiomas trava as quatro capturas na mesma altura de referência.**
As quatro páginas têm alturas um pouco diferentes — o japonês ocupa menos
linha — e usar a altura de cada uma fazia o quadro pular de posição a cada
troca. O argumento é "o mesmo site em quatro línguas", não quatro telas
diferentes.

**Sem imagem de banco.** Não há foto de solda, trilho ou instrumento que não
seja da empresa. A cena 05 resolve isso com o diagrama do próprio ensaio —
feixe angular, salto, perna, espessura — em vez de uma foto genérica de
indústria que diria menos e fingiria mais.
