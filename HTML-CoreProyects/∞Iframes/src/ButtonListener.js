document.addEventListener("DOMContentLoaded", function () {
// Retroceder al iframe izquierdo:
	btnLeftHitbox.addEventListener('mouseenter', () => {
	//	btnLeft.addEventListener('mouseleave', () => {
		btnLeft.style.transform = `translateX(${-47.5}vw)`;
		btnSwitch.style.opacity = 0.3
		//btnLeft.style.transform = `translate(${btnsPosition.left})`;
	//	});
    });
	if (!isDraggedBtn) {
		btnLeftHitbox.addEventListener('mouseleave', () => {
			setTimeout(() => {
				if (!isClickedBtn) {
					setTimeout(() => {
						btnLeft.style.transform = `translateX(${-55}vw)`;
					}, 5000);
				} else {
					btnLeft.style.transform = `translateX(${-55}vw)`;
				}
				btnSwitch.style.opacity = 0.0
			}, 2500);
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
		btnRight.style.transform = `translateX(${47.5}vw)`;
		btnSwitch.style.opacity = 0.3
	//	btnRight.style.transform = `translate(${btnsPosition.right})`;
		//		});
	});
	if (!isDraggedBtn) {
		btnRightHitbox.addEventListener('mouseleave', () => {
			setTimeout(() => {
				if (!isClickedBtn) {
					setTimeout(() => {
						btnRight.style.transform = `translateX(${55}vw)`;
					}, 5000);
				} else {
					btnRight.style.transform = `translateX(${55}vw)`;
				}
				btnSwitch.style.opacity = 0.0
			}, 2500);
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
				btnRight.style.transform = `translate(calc(${rbtn.clientX}px - 50vw), calc(${rbtn.clientY}px - 50vh))`;
				btnsPosition.right = btnRight.style.transform;
				isDraggedBtn=true;
			}
		});
	});

// Subir al iframe de arriba:
	btnUpHitbox.addEventListener('mouseenter', () => {
	//		btnUp.addEventListener('mouseleave', () => {
		btnUp.style.transform = `translateY(${-45}vh)`;
		btnSwitch.style.opacity = 0.3
	//	btnUp.style.transform = `translate(${btnsPosition.up})`;
		//		});
	});
	if (!isDraggedBtn) {
		btnUpHitbox.addEventListener('mouseleave', () => {
			setTimeout(() => {
				if (!isClickedBtn) {
					setTimeout(() => {
						btnUp.style.transform = `translateY(${-55}vh)`;
					}, 5000);
				} else {
					btnUp.style.transform = `translateY(${-55}vh)`;
				}
				btnSwitch.style.opacity = 0.0
			}, 2500);
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
				btnUp.style.transform = `translate(calc(${ubtn.clientX}px - 50vw), calc(${ubtn.clientY}px - 50vh))`;
				btnsPosition.up = btnUp.style.transform;
				isDraggedBtn=true;
			}
		});
	});

// Bajar al iframe de abajo:
	btnDownHitbox.addEventListener('mouseenter', () => {
	//	btnDown.addEventListener('mouseleave', () => {
		btnDown.style.transform = `translateY(${45}vh)`;
		btnSwitch.style.opacity = 0.3
	//	btnDown.style.transform = `translate(${btnsPosition.down})`;
		//	});
	});
	if (!isDraggedBtn) {
		btnDownHitbox.addEventListener('mouseleave', () => {
			setTimeout(() => {
				if (!isClickedBtn) {
					setTimeout(() => {
						btnDown.style.transform = `translateY(${55}vh)`;
					}, 5000);
				} else {
					btnDown.style.transform = `translateY(${55}vh)`;
				}
				btnSwitch.style.opacity = 0.0
			}, 2500);
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
				btnDown.style.transform = `translate(calc(${dbtn.clientX}px - 50vw), calc(${dbtn.clientY}px - 50vh))`;
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
