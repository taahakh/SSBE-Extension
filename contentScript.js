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
        // console.log(obj);
        switch (obj.action) {  
            // Scrape text --> change name to scrapeText
            
            case 'gatherData':
                console.log("obj.userSelectedText: ", obj.userSelectedText);   
                let texts = obj.userSelectedText;
                let extractedType = null;
                
                if (obj.userSelectedText === "") {
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
    
                        if (obj.for === "co") {
                            texts = getAllTextFromNode(document.body);
                        }
    
                        else {
                            // Better implementation - NOT REALLY BUT SCRAPING DONE AT BS
                            texts = JSON.stringify({text: document.documentElement.outerHTML});
                        }
                    }
                }

                if (obj.for === "bs") {
                    chrome.runtime.sendMessage({ action: 'summarise', data : texts, customisation : obj['customisation'], extractedType: extractedType, for: obj.for }, function(response) {
                        console.log(response);
                    });
                }
                else {
                    var [state, textChunks] = splitTextIntoChunks(texts);
                    console.log("Text Chunks: ", textChunks);
                    if (!state) {
                        console.log("Text too long");
                        chrome.runtime.sendMessage({ action: 'contextualMessage', message: 'Unable to summarise this page with this provider :(', order: 1 });
                        return;
                    }
                    
                    send = JSON.stringify({text: textChunks});

                    chrome.runtime.sendMessage({ action: 'summarise', data : send, for: obj.for, prompt: obj.prompt });
                }

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
                break
        }
     });
})();

function splitTextIntoChunks(text) {

    let sentences = splitTextIntoSentences(text);;
    console.log("Sentences: ", sentences);

    if (!sentences) {return [false, null];}

    let chunks = [];
    let currentChunk = '';

    sentences.forEach(sentence => {
        
        if (chunks.length === 3) {
            return [false, null]
        }

        if ((currentChunk + ' ' + sentence).length * (3/4) <= 3500) {
            currentChunk += ' ' + sentence.trim();
        } else {
            chunks.push(currentChunk.trim());
            currentChunk = sentence.trim();
        }

    });

    // Last chunk
    if (currentChunk !== ''){
        if (chunks.length < 3 && currentChunk.length * (3/4) <= 3500) {
            chunks.push(currentChunk.trim());
        }
        else {
            return [false, null];
        }
    }

    return [true, chunks];
}

function splitTextIntoSentences(text) {
    let sentences = [];
    let currentSentence = '';

    for (let i = 0; i < text.length; i++) {
        let char = text[i];

        if (char === '.' || char === '?' || char === '!') {
            sentences.push((currentSentence+char).trim());
            currentSentence = '';
        } else {
            currentSentence += char;
        }
    }

    if (currentSentence !== '') {
        sentences.push(currentSentence.trim());
    }

    return sentences;
}


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