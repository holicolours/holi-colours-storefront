const elasticlunr = require("elasticlunr");

module.exports = function(collection) {
  var index = elasticlunr(function() {
    this.addField("name");
    this.addField("sku");
    this.setRef("id");
  });

  collection.forEach(product => {
    index.addDoc({
      id: product.id,
      name: product.name,
      sku: product.id
    });
  });

  return index.toJSON();
};