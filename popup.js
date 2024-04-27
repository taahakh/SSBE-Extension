/**
 *  Handles the popup.html page functionality.
 *  This includes the summarisation customisation options, provider selection, contextual messages, and summarise button functionality.
 *  The user can customise the summarisation options, select the provider, and summarise the text.
 *  The summarised text can be saved to a text file.
 */


// ---------------------------------------------------------------------
// Utility functions
// SOME THESE CODE BLOCKS ARE REPEATED IN POPUP.JS AND BACKGROUND.JS DUE TO ASYNC ISSUES OF CHROME MESSAGE DESIGN - https://developer.chrome.com/docs/extensions/develop/concepts/messaging

/**
 * Saves the given object to the local storage using the Chrome storage API.
 *
 * @param {Object} ctx_obj - The object to be saved to the storage.
 */
function saveToStorage(ctx_obj) {
  chrome.storage.local.set(ctx_obj, function() {});
}

/**
 * Checks if an object is empty.
 *
 * @param {Object} obj - The object to check.
 * @returns {boolean} Returns true if the object is empty, otherwise returns false.
 */
function isObjectEmpty(obj) {
  for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
          return false;
      }
  }
  return true;
}


/**
 * Loads user configurations from local storage.
 * @param {string} data - The key to retrieve the user configurations.
 * @returns {Promise<object>} - A promise that resolves with the user configurations.
 */
function loadUserConfigs(data) {
  return new Promise((resolve, reject) => {
      chrome.storage.local.get([data], function(result) {
          if (isObjectEmpty(result)) {
              saveToStorage({[data] : {}});
              resolve(loadUserConfigs(data));
          } else {
              resolve(result[data]);
          }
      });
  })
}


// ---------------------------------------------------------------------
// Create the view for the summarisation customisation options and available configurations set by the user configurations and backend service.

var view = null;            // SummaryCustomisationView instance
var usrConfig = null;       // User configurations
var usrXpaths = null;       // User XPaths

/**
 * Builds the summarisation customisation configurations (JSON model descriptors), retrieved from backend service request.
 * 
 * @param {any} data - The request data from backend service used to build the summary configurations.
 * @returns {Promise<SummaryCustomisationView>} A promise that resolves to a SummaryCustomisationView instance - aysnchronous operation.
 */
function buildSummaryConfigs(data) {

  let stheader = "st-header";                       // Summary Type Header
  let stb1 = "sb-1";                                // Extractive button
  let stb2 = "sb-2";                                // Abstractive button
  let stbcss = "selected-state";                    // Summmary Type CSS selected state
  let ttheader = "tt-header";                       // Text Type Header
  let ttdropdown = "td-dropdown-textdomain";        // Text Type Domain Dropdown
  let modelheader = "model-header";                 // Model Header
  let modeldropdown = "td-dropdown-modelchoice";    // Model Dropdown
  let slheader = "sl-header";                       // Summary Length Header
  let milength = "minlength";                       // Minimum summary length
  let malength = "maxlength";                       // Maximum summary length          
  let sumlength = "summary-length"                  // Summary length value
  let ttpp = "tt-pp";                               // Text Type Popup - contextual information                
  let stpp = "st-pp";                               // Summary Type Popup - contextual information              
  let mcpp = "mc-pp";                               // Model Choice Popup - contextual information                         
  let slpp = "sl-pp";                               // Summary Length Popup - contextual information                      

  let elements = [stheader, stb1, stb2, stbcss, 
                 ttheader, ttdropdown, modelheader, 
                 modeldropdown, slheader, milength, 
                 malength, sumlength, ttpp, stpp, mcpp, slpp];

  return new Promise(resolve => {
    view = new SummaryCustomisationView(data, elements);
    resolve(view);
  })
}

/**
 * Sets the user configuration customisation for a given path and domain - set in the settings page under per site configurations.
 * @param {string} path - The path for which the user configuration is being set.
 * @param {string} domain - The domain for which the user configuration is being set.
 */
function setUserConfigCustomisation(path, domain) { 

  // Load the user configurations
  loadUserConfigs('urllist').then(msg => {
    usrConfig = msg;
    let config = usrConfig[domain][path];
    // Set available xpaths
    if (config['xpaths'].length !== 0 && config['scraping-option'] === "custom-scrape"){
      usrXpaths = config['xpaths'];
    }

    var customisation = config['summary-customisation'];
      // Set the predefined options for the view, updating it with the user configurations
      view.setPredefinedOptions(
        customisation['text-type'],
        customisation['summary-type'],
        customisation['model-selected'],
        customisation['summary-length-chosen']
      );
   })
}


