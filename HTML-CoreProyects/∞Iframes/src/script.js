// Clase principal para gestionar la aplicación:
class IframeMatrixViewer {
	constructor(rootElement) {
		this.root = rootElement;
		this.matrix = [];
		this.title = "∞Iframes Matrix Viewer";
		this.currentPosition = { x: 0, y: 0, depth: 0 };
		this.matrixStack = [];
		this.initialDepth = 0;
		this.isSingleColumnRow = false;
		this.isSingleRowMatrix = false;
		this.buttonsVisible = false;
		this.darkMode = true; // Por defecto modo oscuro
		this.tooltips = {};
		this.isLoading = false;
		this.animationInProgress = false;
		this.iframeColors = {}; // Para almacenar los colores detectados de cada iframe
		this.activeEdges = {}; // Para rastrear qué bordes están activos
		this.settingsVisible = false;
		this.hideTimeouts = {}; // Para almacenar los timeouts de ocultación de botones
		this.loadingStates = []; // Para rastrear el estado de carga de cada iframe
		this.iframeOpacities = []; // Para controlar la opacidad de cada iframe
		this.defaultBackgroundColor = "#000"; // Color por defecto para cuando no se puede detectar
		this.parentHash = String(""); // Para almacenar el hash del padre
		this.nestedMatrices = new Map(); // Para almacenar información sobre matrices anidadas detectadas
		this.loadingTimeouts = {}; // Para almacenar timeouts de carga
		this.hierarchyPath = []; // Para almacenar la ruta jerárquica
		// Inicializar la aplicación
		this.init();
	}
	
	async init() {
		try {
			// Mostrar loader
			this.showLoader();
			
			// Detectar la profundidad actual
			this.initialDepth = this.detectCurrentDepth();
			
			// Obtener datos de la matriz
			await this.loadMatrixData();
			
			// Inicializar estados de carga
			this.initLoadingStates();
			
			// Renderizar la interfaz
			this.render();
			
			// Configurar eventos
			//this.setupEventListeners();
			
			// Comprobar si hay una posición en el hash de la URL
			this.checkUrlHash();
			this.updateUrlHash();
			
			// Ocultar loader
			this.hideLoader();
			
			// Mostrar notificación de bienvenida
			this.showNotification(`Bienvenido a ∞Iframes Matrix Viewer (Nivel ${this.currentPosition.depth})`);
			
			// Establecer el título del documento
			document.title = this.title;
			
			// Iniciar detección de matrices anidadas
			this.startNestedMatrixDetection();
		} catch (error) {
			console.error("Error initializing application:", error);
			this.root.innerHTML = `<p>Error initializing application: ${error.message}</p>`;
			this.hideLoader();
		}
	}
	
	initLoadingStates() {
		if (Array.isArray(this.matrix) && this.matrix.length > 0 && Array.isArray(this.matrix[0])) {
			this.loadingStates = this.matrix.map(row => row.map(() => true));
			this.iframeOpacities = this.matrix.map(row => row.map(() => 0.5));
		}
	}
	
	showLoader() {
		this.isLoading = true;
		const loader = document.createElement('div');
		loader.className = 'loader';
		loader.innerHTML = '<div class="loader-spinner"></div>';
		document.body.appendChild(loader);
	}
	
	hideLoader() {
		this.isLoading = false;
		const loader = document.querySelector('.loader');
		if (loader) {
			loader.style.opacity = '0';
			setTimeout(() => {
				loader.remove();
			}, 250);
		}
	}
	
	showNotification(message, duration = 3000) {
		// Eliminar notificación existente
		const existingNotification = document.querySelector('.notification');
		if (existingNotification) {
			existingNotification.remove();
		}
		
		// Crear nueva notificación
		const notification = document.createElement('div');
		notification.className = 'notification';
		notification.textContent = message;
		document.body.appendChild(notification);
		
		// Mostrar notificación
		setTimeout(() => {
			notification.classList.add('show');
		}, 10);
		
		// Ocultar notificación después de la duración
		setTimeout(() => {
			notification.classList.remove('show');
			setTimeout(() => {
				notification.remove();
			}, 300);
		}, duration);
	}
	
	decodeUrlParam(param) {
		if (typeof param !== "string") return null;

		try {
			while (param !== decodeURIComponent(param)) {
				param = decodeURIComponent(param);
			}
			return param;
		} catch (e) {
			console.warn("No se pudo parsear como JSON:", e);
			return null;
		}
	}

	async loadMatrixData() {
		let raw = this.getUrlParameter("urlRowsIframe");
		let parsedMatrix;

		if (typeof raw === "string") {
			try {
				while (raw !== decodeURIComponent(raw)) raw = decodeURIComponent(raw);
				parsedMatrix = JSON.parse(raw);
			} catch (e) {
				console.warn("No se pudo parsear 'urlRowsIframe' como JSON:", e);
			}
		} else {
			parsedMatrix = raw;
		}

		if (!parsedMatrix) parsedMatrix = window.urlRowsIframe;

		this.matrix = this.sanitizeDynamicMatrixEntry(parsedMatrix);
		this.matrixStack = [this.matrix];
	}

	// Inicializar la ruta jerárquica basada en el hash
	initializeHierarchyPath() {
		this.hierarchyPath = [];
		
		// Si hay un hash del padre, procesarlo
		if (this.parentHash) {
			// Dividir el hash por | para obtener cada nivel
			const positions = this.parentHash.split('|');
			
			// Procesar cada posición y añadirla a la ruta jerárquica
			for (let i = 0; i < positions.length; i++) {
				const [x, y] = positions[i].split(',').map(Number);
				if (!isNaN(x) && !isNaN(y)) {
					this.hierarchyPath.push({ x, y, depth: i });
				}
			}
		}
		
		// Añadir la posición actual
		this.hierarchyPath.push({
			x: this.currentPosition.x,
			y: this.currentPosition.y,
			depth: this.currentPosition.depth
		});
		
		console.log("Ruta jerárquica inicializada:", this.hierarchyPath);
	}
	
	createDefaultMatrix() {
		return [
			["https://example.com", "https://example.org"],
			["https://example.com", "https://example.com"]
		];
	}
	
