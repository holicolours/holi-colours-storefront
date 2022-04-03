let databaseURL = null;
let idToken = null;
if (window.location.host == "localhost") {
  databaseURL = "https://dev-holi-colours-default-rtdb.asia-southeast1.firebasedatabase.app";
} else {
  databaseURL = "https://holi-colours-jewellery-default-rtdb.asia-southeast1.firebasedatabase.app";
}

var database = {
  relogin: async function () {
    idToken = null;
    await database.authenticate();
  },
  authenticate: async function () {
    if (!idToken) {
      while (firebase.auth().currentUser === null) {
        await new Promise(resolve => requestAnimationFrame(resolve))
      }
      idToken = await firebase.auth().currentUser.getIdToken().then(function (token) {
        return token;
      }).catch(function (error) {
        console.log('Error authenticating!', error);
      });
    }
  },
  read: async function (apiURL, auth = false) {
    if (auth) {
      await database.authenticate();
      apiURL += `?auth=${idToken}`;
    }
    let result = await fetch(apiURL)
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw response;
        }
      })
      .catch((error) => {
        console.log('Error!. Response: ', error);
      });
    return result;
  },
  put: async function (apiURL, data, auth = false) {
    if (auth) {
      await database.authenticate();
      apiURL += `?auth=${idToken}`;
    }
    let result = await fetch(apiURL, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw response;
        }
      })
      .catch((error) => {
        console.log('Error!. Response: ', error);
      });
    return result;
  },
  update: async function (apiURL, data, auth = false) {
    if (auth) {
      await database.authenticate();
      apiURL += `?auth=${idToken}`;
    }
    let result = await fetch(apiURL, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw response;
        }
      })
      .catch((error) => {
        console.log('Error!. Response: ', error);
      });
    return result;
  },
  post: async function (apiURL, data, auth = false) {
    if (auth) {
      await database.authenticate();
      apiURL += `?auth=${idToken}`;
    }
    let result = await fetch(apiURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          throw response;
        }
      })
      .catch((error) => {
        console.log('Error!. Response: ', error);
      });
    return result;
  },
  checkSubscription: async function (topic, token) {
    let apiURL = `${databaseURL}/topics/${topic}/${token}.json`;
    let subscription = await database.read(apiURL, true);
    return subscription ? true : false;
  },
  getStock: async function (sku) {
    let apiURL = `${databaseURL}/stock/${sku}.json`;
    let stockQuantity = await database.read(apiURL);
    return stockQuantity;
  },
  getAllReviews: async function (productId) {
    let apiURL = `${databaseURL}/products/${productId}/reviews.json`;
    let reviews = await database.read(apiURL);
    return reviews;
  },
  getReview: async function (reviewId) {
    let apiURL = `${databaseURL}/reviews/${reviewId}.json`;
    let review = await database.read(apiURL);
    return review;
  },
  isUserExists: async function (uid) {
    let apiURL = `${databaseURL}/users/${uid}/email.json`;
    let user = await database.read(apiURL, true);
    return user ? true : false;
  },
  getUser: async function (uid) {
    let apiURL = `${databaseURL}/users/${uid}.json`;
    let user = await database.read(apiURL, true);
    return user;
  },
  getUserOrders: async function (uid) {
    let apiURL = `${databaseURL}/users/${uid}/orders.json`;
    let userOrders = await database.read(apiURL, true);
    return userOrders;
  },
  getOffers: async function () {
    let apiURL = `/api/offers.json`;
    let offers = await database.read(apiURL, false);
    return offers;
  },
  getOrder: async function (orderId) {
    let apiURL = `${databaseURL}/orders/${orderId}.json`;
    let order = await database.read(apiURL, true);
    return order;
  },
  getProductVariant: async function (product, vid, userCart, freebie = false) {
    let pid = product.id;
    let variant = product.variants.filter(v => v.id == vid)[0];

    if (!variant) {
      console.warn(`Variant ${vid} not found`);
      return null;
    }

    let accessories = [];
    accessories = product.accessories.filter(v => {
      return userCart.accessories && userCart.accessories.length > 0 && userCart.accessories.includes(v.id);
    });
    if (Array.isArray(accessories) && accessories.length == 0) {
      let defaultAccessory = product.accessories.filter(v => v.price == 0)
      if (Array.isArray(defaultAccessory) && defaultAccessory.length > 0) {
        accessories = [defaultAccessory[0]];
      } else {
        accessories = [];
      }
    }
    if (Array.isArray(accessories) && accessories.length > 0) {
      let accessoriesPrice = accessories.map(v => v.price).reduce((partialSum, a) => partialSum + a, 0);
      if (accessoriesPrice) {
        variant.price += accessoriesPrice;
      }
    }

    if (freebie) {
      variant.price = 0;
    }

    let variantOptions = variant.options.map((o) => ({
      attribute: o.optionName.optionName,
      value: o.optionValue.optionValue
    }));

    let stockQuantity = await database.getStock(variant.sku.sku);

    let productObject = {
      id: product.id,
      vid: vid,
      sku: variant.sku.sku,
      name: product.name,
      fullName: variant.title != 'Simple Product' ? `${product.name} (${variant.title})` : product.name,
      slug: product.slug,
      image: variant.image ? variant.image.publicUrl : product.variants[product.defaultVariantIndex].image.publicUrl,
      price: variant.price,
      salePercentage: variant.salePercentage,
      quantity: userCart.quantity,
      weight: variant.weight,
      stockQuantity: stockQuantity,
      variantOptions: variantOptions,
      accessories: accessories,
      freebie: freebie
    };

    return productObject;
  },
  getUserCart: async function (uid) {
    let apiURL = `${databaseURL}/carts/${uid}.json`;
    let userCart = await database.read(apiURL, true);
    let cart = {
      products: [],
      quantity: 0,
      subTotal: 0,
      shipping: 0,
      discount: 0,
      total: 0,
      weight: 0,
      isOnSale: false,
      freeShipping: false,
      offerCoupon: null
    };

    for (var pid in userCart) {
      let product = await database.getProduct(pid);

      if (!product) {
        console.warn(`Product ${pid} not found!`);
        continue;
      }

      for (var vid in userCart[pid]) {
        let productObject = await database.getProductVariant(product, vid, userCart[pid][vid]);
        if (productObject) {
          cart.products.push(productObject);
          cart.quantity += productObject.quantity;
          cart.subTotal += productObject.quantity * productObject.price;
          cart.total = cart.subTotal - cart.discount;
          cart.weight += productObject.weight;
        }
      }

      if (!cart.isOnSale && product.isOnSale) {
        cart.isOnSale = true;
      }
    }
    return cart;
  },
  applyOfferToCart: async function (cart) {
    let offers;
    if (!cart.isOnSale) {
      offers = await database.getOffers();
      offers.sort(function (a, b) {
        return b.minimumItemsPerOrder - a.minimumItemsPerOrder;
      });
      console.log('Sorted Offers: ', offers);
    }

    if (!cart.isOnSale && offers && offers.length > 0) {
      offers.some(offer => {
        if (cart.quantity >= offer.minimumItemsPerOrder) {
          if (offer.freeShipping == 'Y') {
            cart.freeShipping = true;
            cart.offerCoupon = offer.couponCode;
          }
          if (offer.discountAmount > 0) {
            cart.discount += offer.discountAmount;
            cart.offerCoupon = offer.couponCode;
          }
          if (offer.freebieProducts && offer.freebieProducts.length > 0) {
            offer.freebieProducts.map(v => v.id).forEach(async pid => {
              let product = await database.getProduct(pid);
              if (!product) {
                console.warn(`Product ${pid} not found!`);
              } else {
                let productObject = await database.getProductVariant(product, product.defaultVariantId, { accessories: [], quantity: 1 }, true);
                if (productObject) {
                  cart.products.push(productObject);
                  cart.quantity += productObject.quantity;
                  cart.subTotal += productObject.quantity * productObject.price;
                  cart.weight += productObject.weight;
                }
              }
            });
            cart.offerCoupon = offer.couponCode;
          }
        }
        return cart.offerCoupon;
      });
      cart.total = cart.subTotal - cart.discount;
    }
    return cart;
  },
  checkCartStock: async function (cart) {
    cart.products.forEach(async p => {
      p.stockQuantity = await database.getStock(p.sku);
      this.checkoutLoading = false;
      if (!p.stockQuantity || p.stockQuantity <= 0) {
        alert(p.fullName + ' is not in stock!');
        return false;
      } else if (p.stockQuantity < p.quantity) {
        alert('Only ' + p.stockQuantity + ' item(s) are in stock for ' + p.fullName);
        return false;
      }
    });
    return true;
  },
  getUserWishlist: async function (uid) {
    let apiURL = `${databaseURL}/wishlist/${uid}.json`;
    let userWishlist = await database.read(apiURL, true);
    return userWishlist;
  },
  addToCart: async function (uid, pid, vid, productDetails) {
    let apiURL = `${databaseURL}/carts/${uid}/${pid}/${vid}.json`;
    let updatedCart = await database.put(apiURL, productDetails, true);
    return updatedCart;
  },
  updateCart: async function (uid, cart) {
    let apiURL = `${databaseURL}/carts/${uid}.json`;
    let updatedCart = await database.put(apiURL, cart, true);
    return updatedCart;
  },
  addToWishList: async function (uid, pid, vid, productDetails) {
    let apiURL = `${databaseURL}/wishlist/${uid}/${pid}/${vid}.json`;
    console.log(apiURL);
    console.log(productDetails);
    let updatedWishList = await database.put(apiURL, productDetails, true);
    return updatedWishList;
  },
  updateWishList: async function (uid, wishlist) {
    let apiURL = `${databaseURL}/wishlist/${uid}.json`;
    let updatedWishList = await database.put(apiURL, wishlist, true);
    return updatedWishList;
  },
  updateData: async function (data) {
    let apiURL = `${databaseURL}/.json`;
    let updated = await database.update(apiURL, data, true);
    return updated;
  },
  addNewReview: async function () {
    let apiURL = `${databaseURL}/reviews.json`;
    let newReview = await database.post(apiURL, {}, true);
    return newReview['name'];
  },
  getProduct: async function (productId) {
    let apiURL = `/api/products/${productId}.json`;
    let product = await database.read(apiURL);
    return product;
  },
  getShippingZones: async function () {
    let apiURL = `/api/shipping-zones.json`;
    let shippingZones = await database.read(apiURL);
    return shippingZones;
  }
};