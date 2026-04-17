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

const menu = document.getElementById('mobile-menu');
const navList = document.getElementById('nav-list');

menu.addEventListener('click', () => {
    navList.classList.toggle('active'); // Abre y cierra el menú
});

const bancoPreguntas = {
    torno: [
        { q: "¿Qué código G activa la velocidad de corte constante?", opts: ["G96", "G97", "G54", "G50"], c: 0 },
        { q: "¿Para qué sirve el código G71?", opts: ["Roscado", "Ciclo de desbaste longitudinal", "Acabado", "Taladrado"], c: 1 },
        { q: "¿Qué comando se usa para el roscado automático?", opts: ["G01", "G76", "G81", "G02"], c: 1 },
       { q: "¿Qué código se utiliza para limitar la velocidad máxima del husillo (RPM)?", opts: ["G96", "G97", "G50", "G54"], c: 2 },
    { q: "En un ciclo G71, ¿qué parámetro define la sobremedida de material para el acabado en el eje X?", opts: ["U", "W", "R", "P"], c: 0 }
    ],
    fresa: [
        { q: "¿Cuál es el código para activar la compensación de longitud de herramienta?", opts: ["G41", "G42", "G43", "G49"], c: 2 },
        { q: "¿Qué comando cancela los ciclos fijos?", opts: ["G80", "G81", "G90", "G91"], c: 0 },
        { q: "¿Qué eje controla el movimiento vertical en un centro de mecanizado?", opts: ["Eje X", "Eje Y", "Eje Z", "Eje B"], c: 2 },
        { q: "¿Qué código G se usa para programar en coordenadas incrementales?", opts: ["G90", "G91", "G54", "G17"], c: 1 },
        { q: "¿Para qué sirve el código G83?", opts: ["Planeado", "Escariado", "Taladrado profundo con rotura de viruta", "Roscado con macho"], c: 2 }
    ]
};

let quizActual = [];
let indicePregunta = 0;
let aciertos = 0;

function iniciarTest(tipo) {
    quizActual = bancoPreguntas[tipo];
    indicePregunta = 0;
    aciertos = 0;
    
    document.getElementById('selector-test').classList.add('oculto');
    document.getElementById('quiz-container').classList.remove('oculto');
    document.getElementById('tipo-test-titulo').innerText = "Evaluación de " + tipo.toUpperCase();
    mostrarPregunta();
}

function mostrarPregunta() {
    const p = quizActual[indicePregunta];
    document.getElementById('pregunta-texto').innerText = p.q;
    const btnContainer = document.getElementById('opciones-btns');
    btnContainer.innerHTML = "";

    p.opts.forEach((o, i) => {
        const b = document.createElement('button');
        b.innerText = o;
        b.className = "btn-opcion";
        b.onclick = () => {
            if(i === p.c) aciertos++;
            indicePregunta++;
            if(indicePregunta < quizActual.length) mostrarPregunta();
            else finalizarTest();
        };
        btnContainer.appendChild(b);
    });
}

// function mostrarResultados() {
//     document.getElementById('quiz-container').classList.add('oculto');
//     const resContainer = document.getElementById('resultado-container');
//     resContainer.classList.remove('oculto');
    
//     const final = (aciertos / quizActual.length) * 100;
//     document.getElementById('puntaje').innerText = final + "%";
    
//     let msg = final >= 80 ? "¡Excelente nivel! Estás para grandes proyectos." : "Buen intento. Te recomiendo repasar mis manuales técnicos.";
//     document.getElementById('feedback-texto').innerText = msg;
// }

function finalizarTest() {
    document.getElementById('quiz-container').classList.add('oculto');
    const resContainer = document.getElementById('resultado-container');
    resContainer.classList.remove('oculto');
    
    const final = (aciertos / quizActual.length) * 100;
    const nombreUsuario = prompt("¡Test finalizado! Ingresá tu nombre para el certificado:") || "Especialista CNC";
    
    document.getElementById('puntaje').innerText = final + "%";
    
    // Generamos el Diploma Visual
    const certificadoHTML = `
        <div class="diploma-canvas">
            <div class="diploma-border">
                <div class="diploma-content">
                    <img src="img/logo-solgia.png" class="mini-logo" onerror="this.style.display='none'">
                    <h1 class="diploma-titulo">CERTIFICADO DE LOGRO</h1>
                    <p class="diploma-texto">Se reconoce a:</p>
                    <h2 class="diploma-nombre">${nombreUsuario.toUpperCase()}</h2>
                    <p class="diploma-texto">Por su desempeño del <strong>${final}%</strong> en la evaluación técnica de</p>
                    <h3 class="diploma-materia">${quizActual === bancoPreguntas.torno ? 'TORNO CNC' : 'CENTRO DE MECANIZADO'}</h3>
                    <div class="diploma-footer">
                        <div class="firma">
                            <p>_______________________</p>
                            <p>Gustavo Soler - SolGia</p>
                        </div>
                        <div class="fecha">
                            <p>${new Date().toLocaleDateString()}</p>
                            <p>Validación Digital</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <p class="instruccion-descarga">📸 ¡Sacale una captura y compartila en LinkedIn o Instagram etiquetando a @SolGia!</p>
    `;
    
    resContainer.innerHTML = certificadoHTML + `
        <button onclick="location.reload()" class="btn-reiniciar">Volver a intentar</button>
        <a href="https://wa.me/tu_numero" class="btn-opcion" style="display:inline-block; margin-top:10px;">Consultar por Certificación Oficial</a>
    `;
}