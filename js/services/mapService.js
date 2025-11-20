
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
     *  MÉTHODE PRINCIPALE - Affiche l'itinéraire complet
     */
    displayItinerary(data) {
        this.clearRoutes();

        // Convertir coordonnées backend (lon, lat) → Leaflet (lat, lon)
        const allCoords = data.Geometry.Coordinates.map(c => [c[1], c[0]]);

        if (allCoords.length === 0) {
            console.error(" Aucune coordonnée reçue");
            return;
        }

        // Mode vélo : tracer segments différenciés
        if (data.UseBike && data.Steps && data.Steps.length > 0) {
            this.drawSegmentedRoute(data.Steps, allCoords);
        } else {
            // Mode marche uniquement : ligne orange pointillée
            this.drawRoute(allCoords, '#f2283cff', 4, '10, 5');
        }

        this.fitBounds();
    }

    /**
     * NOUVELLE MÉTHODE - Dessine segments walk/bike différenciés
     */
    drawSegmentedRoute(steps, allCoords) {
        let currentIndex = 0;
        const totalDistance = steps.reduce((sum, s) => sum + s.distance, 0);


        steps.forEach((step, i) => {
            const stepRatio = step.distance / totalDistance;
            const pointsInStep = Math.max(2, Math.round(allCoords.length * stepRatio));
            
            const endIndex = Math.min(currentIndex + pointsInStep, allCoords.length);
            const segmentCoords = allCoords.slice(currentIndex, endIndex);
            currentIndex = endIndex;

            if (segmentCoords.length < 2) {
                console.warn(` Segment ${i} trop court (${segmentCoords.length} points)`);
                return;
            }

            console.log(`📍 Step ${i + 1}/${steps.length}: ${step.type} - ${segmentCoords.length} points`);

            if (step.type.toLowerCase() === 'bike') {
                this.drawRoute(segmentCoords, '#3120b5ff', 6);
            } else {
                this.drawRoute(segmentCoords, '#cc1f4dff', 5, '10, 5');
            }
        });
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
            if (polyline.getBounds) {
                bounds.extend(polyline.getBounds());
            }
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