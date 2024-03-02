function saveToStorage(ctx_obj) {
    chrome.storage.local.set(ctx_obj, function() {
      console.log("Storage Item Saved");
    });
}

function loadScrapingCustomisation() {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['bsc'], function(result) {
            if (isObjectEmpty(result)) {
                console.log("its empty");
                saveToStorage({'bsc' : {}});
                loadScrapingCustomisation();
                resolve();
            } else {
                currentPSCConfigs = result['bsc'];
                console.log(result);
                resolve();
            }
        });
    })
}

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

function isObjectEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
}

function removeFromStorage(ctx) {
    chrome.storage.local.remove(ctx, function() {
        console.log(ctx, ' Removed from storage');
      });
}
// -------------------------------------------------
// Button colour states
// var sideButtonDefault = "box box-width-reduced selectable-button-side";
// var sideButtonSelected = "box box-width-reduced selectable-button-side green";


// -----------------------------------------------------------------------------------------
// BS Service Connections
var bsPConnectionLoginButton = document.getElementById('bs-provider-connection-login-button');
var bsPConnectionSignupButton = document.getElementById('bs-provider-connection-signup-button');
var bsPConnectionHostInput = document.getElementById('bs-provider-connection-host-input');
var bsPConnectionUsernameInput = document.getElementById('bs-provider-connection-username-input');
var bsPConnectionPasswordInput = document.getElementById('bs-provider-connection-password-input');
var bsPConnectionConnectButton = document.getElementById('bs-provider-connection-connect-button');
var bsPConnectionCtx = document.getElementById('bs-provider-connection-contextual');
var bsPSelectedConnect = null;

// Choose between Login and Signup
// log = login ,  sin = signup
function setAuthenticationType(type) {
    console.log(type);
    if (type === undefined || type === bsPConnectionLoginButton) {
        bsPSelectedConnect = "log";
        bsPConnectionLoginButton.classList.add('green');
        bsPConnectionSignupButton.classList.remove('green');
        bsPConnectionConnectButton.innerText = "Connect";
    }
    else {
        bsPSelectedConnect = "sin";
        bsPConnectionSignupButton.classList.add('green');
        bsPConnectionLoginButton.classList.remove('green');
        bsPConnectionConnectButton.innerText = "Signup";
    } 
    removeBsAuthContext();
    console.log(bsPSelectedConnect);
}

setAuthenticationType();

// Listeners

// Set to login
bsPConnectionLoginButton.addEventListener('click', function(){
    setAuthenticationType(bsPConnectionLoginButton);
})

// Set to signup
bsPConnectionSignupButton.addEventListener('click', function(){
    setAuthenticationType(bsPConnectionSignupButton);
})

// Connect / Signup
bsPConnectionConnectButton.addEventListener('click', function(){
    var host = bsPConnectionHostInput.value;
    if (host === "") {
        host = "http://127.0.0.1:5000";
    }
    var usr = bsPConnectionUsernameInput.value;
    var pwd = bsPConnectionPasswordInput.value;

    if (usr === "" || pwd === "") {
        setBsAuthContext("Username / Password cannot be empty!");
        return;
    }

    var auth = {
        username : usr,
        password : pwd
    }
    auth = JSON.stringify(auth);

    if (bsPSelectedConnect === "log") {
        chrome.runtime.sendMessage({ action: "login", host : host, auth : auth });
    }
    else {
        chrome.runtime.sendMessage({ action: "signup", host : host, auth : auth });
    }
})

// Set context
function setBsAuthContext(message) { 
    bsPConnectionCtx.innerHTML = message;
}

// Clear context
function removeBsAuthContext() { 
    bsPConnectionCtx.innerHTML = "";
}

// Switch between BS and CO
var providerSelector = document.getElementById('provider-selector');
var bsProviderBox = document.getElementById('bs-provider-connection-box');
var coProviderBox = document.getElementById('co-provider-connection-box');

// Listeners
providerSelector.addEventListener('change', function(){
    var prov = providerSelector.value;
    if (prov === "co") {
        bsProviderBox.style.display = 'none';
        coProviderBox.style.display = 'block';
    } else {
        bsProviderBox.style.display = 'block';
        coProviderBox.style.display = 'none';
    }
    removeBsAuthContext();
})


