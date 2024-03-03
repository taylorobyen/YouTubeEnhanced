// Youtube likes to abbreviate views and likes, we need the full number so we can do math and  get the ratios
// 87K -> 87000
// 40M -> 40000000
export function getFullNumberFromAbbreviated(abbreviatedNumber) {
    let conversionChart = {
        "K": 1000,
        "M": 1000000,
        "B": 1000000000
    };

    // Remove any commas incase the number isn't abbreviated
    abbreviatedNumber = abbreviatedNumber.replace(",","");

    for (var abbreviationSymbol in conversionChart) {
        if (abbreviatedNumber.includes(abbreviationSymbol)) {
            return abbreviatedNumber.split(abbreviationSymbol)[0] * conversionChart[abbreviationSymbol];
        }
    }

    // If no symbol was found the number wasn't abbreviated
    console.log("The number wasn't abbreviated:", abbreviatedNumber);
    return abbreviatedNumber;
}

export function isOnVideo() {
    if (window.location.href.search("watch") === -1) {
        return false;
    }
    return true;
}