// Datos de Proyectos
const proyectos = [
    {
        titulo: 'Porta Fresa',
        descripcion: 'Estructura desarmable diseñada en PLA.',
        imagen: 'img/portafresa.png',
        categoria: 'Utilidad'
    },
    {
        titulo: 'Plantilla Poka-Yoke',
        descripcion: 'Dispositivo físico para asegurar el cero pieza en centro de mecanizado.',
        imagen: 'img/plantilla_cnc.jpg',
        categoria: 'Industria 4.0'
    },
    {
        titulo: 'Organizador Voronoi',
        descripcion: 'Optimización de material mediante patrones orgánicos generados en CAD avanzado.',
        imagen: 'img/voronoi.jpg',
        categoria: 'Ingeniería 3D'
    },
    {
        titulo: 'Soporte CNC',
        descripcion: 'Orgnizador de bridas.',
        imagen: 'img/portabrida.png',
        categoria: 'Ingeniería 3D'
    },
    {
        titulo: 'Porta Torno',
        descripcion: 'Soporte para organizar herramientas de torno.',
        imagen: 'img/portatorno.png',
        categoria: 'Utilidad'
    }
];

// Datos de Servicios
const servicios_solgia = [
    {
        titulo: 'Capacitación in-Company',
        icono: '👨‍🏫',
        descripcion: 'Entrenamiento basado en tus propios planos y máquinas.',
        detalle: 'Especialista en controles Fanuc, Siemens y Fagor. Programación al pie de máquina.'
    },
    {
        titulo: 'Programación CAM Avanzada',
        icono: '💻',
        descripcion: 'Optimización de procesos mediante software de alto nivel.',
        detalle: 'Dominio experto de Siemens NX 10 y CAMWorks para fresas y tornos.'
    },
    {
        titulo: 'Soporte y Puesta a Punto',
        icono: '🛠️',
        descripcion: 'Asistencia técnica para reducir tiempos de set-up.',
        detalle: 'Resolución de problemas complejos y corrección de programas existentes.'
    }
];

// Función para renderizar todo al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    const contenedorServicios = document.getElementById('contenedor-servicios');
    const contenedorProyectos = document.getElementById('contenedor-proyectos');

    // Cargar Servicios
    servicios_solgia.forEach(s => {
        contenedorServicios.innerHTML += `
            <div class="servicio-card">
                <div class="servicio-icono">${s.icono}</div>
                <h3>${s.titulo}</h3>
                <p><strong>${s.descripcion}</strong></p>
                <p>${s.detalle}</p>
            </div>
        `;
    });

    // Cargar Proyectos
    proyectos.forEach(p => {
        contenedorProyectos.innerHTML += `
            <div class="proyecto-card">
                <img src="${p.imagen}" alt="${p.titulo}">
                <div class="proyecto-info">
                    <span class="categoria">${p.categoria}</span>
                    <h3>${p.titulo}</h3>
                    <p>${p.descripcion}</p>
                </div>
            </div>
        `;
    });
});