	async loadMatrix(url) {
		try {
			// Detectar si estamos en un contexto de archivo local (file:///)
			const isFileProtocol = window.location.protocol === 'file:';
			
			// Para URLs y rutas relativas
			if (url.startsWith("http://") || url.startsWith("https://") || 
				url.startsWith("/") || url.startsWith("./") || 
				(isFileProtocol && (url.startsWith("file://") || !url.match(/^[a-z]+:\/\//i)))) {
				
				// Si estamos en protocolo file:// y es una ruta relativa, construimos la ruta completa
				if (isFileProtocol && !url.startsWith("file://") && !url.startsWith("http")) {
					// Obtener el directorio base del HTML actual
					const basePath = window.location.pathname.substring(0, window.location.pathname.lastIndexOf('/') + 1);
					// Eliminar cualquier ./ inicial para evitar duplicación
					const cleanUrl = url.startsWith('./') ? url.substring(2) : url;
					// Construir la ruta completa
					url = `${basePath}${cleanUrl}`;
				}
	
				try {
					// Intentar cargar con fetch primero
					const response = await fetch(url);
					if (!response.ok) {
						throw new Error(`HTTP error! status: ${response.status}`);
					}
					const data = await response.json();
	
					// Validar que la matriz sea válida
					if (!data.urlMatrix || !Array.isArray(data.urlMatrix) || data.urlMatrix.length === 0) {
						throw new Error("Invalid matrix format in JSON");
					}
	
					return data;
				} catch (fetchError) {
					console.warn("Fetch failed, trying XMLHttpRequest:", fetchError);
					// Si fetch falla (especialmente en file://), intentar con XMLHttpRequest
					if (isFileProtocol) {
						return await new Promise((resolve, reject) => {
							const xhr = new XMLHttpRequest();
							xhr.onload = () => {
								if (xhr.status === 200 || (isFileProtocol && xhr.status === 0)) {
									try {
										const parsedData = JSON.parse(xhr.responseText);
	
										// Validar que la matriz sea válida
										if (!parsedData.urlMatrix || !Array.isArray(parsedData.urlMatrix) || parsedData.urlMatrix.length === 0) {
											reject(new Error("Invalid matrix format in JSON"));
											return;
										}
	
										resolve(parsedData);
									} catch (error) {
										reject(new Error("Error parsing JSON"));
									}
								} else {
									reject(new Error(`Failed to load file: ${xhr.status}`));
								}
							};
							xhr.onerror = () => {
								reject(new Error("Network error or file access denied"));
							};
							xhr.open("GET", url);
							xhr.send();
						});
					} else {
						// Si no estamos en file://, propagar el error original
						throw fetchError;
					}
				}
			} else {
				// Si no es una URL válida, lanzamos un error
				throw new Error("Invalid URL format. URL must start with http://, https://, file://, / or ./");
			}
		} catch (error) {
			console.error("Error loading matrix:", error);
			// Devolver una matriz por defecto en caso de error
			return {
				urlMatrix: [["https://example.com"]],
				title: "Error Loading Matrix"
			};
		}
	}
	
	getBracketValue(bracket, depth = 0) {
		try {
			let value;
			// Si bracket es una cadena, intentamos analizarla como JSON
			if (typeof bracket === "string") {
				try {
					value = JSON.parse(bracket);
				} catch (e) {
					// Si no se puede analizar como JSON, verificamos si es una variable global
					if (typeof window[bracket] !== "undefined") {
						value = window[bracket];
					} else {
						// Si no existe como variable global, devolver una matriz por defecto
						console.warn(`No se pudo encontrar la matriz '${bracket}', usando matriz por defecto`);
						return this.createDefaultMatrix();
					}
				}
			}
			// Si ya es un objeto o array, lo usamos directamente
			else if (Array.isArray(bracket) || typeof bracket === "object") {
				value = bracket;
			}
			// Si no es ninguno de los casos anteriores, devolvemos una matriz por defecto
			else {
				console.warn("Valor de bracket inválido, usando matriz por defecto");
				return this.createDefaultMatrix();
			}

			// Validar que la matriz sea válida
			if (!Array.isArray(value)) {
				console.warn("Formato de matriz inválido, usando matriz por defecto");
				return this.createDefaultMatrix();
			}

			// Asegurarse de que cada fila sea un array
			value = this.normalizeMatrix(value);

			// Manejar la profundidad
			for (let i = 0; i < depth; i++) {
				if (Array.isArray(value) && value.length > 0) {
					if (Array.isArray(value[0])) {
						value = value[0];
					} else {
						break;
					}
				} else {
					break;
				}
			}

			return value;
		} catch (error) {
			console.error("Error parsing bracket value:", error);
			return this.createDefaultMatrix();
		}
	}
	
	detectCurrentDepth() {
		let depth = 0;
		let currentWindow = window;
		try {
			while (currentWindow !== window.top) {
				depth++;
				currentWindow = currentWindow.parent;
			}
		} catch (e) {
			// Si hay un error de seguridad al acceder a window.parent (por CORS)
			console.warn("Could not access parent window due to security restrictions. Assuming depth > 0.");
			depth = 1;
		}
		return depth;
	}
	
	getUrlParameter(name) {
		const params = new URLSearchParams(window.location.search);
		let paramValue = params.get(name);
		
		if (name === "urlRowsIframe") {
			if (!paramValue) return window.urlRowsIframe;
	
			try {
				while (paramValue !== decodeURIComponent(paramValue)) {
					paramValue = decodeURIComponent(paramValue);
				}
				return JSON.parse(paramValue);
			} catch (e) {
				console.warn("Error al decodificar/parsing urlRowsIframe:", e);
				return window.urlRowsIframe;
			}
		}
	
		return paramValue;
	}

	
	parseUrlHash() {
		const hash = window.location.hash.substring(1);
		if (hash) {
			const lastPos = hash.split('|').pop();
			const [x, y] = lastPos.split(',').map(Number);
			return { x, y };
		} else {
			return { x: 0, y: 0 };
		}
	}

	
	checkUrlHash() {
		const pos = this.parseUrlHash();
		if (!pos) return;

		const currentMatrix = this.matrixStack[this.currentPosition.depth - this.initialDepth];
		if (currentMatrix && currentMatrix.length > 0) {
			const row = currentMatrix[pos.y] || [];
			const maxX = row.length - 1;
			const validX = Math.min(Math.max(0, pos.x), maxX);
			const validY = Math.min(Math.max(0, pos.y), currentMatrix.length - 1);

			this.currentPosition.x = validX;
			this.currentPosition.y = validY;

			this.updateIframeContainerPosition();
		}
	}

	
	// Método actualizado para el hash jerárquico invertido
	updateUrlHash() {
		const newHash = `${this.currentPosition.x},${this.currentPosition.y}`;
		window.location.hash = newHash;
	}

	
	navigate(dx, dy) {
		if (this.isLoading || this.animationInProgress) return;

		this.animationInProgress = true;
		this.hideAllButtons();

		const currentMatrix = this.matrixStack[this.currentPosition.depth - this.initialDepth];

		dx = Math.max(-1, Math.min(1, dx));
		dy = Math.max(-1, Math.min(1, dy));

		let newY = this.currentPosition.y + dy;
		if (newY < 0) newY = currentMatrix.length - 1;
		else if (newY >= currentMatrix.length) newY = 0;

		const row = currentMatrix[newY] || [];
		let newX = this.currentPosition.x + dx;
		if (newX < 0) newX = row.length - 1;
		else if (newX >= row.length) newX = 0;

		this.currentPosition.x = newX;
		this.currentPosition.y = newY;
		
		this.updateIframeContainerPosition();
		this.updateUrlHash();

		this.showNotification(`Posición: (${newX + 1}, ${newY + 1})`, 400);

		setTimeout(() => {
			this.animationInProgress = false;
			this.detectIframeColor(newX, newY);
			this.notifyNavigationObservers();
		}, 250);
	}

	
	updateIframeContainerPosition() {
		const container = document.querySelector('.iframe-container');
		if (container) {
			container.style.transform = `translate(-${this.currentPosition.x * 100}%, -${this.currentPosition.y * 100}%)`;
		}
		
		const currentMatrix = this.matrixStack[this.currentPosition.depth - this.initialDepth];
		const currentRow = currentMatrix[this.currentPosition.y] || [];

		const isSingleColumnRow = currentRow.length === 1;
		const isSingleRowMatrix = currentMatrix.length === 1;

		["left", "right"].forEach(edge => {
			const detector = document.querySelector(`.edge-detector.${edge}`);
			if (detector) {
				detector.style.display = !isSingleColumnRow ? "block" : "none";
			}
		});

		["top", "bottom"].forEach(edge => {
			const detector = document.querySelector(`.edge-detector.${edge}`);
			if (detector) {
				detector.style.display = !isSingleRowMatrix ? "block" : "none";
			}
		});
	}

	// Método para crear una URL para una submatriz
	createSubmatrixUrl(subarray, position) {
		const jsonSubarray = JSON.stringify(subarray); // NO lo envuelvas en [subarray]
	
		const url = new URL(window.location.href);
		url.search = ""; // Limpiar parámetros anteriores
		url.hash = "";   // Evitar arrastrar posición anterior
	
		url.searchParams.set("urlRowsIframe", jsonSubarray);
		url.searchParams.set("initialDepth", (this.currentPosition.depth + 1).toString());
	
		// Agregar acumulación de parentHash
		const targetHash = `${position.x},${position.y}`;
		const fullParentHash = this.parentHash
			? `${this.parentHash}|${targetHash}`
			: targetHash;
	
		url.searchParams.set("parentHash", fullParentHash);
	
		return url.toString();
	}
	


	isSubmatrixCandidate(cell) { return Array.isArray(cell) && cell.every(el => typeof el === "string" || Array.isArray(el)); }
	isNestedMatrixRow(row) { return Array.isArray(row) && row.some(cell => this.isSubmatrixCandidate(cell)); }

	handleCellClick(x, y) {
		const cell = this.matrix[y][x];
	
		if (this.isSubmatrixCandidate(cell)) {
			const url = this.createSubarrayUrl(cell, { x, y });
			window.open(url, "_self");
		} else if (typeof cell === "string") {
			window.open(cell, "_blank");
		}
	}

	goBackToParentMatrix() {
		if (this.isLoading || this.animationInProgress) return;

		// Validar si tenemos un parentHash acumulado con | y suficiente profundidad
		if (this.parentHash && this.parentHash.includes("|")) {
			const positions = this.parentHash.split("|");

			// Eliminar la última posición (actual) para volver al padre
			positions.pop();

			const newHash = positions.join("|");

			// Construir URL de regreso (manteniendo la matriz base)
			const returnUrl = new URL(window.location.pathname, window.location.origin);
			returnUrl.search = ""; // No recargar matriz nueva
			returnUrl.hash = newHash;

			this.showNotification("Volviendo a matriz anterior...", 1000);
			setTimeout(() => {
			window.location.href = returnUrl.toString();
			}, 300);

		} else if (this.currentPosition.depth > this.initialDepth) {
			// Si no hay parentHash acumulado pero estamos en subnivel, retroceder en stack
			this.matrixStack.pop();
			this.currentPosition.depth--;
			this.currentPosition.x = 0;
			this.currentPosition.y = 0;
			this.initLoadingStates();
			this.render();
			this.updateUrlHash();
			this.showNotification(`Retrocediendo a profundidad ${this.currentPosition.depth}`, 1000);
		} else {
			this.showNotification("Ya estás en la matriz raíz", 2000);
		}
	}

	
	// Método para detectar si una URL causaría un bucle infinito
	wouldCauseInfiniteLoop(url) {
		// Si la URL es la misma que la actual pero sin parámetros, podría causar un bucle
		const currentUrlBase = window.location.href.split('?')[0].split('#')[0];
		const urlBase = url.split('?')[0].split('#')[0];
		
		// Si la URL base es la misma y ya estamos en un iframe, prevenir el bucle
		if (urlBase === currentUrlBase && this.initialDepth > 0) {
			console.warn("Prevención de bucle infinito detectada:", url);
			return true;
		}
		return false;
	}
	
	hideAllButtons() {
		// Limpiar todos los timeouts pendientes
		Object.values(this.hideTimeouts).forEach(timeout => {
			clearTimeout(timeout);
		});
		this.hideTimeouts = {};
		
		// Ocultar todos los botones
		document.querySelectorAll('.nav-button.visible, .json-selector.visible, .theme-toggle.visible, .settings-button.visible, .settings-panel.visible').forEach(element => {
			element.classList.remove('visible');
		});
		
		// Ocultar todos los tooltips
		document.querySelectorAll('.tooltip').forEach(tooltip => {
			tooltip.style.opacity = '0';
		});
		
		// Desactivar todos los bordes
		this.activeEdges = {};
		
		// Ocultar panel de configuración
		this.settingsVisible = false;
	}
	
	toggleButtonsVisibility() {
		if (this.isLoading || this.animationInProgress) return;
		
		this.buttonsVisible = !this.buttonsVisible;
		this.updateButtonsVisibility();
		
		// Mostrar notificación
		this.showNotification(this.buttonsVisible ? "Botones visibles" : "Botones ocultos", 1500);
	}
	
	updateButtonsVisibility() {
		const buttons = document.querySelectorAll('.nav-button, .json-selector, .theme-toggle, .settings-button');
		
		if (this.buttonsVisible) {
			// Mostrar botones
			buttons.forEach(button => {
				button.classList.add('visible');
			});
		} else {
			// Ocultar botones
			buttons.forEach(button => {
				button.classList.remove('visible');
			});
		}
		
		// Actualizar el icono del botón de alternar
		const toggleButton = document.querySelector('.toggle-button');
		if (toggleButton) {
			toggleButton.innerHTML = this.buttonsVisible ? 
				'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none"></circle><circle cx="12" cy="12" r="4"></circle></svg>' : 
				'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none"></circle></svg>';
		}
		
		// Ocultar panel de configuración si los botones están ocultos
		if (!this.buttonsVisible) {
			this.settingsVisible = false;
			document.querySelector('.settings-panel')?.classList.remove('visible');
		}
	}
	
	toggleDarkMode() {
		if (this.isLoading || this.animationInProgress) return;
		
		this.darkMode = !this.darkMode;
		document.body.classList.toggle('light-mode', !this.darkMode);
		
		// Mostrar notificación
		this.showNotification(this.darkMode ? "Modo oscuro activado" : "Modo claro activado", 1500);
		
		// Actualizar el icono del botón
		const themeToggle = document.querySelector('.theme-toggle');
		if (themeToggle) {
			themeToggle.innerHTML = this.darkMode ? '☀️' : '🌙';
		}
	}
	
	toggleSettings() {
		if (this.isLoading || this.animationInProgress) return;
		
		this.settingsVisible = !this.settingsVisible;
		
		const settingsPanel = document.querySelector('.settings-panel');
		if (settingsPanel) {
			settingsPanel.classList.toggle('visible', this.settingsVisible);
		}
	}
	
	saveMatrix() {
		try {
			localStorage.setItem('urlMatrix', JSON.stringify(this.matrix));
			this.showNotification('Matriz guardada en localStorage', 2000);
		} catch (error) {
			console.error('Error saving matrix:', error);
			this.showNotification('Error al guardar la matriz', 2000);
		}
	}
	
	loadMatrix() {
		try {
			const savedMatrix = localStorage.getItem('urlMatrix');
			if (savedMatrix) {
				this.matrix = JSON.parse(savedMatrix);
				this.matrixStack = [this.matrix];
				this.currentPosition = { x: 0, y: 0, depth: this.initialDepth };
				this.initLoadingStates();
				this.render();
				this.updateUrlHash();
				this.showNotification('Matriz cargada desde localStorage', 2000);
			} else {
				this.showNotification('No hay matriz guardada en localStorage', 2000);
			}
		} catch (error) {
			console.error('Error loading matrix:', error);
			this.showNotification('Error al cargar la matriz', 2000);
		}
	}
	
	handleJsonLoaded(jsonData) {
		if (this.isLoading || this.animationInProgress) return;
		
		if (jsonData.urlMatrix) {
			this.animationInProgress = true;
			
			// Ocultar todos los botones y tooltips
			this.hideAllButtons();
			
			// Esperar a que termine la animación
			setTimeout(() => {
				this.matrix = jsonData.urlMatrix;
				this.matrixStack = [jsonData.urlMatrix];
				this.title = jsonData.title || "∞Iframes Matrix Viewer";
				this.currentPosition = { x: 0, y: 0, depth: this.initialDepth };
				
				// Inicializar estados de carga
				this.initLoadingStates();
				
				// Actualizar la interfaz
				this.render();
				
				// Resetear el hash al cargar una nueva matriz
				this.updateUrlHash();
				
				// Mostrar notificación
				this.showNotification(`Matriz cargada: ${this.title}`, 2000);
				
				// Permitir nuevas navegaciones después de la animación
				setTimeout(() => {
					this.animationInProgress = false;
					
					// Intentar detectar el color del iframe actual
					this.detectIframeColor(0, 0);
				}, 250);
			}, 500);
		} else {
			alert("El archivo JSON no contiene una matriz válida. Debe tener una propiedad 'urlMatrix'.");
		}
	}
	
	createTooltip(element, text) {
		const tooltip = document.createElement('div');
		tooltip.className = 'tooltip';
		tooltip.textContent = text;
		document.body.appendChild(tooltip);
		
		element.addEventListener('mouseenter', () => {
			if (!element.classList.contains('visible')) return;
			
			const rect = element.getBoundingClientRect();
			tooltip.style.left = `${rect.left + rect.width / 2 - tooltip.offsetWidth / 2}px`;
			tooltip.style.top = `${rect.top - tooltip.offsetHeight - 10}px`;
			tooltip.style.opacity = '1';
		});
		
		element.addEventListener('mouseleave', () => {
			tooltip.style.opacity = '0';
		});
		
		return tooltip;
	}
	
	setupEventListeners() {
		// Manejar teclas de navegación
		document.addEventListener('keydown', (e) => {
			if (this.isLoading || this.animationInProgress) return;
			
			switch (e.key) {
				case "ArrowLeft":
					this.navigate(-1, 0);
					break;
				case "ArrowRight":
					this.navigate(1, 0);
					break;
				case "ArrowUp":
					this.navigate(0, -1);
					break;
				case "ArrowDown":
					this.navigate(0, 1);
					break;
				case "Escape":
					if (this.currentPosition.depth > this.initialDepth) {
						this.exitNestedMatrix();
					}
					break;
				case "b":
					this.toggleButtonsVisibility();
					break;
				case "d":
					this.toggleDarkMode();
					break;
				default:
					break;
			}
		});
		
		// Manejar cambios en el hash de la URL
		window.addEventListener('hashchange', () => {
			this.checkUrlHash();
		});
		
		// Configurar el selector de JSON
		const jsonInput = document.getElementById('json-input');
		if (jsonInput) {
			jsonInput.addEventListener('change', (event) => {
				const file = event.target.files[0];
				if (file) {
					const reader = new FileReader();
					reader.onload = (e) => {
						try {
							const json = JSON.parse(e.target.result);
							this.handleJsonLoaded(json);
						} catch (error) {
							console.error("Error parsing JSON file:", error);
							alert("Error al leer el archivo JSON. Asegúrate de que es un archivo JSON válido.");
						}
					};
					reader.readAsText(file);
				}
			});
		}
		
		// Configurar los botones de navegación
		this.setupNavigationButtons();
		
		// Configurar los detectores de bordes
		this.setupEdgeDetectors();
		
		// Configurar el botón de alternar visibilidad
		const toggleButton = document.querySelector('.toggle-button');
		if (toggleButton) {
			toggleButton.addEventListener('click', () => this.toggleButtonsVisibility());
			this.createTooltip(toggleButton, 'Mostrar/Ocultar botones (b)');
		}
		
		// Configurar el botón de tema
		const themeToggle = document.querySelector('.theme-toggle');
		if (themeToggle) {
			themeToggle.addEventListener('click', () => this.toggleDarkMode());
			this.createTooltip(themeToggle, 'Cambiar tema (d)');
		}
		
		// Configurar el botón de configuración
		const settingsButton = document.querySelector('.settings-button');
		if (settingsButton) {
			settingsButton.addEventListener('click', () => this.toggleSettings());
			this.createTooltip(settingsButton, 'Configuración');
		}
		
		// Configurar botones del panel de configuración
		const saveButton = document.querySelector('.save-button');
		if (saveButton) {
			saveButton.addEventListener('click', () => this.saveMatrix());
		}
		
		const loadButton = document.querySelector('.load-button');
		if (loadButton) {
			loadButton.addEventListener('click', () => this.loadMatrix());
		}
		
		// Configurar escucha de mensajes para comunicación entre frames
		window.addEventListener('message', (event) => {
			this.handleIncomingMessage(event);
		});
		
		// Configurar eventos para la ruta jerárquica
		this.setupHierarchyPathEvents();
	}
	
	// Configurar eventos para la ruta jerárquica
	setupHierarchyPathEvents() {
		document.addEventListener('click', (e) => {
			if (e.target.closest('.hierarchy-path-item')) {
				const item = e.target.closest('.hierarchy-path-item');
				const depth = parseInt(item.dataset.depth);
				const x = parseInt(item.dataset.x);
				const y = parseInt(item.dataset.y);
				
				if (!isNaN(depth) && !isNaN(x) && !isNaN(y)) {
					this.navigateToHierarchyLevel(depth, x, y);
				}
			}
		});
	}
	
	// Navegar a un nivel específico de la jerarquía
	navigateToHierarchyLevel(depth, x, y) {
		if (this.isLoading || this.animationInProgress) return;
		
		// Si es el nivel actual, no hacer nada
		if (depth === this.currentPosition.depth) return;
		
		// Si es un nivel superior, salir de las matrices anidadas hasta ese nivel
		if (depth < this.currentPosition.depth) {
			// Construir un nuevo hash para navegar directamente a ese nivel
			let newHash = '';
			
			// Recorrer la ruta jerárquica hasta el nivel deseado
			for (let i = 0; i <= depth; i++) {
				const pos = this.hierarchyPath[i];
				if (pos) {
					if (newHash) newHash += '|';
					newHash += `${pos.x},${pos.y}`;
				}
			}
			
			// Navegar a la URL con el nuevo hash
			const returnUrl = new URL(window.location.pathname, window.location.origin);
			returnUrl.hash = newHash;
			
			// Mostrar notificación antes de navegar
			this.showNotification(`Navegando al nivel ${depth}...`, 1000);
			
			// Navegar después de un breve retraso
			setTimeout(() => {
				window.location.href = returnUrl.toString();
			}, 250);
		}
	}
	
	// Método para manejar mensajes entrantes
	handleIncomingMessage(event) {
		const data = event.data;
		
		// Verificar que sea un objeto y tenga un tipo
		if (!data || typeof data !== 'object' || !data.type) return;
		
		switch (data.type) {
			case 'NAVIGATE_COMMAND':
				// Comando para navegar
				if (data.action === 'navigate' && typeof data.dx === 'number' && typeof data.dy === 'number') {
					this.navigate(data.dx, data.dy);
				} else if (data.action === 'goToPosition' && typeof data.x === 'number' && typeof data.y === 'number') {
					this.goToPosition(data.x, data.y);
				} else if (data.action === 'exit') {
					this.exitNestedMatrix();
				}
				break;
				
			case 'MATRIX_DETECTION_REQUEST':
				// Solicitud para detectar si este frame contiene una matriz
				this.respondToMatrixDetection(event.source, data);
				break;
				
			case 'REQUEST_MATRIX_INFO':
				// Solicitud de información sobre la matriz actual
				this.sendMatrixInfo(event.source, data);
				break;
		}
	}
	
	// Responder a una solicitud de detección de matriz
	respondToMatrixDetection(source, request) {
		try {
			// Preparar respuesta con información sobre esta matriz
			const currentMatrix = this.matrixStack[this.currentPosition.depth - this.initialDepth];
			const response = {
				type: 'MATRIX_DETECTION_RESPONSE',
				responseToId: request.messageId,
				hasMatrix: true,
				dimensions: {
					width: currentMatrix[0].length,
					height: currentMatrix.length
				},
				currentPosition: { ...this.currentPosition },
				hasNestedMatrices: this.hasNestedMatrices(currentMatrix),
				depth: this.currentPosition.depth
			};
			
			// Enviar respuesta
			source.postMessage(response, '*');
		} catch (e) {
			console.error('Error respondiendo a detección de matriz:', e);
			// Enviar respuesta de error
			source.postMessage({
				type: 'MATRIX_DETECTION_RESPONSE',
				responseToId: request.messageId,
				hasMatrix: false,
				error: e.message
			}, '*');
		}
	}
	
	// Verificar si una matriz contiene matrices anidadas
	hasNestedMatrices(matrix) {
		if (!Array.isArray(matrix)) return false;
		
		// Función recursiva para buscar arrays anidados
		const hasNestedArray = (item, depth = 0) => {
			if (depth >= 3) return false; // Limitar profundidad de búsqueda
			
			if (Array.isArray(item)) {
				// Si algún elemento es un array,
				return item.some(subItem => Array.isArray(subItem)) || 
					item.some(subItem => hasNestedArray(subItem, depth + 1));
			}
			
			return false;
		};
		
		return hasNestedArray(matrix);
	}
	
	// Enviar información sobre la matriz actual
	sendMatrixInfo(source, request) {
		try {
			const currentMatrix = this.matrixStack[this.currentPosition.depth - this.initialDepth];
			source.postMessage({
				type: 'MATRIX_INFO_RESPONSE',
				responseToId: request.messageId,
				matrix: currentMatrix,
				currentPosition: { ...this.currentPosition },
				dimensions: {
					width: currentMatrix[0].length,
					height: currentMatrix.length
				}
			}, '*');
		} catch (e) {
			console.error('Error enviando información de matriz:', e);
		}
	}
	
	// Notificar a los observadores sobre la navegación
	notifyNavigationObservers() {
		try {
			// Notificar al padre si estamos en un iframe
			if (window !== window.top) {
				window.parent.postMessage({
					type: 'MATRIX_NAVIGATION_EVENT',
					position: {
						x: this.currentPosition.x,
						y: this.currentPosition.y,
						depth: this.currentPosition.depth
					},
					matrixId: window.frameElement ? window.frameElement.id : null
				}, '*');
			}
		} catch (e) {
			console.warn('Error notificando navegación:', e);
		}
	}
	
	setupNavigationButtons() {
		const currentMatrix = this.matrixStack[this.currentPosition.depth - this.initialDepth];
		
		// Verificar si la matriz tiene múltiples columnas o filas
		const hasMultipleColumns = currentMatrix && currentMatrix[0] && currentMatrix[0].length > 1;
		const hasMultipleRows = currentMatrix && currentMatrix.length > 1;
		
		// Calcular el desplazamiento basado en la profundidad
		const depth = this.currentPosition.depth;
		const offset = depth * 2.5; // Reducido a la mitad
		
		// Crear botones de navegación solo si son necesarios
		if (hasMultipleColumns) {
			// Botón izquierdo - más cerca del borde izquierdo
			const leftButton = document.createElement('button');
			leftButton.className = 'nav-button left';
			leftButton.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>';
			leftButton.style.left = `calc(5% + ${offset}px)`;
			leftButton.style.top = `50%`;
			leftButton.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				if (!this.animationInProgress) {
					this.handleEdgeClick('left');
				}
			});
			this.root.appendChild(leftButton);
			
			// Botón derecho - más cerca del borde derecho
			const rightButton = document.createElement('button');
			rightButton.className = 'nav-button right';
			rightButton.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>';
			rightButton.style.left = `calc(95% - ${offset}px)`;
			rightButton.style.top = `50%`;
			rightButton.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				if (!this.animationInProgress) {
					this.handleEdgeClick('right');
				}
			});
			this.root.appendChild(rightButton);
		}
		
