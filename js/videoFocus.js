import { waitElement } from "./waitContent";

export let lockVideoFocus = true

let videoElement;
let volumeElement;

function setVideoFocus() {
    if (videoElement) {
        const x = window.scrollX;
        const y = window.scrollY;
        videoElement.focus();
        window.scrollTo(x, y);
    }
}

export async function lockArrowFocusToVideo() {
    videoElement = await waitElement("video");
    volumeElement = await waitElement(".ytp-volume-panel");
    volumeElement.addEventListener("focus", setVideoFocus);
}

export function unsetVideoFocusListener() {
    volumeElement.removeEventListener("focus", setVideoFocus);
}