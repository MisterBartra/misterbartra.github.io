/**
 * Progressive Hydration & Multi-Tier Image Fallback with Cooldown Probe
 * 
 * 1. Carga Inmediata: Muestra el recurso local en 0ms sin parpadeos ni huecos en blanco.
 * 2. Sondeo en Segundo Plano con Cooldown: Verifica en background el enlace RAW de Web Archive
 *    con un temporizador de respiro (cooldown de 2.5 segundos).
 * 3. Preservación Robusta: Si Archive responde OK antes del cooldown, valida el estado canónico.
 *    Si Archive falla (429 rate-limit, 404, offline o timeout), preserva la copia local sin cortes.
 * 4. Cascada Defensiva: Si el archivo local no existiera, recurre en cascada a ao/img/ o SVG.
 */
(function() {
    'use strict';

    var ARCHIVE_COOLDOWN_MS = 2500;

    function applyImgFallback(img, primaryFallback, secondaryFallback) {
        if (!img) return;
        var step = parseInt(img.dataset.fallbackStep || '0', 10);

        if (step === 0 && primaryFallback && primaryFallback !== img.src) {
            img.dataset.fallbackStep = '1';
            img.src = primaryFallback;
            return;
        }
        if ((step === 0 || step === 1) && secondaryFallback && secondaryFallback !== img.src) {
            img.dataset.fallbackStep = '2';
            img.src = secondaryFallback;
            return;
        }

        if (img.dataset.fallbackStep !== 'done') {
            img.dataset.fallbackStep = 'done';
            var label = img.alt ? img.alt.replace(/'/g, "\\'") : 'X-Ray Asset';
            img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(
                "<svg xmlns='http://www.w3.org/2000/svg' width='480' height='260' viewBox='0 0 480 260'>" +
                "<rect width='100%' height='100%' fill='#181a20' stroke='#333a4d' stroke-width='2' rx='8'/>" +
                "<circle cx='240' cy='105' r='32' fill='#242938' stroke='#4f5b7a' stroke-width='1.5'/>" +
                "<text x='240' y='112' font-size='22' text-anchor='middle' fill='#818cf8' font-family='sans-serif'>💎</text>" +
                "<text x='240' y='165' font-size='15' font-weight='bold' text-anchor='middle' fill='#e2e8f0' font-family='sans-serif'>[ " + label + " ]</text>" +
                "<text x='240' y='190' font-size='11' text-anchor='middle' fill='#64748b' font-family='monospace'>Recurso Canónico Preservado (Fallback Local)</text>" +
                "</svg>"
            );
        }
    }

    function initProgressiveArchiveCooldown() {
        var images = document.querySelectorAll('img[data-raw-archive]');
        images.forEach(function(img) {
            var rawArchiveUrl = img.getAttribute('data-raw-archive');
            if (!rawArchiveUrl || img.dataset.probeStarted) return;
            img.dataset.probeStarted = 'true';

            var probe = new Image();
            var timerId = null;
            var completed = false;

            // Timer de cooldown: si Archive tarda más de ARCHIVE_COOLDOWN_MS, aborta y mantiene local
            timerId = setTimeout(function() {
                if (!completed) {
                    completed = true;
                    probe.src = ''; // Cancel probe
                    img.title = (img.title ? img.title + ' · ' : '') + 'Copia Local Preservada Activa (Archive Cooldown Expirado)';
                }
            }, ARCHIVE_COOLDOWN_MS);

            probe.onload = function() {
                if (!completed) {
                    completed = true;
                    if (timerId) clearTimeout(timerId);
                    img.dataset.archiveVerified = 'true';
                    img.title = (img.title ? img.title + ' · ' : '') + 'Snapshot RAW Canónico de Web Archive Verificado';
                }
            };

            probe.onerror = function() {
                if (!completed) {
                    completed = true;
                    if (timerId) clearTimeout(timerId);
                    // Ante error en Archive (429, 404, offline), se asegura de conservar la copia local
                    img.dataset.archiveAvailable = 'false';
                }
            };

            probe.src = rawArchiveUrl;
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initProgressiveArchiveCooldown);
    } else {
        initProgressiveArchiveCooldown();
    }

    window.applyImgFallback = applyImgFallback;
    window.initProgressiveArchiveCooldown = initProgressiveArchiveCooldown;
})();
