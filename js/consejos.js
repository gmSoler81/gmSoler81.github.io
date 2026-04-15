// Tus 20 años de experiencia resumidos en tips

const categoriasConsejos = {
    "Puesta a Punto": [
        { tit: "Torno: Verificación de Mordazas", txt: "Siempre verificar el torque de los tornillos de las mordazas blandas después de un rectificado." },
        { tit: "Fresa: Limpieza de Conos", txt: "Una partícula de polvo en el cono BT40 puede causar una desviación de centésimas. Limpieza extrema siempre." }
    ],
    "Checklist: Puesta a Punto Segura": [
        { tit: "1. Seguridad Máquina", txt: "Verificar niveles de aceite, presión de aire y que el área de rotación del plato/husillo esté despejada." },
        { tit: "2. Amarre y Herramental", txt: "Controlar torque de mordazas y estado de insertos. Verificar que el voladizo sea el mínimo necesario." },
        { tit: "3. Carga de Offsets", txt: "Cargar correctores en la tabla del control. Medir herramienta en Z y X con palpador o método de contacto." },
        { tit: "4. Origen (G54-G59)", txt: "Verificar el cero pieza respecto al plano. Hacer un acercamiento manual para validar coordenadas." },
        { tit: "5. Prueba de Ciclo", txt: "Correr la primera pieza en 'Single Block' (Bloque a bloque) con el avance al 5% y mano en la parada de emergencia." }
    ],
    "Programador -> Operador": [
        { tit: "Hojas de Ruta Claras", txt: "Nunca mandes un programa sin indicar el saliente de herramienta (L) mínimo necesario para evitar colisiones." },
        { tit: "Comentarios en el Código", txt: "Usá paréntesis para indicar cambios de inserto o inspecciones críticas: (VERIFICAR DIAMETRO ANTES DE TERMINAR)." }
    ],
    "Industria 4.0 & 3D": [
        { tit: "Galgas de Control", txt: "Diseñá en NX e imprimí en PLA galgas de control rápido para piezas de serie. Ahorrás tiempo de medición." }
    ]
};

const modal = document.getElementById("modal-consejos");
const btnAbrir = document.querySelector('a[href="#seccion-consejos-detalle"]');
const btnCerrar = document.querySelector(".cerrar-modal");
const contenedor = document.getElementById("contenido-dinamico-consejos");

// Al hacer clic en "Leer Tips"
btnAbrir.onclick = function(e) {
    e.preventDefault();
    contenedor.innerHTML = ""; // Limpiar
    
// Recorremos cada categoría
    for (let tema in categoriasConsejos) {
        let seccionHTML = `
            <div class="tema-contenedor" style="margin-bottom: 30px;">
                <h2 style="color:#00bcd4; border-bottom:1px solid #00bcd4; padding-bottom:5px; font-family:'Orbitron'; font-size:1.2rem;">${tema}</h2>
                <div class="lista-items" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap:15px; margin-top:10px;">
        `;

        categoriasConsejos[tema].forEach(c => {
            seccionHTML += `
                <div class="item-consejo" style="background:#2a2a2a; padding:15px; border-radius:8px;">
                    <h4 style="color:#fff; margin-bottom:5px;">${c.tit}</h4>
                    <p style="color:#bbb; font-size:0.9rem;">${c.txt}</p>
                </div>
            `;
        });

        seccionHTML += `</div></div>`;
        contenedor.innerHTML += seccionHTML;
    }
    
    modal.style.display = "block";
}

// Cerrar al hacer clic en la X o fuera de la caja
btnCerrar.onclick = () => modal.style.display = "none";
window.onclick = (event) => { if (event.target == modal) modal.style.display = "none"; }