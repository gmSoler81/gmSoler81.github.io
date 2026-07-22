// ==========================================
// 1. CONTROL DE INTERFAZ (MOSTRAR/OCULTAR)
// ==========================================
window.mostrarCamposOperacion = function() {
    const operacion = document.getElementById("operacion").value;
    
    document.getElementById("seccion-parametros").style.display = "block";
    document.getElementById("campos-planeado").style.display = "none";
    document.getElementById("campos-escuadrado").style.display = "none";
    document.getElementById("campos-perforar").style.display = "none";
    
    if (operacion === "planeado") {
        document.getElementById("campos-planeado").style.display = "block";
    } else if (operacion === "escuadrado") {
        document.getElementById("campos-escuadrado").style.display = "block";
    } else if (operacion === "perforar") {
        document.getElementById("campos-perforar").style.display = "block";
    }
};

// ==========================================
// 2. GENERADOR DE ESTRUCTURA BASE (FANUC)
// ==========================================
window.generarEstructuraBase = function() {
    const rpm = document.getElementById("velocidad").value || 1200;
    const ceroXY = document.getElementById("ceroXY").value;
    const tipoHerramienta = document.getElementById("tipoHerramienta").value;
    const diametroTool = parseFloat(document.getElementById("diametroHerramienta").value) || 10;
    const numTool = parseInt(document.getElementById("numHerramienta").value) || 1; 
    const operacion = document.getElementById("operacion").value;

    let lineasGCode = [];
    
    // ENCABEZADO ESTÁNDAR FANUC
    lineasGCode.push("%"); 
    lineasGCode.push(`O0001 (PROGRAMA GENERADO - PLANEADO)`);
    lineasGCode.push(`(CERO XY: ${ceroXY.replace(/_/g, ' ').toUpperCase()})`);
    lineasGCode.push(`(HERRAMIENTA: ${tipoHerramienta.replace(/_/g, ' ').toUpperCase()} D=${diametroTool}mm)`);
    lineasGCode.push("");
    
    lineasGCode.push("G21 G40 G49 G80 G90 G54 (Seguridad: mm, absolutas, origen G54)");
    lineasGCode.push("G91 G28 Z0.0 (Retorno al home de Z de la máquina)");
    lineasGCode.push("");
    
    lineasGCode.push(`T${numTool} M06 (Llamado de herramienta)`);
    lineasGCode.push(`M03 S${rpm} (Arranca husillo)`);
    lineasGCode.push("G04 P2000 (Pausa de seguridad de 2 segundos)");
    lineasGCode.push("");
    
    lineasGCode.push(`G90 G43 H${numTool} Z50.0 (Activa compensación de altura en Z50 seguro)`);
    lineasGCode.push(""); 

    // EVALUACIÓN DE LA OPERACIÓN SELECCIONADA
    if (operacion === "planeado") {
        const datosPlaneado = {
            anchoX: parseFloat(document.getElementById("anchoX").value) || 0,
            largoY: parseFloat(document.getElementById("largoY").value) || 0,
            zInicial: parseFloat(document.getElementById("zInicial").value) || 0,
            zFinal: parseFloat(document.getElementById("zFinal").value) || 0,
            pasadaZ: parseFloat(document.getElementById("pasadaZ").value) || 1,
            avanceF: parseFloat(document.getElementById("avanceF").value) || 500,
            direccionPlaneado: document.getElementById("direccionPlaneado").value,
            estrategia: document.getElementById("estrategia").value,
            esquinaInicio: document.getElementById("esquinaInicio").value,
            ceroXY,
            diametroTool
        };

        const codigoOperacion = window.calcularPlaneado(datosPlaneado);
        lineasGCode = lineasGCode.concat(codigoOperacion);
    } else {
        lineasGCode.push(`(Operación [${operacion.toUpperCase()}] en desarrollo...)`);
    }

    // FIN DE PROGRAMA ESTÁNDAR FANUC
    lineasGCode.push(""); 
    lineasGCode.push("G00 Z50.0 M09 (Retracción de seguridad y apaga refrigerante)");
    //lineasGCode.push("G91 G28 Z0.0 (Home de Z de la máquina)");
    lineasGCode.push("M05 (Apaga husillo)");
    lineasGCode.push("M30 (Fin de programa)");
    lineasGCode.push("%"); 

    document.getElementById("consola").value = lineasGCode.join("\n");
};

