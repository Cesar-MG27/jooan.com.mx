/* ============================================================
   joan — estudio digital · proyectos.js
   Fuente única de datos de las fichas técnicas + render de proyecto.html
   ------------------------------------------------------------
   ► PARA EDITAR UN PROYECTO: cambia solo el objeto de abajo.
     El orden del array es el orden real del sitio (nuevo → antiguo)
     y define también la navegación anterior/siguiente de las fichas.

   ⚠ REVISAR: los textos de "reto", "solucion", "entregables" y
     "servicios" son una base redactada a partir de lo que ya se
     comunica en el sitio. Ajústalos con los datos reales de cada
     cliente antes de publicar.

   ► MÉTRICAS ("metricas" / "medicion")
     Solo van cifras MEDIDAS, nunca estimadas. Se sacan corriendo
     `python _dev/medir-sitios.py`, que reporta peso de la carga
     inicial (sin las imágenes diferidas, que el navegador no baja
     al abrir) y número de peticiones.
     Si un proyecto no trae medición, `metricas: []` y la ficha
     simplemente no pinta la sección: es preferible no decir nada
     a publicar un número inventado.

   ► TESTIMONIOS ("testimonio")
     Va `null` hasta que exista una frase REAL del cliente y con su
     permiso. En cuanto se llene el objeto, la cita aparece sola.
   ============================================================ */
