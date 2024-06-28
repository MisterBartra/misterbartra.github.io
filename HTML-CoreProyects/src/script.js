btns = document.getElementsByClassName("scroll-btn");
if (document.parentNode) {
	btns.forEach((btn) => {
		btn.classList.replace("gray", "light-gray");
	});
}
let externalDataLoaded=false; let buttonsNowVisible=false, showJSONButton=true;
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
}
// Variables globales
// Iframe Scroller
const iframeContainer = document.getElementById("iframe-container"), iframes = document.querySelectorAll("iframe");
const btnLeft = btns[0], btnRight = btns[1], btnUp = btns[2], btnDown = btns[3], btnSwitch = btns[4];
let btnPivotCenter = btnLeft.style.width/2;
const btnJSON = document.getElementById("import_loadjson");
displayIDBtnAlternation();
let currentXIndex = 0, currentYIndex = 0;
// Arrastrar los botones
let isClickedBtn = isDraggedBtn = false;
function pivotOffset(coordPos, v, a=0) {return `calc(${coordPos}px - ${50+a}v${v})`;}
// Actualizar la posición del contenedor
function updateFrameContainerPosition(isDraggedBtn, directionX=0, directionY=0) {
	if (isDraggedBtn) {
		currentXIndex = (directionX==0) ? currentXIndex : ((currentXIndex + directionX + rowLength) % rowLength);
		currentYIndex = (directionY==0) ? currentYIndex : ((currentYIndex + directionY + rowLength) % rowLength);
	} else {
		const translateX = -currentXIndex * 100; // 100vw por iframe
		const translateY = -currentYIndex * 100; // 100vh por iframe
		iframeContainer.style.transform = `translate(${translateX}vw, ${translateY}vh)`;
	}
	return false;
}
function adjustDynamicWindow() {
    return iframeContainer.style.transform = `translateX(-0px)`;
}