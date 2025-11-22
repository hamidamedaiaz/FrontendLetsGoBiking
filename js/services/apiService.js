/**
 * Service API - Communication avec le backend C# WCF REST
 */

const API_CONFIG = {
    BASE_URL: 'http://localhost:8733/RoutingService',
    TIMEOUT: 30000
};

class APIService {

    static async calculateItinerary(originLat, originLon, destLat, destLon) {
        try {
            const originCity = await this.getCityFromCoords(originLat, originLon);
            const destCity = await this.getCityFromCoords(destLat, destLon);

            const url =
                `${API_CONFIG.BASE_URL}/itinerary?originLat=${originLat}` +
                `&originLon=${originLon}` +
                `&originCity=${encodeURIComponent(originCity)}` +
                `&destLat=${destLat}` +
                `&destLon=${destLon}` +
                `&destCity=${encodeURIComponent(destCity)}`;

            console.log('➡️ API request URL:', url);
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json' }
            });

            if (!response.ok) {
                // Lire le corps pour afficher un message d'erreur utile
                const text = await response.text();
                console.error('❌ API response not OK', response.status, text);
                throw new Error(`HTTP ${response.status}: ${text}`);
            }

            const raw = await response.json();
            const wcfData = raw.GetItineraryResult || raw;

            if (!wcfData.Success) throw new Error(wcfData.Message);
            console.log('✅ API response data:', wcfData);

            return this.transformWCFResponse(wcfData, originLat, originLon, destLat, destLon);

        } catch (err) {
            console.error("❌ API error in calculateItinerary:", err);
            // Rethrow so caller can handle; message now includes HTTP code / body when possible
            throw err;
        }
    }

    /**
     * Transforme ton backend → format simple utilisé par le front
     */
    static transformWCFResponse(wcfData, originLat, originLon, destLat, destLon) {

        const data = wcfData.Data;

        return {
            Success: true,
            UseBike: wcfData.Message === "bike",
            TotalDistance: data.TotalDistance,
            TotalDuration: data.TotalDuration,

            Geometry: data.Geometry,   // ← IMPORTANT : coords ici
            Steps: data.Steps.map(s => ({
                type: s.Type,
                instruction: s.Instructions,
                distance: s.Distance,
                duration: s.Duration
            })),

            Origin: { Latitude: originLat, Longitude: originLon },
            Destination: { Latitude: destLat, Longitude: destLon }
        };
    }

    /**
     * Reverse geocoding France
     */
    static async getCityFromCoords(lat, lon) {
        try {
            const res = await fetch(`https://api-adresse.data.gouv.fr/reverse/?lon=${lon}&lat=${lat}`);
            const data = await res.json();

            if (data.features?.length > 0) {
                return data.features[0].properties.city || "Unknown";
            }
        } catch { }

        return "Unknown";
    }

    static async testConnection() {
        try {
            const testUrl =
                `${API_CONFIG.BASE_URL}/itinerary?originLat=43.7102&originLon=7.2620&originCity=Nice` +
                `&destLat=43.7150&destLon=7.2700&destCity=Nice`;

            const res = await fetch(testUrl);
            return res.ok;

        } catch {
            return false;
        }
    }
}

export default APIService;
