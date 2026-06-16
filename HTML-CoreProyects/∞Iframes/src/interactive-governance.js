/**
 * Interactive Governance & Global Context Menu
 * Unificación en Vanilla JS de protecciones DRM, marca de agua y menú contextual.
 */
class InteractiveGovernance {
    constructor(options = {}) {
        // Configuraciones opcionales para personalizar el menú por defecto
        this.defaultMenuItems = options.defaultMenuItems || [
            { label: 'Recargar Vista', action: () => window.location.reload() },
            { label: 'Volver al Inicio', action: () => window.location.hash = '' }
        ];

        // Context Menu State
        this.contextMenuState = {
            isOpen: false,
            x: 0,
            y: 0,
            items: [],
            element: null
        };

        this.init();
    }

    init() {
        this.setupStyles();
        this.setupGovernance();
        this.setupContextMenu();
    }

    setupStyles() {
        const styleId = 'interactive-governance-styles';
        if (document.getElementById(styleId)) return;

        const style = document.createElement('style');
        style.id = styleId;
        style.textContent = `
            /* Gobernanza CSS Global */
            body {
                user-select: none !important;
                -webkit-user-select: none !important;
            }

            input, textarea, button, a, select, option, [role="button"], .interactive, .allow-select, [draggable="true"] {
                user-select: auto !important;
                -webkit-user-select: auto !important;
            }

            button, a, select, [role="button"], .interactive, [draggable="true"] {
                cursor: pointer !important;
            }

            input:not([type="button"]):not([type="submit"]):not([type="checkbox"]):not([type="radio"]), textarea {
                cursor: text !important;
            }



            /* Context Menu Styles */
            .global-context-menu {
                position: fixed;
                z-index: 999999;
                background: rgba(15, 15, 19, 0.9);
                backdrop-filter: blur(16px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 12px;
                box-shadow: 0 20px 40px rgba(0,0,0,0.6);
                padding: 6px;
                display: flex;
                flex-direction: column;
                gap: 2px;
                min-width: 180px;
                opacity: 0;
                transform: scale(0.95) translateY(-5px);
                transition: opacity 0.15s ease-out, transform 0.15s ease-out;
                pointer-events: none;
            }

            .global-context-menu.open {
                opacity: 1;
                transform: scale(1) translateY(0);
                pointer-events: auto;
            }

            .global-context-menu button {
                width: 100%;
                text-align: left;
                padding: 10px 12px;
                border-radius: 8px;
                border: none;
                background: transparent;
                color: #cbd5e1;
                font-size: 12px;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.05em;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                gap: 12px;
                font-family: inherit;
            }

            .global-context-menu button:hover {
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }

            .global-context-menu button.danger {
                color: #f87171;
            }

            .global-context-menu button.danger:hover {
                background: rgba(239, 68, 68, 0.1);
                color: #fca5a5;
            }
        `;
        document.head.appendChild(style);
    }

    setupGovernance() {
        const isAllowedTarget = (target) => {
            if (!target) return false;
            let element = target instanceof Element ? target : target.parentElement;
            if (!element) return false;

            const allowed = [
                'input', 'textarea', 'button', 'a', 'select', 'option',
                '[role="button"]', '.interactive', '.allow-select', '[draggable="true"]'
            ].join(', ');

            return element.matches(allowed) || element.closest(allowed);
        };

        document.addEventListener('selectstart', (e) => {
            if (!isAllowedTarget(e.target)) e.preventDefault();
        });

        document.addEventListener('dragstart', (e) => {
            let element = e.target instanceof Element ? e.target : e.target.parentElement;
            if (!element || (!element.matches('[draggable="true"]') && !element.closest('[draggable="true"]'))) {
                e.preventDefault();
            }
        });

        document.addEventListener('keydown', (e) => {
            const key = e.key.toLowerCase();
            const isF12 = key === 'f12';
            const isFirefoxShift = e.shiftKey && ['f7', 'f5', 'f2'].includes(key);
            const isWinDevTools = e.ctrlKey && e.shiftKey && ['i', 'j', 'c', 'k', 'e'].includes(key);
            const isMacDevTools = e.metaKey && e.altKey && ['i', 'j', 'c', 'u', 'k'].includes(key);
            const isViewSource = (e.ctrlKey || e.metaKey) && key === 'u';
            const isSavePage = (e.ctrlKey || e.metaKey) && key === 's';

            if (isF12 || isFirefoxShift || isWinDevTools || isMacDevTools || isViewSource || isSavePage) {
                e.preventDefault();
                e.stopPropagation();
            }
        });
    }



    setupContextMenu() {
        const menuEl = document.createElement('div');
        menuEl.className = 'global-context-menu';
        document.body.appendChild(menuEl);
        this.contextMenuState.element = menuEl;

        // Usar los ítems por defecto pasados en la configuración
        const defaultItems = this.defaultMenuItems;

        document.addEventListener('contextmenu', (e) => {
            // Verificar si es un target interactivo que debería tener su propio menú o ninguno
            const allowed = ['input', 'textarea'].join(', ');
            let element = e.target instanceof Element ? e.target : e.target.parentElement;
            if (element && (element.matches(allowed) || element.closest(allowed))) {
                return; // Dejar el menú nativo para inputs
            }

            e.preventDefault();
            this.openMenu(e.clientX, e.clientY, defaultItems);
        });

        const closeMenu = () => {
            if (this.contextMenuState.isOpen) {
                this.contextMenuState.isOpen = false;
                this.contextMenuState.element.classList.remove('open');
            }
        };

        document.addEventListener('click', (e) => {
            if (!menuEl.contains(e.target)) closeMenu();
        });
        document.addEventListener('scroll', closeMenu, { passive: true });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeMenu();
        });
    }

    openMenu(x, y, items) {
        const menuEl = this.contextMenuState.element;
        menuEl.innerHTML = '';

        items.forEach(item => {
            const btn = document.createElement('button');
            if (item.danger) btn.className = 'danger';
            btn.textContent = item.label;
            btn.onclick = (e) => {
                e.stopPropagation();
                item.action();
                this.contextMenuState.isOpen = false;
                menuEl.classList.remove('open');
            };
            menuEl.appendChild(btn);
        });

        this.contextMenuState.isOpen = true;
        menuEl.classList.add('open');

        // Ajustar posición para que no se desborde
        requestAnimationFrame(() => {
            const rect = menuEl.getBoundingClientRect();
            let adjustedX = x;
            let adjustedY = y;

            if (x + rect.width > window.innerWidth) adjustedX -= rect.width;
            if (y + rect.height > window.innerHeight) adjustedY -= rect.height;

            menuEl.style.left = `${adjustedX}px`;
            menuEl.style.top = `${adjustedY}px`;
        });
    }
}

// Hacerlo disponible globalmente
window.InteractiveGovernance = InteractiveGovernance;