// ---------------------------------------------------------------------
// Provider Selection - ChatGPT/OpenAI or Backend Service options

var providerSelect = document.getElementById("td-dropdown-provider");
var currentProviderCTX = 'bs';

/**
 * Handles the change event of the provider selection, switching between ChatGPT/OpenAI and backend service
 * @function switchProviderSelection
 * @returns {void}
 */
function switchProviderSelection() {

  if (providerSelect.value === "co") {
    updateVisualSPS("none", "flex", "0 0 20%", "0 0 65%", "0 0 10%");
    // Load the CO prompts
    loadCO();
    // Set the contextual message for the CO provider
    switchContextualMessage("co");
  } else {
    updateVisualSPS("flex", "none", "0 0 30%", "0 0 60%", "0 0 10%");
    // Set the contextual message for the BS provider
    switchContextualMessage("bs");
  }

  // Locks / Unlocks the summarise button based on the provider if the there is issues or not
  summariseButtonState(providerSelect.value);
}

/**
 * Updates the visual elements when switching between providers.
 *
 * @param {string} bs - The display style for the bs_customisation element.
 * @param {string} co - The display style for the co_customisation element.
 * @param {string} sum - The flex value for the summarisation element.
 * @param {string} sum_box - The flex value for the summary_box element.
 * @param {string} ps - The flex value for the post_summarisation element.
 */
function updateVisualSPS(bs, co, sum, sum_box, ps) {
  var bs_customisation = document.getElementById("bs-customisation");
  var co_customisation = document.getElementById("co-customisation");
  var summarisation = document.getElementById("summarisation");
  var post_summarisation = document.getElementById("post-summarisation");
  var summary_box = document.getElementById("summary-box");

  bs_customisation.style.display = bs;
  co_customisation.style.display = co;
  summarisation.style.flex = sum;
  summary_box.style.flex = sum_box;
  post_summarisation.style.flex = ps;

}

/**
 * Loads user defined ChatGPT / OpenAI prompts and creates the dropdown of available prompts.
 */
function loadCO() { 
    // Loads locally stored CO prompts
    loadUserConfigs('coprompts').then((data) => {
      var prompts = data['prompts'];
      // Dropdown element
      var promptsList = document.getElementById('td-dropdown-prompt');
      promptsList.innerHTML = "";

      for (const i in prompts) {
        var option = document.createElement("option");
        option.value = prompts[i];
        option.text = prompts[i];

        // Set the default prompt of the dropdown and CO summarisation
        if (data['default'] !== "" && prompts[i] === data['default']) {
          option.selected = true;
          option.text = "Default: " + option.text;
        }

        promptsList.appendChild(option);

      } 
  })

}

providerSelect.addEventListener("change", switchProviderSelection);


// ---------------------------------------------------------------------
// Contextual (CTX) Messasges for users

var contextual = document.getElementById('contextual');       // Contextual message element
var messageOrderPriorityBS = new Array(3);                    // for BS
var messageOrderPriorityCO = new Array(3);                    // for CO

/**
 * Sets and updates the contextual message on a given order.
 *
 * @param {string} message - The message to be set.
 * @param {number} order - The order priority of the message.
 * 
 *  Message order priority
 *  [
 *    0 : Connection
 *    1 : Summarisation status
 *    2 : Additional context
 *  ]
 */
function setContextualMessage(message, order) {
  
  // Selects the correct message array based on the current provider
  var messageOrderPriority = chooseContextualMessage(currentProviderCTX);

  // Check if the order is valid, if not set to 2
  if (order > 2 || order < 0) {
    order = 2;
  }

  // Update the message based on the order
  messageOrderPriority[order] = message;

  // Update the contextual message based on the current provider
  contextual.innerHTML = createContextualMessage(messageOrderPriority);
}

/**
 * Chooses the contextual message based on the current provider.
 * @param {string} currentProvider - The current provider ("bs" or "co").
 * @returns {Array} - An array of contextual messages based on the current provider.
 */
function chooseContextualMessage(currentProvider) {
  var prov = currentProvider === "bs" ? messageOrderPriorityBS : messageOrderPriorityCO;
  return prov;
}

/**
 * Creates the final contextual message by concatenating the elements from the given message list.
 *
 * @param {Array<string>} msgList - The list of messages.
 * @returns {string} The contextual message.
 */
