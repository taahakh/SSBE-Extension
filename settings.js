/**
 * settings.js
 * Handles the providers, shortcuts, and customisation features for the extension.
 * 
 */


// -----------------------------------------------------------------------------------------
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
 * Loads the user scraping customisation from local storage.
 * @returns {Promise<void>} A promise that resolves when the scraping customisation is loaded.
 */
function loadScrapingCustomisation() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['bsc'], function(result) {
            if (isObjectEmpty(result)) {
                saveToStorage({'bsc' : {}});
                loadScrapingCustomisation();
                resolve();
            } else {
                currentPSCConfigs = result['bsc'];
                resolve();
            }
        });
    })
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
 * Removes the specified item from the local storage.
 * 
 * @param {string|string[]} ctx - The key(s) of the item(s) to be removed.
 * @param {function} callback - The callback function to be executed after the item(s) are removed.
 */
function removeFromStorage(ctx) {
    chrome.storage.local.remove(ctx, function() {});
}


// -----------------------------------------------------------------------------------------
// BS Service Connections Elements, Listeners and Functions

var bsPConnectionLoginButton = document.getElementById('bs-provider-connection-login-button');
var bsPConnectionSignupButton = document.getElementById('bs-provider-connection-signup-button');
var bsPConnectionHostInput = document.getElementById('bs-provider-connection-host-input');
var bsPConnectionUsernameInput = document.getElementById('bs-provider-connection-username-input');
var bsPConnectionPasswordInput = document.getElementById('bs-provider-connection-password-input');
var bsPConnectionConnectButton = document.getElementById('bs-provider-connection-connect-button');
var bsPConnectionCtx = document.getElementById('bs-provider-connection-contextual');
var bsPSelectedConnect = null;


/**
 * Sets the authentication type (login / signup) based on the provided type.
 * Switches between login and signup, changing the button styles and text as well.
 * log = login ,  sin = signup
 * @param {string} type - The authentication type to set.
 */
function setAuthenticationType(type) {
    // Login
    if (type === undefined || type === bsPConnectionLoginButton) {
        bsPSelectedConnect = "log";
        bsPConnectionLoginButton.classList.add('green');
        bsPConnectionSignupButton.classList.remove('green');
        bsPConnectionConnectButton.innerText = "Connect";
    }
    // Signup
    else {
        bsPSelectedConnect = "sin";
        bsPConnectionSignupButton.classList.add('green');
        bsPConnectionLoginButton.classList.remove('green');
        bsPConnectionConnectButton.innerText = "Signup";
    } 
    removeBsAuthContext();
}

setAuthenticationType();

// --- BS Service Connection Listeners ---

// Login button event listenter
bsPConnectionLoginButton.addEventListener('click', function(){
    setAuthenticationType(bsPConnectionLoginButton);
})

// Signup button event listener
bsPConnectionSignupButton.addEventListener('click', function(){
    setAuthenticationType(bsPConnectionSignupButton);
})

/**
 * Connect / Signup button event listener.
 * Connects to the BS service using the provided host, username and password.
 * For both login and signup, the host, username and password are required.
 */
bsPConnectionConnectButton.addEventListener('click', function(){
    var host = bsPConnectionHostInput.value;
    if (host === "") {
        host = "http://127.0.0.1:5000"; // Default host
    }
    var usr = bsPConnectionUsernameInput.value;
    var pwd = bsPConnectionPasswordInput.value;

    // Empty fields
    if (usr === "" || pwd === "") {
        setBsAuthContext("Username / Password cannot be empty!");
        return;
    }

    // Authentication object
    var auth = {
        username : usr,
        password : pwd
    }

    // console.log(auth);

    auth = JSON.stringify(auth);

    // console.log(auth);

    // Send message to background script to initiate the login / signup process
    if (bsPSelectedConnect === "log") {
        chrome.runtime.sendMessage({ action: "login", host : host, auth : auth });
    }
    else {
        chrome.runtime.sendMessage({ action: "signup", host : host, auth : auth });
    }
})

// Set BS auth context
function setBsAuthContext(message) { 
    bsPConnectionCtx.innerHTML = message;
}

// Clear BS auth context
function removeBsAuthContext() { 
    bsPConnectionCtx.innerHTML = "";
}

// --- Switch between BS and CO service connections ---

var providerSelector = document.getElementById('provider-selector');            // Provider selector dropdown
var bsProviderBox = document.getElementById('bs-provider-connection-box');      // BS provider container
var coProviderBox = document.getElementById('co-provider-connection-box');      // CO provider container

// Listeners

/**
 * Event listener switches between the BS and CO service connections.
 * If the selected provider is CO, the BS provider box is hidden and the CO provider box is shown.
 */
providerSelector.addEventListener('change', function(){
    var prov = providerSelector.value;
    if (prov === "co") {
        bsProviderBox.style.display = 'none';
        coProviderBox.style.display = 'block';
    } else {
        bsProviderBox.style.display = 'block';
        coProviderBox.style.display = 'none';
    }
    // Clear any context messages
    removeBsAuthContext();
})


// --- CO Service Connection ---

var coProviderKeyInput = document.getElementById('co-provider-key-input');
var coProviderHostInput = document.getElementById('co-provider-host-input');
var coProviderConnectionSaveButton = document.getElementById('co-provider-connection-save-button');

// Listeners

