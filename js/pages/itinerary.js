import AddressAutocomplete from '../autocomplete.js';
import APIService from '../services/apiService.js';
import MapService from '../services/mapService.js';

class ItineraryPage {

    constructor() {
        this.mapService = null;
        this.originAutocomplete = null;
        this.destinationAutocomplete = null;

        this.init();
    }

    async init() {

        this.mapService = new MapService();
        this.mapService.initMap();

        this.originAutocomplete = new AddressAutocomplete('originInput', 'origin-results');
        this.destinationAutocomplete = new AddressAutocomplete('destinationInput', 'destination-results');

        this.initEvents();
    }

    initEvents() {

        document.getElementById('calculateBtn')
            .addEventListener('click', () => this.calculateRoute());

        document.getElementById('originInput')
            .addEventListener('addressSelected', (e) => {
                const c = e.detail.coordinates;
                this.mapService.addOriginMarker(c[1], c[0], e.detail.label);
            });

        document.getElementById('destinationInput')
            .addEventListener('addressSelected', (e) => {
                const c = e.detail.coordinates;
                this.mapService.addDestinationMarker(c[1], c[0], e.detail.label);
            });
    }

    async calculateRoute() {
        const origin = this.originAutocomplete.getSelectedAddress();
        const destination = this.destinationAutocomplete.getSelectedAddress();

        if (!origin || !destination) {
            alert("Choisir une origine et une destination.");
            return;
        }

        try {
            const result = await APIService.calculateItinerary(
                origin.coordinates[1],
                origin.coordinates[0],
                destination.coordinates[1],
                destination.coordinates[0]
            );

            this.displayResults(result);
            this.mapService.displayItinerary(result);

        } catch (err) {
            alert("Erreur : " + err.message);
        }
    }

    displayResults(data) {

        const summaryDiv = document.getElementById('summary');
        const stepsDiv = document.getElementById('steps');

        summaryDiv.innerHTML = `
            <p><strong>Distance :</strong> ${(data.TotalDistance / 1000).toFixed(2)} km</p>
            <p><strong>Durée :</strong> ${(data.TotalDuration / 60).toFixed(0)} min</p>
            <p><strong>Mode :</strong> ${data.UseBike ? "Vélo + Marche" : "Marche"}</p>
        `;

        stepsDiv.innerHTML = "";
        data.Steps.forEach(step => {

            const icon = step.type === "bike" ? "🚴" : "🚶";

            const div = document.createElement('div');
            div.className = "step-item";

            div.innerHTML = `
                <p>${icon} ${step.instruction}</p>
                <small>${Math.round(step.distance)} m — ${Math.round(step.duration / 60)} min</small>
            `;

            stepsDiv.appendChild(div);
        });

        document.getElementById('resultsContainer').style.display = "block";
    }
}

document.addEventListener("DOMContentLoaded", () => new ItineraryPage());

export default ItineraryPage;
