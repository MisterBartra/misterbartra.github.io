// Variables globales
// Iframe Scroller

const iframeContainer = document.getElementById("iframe-container"), iframes = document.querySelectorAll("iframe");
const btns = document.getElementsByClassName("scroll-btn");
const btnsHitbox = document.getElementsByClassName("hitbox");
const btnLeft = btns[0], btnRight = btns[1], btnUp = btns[2], btnDown = btns[3], btnSwitch = btns[4];
const btnLeftHitbox = btnsHitbox[0], btnRightHitbox = btnsHitbox[1], btnUpHitbox = btnsHitbox[2], btnDownHitbox = btnsHitbox[3];
let btnPivotCenter = btnLeft.style.width/2;
const btnJSON = document.getElementById("import_loadjson");

if (document.parentNode) {
	btns.forEach((btn) => {
		btn.classList.replace("gray", "light-gray");
	});
}
//let externalDataLoaded=false;
let buttonsNowVisible=false, showJSONButton=true;

function showButtonListener(htmlElement, showPos, hiddenPos, axis, timeout=0, updatePosition=false) {
	switch (axis) {
		case "x":
			setTimeout(() => {
				htmlElement.style.transform = `translate(${showPos}00%,${htmlElement.style.transform.y}px)`;
			}, timeout);
			setTimeout(() => {
				htmlElement.style.transform = `translate(${hiddenPos}00%,${htmlElement.style.transform.y}px)`;
			}, timeout*2);
		case "y":
			setTimeout(() => {
				htmlElement.style.transform = `translate(${htmlElement.style.transform.x}px,${showPos}00%)`;
			}, timeout);
			setTimeout(() => {
				htmlElement.style.transform = `translate(${htmlElement.style.transform.x}px,${hiddenPos}00%)`;
			}, timeout*2);
	}
	if (updatePosition) {
		btnsPosition = {
			"left": {x: btnLeft.style.transform.x, y: btnLeft.style.transform.y},
			"right": {x: btnRight.style.transform.x, y: btnRight.style.transform.y},
			"up": {x: btnUp.style.transform.x, y: btnUp.style.transform.y},
			"down": {x: btnDown.style.transform.x, y: btnDown.style.transform.y}
		}
	}
	return updatePosition;
}
function initButtonProcess() {
	showButtonListener(btns[0], 3, -3, "x", 375);
	showButtonListener(btns[1], 3, -3, "x", 375, true);
	showButtonListener(btns[2], 3, -3, "y", 375);
	showButtonListener(btns[3], 3, -3, "y", 375, true);
}

function checkIfMoreRows() { if (!buttonsNowVisible) {
	btnSwitch.style.display = "block";
	btnJSON.style.display = (showJSONButton) ? "none" : "block";
	return showJSONButton = (showJSONButton) ? false : true;
}}
function displayIDBtnAlternation(activeAlternation=true) {
	let currentDisplay = (buttonsNowVisible) ? "none" : "block";
	initButtonProcess();
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

function adjustDynamicWindow() {
	initButtonProcess();
	return iframeContainer.style.transform = `translateX(-0px)`;
}