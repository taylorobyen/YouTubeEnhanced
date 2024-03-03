const minCommentLikeInput = document.querySelector("#comment-like-min");
const starRatingCheckbox = document.querySelector("#star-rating-check");
const hideShortsCheckbox = document.querySelector("#hide-shorts-check");
const lockArrowsCheckbox = document.querySelector("#lock-arrows-check");

function sendMessage(messageObj) {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
        
        (async () => {
            chrome.tabs.sendMessage(tabs[0].id, messageObj, function(response){
                console.log("Message sent");
                if (chrome.runtime.lastError) {
                    console.log("Message wasn't received");
                }
            });
        })();
    });

    // For backend communications
    chrome.runtime.sendMessage(messageObj);
}

function setElementValueFromSettings(element, elementKey, settingKey, defaultIfNull) {
    chrome.storage.local.get(settingKey, function(data) {
        let result = data[settingKey];
        if (result == null) {
            result = defaultIfNull;
        }
        element[elementKey] = result;
    });
}

minCommentLikeInput.addEventListener("input", function(event) {

    const minCommentLikes = Number(event.target.value);
    if (isNaN(minCommentLikes)) { return; }

    console.log(minCommentLikes);

    // Stores the value to be pulled by comments.js, also persistence. 
    chrome.storage.local.set({"min_like_count": minCommentLikes}, function() {
        console.log("Setting was set.");
    });

    sendMessage({minLikeCount: minCommentLikes});
});

setElementValueFromSettings(minCommentLikeInput, "placeholder", "min_like_count", 0);
minCommentLikeInput.addEventListener("blur", function(event) {
    if (!isNaN(Number(event.target.value)) && event.target.value != "") {
        event.target.placeholder = event.target.value;
    } else {
        setElementValueFromSettings(minCommentLikeInput, "placeholder", "min_like_count", 0);
    }
    
    event.target.value = "";
});

minCommentLikeInput.addEventListener("focus", function(event) {
    event.target.style.color = event.target.style.backgroundColor;
})


setElementValueFromSettings(starRatingCheckbox, "checked", "star_rating_enabled", true);

starRatingCheckbox.addEventListener("input", function(event) {
    sendMessage({enableStarRating: starRatingCheckbox.checked});
    chrome.storage.local.set({"star_rating_enabled": starRatingCheckbox.checked});
});

setElementValueFromSettings(hideShortsCheckbox, "checked", "filter_shorts_enabled", false);
hideShortsCheckbox.addEventListener("input", function(event){
    sendMessage({enableFilterShorts: hideShortsCheckbox.checked});
    chrome.storage.local.set({"filter_shorts_enabled": hideShortsCheckbox.checked});
});

setElementValueFromSettings(lockArrowsCheckbox, "checked", "lock_arrows_to_video_time", false);
lockArrowsCheckbox.addEventListener("input", function(event){
    sendMessage({enableLockArrows: lockArrowsCheckbox.checked});
    chrome.storage.local.set({"lock_arrows_to_video_time": lockArrowsCheckbox.checked});
});


const inputElements = document.querySelectorAll('.tipped')
for (const inputElement of inputElements){
    const tooltip = inputElement.parentElement.querySelector(".tooltip");
    inputElement.addEventListener("mousemove", (event) => {
        tooltip.style.visibility = "visible";
        tooltip.style.top = `${event.pageY + 10}px`;
        tooltip.style.left = `${event.pageX + 10}px`;
    });
    inputElement.addEventListener("mouseout", () => {
        tooltip.style.visibility = "hidden";
    });
}

const filteredWordsElement = document.querySelector("#filtered-words");
const filteredWordTemplate = document.querySelector(".filtered-word");
filteredWordTemplate.remove();
const filterWordTextbox = document.querySelector("#filter-word");
const filterWordButton = document.querySelector("#filter-word-button");

// Init filtered words 
let filteredWords = [];
chrome.storage.local.get("filteredWords", (result) => {
    if (result.filteredWords) {
        for (const filteredWord of result.filteredWords) {
            addFilteredWord(filteredWord);
        }
    }
});

function addFilteredWord(word) {

    let filteredWord = filteredWordTemplate.cloneNode(true);
    filteredWord.querySelector("span").textContent = word;

    filteredWordsElement.appendChild(filteredWord);

    filteredWord.addEventListener("click", () => {
        removeFilteredWord(filteredWord.querySelector("span").textContent);
        filteredWord.remove();
    });

    filteredWords.push(word);

    chrome.storage.local.set({"filteredWords": filteredWords}, () => {
        console.log("Filtered words updated in storage");
    });

    sendMessage({filteredWords: filteredWords});
}

function removeFilteredWord(word) {
    const index = filteredWords.indexOf(word);
    if (index !== -1) {
        filteredWords.splice(index, 1);
        chrome.storage.local.set({"filteredWords": filteredWords}, () => {
            console.log("Filtered word was removed from storage");
        });
    }

    sendMessage({filteredWords: filteredWords});
}

function filterWordSubmitted() {
    const word = filterWordTextbox.value;
    if (word === "") { return; }
    addFilteredWord(word);
    filterWordTextbox.value = "";
}

filterWordTextbox.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        filterWordSubmitted();
    }
});

filterWordButton.addEventListener("click", () => {
    filterWordSubmitted();
});