/**
 * Content script that runs in the context of the current webpage.
 * This script is responsible for scraping text from the webpage, splitting the text into chunks, and communicating with the background / popup script.
 * The content script listens for messages from the background script and popup script to perform the required actions.
 */

(() => {

    // Message API Listener, communicates with background.js and popup.js
    chrome.runtime.onMessage.addListener((obj, sender, response) => {

        switch (obj.action) {  

            // Scraping the text from the webpage in part of the summarisation pipeline
            case 'gatherData':
 
                var scrapeContent = {
                    texts: obj.userSelectedText,
                    extractedType: null
                };

                scrapeTextFromWebpage(obj, scrapeContent);

                let texts = scrapeContent["texts"];
                let extractedType = scrapeContent["extractedType"];
                
                // For BS summarisation
                if (obj.for === "bs") {
                    chrome.runtime.sendMessage({ action: 'summarise', data : texts, customisation : obj['customisation'], extractedType: extractedType, for: obj.for });
                }
                // For CO summarisation
                else {
                    var [state, textChunks] = splitTextIntoChunks(texts);

                    // Text too long
                    if (!state) {
                        chrome.runtime.sendMessage({ action: 'contextualMessage', message: 'Unable to summarise this page with this provider :(', order: 1 });
                        return;
                    }
                    
                    send = JSON.stringify({text: textChunks});

                    chrome.runtime.sendMessage({ action: 'summarise', data : send, for: obj.for, prompt: obj.prompt });
                }

                break;
            // Determining the closest matching path for the current URL, to load the saved configuration set by the user - triggered by the popup.js
            case 'urlMatcher':
                var [path, domain] = determineUrl(obj.data);
                chrome.runtime.sendMessage({ action: 'determinedUrl', path: path, domain: domain  });
                break;
            // Get the selected text from the webpage - triggered by the background.js and to be sent to the popup.js
            case 'getSelectedText':
                var st = window.getSelection().toString();
                chrome.runtime.sendMessage({ action: 'retrieveSelectedText', data : st });
                break
        }
     });
})();

/**
 * Scrapes text from a webpage based on the provided message and scrapeContent objects.
 * @param {object} message - The message object containing information about the selected text and scraping options.
 * @param {object} scrapeContent - The scrapeContent object to store the extracted text.
 */
function scrapeTextFromWebpage(message, scrapeContent) {
    // If user has not selected any text
    if (message.userSelectedText === "") {
        // User has provided XPaths in customisation
        if (message.usingXpath !== null && message.usingXpath.length > 0) {
            scrapeContent["extractedType"] = "extracted";
            scrapeContent["texts"] = scrapeWithXPATHs(message.usingXpath)[0];
        } 
        // Scraping implementation
        else {
            scrapeContent["extractedType"] = "html";
            
            // CO Scraping implementation
            if (message.for === "co") {
                scrapeContent["texts"] = getAllTextFromNode(document.body);
            }
            // BS Scraping implementation
            else {
                scrapeContent["texts"] = JSON.stringify({text: document.documentElement.outerHTML});
            }
        }
    }
}


/**
 * Splits the given text into chunks based on a maximum character limit per chunk.
 * Each chunk contains one or more sentences from the text.
 * This implementation is for the CO summarisation.
 * Maximum character limit per chunk is 3500 characters, as the summarisation model has a maximum input length of 4096 tokens.
 * This implementation makes sure that the prompt added to the text does not exceed the maximum input length and guarantees non-rejection by token limit from CO
 *
 * @param {string} text - The text to be split into chunks.
 * @returns {[boolean, string[]]} - A tuple containing a boolean value indicating whether the text was successfully split and an array of chunks.
 */
function splitTextIntoChunks(text) {

    let sentences = splitTextIntoSentences(text);;

    // If no sentences are found, return false
    if (!sentences) {return [false, null];}

    let chunks = [];
    let currentChunk = '';
    
    // Split the text into chunks based on a maximum character limit per chunk
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
 * This implementation is for the CO summarisation.
 * 
 * @param {string} text - The text to be split into sentences.
 * @returns {string[]} An array of sentences.
 */
function splitTextIntoSentences(text) {
    let sentences = [];
    let currentSentence = '';

    for (let i = 0; i < text.length; i++) {
        let char = text[i];

        // Check if the current character is a sentence-ending punctuation mark
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
 * Determines the closest matching path for the current URL based on the provided user configuration object.
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
        return [null, null];
    } 

    // Get all the paths for that domain
    var paths = Object.keys(obj[currentHost]); 
    var closestMatch = findClosestMatch(currentPath, paths);

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
        // Check if the current path starts with the path from the list
        const commonPrefix = currentPath.startsWith(path) ? path : '';

        // Update the closest match if the common prefix is longer than the current max match length
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
    // var texts = "";
    var texts = [];

    // Grab all matching text nodesE
    var result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

    // Get all text content from the matched nodes
    for (var i=0; i< result.snapshotLength; i++) {
        var tNode = result.snapshotItem(i);
        var tContent = tNode.textContent;
        texts.push(tContent);
    }

    
    // console.log(texts);
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
        text += node.nodeValue.trim() + " ";
    } 
    // node has child nodes?
    else if (node.nodeType === 1) {
      // Element node (e.g. div, span, etc.)
      for (var i = 0; i < node.childNodes.length; i++) {
        // text content from child nodes
        text += getAllTextFromNode(node.childNodes[i]);
      }
    }
  
    return text;
}