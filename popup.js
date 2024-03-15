function saveToStorage(ctx_obj) {
  chrome.storage.local.set(ctx_obj, function() {
    console.log("Storage Item Saved");
  });
}

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


// ---------------------------------------------------------------------



// ---------------------------------------------------------------------

// SummaryOptionsController

var view = null;
var viewPromise = null;
function buildSummaryConfigs(data) {

  let stheader = "st-header"; //
  let stb1 = "sb-1";
  let stb2 = "sb-2";
  // Summmary Type CSS selected state
  let stbcss = "selected-state";
  let ttheader = "tt-header"; //
  // Text Type Domain Dropdown
  let ttdropdown = "td-dropdown-textdomain";
  let modelheader = "model-header"; //
  // Model Dropdown
  let modeldropdown = "td-dropdown-modelchoice";
  let slheader = "sl-header"; //
  // Summary length
  let milength = "minlength";
  let malength = "maxlength";
  // Summary length value
  let sumlength = "summary-length"
  // Respective ctx popups
  let ttpp = "tt-pp";
  let stpp = "st-pp";
  let mcpp = "mc-pp";
  let slpp = "sl-pp";

  let elements = [stheader, stb1, stb2, stbcss, 
                 ttheader, ttdropdown, modelheader, 
                 modeldropdown, slheader, milength, 
                 malength, sumlength, ttpp, stpp, mcpp, slpp];

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


var usrConfig = null;
var usrXpaths = null;

function setUserConfigCustomisation(path, domain) { 
  // console.log("SUCC");
  // const msg = chrome.runtime.sendMessage({ action : 'loadUserConfigs', config : 'urllist' });
  // msg.then(msg => {
  //   console.log("Inside of message: ", msg);
  //   usrConfig = msg['response'];
  loadUserConfigs('urllist').then(msg => {
    console.log("Inside of message: ", msg);
    usrConfig = msg;
    console.log("path: ", path);
    console.log("dom: ", domain);
    let config = usrConfig[domain][path];
    if (config['xpaths'].length !== 0 && config['scraping-option'] === "custom-scrape"){
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
   })
}


// ---------------------------------------------------------------------
// Provider Selection

var providerSelect = document.getElementById("td-dropdown-provider");
var currentProviderCTX = 'bs';
// console.log("Provider value: ", providerSelect.value);

providerSelect.addEventListener("change", function() {  
  console.log("Provider Selection Changed: ", providerSelect.value);
  var bs_customisation = document.getElementById("bs-customisation");
  var co_customisation = document.getElementById("co-customisation");
  var summarisation = document.getElementById("summarisation");
  var post_summarisation = document.getElementById("post-summarisation");
  var summary_box = document.getElementById("summary-box");

  if (providerSelect.value === "co") {
    bs_customisation.style.display = "none";
    co_customisation.style.display = "flex";
    summarisation.style.flex = "0 0 20%";
    summary_box.style.flex = "0 0 65%";
    post_summarisation.style.flex = "0 0 10%";
    loadCO();
    switchContextualMessage("co");
  } else {
    co_customisation.style.display = "none";
    bs_customisation.style.display = "flex";
    summarisation.style.flex = "0 0 30%";
    summary_box.style.flex = "0 0 60%";
    post_summarisation.style.flex = "0 0 10%";
    switchContextualMessage("bs");
  }
  summariseButtonState(providerSelect.value);
});

// CTX Messasges for users

var contextual = document.getElementById('contextual');

// Set ctx msg
// Message order priority
// [
//  0 : Connection
//  1 : Summarisation status
//  2 : Additional context
// ]
// for BS
var messageOrderPriorityBS = new Array(3);
// for CO
var messageOrderPriorityCO = new Array(3);
function setContextualMessage(message, order) {
  
  var messageOrderPriority = chooseContextualMessage(currentProviderCTX);

  console.log("ist this running - ctx msg")
  if (order > 2 || order < 0) {
    order = 2;
  }

  messageOrderPriority[order] = message;

  contextual.innerHTML = createContextualMessage(messageOrderPriority);
}

function chooseContextualMessage(currentProvider) {
  return currentProvider === "bs" ? messageOrderPriorityBS : messageOrderPriorityCO;
}

function createContextualMessage(msgList) {
  let text = "";
  for (let i=0; i<3; i++) {
    if (msgList[i] !== undefined && msgList !== "") {
      text += ' ' + msgList[i];
    }
  }
  return text;
}

function switchContextualMessage(provider) {
  var messageOrderPriority = chooseContextualMessage(provider);
  contextual.innerHTML = createContextualMessage(messageOrderPriority);
}

// Remove ctx msg
function removeContextualMessage() {
  contextual.innerHTML = '';
}


//  --------------------------------------------------------------------- 
// ChatGPT / OpenAI setup

function loadCO() { 
  // const msg = chrome.runtime.sendMessage({ action : 'loadUserConfigs', config : 'coprompts' });
  // msg.then(msg => {
    loadUserConfigs('coprompts').then((data) => {
      // console.log("CO PROMPTS - : ", msg['response'])
      // var data = msg['response'];
      var prompts = data['prompts'];
      var promptsList = document.getElementById('td-dropdown-prompt');
      promptsList.innerHTML = "";

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
    // })
  })

}




// -----------------------------------------------------------------------
// const getF = document.getElementById('getButton');

// getF.addEventListener('click', async () => {
//   console.log('GET Request');
//   // savePopupStorageCtx();
//   // chrome.runtime.sendMessage({ action: 'makeGetRequest' });
//   chrome.runtime.sendMessage({ action: 'configRequest' });

// });

// const postF = document.getElementById('postButton');

// postF.addEventListener('click', async () => {
//   console.log('Starting POST Request process');
//   // let x = new SummariserClass();
//   // console.log(x.summarise("Hello World"));
//     chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
//         chrome.tabs.sendMessage(tabs[0].id, { action: "gatherData", usingXpath: false});
//     });
// });

// ----------------------------------------------------------------------

var userSelectedText = "";

//
// Message Passing

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('Popup.js: Message received:', request.action, request);

  switch (request.action) { 

    case 'summaryResponse':
      // console.log("CS --> Summarised Data: ", obj.data.data);
      console.log("CS --> Summarised Data: ", request.data);
      // console.log()
      if (request.data === null || request.data === 'error' || request.data === 'failed'){
        setContextualMessage(request.message + ' Please open and close the extension to refresh the summariser', 0);
        lockSummariseButton();
      } else {
        var summarybox = document.getElementById('summary-box');
        var p = document.createElement('p');  
        p.innerHTML = request.data.data;
        summarybox.appendChild(p);
        setContextualMessage(request.message, 1);
      }
      
      break;
    case 'customisationConfigResponse':
      if (request.to === "home") {
        console.log("CTX MESSAGE: ", request.message);
        chrome.runtime.sendMessage({ action: 'homeGetSelectedText' });
        setContextualMessage(request.message, 0);
        if (request.data !== null) {
          buildSummaryConfigs(request.data);
          loadUserConfigs('urllist').then((data) => {
            usrConfig = data;
            console.log('USER CONFIG: ', usrConfig);
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
              chrome.tabs.sendMessage(tabs[0].id, { action: "urlMatcher", data : usrConfig });
            });
          })
          unlockSummariseButton();
        } else {
          lockSummariseButton();
        }
      }
      break;
    case 'determinedUrl':
      console.log("Determined URL: ", request.path, request.domain);
      if (request.path !== null) {
        setUserConfigCustomisation(request.path, request.domain);
      }
      break;
    case 'contextualMessage':
      setContextualMessage(request.message, request.order);
      break;
    case 'userSelectedText':
      console.log('User selected text : ', request.data);
      if (request.data !== "") {
        setContextualMessage("Grabbed your selected text!", 2);
        userSelectedText = request.data;
        console.log("saved user selected text [will disappear when clicked away]: ", userSelectedText);
      }
      break;
  }

  sendResponse();
});



