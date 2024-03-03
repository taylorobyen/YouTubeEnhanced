/**
 * @param {string} selector
 * @param {HTMLElement} parent
 * @param {number} timeout
 * @returns {Promise}
 */
export function waitElement(selector, parent = document, timeout = 30000) {
    return new Promise((resolve, reject) => {

        let matchedElement = parent.querySelector(selector);
        if (matchedElement) {
            resolve(matchedElement);
        }

        const observer = new MutationObserver(mutations => {
            mutations.forEach(mutation => {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === 1) {

                        if (node.matches(selector)) {
                            observer.disconnect();
                            resolve(node);
                        }
                        
                        matchedElement = node.querySelector(selector);
                        if (matchedElement) {
                            observer.disconnect();
                            resolve(matchedElement);
                        }
                    }
                });
            });
        });

        observer.observe(parent.body, {
            childList: true, 
            subtree: true
        });

        setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Timeout waiting for element ${selector}`));
        }, timeout);
    });
}