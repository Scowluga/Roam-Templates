// ----------------------------------
// Logging
// ----------------------------------
const LOGGING = false; 
function log(text) { if (LOGGING) console.log(text); }
function logMethod(text) { log("-----" + text + "-----"); }

// ----------------------------------
// Clicking
// ----------------------------------
const CLICK_DELAY = 50; 

function triggerMouseDown(element) {
    let event = document.createEvent('MouseEvents'); 
    event.initMouseEvent('mousedown', true, true); 
    event.shiftKey = true; 
    element.dispatchEvent(event);
}

// ----------------------------------
// Clipboard
// ----------------------------------
function loadIntoClipboard(text) {
    let temp = document.createElement('textarea'); 
    document.body.appendChild(temp); 
    temp.value = text; 

    temp.focus(); 
    temp.select(); 
    document.execCommand('copy'); 
    temp.remove(); 
}

/**
 * @returns {String} the text copied in the clipboard
 */
function loadFromClipboard() {
    let temp = document.createElement('textarea'); 
    document.body.appendChild(temp); 

    temp.focus(); 
    temp.select(); 
    document.execCommand('paste'); 

    let text = temp.value; 
    temp.remove();
    return text; 
}

/**
 * @returns {String} the text that is currently selected
 */
function loadFromSelected() {
    document.execCommand('copy');
    return loadFromClipboard(); 
}

/**
 * @param {*} element - the element to be pasted into 
 * @param {*} text - the text to paste
 */
function pasteIntoElement(element, text) {
    loadIntoClipboard(text); 
    triggerMouseDown(element);
    setTimeout(function() {
        document.execCommand('paste');
        log("pasted text: " + text);  
    }, CLICK_DELAY); 
}

// ----------------------------------
// Storage
// ----------------------------------
const DAILY_TEMPLATE_KEY = "DAILY_TEMPLATE_KEY"; // Stores the current daily template stored 

function putToStorage(key, value) {
    let json = {}; 
    json[key] = value; 
    chrome.storage.sync.set(json, function() {
        log("put key: " + key);
    }); 
}

const RETRIEVAL_ERROR = "RETRIEVAL_ERROR"; 

function getFromStorage(key, callback) {
    chrome.storage.sync.get([key], function(result) {
        log("retrieved key: " + key);
        log(result); 
        if (result == undefined || result[key] == undefined) 
            callback(RETRIEVAL_ERROR); 
        else callback(result[key]); 
    });
}

// ----------------------------------
// Roam functions - title 
// ----------------------------------
const ERROR_TITLE    = "ERROR_TITLE"; 

/**
 * @returns {String} the title of the current Roam page
 * @returns {String} ERROR_TITLE if there is no title 
 */
function getTitle() {
    let titleContainer = document.getElementsByClassName("rm-title-display"); 
    if (titleContainer == null || titleContainer.length == 0) return ERROR_TITLE; 
    else return titleContainer[0].textContent; 
}

/**
 * @param {String} title 
 * @returns {String} the cleaned title, removing a a single instance of "st,", "nd,", "rd,", or "th,"
 * @returns {String} ERROR_TITLE if there is more than one instance of the above
 */
function cleanTitle(title) {
    let count = 0; 
    for (var i = title.length - 3; i >= 0; i--) {
        let c1 = title.charAt(i); 
        let c2 = title.charAt(i + 1); 
        let c3 = title.charAt(i + 2); 

        if (c3 != ',') continue; 
        if ((c1 == 's' && c2 == 't')
            || (c1 == 'n' && c2 == 'd')
            || (c1 == 'r' && c2 == 'd')
            || (c1 == 't' && c2 == 'h')
        ) {
            title = title.substring(0, i) + title.substring(i + 3); 
            count++; 
            if (count > 1) return ERROR_TITLE; 
        }
    }
    return title; 
}

/**
 * @returns {Boolean} whether the title of the page corresponds to the current day 
 */
function isTitleToday() {
    let title = getTitle(); 
    log("isTitleToday with title = " + title); 

    // No title found 
    if (title === ERROR_TITLE) return false; 

    let cleanedTitle = cleanTitle(title); 
    let date = new Date(cleanedTitle);
    log(date.toDateString());

    // Invalid date 
    if (isNaN(date.getTime())) return false; 

    let today = new Date(); 
    log(today.toDateString());
    
    // Month, day, year equality to today 
    return date.getFullYear() == today.getFullYear() 
        && date.getMonth() == today.getMonth() 
        && date.getDay() == today.getDay(); 
}

// ----------------------------------
// Roam functions - bullets 
// ----------------------------------

function isBulletTextEmpty(text) {
    return text === "" || text === "Click here to start writing"; 
}

/**
 * @returns {*} the list of bullets
 */
function getBullets() {
    return document.getElementsByClassName("roam-block"); 
}

/**
 * @param {*} bullet 
 * @returns {String} the text of the Roam bullet
 */
