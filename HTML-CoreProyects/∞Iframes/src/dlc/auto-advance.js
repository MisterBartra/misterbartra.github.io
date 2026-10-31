/**
 * DLC Module: Auto Advance (Matrix Sequencer)
 * Permite que al llegar al final del video o durante el Ending (ED auto-skip),
 * la matriz de ∞Iframes avance automáticamente al siguiente punto (horizontal o vertical)
 * o a las coordenadas definidas por la variable 'next=[X,Y]' / 'step=[dx,dy]',
 * inicie la reproducción en el nuevo frame y sincronice sucesivamente a todos los módulos DLC.
 */
class AutoAdvanceDLC {
    constructor() {
        this.enabled = true;
        this.autoSkipOpOnArrival = true;
        this.defaultOpDuration = 90; // 90 segundos estándar para openings
        this.loopMatrix = false; // Bucle al llegar al final de toda la matriz
        this.flowDirection = 'horizontal'; // 'horizontal' (X+1) o 'vertical' (Y+1)
        this.advancedVideos = new Set();
        this.cooldown = false;
        this.currentCoords = { x: 0, y: 0 };
        this.init();
    }

    init() {
        console.log('[AutoAdvanceDLC] Módulo inicializado');

        // Escuchar timeUpdate desde el Core Engine
        document.addEventListener('dlc:timeUpdate', (e) => {
            if (!this.enabled || this.cooldown) return;
            const { videoId, element, config, currentTime } = e.detail;

            // Si el video se reinicia, permitir auto-avanzar de nuevo
            if (currentTime < 5 && this.advancedVideos.has(videoId)) {
                this.advancedVideos.delete(videoId);
            }

            this.checkEndingAndAdvance(videoId, element, config, currentTime);
        });

        // Escuchar evento videoEnded si se despacha
        document.addEventListener('dlc:videoEnded', (e) => {
            if (!this.enabled || this.cooldown) return;
            const detail = e.detail || {};
            this.triggerAdvance('Video finalizado (evento videoEnded)', detail.config || null, detail.element || null);
        });

        // Escuchar navegación en la matriz para mantener sincronizadas las coordenadas
        document.addEventListener('dlc:matrixNavigated', (e) => {
            if (e.detail && e.detail.to) {
                this.currentCoords = { ...e.detail.to };
            }
        });

        // Exponer en window para control desde UI/Panel
        window.autoAdvanceDLC = this;
    }

    setEnabled(val) {
        this.enabled = !!val;
        console.log(`[AutoAdvanceDLC] Estado auto-avance: ${this.enabled ? 'Activado' : 'Desactivado'}`);
    }

    setAutoSkipOpOnArrival(val) {
        this.autoSkipOpOnArrival = !!val;
    }

    setLoopMatrix(val) {
        this.loopMatrix = !!val;
    }

    setFlowDirection(dir) {
        this.flowDirection = (dir === 'vertical' || dir === 'v' || dir === 'down') ? 'vertical' : 'horizontal';
        console.log(`[AutoAdvanceDLC] Dirección de flujo establecida a: ${this.flowDirection}`);
    }

    /**
     * Evalúa si el video actual ha alcanzado el Ending o su finalización
     */
    checkEndingAndAdvance(videoId, element, config, currentTime) {
        if (this.advancedVideos.has(videoId)) return;

        let shouldAdvance = false;
        let reason = '';

        // 1. Detección por Ending configurado (ED)
        if (config && config.ed) {
            const ed = config.ed;
            if (currentTime >= ed.start && ed.start > 0) {
                // Si el tiempo actual está cerca del final del ED o si ED tiene auto
                if (ed.auto || (ed.end > 0 && currentTime >= ed.end - 2) || (currentTime >= ed.start + 5)) {
                    shouldAdvance = true;
                    reason = `Ending alcanzado (${currentTime.toFixed(0)}s >= ${ed.start.toFixed(0)}s)`;
                }
            }
        }

        // 2. Detección por duración total (últimos 3 segundos del video)
        if (!shouldAdvance && window.dlcCoreEngine && window.dlcCoreEngine.knownDurations) {
            const duration = window.dlcCoreEngine.knownDurations.get(videoId);
            if (duration && duration > 10 && currentTime >= duration - 3) {
                shouldAdvance = true;
                reason = `Final de video alcanzado (${currentTime.toFixed(0)}s / ${duration.toFixed(0)}s)`;
            }
        }

        if (shouldAdvance) {
            this.advancedVideos.add(videoId);
            this.triggerAdvance(reason, config, element);
        }
    }

