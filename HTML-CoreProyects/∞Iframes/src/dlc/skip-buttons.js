/**
 * DLC Module: Skip Buttons
 * Dibuja botones flotantes superpuestos al iframe basándose en los rangos de OP y ED configurados.
 * Auto-ocultamiento tras 5s con chevron invocador en el lateral más próximo al borde.
 */
class SkipButtonsDLC {
    constructor() {
        this.buttons = new Map();
        this.hideTimers = new Map(); // Timers de auto-ocultamiento por videoId
        this.HIDE_DELAY = 5000; // 5 segundos
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
                transition: transform 0.4s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.3s ease;
            }

            /* Estado retraído: se desliza hacia el borde más cercano (derecho) */
            .video-skip-container.retracted {
                transform: translateX(calc(100% + 10px));
                opacity: 0;
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

            /* Chevron invocador: aparece cuando los botones están ocultos */
            .skip-chevron-invoker {
                position: absolute;
                top: 10px;
                right: 0px;
                z-index: 9998;
                width: 28px;
                height: 28px;
                background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6));
                border: 1px solid rgba(255, 255, 255, 0.3);
                border-right: none;
                border-radius: 6px 0 0 6px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                pointer-events: auto;
                opacity: 0;
                transform: translateX(100%);
                transition: opacity 0.3s ease, transform 0.3s ease;
                backdrop-filter: blur(4px);
            }

            .skip-chevron-invoker.visible {
                opacity: 1;
                transform: translateX(0);
            }

            .skip-chevron-invoker svg {
                width: 16px;
                height: 16px;
                fill: white;
                transition: transform 0.3s ease;
            }

            .skip-chevron-invoker:hover svg {
                transform: scale(1.2);
            }

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

        // Crear el chevron invocador en el borde más próximo (derecho)
        const chevron = document.createElement('div');
        chevron.className = 'skip-chevron-invoker';
        chevron.innerHTML = '<svg viewBox="0 0 24 24"><path d="M15 18l-6-6 6-6"/></svg>';
        chevron.title = 'Mostrar botones de skip';

        // Al hacer clic en el chevron, expandir los botones y reiniciar el timer
        chevron.addEventListener('click', (e) => {
            e.stopPropagation();
            this.expandButtons(videoId);
        });

        // Al hacer hover sobre el chevron, expandir temporalmente
        chevron.addEventListener('mouseenter', () => {
            this.expandButtons(videoId);
        });

        wrapper.appendChild(chevron);
        buttonsMap.chevron = chevron;

        // Cuando el mouse entra a los botones, cancelar el timer de ocultamiento
        buttonContainer.addEventListener('mouseenter', () => {
            this.cancelHideTimer(videoId);
        });

        // Cuando el mouse sale de los botones, reiniciar el timer
        buttonContainer.addEventListener('mouseleave', () => {
            this.startHideTimer(videoId);
        });

        wrapper.appendChild(buttonContainer);
        this.buttons.set(videoId, { container: buttonContainer, buttons: buttonsMap, wrapper });
    }

    // Expandir los botones (quitar retraído) y ocultar el chevron
    expandButtons(videoId) {
        const btnData = this.buttons.get(videoId);
        if (!btnData) return;

        btnData.container.classList.remove('retracted');
        if (btnData.buttons.chevron) {
            btnData.buttons.chevron.classList.remove('visible');
        }
        this.startHideTimer(videoId);
    }

    // Retraer los botones y mostrar el chevron
    retractButtons(videoId) {
        const btnData = this.buttons.get(videoId);
        if (!btnData) return;

        btnData.container.classList.add('retracted');
        if (btnData.buttons.chevron) {
            btnData.buttons.chevron.classList.add('visible');
        }
    }

    // Iniciar el timer de auto-ocultamiento
    startHideTimer(videoId) {
        this.cancelHideTimer(videoId);
        const timer = setTimeout(() => {
            this.retractButtons(videoId);
        }, this.HIDE_DELAY);
        this.hideTimers.set(videoId, timer);
    }

    // Cancelar el timer de auto-ocultamiento
    cancelHideTimer(videoId) {
        const timer = this.hideTimers.get(videoId);
        if (timer) {
            clearTimeout(timer);
            this.hideTimers.delete(videoId);
        }
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

        let anyVisible = false;

        if (config.op && !config.op.auto && btnData.buttons.op) {
            const visible = currentTime >= config.op.start && currentTime <= config.op.end;
            btnData.buttons.op.classList.toggle('visible', visible);
            if (visible) anyVisible = true;
        }

        if (config.ed && !config.ed.auto && btnData.buttons.ed) {
            const visible = currentTime >= config.ed.start && currentTime <= config.ed.end;
            btnData.buttons.ed.classList.toggle('visible', visible);
            if (visible) anyVisible = true;
        }

        // Cuando un botón se vuelve visible, iniciar el timer de auto-ocultamiento
        if (anyVisible && !this.hideTimers.has(videoId)) {
            this.startHideTimer(videoId);
        }
    }
}

// Universal DLC Auto-Loader Wrapper
(window._dlcBoot = window._dlcBoot || function (init) {
    if (window.dlcCoreEngine) return init();
    if (!window._dlcWait) {
        window._dlcWait = true;
        const s = document.createElement('script');
        s.src = (document.currentScript ? document.currentScript.src.replace(/[^\/]+$/, '') : './src/dlc/') + 'core-engine.js';
        s.onload = () => { document.dispatchEvent(new CustomEvent('dlc:core')); init(); };
        document.head.appendChild(s);
    } else document.addEventListener('dlc:core', init, { once: true });
})(() => {
    window.skipButtonsDLC = new SkipButtonsDLC();
});