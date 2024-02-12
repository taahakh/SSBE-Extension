const getF = document.getElementById('getButton');

getF.addEventListener('click', async () => {
  console.log('GET Request');
  chrome.runtime.sendMessage({ action: 'makeGetRequest' });
});

const postF = document.getElementById('postButton');

postF.addEventListener('click', async () => {
  console.log('Starting POST Request process');
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "gatherData", usingXpath: false});
    });
});