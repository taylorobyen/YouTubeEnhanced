let videoElement;
let volumeElement;

function isOnVideo() {
    if (window.location.href.search("watch") === -1) {
        return false;
    }
    return true;
}

function setVideoFocus() {
    if (videoElement) {
        const x = window.scrollX;
        const y = window.scrollY;
        videoElement.focus();
        window.scrollTo(x, y);
    }
}

function lockArrowFocusToVideo() {
    videoElement = document.querySelector("video");
    if (!videoElement) {
        setTimeout(lockArrowFocusToVideo, 1000);
        return;
    }

    volumeElement = document.querySelector(".ytp-volume-panel");
    if (!volumeElement) {
        setTimeout(lockArrowFocusToVideo, 1000);
        return;
    }

    volumeElement.addEventListener("focus", setVideoFocus);
}

function start() {
    chrome.storage.local.get("lock_arrows_to_video_time", function(data) {
        let result = data.lock_arrows_to_video_time;
        if (!result || !isOnVideo()) {
            return;
        }
    
        lockArrowFocusToVideo();
    });
}

document.addEventListener("yt-navigate-finish", () => {
    start();
});

start();

chrome.runtime.onMessage.addListener(function(request) {
    if (request.enableLockArrows == null) {
        return;
    }
    console.log("Changing the state of filter shorts to",request.enableLockArrows);
    if (request.enableLockArrows) {
        lockArrowFocusToVideo();
    } else if (volumeElement) {
        volumeElement.removeEventListener("focus", setVideoFocus);
    }
});

