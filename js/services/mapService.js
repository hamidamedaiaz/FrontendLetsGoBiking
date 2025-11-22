/**
 * Map Service - Gère la carte Leaflet
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
            .bindPopup(`<div class="popup-content">
                <h4>🏁 Départ</h4>
                <p>${name}</p>
            </div>`);

        console.log('📍 Marker origine ajouté:', lat, lon);
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
            .bindPopup(`<div class="popup-content">
                <h4>🎯 Arrivée</h4>
                <p>${name}</p>
            </div>`);

        console.log('📍 Marker destination ajouté:', lat, lon);
    }

    /**
     * Ajoute un marker station (optionnel, pour le futur)
     */
    addStationMarker(lat, lon, name, type, bikes, stands) {
        const markerType = type === 'origin' ? 'originStation' : 'destinationStation';

        if (this.markers[markerType]) {
            this.map.removeLayer(this.markers[markerType]);
        }

        const icon = L.divIcon({
            className: 'custom-marker station-marker',
            html: '<i class="fas fa-bicycle" style="color: #10b981; font-size: 1.5rem;"></i>',
            iconSize: [25, 25],
            iconAnchor: [12, 25]
        });

        this.markers[markerType] = L.marker([lat, lon], { icon })
            .addTo(this.map)
            .bindPopup(`<div class="popup-content">
                <h4>🚲 ${name}</h4>
                <p>Vélos : <strong>${bikes}</strong></p>
                <p>Places : <strong>${stands}</strong></p>
            </div>`);

        console.log(`🚲 Marker station ${type} ajouté:`, name);
    }

    /**
     * Dessine une route sur la carte
     */
    drawRoute(coordinates, color = '#3498db', weight = 5, dashArray = null) {
        if (!coordinates || coordinates.length < 2) {
            console.warn('⚠️ Pas assez de coordonnées pour tracer la route');
            return null;
        }

        const polyline = L.polyline(coordinates, {
            color: color,
            weight: weight,
            opacity: 0.8,
            dashArray: dashArray
        }).addTo(this.map);

        this.polylines.push(polyline);

        console.log(`🛣️ Route dessinée: ${coordinates.length} points, couleur ${color}`);

        return polyline;
    }

    /**
     * MÉTHODE PRINCIPALE - Affiche l'itinéraire complet
     */
    displayItinerary(data) {
        console.log('🗺️ displayItinerary appelé avec:', data);

        this.clearRoutes();

        // Convertir coordonnées backend [lon, lat] → Leaflet [lat, lon]
        const allCoords = data.Geometry.Coordinates.map(c => [c[1], c[0]]);

        if (allCoords.length === 0) {
            console.error('❌ Aucune coordonnée reçue');
            return;
        }

        console.log(`📊 ${allCoords.length} coordonnées reçues`);

        // Mode vélo : segments différenciés
        if (data.UseBike && data.Steps && data.Steps.length > 0) {
            console.log('🚴 Mode VÉLO - Segments différenciés');
            this.drawSegmentedRoute(data.Steps, allCoords);
        } else {
            console.log('🚶 Mode MARCHE - Ligne simple');
            this.drawRoute(allCoords, '#f59e0b', 5, '10, 5');
        }

        this.fitBounds();
        console.log('✅ Affichage terminé');
    }

    /**
     * Dessine segments walk/bike différenciés
     */
    drawSegmentedRoute(steps, allCoords) {
        let currentIndex = 0;
        const totalDistance = steps.reduce((sum, s) => sum + s.distance, 0);

        console.log(`📍 ${steps.length} segments à tracer`);

        steps.forEach((step, i) => {
            // Calculer combien de points pour ce segment
            const stepRatio = step.distance / totalDistance;
            const pointsInStep = Math.max(2, Math.round(allCoords.length * stepRatio));

            const endIndex = Math.min(currentIndex + pointsInStep, allCoords.length);
            const segmentCoords = allCoords.slice(currentIndex, endIndex);
            currentIndex = endIndex;

            if (segmentCoords.length < 2) {
                console.warn(`⚠️ Segment ${i + 1} trop court (${segmentCoords.length} points)`);
                return;
            }

            console.log(`  Segment ${i + 1}/${steps.length}: ${step.type} - ${segmentCoords.length} points`);

            // Tracer selon le type
            if (step.type.toLowerCase() === 'bike') {
                this.drawRoute(segmentCoords, '#10b981', 6); // Vert, épais
            } else {
                this.drawRoute(segmentCoords, '#f59e0b', 5, '10, 5'); // Orange, pointillé
            }
        });
    }

    /**
     * Ajuste la vue pour tout afficher
     */
    fitBounds() {
        const bounds = L.latLngBounds();

        // Ajouter tous les markers
        Object.values(this.markers).forEach(marker => {
            if (marker) bounds.extend(marker.getLatLng());
        });

        // Ajouter toutes les polylines
        this.polylines.forEach(polyline => {
            if (polyline && polyline.getBounds) {
                bounds.extend(polyline.getBounds());
            }
        });

        if (bounds.isValid()) {
            this.map.fitBounds(bounds, { padding: [50, 50] });
            console.log('🎯 Vue ajustée pour afficher tout l\'itinéraire');
        }
    }

    /**
     * Nettoie les routes
     */
    clearRoutes() {
        this.polylines.forEach(p => this.map.removeLayer(p));
        this.polylines = [];
        console.log('🧹 Routes nettoyées');
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
        console.log('🧹 Carte complètement nettoyée');
    }

    /**
     * Centre la carte sur une position
     */
    centerMap(lat, lon, zoom = 13) {
        this.map.setView([lat, lon], zoom);
    }
}

export default MapService;