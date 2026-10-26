/** Generador de código G Fanuc: formateo de bloques y estrategias del PRD. */

const EPS = 1e-9;
const MAX_BLOQUES_PROGRAMA = 100000;
/** Sentido del oblongo: el PRD usa G02 (horario). Cambiar a false para G03 (antihorario). */
const OBLONGA_HORARIA = true;
/** Plano de aproximación lógico: mm sobre el último nivel mecanizado (nunca por encima de Z de seguridad). */
const Z_ESCALON = 1;

class LimiteProgramaError extends Error {}

/** Número Fanuc: siempre con punto decimal, hasta 3 decimales, sin ceros sobrantes. */
function fmt(n) {
  const s = (+n).toFixed(3).replace(/0+$/, '');
  return parseFloat(s) === 0 ? '0.' : s;
}

/** Acumulador de bloques con helpers G0/G1/G2-G3. */
function nuevoPrograma() {
  const l = [];
  const agregar = bloque => {
    if (l.length >= MAX_BLOQUES_PROGRAMA) throw new LimiteProgramaError(`El programa supera ${MAX_BLOQUES_PROGRAMA} bloques. Reduzca las pasadas o divídalo en programas.`);
    l.push(bloque);
  };
  const ax = o => Object.entries(o).map(([k, v]) => k + fmt(v)).join(' ');
  const f = v => (v ? ' F' + fmt(v) : '');
  return {
    l,
    g0: o => agregar('G0 ' + ax(o)),
    g1: (o, fe) => agregar('G1 ' + ax(o) + f(fe)),
    arco: (horario, o, fe) => agregar((horario ? 'G2 ' : 'G3 ') + ax(o) + f(fe)),
    raw: t => agregar(t)
  };
}

/** Recorre profundidades de z0 a zf con pasada fija. cb(z, zNivelPrevio, esPrimero). */
function niveles(z0, zf, paso, cb) {
  let z = z0, primero = true;
  while (z - zf > EPS) {
    const zPrev = z;
    z -= paso; if (z < zf) z = zf;
    cb(z, zPrev, primero); primero = false;
  }
}

/**
 * Descenso controlado al siguiente nivel, sin subir al plano de seguridad:
 * sube solo hasta 1 mm sobre el nivel previo, se posiciona (si hace falta) y entra a Z con avance.
 * En el primer nivel la máquina ya está en Z seguridad sobre el punto de inicio.
 */
function descenso(p, e, zPrev, z, primero, xy, fz) {
  const za = Math.min(e.zSeg, zPrev + Z_ESCALON);
  if (!primero || za < e.zSeg - EPS) p.g0({ Z: za });
  if (!primero && xy) p.g0(xy);
  p.g1({ Z: z }, fz ?? e.avanceZ);
}

/* ---------- OPERACIÓN 1: PLANEADO ---------- */

function planeadoDirecto(p, c) { // 1.1 a favor del corte
  const { e, L, R, pasada, m } = c;
  const xi = L.X_LimiteIzquierdo - R - m, xf = L.X_LimiteDerecho + R + m;
  const yIni = L.Y_LimiteSuperior - m, yFin = L.Y_LimiteInferior + m, yc = (yIni + yFin) / 2;
  niveles(e.zSobre, e.zAcabado, e.zPasada, (z, zPrev, primero) => {
    let a = yIni, b = yFin;
    // La herramienta queda fuera del bloque en X: se reposiciona en Y sin subir
    if (primero) descenso(p, e, zPrev, z, true);
    else { p.g0({ Y: a }); p.g1({ Z: z }, e.avanceZ); }
    while (a >= yc - EPS && b <= yc + EPS) {
      p.g0({ Y: a }); p.g1({ X: xf }, e.avance);
      p.g0({ Y: b }); p.g1({ X: xi });
      a -= pasada; b += pasada;
    }
  });
  return { x: xi, y: yIni };
}