// CO Service Connection
var coProviderKeyInput = document.getElementById('co-provider-key-input');
var coProviderHostInput = document.getElementById('co-provider-host-input');
var coProviderConnectionSaveButton = document.getElementById('co-provider-connection-save-button');

// Listeners

coProviderConnectionSaveButton.addEventListener('click', function(){
    var key = coProviderKeyInput.value;
    var host = coProviderHostInput.value;
    // const msg = chrome.runtime.sendMessage({ action : 'loadUserConfigs', config : 'auth' });
    loadUserConfigs('auth').then(data => {
        data['co_api_key'] = key;
        data['co_host'] = host;
        saveToStorage({'auth' : data});
    })

    setBsAuthContext("Saved!");
})

// On load
function populateCOServiceConnection() {
    // const msg = chrome.runtime.sendMessage({ action : 'loadUserConfigs', config : 'auth' });
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
// ChatGPT customisation

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

// edit
var oldPrompt = null;
coPromptsEditButton.addEventListener('click', function(){
    // Make the edit prompts box visible
    // .....
    displayPromptUpdate();
    oldPrompt = coPromptsSelector.value;
    // console.log(oldPrompt);
    coPromptsEditInput.value = oldPrompt;
})

// update edit
coPromptsEditUpdateButton.addEventListener('click', function(){
    var newPrompt = coPromptsEditInput.value;
    if (!hasContentTag(newPrompt)) {
        console.log("Doesnt have the {content}");
        addCoCtxHelp("You need to add '{context}' to your prompt!");
        return;
    }

    hidePromptUpdate();
    // const msg = chrome.runtime.sendMessage({ action : 'loadUserConfigs', config : 'coprompts' });
    loadUserConfigs('coprompts').then((data) => {
        var prompts = data['prompts'];
        for (const i in prompts) {
            if (prompts[i] === oldPrompt) {
                prompts[i] = newPrompt;
            }
        }

        // CHECK THIS CODE
        if (data.hasOwnProperty('default')) {
            if (data['default'] === oldPrompt) {
                data['default'] = newPrompt;
            }
        }
        removeCoCtxHelp();
        saveToStorage({'coprompts' : data});
        populatePromptsList();
    })
})

// Add prompt
coPromptsAddButton.addEventListener('click', function(){
    let input = coPromptsAddInput.value;
    if (!hasContentTag(input)) {
        console.log("Doesnt have the {content}");
        addCoCtxHelp("You need to add '{context}' to your prompt!");
        return;
    }
    coPromptsAddInput.value = "";
    // const msg = chrome.runtime.sendMessage({ action : 'loadUserConfigs', config : 'coprompts' });
    loadUserConfigs('coprompts').then((data) => {
        console.log("CO PROMPTS - PREADDED: ", data)
        if (data.hasOwnProperty('prompts')) {
            data['prompts'].push(input);
        } else {
            data['prompts'] = [input];
        }
        removeCoCtxHelp();
        saveToStorage({'coprompts' : data});
        populatePromptsList();
    })
})

// Delete Prompt
coPromptsDeleteButton.addEventListener('click', function(){
    var prompt = coPromptsSelector.value;
    coPromptsSelector.querySelector('option[value="' + prompt + '"]').remove();
// const msg = chrome.runtime.sendMessage({ action : 'loadUserConfigs', config : 'coprompts' });
    loadUserConfigs('coprompts').then((data) => {
        data['prompts'] = data['prompts'].filter(p => p !== prompt );

        // CHECK THIS CODE
        if (data.hasOwnProperty('default')) {
            if (data['default'] === prompt) {
                data['default'] = "";
                if (data['prompts'].length > 0) {
                    data['default'] = data['prompts'][0];
                }
            }
        }

        saveToStorage({'coprompts' : data});
        populatePromptsList();
    })
})

// Set default prompt
coPromptsDefaultButton.addEventListener('click', function(){
    var prompt = coPromptsSelector.value;
    var def = coPromptsSelector.querySelector('option[value="' + prompt + '"]');
    def.text = "Default: " + def.text;
    // const msg = chrome.runtime.sendMessage({ action : 'loadUserConfigs', config : 'coprompts' });
    loadUserConfigs('coprompts').then((data) => {
        data['default'] = prompt;
        saveToStorage({'coprompts' : data});
        populatePromptsList();
    })
})

// view prompt update
function displayPromptUpdate() {
    coPromptsEditEditor.style.display = "block";
}

// hide prompt update
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

// check if prompt has {content} inside their prompt
function hasContentTag(prompt) { 
    return prompt.includes("{content}");
}


// Populate Prompts list
function populatePromptsList() { 
    // const msg = chrome.runtime.sendMessage({ action : 'loadUserConfigs', config : 'coprompts' });
    loadUserConfigs('coprompts').then((data) => {
        console.log("CO PROMPTS: ", data)
        var prompts = data['prompts'];
        
        // oldPrompt = null;
        coPromptsSelector.innerHTML = "";

        for (const p in prompts) {
            var option = document.createElement('option');
            option.value = prompts[p];
            option.text = prompts[p];

            coPromptsSelector.appendChild(option);
        }

        // CHECK THIS CODE
        if (data.hasOwnProperty('default')) {
            coPromptsSelector.value = data['default'];
            var def = coPromptsSelector.querySelector('option[value="' + data['default'] + '"]');
            def.text = "Default: " + def.text;
        }
    })
}

populatePromptsList();





// ----------------------------------------------------------------------------------
chrome.runtime.sendMessage({ action: 'customisationConfigRequest', to: "settings" });

var view = null;
var editview = null;

// check if the data is not being used in both configs
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

    let copiedJson = JSON.parse(JSON.stringify(data));

    view = new SummaryCustomisationView(data, elements);

    let editstheader = "edit-st-header"; //
    let editstb1 = "edit-sb-1";
    let editstb2 = "edit-sb-2";
    // Summmary Type CSS selected state
    let editstbcss = "selected-state";
    let editttheader = "edit-tt-header"; //
    // Text Type Domain Dropdown
    let editttdropdown = "edit-td-dropdown-textdomain";
    let editmodelheader = "edit-model-header"; //
    // Model Dropdown
    let editmodeldropdown = "edit-td-dropdown-modelchoice";
    let editslheader = "edit-sl-header"; //
    // Summary length
    let editmilength = "edit-minlength";
    let editmalength = "edit-maxlength";
    // Summary length value
    let editsumlength = "edit-summary-length"
    let editttpp = "edit-tt-pp";
    let editstpp = "edit-st-pp";
    let editmcpp = "edit-mc-pp";
    let editslpp = "edit-sl-pp";

    let editelements = [editstheader, editstb1, editstb2, editstbcss, editttheader, 
                        editttdropdown, editmodelheader, editmodeldropdown, editslheader,
                        editmilength, editmalength, editsumlength,
                        editttpp, editstpp, editmcpp, editslpp];

    console.log(data, elements);

    editview = new SummaryCustomisationView(copiedJson, editelements);
    // console.log(data);
    // view = new SummaryCustomisationView(data);
    let config = view.controller;
    return config;
}

