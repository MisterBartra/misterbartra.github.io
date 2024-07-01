document.addEventListener("DOMContentLoaded", function () {
// Retroceder al iframe izquierdo:
	btnLeftHitbox.addEventListener('mouseenter', () => {
	//	btnLeft.addEventListener('mouseleave', () => {
		btnLeft.style.transform = `translateX(${-45.5}vw)`;	
	//	});
    });
	if (!isDraggedBtn) {
		btnLeftHitbox.addEventListener('mouseleave', () => {
			setTimeout(() => {
				btnLeft.style.transform = `translateX(${-55}vw)`;
			}, 250);
		});
	}
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

// Avanzar al iframe derecho:
	btnRightHitbox.addEventListener('mouseenter', () => {
	//		btnRight.addEventListener('mouseleave', () => {
		btnRight.style.transform = `translateX(${45.5}vw)`;
		//		});
	});
	if (!isDraggedBtn) {
		btnRightHitbox.addEventListener('mouseleave', () => {
			setTimeout(() => {
				btnRight.style.transform = `translateX(${55}vw)`;
			}, 250);
		});
	}
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

// Subir al iframe de arriba:
	btnUpHitbox.addEventListener('mouseenter', () => {
	//		btnUp.addEventListener('mouseleave', () => {
		btnUp.style.transform = `translateY(${-45.5}vh)`;
		//		});
	});
	if (!isDraggedBtn) {
		btnUpHitbox.addEventListener('mouseleave', () => {
			setTimeout(() => {
				btnUp.style.transform = `translateY(${-55}vh)`;
			}, 250);
		});
	}
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

// Bajar al iframe de abajo:
	btnDownHitbox.addEventListener('mouseenter', () => {
	//	btnDown.addEventListener('mouseleave', () => {
		btnDown.style.transform = `translateY(${45.5}vh)`;
	//	});
	});
	if (!isDraggedBtn) {
		btnDownHitbox.addEventListener('mouseleave', () => {
			setTimeout(() => {
			btnDown.style.transform = `translateY(${55}vh)`;
			}, 250);
		});
	}
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
