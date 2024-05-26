<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require '../vendor/phpmailer/PHPMailer/src/Exception.php';
require '../vendor/phpmailer/PHPMailer/src/PHPMailer.php';
require '../vendor/phpmailer/PHPMailer/src/SMTP.php';

// Load Composer's autoloader
require '../vendor/autoload.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $nombre = $_POST['nombre'];
    $email = $_POST['email'];
    $calificacion = $_POST['calificacion'];
    $comentario = $_POST['comentario'];

    $mail = new PHPMailer(true);

    try {
        // Server settings
        $mail->SMTPDebug = SMTP::DEBUG_OFF; // Disable verbose debug output
        $mail->isSMTP(); // Send using SMTP
        $mail->Host = 'smtp.gmail.com'; // Set the SMTP server to send through
        $mail->SMTPAuth = true; // Enable SMTP authentication
        $mail->Username = 'gmsoler81@gmail.com'; // SMTP username
        $mail->Password = 'koagphqfzsisqxrg'; // SMTP password
        $mail->SMTPSecure = 'tls'; // Enable implicit TLS encryption
        $mail->Port = 587; // TCP port to connect to; use 587 if you have set `SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS`

        $mail->setFrom('gmsoler81@gmail.com', 'Gustavo');
        $mail->addAddress('gmsoler81@gmail.com');

        // Concatenar las variables en el cuerpo del correo
        $cuerpo = 'Este es el feedback de: ' . $nombre . "\n";
        $cuerpo .= 'Su email es: ' . $email . "\n";
        $cuerpo .= 'Su calificación es: ' . $calificacion . "\n";
        $cuerpo .= 'Su comentario es: ' . $comentario . "\n";

        // Asignar el cuerpo del correo
        $mail->isHTML(false); // Cambiado a falso para enviar texto sin formato
        $mail->Subject = 'Feedback';
        $mail->Body = $cuerpo;

        $mail->send();

        // Responder con un mensaje de éxito en formato JSON
        echo json_encode(['status' => 'success', 'message' => '¡Gracias por tu feedback!']);
    } catch (Exception $e) {
        // Responder con un mensaje de error en formato JSON
        echo json_encode(['status' => 'error', 'message' => 'Error al enviar el correo: ' . $mail->ErrorInfo]);
    }
} else {
    // Responder con un mensaje de error si no es una solicitud POST
    echo json_encode(['status' => 'error', 'message' => 'Método de solicitud no permitido']);
}
?>
