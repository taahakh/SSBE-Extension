// background.js
// const CHATGPT_API_KEY = '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';
const CHATGPT_HOST_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const Message = Object.freeze({
  SUMMARISE: 0,
  GATHERDATA: 1,
})
var BS_API_KEY = "";
var BS_HOST = ""

// ---------------------------------------------------------------------
// Heartbeat - keep background.js service worker alive
// Reference -  https://developer.chrome.com/docs/extensions/develop/migrate/to-service-workers
let heartbeatInterval;

async function runHeartbeat() {
  await chrome.storage.local.set({ 'last-heartbeat': new Date().getTime() });
}

async function startHeartbeat() {
  // Run the heartbeat once at service worker startup.
  runHeartbeat().then(() => {
    // Then again every 20 seconds.
    heartbeatInterval = setInterval(runHeartbeat, 20 * 1000);
  });
}

async function stopHeartbeat() {
  clearInterval(heartbeatInterval);
}

async function getLastHeartbeat() {
  return (await chrome.storage.local.get('last-heartbeat'))['last-heartbeat'];
}

// ---------------------------------------------------------------------

function saveToStorage(ctx_obj) {
  chrome.storage.local.set(ctx_obj, function() {
    console.log("Storage Item Saved");
  });
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

var abortController = new AbortController();

//  ---------------------------------------------------------------------

chrome.commands.onCommand.addListener(function (command) {
  switch(command) {
    case 'summarise-page':
      console.log("Shortcut - Summarise Page");
      chrome.browserAction.openPopup();
      // chrome.windows.create({
      //   'url': 'popup.html',
      //   'type': 'popup',
      //   'width': 300,
      //   'height': 200
      // });
      chrome.tabs.create({url: 'popup.html'})
      break;
    case 'summarise-selected':
      console.log("Shortcut - Get Selected text to summarise");
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "getSelectedText" });
      });
      // chrome.runtime.sendMessage({ action: 'getSelectedText' });
      // chrome.browserAction.openPopup();
      break;
  }
})



chrome.tabs.query({currentWindow: true, active: true}, function(tabs){
  console.log(tabs[0].url);
  console.log(tabs[0].id);
  my_tabid=tabs[0].id;
}); 

chrome.runtime.onInstalled.addListener(function() {
  console.log('Extension Installed');
});

var usrSelectedText = "";

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  console.log('B: Message received:', request);
  console.log('B: Sender:', sender.tab);

  switch (request.action) { 

    case 'makeGetRequest':
      console.log('Background.js - Making GET Request');
      makeGetRequest();
      chrome.runtime.sendMessage({ action: 'gatherData' });
      break;
    case 'customisationConfigRequest':
      console.log('Background.js - Config Request');
      makeGetRequest('/jsonfile/sum_customisation', 'customisationConfigResponse', request.to);
      break;
    case 'summarise':
      console.log("Background.js - Data to summarise: ", request.data);
      sendMessageToPopup({ action: "contextualMessage",  message : "Summarising..." , order : 1});
      if (request.for === "bs") {
        summariseRequest({'text': request.data, 'customisation': request.customisation, 'extractedType': request.extractedType});
      }
      else {
        chatgptRequest(request.data, request.prompt);
      }
      // sendMessageToPopup({ action: 'summaryResponse', data: "SUMMARY" });
      // chatgptRequest("What are the tallest buildings in the world?");
      return;
      // break;
    case 'signup':
      authRequest(request.host, '/auth/signup', request.auth);
      break;
    case 'login':
      authRequest(request.host, '/auth/login', request.auth);
      break;
    case 'retrieveSelectedText':
      // if ('data' in request) {
      usrSelectedText = request.data;
      // }
      // Try and send to POPUP if it is opened
      // chrome.runtime.sendMessage({ action: 'userSelectedText', data : usrSelectedText });
      break;
    case 'homeGetSelectedText':
      chrome.runtime.sendMessage({ action: 'userSelectedText', data : usrSelectedText });
      usrSelectedText = "";
      break;
    // NOT USED ANYMORE
    case 'loadUserConfigs':
      console.log('Background.js: Loading user configs');
      loadUserConfigs(request.config).then(data => {
        console.log("WHAT DO I WANT :", request.config , ' Data : ', data);
        // setTimeout(() =>{
          sendResponse({ response : data });
        // }, 600);
      })
      return true;
      // break;
    case 'savePopupCtx':
      console.log("Background.js - Saving Popup Context");
      saveToStorage(request.data);
      break;
  }

  // sendResponse();
});

async function summariseRequest(data) {
  data = JSON.stringify(data);
  
  const url = 'http://127.0.0.1:5000/servicemanager/summarise';
  
  try {

    startHeartbeat();

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: data
    });

    if (response.ok) {
      const result = await response.json();
      // pollSummaryRequest(abortController);
      console.log('POST request successful:', result);
      sendMessageToPopup({ action: 'summaryResponse', message: 'Summarisation success!', data: result });
    } else {
      console.error('POST request failed:', response.status, response.statusText);
      sendMessageToPopup({ action: 'summaryResponse', message: 'Summarisation failed!', data: "failed" });
    }
  } catch (error) {
    console.error('An error occurred during the POST request:', error);
    sendMessageToPopup({ action: 'summaryResponse', message: 'There was an error with the summarisation request.', data: "error" });
  }

  stopHeartbeat();
}

