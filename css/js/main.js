// Sélection des éléments
const burgerMenu = document.querySelector('.burger-menu');
const header = document.querySelector('header');
const overlay = document.querySelector('.overlay');

// État du menu
let menuOpen = false;

// Fonction pour ouvrir le menu
function openMenu() {
    burgerMenu.classList.add('active');
    header.classList.add('active');
    overlay.classList.add('active');
    menuOpen = true;
}

// Fonction pour fermer le menu
function closeMenu() {
    burgerMenu.classList.remove('active');
    header.classList.remove('active');
    overlay.classList.remove('active');
    menuOpen = false;
}

// Écouter le clic sur burger menu
burgerMenu.addEventListener('click', () => {
    if (menuOpen) {
        closeMenu();
    } else {
        openMenu();
    }
});

// BONUS : Fermer en cliquant sur l'overlay
overlay.addEventListener('click', closeMenu);

// BONUS : Fermer en cliquant sur un lien du menu
document.querySelectorAll('.nav-links a').forEach(link => {
    link.addEventListener('click', () => {
        if (menuOpen) {
            closeMenu();
        }
    });
});