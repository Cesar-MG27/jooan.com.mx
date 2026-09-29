<?php
/**
 * Configuración del envío de correo (Hostinger).
 * ------------------------------------------------------------------
 * Edita SOLO este archivo con los datos de tu buzón de Hostinger.
 *
 * En hPanel: Correos → Cuentas de correo → (tu cuenta) → "Detalles de
 * configuración" te muestra el servidor y puerto SMTP.
 *
 *   Servidor SMTP : smtp.hostinger.com
 *   Puerto        : 465  (SSL)   ó   587 (TLS)
 *   Usuario       : la dirección completa, ej. hola@tudominio.com
 *   Contraseña    : la contraseña de ESE buzón
 *
 * IMPORTANTE: 'from_email' debe ser el mismo buzón autenticado
 * ('smtp_user'); si no coincide, Hostinger rechaza el envío.
 * El correo del visitante se usa como Reply-To, así puedes responderle
 * directo desde tu bandeja.
 */

return [
    // --- Credenciales SMTP de Hostinger ---
    'smtp_host'   => 'smtp.hostinger.com',
    'smtp_port'   => 465,
    'smtp_secure' => 'ssl',                 // 'ssl' (puerto 465) | 'tls' (puerto 587)
    'smtp_user'   => 'CAMBIAR',  // ← tu correo Hostinger
    'smtp_pass'   => 'CAMBIAR',   // ← contraseña del buzón

    // --- Remitente (debe coincidir con smtp_user) ---
    'from_email'  => 'hola@jooan.com.mx',
    'from_name'   => 'Sitio web · joan',

    // --- Destinatario (a dónde te llegan los mensajes) ---
    'to_email'    => 'hola@jooan.com.mx',
    'to_name'     => 'joan',

    // --- Asunto base ---
    'subject'     => 'Nuevo mensaje desde el sitio',
];
