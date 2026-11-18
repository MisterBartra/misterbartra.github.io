/**
 * Mobile Cruceta Navigator
 * Módulo táctil independiente para navegación bidimensional y unidimensional por inercia continua.
 * 
 * Invoca una cruceta flotante mediante arrastre ("Pull-in") desde los márgenes (inset),
 * actualiza dinámicamente la flecha hacia el borde más cercano, y al soltarla con
 * inercia hacia fuera del lienzo, navega hacia el nuevo frame haciendo reingresar
 * y aterrizar la cruceta por el lado opuesto de forma suave.
 */

class MobileCrucetaController {
	constructor(viewer) {
		this.viewer = viewer;
		this.element = null;
		this.arrowElement = null;
		this.notches = {};

		// Estados de interacción
		this.isTracking = false;
		this.isActive = false;
		this.isFlicking = false;
		this.originEdge = null;
		this.activeDirection = null;

		// Coordenadas y cinemática
		this.startX = 0;
		this.startY = 0;
		this.currentX = 0;
		this.currentY = 0;
		this.lastX = 0;
		this.lastY = 0;
		this.lastTime = 0;
		this.velocityX = 0;
		this.velocityY = 0;

		// Umbrales táctiles (en píxeles y velocidad)
		this.SPROUT_THRESHOLD = 14;      // Desplazamiento mínimo para hacer brotar la cruceta
		this.FLICK_VELOCITY = 0.35;      // px/ms mínimo para considerar tiro con inercia
		this.FLICK_DIST_RATIO = 0.22;    // % de pantalla recorrido hacia el borde para disparo automático

		// Inicializar el elemento y eventos táctiles
		this.init();
	}

	init() {
		// Crear el elemento DOM de la cruceta táctil
		this.createElement();

		// Vincular eventos táctiles en márgenes y detectores
		this.bindTouchEvents();

		console.log('MobileCrucetaController inicializado exitosamente.');
	}

	createElement() {
		if (document.querySelector('.mobile-cruceta')) {
			this.element = document.querySelector('.mobile-cruceta');
			this.arrowElement = this.element.querySelector('.mobile-cruceta-arrow');
			return;
		}

		this.element = document.createElement('div');
		this.element.className = 'mobile-cruceta';

		// Muescas cardinales
		const notchesContainer = document.createElement('div');
		notchesContainer.className = 'mobile-cruceta-notches';

		['top', 'bottom', 'left', 'right'].forEach(dir => {
			const notch = document.createElement('div');
			notch.className = `mobile-cruceta-notch ${dir}`;
			notchesContainer.appendChild(notch);
			this.notches[dir] = notch;
		});

		// Flecha direccional SVG reactiva (por defecto apuntando arriba)
		this.arrowElement = document.createElement('div');
		this.arrowElement.className = 'mobile-cruceta-arrow';
		this.arrowElement.innerHTML = `
			<svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
				<line x1="12" y1="19" x2="12" y2="5"></line>
				<polyline points="5 12 12 5 19 12"></polyline>
			</svg>
		`;

		this.element.appendChild(notchesContainer);
		this.element.appendChild(this.arrowElement);

		document.body.appendChild(this.element);
	}

	bindTouchEvents() {
		// Delegación de eventos touchstart en cualquier .edge-detector o margen de celda
		document.addEventListener('touchstart', (e) => {
			const det = e.target.closest('.edge-detector');
			if (det && det.dataset.edge) {
				this.handleTouchStart(e, det.dataset.edge);
			}
		}, { passive: true });

		// Escuchar movimiento y finalización en el documento para arrastre continuo
		document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
		document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
		document.addEventListener('touchcancel', (e) => this.handleTouchCancel(e), { passive: false });
	}