function createContextualMessage(msgList) {
  let text = "";
  for (let i=0; i<3; i++) {
    if (msgList[i] !== undefined && msgList !== "") {
      text += ' ' + msgList[i];
    }
  }
  return text;
}

/**
 * Sets the message for both providers and updates the contextual message.
 * @param {string} message - The message to set for both providers.
 * @param {number} order - The priority order of the message.
 */
function setMessageBothProviders(message, order) { 
  messageOrderPriorityBS[order] = message;
  messageOrderPriorityCO[order] = message;
  contextual.innerHTML = createContextualMessage(chooseContextualMessage(currentProviderCTX));
}

/**
 * Clears the messages for both providers at the specified order and updates the contextual message.
 *
 * @param {number} order - The order of the messages to clear.
 */
function clearMessageBothProviders(order) {
  messageOrderPriorityBS[order] = "";
  messageOrderPriorityCO[order] = "";
  contextual.innerHTML = createContextualMessage(chooseContextualMessage(currentProviderCTX));
}

/**
 * Switches the contextual message provider and updates the contextual message.
 * @param {string} provider - The provider to switch to.
 */
function switchContextualMessage(provider) {
  currentProviderCTX = provider;
  var messageOrderPriority = chooseContextualMessage(provider);
  contextual.innerHTML = createContextualMessage(messageOrderPriority);
}

/**
 * Removes the contextual message.
 */
function removeContextualMessage() {
  contextual.innerHTML = '';
}


// ----------------------------------------------------------------------
// Message Handling between popup.js, contentScript.js and background.js

var userSelectedText = "";      // User selected text if user has used the shortcut to select text 


chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {

  switch (request.action) { 

    // Receiving the summarised data from the backend service / ChatGPT/OpenAI
    case 'summaryResponse':
      // Request failed
      if (request.data === null || request.data === 'error' || request.data === 'failed'){
        setContextualMessage(request.message + ' Reopen the extension to refresh the summariser.', 0);
        setContextualMessage("Summarisation failed!", 1);
        lockSummariseButton();
      } 
      // Request successfull
      else {
        // Update the summary box with the summarised data
        var summarybox = document.getElementById('summary-box');
        summarybox.innerHTML = "";
        var p = document.createElement('p');  
        p.innerHTML = request.data.data;
        summarybox.appendChild(p);
        // Update any contextual message
        setContextualMessage(request.message, 1);
      }
      break;
    // Receiving the backend service model descriptors configurations
    case 'customisationConfigResponse':
      if (request.to === "home") {
        // This message is sent to background.js to get the selected text.
        // This is because the shortcut triggers in background.js, in which background.js sends a message to contentScript.js to get the selected text.
        // It goes back to background.js and then to popup.js.
        chrome.runtime.sendMessage({ action: 'homeGetSelectedText' });
        // Contextual message set from background.js
        setContextualMessage(request.message, 0);

        // If request is successfull
        if (request.data !== null) {
          // Build the summary configurations
          buildSummaryConfigs(request.data);
          // Update the summarisation customisation view with predefined user configurations
          loadUserConfigs('urllist').then((data) => {
            usrConfig = data;
            // popup.js --> contentScript.js (content script finds if the URL matches the user configuration and sends it back to popup.js)
            chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
              chrome.tabs.sendMessage(tabs[0].id, { action: "urlMatcher", data : usrConfig });
            });
          })
          // Ready to summarise
          unlockSummariseButton();
        } else {
          // There was an issue with the request
          lockSummariseButton();
        }
      }
      break;
    // Receiving the determined URL from the content script to set the user configuration customisation
    case 'determinedUrl':
      if (request.path !== null) { setUserConfigCustomisation(request.path, request.domain); }
      break;
    // Receiving contextual messages from the content script and background.js to display to the user.
    case 'contextualMessage':
      setContextualMessage(request.message, request.order);
      break;
    // Saves the user selected text for summarisation, retrieved from the content script, to be used when the summarise button is clicked.
    case 'userSelectedText':
      if (request.data !== "") {
        setMessageBothProviders("Grabbed your selected text!", 2);
        userSelectedText = request.data;
      }
      break;
  }

  sendResponse();
});



// ----------------------------------------------------------------------------------
// Handle summarise button functionality

var summarise_button = document.getElementById("summarise-button");

/**
 * Handles the click event of the Summarise button, sending the required data and configuration to either background.js or contentScript.js (then to background.js) to handle the summarisation.
 * Also updates the contextual message, clears any previous messages, and checks if the summary length is valid.
 * Sends a message to the background script (or content script to scrape the page first before sending to the background script) to handle the summarisation.
 * Required data is sent to background.js and contentscript.js to handle the summarisation (see code steps below).
 * @returns {void}
 */
