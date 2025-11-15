// Sélection des éléments
const burgerMenu = document.querySelector('.burger-menu');
const mobileSidebar = document.querySelector('.mobile-sidebar');
const overlay = document.querySelector('.overlay');

// État du menu
let menuOpen = false;

// Fonction pour ouvrir le menu
function openMenu() {
    burgerMenu.classList.add('active');
    mobileSidebar.classList.add('active');
    overlay.classList.add('active');
    menuOpen = true;
}

// Fonction pour fermer le menu
function closeMenu() {
    burgerMenu.classList.remove('active');
    mobileSidebar.classList.remove('active');
    overlay.classList.remove('active');
    menuOpen = false;
}

// Écouter le clic sur burger menu
if (burgerMenu) {
    burgerMenu.addEventListener('click', () => {
        if (menuOpen) {
            closeMenu();
        } else {
            openMenu();
        }
    });
}

// Fermer en cliquant sur l'overlay
if (overlay) {
    overlay.addEventListener('click', closeMenu);
}

// Fermer en cliquant sur un lien du menu mobile
if (mobileSidebar) {
    document.querySelectorAll('.mobile-sidebar a').forEach(link => {
        link.addEventListener('click', () => {
            if (menuOpen) {
                closeMenu();
            }
        });
    });
}