	/**
	 * Determina el tipo de vector dimensional actual del visor:
	 * 'col' = vertical 1D (Nx1, ej. novela/capítulos)
	 * 'row' = horizontal 1D (1xN, ej. anime/episodios)
	 * '2d'  = matriz bidimensional (NxM)
	 */
	getVectorConstraints() {
		if (!this.viewer || !this.viewer.matrixStack) return '2d';
		const currentMatrix = this.viewer.matrixStack[this.viewer.currentPosition.depth - this.viewer.initialDepth];
		if (!currentMatrix || currentMatrix.length === 0) return '2d';

		const hasMultipleRows = currentMatrix.length > 1;
		const hasMultipleCols = currentMatrix[0] && currentMatrix[0].length > 1;

		if (hasMultipleRows && !hasMultipleCols) return 'col';
		if (!hasMultipleRows && hasMultipleCols) return 'row';
		return '2d';
	}

	handleTouchStart(e, edge) {
		if (this.isFlicking || (this.viewer && this.viewer.animationInProgress)) return;

		const touch = e.touches[0];
		if (!touch) return;

		this.isTracking = true;
		this.isActive = false;
		this.originEdge = edge;
		this.activeDirection = null;

		this.startX = touch.clientX;
		this.startY = touch.clientY;
		this.currentX = touch.clientX;
		this.currentY = touch.clientY;
		this.lastX = touch.clientX;
		this.lastY = touch.clientY;
		this.lastTime = performance.now();
		this.velocityX = 0;
		this.velocityY = 0;
	}

	handleTouchMove(e) {
		if (!this.isTracking) return;

		const touch = e.touches[0];
		if (!touch) return;

		const now = performance.now();
		const dt = Math.max(1, now - this.lastTime);
		this.velocityX = (touch.clientX - this.lastX) / dt;
		this.velocityY = (touch.clientY - this.lastY) / dt;
		this.lastX = touch.clientX;
		this.lastY = touch.clientY;
		this.lastTime = now;

		this.currentX = touch.clientX;
		this.currentY = touch.clientY;

		const dx = this.currentX - this.startX;
		const dy = this.currentY - this.startY;
		const dist = Math.hypot(dx, dy);

		// Brotar si superó el umbral desde el margen
		if (!this.isActive) {
			if (dist >= this.SPROUT_THRESHOLD) {
				this.sproutCruceta(this.currentX, this.currentY);
			} else {
				return;
			}
		}

		// Si ya está activa, capturamos el evento para no desplazar la página de fondo
		if (e.cancelable) {
			e.preventDefault();
		}

		// Actualizar posición de la cruceta con inercia visual
		this.updatePosition(this.currentX, this.currentY);

		// Calcular y actualizar dirección reactiva
		this.updateDirectionAndArrow(dx, dy);
	}

	sproutCruceta(x, y) {
		this.isActive = true;
		this.element.classList.remove('fade-out', 'landing');
		this.element.classList.add('active', 'sprouting');
		this.element.style.left = `${x}px`;
		this.element.style.top = `${y}px`;

		setTimeout(() => {
			if (this.element) this.element.classList.remove('sprouting');
		}, 280);
	}

	updatePosition(x, y) {
		if (!this.element) return;
		this.element.style.left = `${x}px`;
		this.element.style.top = `${y}px`;
	}

