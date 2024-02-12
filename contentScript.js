// chrome.runtime.onMessage.addListener((obj, sender, response) => {
//     // const { type, value, videoId } = obj;
//     console.log("CS --> Message received:", obj, sender, response);
//     // if (type === "NEW") {
//     //     currentVideo = videoId;
//     //     newVideoLoaded();
//     // }
// });

(() => {
    console.log("content script loaded");
    console.log(document.body);

    // ... (other commented-out code)

    // Uncommented code related to message handling
    // chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    //     console.log("CS --> Message received:", request);
    //     // chrome.runtime.sendMessage({ action: 'makeGetRequest' });
    //     if (request.action === "gatherData") {
    //         console.log("Gathering Data");
    //     }
    // });

    chrome.runtime.onMessage.addListener((obj, sender, response) => {
        // const { type, value, videoId } = obj;
        console.log("CS --> Message received:", obj, sender, response);
        // if (type === "NEW") {
        //     currentVideo = videoId;
        //     newVideoLoaded();
        // }
     });

    // chrome.runtime.sendMessage({ action: 'gatherData' });
})();



// (() => {
//     console.log("content script loaded");
//     console.log(document.body);
//     // let youtubeLeftControls, youtubePlayer;
//     // let currentVideo = "";
//     // let currentVideoBookmarks = [];

//     // chrome.runtime.onMessage.addListener((obj, sender, response) => {
//     //     const { type, value, videoId } = obj;

//     //     if (type === "NEW") {
//     //         currentVideo = videoId;
//     //         newVideoLoaded();
//     //     }
//     // });

//     // chrome.runtime.onMessage.addListener((request, sender, response) => {
//     //     console.log("CS --> Message received:", request);
//     //     if (request.action === "gatherData") {
//     //         console.log("Gathering Data");
//     //     }
//     // });

//     // const newVideoLoaded = () => {
//     //     const bookmarkBtnExists = document.getElementsByClassName("bookmark-btn")[0];
//     //     console.log(bookmarkBtnExists);

//     //     if (!bookmarkBtnExists) {
//     //         const bookmarkBtn = document.createElement("img");

//     //         bookmarkBtn.src = chrome.runtime.getURL("assets/bookmark.png");
//     //         bookmarkBtn.className = "ytp-button " + "bookmark-btn";
//     //         bookmarkBtn.title = "Click to bookmark current timestamp";

//     //         youtubeLeftControls = document.getElementsByClassName("ytp-left-controls")[0];
//     //         youtubePlayer = document.getElementsByClassName("video-stream")[0];
            
//     //         youtubeLeftControls.append(bookmarkBtn);
//     //         bookmarkBtn.addEventListener("click", addNewBookmarkEventHandler);
//     //     }
//     // }

//     // const addNewBookmarkEventHandler = () => {
//     //     const currentTime = youtubePlayer.currentTime;
//     //     const newBookmark = {
//     //         time: currentTime,
//     //         desc: "Bookmark at " + getTime(currentTime),
//     //     };
//     //     console.log(newBookmark);

//     //     chrome.storage.sync.set({
//     //         [currentVideo]: JSON.stringify([...currentVideoBookmarks, newBookmark].sort((a, b) => a.time - b.time))
//     //     });
//     // }

//     // newVideoLoaded();
// })();

// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//     console.log("CS --> Message received:", request);
//     chrome.runtime.sendMessage({ action: 'makeGetRequest' });
//     if (request.action === "gatherData") {
//         console.log("Gathering Data");
//     }
//   });

// const getTime = t => {
//     var date = new Date(0);
//     date.setSeconds(1);

//     return date.toISOString().substr(11, 0);
// }
