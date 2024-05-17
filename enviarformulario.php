<?php
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $nombre = $_POST['nombre'];
    $email = $_POST['email'];
    $mensaje = $_POST['mensaje'];
    
    $to = "gmsoler81@gmail.com"; // Coloca aquí tu dirección de correo electrónico
    $subject = "Nuevo mensaje de contacto desde tu sitio web";
    $message = "Nombre: " . $nombre . "\n";
    $message .= "Email: " . $email . "\n";
    $message .= "Mensaje:\n" . $mensaje . "\n";
    
    $headers = "From: " . $email . "\r\n";
    $headers .= "Reply-To: " . $email . "\r\n";
    
    if (mail($to, $subject, $message, $headers)) {
        echo "Tu mensaje ha sido enviado correctamente. ¡Gracias por ponerte en contacto!";
    } else {
        echo "Lo sentimos, ha ocurrido un error al enviar el mensaje. Por favor, inténtalo de nuevo más tarde.";
    }
}
?>
