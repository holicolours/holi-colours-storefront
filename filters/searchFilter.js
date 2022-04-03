const elasticlunr = require("elasticlunr");

module.exports = function(collection) {
  var index = elasticlunr(function() {
    this.setRef("id");
    this.addField("name");
    this.addField("sku");
    this.addField("categories");
  });

  collection.forEach(product => {
    index.addDoc({
      id: product.id,
      name: product.name,
      sku: product.sku,
      categories: product.categories
    });
  });

  return index.toJSON();
};