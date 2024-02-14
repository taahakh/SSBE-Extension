const getF = document.getElementById('getButton');

getF.addEventListener('click', async () => {
  console.log('GET Request');
  chrome.runtime.sendMessage({ action: 'makeGetRequest' });
});

const postF = document.getElementById('postButton');

postF.addEventListener('click', async () => {
  console.log('Starting POST Request process');
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "gatherData", usingXpath: false});
    });
});

// Message Passing

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Popup.js: Message received:', request);

  switch (request.action) { 

    case 'summaryResponse':
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

  sendResponse();
});


// Settings Button

document.getElementById("open-settings").addEventListener("click", function() {
  chrome.tabs.create({ url: "chrome-extension://"+chrome.runtime.id+"/settings.html" });
});

// Summary Type Selection - Button

var selectedButton = null;

document.getElementById("sb-1").addEventListener("click", function() {
  buttonSelect("sb-1");
});

document.getElementById("sb-2").addEventListener("click", function() {
  buttonSelect("sb-2");
});

function switchButtonIdentifier(id) {
  if (id === "sb-1") { return 'sb-2'; }
  else { return 'sb-1'; }
}

function buttonSelect(id) {
  let clickedButton = document.getElementById(id);
  if (id !== selectedButton) {
    let otherButton = document.getElementById(switchButtonIdentifier(id));
    otherButton.classList.remove("selected-state");
    clickedButton.classList.add("selected-state");
    selectedButton = id;
  }
}