// ==UserScript==
// @name         ∞Iframes DLC — Video Skip Buttons Loader
// @namespace    https://misterbartra.github.io
// @version      1.0.0
// @description  Carga e instancia el sistema DLC (skip-buttons, auto-skip, loop, modifiers, chapters) en cualquier página con videos embebidos fuera del dominio local. Conecta señales para saltar OP/ED, aplicar loop, velocidad, mute y capítulos.
// @author       MisterBartra
// @match        *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @connect      raw.githubusercontent.com
// @connect      *
// @run-at       document-idle
// @icon         https://www.google.com/s2/favicons?domain=youtube.com
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    // =========================================================================
    // CONFIGURACIÓN
    // =========================================================================

    const RAW_BASE = 'https://raw.githubusercontent.com/MisterBartra/misterbartra.github.io/main/HTML-CoreProyects/%E2%88%9EIframes/src/dlc';
    const DLC_SCRIPTS = [
        'core-engine.js',
        'skip-buttons.js',
        'auto-skip.js',
        'video-loop.js',
        'video-modifiers.js',
        'video-chapters.js'
    ];

    // =========================================================================
    // UTILIDADES
    // =========================================================================

    /**
     * Carga un script remoto y lo ejecuta en el contexto de la página.
     * Si GM_xmlhttpRequest está disponible, lo usa (evita CORS).
     * Si no, hace fetch nativo.
     */
    function loadScript(url) {
        return new Promise((resolve, reject) => {
            if (typeof GM_xmlhttpRequest !== 'undefined') {
                GM_xmlhttpRequest({
                    method: 'GET',
                    url: url,
                    onload: (resp) => {
                        if (resp.status >= 200 && resp.status < 300) {
                            injectScript(resp.responseText);
                            resolve();
                        } else {
                            reject(new Error(`HTTP ${resp.status} cargando ${url}`));
                        }
                    },
                    onerror: (err) => reject(err)
                });
            } else {
                fetch(url)
                    .then(r => r.ok ? r.text() : Promise.reject(new Error(`HTTP ${r.status}`)))
                    .then(code => { injectScript(code); resolve(); })
                    .catch(reject);
            }
        });
    }

    /**
     * Inyecta código JS en el contexto de la página (no del userscript sandbox).
     * Esto es crítico para que los CustomEvents se compartan entre página y script.
     */
    function injectScript(code) {
        const script = document.createElement('script');
        script.textContent = code;
        (document.head || document.documentElement).appendChild(script);
        script.remove();
    }

    /**
     * Espera a que una variable global esté disponible (con timeout).
     */
    function waitForGlobal(name, timeout = 10000) {
        return new Promise((resolve, reject) => {
            const start = Date.now();
            const check = setInterval(() => {
                if (window[name] !== undefined) {
                    clearInterval(check);
                    resolve(window[name]);
                } else if (Date.now() - start > timeout) {
                    clearInterval(check);
                    reject(new Error(`Timeout esperando ${name}`));
                }
            }, 100);
        });
    }

    /**
     * Genera un ID único para un elemento de video.
     */
    function genVideoId(element) {
        if (element.id) return `vm-${element.id}`;
        if (element.src) return `vm-${btoa(element.src).slice(0, 12)}`;
        return `vm-${Math.random().toString(36).substr(2, 9)}`;
    }

    // =========================================================================
    // DETECCIÓN DE VIDEOS
    // =========================================================================

    /**
     * Detecta todos los videos e iframes relevantes en la página actual.
     * Retorna una lista normalizada con tipo y elemento.
     */
    function detectVideos() {
        const videos = [];

        // 1. Videos HTML5 nativos (<video>)
        document.querySelectorAll('video').forEach(v => {
            if (!v.dataset.dlcDetected) {
                videos.push({ element: v, type: 'video', src: v.currentSrc || v.src || '' });
            }
        });

        // 2. Iframes de YouTube embebidos
        document.querySelectorAll('iframe').forEach(iframe => {
            const src = iframe.src || '';
            if (!iframe.dataset.dlcDetected && isYouTubeEmbed(src)) {
                videos.push({ element: iframe, type: 'iframe', src });
            }
        });

        return videos;
    }

    /**
     * Verifica si una URL es un embed de YouTube.
     */
    function isYouTubeEmbed(src) {
        return src.includes('youtube.com/embed/') ||
            src.includes('youtube-nocookie.com/embed/') ||
            src.includes('youtu.be/');
    }

    /**
     * Extrae parámetros DLC de una URL o del hash.
     * Soporta tanto ?op=...&ed=... como #op=...&ed=...
     */
    function extractParams(src) {
        let params = '';

        // Intentar hash primero (#op=...&ed=...)
        const hashIdx = src.indexOf('#');
        if (hashIdx !== -1) {
            const hash = src.substring(hashIdx + 1);
            if (/op=|ed=|loop=|speed=|mute=|ch=/.test(hash)) {
                params = hash;
            }
        }

        // Si no hay en hash, intentar query string (?op=...&ed=...)
        if (!params) {
            try {
                const url = new URL(src);
                for (const key of ['op', 'ed', 'loop', 'speed', 'mute', 'ch', 'd']) {
                    const val = url.searchParams.get(key);
                    if (val) {
                        params += (params ? '&' : '') + `${key}=${val}`;
                    }
                }
            } catch (e) {
                // No es URL válida, ignorar
            }
        }

        return params;
    }

    // =========================================================================
    // REGISTRO DE VIDEOS EN EL CORE ENGINE
    // =========================================================================

    /**
     * Registra un video/iframe en el sistema DLC disparando el evento
     * matrixItemRendered que el core-engine escucha.
     */
    function registerVideo(item) {
        const { element, src, type } = item;

        // Marcar como detectado para no duplicar
        element.dataset.dlcDetected = 'true';

        // Extraer parámetros de configuración
        const params = extractParams(src);

        // Construir URL con hash que el core-engine pueda parsear
        let urlWithHash = src;
        if (params) {
            // Asegurar que el iframe tenga el hash correcto
            if (type === 'iframe' && isYouTubeEmbed(src)) {
                // Para YouTube: habilitar JS API si no está
                if (!src.includes('enablejsapi=1')) {
                    const sep = src.includes('?') ? '&' : '?';
                    element.src = src.split('#')[0] + sep + 'enablejsapi=1' + (params ? '#' + params : '');
                    urlWithHash = element.src;
                } else {
                    urlWithHash = src.split('#')[0] + '#' + params;
                }
            }
        }

        // Disparar evento que el core-engine escucha
        document.dispatchEvent(new CustomEvent('matrixItemRendered', {
            detail: {
                element: element,
                url: urlWithHash,
                wrapper: element.parentElement,
                x: 0,
                y: 0,
                isNested: false
            }
        }));

        console.log(`[VM-DLC] Video registrado: ${type} (params: ${params || 'ninguno'})`);
    }

    // =========================================================================
    // BRIDGE PARA YOUTUBE CROSS-ORIGIN
    // =========================================================================

    /**
     * Intercepta mensajes postMessage de iframes de YouTube para
     * sincronizar el tiempo actual con el core-engine.
     * Esto soluciona el problema de getCurrentTime() con CORS.
     */
    function setupYouTubeBridge() {
        window.addEventListener('message', (event) => {
            // Filtrar mensajes de YouTube
            if (!event.data || typeof event.data !== 'string') return;

            try {
                const data = JSON.parse(event.data);
                if (data.event === 'infoDelivery' && data.info && data.info.currentTime !== undefined) {
                    // Buscar el iframe que emitió este mensaje
                    const iframes = document.querySelectorAll('iframe[src*="youtube.com/embed/"]');
                    iframes.forEach(iframe => {
                        if (iframe.contentWindow === event.source) {
                            // Guardar el tiempo actual en el dataset del iframe
                            iframe.dataset.ytCurrentTime = data.info.currentTime;

                            // Disparar timeUpdate manualmente
                            if (window.dlcCoreEngine && iframe.dataset.dlcVideoId) {
                                const videoData = window.dlcCoreEngine.videos.get(iframe.dataset.dlcVideoId);
                                if (videoData) {
                                    document.dispatchEvent(new CustomEvent('dlc:timeUpdate', {
                                        detail: {
                                            videoId: iframe.dataset.dlcVideoId,
                                            element: iframe,
                                            config: videoData.config,
                                            currentTime: data.info.currentTime
                                        }
                                    }));
                                }
                            }
                        }
                    });
                }
            } catch (e) {
                // No es JSON válido, ignorar
            }
        });

        // Solicitar periódicamente el tiempo a los iframes de YouTube
        setInterval(() => {
            document.querySelectorAll('iframe[src*="youtube.com/embed/"]').forEach(iframe => {
                if (iframe.dataset.dlcDetected && iframe.contentWindow) {
                    try {
                        iframe.contentWindow.postMessage(JSON.stringify({
                            event: 'listening'
                        }), '*');
                        iframe.contentWindow.postMessage(JSON.stringify({
                            event: 'command',
                            func: 'getCurrentTime',
                            args: []
                        }), '*');
                    } catch (e) {
                        // Ignorar errores de CORS
                    }
                }
            });
        }, 1000);
    }

    // =========================================================================
    // BLOQUEADOR DE ADS — Intercepta dominios publicitarios
    // =========================================================================

    /**
     * Bloquea scripts, iframes, fetch y XHR de dominios publicitarios conocidos.
     * Esto complementa el AdBlocker del DLC Core Engine, pero funciona de forma
     * independiente en cualquier sitio donde se ejecute el userscript.
     */
    const AD_PATTERNS = [
        'ad.mail.ru',
        'admanhtml',
        'rbadman',
        'doubleclick.net',
        'googlesyndication.com',
        'googleadservices.com',
        'googletagservices.com',
        'adservice.google.',
        'adnxs.com',
        'taboola.com',
        'outbrain.com',
        'criteo.com',
        'adsystem.',
        'adserver.',
        'ads.',
        'ad.',
        '/ads/',
        '/ad/',
        'banner.',
        'popads',
        'popcash',
        'propellerads',
        'adsrvr',
        'adsterra',
        'mgid.com'
    ];

    function isAdUrl(url) {
        if (!url || typeof url !== 'string') return false;
        const lower = url.toLowerCase();
        return AD_PATTERNS.some(p => lower.includes(p));
    }

    // 1. Bloquear scripts e iframes existentes y futuros
    function blockAdElement(node) {
        if (node.nodeType !== 1) return;
        if (node.tagName !== 'SCRIPT' && node.tagName !== 'IFRAME') return;
        const src = node.src || node.getAttribute('src') || '';
        if (src && isAdUrl(src)) {
            console.warn('[VM-AdBlock] Bloqueado:', src);
            node.remove();
        }
    }

    // Escanear existentes
    document.querySelectorAll('script[src], iframe[src]').forEach(blockAdElement);

    // Observar nuevos
    new MutationObserver((mutations) => {
        mutations.forEach(m => m.addedNodes.forEach(blockAdElement));
    }).observe(document.documentElement, { childList: true, subtree: true });

    // 2. Interceptar fetch
    const origFetch = window.fetch;
    window.fetch = function (url, opts) {
        const urlStr = typeof url === 'string' ? url : (url && url.url) || '';
        if (isAdUrl(urlStr)) {
            console.warn('[VM-AdBlock] Fetch bloqueado:', urlStr);
            return Promise.resolve(new Response('', { status: 204 }));
        }
        return origFetch.apply(this, arguments);
    };

    // 3. Interceptar XMLHttpRequest
    const origXHROpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url, ...args) {
        if (isAdUrl(url)) {
            console.warn('[VM-AdBlock] XHR bloqueado:', url);
            this.abort();
            return;
        }
        return origXHROpen.apply(this, [method, url, ...args]);
    };

    // =========================================================================
    // UI FLOTANTE — Panel de Configuración Rápida
    // =========================================================================

    function injectUI() {
        GM_addStyle(`
            #vm-dlc-panel {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 300px;
                background: rgba(15, 15, 19, 0.95);
                backdrop-filter: blur(12px);
                color: #fff;
                border-radius: 12px;
                border: 1px solid rgba(255,255,255,0.15);
                box-shadow: 0 8px 32px rgba(0,0,0,0.4);
                z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                font-size: 13px;
                overflow: hidden;
                transition: transform 0.3s ease, opacity 0.3s ease;
                transform: translateY(0);
                opacity: 1;
            }
            #vm-dlc-panel.collapsed {
                transform: translateY(calc(100% - 40px));
            }
            #vm-dlc-panel .vm-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 8px 12px;
                font-weight: 600;
                cursor: grab;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 14px;
                user-select: none;
            }
            #vm-dlc-panel .vm-header:active {
                cursor: grabbing;
            }
            #vm-dlc-panel.dragging {
                transition: none !important;
            }
            #vm-dlc-panel .vm-body {
                padding: 12px;
                max-height: 400px;
                overflow-y: auto;
            }
            #vm-dlc-panel .vm-field {
                margin-bottom: 8px;
            }
            #vm-dlc-panel label {
                display: block;
                font-size: 11px;
                opacity: 0.7;
                margin-bottom: 3px;
            }
            #vm-dlc-panel input, #vm-dlc-panel select {
                width: 100%;
                padding: 6px 8px;
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.2);
                border-radius: 6px;
                color: #fff;
                font-size: 12px;
                box-sizing: border-box;
            }
            #vm-dlc-panel button {
                padding: 8px 12px;
                background: rgba(102, 126, 234, 0.8);
                border: none;
                border-radius: 6px;
                color: #fff;
                cursor: pointer;
                font-size: 12px;
                font-weight: 600;
                width: 100%;
                transition: background 0.2s ease;
            }
            #vm-dlc-panel button:hover {
                background: rgba(102, 126, 234, 1);
            }
            #vm-dlc-panel button.vm-danger {
                background: rgba(244, 67, 54, 0.8);
            }
            #vm-dlc-panel button.vm-danger:hover {
                background: rgba(244, 67, 54, 1);
            }
            #vm-dlc-panel .vm-status {
                font-size: 11px;
                opacity: 0.6;
                margin-top: 6px;
                text-align: center;
            }
            #vm-dlc-panel .vm-sep {
                height: 1px;
                background: rgba(255,255,255,0.1);
                margin: 8px 0;
            }
            #vm-dlc-panel .vm-target-select {
                margin-bottom: 8px;
            }
            #vm-dlc-panel .vm-badge {
                display: inline-block;
                background: rgba(33, 150, 243, 0.3);
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                margin-left: 4px;
            }
        `);

        const panel = document.createElement('div');
        panel.id = 'vm-dlc-panel';
        panel.innerHTML = `
            <div class="vm-header" id="vm-toggle">
                <span>🎬 DLC Loader</span>
                <span id="vm-arrow">▼</span>
            </div>
            <div class="vm-body">
                <div class="vm-field vm-target-select">
                    <label>Video objetivo:</label>
                    <select id="vm-video-select"></select>
                </div>
                <div class="vm-sep"></div>
                <div class="vm-field">
                    <label>OP (Opening): ej. [01:30] o 01:30 o [01:30-03:00]</label>
                    <input type="text" id="vm-op" placeholder="[01:30]">
                </div>
                <div class="vm-field">
                    <label>ED (Ending): ej. [22:00-23:30]</label>
                    <input type="text" id="vm-ed" placeholder="[22:00-23:30]">
                </div>
                <div class="vm-field">
                    <label>Duración (segundos):</label>
                    <input type="number" id="vm-duration" value="90" min="10" max="600">
                </div>
                <div class="vm-field">
                    <label>Loop: ej. [05:00-06:00]</label>
                    <input type="text" id="vm-loop" placeholder="[05:00-06:00]">
                </div>
                <div class="vm-field">
                    <label>Velocidad: ej. 1.5@[01:00]</label>
                    <input type="text" id="vm-speed" placeholder="1.5@[01:00]">
                </div>
                <div class="vm-field">
                    <label>Mute: ej. [10:00]</label>
                    <input type="text" id="vm-mute" placeholder="[10:00]">
                </div>
                <button id="vm-apply">✨ Aplicar Configuración</button>
                <button id="vm-skip-op" style="margin-top: 6px;">⏭️ Saltar OP</button>
                <button id="vm-skip-ed" style="margin-top: 6px;">⏭️ Saltar ED</button>
                <button id="vm-clear" class="vm-danger" style="margin-top: 6px;">🗑️ Limpiar</button>
                <div class="vm-status" id="vm-status">Esperando videos...</div>
            </div>
        `;
        document.body.appendChild(panel);

        // Toggle colapsar/expandir + Arrastre del panel
        const header = document.getElementById('vm-toggle');

        // --- Lógica de arrastre con límites ---
        let isDragging = false;
        let dragStart = { x: 0, y: 0 };
        let panelStart = { left: 0, top: 0 };
        let dragMoved = false;

        header.addEventListener('mousedown', (e) => {
            // No iniciar arrastre si se hace clic en un botón interno
            if (e.target.tagName === 'BUTTON') return;

            isDragging = true;
            dragMoved = false;
            panel.classList.add('dragging');

            const rect = panel.getBoundingClientRect();
            // Cambiar de bottom/right a left/top para arrastre más simple
            panel.style.left = rect.left + 'px';
            panel.style.top = rect.top + 'px';
            panel.style.right = 'auto';
            panel.style.bottom = 'auto';

            dragStart.x = e.clientX;
            dragStart.y = e.clientY;
            panelStart.left = rect.left;
            panelStart.top = rect.top;

            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;

            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;

            // Marcar como movido si el desplazamiento supera un umbral
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
                dragMoved = true;
            }

            let newLeft = panelStart.left + dx;
            let newTop = panelStart.top + dy;

            // --- Limitar dentro de los bordes del video/iframe más cercano ---
            const videoBounds = getNearestVideoBounds();
            const panelRect = panel.getBoundingClientRect();

            // Si hay un video, limitar dentro de sus bounds
            if (videoBounds) {
                newLeft = Math.max(videoBounds.left, Math.min(newLeft, videoBounds.right - panelRect.width));
                newTop = Math.max(videoBounds.top, Math.min(newTop, videoBounds.bottom - panelRect.height));
            } else {
                // Si no hay video, limitar dentro del viewport
                newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - panelRect.width));
                newTop = Math.max(0, Math.min(newTop, window.innerHeight - panelRect.height));
            }

            panel.style.left = newLeft + 'px';
            panel.style.top = newTop + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (!isDragging) return;
            isDragging = false;
            panel.classList.remove('dragging');

            // Solo alternar colapso si NO hubo arrastre real (clic simple)
            if (!dragMoved) {
                panel.classList.toggle('collapsed');
                document.getElementById('vm-arrow').textContent = panel.classList.contains('collapsed') ? '▲' : '▼';
            }
        });

        /**
         * Obtiene los límites del video/iframe más cercano o visible.
         * Si no hay video, retorna null (se usan límites del viewport).
         */
        function getNearestVideoBounds() {
            const videos = document.querySelectorAll('video, iframe[src*="youtube"]');
            if (videos.length === 0) return null;

            // Buscar el video visible más grande en pantalla
            let bestVideo = null;
            let bestArea = 0;

            videos.forEach(video => {
                const rect = video.getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0 &&
                    rect.bottom > 0 && rect.top < window.innerHeight &&
                    rect.right > 0 && rect.left < window.innerWidth;
                if (isVisible) {
                    const area = rect.width * rect.height;
                    if (area > bestArea) {
                        bestArea = area;
                        bestVideo = rect;
                    }
                }
            });

            if (bestVideo) {
                return {
                    left: bestVideo.left,
                    top: bestVideo.top,
                    right: bestVideo.right,
                    bottom: bestVideo.bottom
                };
            }

            return null;
        }

        // Botón aplicar
        document.getElementById('vm-apply').addEventListener('click', applyConfig);
        document.getElementById('vm-skip-op').addEventListener('click', () => skipTo('op'));
        document.getElementById('vm-skip-ed').addEventListener('click', () => skipTo('ed'));
        document.getElementById('vm-clear').addEventListener('click', clearConfig);
    }

    /**
     * Actualiza el selector de videos detectados en el panel UI.
     */
    function updateVideoSelector() {
        const select = document.getElementById('vm-video-select');
        if (!select) return;

        const videos = detectVideos();
        select.innerHTML = '';

        if (videos.length === 0) {
            select.innerHTML = '<option value="">No se detectaron videos</option>';
            updateStatus('Sin videos en la página');
            return;
        }

        videos.forEach((v, i) => {
            const label = v.type === 'iframe' ? `YouTube Embed ${i + 1}` : `Video HTML5 ${i + 1}`;
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = label;
            opt.dataset.index = i;
            select.appendChild(opt);
        });

        updateStatus(`${videos.length} video(s) detectado(s)`);

        // Guardar referencia global
        window.__vmVideos = videos;
    }

    function updateStatus(msg) {
        const el = document.getElementById('vm-status');
        if (el) el.textContent = msg;
    }

    /**
     * Aplica la configuración del panel al video seleccionado.
     */
    function applyConfig() {
        const select = document.getElementById('vm-video-select');
        const videos = window.__vmVideos || [];
        const idx = parseInt(select.value);

        if (isNaN(idx) || !videos[idx]) {
            updateStatus('❌ Selecciona un video válido');
            return;
        }

        const video = videos[idx];
        const op = document.getElementById('vm-op').value.trim();
        const ed = document.getElementById('vm-ed').value.trim();
        const duration = document.getElementById('vm-duration').value || '90';
        const loop = document.getElementById('vm-loop').value.trim();
        const speed = document.getElementById('vm-speed').value.trim();
        const mute = document.getElementById('vm-mute').value.trim();

        // Construir hash de parámetros
        const parts = [`d=${duration}`];
        if (op) parts.push(`op=${op}`);
        if (ed) parts.push(`ed=${ed}`);
        if (loop) parts.push(`loop=${loop}`);
        if (speed) parts.push(`speed=${speed}`);
        if (mute) parts.push(`mute=${mute}`);

        const hashParams = parts.join('&');

        // Registrar el video con los nuevos parámetros
        registerVideo({
            element: video.element,
            src: video.src + '#' + hashParams,
            type: video.type
        });

        updateStatus('✅ Configuración aplicada');
    }

    /**
     * Salta directamente al inicio del OP o ED.
     */
    function skipTo(type) {
        const select = document.getElementById('vm-video-select');
        const videos = window.__vmVideos || [];
        const idx = parseInt(select.value);

        if (isNaN(idx) || !videos[idx]) {
            updateStatus('❌ Selecciona un video');
            return;
        }

        const element = videos[idx].element;
        const timeStr = document.getElementById(`vm-${type}`).value.trim();
        if (!timeStr) {
            updateStatus(`❌ Define ${type.toUpperCase()} primero`);
            return;
        }

        // Parsear tiempo del input
        const match = timeStr.match(/(\d{1,2}):(\d{1,2})/);
        if (match) {
            const seconds = parseInt(match[1]) * 60 + parseInt(match[2]);
            if (window.dlcCoreEngine) {
                window.dlcCoreEngine.seekVideo(element, seconds);
                updateStatus(`⏭️ Saltando a ${timeStr}`);
            }
        }
    }

    function clearConfig() {
        ['vm-op', 'vm-ed', 'vm-loop', 'vm-speed', 'vm-mute'].forEach(id => {
            document.getElementById(id).value = '';
        });
        updateStatus('🗑️ Campos limpiados');
    }

    // =========================================================================
    // OBSERVADOR DE MUTACIONES — Detectar nuevos videos dinámicicos
    // =========================================================================

    function setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            let hasNewVideo = false;

            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue;

                    // Verificar si el nodo es un video o iframe, o si contiene uno
                    const isVideo = node.tagName === 'VIDEO' || node.tagName === 'IFRAME';
                    const containsVideo = node.querySelector && node.querySelector('video, iframe[src*="youtube"]');

                    if (isVideo || containsVideo) {
                        hasNewVideo = true;
                        break;
                    }
                }
            }

            if (hasNewVideo) {
                // Actualizar selector y registrar nuevos videos
                updateVideoSelector();
                autoRegisterVideos();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    /**
     * Auto-registra videos que ya tienen parámetros DLC en su URL.
     */
    function autoRegisterVideos() {
        detectVideos().forEach(video => {
            const params = extractParams(video.src);
            if (params) {
                registerVideo(video);
            }
        });
    }

    // =========================================================================
    // INICIALIZACIÓN PRINCIPAL
    // =========================================================================

    async function main() {
        console.log('[VM-DLC] Iniciando ∞Iframes DLC Loader...');

        try {
            // 1. Cargar todos los scripts DLC secuencialmente
            console.log('[VM-DLC] Cargando módulos DLC...');
            for (const script of DLC_SCRIPTS) {
                const url = `${RAW_BASE}/${script}`;
                console.log(`[VM-DLC] → ${script}`);
                await loadScript(url);
            }
            console.log('[VM-DLC] ✅ Todos los módulos DLC cargados');

            // 2. Esperar a que el core-engine esté listo
            await waitForGlobal('dlcCoreEngine');
            console.log('[VM-DLC] ✅ Core Engine inicializado');

            // 3. Configurar bridge para YouTube cross-origin
            setupYouTubeBridge();
            console.log('[VM-DLC] ✅ YouTube Bridge activo');

            // 4. Inyectar UI
            injectUI();
            console.log('[VM-DLC] ✅ Panel UI inyectado');

            // 5. Detectar y registrar videos existentes
            setTimeout(() => {
                updateVideoSelector();
                autoRegisterVideos();
                console.log('[VM-DLC] ✅ Detección inicial completa');
            }, 1500);

            // 6. Configurar observer para videos dinámicos
            setupMutationObserver();
            console.log('[VM-DLC] ✅ MutationObserver activo');

            // 7. Re-detectar periódicamente (fallback)
            setInterval(updateVideoSelector, 5000);

        } catch (error) {
            console.error('[VM-DLC] Error durante la inicialización:', error);
            // Si falla la carga remota, intentar inicialización local mínima
            initMinimalMode();
        }
    }

    // =========================================================================
    // MODO MÍNIMO (Fallback sin conexión)
    // =========================================================================

    /**
     * Si no se pueden cargar los scripts DLC remotos, activa un modo mínimo
     * que al menos permite saltar OP/ED con la UI básica.
     */
    function initMinimalMode() {
        console.warn('[VM-DLC] ⚠️ Modo mínimo activado (sin conexión al repositorio)');

        // Crear core engine mínimo
        window.dlcCoreEngine = {
            seekVideo(element, seconds) {
                if (element.tagName === 'VIDEO') {
                    element.currentTime = seconds;
                    element.play();
                } else if (element.tagName === 'IFRAME') {
                    element.contentWindow.postMessage(JSON.stringify({
                        event: 'command',
                        func: 'seekTo',
                        args: [seconds, true]
                    }), '*');
                }
            },
            videos: new Map()
        };

        // Inyectar UI de todos modos
        injectUI();
        setTimeout(updateVideoSelector, 1000);
    }

    // =========================================================================
    // EJECUTAR
    // =========================================================================

    // Solo ejecutar si hay videos potenciales o estamos en una página relevante
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        main();
    } else {
        document.addEventListener('DOMContentLoaded', main);
    }
})();