    /**
     * Ejecuta el salto a la siguiente coordenada en ∞Iframes Matrix Viewer
     */
    triggerAdvance(reason = '', config = null, fromElement = null) {
        if (this.cooldown) return;
        this.cooldown = true;
        setTimeout(() => { this.cooldown = false; }, 2500); // Cooldown de 2.5s para evitar dobles saltos

        console.log(`[AutoAdvanceDLC] 🚀 Disparando avance: ${reason}`);

        // Pausar inmediatamente el video saliente si existe
        if (fromElement && window.dlcCoreEngine && typeof window.dlcCoreEngine.pauseVideo === 'function') {
            window.dlcCoreEngine.pauseVideo(fromElement);
        }

        const viewer = window.iframeMatrixViewer;
        if (!viewer) {
            console.warn('[AutoAdvanceDLC] IframeMatrixViewer no disponible en window.');
            return;
        }

        const currentMatrix = (viewer.matrixStack && viewer.matrixStack[viewer.currentPosition.depth - viewer.initialDepth]) || viewer.matrix;
        if (!currentMatrix || currentMatrix.length === 0) return;

        const { x, y } = viewer.currentPosition;
        const currentRow = currentMatrix[y] || [];

        let nextX, nextY;

        // 0. Si el video explícitamente deshabilitó el avance
        if (config && config.next && (config.next.auto === false || config.next.type === 'disabled')) {
            console.log('[AutoAdvanceDLC] Avance automático deshabilitado para este frame.');
            return;
        }

        // 1. Si la configuración del video especifica una coordenada 'next' absoluta [X, Y]
        if (config && config.next && config.next.type === 'absolute' && Array.isArray(config.next.target)) {
            [nextX, nextY] = config.next.target;
        }
        // 2. Si especifica un desplazamiento delta relativo [dx, dy]
        else if (config && config.next && config.next.type === 'delta' && Array.isArray(config.next.delta)) {
            const [dx, dy] = config.next.delta;
            nextX = x + dx;
            nextY = y + dy;
        }
        // 3. Secuencia sucesiva natural (Horizontal o Vertical):
        else {
            const isVerticalFlow = (config && config.next && (config.next.flow === 'vertical' || config.next.type === 'vertical')) ||
                                   (config && config.flow === 'vertical') ||
                                   this.flowDirection === 'vertical';

            if (isVerticalFlow) {
                // Recorrido vertical sensitivo: avanzar de arriba a abajo en la misma columna
                if (y + 1 < currentMatrix.length && currentMatrix[y + 1] && x < currentMatrix[y + 1].length) {
                    nextX = x;
                    nextY = y + 1;
                } else if (x + 1 < currentRow.length) {
                    // Fin de columna: saltar arriba de la siguiente columna horizontal
                    nextX = x + 1;
                    nextY = 0;
                } else {
                    // Fin de toda la matriz
                    if (this.loopMatrix) {
                        nextX = 0;
                        nextY = 0;
                        console.log('[AutoAdvanceDLC] 🔄 Bucle de matriz: reiniciando en [0, 0]');
                    } else {
                        console.log('[AutoAdvanceDLC] 🏁 Fin de la matriz vertical alcanzado.');
                        if (typeof viewer.showNotification === 'function') {
                            viewer.showNotification('🏁 Fin de la lista de episodios');
                        }
                        return;
                    }
                }
            } else {
                // Recorrido horizontal natural: avanzar fila a fila
                if (x + 1 < currentRow.length) {
                    // Siguiente columna en la misma fila
                    nextX = x + 1;
                    nextY = y;
                } else if (y + 1 < currentMatrix.length) {
                    // Siguiente fila, primera columna
                    nextX = 0;
                    nextY = y + 1;
                } else {
                    // Fin de toda la matriz
                    if (this.loopMatrix) {
                        nextX = 0;
                        nextY = 0;
                        console.log('[AutoAdvanceDLC] 🔄 Bucle de matriz: reiniciando en [0, 0]');
                    } else {
                        console.log('[AutoAdvanceDLC] 🏁 Fin de la matriz horizontal alcanzado.');
                        if (typeof viewer.showNotification === 'function') {
                            viewer.showNotification('🏁 Fin de la lista de episodios');
                        }
                        return;
                    }
                }
            }
        }

        // Validar y ajustar dentro de los límites de la matriz
        if (nextY >= currentMatrix.length) nextY = currentMatrix.length - 1;
        if (nextY < 0) nextY = 0;
        const targetRow = currentMatrix[nextY] || [];
        if (nextX >= targetRow.length) nextX = targetRow.length - 1;
        if (nextX < 0) nextX = 0;

        console.log(`[AutoAdvanceDLC] Avanzando de [${x}, ${y}] → [${nextX}, ${nextY}]`);

        if (typeof viewer.showNotification === 'function') {
            viewer.showNotification(`⏭️ Auto-avance [${nextX + 1}, ${nextY + 1}]`);
        }

        // Navegar a la siguiente posición en la matriz
        if (typeof viewer.goToPosition === 'function') {
            viewer.goToPosition(nextX, nextY);
        } else if (typeof viewer.navigate === 'function') {
            viewer.navigate(nextX - x, nextY - y);
        }

        this.currentCoords = { x: nextX, y: nextY };

        // Notificar a todos los módulos DLC del cambio de frame
        document.dispatchEvent(new CustomEvent('dlc:matrixNavigated', {
            detail: {
                from: { x, y },
                to: { x: nextX, y: nextY },
                currentPosition: viewer.currentPosition,
                reason: reason
            }
        }));

        // Programar la iniciación del nuevo video y el salto de Opening
        this.handleNewFrameArrival(nextX, nextY);
    }