function planeadoZigzag(p, c) { // 1.2
  const { e, L, R, pasada, m } = c;
  const xi = L.X_LimiteIzquierdo - R - m, xf = L.X_LimiteDerecho + R + m;
  const yIni = L.Y_LimiteSuperior + R - pasada, yFin = L.Y_LimiteInferior - R + pasada;
  let xAct = xi, xOtro = xf; // lado donde está la herramienta / lado opuesto
  niveles(e.zSobre, e.zAcabado, e.zPasada, (z, zPrev, primero) => {
    let y = yIni;
    if (primero) descenso(p, e, zPrev, z, true);
    else { p.g0({ Y: y }); p.g1({ Z: z }, e.avanceZ); } // arranca desde el lado donde terminó
    while (y >= yFin - EPS) {
      p.g1({ X: xOtro }, e.avance); [xAct, xOtro] = [xOtro, xAct]; y -= pasada;
      if (y >= yFin - EPS) p.g0({ Y: y }); else break;
    }
  });
  return { x: xi, y: yIni };
}

function planeadoCircular(p, c) { // 1.5
  const { e, R, pasada, cx, cy } = c;
  const rMax = e.diamCirc / 2 + R + e.margen;
  const fz = e.agujero ? e.avance : e.avance * 0.25; // sin agujero central: entrada lenta
  niveles(e.zSobre, e.zAcabado, e.zPasada, (z, zPrev, primero) => {
    descenso(p, e, zPrev, z, primero, { X: cx, Y: cy }, fz);
    for (let r = pasada; r <= rMax + EPS; r += pasada) {
      p.g1({ X: cx + r, Y: cy }, e.avance);
      p.arco(true, { X: cx + r, Y: cy, I: -r, J: 0 }); // centro = (cx, cy): I = -r desde el punto de inicio
    }
  });
  return { x: cx, y: cy };
}

/* ---------- OPERACIÓN 2: FRESADO EXTERIOR ---------- */

function exteriorLateral(p, c) { // 2.1 encadenado en sentido horario (concordancia)
  const { e, L, R, m } = c, d = e.demasia;
  const xi = L.X_LimiteIzquierdo, xd = L.X_LimiteDerecho, ys = L.Y_LimiteSuperior, yi = L.Y_LimiteInferior;
  // Orden perimetral: cada cara termina junto al inicio de la siguiente (fuera de la pieza)
  const caras = [
    [e.caraArriba, { X: xi - R - m, Y: ys + R + d }, { X: xd + R + m }],
    [e.caraDerecha, { X: xd + R + d, Y: ys + R + m }, { Y: yi - R - m }],
    [e.caraAbajo, { X: xd + R + m, Y: yi - R - d }, { X: xi - R - m }],
    [e.caraIzquierda, { X: xi - R - d, Y: yi - R - m }, { Y: ys + R + m }]
  ].map(([sel, ini, fin], i) => ({ i, sel, ini, fin })).filter(f => f.sel);
  let prev = null, zAct = 0;
  niveles(0, -e.prof, e.zPasada, (z, zPrev, primero) => caras.forEach(f => {
    if (prev === null) descenso(p, e, zPrev, z, true);
    else if ((prev + 1) % 4 === f.i) { // cara contigua: pasa directo, solo baja si cambió el nivel
      if (zAct - z > EPS) p.g1({ Z: z }, e.avanceZ);
      p.g1(f.ini, e.avance);
    } else if (prev === f.i) descenso(p, e, zAct, z, false, f.ini); // vuelve por su propia línea de corte
    else { // salto que cruzaría la pieza: única retracción a Z seguridad
      p.g0({ Z: e.zSeg }); p.g0(f.ini);
      const za = Math.min(e.zSeg, zPrev + Z_ESCALON);
      if (za < e.zSeg - EPS) p.g0({ Z: za });
      p.g1({ Z: z }, e.avanceZ);
    }
    zAct = z; p.g1(f.fin, e.avance); prev = f.i;
  }));
  return { x: caras[0].ini.X, y: caras[0].ini.Y };
}

