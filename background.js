// background.js is basically only responsible for manipulating clipboard for main.js
// This is a workaround since content scripts cannot copy/paste 

// ----------------------------------
// Logging
// ----------------------------------
const LOG = true; 

function log(text) {
    if (LOG) {
        chrome.extension.getBackgroundPage().console.log(text); 
    }
}

// Copies `text` into the clipboard by creating a temp input field
function copy(text) {
    let temp = document.createElement('textarea'); 
    document.body.appendChild(temp); 
    temp.value = text; 

    temp.focus(); 
    temp.select(); 
    document.execCommand('copy'); 

    temp.remove(); 
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    log("background received request with type: " + request.type); 
    if (request.type === "COPY_AND_PASTE") {
        copy(request.text); 
        

        // paste the contents of the clipboard into the active element 
        // this should've been set by content script 

        log("trying to paste"); 
        log(document.activeElement); 

        let pasteResult = document.execCommand('paste'); 
        sendResponse({status: pasteResult}); 
    }
}); 