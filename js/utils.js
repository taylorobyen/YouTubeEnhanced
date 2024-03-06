// Youtube likes to abbreviate views and likes, we need the full number so we can do math and  get the ratios
// 87K -> 87000
// 40M -> 40000000

/**
 * Youtube likes to abbreviate views and likes, we need the full number so we can do math and  get the ratios
 * `87K -> 87000`
 * `40M -> 40000000`
 * @param {string} abbreviatedNumber Number to unabbreviate
 * @returns {string} Unabbreviated number
 */
export function getFullNumberFromAbbreviated(abbreviatedNumber) {
    let conversionChart = {
        "K": 1000,
        "M": 1000000,
        "B": 1000000000
    };

    // Remove any commas incase the number isn't abbreviated
    abbreviatedNumber = abbreviatedNumber.replace(",","");

    for (let abbreviationSymbol in conversionChart) {
        if (abbreviatedNumber.includes(abbreviationSymbol)) {
            return abbreviatedNumber.split(abbreviationSymbol)[0] * conversionChart[abbreviationSymbol];
        }
    }

    // If no symbol was found the number wasn't abbreviated
    return abbreviatedNumber;
}

/**
 * Returns true if currently on a video URL
 * @returns {boolean} 
 */
export function isOnVideo() {
    if (window.location.href.search("watch") === -1) {
        return false;
    }
    return true;
}

/**
 * Remove an item from an array
 * @param {Array<*>} array Array to remove the item from
 * @param {any} element Item to remove from the array
 * @returns {Array<*>} Array containing without the item
 */
export function removeItemFromArray(array, element) {
    const index = array.indexOf(element);

    if (index !== -1) {
        array.splice(index, 1);
    }

    return array;
}

/**
 * Adds an item to an array if it isn't already present
 * @param {Array<*>} array Array to add the item to
 * @param {any} item Item to add to array
 */
export function addItemToArrayIfNotPresent(array, item) {
    const index = array.indexOf(item);

    if (index === -1) {
        array.push(item);
    }
}