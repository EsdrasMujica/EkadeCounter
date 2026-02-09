let faltasRegistradas = new Set();
let conteoGlobal = {};
let totalFaltasGlobal = 0;
let urlsProcesadas = new Set();

window.addEventListener('load', function() {
    setTimeout(iniciarProceso, 1000);
});

async function iniciarProceso() {
    mostrarBarra("Analizando y eliminando duplicados...", 0, true);

    // Analizar primera página (ya cargada)
    analizarDocumento(document);
    urlsProcesadas.add(window.location.href);

    // Si la paginación está basada en botones (nueva estética), navegamos haciendo click
    await procesarPaginacion();

    mostrarResultadoFinal();
}

async function leerPaginaExterna(url) {
    const res = await fetch(url);
    const text = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, 'text/html');
    analizarDocumento(doc);
}

function analizarDocumento(doc) {
    // Compatibilidad: si hay una tabla antigua
    const tabla = doc.querySelector('table.data-table');
    if (tabla) {
        const filas = tabla.querySelectorAll('tbody tr');
        let fechaActual = "FechaDesconocida";

        filas.forEach(fila => {
            const th = fila.querySelector('th');
            if (th && th.innerText.includes('/')) {
                fechaActual = th.innerText.trim();
            }

            const celdas = fila.querySelectorAll('td');
            if (celdas.length > 2) {
                const hora = celdas[0].innerText.trim();
                const materia = celdas[1].innerText.trim();
                const tipo = celdas[2].innerText.trim();

                if (tipo === "Falta sin justificar") {
                    const idUnico = `${fechaActual}-${hora}-${materia}`;

                    if (!faltasRegistradas.has(idUnico)) {
                        faltasRegistradas.add(idUnico);
                        totalFaltasGlobal++;
                        conteoGlobal[materia] = (conteoGlobal[materia] || 0) + 1;
                    }
                }
            }
        });
        return;
    }

    // Nueva estructura: tarjetas/listas
    const tarjetas = doc.querySelectorAll('.lista_card');
    if (!tarjetas || tarjetas.length === 0) return;

    tarjetas.forEach(card => {
        // Fecha de grupo (puede estar en el header h4)
        const fechaHeader = card.querySelector('.grupo-fecha-header h4');
        const fecha = fechaHeader ? fechaHeader.innerText.trim() : 'FechaDesconocida';

        // Cada item-container dentro de la card representa una falta (puede haber varios por fecha)
        const items = card.querySelectorAll('.item-container');
        items.forEach(item => {
            const horaEl = item.querySelector('.falta-hora');
            const hora = horaEl ? horaEl.innerText.trim() : '';

            const areaEl = item.querySelector('.AreaFalta');
            // AreaFalta contiene materia y código entre paréntesis, preferimos usar las siglas (PRO)
            let materia = '';
            if (areaEl) {
                const texto = areaEl.innerText.trim();
                // Extraer contenido entre paréntesis, si existe
                const codigoMatch = texto.match(/\(([^)]+)\)/);
                if (codigoMatch && codigoMatch[1]) {
                    materia = codigoMatch[1].trim(); // ej. 'PRO'
                } else {
                    // fallback: usar el nombre completo sin paréntesis
                    materia = texto.replace(/\(.*?\)/g, '').trim();
                }
            }

            const tipoEl = item.querySelector('.tipoFalta');
            const tipo = tipoEl ? tipoEl.innerText.trim() : '';

            if (tipo === 'Falta sin justificar') {
                const idUnico = `${fecha}-${hora}-${materia}`;
                if (!faltasRegistradas.has(idUnico)) {
                    faltasRegistradas.add(idUnico);
                    totalFaltasGlobal++;
                    conteoGlobal[materia] = (conteoGlobal[materia] || 0) + 1;
                }
            }
        });
    });
}

// Navegar la paginación que usa botones (Angular/JS) haciendo click en el botón "siguiente"
async function procesarPaginacion() {
    const pag = document.querySelector('.pagination');
    if (!pag) return;

    // Analizamos mientras exista un botón de avance habilitado
    while (true) {
        // Re-evaluamos el contenedor porque Angular puede recrearlo
        const pagination = document.querySelector('.pagination');
        if (!pagination) break;

        // Buscar botón '›' o '>' o '»' o con texto no numérico que represente siguiente
        const nextBtn = Array.from(pagination.querySelectorAll('button')).find(b => {
            const t = b.innerText.trim();
            return t === '›' || t === '>' || t === '»' || t === '>>';
        });

        if (!nextBtn || nextBtn.disabled) break;

        // Antes de click, guardamos el estado actual del contenedor de resultados para detectar cambio
        const container = document.querySelector('.lista_container') || document.querySelector('table.data-table');
        const oldHtml = container ? container.innerHTML : '';

        try {
            nextBtn.click();
        } catch (e) {
            // fallback: dispatch event
            nextBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        }

        // Esperar cambio en el DOM (o timeout)
        await waitForChange(container, oldHtml, 6000);

        // Analizar la nueva página
        analizarDocumento(document);
        // pequeña pausa para estabilizar
        await new Promise(r => setTimeout(r, 250));
    }
}

function waitForChange(el, oldHtml, timeout = 5000) {
    return new Promise(resolve => {
        if (!el) return setTimeout(resolve, 300);

        const observer = new MutationObserver(() => {
            if (el.innerHTML !== oldHtml) {
                observer.disconnect();
                resolve();
            }
        });
        observer.observe(el, { childList: true, subtree: true, characterData: true });
        setTimeout(() => {
            try { observer.disconnect(); } catch (e) {}
            resolve();
        }, timeout);
    });
}

function mostrarResultadoFinal() {
    let textoResumen = "";
    let asignaturas = Object.keys(conteoGlobal).sort();

    for (let asig of asignaturas) {
        textoResumen += `${asig}: ${conteoGlobal[asig]}  |  `;
    }

    mostrarBarra(textoResumen, totalFaltasGlobal, false);
}

function mostrarBarra(texto, total, cargando) {
    const id = 'barra-resumen-faltas';
    let div = document.getElementById(id);
    if (!div) {
        div = document.createElement('div');
        div.id = id;
        document.body.prepend(div);
    }

    div.style.position = 'fixed';
    div.style.top = '0';
    div.style.left = '0';
    div.style.width = '100%';
    div.style.padding = '15px';
    div.style.fontWeight = 'bold';
    div.style.fontSize = '18px';
    div.style.zIndex = '99999';
    div.style.textAlign = 'center';
    div.style.fontFamily = 'Arial, sans-serif';
    div.style.boxShadow = '0 4px 6px rgba(0,0,0,0.2)';

    // Estilo actualizado: color de acento menos agresivo, bordes redondeados
    div.style.borderRadius = '0 0 8px 8px';
    if (cargando) {
        div.style.backgroundColor = '#ffd54f';
        div.style.color = 'black';
        div.innerText = "⏳ " + texto;
    } else {
        div.style.backgroundColor = '#1565c0';
        div.style.color = 'white';
        div.innerHTML = `<span style="background:rgba(255,255,255,0.1); padding:5px 10px; border-radius:5px">TOTAL: ${total}</span>  ${texto}`;
    }
}