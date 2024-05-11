function CORSRequest() {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', 'rowsIframes.json', true);
    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4 && xhr.status === 200) {
            const data = JSON.parse(xhr.responseText); // Parsea el JSON
            //urlRowIframes=data;
        }
    }; xhr.send();
}
CORSRequest();
/*
async function setValue() {
	try {
		const response = await fetch(archivo);
		const html = await response.text();
		const contenedor = document.getElementById("contenedor1");
		contenedor.innerHTML = html;
		// Accede a la variable definida en formulario1.html
		const iframe = contenedor.querySelector("iframe");
		const iframeWindow = iframe.contentWindow || iframe.contentDocument.defaultView;
		console.log(iframeWindow.miVariable); // Debería mostrar "Hola desde formulario1.html"
	} catch (error) {
		console.log("Error al importar el archivo: " + error.message);
	}
}
*/
