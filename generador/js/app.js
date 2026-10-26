/** Interfaz: eventos, campos dinámicos por operación, validación en vivo y salida. */

const POS_G54 = ['↖', '↑', '↗', '←', '●', '→', '↙', '↓', '↘'];
const $ = s => document.querySelector(s);
const reglas = new Map(); // expresión data-vis -> función compilada

/** Lee todos los campos [data-k] al Estado global. */
function leerCampos() {
  document.querySelectorAll('[data-k]').forEach(el => {
    const k = el.dataset.k;
    if (el.type === 'radio') { if (el.checked) Estado[k] = el.value; }
    else if (el.type === 'checkbox') Estado[k] = el.checked;
    else if (el.type === 'number') Estado[k] = el.value === '' ? null : parseFloat(el.value);
    else Estado[k] = el.value;
  });
}

/** Muestra solo los campos de la operación elegida (atributo data-vis). */
function actualizarVisibilidad() {
  document.querySelectorAll('[data-vis]').forEach(el => {
    const ex = el.dataset.vis;
    if (!reglas.has(ex)) reglas.set(ex, new Function('e', `return !!(${ex})`));
    el.hidden = !reglas.get(ex)(Estado);
  });
}

function actualizar() {
  leerCampos();
  actualizarVisibilidad();
  const errores = validarSeguridad(Estado);
  $('#errores').replaceChildren(...errores.map(m => {
    const li = document.createElement('li');
    li.textContent = m;
    return li;
  }));
  $('#btnGenerar').disabled = errores.length > 0;
  return errores;
}

function invalidarSalida() {
  $('#salida').textContent = 'Los parámetros cambiaron. Genere nuevamente el código G.';
  $('#btnCopiar').disabled = $('#btnDescargar').disabled = true;
}

function construirMatriz() {
  const m = $('#matriz');
  POS_G54.forEach((sim, i) => {
    const b = document.createElement('button');
    b.type = 'button'; b.textContent = sim; b.title = `G54 posición ${i + 1}`;
    b.setAttribute('aria-pressed', i + 1 === Estado.g54);
    b.addEventListener('click', () => {
      Estado.g54 = i + 1;
      m.querySelectorAll('button').forEach((x, j) => x.setAttribute('aria-pressed', j === i));
      invalidarSalida();
      actualizar();
    });
    m.appendChild(b);
  });
}

function generar() {
  if (actualizar().length) return; // bloqueo de seguridad: nunca se genera con errores
  try {
    $('#salida').textContent = generarPrograma(Estado);
  } catch (error) {
    if (!(error instanceof LimiteProgramaError)) throw error;
    const li = document.createElement('li');
    li.textContent = error.message;
    $('#errores').replaceChildren(li);
    $('#btnGenerar').disabled = true;
    invalidarSalida();
    return;
  }
  $('#btnCopiar').disabled = $('#btnDescargar').disabled = false;
}

async function copiar() {
  const t = $('#salida').textContent;
  try { await navigator.clipboard.writeText(t); $('#btnCopiar').textContent = 'Copiado'; }
  catch { const r = document.createRange(); r.selectNodeContents($('#salida')); getSelection().removeAllRanges(); getSelection().addRange(r); }
  setTimeout(() => ($('#btnCopiar').textContent = 'Copiar'), 1500);
}

function descargar() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([$('#salida').textContent], { type: 'text/plain' }));
  a.download = `O${Estado.programa}.NC`; a.click(); URL.revokeObjectURL(a.href);
}

construirMatriz();
document.addEventListener('input', () => { invalidarSalida(); actualizar(); });
document.addEventListener('change', () => { invalidarSalida(); actualizar(); });
$('#btnGenerar').addEventListener('click', generar);
$('#btnCopiar').addEventListener('click', copiar);
$('#btnDescargar').addEventListener('click', descargar);
actualizar();