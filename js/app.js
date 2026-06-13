// app.js - Main logic and animation triggers

class App {
    constructor() {
        this.initIntersectionObserver();
        this.initSmoothScroll();
    }

    initIntersectionObserver() {
        const options = {
            root: null,
            rootMargin: '0px',
            threshold: 0.15
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    // Optional: stop observing once visible
                    // observer.unobserve(entry.target);
                }
            });
        }, options);

        // Select all elements with the fade-in class
        document.querySelectorAll('.fade-in').forEach(el => {
            observer.observe(el);
        });
    }

    initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if(targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth'
                    });
                }
            });
        });
    }
}

// Initialize app when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new App();
});
