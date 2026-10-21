# The Order of Chaos — filme institucional

Gera dois masters do mesmo filme, 55s, 30fps, H.264:

| arquivo | formato | onde serve |
|---|---|---|
| `assets/video/srchz-order-of-chaos-16x9.mp4` | 1920×1080 | site, YouTube, apresentação, tela de evento |
| `assets/video/srchz-order-of-chaos-9x16.mp4` | 1080×1920 | Reels, TikTok, Stories, Shorts |
| `assets/video/srchz-order-of-chaos-*.pt-BR.srt` | — | legenda em pt-BR, igual nos dois |
| `assets/video/srchz-order-of-chaos-*-capa.jpg` | — | capa/thumbnail: o quadro da marca, em 4,9s |

**Não é mockup.** O que aparece dentro da moldura são capturas reais das
páginas deste repositório. Mudar o texto do site muda o filme na próxima
renderização.

## As oito cenas

| # | t | cena | o que carrega |
|---|---|---|---|
| 01 | 0–5,5s | o sinal | BRAND / ENGINEERING / DATA / STRATEGY soltos, a rede apertando, a marca |
| 02 | 5,5–12s | o método | "A área muda. O método não." + Perception · Strategy · Execution |
| 03 | 12–18,6s | a interface | a home rolando: um site, três entradas |
| 04 | 18,6–26s | Branding & Growth | a página /growth e os serviços |
| 05 | 26–33s | Engenharia & END | a página /end e o diagrama de ensaio |
| 06 | 33–40s | Tecnologia & Dados/IA | a página /tech e o grafo de sistemas |
| 07 | 40–47s | um sistema | "Três práticas. Um método." |
| 08 | 47–55s | conversão | volta ao site, e o cartão final com o WhatsApp |

Os tempos estão no objeto `T` e no array `PANELS`, no fim de `film.html`.
Mudar uma frase, reordenar ou esticar uma cena é editar texto e renderizar de
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

# 4. renderizar os dois masters (ou --fmt v / --fmt h para um só)
node tools/video/film-render.js

# 5. legendas
node tools/video/film-subs.js
```

A etapa 3 abre 27 instantes do filme em cada formato e **falha** se algum
bloco sair do quadro ou encostar em outro. Foi ela que pegou o cartão técnico
em cima dos chips no 16:9, o texto do painel em cima dos chips no 9:16 e a
pergunta final colada nas duas bordas. Rodar antes custa 40 segundos;
descobrir depois custa a renderização inteira.

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

**Sem áudio.** Trilha com licença é decisão de quem publica. O filme foi
montado para funcionar mudo: nenhuma informação depende de som.

**Sem imagem de banco.** Não há foto de solda, trilho ou instrumento que não
seja da empresa. A cena 05 resolve isso com o diagrama do próprio ensaio —
feixe angular, salto, perna, espessura — em vez de uma foto genérica de
indústria que diria menos e fingiria mais.
