(() => {
    console.log("content script loaded");
    var currentURL = window.location.href;
    var urlObject = new URL(currentURL);

    var domainName = urlObject.hostname;
    var path = urlObject.pathname;

    console.log("Domain Name:", domainName);
    console.log("Path:", path);
    
    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        console.log("CS --> Message received:", obj, sender, response);
        console.log(obj);
        switch (obj.action) {  
            // Scrape text --> change name to scrapeText
            case 'gatherData':
                let texts = null;
                let extractedType = null;
                if (obj.usingXpath !== null && obj.usingXpath.length > 0) {
                    console.log("USING XPATHS")
                    extractedType = "extracted";
                    texts = scrapeWithXPATHs(obj.usingXpath)[0];
                    console.log(texts);
                } 
                // NEED TO ADD CHATGPT IMPLEMENTATION
                // BS implementation
                else {
                    extractedType = "html";
                    // Naive implementation
                    // texts = JSON.stringify({text: document.body.outerHTML});

                    // Better implementation - NOT REALLY BUT SCRAPING DONE AT BS
                    texts = JSON.stringify({text: document.documentElement.outerHTML});

                    // for chatgpt  --> use deep text
                    // var allVisibleText = Array.from(document.body.querySelectorAll('*'))
                    //     .filter(el => el.offsetWidth > 0 || el.offsetHeight > 0)
                    //     .map(el => el.textContent.trim())
                    //     .filter(text => text !== '')
                    //     .join(' ');
                    // texts = JSON.stringify({text: allVisibleText});
                }
                chrome.runtime.sendMessage({ action: 'summarise', data : texts, customisation : obj['customisation'], extractedType: extractedType }, function(response) {
                    console.log(response);
                });
                break;
            case 'urlMatcher':
                console.log(obj.data);
                var [path, domain] = determineUrl(obj.data);
                console.log("urlMatcher: ", path, domain);
                chrome.runtime.sendMessage({ action: 'determinedUrl', path: path, domain: domain  });
                break;
            case 'getSelectedText':
                var st = window.getSelection().toString();
                console.log("Selected txt: ", st);
                chrome.runtime.sendMessage({ action: 'retrieveSelectedText', data : st });
                break;
            // case 'summariseResponse':
            //     // console.log("CS --> Summarised Data: ", obj.data.data);
            //     console.log("CS --> Summarised Data: ", obj.data);
            //     var newParagraph = document.createElement('p');

            //     // Create a text node
            //     var textNode = document.createTextNode('Summarised Text: ' + obj.data.data);

            //     // Append the text node to the paragraph element
            //     newParagraph.appendChild(textNode);

            //     // Append the paragraph element to the body of the document
            //     document.body.appendChild(newParagraph);
            //     break;
        }
     });
})();

function determineUrl(obj) {
    var keys = Object.keys(obj);
    var currentUrl = new URL(window.location.href);
    var currentHost = currentUrl.hostname;
    var currentPath = currentUrl.pathname;

    // Check if we are in a saved domain (host)
    if (!keys.includes(currentHost)) {
        console.log("We are NOT in a saved config domain");
        // null, null
        return [null, null];
    } 

    // Get all the paths for that domain
    var paths = Object.keys(obj[currentHost]); 
    var closestMatch = findClosestMatch(currentPath, paths);
    console.log("Closest Path: ", closestMatch);

    return [closestMatch, currentHost];
}

function findClosestMatch(currentPath, pathList) {
    let closestMatch = null;
    let maxMatchLength = 0;

    for (const path of pathList) {
        const commonPrefix = currentPath.startsWith(path) ? path : '';

        if (commonPrefix.length > maxMatchLength) {
            maxMatchLength = commonPrefix.length;
            closestMatch = path;
        }
    }

    return closestMatch;
}

// WRONG IMPLEMNTATION
function gatherData() {
    console.log("Gathering Data");
    // var xpathExpression = '//*[@id="mw-content-text"]/div[1]/p';
    var xpathExpression = '/html/body/div/div'
    var result = document.evaluate(xpathExpression, document, null, XPathResult.ANY_TYPE, null);
    while (node = result.iterateNext()) {
        console.log(node);
        console.log(getAllTextFromNode(node));
    }
}

function scrapeWithXPATHs(xpaths) {
    var allTexts = [];
    for (var i=0; i<xpaths.length; i++) {
        allTexts.push(getTextWithXpath(xpaths[i]));
    }
    return allTexts;
}

function getTextWithXpath(xpath) {
    console.log(xpath);
    // var texts = "";
    var texts = [];
    // Grab all matching text nodes
    // XPathResult.ANY_TYPE
    var result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

    for (var i=0; i< result.snapshotLength; i++) {
        var tNode = result.snapshotItem(i);
        // var tContent = tNode.textContent || tNode.innerText;
        var tContent = tNode.textContent;
        texts.push(tContent);
        // texts += tContent + "\n\n";
        // texts.push(getAllTextFromNode(tNode));
    }

    
    console.log(texts);
    return JSON.stringify({text : texts});
}

// function scrapeWithXPATHs(xpaths) {
//     var allTexts = [];
//     for (var i=0; i<xpaths.length; i++) {
//         allTexts.push(getTextWithXpath(xpaths[i]));
//     }
//     return allTexts;
// }

// function getTextWithXpath(xpath) {

//     // var xpath = '/html/body/div/div'
//     // var texts = [];
//     var texts = "";

//     // Grab all matching text nodes
//     // XPathResult.ANY_TYPE
//     var result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

//     // while (node = result.iterateNext()) {
//     //     // console.log(node);
//     //     nodeText = getAllTextFromNode(node);
//     //     texts.push(nodeText);
//     //     // console.log(texts);
//     // }

//     for (var i=0; i< result.snapshotLength; i++) {
//         var tNode = result.snapshotItem(i);
//         var tContent = tNode.textContent || tNode.innerText;
//         texts += tContent + "\n\n";
//     }

    
//     console.log(texts);
//     JSON.stringify(console.log({text : texts}));
//     return JSON.stringify({text : texts});

//     // textJson = JSON.stringify(texts);
//     // console.log(textJson);
//     // JSON.stringify(console.log({text : textJson}));
//     // return JSON.stringify({text : textJson});
// }

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
  
    // node has text content?
    if (node.nodeType === 3) {
    //   text += node.nodeValue.trim();
        text += node.nodeValue.trim() + " ";
    } else if (node.nodeType === 1) {
      // Element node (e.g., div, span, etc.)
      for (var i = 0; i < node.childNodes.length; i++) {
        // text content from child nodes
        text += getAllTextFromNode(node.childNodes[i]);
      }
    }
  
    return text;
}