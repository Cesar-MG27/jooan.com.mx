# joan — Estudio digital

Sitio estático (HTML + CSS + JS vanilla) del estudio, con fichas técnicas de
proyecto y un formulario que envía correo vía PHP.

## Estructura

```
wwwJoan/
├── index.html          ← Portada
├── proyecto.html       ← Ficha técnica (se arma con ?p=slug)
├── 404.html            ← Página de error
├── .htaccess           ← HTTPS, caché, compresión y cabeceras de seguridad
├── robots.txt
├── sitemap.xml
├── site.webmanifest
├── css/
│   └── styles.css      ← TODOS los estilos del sitio
├── js/
│   ├── main.js         ← Preloader, scroll, tema, animaciones, envío del form
│   └── proyectos.js    ← Datos de las fichas + render de proyecto.html
├── api/
│   ├── contact.php     ← Recibe el formulario y envía el correo
│   ├── smtp.php        ← Cliente SMTP sin dependencias
│   ├── config.php      ← ⚙️ Credenciales del correo (EDITAR AQUÍ)
│   └── .htaccess       ← Bloquea el acceso directo a config.php y smtp.php
├── assets/             ← Imágenes de proyecto (WebP), iconos y portada social
└── _dev/               ← Artefactos del editor original (NO se publican)
    ├── medir-sitios.py ← Mide los sitios de cliente para las métricas
    └── originales/     ← PNG originales de los mockups, ya sustituidos por WebP
```

> Las librerías de animación (GSAP, ScrollTrigger, Lenis) y las fuentes se cargan
> por CDN; no hay que instalarlas ni compilar nada.

## Estilos

**No hay estilos inline.** Todo vive en `css/styles.css`, ordenado en 17 bloques
numerados (tokens → base → componentes → capa responsiva → accesibilidad). Los
comentarios del archivo explican el porqué de cada corte.

Reglas de la casa:

- Los colores, tipografías y el ritmo salen de tokens en `:root`
  (`--paper`, `--tx`, `--accent`, `--gut`, `--sec-y`, `--ease`…). El margen
  lateral `--gut` se encoge solo en móvil: nada de repetir `clamp()` por sección.
- El tema oscuro solo redefine tokens en `:root[data-theme="dark"]`.
- La capa responsiva casi no usa `!important`. Donde queda es porque compite
  contra estilos inline que el JS escribe en caliente (scrub del proceso,
  transform del carrusel, color de la nav). Está comentado en cada caso.
- El `<html>` recibe la clase `js` desde un script en el `<head>`. Los estados
  que solo tienen sentido con JS (preloader, entrada del hero, `[data-reveal]`,
  ficha oculta hasta que se pinta) cuelgan de `html.js`, así que sin JS la
  página se ve entera en vez de quedarse en blanco.

## SEO

Ya configurado en las tres páginas:

- `<title>` y `description` propios, `canonical`, `robots`, `og:*`, Twitter Card
  e imagen social (`assets/og-cover.jpg`, 1200×630).
- Datos estructurados JSON-LD: `WebSite` + `ProfessionalService` con servicios,
  zona de servicio y datos de contacto en la portada; `CreativeWork` por ficha
  (lo inyecta `proyectos.js`, que además reescribe título, descripción,
  canónica y Open Graph según el `?p=slug`).
- `robots.txt` + `sitemap.xml` con la portada y las cinco fichas.
- `<h1>` real en cada página. En la portada el wordmark lleva un texto
  descriptivo solo para lectores de pantalla (`.sr-only`).
- Imágenes en WebP con `width`/`height` (sin saltos de layout), `loading="lazy"`
  y `alt` descriptivo.

> ⚠️ Las URLs absolutas usan **`https://jooan.com.mx/`**. Si el dominio final es
> otro, hay que cambiarlo en: `index.html`, `proyecto.html`, `robots.txt`,
> `sitemap.xml` y la constante `SITIO` de `js/proyectos.js`.
>
> Tras publicar: dar de alta el sitio en Google Search Console y enviar
> `https://jooan.com.mx/sitemap.xml`.

