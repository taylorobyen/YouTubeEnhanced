let hamburgerButton;
let shortsSidebarButton;
let shortsHamburgerButton;
let filterShorts = false;

let homeVideoGridElement;
let hiddenElements = [];

function trackGridElement(gridElement) {
    // console.log("Tracking", gridElement);

    // Hit any existing stuff
    let potentialShortsElements = gridElement.querySelectorAll(".style-scope.ytd-rich-section-renderer");
    for (const subchild of potentialShortsElements) {
        processGridElementChildSubchild(subchild);
    }

    let gridElementObserver = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type === "childList") {
                for (const addedNode of mutation.addedNodes) {
                    processGridElementChildSubchild(addedNode);
                }
            }
        });
    });

    gridElementObserver.observe(gridElement, {childList: true, subtree: true});

}

function processGridElementChildSubchild(subchild) {
    // console.log(addedNode);
    if (subchild.nodeType === Node.ELEMENT_NODE && subchild.hasAttribute("is-shorts")) {
        console.log("Found the shorts!");
        const parent = subchild.parentElement.closest(".style-scope .ytd-rich-grid-renderer");
        console.log(parent);
        // parent.style.backgroundColor = "red";
        parent.classList.add("shrink");
        parent.addEventListener("animationend", () => {
            parent.classList.remove("shrink");
            parent.style.display = "none";
        }, {once: true});
        hiddenElements.push(parent);
    }
}

function processGridElementChild(gridElementChild) {
    if (gridElementChild.classList.contains("style-scope") && gridElementChild.classList.contains("ytd-rich-grid-renderer")) {
        trackGridElement(gridElementChild);
        console.log("Now tracking", gridElementChild);
    }
}

function removeDismissible() {
    dismissibleDivs = document.querySelectorAll('[id=dismissible]');
    classesToRemove = ["ytd-inline-survey-renderer"];
    for (i = 0; i < dismissibleDivs.length; i++) {
        // Don't remove the videos on the side of the screen, not sure why they are even marked as dismissible...
        for (x = 0; x < classesToRemove.length; x++) {
            if (dismissibleDivs[i].classList.contains(classesToRemove[x])) {
                console.log("Deleting dismissible div", i, "of", dismissibleDivs.length,":",dismissibleDivs[i]);
                dismissibleDivs[i].remove();
                break;
            }
        }
    }
}

function hamburgerOpen() {
    console.log("Hamburger clicked!");
    shortsHamburgerButton = document.querySelector("#items > ytd-guide-entry-renderer:nth-child(2)");
    if (shortsHamburgerButton && filterShorts) {
        shortsHamburgerButton.style.display = "none";
    }
}

function hideShortContent() {
    console.log("Hiding shorts content");
    if (shortsSidebarButton) {
        shortsSidebarButton.style.display = "none";
    }

    if (shortsHamburgerButton) {
        shortsHamburgerButton.style.display = "none";
    }

    if (homeVideoGridElement) {
        console.log("Processing video grid elements");
        for (child of homeVideoGridElement.children) {
            console.log("Previosuly exustubg ekeebnt: ", child);
            processGridElementChild(child);
        }
    
        let videoGridObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === "childList") {
                    for (const addedNode of mutation.addedNodes) {
                        processGridElementChild(addedNode);
                    }
                }
            });
        });
    
        videoGridObserver.observe(homeVideoGridElement, {childList: true, subtree: false});
    }
}

function showShortContent() {
    if (shortsSidebarButton) {
        shortsSidebarButton.style.display = "block";
    }

    if (shortsHamburgerButton) {
        shortsHamburgerButton.style.display = "block";
    }

    for (const element of hiddenElements) {
        console.log(element);
        element.style.display = "block";
    }

    hiddenElements = [];
}

function waitShortsElements() {

    console.log("Waiting for all YouTube Shorts elements to appear");

    // Hamburger for focus detection
    hamburgerButton = document.querySelector("#guide-button");
    if (!hamburgerButton) {
        console.log("Couldn't find the hamburger button");
        setTimeout(waitShortsElements, 500);
        return;
    }
    

    // Pattern is for being on the main page of youtube.com
    const pattern = /.*youtube\.com.$/
    if (pattern.test(window.location.href)) {
        console.log("Grabbing video grid from homepage");
        // homeVideoGridElement = document.querySelector("#contents");
        homeVideoGridElement = document.querySelector("#contents.style-scope.ytd-rich-grid-renderer");
        console.log("Home grid element is this", homeVideoGridElement);
        if (!homeVideoGridElement) {
            console.log("Couldn't find video grid");
            setTimeout(waitShortsElements, 500);
            return; 
        }

        shortsSidebarButton = document.querySelector("#items > ytd-mini-guide-entry-renderer:nth-child(2)");
        if (!shortsSidebarButton) {
            console.log("Coudln't find shorts sidebar button");
            setTimeout(waitShortsElements, 500);
            return;
        }
    }

    hamburgerButton.addEventListener("click", hamburgerOpen);

    if (filterShorts) {
        hideShortContent();
    }
}

document.addEventListener("yt-navigate-finish", () => {
    console.log("Navigate finished");
    waitShortsElements();
});

console.log("Initializing shorts filter");
waitShortsElements();

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.enableFilterShorts == null) {
        return;
    }
    console.log("Changing the state of filter shorts to",request.filter_shorts_enabled);
    if (request.enableFilterShorts) {
        hideShortContent();
        filterShorts = false;
        return;
    }

    showShortContent();
});

chrome.storage.local.get("filter_shorts_enabled", function(data) {
    let result = data.filter_shorts_enabled;
    console.log("Filter shorts",result);
    if (!result) {
        showShortContent();
        return;
    }

    console.log("Filter shorts hiding now");
    hideShortContent();
    filterShorts = true;
});