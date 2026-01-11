/**
 * Video Skip Buttons DLC
 * Script independiente para agregar botones de salto de tiempo en videos embedidos
 * Compatible con ∞Iframes Matrix Viewer
 * 
 */
class VideoSkipButtons {
    constructor() {
        this.videos = new Map();
        this.buttons = new Map();
        this.observers = new Map();
        this.defaultDuration = 90; // segundos
        this.init();
    }

    init() {
        console.log('VideoSkipButtons DLC - Inicializando...');
        this.setupStyles();
        this.scanForVideos();
        this.setupMutationObserver();
        this.setupMessageListener();
    }

    /**
     * Configura los estilos CSS para los botones
     */
    setupStyles() {
        const styleId = 'video-skip-buttons-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            .video-skip-container {
                position: absolute;
                top: 10px;
                right: 10px;
                z-index: 9999;
                display: flex;
                gap: 8px;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
            }

            .video-skip-container.visible {
                opacity: 1;
                pointer-events: auto;
            }

            .video-skip-button {
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6));
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-radius: 6px;
                padding: 8px 12px;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.2s ease;
                backdrop-filter: blur(4px);
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                display: flex;
                align-items: center;
                gap: 4px;
                min-width: 80px;
                justify-content: center;
            }

            .video-skip-button:hover {
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.7));
                border-color: rgba(255, 255, 255, 0.5);
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }

            .video-skip-button:active {
                transform: translateY(0);
            }

            .video-skip-button .icon {
                width: 14px;
                height: 14px;
                fill: currentColor;
            }

            .video-skip-button.op-skip {
                background: linear-gradient(135deg, rgba(33, 150, 243, 0.8), rgba(33, 150, 243, 0.6));
            }

            .video-skip-button.ed-skip {
                background: linear-gradient(135deg, rgba(76, 175, 80, 0.8), rgba(76, 175, 80, 0.6));
            }

            .video-skip-button.op-skip:hover {
                background: linear-gradient(135deg, rgba(33, 150, 243, 0.9), rgba(33, 150, 243, 0.7));
            }

            .video-skip-button.ed-skip:hover {
                background: linear-gradient(135deg, rgba(76, 175, 80, 0.9), rgba(76, 175, 80, 0.7));
            }

            .video-skip-button.extended-skip {
                background: linear-gradient(135deg, rgba(255, 152, 0, 0.8), rgba(255, 152, 0, 0.6));
                border-color: rgba(255, 152, 0, 0.5);
                min-width: 120px;
                font-size: 11px;
            }

            .video-skip-button.extended-skip:hover {
                background: linear-gradient(135deg, rgba(255, 152, 0, 0.9), rgba(255, 152, 0, 0.7));
                border-color: rgba(255, 152, 0, 0.7);
            }

            .video-wrapper {
                position: relative;
            }

            .video-skip-info {
                position: absolute;
                bottom: 10px;
                left: 10px;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
                opacity: 0;
                transition: opacity 0.3s ease;
                pointer-events: none;
                z-index: 9998;
            }

            .video-skip-container.visible ~ .video-skip-info {
                opacity: 0.7;
            }
        `;
        document.head.appendChild(style);
    }

    /**
     * Escanea el DOM en busca de videos
     */
    scanForVideos() {
        // Buscar iframes que puedan contener videos
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach(iframe => this.processIframe(iframe));

        // Buscar elementos video directos
        const videos = document.querySelectorAll('video');
        videos.forEach(video => this.processVideo(video));

        // Buscar embeds de YouTube
        const youtubeEmbeds = document.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
        youtubeEmbeds.forEach(embed => this.processYouTubeEmbed(embed));
    }

    /**
     * Procesa un iframe para detectar si contiene video
     */
    processIframe(iframe) {
        try {
            const src = iframe.src || iframe.getAttribute('src');
            if (!src) return;

            // Verificar si es un iframe de video con parámetros
            const url = new URL(src, window.location.href);
            const params = url.searchParams;

            if (this.hasVideoParameters(params)) {
                this.setupVideoControls(iframe, params);
            }
        } catch (error) {
            console.warn('Error procesando iframe:', error);
        }
    }

    /**
     * Procesa un elemento video directo
     */
    processVideo(video) {
        try {
            // Obtener parámetros del contenedor padre o de la URL actual
            const params = this.getVideoParameters(video);
            if (params) {
                this.setupVideoControls(video, params);
            }
        } catch (error) {
            console.warn('Error procesando video:', error);
        }
    }

    /**
     * Procesa embeds de YouTube específicamente
     */
    processYouTubeEmbed(embed) {
        try {
            const src = embed.src || embed.getAttribute('src');
            const url = new URL(src, window.location.href);
            const params = url.searchParams;

            if (this.hasVideoParameters(params)) {
                this.setupVideoControls(embed, params);
            }
        } catch (error) {
            console.warn('Error procesando embed de YouTube:', error);
        }
    }

    /**
     * Verifica si los parámetros contienen configuración de video
     */
    hasVideoParameters(params) {
        return params.has('op') || params.has('ed') || params.has('_op') || params.has('ed_') || params.has('d');
    }

    /**
     * Obtiene los parámetros de video para un elemento
     */
    getVideoParameters(element) {
        // Intentar obtener parámetros del atributo data-video-params
        const dataParams = element.getAttribute('data-video-params');
        if (dataParams) {
            return new URLSearchParams(dataParams);
        }

        // Intentar obtener de la URL actual
        try {
            const url = new URL(window.location.href);
            if (this.hasVideoParameters(url.searchParams)) {
                return url.searchParams;
            }
        } catch (error) {
            // Ignorar error de URL
        }

        // Intentar obtener del src del elemento
        try {
            const src = element.src || element.getAttribute('src');
            if (src) {
                const url = new URL(src, window.location.href);
                if (this.hasVideoParameters(url.searchParams)) {
                    return url.searchParams;
                }
            }
        } catch (error) {
            // Ignorar error de URL
        }

        return null;
    }

    /**
     * Configura los controles de video para un elemento
     */
    setupVideoControls(element, params) {
        const videoId = this.generateVideoId(element);
        
        // Extraer parámetros
        const config = this.parseVideoParameters(params);
        
        // Guardar configuración
        this.videos.set(videoId, {
            element,
            config,
            isActive: false,
            timeUpdateListener: null
        });

        // Crear contenedor de botones
        this.createButtonContainer(element, videoId, config);

        // Configurar observador para detectar interacciones
        this.setupVideoObserver(element, videoId);
        
        // Configurar listener para verificar rango de tiempo
        this.setupTimeRangeListener(element, videoId, config);
    }

    /**
     * Genera un ID único para el video
     */
    generateVideoId(element) {
        if (element.id) {
            return `video-${element.id}`;
        }
        
        const src = element.src || element.getAttribute('src') || '';
        const hash = this.simpleHash(src + Math.random().toString(36));
        return `video-${hash}`;
    }

    /**
     * Función simple de hash
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    }

    /**
     * Parsea los parámetros de video con soporte extendido para op y ed
     */
    parseVideoParameters(params) {
        const duration = params.has('d') ? parseInt(params.get('d')) || this.defaultDuration : this.defaultDuration;
        const opTime = params.get('op');
        const edTime = params.get('ed');
        const opExtendedTime = params.get('_op');
        const edExtendedTime = params.get('ed_');

        // Si no hay ni op ni ed ni extendidos, no procesar este video
        if (!opTime && !edTime && !opExtendedTime && !edExtendedTime) {
            return null;
        }

        // Parsear op y ed con lógica corregida: corchetes → usa duration, sin corchetes → punto fijo
        let opParsed = null;
        let edParsed = null;

        if (opTime) {
            opParsed = this.parseTimeWithBrackets(opTime, duration);
        }

        if (edTime) {
            edParsed = this.parseTimeWithBrackets(edTime, duration);
        }

        return {
            duration,
            op: opParsed,
            ed: edParsed,
            opExtended: opExtendedTime ? this.parseExtendedTime(opExtendedTime, duration) : null,
            edExtended: edExtendedTime ? this.parseExtendedTime(edExtendedTime, duration) : null
        };
    }

    /**
     * Parsea tiempo con lógica de corchetes: corchetes → usa duration, sin corchetes → punto fijo
     */
    parseTimeWithBrackets(timeStr, duration) {
        // Si tiene corchetes, es un rango que usa duration
        if (timeStr.includes('[') || timeStr.includes(']')) {
            // Intentar parsear como rango extendido
            return this.parseExtendedTime(timeStr, duration);
        } else {
            // Si no tiene corchetes, es punto fijo
            return this.parseTime(timeStr);
        }
    }

    /**
     * Convierte tiempo en formato MM:SS o segundos a segundos absolutos
     * Para puntos fijos: op=01:30 es punto fijo, ed=22:00 es punto fijo
     */
    parseTime(timeStr) {
        // Si es formato MM:SS
        if (timeStr.includes(':')) {
            const [minutes, seconds] = timeStr.split(':').map(Number);
            return minutes * 60 + seconds;
        }
        
        // Si es un número, tratar como segundos desde el inicio
        const seconds = parseFloat(timeStr);
        if (!isNaN(seconds)) {
            return seconds;
        }
        
        return null;
    }

    /**
     * Función de utilidad estandarizada para parsear rangos de tiempo extendidos
     * Soporta los nuevos formatos simplificados sin márgenes
     */
    parseExtendedTime(timeStr, duration) {
        // Intentar parsear como rango exacto: [MM:SS-MM:SS]
        const rangeResult = this.parseExactRange(timeStr);
        if (rangeResult) return rangeResult;
        
        // Intentar parsear como rango implícito: [MM:SS] → [MM:SS-MM:SS+duration]
        const implicitResult = this.parseImplicitRange(timeStr, duration);
        if (implicitResult) return implicitResult;
        
        // Intentar parsear como formato con duración explícita: MM:SS+90s
        const explicitResult = this.parseExplicitRange(timeStr, duration);
        if (explicitResult) return explicitResult;
        
        return null;
    }

    /**
     * Parsea formato de rango exacto: [MM:SS-MM:SS]
     */
    parseExactRange(timeStr) {
        // Formato: [01:20-01:40] (sin prefijo)
        const match = timeStr.match(/^\[(\d{1,2}):(\d{1,2})-(\d{1,2}):(\d{1,2})\]$/);
        if (match) {
            const [, startMin, startSec, endMin, endSec] = match;
            const startTime = startMin * 60 + startSec;
            const endTime = endMin * 60 + endSec;
            
            // Validar que el rango sea válido
            if (endTime > startTime) {
                return {
                    start: startTime,
                    end: endTime,
                    type: 'range',
                    format: 'exact'
                };
            }
        }
        
        // Formato con prefijo: op=[01:20-01:40] o ed=[21:50-22:10] o _op=[01:20-01:40] o ed_=[21:50-22:10]
        const prefixedMatch = timeStr.match(/^(_?op|ed_?)=\[(\d{1,2}):(\d{1,2})-(\d{1,2}):(\d{1,2})\]$/);
        if (prefixedMatch) {
            const [, type, startMin, startSec, endMin, endSec] = prefixedMatch;
            const startTime = startMin * 60 + startSec;
            const endTime = endMin * 60 + endSec;
            
            // Validar que el rango sea válido
            if (endTime <= startTime) return null;
            
            return {
                start: startTime,
                end: endTime,
                type: type.includes('op') ? 'opExtended' : 'edExtended',
                format: 'exact'
            };
        }
        
        return null;
    }

    /**
     * Parsea formato de rango implícito: [MM:SS] → [MM:SS-MM:SS+duration]
     */
    parseImplicitRange(timeStr, duration) {
        // Formato: [01:30] (sin prefijo)
        const match = timeStr.match(/^\[(\d{1,2}):(\d{1,2})\]$/);
        if (match) {
            const [, minutes, seconds] = match;
            const startTime = minutes * 60 + seconds;
            const endTime = startTime + duration;
            
            return {
                start: startTime,
                end: endTime,
                type: 'range',
                format: 'implicit'
            };
        }
        
        // Formato con prefijo: op=[01:30] o ed=[22:00] o _op=[01:30] o ed_=[22:00]
        const prefixedMatch = timeStr.match(/^(_?op|ed_?)=\[(\d{1,2}):(\d{1,2})\]$/);
        if (!prefixedMatch) return null;
        
        const [, type, minutes, seconds] = prefixedMatch;
        const startTime = minutes * 60 + seconds;
        const endTime = startTime + duration;
        
        return {
            start: startTime,
            end: endTime,
            type: type.includes('op') ? 'opExtended' : 'edExtended',
            format: 'implicit'
        };
    }

    /**
     * Parsea formato con duración explícita: MM:SS+90s
     */
    parseExplicitRange(timeStr, duration) {
        // Formato: 00:00+90s o 01:30+90s (sin prefijo)
        const match = timeStr.match(/^(\d{1,2}):(\d{1,2})\+(\d+)s?$/);
        if (match) {
            const [, minutes, seconds, explicitDuration] = match;
            const startTime = minutes * 60 + seconds;
            const endTime = startTime + parseInt(explicitDuration);
            
            return {
                start: startTime,
                end: endTime,
                type: 'range',
                format: 'explicit'
            };
        }
        
        // Formato con prefijo: op=00:00+90s o ed=01:30+90s o _op=01:30+90s o ed_=22:00+90s
        const prefixedMatch = timeStr.match(/^(_?op|ed_?)=(\d{1,2}):(\d{1,2})\+(\d+)s?$/);
        if (!prefixedMatch) return null;
        
        const [, type, minutes, seconds, explicitDuration] = prefixedMatch;
        const startTime = minutes * 60 + seconds;
        const endTime = startTime + parseInt(explicitDuration);
        
        return {
            start: startTime,
            end: endTime,
            type: type.includes('op') ? 'opExtended' : 'edExtended',
            format: 'explicit'
        };
    }

    /**
     * Crea el contenedor de botones
     */
    createButtonContainer(element, videoId, config) {
        // Envolver el elemento si no está envuelto
        if (!element.parentElement.classList.contains('video-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'video-wrapper';
            wrapper.style.position = element.style.position || 'relative';
            
            element.parentNode.insertBefore(wrapper, element);
            wrapper.appendChild(element);
        }

        const wrapper = element.parentElement;
        
        // Crear contenedor de botones
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'video-skip-container';
        buttonContainer.id = `skip-buttons-${videoId}`;

        // Crear botón OP si existe
        if (config.op !== null) {
            const opButton = this.createSkipButton('op', config.op, videoId);
            buttonContainer.appendChild(opButton);
        }

        // Crear botón ED si existe
        if (config.ed !== null) {
            const edButton = this.createSkipButton('ed', config.ed, videoId);
            buttonContainer.appendChild(edButton);
        }

        // Crear botón OP extendido si existe
        if (config.opExtended && config.opExtended.type === 'opExtended') {
            const opExtButton = this.createExtendedSkipButton('op', config.opExtended, videoId);
            buttonContainer.appendChild(opExtButton);
        }

        // Crear botón ED extendido si existe
        if (config.edExtended && config.edExtended.type === 'edExtended') {
            const edExtButton = this.createExtendedSkipButton('ed', config.edExtended, videoId);
            buttonContainer.appendChild(edExtButton);
        }

        // Crear info
        const info = document.createElement('div');
        info.className = 'video-skip-info';
        info.textContent = this.generateInfoText(config);

        // Añadir al wrapper
        wrapper.appendChild(buttonContainer);
        wrapper.appendChild(info);

        // Guardar referencia
        this.buttons.set(videoId, {
            container: buttonContainer,
            info,
            buttons: {
                op: config.op !== null ? buttonContainer.querySelector('.op-skip') : null,
                ed: config.ed !== null ? buttonContainer.querySelector('.ed-skip') : null
            }
        });
    }

    /**
     * Crea un botón de salto
     */
    createSkipButton(type, targetTime, videoId) {
        const button = document.createElement('button');
        button.className = `video-skip-button ${type}-skip`;
        
        const icon = type === 'op' ? 
            '<svg class="icon" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>' :
            '<svg class="icon" viewBox="0 0 24 24"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg>';

        button.innerHTML = `${icon} ${this.formatTime(targetTime)}`;
        
        button.addEventListener('click', () => {
            this.skipToTime(videoId, targetTime);
        });

        return button;
    }

    /**
     * Crea un botón de salto extendido
     */
    createExtendedSkipButton(type, rangeConfig, videoId) {
        const button = document.createElement('button');
        button.className = `video-skip-button ${type}-skip extended-skip`;
        
        // Icono diferente para botones extendidos
        const icon = type === 'op' ? 
            '<svg class="icon" viewBox="0 0 24 24"><path d="M3 9l9-7-9 7v6l9-7z M21 9l-9-7 9 7v6l-9-7z"/></svg>' :
            '<svg class="icon" viewBox="0 0 24 24"><path d="M21 9l-9-7 9 7v6l-9-7z M3 9l9-7-9 7v6l9-7z"/></svg>';

        // Mostrar el rango completo en el botón
        const rangeText = `${this.formatTime(rangeConfig.start)}-${this.formatTime(rangeConfig.end)}`;
        button.innerHTML = `${icon} ${rangeText}`;
        button.title = `Saltar a rango extendido ${type}: ${rangeText}`;
        
        button.addEventListener('click', () => {
            // Para rangos extendidos, saltar al inicio del rango
            this.skipToTime(videoId, rangeConfig.start);
        });

        return button;
    }

    /**
     * Formatea tiempo en segundos a MM:SS
     */
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Genera texto informativo
     */
    generateInfoText(config) {
        const parts = [];
        
        if (config.op !== null) {
            parts.push(`OP: ${this.formatTime(config.op)}`);
        }
        
        if (config.ed !== null) {
            parts.push(`ED: ${this.formatTime(config.ed)}`);
        }
        
        if (parts.length === 0) {
            return config.duration ? `Duración: ${config.duration}s` : 'Video detectado';
        }
        
        return parts.join(' | ');
    }

    /**
     * Salta al tiempo especificado en el video
     */
    skipToTime(videoId, targetTime) {
        const videoData = this.videos.get(videoId);
        if (!videoData) return;

        const element = videoData.element;
        
        try {
            if (element.tagName === 'IFRAME') {
                // Para iframes (YouTube, etc.)
                this.skipIframeVideo(element, targetTime);
            } else if (element.tagName === 'VIDEO') {
                // Para elementos video directos
                element.currentTime = targetTime;
                element.play().catch(e => console.warn('Error al reproducir video:', e));
            }
            
            // Mostrar notificación
            this.showSkipNotification(targetTime);
        } catch (error) {
            console.error('Error al saltar al tiempo:', error);
        }
    }

    /**
     * Salta al tiempo en un iframe de video
     */
    skipIframeVideo(iframe, targetTime) {
        try {
            // Para YouTube
            if (iframe.src.includes('youtube.com') || iframe.src.includes('youtu.be')) {
                const message = {
                    event: 'command',
                    func: 'seekTo',
                    args: [targetTime, true]
                };
                iframe.contentWindow.postMessage(message, '*');
                
                // También intentar con el formato más reciente
                iframe.contentWindow.postMessage({
                    type: 'player:seek',
                    time: targetTime
                }, '*');
            }
            
            // Para otros servicios, intentar métodos genéricos
            iframe.contentWindow.postMessage({
                type: 'video:seek',
                time: targetTime
            }, '*');
            
            iframe.contentWindow.postMessage({
                action: 'seek',
                seconds: targetTime
            }, '*');
        } catch (error) {
            console.warn('Error al controlar iframe:', error);
        }
    }

    /**
     * Muestra una notificación de salto
     */
    showSkipNotification(time) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10000;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 14px;
            pointer-events: none;
            animation: fadeInOut 1.5s ease;
        `;
        
        notification.textContent = `Saltando a: ${this.formatTime(time)}`;
        document.body.appendChild(notification);
        
        setTimeout(() => notification.remove(), 1500);
    }

    /**
     * Configura un observador para detectar interacciones con el video
     */
    setupVideoObserver(element, videoId) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const buttons = this.buttons.get(videoId);
                if (buttons) {
                    if (entry.isIntersecting) {
                        buttons.container.classList.add('visible');
                    } else {
                        buttons.container.classList.remove('visible');
                    }
                }
            });
        }, {
            threshold: 0.5
        });

        observer.observe(element);
        this.observers.set(videoId, observer);
    }

    /**
     * Configura un MutationObserver para detectar nuevos videos
     */
    setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // Verificar si es un video o iframe
                        if (node.tagName === 'VIDEO' || node.tagName === 'IFRAME') {
                            this.scanForVideos();
                        }
                        
                        // Verificar si contiene videos dentro
                        if (node.querySelectorAll) {
                            const videos = node.querySelectorAll('video, iframe');
                            if (videos.length > 0) {
                                this.scanForVideos();
                            }
                        }
                    }
                });
            });
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Configura el listener para mensajes de otros frames
     */
    setupMessageListener() {
        window.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'VIDEO_SKIP_REQUEST') {
                const { videoId, time } = event.data;
                this.skipToTime(videoId, time);
            }
        });
    }

    /**
     * Método público para actualizar la configuración de un video
     */
    updateVideoConfig(videoId, newConfig) {
        const videoData = this.videos.get(videoId);
        if (!videoData) return;

        videoData.config = { ...videoData.config, ...newConfig };
        
        // Recrear botones si es necesario
        const buttons = this.buttons.get(videoId);
        if (buttons) {
            buttons.container.remove();
            this.createButtonContainer(videoData.element, videoId, videoData.config);
        }
    }

    /**
     * Configura el listener para verificar rango de tiempo
     */
    setupTimeRangeListener(element, videoId, config) {
        const videoData = this.videos.get(videoId);
        if (!videoData) return;

        // Función para verificar y actualizar visibilidad de botones
        const checkTimeRange = () => {
            const currentTime = this.getCurrentTime(element);
            if (currentTime === null) return;

            const buttons = this.buttons.get(videoId);
            if (!buttons) return;

            let opVisible = false;
            let edVisible = false;

            // Verificar rango OP normal: [op, op + d]
            if (config.op !== null) {
                const opRangeStart = config.op;
                const opRangeEnd = config.op + config.duration;
                opVisible = currentTime >= opRangeStart && currentTime <= opRangeEnd;

                if (buttons.buttons.op) {
                    buttons.buttons.op.style.display = opVisible ? 'flex' : 'none';
                    buttons.buttons.op.style.opacity = opVisible ? '1' : '0';
                }
            }

            // Verificar rango ED normal: [ed, ed + d]
            if (config.ed !== null) {
                const edRangeStart = config.ed;
                const edRangeEnd = config.ed + config.duration;
                edVisible = currentTime >= edRangeStart && currentTime <= edRangeEnd;

                if (buttons.buttons.ed) {
                    buttons.buttons.ed.style.display = edVisible ? 'flex' : 'none';
                    buttons.buttons.ed.style.opacity = edVisible ? '1' : '0';
                }
            }

            // Verificar rango OP extendido: [start, end]
            if (config.opExtended && config.opExtended.type === 'opExtended') {
                const opExtVisible = currentTime >= config.opExtended.start && currentTime <= config.opExtended.end;
                
                // Crear botón extendido si no existe
                if (!buttons.buttons.opExtended) {
                    const opExtButton = this.createExtendedSkipButton('op', config.opExtended, videoId);
                    buttons.container.appendChild(opExtButton);
                    buttons.buttons.opExtended = opExtButton;
                }
                
                if (buttons.buttons.opExtended) {
                    buttons.buttons.opExtended.style.display = opExtVisible ? 'flex' : 'none';
                    buttons.buttons.opExtended.style.opacity = opExtVisible ? '1' : '0';
                }
            }

            // Verificar rango ED extendido: [start, end]
            if (config.edExtended && config.edExtended.type === 'edExtended') {
                const edExtVisible = currentTime >= config.edExtended.start && currentTime <= config.edExtended.end;
                
                // Crear botón extendido si no existe
                if (!buttons.buttons.edExtended) {
                    const edExtButton = this.createExtendedSkipButton('ed', config.edExtended, videoId);
                    buttons.container.appendChild(edExtButton);
                    buttons.buttons.edExtended = edExtButton;
                }
                
                if (buttons.buttons.edExtended) {
                    buttons.buttons.edExtended.style.display = edExtVisible ? 'flex' : 'none';
                    buttons.buttons.edExtended.style.opacity = edExtVisible ? '1' : '0';
                }
            }

            // Actualizar información del rango
            if (buttons.info) {
                const rangeText = this.generateRangeText(config, currentTime, opVisible, edVisible);
                buttons.info.textContent = rangeText;
                buttons.info.style.opacity = (opVisible || edVisible) ? '0.7' : '0';
            }
        };

        // Configurar listener según el tipo de elemento
        if (element.tagName === 'VIDEO') {
            // Para videos HTML5, usar evento timeupdate
            const timeUpdateHandler = () => {
                checkTimeRange();
            };
            
            element.addEventListener('timeupdate', timeUpdateHandler);
            videoData.timeUpdateListener = timeUpdateHandler;
            
            // Verificar inmediatamente
            checkTimeRange();
            
        } else if (element.tagName === 'IFRAME') {
            // Para iframes, verificar periódicamente
            const intervalHandler = () => {
                checkTimeRange();
            };
            
            const intervalId = setInterval(intervalHandler, 500); // Verificar cada 500ms
            videoData.timeUpdateListener = intervalId;
            
            // Verificar inmediatamente
            checkTimeRange();
        }
    }

    /**
     * Obtiene el tiempo actual del video
     */
    getCurrentTime(element) {
        try {
            if (element.tagName === 'VIDEO') {
                return element.currentTime;
            } else if (element.tagName === 'IFRAME') {
                // Para YouTube, intentar obtener el tiempo del reproductor
                try {
                    // Método 1: YouTube API
                    if (element.src.includes('youtube.com') || element.src.includes('youtu.be')) {
                        // Enviar mensaje para solicitar tiempo actual
                        element.contentWindow.postMessage({
                            type: 'player:getTime'
                        }, '*');
                        
                        // Intentar obtener directamente si es posible
                        const player = element.contentWindow.document?.querySelector('.html5-video-player');
                        if (player && player.currentTime !== undefined) {
                            return player.currentTime;
                        }
                    }
                    
                    // Para otros servicios, intentar métodos genéricos
                    const videoInFrame = element.contentWindow.document?.querySelector('video');
                    if (videoInFrame && videoInFrame.currentTime !== undefined) {
                        return videoInFrame.currentTime;
                    }
                } catch (error) {
                    // No se puede acceder al contenido del iframe debido a CORS
                    return null;
                }
            }
        } catch (error) {
            return null;
        }
        return null;
    }

    /**
     * Genera texto informativo del rango actual
     */
    generateRangeText(config, currentTime, opVisible, edVisible) {
        const parts = [];
        
        if (config.op !== null) {
            const opRangeStart = config.op;
            const opRangeEnd = config.op + config.duration;
            const opStatus = opVisible ? '✓' : '✗';
            parts.push(`OP: ${this.formatTime(opRangeStart)}-${this.formatTime(opRangeEnd)} ${opStatus}`);
        }
        
        if (config.ed !== null) {
            const edRangeStart = config.ed;
            const edRangeEnd = config.ed + config.duration;
            const edStatus = edVisible ? '✓' : '✗';
            parts.push(`ED: ${this.formatTime(edRangeStart)}-${this.formatTime(edRangeEnd)} ${edStatus}`);
        }
        
        // Agregar rangos extendidos con información de formato
        if (config.opExtended && config.opExtended.type === 'opExtended') {
            const opExtStatus = currentTime >= config.opExtended.start && currentTime <= config.opExtended.end ? '✓' : '✗';
            const formatInfo = config.opExtended.format === 'exact' ? '[exact]' : '[implicit]';
            parts.push(`OP Ext: ${this.formatTime(config.opExtended.start)}-${this.formatTime(config.opExtended.end)} ${opExtStatus} ${formatInfo}`);
        }
        
        if (config.edExtended && config.edExtended.type === 'edExtended') {
            const edExtStatus = currentTime >= config.edExtended.start && currentTime <= config.edExtended.end ? '✓' : '✗';
            const formatInfo = config.edExtended.format === 'exact' ? '[exact]' : '[implicit]';
            parts.push(`ED Ext: ${this.formatTime(config.edExtended.start)}-${this.formatTime(config.edExtended.end)} ${edExtStatus} ${formatInfo}`);
        }
        
        if (parts.length === 0) {
            return config.duration ? `Duración: ${config.duration}s` : 'Video detectado';
        }
        
        return parts.join(' | ');
    }

    /**
     * Método público para agregar un video manualmente
     */
    addVideo(element, params) {
        const searchParams = new URLSearchParams(params);
        this.setupVideoControls(element, searchParams);
    }

    /**
     * Destructor para limpiar recursos
     */
    destroy() {
        // Limpiar observadores
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();
        
        // Limpiar listeners de tiempo
        this.videos.forEach(videoData => {
            if (videoData.timeUpdateListener) {
                if (typeof videoData.timeUpdateListener === 'function') {
                    // Es un event listener
                    videoData.element.removeEventListener('timeupdate', videoData.timeUpdateListener);
                } else if (typeof videoData.timeUpdateListener === 'number') {
                    // Es un interval ID
                    clearInterval(videoData.timeUpdateListener);
                }
            }
        });
        
        // Limpiar botones
        this.buttons.forEach(buttons => {
            buttons.container.remove();
            buttons.info.remove();
        });
        this.buttons.clear();
        
        // Limpiar videos
        this.videos.clear();
        
        // Remover estilos
        const style = document.getElementById('video-skip-buttons-styles');
        if (style) style.remove();
    }
}

// CSS para animación de notificación
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    @keyframes fadeInOut {
        0% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        20% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        80% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        100% { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }
`;
document.head.appendChild(notificationStyle);

// Inicializar automáticamente si no estamos en modo de prueba
if (typeof window !== 'undefined' && !window.VIDEO_SKIP_DLC_TEST_MODE) {
    // Esperar a que el DOM esté cargado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.videoSkipButtons = new VideoSkipButtons();
        });
    } else {
        window.videoSkipButtons = new VideoSkipButtons();
    }
}

// Exportar para uso en módulos
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoSkipButtons;
}