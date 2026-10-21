#!/usr/bin/env python3
"""Desenho de som do filme, sintetizado do zero.

Nao e trilha: nao tem melodia, nao tem instrumento tocado, nao tem sample
de banco. E um leito grave com eventos em cima — corte, impacto, tique,
sino e o ping do ensaio — gerados por sintese aqui mesmo. Por isso nao
depende de licenca de terceiros: nao ha obra de terceiro nenhuma dentro.

As marcas vem do CUES de film.html, nao daqui. Se uma cena mudar de
duracao, a imagem e o som andam juntos, porque leem a mesma tabela.

    python3 film-audio.py              escreve em assets/video
    VIDEO_OUT=... python3 film-audio.py

Sem numpy de proposito: o container nao tem, e o custo de escrever isto
em Python puro e de uns segundos para um arquivo que sai uma vez.
"""
import array
import json
import math
import os
import re
import struct
import sys
import wave

SR = 48000
CH = 2
DIR = os.path.dirname(os.path.abspath(__file__))
SITE = os.environ.get('SITE_ROOT') or os.path.normpath(os.path.join(DIR, '..', '..'))
OUT = os.environ.get('VIDEO_OUT') or os.path.join(SITE, 'assets', 'video')

# ---------------------------------------------------------------- roteiro

def read_cues():
    """Le CUES e DUR de film.html. O roteiro manda; este arquivo obedece."""
    src = open(os.path.join(DIR, 'film.html'), encoding='utf-8').read()
    m = re.search(r'const CUES=(\[[\s\S]*?\n\]);', src)
    if not m:
        sys.exit('ERRO: nao achei CUES em film.html.')
    # a tabela vira JSON valido com tres ajustes: fora os comentarios,
    # aspas simples viram duplas, e .5 vira 0.5 (JSON exige o zero)
    body = re.sub(r'//[^\n]*', '', m.group(1))
    body = body.replace("'", '"')
    body = re.sub(r'(?<=[\s,\[])\.(\d)', r'0.\1', body)
    body = re.sub(r',(\s*\])', r'\1', body)
    cues = json.loads(body)
    d = re.search(r'const DUR=(\d+);', src)
    if not d:
        sys.exit('ERRO: nao achei DUR em film.html.')
    return cues, int(d.group(1))

# -------------------------------------------------------------- utilidades

class Noise:
    """Ruido branco com semente fixa: o mesmo arquivo em toda execucao."""
    def __init__(self, seed=20261021):
        self.s = seed

    def __call__(self):
        self.s = (self.s * 1103515245 + 12345) & 0x7FFFFFFF
        return self.s / 1073741823.5 - 1.0


def mix(buf, start, samples, gain_l, gain_r):
    """Soma um evento no leito, cortando o que passar do fim."""
    n = len(buf) // CH
    for i, v in enumerate(samples):
        j = start + i
        if j < 0:
            continue
        if j >= n:
            break
        buf[j * CH] += v * gain_l
        buf[j * CH + 1] += v * gain_r


def env_ad(n, attack, decay, curve=2.0):
    """Envelope ataque/queda, em amostras."""
    out = []
    for i in range(n):
        if i < attack:
            out.append((i / attack) if attack else 1.0)
        else:
            p = (i - attack) / max(1, decay)
            out.append(math.exp(-curve * 3.2 * p) if p < 1.6 else 0.0)
    return out

# ----------------------------------------------------------------- eventos

def ev_whoosh(force, noise):
    """Corte de cena: ruido passando por um passa-banda que sobe e desce."""
    n = int(SR * 0.62)
    lp = hp = 0.0
    out = []
    env = env_ad(n, int(n * 0.30), int(n * 0.70), 1.6)
    for i in range(n):
        p = i / n
        # o centro do filtro sobe e volta: e isso que da o "shhhou"
        f = 0.030 + 0.30 * math.sin(math.pi * p) ** 1.4
        x = noise()
        lp += f * (x - lp)
        hp += 0.004 * (lp - hp)
        out.append((lp - hp) * env[i] * 1.35 * force)
    return out


def ev_impact(force, noise):
    """Marca: seno caindo de 130 para 38 Hz, mais um estalo curto."""
    n = int(SR * 1.5)
    out = []
    ph = 0.0
    env = env_ad(n, int(SR * 0.004), int(n * 0.9), 1.5)
    lp = 0.0
    for i in range(n):
        p = i / n
        f = 38 + (130 - 38) * math.exp(-7.0 * p)
        ph += 2 * math.pi * f / SR
        body = math.sin(ph)
        # o estalo e so no comecinho
        crack = 0.0
        if p < 0.09:
            lp += 0.22 * (noise() - lp)
            crack = lp * math.exp(-34 * p) * 0.55
        # 0.52, nao 1.0: o impacto tem que pontuar, nao achatar o resto do
        # filme para caber debaixo dele
        out.append((body * 0.72 + crack * 0.9) * env[i] * force)
    return out