/**
 * Event listener for the CO service connection save button.
 * Saves the CO service connection key and host to the user's configurations locally.
 */
coProviderConnectionSaveButton.addEventListener('click', function(){
    var key = coProviderKeyInput.value;
    var host = coProviderHostInput.value;

    // Empty field
    if (key === "") {
        setBsAuthContext("Key cannot be empty!");
        return;
    }

    // const msg = chrome.runtime.sendMessage({ action : 'loadUserConfigs', config : 'auth' });
    loadUserConfigs('auth').then(data => {
        data['co_api_key'] = key;
        data['co_host'] = host;
        saveToStorage({'auth' : data});
    })

    // Notify the user that the key and host have been saved
    setBsAuthContext("Saved!");
})

/**
 * Populates the CO service connection key and host input fields with the user's saved configurations.
 */
function populateCOServiceConnection() {
    loadUserConfigs('auth').then(data => {
        
        if (data.hasOwnProperty('co_api_key')) {
            coProviderKeyInput.value = data['co_api_key'];
        }

        if (data.hasOwnProperty('co_host')) {
            coProviderHostInput.value = data['co_host'];
        }

    })
}

populateCOServiceConnection();

// ----------------------------------------------------------------------------------------
// ChatGPT / OpenAI customisation

// Elements
var coPromptsSelector = document.getElementById('co-prompts-selector');
var coPromptsEditButton = document.getElementById('co-prompts-edit-button');
var coPromptsDeleteButton = document.getElementById('co-prompts-delete-button');
var coPromptsDefaultButton = document.getElementById('co-prompts-default-button');
var coPromptsAddInput = document.getElementById('co-prompts-add-input');
var coPromptsAddButton = document.getElementById('co-prompts-add-button');
var coPromptsEditEditor = document.getElementById('co-prompts-edit-editor');
var coPromptsEditInput = document.getElementById('co-prompts-edit-input');
var coPromptsEditUpdateButton = document.getElementById('co-prompts-edit-update-button');
var coPromptsContextualHelp = document.getElementById('co-prompts-ctx-help');

/**
 * Checks if the given value is an empty prompt.
 * @param {string} value - The value to check.
 * @returns {boolean} Returns true if the prompt is empty, otherwise false.
 */
function isPromptEmpty(value) {
    if (value.trim() === "") {
        addCoCtxHelp("Prompt cannot be empty!");
        return true;
    }
    return false;
}

/**
 * EDIT PROMPT BUTTON
 * Event listener for the edit prompt button.
 * Tracks the old prompt, displays the edit prompt editor and populates it with the selected prompt to be edited.
 */
var oldPrompt = null;
coPromptsEditButton.addEventListener('click', function(){

    // Don't edit empty prompts
    if (isPromptEmpty(coPromptsSelector.value)) { return; }
    
    oldPrompt = coPromptsSelector.value;
    coPromptsEditInput.value = oldPrompt;
    displayPromptUpdate();
})


/**
 * UPDATE PROMPT BUTTON
 * Event listener for the update prompt button.
 * Updates the selected prompt with the new prompt value.
 */
coPromptsEditUpdateButton.addEventListener('click', function(){
    var newPrompt = coPromptsEditInput.value;

    // Don't update empty prompts
    if (isPromptEmpty(newPrompt)) { return; }

    // Check if the prompt has the {content} tag
    if (!hasContentTag(newPrompt)) {
        // console.log("Doesnt have the {content}");
        // Contextual help
        addCoCtxHelp("You need to add '{context}' to your prompt!");
        return;
    }

    // Finished editing, hide the editor
    hidePromptUpdate();
    
    // Load the user's CO prompts to update it with the new prompt
    loadUserConfigs('coprompts').then((data) => {
        var prompts = data['prompts'];
        // Find the old prompt and replace it with the new prompt
        for (const i in prompts) {
            if (prompts[i] === oldPrompt) {
                prompts[i] = newPrompt;
            }
        }

        // Update the default prompt if it was the old prompt
        if (data.hasOwnProperty('default')) {
            if (data['default'] === oldPrompt) {
                data['default'] = newPrompt;
            }
        }

        // Remove the contextual help
        removeCoCtxHelp();
        // Save the updated prompts
        saveToStorage({'coprompts' : data});
        // Repopulate the prompts list with the updated prompts
        populatePromptsList();
    })
})

/**
 * ADD PROMPT BUTTON
 * Event listener for the add prompt button.
 * Adds a new prompt to the user's CO prompts.
 * The prompt must contain the {content} tag.
 * If the prompt does not contain the {content} tag, a contextual help message is displayed.
 * Prompts list is repopulated with the new prompt.
 */
coPromptsAddButton.addEventListener('click', function(){
    let input = coPromptsAddInput.value;
    
    // Must have content tag
    if (!hasContentTag(input)) {
        // console.log("Doesnt have the {content}");
        // Contextual help
        addCoCtxHelp("You need to add '{context}' to your prompt!");
        return;
    }

    // Clear the input field
    coPromptsAddInput.value = "";

    // Load the user's CO prompts to add the new prompt
    loadUserConfigs('coprompts').then((data) => {
        console.log("CO PROMPTS - PREADDED: ", data)
        if (data.hasOwnProperty('prompts')) {
            data['prompts'].push(input);
        } else {
            data['prompts'] = [input];
        }

        // Remove the contextual help, save the new prompts and repopulate the prompts list
        removeCoCtxHelp();
        saveToStorage({'coprompts' : data});
        populatePromptsList();
    })
})

