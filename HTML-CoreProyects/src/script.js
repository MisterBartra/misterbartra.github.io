// Variables globales
// Iframe Scroller

const iframeContainer = document.getElementById("iframe-container"), iframes = document.querySelectorAll("iframe");
const btns = document.getElementsByClassName("scroll-btn");
const btnLeft = btns[0], btnRight = btns[1], btnUp = btns[2], btnDown = btns[3], btnSwitch = btns[4];
let btnPivotCenter = btnLeft.style.width/2;
const btnJSON = document.getElementById("import_loadjson");

if (document.parentNode) {
	btns.forEach((btn) => {
		btn.classList.replace("gray", "light-gray");
	});
}
//let externalDataLoaded=false;
let buttonsNowVisible=false, showJSONButton=true;
function checkIfMoreRows() { if (!buttonsNowVisible) {
	btnSwitch.style.display = "block";
	btnJSON.style.display = (showJSONButton) ? "none" : "block";
	return showJSONButton = (showJSONButton) ? false : true;
}}
function displayIDBtnAlternation(activeAlternation=true) {
	let currentDisplay = (buttonsNowVisible) ? "none" : "block";
	if (urlRowIframes[0].length > 1) { btnLeft.style.display = currentDisplay; btnRight.style.display = currentDisplay; }
	if (urlRowIframes.length > 1) { btnUp.style.display = currentDisplay; btnDown.style.display = currentDisplay; }
		checkIfMoreRows();
	if (activeAlternation) { buttonsNowVisible = (buttonsNowVisible) ? false : true; }
} displayIDBtnAlternation();

let currentXIndex = 0, currentYIndex = 0;
let btnsPosition = {
	"left": {x: "0", y: "0"},
	"right": {x: "0", y: "0"},
	"up": {x: "0", y: "0"},
	"down": {x: "0", y: "0"}
}

// Arrastrar los botones
let isClickedBtn = isDraggedBtn = false;
function pivotOffset(coordPos, v, a=0) { return `calc(${coordPos}px - ${50+a}v${v})`; }
// Actualizar la posición del contenedor
function updateFrameContainerPosition(isDraggedBtn, directionX=0, directionY=0) {
	if (isDraggedBtn) {
		currentXIndex = (directionX==0) ? currentXIndex : ((currentXIndex + directionX + rowLength) % rowLength);
		currentYIndex = (directionY==0) ? currentYIndex : ((currentYIndex + directionY + rowLength) % rowLength);
	} else { iframeContainer.style.transform = `translate(${-currentXIndex * 100}vw, ${-currentYIndex * 100}vh)`; }
	return false;
}
function import_loadjson() {
	const archivo = document.getElementById("import_trigger").files[0];
	if (archivo) {
		const lector = new FileReader();
		lector.onload = function(datafile) {
			return window.location.href=`../src/loadIframes.html?urlRowIframes=${encodeURIComponent(JSON.stringify(datafile))}`;
		};
	} else {console.error("No se seleccionó ningún archivo.");}
	displayIDBtnAlternation(false);
	return addRowIframes();
}
function adjustDynamicWindow() { return iframeContainer.style.transform = `translateX(-0px)`; }