// ==========================================
// 3. MOTOR MATEMÁTICO DE TRAYECTORIA REAL
// ==========================================
window.calcularPlaneado = function(datos) {
    const {
        anchoX, largoY, zInicial, zFinal, pasadaZ, avanceF,
        direccionPlaneado, estrategia, esquinaInicio, ceroXY, diametroTool
    } = datos;

    let lineas = [];
    lineas.push("(--- INICIO DE OPERACIÓN: PLANEADO OPTIMIZADO REAL ---)");

    // 1. Límites físicos del material según el Cero XY
    let xMin, xMax, yMin, yMax;
    if (ceroXY === "centro") {
        xMin = -(anchoX / 2); xMax = anchoX / 2;
        yMin = -(largoY / 2); yMax = largoY / 2;
    } else if (ceroXY === "esquina_sup_izq" || ceroXY === "esquina_sup_der") {
        xMin = 0; xMax = anchoX;
        yMin = -largoY; yMax = 0;
    } else { 
        xMin = 0; xMax = anchoX;
        yMin = 0; yMax = largoY;
    }

    const MARGEN_FIJO = 5.0; 
    const pasoLateral = diametroTool * 0.7; // Solape del 70%
    let pasadas = []; 
    
    // 2. Cálculo del trazado de pasadas en el plano XY
    if (direccionPlaneado === "horizontal" || direccionPlaneado === "paralelo_x") {
        // --- PLANEADO EN X (PASO LATERAL EN Y) ---
        const esSuperior = esquinaInicio.includes("sup") || esquinaInicio.includes("superior");
        
        const yPrimeraPasada = esSuperior 
            ? (yMax - pasoLateral + (diametroTool / 2)) 
            : (yMin + pasoLateral - (diametroTool / 2));
            
        const signoY = esSuperior ? -1 : 1;
        const numPasadas = Math.ceil(largoY / pasoLateral) || 1;
        
        const xStartLargo = xMin - MARGEN_FIJO - (diametroTool / 2);
        const xEndLargo = xMax + MARGEN_FIJO + (diametroTool / 2);

        for (let i = 0; i < numPasadas; i++) {
            let yPos = yPrimeraPasada + (signoY * i * pasoLateral);
            
            if (i === numPasadas - 1 && numPasadas > 1) {
                yPos = esSuperior 
                    ? (yMin + pasoLateral - (diametroTool / 2)) 
                    : (yMax - pasoLateral + (diametroTool / 2));
            }

            let xIn = xStartLargo;
            let xOut = xEndLargo;
            
            if ((estrategia === "zigzag" && i % 2 !== 0) || estrategia === "conventional") {
                xIn = xEndLargo;
                xOut = xStartLargo;
            }

            pasadas.push({ xIni: xIn, xFin: xOut, yVal: yPos, ejeLargo: "X" });
        }
    } else {
        // --- PLANEADO EN Y (PASO LATERAL EN X) ---
        const esDerecha = esquinaInicio.includes("der") || esquinaInicio.includes("derecha");
        
        const xPrimeraPasada = esDerecha 
            ? (xMax - pasoLateral + (diametroTool / 2)) 
            : (xMin + pasoLateral - (diametroTool / 2));
            
        const signoX = esDerecha ? -1 : 1;
        const numPasadas = Math.ceil(anchoX / pasoLateral) || 1;
        
        const yStartLargo = yMin - MARGEN_FIJO - (diametroTool / 2);
        const yEndLargo = yMax + MARGEN_FIJO + (diametroTool / 2);

        for (let i = 0; i < numPasadas; i++) {
            let xPos = xPrimeraPasada + (signoX * i * pasoLateral);
            
            if (i === numPasadas - 1 && numPasadas > 1) {
                xPos = esDerecha 
                    ? (xMin + pasoLateral - (diametroTool / 2)) 
                    : (xMax - pasoLateral + (diametroTool / 2));
            }

            let yIn = yStartLargo;
            let yOut = yEndLargo;
            
            if ((estrategia === "zigzag" && i % 2 !== 0) || estrategia === "conventional") {
                yIn = yEndLargo;
                yOut = yStartLargo;
            }

            pasadas.push({ yIni: yIn, yFin: yOut, xVal: xPos, ejeLargo: "Y" });
        }
    }

    // 3. Cálculo de los niveles de profundidad en Z
    const sobreMaterialTotal = Math.max(0, zInicial - zFinal);
    let profundidades = [];

    if (sobreMaterialTotal > 0 && pasadaZ > 0) {
        let profundidadAcumulada = 0;
        while (profundidadAcumulada < sobreMaterialTotal) {
            let siguientePasada = pasadaZ;
            if (profundidadAcumulada + siguientePasada > sobreMaterialTotal) {
                siguientePasada = sobreMaterialTotal - profundidadAcumulada;
            }
            profundidades.push(siguientePasada);
            profundidadAcumulada += siguientePasada;
        }
    } else {
        profundidades.push(0); // Pasada única si Z inicial y final son iguales
    }

    // 4. Bucle principal de profundidad (Z) y generación de código G
    let zActual = zInicial;
    const zSeguridad = Math.max(zInicial + 5.0, 10.0); // Retracción adaptada al bruto

    for (let iZ = 0; iZ < profundidades.length; iZ++) {
        const profCorte = profundidades[iZ];
        zActual -= profCorte;

        lineas.push(`(--- NIVEL DE PROFUNDIDAD Z = ${zActual.toFixed(3)} ---)`);

        pasadas.forEach((p, index) => {
            if (p.ejeLargo === "X") {
                if (index === 0) {
                    // Posicionamiento de inicio de capa
                    lineas.push(`G00 X${p.xIni.toFixed(3)} Y${p.yVal.toFixed(3)}`);
                    lineas.push(`G01 Z${zActual.toFixed(3)} F${avanceF} (Penetración inicial)`);
                } else if (estrategia === "zigzag") {
                    // Paso lateral en Y en rápido (fresa libre en el aire)
                    lineas.push(`G00 Y${p.yVal.toFixed(3)} (Paso lateral libre en Y)`);
                } else {
                    // Retorno para Unidireccional
                    lineas.push(`G00 X${p.xIni.toFixed(3)} Y${p.yVal.toFixed(3)}`);
                    lineas.push(`G01 Z${zActual.toFixed(3)} F${avanceF}`);
                }

                // Pasada principal de mecanizado
                lineas.push(`G01 X${p.xFin.toFixed(3)} F${avanceF}`);

            } else {
                // Lógica para planeado a lo largo del eje Y
                if (index === 0) {
                    lineas.push(`G00 X${p.xVal.toFixed(3)} Y${p.yIni.toFixed(3)}`);
                    lineas.push(`G01 Z${zActual.toFixed(3)} F${avanceF} (Penetración inicial)`);
                } else if (estrategia === "zigzag") {
                    lineas.push(`G00 X${p.xVal.toFixed(3)} (Paso lateral libre en X)`);
                } else {
                    lineas.push(`G00 X${p.xVal.toFixed(3)} Y${p.yIni.toFixed(3)}`);
                    lineas.push(`G01 Z${zActual.toFixed(3)} F${avanceF}`);
                }

                lineas.push(`G01 Y${p.yFin.toFixed(3)} F${avanceF}`);
            }

            // Retracción entre pasadas en modo Unidireccional
            if (estrategia !== "zigzag" && index < pasadas.length - 1) {
                lineas.push(`G00 Z${zSeguridad.toFixed(3)} (Retracción para retorno en vacío)`);
            }
        });

        // Despeje de Z al terminar una capa completa si quedan más capas
        if (iZ < profundidades.length - 1) {
            lineas.push(`G00 Z${zSeguridad.toFixed(3)} (Despeje para reposicionar Z)`);
        }
    }

    lineas.push("(--- FIN DE OPERACIÓN: PLANEADO ---)");
    return lineas;
};