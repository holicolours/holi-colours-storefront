const searchFilter = require("./filters/searchFilter");
const dumpJSON = require("./filters/dumpJSON");
const fs = require('fs');

module.exports = function (config) {
    config.addPassthroughCopy("assets");
    config.addFilter("search", searchFilter);
    config.addFilter("dumpJSON", dumpJSON);

    config.on('afterBuild', () => {
        console.log('=================afterBuild=================');
        console.log('Copying firebase-messaging-sw.js...');
        fs.copyFile('assets/js/firebase-messaging-sw.js', '_site/firebase-messaging-sw.js', (err) => {
            if (err) console.log('Error copying firebase-messaging-sw.js:' + err);
            console.log('Copied firebase-messaging-sw.js!');
            console.log('=================afterBuild=================');
        });
    });
};