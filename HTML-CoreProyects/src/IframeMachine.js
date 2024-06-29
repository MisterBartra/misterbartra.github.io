//function load_urls() {
//	let urlList = [[]], url = ""
//	if (!externalDataLoaded) {
//		function crearNuevaSublista() { // Función para crear una nueva sublista
//			urlList.push([]); // Creamos una nueva sublista vacía
//		}
//		function agregarURL(url) { // Función para agregar una URL a la matriz
//			if (url.trim() !== "") { urlList[urlList.length - 1].push(url); } // Verificamos si la URL no está vacía
//		} // Agregamos la URL a la última sublista
//		function setRowIframes() {
//			while (true) { // Bucle para recibir las URL del usuario
//				url = prompt("Ingresa una URL:\n" + ((urlList[0].length != 0) ? " - 'r' inicia otra fila\n - 'Vacio' salir del bucle" : "'Vacío' omite esta asignación y carga los url del HTML."));
//				if (url === "r") { crearNuevaSublista(); } // Si el usuario ingresa 'r', creamos una nueva sublista
//				else { agregarURL(url); } // Agregamos la URL a la sublista actual
//				if (url.trim() === "") { break; } // Si el usuario ingresa una cadena vacía, salimos del bucle
//			}
//			return (urlList[[0]].length != 0) ? urlList : urlRowIframes;
//		}
//		//urlRowIframes = setRowIframes();
//	}
//}
rowLength = 0;
function IframeCoroutineInvoker() {
	document.write(`<title>${(dataSearch.get('title') == null) ? `${urlRowIframes.length*rowLength} pestañas en un solo sitio web :o` : dataSearch.get('title')}</title>`)
	Object.keys(urlRowIframes).forEach(rowKey => {
		const crrow = urlRowIframes[rowKey];
		const crrowLength = Array.from(crrow).length;
		if (crrowLength < rowLength) {
			Array.from({ length: rowLength - crrowLength }, (_, i) => {
				crrow[(i + crrowLength + 1)] = "about:blank";
			});
		}
	});
	return Object.keys(urlRowIframes).map(rowKey => {
		return Object.keys(urlRowIframes[rowKey]).map(iframeID => `<iframe title="RowFrameCol#${iframeID}" src="${urlRowIframes[rowKey][iframeID]}" frameborder="0" scrolling="yes"></iframe>`).join("");
	}).join("");
}
function addRowIframes() { rowLength = Math.max(...Object.values(urlRowIframes).map(row => Object.keys(row).length));
	document.write(`<div id="iframe-container" style="min-width:${rowLength}00%; min-height:${urlRowIframes.length}00%;">${IframeCoroutineInvoker()}</div>`);
}
addRowIframes();