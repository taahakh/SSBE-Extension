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

var contextual = document.getElementById('contextual');
// Set ctx msg
function setContextualMessage(message) {
  console.log("ist this running - ctx msg")
  contextual.innerHTML = message;
}
// Remove ctx msg
function setContextualMessage() {
  contextual.innerHTML = '';
}

// ---------------------------------------------------------------------

// SummaryOptionsController

chrome.runtime.sendMessage({ action: 'customisationConfigRequest', to: "home" });

var view = null;
var viewPromise = null;
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

  return new Promise(resolve => {
    // view = new SummaryCustomisationView(data, elements);
    // resolve();
    view = new SummaryCustomisationView(data, elements);
    resolve(view);
  })
  
  // let config = view.controller;
  // return config;
}

// ------------------------------------------------------------------

// REPEATED CODE - SETTINGS
function isObjectEmpty(obj) {
  for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
          return false;
      }
  }
  return true;
}

// REPEATED CODE - SETTINGS
// Saved user configs
function loadUserConfigs(data) {
  return new Promise((resolve, reject) => {
      chrome.storage.local.get([data], function(result) {
          if (isObjectEmpty(result)) {
              console.log("its empty");
              saveToStorage({[data] : {}});
              resolve(loadUserConfigs(data));
          } else {
              console.log(result);
              resolve(result[data]);
          }
      });
  })
}


var usrConfig = null;
var usrXpaths = null;

function setUserConfigCustomisation(path, domain) { 
  loadUserConfigs('urllist').then((data) => {
    usrConfig = data;
    console.log("path: ", path);
    console.log("dom: ", domain);
    let config = usrConfig[domain][path];
    if (config['xpaths'].length !== 0){
      usrXpaths = config['xpaths'];
    }

    var customisation = config['summary-customisation'];
    console.log("setUserConfigCustomisation: ", customisation);
    // console.log('USER CONFIG: ', usrConfig);;
    console.log(view);
    // viewPromise.then(() => {
      console.log("COMPLETEDD MAYBE: ", view);
      view.setPredefinedOptions(
        customisation['text-type'],
        customisation['summary-type'],
        customisation['model-selected'],
        customisation['summary-length-chosen']
      );
    // })

  })

}





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
    loadCO();
  } else {
    co_customisation.style.display = "none";
    bs_customisation.style.display = "inline-block";
  }
});


//  --------------------------------------------------------------------- 
// ChatGPT / OpenAI setup

function loadCO() { 
  loadUserConfigs('coprompts').then((data) => {
    console.log("CO PROMPTS - : ", data)
    var prompts = data['prompts'];
    var promptsList = document.getElementById('td-dropdown-prompt');

    for (const i in prompts) {
      var option = document.createElement("option");
      option.value = prompts[i];
      option.text = prompts[i];

      if (data['default'] !== "" && prompts[i] === data['default']) {
        option.selected = true;
        option.text = "Default: " + option.text;
      }

      promptsList.appendChild(option);

    } 
})

}




// -----------------------------------------------------------------------
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
        console.log("CTX MESSAGE: ", request.message);
        setContextualMessage(request.message);
        buildSummaryConfigs(request.data);
        loadUserConfigs('urllist').then((data) => {
          usrConfig = data;
          console.log('USER CONFIG: ', usrConfig);
          chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, { action: "urlMatcher", data : usrConfig });
          });
      })
      }
      break;
    case 'loadPopupCtx':
      console.log("Popup.js - Loading Popup Context");
      setPopupCtx(request.data);
      break;
    case 'determinedUrl':
      console.log("Determined URL: ", request.path, request.domain);
      if (request.path !== null) {
        setUserConfigCustomisation(request.path, request.domain);
      }
      break;
  }

  sendResponse();
});


// Prevent summarisation if not logged in

function lockSummariseButton() {  }

function unlockSummariseButton() {  }

// Summarise button
var summarise_button = document.getElementById("summarise-button");
summarise_button.addEventListener("click", async () => {
  console.log("Summarise Button Clicked");
  if (document.getElementById("td-dropdown-provider").value === "bs") {
    let packageCustomisation = view.packageSummaryCustomisations();
    console.log("PACKAGE: ", packageCustomisation);
    console.log("Sending these xpaths: ", usrXpaths);
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "gatherData", usingXpath: usrXpaths, customisation: packageCustomisation });
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