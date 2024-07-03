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
const dataSearch = new URLSearchParams(window.location.search);
var urlRowIframes = (urlRowIframes != [["",""],["",""]]) ? ((dataSearch.get('urlRowIframes') != null) ? JSON.parse(decodeURIComponent(dataSearch.get('urlRowIframes'))) : urlRowIframes) : urlRowIframes;

function IframeCoroutineInvoker() {
	document.write(`<title>${(title != "") ? ((dataSearch.get('title') == null) ? title : dataSearch.get('title')) : `${urlRowIframes.length*rowLength} pestañas en un solo sitio web :o`}</title>`)
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
	document.write(`<div id="hitboxes"><div class="hitbox" id="hitbox-left"></div><div class="hitbox" id="hitbox-right"></div><div class="hitbox" id="hitbox-up"></div><div class="hitbox" id="hitbox-down"></div></div>`);
	document.write(`<div id="pivot-btns"><!-- Botones de dirección --><button type="button" class="scroll-btn circle gray" id="scroll-left"><span>&#9664;</span></button><button type="button" class="scroll-btn circle gray" id="scroll-right"><span>&#9658;</span></button><button type="button" class="scroll-btn circle gray" id="scroll-up"><span>&#9650;</span></button><button type="button" class="scroll-btn circle gray" id="scroll-down"><span>&#9660;</span></button><button type="button" class="scroll-btn circle gray" id="scroll-hideButtons"><span>&#5159;</span><label for="import_trigger" class="scroll-btn circle gray" id="import_loadjson"><svg style="width: 1em; height: 1em;vertical-align: middle;fill: currentColor;overflow: hidden;" viewBox="0 -128 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M640 170.666667v85.333333h128v512h-128v85.333333h213.333333V170.666667M170.666667 170.666667v682.666666h213.333333v-85.333333H256V256h128V170.666667H170.666667z" fill="" /></svg></label><input id="import_trigger" type="file" placeholder="[]" title="Importar And Load RowFrames" accept=".json" onchange="import_loadjson();"></button></div>`);
}
addRowIframes();
