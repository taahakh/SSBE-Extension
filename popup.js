// popup.js

// const getF = document.getElementById('getButton').addEventListener('click', makeGetRequest);
// const postF = document.getElementById('postButton').addEventListener('click', makePostRequest);

// const getF = document.getElementById('getButton')
// const postF = document.getElementById('postButton')

// popup.js
const getF = document.getElementById('getButton');

getF.addEventListener('click', async () => {
  console.log('GET Request');
  chrome.runtime.sendMessage({ action: 'makeGetRequest' });
});

const postF = document.getElementById('postButton');

postF.addEventListener('click', async () => {
  console.log('POST Request');
//   chrome.runtime.sendMessage({ action: 'gatherData' });
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "gatherData" });
    });
});


// getF.addEventListener('click', async () => {

//     console.log('GET Request');

//     const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
//     chrome.scripting.executeScript({
//         target: { tabId: tab.id },
//         function: makeGetRequest,
//     });
// });

// function makeGetRequest() {
//   chrome.scripting.executeScript({
//     function: () => {
//       fetch('http://127.0.0.1:5000/jsonfile')
//         .then(response => response.json())
//         .then(data => {
//           console.log('GET Response:', data);
//           alert('GET Response:\n' + JSON.stringify(data, null, 2));
//         })
//         .catch(error => console.error('GET Error:', error));
//     },
//   });
// }

// function makePostRequest() {
//   chrome.scripting.executeScript({
//     function: () => {
//       fetch('https://jsonplaceholder.typicode.com/posts', {
//         method: 'POST',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify({
//           title: 'foo',
//           body: 'bar',
//           userId: 1,
//         }),
//       })
//         .then(response => response.json())
//         .then(data => {
//           console.log('POST Response:', data);
//           alert('POST Response:\n' + JSON.stringify(data, null, 2));
//         })
//         .catch(error => console.error('POST Error:', error));
//     },
//   });
// }
