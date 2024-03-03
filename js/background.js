let injectedTabs = {};


function sendMessage(messageObj) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        
        (async () => {
            chrome.tabs.sendMessage(tabs[0].id, messageObj, function(response){
                console.log("Message sent");
                if (chrome.runtime.lastError) {
                    console.log("Message wasn't received");
                }
            });
        })();
    });
}


chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo && changeInfo.status == "complete") {
        console.log("New tab URL: " + tab.url);
        sendMessage({urlChanged: true});
    }
});

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (changeInfo.status === "complete" && tab.url.includes("youtube.com")) {

        if (injectedTabs[tabId]) return;

        chrome.scripting.executeScript({
            target: {tabId: tab.id},
            files: ["build/content.js"]
        })
        .then(() => {
            console.log("Script injected");
            injectedTabs[tabId] = true;
        });
    }
});

function createContextMenu() {

    chrome.storage.local.get("min_like_count", (data) => {
        let minLikeCount = 0;
        if (data["min_like_count"]) {
            minLikeCount = data["min_like_count"];
        }

        chrome.contextMenus.removeAll(() => {
            chrome.contextMenus.create({
                id: "minCommentLikes",
                title: "Minimum comment likes",
                contexts: ["all"]
            })
        
            const likeSettings = [0, 1, 2, 3, 5, 10, 25];

            // Adds unique number if required
            if (!likeSettings.includes(minLikeCount)) {
                likeSettings.push(minLikeCount);
                likeSettings.sort((a, b) => a - b);
            }
        
            for (const likeSetting of likeSettings) {
                chrome.contextMenus.create({
                    id: "likeSetting" + likeSetting,
                    title: likeSetting.toString(),
                    parentId: "minCommentLikes",
                    type: "radio",
                    contexts: ["all"],
                    checked: likeSetting === minLikeCount
                });
            }
        });
    });
}

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId.includes("likeSetting")) {

        const likeCount = parseInt(info.menuItemId.replace("likeSetting", ""));
        console.log("New like count is", likeCount);
        sendMessage({minLikeCount: likeCount});

        // Stores the value to be pulled by comments.js, also persistence. 
        chrome.storage.local.set({"min_like_count": likeCount}, function() {
            console.log("Setting was set.");
        });

        // Gets rid of unique radio
        createContextMenu();
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log(message);
    if (message.minLikeCount != null) {
        console.log("Received like change.");
        createContextMenu();
    }
});

createContextMenu();

