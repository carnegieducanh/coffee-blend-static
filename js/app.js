function initApp() {
    const slides = document.querySelectorAll(".hero-slide");
    const dots = document.querySelectorAll(".slider-dot");
    const menuToggle = document.querySelector(".menu-toggle");
    const navMenu = document.querySelector(".nav-menu");
    const bookingForm = document.querySelector(".booking-form");
    const formMessage = document.querySelector(".form-message");
    const siteHeader = document.querySelector(".site-header");
    let currentSlide = 0;
    let slideTimer;

    function updateHeaderOnScroll() {
        if (siteHeader) {
            siteHeader.classList.toggle("is-scrolled", window.scrollY > 70);
        }
    }

    function showSlide(index) {
        if (index === currentSlide) return;
        const outgoing = currentSlide;
        currentSlide = index;

        slides.forEach((slide) =>
            slide.classList.remove("is-fading-out", "is-fading-in"),
        );

        slides[outgoing].classList.remove("is-active");
        slides[outgoing].classList.add("is-fading-out");
        slides[currentSlide].classList.add("is-active", "is-fading-in");

        dots.forEach((dot, dotIndex) =>
            dot.classList.toggle("is-active", dotIndex === currentSlide),
        );
    }

    function startSlider() {
        slideTimer = setInterval(
            () => showSlide((currentSlide + 1) % slides.length),
            5000,
        );
    }

    dots.forEach((dot, index) => {
        dot.addEventListener("click", () => {
            clearInterval(slideTimer);
            showSlide(index);
            startSlider();
        });
    });

    if (menuToggle && navMenu) {
        menuToggle.addEventListener("click", () => {
            const isOpen = navMenu.classList.toggle("is-open");
            menuToggle.setAttribute("aria-expanded", String(isOpen));
        });
    }

    document.querySelectorAll(".nav-menu a").forEach((link) => {
        link.addEventListener("click", () => {
            navMenu.classList.remove("is-open");
            menuToggle.setAttribute("aria-expanded", "false");
        });
    });

    if (bookingForm && formMessage) {
        bookingForm.addEventListener("submit", (event) => {
            event.preventDefault();
            formMessage.textContent =
                "ありがとうございます。ご予約のリクエストを承りました。";
            bookingForm.reset();
        });
    }

    const year = document.querySelector("#year");
    if (year) {
        year.textContent = new Date().getFullYear();
    }

    updateHeaderOnScroll();
    window.addEventListener("scroll", updateHeaderOnScroll, { passive: true });

    if (slides.length > 0) {
        startSlider();
    }

    const revealTargets = document.querySelectorAll(
        [
            ".story-image",
            ".story-copy",
            ".section-heading",
            ".menu-images",
            ".service-grid",
            ".counter-band .container",
            ".product-grid",
            ".gallery-scroll-wrapper",
            ".booking-inner",
            ".testimonial-scroll-wrapper",
            ".catalog-grid",
            ".value-grid",
            ".service-card-grid",
            ".contact-details",
            ".contact-form",
            ".menu-note .container",
            ".quote-band .container",
            ".service-image-band .container",
            ".map-placeholder .container",
            ".menu-tabs",
        ].join(", "),
    );

    if (revealTargets.length) {
        if ("IntersectionObserver" in window) {
            const revealObserver = new IntersectionObserver(
                (entries, observer) => {
                    entries.forEach((entry) => {
                        if (entry.isIntersecting) {
                            entry.target.classList.add("is-visible");
                            observer.unobserve(entry.target);
                        }
                    });
                },
                { threshold: 0.15, rootMargin: "0px 0px -10% 0px" },
            );
            revealTargets.forEach((el) => revealObserver.observe(el));
        } else {
            revealTargets.forEach((el) => el.classList.add("is-visible"));
        }
    }
}

document.addEventListener("partials:loaded", initApp);
