// main.js

// 1. Mostrar/Ocultar campos según la operación elegida
window.mostrarCamposOperacion = function () {
    const operacion = document.getElementById("operacion").value;
    const seccionParametros = document.getElementById("seccion-parametros");
    const camposPlaneado = document.getElementById("campos-planeado");
    const camposEscuadrado = document.getElementById("campos-escuadrado");
    const camposPerforar = document.getElementById("campos-perforar");

    if (!operacion) {
        seccionParametros.style.display = "none";
        return;
    }

    seccionParametros.style.display = "block";
    camposPlaneado.style.display = (operacion === "planeado") ? "block" : "none";
    camposEscuadrado.style.display = (operacion === "escuadrado") ? "block" : "none";
    camposPerforar.style.display = (operacion === "perforar") ? "block" : "none";
};

// 2. Función Principal: Disparador del Botón
window.generarEstructuraBase = function () {
    const operacion = document.getElementById("operacion").value;
    let gcode = "";

    if (operacion === "escuadrado") {
        gcode = generarGCodeEscuadrado();
    } else if (operacion === "planeado") {
        gcode = generarGCodePlaneado(); 
    } else {
        gcode = "( SELECCIONE UNA OPERACION VALIDA )";
    }

    document.getElementById("consola").value = gcode;
};

