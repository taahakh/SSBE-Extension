// background.js
const CHATGPT_API_KEY = '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'
const Message = Object.freeze({
  SUMMARISE: 0,
  GATHERDATA: 1,
})
// var popupStorageContext = null;

// function loadPersistantStorage(ctx_name) {
//   storageItem = null;
//   chrome.storage.local.get([ctx_name], function(items){
//     storageItem = items;
//     console.log("Storage Item - Inner: ", storageItem);
//   });
// }

// function saveToStorage(ctx_obj) {
//   chrome.storage.local.set(ctx_obj, function() {
//     console.log("Storage Item Saved");
//   });
// }

// function startupLoadPopupStorageCtx() { 
//   chrome.storage.local.get(["popupStorageContext"], function(items){
//     popupStorageContext = items;
//     chrome.runtime.sendMessage({ action: 'loadPopupCtx', data: popupStorageContext});
//     console.log("startupLoadPopupStorageCtx");
//   });
// }


// chrome.runtime.onStartup.addListener(function () {
//   console.log("onStartup");
//   startupLoadPopupStorageCtx();
// });

//  ---------------------------------------------------------------------


chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
  console.log(tabs[0].url);
  console.log(tabs[0].id);
  my_tabid=tabs[0].id;
}); 

chrome.runtime.onInstalled.addListener(function() {
  console.log('Extension Installed');
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('B: Message received:', request);
  console.log('B: Sender:', sender.tab);

  switch (request.action) { 

    case 'makeGetRequest':
      console.log('Background.js - Making GET Request');
      makeGetRequest();
      chrome.runtime.sendMessage({ action: 'gatherData' });
      break;
    case 'configRequest':
      console.log('Background.js - Config Request');
      makeGetRequest('jsonfile/sum_customisation', 'configResponse');
      break;
    case 'summarise':
      console.log("Background.js - Data to summarise: ", request.data);
      summariseRequest({'text': request.data, 'customisation': request.customisation});
      // sendMessageToPopup({ action: 'summaryResponse', data: "SUMMARY" });
      // chatgptRequest("What are the tallest buildings in the world?");
      break;
    case 'savePopupCtx':
      console.log("Background.js - Saving Popup Context");
      saveToStorage(request.data);
      break;
  }

  sendResponse();
});

async function summariseRequest(data) {
  data = JSON.stringify(data);
  
  const url = 'http://127.0.0.1:5000/servicemanager/summarise';
  // const url = 'http://127.0.0.1:5000/servicemanager/scrape';
  
  try {

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data
    });

    if (response.ok) {
      const result = await response.json();
      console.log('POST request successful:', result);
      sendMessageToPopup({ action: 'summaryResponse', data: result });
    } else {
      console.error('POST request failed:', response.status, response.statusText);
      sendMessageToPopup({ action: 'summaryResponse', data: "failed" });
    }
  } catch (error) {
    console.error('An error occurred during the POST request:', error);
    sendMessageToPopup({ action: 'summaryResponse', data: "error" });
  }
}

function makeGetRequest(endpoint='jsonfile', messageAction=null) {
  console.log('GET Request');
  fetch('http://127.0.0.1:5000/'+endpoint, { 
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    } 
  }).then(response => response.json())
    .then(data => {
      if (messageAction) {
        sendMessageToPopup({ action: messageAction, data: data });
      }
      console.log('GET Response:', data);
    })
    .catch(error => console.error('GET Error:', error));
}


function chatgptRequest(data) {
  fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + CHATGPT_API_KEY,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [{'role': 'user', 'content': data}],
    })
  }).then(response => {console.log(response.json());})
  .then(response => sendMessageToCS({ action: 'summariseResponse', data: response.json() }))
}

function sendMessageToCS(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, message);
  });
}

function sendMessageToPopup(message) {
  chrome.runtime.sendMessage(message);
}