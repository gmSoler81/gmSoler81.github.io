// ==========================================
// 3. MOTOR MATEMÁTICO DE TRAYECTORIA CORREGIDO
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
    } else if (ceroXY === "esquina_sup_izq" || ceroXY === "esquina_sup_der") { // Contempla variantes superiores
        xMin = 0; xMax = anchoX;
        yMin = -largoY; yMax = 0;
    } else { // "esquina_inf_izq" o por defecto
        xMin = 0; xMax = anchoX;
        yMin = 0; yMax = largoY;
    }

    // 2. Distancia fija de aproximación de 5mm acordada
    const MARGEN_FIJO = 5.0; 
    const pasoLateral = diametroTool * 0.7; // Solape del 70%

    // 3. Cálculo de hilos/pasadas de corte según tu fórmula correcta
    let pasadas = []; 
    
    // Mapeo dinámico: "horizontal" o "paralelo_x" manejan la misma lógica
    if (direccionPlaneado === "horizontal" || direccionPlaneado === "paralelo_x") {
        // --- PLANEADO EN X (PASO LATERAL EN Y) ---
        const esSuperior = esquinaInicio.includes("sup") || esquinaInicio.includes("superior");
        
        // Aplicamos tu fórmula: Ymax - pasoLateral + (D/2) para el lado superior, o la inversa para el inferior
        const yPrimeraPasada = esSuperior 
            ? (yMax - pasoLateral + (diametroTool / 2)) 
            : (yMin + pasoLateral - (diametroTool / 2));
            
        const signoY = esSuperior ? -1 : 1;
        const numPasadas = Math.ceil(largoY / pasoLateral) || 1;
        
        const xStartLargo = xMin - MARGEN_FIJO - (diametroTool / 2);
        const xEndLargo = xMax + MARGEN_FIJO + (diametroTool / 2);

        for (let i = 0; i < numPasadas; i++) {
            let yPos = yPrimeraPasada + (signoY * i * pasoLateral);
            
            // La última pasada limpia el extremo opuesto exacto usando la misma lógica invertida
            if (i === numPasadas - 1 && numPasadas > 1) {
                yPos = esSuperior 
                    ? (yMin + pasoLateral - (diametroTool / 2)) 
                    : (yMax - pasoLateral + (diametroTool / 2));
            }

            let xIn = xStartLargo;
            let xOut = xEndLargo;
            
            // Si la estrategia es zigzag e impar, o convencional/climb pura, configuramos sentidos
            if ((estrategia === "zigzag" && i % 2 !== 0) || estrategia === "conventional") {
                xIn = xEndLargo;
                xOut = xStartLargo;
            }

            pasadas.push({ xIni: xIn, xFin: xOut, yVal: yPos, ejeLargo: "X" });
        }
    } else {
        // --- PLANEADO EN Y (PASO LATERAL EN X) ---
        const esDerecha = esquinaInicio.includes("der") || esquinaInicio.includes("derecha");
        
        // Aplicamos tu misma lógica corregida para el eje X
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

    // 4. Bucle de pasadas en profundidad Z
    let zActual = zInicial;
    const pasoZ = Math.abs(pasadaZ);

    while (zActual > zFinal) {
        zActual = Math.max(zActual - pasoZ, zFinal);
        lineas.push("");
        lineas.push(`(--- NIVEL DE PROFUNDIDAD Z = ${zActual.toFixed(3)} ---)`);

        pasadas.forEach((p, index) => {
            if (p.ejeLargo === "X") {
                if (index === 0 || estrategia !== "zigzag") {
                    lineas.push(`G00 X${p.xIni.toFixed(3)} Y${p.yVal.toFixed(3)}`);
                    lineas.push(`G01 Z${zActual.toFixed(3)} F${avanceF} (Penetración inicial)`);
                } else {
                    // En Zigzag el paso lateral fuera del bruto se hace en G01 para suavizar inercias
                    lineas.push(`G01 Y${p.yVal.toFixed(3)} F${avanceF} (Paso lateral de enlace)`);
                }
                lineas.push(`G01 X${p.xFin.toFixed(3)}`);
            } else {
                if (index === 0 || estrategia !== "zigzag") {
                    lineas.push(`G00 X${p.xVal.toFixed(3)} Y${p.yIni.toFixed(3)}`);
                    lineas.push(`G01 Z${zActual.toFixed(3)} F${avanceF}`);
                } else {
                    lineas.push(`G01 X${p.xVal.toFixed(3)} F${avanceF} (Paso lateral de enlace)`);
                }
                lineas.push(`G01 Y${p.yFin.toFixed(3)}`);
            }

            // Si es unidireccional, retrae al terminar cada pasada individual
            if (estrategia !== "zigzag" && index < pasadas.length - 1) {
                lineas.push("G00 Z10.0 (Retracción de seguridad para retorno)");
            }
        });

        // Despeje seguro al terminar todo el plano Z actual antes de evaluar el próximo
        if (zActual > zFinal) {
            lineas.push("G00 Z10.0 (Despeje de plano para reposicionar Z)");
        }
    }

    lineas.push("(--- FIN DE OPERACIÓN: PLANEADO ---)");
    return lineas;
}