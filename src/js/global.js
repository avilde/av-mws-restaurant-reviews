/**
 * Global constants
 */
const APP_NAME = 'av-rr',
    DEBUG_MODE = true;

/** Google MAPS API */
const MAP_API_KEY = 'AIzaSyCSPE2b5yv7k7CvRctNKvGl42FXfMr-DeU',
    STATIC_MAP_API_KEY = 'AIzaSyBC8fMCdTyXKxZmNEe6aMXOIoM6AR_Pgak';

/**
 * Covert string to boolean
 * @param {any} str string variable (if other then evaluate if bool)
 */
stringToBoolean = str => {
    if (typeof str === 'string') {
        switch (str.toLowerCase().trim()) {
            case 'true':
            case 'yes':
            case true:
            case '1':
                return true;
            case 'false':
            case 'no':
            case false:
            case '0':
            case null:
                return false;
        }
    }

    return Boolean(str);
};

/**
 * Debug code if debug mode is on
 * @param {any} args - rest of args
 */
function d(...args) {
    if (DEBUG_MODE)
        console.info(`[${APP_NAME}]`, ...args);
}