def ev_riser(force, noise):
    """Tensao antes de um corte: ruido abrindo e um seno subindo junto."""
    n = int(SR * 1.3)
    out = []
    ph = 0.0
    lp = 0.0
    for i in range(n):
        p = i / n
        f = 180 * (1 + 3.4 * p * p)
        ph += 2 * math.pi * f / SR
        lp += (0.02 + 0.14 * p) * (noise() - lp)
        out.append((lp * 0.8 + math.sin(ph) * 0.18) * (p ** 1.6) * force * 2.1)
    return out


def ev_tick(force, noise):
    """Tique de interface: estalo filtrado, curtissimo."""
    n = int(SR * 0.07)
    out = []
    lp = 0.0
    for i in range(n):
        p = i / n
        lp += 0.42 * (noise() - lp)
        out.append(lp * math.exp(-26 * p) * 1.15 * force)
    return out


def ev_bell(force, _noise):
    """Sino curto: fundamental e dois parciais inarmonicos, queda rapida."""
    n = int(SR * 1.1)
    out = []
    parts = [(1.0, 0.60), (2.76, 0.26), (5.40, 0.14)]
    f0 = 880.0
    for i in range(n):
        p = i / n
        s = 0.0
        for mult, amp in parts:
            # os parciais altos morrem antes, como num metal de verdade
            s += math.sin(2 * math.pi * f0 * mult * i / SR) * amp * math.exp(-(2.6 + mult) * p)
        out.append(s * 0.52 * force)
    return out


def ev_ping(force, _noise):
    """O ping do ensaio: pulso curto de 2,25 kHz com um eco no fundo —
    a ida e a volta do feixe. Nao e gravacao de equipamento; e o gesto."""
    n = int(SR * 0.85)
    out = []
    for i in range(n):
        t = i / SR
        p = i / n
        a = math.sin(2 * math.pi * 2250 * t) * math.exp(-30 * p) * 0.5
        # o retorno, mais fraco e mais grave
        b = 0.0
        if t > 0.17:
            q = (t - 0.17) / (n / SR)
            b = math.sin(2 * math.pi * 1680 * (t - 0.17)) * math.exp(-26 * q) * 0.22
        out.append((a + b) * 1.4 * force)
    return out

# -------------------------------------------------------------------- leito

def bed(buf, cues, total):
    """Drone grave continuo. O nivel vem dos cues 'sub' e anda em rampa
    entre eles: e o que faz o filme respirar de cena em cena."""
    marks = [(c[0], c[2]) for c in cues if c[1] == 'sub']
    tail = next((c[0] for c in cues if c[1] == 'tail'), total)
    noise = Noise(7707)
    ph1 = ph2 = 0.0
    air = 0.0
    k = 0
    for i in range(total):
        ms = i * 1000.0 / SR
        while k + 1 < len(marks) and ms >= marks[k + 1][0]:
            k += 1
        lvl = marks[k][1]
        if k + 1 < len(marks):
            a, b = marks[k], marks[k + 1]
            p = (ms - a[0]) / (b[0] - a[0])
            lvl = a[1] + (b[1] - a[1]) * min(1.0, max(0.0, p)) ** 0.6
        if ms < 400:                      # entra, nao estoura
            lvl *= ms / 400
        if ms > tail:                     # e sai inteiro
            lvl *= max(0.0, 1 - (ms - tail) / (total * 1000.0 / SR - tail))

        # duas fundamentais desafinadas de proposito: o batimento lento
        # entre elas e o que tira o drone do som de teste de audio
        # 0.09 Hz de diferenca: uma respiracao a cada 11s. Com 0.3 Hz o
        # batimento vira tremolo e chama atencao para si
        ph1 += 2 * math.pi * 55.0 / SR
        ph2 += 2 * math.pi * 55.09 / SR
        low = math.sin(ph1) * 0.5 + math.sin(ph2) * 0.42 + math.sin(ph1 * 2) * 0.10
        air += 0.0016 * (noise() - air)   # um fio de ar bem acima
        # o leito e o que segura o filme entre um evento e outro: baixo
        # demais e ele some no alto-falante do telefone
        v = (low * 0.26 + air * 2.4) * lvl
        buf[i * CH] += v
        buf[i * CH + 1] += v * 0.97       # leve diferenca: abre o estereo

# --------------------------------------------------------------------- main

