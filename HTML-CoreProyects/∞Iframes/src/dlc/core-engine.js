/**
 * DLC Core Engine
 * Motor centralizado para extraer configuración de hash de URLs y emitir tiempos del reproductor.
 */
class DLCCoreEngine {
    constructor() {
        this.videos = new Map();
        this.defaultDuration = 90;
        this.knownDurations = new Map(); // Cache de duraciones por videoId
        this.init();
    }

    init() {
        console.log('DLC Core Engine - Inicializando...');

        // Escuchar la creación de iframes en la matriz
        document.addEventListener('matrixItemRendered', (e) => {
            const { element, url } = e.detail;
            this.processVideoElement(element, url);
        });

        // Escanear videos estáticos diferido (esperar a que todos los módulos DLC se registren)
        // Usar setTimeout para permitir que los listeners de los sub-módulos se activen primero
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                setTimeout(() => this.scanStaticVideos(), 100);
            });
        } else {
            setTimeout(() => this.scanStaticVideos(), 100);
        }

        // MutationObserver: detectar videos añadidos dinámicamente al DOM
        this.setupMutationObserver();
    }

    /**
     * Procesa un elemento de video (iframe o <video>) extrayendo su configuración de hash.
     * Método centralizado usado tanto por el evento matrixItemRendered como por scanStaticVideos.
     */
    processVideoElement(element, url) {
        if (!url || !element) return;

        // Evitar procesar el mismo elemento dos veces
        if (element._dlcProcessed) return;
        element._dlcProcessed = true;

        // Inyectar API de YouTube si es necesario (formatos: youtube.com, yout-ube.com, youtu.be)
        if (element.tagName === 'IFRAME' && (url.includes('youtube.com') || url.includes('yout-ube.com') || url.includes('youtu.be')) && !element.src.includes('enablejsapi=1')) {
            const sep = element.src.includes('?') ? '&' : '?';
            element.src = element.src.split('#')[0] + sep + 'enablejsapi=1' + (url.includes('#') ? '#' + url.split('#')[1] : '');
        }

        // Extraer hash puro. Ej: #op=[01:30]&loop=[05:00]
        if (url.includes('#')) {
            const hashPart = url.split('#')[1];
            if (hashPart) {
                // Convertimos la cadena en URLSearchParams para su fácil acceso
                const paramsStr = hashPart.replace(/;/g, '&');
                const params = new URLSearchParams(paramsStr);

                const config = this.parseConfig(params);
                if (config) {
                    const videoId = this.generateVideoId(element);

                    this.videos.set(videoId, {
                        element,
                        config,
                        videoId
                    });

                    console.log(`[DLC] Video configurado: ${videoId} →`, config);

                    // Despachar evento para informar a los sub-módulos que hay un nuevo video configurado
                    document.dispatchEvent(new CustomEvent('dlc:videoConfigured', {
                        detail: { videoId, element, config }
                    }));

                    this.setupTimeTracker(element, videoId, config);
                }
            }
        }
    }

    /**
     * Escanea el DOM en busca de videos estáticos con parámetros DLC:
     * - <iframe src="...#op=...&ed=..."> → extrae hash del atributo src
     * - <video data-video-params="op=...&ed=..."> → usa el atributo data
     */
    scanStaticVideos() {
        console.log('[DLC] Escaneando videos estáticos en el DOM...');

        // 1. Buscar iframes con hash en su src
        const iframes = document.querySelectorAll('iframe[src*="#"]');
        iframes.forEach(iframe => {
            const src = iframe.src || '';
            if (src.includes('#')) {
                this.processVideoElement(iframe, src);
            }
        });

        // 2. Buscar videos HTML5 con data-video-params
        const videos = document.querySelectorAll('video[data-video-params]');
        videos.forEach(video => {
            const params = video.getAttribute('data-video-params') || '';
            if (params) {
                // Simular URL con hash para reutilizar processVideoElement
                this.processVideoElement(video, `static#${params}`);
            }
        });

        console.log(`[DLC] Escaneo completado: ${this.videos.size} video(s) configurado(s)`);
    }

    /**
     * Observa el DOM para detectar videos añadidos dinámicamente
     * (ej: botón "Agregar Video" en video-demo.html)
     */
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue; // Solo elementos

                    // Si es un iframe con hash
                    if (node.tagName === 'IFRAME' && node.src && node.src.includes('#')) {
                        this.processVideoElement(node, node.src);
                    }

                    // Si es un video con data-video-params
                    if (node.tagName === 'VIDEO' && node.hasAttribute('data-video-params')) {
                        const params = node.getAttribute('data-video-params') || '';
                        this.processVideoElement(node, `static#${params}`);
                    }

                    // Buscar dentro del nodo añadido (ej: un div que contiene un iframe/video)
                    const childIframes = node.querySelectorAll ? node.querySelectorAll('iframe[src*="#"]') : [];
                    childIframes.forEach(iframe => {
                        this.processVideoElement(iframe, iframe.src);
                    });

                    const childVideos = node.querySelectorAll ? node.querySelectorAll('video[data-video-params]') : [];
                    childVideos.forEach(video => {
                        const params = video.getAttribute('data-video-params') || '';
                        this.processVideoElement(video, `static#${params}`);
                    });
                }
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });
        this._mutationObserver = observer;
    }

    generateVideoId(element) {
        if (element.id) return `video-${element.id}`;
        const src = element.src || element.getAttribute('src') || '';
        return `video-${Math.random().toString(36).substr(2, 9)}`;
    }

    parseConfig(params) {
        const duration = params.has('d') ? parseInt(params.get('d')) || this.defaultDuration : this.defaultDuration;
        const opTime = params.get('op');
        const edTime = params.get('ed');
        const loopTime = params.get('loop');
        const speedTime = params.get('speed');
        const muteTime = params.get('mute');
        const chTime = params.get('ch');

        // Si el hash está vacío o no tiene parámetros soportados
        if (!opTime && !edTime && !loopTime && !speedTime && !muteTime && !chTime) return null;

        return {
            duration,
            op: opTime ? this.parseTimeStr(opTime, duration, 'op') : null,
            ed: edTime ? this.parseTimeStr(edTime, duration, 'ed') : null,
            loop: loopTime ? this.parseTimeStr(loopTime, duration, 'loop') : null,
            speed: speedTime ? this.parseTimeStr(speedTime, duration, 'speed', true) : null,
            mute: muteTime ? this.parseTimeStr(muteTime, duration, 'mute') : null,
            chapters: chTime ? this.parseChapters(chTime) : null
        };
    }

    parseChapters(chStr) {
        // Formato esperado: Intro(00:00),Batalla(05:30)
        const chapters = [];
        const parts = chStr.split(',');
        for (const part of parts) {
            const match = part.trim().match(/^(.+)\((\d{1,2}:\d{1,2})\)$/);
            if (match) {
                const label = match[1];
                const timeStr = match[2];
                const [min, sec] = timeStr.split(':').map(Number);
                chapters.push({ label, time: min * 60 + sec });
            }
        }
        return chapters.length > 0 ? chapters : null;
    }

    /**
     * Parser flexible de tiempos. Soporta 8 formatos distintos:
     *
     * FORMATOS ABSOLUTOS (funcionan inmediatamente):
     *   1. [MM:SS-MM:SS]  → Rango exacto (ej: [01:31-03:01])
     *   2. [MM:SS]        → Desde MM:SS durante `duration` segundos (implícito)
     *   3. MM:SS+90s      → Desde MM:SS durante 90 segundos (explícito)
     *   4. MM:SS          → Punto fijo (start == end)
     *
     * FORMATOS RELATIVOS AL INICIO (se resuelven inmediatamente):
     *   5. +90 / start-90 → Primeros 90s del video: [0 - 90]
     *
     * FORMATOS RELATIVOS AL FINAL (se resuelven al conocer la duración):
     *   6. -90 / end-90   → Últimos 90s del video: [duration-90 - duration]
     *   7. [MM:SS-]       → Desde MM:SS hasta el final del video (open-ended)
     *   8. [-MM:SS]       → Desde el inicio hasta MM:SS (start-open)
     */
    parseTimeStr(timeStr, duration, type, expectsValue = false) {
        let cleanStr = timeStr;
        let value = null;

        // Extraer valor de velocidad si existe (ej. 1.5@[01:00])
        if (expectsValue && cleanStr.includes('@')) {
            const parts = cleanStr.split('@');
            value = parseFloat(parts[0]);
            cleanStr = parts[1];
        }

        const isAuto = cleanStr.startsWith('!');
        cleanStr = isAuto ? cleanStr.substring(1) : cleanStr;

        // Formato 5: Relativo al inicio (+90 o start-90) → [0 - 90]
        const startRelativeMatch = cleanStr.match(/^(?:start-)?\+(\d+)$/);
        if (startRelativeMatch) {
            const offset = parseInt(startRelativeMatch[1]);
            return {
                start: 0,
                end: offset,
                type: 'range',
                format: 'relative-start',
                auto: isAuto,
                originalType: type,
                relativeOffset: offset
            };
        }

        // Formato 6: Relativo al final (-90 o end-90) → [duration-90 - duration]
        const endRelativeMatch = cleanStr.match(/^(?:end-)?-(\d+)$/);
        if (endRelativeMatch) {
            const offset = parseInt(endRelativeMatch[1]);
            return {
                start: -offset,          // Negativo = relativo al final (se resuelve al conocer duración)
                end: 0,                   // 0 = final del video
                type: 'range',
                format: 'relative-end',
                auto: isAuto,
                originalType: type,
                relativeOffset: offset
            };
        }

        // Formato 7: [MM:SS-] → Desde MM:SS hasta el final (open-ended)
        const openEndMatch = cleanStr.match(/^\[(\d{1,2}):(\d{1,2})-\]$/);
        if (openEndMatch) {
            const startTime = parseInt(openEndMatch[1]) * 60 + parseInt(openEndMatch[2]);
            return {
                start: startTime,
                end: -1,                  // -1 = final del video (se resuelve al conocer duración)
                type: 'range',
                format: 'open-ended',
                auto: isAuto,
                originalType: type
            };
        }

        // Formato 8: [-MM:SS] → Desde inicio hasta MM:SS (start-open)
        const openStartMatch = cleanStr.match(/^\[-(\d{1,2}):(\d{1,2})\]$/);
        if (openStartMatch) {
            const endTime = parseInt(openStartMatch[1]) * 60 + parseInt(openStartMatch[2]);
            return {
                start: 0,
                end: endTime,
                type: 'range',
                format: 'start-open',
                auto: isAuto,
                originalType: type
            };
        }

        // Formatos 1-4: absolutos
        const parsed = this.parseExtendedTime(cleanStr, duration);
        if (parsed) {
            parsed.auto = isAuto;
            parsed.originalType = type;
            if (value !== null) parsed.value = value;
        }
        return parsed;
    }

    parseExtendedTime(timeStr, duration) {
        // Formato 1: [MM:SS-MM:SS]
        const exactMatch = timeStr.match(/^\[(\d{1,2}):(\d{1,2})-(\d{1,2}):(\d{1,2})\]$/);
        if (exactMatch) {
            const startTime = parseInt(exactMatch[1]) * 60 + parseInt(exactMatch[2]);
            const endTime = parseInt(exactMatch[3]) * 60 + parseInt(exactMatch[4]);
            if (endTime > startTime) return { start: startTime, end: endTime, type: 'range', format: 'exact' };
        }

        // Formato 2: [MM:SS] -> Implícito + duration
        const implicitMatch = timeStr.match(/^\[(\d{1,2}):(\d{1,2})\]$/);
        if (implicitMatch) {
            const startTime = parseInt(implicitMatch[1]) * 60 + parseInt(implicitMatch[2]);
            return { start: startTime, end: startTime + duration, type: 'range', format: 'implicit' };
        }

        // Formato 3: MM:SS+90s
        const explicitMatch = timeStr.match(/^(\d{1,2}):(\d{1,2})\+(\d+)s?$/);
        if (explicitMatch) {
            const startTime = parseInt(explicitMatch[1]) * 60 + parseInt(explicitMatch[2]);
            return { start: startTime, end: startTime + parseInt(explicitMatch[3]), type: 'range', format: 'explicit' };
        }

        // Formato 4: Punto fijo MM:SS
        if (timeStr.includes(':') && !timeStr.includes('[')) {
            const [min, sec] = timeStr.split(':').map(Number);
            return { start: min * 60 + sec, end: min * 60 + sec, type: 'point', format: 'fixed' };
        }

        return null;
    }

    setupTimeTracker(element, videoId, config) {
        const pollTime = () => {
            const currentTime = this.getCurrentTime(element);
            if (currentTime !== null) {
                // Resolver ED relativo si conocemos la duración
                this.resolveRelativeTimings(videoId, config, element);
                document.dispatchEvent(new CustomEvent('dlc:timeUpdate', {
                    detail: { videoId, element, config, currentTime }
                }));
            }
        };

        if (element.tagName === 'VIDEO') {
            element.addEventListener('timeupdate', pollTime);
            element.addEventListener('loadedmetadata', () => {
                this.knownDurations.set(videoId, element.duration);
                this.resolveRelativeTimings(videoId, config, element);
            });
        } else if (element.tagName === 'IFRAME') {
            // Para iframes cross-origin (YouTube, ok.ru, etc.), usar postMessage API
            this.setupIframeTimeTracking(element, videoId, config, pollTime);
        }
    }

    /**
     * Configura el seguimiento de tiempo para iframes cross-origin (YouTube, ok.ru, VK, etc.)
     * Usa la API postMessage del reproductor embebido.
     *
     * YouTube: requiere enviar 'listening' para suscribirse a infoDelivery, que trae
     *          currentTime/duration en data.info. Hacemos polling activo con
     *          getCurrentTime/getDuration como respaldo.
     */
    setupIframeTimeTracking(element, videoId, config, pollTime) {
        const src = element.src || '';
        const isYouTube = src.includes('youtube.com') || src.includes('yout-ube.com') || src.includes('youtu.be');
        const isOkRu = src.includes('ok.ru') || src.includes('mail.ru');

        // Escuchar respuestas de postMessage del reproductor (YouTube, ok.ru, etc.)
        window.addEventListener('message', (event) => {
            if (event.source !== element.contentWindow) return;

            let data = event.data;
            // Normalizar string JSON a objeto
            if (typeof data === 'string') {
                try { data = JSON.parse(data); } catch (e) { return; }
            }
            if (typeof data !== 'object' || data === null) return;

            // YouTube infoDelivery: envía currentTime/duration en data.info
            if (data.event === 'infoDelivery' && data.info) {
                if (data.info.currentTime !== undefined) {
                    element._dlcCurrentTime = parseFloat(data.info.currentTime);
                    pollTime();
                }
                if (data.info.duration !== undefined) {
                    const dur = parseFloat(data.info.duration);
                    if (dur > 0) {
                        this.knownDurations.set(videoId, dur);
                        this.resolveRelativeTimings(videoId, config, element);
                    }
                }
                return;
            }

            // ok.ru player response (method/data)
            if (data.method === 'getTime' && data.data !== undefined) {
                element._dlcCurrentTime = parseFloat(data.data);
                pollTime();
            } else if (data.method === 'getDuration' && data.data !== undefined) {
                const dur = parseFloat(data.data);
                this.knownDurations.set(videoId, dur);
                this.resolveRelativeTimings(videoId, config, element);
            }

            // Otros players que envían objetos directamente
            if (data.event === 'timeUpdate' && data.currentTime !== undefined) {
                element._dlcCurrentTime = data.currentTime;
                pollTime();
            }
            if (data.duration !== undefined) {
                this.knownDurations.set(videoId, data.duration);
                this.resolveRelativeTimings(videoId, config, element);
            }
        });

        // Polling: solicitar tiempo y duración periódicamente
        let pollCount = 0;
        const interval = setInterval(() => {
            if (!element.contentWindow) return;
            try {
                if (isYouTube) {
                    // YouTube: comando 'listening' + getCurrentTime/getDuration
                    element.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
                    element.contentWindow.postMessage(JSON.stringify({
                        event: 'command', func: 'getCurrentTime', args: []
                    }), '*');
                    element.contentWindow.postMessage(JSON.stringify({
                        event: 'command', func: 'getDuration', args: []
                    }), '*');
                } else if (isOkRu) {
                    // ok.ru API
                    element.contentWindow.postMessage(JSON.stringify({ method: 'getTime' }), '*');
                    element.contentWindow.postMessage(JSON.stringify({ method: 'getDuration' }), '*');
                }
            } catch (e) { /* CORS */ }

            // Usar tiempo cacheado si existe
            if (element._dlcCurrentTime !== undefined) {
                pollTime();
            }

            // Tras 10 intentos (5s) sin duración, activar fallback con d= estimado
            pollCount++;
            if (pollCount === 10 && !this.knownDurations.has(videoId)) {
                this.fallbackRelativeTimings(videoId, config, element);
            }
        }, 500);

        // Guardar referencia para limpieza
        element._dlcInterval = interval;
    }

    /**
     * Resuelve timings relativos cuando se conoce la duración del video.
     * Soporta 3 formatos pendientes de resolución:
     *   - relative-end:   [duration-offset - duration]
     *   - open-ended:     [start - duration]
     *   - duration-unknown fallback para relative-end usando `d=` como estimación
     */
    resolveRelativeTimings(videoId, config, element) {
        const duration = this.knownDurations.get(videoId);
        if (!duration) return;

        let needsRedispatch = false;

        // Resolver ED/OP relativo al final (format: relative-end)
        ['op', 'ed', 'loop'].forEach(key => {
            const item = config[key];
            if (item && item.format === 'relative-end') {
                const offset = item.relativeOffset;
                item.start = duration - offset;
                item.end = duration;
                item.format = 'resolved-relative';
                console.log(`[DLC] ${key.toUpperCase()} relativo resuelto: ${item.start.toFixed(0)}s - ${item.end.toFixed(0)}s (duración: ${duration}s)`);
                needsRedispatch = true;
            }
        });

        // Resolver rangos open-ended (format: open-ended, end === -1)
        ['op', 'ed', 'loop'].forEach(key => {
            const item = config[key];
            if (item && item.format === 'open-ended' && item.end === -1) {
                item.end = duration;
                item.format = 'resolved-open-ended';
                console.log(`[DLC] ${key.toUpperCase()} open-ended resuelto: ${item.start}s - ${item.end}s (duración: ${duration}s)`);
                needsRedispatch = true;
            }
        });

        // Re-despachar configuración actualizada si hubo cambios
        if (needsRedispatch) {
            document.dispatchEvent(new CustomEvent('dlc:videoConfigured', {
                detail: { videoId, element, config }
            }));
        }
    }

    /**
     * Fallback para relative-end cuando la duración no puede detectarse (CORS estricto).
     * Usa `d=` como estimación para calcular ED desde una posición conocida.
     * Solo se llama tras un timeout si knownDurations sigue vacío.
     */
    fallbackRelativeTimings(videoId, config, element) {
        if (this.knownDurations.has(videoId)) return; // Ya se resolvió

        const duration = config.duration || this.defaultDuration;
        console.warn(`[DLC] Duración no detectada, usando fallback d=${duration}s para ${videoId}`);

        ['op', 'ed', 'loop'].forEach(key => {
            const item = config[key];
            if (item && item.format === 'relative-end') {
                item.start = duration - item.relativeOffset;
                item.end = duration;
                item.format = 'fallback-relative';
                item.fallback = true;
            }
        });

        document.dispatchEvent(new CustomEvent('dlc:videoConfigured', {
            detail: { videoId, element, config }
        }));
    }

    getCurrentTime(element) {
        if (element.tagName === 'VIDEO') {
            return element.currentTime;
        } else if (element.tagName === 'IFRAME') {
            // Tiempo cacheado desde postMessage API (YouTube, ok.ru, etc.)
            if (element._dlcCurrentTime !== undefined) {
                return element._dlcCurrentTime;
            }

            // Fallback: intentar acceso directo (same-origin únicamente)
            try {
                const player = element.contentWindow.document?.querySelector('.html5-video-player, video');
                if (player && player.currentTime !== undefined) {
                    return player.currentTime;
                }
            } catch (e) {
                // Cross-Origin: usar postMessage (configurado en setupIframeTimeTracking)
            }
        }
        return null;
    }

    // Métodos globales para obligar saltos o estados (expuestos para módulos DLC)
    seekVideo(element, targetSeconds) {
        if (element.tagName === 'VIDEO') {
            element.currentTime = targetSeconds;
            element.play();
        } else if (element.tagName === 'IFRAME') {
            const src = element.src || '';

            // YouTube API (formatos: youtube.com, yout-ube.com, youtu.be)
            if (src.includes('youtube.com') || src.includes('yout-ube.com') || src.includes('youtu.be')) {
                element.contentWindow.postMessage(JSON.stringify({
                    event: 'command',
                    func: 'seekTo',
                    args: [targetSeconds, true]
                }), '*');
                element.contentWindow.postMessage(JSON.stringify({
                    event: 'command',
                    func: 'playVideo',
                    args: []
                }), '*');
            }
            // ok.ru / Mail.ru API
            else if (src.includes('ok.ru') || src.includes('mail.ru')) {
                element.contentWindow.postMessage(JSON.stringify({
                    method: 'seek',
                    data: targetSeconds
                }), '*');
                element.contentWindow.postMessage(JSON.stringify({
                    method: 'play'
                }), '*');
            }
            // VK API
            else if (src.includes('vk.com')) {
                element.contentWindow.postMessage(JSON.stringify({
                    type: 'player',
                    method: 'seek',
                    seconds: targetSeconds
                }), '*');
            }
            // Vimeo API
            else if (src.includes('vimeo.com')) {
                element.contentWindow.postMessage({
                    method: 'setCurrentTime',
                    value: targetSeconds
                }, '*');
            }
            // Generic fallback
            else {
                try {
                    element.contentWindow.postMessage({
                        method: 'seek',
                        time: targetSeconds
                    }, '*');
                } catch (e) { /* CORS */ }
            }

            // Actualizar tiempo cacheado
            element._dlcCurrentTime = targetSeconds;
        }
    }

    setVolume(element, muted) {
        if (element.tagName === 'VIDEO') {
            element.muted = muted;
        } else if (element.tagName === 'IFRAME') {
            // YouTube API (formatos: youtube.com, yout-ube.com, youtu.be)
            const src = element.src || '';
            if (src.includes('youtube.com') || src.includes('yout-ube.com') || src.includes('youtu.be')) {
                element.contentWindow.postMessage(JSON.stringify({
                    event: 'command',
                    func: muted ? 'mute' : 'unMute',
                    args: []
                }), '*');
            }
        }
    }

    setPlaybackRate(element, rate) {
        if (element.tagName === 'VIDEO') {
            element.playbackRate = rate;
        } else if (element.tagName === 'IFRAME') {
            // YouTube API (formatos: youtube.com, yout-ube.com, youtu.be)
            const src = element.src || '';
            if (src.includes('youtube.com') || src.includes('yout-ube.com') || src.includes('youtu.be')) {
                element.contentWindow.postMessage(JSON.stringify({
                    event: 'command',
                    func: 'setPlaybackRate',
                    args: [rate]
                }), '*');
            }
        }
    }
}

window.dlcCoreEngine = new DLCCoreEngine();