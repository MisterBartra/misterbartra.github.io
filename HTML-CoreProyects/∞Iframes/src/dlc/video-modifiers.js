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
     * DLC Module: Video Modifiers
     * Controla modificaciones al reproductor como mutear o cambiar la velocidad
     * cuando se entra a rangos específicos de tiempo.
     */
    class VideoModifiersDLC {
        constructor() {
            // Guardar estado previo para poder restaurarlo al salir del rango
            this.states = new Map();
            this.init();
        }

        init() {
            document.addEventListener('dlc:timeUpdate', (e) => {
                const { videoId, element, config, currentTime } = e.detail;
                
                if (!this.states.has(videoId)) {
                    this.states.set(videoId, { isMuted: false, isSpeedModified: false });
                }
                const state = this.states.get(videoId);

                // Control de Mute
                if (config.mute) {
                    const inMuteRange = currentTime >= config.mute.start && currentTime <= config.mute.end;
                    if (inMuteRange && !state.isMuted) {
                        window.dlcCoreEngine.setVolume(element, true);
                        state.isMuted = true;
                    } else if (!inMuteRange && state.isMuted) {
                        window.dlcCoreEngine.setVolume(element, false);
                        state.isMuted = false;
                    }
                }

                // Control de Velocidad (Speed)
                if (config.speed) {
                    const inSpeedRange = currentTime >= config.speed.start && currentTime <= config.speed.end;
                    const targetSpeed = config.speed.value || 1.0;
                    
                    if (inSpeedRange && !state.isSpeedModified) {
                        window.dlcCoreEngine.setPlaybackRate(element, targetSpeed);
                        state.isSpeedModified = true;
                    } else if (!inSpeedRange && state.isSpeedModified) {
                        window.dlcCoreEngine.setPlaybackRate(element, 1.0);
                        state.isSpeedModified = false;
                    }
                }
            });
        }
    }

    // Inicializar el módulo
    window.videoModifiersDLC = new VideoModifiersDLC();

});
