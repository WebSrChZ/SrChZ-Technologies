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

## Como o filme é montado

A unidade não é a cena: é o **plano**. São 52, medidos em tempos de 600ms
(100 BPM), com corte seco entre eles. A duração varia de meio tempo a doze —
é a variação que dá ritmo, não a velocidade média. O plano mais longo é o
cartão final, logo depois do mais curto.

A lista está em `SHOTS`, no fim de `film.html`. Cada entrada diz o tipo
(`k`), a duração em tempos (`b`) e os parâmetros do tipo. Acrescentar um
plano é acrescentar uma linha; os tempos absolutos, as marcas de som e os
instantes que a checagem amostra saem todos dali.

### Os atos

| ato | t | o que carrega |
|---|---|---|
| 01 · o sinal | 0–7,2s | BRAND / ENGINEERING / DATA / STRATEGY soltos, a rede apertando, a marca |
| 02 · o método | 7,2–11,4s | "A área muda. O método não." + Perception · Strategy · Execution |
| 03 · as três portas | 11,4–15s | a home e dois closes |
| 04 · Branding & Growth | 15–21,6s | a página /growth, os serviços, três closes |
| 05 · Engenharia & END | 21,6–29,4s | a página /end e o diagrama do ensaio em tela cheia |
| 06 · Tecnologia & Dados/IA | 29,4–36,6s | a página /tech e o grafo em tela cheia |
| 07 · alcance | 36,6–42,6s | a mesma home em pt, en, es e ja |
| 08 · acelerando | 42,6–46,8s | doze planos encurtando |
| 09 · um sistema | 46,8–52,8s | "Três práticas. Um método." |
| 10 · o fecho | 52,8–60s | o cartão final com o WhatsApp |

Mudar uma frase, reordenar ou esticar um plano é editar texto e renderizar de
novo — não é retrabalho de vídeo.

## Rodar

```bash
# 1. fontes (não moram no repo)
mkdir -p /tmp/video/fonts && cd /tmp/video/fonts
npm pack @fontsource/eb-garamond @fontsource/inter
tar xzf fontsource-eb-garamond-*.tgz && tar xzf fontsource-inter-*.tgz

cd <repo>
export VIDEO_WORK=/tmp/video
export VIDEO_FONTS=/tmp/video/fonts/package/files

# 2. capturar o site nos dois formatos (18 PNGs em $VIDEO_WORK/film)
node tools/video/film-capture.js

# 3. conferir a geometria antes de gastar uma renderização
node tools/video/film-render.js --check

# 4. o som (precisa vir antes: o render embute o wav que encontrar)
python3 tools/video/film-audio.py

# 5. renderizar os dois masters
#    --mb 3    desfoque de movimento (3x o tempo; use 1 enquanto itera)
#    --fmt v   um formato só
#    --from A  começa em A segundos
#    --secs B  renderiza B segundos
#    --noaudio sai sem som (para pedaços que serão juntados)
#    --out X   nome do arquivo de saída
node tools/video/film-render.js --mb 3

# 6. legendas
node tools/video/film-subs.js
```

A etapa 3 abre 31 instantes do filme em cada formato e **falha** se algum
bloco sair do quadro ou encostar em outro. Foi ela que pegou o cartão técnico
em cima dos chips no 16:9, o texto do painel em cima dos chips no 9:16, a
pergunta final colada nas duas bordas e — quando a cena de idiomas entrou —
os chips empurrados para fora do quadro pela margem de uma `<div>` vazia.
Rodar antes custa 40 segundos; descobrir depois custa a renderização inteira.

## O som

`film-audio.py` sintetiza tudo do zero: um leito grave contínuo mais eventos
— corte de cena, impacto, tique de interface, sino e o *ping* do ensaio na
cena de END. **Não é trilha.** Não tem melodia, não tem instrumento tocado,
não tem sample de banco, e por isso não depende de licença de terceiros: não
há obra de terceiro nenhuma dentro. Se um dia entrar música licenciada, ela
soma por cima — o filme não precisa dela para se explicar.

As marcas vivem no array `CUES` de `film.html`, não no script de áudio. Se
uma cena mudar de duração, imagem e som andam juntos porque leem a mesma
tabela.

