document.getElementById('link-blog').addEventListener('click', function(event) {
    event.preventDefault(); // Evita que el enlace cambie la URL

    var contenidoAnterior = document.getElementById('contenido-anterior');
    var contenidoBlog = document.getElementById('contenido-blog');
    var botonVolver = document.getElementById('boton-volver');

    contenidoAnterior.style.display = 'none'; // Oculta el contenido anterior
    contenidoBlog.style.display = 'block'; // Muestra el contenido del blog
    botonVolver.style.display = 'block'; // Muestra el botón de volver
});

document.getElementById('boton-volver').addEventListener('click', function(event) {
    var contenidoAnterior = document.getElementById('contenido-anterior');
    var contenidoBlog = document.getElementById('contenido-blog');
    var botonVolver = document.getElementById('boton-volver');

    contenidoAnterior.style.display = 'block'; // Muestra el contenido anterior
    contenidoBlog.style.display = 'none'; // Oculta el contenido del blog
    botonVolver.style.display = 'none'; // Oculta el botón de volver
});

function mostrarMas(boton) {
    var contenido = document.getElementById('masContenido');

    if (contenido.style.display === 'none') {
        contenido.style.display = 'block';
        boton.textContent = 'Mostrar menos';
    } else {
        contenido.style.display = 'none';
        boton.textContent = 'Seguir leyendo';
    }
}
