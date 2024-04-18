(() => {
    // console.log("content script loaded");
    // var currentURL = window.location.href;
    // var urlObject = new URL(currentURL);

    // var domainName = urlObject.hostname;
    // var path = urlObject.pathname;

    // console.log("Domain Name:", domainName);
    // console.log("Path:", path);
    
    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        // console.log("CS --> Message received:", obj, sender, response);
        // console.log(obj);
        switch (obj.action) {  
            // Scrape text --> change name to scrapeText
            
            case 'gatherData':
                // console.log("obj.userSelectedText: ", obj.userSelectedText);   
                var scrapeContent = {
                    texts: obj.userSelectedText,
                    extractedType: null
                };

                scrapeTextFromWebpage(obj, scrapeContent);

                let texts = scrapeContent["texts"];
                let extractedType = scrapeContent["extractedType"];
                
                // if (obj.userSelectedText === "") {
                //     if (obj.usingXpath !== null && obj.usingXpath.length > 0) {
                //         console.log("USING XPATHS")
                //         extractedType = "extracted";
                //         texts = scrapeWithXPATHs(obj.usingXpath)[0];
                //         console.log(texts);
                //     } 
                //     // NEED TO ADD CHATGPT IMPLEMENTATION
                //     // BS implementation
                //     else {
                //         extractedType = "html";
                //         // Naive implementation
                //         if (obj.for === "co") {
                //             texts = getAllTextFromNode(document.body);
                //         }
    
                //         else {
                //             // Better implementation - NOT REALLY BUT SCRAPING DONE AT BS
                //             texts = JSON.stringify({text: document.documentElement.outerHTML});
                //         }
                //     }
                // }

                if (obj.for === "bs") {
                    chrome.runtime.sendMessage({ action: 'summarise', data : texts, customisation : obj['customisation'], extractedType: extractedType, for: obj.for }, function(response) {
                        console.log(response);
                    });
                }
                else {
                    console.log("obj.data: ", obj.extractedText);
                    if (obj.data !== "") { texts = obj.extractedText; console.log("Texts: ", texts); }
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
                // console.log(obj.data);
                var [path, domain] = determineUrl(obj.data);
                // console.log("urlMatcher: ", path, domain);
                chrome.runtime.sendMessage({ action: 'determinedUrl', path: path, domain: domain  });
                break;
            case 'getSelectedText':
                var st = window.getSelection().toString();
                // console.log("Selected txt: ", st);
                chrome.runtime.sendMessage({ action: 'retrieveSelectedText', data : st });
                break
        }
     });
})();

function scrapeTextFromWebpage(message, scrapeContent) {
    if (message.userSelectedText === "") {
        if (message.usingXpath !== null && message.usingXpath.length > 0) {
            console.log("USING XPATHS")
            scrapeContent["extractedType"] = "extracted";
            scrapeContent["texts"] = scrapeWithXPATHs(message.usingXpath)[0];
            console.log(texts);
        } 
        // NEED TO ADD CHATGPT IMPLEMENTATION
        // BS implementation
        else {
            scrapeContent["extractedType"] = "html";
            // Naive implementation
            if (message.for === "co") {
                scrapeContent["texts"] = getAllTextFromNode(document.body);
            }

            else {
                // Better implementation - NOT REALLY BUT SCRAPING DONE AT BS
                scrapeContent["texts"] = JSON.stringify({text: document.documentElement.outerHTML});
            }
        }
    }
}


/**
 * Splits the given text into chunks based on a maximum character limit per chunk.
 * Each chunk contains one or more sentences from the text.
 *
 * @param {string} text - The text to be split into chunks.
 * @returns {[boolean, string[]]} - A tuple containing a boolean value indicating whether the text was successfully split and an array of chunks.
 */
function splitTextIntoChunks(text) {

    let sentences = splitTextIntoSentences(text);;
    // console.log("Sentences: ", sentences);

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

/**
 * Splits a given text into an array of sentences.
 *
 * @param {string} text - The text to be split into sentences.
 * @returns {string[]} An array of sentences.
 */
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


/**
 * Determines the closest matching path for the current URL based on the provided configuration object.
 * @param {Object} obj - The configuration object containing saved domains and their paths.
 * @returns {Array} - An array containing the closest matching path and the current host.
 */
function determineUrl(obj) {
    var keys = Object.keys(obj);
    var currentUrl = new URL(window.location.href);
    var currentHost = currentUrl.hostname;
    var currentPath = currentUrl.pathname;

    // Check if we are in a saved domain (host)
    if (!keys.includes(currentHost)) {
        // console.log("We are NOT in a saved config domain");
        // null, null
        return [null, null];
    } 

    // Get all the paths for that domain
    var paths = Object.keys(obj[currentHost]); 
    var closestMatch = findClosestMatch(currentPath, paths);
    // console.log("Closest Path: ", closestMatch);

    return [closestMatch, currentHost];
}

/**
 * Finds the closest match from a list of paths based on the common prefix with the current path.
 *
 * @param {string} currentPath - The current path to compare against.
 * @param {string[]} pathList - The list of paths to search for the closest match.
 * @returns {string|null} - The closest match from the path list, or null if no match is found.
 */
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


/**
 * Scrapes text from the web page using the provided XPaths.
 * @param {string[]} xpaths - An array of XPaths to extract text from.
 * @returns {string[]} - An array of text extracted from the web page.
 */
function scrapeWithXPATHs(xpaths) {
    var allTexts = [];
    for (var i=0; i<xpaths.length; i++) {
        allTexts.push(getTextWithXpath(xpaths[i]));
    }
    return allTexts;
}

/**
 * Retrieves the text content of HTML elements that match the given XPath expression.
 * @param {string} xpath - The XPath expression to match the desired elements.
 * @returns {string} - A JSON string containing an array of text content from the matched elements.
 */
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

/**
 * Retrieves all text content from a given node and its child nodes.
 * @param {Node} node - The node to retrieve text content from.
 * @returns {string} - The concatenated text content from the node and its child nodes.
 */
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