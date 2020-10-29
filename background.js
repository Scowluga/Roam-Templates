/**
 * @param {*} text 
 * Sends a message to the content script 
 */
function sendMessage(tabId, text) {
    chrome.tabs.sendMessage(tabId, {message: text}, null);
}

// Listen to icon clicks
// To dispatch copying currently selected info
chrome.browserAction.onClicked.addListener(function(tab) {
    // Send a message to the content script to read the current page 
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        sendMessage(tabs[0].id, "clicked"); 
    });
});

// Listen to tab changes
// To detect when to re-run checking the page 
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    let url = changeInfo.url; 
    if (url !== undefined) {
        if (url.indexOf("roamresearch.com") >= 0) {
            sendMessage(tabId, "changed"); 
        }
    }
});