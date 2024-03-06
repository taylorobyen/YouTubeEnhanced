import { createCommentSelectionElement } from "./commentSection";
import { isOnVideo } from "./utils";
import { waitElement } from "./waitContent";
import { Comment, comments, hiddenComments, visibleComments } from "./comments";

export let minLikeCount = 0;
export let filteredWords = [];

/** @type {HTMLElement} */
let commentsContainer;
/** @type {HTMLElement} */
let waitingForEssentialDivs = false;

// let commentCountDiv;

/**
 * Handles comments when they are created or modified. Will automatically skip elements such as loading wheels.
 * @param {HTMLElement} updatedComment Potentially updated comment
 * @returns {null}
 */
function handleCommentChange(updatedComment) {
    if (updatedComment.nodeName.toLowerCase() != "ytd-comment-thread-renderer") {
        return;
    }

    for (const comment of comments) {
        if (comment.element == updatedComment) {
            comment.update();
            return;
        }
    }

    // Comment wasn't tracked.
    trackComment(updatedComment);
}

function updateMinLikeCountFromSettings() {
    chrome.storage.local.get("min_like_count", function(data) {
        result = data.min_like_count;
        if (result == null) {
            result = 0;
        }
        console.log("Min like count: ", result);
        minLikeCount = result;
        reevaluateComments();
    });
}

export function reevaluateComments() {
    for (let comment of comments) {
        comment.update();
    }
}

function trackComment(comment) {
    comments.push(new Comment(comment));
}

export function resetCommentTracking() {
    comments = [];
    hiddenComments = [];
    visibleComments = [];
    reevaluateComments();
    if (!commentsContainer) {
        setupCommentObserver();
    }
}

async function setupCommentObserver() {

    if (waitingForEssentialDivs || !isOnVideo) return;

    waitingForEssentialDivs = true;

    // commentCountDiv = await waitElement("#count > yt-formatted-string > span:nth-child(2)", document, 0);
    let commentCountWrapper = await waitElement("#count > yt-formatted-string", document, 0);


    commentsContainer = await waitElement("#comments #contents");

    // Listens for comments as they load in
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {  
            if (mutation.type === "childList") {
                for (let comment of mutation.addedNodes) {
                    handleCommentChange(comment);
                }
            }
        });
    });
    observer.observe(commentsContainer, {childList: true});

    // A few comments may be present before the observer is listening. Process any that may have been missed.
    for (const comment of commentsContainer.childNodes) {
        // console.log("Processing existing comment", comment);
        handleCommentChange(comment);
    }

    // Creates the icons and number display for showing the user how many comments have been filtered
    createCommentSelectionElement(commentCountWrapper);

    waitingForEssentialDivs = false;
}

chrome.storage.local.get("filteredWords", (result) => {
    if (result.filteredWords) {
        filteredWords = result.filteredWords;
        reevaluateComments();
    }
});

updateMinLikeCountFromSettings();
setupCommentObserver();