// ----------------------------------------------------------------------------------
// Summarise button
var summarise_button = document.getElementById("summarise-button");
// summarise_button.addEventListener("click", async () => {
//   console.log("Summarise Button Clicked");
//   if (document.getElementById("td-dropdown-provider").value === "bs") {
//     let packageCustomisation = view.packageSummaryCustomisations();
//     console.log("PACKAGE: ", packageCustomisation);
//     console.log("Sending these xpaths: ", usrXpaths);
//     if (userSelectedText !== "") {
//       console.log('Summarising user selected text');
//       chrome.runtime.sendMessage({ action: 'summarise', data : userSelectedText, customisation : packageCustomisation }, function(response) {
//         console.log(response);
//     });
//     } else {
//       console.log('Scraping');
//     chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
//       chrome.tabs.sendMessage(tabs[0].id, { action: "gatherData", usingXpath: usrXpaths, customisation: packageCustomisation });
//     });
//     }
//   } else {
//     console.log("CO Summarise not implemented yet");
//   }

//   // chrome.runtime.sendMessage({ action: 'summarise', data: "SUMMARY" });
// });

summarise_button.addEventListener("click", summariseButtonHandler);

async function summariseButtonHandler() {
  console.log("Summarise Button Clicked");
  setContextualMessage("", 1);
  setContextualMessage("", 2);
  if (document.getElementById("td-dropdown-provider").value === "bs") {
    let packageCustomisation = view.packageSummaryCustomisations();
    if (packageCustomisation['summary-length'] < 0 || packageCustomisation['summary-length'] > 100) {
      setContextualMessage("Sumamry length value is incorrect!", 2);
      return;
    }
    console.log("PACKAGE: ", packageCustomisation);
    console.log("Sending these xpaths: ", usrXpaths);
    if (userSelectedText !== "") {
      console.log('Summarising user selected text');
      chrome.runtime.sendMessage({ action: 'summarise', data : userSelectedText, customisation : packageCustomisation, extractedType : 'extracted' }, function(response) {
        console.log(response);
    });
    } else {
      console.log('Scraping');
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { action: "gatherData", usingXpath: usrXpaths, customisation: packageCustomisation });
    });
    }
  } else {
    console.log("CO Summarise not implemented yet");
  }
}

// Prevent summarisation if not logged in
var lockedSummarisation = {
  'co' : false,
  'bs' : false
}

function lockSummariseButton(provider='bs') {
  lockedSummarisation[provider] = true;
  summarise_button.disabled = true;
  summarise_button.removeEventListener('click', summariseButtonHandler);
}

function unlockSummariseButton(provider='bs') {
  lockedSummarisation[provider] = false;
  summarise_button.disabled = false;
  summarise_button.addEventListener('click', summariseButtonHandler);
}

function summariseButtonState(provider) {
  if (lockedSummarisation[provider]) {
    lockSummariseButton(provider);
  } else {
    unlockSummariseButton(provider);
  }
}

lockSummariseButton();
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
chrome.runtime.sendMessage({ action: 'customisationConfigRequest', to: "home" });
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++ 

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