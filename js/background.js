function sendMessage(messageObj) {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        
        (async () => {
            chrome.tabs.sendMessage(tabs[0].id, messageObj, (response) => {
                console.log("Message sent");
                if (chrome.runtime.lastError) {
                    console.log("Message wasn't received");
                }
            });
        })();
    });
}


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo && changeInfo.status == "complete") {
        console.log("New tab URL: " + tab.url);
        sendMessage({urlChanged: true});
    }
});