async function summariseButtonHandler() {

  // Clear contextual message
  setContextualMessage("", 1);
  // Clear contextual message for both providers
  clearMessageBothProviders(2);
  var tempUserSelectedText = userSelectedText;

  // For BS
  if (document.getElementById("td-dropdown-provider").value === "bs") {

    let packageCustomisation = view.packageSummaryCustomisations();

    // Check if the summary length is valid
    if (packageCustomisation['summary-length'] < 0 || packageCustomisation['summary-length'] > 100) {
      setContextualMessage("Sumamry length value is incorrect!", 2);
      return;
    }
    
    // If user selected text, we can summarise straight away as we have the text
    if (userSelectedText !== "") {
      chrome.runtime.sendMessage({ action: 'summarise', data : tempUserSelectedText, customisation : packageCustomisation, extractedType : 'extracted', for : 'bs'});
    } 
    // Want to scrape the page automatically / XPaths found in user customisation configuration
    else {
      // Send message to content script to scrape the page
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, 
          { action: "gatherData", 
            usingXpath: usrXpaths, 
            customisation: packageCustomisation,    // Model and summary length chosen; passed around messages until it reaches background.js to send to backend service for summarisation 
            userSelectedText: tempUserSelectedText, // this will be empty
            for : 'bs' });
      });
    }
  } 
  // For CO
  else {

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
      chrome.tabs.sendMessage(tabs[0].id, { 
        action: "gatherData", 
        usingXpath: usrXpaths,
        userSelectedText: tempUserSelectedText,
        for : 'co',
        prompt : document.getElementById('td-dropdown-prompt').value 
      });
    });
  }

  // Clear the user selected text
  userSelectedText = "";
}

/**
 * Locked / Unlocked status of the summarise button based on the provider
 * Prevent summarisation if not logged in
 */  
var lockedSummarisation = {
  'co' : false,
  'bs' : false
}

/**
 * Locks the summarise button for a specific provider.
 * @param {string} [provider='bs'] - The provider to lock the button for.
 */
function lockSummariseButton(provider='bs') {
  lockedSummarisation[provider] = true;
  summarise_button.disabled = true;
  summarise_button.removeEventListener('click', summariseButtonHandler);
}

/**
 * Unlocks the summarise button for the specified provider.
 * @param {string} [provider='bs'] - The provider for which to unlock the summarise button.
 */
function unlockSummariseButton(provider='bs') {
  lockedSummarisation[provider] = false;
  summarise_button.disabled = false;
  summarise_button.addEventListener('click', summariseButtonHandler);
}

/**
 * Updates the state of the summarise button based on the provider when switched.
 * If the provider is locked, the button will be locked. Otherwise, it will be unlocked.
 *
 * @param {string} provider - The provider name.
 */
function summariseButtonState(provider) {
  if (lockedSummarisation[provider]) {
    lockSummariseButton(provider);
  } else {
    unlockSummariseButton(provider);
  }
}

lockSummariseButton(); // Lock summarise button by default

summarise_button.addEventListener("click", summariseButtonHandler);

// Make a call to get the backend service configurations 
chrome.runtime.sendMessage({ action: 'customisationConfigRequest', to: "home" });

// ---------------------------------------------------------------------
// Settings Button Functionality

/**
 * Opens the settings page in a new tab.
 */
function openSettings() {
  chrome.tabs.create({ url: "chrome-extension://"+chrome.runtime.id+"/settings.html" });
}

document.getElementById("open-settings").addEventListener("click", openSettings);

// ---------------------------------------------------------------------
// -------- Post summarisation functionality --------

/**
 * Saves the summarised text from the summary-box element into a text file.
 */
function saveSummarisedText() {
  var summaries = document.querySelectorAll("#summary-box p");
  let summary_list = [];

  // Get the text from each summary box paragraph and add it to the list
  summaries.forEach(function(summary) {
    summary_list.push(summary.innerHTML + "\n");
  });

  const link = document.createElement("a");

  // Create a text file with the summarised text
  const file = new Blob(summary_list, { type: 'text/plain' });
  link.href = URL.createObjectURL(file);
  link.download = "sample.txt";
  link.click();
  URL.revokeObjectURL(link.href);
}

// Save button functionality attached
document.getElementById("save-summary").addEventListener("click", saveSummarisedText);