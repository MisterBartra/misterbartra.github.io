
document.addEventListener("DOMContentLoaded", function () {
			// Retroceder al iframe izquierdo:
			btnLeft.addEventListener("click", function () {
				if (isClickedBtn) { btnLeft.addEventListener('mouseleave', function () {isDraggedBtn = updateFrameContainerPosition(true, 1, 0);});}
				btnLeft.addEventListener('mouseup', () => {
					if (isClickedBtn) isDraggedBtn = updateFrameContainerPosition(isDraggedBtn); return isClickedBtn=false;
				});
				btnLeft.addEventListener('mousedown', () => {
					if (!isClickedBtn) {
						currentXIndex = (currentXIndex - 1 + rowLength) % rowLength;
						isClickedBtn = true;
					}
				});
				btnLeft.addEventListener('mousemove', lbtn => {
					if (isClickedBtn) {
						btnLeft.style.left = pivotOffset(lbtn.clientX, "w", btnPivotCenter);
						btnLeft.style.top = pivotOffset(lbtn.clientY, "h");
						isDraggedBtn=true;
					}
				});
			});
			const boton = document.querySelector('.boton-con-hitbox');
    const hitbox = document.querySelector('.hitbox-lateral');

    hitbox.addEventListener('mouseenter', () => {
        boton.classList.add('boton-visible');
    });

    hitbox.addEventListener('mouseleave', () => {
        boton.classList.remove('boton-visible');
    });

			// Avanzar al iframe derecho:
			btnRight.addEventListener("click", function () {
				if (isClickedBtn) { btnRight.addEventListener('mouseleave', function () {isDraggedBtn = updateFrameContainerPosition(true, -1, 0);});}
				btnRight.addEventListener('mouseup', () => {
					if (isClickedBtn) isDraggedBtn = updateFrameContainerPosition(isDraggedBtn); return isClickedBtn=false;
				});
				btnRight.addEventListener('mousedown', () => {
					if (!isClickedBtn) {
						currentXIndex = (currentXIndex + 1 + rowLength) % rowLength;
						isClickedBtn = true;
					}
				});
				btnRight.addEventListener('mousemove', rbtn => {
					if (isClickedBtn) {
						btnRight.style.left = pivotOffset(rbtn.clientX, "w", -btnPivotCenter);
						btnRight.style.top = pivotOffset(rbtn.clientY, "h");
						isDraggedBtn=true;
					}
				});
			});
			// Subir al iframe de arriba:
			btnUp.addEventListener("click", function () {
				if (isClickedBtn) { btnUp.addEventListener('mouseleave', function () {isDraggedBtn = updateFrameContainerPosition(true, 0, 1);});}
				btnUp.addEventListener('mouseup', () => {
					if (isClickedBtn) isDraggedBtn = updateFrameContainerPosition(isDraggedBtn); return isClickedBtn=false;
				});
				btnUp.addEventListener('mousedown', () => {
					if (!isClickedBtn) {
						currentYIndex = (currentYIndex - 1 + urlRowIframes.length) % urlRowIframes.length;
						isClickedBtn = true;
					}
				});
				btnUp.addEventListener('mousemove', ubtn => {
					if (isClickedBtn) {
						btnUp.style.left = pivotOffset(ubtn.clientX, "w", btnPivotCenter);
						btnUp.style.top = pivotOffset(ubtn.clientY, "h");
						isDraggedBtn=true;
					}
				});
			});
			// Bajar al iframe de abajo:
			btnDown.addEventListener("click", function () {
				if (isClickedBtn) { btnDown.addEventListener('mouseleave', function () {isDraggedBtn = updateFrameContainerPosition(true, 0, 1);});}
				btnDown.addEventListener('mouseup', () => {
					if (isClickedBtn) isDraggedBtn = updateFrameContainerPosition(isDraggedBtn); return isClickedBtn=false;
				});
				btnDown.addEventListener('mousedown', () => {
					if (!isClickedBtn) {
						currentYIndex = (currentYIndex + 1 + urlRowIframes.length) % urlRowIframes.length;
						isClickedBtn = true;
					}
				});
				btnDown.addEventListener('mousemove', dbtn => {
					if (isClickedBtn) {
						btnDown.style.left = pivotOffset(dbtn.clientX, "w", -btnPivotCenter);
						btnDown.style.top = pivotOffset(dbtn.clientY, "h");
						isDraggedBtn=true;
					}
				});
			});
			btnSwitch.addEventListener("click", function () {
				if (isClickedBtn) { btnSwitch.addEventListener('mouseleave', function () {isDraggedBtn = updateFrameContainerPosition(true, 0, 1);});}
				btnSwitch.addEventListener('mouseup', () => {
					if (isClickedBtn) displayIDBtnAlternation(); return isClickedBtn=false;
				});
				btnSwitch.addEventListener('mousedown', () => {
					if (!isClickedBtn) {
						currentYIndex = (currentYIndex + 1 + urlRowIframes.length) % urlRowIframes.length;
						isClickedBtn = true;
					}
				});
				btnSwitch.addEventListener('mousemove', dbutton => {
					if (isClickedBtn) {
						btnSwitch.style.left = pivotOffset(dbutton.clientX, "w", -1);
						btnSwitch.style.top = pivotOffset(dbutton.clientY, "h", -1);
						isDraggedBtn=true;
					}
				});
			});
		});
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
		