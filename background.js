// chrome.tabs.onUpdated.addListener((tabId, tab) => {
//     // if (tab.url && tab.url.includes("youtube.com/watch")) {
//     //   const queryParameters = tab.url.split("?")[1];
//     //   const urlParameters = new URLSearchParams(queryParameters);
  
//     //   chrome.tabs.sendMessage(tabId, {
//     //     type: "NEW",
//     //     videoId: urlParameters.get("v"),
//     //   });
//     // }
//   });

// background.js

chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
  console.log(tabs[0].url);
  console.log(tabs[0].id);
  my_tabid=tabs[0].id;
}); 

// console.log(my_tabid);

chrome.runtime.onInstalled.addListener(function() {
  console.log('Extension Installed');
});

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('B: Message received:', request);
  console.log('B: Sender:', sender.tab);
  // if (request.action === 'makeGetRequest' && sender.tab) {
  //   chrome.scripting.executeScript({
  //     target: { tabId: sender.tab.id }, 
  //     function: makeGetRequest,
  //   });
  // }
  if (request.action === 'makeGetRequest') {
    makeGetRequest();
    chrome.runtime.sendMessage({ action: 'gatherData' });
  }

  sendResponse();
});

function makeGetRequest() {
  console.log('GET Request');
  fetch('http://127.0.0.1:5000/jsonfile')
    .then(response => response.json())
    .then(data => {
      console.log('GET Response:', data);
    })
    .catch(error => console.error('GET Error:', error));
}