    /**
     * Al llegar al nuevo cuadro bidimensional, asegura la reproducción del video activo
     * y pausa cualquier video en otras celdas.
     */
    handleNewFrameArrival(x, y) {
        // Dar tiempo a la animación de transición de la matriz (transform 0.5s)
        setTimeout(() => {
            const viewer = window.iframeMatrixViewer;
            if (!viewer) return;

            // Pausar cualquier otro video fuera de la celda activa para evitar solapamiento de audio
            document.querySelectorAll('.iframe-cell').forEach(cell => {
                const cellX = parseInt(cell.dataset.x);
                const cellY = parseInt(cell.dataset.y);
                if (cellX !== x || cellY !== y) {
                    const otherVideo = cell.querySelector('iframe, video');
                    if (otherVideo && window.dlcCoreEngine && typeof window.dlcCoreEngine.pauseVideo === 'function') {
                        window.dlcCoreEngine.pauseVideo(otherVideo);
                    }
                }
            });

            // Obtener datos del nuevo frame desde urlRowsIframe o matriz local
            let targetUrl = '';
            const matrix = (viewer.matrixStack && viewer.matrixStack[viewer.currentPosition.depth - viewer.initialDepth]) || viewer.matrix;
            if (matrix && matrix[y] && matrix[y][x]) {
                targetUrl = typeof matrix[y][x] === 'string' ? matrix[y][x] : '';
            }

            // Buscar el iframe o video en la celda activa
            const activeCell = document.querySelector(`.iframe-cell[data-x="${x}"][data-y="${y}"]`) ||
                document.querySelectorAll('.iframe-cell')[y * (matrix[0]?.length || 1) + x] ||
                document.querySelector('.iframe-cell');

            const videoElement = activeCell ? activeCell.querySelector('iframe, video') : null;

            if (videoElement) {
                this.initiateVideoAndSkipOp(videoElement, targetUrl);
            }
        }, 600);
    }

