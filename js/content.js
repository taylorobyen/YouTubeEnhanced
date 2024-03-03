import { isOnVideo } from "./utils";
import { createVideoRating, removeVideoRating, updateRatingAfterTitleChange, starRatingEnabled } from "./rating";


// Only kickoff the rating logic if the setting is enabled or unset. 
chrome.storage.local.get("star_rating_enabled", function(data) {
    let result = data["star_rating_enabled"]
    if (result == null || result == true) {
        starRatingEnabled = true;
    }
});

document.addEventListener("yt-navigate-finish", () => {
    if (!starRatingEnabled) { return; }
    if (isOnVideo()){ 
        console.log("YouTube Nav Finished");
        createVideoRating();
        updateRatingAfterTitleChange(); 
    }
});


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
    
    if (message.enableStarRating == false) {
        starRatingEnabled = false;
        removeVideoRating();
        return;
    }

    if (message.enableStarRating == true) {
        starRatingEnabled = true;
        console.log("Enabling star rating");
        createVideoRating();
    }
});
