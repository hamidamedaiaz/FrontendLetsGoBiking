/**
 * Service de carte - Gestion de Leaflet
 */

class MapService {
    constructor() {
        this.map = null;
        this.markers = {
            origin: null,
            destination: null,
            originStation: null,
            destinationStation: null
        };
        this.polylines = [];
    }

    /**
     * Initialise la carte
     */
    initMap(lat = 43.7102, lon = 7.2620, zoom = 13) {
        this.map = L.map('map').setView([lat, lon], zoom);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        console.log('🗺️ Carte initialisée');
    }

    /**
     * Ajoute un marker origine
     */
    addOriginMarker(lat, lon, name) {
        if (this.markers.origin) {
            this.map.removeLayer(this.markers.origin);
        }

        const icon = L.divIcon({
            className: 'custom-marker',
            html: '<i class="fas fa-map-marker-alt" style="color: #3498db; font-size: 2rem;"></i>',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });

        this.markers.origin = L.marker([lat, lon], { icon })
            .addTo(this.map)
            .bindPopup(`<strong>Départ</strong><br>${name}`);
    }

    /**
     * Ajoute un marker destination
     */
    addDestinationMarker(lat, lon, name) {
        if (this.markers.destination) {
            this.map.removeLayer(this.markers.destination);
        }

        const icon = L.divIcon({
            className: 'custom-marker',
            html: '<i class="fas fa-map-marker-alt" style="color: #e74c3c; font-size: 2rem;"></i>',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
        });

        this.markers.destination = L.marker([lat, lon], { icon })
            .addTo(this.map)
            .bindPopup(`<strong>Arrivée</strong><br>${name}`);
    }

    /**
     * Dessine une route sur la carte
     */
    drawRoute(coordinates, color = '#3498db', weight = 5, dashArray = null) {
        const polyline = L.polyline(coordinates, {
            color: color,
            weight: weight,
            opacity: 0.7,
            dashArray: dashArray
        }).addTo(this.map);

        this.polylines.push(polyline);
        return polyline;
    }

    /**
     * Extrait les coordonnées depuis GeoJSON
     */
    extractCoordinates(geometry) {
        if (!geometry || !geometry.coordinates) return [];
        // OpenRouteService retourne [lon, lat], on inverse en [lat, lon]
        return geometry.coordinates.map(coord => [coord[1], coord[0]]);
    }

    /**
     * Affiche l'itinéraire complet
     */
    displayItinerary(data) {
        this.clearRoutes();

        if (data.UseBike && data.ClosestOriginStation) {
            // Mode vélo : 3 segments
            const coords1 = this.extractCoordinates(data.Itinerary.OriginToStation?.routes[0]?.geometry);
            const coords2 = this.extractCoordinates(data.Itinerary.StationToStation?.routes[0]?.geometry);
            const coords3 = this.extractCoordinates(data.Itinerary.StationToDestination?.routes[0]?.geometry);

            if (coords1.length) this.drawRoute(coords1, '#3498db', 4, '10, 5');
            if (coords2.length) this.drawRoute(coords2, '#10b981', 6);
            if (coords3.length) this.drawRoute(coords3, '#3498db', 4, '10, 5');
        } else {
            // Mode marche : 1 segment
            const coords = this.extractCoordinates(data.Itinerary?.routes[0]?.geometry);
            if (coords.length) this.drawRoute(coords, '#3498db', 5);
        }

        this.fitBounds();
    }

    /**
     * Ajuste la vue pour tout afficher
     */
    fitBounds() {
        const bounds = L.latLngBounds();

        Object.values(this.markers).forEach(marker => {
            if (marker) bounds.extend(marker.getLatLng());
        });

        this.polylines.forEach(polyline => {
            bounds.extend(polyline.getBounds());
        });

        if (bounds.isValid()) {
            this.map.fitBounds(bounds, { padding: [50, 50] });
        }
    }

    /**
     * Nettoie les routes
     */
    clearRoutes() {
        this.polylines.forEach(p => this.map.removeLayer(p));
        this.polylines = [];
    }

    /**
     * Nettoie tout
     */
    clearAll() {
        Object.keys(this.markers).forEach(key => {
            if (this.markers[key]) {
                this.map.removeLayer(this.markers[key]);
                this.markers[key] = null;
            }
        });
        this.clearRoutes();
    }
}

export default MapService;