// Delete Prompt
/**
 * DELETE PROMPT BUTTON
 * Event listener for the delete prompt button.
 * Deletes the selected prompt from the user's CO prompts.
 * Prompts list is repopulated without the deleted prompt.
 */
coPromptsDeleteButton.addEventListener('click', function(){
    var prompt = coPromptsSelector.value;
    
    if (isPromptEmpty(prompt)) { return; }

    // Remove the selected prompt from the user's CO prompts
    coPromptsSelector.querySelector('option[value="' + prompt + '"]').remove();
    loadUserConfigs('coprompts').then((data) => {
        // Filter out the selected prompt
        data['prompts'] = data['prompts'].filter(p => p !== prompt );

        // Update the default prompt if it was the deleted prompt
        if (data.hasOwnProperty('default')) {
            if (data['default'] === prompt) {
                data['default'] = "";
                if (data['prompts'].length > 0) {
                    data['default'] = data['prompts'][0];
                }
            }
        }

        // Save the updated prompts and repopulate the prompts list
        saveToStorage({'coprompts' : data});
        populatePromptsList();
    })
})

// Set default prompt
/**
 * DEFAULT PROMPT BUTTON
 * Event listener for the default prompt button.
 * Sets the selected prompt as the default prompt for the user's CO prompts.
 * The default prompt is displayed as "Default: {prompt}" in the prompts list.
 * Prompts list is repopulated with the updated default prompt.
 */
coPromptsDefaultButton.addEventListener('click', function(){
    var prompt = coPromptsSelector.value;
    
    // Don't default empty prompts
    if (isPromptEmpty(prompt)) { return; }

    // Get the selected prompt and update it as the default prompt
    var def = coPromptsSelector.querySelector('option[value="' + prompt + '"]');
    def.text = "Default: " + def.text;

    // Load the user's CO prompts to update the default prompt, save it and repopulate the prompts list
    loadUserConfigs('coprompts').then((data) => {
        data['default'] = prompt;
        saveToStorage({'coprompts' : data});
        populatePromptsList();
    })
})

// View prompt update
function displayPromptUpdate() {
    coPromptsEditEditor.style.display = "block";
}

// Hide prompt update
function hidePromptUpdate() {
    coPromptsEditEditor.style.display = "none";
}
// Add contextual help to users
function addCoCtxHelp(text) {
    coPromptsContextualHelp.innerHTML = text;
}

// Remove when completed giving help
function removeCoCtxHelp() {
    coPromptsContextualHelp.innerHTML = "";
}

// Check if prompt has {content} inside their prompt
function hasContentTag(prompt) { 
    return prompt.includes("{content}");
}

/**
 * Populates the prompts list based on user saved prompts.
 * @returns {void}
 */
function populatePromptsList() { 
    // Load the user's CO prompts
    loadUserConfigs('coprompts').then((data) => {
        // Default prompt, if no prompts are saved
        const DEFAULT_PROMPT = "Summarise this text: {content} ";

        // If no prompts are saved, set the default prompt as the only prompt and the default prompt
        if (!data.hasOwnProperty('prompts')) {
            data['prompts'] = [DEFAULT_PROMPT];
            data['default'] = DEFAULT_PROMPT;
        }
        
        if (data['prompts'].length === 0 || data['default'] === "") {
            data['prompts'] = [DEFAULT_PROMPT];
            data['default'] = DEFAULT_PROMPT;
        }

        var prompts = data['prompts'];
        
        coPromptsSelector.innerHTML = "";

        // Populate the prompts list with the user's saved prompts
        for (const p in prompts) {
            var option = document.createElement('option');
            option.value = prompts[p];
            option.text = prompts[p];

            coPromptsSelector.appendChild(option);
        }

        // If there is a default prompt, display it as "Default: {prompt}"
        if (data.hasOwnProperty('default')) {
            var def = coPromptsSelector.querySelector('option[value="' + data['default'] + '"]');
            def.selected = true
            def.textContent = "Default: " + def.textContent;
        }

        // Save the updated prompts
        saveToStorage({'coprompts' : data});
    })
}

populatePromptsList();


// ----------------------------------------------------------------------------------
// BS Customisation Configurations

var view = null;
var editview = null;

// Message to background script to request the customisation configurations
chrome.runtime.sendMessage({ action: 'customisationConfigRequest', to: "settings" });

/**
 * Builds the summarisation customisation configurations (JSON model descriptors), retrieved from backend service request.
 * Two views are created - one for the new configurations and one for editing configurations.
 * @param {any} data - The request data from backend service used to build the summary configurations.
 * @returns {Promise<SummaryCustomisationView>} A promise that resolves to a SummaryCustomisationView instance - aysnchronous operation.
 */
