import { waitElement } from "./waitContent";

export let lockVideoFocus = true

/** @type {HTMLVideoElement} */
let videoElement;

/** @type {HTMLElement} */
let volumeElement;

export function scrollToTop() {
    console.log("SCROLLING");
    if (videoElement) {
        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    }
}

export function setVideoFocus() {
    if (videoElement) {
        const x = window.scrollX;
        const y = window.scrollY;
        videoElement.focus();

        // Prevents scroll jumping when adjusting volume
        window.scrollTo(x, y);
    } else {
        console.log("No video to focus on");
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