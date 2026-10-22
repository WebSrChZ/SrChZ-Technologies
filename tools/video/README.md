# Vídeo vertical do site — 9:16

Gera `assets/video/srchz-site-9x16.mp4`: 1080×1920, 32s, 30fps, H.264.

> O filme institucional **The Order of Chaos** (55s, 16:9 e 9:16) usa o mesmo
> método num pipeline próprio: veja [`README-film.md`](README-film.md).

**Não é mockup.** O que aparece na tela são capturas reais das páginas deste
repositório, animadas por cima. Trocar o texto do site muda o vídeo na próxima
renderização.

## Por que três etapas

| arquivo | faz |
|---|---|
| `capture.js` | abre cada página num viewport 540×960 @2x e salva PNG de página inteira |
| `timeline.html` | o roteiro: cenas, tempos e movimento, numa função `render(t)` |
| `render.js` | chama `render(t)` quadro a quadro, captura, e encoda com ffmpeg |

A separação existe porque **iframe carregando no meio da gravação dá timing
irregular e quadro perdido**. Capturando antes, cada quadro é determinístico:
renderizar de novo produz um arquivo idêntico, e o movimento não depende da
velocidade da máquina.

Pelo mesmo motivo o movimento é calculado em JavaScript a partir de `t`, e não
com animação CSS — CSS não é amostrável quadro a quadro de forma confiável.

## Rodar

```bash
# 1. fontes (não moram no repo)
mkdir -p /tmp/video/fonts && cd /tmp/video/fonts
npm pack @fontsource/eb-garamond @fontsource/inter
tar xzf fontsource-eb-garamond-*.tgz && tar xzf fontsource-inter-*.tgz

# 2. capturar o site
cd <repo>
VIDEO_WORK=/tmp/video node tools/video/capture.js

# 3. recortar as páginas muito altas (o catálogo passa de 36.000px)
cd /tmp/video/shots && mkdir -p ../crop
for f in *.png; do
  h=$(ffprobe -v error -select_streams v -show_entries stream=height -of csv=p=0 "$f")
  nh=$(( h > 4800 ? 4800 : h ))
  ffmpeg -loglevel error -y -i "$f" -vf "crop=1080:$nh:0:0" "../crop/$f"
done

# 4. renderizar e encodar
cd <repo>
VIDEO_WORK=/tmp/video \
VIDEO_FONTS=/tmp/video/fonts/package/files \
VIDEO_OUT=assets/video/srchz-site-9x16.mp4 \
node tools/video/render.js
```

Os ~960 quadros intermediários ocupam uns 300 MB em `$VIDEO_WORK/frames` e
podem ser apagados depois.

## Editar o roteiro

Tudo que é conteúdo está no topo de `timeline.html`: as constantes `LANGS`,
`DOORS`, `TOOLS` e o objeto `T` com os tempos de cada cena em milissegundos.
Trocar uma frase, reordenar uma cena ou mudar duração é editar texto e rodar a
etapa 4 de novo — não é retrabalho de vídeo.

## Decisões que não são óbvias

**Elementos fixos são ocultados na captura.** Numa captura de página inteira,
`position:fixed` renderiza uma vez e cai no topo em vez de acompanhar a
rolagem — o botão flutuante do WhatsApp aparecia solto no meio da tela. O
`capture.js` esconde `.wa`, `.wa-fab`, `.dock` e `.toast`.

**As animações de entrada do site são desligadas na captura.** O site revela
blocos conforme se rola; num print isso congelaria metade da página invisível.

**Títulos em EB Garamond, não na Cormorant Garamond do site.** A Cormorant
desenha circunflexo e agudo soltos, flutuando acima e à esquerda da letra —
"três" vira "trêˆs". EB Garamond é da mesma linhagem e acentua português
direito. Mesmo motivo do `tools/render_social.js`.

**Sem áudio.** Trilha com licença é decisão de quem publica.
