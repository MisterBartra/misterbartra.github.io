// components.js - Modular components injector for static pages

const Components = {
    renderNavbar: () => `
        <nav>
            <div class="container nav-container">
                <a href="index.html" class="logo">
                    <span class="gradient-text">&lt;Bartra/&gt;</span> AI Engineer
                </a>
                <ul class="nav-links">
                    <li><a href="index.html" class="nav-link" data-page="index">Overview</a></li>
                    <li><a href="cv.html" class="nav-link" data-page="cv">Resume</a></li>
                    <li><a href="project-chatrag.html" class="nav-link" data-page="project">Projects</a></li>
                </ul>
            </div>
        </nav>
    `,

    renderFooter: () => `
        <footer>
            <div class="container" style="text-align: center;">
                <h3 class="gradient-text">Building Intelligent Systems</h3>
                <p class="mono-text" style="color: var(--text-muted); margin-top: 1rem; font-size: 0.85rem;">
                    © ${new Date().getFullYear()} MisterBartra. All Rights Reserved.
                </p>
                <div style="margin-top: 1.5rem; display: flex; gap: 1rem; justify-content: center;">
                    <a href="https://github.com/misterbartra" target="_blank" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.8rem;">GitHub</a>
                    <a href="mailto:contact@example.com" class="btn btn-secondary" style="padding: 0.5rem 1rem; font-size: 0.8rem;">Contact</a>
                </div>
            </div>
        </footer>
    `,

    init: () => {
        // Inject components
        const headerPlaceholder = document.getElementById('navbar-placeholder');
        const footerPlaceholder = document.getElementById('footer-placeholder');

        if (headerPlaceholder) headerPlaceholder.innerHTML = Components.renderNavbar();
        if (footerPlaceholder) footerPlaceholder.innerHTML = Components.renderFooter();

        // Highlight active link
        const currentPage = document.body.dataset.page;
        if (currentPage) {
            const links = document.querySelectorAll('.nav-link');
            links.forEach(link => {
                if (link.dataset.page === currentPage) {
                    link.classList.add('active');
                }
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', Components.init);
