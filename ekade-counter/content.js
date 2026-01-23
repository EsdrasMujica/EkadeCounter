let faltasRegistradas = new Set();
let conteoGlobal = {};
let totalFaltasGlobal = 0;
let urlsProcesadas = new Set();

window.addEventListener('load', function() {
    setTimeout(iniciarProceso, 1000);
});

async function iniciarProceso() {
    mostrarBarra("Analizando y eliminando duplicados...", 0, true);

    analizarDocumento(document);
    urlsProcesadas.add(window.location.href);

    let enlaces = document.querySelectorAll('.pagination a');
    let urlsAVisitar = [];

    enlaces.forEach(link => {
        let url = link.href;
        if (url && !url.includes('javascript') && !url.includes('#')) {
            urlsAVisitar.push(url);
        }
    });

    let urlsUnicas = [...new Set(urlsAVisitar)];

    for (let url of urlsUnicas) {
        if (!urlsProcesadas.has(url)) {
            try {
                urlsProcesadas.add(url); // Marcamos como vista
                await leerPaginaExterna(url);
            } catch (e) {
                console.log("Salto página o error:", url);
            }
        }
    }

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
    const tabla = doc.querySelector('table.data-table');
    if (!tabla) return;

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
                    faltasRegistradas.add(idUnico); // La registramos
                    
                    totalFaltasGlobal++;
                    
                    if (conteoGlobal[materia]) {
                        conteoGlobal[materia]++;
                    } else {
                        conteoGlobal[materia] = 1;
                    }
                }
            }
        }
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

    if (cargando) {
        div.style.backgroundColor = '#f1c40f';
        div.style.color = 'black';
        div.innerText = "⏳ " + texto;
    } else {
        div.style.backgroundColor = '#d32f2f';
        div.style.color = 'white';
        div.innerHTML = `<span style="background:rgba(0,0,0,0.2); padding:5px 10px; border-radius:5px">TOTAL: ${total}</span>  ${texto}`;
    }
}