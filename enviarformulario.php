<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

require 'vendor/phpmailer/PHPMailer/src/Exception.php';
require 'vendor/phpmailer/PHPMailer/src/PHPMailer.php';
require 'vendor/phpmailer/PHPMailer/src/SMTP.php';

require 'vendor/autoload.php';

header('Content-Type: application/json');

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $nombre = $_POST['nombre'];
    $email = $_POST['email'];
    $mensaje = $_POST['mensaje'];

    $mail = new PHPMailer(true);

    try {
        // Server settings
        $mail->SMTPDebug = SMTP::DEBUG_OFF;
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'gmsoler81@gmail.com';
        $mail->Password = 'koagphqfzsisqxrg';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        $mail->setFrom('gmsoler81@gmail.com', 'Gustavo');
        $mail->addAddress('gmsoler81@gmail.com');

        $cuerpo = 'Este es un mensaje de: ' . $nombre . "\n";
        $cuerpo .= 'Su email es: ' . $email . "\n";
        $cuerpo .= 'Su mensaje es: ' . $mensaje;

        $mail->isHTML(false);
        $mail->Subject = 'Consulta de clases';
        $mail->Body = $cuerpo;

        $mail->send();

        echo json_encode(['status' => 'success', 'message' => '¡Gracias por tu mensaje!']);
    } catch (Exception $e) {
        echo json_encode(['status' => 'error', 'message' => 'Error al enviar el correo: ' . $mail->ErrorInfo]);
    }
} else {
    echo json_encode(['status' => 'error', 'message' => 'Método de solicitud no permitido']);
}
?>