// ---------------------------------------------------------------------------------

// BS-CONFIG

// Load the currently saved configs
// removeFromStorage('bsc');
var currentPSCConfigs = null;
loadScrapingCustomisation();

var bsAddConfigURL = document.getElementById("bs-add-config-URL");
var oldURL = null;
var selectedScrapeOption = "auto-scrape";
var bsAddConfigAutoScrape = document.getElementById("auto-scrape");
var bsAddConfigCustomScrape = document.getElementById("custom-scrape");
var bsAddConfigXPATH = document.getElementById("add-xpath");
var bsAddConfigXPATHAdd = document.getElementById("add-xpath-button");
var bsAddConfigXPATHInput = document.getElementById("add-xpath-input0");

bsAddConfigAutoScrape.classList.add("green"); // CHANGE HOW THIS IS DONE

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

// EDIT CONFIG

// Populate list with loaded configs
function populateBSEditConfig() {
    loadScrapingCustomisation().then(() => {

        console.log("Working on ====: ", currentPSCConfigs)
        for (const url in currentPSCConfigs) {
            console.log(url);
            let urlItem = document.createElement('option');
            urlItem.value = url;
            urlItem.innerText = url;
            bsEditConfigSelector.appendChild(urlItem);
        }

    }).catch((error) => { console.log(error)})
}