A mixagem é feita em duas passagens de `loudnorm` com um compressor leve na
frente, mirando **−16 LUFS** com pico real em **−1,5 dBTP**: as redes
normalizam perto de −14 e atenuam o que passa disso. Sem isso o arquivo saía
em −24,8 LUFS com 15,8 LU de faixa — os impactos dominavam e o leito sumia no
alto-falante do telefone. Fechar o compressor demais tem o problema oposto: a
primeira tentativa derrubou a faixa para 1,8 LU, uma parede plana em que o
impacto deixa de ser impacto. O ajuste atual fica em torno de 4,6 LU.

Sem numpy de propósito — o container não tem, e Python puro resolve em sete
segundos um arquivo que sai uma vez.

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

## Por que tem movimento o tempo todo

A primeira montagem era de nove cenas de 5 a 7s que dissolviam umas nas
outras. Medida quadro a quadro, não havia **um** corte em 60s e a mudança
visual mediana era 0,0003 — imagem praticamente parada.

Medindo cinco Reels usados como referência com o mesmo teste, o resultado foi
contraintuitivo: quatro delas **quase não cortam** (zero cortes em 14s, zero
em 21s, um em 73s), e mesmo assim a mudança mediana por quadro é 3 a 20x
maior. O que prende atenção não é o corte — é que a imagem nunca está parada,
e tem profundidade.

Daí três coisas no desenho:

**A câmera nunca para.** Três senóides de períodos primos entre si movem o
mundo inteiro em 3D. A combinação não se repete dentro do filme, então não
existe quadro igual ao anterior.

**A moldura fica de três-quartos** e gira devagar ao longo do plano. Parada de
frente ela é um retângulo chapado, e era disso que o filme era feito.

**O desfoque de movimento é real**, não filtro: `--mb N` desenha N subquadros
por quadro e o ffmpeg funde cada grupo com `tmix`. O obturador é de 180 graus
— os subquadros cobrem metade do intervalo do quadro, não o intervalo inteiro.
Cobrindo tudo, o rastro dobra de tamanho e a imagem fica permanentemente mole.

## O que este pipeline não faz

Ele renderiza DOM num navegador, quadro a quadro. Isso dá perspectiva,
desfoque de movimento e profundidade por camada. **Não dá geometria 3D nem
material** — tipografia com volume e reflexo, como se vê em peça feita em
After Effects ou Cinema 4D, está fora do alcance. Também não há filmagem:
não há câmera nem objeto real a filmar.

Se um dia o filme precisar daquele acabamento, o caminho é produzir em AE — e
o que está aqui serve de roteiro, com os tempos, os textos e as capturas
prontos.

## Renderizar em pedaços

Um master com `--mb 3` leva uns 45 minutos por formato. Se a máquina que
renderiza reiniciar no meio, perde-se tudo — aconteceu três vezes durante a
produção deste filme, e as duas primeiras custaram a renderização inteira.

A saída para isso é partir o master e juntar depois. Os pedaços saem **sem
som** e **fora do repositório**, para que um reinício no meio não deixe mp4
pela metade versionado:

```bash
export VIDEO_OUT=$VIDEO_WORK/chunks && mkdir -p "$VIDEO_OUT"
for a in 0 15 30 45; do
  node tools/video/film-render.js --fmt h --mb 3 \
    --from $a --secs 15 --noaudio --out h$a.mp4
done

cd "$VIDEO_OUT"
for a in 0 15 30 45; do echo "file '$PWD/h$a.mp4'"; done > list.txt
ffmpeg -f concat -safe 0 -i list.txt -c copy video.mp4
ffmpeg -i video.mp4 -i <repo>/assets/video/srchz-order-of-chaos.wav \
  -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -ar 48000 -shortest \
  -movflags +faststart <repo>/assets/video/srchz-order-of-chaos-16x9.mp4
```

Se um pedaço morrer no meio, ele fica sem o átomo `moov` e o `ffprobe`
acusa; refaz-se só aquele. Na terceira queda, isso custou 12 minutos em vez
de 45.

**Como saber se a emenda apareceu na imagem.** Mede-se a mudança visual
quadro a quadro e olha-se os instantes das emendas. Nas emendas que caem
sobre um corte de plano do roteiro o salto é esperado — é o corte. A emenda
que **não** tem corte por perto é o controle: se a concatenação tivesse
introduzido artefato, ele apareceria justamente ali.
