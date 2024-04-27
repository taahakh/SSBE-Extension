/**
 * background.js
 * This script is responsible for handling the background tasks of the extension.
 * It listens for messages from the content script and popup script, as well as sending messages to them.
 * Handles the summarisation requests to the backend service and ChatGPT API.
 * Handles the authentication requests to the backend service.
 * Handles the GET requests to the backend service to retrieve the customisation config.
 * Manages shortcuts for the extension.
 * Manages users selected text.
 */

// background.js
// const CHATGPT_API_KEY = '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';
const CHATGPT_HOST_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const BS_HOST_ENDPOINT_SUMMARISE = "/servicemanager/summarise";

// Enum for the different messages that can be sent to the backend service
const Message = Object.freeze({
  SUMMARISE: 0,
  GATHERDATA: 1,
})

var BS_API_KEY = ""; // API key for the backend service
var BS_HOST = ""     // Host for the backend service

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
// Utility functions
// SOME THESE CODE BLOCKS ARE REPEATED IN SETTINGS.JS AND POPUP.JS DUE TO ASYNC ISSUES

/**
 * Saves the given object to the local storage using the Chrome storage API.
 *
 * @param {Object} ctx_obj - The object to be saved to the storage.
 */
function saveToStorage(ctx_obj) {
  chrome.storage.local.set(ctx_obj, function() {
    // console.log("Storage Item Saved");
  });
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

//  ---------------------------------------------------------------------

chrome.commands.onCommand.addListener(function (command) {
  switch(command) {
    case 'summarise-page':
      chrome.browserAction.openPopup();
      chrome.tabs.create({url: 'popup.html'})
      break;
    case 'summarise-selected':
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "getSelectedText" });
      });
      break;
  }
})

var usrSelectedText = "";

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  switch (request.action) { 
    // This message is used to make a GET request to retrieve the customisation config of backend service
    case 'customisationConfigRequest':
      // Endpoint, messageAction, toWhichComponent
      makeGetRequest('/jsonfile/sum_customisation', 'customisationConfigResponse', request.to);
      break;
    // Message manages the summarisation request to the different providers
    case 'summarise':
      sendMessage({ action: "contextualMessage",  message : "Summarising..." , order : 1});

      if (request.for === "bs") {
        summariseRequest({'text': request.data, 'customisation': request.customisation, 'extractedType': request.extractedType});
      }
      else {
        chatgptRequest(request.data, request.prompt);
      }

      return;
    // Backend service signup request message
    case 'signup':
      authRequest(request.host, '/auth/signup', request.auth);
      break;
    // Backend service login request message
    case 'login':
      authRequest(request.host, '/auth/login', request.auth);
      break;
    // Response message from content script with the selected text, saved here until popup requests it
    case 'retrieveSelectedText':
      usrSelectedText = request.data;
      break;
    // Message from popup to get the selected text stored in background.js, which was initially sent by content script
    case 'homeGetSelectedText':
      chrome.runtime.sendMessage({ action: 'userSelectedText', data : usrSelectedText });
      usrSelectedText = "";
      break;
  }

  sendResponse();
});

// ---------------------------------------------------------------------
// Requests

/**
 * Send a POST request to the summarisation endpoint of the backend service.
 * @param {Object} data - The data to be summarised.
 * @returns {Promise<void>} - A promise that resolves when the summarisation is complete.
 */
async function summariseRequest(data) {
  // Make data object into JSON string
  data = JSON.stringify(data);
    
  try {

    // Load the user's API key and host from storage
    // Check if there is an API key and host
    var creds = await loadUserConfigs('auth');
    if (creds.hasOwnProperty('bs_api_key')) {
      var api_key = creds['bs_api_key'];
      var host = creds['bs_host'];
    }
    else {
      sendMessage({ action: 'summaryResponse', message: 'Missing API key or Host', data: "error" });
      return;
    }

    // Start the heartbeat to keep the service worker alive
    startHeartbeat();

    const response = await fetch(host+BS_HOST_ENDPOINT_SUMMARISE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization' : 'Bearer ' + api_key},
      body: data
    });

    // POST request successful
    if (response.ok) {
      const result = await response.json();
      sendMessage({ action: 'summaryResponse', message: 'Summarisation success!', data: result });
    } 
    // POST request failed
    else {
      sendMessage({ action: 'summaryResponse', message: 'Summarisation failed!', data: "failed" });
    }

  } 
  catch (error) {
    sendMessage({ action: 'summaryResponse', message: 'There was an error with the summarisation request.', data: "error" });
  }

  // No need to keep the service worker alive anymore
  stopHeartbeat();
}