function setEditScrapingOptions(config) {
    editSelectedScrapeOption = config; // do i need????

    switch (editSelectedScrapeOption) { 
        case 'auto-scrape':
            bsEditConfigAutoScrape.classList.add("green");
            bsEditConfigCustomScrape.classList.remove("green");
            break;
        case "custom-scrape":
            bsEditConfigCustomScrape.classList.add("green");
            bsEditConfigAutoScrape.classList.remove("green");
            break;
    }
}

function setEditURL(url) {
    bsEditConfigURL.value = url;
}

var editXpathTracker = {
    "counter" : 0,
    "list" : [],
    "deletelist": [],
}

function setEditXPATHs(xpathlist) {
    for (let i=0; i<xpathlist.length; i++) {
        addXpathInputs(editXpathTracker, "edit-add-xpath-input", bsEditConfigXPATHInput, bsEditConfigXPATH, "edit-delete-xpath", xpathlist[i]);
    }
}

// function clearEditXPATHs(list, deletelist) {
//     for (let i=0; i<deletelist.length; i++) {
//         list[i].remove();
//         deletelist[i].remove();
//     }

//     editXpathTracker['counter'] = 0;
//     editXpathTracker['list'] = [];
//     editXpathTracker['deletelist'] = [];
// }

function clearEditXPATHs(xpathtracker) {
    for (let i=0; i<xpathtracker['list'].length; i++) {
        document.getElementById(xpathtracker['list'][i]).remove();
        document.getElementById(xpathtracker['deletelist'][i]).remove();
    }

    xpathtracker['counter'] = 0;
    xpathtracker['list'] = [];
    xpathtracker['deletelist'] = [];
}


// [
// counter and list
// xpathInput : "add-xpath-input"
// addConfigXpathInput : bsAddConfigXPATHInput
// addConfigXpath : bsAddConfigXPATH
// deleteInputBoxID : "delete-xpath"
// fill
// ]

// Editing for a given url
bsEditConfigEditButton.addEventListener('click', function(){

    // Clear xpath boxes if the edit option has been changed
    clearEditXPATHs(editXpathTracker);

    console.log('Ivb been clicked');
    var selected = bsEditConfigSelector.value;
    editOldURL = selected;
    console.log(currentPSCConfigs[selected]);
    editChosen = currentPSCConfigs[selected];
    setEditURL(selected);
    setEditScrapingOptions(editChosen["scraping-option"]);
    if (editChosen["scraping-option"] === "custom-scrape") {
        setEditXPATHs(editChosen['xpaths']);
    }

    editview.setPredefinedOptions(editChosen['summary-customisation']["text-type"], 
                                  editChosen['summary-customisation']["summary-type"],  
                                  editChosen['summary-customisation']["model-selected"],
                                  editChosen['summary-customisation']["summary-length-chosen"]);
    
                                  // ....
    bsEditConfigContainer.style.display = 'block'; 
})


populateBSEditConfig();

// Edit config listeners

// edit: Scraping options
bsEditConfigAutoScrape.addEventListener("click", function() {
    if (editSelectedScrapeOption !== "auto-scrape") {
        editSelectedScrapeOption = "auto-scrape";
        bsEditConfigAutoScrape.classList.add("green");
        bsEditConfigCustomScrape.classList.remove("green");
        // Hide the custom scrape box fields
        bsEditConfigXPATH.style.display = "none";
    }
})

bsEditConfigCustomScrape.addEventListener("click", function (param) { 
    if (editSelectedScrapeOption !== "custom-scrape") {
        editSelectedScrapeOption = "custom-scrape";
        bsEditConfigAutoScrape.classList.remove("green");
        bsEditConfigCustomScrape.classList.add("green");
        // Display the custom scrape box fields
        bsEditConfigXPATH.style.display = "block";
    }
})