		// Solo mostrar botones verticales si hay más de una fila
		if (hasMultipleRows) {
			// Botón arriba - más cerca del borde superior
			const upButton = document.createElement('button');
			upButton.className = 'nav-button up';
			upButton.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"></polyline></svg>';
			upButton.style.left = `50%`;
			upButton.style.top = `calc(5% + ${offset}px)`;
			upButton.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				if (!this.animationInProgress) {
					this.handleEdgeClick('top');
				}
			});
			this.root.appendChild(upButton);
			
			// Botón abajo - más cerca del borde inferior
			const downButton = document.createElement('button');
			downButton.className = 'nav-button down';
			downButton.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>';
			downButton.style.left = `50%`;
			downButton.style.top = `calc(95% - ${offset}px)`;
			downButton.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				if (!this.animationInProgress) {
					this.handleEdgeClick('bottom');
				}
			});
			this.root.appendChild(downButton);
		}
		
		// Botón de salida (solo si estamos en una matriz anidada)
		if (this.currentPosition.depth > this.initialDepth || this.getUrlParameter("parentHash")) {
			const exitButton = document.createElement('button');
			exitButton.className = 'nav-button exit';
			exitButton.innerHTML = '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
			exitButton.style.left = `6vh`;
			exitButton.style.top = `6vh`;
			exitButton.style.opacity = `0.25`;
			exitButton.style.pointerEvents = `auto`; 
			exitButton.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				if (!this.animationInProgress) {
					this.exitNestedMatrix();
				}
			});
			this.root.appendChild(exitButton);
			this.createTooltip(exitButton, 'Salir de matriz anidada (Esc)');
		}
	}
	
	setupEdgeDetectors() {
		// Configurar los detectores de bordes
		document.querySelectorAll('.edge-detector').forEach(detector => {
			const edge = detector.classList[1]; // top, right, bottom, left, top-left, etc.
			
			detector.addEventListener('mouseenter', () => {
				if (this.isLoading || this.animationInProgress) return;
				
				// Activar este borde
				this.activeEdges[edge] = true;
				
				// Mostrar los botones correspondientes
				this.showEdgeButtons(edge);
			});
			
			detector.addEventListener('mouseleave', () => {
				if (this.isLoading || this.animationInProgress) return;
				
				// Desactivar este borde
				this.activeEdges[edge] = false;
				
				// Solo ocultar los botones si no estamos en modo "botones visibles"
				if (!this.buttonsVisible) {
					// Dar un pequeño tiempo para que el ratón pueda moverse a los botones
					setTimeout(() => {
						if (!this.activeEdges[edge]) {
							this.hideEdgeButtons(edge);
						}
					}, 100); // Aumentado para dar más tiempo
				}
			});
			
			detector.addEventListener('click', (e) => {
				e.preventDefault();
				e.stopPropagation();
				if (this.isLoading || this.animationInProgress) return;
				
				// Navegar según el borde
				this.handleEdgeClick(edge);
			});
		});
	}
	
	getButtonsForEdge(edge) {
		const currentMatrix = this.matrixStack[this.currentPosition.depth - this.initialDepth];
		if (!currentMatrix) return [];
		
		const hasMultipleColumns = currentMatrix[0] && currentMatrix[0].length > 1;
		const hasMultipleRows = currentMatrix.length > 1;
		
		switch (edge) {
			case 'left':
				return hasMultipleColumns ? ['left'] : [];
			case 'right':
				return hasMultipleColumns ? ['right'] : [];
			case 'top':
				return hasMultipleRows ? ['up'] : [];
			case 'bottom':
				return hasMultipleRows ? ['down'] : [];
			case 'top-left':
				return [
					...(hasMultipleRows ? ['up'] : []),
					...(hasMultipleColumns ? ['left'] : [])
				];
			case 'top-right':
				return [
					...(hasMultipleRows ? ['up'] : []),
					...(hasMultipleColumns ? ['right'] : []),
					'theme'
				];
			case 'bottom-left':
				return [
					...(hasMultipleRows ? ['down'] : []),
					...(hasMultipleColumns ? ['left'] : []),
					'settings',
					'json'
				];
			case 'bottom-right':
				return [
					...(hasMultipleRows ? ['down'] : []),
					...(hasMultipleColumns ? ['right'] : []),
					...(this.currentPosition.depth > this.initialDepth ? ['exit'] : [])
				];
			default:
				return [];
		}
	}
	
	showEdgeButtons(edge) {
		const buttons = this.getButtonsForEdge(edge);
		
		buttons.forEach(button => {
			if (button === 'left') {
				document.querySelector('.nav-button.left')?.classList.add('visible');
			} else if (button === 'right') {
				document.querySelector('.nav-button.right')?.classList.add('visible');
			} else if (button === 'up') {
				document.querySelector('.nav-button.up')?.classList.add('visible');
			} else if (button === 'down') {
				document.querySelector('.nav-button.down')?.classList.add('visible');
			} else if (button === 'exit') {
				document.querySelector('.nav-button.exit')?.classList.add('visible');
			} else if (button === 'theme') {
				document.querySelector('.theme-toggle')?.classList.add('visible');
			} else if (button === 'settings') {
				document.querySelector('.settings-button')?.classList.add('visible');
			} else if (button === 'json') {
				document.querySelector('.json-selector')?.classList.add('visible');
			}
		});
	}
	
	hideEdgeButtons(edge) {
		const buttons = this.getButtonsForEdge(edge);
		
		buttons.forEach(button => {
			if (button === 'left') {
				document.querySelector('.nav-button.left')?.classList.remove('visible');
			} else if (button === 'right') {
				document.querySelector('.nav-button.right')?.classList.remove('visible');
			} else if (button === 'up') {
				document.querySelector('.nav-button.up')?.classList.remove('visible');
			} else if (button === 'down') {
				document.querySelector('.nav-button.down')?.classList.remove('visible');
			} else if (button === 'exit') {
				document.querySelector('.nav-button.exit')?.classList.remove('visible');
			} else if (button === 'theme') {
				document.querySelector('.theme-toggle')?.classList.remove('visible');
			} else if (button === 'settings') {
				document.querySelector('.settings-button')?.classList.remove('visible');
			} else if (button === 'json') {
				document.querySelector('.json-selector')?.classList.remove('visible');
			}
		});
	}
	
	handleEdgeClick(edge) {
		if (this.isLoading || this.animationInProgress) return;
		
		const currentMatrix = this.matrixStack[this.currentPosition.depth - this.initialDepth];
		if (!currentMatrix) return;
		
		const hasMultipleColumns = currentMatrix[0] && currentMatrix[0].length > 1;
		const hasMultipleRows = currentMatrix.length > 1;
		
		switch (edge) {
			case 'left':
				if (hasMultipleColumns) this.navigate(-1, 0);
				break;
			case 'right':
				if (hasMultipleColumns) this.navigate(1, 0);
				break;
			case 'top':
				if (hasMultipleRows) this.navigate(0, -1);
				break;
			case 'bottom':
				if (hasMultipleRows) this.navigate(0, 1);
				break;
			case 'top-left':
				// Permitir movimiento diagonal
				if (hasMultipleColumns && hasMultipleRows) {
					this.navigate(-1, -1);
				} else if (hasMultipleColumns) {
					this.navigate(-1, 0);
				} else if (hasMultipleRows) {
					this.navigate(0, -1);
				}
				break;
			case 'top-right':
				// Permitir movimiento diagonal
				if (hasMultipleColumns && hasMultipleRows) {
					this.navigate(1, -1);
				} else if (hasMultipleColumns) {
					this.navigate(1, 0);
				} else if (hasMultipleRows) {
					this.navigate(0, -1);
				}
				break;
			case 'bottom-left':
				// Permitir movimiento diagonal
				if (hasMultipleColumns && hasMultipleRows) {
					this.navigate(-1, 1);
				} else if (hasMultipleColumns) {
					this.navigate(-1, 0);
				} else if (hasMultipleRows) {
					this.navigate(0, 1);
				}
				break;
			case 'bottom-right':
				// Permitir movimiento diagonal
				if (hasMultipleColumns && hasMultipleRows) {
					this.navigate(1, 1);
				} else if (hasMultipleColumns) {
					this.navigate(1, 0);
				} else if (hasMultipleRows) {
					this.navigate(0, 1);
				}
				break;
		}
	}
	
	handleIframeLoad(rowIndex, colIndex) {
		// Limpiar cualquier timeout pendiente
		if (this.loadingTimeouts && this.loadingTimeouts[rowIndex] && this.loadingTimeouts[rowIndex][colIndex]) {
			clearTimeout(this.loadingTimeouts[rowIndex][colIndex]);
		}
		
		// Actualizar el estado de carga
		if (this.loadingStates[rowIndex]) {
			this.loadingStates[rowIndex][colIndex] = false;
		}
		
		// Actualizar la opacidad del iframe
		if (this.iframeOpacities[rowIndex]) {
			this.iframeOpacities[rowIndex][colIndex] = 1;
			
			// Aplicar la opacidad al iframe
			const iframe = document.querySelector(`.iframe-cell[data-x="${colIndex}"][data-y="${rowIndex}"] iframe`);
			if (iframe) {
				iframe.style.opacity = '1';
			}
		}
		
		// Ocultar el indicador de carga
		const loadingIndicator = document.querySelector(`.iframe-cell[data-x="${colIndex}"][data-y="${rowIndex}"] .loading-indicator`);
		if (loadingIndicator) {
			loadingIndicator.style.display = 'none';
		}
		
		// Intentar detectar el color del iframe
		this.detectIframeColor(colIndex, rowIndex);
		
		// Iniciar detección de matrices anidadas
		this.detectNestedMatrix(rowIndex, colIndex);
	}
	
	handleIframeError(rowIndex, colIndex) {
		console.error(`Error loading iframe at position [${rowIndex}][${colIndex}]`);
		this.handleIframeLoad(rowIndex, colIndex);
	}
	
	// Método para detectar matrices anidadas en un iframe
	detectNestedMatrix(rowIndex, colIndex) {
		const iframe = document.querySelector(`.iframe-cell[data-x="${colIndex}"][data-y="${rowIndex}"] iframe`);
		if (!iframe) return;
		
		// Generar ID único para el iframe si no tiene
		if (!iframe.id) {
			iframe.id = `iframe_${rowIndex}_${colIndex}_${Math.random().toString(36).substring(2, 9)}`;
		}
		
		// Enviar mensaje al iframe para detectar si contiene una matriz
		try {
			iframe.contentWindow.postMessage({
				type: 'MATRIX_DETECTION_REQUEST',
				messageId: `detect_${Date.now()}`,
				source: 'IframeMatrixNavigator'
			}, '*');
		} catch (e) {
			console.warn(`No se pudo enviar mensaje al iframe [${rowIndex}][${colIndex}]:`, e);
		}
	}
	
	// Modificar la función applyIframeColor para aplicar el color exacto del body del iframe al iframe-cell
	applyIframeColor(x, y, color) {
		// Aplicar el color al wrapper del iframe
		const wrapper = document.querySelector(`.iframe-cell[data-x="${x}"][data-y="${y}"] .iframe-wrapper`);
		if (wrapper) {
			wrapper.style.backgroundColor = color;
			
			// Aplicar el mismo color exacto como fondo al iframe-cell
			const cell = document.querySelector(`.iframe-cell[data-x="${x}"][data-y="${y}"]`);
			if (cell) {
				// Aplicar el color exacto sin modificar la opacidad
				cell.style.backgroundColor = color;
				
				// Crear un borde sutil con el mismo color
				cell.style.boxShadow = `inset 0 0 0 ${this.calculateInset(this.currentPosition.depth)} ${color}`;
			}
		}
	}

	// Mejorar la función detectIframeColor para enfocarse más en obtener el color del body
	detectIframeColor(x, y) {
		try {
			// Obtener el iframe actual
			const iframe = document.querySelector(`.iframe-cell[data-x="${x}"][data-y="${y}"] iframe`);
			if (!iframe) return;
			
			// Crear un identificador único para este iframe
			const iframeId = `${x},${y}`;
			
			// Si ya tenemos un color para este iframe, usarlo
			if (this.iframeColors[iframeId]) {
				this.applyIframeColor(x, y, this.iframeColors[iframeId]);
				return;
			}
			
			// Intentar detectar el color del iframe cuando se cargue
			iframe.addEventListener('load', () => {
				try {
					// Intentar acceder al contenido del iframe (puede fallar por CORS)
					const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
					
					// Priorizar obtener el color de fondo del body
					const bodyStyle = window.getComputedStyle(iframeDoc.body);
					let bgColor = bodyStyle.backgroundColor;
					
					// Si el body no tiene un color de fondo definido, intentar con el elemento html
					if (!bgColor || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
						const htmlStyle = window.getComputedStyle(iframeDoc.documentElement);
						bgColor = htmlStyle.backgroundColor;
					}
					
					// Si aún no hay color, intentar con elementos principales
					if (!bgColor || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
						// Intentar obtener el color del primer elemento grande
						const elements = iframeDoc.querySelectorAll('body > div, body > main, body > section');
						for (let i = 0; i < elements.length; i++) {
							const element = elements[i];
							const style = window.getComputedStyle(element);
							if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent') {
								bgColor = style.backgroundColor;
								break;
							}
						}
					}
					
					// Si aún no hay color, usar un color por defecto
					if (!bgColor || bgColor === 'rgba(0, 0, 0, 0)' || bgColor === 'transparent') {
						bgColor = this.defaultBackgroundColor;
					}
					
					// Guardar y aplicar el color
					this.iframeColors[iframeId] = bgColor;
					this.applyIframeColor(x, y, bgColor);
				} catch (error) {
					console.warn("Error accessing iframe content (CORS):\n\t", error);
					
					// Usar color por defecto en caso de error CORS
					const bgColor = this.defaultBackgroundColor;
					
					// Guardar y aplicar el color
					this.iframeColors[iframeId] = bgColor;
					this.applyIframeColor(x, y, bgColor);
				}
			});
		} catch (error) {
			console.warn("Error detecting iframe color:", error);
		}
	}
	
	hashCode(str) {
		let hash = 0;
		for (let i = 0; i < str.length; i++) {
			hash = ((hash << 5) - hash) + str.charCodeAt(i);
			hash = hash & hash; // Convert to 32bit integer
		}
		return Math.abs(hash);
	}
	
	// Mejorar la función para verificar si un elemento es una matriz anidada
	isNestedMatrix(item) {
		// Verificar si es un array
		if (!Array.isArray(item)) return false;
		
		// Si es un array vacío, no es una matriz anidada
		if (item.length === 0) return false;
		
		// Caso 1: Es un array de arrays (matriz 2D)
		if (Array.isArray(item[0])) return true;
		
		// Caso 2: Contiene al menos un elemento que es un array
		if (item.some(element => Array.isArray(element))) return true;
		
		// Caso 3: Es un array de URLs (al menos 2 elementos)
		if (item.length >= 2 && item.every(element => 
			typeof element === 'string' && 
			(element.startsWith('http://') || element.startsWith('https://'))
		)) return true;
		
		// No es una matriz anidada
		return false;
	}
	
	// Método para calcular el inset basado en la profundidad
	calculateInset(depth) {
		// Iniciar desde 2vw/vh y aumentar con la profundidad
		return `${2 + depth * 0.5}vh`;
	}
	
	// Método para renderizar los detectores de bordes
	renderEdgeDetectors() {
		// Calcular el inset basado en la profundidad
		const inset = this.calculateInset(this.currentPosition.depth);
		
		// Crear los detectores de bordes
		const edges = ['top', 'right', 'bottom', 'left', 'top-left', 'top-right', 'bottom-left', 'bottom-right'];
		
		edges.forEach(edge => {
			const detector = document.createElement('div');
			detector.className = `edge-detector ${edge}`;
			detector.style.pointerEvents = 'auto'; // Asegurar que reciba eventos
			
			// Posicionar y dimensionar según el borde y el inset
			if (edge === 'top') {
				detector.style.top = '0';
				detector.style.left = '0';
				detector.style.right = '0';
				detector.style.height = inset;
			} else if (edge === 'bottom') {
				detector.style.bottom = '0';
				detector.style.left = '0';
				detector.style.right = '0';
				detector.style.height = inset;
			} else if (edge === 'left') {
				detector.style.left = '0';
				detector.style.top = '0';
				detector.style.bottom = '0';
				detector.style.width = inset;
			} else if (edge === 'right') {
				detector.style.right = '0';
				detector.style.top = '0';
				detector.style.bottom = '0';
				detector.style.width = inset;
			} else if (edge === 'top-left') {
				detector.style.top = '0';
				detector.style.left = '0';
				detector.style.width = inset;
				detector.style.height = inset;
			} else if (edge === 'top-right') {
				detector.style.top = '0';
				detector.style.right = '0';
				detector.style.width = inset;
				detector.style.height = inset;
			} else if (edge === 'bottom-left') {
				detector.style.bottom = '0';
				detector.style.left = '0';
				detector.style.width = inset;
				detector.style.height = inset;
			} else if (edge === 'bottom-right') {
				detector.style.bottom = '0';
				detector.style.right = '0';
				detector.style.width = inset;
				detector.style.height = inset;
			}
			
			this.root.appendChild(detector);
		});
	}
	
	// Método para ir a una posición específica
	goToPosition(x, y) {
		if (this.isLoading || this.animationInProgress) return;
		
		// Verificar que la posición sea válida
		const currentMatrix = this.matrixStack[this.currentPosition.depth - this.initialDepth];
		if (!currentMatrix || y >= currentMatrix.length || x >= currentMatrix[0].length) {
			console.warn(`Posición inválida: [${y}][${x}]`);
			return;
		}
		
		this.animationInProgress = true;
		
		// Actualizar posición
		this.currentPosition.x = x;
		this.currentPosition.y = y;
		
		// Actualizar la posición del contenedor de iframes
		this.updateIframeContainerPosition();
		
		// Actualizar el hash de la URL
		this.updateUrlHash();
		
		// Mostrar notificación
		this.showNotification(`Posición: (${x+1}, ${y+1})`, 1500);
		
		// Permitir nuevas navegaciones después de la animación
		setTimeout(() => {
			this.animationInProgress = false;
			
			// Intentar detectar el color del iframe actual
			this.detectIframeColor(x, y);
			
			// Notificar a los observadores
			this.notifyNavigationObservers();
		}, 500);
	}
	
	// Método para renderizar la ruta jerárquica
	renderHierarchyPath() {
		// Eliminar la ruta jerárquica existente
		const existingPath = document.querySelector('.hierarchy-path');
		if (existingPath) {
			existingPath.remove();
		}
		
		// Si no hay ruta jerárquica, no hacer nada
		if (!this.hierarchyPath || this.hierarchyPath.length === 0) return;
		
		// Crear el contenedor de la ruta jerárquica
		const pathContainer = document.createElement('div');
		pathContainer.className = 'hierarchy-path';
		
		// Añadir cada nivel a la ruta
		this.hierarchyPath.forEach((position, index) => {
			// Si no es el primer elemento, añadir separador
			if (index > 0) {
				const separator = document.createElement('span');
				separator.className = 'hierarchy-path-separator';
				separator.textContent = '>';
				pathContainer.appendChild(separator);
			}
			
			// Crear el elemento de la ruta
			const pathItem = document.createElement('div');
			pathItem.className = 'hierarchy-path-item';
			pathItem.dataset.depth = position.depth;
			pathItem.dataset.x = position.x;
			pathItem.dataset.y = position.y;
			pathItem.textContent = `${position.x+1},${position.y+1}`;
			
			// Añadir clase especial para el nivel actual
			if (position.depth === this.currentPosition.depth) {
				pathItem.style.backgroundColor = 'rgba(33, 150, 243, 0.5)';
			}
			
			pathContainer.appendChild(pathItem);
		});
		
		// Añadir la ruta al DOM
		document.body.appendChild(pathContainer);
	}
	
	// Método para renderizar los botones de navegación
	renderNavigationButtons() {
		const currentMatrix = this.matrixStack[this.currentPosition.depth - this.initialDepth];
		if (!currentMatrix) return;
		
		// Verificar si la matriz tiene múltiples columnas o filas
		const hasMultipleColumns = currentMatrix[0] && currentMatrix[0].length > 1;
		const hasMultipleRows = currentMatrix.length > 1;
		
		// Calcular el desplazamiento basado en la profundidad
		const depth = this.currentPosition.depth;
		const offset = depth * 2.5; // Reducido a la mitad
		
		// Crear botones de navegación solo si son necesarios
		if (hasMultipleColumns) {
			// Botón izquierdo - más cerca del borde izquierdo
			const leftButton = document.createElement('button');
			leftButton.className = 'nav-button left';
			leftButton.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"></polyline></svg>';
			
			leftButton.style.left = `calc(5% + ${offset}px)`;
			leftButton.style.top = `50%`;
			this.root.appendChild(leftButton);
			
			// Botón derecho - más cerca del borde derecho
			const rightButton = document.createElement('button');
			rightButton.className = 'nav-button right';
			rightButton.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"></polyline></svg>';
			rightButton.style.left = `calc(95% - ${offset}px)`;
			rightButton.style.top = `50%`;
			this.root.appendChild(rightButton);
		}
		
		// Solo mostrar botones verticales si hay más de una fila
		if (hasMultipleRows) {
			// Botón arriba - más cerca del borde superior
			const upButton = document.createElement('button');
			upButton.className = 'nav-button up';
			upButton.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"></polyline></svg>';
			upButton.style.left = `50%`;
			upButton.style.top = `calc(5% + ${offset}px)`;
			this.root.appendChild(upButton);
			
			// Botón abajo - más cerca del borde inferior
			const downButton = document.createElement('button');
			downButton.className = 'nav-button down';
			downButton.innerHTML = '<svg viewBox="0 0 24 24"><polyline points="6 9 12 15 18 9"></polyline></svg>';
			downButton.style.left = `50%`;
			downButton.style.top = `calc(95% - ${offset}px)`;
			this.root.appendChild(downButton);
		}
		
		// Botón de salida (solo si estamos en una matriz anidada)
		if (this.currentPosition.depth > this.initialDepth) {
			const exitButton = document.createElement('button');
			exitButton.className = 'nav-button exit';
			exitButton.innerHTML = '<svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
			exitButton.style.left = `20px`;
			exitButton.style.top = `20px`;
			this.root.appendChild(exitButton);
			this.createTooltip(exitButton, 'Salir de matriz anidada (Esc)');
		}
		
		// Añadir indicador de profundidad
		const depthIndicator = document.createElement('div');
		depthIndicator.className = 'depth-indicator';
		depthIndicator.textContent = `Nivel: ${this.currentPosition.depth}`;
		this.root.appendChild(depthIndicator);
	}

	iWrapperInsetSetter(iframeWrapper, inset) {
		iframeWrapper.style.top = !this.isSingleRowMatrix ? inset : "0";
		iframeWrapper.style.right = !this.isSingleColumnRow ? inset : "0";
		iframeWrapper.style.bottom = !this.isSingleRowMatrix ? inset : "0";
		iframeWrapper.style.left = !this.isSingleColumnRow ? inset : "0";
	}

	// Método principal para renderizar la interfaz
	render() {
		try {
			// Actualizar el título del documento
			document.title = this.title;
			
			// Limpiar el contenedor raíz
			this.root.innerHTML = '';
			
			// Obtener la matriz actual con verificación de seguridad
			const matrixIndex = this.currentPosition.depth - this.initialDepth;
			if (matrixIndex < 0 || matrixIndex >= this.matrixStack.length) {
				console.error("Índice de matriz inválido:", matrixIndex);
				this.showNotification("Error: Índice de matriz inválido", 3000);
				return;
			}

			const currentMatrix = this.matrixStack[matrixIndex];
			if (!currentMatrix || !Array.isArray(currentMatrix) || currentMatrix.length === 0) {
				console.error("Matriz inválida:", currentMatrix);
				this.showNotification("Error: Matriz inválida", 3000);
				return;
			}
			
			// Asegurarse de que la matriz tenga al menos una fila y una columna
			if (!Array.isArray(currentMatrix[0])) {
				currentMatrix[0] = [currentMatrix[0]];
			}
			
			// Crear el contenedor de iframes
			const iframeContainer = document.createElement('div');
			iframeContainer.className = 'iframe-container';
			iframeContainer.style.display = 'grid';
			iframeContainer.style.width = '100vw';
			iframeContainer.style.height = '100vh';
			
			// Calcular el inset basado en la profundidad
			const inset = this.calculateInset(this.currentPosition.depth);
			
			// Crear los iframes con wrapper para inset
			this.isSingleRowMatrix = currentMatrix.length === 1;
			for (let y = 0; y < currentMatrix.length; y++) {
				this.isSingleColumnRow = currentMatrix[y].length === 1;
				for (let x = 0; x < currentMatrix[y].length; x++) {
					const currentItem = currentMatrix[y][x];
					
					// Crear el contenedor de celda para el iframe
					const iframeCell = document.createElement('div');
					iframeCell.className = 'iframe-cell';
					iframeCell.dataset.x = x;
					iframeCell.dataset.y = y;
					iframeCell.style.gridColumn = x + 1;
					iframeCell.style.gridRow = y + 1;
					
					// Crear el wrapper para el iframe con inset dinámico basado en la profundidad
					const iframeWrapper = document.createElement('div');
					iframeWrapper.className = 'iframe-wrapper';
					this.iWrapperInsetSetter(iframeWrapper, inset);
					
					// Si es una matriz anidada, mostrar un contenedor especial
					if (this.isNestedMatrix(currentItem)) {
						// Crear contenedor para matriz anidada
						const nestedMatrixWithPreview = document.createElement('div');
						nestedMatrixWithPreview.className = 'nested-matrix-with-preview';
						
						// Crear la URL para la matriz anidada
						const url = this.createSubmatrixUrl(currentItem, {x, y});
						console.log(`Creando iframe para matriz anidada en [${y}][${x}]:`, url);
						
						// Crear el iframe principal
						const iframe = document.createElement('iframe');
						iframe.src = url;
						iframe.style.opacity = this.iframeOpacities[y]?.[x] || 0;
						iframe.style.pointerEvents = 'auto';
						
						// Añadir eventos de carga y error
						iframe.addEventListener('load', () => {
							console.log(`Iframe de matriz anidada en [${y}][${x}] cargado correctamente`);
							this.handleIframeLoad(y, x);
						});
						iframe.addEventListener('error', (e) => {
							console.error(`Error cargando iframe de matriz anidada en [${y}][${x}]:`, e);
							this.handleIframeError(y, x);
						});
						
						// Añadir indicador visual de matriz anidada
						const nestedIndicator = document.createElement('div');
						nestedIndicator.className = 'nested-matrix-indicator';
						nestedIndicator.innerHTML = '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>';
						nestedMatrixWithPreview.appendChild(nestedIndicator);
						
						// Crear overlay interactivo
						const overlay = document.createElement('div');
						overlay.className = 'nested-matrix-overlay';
						overlay.title = 'Ingresar a matriz anidada';
						overlay.innerHTML = '<svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>';
						
						// Añadir evento de clic para navegar a la matriz anidada
						overlay.addEventListener('click', (e) => {
							e.preventDefault();
							e.stopPropagation();
							if (!this.animationInProgress && !this.isLoading) {
								window.location.href = url;
							}
						});
						
						nestedMatrixWithPreview.appendChild(overlay);
						
						// Añadir indicador de carga
						const loadingIndicator = document.createElement('div');
						loadingIndicator.className = 'loading-indicator';
						loadingIndicator.innerHTML = '<div class="loading-spinner"></div>';
						nestedMatrixWithPreview.appendChild(loadingIndicator);
						
						// Añadir todo al wrapper
						iframeWrapper.appendChild(nestedMatrixWithPreview);
					} else {
						// Crear el iframe normal para elementos que no son matrices anidadas
						const iframe = document.createElement('iframe');
						
						// Asegurarse de que la URL sea una cadena
						let url = currentItem;
						
						// Si es un array pero no se considera una matriz anidada (puede ser un array de URLs),
						// crear una URL para cargar el mismo HTML con el subarray como parámetro
						if (Array.isArray(url)) {
							url = this.createSubmatrixUrl(url, {x, y});
						}
						
						// Si es una URL que causaría un bucle infinito, mostrar un mensaje en lugar de cargar el iframe
						if (typeof currentItem === 'string' && this.wouldCauseInfiniteLoop(currentItem)) {
							// Crear un div con un mensaje en lugar del iframe
							const infiniteLoopWarning = document.createElement('div');
							infiniteLoopWarning.className = 'nested-matrix-container';
							infiniteLoopWarning.innerHTML = `
								<div style="text-align: center; padding: 20px;">
									<h3>Prevención de bucle infinito</h3>
									<p>Esta URL causaría un bucle infinito de carga.</p>
									<p><code>${currentItem}</code></p>
								</div>
							`;
							iframeWrapper.appendChild(infiniteLoopWarning);
						} else {
							iframe.src = url;
							iframe.style.opacity = this.iframeOpacities[y]?.[x] || 0;
							iframe.style.pointerEvents = 'auto'; // Asegurar que el iframe reciba eventos
							
							// Añadir eventos de carga y error
							iframe.addEventListener('load', () => this.handleIframeLoad(y, x));
							iframe.addEventListener('error', () => this.handleIframeError(y, x));
							
							// Añadir indicador de carga si es necesario
							if (this.loadingStates[y]?.[x] && url !== 'about:blank' && url !== '') {
								const loadingIndicator = document.createElement('div');
								loadingIndicator.className = 'loading-indicator';
								loadingIndicator.innerHTML = '<div class="loading-spinner"></div>';
								iframeWrapper.appendChild(loadingIndicator);
							}
							iframeWrapper.appendChild(iframe);
						}
					}
					iframeCell.appendChild(iframeWrapper);
					iframeContainer.appendChild(iframeCell);
				}
			}
			
			this.root.appendChild(iframeContainer);
			
			// Crear los detectores de bordes
			this.renderEdgeDetectors();
			
			// Crear los botones de navegación
			//this.renderNavigationButtons();
			
			// Crear el botón de alternar visibilidad
			//this.renderToggleButton();
			
			// Crear el selector de JSON
			this.renderJsonSelector();
			
			// Crear el botón de tema
			this.renderThemeToggle();
			
			// Crear el botón de configuración y panel
			this.renderSettingsButton();
			
			// Renderizar la ruta jerárquica
			this.renderHierarchyPath();
			
			// Aplicar el modo oscuro/claro
			document.body.classList.toggle('light-mode', !this.darkMode);
			
			// Configurar eventos
			this.setupEventListeners();
			
			// Detectar colores para todos los iframes visibles
			this.detectAllIframeColors();
			
			// Inicializar el sistema de navegación jerárquica
			//this.initializeHierarchicalNavigation();
		} catch (error) {
			console.error("Error rendering interface:", error);
			this.root.innerHTML = `<p>Error rendering interface: ${error.message}</p>`;
		}
	}
	
	detectAllIframeColors() {
		const currentMatrix = this.matrixStack[this.currentPosition.depth - this.initialDepth];
		if (!currentMatrix) return;
		
		// Detectar colores para todos los iframes
		for (let y = 0; y < currentMatrix.length; y++) {
			for (let x = 0; x < currentMatrix[y].length; x++) {
				const currentItem = currentMatrix[y][x];
				
				// Solo detectar color si no es una matriz anidada
				if (!this.isNestedMatrix(currentItem)) {
					this.detectIframeColor(x, y);
				}
			}
		}
	}
	
	renderToggleButton() {
		const toggleButton = document.createElement('button');
		toggleButton.className = 'toggle-button';
		toggleButton.style.opacity = '0.5';
		toggleButton.innerHTML = this.buttonsVisible ? 
			'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none"></circle><circle cx="12" cy="12" r="4"></circle></svg>' : 
			'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="none"></circle></svg>';
		this.root.appendChild(toggleButton);
	}
	
	renderJsonSelector() {
		const jsonSelector = document.createElement('div');
		jsonSelector.className = 'json-selector';
		
		const jsonButton = document.createElement('label');
		jsonButton.htmlFor = 'json-input';
		jsonButton.className = 'json-button';
		jsonButton.textContent = '📁';
		
		const jsonInput = document.createElement('input');
		jsonInput.id = 'json-input';
		jsonInput.type = 'file';
		jsonInput.accept = '.json';
		jsonInput.className = 'json-input';
		
		jsonSelector.appendChild(jsonButton);
		jsonSelector.appendChild(jsonInput);
		
		this.root.appendChild(jsonSelector);
		
		// Crear tooltip
		this.createTooltip(jsonButton, 'Cargar matriz desde JSON');
	}
	
	renderThemeToggle() {
		const themeToggle = document.createElement('button');
		themeToggle.className = 'theme-toggle';
		themeToggle.innerHTML = this.darkMode ? '☀️' : '🌙';
		
		this.root.appendChild(themeToggle);
	}
	
	renderSettingsButton() {
		// Botón de configuración
		const settingsButton = document.createElement('button');
		settingsButton.className = 'settings-button';
		settingsButton.textContent = '⚙️';
		this.root.appendChild(settingsButton);
		
		// Panel de configuración
		const settingsPanel = document.createElement('div');
		settingsPanel.className = 'settings-panel';
		
		const buttonRow = document.createElement('div');
		buttonRow.className = 'settings-button-row';
		
		const saveButton = document.createElement('button');
		saveButton.className = 'save-button';
		saveButton.textContent = 'Guardar';
		
		const loadButton = document.createElement('button');
		loadButton.className = 'load-button';
		loadButton.textContent = 'Cargar';
		
		buttonRow.appendChild(saveButton);
		buttonRow.appendChild(loadButton);
		settingsPanel.appendChild(buttonRow);
		
		this.root.appendChild(settingsPanel);
	}
	
	// Add this new method to normalize matrices
	normalizeMatrix(matrix) {
		// Si no es un array, convertirlo en un array de un solo elemento
		if (!Array.isArray(matrix)) {
			return [[matrix]];
		}

		// Si es un array pero no contiene arrays, convertirlo en un array de un solo elemento
		if (!matrix.some(Array.isArray)) {
			return [matrix];
		}

		// Si ya es un array de arrays, asegurarse de que cada elemento sea un array
		return matrix.map(row => Array.isArray(row) ? row : [row]);
	}


	// Método para salir de una matriz anidada
	exitNestedMatrix() {
		if (this.isLoading || this.animationInProgress) return;
		
		// Si hay un parámetro parentHash, volver a la URL del padre
		const parentHash = this.getUrlParameter("parentHash");
		if (parentHash) {
			// Construir la URL de retorno
			const returnUrl = new URL(window.location.pathname, window.location.origin);
			
			// Añadir el hash del padre
			returnUrl.hash = parentHash;
			
			// Mostrar notificación antes de navegar
			this.showNotification("Volviendo a matriz padre...", 1000);
			
			// Navegar a la URL del padre después de un breve retraso
			setTimeout(() => {
				window.location.href = returnUrl.toString();
			}, 250);
		} else if (this.currentPosition.depth > this.initialDepth) {
			this.animationInProgress = true;
			
			// Ocultar todos los botones y tooltips
			this.hideAllButtons();
			
			// Esperar a que termine la animación
			setTimeout(() => {
				this.matrixStack.pop();
				this.currentPosition.x = 0;
				this.currentPosition.y = 0;
				this.currentPosition.depth--;
				
				// Inicializar estados de carga para la matriz anterior
				this.initLoadingStates();
				
				// Actualizar la interfaz
				this.render();
				
				// Resetear el hash al salir de una matriz anidada
				this.updateUrlHash();
				
				// Mostrar notificación
				this.showNotification("Saliendo a nivel " + this.currentPosition.depth, 2000);
				
				// Permitir nuevas navegaciones después de la animación
				setTimeout(() => {
					this.animationInProgress = false;
					
					// Intentar detectar el color del iframe actual
					this.detectIframeColor(0, 0);
					
					// Notificar a los observadores
					this.notifyNavigationObservers();
				}, 250);
			}, 500);
		}
	}
	
	// Método para sanitizar una matriz
	sanitizeMatrix(matrix) {
		// Si no es un array, retornar directamente
		if (!Array.isArray(matrix)) {
			console.warn("El dato proporcionado no es una matriz:", matrix);
			return matrix; // Devolver tal cual si no es un array
		}

		// Función recursiva para sanitizar elementos
		const sanitizeItem = (item) => {
			if (typeof item === 'string') {
				// Verificar si la URL podría causar un bucle infinito
				if (this.wouldCauseInfiniteLoop(item)) {
					console.warn("URL sanitizada para prevenir bucle infinito:", item);
					return "about:blank?infinite-loop-prevented=true";
				}
				return item;
			} else if (Array.isArray(item)) {
				return item.map(sanitizeItem); // Procesar arrays recursivamente
			}
			return item; // Otros tipos no se modifican
		};

		// Aplicar sanitización a la matriz completa
		return sanitizeItem(matrix);
	}

	isSubmatrixCandidate(cell) {
		return (
			Array.isArray(cell) &&
			cell.some(sub => Array.isArray(sub) && sub.every(el => typeof el === "string"))
		);
	}
	sanitizeDynamicMatrixEntry(entry) {
		if (!Array.isArray(entry)) return this.createDefaultMatrix();

		const result = [];
		let lastRow = null;

		for (let i = 0; i < entry.length; i++) {
			const item = entry[i];

			if (Array.isArray(item)) {
				if (this.isSubmatrixCandidate(item)) {
					// Detected nested matrix
					lastRow = [item];
					result.push(lastRow);
				} else {
					// Fila normal de URLs
					lastRow = item;
					result.push(lastRow);
				}
			} else if (typeof item === "string") {
				if (lastRow) {
					// Si hay fila previa, añadir el string como nuevo elemento
					lastRow.push(item);
				} else {
					// Si no hay fila previa, crear una nueva fila con el string
					lastRow = [item];
					result.push(lastRow);
				}
			}
		}

		return result;
	}


	// Inicializar el sistema de navegación jerárquica
	initializeHierarchicalNavigation() {
		// Crear un objeto para rastrear las matrices anidadas detectadas
		this.nestedMatrices = new Map();
		
		// Iniciar escaneo periódico de matrices anidadas
		this.startNestedMatrixDetection();
	}
	
	// Iniciar detección periódica de matrices anidadas
	startNestedMatrixDetection() {
		// Limpiar intervalo existente si hay
		if (this.nestedMatrixScanInterval) {
			clearInterval(this.nestedMatrixScanInterval);
		}
		
		// Escanear cada 2 segundos
		this.nestedMatrixScanInterval = setInterval(() => {
			this.scanForNestedMatrices();
		}, 2000);
		
		// Escaneo inicial
		this.scanForNestedMatrices();
	}
	
	// Escanear iframes en busca de matrices anidadas
	scanForNestedMatrices() {
		// Obtener todos los iframes visibles
		const iframes = Array.from(document.querySelectorAll('iframe'))
			.filter(iframe => {
				const rect = iframe.getBoundingClientRect();
				return (
					rect.width > 0 &&
					rect.height > 0 &&
					rect.top < window.innerHeight &&
					rect.bottom > 0 &&
					rect.left < window.innerWidth &&
					rect.right > 0
				);
			});
		
		// Procesar cada iframe
		iframes.forEach(iframe => {
			// Generar ID único para el iframe si no tiene
			if (!iframe.id) {
				iframe.id = `iframe_${Math.random().toString(36).substring(2, 11)}`;
			}
			
			// Verificar si ya hemos detectado este iframe
			if (this.nestedMatrices.has(iframe.id)) {
				// Actualizar timestamp para saber que sigue activo
				const matrixInfo = this.nestedMatrices.get(iframe.id);
				matrixInfo.lastSeen = Date.now();
				return;
			}
			
			// Intentar comunicarse con el iframe
			try {
				iframe.contentWindow.postMessage({
					type: 'MATRIX_DETECTION_REQUEST',
					messageId: `detect_${Date.now()}`,
					source: 'IframeMatrixNavigator'
				}, '*');
			} catch (e) {
				console.warn(`No se pudo enviar mensaje al iframe ${iframe.id}:`, e);
			}
		});
		
		// Limpiar matrices inactivas
		this.cleanupInactiveMatrices();
	}
	
	// Limpiar matrices inactivas
	cleanupInactiveMatrices() {
		const now = Date.now();
		const inactiveThreshold = 10000; // 10 segundos
		
		for (const [iframeId, matrixInfo] of this.nestedMatrices.entries()) {
			if (now - matrixInfo.lastSeen > inactiveThreshold) {
				this.nestedMatrices.delete(iframeId);
			}
		}
	}
}

