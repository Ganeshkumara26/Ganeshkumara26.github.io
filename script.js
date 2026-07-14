document.addEventListener('DOMContentLoaded', () => {
    // --- 1. Navigation Scroll Effect ---
    const navbar = document.getElementById('navbar');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        // Hide/show navbar on scroll down/up
        if (lastScrollY < window.scrollY && window.scrollY > 100) {
            navbar.classList.add('nav-hidden');
        } else {
            navbar.classList.remove('nav-hidden');
        }
        
        // Add subtle background when scrolled
        if (window.scrollY > 50) {
            navbar.style.background = 'rgba(4, 7, 13, 0.95)';
            navbar.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
        } else {
            navbar.style.background = 'rgba(4, 7, 13, 0.85)';
            navbar.style.boxShadow = 'none';
        }
        
        lastScrollY = window.scrollY;
        updateActiveLink();
    });

    // Update active nav link based on scroll position
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('.nav-links a');

    function updateActiveLink() {
        let current = '';
        const scrollPosition = window.scrollY + 200; // offset for navbar

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    }

    // --- 2. Metric Counters Animation ---
    const metricBoxes = document.querySelectorAll('.metric-box');
    let hasCounted = false;

    const countUp = (element, target, suffix = '') => {
        let current = 0;
        const duration = 2000; // ms
        const frameRate = 30; // ms per frame
        const totalFrames = duration / frameRate;
        const increment = target / totalFrames;

        const timer = setInterval(() => {
            current += increment;
            if (current >= target) {
                clearInterval(timer);
                element.innerText = target + suffix;
            } else {
                // Round to integer unless target is very small
                const displayValue = target < 20 ? current.toFixed(1) : Math.floor(current);
                element.innerText = displayValue + suffix;
            }
        }, frameRate);
    };

    // Trigger counters when hero section is visible
    const observerOptions = { threshold: 0.5 };
    const heroObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !hasCounted) {
                hasCounted = true;
                const valueElements = document.querySelectorAll('.metric-value');
                valueElements.forEach(el => {
                    const target = parseFloat(el.getAttribute('data-target'));
                    const suffix = el.getAttribute('data-suffix') || '';
                    countUp(el, target, suffix);
                });
            }
        });
    }, observerOptions);

    const heroSection = document.getElementById('hero');
    if (heroSection) heroObserver.observe(heroSection);


    // --- 3. Project Expansion Toggle ---
    const projectPanels = document.querySelectorAll('.project-panel');

    projectPanels.forEach(panel => {
        const header = panel.querySelector('.project-header');
        header.addEventListener('click', () => {
            // Close other panels
            projectPanels.forEach(p => {
                if (p !== panel && p.classList.contains('expanded')) {
                    p.classList.remove('expanded');
                }
            });
            // Toggle current panel
            panel.classList.toggle('expanded');
        });
    });


    // --- 4. Scroll Reveal Animations ---
    const fadeElements = document.querySelectorAll('.fade-up');
    
    // Initial style setup for JS-driven animation
    fadeElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
    });

    const fadeObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

    fadeElements.forEach(el => fadeObserver.observe(el));



});