function makeGetRequest(endpoint='/jsonfile', messageAction=null, to=null) {
  console.log('GET Request');

  loadUserConfigs('auth').then(data => {
    if (data.hasOwnProperty('bs_api_key')) {
      BS_API_KEY = data['bs_api_key'];
      BS_HOST = data['bs_host'];
    }

    console.log(data['bs_api_key'], data['bs_host'])

    var headers = {
      'Content-Type': 'application/json'
    } 

    if (BS_API_KEY !== null && 
        BS_API_KEY !== "" && 
        BS_API_KEY !== undefined && 
        BS_HOST !== "" && 
        BS_HOST !== null && 
        BS_HOST !== undefined) 
    {
      headers['Authorization'] = "Bearer " + BS_API_KEY;
    } 
    else {
      // SEND MESSAGE TO WHOM EVER
      // POPUP - CTX
      sendMessageToPopup({ action: messageAction, 
                           message: "Must connect to service! Go to settings to connect.", 
                           data: null, to : to });
      return;
    }
    console.log('host: '+ BS_HOST + ' endpoint: ' + endpoint + " api-key: " +  BS_API_KEY);
    fetch(BS_HOST+endpoint, { 
      method: 'GET',
      headers: headers
    }).then(response => response.json())
      .then(data => {
        // if (messageAction) {
        //   sendMessageToPopup({ action: messageAction, data: data });
        // }
        // Should be messageAction && to
        if (messageAction) {
          sendMessageToPopup({ action: messageAction,
                               message: "Connected to service!", 
                               data: data, to : to });
        }
        console.log('GET Response:', data);
      })
      .catch(error => {
        console.error('GET Error:', error)
        sendMessageToPopup({ action: messageAction, 
                             message: "Error connecting to service. Please check connection!", 
                             data: null, to : to 
                           });
      });

  })


}

function authRequest(host, endpoint, data) {
  console.log(host, endpoint, data, BS_API_KEY);
  sendRequest(host, endpoint, 'POST', data, BS_API_KEY).then(
    (response) => {
      console.log('AUTHINGGGGG222222222ggggggg: ', response);
      if (response instanceof Error) {
        chrome.runtime.sendMessage({ action: "bsAuthMessageStatus", message : 'Cannot find Host!' });
        return;
      }
      loadUserConfigs('auth').then(data => {
        console.log('AUTHINGGGGG');
        if (response.hasOwnProperty('api_key')) {
          console.log('AUTHINGGGGG222222222');
          BS_API_KEY = response['api_key'];
          BS_HOST = host;
          data['bs_api_key'] = BS_API_KEY;
          data['bs_host'] = BS_HOST;
          console.log(BS_API_KEY, BS_HOST);
        }
        chrome.runtime.sendMessage({ action: "bsAuthMessageStatus", message : response['message'] });
        saveToStorage({'auth' : data});
      })

      console.log(response);
    }
  ).catch((error) => {
    console.log(error);
    chrome.runtime.sendMessage({ action: "bsAuthMessageStatus", message : error });
  })
}

async function sendRequest(host, endpoint, method, data=null, auth=null) {
  console.log(host, endpoint, method, data, auth)
  var headers = {
    'Content-Type': 'application/json'
  }
  console.log(auth);
  if (auth !== null || auth !== "") {
    console.log("YESSSS SIRRRRR");
    headers["Authorization"] = "Bearer " + auth;
  }

  console.log("Headers: ", headers)

  try {
    const response  = await fetch(host+endpoint, { 
      method: method,
      headers: headers,
      body : data
    })
    const val = await response.json();
    return val;
  } catch (error) {
    return error;
  }

}

async function chatgptRequest(data, prompt) {
  prompt = 'ONLY THE SUMMARY AND NOTHING ELSE, HERE IS THE PROMPT AND CONTENT TO SUMMARISE: ' + prompt;
  chunk = JSON.parse(data)['text']
  console.log('Background.js - ChatGPT Request, Chunk length: ', chunk.length);


  var res = await loadUserConfigs('auth');
  console.log('Background.js - ChatGPT Request, Auth: ', res);

  var host = null;
  var key = null;

  if (res.hasOwnProperty('co_api_key')) {
    if (res['co_api_key'] === "") {
      // Send message that this needs to be filled in
      return;
    } else {
      key = res['co_api_key'];
    }
  } else {
    // Send message that this needs to be filled in
    return;
  }

  if (res.hasOwnProperty('co_host')) {
    res['co_host'] === "" ? host = CHATGPT_HOST_ENDPOINT : host = res['co_host'];
  }

  var responses = [];
  for (var i=0; i<chunk.length; i++) {
    complete_prompt = prompt.replace(/{content}/g, chunk[i]);
    console.log('Background.js - ChatGPT Request, Chunk ${i}: ', complete_prompt);
    var coRes = await _chatgptRequest(complete_prompt, host, key)
    responses.push(coRes);
  }

  combined = responses.map((res) => res.choices[0].message.content).join(' ');
  // combined = "fdsfsdfs";
  sendMessageToPopup({ action: 'summaryResponse', data: {data : combined} });

}

async function _chatgptRequest(data, host, key) {
    var res = await fetch(host, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + key,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{'role': 'user', 'content': data}],
      })
    })

    var response = await res.json();
    return response;
}


function embedWithPrompt(text, prompt) {
  return text.replace('{content}', prompt);
}

function sendMessageToCS(message) {
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    chrome.tabs.sendMessage(tabs[0].id, message);
  });
}

function sendMessageToPopup(message) {
  chrome.runtime.sendMessage(message);
}