function buildSummaryConfigs(data) {

    // For the new configurations
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

    // Deep copy the data for the editing configurations
    let copiedJson = JSON.parse(JSON.stringify(data));

    view = new SummaryCustomisationView(data, elements);

    // For the editing configurations
    let editstheader = "edit-st-header";
    let editstb1 = "edit-sb-1";
    let editstb2 = "edit-sb-2";
    let editstbcss = "selected-state";
    let editttheader = "edit-tt-header"; 
    let editttdropdown = "edit-td-dropdown-textdomain";
    let editmodelheader = "edit-model-header";
    let editmodeldropdown = "edit-td-dropdown-modelchoice";
    let editslheader = "edit-sl-header"; 
    let editmilength = "edit-minlength";
    let editmalength = "edit-maxlength";
    let editsumlength = "edit-summary-length"
    let editttpp = "edit-tt-pp";
    let editstpp = "edit-st-pp";
    let editmcpp = "edit-mc-pp";
    let editslpp = "edit-sl-pp";

    let editelements = [editstheader, editstb1, editstb2, editstbcss, editttheader, 
                        editttdropdown, editmodelheader, editmodeldropdown, editslheader,
                        editmilength, editmalength, editsumlength,
                        editttpp, editstpp, editmcpp, editslpp];


    editview = new SummaryCustomisationView(copiedJson, editelements);
    let config = view.controller;
    return config;
}

// ---------------------------------------------------------------------------------
// BS Customisation

// Load the currently saved configs;
var currentPSCConfigs = null; // Hold Per site customisation configurations 
loadScrapingCustomisation();  // Load Per site customisation configurations

// Add new configuration
var bsAddConfigURL = document.getElementById("bs-add-config-URL");
var oldURL = null;
var selectedScrapeOption = "auto-scrape";
var bsAddConfigAutoScrape = document.getElementById("auto-scrape");
var bsAddConfigCustomScrape = document.getElementById("custom-scrape");
var bsAddConfigXPATH = document.getElementById("add-xpath");
var bsAddConfigXPATHAdd = document.getElementById("add-xpath-button");
var bsAddConfigXPATHInput = document.getElementById("add-xpath-input0");
var bsAddConfigSave = document.getElementById("bs-add-config-save");
var bsAddConfigSaveContextual = document.getElementById("bs-add-config-save-contextual");

bsAddConfigAutoScrape.classList.add("green"); // Default selected auto-scrape option with green background

// Edit configuration
var editChosen = null;
var editOldURL = null;
var editSelectedScrapeOption = null;
var bsEditConfigURL = document.getElementById("edit-bs-add-config-URL");
var bsEditConfigContainer = document.getElementById("bs-psc-editsite-update");
var bsEditConfigSelector = document.getElementById("bs-edit-config-selector");
var bsEditConfigEditButton = document.getElementById("edit-site-button");
var bsEditConfigAutoScrape = document.getElementById("edit-auto-scrape");
var bsEditConfigCustomScrape = document.getElementById("edit-custom-scrape");
var bsEditConfigXPATH = document.getElementById("edit-add-xpath");
var bsEditConfigXPATHAdd = document.getElementById("edit-add-xpath-button");
var bsEditConfigXPATHInput = document.getElementById("edit-add-xpath-input0");
var bsEditConfigDelButton = document.getElementById("edit-del-site-button");
var bsEditConfigContextual = document.getElementById("edit-bs-add-config-contextual");
var bsEditConfigSave = document.getElementById("edit-bs-add-config-save");
var bsEditConfigSaveContextual = document.getElementById("edit-bs-add-config-save-contextual");

/**
 * Checks if the edit url value is an empty string after trimming.
 * @param {string} value - The value to be checked.
 * @returns {boolean} Returns true if the value is empty after trimming, otherwise returns false.
 */
function isEditUrlEmpty(value) {
    if (value.trim() === "") {
        bsEditConfigContextual.innerHTML = "URL cannot be empty!";
        return true;
    }
    return false;
}

// Clear the contextual help
function clearBsEditContextual() {
    bsEditConfigContextual.innerHTML = "";
}

/**
 * Loads the per site customisation configurations and populates the edit configuration selector with the URLs to select to edit.
 * @returns {Promise<void>} A promise that resolves when the scraping customisation is loaded and options are added.
 */
function populateBSEditConfig() {
    loadScrapingCustomisation().then(() => {

        // Populate the dropdown with the URLs to edit
        for (const url in currentPSCConfigs) {
            let urlItem = document.createElement('option');
            urlItem.value = url;
            urlItem.innerText = url;
            bsEditConfigSelector.appendChild(urlItem);
        }

    }).catch((error) => { 
        console.log(error);
    })
}

/**
 * Sets the edit scraping options (auto scrape / xpaths) based on the provided user configuration.
 * @param {string} config - The current option for the edit scraping options.
 */
function setEditScrapingOptions(config) {
    editSelectedScrapeOption = config;

    switch (editSelectedScrapeOption) { 
        case 'auto-scrape':
            bsEditConfigAutoScrape.classList.add("green");
            bsEditConfigCustomScrape.classList.remove("green");
            break;
        case "custom-scrape":
            bsEditConfigCustomScrape.classList.add("green");
            bsEditConfigAutoScrape.classList.remove("green");
            bsEditConfigXPATH.style.display = "block";
            break;
    }
}

// Sets the edit URL for the configuration
function setEditURL(url) {
    bsEditConfigURL.value = url;
}

/**
 * Manages the xpath inputs and buttons for the edit configuration.
 * counter : The counter for the number of xpath inputs.
 * list : The list of xpath input IDs.
 * deletelist : The list of xpath delete button IDs.
 */
var editXpathTracker = {
    "counter" : 0,
    "list" : [],
    "deletelist": [],
}

/**
 * Populates the edit XPATHs on the page based on the provided xpathlist.
 * 
 * @param {Array<string>} xpathlist - The list of XPATHs to set for editing.
 */
