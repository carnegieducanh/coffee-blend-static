async function loadPartial(placeholder, url) {
    const response = await fetch(url);
    placeholder.outerHTML = await response.text();
}

function setActiveNavLink() {
    const currentPage = document.body.dataset.page;
    if (!currentPage) return;
    const link = document.querySelector(
        `.nav-menu a[data-page="${currentPage}"]`,
    );
    if (link) link.classList.add("active");
}

async function loadPartials() {
    const placeholders = document.querySelectorAll("[data-include]");
    await Promise.all(
        Array.from(placeholders).map((placeholder) =>
            loadPartial(placeholder, `partials/${placeholder.dataset.include}.txt`),
        ),
    );
    setActiveNavLink();
    document.dispatchEvent(new Event("partials:loaded"));
}

loadPartials();