## Productos y precios

La sección `#precios` de `index.html` publica cuatro productos: **Presencia**
($10,000), **Sitio institucional** ($30,000, la destacada), **Experiencia**
($70,000) e **Iguala de operación** ($2,000 al mes). Todos se muestran como
precio de **arranque** y **más IVA**; la nota de la sección lo dice explícito.

> ⚠️ Al cambiar un precio hay que tocarlo en **dos sitios del mismo archivo**:
> 1. la tarjeta visible (`.pr-amount` dentro de `.pr-grid`), y
> 2. el bloque JSON-LD del `<head>` (`hasOfferCatalog` → `priceSpecification`),
>    que es lo que lee Google.
>
> Si se quedan desalineados, el buscador puede mostrar un precio distinto del
> que ve el visitante. El texto del enlace de WhatsApp de cada tarjeta también
> lleva el importe: va en el `?text=` del `href`.

**Plazos de entrega** (Presencia 7 días hábiles, Institucional 15–20 días
hábiles, Experiencia 6–8 semanas). El de Presencia es la promesa del hero, así
que al cambiarlo hay que tocar:

1. las tarjetas (`.pr-terms`) y el JSON-LD (`description` de cada `Offer`),
2. el hero (`.hero-title`, `.hero-meta`), la marquesina, las cifras de
   "Sobre joan" y el footer de `index.html` y `proyecto.html`,
3. `title`, `description`, `og:*` y `twitter:*` del `<head>`,
4. la imagen para compartir (ver abajo).

## Imagen para compartir

`assets/og-cover.jpg` (1200×630) es lo que se ve al compartir el enlace por
WhatsApp, Facebook o X. Su fuente es `_dev/og-cover.html`. Para regenerarla:

```powershell
& "C:\Program Files\Google\Chrome\Application\chrome.exe" --headless=new `
  --hide-scrollbars --window-size=1200,630 --virtual-time-budget=6000 `
  --screenshot=og-cover.png _dev/og-cover.html
```

Convierte el PNG a JPG (calidad ~90) y sustituye `assets/og-cover.jpg`. Después
sube el `?v=` de `og:image` y `twitter:image` en `index.html`: WhatsApp y
Facebook guardan la imagen vieja en caché aunque el archivo cambie.

El formulario de contacto tiene un campo opcional **Producto de interés**
(`select[name="producto"]`); `api/contact.php` lo añade al cuerpo y al asunto
del correo para poder priorizar desde la bandeja. Si se añade un producto a la
web, hay que añadir su `<option>` al select.

## Métricas de las fichas

Las fichas de proyecto pueden mostrar un bloque **“Resultados medidos”**. Los
datos salen del array `PROYECTOS` de `js/proyectos.js`, campos `metricas`,
`medicion` y `testimonio`.

**Solo se publican cifras medidas.** Para obtenerlas:

```bash
python _dev/medir-sitios.py
```

Reporta, por sitio, el peso de la carga inicial (sin las imágenes diferidas,
que el navegador no descarga al abrir) y el número de peticiones. Esas cifras
se copian a mano al array, junto con la fecha en `medicion`.

- `metricas: []` → la ficha **retira la sección entera**. Es el estado correcto
  cuando no hay medición o cuando la que hay no es presentable.
- `testimonio: null` → el bloque de cita se retira. Se llena solo cuando exista
  una frase real de un cliente y con su permiso.

> Estado a 31/08/2026: solo **MetroEnergy** tiene métricas publicadas (132 KB
> al abrir, 8 peticiones). Los otros cuatro sitios pesan entre 1.9 MB y 6.5 MB
> en la carga inicial; sus cifras reales están anotadas en los comentarios de
> `js/proyectos.js` para poder optimizar y volver a medir. Además, el sitio de
> ASHE sigue sirviéndose por `http://` sin certificado.