function exteriorCircular(p, c) { // 2.3 pasadas encadenadas, bajando en el mismo punto (en el aire)
  const { e, R, cx, cy } = c;
  const rc = e.diamPieza / 2 + R + e.demasia;
  niveles(0, -e.prof, e.zPasada, (z, zPrev, primero) => {
    if (primero) descenso(p, e, zPrev, z, true); else p.g1({ Z: z }, e.avanceZ);
    p.arco(true, { X: cx + rc, Y: cy, I: -rc, J: 0 }, e.avance);
  });
  return { x: cx + rc, y: cy };
}

/* ---------- OPERACIÓN 4: CAVIDADES ---------- */
/* e.cavCentro === 'vacio': el centro ya está removido -> solo contorno de la pared. */

function cavidadRect(p, c) { // 4.1
  const { e, R, pasada, cx, cy } = c, d = e.demasia, vacio = e.cavCentro === 'vacio';
  const x0 = cx - e.largoC / 2 + R + d, x1 = cx + e.largoC / 2 - R - d;
  const y0 = cy - e.anchoC / 2 + R + d, y1 = cy + e.anchoC / 2 - R - d;
  const xe = e.entrada === 'pared' ? cx - e.largoC / 2 + e.distPared + R + d : cx, ye = cy;
  niveles(0, -e.prof, e.zPasada, (z, zPrev, primero) => {
    descenso(p, e, zPrev, z, primero, { X: xe, Y: ye });
    let px = pasada, py = pasada;
    while (!vacio && (xe - px > x0 + EPS || xe + px < x1 - EPS)) {
      const xl = Math.max(xe - px, x0), xr = Math.min(xe + px, x1);
      const yl = Math.max(ye - py, y0), yh = Math.min(ye + py, y1);
      p.g1({ X: xr, Y: ye }, e.avance); p.g1({ X: xr, Y: yh }); p.g1({ X: xl, Y: yh });
      p.g1({ X: xl, Y: yl }); p.g1({ X: xr, Y: yl }); p.g1({ X: xr, Y: ye });
      px += pasada; py += pasada;
    }
    p.g1({ X: x1, Y: y1 }, e.avance); p.g1({ X: x0, Y: y1 }); p.g1({ X: x0, Y: y0 });
    p.g1({ X: x1, Y: y0 }); p.g1({ X: x1, Y: y1 }); // perfilado final
  });
  return { x: xe, y: ye };
}

function cavidadPoligono(p, c) { // 4.2 (corrección por apotema)
  const { e, R, pasada, cx, cy } = c, n = e.lados, vacio = e.cavCentro === 'vacio';
  const apotema = e.radioPol * Math.cos(Math.PI / n) - R - e.demasia;
  const rEf = apotema / Math.cos(Math.PI / n);
  const anillo = r => {
    for (let i = 0; i <= n; i++) {
      const a = i * 2 * Math.PI / n;
      p.g1({ X: cx + r * Math.cos(a), Y: cy + r * Math.sin(a) }, i === 0 ? e.avance : 0);
    }
  };
  niveles(0, -e.prof, e.zPasada, (z, zPrev, primero) => {
    descenso(p, e, zPrev, z, primero, { X: cx, Y: cy });
    if (vacio) { anillo(rEf); return; }
    let r = pasada;
    for (; r <= rEf + EPS; r += pasada) anillo(r);
    if (r - pasada < rEf - EPS) anillo(rEf); // anillo final a la pared
  });
  return { x: cx, y: cy };
}

