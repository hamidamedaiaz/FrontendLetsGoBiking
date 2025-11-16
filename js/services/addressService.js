/**
 * Service pour gérer les appels à l'API adresse.gouv.fr
 */

const API_URL = 'https://api-adresse.data.gouv.fr/search/';

/**
 * Recherche d'adresses via l'API gouv
 * @param {string} query - Texte de recherche
 * @param {number} limit - Nombre de résultats max
 */
export async function searchAddress(query, limit = 5) {
    if (!query || query.trim().length < 3) {
        return [];
    }

    try {
        const response = await fetch(`${API_URL}?q=${encodeURIComponent(query)}&limit=${limit}`);
        
        if (!response.ok) {
            throw new Error('Erreur lors de la recherche d\'adresse');
        }

        const data = await response.json();
        
        // Retourner les adresses formatées
        return data.features.map(feature => ({
            label: feature.properties.label,
            city: feature.properties.city,
            postcode: feature.properties.postcode,
            coordinates: feature.geometry.coordinates // [longitude, latitude]
        }));

    } catch (error) {
        console.error('Erreur API adresse:', error);
        return [];
    }
}