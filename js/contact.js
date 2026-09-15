const contactForm = document.querySelector(".contact-form");
const contactMessage = document.querySelector(".contact-form .form-message");

if (contactForm && contactMessage) {
    contactForm.addEventListener("submit", (event) => {
        event.preventDefault();
        contactMessage.textContent =
            "ありがとうございます。近日中にご連絡いたします。";
        contactForm.reset();
    });
}
