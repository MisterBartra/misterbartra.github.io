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
				btnLeft.style.transform = `translate(calc(${lbtn.clientX}px - 50vw), calc(${lbtn.clientY}px - 50vh))`;
				btnsPosition.left = btnLeft.style.transform;
				isDraggedBtn=true;
			}
		});
	});
	btnLeftHitbox.addEventListener('mouseenter', () => {
		btnLeft.style.transform = `translateX(${-45.5}vw)`;
		btnLeft.addEventListener('mouseleave', () => {
			setTimeout(() => {
				btnLeft.style.transform = `translateX(${-54}vw)`;
			}, 1250);
		});
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
				btnRight.style.transform = `translate(calc(${lbtn.clientX}px - 50vw), calc(${lbtn.clientY}px - 50vh))`;
				btnsPosition.right = btnRight.style.transform;
				isDraggedBtn=true;
			}
		});
	});
	btnRightHitbox.addEventListener('mouseenter', () => {
		btnRight.style.transform = `translateX(${45.5}vw)`;
		setTimeout(() => {
			btnRight.style.transform = `translateX(${54}vw)`;
		}, 1250);
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
				btnUp.style.transform = `translate(calc(${lbtn.clientX}px - 50vw), calc(${lbtn.clientY}px - 50vh))`;
				btnsPosition.up = btnUp.style.transform;
				isDraggedBtn=true;
			}
		});
	});
	btnUpHitbox.addEventListener('mouseenter', () => {
		btnUp.style.transform = `translateY(${-45.5}vh)`;
		setTimeout(() => {
			btnUp.style.transform = `translateY(${-55}vh)`;
		}, 1250);
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
				btnDown.style.transform = `translate(calc(${lbtn.clientX}px - 50vw), calc(${lbtn.clientY}px - 50vh))`;
				btnsPosition.down = btnDown.style.transform;
				isDraggedBtn=true;
			}
		});
	});
	btnDownHitbox.addEventListener('mouseenter', () => {
		btnDown.style.transform = `translateY(${45.5}vh)`;
		setTimeout(() => {
			btnDown.style.transform = `translateY(${55}vh)`;
		}, 1250);
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
				btnSwitch.style.transform = `translate(calc(${lbtn.clientX}px - 50vw), calc(${lbtn.clientY}px - 50vh))`;
				isDraggedBtn=true;
			}
		});
	});
});
