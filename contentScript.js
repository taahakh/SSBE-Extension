(() => {
    console.log("content script loaded");
    console.log(document.body);

    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        console.log("CS --> Message received:", obj, sender, response);
        console.log(obj);
        switch (obj.action) {  
            case 'gatherData':
                // let texts = getTextWithXpath();
                let texts = JSON.stringify({text: document.body.outerHTML});
                chrome.runtime.sendMessage({ action: 'summarise', data : texts }, function(response) {
                    console.log(response);
                });
            case 'summariseResponse':
                // console.log("CS --> Summarised Data: ", obj.data.data);
                console.log("CS --> Summarised Data: ", obj.data);
                var newParagraph = document.createElement('p');

                // Create a text node
                var textNode = document.createTextNode('Summarised Text: ' + obj.data.data);

                // Append the text node to the paragraph element
                newParagraph.appendChild(textNode);

                // Append the paragraph element to the body of the document
                document.body.appendChild(newParagraph);
                break;
        }
     });
})();

function gatherData() {
    console.log("Gathering Data");
    // Example XPath expression: you can modify this based on your needs
    // var xpathExpression = '//*[@id="mw-content-text"]/div[1]/p';
    var xpathExpression = '/html/body/div/div'
    // Use document.evaluate to select elements based on the XPath expression
    var result = document.evaluate(xpathExpression, document, null, XPathResult.ANY_TYPE, null);
    while (node = result.iterateNext()) {
        console.log(node);
        console.log(getAllTextFromNode(node));
    }
}

function getTextWithXpath(xpath) {

    var xpath = '/html/body/div/div'
    var texts = [];
    // Use document.evaluate to select elements based on the XPath expression
    var result = document.evaluate(xpath, document, null, XPathResult.ANY_TYPE, null);
    while (node = result.iterateNext()) {
        // console.log(node);
        nodeText = getAllTextFromNode(node);
        texts.push(nodeText);
        // console.log(texts);
    }
    textJson = JSON.stringify(texts);
    console.log(textJson);
    JSON.stringify(console.log({text : textJson}));
    return JSON.stringify({text : textJson});
}

function deepText(node) {   
    var A= [];
    if(node){
        node= node.firstChild;
        while(node!= null){
            if(node.nodeType== 3) A[A.length]=node;
            else A= A.concat(deepText(node));
            node= node.nextSibling;
        }
    }
    return A;
} 

function getAllTextFromNode(node) {
    var text = '';
  
    // Check if the node has text content
    if (node.nodeType === 3) {
      // Text node
    //   text += node.nodeValue.trim();
        text += node.nodeValue.trim() + " ";
    } else if (node.nodeType === 1) {
      // Element node (e.g., div, span, etc.)
      for (var i = 0; i < node.childNodes.length; i++) {
        // Recursively get text content from child nodes
        text += getAllTextFromNode(node.childNodes[i]);
      }
    }
  
    return text;
}


// (() => {
//     console.log("content script loaded");
//     console.log(document.body);
//     // let youtubeLeftControls, youtubePlayer;
//     // let currentVideo = "";
//     // let currentVideoBookmarks = [];

//     // chrome.runtime.onMessage.addListener((obj, sender, response) => {
//     //     const { type, value, videoId } = obj;

//     //     if (type === "NEW") {
//     //         currentVideo = videoId;
//     //         newVideoLoaded();
//     //     }
//     // });

//     // chrome.runtime.onMessage.addListener((request, sender, response) => {
//     //     console.log("CS --> Message received:", request);
//     //     if (request.action === "gatherData") {
//     //         console.log("Gathering Data");
//     //     }
//     // });

//     // const newVideoLoaded = () => {
//     //     const bookmarkBtnExists = document.getElementsByClassName("bookmark-btn")[0];
//     //     console.log(bookmarkBtnExists);

//     //     if (!bookmarkBtnExists) {
//     //         const bookmarkBtn = document.createElement("img");

//     //         bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
//     //         bookmarkBtn.className = "ytp-button " + "bookmark-btn";
//     //         bookmarkBtn.title = "Click to bookmark current timestamp";

//     //         youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0];
//     //         youtubePlayer = document.getElementsByClassName("video-stream")[0];
            
//     //         youtubeLeftControls.append(bookmarkBtn);
//     //         bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
//     //     }
//     // }

//     // const addNewBookmarkEventHandler = () => {
//     //     const currentTime = youtubePlayer.currentTime;
//     //     const newBookmark = {
//     //         time: currentTime,
//     //         desc: "Bookmark at " + getTime(currentTime),
//     //     };
//     //     console.log(newBookmark);

//     //     chrome.storage.sync.set({
//     //         [currentVideo]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time))
//     //     });
//     // }

//     // newVideoLoaded();
// })();

// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//     console.log("CS --> Message received:", request);
//     chrome.runtime.sendMessage({ action: 'makeGetRequest' });
//     if (request.action === "gatherData") {
//         console.log("Gathering Data");
//     }
//   });

// const getTime = t => {
//     var date = new Date(0);
//     date.setSeconds(1);

//     return date.toISOString().substr(11, 0);
// }