// Clase para el sistema de navegación centralizada
class CentralNavigation {
	constructor() {
		this.iframes = []; // Almacena referencias a los iframes
		this.depths = {}; // Almacena la profundidad de cada iframe
		this.setupEventListeners();
	}

	// Registrar un iframe en el sistema
	registerIframe(iframeId, depth) {
		const iframe = document.getElementById(iframeId);
		if (iframe) {
			this.iframes.push({
				id: iframeId,
				element: iframe,
				depth: depth
			});
			this.depths[iframeId] = depth;
			console.log(`Iframe ${iframeId} registrado con profundidad ${depth}`);

			// Crear botones de navegación para este iframe
			this.createNavigationButtons(iframeId, depth);
		}
	}

	// Crear botones de navegación para un iframe específico
	createNavigationButtons(iframeId, depth) {
		const controlsContainer = document.getElementById('navigation-controls') || this.createControlsContainer();

		const iframeControls = document.createElement('div');
		iframeControls.className = `iframe-controls depth-${depth}`;
		iframeControls.innerHTML = `
			<div class="controls-header">Nivel ${depth}</div>
			<div class="controls-buttons">
				<button data-iframe="${iframeId}" data-action="navigate" data-x="-1" data-y="0">←</button>
				<button data-iframe="${iframeId}" data-action="navigate" data-x="1" data-y="0">→</button>
				<button data-iframe="${iframeId}" data-action="navigate" data-x="0" data-y="-1">↑</button>
				<button data-iframe="${iframeId}" data-action="navigate" data-x="0" data-y="1">↓</button>
				${depth > 0 ? `<button data-iframe="${iframeId}" data-action="exit">Salir</button>` : ''}
			</div>
		`;

		controlsContainer.appendChild(iframeControls);
	}