// EDIT : add xpath
addingXpath(bsEditConfigXPATHAdd, [editXpathTracker, "edit-add-xpath-input", bsEditConfigXPATHInput, bsEditConfigXPATH, "edit-delete-xpath"]);

// bsEditConfigXPATHAdd.addEventListener('click', function(){
//     console.log(bsEditConfigXPATHInput.value)
//     // addXpathInputs();
//     addXpathInputs(editXpathTracker, "edit-add-xpath-input", bsEditConfigXPATHInput, bsEditConfigXPATH, "edit-delete-xpath");
//     console.log(editXpathTracker["list"]);
// })



bsEditConfigDelButton.addEventListener('click', function() {
    var selected = bsEditConfigSelector.value;
    console.log(selected);
    // Delete from list
    let toRemove = bsEditConfigSelector.querySelector('option[value="' + selected + '"]');
    bsEditConfigSelector.removeChild(toRemove);
    console.log("Removed URL from list:  ", selected);
    // Delete from urllist
    delEntryURLLIST(selected);
    // Delete from userconfigs
    delete currentPSCConfigs[selected]
    console.log("Deleting for user config: ", currentPSCConfigs);
    saveToStorage({"bsc" : currentPSCConfigs});

})

// Save new ADDED configuration 
var bsEditConfigSave = document.getElementById("edit-bs-add-config-save");
var bsEditConfigSaveContextual = document.getElementById("edit-bs-add-config-save-contextual");
bsEditConfigSave.addEventListener("click", function () { 
    console.log("Updating customisation ")

    // Cannot have empty url
    console.log(bsEditConfigURL.value);
    if (urlErrorMessage(bsEditConfigURL.value, bsEditConfigSaveContextual)) {return;}

    var [url, builder] = bsAddConfig(bsEditConfigURL, editview, editXpathTracker, editSelectedScrapeOption);
    // let url = Object.keys(builder)[0];
    console.log("url: ", url);
    // console.log(Object.values(builder));
    // currentPSCConfigs[url] = builder;
    
    delete currentPSCConfigs[editOldURL];
    console.log("Deleted state: ", currentPSCConfigs);

    updateURLLIST(url, builder, editOldURL);
    
    currentPSCConfigs[url] = builder;
    console.log("yes sir (update): ", currentPSCConfigs);
    saveToStorage({"bsc" : currentPSCConfigs});

    bsEditConfigSaveContextual.innerText = "Saved!";
    // if (!currentPSCConfigs.hasOwnProperty(url)) {
        
    // }
    // removeFromStorage("bsc");
})


// inputlist : 
// [
// xpathTracker
// "add-xpath-input"
// bsAddConfigXPATHInput
// bsAddConfigXPATH
// "delete-xpath"
// ]
function addingXpath(but, inputlist) {
    but.addEventListener("click", function () { 
        // Cannot be empty
        if (inputlist[2].value.trim() !== "") {
            addXpathInputs(inputlist[0], inputlist[1], inputlist[2], inputlist[3], inputlist[4]);
        }
        console.log(inputlist[0]["list"]);
    })
}

var xpathTracker = {
    "counter" : 0,
    "list" : [],
    "deletelist": [],
}

