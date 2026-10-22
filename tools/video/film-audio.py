#!/usr/bin/env python3
"""Desenho de som do filme, sintetizado do zero.

Tem trilha e tem afx, os dois sintetizados aqui mesmo: nenhum sample de
banco, nenhuma obra de terceiro dentro, e por isso nenhuma licenca a pagar.

Os afx — corte, impacto, tique, sino e o ping do ensaio — sao os da versao
aprovada e nao foram tocados: mesmos geradores, mesmos cues, mesma semente
de ruido. O que mudou foi o fundo. Era um drone, uma nota de la pelos 60
segundos inteiros; agora e uma trilha com levada, e o andamento dela sai do
proprio filme — e o BPM em que os tres impactos caem na cabeca do
compasso, de modo que cada impacto vira a entrada de uma secao.

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

# ------------------------------------------------------------------- trilha
#
# A progressao e Am - F - Dm - Esus4, um acorde por compasso. Nao e escolha
# de gosto: o sino dos afx bate em la 880 Hz e o pedal grave fica em la
# 55 Hz, entao os quatro acordes precisam ter la dentro, senao cada
# badalada passa a brigar com a harmonia. La e tonica no Am, terca no F,
# quinta no Dm e quarta no Esus4.
#
# O baixo que anda fica entre 73 e 110 Hz porque abaixo de 60 Hz o
# alto-falante de telefone nao devolve quase nada: o pedal carrega o peso
# em quem ouve de fone, o baixo carrega o movimento em quem ouve no
# telefone.

PROG = {
    #        baixo   acorde sustentado          arpejo
    'Am':    (110.00, (220.00, 261.63, 329.63), (220.00, 261.63, 329.63, 440.00)),
    'F':     ( 87.31, (174.61, 220.00, 261.63), (220.00, 261.63, 349.23, 440.00)),
    'Dm':    ( 73.42, (146.83, 174.61, 220.00), (220.00, 293.66, 349.23, 440.00)),
    'Esus4': ( 82.41, (164.81, 220.00, 246.94), (220.00, 246.94, 329.63, 440.00)),
}
LOOP = ('Am', 'F', 'Dm', 'Esus4')

# 16 semicolcheias por compasso. No arpejo o numero e a nota; None cala.
ARP = {
    1: (0, None, None, None, 2, None, None, None, 1, None, None, None, 3, None, None, None),
    2: (0, None, 2, None, 1, None, 3, None, 0, None, 2, None, 3, None, 1, None),
    3: (0, 1, 2, None, 3, 2, 1, None, 0, 1, 2, 3, 2, None, 1, None),
}
# O baixo toca no contratempo: o bumbo ocupa a cabeca de cada tempo, e os
# dois no mesmo instante embolariam o grave.
BASS = {
    1: (1, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0,  0, 0, 0, 0),
    2: (0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0,  0, 0, 1, 0),
    3: (0, 0, 1, 0,  0, 0, 1, 1,  0, 0, 1, 0,  0, 0, 1, 1),
}

# O que toca em cada secao: bumbo, palma (2 = rufo), prato (2 = em
# semicolcheia), arpejo, baixo — e a energia da secao.
#
# Antes de cada impacto a trilha cresce, nao esvazia. Esvaziar antes do
# drop e convencao de pista, mas este filme cresce ate cada impacto — os
# risers e a rampa do drone ja faziam isso na versao aprovada — e um vao
# ali brigava com a imagem. Entao o bumbo continua, o 'lift' so tira a
# palma para os sinos das linguas aparecerem, e o rufo sobe ate o impacto.
SECTIONS = {
    'intro':     (0, 0, 0, 1, 0, 0.55),
    'A':         (1, 0, 1, 2, 2, 0.92),
    'B':         (1, 1, 1, 3, 3, 0.74),
    'lift':      (1, 0, 1, 2, 1, 0.88),
    'build':     (1, 2, 2, 3, 2, 0.96),
    'climax':    (1, 1, 2, 3, 3, 1.00),
    'outro':     (0, 0, 0, 1, 1, 1.30),
}

# Quanto a trilha abaixa embaixo de cada afx (dB a forca 1) e por quanto
# tempo segura antes de voltar. E o que deixa os afx com o mesmo destaque
# que tinham sobre o drone, agora com musica cheia por baixo.
#
# (dB a forca 1, segura, volta) — em segundos.
DUCK = {'whoosh': (5.0, 0.25, 0.30), 'riser': (3.0, 0.40, 0.30),
        'bell': (3.5, 0.30, 0.30), 'ping': (4.0, 0.25, 0.30), 'tick': (1.5, 0.05, 0.30)}

# O impacto e um seno descendo de 130 para 38 Hz por 1,5 s: ocupa a mesma
# faixa e o mesmo instante do bumbo, do baixo e do pedal. Com os tres
# somando em cima dele, o pico bruto ia de 1,13 para 1,62, o limitador
# baixava o filme inteiro 3 dB a mais e esmagava justamente o impacto. Por
# isso a trilha sai em dois barramentos: so os graves cedem ao impacto, e
# cedem pelo tempo do estrondo; acorde e arpejo entram inteiros junto com
# ele, e o drop continua batendo junto.
DUCK_LOW = dict(DUCK, impact=(9.0, 0.70, 0.60))
MUSIC = 0.56            # ganho geral da trilha contra os afx


def fit_tempo(cues, lo=105.0, hi=128.0):
    """O andamento sai do filme, nao o contrario: procura o BPM em que
    todos os impactos caem na cabeca de um compasso, contando do primeiro.

    A faixa de 105 a 128 BPM e a de "animada" sem virar frenesi. Neste
    corte a resposta e 115,6 BPM: 3,5 s, 45 s e 55,4 s caem nos compassos
    0, 20 e 25, o do meio com erro de 20 ms — menos de um quadro.
    """
    imp = sorted(c[0] for c in cues if c[1] == 'impact')
    a, z = imp[0], imp[-1]
    best = None
    for bars in range(1, 400):
        bar = (z - a) / bars
        bpm = 4 * 60000.0 / bar
        if not lo <= bpm <= hi:
            continue
        err = max(abs((t - a) / bar - round((t - a) / bar)) * bar for t in imp)
        if best is None or err < best[0]:
            best = (err, bpm, [int(round((t - a) / bar)) for t in imp])
    if best is None:
        sys.exit('ERRO: nenhum andamento entre %d e %d BPM serve aos impactos.' % (lo, hi))
    return best[1], best[2], best[0]


def section(b, drops):
    """Secao do compasso b. Cada impacto e um drop: antes do primeiro vem a
    introducao, antes de cada um dos outros vem uma subida e um rufo, e o
    ultimo abre o encerramento."""
    first, last = drops[0], drops[-1]
    if b < first:
        return 'intro'
    if b >= last:
        return 'outro'
    for d in drops[1:]:
        if d - 1 <= b < d:
            return 'build'
        if d != last and d - 2 <= b < d - 1:
            return 'lift'
    if any(d <= b for d in drops[1:-1]):
        return 'climax'
    return 'A' if b < first + 4 else 'B'


def chord_name(b, drops):
    """Esus4 antes de cada drop e Am no drop: a tensao resolve exatamente
    onde o impacto bate."""
    if b < drops[0] or any(b == d - 1 for d in drops[1:]):
        return 'Esus4'
    if b >= drops[-1]:
        return 'Am'
    return LOOP[(b - drops[0]) % len(LOOP)]


def ev_kick(force, noise):
    """Bumbo da levada: clique de ataque e corpo caindo de 110 para 50 Hz.
    O clique nao e enfeite — e a parte que o telefone reproduz."""
    n = int(SR * 0.32)
    out = []
    ph = 0.0
    for i in range(n):
        t = i / SR
        ph += 2 * math.pi * (50 + 60 * math.exp(-t / 0.035)) / SR
        body = math.sin(ph) * math.exp(-t / 0.11)
        click = noise() * math.exp(-t / 0.004) * 0.25
        out.append((body * 0.9 + click) * force)
    return out


def ev_hat(force, noise):
    """Prato: ruido agudo bem curto."""
    n = int(SR * 0.05)
    out = []
    lp = 0.0
    for i in range(n):
        x = noise()
        lp += 0.55 * (x - lp)
        out.append((x - lp) * math.exp(-40 * i / n) * 0.30 * force)
    return out


def ev_clap(force, noise):
    """Palma: tres rajadas de ruido em banda, uma atras da outra. E a
    repeticao proxima que soa a mao; uma rajada so soa a clique."""
    n = int(SR * 0.20)
    out = []
    lp = bp = 0.0
    secs = n / SR
    for i in range(n):
        p = i / n
        x = noise()
        lp += 0.28 * (x - lp)
        bp += 0.42 * ((x - lp) - bp)
        env = 0.0
        for d, g in ((0.000, 1.00), (0.011, 0.72), (0.024, 0.46)):
            q = p - d / secs
            if q >= 0:
                env += math.exp(-34 * q) * g
        out.append(bp * env * 0.26 * force)
    return out


def ev_bass(freq, force, secs=0.24):
    """Baixo, curto. A parcial de oitava e o que sobra dele num
    alto-falante pequeno, que nao reproduz a fundamental."""
    n = int(SR * secs)
    decay = 4.2 * (0.24 / secs) ** 0.5     # nota longa cai mais devagar
    out = []
    for i in range(n):
        p = i / n
        t = i / SR
        s = (math.sin(2 * math.pi * freq * t) * 0.80
             + math.sin(2 * math.pi * freq * 2 * t) * 0.32
             + math.sin(2 * math.pi * freq * 3 * t) * 0.08 * math.exp(-10 * p))
        out.append(s * math.exp(-decay * p) * (1 - math.exp(-200 * p)) * 0.40 * force)
    return out


def ev_pluck(freq, force):
    """Nota do arpejo, entre 220 e 440 Hz: a faixa que o telefone devolve
    inteira, e onde o arpejo aparece sem cobrir os afx."""
    n = int(SR * 0.30)
    out = []
    for i in range(n):
        p = i / n
        t = i / SR
        s = (math.sin(2 * math.pi * freq * t) * 0.70
             + math.sin(2 * math.pi * freq * 2 * t) * 0.18 * math.exp(-9 * p)
             + math.sin(2 * math.pi * freq * 3 * t) * 0.07 * math.exp(-16 * p))
        out.append(s * math.exp(-7.5 * p) * (1 - math.exp(-260 * p)) * 0.30 * force)
    return out


def music(lo, hi, cues, total):
    """A trilha inteira: notas no compasso e, amostra a amostra, o pedal de
    la, o acorde e o ar, com o "pump" — o fundo cede um pouco a cada bumbo
    e volta, que e o que faz a levada respirar. Bumbo, baixo e pedal vao
    para os graves (lo); o resto para os medios e agudos (hi)."""
    dur_ms = total * 1000.0 / SR
    bpm, drops, err = fit_tempo(cues)
    anchor = min(c[0] for c in cues if c[1] == 'impact')
    beat = 60000.0 / bpm
    step = beat / 4.0
    bar = beat * 4.0
    tail = next((c[0] for c in cues if c[1] == 'tail'), dur_ms)
    noise = Noise(4242)          # semente propria: nao consome a dos afx

    # A curva de respiracao do filme, a mesma que movia o drone: os cues
    # 'sub' vao de 0,5 a 1,0 e o ponto mais alto e o impacto final. Sem
    # ela a trilha ficava plana em -15,5 por 30 segundos e chegava ao
    # final mais baixa que o original — achatava justamente o arco que a
    # versao aprovada tinha.
    #
    # Mas o arco inteiro do drone (6 dB) e demais para musica: o master
    # normaliza o filme em -16 LUFS, entao cada dB que o climax ganha sai
    # dos afx, e o primeiro drop nascia fraco. Comprimido para 3,5 dB, o
    # filme ainda cresce e os afx ficam onde estavam.
    marks = [(c[0], c[2]) for c in cues if c[1] == 'sub']

    def arc(ms):
        lvl = marks[0][1]
        for j, (a, v) in enumerate(marks):
            if ms >= a:
                lvl = v
                if j + 1 < len(marks):
                    b2, v2 = marks[j + 1]
                    q = min(1.0, max(0.0, (ms - a) / (b2 - a)))
                    lvl = v + (v2 - v) * q ** 0.6
        return 0.80 + 0.40 * (lvl - 0.5) / 0.5

    def edge(ms):
        g = ms / 400.0 if ms < 400 else 1.0
        if ms > tail:
            g *= max(0.0, 1 - (ms - tail) / (dur_ms - tail))
        return g

    notes = 0
    k = int(math.ceil(-anchor / step))
    while True:
        ms = anchor + k * step
        if ms >= dur_ms:
            break
        b, s = k // 16, k % 16
        sec = section(b, drops)
        kick, clap, hat, arp_t, bass_t, energy = SECTIONS[sec]
        e = energy * arc(ms) * edge(ms) * MUSIC
        at = int(SR * ms / 1000.0)
        root, _, arp_notes = PROG[chord_name(b, drops)]
        if kick and s % 4 == 0:
            mix(lo, at, ev_kick(e * (1.0 if s == 0 else 0.86), noise), 1.0, 1.0)
        if sec == 'outro' and b == drops[-1] and s == 0:
            mix(lo, at, ev_kick(e, noise), 1.0, 1.0)       # a ultima batida
            mix(lo, at, ev_bass(root, e, 1.8), 1.0, 1.0)   # e o la segurando
        if clap == 1 and s in (4, 12):
            mix(hi, at, ev_clap(e * 0.85, noise), 0.86, 1.0)
        if clap == 2 and (s >= 8 or s % 2 == 0):          # rufo: colcheia, depois semicolcheia
            mix(hi, at, ev_clap(e * (0.50 + 0.50 * s / 15.0), noise), 1.0, 0.86)
        if hat == 1 and s % 4 == 2:
            mix(hi, at, ev_hat(e, noise), 0.80, 1.0)
        if hat == 2:
            mix(hi, at, ev_hat(e * (1.0 if s % 4 == 2 else 0.45), noise), 0.80, 1.0)
        if arp_t and ARP[arp_t][s] is not None:
            side = 1 if (s // 4) % 2 == 0 else -1
            mix(hi, at, ev_pluck(arp_notes[ARP[arp_t][s]], e * (1.0 if s == 0 else 0.76)),
                1.0 - 0.18 * (0.5 + 0.5 * side), 1.0 - 0.18 * (0.5 - 0.5 * side))
            notes += 1
        if bass_t and BASS[bass_t][s]:
            mix(lo, at, ev_bass(root, e), 1.0, 1.0)
            notes += 1
        k += 1

    # sustentados, amostra a amostra
    ph1 = ph2 = 0.0
    pc = [0.0, 0.0, 0.0]
    air = 0.0
    lvl = 0.0
    cache = {}
    for i in range(total):
        ms = i * 1000.0 / SR
        b = int(math.floor((ms - anchor) / bar))
        if b not in cache:
            sec = section(b, drops)
            cache[b] = (PROG[chord_name(b, drops)][1], SECTIONS[sec][0], SECTIONS[sec][5])
        chord, kick, energy = cache[b]
        if i % 480 == 0:                  # o arco anda devagar: 10 ms basta
            a_now = arc(ms)
        # o nivel corre atras da energia da secao em ~80 ms: trocar de
        # secao num degrau daria estalo no sustentado
        lvl += (energy * a_now * edge(ms) * MUSIC - lvl) * 0.00026
        pump = 1.0
        if kick:
            x = ((ms - anchor) % beat) / 1000.0
            # 5 ms de ataque: sem ele o ganho do fundo caia num degrau a
            # cada tempo, e degrau de ganho num seno grave e estalo
            pump = 1.0 - 0.45 * min(1.0, x / 0.005) * (1.0 - min(1.0, x / 0.20)) ** 2
        ph1 += 2 * math.pi * 55.0 / SR
        ph2 += 2 * math.pi * 55.09 / SR
        low = math.sin(ph1) * 0.5 + math.sin(ph2) * 0.42 + math.sin(ph1 * 2) * 0.10
        pad = 0.0
        for q in range(3):
            pc[q] += 2 * math.pi * chord[q] / SR    # fase continua: sem estalo na troca
            pad += math.sin(pc[q])
        air += 0.0016 * (noise() - air)
        # o pedal cresce com o arco ate o nivel do drone antigo: no
        # acorde final, o fundo da versao aprovada volta por baixo
        ped = 0.16 + 0.10 * max(0.0, min(1.0, (a_now - 0.80) / 0.40))
        v = low * ped * lvl * pump
        lo[i * CH] += v
        lo[i * CH + 1] += v * 0.97
        v = (pad * 0.05 + air * 1.6) * lvl * pump
        hi[i * CH] += v
        hi[i * CH + 1] += v * 0.97
    return bpm, drops, err, notes


def duck(buf, cues, total, table):
    """Abaixa a trilha embaixo de cada afx e devolve depois. Comeca 12 ms
    antes do evento — da para fazer porque o cue diz quando ele vem — para
    o ataque do afx nao bater ja em cima da musica."""
    gain = array.array('d', [1.0]) * total
    att = 0.012
    for ms, kind, force in cues:
        if kind not in table:
            continue
        depth, hold, rel = table[kind]
        gmin = 10 ** (-depth * force / 20.0)
        t0 = ms / 1000.0 - att
        for i in range(max(0, int(t0 * SR)), min(total, int((t0 + att + hold + rel) * SR))):
            t = i / SR - t0
            if t < att:
                sh = t / att
            elif t < att + hold:
                sh = 1.0
            else:
                sh = 1.0 - (t - att - hold) / rel
            g = 1.0 - sh * (1.0 - gmin)
            if g < gain[i]:
                gain[i] = g
    for i in range(total):
        buf[i * CH] *= gain[i]
        buf[i * CH + 1] *= gain[i]


# -------------------------------------------------------------------- leito
#
# O drone da versao anterior, que a trilha substitui. Fica aqui porque e o
# fundo do master aprovado: VIDEO_BED=drone regera aquele audio identico,
# e e assim que se prova que os afx de hoje sao os mesmos de antes.

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

    if os.environ.get('VIDEO_BED') == 'drone':
        bed(buf, cues, total)
        print('  fundo: o drone da versao anterior')
    else:
        lo = array.array('d', bytes(8 * total * CH))
        hi = array.array('d', bytes(8 * total * CH))
        bpm, drops, err, notes = music(lo, hi, cues, total)
        duck(lo, cues, total, DUCK_LOW)
        duck(hi, cues, total, DUCK)
        for i in range(total * CH):
            buf[i] = lo[i] + hi[i]
        del lo, hi
        print('  trilha: %.1f BPM · drops nos compassos %s (erro %d ms) · %d notas'
              % (bpm, drops, err, notes))

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
