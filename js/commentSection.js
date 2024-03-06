import { reevaluateComments, minLikeCount } from "./commentHandler";

let commentSelectionElement;
export function createCommentSelectionElement(parent) {
    if (commentSelectionElement) { return; }

    console.log("Before crisis?", parent);
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

    let filteredTotalCountStyle = getComputedStyle(filteredTotalCount);

    let likeCountTextInput = document.createElement("input");
    likeCountTextInput.setAttribute("type", "text");
    likeCountTextInput.setAttribute("placeholder", "0");
    // likeCountTextInput.setAttribute("size", "3");
    likeCountTextInput.style.fontSize = filteredTotalCountStyle.fontSize;
    likeCountTextInput.style.fontWeight = filteredTotalCountStyle.fontWeight;
    likeCountTextInput.classList.add("text-input-with-icon");
    likeCountTextInput.id = "like-count-filter";
    likeCountSelector.appendChild(likeCountTextInput);

    likeCountTextInput.addEventListener("input", (event) => {
        let inputValue = event.target.value;
        if (inputValue) {
            inputValue = inputValue.slice(0, 3);
            likeCountTextInput.value = inputValue
        }

        minLikeCount = Number(inputValue) || 0;
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

/**
 * 
 * @param {number} visibleCount 
 * @param {number} hiddenCount 
 * @returns {null}
 */
export function updateCommentSelectionElement(visibleCount, hiddenCount) {
    if (!commentSelectionElement) return;
    if (!document.contains(commentSelectionElement)) {
        console.log("My magic element dissapeared unexpectededly so I crecreate now 😎");
        commentSelectionElement = null;
        createCommentSelectionElement();
    }
    commentSelectionElement.querySelector("#comment-total-count").textContent = visibleCount + hiddenCount;
    commentSelectionElement.querySelector("#filtered-total-count").textContent = hiddenCount;
    commentSelectionElement.querySelector("#like-count-filter").setAttribute("placeholder", minLikeCount);
}