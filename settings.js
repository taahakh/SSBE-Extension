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
var oldURL = null;
var selectedScrapeOption = "auto-scrape";
var bsAddConfigAutoScrape = document.getElementById("auto-scrape");
var bsAddConfigCustomScrape = document.getElementById("custom-scrape");
var bsAddConfigXPATH = document.getElementById("add-xpath");
var bsAddConfigXPATHAdd = document.getElementById("add-xpath-button");
var bsAddConfigXPATHInput = document.getElementById("add-xpath-input0");

bsAddConfigAutoScrape.classList.add("selected-state"); // CHANGE HOW THIS IS DONE

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
            bsEditConfigAutoScrape.classList.add("selected-state");
            bsEditConfigCustomScrape.classList.remove("selected-state");
            break;
        case "custom-scrape":
            bsEditConfigCustomScrape.classList.add("selected-state");
            bsEditConfigAutoScrape.classList.remove("selected-state");
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
        bsEditConfigAutoScrape.classList.add("selected-state");
        bsEditConfigCustomScrape.classList.remove("selected-state");
        // Hide the custom scrape box fields
        bsEditConfigXPATH.style.display = "none";
    }
})

bsEditConfigCustomScrape.addEventListener("click", function (param) { 
    if (editSelectedScrapeOption !== "custom-scrape") {
        editSelectedScrapeOption = "custom-scrape";
        bsEditConfigAutoScrape.classList.remove("selected-state");
        bsEditConfigCustomScrape.classList.add("selected-state");
        // Display the custom scrape box fields
        bsEditConfigXPATH.style.display = "block";
    }
})

// edit: adding xpath
bsEditConfigXPATHAdd.addEventListener('click', function(){
    console.log(bsEditConfigXPATHInput.value)
    // addXpathInputs();
    addXpathInputs(editXpathTracker, "edit-add-xpath-input", bsEditConfigXPATHInput, bsEditConfigXPATH, "edit-delete-xpath");
    console.log(editXpathTracker["list"]);
})


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
bsEditConfigSave.addEventListener("click", function () { 
    console.log("Updating customisation ")
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
    // if (!currentPSCConfigs.hasOwnProperty(url)) {
        
    // }
    // removeFromStorage("bsc");
})





// ADD CONFIG


// Add multiple xpath input boxes

// var xpathInputCounter = 0;
// var xpathInputList = [];
// function addXpathInputs() {
//     var newInputBox = document.createElement("input");
//     var deleteNewInputBox = document.createElement("button");
    
//     xpathInputCounter += 1;
//     let idAttrValue = "add-xpath-input"+xpathInputCounter;
//     xpathInputList.push(idAttrValue);

//     newInputBox.setAttribute('type', "text");
//     newInputBox.setAttribute('id', idAttrValue);
//     newInputBox.value = bsAddConfigXPATHInput.value;

//     deleteNewInputBox.setAttribute('id', "delete-xpath"+xpathInputCounter);
//     deleteNewInputBox.textContent = "Delete";

//     deleteNewInputBox.addEventListener("click", function (param) { 

//         let index = xpathInputList.indexOf(idAttrValue);

//         if (index !== -1) { xpathInputList.splice(index, 1) }

//         let parent = newInputBox.parentNode;
//         parent.removeChild(newInputBox);                   
//         parent.removeChild(deleteNewInputBox);
//     })

//     bsAddConfigXPATH.append(newInputBox);
//     bsAddConfigXPATH.append(deleteNewInputBox);

//     // bsAddConfigXPATH
// }

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
    // addXpathInputs();
    addXpathInputs(xpathTracker, "add-xpath-input", bsAddConfigXPATHInput, bsAddConfigXPATH, "delete-xpath");
    console.log(xpathTracker["list"]);
})


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

loadUserConfigs('urllist').then((result) => {
    console.log('urllist: ', result);
})

function updateURLLIST(url, builder, oldUrl=null) {
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
        if (oldUrl) {
            console.log(oldUrl);
            console.log("OLDURLLLLLL");
            delEntryURLLIST(oldUrl);
        }
    })
}

function delEntryURLLIST(url) { 
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

        saveToStorage({'urllist' : result});

        console.log(result);
    })
}


// Save new ADDED configuration 
var bsAddConfigSave = document.getElementById("bs-add-config-save");
bsAddConfigSave.addEventListener("click", function () { 
    console.log("Saving new ADDED customisation ")
    var [url, builder] = bsAddConfig(bsAddConfigURL, view, xpathTracker, selectedScrapeOption);
    // let url = Object.keys(builder)[0];
    console.log("url: ", url);
    // console.log(Object.values(builder));
    // currentPSCConfigs[url] = builder;
    console.log(currentPSCConfigs);


    updateURLLIST(url, builder);

    currentPSCConfigs[url] = builder;


    console.log("yes sir: ", currentPSCConfigs);
    saveToStorage({"bsc" : currentPSCConfigs});

    // if (!currentPSCConfigs.hasOwnProperty(url)) {
        
    // }
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


