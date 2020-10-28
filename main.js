const MAX_WAIT_TIME  = 10;  // seconds
const RETRY_INTERVAL = 250; // milliseconds

const ERROR_TITLE    = "ERROR_TITLE"; 
const ERROR_BODY     = "ERROR_BODY"; 

const EMPTY = '<div class="flex-v-box roam-block-container block-bullet-view"><div><div class="flex-h-box flex-align-start flex-justify-start"><div class="controls"><span class="block-expand"><span class="bp3-icon-standard bp3-icon-caret-down rm-caret rm-caret-open rm-caret-hidden"></span></span><span class="simple-bullet-outer cursor-pointer" draggable="true"><span class="simple-bullet-inner"></span></span></div><div id="block-input-PUMxei9vTDQWxisJvIloKEqj8JY2-body-outline-w4w53c0p1-8_GVAn3t9" class="roam-block dont-unfocus-block hoverparent rm-block-text" tabindex="0"><span>asdf</span></div><div style="flex: 1 0 0px;"></div></div></div><div class="flex-v-box" style="margin-left: 20px;"></div></div><div class="flex-v-box roam-block-container block-bullet-view"><div><div class="flex-h-box flex-align-start flex-justify-start"><div class="controls"><span class="block-expand"><span class="bp3-icon-standard bp3-icon-caret-down rm-caret rm-caret-open rm-caret-hidden"></span></span><span class="simple-bullet-outer cursor-pointer" draggable="true"><span class="simple-bullet-inner"></span></span></div><div id="block-input-PUMxei9vTDQWxisJvIloKEqj8JY2-body-outline-w4w53c0p1-z-tVzLx08" class="roam-block dont-unfocus-block hoverparent rm-block-text" tabindex="0"><span></span></div><div style="flex: 1 0 0px;"></div></div></div><div class="flex-v-box" style="margin-left: 20px;"></div></div>';

function click(x, y, element) {
    var ev = new MouseEvent('click', {
        'view': window,
        'bubbles': true,
        'cancelable': false,
        'screenX': x,
        'screenY': y
    });
    element.dispatchEvent(ev);
}

function click(x, y){
    var ev = new MouseEvent('click', {
        'view': window,
        'bubbles': true,
        'cancelable': false,
        'screenX': x,
        'screenY': y
    });
    let element = document.elementFromPoint(x,y);
    element.dispatchEvent(ev); 
}

// ----------------------------------
// Logging
// ----------------------------------
const LOG = true; 

function log(text) {
    if (LOG) console.log(text); 
}

// ----------------------------------
// Roam Page - getting information
// ----------------------------------
function getPage() {
    return document.getElementsByClassName("roam-article")[0]; 
}

function getTitle(page) {
    // We don't actually need page to get the title here 
    // We just pass it in to keep consistency with getBody 
    let titleContainer = document.getElementsByClassName("rm-title-display"); 
    if (titleContainer == null || titleContainer.length == 0) return ERROR_TITLE; 
    else return titleContainer[0].textContent; 
}


function getBody(page) {
    // For body, there's actually a discrepency between the HTML on a normal page, and daily notes
    // We will use the existence of the "roam-log-page" (exclusive to daily notes) to differentiate this case
    let roamLogPage = document.getElementsByClassName("roam-log-page"); 

    let body; 
    if (roamLogPage.length == 0) {
        // Normal page
        body = page.childNodes[0].childNodes[1]; 
    } else {
        // Daily notes
        body = roamLogPage[0].childNodes[1]; 
    }

    log("body: "); 
    log(body); 

    let roamBlock = body.childNodes[0].childNodes[0].childNodes[0].childNodes[1]; 
    log("roamBlock: "); 
    log(roamBlock);

    let innerBlock = roamBlock.childNodes[0]; 
    log("innerBlock: "); 
    log(innerBlock);

    let what = document.getElementsByClassName("rm-block-text")[0]; 
    log("what: "); 
    log(what); 
    what.click(); 

    let whatinside = what.childNodes[0]; 
    log("whatinside: "); 
    log(whatinside); 

    let regex = /block-input-/g;
    let result, id;  
    while (result = regex.exec(page.innerHTML)) {
        let index = result.index; 
        while (page.innerHTML.charAt(index) != '"') index++; 

        id = page.innerHTML.substring(result.index, index); 

        log("found " + id + " at index: " + result.index); 

    }

    let textArea = document.getElementById(id); 
    log("textArea: "); 
    log(textArea); 
    textArea.click();

    setTimeout(function() {

        chrome.runtime.sendMessage({
            type: "COPY_AND_PASTE", 
            text: "if this works I'm the GOAT"
        }, (response) => {
            log("got response: " + response.status); 

            log("clicking roamBlock"); 
            // roamBlock.click(); 

            // textArea.contentEditable = true; 
            // what.click(); 
            // textArea.focus(); 

            let box = what.getBoundingClientRect(); 
            let x = box.left; 
            let y = box.top; 

            log("top left corner at: (" + x + ", " + y + ")");

            // document.elementFromPoint(x + 50, y + 10).click();
            click(380, 332); 
            click(380, 332, textArea); 
            // document.elementFromPoint(370, 166).click();

            
            document.execCommand('paste'); 
        }); 

    }, 1000);

    

    log("sent message"); 


    return "TODO";
}

// ----------------------------------
// Roam Page - helpers
// ----------------------------------

// Clean a string of a single instance of "st,", "nd,", "rd,", or "th,"
// If there are more than one instance, returns ERROR_TITLE
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

function isTitleToday(title) {
    log("isTitleToday with title = " + title); 

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

function isBodyEmpty(body) {

}

function isLoaded(page) {
    if (page == null) return false;
    let title = getTitle(page); 
    // let body = getBody(page); 
    let body = "doesn't really matter"; 
    return title !== ERROR_TITLE && body !== ERROR_BODY; 
}

// ----------------------------------
// Actual logic
// ----------------------------------
function attemptReplaceDailyTemplate(numRetries) {
    log("attemptReplaceDailyTemplate with numRetries = " + numRetries); 

    let page = getPage(); 
    if (isLoaded(page)) {
        replaceDailyTemplate(page); 
    } else {
        if (numRetries < MAX_WAIT_TIME * 1000 / RETRY_INTERVAL) {
            // Retry 
            setTimeout(function() {
                attemptReplaceDailyTemplate(numRetries + 1); 
            }, RETRY_INTERVAL);
        }
    }
}

function replaceDailyTemplate(page) {
    log("replaceDailyTemplate with page: ");
    log(page); 

    let title = getTitle(page); 
    let body = getBody(page); 

    log("title = " + title + " and body = " + body); 

    let x = isTitleToday(title); 
    if (x) {
        log("today");
    } else {
        log("not today"); 
    }
};


// ----------------------------------
// Actual running 
// ----------------------------------
function activeElement() {
    setTimeout(function() {
        log("active element"); 
        log(document.activeElement);
        activeElement(); 
    }, 1000); 
}

activeElement(); 

// document.addEventListener('click', function (event) {
// 	console.log("clicked:" + "(" + event.screenX + ", " + event.screenY + ")");
// }, false);

attemptReplaceDailyTemplate(0); 




