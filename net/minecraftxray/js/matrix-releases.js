(function () {
    'use strict';

    function publish() {
        var h = Math.max(document.documentElement.scrollHeight || 0, document.body ? document.body.scrollHeight : 0);
        if (window.parent && window.parent !== window) {
            window.parent.postMessage({ type: 'xray-subframe-height', height: h }, '*');
        }
    }

    function applyZebra(table) {
        var rows = table.querySelectorAll('tr');
        var visibleIdx = 0;
        for (var i = 0; i < rows.length; i++) {
            var r = rows[i];
            r.classList.remove('zebra-even');
            if (r.classList.contains('rel-history') && !r.classList.contains('is-open')) continue;
            if (++visibleIdx % 2 === 0) r.classList.add('zebra-even');
        }
    }

    function rowDate(tr) {
        var d = tr.getAttribute('data-date');
        if (d) return d;
        var cells = tr.querySelectorAll('td');
        return cells.length >= 5 ? (cells[4].textContent || '').trim() : '';
    }

    function sortHistoryGroups(table) {
        table.querySelectorAll('tr[data-release-group]').forEach(function (anchor) {
            var group = anchor.getAttribute('data-release-group');
            var children = Array.prototype.slice.call(table.querySelectorAll('tr.rel-history[data-group="' + group + '"]'));
            if (!children.length) return;
            children.sort(function (a, b) { return rowDate(b).localeCompare(rowDate(a)); });
            var parent = anchor.parentNode, cursor = anchor.nextSibling;
            children.forEach(function (row) { parent.insertBefore(row, cursor); });
        });
    }

    function init() {
        document.querySelectorAll('table.canon-table').forEach(function (table) {
            if (table.dataset.xrayTableInit) return;
            table.dataset.xrayTableInit = '1';
            sortHistoryGroups(table);
            applyZebra(table);

            table.querySelectorAll('a.rel-toggle[data-target]').forEach(function (btn) {
                var group = btn.getAttribute('data-target');
                var count = table.querySelectorAll('tr.rel-history[data-group="' + group + '"]').length;
                if (!count) { btn.style.display = 'none'; return; }
                var collapsed = '[+' + count + ' previas]', expanded = '[- ocultar]';
                btn.textContent = collapsed;
                btn.addEventListener('click', function (ev) {
                    ev.preventDefault();
                    var rows = table.querySelectorAll('tr.rel-history[data-group="' + group + '"]');
                    var opening = rows.length && !rows[0].classList.contains('is-open');
                    rows.forEach(function (r) { r.classList.toggle('is-open', opening); });
                    btn.textContent = opening ? expanded : collapsed;
                    applyZebra(table);
                    publish();
                });
            });
        });
        publish();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
        init();
    }
    window.addEventListener('load', publish);
    window.addEventListener('resize', publish);
})();