	updateDirectionAndArrow(dx, dy) {
		const vectorType = this.getVectorConstraints();
		let targetAngle = 0;
		let dir = 'top';

		if (vectorType === 'col') {
			// Vector vertical 1D: Solo arriba y abajo
			if (dy >= 0) {
				dir = 'bottom';
				targetAngle = 180;
			} else {
				dir = 'top';
				targetAngle = 0;
			}
		} else if (vectorType === 'row') {
			// Vector horizontal 1D: Solo izquierda y derecha
			if (dx >= 0) {
				dir = 'right';
				targetAngle = 90;
			} else {
				dir = 'left';
				targetAngle = 270;
			}
		} else {
			// Vector 2D: Evaluar el ángulo continuo hacia el cuadrante más cercano
			const rad = Math.atan2(dy, dx);
			let deg = (rad * 180 / Math.PI) + 90;
			if (deg < 0) deg += 360;

			if (deg >= 45 && deg < 135) {
				dir = 'right';
				targetAngle = 90;
			} else if (deg >= 135 && deg < 225) {
				dir = 'bottom';
				targetAngle = 180;
			} else if (deg >= 225 && deg < 315) {
				dir = 'left';
				targetAngle = 270;
			} else {
				dir = 'top';
				targetAngle = 0;
			}
		}

		this.activeDirection = dir;

		// Rota la flecha central hacia el lado más cercano
		if (this.arrowElement) {
			this.arrowElement.style.transform = `rotate(${targetAngle}deg)`;
		}

		// Iluminar la muesca correspondiente
		Object.keys(this.notches).forEach(notchKey => {
			if (notchKey === dir) {
				this.notches[notchKey].classList.add('highlighted');
			} else {
				this.notches[notchKey].classList.remove('highlighted');
			}
		});

		// Comprobar si está en zona o velocidad de disparo
		const isReady = this.checkReadyToFlick(dir, dx, dy);
		if (isReady) {
			this.element.classList.add('ready-to-flick');
		} else {
			this.element.classList.remove('ready-to-flick');
		}
	}

	checkReadyToFlick(dir, dx, dy) {
		const w = window.innerWidth;
		const h = window.innerHeight;

		// Proximidad a los bordes exteriores
		const distToTop = this.currentY;
		const distToBottom = h - this.currentY;
		const distToLeft = this.currentX;
		const distToRight = w - this.currentX;

		if (dir === 'bottom' && (distToBottom < h * this.FLICK_DIST_RATIO || this.velocityY > this.FLICK_VELOCITY)) return true;
		if (dir === 'top' && (distToTop < h * this.FLICK_DIST_RATIO || this.velocityY < -this.FLICK_VELOCITY)) return true;
		if (dir === 'right' && (distToRight < w * this.FLICK_DIST_RATIO || this.velocityX > this.FLICK_VELOCITY)) return true;
		if (dir === 'left' && (distToLeft < w * this.FLICK_DIST_RATIO || this.velocityX < -this.FLICK_VELOCITY)) return true;

		return false;
	}

	handleTouchEnd(e) {
		if (!this.isTracking) return;
		this.isTracking = false;

		if (!this.isActive) return;

		const isReady = this.element.classList.contains('ready-to-flick');
		const dir = this.activeDirection;

		if (isReady && dir) {
			// Gesto exitoso: Lanzamiento por inercia hacia fuera y navegación
			this.executeFlick(dir);
		} else {
			// Gesto cancelado o soltado sin suficiente impulso: Rebote elástico y fade out
			this.cancelAndFadeOut();
		}
	}

	handleTouchCancel() {
		if (this.isActive) {
			this.cancelAndFadeOut();
		}
		this.isTracking = false;
	}

