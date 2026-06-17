/**
 * DLC Module: Auto Skip
 * Obliga al reproductor a saltar si entra en un rango definido con el símbolo '!'.
 */
class AutoSkipDLC {
    constructor() {
        this.init();
    }

    init() {
        // Escuchar las actualizaciones de tiempo
        document.addEventListener('dlc:timeUpdate', (e) => {
            const { element, config, currentTime } = e.detail;
            
            // Verificar si hay auto-skip configurado para OP
            if (config.op && config.op.auto) {
                if (currentTime >= config.op.start && currentTime < config.op.end) {
                    window.dlcCoreEngine.seekVideo(element, config.op.end);
                }
            }

            // Verificar si hay auto-skip configurado para ED
            if (config.ed && config.ed.auto) {
                if (currentTime >= config.ed.start && currentTime < config.ed.end) {
                    window.dlcCoreEngine.seekVideo(element, config.ed.end);
                }
            }
        });
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
    window.autoSkipDLC = new AutoSkipDLC();
});
