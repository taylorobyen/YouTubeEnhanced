let minLikeCount = 0;

/* 
    Div that is the parent to all comments.

    Once this div is created it will not be removed unless the page is fully refreshed.
*/
let commentsContentDiv;

let waitingForEssentialDivs = false;
let listeningForComments = false;

let filteredWords = [];

let commentCountDiv;


// Keep track of the current URL so we can reparse all comment when we change videos. 
let currentURL = "";

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

        updateCommentSelectionElement();
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

        updateCommentSelectionElement();

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

function isOnVideo() {
    if (window.location.href.search("watch") === -1) {
        return false;
    }
    return true;
}

// Youtube likes to abbreviate views and likes, we need the full number so we can do math and get the ratios
// 87K -> 87000
// 40M -> 40000000
function getFullNumberFromAbbreviated(abbreviatedNumber) {
    const conversionChart = {
        "K": 1000,
        "M": 1000000,
        "B": 1000000000
    };

    // Remove any commas incase the number isn't abbreviated
    abbreviatedNumber = abbreviatedNumber.replace(",","");

    for (var abbreviationSymbol in conversionChart) {
        if (abbreviatedNumber.includes(abbreviationSymbol)) {
            return abbreviatedNumber.split(abbreviationSymbol)[0] * conversionChart[abbreviationSymbol];
        }
    }

    // If no symbol was found the number wasn't abbreviated
    return abbreviatedNumber;
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

function reevaluateComments() {
    // console.log("Refreshing the hidden state of",comments.length,"comments.");
    // for (let i = 0; i < comments.length; i++) {
    //     comments[i].setLikes(0);
    // }

    for (comment of comments) {
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

function updateCommentSelectionElement() {
    if (!commentSelectionElement) { return; }
    if (!document.contains(commentSelectionElement)) {
        console.log("My magic element dissapeared unexpectededly so I crecreate now 😎");
        commentSelectionElement = null;
        createCommentSelectionElement();
    }
    commentSelectionElement.querySelector("#comment-total-count").textContent = visibleComments.length + hiddenComments.length;
    commentSelectionElement.querySelector("#filtered-total-count").textContent = hiddenComments.length;
    commentSelectionElement.querySelector("#like-count-filter").setAttribute("placeholder", minLikeCount);
}

let commentSelectionElement;
function createCommentSelectionElement(parent) {
    if (commentSelectionElement) { return; }

    for (const child of parent.childNodes) {
        child.style.display = "none";
    }

    let iconSize = "20";
    let strokeWidth = "2";
    let strokeColor = window.getComputedStyle(parent).color;

    commentSelectionElement = document.createElement("div");
    commentSelectionElement.classList.add("comment-buttons");

    parent.appendChild(commentSelectionElement);

    let commentsTotal = document.createElement("div");
    commentsTotal.classList.add("info-icon-box");
    commentSelectionElement.appendChild(commentsTotal);

    let commentIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    commentIcon.setAttribute("viewBox", "0 0 24 24");
    commentIcon.setAttribute("width", iconSize);
    commentIcon.setAttribute("height", iconSize);
    commentIcon.setAttribute("fill", "none");
    commentsTotal.appendChild(commentIcon);

    let commentIconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    commentIconPath.setAttribute("d", "M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 13.4876 3.36093 14.891 4 16.1272L3 21L7.8728 20C9.10904 20.6391 10.5124 21 12 21Z");
    commentIconPath.setAttribute("stroke", strokeColor);
    commentIconPath.setAttribute("stroke-width", strokeWidth);
    commentIconPath.setAttribute("stroke-linecap", "round");
    commentIcon.appendChild(commentIconPath);

    let commentTotalCount = document.createElement("span");
    commentTotalCount.textContent = "0";
    commentTotalCount.id = "comment-total-count";
    commentsTotal.appendChild(commentTotalCount);

    let filteredTotal = document.createElement("div");
    filteredTotal.classList.add("info-icon-box");
    commentSelectionElement.appendChild(filteredTotal);

    let filteredIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    filteredIcon.setAttribute("viewBox", "0 0 24 24");
    filteredIcon.setAttribute("width", iconSize);
    filteredIcon.setAttribute("height", iconSize);
    filteredIcon.setAttribute("fill", "none");
    filteredTotal.appendChild(filteredIcon);

    let filteredIconPath1 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    filteredIconPath1.setAttribute("d", "M12 21C16.9706 21 21 16.9706 21 12C21 7.02944 16.9706 3 12 3C7.02944 3 3 7.02944 3 12C3 13.4876 3.36093 14.891 4 16.1272L3 21L7.8728 20C9.10904 20.6391 10.5124 21 12 21Z");
    filteredIconPath1.setAttribute("stroke", strokeColor);
    filteredIconPath1.setAttribute("stroke-width", strokeWidth);
    filteredIconPath1.setAttribute("stroke-linecap", "round");
    filteredIcon.appendChild(filteredIconPath1);

    let filteredIconPath2 = document.createElementNS("http://www.w3.org/2000/svg", "path");
    filteredIconPath2.setAttribute("d", "M10.0002 10L14.0002 14M10.0002 14L14.0002 10");
    filteredIconPath2.setAttribute("stroke", strokeColor);
    filteredIconPath2.setAttribute("stroke-width", strokeWidth);
    filteredIconPath2.setAttribute("stroke-linecap", "round");
    filteredIcon.appendChild(filteredIconPath2);

    let filteredTotalCount = document.createElement("span");
    filteredTotalCount.textContent = "0";
    filteredTotalCount.id = "filtered-total-count";
    filteredTotal.appendChild(filteredTotalCount);

    let likeCountSelector = document.createElement("div");
    likeCountSelector.classList.add("info-icon-box");
    commentSelectionElement.appendChild(likeCountSelector);

    let likeIcon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    likeIcon.classList.add("absolute-left-icon");
    likeIcon.setAttribute("viewBox", "0 0 24 24");
    likeIcon.setAttribute("width", iconSize);
    likeIcon.setAttribute("height", iconSize);
    likeIcon.setAttribute("fill", "none");
    likeCountSelector.appendChild(likeIcon);

    let likeIconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
    likeIconPath.setAttribute("d", "M18.77,11h-4.23l1.52-4.94C16.38,5.03,15.54,4,14.38,4c-0.58,0-1.14,0.24-1.52,0.65L7,11H3v10h4h1h9.43 c1.06,0,1.98-0.67,2.19-1.61l1.34-6C21.23,12.15,20.18,11,18.77,11z M7,20H4v-8h3V20z M19.98,13.17l-1.34,6 C18.54,19.65,18.03,20,17.43,20H8v-8.61l5.6-6.06C13.79,5.12,14.08,5,14.38,5c0.26,0,0.5,0.11,0.63,0.3 c0.07,0.1,0.15,0.26,0.09,0.47l-1.52,4.94L13.18,12h1.35h4.23c0.41,0,0.8,0.17,1.03,0.46C19.92,12.61,20.05,12.86,19.98,13.17z");
    likeIconPath.setAttribute("stroke", strokeColor);
    likeIconPath.setAttribute("stroke-width", "1");
    likeIconPath.setAttribute("stroke-linecap", "round");
    likeIcon.appendChild(likeIconPath);

    let likeCountTextInput = document.createElement("input");
    likeCountTextInput.setAttribute("type", "text");
    likeCountTextInput.setAttribute("placeholder", "0");
    likeCountTextInput.setAttribute("size", "3");
    likeCountTextInput.classList.add("text-input-with-icon");
    likeCountTextInput.id = "like-count-filter";
    likeCountSelector.appendChild(likeCountTextInput);

    likeCountTextInput.addEventListener("input", (event) => {
        let inputValue = event.target.value;
        if (inputValue) {
            inputValue = inputValue.slice(0, 3);
            likeCountTextInput.value = inputValue
        }
        const newLikeMin = Number(inputValue);
        if (isNaN(newLikeMin)) { return }
        minLikeCount = newLikeMin;
        chrome.storage.local.set({"min_like_count": minLikeCount});
        reevaluateComments();
    });

    likeCountTextInput.addEventListener("blur", (event) => {
        if (likeCountTextInput.value !== "" && !isNaN(Number(likeCountTextInput.value))) {
            likeCountTextInput.placeholder = likeCountTextInput.value;
        }
        likeCountTextInput.value = "";
    });
}

// Recursive function that will wait for the parent div of the comments
function waitForCommentsContentDiv(recurse) {

    if (waitingForEssentialDivs && !recurse) { return; }

    waitingForEssentialDivs = true;

    if (!isOnVideo()) { 
        console.log("Not on watchable video, not capturing comments then.");
        waitingForEssentialDivs = false;
        return; 
    }

    commentCountDiv = document.querySelector("#count > yt-formatted-string > span:nth-child(2)");
    if (commentCountDiv == null) {
        setTimeout(waitForCommentsContentDiv, 500, true);
        return;
    }

    // Hide the number count in front of the comments title "0 Comments" -> "Comments"
    document.querySelector("#count > yt-formatted-string > span:nth-child(1)").style.display = "none";

    let commentsDiv = document.getElementById("comments");
    if (commentsDiv == null) {
        setTimeout(waitForCommentsContentDiv, 500, true);
        return;
    }

    commentsContentDiv = commentsDiv.querySelector("#contents");
    if (commentsContentDiv == null) {
        setTimeout(waitForCommentsContentDiv, 500, true);
        return;
    }

    // Listens for any comment updates and hides/shows based on the updated values
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {  

            if (mutation.type != "characterData") { return; }
            
            const comment = mutation.target.parentElement.closest("ytd-comment-thread-renderer");
            
            updateComment(comment);
        });
    });

    const config = {
        childList: true,
        subtree: true,
        characterData: true
    };

    observer.observe(commentsContentDiv, config);

    // A few comments may be present before the observer is listening. Process any that may have been missed.
    for (const comment of commentsContentDiv.childNodes) {
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
waitForCommentsContentDiv();

chrome.runtime.onMessage.addListener(
    function (message, sender, sendResponse) {
        // if (message.minLikeCount == null && message.urlChanged == null) {
        //     return;
        // }

        if (message.urlChanged) {
            console.log("comments.js - Got new URL:", window.location.href);
            if (isOnVideo()) {
                comments = [];
                hiddenComments = [];
                visibleComments = [];
                if (!commentsContentDiv) {
                    waitForCommentsContentDiv();
                    return;
                }
            }
            return;
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
    }
);