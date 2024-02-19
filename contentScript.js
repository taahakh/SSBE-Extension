(() => {
    console.log("content script loaded");
    // Get the current URL of the page
    var currentURL = window.location.href;

    // Create a URL object
    var urlObject = new URL(currentURL);

    // Extract the domain name and path
    var domainName = urlObject.hostname;
    var path = urlObject.pathname;

    // Display the extracted parts in the console (optional)
    console.log("Domain Name:", domainName);
    console.log("Path:", path);
    

    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        console.log("CS --> Message received:", obj, sender, response);
        console.log(obj);
        switch (obj.action) {  
            // Scrape text --> change name to scrapeText
            case 'gatherData':
                // let texts = getTextWithXpath();
                let texts = JSON.stringify({text: document.body.outerHTML});
                chrome.runtime.sendMessage({ action: 'summarise', data : texts, customisation : obj['customisation'] }, function(response) {
                    console.log(response);
                });
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

function getTextWithXpath(xpath) {

    var xpath = '/html/body/div/div'
    var texts = [];

    // Grab all matching text nodes
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