/**
 * Makes a GET request to the specified endpoint for the backend service to retrieve data.
 * Primarily used to retrieve the customisation config of the backend service.
 *
 * @param {string} [endpoint='/jsonfile'] - The endpoint to make the GET request to.
 * @param {string} [messageAction=null] - The action to be sent in the message.
 * @param {string} [to=null] - The recipient of the message.
 * @returns {void}
 */
function makeGetRequest(endpoint='/jsonfile', messageAction=null, to=null) {

  // Load the user's API key and host from storage
  loadUserConfigs('auth').then(data => {
    if (data.hasOwnProperty('bs_api_key')) {
      BS_API_KEY = data['bs_api_key'];
      BS_HOST = data['bs_host'];
    }

    // Build the headers for the GET request
    var headers = {
      'Content-Type': 'application/json'
    } 

    // Make sure there is an API key and host that has been set
    if (BS_API_KEY !== null && 
        BS_API_KEY !== "" && 
        BS_API_KEY !== undefined && 
        BS_HOST !== "" && 
        BS_HOST !== null && 
        BS_HOST !== undefined
      ) { headers['Authorization'] = "Bearer " + BS_API_KEY; } // Add auth token to the header  
    else {
      // Send message to whom ever it is intended for, set by the to parameter
      sendMessage({ action: messageAction, 
                    message: "Must connect to service! Go to settings to connect.", 
                    data: null, to : to 
                  });
      return;
    }

    // Make the GET request
    fetch(BS_HOST+endpoint, { 
      method: 'GET',
      headers: headers                    
    }).then(response => response.json()) // Parse the response as JSON
      .then(data => {                    // Handle the JSON data and send a message to the recipient           
        if (messageAction) {
          sendMessage({ action: messageAction,
                        message: "Connected to service!", 
                        data: data, to : to 
                      });
        }
      })
      .catch(error => {                  // Notify the recipient of the error
        sendMessage({ action: messageAction, 
                      message: "Error connecting to service. Please check connection!", 
                      data: null, to : to 
                    });
      });

  })


}

/**
 * Sends an authentication (login / signup) request to the backend service, used by settings.js.
 * Goal is to authenticate the user and save the API key and host to storage.
 * 
 * @param {string} host - The host to send the request to, passed to the sendRequest function.
 * @param {string} endpoint - The endpoint to send the request to, passed to the sendRequest function.
 * @param {object} data - The data to include in the request, passed to the sendRequest function.
 */
function authRequest(host, endpoint, data) {
  // POST request to the backend service using available BS_API_KEY
  sendRequest(host, endpoint, 'POST', data, BS_API_KEY).then(
    
    (response) => {
      
      // If the response an error instance, notify the user
      if (response instanceof Error) {
        chrome.runtime.sendMessage({ action: "bsAuthMessageStatus", message : 'Cannot find Host!' });
        return;
      }

      // Load the user's auth data from storage
      loadUserConfigs('auth').then(data => {
        if (response.hasOwnProperty('api_key')) {
          // Update the API key and host in the auth object
          BS_API_KEY = response['api_key'];
          BS_HOST = host;
          data['bs_api_key'] = BS_API_KEY;
          data['bs_host'] = BS_HOST;
        }

        chrome.runtime.sendMessage({ action: "bsAuthMessageStatus", message : response['message'] });
        
        // Save the updated credentials to storage
        saveToStorage({'auth' : data});
      
      })

    }

  ).catch((error) => {
    // Notify the user of the error - settings.js
    chrome.runtime.sendMessage({ action: "bsAuthMessageStatus", message : error });
  })
}