// [
// xpathInput : "add-xpath-input"
// addConfigXpathInput : bsAddConfigXPATHInput
// addConfigXpath : bsAddConfigXPATH
// deleteInputBoxID : "delete-xpath"
// ]
function addXpathInputs(xpathTracker, xpathInput, addConfigXpathInput, addConfigXpath, deleteInputBoxID, fill=null) {
    var newInputBox = document.createElement("input");
    var deleteNewInputBox = document.createElement("button");
    
    xpathTracker["counter"] += 1;
    let idAttrValue = xpathInput+xpathTracker["counter"];
    xpathTracker['list'].push(idAttrValue);

    newInputBox.setAttribute('type', "text");
    newInputBox.setAttribute('id', idAttrValue);

    newInputBox.style.marginTop = "20px";
    newInputBox.classList.add("box", "box-width-extended-med-long");
    deleteNewInputBox.style.marginLeft = "3px";
    deleteNewInputBox.classList.add("box", "box-div-button", "box-width-reduced", "box-reduced-pad-uniform",  "pad-left-20", "pointer");

    if (fill) { newInputBox.value = fill; }
    else { newInputBox.value = addConfigXpathInput.value; }

    var idDeleteAttrValue = deleteInputBoxID+xpathTracker["counter"];
    xpathTracker['deletelist'].push(idDeleteAttrValue);
    deleteNewInputBox.setAttribute('id', idDeleteAttrValue);
    // deleteNewInputBox.setAttribute('id', deleteInputBoxID+xpathTracker["counter"]);
    deleteNewInputBox.textContent = "Delete";

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

    addConfigXpath.append(newInputBox);
    addConfigXpath.append(deleteNewInputBox);

    // bsAddConfigXPATH
}


// Add config Listeners

bsAddConfigAutoScrape.addEventListener("click", function() {
    if (selectedScrapeOption !== "auto-scrape") {
        selectedScrapeOption = "auto-scrape";
        bsAddConfigAutoScrape.classList.add("green");
        bsAddConfigCustomScrape.classList.remove("green");
        // Hide the custom scrape box fields
        bsAddConfigXPATH.style.display = "none";
    }
})

bsAddConfigCustomScrape.addEventListener("click", function (param) { 
    if (selectedScrapeOption !== "custom-scrape") {
        selectedScrapeOption = "custom-scrape";
        bsAddConfigAutoScrape.classList.remove("green");
        bsAddConfigCustomScrape.classList.add("green");
        // Display the custom scrape box fields
        bsAddConfigXPATH.style.display = "block";
    }
})

// Adding xpath
addingXpath(bsAddConfigXPATHAdd, [xpathTracker, "add-xpath-input", bsAddConfigXPATHInput, bsAddConfigXPATH, "delete-xpath"]);

// bsAddConfigXPATHAdd.addEventListener("click", function (param) { 
//     // console.log(bsAddConfigXPATHInput.value)
//     // // addXpathInputs();
//     // Cannot be empty
//     if (bsAddConfigXPATHInput.value.trim() !== "") {
//         addXpathInputs(xpathTracker, "add-xpath-input", bsAddConfigXPATHInput, bsAddConfigXPATH, "delete-xpath");
//     }
//     console.log(xpathTracker["list"]);
// })


// [
// addConfigUrl : bsAddConfigURL
// viewController : view
// xpathTracker : xpathTracker
// selectedScapeOption: selectedScrapeOption
// ]


function bsAddConfig(addConfigUrl, view, xpathTracker, selectedScrapeOption) {
    
    let urlValue = addConfigUrl.value;
    // let package = view.packageSummaryCustomisations();
    let package = view.packageFullCustomisation();
    let xpathlists = [];
    for (var i=0; i<xpathTracker["list"].length; i++) {
        let obj = document.getElementById(xpathTracker["list"][i]);
        xpathlists.push(obj.value);
    }
    
    let builder = {};
    builder = {
        "summary-customisation" : package,
        "scraping-option" : selectedScrapeOption,
        "xpaths" : xpathlists
    }

    console.log('bsaddconfig: ', urlValue, builder);
    

    return [urlValue, builder];
}
// const msg = chrome.runtime.sendMessage({ action : 'loadUserConfigs', config : 'urllist' });
loadUserConfigs('urllist').then((result) => {
    console.log('urllist: ', result);
})

function updateURLLIST(url, builder, oldUrl=null) {
    // const msg = chrome.runtime.sendMessage({ action : 'loadUserConfigs', config : 'urllist' });
    loadUserConfigs('urllist').then((result) => {
        console.log(result);
        console.log("New URL: ", url)
        var urlObj = new URL(url);
        var dName = urlObj.hostname.toString();
        var pName = urlObj.pathname.toString();

        if (result.hasOwnProperty(dName)) {
            var urlConfigs = result[dName];
            urlConfigs[pName] = builder;
        } else {
            result[dName] = {
                [pName] : builder
            }
        }

        saveToStorage({'urllist' : result});

        console.log(result);
    }).then(() => {
        if (oldUrl && url !== oldUrl) {
            console.log(oldUrl);
            console.log("OLDURLLLLLL");
            delEntryURLLIST(oldUrl);
        }
    })
}

