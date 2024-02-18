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
    // selectedButton: selectedButton,
    providerSelect: providerSelect,
    modelSelect: modelSelect,
    summarLengthValue: summarLengthValue
  };

  console.log("Popup Storage Context: ", popupStorageContext);
  // saveToStorage({'popupStorageContext' : popupStorageContext});
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

// ---------------------------------------------------------------------
// Provider Selection

var providerSelect = document.getElementById("td-dropdown-provider");
console.log("Provider value: ", providerSelect.value);

providerSelect.addEventListener("change", function() {  
  console.log("Provider Selection Changed: ", providerSelect.value);
  var bs_customisation = document.getElementById("bs-customisation");
  var co_customisation = document.getElementById("co-customisation");
  if (providerSelect.value === "co") {
    bs_customisation.style.display = "none";
    co_customisation.style.display = "inline-block";
  } else {
    co_customisation.style.display = "none";
    bs_customisation.style.display = "inline-block";
  }
});




// ---------------------------------------------------------------------

// SummaryOptionsController

chrome.runtime.sendMessage({ action: 'customisationConfigRequest', to: "home" });

var view = null;

function buildSummaryConfigs(data) {
  // Summary Type button identifiers
  let stb1 = "sb-1";
  let stb2 = "sb-2";
  // Summmary Type CSS selected state
  let stbcss = "selected-state";
  // Text Type Domain Dropdown
  let ttdropdown = "td-dropdown-textdomain";
  // Model Dropdown
  let modeldropdown = "td-dropdown-modelchoice";
  // Summary length
  let milength = "minlength";
  let malength = "maxlength";
  // Summary length value
  let sumlength = "summary-length"

  let elements = [stb1, stb2, stbcss, ttdropdown, modeldropdown, milength, malength, sumlength];

  console.log(data, elements);

  view = new SummaryCustomisationView(data, elements);
  let config = view.controller;
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

// ----------------------------------------------------------------------

// Message Passing

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Popup.js: Message received:', request.action, request);

  switch (request.action) { 

    case 'summaryResponse':
      // console.log("CS --> Summarised Data: ", obj.data.data);
      console.log("CS --> Summarised Data: ", request.data);
      // console.log()
      var summarybox = document.getElementById('summary-box');
      var p = document.createElement('p');  
      p.innerHTML = request.data.data;
      summarybox.appendChild(p);
      break;
    case 'customisationConfigResponse':
      if (request.to === "home") {
        buildSummaryConfigs(request.data);
      }
      break;
    case 'loadPopupCtx':
      console.log("Popup.js - Loading Popup Context");
      setPopupCtx(request.data);
      break;
  }

  sendResponse();
});


// Summarise button
var summarise_button = document.getElementById("summarise-button");
summarise_button.addEventListener("click", async () => {
  console.log("Summarise Button Clicked");
  if (document.getElementById("td-dropdown-provider").value === "bs") {
    let packageCustomisation = view.packageSummaryCustomisations();
    console.log("PACKAGE: ", packageCustomisation);
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "gatherData", usingXpath: false, customisation: packageCustomisation });
    });
  } else {
    console.log("CO Summarise not implemented yet");
  }

  // chrome.runtime.sendMessage({ action: 'summarise', data: "SUMMARY" });
});


// Settings Button

document.getElementById("open-settings").addEventListener("click", function() {
  chrome.tabs.create({ url: "chrome-extension://"+chrome.runtime.id+"/settings.html" });
});

// Post summarisation functionality

// Save summarised text
var save_button = document.getElementById("save-summary");
save_button.addEventListener("click", function() {

  var summaries = document.querySelectorAll("#summary-box p");
  let summary_list = [];
  summaries.forEach(function(summary) {
    summary_list.push(summary.innerHTML + "\n");
  });

  const link = document.createElement("a");

  const file = new Blob(summary_list, { type: 'text/plain' });
  link.href = URL.createObjectURL(file);
  link.download = "sample.txt";
  link.click();
  URL.revokeObjectURL(link.href);

});

// Summary Type Selection - Button

// var selectedButton = "sb-1";
// document.getElementById(selectedButton).classList.add("selected-state");

// document.getElementById("sb-1").addEventListener("click", function() {
//   buttonSelect("sb-1");
// });

// document.getElementById("sb-2").addEventListener("click", function() {
//   buttonSelect("sb-2");
// });

// function switchButtonIdentifier(id) {
//   if (id === "sb-1") { return 'sb-2'; }
//   else { return 'sb-1'; }
// }

// function buttonSelect(id) {
//   let clickedButton = document.getElementById(id);
//   if (id !== selectedButton) {
//     let otherButton = document.getElementById(switchButtonIdentifier(id));
//     otherButton.classList.remove("selected-state");
//     clickedButton.classList.add("selected-state");
//     selectedButton = id;
//   }
// }