def main():
    cues, dur_ms = read_cues()
    total = int(SR * dur_ms / 1000.0)
    buf = array.array('d', bytes(8 * total * CH))

    bed(buf, cues, total)

    noise = Noise()
    makers = {'whoosh': ev_whoosh, 'impact': ev_impact, 'riser': ev_riser,
              'tick': ev_tick, 'bell': ev_bell, 'ping': ev_ping}
    # os eventos alternam de lado para o quadro nao soar colado no centro
    pans = {'whoosh': 0.30, 'tick': 0.45, 'bell': 0.25, 'ping': 0.35,
            'riser': 0.15, 'impact': 0.0}
    side = 0
    for ms, kind, force in cues:
        if kind in ('sub', 'tail'):
            continue
        fn = makers.get(kind)
        if not fn:
            sys.exit('ERRO: cue desconhecido em film.html: ' + kind)
        spread = pans.get(kind, 0.0)
        side = -side if side else 1
        gl = 1.0 - spread * (0.5 + 0.5 * side)
        gr = 1.0 - spread * (0.5 - 0.5 * side)
        mix(buf, int(SR * ms / 1000.0), fn(force, noise), gl, gr)

    # limitador macio: segura o pico sem achatar o que esta embaixo
    peak = max((abs(v) for v in buf), default=1.0)
    print('  pico bruto %.3f' % peak)
    g = 0.89 / peak if peak > 0 else 1.0
    pcm = array.array('h', bytes(2 * total * CH))
    for i, v in enumerate(buf):
        x = v * g
        x = math.tanh(x * 1.18) * 0.86      # arredonda so o que chega perto
        pcm[i] = int(max(-32767, min(32767, x * 32767)))

    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, 'srchz-order-of-chaos.wav')
    raw = path + '.raw.wav'
    with wave.open(raw, 'wb') as w:
        w.setnchannels(CH)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(pcm.tobytes())
    n_ev = len([c for c in cues if c[1] not in ('sub', 'tail')])
    print('  %.1fs · %d Hz · estereo · %d eventos' % (dur_ms / 1000.0, SR, n_ev))

    master(raw, path)
    os.remove(raw)
    print('  %s' % path)


# ------------------------------------------------------------------ mixagem

def master(src, dst):
    """Compressao suave e normalizacao de loudness, em duas passagens.

    Sem isto o arquivo sai por volta de -25 LUFS com 16 LU de faixa: os
    impactos dominam e o leito some no telefone. As redes normalizam perto
    de -14 LUFS e atenuam o que passa disso, entao a mira e -16 com pico
    real em -1.5 dBTP, e a faixa fecha em 9 LU — ainda respira, mas o filme
    inteiro fica audivel.

    Duas passagens porque loudnorm de uma passagem so estima: medindo
    antes, o ganho que ele aplica e o certo.
    """
    import subprocess
    # so pega os picos: com o compressor fechado a faixa cai para 2 LU e o
    # filme vira uma parede plana — o impacto deixa de ser impacto
    comp = 'acompressor=threshold=-11dB:ratio=2:attack=22:release=320:makeup=1'
    aim = dict(I='-16', TP='-1.5', LRA='11')

    p1 = subprocess.run(['ffmpeg', '-nostats', '-i', src, '-af',
        '%s,loudnorm=I=%s:TP=%s:LRA=%s:print_format=json' % (comp, aim['I'], aim['TP'], aim['LRA']),
        '-f', 'null', '-'], capture_output=True, text=True)
    m = re.search(r'\{[^{]*"input_i"[\s\S]*?\}', p1.stderr)
    if not m:
        sys.exit('ERRO: loudnorm nao devolveu a medicao.\n' + p1.stderr[-800:])
    d = json.loads(m.group(0))
    print('  medido: %s LUFS · pico %s dBTP · faixa %s LU'
          % (d['input_i'], d['input_tp'], d['input_lra']))

    second = ('%s,loudnorm=I=%s:TP=%s:LRA=%s:measured_I=%s:measured_TP=%s:'
              'measured_LRA=%s:measured_thresh=%s:offset=%s:linear=true:print_format=summary'
              % (comp, aim['I'], aim['TP'], aim['LRA'], d['input_i'], d['input_tp'],
                 d['input_lra'], d['input_thresh'], d['target_offset']))
    p2 = subprocess.run(['ffmpeg', '-loglevel', 'error', '-y', '-i', src,
        '-af', second, '-ar', str(SR), '-c:a', 'pcm_s16le', dst],
        capture_output=True, text=True)
    if p2.returncode != 0:
        sys.exit('ERRO na mixagem:\n' + p2.stderr[-800:])


if __name__ == '__main__':
    main()