function delEntryURLLIST(url) { 
    // const msg = chrome.runtime.sendMessage({ action : 'loadUserConfigs', config : 'urllist' });
    loadUserConfigs('urllist').then((result) => {
        console.log(result);
        console.log("DELETING FROM URLLIST: ", url);
        var urlObj = new URL(url);
        var dName = urlObj.hostname.toString();
        var pName = urlObj.pathname.toString();

        var domain = result[dName];
        console.log("DOOOOOOOOOOOOMNAIUBNNN: ", domain)
        delete domain[[pName]];

        // if (isObjectEmpty(domain)) {
        //     delete domain;
        // }
        if (Object.keys(domain).length === 0) {
            delete result[dName];
        }

        console.log("DELLLLL URLLIST: ", result)

        saveToStorage({'urllist' : result});

        console.log(result);
    })
}

function isValidURL(url) {
    // Matches [http, https --> word /ips], subdomain, domain, paths
    const urlPattern = /^(https?:\/\/)?([a-z0-9.-]+|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d{1,5})?(\/\S*)?$/i;
    return urlPattern.test(url);
}


// Save new ADDED configuration 
var bsAddConfigSave = document.getElementById("bs-add-config-save");
var bsAddConfigSaveContextual = document.getElementById("bs-add-config-save-contextual");
bsAddConfigSave.addEventListener("click", function () { 
    console.log("Saving... ");
    
    // Cannot have empty url
    if (urlErrorMessage(bsAddConfigURL.value, bsAddConfigSaveContextual)) {return;}

    var [url, builder] = bsAddConfig(bsAddConfigURL, view, xpathTracker, selectedScrapeOption);

    console.log("url: ", url);

    console.log(currentPSCConfigs);


    updateURLLIST(url, builder);

    currentPSCConfigs[url] = builder;


    console.log("yes sir: ", currentPSCConfigs);
    saveToStorage({"bsc" : currentPSCConfigs});

    bsAddConfigSaveContextual.innerText = "Saved!";
})

function urlErrorMessage(configURLValue, ctx) {
    if (configURLValue.trim() === ""  || !isValidURL(configURLValue.trim())) {
        ctx.innerText = "There was an error with your url! Please check if it's valid.";
        return true; 
    }
    return false;
}


// Add new config for site - url + xpath descriptor toggle
// [toggle, descriptor]
function addDescriptorToggle(toggle, desc) {
    document.getElementById(toggle).addEventListener('click', function () {
        var descriptor = document.getElementById(desc);
        var currentDisplay = window.getComputedStyle(descriptor).display;
        descriptor.style.display = (currentDisplay === "none") ? "block" : "none";
    })
}

addDescriptorToggle("bs-psc-url-descriptor-toggle", "bs-psc-url-descriptor");
addDescriptorToggle("xpath-descriptor-toggle", "bs-psc-xpath-descriptor-box");



// Shortcuts button

document.getElementById("edit-view-shortcuts-button").addEventListener("click", function() {
    chrome.tabs.create({ url: "chrome://extensions/shortcuts" });
});



// ---------------------------------------------------------------------------------

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Popup.js: Message received:', request.action, request);
  
    switch (request.action) { 
      case 'customisationConfigResponse':
        console.log("Settings.js - Got customisation config")
        if (request.to === "settings") {
            // VIEW MESSAGE THAT HAS BEEN RETRIEVED
            // OR GET THE SUMMARYOPTIONS CONTROLLER TO HANDLE IT
            if (request.data !== null) {
                buildSummaryConfigs(request.data);
            }
        }
        break;
    //   case 'loadPopupCtx':
    //     console.log("Popup.js - Loading Popup Context");
    //     setPopupCtx(request.data);
    //     break;
      case 'bsAuthMessageStatus':
        setBsAuthContext(request.message);
        break;
    }
  
    sendResponse();
});


