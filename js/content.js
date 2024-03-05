import { isOnVideo } from "./utils";
import { createVideoRating, removeVideoRating, starRatingEnabled } from "./rating";
import { initCommentTracking, reevaluateComments, minLikeCount, filteredWords } from "./comments";


// Only kickoff the rating logic if the setting is enabled or unset. 
chrome.storage.local.get("star_rating_enabled", function(data) {
    let result = data["star_rating_enabled"]
    if (result === null || result === true) {
        starRatingEnabled = true;
    }
});

document.addEventListener("yt-navigate-finish", () => {
    if (!starRatingEnabled) { return; }
    if (isOnVideo()){ 
        console.log("YouTube Nav Finished");
        createVideoRating();
        // updateRatingAfterTitleChange(); 
    }
});


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    
    if (message.enableStarRating === false) {
        starRatingEnabled = false;
        removeVideoRating();
        return;
    }

    if (message.enableStarRating === true) {
        starRatingEnabled = true;
        console.log("Enabling star rating");
        createVideoRating();
    }

    // This can probably be removed and use the `yt-navigate-finish` event instead
    if (message.urlChanged) {
        console.log(`Got new URL: ${window.location.href}`);
        if (isOnVideo()) {
            initCommentTracking();
        }
    }

    if (message.minLikeCount != null) {
        console.log("Received like count request! Setting the minimum comment like count to " + message.minLikeCount);
        minLikeCount = message.minLikeCount;
        reevaluateComments();
    }

    if (message.filteredWords) {
        console.log("New filtered word list loaded!", message.filteredWords);
        filteredWords = message.filteredWords;
        reevaluateComments();
    }
});
