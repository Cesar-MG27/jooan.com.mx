<?php
/**
 * Cliente SMTP minimalista y sin dependencias.
 * Soporta SSL directo (puerto 465) y STARTTLS (puerto 587),
 * autenticación AUTH LOGIN y cuerpo UTF-8.
 *
 * No requiere Composer ni PHPMailer: ideal para subir a Hostinger
 * por el Administrador de archivos y que funcione tal cual.
 */

class SmtpClient
{
    private $conn;
    private $host;
    private $port;
    private $secure;     // 'ssl' | 'tls' | ''
    private $timeout;
    private $log = [];

    public function __construct($host, $port, $secure = 'ssl', $timeout = 15)
    {
        $this->host    = $host;
        $this->port    = (int) $port;
        $this->secure  = $secure;
        $this->timeout = (int) $timeout;
    }

    /** Devuelve el log de la conversación SMTP (útil para depurar). */
    public function getLog() { return $this->log; }

    /**
     * Envía un correo de texto plano (UTF-8).
     * @throws Exception si algún paso del diálogo SMTP falla.
     */
    public function send($from, $fromName, $to, $toName, $subject, $body, $user, $pass, $replyTo = null, $replyName = null)
    {
        $this->connect();
        $this->ehlo();

        if ($this->secure === 'tls') {
            $this->cmd('STARTTLS', 220);
            if (!stream_socket_enable_crypto($this->conn, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                throw new Exception('No se pudo iniciar STARTTLS.');
            }
            $this->ehlo(); // re-saludar tras cifrar
        }

        // --- Autenticación AUTH LOGIN ---
        $this->cmd('AUTH LOGIN', 334);
        $this->cmd(base64_encode($user), 334);
        $this->cmd(base64_encode($pass), 235);

        // --- Sobre del mensaje ---
        $this->cmd('MAIL FROM:<' . $from . '>', 250);
        $this->cmd('RCPT TO:<' . $to . '>', 250);
        $this->cmd('DATA', 354);

        // --- Cabeceras + cuerpo ---
        $headers   = [];
        $headers[] = 'Date: ' . date('r');
        $headers[] = 'From: ' . $this->encodeName($fromName) . ' <' . $from . '>';
        $headers[] = 'To: ' . $this->encodeName($toName) . ' <' . $to . '>';
        if ($replyTo) {
            $headers[] = 'Reply-To: ' . $this->encodeName($replyName ?: $replyTo) . ' <' . $replyTo . '>';
        }
        $headers[] = 'Subject: ' . $this->encodeHeader($subject);
        $headers[] = 'MIME-Version: 1.0';
        $headers[] = 'Content-Type: text/plain; charset=UTF-8';
        $headers[] = 'Content-Transfer-Encoding: base64';
        $headers[] = 'X-Mailer: joan-smtp/1.0';

        $data = implode("\r\n", $headers) . "\r\n\r\n"
              . chunk_split(base64_encode($body), 76, "\r\n");

        // Dot-stuffing: una línea que empiece con '.' se duplica.
        $data = preg_replace('/^\./m', '..', $data);

        $this->write($data . "\r\n.");
        $this->expect(250); // fin de DATA

        $this->cmd('QUIT', 221);
        $this->close();
        return true;
    }

    // ---------------------------------------------------------------

    private function connect()
    {
        $remote = ($this->secure === 'ssl' ? 'ssl://' : '') . $this->host . ':' . $this->port;
        $ctx = stream_context_create([
            'ssl' => ['verify_peer' => true, 'verify_peer_name' => true, 'allow_self_signed' => false],
        ]);
        $errno = 0; $errstr = '';
        $this->conn = @stream_socket_client(
            $remote, $errno, $errstr, $this->timeout,
            STREAM_CLIENT_CONNECT, $ctx
        );
        if (!$this->conn) {
            throw new Exception('No se pudo conectar al servidor SMTP (' . $errstr . ').');
        }
        stream_set_timeout($this->conn, $this->timeout);
        $this->expect(220); // saludo del servidor
    }

    private function ehlo()
    {
        $host = isset($_SERVER['SERVER_NAME']) ? $_SERVER['SERVER_NAME'] : 'localhost';
        $this->write('EHLO ' . $host);
        $reply = $this->read();
        if ((int) substr($reply, 0, 3) !== 250) {
            // Algunos servidores antiguos no aceptan EHLO; probamos HELO.
            $this->cmd('HELO ' . $host, 250);
        }
    }

    private function cmd($command, $expected)
    {
        $this->write($command);
        $this->expect($expected);
    }

    private function write($string)
    {
        $this->log[] = '> ' . $string;
        if (fwrite($this->conn, $string . "\r\n") === false) {
            throw new Exception('Fallo al escribir en el socket SMTP.');
        }
    }

    private function read()
    {
        $data = '';
        while (($line = fgets($this->conn, 515)) !== false) {
            $data .= $line;
            // El 4º carácter es ' ' en la última línea, '-' si hay más.
            if (strlen($line) < 4 || $line[3] === ' ') break;
        }
        $this->log[] = '< ' . trim($data);
        return $data;
    }

    private function expect($code)
    {
        $reply = $this->read();
        $got = (int) substr($reply, 0, 3);
        if ($got !== (int) $code) {
            throw new Exception('SMTP esperaba ' . $code . ' y recibió: ' . trim($reply));
        }
        return $reply;
    }

    private function encodeHeader($text)
    {
        // Codifica solo si hay caracteres no ASCII.
        if (preg_match('/[^\x20-\x7e]/', $text)) {
            return '=?UTF-8?B?' . base64_encode($text) . '?=';
        }
        return $text;
    }

    private function encodeName($name)
    {
        $encoded = $this->encodeHeader($name);
        // Si quedó sin codificar y trae caracteres especiales, lo entrecomillamos.
        if ($encoded === $name && preg_match('/[",<>@]/', $name)) {
            return '"' . str_replace('"', '', $name) . '"';
        }
        return $encoded;
    }

    private function close()
    {
        if (is_resource($this->conn)) {
            fclose($this->conn);
            $this->conn = null;
        }
    }
}
