# -*- coding: utf-8 -*-
"""Mide los sitios de cliente para las métricas de las fichas.

    python _dev/medir-sitios.py

Reporta el peso de la CARGA INICIAL —lo que el navegador baja al abrir—
excluyendo las imágenes con loading="lazy", que no se descargan hasta que
el visitante hace scroll. Esa es la cifra que vive el usuario y la única
que se publica.

Las cifras que salgan de aquí se copian a mano al array PROYECTOS de
js/proyectos.js, junto con la fecha de medición. Nada de estimaciones:
si un sitio no se puede medir, ese proyecto se queda con `metricas: []`.

No se publica: _dev/ queda fuera del despliegue (ver .htaccess).
"""
import json, re, ssl, urllib.parse, urllib.request, gzip, time

CTX = ssl.create_default_context(); CTX.check_hostname = False; CTX.verify_mode = ssl.CERT_NONE
UA = {'User-Agent': 'Mozilla/5.0 (Linux; Android 12) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36',
      'Accept-Encoding': 'gzip, deflate'}

SITIOS = {
    'metroenergy': 'https://autoconsumodiesel.com.mx/',
    'dolphins':    'https://acuaticadelfinesiztapalapa.com/',
    'stz-toluca':  'https://verificacionaltransportezame.com.mx/',
    'ashe':        'http://version2.unidaddeinspeccionfederalashe.com/',
    'zame':        'https://unidaddeinspeccionzame.com/',
}


def get(url, timeout=30):
    """Devuelve (contenido descomprimido, bytes realmente transferidos)."""
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout, context=CTX) as r:
        raw = r.read()
        transferido = len(raw)
        if r.headers.get('Content-Encoding', '') == 'gzip':
            try:
                raw = gzip.decompress(raw)
            except Exception:
                pass
        return raw, transferido


def img_tags(html):
    """Devuelve [(src, es_lazy)] respetando el atributo del propio <img>."""
    out = []
    for tag in re.findall(r'<img\b[^>]*>', html, re.I):
        m = re.search(r'\bsrc=["\']([^"\']+)', tag, re.I)
        if not m:
            continue
        lazy = bool(re.search(r'loading=["\']lazy["\']', tag, re.I))
        out.append((m.group(1), lazy))
    return out


res = {}
for slug, url in SITIOS.items():
    t0 = time.time()
    raw, doc = get(url)
    ttfb = time.time() - t0
    html = raw.decode('utf-8', 'ignore')

    criticos = []   # bloquean o se descargan siempre
    for p in [r'<script[^>]+src=["\']([^"\']+)', r'<link[^>]+rel=["\']stylesheet["\'][^>]*href=["\']([^"\']+)']:
        criticos += re.findall(p, html, re.I)

    eager, lazy_l = [], []
    for src, lz in img_tags(html):
        (lazy_l if lz else eager).append(src)

    def suma(lst):
        tot, n = 0, 0
        for u in lst:
            if u.startswith('data:'):
                continue
            try:
                _, b = get(urllib.parse.urljoin(url, u), timeout=25)
                tot += b; n += 1
            except Exception:
                pass
        return tot, n

    b_crit, n_crit = suma(criticos)
    b_eager, n_eager = suma(eager)
    b_lazy, n_lazy = suma(lazy_l)

    inicial = doc + b_crit + b_eager
    res[slug] = {
        'url': url,
        'inicial_kb': round(inicial / 1024, 1),
        'peticiones_iniciales': 1 + n_crit + n_eager,
        'diferido_kb': round(b_lazy / 1024, 1),
        'imgs_lazy': n_lazy,
        'total_kb': round((inicial + b_lazy) / 1024, 1),
        'ttfb_s': round(ttfb, 2),
    }
    print(slug, json.dumps(res[slug], ensure_ascii=False), flush=True)

open('medidas-inicial.json', 'w', encoding='utf-8').write(json.dumps(res, ensure_ascii=False, indent=2))
