/** Motor geométrico: transformación G54 y validación de seguridad. */

/**
 * Límites del bloque respecto al cero pieza (G54). Posiciones 1-9 de la matriz:
 *  1 2 3 / 4 5 6 / 7 8 9. Equivale al switch del PRD: columna -> X, fila -> Y.
 */
function calcularLimitesG54(puntoG54, largo, ancho) {
  const col = (puntoG54 - 1) % 3, fila = Math.floor((puntoG54 - 1) / 3);
  const xIzquierda = [0, -largo / 2, -largo][col], xDerecha = xIzquierda + largo;
  const ySuperior = [0, ancho / 2, ancho][fila], yInferior = ySuperior - ancho;
  return {
    X_LimiteIzquierdo: xIzquierda, X_LimiteDerecho: xDerecha,
    Y_LimiteSuperior: ySuperior, Y_LimiteInferior: yInferior,
    X_Centro: (xIzquierda + xDerecha) / 2, Y_Centro: (ySuperior + yInferior) / 2
  };
}

/** Convierte el texto "x,y" por línea en puntos; devuelve también las líneas inválidas. */
function parsearPuntos(texto) {
  const pts = [], malas = [];
  (texto || '').split('\n').map(s => s.trim()).filter(Boolean).forEach(l => {
    const m = l.split(/[,;\s]+/).map(Number);
    if (m.length === 2 && m.every(Number.isFinite)) pts.push({ x: m[0], y: m[1] }); else malas.push(l);
  });
  return { pts, malas };
}

const MAX_PUNTOS_PERFORADO = 10000;

/** Validación de seguridad. Devuelve la lista de errores (vacía = se puede generar). */
function validarSeguridad(e) {
  if (!e.op) return ['Seleccione una operación para continuar.'];
  const err = [];
  const pos = (v, n) => {
    if (!(Number.isFinite(v) && v > 0)) err.push(`${n} debe ser mayor que 0.`);
    else if (v < 0.001) err.push(`${n} no puede ser menor que 0.001 para conservar la resolución del código G.`);
  };
  pos(e.largo, 'El largo X'); pos(e.ancho, 'El ancho Y');
  pos(e.diam, 'El diámetro de herramienta'); pos(e.rpm, 'Las RPM (S)');
  if (!Number.isInteger(e.rpm)) err.push('Las RPM (S) deben ser un número entero.');
  pos(e.avance, 'El avance plano (F)'); pos(e.avanceZ, 'El avance Z (Fz)'); pos(e.zPasada, 'La pasada en Z');
  if (!(e.margen >= 0)) err.push('El margen de seguridad no puede ser negativo.');
  if (!(e.zSeg >= 0.001 && e.zSeg - Math.max(e.zSobre ?? 0, 0) >= 0.001)) err.push('Z de seguridad debe conservar al menos 0.001 mm de separación sobre Z0 y el sobrematerial.');
  if (!(Number.isInteger(e.programa) && e.programa > 0)) err.push('El número de programa debe ser un entero positivo.');
  if (!(Number.isInteger(e.herr) && e.herr > 0)) err.push('El número de herramienta debe ser un entero positivo.');
  const D = e.diam, R = D / 2, d = e.demasia ?? 0;
  const difiere = (n, dim) => {  // a) diámetro >= cavidad, c) sobremedida sobrepasa la geometría
    if (D >= dim) err.push(`El diámetro de herramienta (${D}) es mayor o igual a ${n} (${dim}).`);
    else if (D + 2 * d >= dim) err.push(`La sobremedida XY (${d}) sobrepasa la geometría de ${n} (${dim}).`);
  };
  if (e.op === 'planeado') {
    if (!(e.zSobre > e.zAcabado)) err.push('Z sobrematerial debe ser mayor que Z acabado.');
    if (e.estrategia === 'circular') pos(e.diamCirc, 'El diámetro de la cara circular');
  } else if (e.op === 'exterior' || e.op === 'cavidad') {
    pos(e.prof, 'La profundidad total Z');
    if (!(d >= 0)) err.push('La sobremedida XY no puede ser negativa: invadiría la geometría final.');
  }
  if (e.op === 'exterior') {
    if (e.extTipo === 'circular') pos(e.diamPieza, 'El diámetro de la pieza');
    else if (!(e.caraArriba || e.caraAbajo || e.caraDerecha || e.caraIzquierda)) err.push('Seleccione al menos una cara.');
  }
  if (e.op === 'cavidad' && d >= 0) {
    if (e.cavTipo === 'rect') {
      pos(e.largoC, 'El largo de la cavidad'); pos(e.anchoC, 'El ancho de la cavidad');
      if (e.largoC > 0 && e.anchoC > 0) {
        difiere('la cavidad', Math.min(e.largoC, e.anchoC));
        if (e.entrada === 'pared') {
          if (!(e.distPared >= 0)) err.push('La distancia a la pared no puede ser negativa.');
          else if (e.distPared > e.largoC - 2 * (R + d)) err.push('El punto de entrada queda fuera del área de corte.');
        }
      }
    } else if (e.cavTipo === 'poligono') {
      pos(e.radioPol, 'El radio del polígono');
      if (!(Number.isInteger(e.lados) && e.lados >= 3)) err.push('El polígono necesita al menos 3 lados (entero).');
      else if (e.radioPol > 0) difiere('la cavidad (apotema)', +(2 * e.radioPol * Math.cos(Math.PI / e.lados)).toFixed(3));
    } else {
      pos(e.largoO, 'El largo del oblongo'); pos(e.anchoO, 'El ancho del oblongo');
      if (e.anchoO > 0) difiere('el ancho del oblongo', e.anchoO);
      if (e.largoO > 0 && e.anchoO > 0 && !(e.largoO > e.anchoO)) err.push('El largo del oblongo debe ser mayor que su ancho.');
    }
  }
  if (e.op === 'perforado') {
    pos(e.profAg, 'La profundidad del agujero');
    if (!(e.zR > (e.zSobre ?? 0) && e.zR <= e.zSeg)) err.push('El plano R debe estar por encima del sobrematerial y no superar Z de seguridad.');
    if (e.ciclo === 'G83') { pos(e.q, 'El picoteo Q'); if (e.q > e.profAg) err.push('El picoteo Q no puede superar la profundidad.'); }
    if (e.distrib === 'circular') {
      pos(e.diamPatron, 'El diámetro del patrón');
      if (!(Number.isInteger(e.cantidad) && e.cantidad >= 1)) err.push('La cantidad de agujeros debe ser un entero ≥ 1.');
      else if (e.cantidad > MAX_PUNTOS_PERFORADO) err.push(`La cantidad de agujeros no puede superar ${MAX_PUNTOS_PERFORADO}.`);
    } else {
      const { pts, malas } = parsearPuntos(e.puntos);
      if (malas.length) err.push(`Punto inválido: "${malas[0]}". Use el formato x,y.`);
      else if (!pts.length) err.push('Ingrese al menos un punto X,Y.');
      else if (pts.length > MAX_PUNTOS_PERFORADO) err.push(`La cantidad de puntos no puede superar ${MAX_PUNTOS_PERFORADO}.`);
    }
  }
  return err;
}