/**
 * DLC Core Engine
 * Motor centralizado para extraer configuración de hash de URLs y emitir tiempos del reproductor.
 */
class DLCCoreEngine {
    constructor() {
        this.videos = new Map();
        this.defaultDuration = 90;
        this.init();
    }

    init() {
        console.log('DLC Core Engine - Inicializando...');
        
        // Escuchar la creación de iframes en la matriz
        document.addEventListener('matrixItemRendered', (e) => {
            const { element, url } = e.detail;
            if (!url) return;
            
            // Inyectar API de YouTube si es necesario
            if ((url.includes('youtube.com') || url.includes('youtu.be')) && !element.src.includes('enablejsapi=1')) {
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

                        // Despachar evento para informar a los sub-módulos que hay un nuevo video configurado
                        document.dispatchEvent(new CustomEvent('dlc:videoConfigured', {
                            detail: { videoId, element, config }
                        }));

                        this.setupTimeTracker(element, videoId, config);
                    }
                }
            }
        });
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
        
        const parsed = this.parseExtendedTime(cleanStr, duration);
        if (parsed) {
            parsed.auto = isAuto;
            parsed.originalType = type;
            if (value !== null) parsed.value = value;
        }
        return parsed;
    }

    parseExtendedTime(timeStr, duration) {
        // [MM:SS-MM:SS]
        const exactMatch = timeStr.match(/^\[(\d{1,2}):(\d{1,2})-(\d{1,2}):(\d{1,2})\]$/);
        if (exactMatch) {
            const startTime = parseInt(exactMatch[1]) * 60 + parseInt(exactMatch[2]);
            const endTime = parseInt(exactMatch[3]) * 60 + parseInt(exactMatch[4]);
            if (endTime > startTime) return { start: startTime, end: endTime, type: 'range', format: 'exact' };
        }
        
        // [MM:SS] -> Implícito + duration
        const implicitMatch = timeStr.match(/^\[(\d{1,2}):(\d{1,2})\]$/);
        if (implicitMatch) {
            const startTime = parseInt(implicitMatch[1]) * 60 + parseInt(implicitMatch[2]);
            return { start: startTime, end: startTime + duration, type: 'range', format: 'implicit' };
        }

        // MM:SS+90s
        const explicitMatch = timeStr.match(/^(\d{1,2}):(\d{1,2})\+(\d+)s?$/);
        if (explicitMatch) {
            const startTime = parseInt(explicitMatch[1]) * 60 + parseInt(explicitMatch[2]);
            return { start: startTime, end: startTime + parseInt(explicitMatch[3]), type: 'range', format: 'explicit' };
        }

        // Punto fijo: MM:SS
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
                document.dispatchEvent(new CustomEvent('dlc:timeUpdate', {
                    detail: { videoId, element, config, currentTime }
                }));
            }
        };

        if (element.tagName === 'VIDEO') {
            element.addEventListener('timeupdate', pollTime);
        } else if (element.tagName === 'IFRAME') {
            setInterval(pollTime, 500);
        }
    }

    getCurrentTime(element) {
        if (element.tagName === 'VIDEO') {
            return element.currentTime;
        } else if (element.tagName === 'IFRAME') {
            try {
                // Cross-Origin iframe - solo funciona si usamos la API o si el DOM nos permite saltar
                // Idealmente el script pediría el time via postMessage y dispararía asíncronamente
                // Para mantener compatibilidad con la versión original usaremos un hack para obtener tiempo
                const player = element.contentWindow.document?.querySelector('.html5-video-player, video');
                if (player && player.currentTime !== undefined) {
                    return player.currentTime;
                }
            } catch (e) {
                // No loguear para no inundar consola por CORS
            }
        }
        return null;
    }
    
    // Métodos globales para obligar saltos o estados (expuestos para módulos DLC)
    seekVideo(element, targetSeconds) {
        if (element.tagName === 'VIDEO') {
            element.currentTime = targetSeconds;
            element.play();
        } else if (element.tagName === 'IFRAME' && (element.src.includes('youtube.com') || element.src.includes('youtu.be'))) {
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
    }

    setVolume(element, muted) {
        if (element.tagName === 'VIDEO') {
            element.muted = muted;
        } else if (element.tagName === 'IFRAME') {
            element.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: muted ? 'mute' : 'unMute',
                args: []
            }), '*');
        }
    }

    setPlaybackRate(element, rate) {
        if (element.tagName === 'VIDEO') {
            element.playbackRate = rate;
        } else if (element.tagName === 'IFRAME') {
            element.contentWindow.postMessage(JSON.stringify({
                event: 'command',
                func: 'setPlaybackRate',
                args: [rate]
            }), '*');
        }
    }
}

window.dlcCoreEngine = new DLCCoreEngine();
