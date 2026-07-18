const menuButton = document.querySelector('#burger-menu');
const dropdown = document.querySelector('.dropdown');

menuButton.addEventListener('click', () => {
    const isOpen = dropdown.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
});