// 4. Lógica para Generar Planeado / Refrentado
function generarGCodePlaneado() {
    // A. Lectura de Parámetros Generales
    const ceroXY = document.getElementById("ceroXY").value;
    const S = document.getElementById("velocidad").value || "1200";
    const zSeguridad = parseFloat(document.getElementById("zSeguridad").value) || 10.0;
    const T = document.getElementById("numHerramienta").value || "1";
    const diametro = parseFloat(document.getElementById("diametroHerramienta").value) || 50.0;
    const radio = diametro / 2.0;

    // B. Lectura de Parámetros Específicos de Planeado
    const anchoX = parseFloat(document.getElementById("anchoX").value) || 100.0;
    const largoY = parseFloat(document.getElementById("largoY").value) || 80.0;
    const zInicial = parseFloat(document.getElementById("zInicial").value) || 2.0;
    const zFinal = parseFloat(document.getElementById("zFinal").value) || 0.0;
    const pasadaZ = parseFloat(document.getElementById("pasadaZ").value) || 0.5;
    const direccion = document.getElementById("direccionPlaneado").value; // 'horizontal' o 'vertical'
    const estrategia = document.getElementById("estrategia").value; // 'zigzag', 'climb', 'conventional'
    const F = document.getElementById("avanceF").value || "800";

    // C. Límites del Bloque según Cero Pieza
    let xMin = 0, xMax = 0, yMin = 0, yMax = 0;

    switch (ceroXY) {
        case "centro":
            xMin = -anchoX / 2.0;
            xMax = anchoX / 2.0;
            yMin = -largoY / 2.0;
            yMax = largoY / 2.0;
            break;
        case "esquina_sup_izq":
            xMin = 0;
            xMax = anchoX;
            yMin = -largoY;
            yMax = 0;
            break;
        case "esquina_inf_der":
            xMin = -anchoX;
            xMax = 0;
            yMin = 0;
            yMax = largoY;
            break;
        case "esquina_sup_der":
            xMin = -anchoX;
            xMax = 0;
            yMin = -largoY;
            yMax = 0;
            break;
        case "esquina_inf_izq":
        default:
            xMin = 0;
            xMax = anchoX;
            yMin = 0;
            yMax = largoY;
            break;
    }

    // D. Cálculo de Pasadas Laterales (Solape del 65% del diámetro)
    const pasoLateral = diametro * 0.65;
    const margenEntrada = radio + 5.0; // Salida/Entrada fuera de la pieza

    let nc = [];
    nc.push("%");
    nc.push("O0002 (PLANEADO FRESADORA FANUC)");
    nc.push(`( HERRAMIENTA T${T} - DIA ${diametro}MM )`);
    nc.push("G21 G40 G80 G90");
    nc.push(`T${T} M06`);
    nc.push(`G54 G00 S${S} M03`);
    nc.push(`G43 H${T} Z${zSeguridad.toFixed(1)}`);
    nc.push("");

    // E. Bucle por Profundidad (Z)
    let zActual = zInicial;
    const pasoZAbs = Math.abs(pasadaZ);

    nc.push("( --- INICIO DE PLANEADO --- )");

    while (zActual > zFinal) {
        zActual -= pasoZAbs;
        if (zActual < zFinal) zActual = zFinal;

        nc.push(`( PASADA Z = ${zActual.toFixed(3)} )`);

        if (direccion === "horizontal") {
            // Pasadas a lo largo de X
            let yPos = yMin + radio * 0.8;
            let direccionX = 1; // 1 = Hacia la derecha, -1 = Hacia la izquierda

            // Posicionamiento de inicio
            nc.push(`G00 X${(xMin - margenEntrada).toFixed(3)} Y${yPos.toFixed(3)}`);
            nc.push(`G01 Z${zActual.toFixed(3)} F${Math.round(F / 2)}`);

            while (yPos <= yMax + (radio * 0.2)) {
                if (direccionX === 1) {
                    nc.push(`G01 X${(xMax + margenEntrada).toFixed(3)} Y${yPos.toFixed(3)} F${F}`);
                } else {
                    nc.push(`G01 X${(xMin - margenEntrada).toFixed(3)} Y${yPos.toFixed(3)} F${F}`);
                }

                yPos += pasoLateral;

                if (yPos <= yMax + (radio * 0.2)) {
                    if (estrategia === "zigzag") {
                        // Cambia de Y y se invierte el sentido
                        direccionX *= -1;
                        nc.push(`G01 Y${yPos.toFixed(3)}`);
                    } else {
                        // Retorno seguro fuera de la pieza (Climb / Convencional)
                        nc.push(`G00 Z${zSeguridad.toFixed(1)}`);
                        nc.push(`G00 X${(xMin - margenEntrada).toFixed(3)} Y${yPos.toFixed(3)}`);
                        nc.push(`G01 Z${zActual.toFixed(3)} F${Math.round(F / 2)}`);
                    }
                }
            }
        } else {
            // Pasadas a lo largo de Y
            let xPos = xMin + radio * 0.8;
            let direccionY = 1;

            nc.push(`G00 X${xPos.toFixed(3)} Y${(yMin - margenEntrada).toFixed(3)}`);
            nc.push(`G01 Z${zActual.toFixed(3)} F${Math.round(F / 2)}`);

            while (xPos <= xMax + (radio * 0.2)) {
                if (direccionY === 1) {
                    nc.push(`G01 X${xPos.toFixed(3)} Y${(yMax + margenEntrada).toFixed(3)} F${F}`);
                } else {
                    nc.push(`G01 X${xPos.toFixed(3)} Y${(yMin - margenEntrada).toFixed(3)} F${F}`);
                }

                xPos += pasoLateral;

                if (xPos <= xMax + (radio * 0.2)) {
                    if (estrategia === "zigzag") {
                        direccionY *= -1;
                        nc.push(`G01 X${xPos.toFixed(3)}`);
                    } else {
                        nc.push(`G00 Z${zSeguridad.toFixed(1)}`);
                        nc.push(`G00 X${xPos.toFixed(3)} Y${(yMin - margenEntrada).toFixed(3)}`);
                        nc.push(`G01 Z${zActual.toFixed(3)} F${Math.round(F / 2)}`);
                    }
                }
            }
        }

        nc.push(`G00 Z${zSeguridad.toFixed(1)}`);
    }

    // F. Cierre
    nc.push("");
    nc.push("( --- FIN DE PROGRAMA --- )");
    nc.push("M05");
    nc.push("G91 G28 Z0.0");
    nc.push("G28 X0.0 Y0.0");
    nc.push("M30");
    nc.push("%");

    return nc.join("\n");
}