	// Crear el contenedor para los controles si no existe
	createControlsContainer() {
		const container = document.createElement('div');
		container.id = 'navigation-controls';
		container.className = 'navigation-controls-panel';
		document.body.appendChild(container);

		// Añadir estilos
		const style = document.createElement('style');
		style.textContent = `
			.navigation-controls-panel {
				position: fixed;
				top: 20px;
				right: 20px;
				background-color: rgba(0, 0, 0, 0.7);
				color: white;
				padding: 10px;
				border-radius: 8px;
				z-index: 10000;
				max-width: 300px;
			}
			
			.iframe-controls {
				margin-bottom: 10px;
				padding-bottom: 10px;
				border-bottom: 1px solid rgba(255, 255, 255, 0.3);
			}
			
			.controls-header {
				font-weight: bold;
				margin-bottom: 5px;
			}
			
			.controls-buttons {
				display: flex;
				flex-wrap: wrap;
				gap: 5px;
			}
			
			.controls-buttons button {
				padding: 5px 10px;
				background-color: rgba(255, 255, 255, 0.2);
				border: 1px solid rgba(255, 255, 255, 0.3);
				color: white;
				border-radius: 4px;
				cursor: pointer;
			}
			
			.controls-buttons button:hover {
				background-color: rgba(255, 255, 255, 0.3);
			}
			
			/* Colores diferentes para cada nivel */
			.depth-0 .controls-buttons button { border-color: #4caf50; }
			.depth-1 .controls-buttons button { border-color: #2196f3; }
			.depth-2 .controls-buttons button { border-color: #f44336; }
			.depth-3 .controls-buttons button { border-color: #ff9800; }
		`;
		document.head.appendChild(style);

		return container;
	}

