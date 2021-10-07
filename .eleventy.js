const searchFilter = require("./filters/searchFilter");

module.exports = function (config) {
    config.addPassthroughCopy("assets");
    config.addFilter("search", searchFilter);
};