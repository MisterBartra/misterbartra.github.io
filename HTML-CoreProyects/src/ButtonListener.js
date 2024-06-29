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
				btnsPosition.left.x = btnLeft.style.left;
				btnLeft.style.top = pivotOffset(lbtn.clientY, "h");
				btnsPosition.left.y = btnLeft.style.top;
				isDraggedBtn=true;
			}
		});
	});
	btnLeftHitbox.addEventListener('mouseenter', () => {
        showButtonListener(btnLeft, 2, -2, "x", 3000);
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
				btnsPosition.right.x = btnRight.style.left;
				btnRight.style.top = pivotOffset(rbtn.clientY, "h");
				btnsPosition.right.y = btnRight.style.top;
				isDraggedBtn=true;
			}
		});
	});
	btnRightHitbox.addEventListener('mouseenter', () => {
        showButtonListener(btnRight, 2, -2, "x", 3000);
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
				btnsPosition.up.x = btnUp.style.left;
				btnUp.style.top = pivotOffset(ubtn.clientY, "h");
				btnsPosition.up.y = btnUp.style.top;
				isDraggedBtn=true;
			}
		});
	});
	btnUpHitbox.addEventListener('mouseenter', () => {
        showButtonListener(btnUp, 2, -2, "x", 3000);
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
				btnsPosition.down.x = btnDown.style.left;
				btnDown.style.top = pivotOffset(dbtn.clientY, "h");
				btnsPosition.down.y = btnDown.style.top;
				isDraggedBtn=true;
			}
		});
	});
	btnDownHitbox.addEventListener('mouseenter', () => {
        showButtonListener(btn, 2, -2, "x", 3000);
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