(function () {
  'use strict';

  const PROYECTOS = [
    {
      slug: 'metroenergy',
      nombre: 'MetroEnergy Autoconsumos',
      sector: 'Autoconsumo de diésel',
      anio: '2026',
      url: 'https://autoconsumodiesel.com.mx/',
      imagen: 'assets/autoconsumos.webp',
      encuadre: 'center',
      fondo: 'var(--card)',
      cliente: 'MetroEnergy',
      rol: 'Diseño y desarrollo',
      tipo: 'Sitio institucional',
      resumen: 'Un sitio que explica con claridad qué es el autoconsumo de diésel y para qué sirve, dirigido a flotas y empresas que quieren controlar su suministro de combustible.',
      reto: 'El autoconsumo de diésel es un servicio técnico que la mayoría de los clientes potenciales no conoce por su nombre. El sitio tenía que explicar el modelo —instalación, almacenamiento y despacho en las instalaciones del propio cliente— sin caer en jerga, y transmitir cumplimiento normativo desde la primera pantalla.',
      solucion: 'Una estructura corta y guiada: qué es el servicio, qué incluye la instalación, quién lo necesita y cómo empezar. El diseño apuesta por fotografía real de operación y una jerarquía tipográfica sobria, con puntos de contacto repartidos por toda la página para que solicitar información nunca esté a más de un clic.',
      entregables: [
        'Arquitectura de contenido y redacción de la propuesta de valor',
        'Diseño de interfaz responsive (escritorio, tablet y móvil)',
        'Desarrollo a medida, sin plantillas',
        'Formulario de contacto y enlace directo a WhatsApp',
        'Optimización de carga, SEO técnico y despliegue',
      ],
      servicios: ['Diseño de interfaz', 'Desarrollo web', 'Textos y estructura', 'SEO técnico', 'Velocidad'],
      // Medido el 31/08/2026 con _dev/medir-sitios.py
      metricas: [
        { valor: '132', unidad: 'KB', etiqueta: 'Pesa la página al abrir' },
        { valor: '8', unidad: '', etiqueta: 'Peticiones al servidor' },
        { valor: '229', unidad: 'KB', etiqueta: 'Total, con todas las imágenes' },
      ],
      medicion: 'Medido el 31/08/2026 sobre el sitio en producción',
      testimonio: null,
    },
    {
      slug: 'dolphins',
      nombre: "Club of Swimming Dolphin's",
      sector: 'Escuela de natación · Iztapalapa, CDMX',
      anio: '2026',
      url: 'https://acuaticadelfinesiztapalapa.com/',
      imagen: 'assets/dolphins-mockup.webp',
      encuadre: 'center',
      fondo: '#0c2a4a',
      cliente: "Club of Swimming Dolphin's",
      rol: 'Diseño y desarrollo',
      tipo: 'Sitio institucional',
      resumen: 'La cara digital de una escuela de natación de barrio: horarios, niveles e inscripciones explicados de forma que cualquier familia los entienda en un minuto.',
      reto: 'Las decisiones de inscripción las toman padres y madres con poco tiempo. El sitio tenía que resolver de inmediato las dudas de siempre —edades, horarios, costos, qué llevar— y al mismo tiempo transmitir el ambiente del club, que es su mejor argumento de venta.',
      solucion: 'Una navegación breve, con la información práctica al frente y un tono cálido acorde a una escuela infantil. La paleta se construyó alrededor del azul del agua, con fotografía de las instalaciones y llamadas a la acción hacia WhatsApp, el canal que el club ya usaba para inscribir.',
      entregables: [
        'Diseño de interfaz responsive orientado a móvil',
        'Secciones de niveles, horarios e instalaciones',
        'Contacto e inscripción directa por WhatsApp',
        'Galería de fotografías del club',
        'Publicación y puesta a punto en producción',
      ],
      // Sin "Velocidad" ni "optimizada" hasta que la medición lo respalde (ver abajo).
      servicios: ['Diseño de interfaz', 'Desarrollo web', 'Pensado para celular', 'Galería'],
      // Medido el 31/08/2026: 2.5 MB de carga inicial, 21 peticiones, 7.9 MB en total.
      // No se publica: son 2.5 MB para abrir en un celular. Optimizar la galería
      // (comprimir a WebP y diferir el resto) y volver a medir antes de presumirlo.
      metricas: [],
      medicion: '',
      testimonio: null,
    },
    {
      slug: 'stz-toluca',
      nombre: 'STZ Toluca',
      sector: 'Verificación Federal · Toluca',
      anio: '2026',
      url: 'https://verificacionaltransportezame.com.mx/',
      imagen: 'assets/stz.webp',
      encuadre: 'top',
      fondo: 'var(--card)',
      cliente: 'STZ — Verificación al Transporte',
      rol: 'Diseño y desarrollo',
      tipo: 'Sitio institucional',
      resumen: 'Unidad de verificación federal en Toluca, Estado de México. Un sitio pensado para que un transportista entienda en segundos qué trámite necesita y dónde agendarlo.',
      reto: 'Competir en un sector donde casi todos los sitios son directorios genéricos. Había que dejar claro el alcance de la unidad —verificación físico-mecánica y de emisiones contaminantes, con los tipos de autorización vigentes— y llevar al usuario a agendar sin fricción.',
      solucion: 'Una portada que nombra el trámite con precisión y lo acompaña de un CTA de agendado permanente. El resto del sitio ordena servicios, requisitos y ubicación, con un lenguaje visual técnico pero limpio que apoya la credibilidad de una unidad autorizada.',
      entregables: [
        'Diseño de interfaz responsive',
        'Fichas de servicios y requisitos de verificación',
        'Agendado de inspección y contacto directo',
        'Ubicación, horarios y datos de la unidad',
        'SEO local para Toluca y Estado de México',
      ],
      servicios: ['Diseño de interfaz', 'Desarrollo web', 'SEO local', 'Formularios'],
      // Medido el 31/08/2026: 5.6 MB de carga inicial, 19 peticiones, 25.9 MB en total.
      // No se publica: el más pesado junto con ASHE. Las imágenes van sin comprimir.
      metricas: [],
      medicion: '',
      testimonio: null,
    },
    {
      slug: 'ashe',
      nombre: 'ASHE',
      sector: 'Unidad de Inspección Federal',
      anio: '2024',
      url: 'http://version2.unidaddeinspeccionfederalashe.com/',
      imagen: 'assets/ashe.webp',
      encuadre: 'top',
      fondo: 'var(--card)',
      cliente: 'ASHE — Unidad de Inspección Federal Certificada',
      rol: 'Diseño y desarrollo',
      tipo: 'Sitio institucional',
      resumen: 'Inspección federal certificada para el autotransporte. Un sitio en tono oscuro, con foto de operación real, construido alrededor de una idea: cumplimiento y respaldo.',
      reto: 'Una unidad de inspección vende confianza antes que precio. El sitio anterior no comunicaba certificación ni respaldo técnico, y los clientes llegaban a preguntar cosas que la página debía haber respondido sola.',
      solucion: 'Una portada declarativa —"Inspección federal con estándares reales de seguridad"— sobre fotografía de campo, con dos acciones claras: solicitar inspección o revisar servicios. El resto del sitio detalla el proceso de inspección y la infraestructura, apoyado en una paleta oscura con acento ámbar que separa a ASHE del resto del sector.',
      entregables: [
        'Identidad digital y dirección de arte del sitio',
        'Diseño de interfaz responsive en tema oscuro',
        'Secciones de servicios, proceso e infraestructura',
        'Solicitud de inspección y contacto',
        'Galería de instalaciones y equipo',
      ],
      servicios: ['Dirección de arte', 'Diseño de interfaz', 'Desarrollo web', 'Fotografía dirigida', 'SEO técnico'],
      // Medido el 31/08/2026: 1.9 MB de carga inicial, 24 peticiones, 26.5 MB en total.
      // No se publica. Además el sitio sigue en http:// y en un subdominio
      // "version2.": sin HTTPS, Chrome lo marca como "no seguro". Es lo primero
      // que habría que resolver con este cliente.
      metricas: [],
      medicion: '',
      testimonio: null,
    },
    {
      slug: 'zame',
      nombre: 'ZAME',
      sector: 'Verificación Federal · CDMX',
      anio: '2024',
      url: 'https://unidaddeinspeccionzame.com/',
      imagen: 'assets/zame.webp',
      encuadre: 'top',
      fondo: 'var(--card)',
      cliente: 'ZAME — Unidad de Verificación Federal',
      rol: 'Diseño y desarrollo',
      tipo: 'Sitio institucional',
      resumen: 'Unidad de verificación federal en Ciudad de México, especializada en servicios al transporte federal: inspección físico-mecánica y de emisiones contaminantes.',
      reto: 'Explicar un servicio regulado a un público que llega con prisa y con una duda muy concreta: si esta unidad puede resolverle el trámite. Todo el contenido técnico tenía que ser legible sin perder el peso institucional que el sector exige.',
      solucion: 'Un diseño claro, de mucho aire y tipografía amable, donde el tipo de autorización se muestra desde la portada. La navegación separa servicios, contacto y galería para que cada visitante llegue directo a lo que busca.',
      entregables: [
        'Diseño de interfaz responsive',
        'Presentación de servicios y alcances de la unidad',
        'Contacto directo y datos de la unidad',
        'Galería de instalaciones',
        'SEO técnico',
      ],
      servicios: ['Diseño de interfaz', 'Desarrollo web', 'SEO técnico', 'Contenido'],
      // Medido el 31/08/2026: 6.5 MB de carga inicial, 16 peticiones. No hay
      // imágenes diferidas, así que todo eso se baja de golpe al abrir.
      // No se publica hasta optimizar y volver a medir.
      metricas: [],
      medicion: '',
      testimonio: null,
    },
  ];

  /* ----------------------------------------------------------
     RENDER — solo actúa en proyecto.html
     ---------------------------------------------------------- */
  const stage = document.querySelector('[data-proyecto]');
  if (!stage) return;

  const params = new URLSearchParams(window.location.search);
  const slug = (params.get('p') || '').trim().toLowerCase();
  const i = PROYECTOS.findIndex((p) => p.slug === slug);

  if (i === -1) {
    window.location.replace('index.html#trabajo');
    return;
  }

  const p = PROYECTOS[i];
  const total = PROYECTOS.length;
  const prev = PROYECTOS[(i - 1 + total) % total];
  const next = PROYECTOS[(i + 1) % total];

  const set = (campo, valor) => {
    document.querySelectorAll('[data-p="' + campo + '"]').forEach((el) => {
      el.textContent = valor;
    });
  };
  const setAttr = (campo, attr, valor) => {
    document.querySelectorAll('[data-p="' + campo + '"]').forEach((el) => {
      el.setAttribute(attr, valor);
    });
  };
  const dominio = (url) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');

  /* --- Metadatos de la ficha --------------------------------
     La ficha se arma en cliente, así que título, descripción,
     canónica y Open Graph se reescriben aquí para que cada
     ?p=slug se comparta e indexe como una página propia. */
  const SITIO = 'https://jooan.com.mx/';
  const titulo = p.nombre + ' — ficha técnica · joan';
  const desc = p.nombre + ' — ' + p.resumen;
  const canon = SITIO + 'proyecto.html?p=' + p.slug;

  document.title = titulo;
  const setMeta = (sel, valor) => {
    const el = document.querySelector(sel);
    if (el) el.setAttribute('content', valor);
  };
  setMeta('meta[name="description"]', desc);
  setMeta('meta[property="og:title"]', titulo);
  setMeta('meta[property="og:description"]', desc);
  setMeta('meta[property="og:url"]', canon);
  setMeta('meta[property="og:image"]', SITIO + p.imagen);
  setMeta('meta[name="twitter:title"]', titulo);
  setMeta('meta[name="twitter:description"]', desc);
  setMeta('meta[name="twitter:image"]', SITIO + p.imagen);

  const link = document.querySelector('link[rel="canonical"]');
  if (link) link.setAttribute('href', canon);

  document.documentElement.setAttribute('data-proyecto-slug', p.slug);

  // Datos estructurados de la ficha
  const ld = document.createElement('script');
  ld.type = 'application/ld+json';
  ld.textContent = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: p.nombre,
    description: p.resumen,
    url: canon,
    image: SITIO + p.imagen,
    dateCreated: p.anio,
    inLanguage: 'es-MX',
    genre: p.tipo,
    creator: { '@type': 'Organization', '@id': SITIO + '#estudio', name: 'joan — estudio digital', url: SITIO },
    about: { '@type': 'Organization', name: p.cliente },
    keywords: p.servicios.join(', '),
  });
  document.head.appendChild(ld);

  set('nombre', p.nombre);
  set('sector', p.sector);
  set('anio', p.anio);
  set('cliente', p.cliente);
  set('rol', p.rol);
  set('tipo', p.tipo);
  set('resumen', p.resumen);
  set('reto', p.reto);
  set('solucion', p.solucion);
  set('dominio', dominio(p.url));
  set('indice', String(i + 1).padStart(2, '0'));
  set('total', String(total).padStart(2, '0'));

  setAttr('url', 'href', p.url);
  document.querySelectorAll('[data-p="imagen"]').forEach((img) => {
    img.setAttribute('src', p.imagen);
    img.setAttribute('alt', p.nombre + ' — sitio web');
    img.style.objectPosition = p.encuadre;
  });
  document.querySelectorAll('[data-p="imagen-fondo"]').forEach((el) => {
    el.style.background = p.fondo;
  });

  const lista = document.querySelector('[data-p-list="entregables"]');
  if (lista) {
    lista.innerHTML = p.entregables.map((item, n) =>
      '<li>' +
        '<span class="pj-list-n">' + String(n + 1).padStart(2, '0') + '</span>' +
        '<span class="pj-list-t">' + item + '</span>' +
      '</li>'
    ).join('');
  }

  const chips = document.querySelector('[data-p-list="servicios"]');
  if (chips) {
    chips.innerHTML = p.servicios.map((s) =>
      '<span class="pj-chip">' + s + '</span>'
    ).join('');
  }

  /* --- Resultados medidos ---
     Sin medición no hay sección: se retira entera del documento en vez
     de dejar un encabezado vacío. Lo mismo con la cita del cliente. */
  const metricas = Array.isArray(p.metricas) ? p.metricas : [];
  const zonaMetricas = document.querySelector('[data-p-list="metricas"]');
  const seccionMetricas = document.querySelector('[data-p-seccion="resultados"]');

  if (zonaMetricas && metricas.length) {
    zonaMetricas.innerHTML = metricas.map((m) =>
      '<div>' +
        '<div class="pj-metric-v">' + m.valor +
          (m.unidad ? '<span class="pj-metric-u"> ' + m.unidad + '</span>' : '') +
        '</div>' +
        '<div class="pj-metric-l">' + m.etiqueta + '</div>' +
      '</div>'
    ).join('');
    set('medicion', p.medicion || '');
  } else if (seccionMetricas) {
    seccionMetricas.remove();
  }

  const quote = document.querySelector('[data-p-quote]');
  if (quote) {
    if (p.testimonio && p.testimonio.cita) {
      quote.querySelector('[data-p-quote-cita]').textContent = '«' + p.testimonio.cita + '»';
      quote.querySelector('[data-p-quote-autor]').textContent =
        p.testimonio.autor + (p.testimonio.cargo ? ' — ' + p.testimonio.cargo : '');
      quote.hidden = false;
    } else {
      quote.remove();
    }
  }

  const pintarSalto = (campo, proyecto) => {
    const el = document.querySelector('[data-p-nav="' + campo + '"]');
    if (!el) return;
    el.setAttribute('href', 'proyecto.html?p=' + proyecto.slug);
    const nombre = el.querySelector('[data-p-nav-nombre]');
    if (nombre) nombre.textContent = proyecto.nombre;
  };
  pintarSalto('prev', prev);
  pintarSalto('next', next);

  stage.style.visibility = 'visible';
})();
