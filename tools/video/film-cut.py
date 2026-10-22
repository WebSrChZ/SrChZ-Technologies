#!/usr/bin/env python3
"""Corte de 30 s do filme, tirado do master aprovado.

A imagem sai do master de 60 s, e nao de uma renderizacao nova: o site
mudou desde a aprovacao, e capturar de novo daria outro filme. O corte pega
oito trechos do master e junta com fusao ou corte seco. O som nao e cortado
do master — sai do mesmo film-audio.py do filme inteiro, sobre a tabela de
cues remontada para o corte, entao afx e trilha continuam inteiros e a
trilha ganha um andamento proprio para os impactos do corte.

    python3 film-cut.py              escreve em assets/video
    VIDEO_OUT=... python3 film-cut.py

Precisa dos dois masters de 60 s em assets/video (ou em VIDEO_SRC).
"""
import importlib.util
import json
import os
import subprocess
import sys
import tempfile

FPS = 30
DIR = os.path.dirname(os.path.abspath(__file__))
SITE = os.environ.get('SITE_ROOT') or os.path.normpath(os.path.join(DIR, '..', '..'))
OUT = os.environ.get('VIDEO_OUT') or os.path.join(SITE, 'assets', 'video')
SRC = os.environ.get('VIDEO_SRC') or os.path.join(SITE, 'assets', 'video')
NAME = 'srchz-order-of-chaos-30s'

# Os trechos, em quadros do master.
#
# A conta que fecha o corte: em 109,6 BPM os tres impactos — 3,5 s, 21,03 s
# e 25,4 s na saida — caem na cabeca dos compassos 0, 8 e 10, e o filme
# termina em 30,0 s exatos. Cada troca de cena cai num tempo da musica (3, 7,
# 13, 18 e 23 contando do primeiro impacto), entao o whoosh de cada troca
# bate junto com a levada. Quem escolhe o andamento e o film-audio.py, a
# partir dos impactos; esta tabela foi montada para que ele ache esse.
#
# Ficam as tres praticas, as tres: o filme nao pode reduzir a empresa a uma
# delas. Saem "Um site. Tres entradas." e "Comeca com uma conversa", que o
# convite final ja cobre.
#
#   'x'   termina em fusao com o trecho seguinte, como as cenas do filme somem
#   'c'   corte seco: o trecho seguinte comeca num impacto, e fundir ali
#         amoleceria o impacto
#   'f'   some no preto e corta seco no impacto seguinte
DISSOLVE = 11    # quadros, ~0,37 s: o tempo que as cenas do filme levam para sumir
CUT = [
    # inicio fim  saida
    (0,    165,  'x'),   # abertura, impacto, logo: "O problema raramente e o que parece."
    (165,  242,  'x'),   # "A area muda. O metodo nao."
    (558,  668,  'x'),   # 01 Branding & Growth
    (780,  873,  'x'),   # 02 Engenharia & END
    (990,  1083, 'x'),   # 03 Tecnologia & Dados/IA
    (1200, 1348, 'c'),   # quatro idiomas, ate o japones assentar
    (1350, 1481, 'f'),   # "Tres praticas. Um metodo."
    (1662, 1800, None),  # o convite final, inteiro
]


def plan():
    """Onde cada trecho comeca na saida, e o fim do que se ve dele.

    O fim visivel e onde a fusao ou o escurecimento comeca: o que cai depois
    disso (um tique, o comeco de uma legenda) ja esta sumindo da tela, e
    entrar no corte seria som de coisa que nao se ve."""
    out, rows = 0, []
    for a, b, kind in CUT:
        tail = DISSOLVE if kind in ('x', 'f') else 0
        rows.append((a, b, kind, out, b - tail))
        out += (b - a) - (DISSOLVE if kind == 'x' else 0)
    return rows, out


def remap(ms, rows):
    """Tempo do master (ms) -> tempo do corte (ms), ou None se ficou fora."""
    f = ms * FPS / 1000.0
    for a, b, kind, out, vis in rows:
        if a <= f < vis:
            return (out + f - a) * 1000.0 / FPS
    return None


def cut_cues(cues, rows):
    """Os cues do filme que caem dentro do corte, no tempo do corte."""
    kept = []
    for ms, kind, force in cues:
        t = remap(ms, rows)
        if t is not None:
            kept.append([round(t, 1), kind, force])
    return kept


def cut_caps(caps, rows):
    """Legendas: cada uma fica no trecho em que comeca, e termina antes de o
    trecho sumir."""
    kept = []
    for a, b, text in caps:
        f = a * FPS / 1000.0
        for ra, rb, kind, out, vis in rows:
            if ra <= f < vis:
                end = min(b * FPS / 1000.0, vis)
                kept.append((round((out + f - ra) * 1000.0 / FPS),
                             round((out + end - ra) * 1000.0 / FPS), text))
                break
    return kept