function getUnclickedBulletText(bullet) {
    // Depending on whether we are on daily notes or a normal page, we have different ways to get the raw text
    // We will use the existence of the "roam-log-page" (exclusive to daily notes) to differentiate this case
    let roamLogPage = document.getElementsByClassName("roam-log-page"); 
    log("roamLogPage: "); 
    log(roamLogPage); 

    log("bullet: "); 
    log(bullet); 

    if (roamLogPage.length == 0) {
        // Normal page 
        log("Normal page"); 
        return bullet.childNodes[0].textContent; 
    } else {
        // Daily notes 
        log("Daily notes"); 
        let t = bullet.childNodes[0].textContent; 
        log("t: "); log(t); 
        
        return t; 
    }
}

/**
 * @returns {Boolean} whether the current Roam page has an empty body
 * Note, we define empty as the first bullet not having text 
 */
function isPageBodyEmpty() {
    logMethod("isPageBodyEmpty"); 

    let bullets = getBullets();
    log("bullets: "); log(bullets); 

    // no bullets 
    if (bullets.length == 0) return false; 

    let bullet = bullets[0]; 
    let text = getUnclickedBulletText(bullet); 
    return isBulletTextEmpty(text); 
}

const ERROR_PAGE = "ERROR_PAGE"; 

/**
 * @returns {String} the page in the form of a string that can be pasted 
 */
function getTextFromPage() {
    // I attempted to trigger a Cmd-a (select all) and shift clicking, but neither worked 
    // So this implementation just loops through the divs and manually obtains the information 
    // To get indents, there's some tricky business involved. I use the left bounds of each bullet point 
    // The algorithm to determine indexes uses quite a few shortcuts, so it's not super precise
    
    // This doesn't work 
    // You need to somehow grab the markdown 
    // Which appears... difficult 
    // So as a work around, just select the content to copy before clicking the chrome extension 

    logMethod("getTextFromPage"); 
    let bullets = getBullets(); 
    if (bullets.length == 0) return ERROR_PAGE; 

    let pageText = ""; 

    let indents = []; 
    for (var i = 0; i < bullets.length; i++) {
        let bullet = bullets[i]; 
        let text = getUnclickedBulletText(bullet); 
        let left = bullet.getBoundingClientRect().left; 
        
        let indent; 
        let indentIndex = indents.indexOf(left); 
        if (indentIndex >= 0) {
            indent = indentIndex; 
        } else {
            // Technically left should be greater than any value in indents
            // As it should be a new level of nesting 
            // If it isn't, well, we'll just do nothing 
            if (left < indents[-1]) {
                log("left < Mindents[-1]. This shouldn't happen"); 
            } else {
                indents.push(left); 
            }
            indent = indents.length - 1; 
        }

        while (indent-- > 0) pageText += "\t"; 
        pageText += "- "; 
        pageText += text; 
        if (i != bullets.length - 1) pageText += "\n"; 

        log(bullet); 
        log(pageText); 
    }

    return pageText; 
}

/**
 * @returns {Boolean} whether or not the save was successful 
 */
function savePageToStorage() {
    // let pageText = getTextFromPage(); // Doesn't work 
    let pageText = loadFromSelected(); 
    if (pageText === ERROR_PAGE) {
        return false; 
    } else {
        log("saving pageText: "); 
        log(pageText); 
        putToStorage(DAILY_TEMPLATE_KEY, pageText); 
        return true; 
    }
}

// ----------------------------------
// Actual logic
// ----------------------------------
/**
 * @returns {Boolean} whether the current Roam page is loaded
 */
function isLoaded() {
    let title = getTitle(); 
    return title !== ERROR_TITLE; 
}

const MAX_WAIT_TIME  = 10;  // seconds
const RETRY_INTERVAL = 250; // milliseconds

function attemptReplaceDailyTemplate(numRetries) {
    log("attemptReplaceDailyTemplate with numRetries = " + numRetries); 

    if (isLoaded()) {
        replaceDailyTemplate(); 
    } else {
        if (numRetries < MAX_WAIT_TIME * 1000 / RETRY_INTERVAL) {
            // Retry 
            setTimeout(function() {
                attemptReplaceDailyTemplate(numRetries + 1); 
            }, RETRY_INTERVAL);
        }
    }
}

function replaceDailyTemplate() {
    log("replaceDailyTemplate");

    // We only replace on today's daily notes
    if (!isTitleToday()) {
        log("Note not today, not replacing"); 
        return; 
    }

    // We require the page to be empty 
    if (!isPageBodyEmpty()) {
        log("Note not empty, not replacing");
        return; 
    }

    getFromStorage(DAILY_TEMPLATE_KEY, function(page) {
        if (page === RETRIEVAL_ERROR) {
            log("Saved not found, not replacing");
        } else {
            log("replacingDailyTemplate with page: " + page); 

            let bullet = getBullets()[0]; 
            pasteIntoElement(bullet, page); 
        }
    });
};

// ----------------------------------
// Actual running 
// ----------------------------------
attemptReplaceDailyTemplate(0); 

// Listen to URL updates from background script 
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.message === "clicked") {
        // The icon was clicked (received by background)
        // We will try to save the current page to the background 
        if (isLoaded() && savePageToStorage()) {
            alert("Saved " + getTitle() + " successfully"); 
        }; 
    } else if (request.message === "changed") {
        attemptReplaceDailyTemplate(0); 
    }
});