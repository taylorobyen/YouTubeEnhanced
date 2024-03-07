import { isOnVideo } from "./utils";
import { createVideoRating, removeVideoRating, starRatingEnabled } from "./rating";
import { resetCommentTracking, reevaluateComments, minLikeCount, filteredWords } from "./commentHandler";
import { lockArrowFocusToVideo, unsetVideoFocusListener, lockVideoFocus, setVideoFocus, scrollToTop } from "./videoFocus";

// Only kickoff the rating logic if the setting is enabled or unset. 
chrome.storage.local.get("star_rating_enabled", (data) => {
    let result = data["star_rating_enabled"]
    if (result === null || result === true) {
        starRatingEnabled = true;
    }
});

chrome.storage.local.get("lock_arrows_to_video_time", (data) => {
    let lockVideoFocus = data.lock_arrows_to_video_time | false;
    if (!lockVideoFocus || !isOnVideo()) {
        return;
    }
    lockArrowFocusToVideo();
});

document.addEventListener("yt-navigate-finish", () => {
    if (isOnVideo()){ 
        console.log("YouTube Nav Finished");
        if (starRatingEnabled) {
            createVideoRating();
        }

        if (lockVideoFocus) {
            lockArrowFocusToVideo();
        }

        resetCommentTracking();
    }
});

document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && lockVideoFocus) {
        setVideoFocus();
        scrollToTop();
    }
});


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    
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

    if (message.enableLockArrows) {
        lockArrowFocusToVideo();
    } else if (message.enableLockArrows === false) {
        unsetVideoFocusListener();
    }
});
