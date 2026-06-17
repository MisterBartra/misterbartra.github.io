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

    /**
     * DLC Module: Video Loop
     * Detecta rangos de tiempo configurados con el parámetro 'loop' y fuerza al reproductor
     * a regresar al inicio del rango cada vez que alcance el final, creando un bucle infinito.
     */
    class VideoLoopDLC {
        constructor() {
            this.init();
        }

        init() {
            // Escuchar las actualizaciones de tiempo
            document.addEventListener('dlc:timeUpdate', (e) => {
                const { element, config, currentTime } = e.detail;
                
                // Verificar si hay loop configurado
                if (config.loop) {
                    if (currentTime >= config.loop.end) {
                        // Si alcanzamos o superamos el final, saltar de vuelta al inicio
                        window.dlcCoreEngine.seekVideo(element, config.loop.start);
                    }
                }
            });
        }
    }

    // Inicializar el módulo
    window.videoLoopDLC = new VideoLoopDLC();

});
