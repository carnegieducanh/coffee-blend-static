const menuTabs = document.querySelectorAll(".menu-tab");
const catalogItems = document.querySelectorAll(".catalog-item");

function filterByCategory(category) {
    catalogItems.forEach((item) => {
        item.hidden = item.dataset.category !== category;
    });
}

menuTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
        const category = tab.dataset.category;
        menuTabs.forEach((item) =>
            item.classList.toggle("is-active", item === tab),
        );
        filterByCategory(category);
    });
});

const initialTab = document.querySelector(".menu-tab.is-active") || menuTabs[0];
if (initialTab) {
    filterByCategory(initialTab.dataset.category);
}
