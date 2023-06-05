chrome.commands.onCommand.addListener((command, tab) => {
    console.log(`Command "${command}" triggered`);
    if (command === 'startSelection'){
        injectContentScripts(tab);
    }
});


const injectContentScripts = (tab) =>{
    chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content-script.js"]
    });
}


// Message handlers
chrome.runtime.onMessage.addListener(
    function (request, sender, sendResponse) {
        // Send Screenshot  
        if (request.capturedData){
            chrome.tabs.captureVisibleTab(null, {},
                function (dataUrl) {
                    sendResponse(dataUrl)
                }
            );
            return true
        }
        if (request.selectedData){
            bse64img = request.selectedData;
            console.log('slected image', request.selectedData);
            // textFromImage(request.selectedData)
            return true
        }
    }
);



chrome.runtime.onInstalled.addListener(function () {
    chrome.contextMenus.create({
        "title": 'Copy text',
        "contexts": ["all"],
        "id": "copyTextPuller"
    });
});


// App Tray click
chrome.action.onClicked.addListener((tab) => {
    injectContentScripts(tab);
});

// context menu click
chrome.contextMenus.onClicked.addListener((info, tab) => {
    injectContentScripts(tab);
})