/**
 * Sends a request to the specified host and endpoint using the specified method. A helper function for the authRequest function.
 * @param {string} host - The host URL.
 * @param {string} endpoint - The endpoint URL.
 * @param {string} method - The HTTP method (e.g., GET, POST).
 * @param {Object|null} data - The data to send with the request (optional).
 * @param {string|null} auth - The authorisation token (optional).
 * @returns {Promise<any>} - A promise that resolves to the response data or rejects with an error.
 */
async function sendRequest(host, endpoint, method, data=null, auth=null) {
  var headers = {
    'Content-Type': 'application/json'
  }
  // If there is an auth token, add it to the headers
  if (auth !== null || auth !== "") {
    headers["Authorization"] = "Bearer " + auth;
  }

  // Make the requests
  try {
    const response  = await fetch(host+endpoint, { 
      method: method,
      headers: headers,
      body : data
    })

    const val = await response.json();
    return val;
  } 
  catch (error) {
    return error;
  }

}

/**
 * Makes a ChatGPT request to summarise the given data.
 * @param {string} data - The data to be summarised.
 * @param {string} prompt - The prompt for summarisation.
 * @returns {Promise<void>} - A promise that resolves when the summarisation is complete.
 */
async function chatgptRequest(data, prompt) {
  // Engineers the prompt so that it only contains the summary and what else the user wants to do
  prompt = 'ONLY THE SUMMARY AND NOTHING ELSE, HERE IS THE PROMPT AND CONTENT TO SUMMARISE: ' + prompt;
  
  // Parsing data object that contains the text to be summarised
  chunk = JSON.parse(data)['text']

  // Load the user's API key and host from storage - chatgpt/openai details
  var res = await loadUserConfigs('auth');

  var host = null;
  var key = null;

  // Check if there is an API key
  if (res.hasOwnProperty('co_api_key')) {

    // Notify the user if the API value is missing
    if (res['co_api_key'] === "") {
      sendMessage({ action: 'summaryResponse', message: 'Missing chatgpt/openai api key!', data: "failed" });
      return;
    } 
    // Set the key value
    else {
      key = res['co_api_key'];
    }

  } 
  // Notify the user if the API key is missing, where the key value is not present
  else {
    sendMessage({ action: 'summaryResponse', message: 'Missing chatgpt/openai api key!', data: "failed" });
    return;
  }

  // Check if there is a host key 
  if (res.hasOwnProperty('co_host')) {
    // Set the host value, where the default host is used if the host value is missing
    res['co_host'] === "" ? host = CHATGPT_HOST_ENDPOINT : host = res['co_host'];
  }
  else {
    // If there is no co_host key - shouldn't run though
    sendMessage({ action: 'contextualMessage', message: 'Missing Host address, using default ChatGPT host', order: 2 });
    host = CHATGPT_HOST_ENDPOINT;
  }

  // Stores all the responses from the chunks
  var responses = [];

  // Loop through the chunks and make a request for each chunk
  for (var i=0; i<chunk.length; i++) {
    // {content} is replaced with the chunk content
    var completePrompt = prompt.replace(/{content}/g, chunk[i]);
    var coRes = await _chatgptRequest(completePrompt, host, key)

    if (coRes.hasOwnProperty('error')) {
      sendMessage({ action: 'summaryResponse', message: 'Check API Key / Host values in the settings and your API usage limits.', data: "failed" });
      return;
    }

    responses.push(coRes);
  }

  // Combine all the responses text into one string
  var combined = responses.map((res) => res.choices[0].message.content).join(' ');
  
  // Send the combined response to the popup
  sendMessage({ action: 'summaryResponse', data: {data : combined}, message: 'Summarisation success!' });

}

/**
 * Makes a request to the ChatGPT API using the provided data, host, and key. A helper function for the chatgptRequest function.
 * @param {string} data - The content of the user message.
 * @param {string} host - The API endpoint URL.
 * @param {string} key - The authorisation key for accessing the API.
 * @returns {Promise<Object>} - A promise that resolves to the response from the API.
 */
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

// ---------------------------------------------------------------------
// Message Functions

/**
 * Sends a message to the other JS files.
 * @param {any} message - The message data to send, including message action.
 */
function sendMessage(message) {
  chrome.runtime.sendMessage(message);
}