// 3. Lógica para Generar Escuadrado / Contorneado
function generarGCodeEscuadrado() {
    // A. Lectura de Parámetros Generales
    const ceroXY = document.getElementById("ceroXY").value;
    const S = document.getElementById("velocidad").value || "1200";
    const zSeguridad = parseFloat(document.getElementById("zSeguridad").value) || 10.0;
    const T = document.getElementById("numHerramienta").value || "1";
    const diametro = parseFloat(document.getElementById("diametroHerramienta").value) || 10.0;
    const radio = diametro / 2.0;

    // B. Lectura de Parámetros de Escuadrado
    const tipoPerfil = document.getElementById("tipoPerfil") ? document.getElementById("tipoPerfil").value : "exterior";
    const largoX = parseFloat(document.getElementById("largoX_esc").value) || 100.0;
    const anchoY = parseFloat(document.getElementById("anchoY_esc").value) || 80.0;
    const zProfundidadTotal = parseFloat(document.getElementById("zProfundidadTotal").value) || -15.0;
    const pasadaZ = parseFloat(document.getElementById("pasadaZ_esc").value) || 2.0;
    const radioEsquina = parseFloat(document.getElementById("radioEsquina")?.value) || 0.0;
    const ladosMecanizar = document.getElementById("ladosMecanizar").value; // "todos", "caras_y", "caras_x", "lado_x_pos", etc.
    const demasia = parseFloat(document.getElementById("demasiaLateral")?.value) || 0.0;
    const F = document.getElementById("avanceF_esc").value || "500";
    const estrategia = document.getElementById("estrategiaMecanizado")?.value || "niveles"; // "niveles" o "zonas"

    // C. Definición de Límites según Cero Pieza
    let xMin = 0, xMax = 0, yMin = 0, yMax = 0;
    switch (ceroXY) {
        case "centro":
            xMin = -largoX / 2.0; xMax = largoX / 2.0;
            yMin = -anchoY / 2.0; yMax = anchoY / 2.0;
            break;
        case "esquina_sup_izq":
            xMin = 0; xMax = largoX;
            yMin = -anchoY; yMax = 0;
            break;
        case "esquina_inf_der":
            xMin = -largoX; xMax = 0;
            yMin = 0; yMax = anchoY;
            break;
        case "esquina_sup_der":
            xMin = -largoX; xMax = 0;
            yMin = -anchoY; yMax = 0;
            break;
        case "esquina_inf_izq":
        default:
            xMin = 0; xMax = largoX;
            yMin = 0; yMax = anchoY;
            break;
    }

    // D. Offsets y Posiciones de Seguridad afuera del material
    const offset = (tipoPerfil === "exterior") ? (radio + demasia) : -(radio + demasia);
    const xMinT = xMin - offset;
    const xMaxT = xMax + offset;
    const yMinT = yMin - offset;
    const yMaxT = yMax + offset;

    // Distancia pasante para arrancar y terminar 100% afuera de la pieza
    const margenEntradaSalida = radio + 5.0; 
    const xMinPasante = xMin - margenEntradaSalida;
    const xMaxPasante = xMax + margenEntradaSalida;
    const yMinPasante = yMin - margenEntradaSalida;
    const yMaxPasante = yMax + margenEntradaSalida;

    // E. Encabezado Fanuc Corregido
    let nc = [];
    nc.push("%");
    nc.push("O0001 (ESCUADRADO Y FRENTEADO FANUC)");
    nc.push(`( HERRAMIENTA T${T} - DIA ${diametro}MM )`);
    nc.push("G21 G40 G80 G90 G54 G00");
    nc.push(`T${T} M06`);
    nc.push(`S${S} M03`);
    nc.push(`G43 H${T} Z${zSeguridad.toFixed(1)}`);
    nc.push("");

    // F. Generación de Lista de Profundidades (Z)
    const profAbs = Math.abs(zProfundidadTotal);
    const pasoZAbs = Math.abs(pasadaZ);
    let profsZ = [];
    let zAcum = 0.0;
    while (zAcum > -profAbs) {
        zAcum -= pasoZAbs;
        if (zAcum < -profAbs) zAcum = -profAbs;
        profsZ.push(zAcum);
    }

    // G. Funciones Auxiliares para Generar Trayectorias de Cada Operación
    function ejecutarCaraYInferior(zVal) {
        let lineas = [];
        lineas.push(`( LADO Y- / INFERIOR - Z = ${zVal.toFixed(3)} )`);
        lineas.push(`G00 X${xMinPasante.toFixed(3)} Y${yMinT.toFixed(3)}`);
        lineas.push(`G01 Z${zVal.toFixed(3)} F${Math.round(F / 2)}`);
        lineas.push(`G01 X${xMaxPasante.toFixed(3)} F${F}`);
        lineas.push(`G00 Z${zSeguridad.toFixed(1)}`);
        return lineas;
    }

    function ejecutarCaraYSuperior(zVal) {
        let lineas = [];
        lineas.push(`( LADO Y+ / SUPERIOR - Z = ${zVal.toFixed(3)} )`);
        lineas.push(`G00 X${xMaxPasante.toFixed(3)} Y${yMaxT.toFixed(3)}`);
        lineas.push(`G01 Z${zVal.toFixed(3)} F${Math.round(F / 2)}`);
        lineas.push(`G01 X${xMinPasante.toFixed(3)} F${F}`);
        lineas.push(`G00 Z${zSeguridad.toFixed(1)}`);
        return lineas;
    }

    function ejecutarCaraXIzquierda(zVal) {
        let lineas = [];
        lineas.push(`( LADO X- / IZQUIERDO - Z = ${zVal.toFixed(3)} )`);
        lineas.push(`G00 X${xMinT.toFixed(3)} Y${yMinPasante.toFixed(3)}`);
        lineas.push(`G01 Z${zVal.toFixed(3)} F${Math.round(F / 2)}`);
        lineas.push(`G01 Y${yMaxPasante.toFixed(3)} F${F}`);
        lineas.push(`G00 Z${zSeguridad.toFixed(1)}`);
        return lineas;
    }

    function ejecutarCaraXDerecha(zVal) {
        let lineas = [];
        lineas.push(`( LADO X+ / DERECHO - Z = ${zVal.toFixed(3)} )`);
        lineas.push(`G00 X${xMaxT.toFixed(3)} Y${yMaxPasante.toFixed(3)}`);
        lineas.push(`G01 Z${zVal.toFixed(3)} F${Math.round(F / 2)}`);
        lineas.push(`G01 Y${yMinPasante.toFixed(3)} F${F}`);
        lineas.push(`G00 Z${zSeguridad.toFixed(1)}`);
        return lineas;
    }

    function ejecutarContornoCompleto(zVal) {
        let lineas = [];
        lineas.push(`( CONTORNO COMPLETO - Z = ${zVal.toFixed(3)} )`);
        lineas.push(`G00 X${xMinT.toFixed(3)} Y${yMinPasante.toFixed(3)}`);
        lineas.push(`G01 Z${zVal.toFixed(3)} F${Math.round(F / 2)}`);

        if (radioEsquina > 0.0) {
            const rE = radioEsquina;
            lineas.push(`G01 Y${(yMaxT - rE).toFixed(3)} F${F}`);
            lineas.push(`G02 X${(xMinT + rE).toFixed(3)} Y${yMaxT.toFixed(3)} R${rE.toFixed(3)}`);
            lineas.push(`G01 X${(xMaxT - rE).toFixed(3)}`);
            lineas.push(`G02 X${xMaxT.toFixed(3)} Y${(yMaxT - rE).toFixed(3)} R${rE.toFixed(3)}`);
            lineas.push(`G01 Y${(yMinT + rE).toFixed(3)}`);
            lineas.push(`G02 X${(xMaxT - rE).toFixed(3)} Y${yMinT.toFixed(3)} R${rE.toFixed(3)}`);
            lineas.push(`G01 X${(xMinT + rE).toFixed(3)}`);
            lineas.push(`G02 X${xMinT.toFixed(3)} Y${(yMinT + rE).toFixed(3)} R${rE.toFixed(3)}`);
        } else {
            lineas.push(`G01 Y${yMaxT.toFixed(3)} F${F}`);
            lineas.push(`G01 X${xMaxT.toFixed(3)}`);
            lineas.push(`G01 Y${yMinT.toFixed(3)}`);
            lineas.push(`G01 X${xMinT.toFixed(3)}`);
        }
        lineas.push(`G00 Z${zSeguridad.toFixed(1)}`);
        return lineas;
    }

    // H. Ejecución de la Estrategia (Niveles vs Zonas)
    nc.push(`( --- ESTRATEGIA: ${estrategia.toUpperCase()} --- )`);

    if (estrategia === "niveles") {
        // En cada nivel Z, realiza las caras seleccionadas
        profsZ.forEach(zVal => {
            nc.push(`\n( === PASADA NIVELES Z = ${zVal.toFixed(3)} === )`);
            if (ladosMecanizar === "todos") nc.push(...ejecutarContornoCompleto(zVal));
            if (ladosMecanizar === "caras_y" || ladosMecanizar === "lado_y_neg") nc.push(...ejecutarCaraYInferior(zVal));
            if (ladosMecanizar === "caras_y" || ladosMecanizar === "lado_y_pos") nc.push(...ejecutarCaraYSuperior(zVal));
            if (ladosMecanizar === "caras_x" || ladosMecanizar === "lado_x_neg") nc.push(...ejecutarCaraXIzquierda(zVal));
            if (ladosMecanizar === "caras_x" || ladosMecanizar === "lado_x_pos") nc.push(...ejecutarCaraXDerecha(zVal));
        });
    } else {
        // Por Zonas: Realiza una cara completa hasta el fondo antes de ir a la siguiente
        nc.push(`\n( === ESTRATEGIA POR ZONAS === )`);
        if (ladosMecanizar === "todos") {
            profsZ.forEach(zVal => nc.push(...ejecutarContornoCompleto(zVal)));
        }
        if (ladosMecanizar === "caras_y" || ladosMecanizar === "lado_y_neg") {
            nc.push(`( --- ZONA: CARA Y- --- )`);
            profsZ.forEach(zVal => nc.push(...ejecutarCaraYInferior(zVal)));
        }
        if (ladosMecanizar === "caras_y" || ladosMecanizar === "lado_y_pos") {
            nc.push(`( --- ZONA: CARA Y+ --- )`);
            profsZ.forEach(zVal => nc.push(...ejecutarCaraYSuperior(zVal)));
        }
        if (ladosMecanizar === "caras_x" || ladosMecanizar === "lado_x_neg") {
            nc.push(`( --- ZONA: CARA X- --- )`);
            profsZ.forEach(zVal => nc.push(...ejecutarCaraXIzquierda(zVal)));
        }
        if (ladosMecanizar === "caras_x" || ladosMecanizar === "lado_x_pos") {
            nc.push(`( --- ZONA: CARA X+ --- )`);
            profsZ.forEach(zVal => nc.push(...ejecutarCaraXDerecha(zVal)));
        }
    }

    // I. Cierre del Programa Fanuc
    nc.push("");
    nc.push("( --- FIN DE PROGRAMA --- )");
    nc.push(`G00 Z${zSeguridad.toFixed(1)}`);
    nc.push("M05");
    nc.push("G91 G28 Z0.0");
    nc.push("G28 X0.0 Y0.0");
    nc.push("M30");
    nc.push("%");

    return nc.join("\n");
}