// Page-level smooth scrolling with Lenis (loaded from the CDN <script> on each page).
// Touch devices keep native scrolling (syncTouch defaults to false).
const LENIS_OPTIONS = {
    duration: 1.4,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    wheelMultiplier: 0.9,
    // Kept smooth even when the OS reports reduced motion (e.g. Windows
    // "Animation effects" turned off) — the site owner wants the effect.
    respectReducedMotion: false,
};

const MIN_DURATION = 1.2;
const MAX_DURATION = 3.0;
const BASE_DURATION = 1.2;
const DURATION_PER_VIEWPORT = 0.25;

const easeInOutCubic = (t) =>
    t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

function durationFor(distance) {
    const viewports = Math.abs(distance) / window.innerHeight;
    const d = BASE_DURATION + viewports * DURATION_PER_VIEWPORT;
    return Math.min(MAX_DURATION, Math.max(MIN_DURATION, d));
}

function initLenis() {
    if (typeof Lenis === "undefined") return;

    const lenis = new Lenis(LENIS_OPTIONS);
    const loop = (time) => {
        lenis.raf(time);
        requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    window.__lenis = lenis;
}

// The fixed header would cover the top of a section, so offset by its height.
function headerOffset() {
    const header = document.querySelector(".site-header");
    return header ? header.offsetHeight : 0;
}

function sectionTop(el) {
    return el.getBoundingClientRect().top + window.scrollY - headerOffset();
}

function smoothScrollTo(top) {
    const lenis = window.__lenis;

    const duration = durationFor(top - window.scrollY);
    if (lenis) {
        lenis.scrollTo(top, { duration, easing: easeInOutCubic });
    } else {
        window.scrollTo({ top, behavior: "smooth" });
    }
}

function normalizePath(pathname) {
    return pathname.replace(/\/index\.html$/, "/");
}

// Links to a section on the current page (e.g. "index.html#booking" while on
// index.html) scroll through Lenis instead of letting the browser jump.
function handleHashLinkClick(event) {
    const link = event.target.closest("a[href*='#']");
    if (!link || link.target === "_blank") return;
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    const url = new URL(link.href, window.location.href);
    if (
        url.origin !== window.location.origin ||
        normalizePath(url.pathname) !== normalizePath(window.location.pathname) ||
        url.hash.length < 2
    ) {
        return;
    }

    const target = document.getElementById(decodeURIComponent(url.hash.slice(1)));
    if (!target) return;

    event.preventDefault();
    history.pushState(null, "", url.hash);
    smoothScrollTo(sectionTop(target));
}

// Arriving with a hash from another page: the browser jumps to the section
// before the header partial exists, so re-align it below the header.
function jumpToInitialHash() {
    if (window.location.hash.length < 2) return;
    const target = document.getElementById(
        decodeURIComponent(window.location.hash.slice(1)),
    );
    if (!target) return;

    const top = sectionTop(target);
    const lenis = window.__lenis;
    if (lenis) {
        lenis.resize();
        lenis.scrollTo(top, { immediate: true, force: true });
    } else {
        window.scrollTo(0, top);
    }
}

initLenis();
document.addEventListener("click", handleHashLinkClick);
document.addEventListener("partials:loaded", jumpToInitialHash);
