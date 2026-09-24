// Scroll-in animations with ScrollReveal (loaded from the CDN <script> on each page).
// Targets live in the page HTML, not the partials, so this runs right away
// instead of waiting for "partials:loaded" — otherwise content would flash
// visible before being hidden.
function initReveal() {
    if (typeof ScrollReveal === "undefined") return;

    const sr = ScrollReveal({
        distance: "40px",
        duration: 900,
        easing: "cubic-bezier(0.5, 0, 0, 1)",
        origin: "bottom",
        viewFactor: 0.15,
        viewOffset: { bottom: 40 },
        // Stop tracking once revealed. cleanup only restores the element's
        // original inline styles and leaves ScrollReveal's own transform /
        // transition behind, which would block :hover transforms — clear those.
        cleanup: true,
        afterReveal: (el) => {
            el.style.removeProperty("transform");
            el.style.removeProperty("transition");
            el.style.removeProperty("opacity");
        },
    });

    sr.reveal(".section-heading");

    sr.reveal(".story-image", { origin: "left" });
    sr.reveal(".story-copy", { origin: "right", delay: 150 });

    sr.reveal(".menu-images a", { scale: 0.9, distance: "0px", interval: 120 });

    // Cards in a grid come in one after another.
    sr.reveal(
        ".service-grid article, .value-grid article, .service-card-grid article",
        { interval: 150 },
    );
    sr.reveal(".product-card", { interval: 150 });
    sr.reveal(".counter-grid > div", { distance: "20px", interval: 120 });

    sr.reveal(".gallery-scroll-wrapper, .testimonial-scroll-wrapper", {
        distance: "60px",
    });
    sr.reveal(".booking-inner");

    // The catalog is filtered by tabs, so animate the grid as a whole: an item
    // that gets un-hidden later would otherwise stay invisible until the next scroll.
    sr.reveal(".menu-tabs");
    sr.reveal(".catalog-grid", { delay: 100 });

    sr.reveal(".contact-details", { origin: "left" });
    sr.reveal(".contact-form", { origin: "right", delay: 150 });

    sr.reveal(
        ".menu-note .container, .quote-band .container, .service-image-band .container, .map-placeholder .container",
        { scale: 0.95 },
    );
}

initReveal();
