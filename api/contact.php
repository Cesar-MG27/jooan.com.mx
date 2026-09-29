<?php
/**
 * Receptor del formulario de contacto.
 * Valida los datos y los envía por SMTP autenticado (Hostinger).
 * Responde JSON: { "ok": true } | { "ok": false, "error": "..." }
 */

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

// --- Solo aceptamos POST ---
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Método no permitido.']);
    exit;
}

/** Lee y limpia un campo del POST. */
function field($name, $max = 5000) {
    $v = isset($_POST[$name]) ? trim((string) $_POST[$name]) : '';
    return mb_substr($v, 0, $max);
}

// --- Honeypot anti-spam: si el bot rellenó "website", fingimos éxito ---
if (field('website', 200) !== '') {
    echo json_encode(['ok' => true]);
    exit;
}

// --- Campos del formulario ---
$nombre   = field('nombre', 120);
$negocio  = field('negocio', 160);
$email    = field('email', 200);
$producto = field('producto', 120);   // opcional: qué producto eligió en la web
$mensaje  = field('mensaje', 4000);

// --- Validación ---
$errores = [];
if ($nombre === '')                                   $errores[] = 'el nombre';
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) $errores[] = 'un email válido';
if ($mensaje === '')                                  $errores[] = 'el mensaje';

if ($errores) {
    // "Falta el nombre." / "Faltan el nombre, un email válido y el mensaje."
    $ultimo = array_pop($errores);
    $lista  = $errores ? implode(', ', $errores) . ' y ' . $ultimo : $ultimo;
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => ($errores ? 'Faltan ' : 'Falta ') . $lista . '.']);
    exit;
}

// Evita inyección de cabeceras vía el email del visitante.
if (preg_match('/[\r\n]/', $email)) {
    http_response_code(422);
    echo json_encode(['ok' => false, 'error' => 'Email no válido.']);
    exit;
}

// --- Cargar configuración y mailer ---
$cfg = require __DIR__ . '/config.php';
require __DIR__ . '/smtp.php';

// --- Construir el cuerpo del mensaje ---
$lineas   = [];
$lineas[] = 'Nuevo mensaje desde el formulario del sitio.';
$lineas[] = str_repeat('—', 32);
$lineas[] = 'Nombre:   ' . $nombre;
$lineas[] = 'Negocio:  ' . ($negocio !== '' ? $negocio : '(no indicado)');
$lineas[] = 'Email:    ' . $email;
$lineas[] = 'Producto: ' . ($producto !== '' ? $producto : '(sin definir)');
$lineas[] = '';
$lineas[] = 'Mensaje:';
$lineas[] = $mensaje;
$lineas[] = '';
$lineas[] = str_repeat('—', 32);
$lineas[] = 'Enviado: ' . date('d/m/Y H:i') . ' · IP: ' . ($_SERVER['REMOTE_ADDR'] ?? 'n/d');
$body     = implode("\r\n", $lineas);

// El producto va en el asunto para poder priorizar desde la bandeja
$subject  = $cfg['subject'] . ' — ' . $nombre
          . ($producto !== '' ? ' · ' . $producto : '');

// --- Enviar ---
try {
    $smtp = new SmtpClient($cfg['smtp_host'], $cfg['smtp_port'], $cfg['smtp_secure']);
    $smtp->send(
        $cfg['from_email'], $cfg['from_name'],
        $cfg['to_email'],   $cfg['to_name'],
        $subject, $body,
        $cfg['smtp_user'],  $cfg['smtp_pass'],
        $email, $nombre   // Reply-To = visitante
    );
    // Acuse de recibo: solo lo emite el camino que llegó de verdad al SMTP.
    // El honeypot de arriba responde ok:true SIN este campo, así que el
    // cliente sabe no contar la conversión y el bot no se entera de que
    // fue detectado. El id queda en el log junto al correo, para poder
    // cruzar un lead entre GA4, el servidor y la bandeja.
    $id = bin2hex(random_bytes(4));
    error_log('[contact.php] enviado ' . $id . ' · ' . $email);
    echo json_encode(['ok' => true, 'id' => $id]);
} catch (Exception $e) {
    // Log al servidor; mensaje genérico al usuario.
    error_log('[contact.php] ' . $e->getMessage());
    http_response_code(502);
    echo json_encode([
        'ok'    => false,
        'error' => 'No se pudo enviar ahora mismo. Intenta por WhatsApp.',
    ]);
}