    /**
     * Inicia la reproducción en el nuevo frame y aplica el salto del Opening
     */
    initiateVideoAndSkipOp(element, url) {
        console.log(`[AutoAdvanceDLC] Inicializando frame en [${this.currentCoords.x}, ${this.currentCoords.y}]...`);

        // Asegurar que el nuevo reproductor comience a reproducirse
        if (window.dlcCoreEngine && typeof window.dlcCoreEngine.playVideo === 'function') {
            window.dlcCoreEngine.playVideo(element);
        }

        // Extraer configuración de OP si existe en la URL
        let opEnd = 0;
        let hasOp = false;

        const hashPart = url && url.includes('#') ? url.split('#')[1] : '';
        if (hashPart) {
            const params = new URLSearchParams(hashPart.replace(/;/g, '&'));
            const opParam = params.get('op');
            if (opParam) {
                hasOp = true;
                const clean = opParam.startsWith('!') ? opParam.substring(1) : opParam;
                // Formato [MM:SS-MM:SS] o [MM:SS] o MM:SS
                const rangeMatch = clean.match(/\[(\d{1,2}):(\d{1,2})-(\d{1,2}):(\d{1,2})\]/);
                if (rangeMatch) {
                    opEnd = parseInt(rangeMatch[3]) * 60 + parseInt(rangeMatch[4]);
                } else {
                    const singleMatch = clean.match(/\[?(\d{1,2}):(\d{1,2})\]?/);
                    if (singleMatch) {
                        const start = parseInt(singleMatch[1]) * 60 + parseInt(singleMatch[2]);
                        const d = parseInt(params.get('d')) || this.defaultOpDuration;
                        opEnd = start + d;
                    }
                }
            }
        }

        // Si autoSkipOpOnArrival está activo y hay OP configurado
        if (this.autoSkipOpOnArrival && hasOp && opEnd > 0) {
            console.log(`[AutoAdvanceDLC] ⏩ Auto-Skipping Opening: saltando a ${opEnd}s`);

            let attempts = 0;
            const attemptSkip = () => {
                attempts++;
                if (window.dlcCoreEngine && typeof window.dlcCoreEngine.seekVideo === 'function') {
                    window.dlcCoreEngine.seekVideo(element, opEnd);
                }
                if (attempts < 3) {
                    setTimeout(attemptSkip, 800);
                }
            };
            setTimeout(attemptSkip, 500);

            const viewer = window.iframeMatrixViewer;
            if (viewer && typeof viewer.showNotification === 'function') {
                const min = Math.floor(opEnd / 60);
                const sec = String(opEnd % 60).padStart(2, '0');
                viewer.showNotification(`⏩ Opening omitido (${min}:${sec})`);
            }
        }
    }
}

// Universal DLC Auto-Loader Wrapper
(window._dlcBoot = window._dlcBoot || function(init) {
    if (window.dlcCoreEngine) return init();
    if (!window._dlcWait) {
        window._dlcWait = true;
        const s = document.createElement('script');
        s.src = (document.currentScript ? document.currentScript.src.replace(/[^\/]+$/, '') : './src/dlc/') + 'core-engine.js';
        s.onload = () => { document.dispatchEvent(new CustomEvent('dlc:core')); init(); };
        document.head.appendChild(s);
    } else document.addEventListener('dlc:core', init, {once:true});
})(() => {
    window.autoAdvanceDLC = new AutoAdvanceDLC();
});
