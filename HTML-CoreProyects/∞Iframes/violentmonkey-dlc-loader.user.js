// ==UserScript==
// @name         ∞Iframes DLC — Video Skip Buttons Loader
// @namespace    https://misterbartra.github.io
// @version      1.1.0
// @description  Carga e instancia el sistema DLC (skip-buttons, auto-skip, loop, modifiers, chapters) en cualquier página con videos embebidos fuera del dominio local. Conecta señales para saltar OP/ED, aplicar loop, velocidad, mute y capítulos. Soporte multi-proveedor y matrices 2D anidables.
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
        'auto-advance.js',
        'video-loop.js',
        'video-modifiers.js',
        'video-chapters.js'
    ];

    // =========================================================================
    // UTILIDADES
    // =========================================================================

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

    function injectScript(code) {
        const script = document.createElement('script');
        script.textContent = code;
        (document.head || document.documentElement).appendChild(script);
        script.remove();
    }

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

    // =========================================================================
    // DETECCIÓN DE VIDEOS — Soporte multi-proveedor y matrices 2D anidables
    // =========================================================================

    function detectVideos() {
        const videos = [];

        // 0. Leer urlRowsIframe para entender el contexto de la matriz 2D anidable
        const matrixData = window.urlRowsIframe || null;
        if (matrixData && Array.isArray(matrixData)) {
            matrixData.flat(Infinity).forEach(url => {
                if (typeof url === 'string' && isVideoEmbed(url)) {
                    const iframe = document.querySelector(`iframe[src*="${getUrlKey(url)}"]`);
                    if (iframe && !iframe.dataset.dlcDetected) {
                        videos.push({ element: iframe, type: 'iframe', src: iframe.src, matrixUrl: url });
                    }
                }
            });
        }

        // 1. Videos HTML5 nativos (<video>) — incluyendo los que tienen data-video-params
        document.querySelectorAll('video').forEach(v => {
            if (!v.dataset.dlcDetected) {
                videos.push({ element: v, type: 'video', src: v.currentSrc || v.src || '' });
            }
        });

        // 2. Iframes de cualquier proveedor de video soportado
        document.querySelectorAll('iframe').forEach(iframe => {
            const src = iframe.src || '';
            if (!iframe.dataset.dlcDetected && isVideoEmbed(src)) {
                videos.push({ element: iframe, type: 'iframe', src });
            }
        });

        return videos;
    }

    function isYouTubeEmbed(src) {
        return src.includes('youtube.com/embed/') ||
            src.includes('youtube-nocookie.com/embed/') ||
            src.includes('youtu.be/');
    }

    function isVideoEmbed(src) {
        return isYouTubeEmbed(src) ||
            src.includes('ok.ru/videoembed/') ||
            src.includes('vk.com/video_ext.php') ||
            src.includes('player.vimeo.com/video/') ||
            src.includes('dailymotion.com/embed/') ||
            src.includes('twitch.tv/videos/') ||
            src.includes('player.twitch.tv') ||
            src.includes('streamable.com/o/') ||
            src.includes('streamtape.com/e/') ||
            src.includes('mp4upload.com/embed/') ||
            src.includes('video.sibnet') ||
            src.includes('sendvid.com/embed/');
    }

    function getUrlKey(url) {
        const match = url.match(/\/(?:videoembed|embed|video|e)\/(\w+)/);
        if (match) return match[1];
        const parts = url.split('/');
        return parts[parts.length - 1] || url.slice(-12);
    }

    function getProviderName(src) {
        if (!src) return 'Embed';
        if (isYouTubeEmbed(src)) return 'YouTube';
        if (src.includes('ok.ru/videoembed/')) return 'OK.ru';
        if (src.includes('vk.com/video_ext.php')) return 'VK';
        if (src.includes('player.vimeo.com/video/')) return 'Vimeo';
        if (src.includes('dailymotion.com/embed/')) return 'Dailymotion';
        if (src.includes('twitch.tv')) return 'Twitch';
        if (src.includes('streamable.com/o/')) return 'Streamable';
        if (src.includes('streamtape.com/e/')) return 'Streamtape';
        if (src.includes('mp4upload.com/embed/')) return 'MP4Upload';
        if (src.includes('video.sibnet')) return 'Sibnet';
        if (src.includes('sendvid.com/embed/')) return 'SendVid';
        return 'Embed';
    }

    function extractParams(src, element) {
        let params = '';

        if (element && element.tagName === 'VIDEO' && element.hasAttribute('data-video-params')) {
            params = element.getAttribute('data-video-params') || '';
            if (params) return params;
        }

        const hashIdx = src.indexOf('#');
        if (hashIdx !== -1) {
            const hash = src.substring(hashIdx + 1);
            if (/op=|ed=|loop=|speed=|mute=|ch=/.test(hash)) {
                params = hash;
            }
        }

        if (!params) {
            try {
                const url = new URL(src);
                for (const key of ['op', 'ed', 'loop', 'speed', 'mute', 'ch', 'd']) {
                    const val = url.searchParams.get(key);
                    if (val) {
                        params += (params ? '&' : '') + `${key}=${val}`;
                    }
                }
            } catch (e) { }
        }

        return params;
    }

    // =========================================================================
    // REGISTRO DE VIDEOS EN EL CORE ENGINE
    // =========================================================================

    function registerVideo(item) {
        const { element, src, type } = item;

        element.dataset.dlcDetected = 'true';

        const params = extractParams(src, element);

        let urlWithHash = src;
        if (params) {
            if (type === 'iframe' && isYouTubeEmbed(src)) {
                if (!src.includes('enablejsapi=1')) {
                    const sep = src.includes('?') ? '&' : '?';
                    element.src = src.split('#')[0] + sep + 'enablejsapi=1' + (params ? '#' + params : '');
                    urlWithHash = element.src;
                } else {
                    urlWithHash = src.split('#')[0] + '#' + params;
                }
            }
        }

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

    function setupYouTubeBridge() {
        window.addEventListener('message', (event) => {
            if (!event.data || typeof event.data !== 'string') return;

            try {
                const data = JSON.parse(event.data);
                if (data.event === 'infoDelivery' && data.info && data.info.currentTime !== undefined) {
                    const iframes = document.querySelectorAll('iframe[src*="youtube.com/embed/"]');
                    iframes.forEach(iframe => {
                        if (iframe.contentWindow === event.source) {
                            iframe.dataset.ytCurrentTime = data.info.currentTime;

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
            } catch (e) { }
        });

        setInterval(() => {
            document.querySelectorAll('iframe[src*="youtube.com/embed/"]').forEach(iframe => {
                if (iframe.dataset.dlcDetected && iframe.contentWindow) {
                    try {
                        iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
                        iframe.contentWindow.postMessage(JSON.stringify({
                            event: 'command', func: 'getCurrentTime', args: []
                        }), '*');
                    } catch (e) { }
                }
            });
        }, 1000);
    }

    // =========================================================================
    // BLOQUEADOR DE ADS
    // =========================================================================

    const AD_PATTERNS = [
        'ad.mail.ru', 'admanhtml', 'rbadman', 'doubleclick.net',
        'googlesyndication.com', 'googleadservices.com', 'googletagservices.com',
        'adservice.google.', 'adnxs.com', 'taboola.com', 'outbrain.com',
        'criteo.com', 'adsystem.', 'adserver.', 'ads.', 'ad.', '/ads/', '/ad/',
        'banner.', 'popads', 'popcash', 'propellerads', 'adsrvr', 'adsterra', 'mgid.com'
    ];

    function isAdUrl(url) {
        if (!url || typeof url !== 'string') return false;
        const lower = url.toLowerCase();
        return AD_PATTERNS.some(p => lower.includes(p));
    }

    function blockAdElement(node) {
        if (node.nodeType !== 1) return;
        if (node.tagName !== 'SCRIPT' && node.tagName !== 'IFRAME') return;
        const src = node.src || node.getAttribute('src') || '';
        if (src && isAdUrl(src)) {
            console.warn('[VM-AdBlock] Bloqueado:', src);
            node.remove();
        }
    }

    document.querySelectorAll('script[src], iframe[src]').forEach(blockAdElement);
    new MutationObserver((mutations) => {
        mutations.forEach(m => m.addedNodes.forEach(blockAdElement));
    }).observe(document.documentElement, { childList: true, subtree: true });

    const origFetch = window.fetch;
    window.fetch = function (url, opts) {
        const urlStr = typeof url === 'string' ? url : (url && url.url) || '';
        if (isAdUrl(urlStr)) {
            console.warn('[VM-AdBlock] Fetch bloqueado:', urlStr);
            return Promise.resolve(new Response('', { status: 204 }));
        }
        return origFetch.apply(this, arguments);
    };

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
    // UI FLOTANTE
    // =========================================================================

    function injectUI() {
        GM_addStyle(`
            #vm-dlc-panel {
                position: fixed; bottom: 20px; right: 20px; width: 300px;
                background: rgba(15, 15, 19, 0.95); backdrop-filter: blur(12px);
                color: #fff; border-radius: 12px; border: 1px solid rgba(255,255,255,0.15);
                box-shadow: 0 8px 32px rgba(0,0,0,0.4); z-index: 999999;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                font-size: 13px; overflow: hidden;
                transition: transform 0.3s ease, opacity 0.3s ease;
                transform: translateY(0); opacity: 1;
            }
            #vm-dlc-panel.collapsed { transform: translateY(calc(100% - 40px)); }
            #vm-dlc-panel .vm-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 8px 12px; font-weight: 600; cursor: grab;
                display: flex; justify-content: space-between; align-items: center;
                font-size: 14px; user-select: none;
            }
            #vm-dlc-panel .vm-header:active { cursor: grabbing; }
            #vm-dlc-panel.dragging { transition: none !important; }
            #vm-dlc-panel .vm-body { padding: 12px; max-height: 400px; overflow-y: auto; }
            #vm-dlc-panel .vm-field { margin-bottom: 8px; }
            #vm-dlc-panel label { display: block; font-size: 11px; opacity: 0.7; margin-bottom: 3px; }
            #vm-dlc-panel input, #vm-dlc-panel select {
                width: 100%; padding: 6px 8px; background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.2); border-radius: 6px;
                color: #fff; font-size: 12px; box-sizing: border-box;
            }
            #vm-dlc-panel button {
                padding: 8px 12px; background: rgba(102, 126, 234, 0.8); border: none;
                border-radius: 6px; color: #fff; cursor: pointer; font-size: 12px;
                font-weight: 600; width: 100%; transition: background 0.2s ease;
            }
            #vm-dlc-panel button:hover { background: rgba(102, 126, 234, 1); }
            #vm-dlc-panel button.vm-danger { background: rgba(244, 67, 54, 0.8); }
            #vm-dlc-panel button.vm-danger:hover { background: rgba(244, 67, 54, 1); }
            #vm-dlc-panel .vm-status { font-size: 11px; opacity: 0.6; margin-top: 6px; text-align: center; }
            #vm-dlc-panel .vm-sep { height: 1px; background: rgba(255,255,255,0.1); margin: 8px 0; }
            #vm-dlc-panel .vm-target-select { margin-bottom: 8px; }
            #vm-dlc-panel .vm-check-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
            #vm-dlc-panel .vm-check-row label { margin-bottom: 0; font-size: 11px; cursor: pointer; opacity: 0.9; }
            #vm-dlc-panel .vm-check-row input[type="checkbox"] { width: auto; cursor: pointer; }
            #vm-dlc-panel .vm-coord-row { display: flex; gap: 6px; align-items: center; margin-bottom: 8px; }
            #vm-dlc-panel .vm-coord-col { flex: 1; }
            #vm-dlc-panel .vm-btn-secondary { background: rgba(255,255,255,0.15) !important; color: #fff !important; }
            #vm-dlc-panel .vm-btn-secondary:hover { background: rgba(255,255,255,0.25) !important; }
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
                <div class="vm-sep"></div>
                <div class="vm-check-row">
                    <label for="vm-auto-op">⚡ Auto-Skip OP</label>
                    <input type="checkbox" id="vm-auto-op">
                </div>
                <div class="vm-check-row">
                    <label for="vm-auto-ed">⚡ Auto-Skip ED</label>
                    <input type="checkbox" id="vm-auto-ed">
                </div>
                <div class="vm-check-row">
                    <label for="vm-auto-advance">⏭️ Auto-Avanzar Frame en ED</label>
                    <input type="checkbox" id="vm-auto-advance" checked>
                </div>
                <div class="vm-sep"></div>
                <div class="vm-coord-row">
                    <div class="vm-coord-col">
                        <label>Coord X:</label>
                        <input type="number" id="vm-coord-x" value="0" min="0">
                    </div>
                    <div class="vm-coord-col">
                        <label>Coord Y:</label>
                        <input type="number" id="vm-coord-y" value="0" min="0">
                    </div>
                    <button id="vm-goto-coord" class="vm-btn-secondary" style="margin-top:14px; height:28px; padding:0 6px;">Ir a [X,Y]</button>
                </div>
                <div style="display:flex; gap:6px; margin-bottom:6px;">
                    <button id="vm-next-frame" class="vm-btn-secondary" style="flex:1; padding:4px 2px;">➡️ Frame [X+1, Y]</button>
                    <button id="vm-next-row" class="vm-btn-secondary" style="flex:1; padding:4px 2px;">⬇️ Fila [X, Y+1]</button>
                </div>
                <div class="vm-row" style="margin-bottom:6px; align-items:center;">
                    <label style="font-size:11px; opacity:0.8; margin-right:6px;">Flujo Auto:</label>
                    <select id="vm-flow-dir" style="flex:1; padding:3px 4px; border-radius:4px; background:#222; color:#fff; border:1px solid #444; font-size:11px;">
                        <option value="horizontal">➡️ Horizontal (X+1)</option>
                        <option value="vertical">⬇️ Vertical (Y+1)</option>
                    </select>
                </div>
                <button id="vm-apply">✨ Aplicar Configuración</button>
                <button id="vm-skip-op" style="margin-top: 6px;">⏭️ Saltar OP</button>
                <button id="vm-skip-ed" style="margin-top: 6px;">⏭️ Saltar ED</button>
                <button id="vm-clear" class="vm-danger" style="margin-top: 6px;">🗑️ Limpiar</button>
                <div class="vm-status" id="vm-status">Esperando videos...</div>
            </div>
        `;
        document.body.appendChild(panel);

        const header = document.getElementById('vm-toggle');
        let isDragging = false;
        let dragStart = { x: 0, y: 0 };
        let panelStart = { left: 0, top: 0 };
        let dragMoved = false;

        header.addEventListener('mousedown', (e) => {
            if (e.target.tagName === 'BUTTON') return;
            isDragging = true; dragMoved = false;
            panel.classList.add('dragging');
            const rect = panel.getBoundingClientRect();
            panel.style.left = rect.left + 'px';
            panel.style.top = rect.top + 'px';
            panel.style.right = 'auto'; panel.style.bottom = 'auto';
            dragStart.x = e.clientX; dragStart.y = e.clientY;
            panelStart.left = rect.left; panelStart.top = rect.top;
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            const dx = e.clientX - dragStart.x;
            const dy = e.clientY - dragStart.y;
            if (Math.abs(dx) > 4 || Math.abs(dy) > 4) dragMoved = true;
            let newLeft = panelStart.left + dx;
            let newTop = panelStart.top + dy;
            const videoBounds = getNearestVideoBounds();
            const panelRect = panel.getBoundingClientRect();
            if (videoBounds) {
                newLeft = Math.max(videoBounds.left, Math.min(newLeft, videoBounds.right - panelRect.width));
                newTop = Math.max(videoBounds.top, Math.min(newTop, videoBounds.bottom - panelRect.height));
            } else {
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
            if (!dragMoved) {
                panel.classList.toggle('collapsed');
                document.getElementById('vm-arrow').textContent = panel.classList.contains('collapsed') ? '▲' : '▼';
            }
        });

        function getNearestVideoBounds() {
            const videos = document.querySelectorAll('video, iframe[src*="youtube"]');
            if (videos.length === 0) return null;
            let bestVideo = null; let bestArea = 0;
            videos.forEach(video => {
                const rect = video.getBoundingClientRect();
                const isVisible = rect.width > 0 && rect.height > 0 &&
                    rect.bottom > 0 && rect.top < window.innerHeight &&
                    rect.right > 0 && rect.left < window.innerWidth;
                if (isVisible) {
                    const area = rect.width * rect.height;
                    if (area > bestArea) { bestArea = area; bestVideo = rect; }
                }
            });
            if (bestVideo) {
                return { left: bestVideo.left, top: bestVideo.top, right: bestVideo.right, bottom: bestVideo.bottom };
            }
            return null;
        }

        document.getElementById('vm-apply').addEventListener('click', applyConfig);
        document.getElementById('vm-skip-op').addEventListener('click', () => skipTo('op'));
        document.getElementById('vm-skip-ed').addEventListener('click', () => skipTo('ed'));
        document.getElementById('vm-clear').addEventListener('click', clearConfig);

        document.getElementById('vm-goto-coord').addEventListener('click', () => {
            const tx = parseInt(document.getElementById('vm-coord-x').value) || 0;
            const ty = parseInt(document.getElementById('vm-coord-y').value) || 0;
            if (window.iframeMatrixViewer && typeof window.iframeMatrixViewer.goToPosition === 'function') {
                window.iframeMatrixViewer.goToPosition(tx, ty);
                updateStatus(`📍 Navegando a [${tx}, ${ty}]`);
            } else {
                updateStatus(`❌ MatrixViewer no disponible`);
            }
        });

        document.getElementById('vm-next-frame').addEventListener('click', () => {
            if (window.autoAdvanceDLC && typeof window.autoAdvanceDLC.triggerAdvance === 'function') {
                window.autoAdvanceDLC.triggerAdvance('Navegación manual desde panel');
                updateStatus(`⏭️ Avanzando al siguiente frame`);
            } else if (window.iframeMatrixViewer && typeof window.iframeMatrixViewer.navigate === 'function') {
                window.iframeMatrixViewer.navigate(1, 0);
                updateStatus(`⏭️ Avanzado a siguiente frame`);
            }
        });

        document.getElementById('vm-auto-advance').addEventListener('change', (e) => {
            if (window.autoAdvanceDLC) {
                window.autoAdvanceDLC.setEnabled(e.target.checked);
            }
        });

        // Sincronizar coordenadas en vivo cuando la matriz navegue (manual o auto-advance)
        document.addEventListener('dlc:matrixNavigated', (e) => {
            if (e.detail && e.detail.to) {
                const cx = document.getElementById('vm-coord-x');
                const cy = document.getElementById('vm-coord-y');
                if (cx) cx.value = e.detail.to.x;
                if (cy) cy.value = e.detail.to.y;
                updateStatus('📍 Frame activo: [' + (e.detail.to.x + 1) + ', ' + (e.detail.to.y + 1) + ']');
            }
        });
    }

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
            const provider = getProviderName(v.src);
            const label = v.type === 'iframe' ? `${provider} ${i + 1}` : `Video HTML5 ${i + 1}`;
            const opt = document.createElement('option');
            opt.value = i;
            opt.textContent = label;
            select.appendChild(opt);
        });
        updateStatus(`${videos.length} video(s) detectado(s)`);
        window.__vmVideos = videos;
    }

    function updateStatus(msg) {
        const el = document.getElementById('vm-status');
        if (el) el.textContent = msg;
    }

    function applyConfig() {
        const select = document.getElementById('vm-video-select');
        const videos = window.__vmVideos || [];
        const idx = parseInt(select.value);
        if (isNaN(idx) || !videos[idx]) { updateStatus('❌ Selecciona un video válido'); return; }
        const video = videos[idx];
        let op = document.getElementById('vm-op').value.trim();
        let ed = document.getElementById('vm-ed').value.trim();
        const duration = document.getElementById('vm-duration').value || '90';
        const loop = document.getElementById('vm-loop').value.trim();
        const speed = document.getElementById('vm-speed').value.trim();
        const mute = document.getElementById('vm-mute').value.trim();
        const autoOp = document.getElementById('vm-auto-op').checked;
        const autoEd = document.getElementById('vm-auto-ed').checked;
        const autoAdvance = document.getElementById('vm-auto-advance').checked;

        if (autoOp && op && !op.startsWith('!')) op = '!' + op;
        if (autoEd && ed && !ed.startsWith('!')) ed = '!' + ed;
        if (window.autoAdvanceDLC) window.autoAdvanceDLC.setEnabled(autoAdvance);

        const parts = [`d=${duration}`];
        if (op) parts.push(`op=${op}`);
        if (ed) parts.push(`ed=${ed}`);
        if (loop) parts.push(`loop=${loop}`);
        if (speed) parts.push(`speed=${speed}`);
        if (mute) parts.push(`mute=${mute}`);
        if (autoAdvance) parts.push(`next=auto`);
        const hashParams = parts.join('&');
        registerVideo({ element: video.element, src: video.src + '#' + hashParams, type: video.type });
        updateStatus('✅ Configuración aplicada');
    }

    function skipTo(type) {
        const select = document.getElementById('vm-video-select');
        const videos = window.__vmVideos || [];
        const idx = parseInt(select.value);
        if (isNaN(idx) || !videos[idx]) { updateStatus('❌ Selecciona un video'); return; }
        const element = videos[idx].element;
        const timeStr = document.getElementById(`vm-${type}`).value.trim();
        if (!timeStr) { updateStatus(`❌ Define ${type.toUpperCase()} primero`); return; }
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
    // OBSERVADOR DE MUTACIONES
    // =========================================================================

    function setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            let hasNewVideo = false;
            for (const mutation of mutations) {
                for (const node of mutation.addedNodes) {
                    if (node.nodeType !== 1) continue;
                    const isVideo = node.tagName === 'VIDEO' || node.tagName === 'IFRAME';
                    const containsVideo = node.querySelector && node.querySelector('video, iframe');
                    if (isVideo || containsVideo) { hasNewVideo = true; break; }
                }
            }
            if (hasNewVideo) {
                updateVideoSelector();
                autoRegisterVideos();
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    function autoRegisterVideos() {
        detectVideos().forEach(video => {
            const params = extractParams(video.src, video.element);
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

        // ═══ ANTI-DOBLE-CARGA ═══
        // Si los módulos DLC ya están cargados (script.js auto-carga en matrices locales),
        // saltar la inyección y solo activar el bridge + UI flotante.
        if (window.dlcCoreEngine) {
            console.log('[VM-DLC] ✅ DLC ya presente (script.js auto-carga detectada)');
            console.log('[VM-DLC] Saltando inyección de scripts DLC...');
        } else {
            try {
                console.log('[VM-DLC] Cargando módulos DLC desde repositorio...');
                for (const script of DLC_SCRIPTS) {
                    const url = `${RAW_BASE}/${script}`;
                    console.log(`[VM-DLC] → ${script}`);
                    await loadScript(url);
                }
                console.log('[VM-DLC] ✅ Todos los módulos DLC cargados');

                await waitForGlobal('dlcCoreEngine');
                console.log('[VM-DLC] ✅ Core Engine inicializado');
            } catch (error) {
                console.error('[VM-DLC] Error durante la inicialización:', error);
                initMinimalMode();
                return;
            }
        }

        setupYouTubeBridge();
        console.log('[VM-DLC] ✅ YouTube Bridge activo');

        injectUI();
        console.log('[VM-DLC] ✅ Panel UI inyectado');

        setTimeout(() => {
            updateVideoSelector();
            autoRegisterVideos();
            console.log('[VM-DLC] ✅ Detección inicial completa');
        }, 1500);

        setupMutationObserver();
        console.log('[VM-DLC] ✅ MutationObserver activo');

        setInterval(updateVideoSelector, 5000);
    }

    function initMinimalMode() {
        console.warn('[VM-DLC] ⚠️ Modo mínimo activado (sin conexión al repositorio)');
        window.dlcCoreEngine = {
            seekVideo(element, seconds) {
                if (element.tagName === 'VIDEO') {
                    element.currentTime = seconds;
                    element.play();
                } else if (element.tagName === 'IFRAME') {
                    element.contentWindow.postMessage(JSON.stringify({
                        event: 'command', func: 'seekTo', args: [seconds, true]
                    }), '*');
                }
            },
            videos: new Map()
        };
        injectUI();
        setTimeout(updateVideoSelector, 1000);
    }

    // =========================================================================
    // EJECUTAR
    // =========================================================================

    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        main();
    } else {
        document.addEventListener('DOMContentLoaded', main);
    }
})();