	// Configurar los event listeners
	setupEventListeners() {
		// Delegación de eventos para los botones de navegación
		document.addEventListener('click', (event) => {
			const button = event.target.closest('button[data-iframe]');
			if (!button) return;

			const iframeId = button.dataset.iframe;
			const action = button.dataset.action;

			if (action === 'navigate') {
				const x = Number.parseInt(button.dataset.x);
				const y = Number.parseInt(button.dataset.y);
				this.navigateIframe(iframeId, x, y);
			} else if (action === 'exit') {
				this.exitNestedIframe(iframeId);
			}
		});

		// Escuchar mensajes de los iframes
		window.addEventListener('message', (event) => {
			// Verificar origen si es necesario
			// if (event.origin !== window.location.origin) return;

			const data = event.data;
			if (data.type === 'IFRAME_READY') {
				this.registerIframe(data.iframeId, data.depth);
			} else if (data.type === 'IFRAME_NAVIGATED') {
				console.log(`Iframe ${data.iframeId} navegó a posición (${data.position.x}, ${data.position.y})`);
				// Actualizar UI si es necesario
			}
		});
	}

	// Navegar un iframe específico
	navigateIframe(iframeId, x, y) {
		const iframe = this.iframes.find(iframe => iframe.id === iframeId);
		if (!iframe) return;

		iframe.element.contentWindow.postMessage({
			type: 'NAVIGATE',
			x: x,
			y: y
		}, '*');
	}

	// Salir de un iframe anidado
	exitNestedIframe(iframeId) {
		const iframe = this.iframes.find(iframe => iframe.id === iframeId);
		if (!iframe) return;

		iframe.element.contentWindow.postMessage({
			type: 'EXIT_NESTED'
		}, '*');
	}
}
	
// Inicializar la aplicación cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
	document.body.innerHTML = `<div id="root"></div>`;
	window.iframeMatrixViewer = new IframeMatrixViewer(document.getElementById('root'));
});
