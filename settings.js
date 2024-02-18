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
                resolve();
            } else {
                currentPSCConfigs = result['bsc'];
                console.log(result);
                resolve();
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

// ----------------------------------------------------------------------------------
chrome.runtime.sendMessage({ action: 'customisationConfigRequest', to: "settings" });

var view = null;
var editview = null;

// check if the data is not being used in both configs
function buildSummaryConfigs(data) {

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

    let copiedJson = JSON.parse(JSON.stringify(data));

    view = new SummaryCustomisationView(data, elements);

    let editstb1 = "edit-sb-1";
    let editstb2 = "edit-sb-2";
    // Summmary Type CSS selected state
    let editstbcss = "selected-state";
    // Text Type Domain Dropdown
    let editttdropdown = "edit-td-dropdown-textdomain";
    // Model Dropdown
    let editmodeldropdown = "edit-td-dropdown-modelchoice";
    // Summary length
    let editmilength = "edit-minlength";
    let editmalength = "edit-maxlength";
    // Summary length value
    let editsumlength = "edit-summary-length"

    let editelements = [editstb1, editstb2, editstbcss, editttdropdown, editmodeldropdown, editmilength, editmalength, editsumlength];

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

var selectedScrapeOption = "auto-scrape";
var bsAddConfigAutoScrape = document.getElementById("auto-scrape");
var bsAddConfigCustomScrape = document.getElementById("custom-scrape");
var bsAddConfigXPATH = document.getElementById("add-xpath");
var bsAddConfigXPATHAdd = document.getElementById("add-xpath-button");
var bsAddConfigXPATHInput = document.getElementById("add-xpath-input0");

bsAddConfigAutoScrape.classList.add("selected-state"); // CHANGE HOW THIS IS DONE

var bsEditConfigContainer = document.getElementById("bs-psc-editsite-update");
var bsEditConfigSelector = document.getElementById("bs-edit-config-selector");
var bsEditConfigEditButton = document.getElementById("edit-site-button");

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

// Editing for a given url
bsEditConfigEditButton.addEventListener('click', function(){
    console.log('Ivb been clicked');
    const selected = bsEditConfigSelector.value
    console.log(currentPSCConfigs[selected])
    // ....
    bsEditConfigContainer.style.display = 'block'; 
})


populateBSEditConfig();






// ADD CONFIG


// Add multiple xpath input boxes

var xpathInputCounter = 0;
var xpathInputList = [];
function addXpathInputs() {
    var newInputBox = document.createElement("input");
    var deleteNewInputBox = document.createElement("button");
    
    xpathInputCounter += 1;
    let idAttrValue = "add-xpath-input"+xpathInputCounter;
    xpathInputList.push(idAttrValue);

    newInputBox.setAttribute('type', "text");
    newInputBox.setAttribute('id', idAttrValue);
    newInputBox.value = bsAddConfigXPATHInput.value;

    deleteNewInputBox.setAttribute('id', "delete-xpath"+xpathInputCounter);
    deleteNewInputBox.textContent = "Delete";

    deleteNewInputBox.addEventListener("click", function (param) { 

        let index = xpathInputList.indexOf(idAttrValue);

        if (index !== -1) { xpathInputList.splice(index, 1) }

        let parent = newInputBox.parentNode;
        parent.removeChild(newInputBox);                   
        parent.removeChild(deleteNewInputBox);
    })

    bsAddConfigXPATH.append(newInputBox);
    bsAddConfigXPATH.append(deleteNewInputBox);

    // bsAddConfigXPATH
}


// Listeners

bsAddConfigAutoScrape.addEventListener("click", function() {
    if (selectedScrapeOption !== "auto-scrape") {
        selectedScrapeOption = "auto-scrape";
        bsAddConfigAutoScrape.classList.add("selected-state");
        bsAddConfigCustomScrape.classList.remove("selected-state");
        // Hide the custom scrape box fields
        bsAddConfigXPATH.style.display = "none";
    }
})

bsAddConfigCustomScrape.addEventListener("click", function (param) { 
    if (selectedScrapeOption !== "custom-scrape") {
        selectedScrapeOption = "custom-scrape";
        bsAddConfigAutoScrape.classList.remove("selected-state");
        bsAddConfigCustomScrape.classList.add("selected-state");
        // Display the custom scrape box fields
        bsAddConfigXPATH.style.display = "block";
    }
})

bsAddConfigXPATHAdd.addEventListener("click", function (param) { 
    console.log(bsAddConfigXPATHInput.value)
    addXpathInputs();
    console.log(xpathInputList);
})


function bsAddConfig() {
    
    let urlValue = bsAddConfigURL.value;
    // let package = view.packageSummaryCustomisations();
    let package = view.packageFullCustomisation();
    let xpathlists = [];
    for (var i=0; i<xpathInputList.length; i++) {
        let obj = document.getElementById(xpathInputList[i]);
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

// Save new ADDED configuration 
var bsAddConfigSave = document.getElementById("bs-add-config-save");
bsAddConfigSave.addEventListener("click", function () { 
    console.log("Saving new ADDED customisation ")
    var [url, builder] = bsAddConfig();
    // let url = Object.keys(builder)[0];
    console.log(url);
    // console.log(Object.values(builder));
    // currentPSCConfigs[url] = builder;
    console.log(currentPSCConfigs);
    if (!currentPSCConfigs.hasOwnProperty(url)) {
        currentPSCConfigs[url] = builder;
        // currentPSCConfigs[url] = Object.values(builder);
        saveToStorage({"bsc" : currentPSCConfigs});
    }
    // removeFromStorage("bsc");
})




// ---------------------------------------------------------------------------------

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    console.log('Popup.js: Message received:', request.action, request);
  
    switch (request.action) { 
      case 'customisationConfigResponse':
        console.log("Settings.js - Got customisation config")
        if (request.to === "settings") {
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


