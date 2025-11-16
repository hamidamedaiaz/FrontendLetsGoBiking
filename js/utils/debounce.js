/**
 * Fonction debounce pour limiter les appels API
 * @param {Function} func - Fonction à exécuter
 * @param {number} delay - Délai en millisecondes
 */
export function debounce(func, delay = 300) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}