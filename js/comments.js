import { createCommentSelectionElement, updateCommentSelectionElement } from "./commentSection";
import { getFullNumberFromAbbreviated } from "./utils";
import { isOnVideo } from "./utils";
import { waitElement } from "./waitContent";

export let minLikeCount = 0;

/* 
    Div that is the parent to all comments.

    Once this div is created it will not be removed unless the page is fully refreshed.
*/
let commentsContainer;

let waitingForEssentialDivs = false;

export let filteredWords = [];

let commentCountDiv;

let comments = [];
let hiddenComments = [];
let visibleComments = [];

class Comment {

    constructor(element) {
        this.element = element;

        this.text = "";
        this.textElement;
        this.setText(0);

        this.author = "";
        this.authorElement;
        this.setAuthor(0);

        // Parses the likes from the element, will also hide the element if
        // it is below the threshold.
        this.likes = 0;
        this.likesElement;
        this.setLikes(0);

        this.setHidden();

        updateCommentSelectionElement(visibleComments.length, hiddenComments.length);
    }

    setLikes(attempts) {

        let likeDiv = this.element.querySelector("#vote-count-middle");
        if (!likeDiv) {
            console.log("Could not parse like count from comment.");
            setTimeout(this.setLikes.bind(this), 500, attempts++);
            return;
        }
        
        if (attempts > 5) {
            console.log("Failed to parse the like count from the comment.");
            return;
        }

        this.likesElement = likeDiv;
        this.likes = getFullNumberFromAbbreviated(likeDiv.textContent.trim());

        // this.authorElement.innerHTML = this.authorElement.innerHTML.trim().split("-")[0] + " - " + this.likes;
        // console.log("Successfully parsed the likes from the comment.",this.likes,this.element);

        
    }

    setText(attempts) {

        if (attempts > 5) {
            console.log("Failed to parse comment text from",this.element);
            return;
        }

        let commentTextDiv = this.element.querySelector("#content-text");
        if (!commentTextDiv) {
            setTimeout(this.setText.bind(this), 500, attempts++);
            return;
        }

        this.textElement = commentTextDiv;
        this.text = commentTextDiv.innerHTML;
    }

    setAuthor(attempts) {
        let authorElement = this.element.querySelector("#author-text");

        if (attempts > 5) {
            console.log("Failed to parse author from",this.element);
            return;
        }

        if (!authorElement || authorElement.children.length < 1) {
            setTimeout(this.setAuthor.bind(this), 500, attempts++);
            return;
        }

        this.authorElement = authorElement.children[0];
        this.author = authorElement.children[0].innerHTML.trim();
    }

    setHidden() {

        let containsBadWord = false;
        for (const filteredWord of filteredWords) {
            const regex = new RegExp(filteredWord, "i");
            if (regex.test(this.text)) {
                containsBadWord =  true;
                break;
            }
        }

        if (this.likes < minLikeCount || containsBadWord) {
            this.hide();
        } else {
            this.show();
        }
    }

    update() {
        this.setText(0);
        this.setAuthor(0);
        this.setLikes(0);
        this.setHidden();

        updateCommentSelectionElement(visibleComments.length, hiddenComments.length);

        // console.log("Successully updated the comment.", this.element);
    }

    isHidden() {
        return this.element.style.display == "none";
    }

    hide() {
        addElementToArray(hiddenComments, this.element);
        removeElementFromArray(visibleComments, this.element);
        this.element.style.display = "none";
        // this.element.style.backgroundColor = "red";
    }

    show() {
        addElementToArray(visibleComments, this.element);
        removeElementFromArray(hiddenComments, this.element);
        this.element.style.display = "inherit";
        // this.element.style.backgroundColor = "inherit";
    }
}

function removeElementFromArray(array, element) {
    const index = array.indexOf(element);

    if (index !== -1) {
        array.splice(index, 1);
    }

    return array;
}

function addElementToArray(array, element) {
    const index = array.indexOf(element);

    if (index === -1) {
        array.push(element);
    }
}

function updateComment(updatedComment) {

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
    if (comment.nodeName.toLowerCase() != "ytd-comment-thread-renderer") {
        // console.log("Invalid comment type:",comment.nodeName);
        return;
    }

    comments.push(new Comment(comment));
    // console.log("Comment added! We now have",comments.length,"comments!");
}

export function reinitCommentTracking() {
    comments = [];
    hiddenComments = [];
    visibleComments = [];
    if (!commentsContainer) {
        initCommentTracking();
        return;
    }
}

async function initCommentTracking() {

    if (waitingForEssentialDivs || !isOnVideo) return;

    waitingForEssentialDivs = true;

    commentCountDiv = await waitElement("#count > yt-formatted-string > span:nth-child(2)");

    commentsContainer = await waitElement("#comments #contents");

    // Listens for comments as they load in
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {  
            if (mutation.type === "childList") {
                for (let comment of mutation.addedNodes) {
                    updateComment(comment);
                }
            }
        });
    });
    observer.observe(commentsContainer, {childList: true});

    // A few comments may be present before the observer is listening. Process any that may have been missed.
    for (const comment of commentsContainer.childNodes) {
        // console.log("Processing existing comment", comment);
        updateComment(comment);
    }

    // Creates the icons and number display for showing the user how many comments have been filtered
    createCommentSelectionElement(document.querySelector("#count > yt-formatted-string"));

    waitingForEssentialDivs = false;
}

chrome.storage.local.get("filteredWords", (result) => {
    if (result.filteredWords) {
        filteredWords = result.filteredWords;
        reevaluateComments();
    }
});

updateMinLikeCountFromSettings();
initCommentTracking();