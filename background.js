// background.js

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
    case 'summarise':
      console.log("Background.js - Data to summarise: ", request.data);
      summariseRequest(request.data);
      break;
  }

  sendResponse();
});

async function summariseRequest(data) {

  // const url = 'http://127.0.0.1:5000/servicemanager/summarise';
  const url = 'http://127.0.0.1:5000/servicemanager/scrape';
  
  try {

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data
    });

    if (response.ok) {
      const result = await response.json();
      console.log('POST request successful:', result);
      sendMessageToCS({ action: 'summariseResponse', data: result });
    } else {
      console.error('POST request failed:', response.status, response.statusText);
      sendMessageToCS({ action: 'summariseResponse', data: "failed" });
    }
  } catch (error) {
    console.error('An error occurred during the POST request:', error);
    sendMessageToCS({ action: 'summariseResponse', data: "error" });
  }
}

function makeGetRequest() {
  console.log('GET Request');
  fetch('http://127.0.0.1:5000/jsonfile')
    .then(response => response.json())
    .then(data => {
      console.log('GET Response:', data);
    })
    .catch(error => console.error('GET Error:', error));
}

function sendMessageToCS(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, message);
  });
}