function setEditXPATHs(xpathlist) {
    for (let i=0; i<xpathlist.length; i++) {
        addXpathInputs(editXpathTracker, "edit-add-xpath-input", bsEditConfigXPATHInput, bsEditConfigXPATH, "edit-delete-xpath", xpathlist[i]);
    }
}

/**
 * Clears the edit XPATHs from the DOM and resets the xpathtracker.
 * @param {Object} xpathtracker - The xpathtracker object containing the list and counter.
 */
function clearEditXPATHs(xpathtracker) {
    for (let i=0; i<xpathtracker['list'].length; i++) {
        document.getElementById(xpathtracker['list'][i]).remove();
        document.getElementById(xpathtracker['deletelist'][i]).remove();
    }

    xpathtracker['counter'] = 0;
    xpathtracker['list'] = [];
    xpathtracker['deletelist'] = [];
}

/**
 * EDIT URL CONFIGURATION
 * When the edit button is clicked, the selected URL is set for editing.
 * The URL is checked for emptiness and the contextual help is cleared.
 * The URL is set for editing and the scraping options are set based on the user configuration.
 * The XPATHs are set for editing based on the user configuration.
 * The summary customisation options are set based on the user configuration.
 * The edit configuration container is displayed.
 */
bsEditConfigEditButton.addEventListener('click', function(){

    // Cannot have empty url
    if (isEditUrlEmpty(bsEditConfigSelector.value)) { return; }
    // Clear the contextual help
    clearBsEditContextual();

    // Clear xpath boxes if the edit option has been changed
    clearEditXPATHs(editXpathTracker);

    // Get the selected URL for editing
    var selected = bsEditConfigSelector.value;

    // Track the old URL
    editOldURL = selected;
    // Load the user configuration for the selected URL
    editChosen = currentPSCConfigs[selected];

    // Populate the configuration fields
    setEditURL(selected);
    setEditScrapingOptions(editChosen["scraping-option"]);
    setEditXPATHs(editChosen['xpaths']);

    // Populate the user's set summary customisation options
    editview.setPredefinedOptions(editChosen['summary-customisation']["text-type"], 
                                  editChosen['summary-customisation']["summary-type"],  
                                  editChosen['summary-customisation']["model-selected"],
                                  editChosen['summary-customisation']["summary-length-chosen"]);
    
    // Display the edit configuration container
    bsEditConfigContainer.style.display = 'block'; 
})

populateBSEditConfig();

// Listener for the auto-scrape option, sets the selected scraping option to auto-scrape and updates the UI.
bsEditConfigAutoScrape.addEventListener("click", function() {
    if (editSelectedScrapeOption !== "auto-scrape") {
        editSelectedScrapeOption = "auto-scrape";
        bsEditConfigAutoScrape.classList.add("green");
        bsEditConfigCustomScrape.classList.remove("green");
        // Hide the custom scrape box fields
        bsEditConfigXPATH.style.display = "none";
    }
})

// Listener for the custom-scrape option, sets the selected scraping option to custom-scrape and updates the UI.
bsEditConfigCustomScrape.addEventListener("click", function () { 
    if (editSelectedScrapeOption !== "custom-scrape") {
        editSelectedScrapeOption = "custom-scrape";
        bsEditConfigAutoScrape.classList.remove("green");
        bsEditConfigCustomScrape.classList.add("green");
        bsEditConfigXPATH.style.display = "block";
    }
})

// Add XPATH input and buttons for the edit configuration
addingXpath(bsEditConfigXPATHAdd, [editXpathTracker, "edit-add-xpath-input", bsEditConfigXPATHInput, bsEditConfigXPATH, "edit-delete-xpath"]);


/**
 * EDIT DELETE BUTTON
 * Event listener for the delete button on the edit configuration.
 * Deletes the selected URL from the user's customisation configurations.
 */
bsEditConfigDelButton.addEventListener('click', function() {
    var selected = bsEditConfigSelector.value;
    
    // Cannot have empty url
    if (isEditUrlEmpty(selected)) { return; }
    // Clear the contextual help
    clearBsEditContextual();

    // Delete from list
    let toRemove = bsEditConfigSelector.querySelector('option[value="' + selected + '"]');
    // Remove the selected URL from the dropdown
    bsEditConfigSelector.removeChild(toRemove);
    // Delete from urllist
    delEntryURLLIST(selected);
    // Delete from userconfigs
    delete currentPSCConfigs[selected]
    // Save changes
    saveToStorage({"bsc" : currentPSCConfigs});

})

// Save new ADDED configuration 
/**
 * ADD CONFIGURATION SAVE BUTTON
 * Event listener for the save button on the add configuration.
 * Saves the new configuration to the user's customisation configurations.
 * The URL must be unique and cannot be empty.
 * The summary length must be within the correct range.
 */