## Configurar el envío del formulario (Hostinger)

1. Abre **`api/config.php`** y completa con los datos de tu buzón de Hostinger:
   - `smtp_user` / `from_email`: tu dirección completa, ej. `hola@tudominio.com`
   - `smtp_pass`: la contraseña de ESE buzón
   - `to_email`: a dónde quieres que lleguen los mensajes
2. En **hPanel → Correos → Cuentas de correo → Detalles de configuración**
   confirmas el servidor y puerto SMTP (normalmente `smtp.hostinger.com`,
   `465` SSL). Si tu plan usa TLS en el `587`: `'smtp_port' => 587` y
   `'smtp_secure' => 'tls'`.

> ⚠️ `from_email` **debe** ser el mismo buzón que `smtp_user`; si no coincide,
> Hostinger rechaza el correo. El email del visitante se manda como *Reply-To*.
>
> 🔐 `api/config.php` guarda la contraseña en claro. `api/.htaccess` impide que
> se pida por URL, pero **la contraseña que hay ahora en el repositorio debe
> considerarse comprometida**: cámbiala en hPanel y actualiza el archivo
> directamente en el servidor.

## Desplegar

Sube a `public_html` **todo menos `_dev/`**:

```
index.html  proyecto.html  404.html
.htaccess   robots.txt     sitemap.xml   site.webmanifest
css/  js/  api/  assets/
```

`.htaccess` se encarga en producción de:

- redirigir a **https** y quitar el **www** (misma URL que la canónica),
- comprimir HTML/CSS/JS/SVG (gzip y brotli),
- cachear estáticos un año e impedir que se cachee el HTML,
- cabeceras de seguridad (`nosniff`, `X-Frame-Options`, `Referrer-Policy`,
  `Permissions-Policy`, HSTS),
- servir `404.html` y bloquear listados de directorio y `_dev/`.

> Si el dominio se sirve **con** www, invierte el segundo bloque `RewriteCond`
> del `.htaccess` y ajusta canónicas y sitemap.

### Al cambiar CSS o JS

`css/styles.css` y `js/*.js` se cachean un año, así que se piden con `?v=N`.
**Sube el número en las tres páginas HTML** cada vez que los modifiques, o los
visitantes que ya estuvieron seguirán viendo la versión vieja.

Es **un solo número para todo el sitio**, no uno por archivo: al desplegar sube
`?v=N` en los siete puntos aunque solo hayas tocado un archivo. Llevar contadores
separados ya provocó una vez que `index.html` cargara `v=5` y `proyecto.html`
siguiera en `v=4`. Revalidar el CSS de más cuesta una petición; servir JS viejo
a media audiencia cuesta un bug que no se reproduce.

## Probar en local

```bash
php -S localhost:8000
# abre http://localhost:8000
```

El HTML/CSS/JS también se ven con cualquier servidor estático
(`python -m http.server`), pero el **envío del formulario necesita PHP**.

## Notas

- Campo *honeypot* (`website`) oculto: filtra spam de bots sin captcha.
- El ancla de la sección de precios es `#precios` (antes `#servicios`): se puede
  mandar `https://jooan.com.mx/#precios` directo por WhatsApp.
- Tema claro/oscuro/automático con persistencia en `localStorage`.
- Respeta `prefers-reduced-motion`: sin preloader, sin Lenis, sin cursor
  propio y con el proceso y los reveals en su estado final legible.
- El preloader (una frase, ~1.2 s) sale **una vez por sesión**. También se
  salta al llegar con ancla (`/#precios`, vuelta desde una ficha). Para volver
  a verlo al probar, abre una pestaña nueva.
- Para añadir o editar un proyecto se toca **solo el array `PROYECTOS`** de
  `js/proyectos.js`; el orden del array es el orden del sitio y define la
  navegación anterior/siguiente. Recuerda añadir la URL nueva al `sitemap.xml`.