	/**
	 * Ejecuta el lanzamiento con inercia hacia fuera del lienzo,
	 * dispara la navegación en el visor, y hace reentrar y "bajar"
	 * la cruceta desde el borde opuesto en el nuevo frame.
	 */
	executeFlick(dir) {
		this.isFlicking = true;
		this.element.classList.remove('active', 'ready-to-flick');

		const w = window.innerWidth;
		const h = window.innerHeight;

		// Calcular coordenadas de salida fuera de pantalla
		let exitX = this.currentX;
		let exitY = this.currentY;
		const overshoot = 90; // px fuera del viewport

		if (dir === 'top') {
			exitY = -overshoot;
		} else if (dir === 'bottom') {
			exitY = h + overshoot;
		} else if (dir === 'left') {
			exitX = -overshoot;
		} else if (dir === 'right') {
			exitX = w + overshoot;
		}

		// 1. Salida disparada hacia fuera
		this.element.style.transition = 'left 0.22s ease-in, top 0.22s ease-in, opacity 0.2s ease-in';
		this.element.style.left = `${exitX}px`;
		this.element.style.top = `${exitY}px`;
		this.element.style.opacity = '0.4';

		// Mapear dirección a delta de navegación
		let deltaX = 0;
		let deltaY = 0;
		if (dir === 'top') deltaY = -1;
		else if (dir === 'bottom') deltaY = 1;
		else if (dir === 'left') deltaX = -1;
		else if (dir === 'right') deltaX = 1;

		setTimeout(() => {
			// 2. Disparar transición de navegación en el visor principal
			if (this.viewer && typeof this.viewer.navigate === 'function') {
				this.viewer.navigate(deltaX, deltaY);
			}

			// 3. Continuidad espacial: Reingreso por el lado opuesto conservando la coordenada proporcional
			this.executeOppositeReentry(dir, exitX, exitY);
		}, 180);
	}

	executeOppositeReentry(dir, exitX, exitY) {
		const w = window.innerWidth;
		const h = window.innerHeight;
		const overshoot = 75;

		let entryX = exitX;
		let entryY = exitY;
		let settleX = exitX;
		let settleY = exitY;

		// El punto de entrada se sitúa en el extremo contrario proporcionalmente
		if (dir === 'bottom') {
			// Salió por abajo: reingresa desde el borde superior hacia abajo ("bajar")
			entryY = -overshoot;
			settleY = Math.min(h * 0.35, 180);
		} else if (dir === 'top') {
			// Salió por arriba: reingresa desde el borde inferior
			entryY = h + overshoot;
			settleY = Math.max(h * 0.65, h - 180);
		} else if (dir === 'right') {
			// Salió por la derecha: reingresa por la izquierda
			entryX = -overshoot;
			settleX = Math.min(w * 0.35, 180);
		} else if (dir === 'left') {
			// Salió por la izquierda: reingresa por la derecha
			entryX = w + overshoot;
			settleX = Math.max(w * 0.65, w - 180);
		}

		// Posicionamiento instantáneo en el borde opuesto
		this.element.style.transition = 'none';
		this.element.style.left = `${entryX}px`;
		this.element.style.top = `${entryY}px`;
		this.element.style.opacity = '0.9';
		this.element.offsetHeight; // Forzar reflow

		// Aterrizaje amortiguado deslizándose hacia el espacio del nuevo iframe
		const rAF = (typeof requestAnimationFrame !== 'undefined') ? requestAnimationFrame : (cb => setTimeout(cb, 16));
		rAF(() => {
			this.element.classList.add('landing');
			this.element.style.left = `${settleX}px`;
			this.element.style.top = `${settleY}px`;

			// Una vez detenido y quieto, desvanecerse suavemente a pantalla limpia
			setTimeout(() => {
				this.element.classList.remove('landing');
				this.element.classList.add('fade-out');

				setTimeout(() => {
					this.resetCruceta();
				}, 350);
			}, 420);
		});
	}

	cancelAndFadeOut() {
		this.element.classList.remove('active', 'ready-to-flick');
		this.element.classList.add('fade-out');

		setTimeout(() => {
			this.resetCruceta();
		}, 300);
	}

	resetCruceta() {
		this.isActive = false;
		this.isFlicking = false;
		this.activeDirection = null;
		if (this.element) {
			this.element.className = 'mobile-cruceta';
			this.element.style.transition = '';
			this.element.style.left = '50%';
			this.element.style.top = '50%';
			this.element.style.opacity = '0';
		}
		Object.values(this.notches).forEach(n => n.classList.remove('highlighted'));
	}
}

// Exportar globalmente para que pueda ser instanciado por el visor principal
if (typeof window !== 'undefined') {
	window.MobileCrucetaController = MobileCrucetaController;
}