bsEditConfigSave.addEventListener("click", async function () { 

    // Cannot have existing url
    var exisitingURL = await urlExists(bsEditConfigURL.value, editOldURL);
    if (exisitingURL) {
        bsEditConfigSaveContextual.innerText = "URL already exists!";
        return;
    }
    // Cannot have empty url
    if (urlErrorMessage(bsEditConfigURL.value, bsEditConfigSaveContextual)) {return;}

    // Incorrect summary length
    if (badSummaryLength(view.getSummaryLength(), bsEditConfigSaveContextual)) { return; }

    // Updates the configuration with what the user has inputted and saves it locally
    var [url, builder] = bsAddConfig(bsEditConfigURL, editview, editXpathTracker, editSelectedScrapeOption);
    
    // Delete the old configuration
    delete currentPSCConfigs[editOldURL];

    // Save the new url configuration
    updateURLLIST(url, builder, editOldURL);
    
    // Update the user's configurations
    currentPSCConfigs[url] = builder;

    // Save the updated configurations
    saveToStorage({"bsc" : currentPSCConfigs});

    // Notify the user that the configuration has been saved
    bsEditConfigSaveContextual.innerText = "Saved!";
})


/**
 * Checks if a given URL exists in the user's URL list.
 * 
 * @param {string} url - The URL to check.
 * @param {string|null} oldUrl - The old URL to compare with (optional).
 * @returns {boolean} - Returns true if the URL exists in the user's URL list, false otherwise.
 */
async function urlExists(url, oldUrl=null) {
    // Load the user's URL list
    var urlList = await loadUserConfigs('urllist');

    // Create a new URL object with the given URL
    var urlObj = new URL(url);
    var dName = urlObj.hostname.toString();
    var pName = urlObj.pathname.toString();

    // For edit configurations, check if the URL is the same as the old URL
    // When the URL is the same, return false. As it is the same URL, it is not an existing URL as we are editing it.
    if (oldUrl !== null) {
        var oldUrlObj = new URL(oldUrl);
        var oldDName = oldUrlObj.hostname.toString();
        var oldPName = oldUrlObj.pathname.toString();
        if (oldDName === dName && oldPName === pName) {
            return false;
        }
    }

    // Check if the URL exists in the user's URL list
    if (urlList.hasOwnProperty(dName)) {
        if (urlList[dName].hasOwnProperty(pName)) {
            return true;
        }
    }

    return false; 
}


/**
 * Adds an event listener to a button that executes the addXpathInputs function when clicked.
 * @param {HTMLElement} but - The button element to attach the event listener to.
 * @param {Array<HTMLElement>} inputlist - An array of input elements.
 */
function addingXpath(but, inputlist) {
    but.addEventListener("click", function () { 
        // Cannot be empty
        if (inputlist[2].value.trim() !== "") {
            addXpathInputs(inputlist[0], inputlist[1], inputlist[2], inputlist[3], inputlist[4]);
        }
    })
}

/**
 * Manages the xpath inputs and buttons to add configuration.
 * counter : The counter for the number of xpath inputs.
 * list : The list of xpath input IDs.
 * deletelist : The list of xpath delete button IDs.
 */
var xpathTracker = {
    "counter" : 0,
    "list" : [],
    "deletelist": [],
}

/**
 * Adds input and delete button for XPATHs. For edit, it fills the input box with the value.
 * Makes sure it tracks the input boxes and delete buttons.
 *
 * @param {Object} xpathTracker - The tracker object for XPath inputs.
 * @param {string} xpathInput - The prefix for the input box ID.
 * @param {Object} addConfigXpathInput - The input box for adding XPath.
 * @param {Object} addConfigXpath - The container element for XPath inputs.
 * @param {string} deleteInputBoxID - The prefix for the delete button ID.
 * @param {string|null} [fill=null] - The value to fill in the new input box for editing.
 */
function addXpathInputs(xpathTracker, xpathInput, addConfigXpathInput, addConfigXpath, deleteInputBoxID, fill=null) {
    // Create new input box and delete button
    var newInputBox = document.createElement("input");
    var deleteNewInputBox = document.createElement("button");
    
    // Increment the counter and create the ID for the new input box, and add it to the list
    xpathTracker["counter"] += 1;
    let idAttrValue = xpathInput+xpathTracker["counter"];
    xpathTracker['list'].push(idAttrValue);

    // Set the attributes for the new input box and delete button
    newInputBox.setAttribute('type', "text");
    newInputBox.setAttribute('id', idAttrValue);

    // Set styles for the new input box and delete button
    newInputBox.style.marginTop = "20px";
    newInputBox.classList.add("box", "box-width-extended-med-long");
    deleteNewInputBox.style.marginLeft = "3px";
    deleteNewInputBox.classList.add("box", "box-div-button", "box-width-reduced", "box-reduced-pad-uniform",  "pad-left-20", "pointer");

    // Set the value for the new input box for editing
    if (fill) { newInputBox.value = fill; }
    else { newInputBox.value = addConfigXpathInput.value; }

    // Set the ID for the delete button and add it to the list, set the text content for the delete button
    var idDeleteAttrValue = deleteInputBoxID+xpathTracker["counter"];
    xpathTracker['deletelist'].push(idDeleteAttrValue);
    deleteNewInputBox.setAttribute('id', idDeleteAttrValue);
    // deleteNewInputBox.setAttribute('id', deleteInputBoxID+xpathTracker["counter"]);
    deleteNewInputBox.textContent = "Delete";

    // Add event listener for the delete button, to remove the input box and delete button from the DOM
    deleteNewInputBox.addEventListener("click", function (param) { 

        let index = xpathTracker['list'].indexOf(idAttrValue);
        if (index !== -1) { xpathTracker['list'].splice(index, 1) }

        // for the edit code
        index = xpathTracker['deletelist'].indexOf(idDeleteAttrValue);
        if (index !== -1) { xpathTracker['deletelist'].splice(index, 1) }

        let parent = newInputBox.parentNode;
        parent.removeChild(newInputBox);                   
        parent.removeChild(deleteNewInputBox);
    })

    // Append the new input box and delete button to the container
    addConfigXpath.append(newInputBox);
    addConfigXpath.append(deleteNewInputBox);

}

