import AddressAutocomplete from './autocomplete.js';

// === BURGER MENU ===
const burgerMenu = document.querySelector('.burger-menu');
const mobileSidebar = document.querySelector('.mobile-sidebar');
const overlay = document.querySelector('.overlay');
let menuOpen = false;

function openMenu() {
    burgerMenu.classList.add('active');
    mobileSidebar.classList.add('active');
    overlay.classList.add('active');
    menuOpen = true;
}

function closeMenu() {
    burgerMenu.classList.remove('active');
    mobileSidebar.classList.remove('active');
    overlay.classList.remove('active');
    menuOpen = false;
}

if (burgerMenu) {
    burgerMenu.addEventListener('click', () => {
        menuOpen ? closeMenu() : openMenu();
    });
}

if (overlay) {
    overlay.addEventListener('click', closeMenu);
}

if (mobileSidebar) {
    document.querySelectorAll('.mobile-sidebar a').forEach(link => {
        link.addEventListener('click', () => {
            if (menuOpen) closeMenu();
        });
    });
}

// === AUTOCOMPLETE ===
const originAutocomplete = new AddressAutocomplete('origin', 'origin-results');
const destinationAutocomplete = new AddressAutocomplete('destination', 'destination-results');

// Écouter la sélection des adresses
document.getElementById('origin').addEventListener('addressSelected', (e) => {
    console.log('Origine sélectionnée:', e.detail);
});

document.getElementById('destination').addEventListener('addressSelected', (e) => {
    console.log('Destination sélectionnée:', e.detail);
});

// Bouton rechercher
document.getElementById('search-btn').addEventListener('click', () => {
    const origin = originAutocomplete.getSelectedAddress();
    const destination = destinationAutocomplete.getSelectedAddress();

    if (!origin || !destination) {
        alert('Veuillez sélectionner une origine et une destination');
        return;
    }

    // Sauvegarder dans localStorage
    localStorage.setItem('itinerary', JSON.stringify({
        origin,
        destination
    }));

    // Rediriger vers la page itinéraire
    window.location.href = 'itinerary.html';
});