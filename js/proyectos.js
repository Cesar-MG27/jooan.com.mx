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
      // Plantilla propia, no proyecto de cliente: tiene su propia página de
      // venta (plantilla-almavera.html). Aquí solo vive para el orden y la
      // navegación anterior/siguiente; ?p=almavera redirige a esa página.
      slug: 'almavera',
      nombre: 'Alma Vera',
      pagina: 'plantilla-almavera.html',
    },
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
      resumen: 'Un sitio que convierte un servicio técnico en una oferta que un dueño de flota entiende en un minuto: qué es el autoconsumo de diésel, para quién es y cómo contratarlo.',
      reto: 'MetroEnergy vende algo que sus clientes todavía no saben nombrar, y lo necesitaba en línea en cinco días. El sitio tenía que explicar el servicio en los primeros segundos —o el interés se perdía antes de volverse una llamada— y estar listo a tiempo, sin que las prisas se notaran en el resultado.',
      solucion: 'Convertí el servicio en algo que se entiende a la primera: qué es, para quién y cómo empezar. Repartí los puntos de contacto por toda la página para que pedir información nunca esté a más de un clic, y apoyé todo en fotografía de operación real que demuestra que esto ya funciona.',
      entregables: [
        'Arquitectura de contenido y redacción de la propuesta de valor',
        'Diseño de interfaz responsive a medida, sin plantillas',
        'Secciones de soluciones, autoridades y registro CNE',
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
      resumen: 'Un sitio que trabaja como un recepcionista que nunca cierra: resuelve en un minuto las dudas de cualquier familia y la deja lista para inscribirse.',
      reto: 'Las inscripciones las deciden papás y mamás con poco tiempo y muchas dudas: edades, horarios, costos, qué llevar. Cada pregunta que el sitio no respondía era una llamada de más para el club y una familia que seguía buscando en otro lado.',
      solucion: 'Puse al frente lo que una familia necesita para decidir, en un tono cálido de escuela infantil, y dejé la inscripción a un toque por WhatsApp, el canal que el club ya usaba. La fotografía de las instalaciones hace el resto: transmite el ambiente que es su mejor argumento de venta.',
      entregables: [
        'Dirección visual con una escena propia por sección',
        'Hero con fotografía y simulación de agua en WebGL',
        'Programas por edad con horarios, precios y curso de verano',
        'Sección de equipo con los 12 entrenadores y reseñas reales de Google',
        'Inscripción y contacto directos por WhatsApp',
      ],
      // Sin "Velocidad" ni "optimizada" hasta que la medición lo respalde (ver abajo).
      servicios: ['Dirección de arte', 'Diseño de interfaz', 'Desarrollo web', 'Animación y WebGL', 'Pensado para celular'],
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
      resumen: 'Un sitio que le gana al transportista en los primeros segundos: le dice qué trámite resuelve esta unidad y lo lleva a agendar antes de que busque en otro lado.',
      reto: 'En un sector lleno de directorios genéricos, un transportista no distingue una unidad de otra. Si STZ no dejaba claro de inmediato qué trámite resuelve y dónde, el cliente se iba con el primero que sí se lo dijera.',
      solucion: 'Nombré el trámite con precisión desde la portada y mantuve el agendado siempre a la vista. El resto ordena servicios, requisitos y ubicación para que el transportista llegue a lo que busca sin fricción, y la unidad se vea tan seria como el servicio que presta.',
      entregables: [
        'Diseño de interfaz responsive',
        'Secciones de servicios, infraestructura y normativa',
        'Formulario de contacto con confirmación automática por correo',
        'Agendado de inspección y datos de la unidad',
        'SEO local para Toluca y Estado de México',
      ],
      servicios: ['Diseño de interfaz', 'Desarrollo web', 'SEO local', 'Formularios'],
      // Medido el 31/08/2026: 5.6 MB de carga inicial, 19 peticiones, 25.9 MB en total.
      // No se publica: de los más pesados. Las imágenes van sin comprimir.
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
      resumen: 'Un sitio que responde de inmediato la única duda con la que llega un transportista —si esta unidad le resuelve el trámite— y lo deja listo para agendar.',
      reto: 'Un transportista llega con prisa y una sola pregunta: si esta unidad puede resolverle el trámite. Si el sitio no se lo confirmaba rápido, ZAME perdía a un cliente que ya estaba listo para agendar.',
      solucion: 'Mostré el tipo de autorización desde la portada y separé servicios, contacto y galería para que cada visitante llegue directo a lo suyo. Mucho aire y tipografía legible para que el peso institucional sume confianza en vez de estorbar la decisión.',
      entregables: [
        'Diseño de interfaz responsive',
        'Secciones de servicios, inspección y nosotros',
        'Normatividad oficial descargable (NOMs en PDF)',
        'Galería de instalaciones y formulario de contacto por correo',
        'SEO técnico',
      ],
      servicios: ['Diseño de interfaz', 'Desarrollo web', 'SEO técnico', 'Galería', 'Formularios'],
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

  // Productos propios (plantillas) tienen su propia página de venta
  if (PROYECTOS[i].pagina) {
    window.location.replace(PROYECTOS[i].pagina);
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
    el.setAttribute('href', proyecto.pagina || 'proyecto.html?p=' + proyecto.slug);
    const nombre = el.querySelector('[data-p-nav-nombre]');
    if (nombre) nombre.textContent = proyecto.nombre;
  };
  pintarSalto('prev', prev);
  pintarSalto('next', next);

  stage.style.visibility = 'visible';
})();
