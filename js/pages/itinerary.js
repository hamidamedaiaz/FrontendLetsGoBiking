/**
 * Page Itinéraire - Logique principale
 */

import AddressAutocomplete from '../autocomplete.js';
import APIService from '../services/apiService.js';
import MapService from '../services/mapService.js';

class ItineraryPage {
    constructor() {
        this.mapService = null;
        this.originAutocomplete = null;
        this.destinationAutocomplete = null;
        this.selectedMode = 'bike';

        this.init();
    }

    async init() {
        console.log('🚀 Initialisation page itinéraire');

        // Initialiser la carte
        this.mapService = new MapService();
        this.mapService.initMap();

        // Initialiser les autocompletes
        this.originAutocomplete = new AddressAutocomplete('originInput', 'origin-results');
        this.destinationAutocomplete = new AddressAutocomplete('destinationInput', 'destination-results');

        // Initialiser les événements
        this.initEvents();

        // Charger les données depuis localStorage
        await this.loadFromLocalStorage();

        // Tester la connexion au backend
        const isConnected = await APIService.testConnection();
        if (!isConnected) {
            console.warn('⚠️ Backend non accessible - Mode DEMO');
        }
    }

    /**
     * Initialise les événements
     */
    initEvents() {
        // Boutons mode
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleModeChange(e));
        });

        // Bouton calculer
        document.getElementById('calculateBtn').addEventListener('click', () => this.calculateRoute());

        // Sidebar toggle (mobile)
        const toggleBtn = document.getElementById('toggleSidebar');
        const openBtn = document.getElementById('openSidebar');
        const sidebar = document.getElementById('searchSidebar');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => sidebar.classList.toggle('active'));
        }
        if (openBtn) {
            openBtn.addEventListener('click', () => sidebar.classList.add('active'));
        }

        // Écouter la sélection d'adresses
        document.getElementById('originInput').addEventListener('addressSelected', (e) => {
            console.log('📍 Origine sélectionnée:', e.detail);
            this.mapService.addOriginMarker(
                e.detail.coordinates[1],
                e.detail.coordinates[0],
                e.detail.label
            );
        });

        document.getElementById('destinationInput').addEventListener('addressSelected', (e) => {
            console.log('📍 Destination sélectionnée:', e.detail);
            this.mapService.addDestinationMarker(
                e.detail.coordinates[1],
                e.detail.coordinates[0],
                e.detail.label
            );
        });

        // Burger menu
        const burgerMenu = document.querySelector('.burger-menu');
        const mobileSidebar = document.querySelector('.mobile-sidebar');
        const overlay = document.querySelector('.overlay');

        if (burgerMenu && mobileSidebar && overlay) {
            burgerMenu.addEventListener('click', () => {
                burgerMenu.classList.toggle('active');
                mobileSidebar.classList.toggle('active');
                overlay.classList.toggle('active');
            });

            overlay.addEventListener('click', () => {
                burgerMenu.classList.remove('active');
                mobileSidebar.classList.remove('active');
                overlay.classList.remove('active');
            });
        }
    }

    /**
     * Charge les données depuis localStorage
     */
    async loadFromLocalStorage() {
        const data = localStorage.getItem('itinerary');
        
        if (!data) {
            console.log('ℹ️ Pas de données en localStorage');
            return;
        }

        try {
            const itinerary = JSON.parse(data);
            console.log('📦 Données chargées:', itinerary);

            // Remplir les inputs
            if (itinerary.origin) {
                document.getElementById('originInput').value = itinerary.origin.label;
                this.originAutocomplete.selectedAddress = itinerary.origin;
                
                // Ajouter marker origine
                this.mapService.addOriginMarker(
                    itinerary.origin.coordinates[1],
                    itinerary.origin.coordinates[0],
                    itinerary.origin.label
                );
            }

            if (itinerary.destination) {
                document.getElementById('destinationInput').value = itinerary.destination.label;
                this.destinationAutocomplete.selectedAddress = itinerary.destination;
                
                // Ajouter marker destination
                this.mapService.addDestinationMarker(
                    itinerary.destination.coordinates[1],
                    itinerary.destination.coordinates[0],
                    itinerary.destination.label
                );
            }

            // Calculer automatiquement l'itinéraire
            if (itinerary.origin && itinerary.destination) {
                setTimeout(() => {
                    this.calculateRoute();
                }, 500);
            }

        } catch (error) {
            console.error('❌ Erreur chargement localStorage:', error);
        }
    }

    /**
     * Change le mode de transport
     */
    handleModeChange(event) {
        const btn = event.currentTarget;
        const mode = btn.dataset.mode;

        document.querySelectorAll('.mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        this.selectedMode = mode;
        console.log('🚴 Mode changé:', mode);
    }

    /**
     * Calcule l'itinéraire
     */
    async calculateRoute() {
        const origin = this.originAutocomplete.getSelectedAddress();
        const destination = this.destinationAutocomplete.getSelectedAddress();

        if (!origin || !destination) {
            alert('Veuillez sélectionner une origine et une destination');
            return;
        }

        console.log('🧮 Calcul itinéraire...');

        // Afficher loading
        this.showLoading();
        this.hideError();
        this.hideResults();

        try {
            // Appeler le backend (ou données mock)
            const result = await APIService.calculateItinerary(
                origin.coordinates[1], // latitude
                origin.coordinates[0], // longitude
                destination.coordinates[1],
                destination.coordinates[0],
                this.selectedMode === 'bike'
            );

            console.log('✅ Itinéraire calculé:', result);

            // Afficher les résultats
            this.displayResults(result);

            // Afficher sur la carte
            this.mapService.displayItinerary(result);

        } catch (error) {
            console.error('❌ Erreur:', error);
            this.showError(error.message);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * Affiche les résultats
     */
    displayResults(data) {
        const summaryDiv = document.getElementById('summary');
        const stationsDiv = document.getElementById('stationsInfo');
        const stepsDiv = document.getElementById('steps');

        // Calculer totaux
        let totalDistance = 0;
        let totalDuration = 0;

        if (data.UseBike && data.Itinerary.OriginToStation) {
            // Vélo : sommer les 3 trajets
            totalDistance = this.sumDistance([
                data.Itinerary.OriginToStation,
                data.Itinerary.StationToStation,
                data.Itinerary.StationToDestination
            ]);
            totalDuration = this.sumDuration([
                data.Itinerary.OriginToStation,
                data.Itinerary.StationToStation,
                data.Itinerary.StationToDestination
            ]);
        } else {
            // Marche : 1 trajet
            if (data.Itinerary && data.Itinerary.routes) {
                totalDistance = data.Itinerary.routes[0].summary.distance;
                totalDuration = data.Itinerary.routes[0].summary.duration;
            }
        }

        // Résumé
        summaryDiv.innerHTML = `
            <div class="summary-item">
                <i class="fas fa-route"></i>
                <div>
                    <strong>Distance :</strong>
                    <span>${(totalDistance / 1000).toFixed(2)} km</span>
                </div>
            </div>
            <div class="summary-item">
                <i class="fas fa-clock"></i>
                <div>
                    <strong>Durée :</strong>
                    <span>${Math.round(totalDuration / 60)} minutes</span>
                </div>
            </div>
            <div class="summary-item">
                <i class="fas fa-${data.UseBike ? 'bicycle' : 'walking'}"></i>
                <div>
                    <strong>Mode :</strong>
                    <span>${data.UseBike ? 'Vélo + Marche' : 'À pied'}</span>
                </div>
            </div>
            ${data.PreferredOption ? `
                <div class="recommendation ${data.UseBike ? '' : 'walking'}" style="margin-top: 1rem; padding: 0.75rem; background: rgba(52, 152, 219, 0.1); border-left: 4px solid #3498db; border-radius: 4px;">
                    <p><i class="fas fa-lightbulb"></i> ${data.PreferredOption}</p>
                </div>
            ` : ''}
        `;

        // Stations (si vélo)
        if (data.UseBike && data.ClosestOriginStation && data.ClosestDestinationStation) {
            stationsDiv.style.display = 'block';
            stationsDiv.innerHTML = `
                <h4 style="margin-bottom: 1rem;"><i class="fas fa-bicycle"></i> Stations de vélo</h4>
                <div class="station-card">
                    <h4>📍 Station de départ</h4>
                    <p>${data.ClosestOriginStation.Name}</p>
                    <div class="bikes-info">
                        <span><i class="fas fa-bicycle"></i> ${data.ClosestOriginStation.AvailableBikes} vélos</span>
                        <span><i class="fas fa-parking"></i> ${data.ClosestOriginStation.BikeStands - data.ClosestOriginStation.AvailableBikes} places</span>
                    </div>
                </div>
                <div class="station-card">
                    <h4>🎯 Station d'arrivée</h4>
                    <p>${data.ClosestDestinationStation.Name}</p>
                    <div class="bikes-info">
                        <span><i class="fas fa-bicycle"></i> ${data.ClosestDestinationStation.AvailableBikes} vélos</span>
                        <span><i class="fas fa-parking"></i> ${data.ClosestDestinationStation.BikeStands - data.ClosestDestinationStation.AvailableBikes} places</span>
                    </div>
                </div>
            `;
        } else {
            stationsDiv.style.display = 'none';
        }

        // Instructions
        stepsDiv.innerHTML = '';

        if (data.UseBike && data.Itinerary.OriginToStation) {
            // 3 segments
            this.addStepsFromRoute(stepsDiv, data.Itinerary.OriginToStation, 'walk', '1️⃣ Marche vers la station');
            this.addStepsFromRoute(stepsDiv, data.Itinerary.StationToStation, 'bike', '2️⃣ À vélo');
            this.addStepsFromRoute(stepsDiv, data.Itinerary.StationToDestination, 'walk', '3️⃣ Marche vers la destination');
        } else {
            // 1 segment
            this.addStepsFromRoute(stepsDiv, data.Itinerary, 'walk', 'À pied');
        }

        // Afficher les résultats
        document.getElementById('resultsContainer').style.display = 'block';
    }

    /**
     * Ajoute les étapes d'une route
     */
    addStepsFromRoute(container, routeData, type, title) {
        if (!routeData || !routeData.routes || !routeData.routes[0]) {
            return;
        }

        const route = routeData.routes[0];
        if (!route.segments || !route.segments[0] || !route.segments[0].steps) {
            return;
        }

        const titleDiv = document.createElement('h5');
        titleDiv.style.marginTop = '1rem';
        titleDiv.style.marginBottom = '0.5rem';
        titleDiv.style.fontWeight = '600';
        titleDiv.textContent = title;
        container.appendChild(titleDiv);

        route.segments[0].steps.forEach(step => {
            const stepDiv = document.createElement('div');
            stepDiv.className = 'step-item';
            stepDiv.innerHTML = `
                <div class="step-icon ${type}">
                    <i class="fas fa-${type === 'bike' ? 'bicycle' : 'walking'}"></i>
                </div>
                <div class="step-content">
                    <p>${step.instruction || 'Continuez tout droit'}</p>
                    <small>${(step.distance || 0).toFixed(0)} m • ${Math.round((step.duration || 0) / 60)} min</small>
                </div>
            `;
            container.appendChild(stepDiv);
        });
    }

    /**
     * Calcule distance totale
     */
    sumDistance(routes) {
        return routes.reduce((sum, route) => {
            if (route && route.routes) {
                return sum + route.routes[0].summary.distance;
            }
            return sum;
        }, 0);
    }

    /**
     * Calcule durée totale
     */
    sumDuration(routes) {
        return routes.reduce((sum, route) => {
            if (route && route.routes) {
                return sum + route.routes[0].summary.duration;
            }
            return sum;
        }, 0);
    }

    /**
     * Affiche le loading
     */
    showLoading() {
        document.getElementById('loading').style.display = 'block';
    }

    /**
     * Cache le loading
     */
    hideLoading() {
        document.getElementById('loading').style.display = 'none';
    }

    /**
     * Affiche une erreur
     */
    showError(message) {
        document.getElementById('errorText').textContent = message;
        document.getElementById('errorMessage').style.display = 'block';
    }

    /**
     * Cache l'erreur
     */
    hideError() {
        document.getElementById('errorMessage').style.display = 'none';
    }

    /**
     * Cache les résultats
     */
    hideResults() {
        document.getElementById('resultsContainer').style.display = 'none';
    }
}

// Initialiser quand le DOM est prêt
document.addEventListener('DOMContentLoaded', () => {
    new ItineraryPage();
});