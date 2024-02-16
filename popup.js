function saveToStorage(ctx_obj) {
  chrome.storage.local.set(ctx_obj, function() {
    console.log("Storage Item Saved");
  });
}

function savePopupStorageCtx() { 
  // Summary Type Selection : selectedButton
  // Provider Selection
  providerSelect = document.getElementById("td-dropdown-provider").value;
  // Model Selection
  modelSelect = document.getElementById("td-dropdown-textdomain").value;
  // Summary Length
  summarLengthValue = document.getElementById("summary-length").value;
  popupStorageContext = {
    selectedButton: selectedButton,
    providerSelect: providerSelect,
    modelSelect: modelSelect,
    summarLengthValue: summarLengthValue
  };

  console.log("Popup Storage Context: ", popupStorageContext);
  saveToStorage({'popupStorageContext' : popupStorageContext});
}

function setPopupCtx(ctx) { 
  document.getElementById("td-dropdown-provider").in = ctx.providerSelect;
  document.getElementById("td-dropdown-textdomain").innerText = ctx.modelSelect;
  document.getElementById("summary-length").innerText = ctx.summarLengthValue;
  // summary type select - document.getElementById()
  console.log("Setting Popup Storage Context: ", ctx);
}

// loadPersistantStorage("popupStorageContext");

console.log("Popup.js - Loading Popup Context");

function loadPopupStorageCtx() { 
  chrome.storage.local.get(["popupStorageContext"], function(items){
    popupStorageContext = items;
    setPopupCtx(popupStorageContext);
    console.log("Popup Storage Context: ", popupStorageContext);
  });
}

// loadPopupStorageCtx();

// chrome.browserAction.onClicked.addListener(function(tab) {
//   console.log("Popup.js - Browser Action Clicked");
//   chrome.runtime.sendMessage({ action: 'configRequest' });
// });
chrome.runtime.sendMessage({ action: 'configRequest' });
console.log("sadasndjasdajdbajdbasjkdbajdajbdasbdjkas");
// ---------------------------------------------------------------------

// SummaryOptionsController

function buildSummaryConfigs(data) {
  console.log(data);
  let config = new SummaryOptionsController(data);
  return config;
}

//  --------------------------------------------------------------------- 

const getF = document.getElementById('getButton');

getF.addEventListener('click', async () => {
  console.log('GET Request');
  // savePopupStorageCtx();
  // chrome.runtime.sendMessage({ action: 'makeGetRequest' });
  chrome.runtime.sendMessage({ action: 'configRequest' });

});

const postF = document.getElementById('postButton');

postF.addEventListener('click', async () => {
  console.log('Starting POST Request process');
  // let x = new SummariserClass();
  // console.log(x.summarise("Hello World"));
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
      console.log("CS --> Summarised Data: ", request.data);
      
      var summarybox = document.getElementById('summary-box');
      var p = document.createElement('p');  
      p.innerHTML = request.data.data;
      summarybox.appendChild(p);
      break;
    case 'configResponse':
      buildSummaryConfigs(request.data);
      break;
    case 'loadPopupCtx':
      console.log("Popup.js - Loading Popup Context");
      setPopupCtx(request.data);
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