// SAME AS EDIT VERSION
// Listener for the auto-scrape option, sets the selected scraping option to auto-scrape and updates the UI.
bsAddConfigAutoScrape.addEventListener("click", function() {
    if (selectedScrapeOption !== "auto-scrape") {
        selectedScrapeOption = "auto-scrape";
        bsAddConfigAutoScrape.classList.add("green");
        bsAddConfigCustomScrape.classList.remove("green");
        // Hide the custom scrape box fields
        bsAddConfigXPATH.style.display = "none";
    }
})

// SAME AS EDIT VERSION
// Listener for the custom scrape option, sets the selected scraping option to custom scrape and updates the UI.
bsAddConfigCustomScrape.addEventListener("click", function (param) { 
    if (selectedScrapeOption !== "custom-scrape") {
        selectedScrapeOption = "custom-scrape";
        bsAddConfigAutoScrape.classList.remove("green");
        bsAddConfigCustomScrape.classList.add("green");
        // Display the custom scrape box fields
        bsAddConfigXPATH.style.display = "block";
    }
})

// Add XPATH input and buttons for the adding configuration
addingXpath(bsAddConfigXPATHAdd, [xpathTracker, "add-xpath-input", bsAddConfigXPATHInput, bsAddConfigXPATH, "delete-xpath"]);

/**
 * Creates the BS customisation configuration to be saved locally.
 *
 * @param {HTMLInputElement} addConfigUrl - The input element containing the URL value.
 * @param {Object} view - The view object.
 * @param {Object} xpathTracker - The xpath tracker object.
 * @param {string} selectedScrapeOption - The selected scrape option.
 * @returns {Array} - An array containing the URL value and the builder object.
 */
function bsAddConfig(addConfigUrl, view, xpathTracker, selectedScrapeOption) {
    
    // The URL value
    let urlValue = addConfigUrl.value;

    // BS Summarisation Customisation options
    let package = view.packageFullCustomisation();
    
    // Obtain the XPATHs from the input boxes
    let xpathlists = [];
    for (var i=0; i<xpathTracker["list"].length; i++) {
        let obj = document.getElementById(xpathTracker["list"][i]);
        xpathlists.push(obj.value);
    }
    
    // Build the configuration object
    let builder = {};
    builder = {
        "summary-customisation" : package,
        "scraping-option" : selectedScrapeOption,
        "xpaths" : xpathlists
    }

    return [urlValue, builder];
}

/**
 * Updates the URL list with the provided URL, builder, and optional old URL.
 * @param {string} url - The new URL to be added or updated in the URL list.
 * @param {string} builder - The builder associated with the URL.
 * @param {string|null} [oldUrl=null] - The old URL to be removed from the URL list (optional).
 */
function updateURLLIST(url, builder, oldUrl=null) {
    loadUserConfigs('urllist').then((result) => {

        // Get the domain and path name from the URL
        var urlObj = new URL(url);
        var dName = urlObj.hostname.toString();
        var pName = urlObj.pathname.toString();

        // If the domain exists in the URL list, update the path name with the new builder
        // Otherwise, create a new domain with the path name and builder
        if (result.hasOwnProperty(dName)) {
            var urlConfigs = result[dName];
            urlConfigs[pName] = builder;
        } else {
            result[dName] = {
                [pName] : builder
            }
        }

        // Save the updated URL list
        saveToStorage({'urllist' : result});

        // console.log(result);
    }).then(() => {
        // If there is an old URL, delete the old URL from the URL list
        if (oldUrl && url !== oldUrl) {
            delEntryURLLIST(oldUrl);
        }
    })
}

/**
 * Deletes an entry from the URL list.
 * @param {string} url - The URL to be deleted.
 */
function delEntryURLLIST(url) { 
    // Load the user's URL list
    loadUserConfigs('urllist').then((result) => {
        var urlObj = new URL(url);
        var dName = urlObj.hostname.toString();
        var pName = urlObj.pathname.toString();

        // Locate the domain and path name in the URL list and delete it
        var domain = result[dName];
        delete domain[[pName]];

        // Delete the domain if it is empty
        if (Object.keys(domain).length === 0) {
            delete result[dName];
        }

        // Save the updated URL list
        saveToStorage({'urllist' : result});

    })
}

/**
 * Checks if a given URL is valid.
 * 
 * Matches URLs with the following format:
 * - Protocol (http:// or https://)
 * - Domain part consisting of lowercase letters, digits, dots, or hyphens
 *   or, an IP address in the format of 1 to 3 digits separated by dots
 * - Optional port number (1 to 5 digits)
 * - Optional path (forward slash followed by zero or more non-whitespace characters)
 *  
 *    (https?:\/\/)?                         // Matches a a protocol (http:// or https://)
 *    ([a-z0-9.-]+                           // Matches the domain part: lowercase letters, digits, dots, or hyphens
 *    |\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})   // or IP address format
 *    (:\d{1,5})?                            // Matches an optional port number (1 to 5 digits)
 *    (\/\S*)?                               // Matches an optional path (forward slash followed by zero or more non-whitespace characters)
 *    $/i;                                   // End of line assertion, case-insensitive flag
 * 
 * @param {string} url - The URL to validate.
 * @returns {boolean} - Returns true if the URL is valid, false otherwise.
 */
