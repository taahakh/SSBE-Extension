chrome.runtime.sendMessage({ action: 'configRequest', to: "settings" });

var view = null;

function buildSummaryConfigs(data) {
  console.log(data);
  view = new SummaryCustomisationView(data);
  let config = view.controller;
  return config;
}