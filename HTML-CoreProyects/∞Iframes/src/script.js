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
let btnsPosition = {
	"left": "",
	"right": "",
	"up": "",
	"down": ""
}

//function showButtonListener(htmlElement, showPos, hiddenPos, axis, timeout=0, updatePosition=false) {
//	switch (axis) {
//		case "x":
//			setTimeout(() => {
//				htmlElement.style.transform = `translate(${showPos}vw,${htmlElement.style.transform.y}px)`;
//				console.log("Left X");
//			}, timeout);
//			setTimeout(() => {
//				htmlElement.style.transform = `translate(${hiddenPos}vw,${htmlElement.style.transform.y}px)`;
//			}, timeout*2);
//			break;
//		case "y":
//			setTimeout(() => {
//				htmlElement.style.transform = `translate(${htmlElement.style.transform.x}px,${showPos}vh)`;
//			}, timeout);
//			setTimeout(() => {
//				htmlElement.style.transform = `translate(${htmlElement.style.transform.x}px,${hiddenPos}vh)`;
//			}, timeout*2);
//			break;
//	}
//	console.log("Entra");
//	if (updatePosition) {
//		updatePos();
//	}
//	return updatePosition;
//}
function updatePos() {
	setTimeout(() => {
		btnsPosition = {
			"left": btnLeft.style.transform,
			"right": btnRight.style.transform,
			"up": btnUp.style.transform,
			"down": btnDown.style.transform
		}
	}, 1500);
}


function checkIfMoreRows() { if (!buttonsNowVisible) {
	btnSwitch.style.display = "block";
	btnJSON.style.display = (showJSONButton) ? "none" : "block";
	return showJSONButton = (showJSONButton) ? false : true;
}}
function displayIDBtnAlternation(activeAlternation=true) {
	let currentDisplay = (buttonsNowVisible) ? "none" : "block";
	updatePos();
	if (urlRowIframes[0].length > 1) { btnLeft.style.display = currentDisplay; btnRight.style.display = currentDisplay;
		btnLeftHitbox.style.display = currentDisplay; btnRightHitbox.style.display = currentDisplay;
	}
	if (urlRowIframes.length > 1) { btnUp.style.display = currentDisplay; btnDown.style.display = currentDisplay;
		btnUpHitbox.style.display = currentDisplay; btnDownHitbox.style.display = currentDisplay;
	}
	checkIfMoreRows();
	if (activeAlternation) { buttonsNowVisible = (buttonsNowVisible) ? false : true; }
} displayIDBtnAlternation();
// Indices
let currentXIndex = 0, currentYIndex = 0;
// Arrastrar los botones
let isClickedBtn = isDraggedBtn = false;
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
	btnLeft.style.transform = `translateX(${-55}vw)`;
	btnRight.style.transform = `translateX(${55}vw)`;
	btnUp.style.transform = `translateY(${-55}vh)`;
	btnDown.style.transform = `translateY(${55}vh)`;
	updatePos();
	setTimeout(() => {
		iframeContainer.style.transform = `translate(-0px,-0px)`;
	}, 10 * (urlRowIframes.length + rowLength));
}