(function (global) {
    'use strict';

    function measureHeight() {
        return Math.max(
            document.documentElement.scrollHeight || 0,
            document.body ? document.body.scrollHeight : 0
        );
    }

    function onReady(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn, { once: true });
        } else {
            fn();
        }
    }

    function readParams() {
        var out = {};
        [window.location.search, window.location.hash].forEach(function (src) {
            if (!src) return;
            src.replace(/^[?#]/, '').split('&').forEach(function (pair) {
                var idx = pair.indexOf('=');
                if (idx <= 0) return;
                out[pair.substring(0, idx).toLowerCase()] = decodeURIComponent(pair.substring(idx + 1));
            });
        });
        return out;
    }

    function publishHeight(messageType) {
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: messageType, height: measureHeight() }, '*');
        }
    }

    function applyHeight(frame, height, minHeight, pad) {
        var h = Math.max(minHeight || 120, Number(height) || 0);
        if (h > 0) frame.style.height = (h + (pad != null ? pad : 4)) + 'px';
    }

    function measureChild(frame, minHeight, pad) {
        try {
            var doc = frame.contentDocument;
            if (doc && doc.documentElement) applyHeight(frame, doc.documentElement.scrollHeight, minHeight, pad);
        } catch (ignored) {}
    }

    function bindHost(frame, messageType, options) {
        if (!frame || frame.dataset.xrayHostBound) return;
        frame.dataset.xrayHostBound = '1';
        options = options || {};
        var minH = options.minHeight || 120;
        var pad = options.padding != null ? options.padding : 4;

        window.addEventListener('message', function (ev) {
            if (!ev.data || (frame.contentWindow && ev.source && ev.source !== frame.contentWindow)) return;
            if (ev.data.type === messageType) {
                applyHeight(frame, ev.data.height, minH, pad);
                if (typeof options.onResize === 'function') options.onResize(ev.data.height);
            } else if (ev.data.type === 'xray-route-sync' && options.syncHash && ev.data.suite && ev.data.ver) {
                var nextHash = '#suite=' + ev.data.suite + '&ver=' + ev.data.ver;
                if (window.location.hash !== nextHash) history.replaceState(null, '', nextHash);
            }
        });

        frame.addEventListener('load', function () {
            measureChild(frame, minH, pad);
            if (typeof options.onLoad === 'function') options.onLoad();
        });
        window.addEventListener('resize', function () { measureChild(frame, minH, pad); });
    }

    function autoBindHosts() {
        document.querySelectorAll('iframe[data-xray-frame-host]').forEach(function (frame) {
            var syncHash = frame.getAttribute('data-xray-route-sync') === 'true';
            if (syncHash && window.location.hash && !frame.dataset.xrayHashApplied) {
                frame.dataset.xrayHashApplied = '1';
                var baseSrc = (frame.getAttribute('src') || '').split('#')[0];
                frame.setAttribute('src', baseSrc + window.location.hash);
            }
            bindHost(frame, frame.getAttribute('data-xray-frame-host'), {
                minHeight: Number(frame.getAttribute('data-xray-min-height')) || 180,
                padding: 8,
                syncHash: syncHash
            });
        });
    }

    global.XRayFrameBridge = {
        onReady: onReady,
        readParams: readParams,
        publishHeight: publishHeight,
        bindHost: bindHost
    };

    onReady(autoBindHosts);
})(window);
