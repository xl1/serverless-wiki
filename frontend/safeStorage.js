export const safeStorage = {
    /**
     * @param {string} key
     * @param {string} value
     */
    setItem(key, value) {
        try {
            sessionStorage.setItem(key, value);
        } catch (_) {}
    },
    /**
     * @param {string} key
     * @returns {string?}
     */
    getItem(key) {
        try {
            return sessionStorage.getItem(key);
        } catch (_) {}
        return null;
    },
    /**
     * @param {string} key
     */
    removeItem(key) {
        try {
            sessionStorage.removeItem(key);
        } catch (_) {}
    }
};
