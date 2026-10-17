#!/usr/bin/env python3
"""Verificacao estatica do site publicado.

Roda sem nenhuma dependencia externa (so a stdlib), porque o deploy e estatico
e qualquer coisa que exija instalacao torna o check fragil. Checa quatro coisas
que, se quebram, quebram em producao:

  1. HTML malformado (tag nao fechada, aninhamento invalido)
  2. JSON-LD invalido  -> o Google descarta o bloco inteiro em silencio
  3. XML invalido (sitemap, manifest)
  4. Link/asset interno apontando para arquivo que nao existe  -> 404

Uso:  python3 tools/check_site.py [raiz]
"""
import json
import os
import re
import sys
import xml.dom.minidom
from html.parser import HTMLParser
from urllib.parse import unquote, urlsplit

# Tags sem fechamento em HTML5: nao entram na pilha.
VOID = {
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link',
    'meta', 'param', 'source', 'track', 'wbr',
}
# Fechamento opcional: um <p> aberto pode ser fechado implicitamente.
OPTIONAL_CLOSE = {'p', 'li', 'dt', 'dd', 'option', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th'}

SKIP_SCHEMES = ('http:', 'https:', 'mailto:', 'tel:', 'data:', 'javascript:', 'whatsapp:')

LINK_ATTRS = {
    'a': 'href', 'link': 'href', 'area': 'href',
    'img': 'src', 'script': 'src', 'iframe': 'src',
    'source': 'src', 'video': 'src', 'audio': 'src', 'embed': 'src',
}


class Checker(HTMLParser):
    """Acumula erros de estrutura, blocos JSON-LD e links internos."""

    def __init__(self, path):
        super().__init__(convert_charrefs=True)
        self.path = path
        self.stack = []
        self.errors = []
        self.jsonld = []
        self.links = []
        self._in_ld = False
        self._ld_buf = []

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == 'script' and d.get('type') == 'application/ld+json':
            self._in_ld = True
            self._ld_buf = []
        attr = LINK_ATTRS.get(tag)
        if attr and d.get(attr):
            self.links.append((d[attr], self.getpos()[0]))
        if tag not in VOID:
            self.stack.append((tag, self.getpos()[0]))

    def handle_startendtag(self, tag, attrs):
        d = dict(attrs)
        attr = LINK_ATTRS.get(tag)
        if attr and d.get(attr):
            self.links.append((d[attr], self.getpos()[0]))

    def handle_data(self, data):
        if self._in_ld:
            self._ld_buf.append(data)

    def handle_endtag(self, tag):
        if tag == 'script' and self._in_ld:
            self._in_ld = False
            self.jsonld.append((''.join(self._ld_buf), self.getpos()[0]))
        if tag in VOID:
            return
        # Desempilha fechamentos implicitos permitidos antes de casar o nosso.
        while self.stack and self.stack[-1][0] != tag and self.stack[-1][0] in OPTIONAL_CLOSE:
            self.stack.pop()
        if not self.stack:
            self.errors.append('linha %d: </%s> sem abertura' % (self.getpos()[0], tag))
            return
        if self.stack[-1][0] != tag:
            open_tag, open_line = self.stack[-1]
            self.errors.append(
                'linha %d: </%s> fecha fora de ordem (aberto <%s> na linha %d)'
                % (self.getpos()[0], tag, open_tag, open_line))
            return
        self.stack.pop()

    def finish(self):
        for tag, line in self.stack:
            if tag not in OPTIONAL_CLOSE:
                self.errors.append('<%s> aberto na linha %d e nunca fechado' % (tag, line))
        return self.errors


def resolve(root, html_path, href):
    """Caminho no disco que um href interno deve alcancar, ou None se nao checavel."""
    href = href.strip()
    if not href or href.startswith('#') or href.lower().startswith(SKIP_SCHEMES):
        return None
    if href.startswith('//'):
        return None
    path = unquote(urlsplit(href).path)
    if not path:
        return None
    if path.startswith('/'):
        target = os.path.join(root, path.lstrip('/'))
    else:
        target = os.path.join(os.path.dirname(html_path), path)
    target = os.path.normpath(target)
    if os.path.isdir(target) or href.endswith('/'):
        return os.path.join(target, 'index.html')
    return target


def main():
    root = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else '.')
    failures = []
    html_files = []
    xml_files = []
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in ('.git', 'node_modules')]
        for name in filenames:
            full = os.path.join(dirpath, name)
            if name.endswith('.html'):
                html_files.append(full)
            elif name.endswith(('.xml', '.webmanifest')):
                xml_files.append(full)

    for path in sorted(html_files):
        rel = os.path.relpath(path, root)
        with open(path, encoding='utf-8') as fh:
            source = fh.read()
        checker = Checker(path)
        try:
            checker.feed(source)
            checker.close()
        except Exception as exc:  # parser desistiu: HTML muito quebrado
            failures.append('%s: parser falhou: %s' % (rel, exc))
            continue
        for err in checker.finish():
            failures.append('%s: %s' % (rel, err))
        for raw, line in checker.jsonld:
            try:
                json.loads(raw)
            except Exception as exc:
                failures.append('%s: JSON-LD invalido na linha %d: %s' % (rel, line, exc))
        for href, line in checker.links:
            target = resolve(root, path, href)
            if target and not os.path.exists(target):
                failures.append('%s: linha %d aponta para %s, que nao existe'
                                % (rel, line, href))

    for path in sorted(xml_files):
        rel = os.path.relpath(path, root)
        if path.endswith('.webmanifest'):
            try:
                with open(path, encoding='utf-8') as fh:
                    json.load(fh)
            except Exception as exc:
                failures.append('%s: JSON invalido: %s' % (rel, exc))
            continue
        try:
            xml.dom.minidom.parse(path)
        except Exception as exc:
            failures.append('%s: XML invalido: %s' % (rel, exc))

    print('%d HTML, %d XML/manifest verificados' % (len(html_files), len(xml_files)))
    if failures:
        print('\n%d problema(s):\n' % len(failures))
        for f in failures:
            print('  - ' + f)
        return 1
    print('sem problemas')
    return 0


if __name__ == '__main__':
    sys.exit(main())
