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
     * DLC Module: Video Chapters
     * Dibuja un menú interactivo con marcadores y capítulos definidos en la URL.
     */
    class VideoChaptersDLC {
        constructor() {
            this.init();
        }

        init() {
            this.setupStyles();
            
            document.addEventListener('dlc:videoConfigured', (e) => {
                const { videoId, element, config } = e.detail;
                if (config.chapters) {
                    this.createChapterMenu(element, videoId, config.chapters);
                }
            });
        }

        setupStyles() {
            if (document.getElementById('dlc-chapters-styles')) return;

            const style = document.createElement('style');
            style.id = 'dlc-chapters-styles';
            style.textContent = `
                .video-chapters-container {
                    position: absolute;
                    bottom: 10px;
                    left: 10px;
                    z-index: 9999;
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                    background: rgba(0, 0, 0, 0.7);
                    padding: 8px;
                    border-radius: 8px;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    backdrop-filter: blur(5px);
                    max-height: 80%;
                    overflow-y: auto;
                    transition: opacity 0.3s ease;
                }

                .video-chapters-container:hover {
                    background: rgba(0, 0, 0, 0.85);
                }

                .video-chapters-title {
                    color: rgba(255,255,255,0.6);
                    font-size: 10px;
                    text-transform: uppercase;
                    margin-bottom: 4px;
                    font-family: sans-serif;
                    letter-spacing: 1px;
                }

                .video-chapter-btn {
                    background: transparent;
                    color: white;
                    border: none;
                    text-align: left;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 11px;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                    display: flex;
                    justify-content: space-between;
                    gap: 15px;
                }

                .video-chapter-btn:hover {
                    background: rgba(255, 255, 255, 0.15);
                }

                .video-chapter-time {
                    color: #4CAF50;
                    font-family: monospace;
                }
            `;
            document.head.appendChild(style);
        }

        createChapterMenu(element, videoId, chapters) {
            // Envolver el elemento si no está envuelto
            if (!element.parentElement.classList.contains('video-wrapper')) {
                const wrapper = document.createElement('div');
                wrapper.className = 'video-wrapper';
                wrapper.style.position = element.style.position || 'relative';
                element.parentNode.insertBefore(wrapper, element);
                wrapper.appendChild(element);
            }

            const wrapper = element.parentElement;
            
            const container = document.createElement('div');
            container.className = 'video-chapters-container';
            
            const title = document.createElement('div');
            title.className = 'video-chapters-title';
            title.textContent = 'Capítulos';
            container.appendChild(title);

            chapters.forEach(ch => {
                const btn = document.createElement('button');
                btn.className = 'video-chapter-btn';
                
                const formatTime = (secs) => {
                    const m = Math.floor(secs / 60).toString().padStart(2, '0');
                    const s = (secs % 60).toString().padStart(2, '0');
                    return \`\${m}:\${s}\`;
                };

                btn.innerHTML = \`<span>\${ch.label}</span> <span class="video-chapter-time">\${formatTime(ch.time)}</span>\`;
                
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    window.dlcCoreEngine.seekVideo(element, ch.time);
                });
                
                container.appendChild(btn);
            });

            wrapper.appendChild(container);
        }
    }

    // Inicializar el módulo
    window.videoChaptersDLC = new VideoChaptersDLC();

});
