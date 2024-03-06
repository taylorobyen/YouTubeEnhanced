import { getFullNumberFromAbbreviated, removeItemFromArray, addItemToArrayIfNotPresent } from "./utils";
import { waitElement } from "./waitContent";
import { minLikeCount, filteredWords } from "./commentHandler";
import { updateCommentSelectionElement } from "./commentSection";

export let comments = []
export let hiddenComments = []
export let visibleComments = []

export class Comment {

    /**
     * @param {HTMLElement} element Comment container element
     */
    constructor(element) {
        this.element = element;
        this.text;
        this.likes;
        this.setHidden(); 
    }

    async setLikes() {
        let likeDiv = await waitElement("#vote-count-middle", this.element);
        if (!likeDiv) {
            console.log("Failed to parse like count from", this.element);
        }

        this.likes = getFullNumberFromAbbreviated(likeDiv?.textContent?.trim());
    }

    async getLikes() {
        if (this.likes) return this.likes;

        await this.setLikes();        

        return this.likes;
    }

    async setText() {
        let commentTextDiv = await waitElement("#content-text", this.element);
        if (!commentTextDiv) {
            console.log("Failed to parse comment text from",this.element);
        }

        this.text = commentTextDiv?.innerHTML;
    }

    async getText() {
        if (this.text) return this.text;

        await this.setText();

        return this.text;
    }

    async containsFilteredWord() {
        for (const filteredWord of filteredWords) {
            const regex = new RegExp(filteredWord, "i");
            if (regex.test(this.getText())) {
                return true;
            }
        }

        return false;
    }

    async setHidden() {
        if (await this.getLikes() < minLikeCount) {
            console.log(`Comment has a like count of ${this.likes} which was less than ${minLikeCount}`)
        }

        if (await this.getLikes() < minLikeCount || await this.containsFilteredWord()) {
            this.hide();
        } else {
            this.show();
        }
    }

    update() {
        this.setText();
        this.setLikes();
        this.setHidden();
    }

    isHidden() {
        return this.element.style.display === "none";
    }

    hide() {
        addItemToArrayIfNotPresent(hiddenComments, this.element);
        removeItemFromArray(visibleComments, this.element);
        this.element.style.display = "none";
        updateCommentSelectionElement(visibleComments.length, hiddenComments.length);
    }

    show() {
        addItemToArrayIfNotPresent(visibleComments, this.element);
        removeItemFromArray(hiddenComments, this.element);
        this.element.style.display = "inherit";
        updateCommentSelectionElement(visibleComments.length, hiddenComments.length);
    }
}