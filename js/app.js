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

    // Auto-scrolling strips: the keyframe shifts the track by one set of items
    // (--loop-width), so after that shift the rest of the track must still
    // cover the wrapper. Clone sets until it does, so wide screens show no gap.
    function setupMarquee(track) {
        const wrapper = track.parentElement;
        const originals = Array.from(track.children).filter(
            (item) => !item.hasAttribute("aria-hidden"),
        );

        function fill() {
            track
                .querySelectorAll("[data-marquee-clone]")
                .forEach((clone) => clone.remove());

            const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
            const loopWidth = originals.reduce(
                (width, item) => width + item.offsetWidth + gap,
                0,
            );
            if (!loopWidth) return;
            track.style.setProperty("--loop-width", `${loopWidth}px`);

            while (track.scrollWidth < loopWidth + wrapper.clientWidth) {
                originals.forEach((item) => {
                    const clone = item.cloneNode(true);
                    clone.setAttribute("aria-hidden", "true");
                    clone.setAttribute("data-marquee-clone", "");
                    clone.querySelectorAll("img").forEach((img) => (img.alt = ""));
                    track.appendChild(clone);
                });
            }
        }

        fill();
        let resizeTimer;
        window.addEventListener("resize", () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(fill, 150);
        });
    }

    document
        .querySelectorAll(".gallery-track, .testimonial-track")
        .forEach(setupMarquee);
}

document.addEventListener("partials:loaded", initApp);
