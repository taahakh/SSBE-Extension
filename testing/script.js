// // Example current webpage URL
// var currentURL = 'https://www.example.com/path1';

// // List of example URLs to check
// var urlList = [
//     'https://www.example.com/path1',
//     'https://www.example.com/path1/other',
//     'https://www.example.com/path1/more/extended',
//     'https://www.example.com/path1/path2',
//     'https://www.example.com/otherpath',
//     'https://www.anotherexample.com/somepath'
// ];

// // Function to check if a URL has extended paths, excluding direct paths in the list
// function hasExtendedPaths(url, urlList) {
//     // Exclude direct paths from the list
//     var excludedPaths = urlList.filter(path => path !== url);

//     // Escape special characters in the excluded paths for regex
//     var escapedExcludedPaths = excludedPaths.map(path => path.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));

//     // Construct the regex pattern
//     var pattern = new RegExp('^' + escapedExcludedPaths.join('|') + '(?:\/.*)?$');

//     return !pattern.test(url);
// }

// // Check each URL in the list, excluding direct paths in the list
// for (var i = 0; i < urlList.length; i++) {
//     var currentURLMatches = hasExtendedPaths(urlList[i], urlList);
//     console.log(urlList[i], ":", currentURLMatches);
// }

// const pattern = new URLPattern({ pathname: "/testing/index.html/books" });
// console.log(pattern.test("http://127.0.0.1:5500/testing/index.html/books/asdasd")); // true
// console.log(pattern.exec("https://example.com/books").pathname.groups); // {}

function findClosestMatch(currentUrl, urlList) {
    const currentPath = new URL(currentUrl).pathname;

    let closestMatch = null;
    let maxMatchLength = 0;

    for (const url of urlList) {
        const parsedUrl = new URL(url);
        const path = parsedUrl.pathname;

        const commonPrefix = currentPath.startsWith(path) ? path : '';

        if (commonPrefix.length > maxMatchLength) {
            maxMatchLength = commonPrefix.length;
            closestMatch = url;
        }
    }

    return closestMatch;
}

// Example usage:
// const currentSiteUrl = 'https://www.example.com/path2/other/yes';
const currentSiteUrl = 'https://www.example.com/';
const urlList = ['https://www.example.com/path1','https://www.example.com/path2' , 'https://www.example.com/path1/other'];

const closestMatch = findClosestMatch(currentSiteUrl, urlList);
console.log(`Closest match: ${closestMatch}`);