def srt(caps):
    """Mesmo formato de film-subs.js."""
    def stamp(ms):
        return '%02d:%02d:%02d,%03d' % (ms // 3600000, ms // 60000 % 60,
                                        ms // 1000 % 60, ms % 1000)
    return '\n'.join('%d\n%s --> %s\n%s\n' % (i + 1, stamp(a), stamp(b), t)
                     for i, (a, b, t) in enumerate(caps))


def graph():
    """O filtro do ffmpeg: recorta os trechos, funde os 'x' e emenda o resto.

    Fusao e xfade com o tempo de DISSOLVE. Um trecho 'f' escurece no proprio
    fim antes da emenda. Os trechos ligados por fusao formam um bloco; os
    blocos se juntam com concat."""
    n = len(CUT)
    parts = ['[0:v]split=%d%s' % (n, ''.join('[r%d]' % i for i in range(n)))]
    for i, (a, b, kind) in enumerate(CUT):
        chain = '[r%d]trim=start_frame=%d:end_frame=%d,setpts=PTS-STARTPTS' % (i, a, b)
        if kind == 'f':
            chain += ',fade=t=out:start_frame=%d:nb_frames=%d' % (b - a - DISSOLVE, DISSOLVE)
        parts.append(chain + '[s%d]' % i)
    blocks, cur, length = [], 's0', CUT[0][1] - CUT[0][0]
    for i in range(1, n):
        if CUT[i - 1][2] == 'x':
            lbl = 'x%d' % i
            parts.append('[%s][s%d]xfade=transition=fade:duration=%.6f:offset=%.6f[%s]'
                         % (cur, i, DISSOLVE / FPS, (length - DISSOLVE) / FPS, lbl))
            cur, length = lbl, length + (CUT[i][1] - CUT[i][0]) - DISSOLVE
        else:
            blocks.append(cur)
            cur, length = 's%d' % i, CUT[i][1] - CUT[i][0]
    blocks.append(cur)
    parts.append('%sconcat=n=%d:v=1:a=0[v]' % (''.join('[%s]' % b for b in blocks), len(blocks)))
    return ';'.join(parts)


def main():
    sys.dont_write_bytecode = True    # carregar o film-audio.py nao deixa __pycache__ no repo
    spec = importlib.util.spec_from_file_location('film_audio', os.path.join(DIR, 'film-audio.py'))
    fa = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(fa)

    src = open(os.path.join(DIR, 'film.html'), encoding='utf-8').read()
    rows, total = plan()
    dur = round(total * 1000.0 / FPS)
    cues = cut_cues(fa.js_table(src, 'CUES'), rows)
    caps = cut_caps(fa.js_table(src, 'CAPS'), rows)
    print('  %d trechos · %d quadros · %.1fs · %d cues · %d legendas'
          % (len(CUT), total, dur / 1000.0, len(cues), len(caps)))

    work = os.environ.get('VIDEO_WORK') or tempfile.mkdtemp(prefix='film-cut-')
    os.makedirs(work, exist_ok=True)
    os.makedirs(OUT, exist_ok=True)
    table = os.path.join(work, NAME + '.cues.json')
    json.dump({'CUES': cues, 'DUR': dur}, open(table, 'w', encoding='utf-8'))

    # o som: o mesmo gerador do filme inteiro, sobre a tabela do corte
    env = dict(os.environ, VIDEO_CUES=table, VIDEO_NAME=NAME, VIDEO_OUT=work)
    r = subprocess.run([sys.executable, os.path.join(DIR, 'film-audio.py')], env=env)
    if r.returncode != 0:
        sys.exit('ERRO: film-audio.py falhou no corte.')
    wav = os.path.join(work, NAME + '.wav')

    for fmt in ('16x9', '9x16'):
        master = os.path.join(SRC, 'srchz-order-of-chaos-%s.mp4' % fmt)
        if not os.path.exists(master):
            sys.exit('ERRO: falta o master %s.' % master)
        dst = os.path.join(OUT, '%s-%s.mp4' % (NAME, fmt))
        # crf 16, e nao o 18 do render: o corte reencoda um master que ja e
        # uma compressao, e a segunda geracao precisa de folga
        r = subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', master, '-i', wav,
                            '-filter_complex', graph(), '-map', '[v]', '-map', '1:a:0',
                            '-c:v', 'libx264', '-preset', 'slow', '-crf', '16',
                            '-pix_fmt', 'yuv420p', '-r', str(FPS),
                            '-c:a', 'aac', '-b:a', '192k', '-ar', '48000',
                            '-movflags', '+faststart', '-shortest', dst])
        if r.returncode != 0:
            sys.exit('ERRO: ffmpeg falhou no %s.' % fmt)
        got = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0',
                              '-count_frames', '-show_entries', 'stream=nb_read_frames',
                              '-of', 'csv=p=0', dst], capture_output=True, text=True).stdout.strip()
        if got != str(total):
            sys.exit('ERRO: %s saiu com %s quadros, esperava %d.' % (dst, got, total))
        with open(os.path.join(OUT, '%s-%s.pt-BR.srt' % (NAME, fmt)), 'w', encoding='utf-8') as f:
            f.write(srt(caps))
        print('  %s · %s quadros' % (dst, got))


if __name__ == '__main__':
    main()