function isValidURL(url) {
    // Matches [http, https --> word /ips], subdomain, domain, paths
    const urlPattern = /^(https?:\/\/)?([a-z0-9.-]+|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d{1,5})?(\/\S*)?$/i;
    return urlPattern.test(url);
}


// Save new ADDED configuration 

/**
 * ADD CONFIGURATION SAVE BUTTON
 * Event listener for the save button on the add configuration.
 * Saves the new user per site customisation configuration.
 * The URL must be unique and cannot be empty.
 * The summary length must be within the correct range.
 * The configuration is saved locally.
 * The user is notified that the configuration has been saved.
 */
bsAddConfigSave.addEventListener("click", async function () { 
    
    // Cannot have existing url
    var exisitingURL = await urlExists(bsAddConfigURL.value);
    if (exisitingURL) {
        bsAddConfigSaveContextual.innerText = "URL already exists!";
        return;
    }

    // Cannot have empty url
    if (urlErrorMessage(bsAddConfigURL.value, bsAddConfigSaveContextual)) {return;}

    // Incorrect summary length
    if (badSummaryLength(view.getSummaryLength(), bsAddConfigSaveContextual)) { return; }

    // Updates the configuration with what the user has inputted and saves it locally
    var [url, builder] = bsAddConfig(bsAddConfigURL, view, xpathTracker, selectedScrapeOption);

    // Save the new url configuration
    updateURLLIST(url, builder);

    // Update the user's configurations
    currentPSCConfigs[url] = builder;

    // Save the updated configurations;
    saveToStorage({"bsc" : currentPSCConfigs});

    // Notify the user that the configuration has been saved
    bsAddConfigSaveContextual.innerText = "Saved!";
})

/**
 * Checks if the provided URL is valid and displays an error message if it's not.
 * @param {string} configURLValue - The URL value to be checked.
 * @param {HTMLElement} ctx - The element where the error message will be displayed.
 * @returns {boolean} - Returns true if there was an error with the URL, otherwise false.
 */
function urlErrorMessage(configURLValue, ctx) {
    if (configURLValue.trim() === ""  || !isValidURL(configURLValue.trim())) {
        ctx.innerText = "There was an error with your url! Please check if it's valid.";
        return true; 
    }
    return false;
}

/**
 * Checks if the provided summary length is valid.
 * 
 * @param {number} value - The summary length value to check.
 * @param {HTMLElement} ctx - The context element to display an error message.
 * @returns {boolean} - Returns true if the summary length is invalid, otherwise false.
 */
function badSummaryLength(value, ctx) {
    if (value < 0 || value > 100) {
        ctx.innerText = "Incorrect summary length! Please enter a value between 0 and 100.";
        return true; 
    }
    return false;
}

/**
 * Adds a functionality to the url + xpath descriptor toggle. Hide and show the descriptor.
 * @param {string} toggle - The ID of the toggle element.
 * @param {string} desc - The ID of the descriptor element.
 */
function addDescriptorToggle(toggle, desc) {
    document.getElementById(toggle).addEventListener('click', function () {
        var descriptor = document.getElementById(desc);
        var currentDisplay = window.getComputedStyle(descriptor).display;
        descriptor.style.display = (currentDisplay === "none") ? "block" : "none";
    })
}

// Add event listeners for the descriptor toggles
addDescriptorToggle("bs-psc-url-descriptor-toggle", "bs-psc-url-descriptor");
addDescriptorToggle("xpath-descriptor-toggle", "bs-psc-xpath-descriptor-box");

// Show and hide BS customisation configurations if it cannot connect to the backend service
// Notify the user that the configurations are disabled and to check their connection
var perSiteConfig = document.getElementById("per-site-config");
var bsConfigContextual = document.getElementById("bs-config-contextual");

function disableBsSettings() {
    perSiteConfig.style.display = "none";
    bsConfigContextual.innerHTML = "Could not build the customisation settings! Please check your connection with the backend service.";
}

function enableBsSettings() {
    perSiteConfig.style.display = "block";
    bsConfigContextual.innerHTML = "";
}

// ---------------------------------------------------------------------------------
// Shortcuts functionality

// Open the shortcuts page when the button is clicked
document.getElementById("edit-view-shortcuts-button").addEventListener("click", function() {
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});


// ---------------------------------------------------------------------------------
// Message handling

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  
    switch (request.action) {
      // Backend service model descriptor response to populate the BS customisation settings
      case 'customisationConfigResponse':
        // console.log("Settings.js - Got customisation config")
        if (request.to === "settings") {
            // VIEW MESSAGE THAT HAS BEEN RETRIEVED
            // OR GET THE SUMMARYOPTIONS CONTROLLER TO HANDLE IT
            if (request.data !== null) {
                buildSummaryConfigs(request.data);
                enableBsSettings();                 // Enable the settings
            }
            else {
                disableBsSettings();                // Disable the settings if no data nor connection
            }
        }
        break;
      // Backend service authentication message status
      case 'bsAuthMessageStatus':
        setBsAuthContext(request.message);
        break;
    }
  
    sendResponse();
});