function cavidadOblonga(p, c) { // 4.3
  const { e, R, pasada, cx, cy } = c, vacio = e.cavCentro === 'vacio';
  const rc = e.anchoO / 2 - R - e.demasia;
  const cI = cx - e.largoO / 2 + e.anchoO / 2, cD = cx + e.largoO / 2 - e.anchoO / 2;
  const s = OBLONGA_HORARIA ? 1 : -1;
  const vuelta = a => {
    p.g1({ X: cD, Y: cy + s * a }, e.avance);
    p.arco(s > 0, { X: cD, Y: cy - s * a, I: 0, J: -s * a }); // centro del casquete = (cD, cy)
    p.g1({ X: cI, Y: cy - s * a });
    p.arco(s > 0, { X: cI, Y: cy + s * a, I: 0, J: s * a });  // centro del casquete = (cI, cy)
  };
  niveles(0, -e.prof, e.zPasada, (z, zPrev, primero) => {
    descenso(p, e, zPrev, z, primero, { X: cx, Y: cy });
    if (!vacio) for (let a = pasada; a <= rc + EPS; a += pasada) vuelta(a);
    vuelta(rc); p.g1({ X: cD, Y: cy + s * rc }); // perfilado final
  });
  return { x: cx, y: cy };
}

/* ---------- OPERACIÓN 5: PERFORADO (G81 / G83) ---------- */

function perforado(p, c) {
  const { e, cx, cy } = c;
  let pts = [];
  if (e.distrib === 'circular') {
    const rp = e.diamPatron / 2, paso = 360 / e.cantidad;
    for (let i = 0; i < e.cantidad; i++) {
      const a = (e.angIni + i * paso) * Math.PI / 180;
      pts.push({ x: cx + rp * Math.cos(a), y: cy + rp * Math.sin(a) });
    }
  } else pts = parsearPuntos(e.puntos).pts;
  const q = e.ciclo === 'G83' ? ' Q' + fmt(e.q) : '';
  // La máquina ya está sobre el primer punto (encabezado) en Z de seguridad
  p.raw(`G98 ${e.ciclo} X${fmt(pts[0].x)} Y${fmt(pts[0].y)} Z${fmt(-e.profAg)} R${fmt(e.zR)}${q} F${fmt(e.avanceZ)}`);
  // Con el ciclo activo, los demás puntos van SIN G0 (G00 cancelaría el ciclo en Fanuc)
  pts.slice(1).forEach(pt => p.raw(`X${fmt(pt.x)} Y${fmt(pt.y)}`));
  p.raw('G80');
  return pts[0];
}

/* ---------- Programa completo ---------- */

function generarPrograma(e) {
  const L = calcularLimitesG54(e.g54, e.largo, e.ancho);
  const c = {
    e, L, R: e.diam / 2, pasada: e.diam * 0.7, m: e.margen,
    cx: e.cx ?? L.X_Centro, cy: e.cy ?? L.Y_Centro
  };
  const p = nuevoPrograma();
  let ini;
  if (e.op === 'planeado') ini = { directo: planeadoDirecto, zigzag: planeadoZigzag, circular: planeadoCircular }[e.estrategia](p, c);
  else if (e.op === 'exterior') ini = (e.extTipo === 'circular' ? exteriorCircular : exteriorLateral)(p, c);
  else if (e.op === 'cavidad') ini = { rect: cavidadRect, poligono: cavidadPoligono, oblonga: cavidadOblonga }[e.cavTipo](p, c);
  else ini = perforado(p, c);

  const cab = [
    '%', `O${e.programa} (GM-MILL FANUC)`,
    `(HERRAMIENTA: ${e.op === 'perforado' ? 'BROCA' : 'FRESA'} DIA ${fmt(e.diam)})`,
    'G17 G21 G40 G49 G80 G90 G94 G54', 'G91 G28 Z0.', 'G90', `T${e.herr} M06`,
    `G00 X${fmt(ini.x)} Y${fmt(ini.y)} S${Math.round(e.rpm)} M03`,
    `G43 H${e.herr} Z${fmt(e.zSeg + 20)}`, `G00 Z${fmt(e.zSeg)} M08`
  ];
  // Única retracción al plano de seguridad: las operaciones ya no la repiten
  const pie = [`G00 Z${fmt(e.zSeg)} M09`, 'G91 G28 Z0. M05', 'G28 Y0.', 'M30', '%'];
  return [...cab, ...p.l, ...pie].join('\n');
}