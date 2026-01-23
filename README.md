# 📊 EkadeCounter

**EkadeCounter** es una extensión de navegador (Chrome/Brave) diseñada para estudiantes y padres que utilizan la plataforma **Pincel Ekade**. 

La web oficial muestra las faltas divididas en múltiples páginas, lo que hace difícil saber el total real de un vistazo. Esta extensión automatiza el proceso, lee todo el historial y muestra un resumen claro.

## 🚀 Características

- **Conteo Automático:** Suma las faltas de todas las asignaturas al instante.
- **Soporte Multigrupo:** Escanea todas las páginas de la tabla de paginación (1, 2, 3...) en segundo plano.
- **Filtro Inteligente:** Solo cuenta las filas marcadas explícitamente como "Falta sin justificar".
- **Anti-Duplicados:** Utiliza un sistema de huella digital (Fecha + Hora + Materia) para evitar sumar dos veces la misma falta si recargas la página.
- **Privacidad Total:** Todo el análisis se hace en tu navegador. No se envían datos a ningún servidor externo.

## 🛠️ Instalación (Modo Desarrollador)

Como esta extensión es de uso personal y no está en la Chrome Web Store, debes instalarla manualmente:

1. Clona este repositorio o descarga el código en una carpeta (asegúrate de tener `manifest.json` y `content.js`).
2. Abre tu navegador (Brave o Chrome).
3. Escribe en la barra de direcciones: `brave://extensions` (o `chrome://extensions`).
4. Activa el interruptor **"Modo de desarrollador"** (arriba a la derecha).
5. Haz clic en el botón **"Cargar descomprimida"** (Load unpacked).
6. Selecciona la carpeta donde guardaste los archivos.

¡Listo! 🎉

## 📖 Cómo usarla

1. Entra en **Pincel Ekade Web** con tu usuario y contraseña.
2. Navega a la sección de **Faltas y Anotaciones**.
3. Verás una barra amarilla arriba que dice "Analizando...".
4. Espera unos segundos y la barra se volverá **ROJA** mostrando:
   - El total absoluto de faltas injustificadas.
   - El desglose por asignatura (ej: `SSF: 2 | PRO: 4`).

## 💻 Detalles Técnicos

El script `content.js` funciona inyectándose en el DOM de Ekade:
1. Detecta la tabla de notas.
2. Identifica los enlaces de paginación disponibles.
3. Realiza peticiones `fetch` asíncronas para descargar el HTML de las páginas ocultas.
4. Parsea el HTML virtualmente y extrae los datos.
5. Usa un objeto `Set()` para almacenar IDs únicos de faltas y evitar errores de conteo.

## 📄 Licencia

Este proyecto es de código abierto. Siéntete libre de modificarlo para adaptarlo a tus necesidades.
