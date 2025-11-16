/**
 * Service API - Communication avec le backend C#
 */

const API_CONFIG = {
    BASE_URL: 'http://localhost:8080', // Ton backend C#
    ENDPOINTS: {
        ITINERARY: '/api/itinerary',
        PING: '/api/ping'
    }
};

class APIService {
    /**
     * Calcule un itinéraire via le backend
     */
    static async calculateItinerary(originLat, originLon, destLat, destLon, useBike = true) {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ITINERARY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    origin: {
                        latitude: originLat,
                        longitude: originLon
                    },
                    destination: {
                        latitude: destLat,
                        longitude: destLon
                    },
                    useBike: useBike
                })
            });

            if (!response.ok) {
                throw new Error(`Erreur HTTP ${response.status}`);
            }

            const data = await response.json();
            console.log('✅ Itinéraire reçu du backend:', data);
            return data;

        } catch (error) {
            console.error('❌ Erreur backend:', error);
            
            // ⚠️ Pour les tests SANS backend, retourner des données fake
            console.warn('Mode DEMO - Utilisation de données fictives');
            return this.getMockItinerary(originLat, originLon, destLat, destLon, useBike);
        }
    }

    /**
     * Données fictives pour les tests (à enlever quand le backend est prêt)
     */
    static getMockItinerary(originLat, originLon, destLat, destLon, useBike) {
        return {
            UseBike: useBike,
            TotalDistance: 5500,
            TotalDuration: 25,
            Origin: { Latitude: originLat, Longitude: originLon },
            Destination: { Latitude: destLat, Longitude: destLon },
            ClosestOriginStation: useBike ? {
                Name: "Station Vélobleu - Exemple",
                Latitude: originLat + 0.001,
                Longitude: originLon + 0.001,
                AvailableBikes: 5,
                BikeStands: 15
            } : null,
            ClosestDestinationStation: useBike ? {
                Name: "Station Vélobleu - Arrivée",
                Latitude: destLat - 0.001,
                Longitude: destLon - 0.001,
                AvailableBikes: 3,
                BikeStands: 12
            } : null,
            Itinerary: {
                routes: [{
                    summary: { distance: 5500, duration: 1500 },
                    geometry: {
                        coordinates: [
                            [originLon, originLat],
                            [destLon, destLat]
                        ]
                    },
                    segments: [{
                        steps: [
                            { instruction: "Partir vers le nord", distance: 500, duration: 120 },
                            { instruction: "Tourner à droite", distance: 300, duration: 80 },
                            { instruction: "Continuer tout droit", distance: 4700, duration: 1300 }
                        ]
                    }]
                }]
            },
            PreferredOption: useBike ? "Le vélo est recommandé pour ce trajet" : "La marche est recommandée"
        };
    }

    /**
     * Test de connexion au backend
     */
    static async testConnection() {
        try {
            const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PING}`);
            const data = await response.json();
            console.log('✅ Backend connecté:', data);
            return true;
        } catch (error) {
            console.warn('⚠️ Backend non accessible - Mode DEMO activé');
            return false;
        }
    }
}

export default APIService;