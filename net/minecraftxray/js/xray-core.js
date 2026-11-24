/**
 * XRayCore Modular Data Runtime
 * Single Source of Truth consumer that hydrates pages and components from manifest.json and changelog.json.
 */
(function() {
    'use strict';

    var XRayCore = {
        manifest: null,
        changelog: null,
        basePath: '',

        init: function() {
            // Compute base path relative to current HTML location
            var scripts = document.getElementsByTagName('script');
            for (var i = 0; i < scripts.length; i++) {
                var src = scripts[i].src || '';
                if (src.indexOf('xray-core.js') !== -1) {
                    var idx = src.indexOf('/js/xray-core.js');
                    if (idx !== -1) {
                        XRayCore.basePath = src.substring(0, idx + 1);
                    }
                    break;
                }
            }
            if (!XRayCore.basePath) {
                // Fallback relative determination
                XRayCore.basePath = (window.location.pathname.indexOf('/ao/') !== -1 ||
                                     window.location.pathname.indexOf('/dlb/') !== -1 ||
                                     window.location.pathname.indexOf('/mb/') !== -1) ? '../' : './';
            }

            Promise.all([
                XRayCore.fetchJson(XRayCore.basePath + 'data/manifest.json'),
                XRayCore.fetchJson(XRayCore.basePath + 'data/changelog.json')
            ]).then(function(results) {
                XRayCore.manifest = results[0];
                XRayCore.changelog = results[1];
                XRayCore.hydrateComponents();
            }).catch(function(err) {
                console.warn('XRayCore manifest loading note:', err);
            });
        },

        fetchJson: function(url) {
            return fetch(url).then(function(resp) {
                if (!resp.ok) throw new Error('HTTP ' + resp.status + ' on ' + url);
                return resp.json();
            });
        },

        hydrateComponents: function() {
            var elements = document.querySelectorAll('[data-xray-component]');
            elements.forEach(function(el) {
                var comp = el.getAttribute('data-xray-component');
                var param = el.getAttribute('data-xray-param') || '';
                switch (comp) {
                    case 'suite-selector':
                        XRayCore.renderSuiteSelector(el);
                        break;
                    case 'suite-cards':
                        XRayCore.renderSuiteCards(el);
                        break;
                    case 'suite-detail':
                        XRayCore.renderSuiteDetail(el, param);
                        break;
                    case 'matrix-table':
                    case 'downloads-table':
                        XRayCore.renderDownloadsTable(el, param);
                        break;
                    case 'controls-table':
                        XRayCore.renderControlsTable(el);
                        break;
                    case 'runtime-modes':
                        XRayCore.renderRuntimeModes(el);
                        break;
                    case 'changelog-list':
                        XRayCore.renderChangelog(el);
                        break;
                    case 'embed-iframe':
                        XRayCore.renderIframe(el, param);
                        break;
                }
            });
        },

        renderSuiteSelector: function(container) {
            if (!XRayCore.manifest) return;
            var suites = XRayCore.manifest.suites;
            var html = '<div class="suite-selector-bar" style="display:flex; justify-content:center; gap:10px; margin:1.5em 0; flex-wrap:wrap;">';
            for (var key in suites) {
                var s = suites[key];
                var href = XRayCore.basePath + key + '.html';
                html += '<a href="' + href + '" class="suite-pill suite-pill-' + key + '" style="padding:6px 14px; text-decoration:none; border-radius:4px; font-weight:bold; color:#fff; background:' + s.badgeColor + ';">' + s.name + ' &middot; ' + s.author + '</a>';
            }
            html += '</div>';
            container.innerHTML = html;
        },

        renderSuiteCards: function(container) {
            if (!XRayCore.manifest) return;
            var suites = XRayCore.manifest.suites;
            var html = '<div class="suite-card-grid" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(240px, 1fr)); gap:15px; margin:1.5em 0;">';
            for (var key in suites) {
                var s = suites[key];
                html += '<div class="suite-card" style="border-left: 4px solid ' + s.badgeColor + '; padding:12px; background:#f4f5f8; border-radius:4px;">';
                html += '<h4 style="margin:0 0 5px; color:' + s.badgeColor + ';">' + s.name + ' (' + s.author + ')</h4>';
                html += '<p style="font-size:0.9em; margin:0 0 8px; color:#444;">' + s.role + '</p>';
                html += '<ul style="margin:0 0 10px; padding-left:18px; font-size:0.85em;">';
                for (var i = 0; i < s.highlights.length; i++) {
                    html += '<li>' + s.highlights[i] + '</li>';
                }
                html += '</ul>';
                html += '<a href="' + XRayCore.basePath + key + '.html" style="font-size:0.85em; font-weight:bold; color:' + s.badgeColor + ';">Ver Documentación Completa &rarr;</a>';
                html += '</div>';
            }
            html += '</div>';
            container.innerHTML = html;
        },

        renderSuiteDetail: function(container, suiteId) {
            if (!XRayCore.manifest || !XRayCore.manifest.suites[suiteId]) return;
            var s = XRayCore.manifest.suites[suiteId];
            var html = '<div class="suite-detail-panel" style="border:1px solid #ccc; border-radius:6px; padding:15px; background:#fff; margin:1em 0;">';
            html += '<h3 style="color:' + s.badgeColor + '; margin-top:0;">' + s.fullName + '</h3>';
            html += '<p><strong>Autor / Dueño:</strong> ' + s.author + ' | <strong>Capa:</strong> Nivel ' + s.layer + '</p>';
            html += '<p><strong>Artefacto Maven:</strong> <code>' + s.mavenArtifact + '</code></p>';
            html += '<p><strong>Target JVM:</strong> ' + s.javaTarget + ' | <strong>Formato Config:</strong> ' + s.storageFormat + '</p>';
            if (s.classloader) html += '<p><strong>Classloader:</strong> <code>' + s.classloader + '</code></p>';
            html += '<h4>Paquetes Principales:</h4><ul>';
            for (var p = 0; p < s.packages.length; p++) {
                html += '<li><code>' + s.packages[p] + '</code></li>';
            }
            html += '</ul><h4>Puntos Clave:</h4><ul>';
            for (var h = 0; h < s.highlights.length; h++) {
                html += '<li>' + s.highlights[h] + '</li>';
            }
            html += '</ul></div>';
            container.innerHTML = html;
        },

        renderDownloadsTable: function(container, filterSuite) {
            if (!XRayCore.manifest) return;
            var list = XRayCore.manifest.minecraftVersions;
            var html = '<table id="versionstable" style="width:100%; border-collapse:collapse; margin:1em 0;">';
            html += '<tr style="background:#e0e0e0;"><th style="padding:6px; border:1px solid #ccc; text-align:left;">Versión Minecraft</th><th style="padding:6px; border:1px solid #ccc; text-align:left;">Suite Responsable</th><th style="padding:6px; border:1px solid #ccc; text-align:left;">Estado</th><th style="padding:6px; border:1px solid #ccc; text-align:left;">Mod-Loader / Runtime</th><th style="padding:6px; border:1px solid #ccc; text-align:left;">JAR Descargable</th></tr>';
            for (var i = 0; i < list.length; i++) {
                var item = list[i];
                if (filterSuite && item.suite !== filterSuite) continue;
                var suiteInfo = XRayCore.manifest.suites[item.suite] || { name: item.suite, badgeColor: '#555' };
                html += '<tr>';
                html += '<td style="padding:6px; border:1px solid #ccc;"><strong>' + item.version + '</strong></td>';
                html += '<td style="padding:6px; border:1px solid #ccc;"><span style="color:' + suiteInfo.badgeColor + '; font-weight:bold;">' + suiteInfo.name + '</span></td>';
                html += '<td style="padding:6px; border:1px solid #ccc;">' + item.status + '</td>';
                html += '<td style="padding:6px; border:1px solid #ccc;">' + item.loader + '</td>';
                html += '<td style="padding:6px; border:1px solid #ccc;"><code>' + item.downloadJar + '</code></td>';
                html += '</tr>';
            }
            html += '</table>';
            container.innerHTML = html;
        },

        renderControlsTable: function(container) {
            if (!XRayCore.manifest) return;
            var controls = XRayCore.manifest.controls;
            var html = '<table style="width:100%; border-collapse:collapse; margin:1em 0;">';
            html += '<tr style="background:#e0e0e0;"><th style="padding:6px; border:1px solid #ccc; text-align:left;">Acción</th><th style="padding:6px; border:1px solid #ccc; text-align:left;">Tecla / Atajo</th><th style="padding:6px; border:1px solid #ccc; text-align:left;">Descripción</th><th style="padding:6px; border:1px solid #ccc; text-align:left;">Suites</th></tr>';
            for (var i = 0; i < controls.length; i++) {
                var c = controls[i];
                html += '<tr>';
                html += '<td style="padding:6px; border:1px solid #ccc;"><strong>' + c.action + '</strong></td>';
                html += '<td style="padding:6px; border:1px solid #ccc;"><kbd style="background:#eee; padding:2px 6px; border:1px solid #aaa; border-radius:3px;">' + c.defaultKey + '</kbd></td>';
                html += '<td style="padding:6px; border:1px solid #ccc;">' + c.description + '</td>';
                html += '<td style="padding:6px; border:1px solid #ccc;">' + c.suites.join(', ').toUpperCase() + '</td>';
                html += '</tr>';
            }
            html += '</table>';
            container.innerHTML = html;
        },

        renderRuntimeModes: function(container) {
            if (!XRayCore.manifest) return;
            var modes = XRayCore.manifest.runtimeModes;
            var html = '<div class="runtime-modes" style="margin:1em 0;">';
            for (var i = 0; i < modes.length; i++) {
                var m = modes[i];
                html += '<div style="margin-bottom:12px; padding:10px; background:#f9f9fa; border-left:3px solid #2a75d3; border-radius:3px;">';
                html += '<strong>Mode ' + m.mode + ' &mdash; ' + m.name + '</strong> <span style="font-size:0.85em; color:#666;">(' + m.type + ')</span>';
                html += '<p style="margin:4px 0 0; font-size:0.9em; color:#333;">' + m.description + '</p>';
                html += '</div>';
            }
            html += '</div>';
            container.innerHTML = html;
        },

        renderChangelog: function(container) {
            if (!XRayCore.changelog) return;
            var releases = XRayCore.changelog.releases;
            var html = '<div class="changelog-timeline" style="margin:1em 0;">';
            for (var i = 0; i < releases.length; i++) {
                var r = releases[i];
                var s = (XRayCore.manifest && XRayCore.manifest.suites[r.suite]) ? XRayCore.manifest.suites[r.suite] : { badgeColor: '#333', name: r.suite.toUpperCase() };
                html += '<div class="release-item" style="margin-bottom:20px; border-bottom:1px solid #eee; padding-bottom:15px;">';
                html += '<h3 style="margin:0 0 5px; color:' + s.badgeColor + ';">v' + r.version + ' &mdash; ' + r.title + '</h3>';
                html += '<p style="font-size:0.85em; color:#666; margin:0 0 8px;">Minecraft: ' + r.minecraft + ' | Fecha: ' + r.date + ' | Suite: <strong>' + s.name + ' (' + r.author + ')</strong></p>';
                html += '<ul style="margin:0; padding-left:20px; font-size:0.9em;">';
                for (var c = 0; c < r.changes.length; c++) {
                    html += '<li>' + r.changes[c] + '</li>';
                }
                html += '</ul></div>';
            }
            html += '</div>';
            container.innerHTML = html;
        },

        renderIframe: function(container, url) {
            var iframe = document.createElement('iframe');
            iframe.src = url;
            iframe.style.width = '100%';
            iframe.style.height = '480px';
            iframe.style.border = '1px solid #ccc';
            iframe.style.borderRadius = '4px';
            container.appendChild(iframe);
        }
    };

    window.XRayCore = XRayCore;
    document.addEventListener('DOMContentLoaded', XRayCore.init);
})();
