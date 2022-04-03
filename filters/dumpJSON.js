module.exports = function(collection) {
  return escape(JSON.stringify(collection));
};