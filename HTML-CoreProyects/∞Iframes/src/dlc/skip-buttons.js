/**
 * DLC Module: Skip Buttons
 * Dibuja botones flotantes superpuestos al iframe basándose en los rangos de OP y ED configurados.
 */
class SkipButtonsDLC {
    constructor() {
        this.buttons = new Map();
        this.init();
    }

    init() {
        this.setupStyles();
        
        // Escuchar cuando un video ha sido configurado y está listo
        document.addEventListener('dlc:videoConfigured', (e) => {
            const { videoId, element, config } = e.detail;
            this.createButtonContainer(element, videoId, config);
        });

        // Escuchar las actualizaciones de tiempo para mostrar/ocultar botones
        document.addEventListener('dlc:timeUpdate', (e) => {
            const { videoId, element, config, currentTime } = e.detail;
            this.checkTimeRange(videoId, element, config, currentTime);
        });
    }

    setupStyles() {
        if (document.getElementById('dlc-skip-buttons-styles')) return;

        const style = document.createElement('style');
        style.id = 'dlc-skip-buttons-styles';
        style.textContent = `
            .video-skip-container {
                position: absolute;
                top: 10px;
                right: 10px;
                z-index: 9999;
                display: flex;
                gap: 8px;
                pointer-events: none;
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
                display: none; /* Oculto por defecto */
                opacity: 0;
                align-items: center;
                gap: 4px;
                min-width: 80px;
                justify-content: center;
                pointer-events: auto;
            }

            .video-skip-button.visible {
                display: flex;
                opacity: 1;
            }

            .video-skip-button:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }

            .video-skip-button.op-skip { background: linear-gradient(135deg, rgba(33, 150, 243, 0.8), rgba(33, 150, 243, 0.6)); }
            .video-skip-button.ed-skip { background: linear-gradient(135deg, rgba(76, 175, 80, 0.8), rgba(76, 175, 80, 0.6)); }
            .video-skip-button.op-skip:hover { background: linear-gradient(135deg, rgba(33, 150, 243, 0.9), rgba(33, 150, 243, 0.7)); }
            .video-skip-button.ed-skip:hover { background: linear-gradient(135deg, rgba(76, 175, 80, 0.9), rgba(76, 175, 80, 0.7)); }

            .video-wrapper {
                position: relative;
            }
        `;
        document.head.appendChild(style);
    }

    createButtonContainer(element, videoId, config) {
        // Ignorar si no hay OP o ED configurados para botones (Auto-skips u otros comandos se ignoran aquí)
        if (!config.op && !config.ed) return;

        // Envolver el elemento si no está envuelto
        if (!element.parentElement.classList.contains('video-wrapper')) {
            const wrapper = document.createElement('div');
            wrapper.className = 'video-wrapper';
            wrapper.style.position = element.style.position || 'relative';
            element.parentNode.insertBefore(wrapper, element);
            wrapper.appendChild(element);
        }

        const wrapper = element.parentElement;
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'video-skip-container';
        buttonContainer.id = `skip-buttons-${videoId}`;

        const buttonsMap = {};

        if (config.op && !config.op.auto) {
            const opBtn = this.createSkipButton('op', config.op, element);
            buttonContainer.appendChild(opBtn);
            buttonsMap.op = opBtn;
        }

        if (config.ed && !config.ed.auto) {
            const edBtn = this.createSkipButton('ed', config.ed, element);
            buttonContainer.appendChild(edBtn);
            buttonsMap.ed = edBtn;
        }

        wrapper.appendChild(buttonContainer);
        this.buttons.set(videoId, { container: buttonContainer, buttons: buttonsMap });
    }

    createSkipButton(type, configObj, element) {
        const btn = document.createElement('div');
        btn.className = `video-skip-button ${type}-skip`;
        
        const label = type.toUpperCase() === 'OP' ? 'Skip OP' : 'Skip ED';
        btn.innerHTML = `<svg class="icon" viewBox="0 0 24 24"><path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/></svg> ${label}`;

        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            window.dlcCoreEngine.seekVideo(element, configObj.end);
            btn.classList.remove('visible');
        });

        return btn;
    }

    checkTimeRange(videoId, element, config, currentTime) {
        const btnData = this.buttons.get(videoId);
        if (!btnData) return;

        if (config.op && !config.op.auto && btnData.buttons.op) {
            const visible = currentTime >= config.op.start && currentTime <= config.op.end;
            btnData.buttons.op.classList.toggle('visible', visible);
        }

        if (config.ed && !config.ed.auto && btnData.buttons.ed) {
            const visible = currentTime >= config.ed.start && currentTime <= config.ed.end;
            btnData.buttons.ed.classList.toggle('visible', visible);
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
    window.skipButtonsDLC = new SkipButtonsDLC();
});
