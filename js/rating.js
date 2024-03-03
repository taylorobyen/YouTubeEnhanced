import { getFullNumberFromAbbreviated, isOnVideo } from "./utils";
import { waitElement } from "./waitContent";

export let starRatingEnabled = true;
let pendingRating = false;
let ratingContainer;
let rating;
let viewCountElement;
let likeCountElement;
let titleElement;
let ratedTitle;
let ratedUrl;

let createdRatingRunCount = 0;

// ★ ☆
// Returns the star rating as a string
function getRating(views, likes) {
    var score = likes/views
    console.log("Score:",score,"Likes:",likes,"Views:",views);
    if (score > 0.04){ 
        return "★★★★★"
    }else if (score > 0.03){
        return "★★★★☆"
    }else if(score > 0.01){
        return "★★★☆☆"
    }else if(score > 0.005){
        return "★★☆☆☆"
    }else if (score > 0.001){
        return "★☆☆☆☆"
    }else{
        return "☆☆☆☆☆"
    }
}

function updateRating() {
    console.log("Ok we are updating the rating now...");
    if (!likeCountElement || !viewCountElement ) { return; }
    console.log("The rating passed the check thing");
    let likeCount = getFullNumberFromAbbreviated(likeCountElement.innerHTML);
    let viewCount = getFullNumberFromAbbreviated(viewCountElement.innerHTML.split(" ")[0]);

    rating.innerHTML = getRating(viewCount, likeCount);

    ratedTitle = titleElement.innerHTML;
    ratedUrl = window.location.href;

    rating.classList.add("star-flash");
    rating.addEventListener("animationend", () => {
        rating.classList.remove("star-flash");
    }, {once: true});

    console.log("Applied rating to'",ratedTitle,"'with a view count of",viewCount,"and a like count of",likeCount);
}

/** @param {HTMLElement} titleElement */
/** @returns {null} */
function watchForTitleChanges(titleElement) {
    console.log("Watching title element");
    const observer = new MutationObserver(mutations => {
        console.log("I HAVE OBSERVED A NEW TITLE THING", mutations);
        createVideoRating();
        observer.disconnect();
    });

    observer.observe(titleElement, {
        characterData: true,
        childList: true,
        subtree: true
    })
}


export function updateRatingAfterTitleChange() {

    console.log("The title element is", titleElement);

    // Rating has already been applied.
    if (ratedUrl === window.location.href) return;

    if (!titleElement || ratedTitle === titleElement.innerHTML) {
        setTimeout(updateRatingAfterTitleChange, 500);
        return;
    }

    console.log("The title has changed");
    updateRating();
}

export function removeVideoRating() {
    if (ratingContainer) {
        ratingContainer.remove();
        ratingContainer = null;
    }
}

export async function createVideoRating() {
    createdRatingRunCount++;

    console.log(`I have run ${createdRatingRunCount} times!`);

    console.log("createVideoRating has been called. pendingRating: ", pendingRating);

    if (!starRatingEnabled || pendingRating || !isOnVideo()) {
        console.log("Exiting early from createVideoRating");
        return;
    }

    pendingRating = true;

    console.log("createVideoRunning checks passed");

    console.log("Waiting for essential elements to load...?");
    let dislikeButton = await waitElement("ytd-watch-metadata #top-level-buttons-computed > segmented-like-dislike-button-view-model > yt-smartimation > div > div > dislike-button-view-model");
    let likeButton = await waitElement("ytd-watch-metadata #top-level-buttons-computed > segmented-like-dislike-button-view-model > yt-smartimation > div > div > like-button-view-model > toggle-button-view-model > button-view-model > button");

    console.log("Like and Dislike elements found");

    // Global because other functions depend on them
    titleElement = await waitElement("#title > h1 > yt-formatted-string");
    likeCountElement = await waitElement(".yt-spec-button-shape-next__button-text-content", likeButton);
    viewCountElement = await waitElement("#info > span:nth-child(1)");

    console.log("The rest of the elements have been found");

    // ratingContainer is global because it needs to be removable if the user changes settings. 
    ratingContainer = document.createElement("span");
    ratingContainer.id = "youtube-enhanced-rating-container"
    ratingContainer.style.backgroundColor = getComputedStyle(likeButton).backgroundColor;
    dislikeButton.parentElement.insertBefore(ratingContainer, dislikeButton);
    
    rating = document.createElement("span");
    rating.id = "youtube-enhanced-rating";
    ratingContainer.appendChild(rating);

    let divider = document.createElement("span");
    divider.id = "youtube-enhanced-divider";
    divider.style.backgroundColor = getComputedStyle(likeButton, '::after').backgroundColor;
    ratingContainer.appendChild(divider);

    updateRating();

    watchForTitleChanges(titleElement);

    pendingRating = false;
}
