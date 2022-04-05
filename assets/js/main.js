let databaseURL = null;
let idToken = null;

const devFirebaseConfig = {
  apiKey: "AIzaSyAkfxQ2E3adYmlfYOy3uhRf6ENZ6VQ5a4U",
  authDomain: "dev-holi-colours.firebaseapp.com",
  databaseURL: "https://dev-holi-colours-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "dev-holi-colours",
  storageBucket: "dev-holi-colours.appspot.com",
  messagingSenderId: "30340203484",
  appId: "1:30340203484:web:37b0125a160be9f3ba8519",
  measurementId: "G-H81HK8R7E6"
};
const prdFirebaseConfig = {
  apiKey: "AIzaSyAVKIXxd68CdLlJfzCcPtw47-dkJh2xJm0",
  authDomain: "holi-colours-jewellery.firebaseapp.com",
  projectId: "holi-colours-jewellery",
  storageBucket: "holi-colours-jewellery.appspot.com",
  messagingSenderId: "423060301267",
  appId: "1:423060301267:web:e7f2dc25f8fb0703153b26",
  databaseURL: "https://holi-colours-jewellery-default-rtdb.asia-southeast1.firebasedatabase.app/",
  measurementId: "G-LNR3MKCG8F"
};

if (window.location.host == "localhost") {
  firebase.initializeApp(devFirebaseConfig);
  databaseURL = devFirebaseConfig.databaseURL;
} else {
  firebase.initializeApp(prdFirebaseConfig);
  databaseURL = prdFirebaseConfig.databaseURL;
}

const messaging = firebase.messaging();

var commerce = {
  authenticateCustomer: async function () {
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
  deAuthenticateCustomer: function () {
    idToken = null;
  },
  read: async function (apiURL, auth = false) {
    if (auth) {
      await commerce.authenticateCustomer();
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
      await commerce.authenticateCustomer();
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
      await commerce.authenticateCustomer();
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
      await commerce.authenticateCustomer();
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
    let subscription = await commerce.read(apiURL, true);
    return subscription ? true : false;
  },
  getStock: async function (sku) {
    let apiURL = `${databaseURL}/stock/${sku}.json`;
    let stockQuantity = await commerce.read(apiURL);
    return stockQuantity;
  },
  getAllReviews: async function (productId) {
    let apiURL = `${databaseURL}/products/${productId}/reviews.json`;
    let reviews = await commerce.read(apiURL);
    return reviews;
  },
  getReview: async function (reviewId) {
    let apiURL = `${databaseURL}/reviews/${reviewId}.json`;
    let review = await commerce.read(apiURL);
    return review;
  },
  isCustomerExists: async function (uid) {
    let apiURL = `${databaseURL}/customers/${uid}/email.json`;
    let user = await commerce.read(apiURL, true);
    let result = user ? true : false;
    return result;
  },
  getUser: async function (uid) {
    let apiURL = `${databaseURL}/customers/${uid}.json`;
    let user = await commerce.read(apiURL, true);
    return user;
  },
  getUserOrders: async function (uid) {
    let apiURL = `${databaseURL}/customers/${uid}/orders.json`;
    let userOrders = await commerce.read(apiURL, true);
    return userOrders;
  },
  getOffers: async function () {
    let apiURL = `/api/offers.json`;
    let offers = await commerce.read(apiURL, false);
    return offers;
  },
  getOrder: async function (orderId) {
    let apiURL = `${databaseURL}/orders/${orderId}.json`;
    let order = await commerce.read(apiURL, true);
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

    let stockQuantity = await commerce.getStock(variant.sku.sku);

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
    let userCart;
    if (isSignedIn()) {
      let apiURL = `${databaseURL}/carts/${uid}.json`;
      userCart = await commerce.read(apiURL, true);
    } else {
      userCart = JSON.parse(window.localStorage.getItem("cart")) || {};
    }
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
      let product = await commerce.getProduct(pid);

      if (!product) {
        console.warn(`Product ${pid} not found!`);
        continue;
      }

      for (var vid in userCart[pid]) {
        let productObject = await commerce.getProductVariant(product, vid, userCart[pid][vid]);
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
      offers = await commerce.getOffers();
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
              let product = await commerce.getProduct(pid);
              if (!product) {
                console.warn(`Product ${pid} not found!`);
              } else {
                let productObject = await commerce.getProductVariant(product, product.defaultVariantId, { accessories: [], quantity: 1 }, true);
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
      p.stockQuantity = await commerce.getStock(p.sku);
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
    let userWishlist;
    if (isSignedIn()) {
      let apiURL = `${databaseURL}/wishlist/${uid}.json`;
      userWishlist = await commerce.read(apiURL, true);
    } else {
      userWishlist = JSON.parse(window.localStorage.getItem("wishlist"));
    }
    return userWishlist;
  },
  addToCart: async function (uid, pid, vid, productDetails) {
    if (uid) {
      let apiURL = `${databaseURL}/carts/${uid}/${pid}/${vid}.json`;
      let updatedCart = await commerce.put(apiURL, productDetails, true);
      return updatedCart;
    } else {
      let localCart = JSON.parse(window.localStorage.getItem("cart")) || {};
      if (!localCart[pid]) localCart[pid] = {};
      localCart[pid][vid] = productDetails;
      window.localStorage.setItem("cart", JSON.stringify(localCart));
      return true;
    }
  },
  addToWishList: async function (uid, pid, vid, productDetails) {
    if (uid) {
      let apiURL = `${databaseURL}/wishlist/${uid}/${pid}/${vid}.json`;
      let updatedWishList = await commerce.put(apiURL, productDetails, true);
      return updatedWishList;
    } else {
      let localWishList = JSON.parse(window.localStorage.getItem("wishlist")) || {};
      if (!localWishList[pid]) localWishList[pid] = {};
      localWishList[pid][vid] = productDetails;
      window.localStorage.setItem("wishlist", JSON.stringify(localWishList));
      return true;
    }
  },
  updateData: async function (data) {
    let apiURL = `${databaseURL}/.json`;
    let updated = await commerce.update(apiURL, data, true);
    return updated;
  },
  addNewReview: async function () {
    let apiURL = `${databaseURL}/reviews.json`;
    let newReview = await commerce.post(apiURL, {}, true);
    return newReview['name'];
  },
  getProduct: async function (productId) {
    let apiURL = `/api/products/${productId}.json`;
    let product = await commerce.read(apiURL);
    return product;
  },
  getShippingZones: async function () {
    let apiURL = `/api/shipping-zones.json`;
    let shippingZones = await commerce.read(apiURL);
    return shippingZones;
  }
};

function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
  let expires = "expires=" + d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}

function isSignedIn() {
  return getCookie('uid') != 'null' && getCookie('uid') != '' && getCookie('uid') != null ? true : false;
}

function setCustomerId(cid) {
  setCookie('uid', cid, 7);
}

function getCustomerId() {
  return isSignedIn() ? getCookie('uid') : null;
}

function logIn(title = 'Login or Create an Account') {
  if (isSignedIn()) {
    window.location.href = '/account/';
  } else {
    ui.start('#firebaseui-container', uiConfig);
    document.getElementById('login-modal').style.display = 'flex';
    document.getElementById('login-modal-title').innerText = title;
    if (window.location.pathname.startsWith("/cart/") || window.location.pathname.startsWith("/checkout/")) {
      document.getElementById('firebaseui-guest').style.display = 'flex';
    } else {
      document.getElementById('firebaseui-guest').style.display = 'none';
    }
  }
}

function logOut() {
  firebase.auth().signOut().then(() => {
    setCustomerId(null);
    window.location.href = '/';
  }).catch((error) => {
    console.log(error);
  });
}

var uiConfig = {
  callbacks: {
    signInSuccessWithAuthResult: async function (authResult, redirectUrl) {
      console.log(authResult);
      if (authResult.user) {
        await commerce.authenticateCustomer();
        handleSignedInUser(authResult.user);
        let localCart = JSON.parse(window.localStorage.getItem("cart"));
        let localWishList = JSON.parse(window.localStorage.getItem("wishlist"));
        if (Object.keys(localCart).length != 0) {
          const updates = {};
          updates[`carts/${authResult.user.uid}`] = localCart;
          let updated = await commerce.updateData(updates);
          window.localStorage.setItem("cart", null);
        }
        if (Object.keys(localWishList).length != 0) {
          const updates = {};
          updates[`wishlist/${authResult.user.uid}`] = localWishList;
          let updated = await commerce.updateData(updates);
          window.localStorage.setItem("wishlist", null);
        }
      }
      return false;
    }
  },
  signInFlow: 'popup',
  signInOptions: [
    {
      provider: firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      clientId: '423060301267-jn2bv7am136sv43m4mbll9i1o736f67u.apps.googleusercontent.com'
    },
    {
      provider: firebase.auth.EmailAuthProvider.PROVIDER_ID,
      requireDisplayName: true
    }
  ],
  credentialHelper: firebaseui.auth.CredentialHelper.GOOGLE_YOLO,
  tosUrl: '/terms-and-conditions/',
  privacyPolicyUrl: '/privacy-policy/'
};

var ui = new firebaseui.auth.AuthUI(firebase.auth());
ui.disableAutoSignIn();

var handleSignedInUser = async function (user) {
  setCustomerId(user.uid)
  await commerce.authenticateCustomer();
  console.log('User is signed in: ' + getCustomerId());

  let isCustomerExists = await commerce.isCustomerExists(user.uid);
  console.log('isCustomerExists: ' + isCustomerExists);

  if (!isCustomerExists) {
    const updates = {};
    updates[`sync/customers/${user.uid}`] = 'create';
    let updated = await commerce.updateData(updates);
    console.log('User Creation Response: ', updated);
    if (!updated) {
      alert('Error creating user! Please retry again.');
    }
  }

  document.getElementById('login-modal').style.display = 'none';
};

var handleSignedOutUser = function () {
  setCustomerId(null);
  commerce.deAuthenticateCustomer();
  console.log('User is not signed in');
  if (window.location.pathname.startsWith("/account/")) {
    window.location.href = '/';
  }
};

firebase.auth().onAuthStateChanged(async function (user) {
  document.getElementById('firebaseui-loading').style.display = 'none';
  document.getElementById('firebaseui-container').style.display = 'block';

  if (user) {
    await handleSignedInUser(user);
  } else {
    handleSignedOutUser();
  }
});

async function redirectToCartConfirm() {
  var r = confirm("Item added to cart! Do you want to view the cart?");
  if (r == true) {
    window.location.href = '/cart';
  }
}

async function addToCart(pid, vid, sku, quantity = 1, accessories = [], redirectToCart = true) {
  let updatedCart;
  let productDetails = {
    quantity: quantity,
    accessories: accessories,
    lastUpdatedDate: new Date().getTime(),
  };
  let stockQuantity = await commerce.getStock(sku);
  if (stockQuantity != 0 && stockQuantity >= quantity) {
    updatedCart = await commerce.addToCart(getCustomerId(), pid, vid, productDetails);
    if (updatedCart) {
      if (redirectToCart) redirectToCartConfirm();
      return true;
    }
  } else {
    alert('Product is not in stock!');
    return false;
  }
}

async function addToWishList(pid, vid, accessories = []) {
  let productDetails = {
    accessories: accessories,
    lastUpdatedDate: new Date().getTime()
  };
  let updatedWishList = await commerce.addToWishList(getCustomerId(), pid, vid, productDetails);
  console.log(updatedWishList);
  if (updatedWishList) {
    var r = confirm("Item added to wishlist! Do you want to view the wishlist?");
    if (r == true) {
      window.location.href = '/wishlist/';
    }
  }
}

function productTileStockModule() {
  return {
    product: null,
    stockQuantity: 0,
    async loadProduct(product) {
      this.product = product;
      this.stockQuantity = await commerce.getStock(this.product.sku);
      this.product.stockStatus = this.stockQuantity > 0 ? 'IS' : 'OS';
    }
  }
}

function searchModule() {
  return {
    searchTerm: null,
    results: [],
    searchIndex: null,
    productsObject: null,
    products: [],
    showFilters: false,
    sort: getCookie('sort_by_search'),
    isLoading: true,
    noOfItemsPerPage: 12,
    noOfPages: null,
    currentPage: 1,
    searchPage: null,
    tag: null,
    async loadProducts(search = true, cid) {
      if (!this.sort) {
        this.sort = '';
      }
      setCookie('sort_by_search', this.sort, 365);

      this.searchTerm = null;
      this.results = [];
      this.products = [];
      this.isLoading = true;
      const urlParams = Object.fromEntries(new URLSearchParams(window.location.search).entries());
      let page = urlParams["page"];
      page = page ? parseInt(page) : 1;

      if (search) {
        this.searchPage = true;
        this.searchTerm = urlParams["s"];
        this.tag = urlParams["tag"];

        if (this.tag) {
          await fetch("/api/tags.json").then((res) =>
            res.json().then((tags) => {
              let tag = tags.filter(v => v.tag == this.tag)[0];
              if (tag && tag.products && tag.products.length > 0) {
                this.results = tag.products.map(v => ({
                  doc: {
                    id: v.id
                  }
                }));
              }
            }));
        } else {
          await fetch("/api/search-index.json").then((res) =>
            res.json().then((rawIndex) => {
              this.searchIndex = elasticlunr.Index.load(rawIndex);

              document.title = 'Search Results for “' + this.searchTerm + '” | Holi Colours Jewellery';

              this.results = this.searchIndex.search(this.searchTerm, {
                bool: "OR",
                expand: true,
              });

              for (let r in this.results) {
                if (this.results[r].doc.sku == this.searchTerm) {
                  this.results = [this.results[r]];
                  break;
                }
              };
            })
          );
        }
      } else {
        this.searchPage = false;
        if (cid != 'on-sale') {
          await fetch("/api/metadata/categories.json").then((res) =>
            res.json().then((categories) => {
              this.results = categories[cid].products.map(v => ({
                doc: {
                  id: v.id
                }
              }));
            }));
        } else {
          await fetch("/api/on_sale_products.json").then((res) =>
            res.json().then((onSaleProducts) => {
              Object.keys(onSaleProducts).forEach(pid => {
                this.results.push({
                  doc: {
                    id: pid
                  }
                });
              });
            }));
        }
      }

      if (this.results) {
        this.noOfPages = Math.ceil(this.results.length / this.noOfItemsPerPage);
        await fetch("/api/metadata/products.json").then((res) =>
          res.json().then(async (products) => {
            this.productsObject = products;
            console.log(this.productsObject);
            this.sortProducts();
            this.loadPage(page);
            this.isLoading = false;
          }));
      } else {
        this.isLoading = false;
      }
    },
    loadPage(page = 1) {
      this.products = [];
      this.isLoading = true;
      this.currentPage = page;
      let start = 0 + this.noOfItemsPerPage * (page - 1);
      let end = this.noOfItemsPerPage * page;
      let currentPageResults = this.results.slice(start, end);
      currentPageResults.forEach(async (result) => {
        let stockQuantity = await commerce.getStock(this.productsObject[result.doc.id].sku);
        this.productsObject[result.doc.id].stockStatus = stockQuantity > 0 ? 'IS' : 'OS';
        this.products.push(this.productsObject[result.doc.id]);
      });
      if (history.pushState) {
        let queryString;
        if (this.searchPage && !this.tag) {
          queryString = '?s=' + this.searchTerm + '&page=' + this.currentPage;
        } else if (this.searchPage && this.tag) {
          queryString = '?tag=' + this.tag + '&page=' + this.currentPage;
        } else {
          queryString = '?page=' + this.currentPage;
        }
        var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + queryString;
        window.history.pushState({
          path: newurl
        }, '', newurl);
      }
      this.isLoading = false;
    },
    sortProducts() {
      setCookie('sort_by_search', this.sort, 365);
      let productsObject = this.productsObject;
      switch (this.sort) {
        case '':
          this.results.sort(function (a, b) {
            return productsObject[b.doc.id].saleCount - productsObject[a.doc.id].saleCount;
          });
          break;
        case 'price_low_to_high':
          this.results.sort(function (a, b) {
            return productsObject[a.doc.id].price - productsObject[b.doc.id].price;
          });
          break;
        case 'price_high_to_low':
          this.results.sort(function (a, b) {
            return productsObject[b.doc.id].price - productsObject[a.doc.id].price;
          });
          break;
        case 'date_old_to_new':
          this.results.sort(function (a, b) {
            return productsObject[a.doc.id].creationDate - productsObject[b.doc.id].creationDate;
          });
          break;
        case 'date_new_to_old':
          this.results.sort(function (a, b) {
            return productsObject[b.doc.id].creationDate - productsObject[a.doc.id].creationDate;
          });
          break;
      }
    }
  }
}

function productModule() {
  return {
    product: null,
    productId: null,
    selectedImage: null,
    selectedSKU: null,
    selectedVariant: null,
    selectedVariantId: null,
    selectedProductOptions: {},
    quantity: 1,
    isLoading: true,
    stockStatuses: {
      'IS': {
        name: 'In stock',
        color: 'green'
      },
      'OS': {
        name: 'Out of stock',
        color: 'red'
      },
    },
    stockQuantity: null,
    stockStatus: null,
    activeTab: 'additional-information',
    displayName: null,
    email: null,
    reviews: null,
    newReview: {
      uid: getCustomerId(),
      pid: '',
      name: '',
      email: '',
      title: '',
      message: '',
      rating: 0,
      images: [],
      createdOn: ''
    },
    reviewsEmpty: false,
    reviewsLoading: false,
    submittingReview: false,
    addToCartText: 'Add To Cart',
    async loadProduct(productId) {
      this.productId = productId;
      this.newReview.pid = this.productId;
      this.product = await commerce.getProduct(productId);
      console.log('Product: ', this.product);
      document.title = this.product.name + " | Holi Colours Jewellery"
      this.selectedVariant = this.product.defaultVariantIndex;
      this.selectedVariantId = this.product.variants[this.selectedVariant].id;
      this.selectedImage = this.product.variants[this.selectedVariant].image.publicUrl;
      this.selectedSKU = this.product.variants[this.selectedVariant].sku.sku;
      await this.product.variants[this.selectedVariant].options.forEach(o => {
        this.selectedProductOptions[o.optionName.optionName] = o.optionValue.optionValue;
      });
      this.changeProductOptions();
      this.isLoading = false;
      this.stockQuantity = await commerce.getStock(this.selectedSKU);
      this.stockStatus = this.stockQuantity > 0 ? 'IS' : 'OS';
      this.checkSubscription();
    },
    async changeProductOptions() {
      console.log('changeProductOptions');
      // if (document.getElementsByName("product_options")) {
      //   document.getElementsByName("product_options")
      //     .forEach(option => this.selectedProductOptions.push(option.value));
      // }
      console.log(this.selectedProductOptions);
      this.product.variants.forEach(async (variant, i) => {
        let variantOptions = {};
        await variant.options.forEach(o => {
          variantOptions[o.optionName.optionName] = o.optionValue.optionValue;
        });
        console.log(variantOptions);
        if (Object.keys(this.selectedProductOptions).every(key => this.selectedProductOptions[key] == variantOptions[key])) {
          this.selectedVariant = i;
          this.selectedVariantId = variant.id;
          if (variant.image) {
            this.selectedImage = variant.image.publicUrl;
          }
          this.stockStatus = null;
          this.selectedSKU = variant.sku.sku;
          console.log(this.selectedSKU);
          this.stockQuantity = await commerce.getStock(this.selectedSKU);
          this.stockStatus = this.stockQuantity > 0 ? 'IS' : 'OS';
          this.checkSubscription();
          if (this.stockQuantity && this.stockQuantity != 0 && this.quantity > this.stockQuantity) {
            this.quantity = this.stockQuantity;
          }
        }
      });
    },
    async checkSubscription() {
      this.addToCartText = this.stockStatus == 'IS' ? 'Add To Cart' : 'Notify Me on Stock';
      if (this.stockStatus == 'OS' && Notification.permission == 'granted') {
        let token = await getRegistrationToken();
        if (token && await commerce.checkSubscription(`stock-${this.selectedSKU}`, token)) {
          this.addToCartText = '✔ Notify Me on Stock';
        }
      }
    },
    getSalePrice() {
      return this.product.variants[this.selectedVariant].salePrice;
    },
    async addToCart() {
      if (this.stockQuantity != 0 && this.stockQuantity >= this.quantity) {
        let accessories = [];
        if (document.getElementsByName("product_accessories")) {
          document.getElementsByName("product_accessories")
            .forEach(v => accessories.push(v.value));
        }
        addToCart(
          this.product.id,
          this.selectedVariantId,
          this.selectedSKU,
          this.quantity,
          accessories
        );
      } else {
        if (this.addToCartText == 'Notify Me on Stock') {
          this.addToCartText = 'Subscribing...';
          let status = await subscribeToNotification(`stock-${this.selectedSKU}`);
          if (status) {
            this.addToCartText = '✔ Notify Me on Stock';
          } else {
            this.addToCartText = 'Notify Me on Stock';
          }
        }
      }
    },
    async addToWishList() {
      let accessories = [];
      if (document.getElementsByName("product_accessories")) {
        document.getElementsByName("product_accessories")
          .forEach(v => accessories.push(v.value));
      }
      addToWishList(
        this.product.id,
        this.selectedVariantId,
        {
          accessories: accessories
        }
      );
    },
    async loadReview() {
      this.reviewsLoading = true;
      this.reviews = {};
      this.product.reviews = await commerce.getAllReviews(this.productId);
      if (this.product.reviews) {
        Object.keys(this.product.reviews).forEach(async (reviewId) => {
          this.reviews[reviewId] = await commerce.getReview(reviewId);
          if (this.reviews[reviewId].images == undefined) {
            this.reviews[reviewId].images = [];
          }
        });
      } else {
        this.reviewsEmpty = true;
      }
      if (isSignedIn()) {
        let user = await commerce.getUser(getCustomerId());
        if (user && user['userInfo']) {
          this.displayName = user.firstName;
          this.email = user.email;
          this.newReview.name = this.displayName;
          this.newReview.email = this.email;
        }
      }
      this.reviewsLoading = false;
    },
    uploadImages($event) {
      this.newReview.images = [];
      files = Object.values($event.target.files);
      files.forEach(file => {
        this.newReview.images.push(URL.createObjectURL(file));
      });
    },
    async uploadImageToStorage(imageURL) {
      let imageBLOB = await fetch(imageURL).then(r => r.blob());
      return await firebase.storage().ref()
        .child(`products/${this.productId}/reviews/${imageURL.substr(imageURL.lastIndexOf('/') + 1)}`)
        .put(imageBLOB)
        .then(function (snapshot) {
          return snapshot.ref.getDownloadURL();
        });
    },
    async submitReview() {
      if (this.newReview.rating == 0) {
        alert('Please select a rating');
        return;
      }

      this.submittingReview = true;

      var newReviewKey = await commerce.addNewReview();
      console.log(newReviewKey);

      for (let i in this.newReview.images) {
        if (this.newReview.images[i].startsWith("blob:")) {
          this.newReview.images[i] = await this.uploadImageToStorage(this.newReview.images[i]);
        }
      }

      this.newReview.createdOn = new Date().getTime();

      var updates = {};

      updates[`reviews/${newReviewKey}`] = this.newReview;
      updates[`products/${this.productId}/reviews/${newReviewKey}`] = true;

      let updated = await commerce.updateData(updates);

      if (!updated) {
        alert('Error submitting review! Please try again after sometime.');
      } else {
        alert('Thank you for reviewing!');
        this.reviewsEmpty = false;
        this.reviews[newReviewKey] = this.newReview;
        document.querySelector("#new_review_form").reset();
        this.newReview = {
          uid: getCustomerId(),
          pid: this.projectId,
          name: '',
          email: '',
          title: '',
          message: '',
          images: [],
          createdOn: ''
        };
        this.newReview.name = this.displayName;
        this.newReview.email = this.email;
      }

      this.submittingReview = false;
    }
  }
}

function cartModule() {
  return {
    cart: {
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
    },
    isLoading: true,
    checkoutLoading: false,
    async loadCart() {
      this.isLoading = true;
      this.cart = await commerce.getUserCart(getCustomerId());
      this.isLoading = false;
    },
    async updateCart() {
      this.cart.quantity = 0;
      this.cart.subTotal = 0;
      this.cart.total = 0;
      let updates = {};
      this.cart.products.filter(p => p.quantity == null).forEach(p => {
        if (isSignedIn()) {
          updates[`carts/${getCustomerId()}/${p.id}/${p.vid}`] = null;
        } else {
          let localCart = JSON.parse(window.localStorage.getItem("cart"));
          delete localCart[p.id][p.vid];
          Object.keys(localCart).forEach(pid => {
            if (Object.keys(localCart[pid]).length == 0) {
              delete localCart[pid];
            }
          });
          window.localStorage.setItem("cart", JSON.stringify(localCart));
        }
      });
      this.cart.products = this.cart.products.filter(p => p.quantity && p.quantity > 0);
      this.cart.products.forEach(p => {
        if (isSignedIn()) {
          updates[`carts/${getCustomerId()}/${p.id}/${p.vid}/quantity`] = p.quantity;
        } else {
          let localCart = JSON.parse(window.localStorage.getItem("cart"));
          localCart[p.id][p.vid].quantity = p.quantity;
          window.localStorage.setItem("cart", JSON.stringify(localCart));
        }
        this.cart.quantity += p.quantity;
        this.cart.subTotal += p.quantity * p.price;
      });
      this.cart.total = this.cart.subTotal - this.cart.discount;
      if (isSignedIn()) {
        await commerce.updateData(updates);
      }
    },
    async checkout() {
      this.checkoutLoading = true;
      await this.updateCart();
      let inStock = await commerce.checkCartStock(this.cart);
      this.checkoutLoading = false;
      if (!inStock) return;
      if (isSignedIn()) {
        window.location.href = '/checkout';
      } else {
        logIn('Login or Create an Account');
      }
    }
  }
}

function wishlistModule() {
  return {
    wishlist: [],
    isLoading: true,
    empty: true,
    stockStatuses: {
      'IS': {
        name: 'In stock',
        color: 'green'
      },
      'OS': {
        name: 'Out of stock',
        color: 'red'
      }
    },
    async loadWishlist() {
      this.wishlist = [];
      this.isLoading = true;
      this.empty = true;

      let wishlist = await commerce.getUserWishlist(getCustomerId());
      this.empty = wishlist ? false : true;

      for (var productId in wishlist) {
        fetch(`/api/products/${productId}.json`)
          .then(response => {
            if (response.ok) {
              return response.json();
            } else {
              throw new Error(`Product ${productId} Not Found`);
            }
          })
          .then(async (product) => {
            let pid = product.id;
            for (var vid in wishlist[pid]) {
              let variant = product.variants.filter(v => v.id == vid)[0];
              let accessories = [];
              accessories = product.accessories.filter(v => {
                return wishlist[pid][vid].accessories && wishlist[pid][vid].accessories.length > 0 && wishlist[pid][vid].accessories.includes(v.id);
              });
              if (Array.isArray(accessories) && accessories.length == 0) {
                let defaultAccessory = product.accessories.filter(v => v.price == 0)
                if (Array.isArray(defaultAccessory) && defaultAccessory.length > 0) {
                  accessories = [defaultAccessory[0]];
                } else {
                  accessories = [];
                }
              }

              console.log(accessories);

              let variantOptions = variant.options.map((o) => ({
                attribute: o.optionName.optionName,
                value: o.optionValue.optionValue
              }));

              if (!variant) {
                throw new Error(`Variant ${vid} Not Found`);
              }

              let stockQuantity = await commerce.getStock(variant.sku.sku);
              let stockStatus = stockQuantity > 0 ? 'IS' : 'OS';

              let productObject = {
                id: product.id,
                vid: vid,
                sku: variant.sku.sku,
                name: product.name,
                slug: product.slug,
                image: variant.image.publicUrl,
                price: variant.price,
                salePercentage: variant.salePercentage,
                variantOptions: variantOptions,
                stockQuantity: stockQuantity,
                stockStatus: stockStatus,
                accessories: accessories
              };

              this.wishlist.push(productObject);
            }
          })
          .catch((error) => {
            console.log(error)
          });
        ;
      }
      console.log(this.wishlist);
      this.isLoading = false;
    },
    async removeFromWishlist(pid, vid) {
      if (isSignedIn()) {
        let updates = {};
        updates[`wishlist/${getCustomerId()}/${pid}/${vid}`] = null;
        await commerce.updateData(updates);
      } else {
        let localWishList = JSON.parse(window.localStorage.getItem("wishlist"));
        delete localWishList[pid][vid];
        Object.keys(localWishList).forEach(productId => {
          if (Object.keys(localWishList[productId]).length == 0) {
            delete localWishList[productId];
          }
        });
        window.localStorage.setItem("wishlist", JSON.stringify(localWishList));
      }
      this.wishlist.some((p, i) => {
        if (p.id == pid && p.vid == vid) {
          this.wishlist.splice(i, 1);
          return true;
        }
        return false;
      });
      this.empty = this.wishlist.length != 0 ? false : true;
    },
    async addToCart(product) {
      let updatedCart = addToCart(
        product.id,
        product.vid,
        product.sku,
        1,
        [],
        false
      );
      if (updatedCart) {
        await this.removeFromWishlist(product.id, product.vid);
        redirectToCartConfirm();
      }
    }
  }
}

function checkoutModule() {
  return {
    cart: {
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
    },
    order: {
      cart: {
        note: null,
        storeFeedback: null,
        redeemCreditPoints: 0,
        offerCoupon: null,
        products: []
      },
      customer: {
        firstName: null,
        lastName: null,
        email: null,
        phoneNumber: null,
        alternatePhoneNumber: null,
        enableCreditPoints: null,
        creditPoints: 0,
        shipToAddress: {
          address1: null,
          address2: null,
          city: null,
          state: null,
          postalCode: null,
          country: null
        },
        uid: getCustomerId()
      },
      shipping: {
        methodId: null,
        methodName: null
      }
    },
    showSummary: false,
    isLoading: false,
    page: 'customer-info',
    saveCustomerInfo: isSignedIn(),
    shippingZones: [],
    shippingMethodsList: null,
    paytmTxn: {
      gateway: '',
      mid: '',
      orderId: '',
      txnToken: ''
    },
    isPGLoading: false,
    async loadCart() {
      this.cart = [];
      this.isLoading = true;

      this.cart = await commerce.getUserCart(getCustomerId());

      if (this.cart.products.length == 0) {
        window.location.href = '/cart';
        return;
      }

      this.cart = await commerce.applyOfferToCart(this.cart);

      this.shippingZones = await commerce.getShippingZones();

      if (isSignedIn()) {
        let user = await commerce.getUser(getCustomerId());
        if (user) {
          this.order.customer.firstName = user.firstName;
          this.order.customer.lastName = user.lastName;
          this.order.customer.email = user.email;
          this.order.customer.phoneNumber = user.phoneNumber;
          this.order.customer.alternatePhoneNumber = user.alternatePhoneNumber;
          this.order.customer.enableCreditPoints = user.enableCreditPoints;
          this.order.customer.creditPoints = user.creditPoints;
          if (user['shipToAddress']) {
            this.order.customer.shipToAddress = user.shipToAddress;
          }
        }
      }

      this.isLoading = false;
    },
    async goToShipping() {
      if (this.order.customer.shipToAddress.address1 && this.order.customer.shipToAddress.address2 && this.order.customer.shipToAddress.city && this.order.customer.shipToAddress.postalCode && this.order.customer.shipToAddress.state && this.order.customer.shipToAddress.country) {
        this.page = 'shipping-method';
        this.loadShippingMethods();
        if (this.saveCustomerInfo && isSignedIn()) {
          const updates = {};
          updates[`customers/${getCustomerId()}/firstName`] = this.order.customer.firstName;
          updates[`customers/${getCustomerId()}/lastName`] = this.order.customer.lastName;
          updates[`customers/${getCustomerId()}/phoneNumber`] = this.order.customer.phoneNumber;
          updates[`customers/${getCustomerId()}/alternatePhoneNumber`] = this.order.customer.alternatePhoneNumber;
          updates[`customers/${getCustomerId()}/shipToAddress`] = this.order.customer.shipToAddress;
          await commerce.updateData(updates);
        }
        window.scroll({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      }
    },
    getShippingAddress() {
      let address = '';
      if (this.page == 'shipping-method' || this.page == 'payment-method') {
        address = this.order.customer.shipToAddress.address1
          + ', '
          + this.order.customer.shipToAddress.address2
          + ', '
          + this.order.customer.shipToAddress.city
          + ' - '
          + this.order.customer.shipToAddress.postalCode
          + ', '
          + this.shippingZones[this.order.customer.shipToAddress.country].states[this.order.customer.shipToAddress.state].name
          + ', '
          + this.shippingZones[this.order.customer.shipToAddress.country].name;
      }
      return address;
    },
    async loadShippingMethods() {
      this.shippingMethodsList = null;

      if (!this.cart.freeShipping) {
        let shippingMethods = this.shippingZones[this.order.customer.shipToAddress.country].states[this.order.customer.shipToAddress.state].methods;

        if (shippingMethods) {
          let shippingMethodsList = [];

          shippingMethods.forEach(method => {
            method['price'] = method.baseCost;
            if (method.overKg < this.cart.weight) {
              method['price'] += ((Math.ceil(this.cart.weight) - method.overKg) / method.perEachKg) * method.charge;
            }
            shippingMethodsList.push(method);
          });

          this.shippingMethodsList = shippingMethodsList;
        } else {
          this.shippingMethodsList = [];
        }
      } else {
        this.shippingMethodsList = [
          {
            id: 'freeShipping',
            method: 'Free Delivery',
            price: 0
          }
        ];
      }
    },
    selectShippingMethod(shippingMethod) {
      this.order.shipping.methodName = shippingMethod.method;
      this.cart.shipping = shippingMethod.price;
      this.cart.total = this.cart.subTotal + this.cart.shipping - this.cart.discount;
    },
    goToPayment() {
      if (this.order.shipping.methodId) {
        this.page = 'payment-method';
        window.scroll({
          top: 0,
          left: 0,
          behavior: 'smooth'
        });
      }
    },
    redeemCP(redeem) {
      if (redeem) {
        this.cart.discount += this.order.customer.creditPoints;
        this.order.cart.redeemCreditPoints = this.order.customer.creditPoints;
      } else {
        this.cart.discount -= this.order.cart.redeemCreditPoints;
        this.order.cart.redeemCreditPoints = 0;
      }
      this.cart.total = this.cart.subTotal + this.cart.shipping - this.cart.discount;
    },
    async initiatePayment(paytmForm) {
      this.isPGLoading = true;

      let inStock = await commerce.checkCartStock(this.cart);
      if (!inStock) {
        this.isPGLoading = false;
        return;
      }

      this.order.cart.offerCoupon = this.cart.offerCoupon ? this.cart.offerCoupon : "";

      this.order.cart.products = this.cart.products.map(p => ({
        id: p.id,
        vid: p.vid,
        quantity: p.quantity,
        accessories: p.accessories.map(a => a.id),
        freebie: p.freebie
      }));

      console.log(this.order);

      fetch('/.netlify/functions/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.order)
      })
        .then(response => {
          if (response.ok) {
            return response.json();
          } else {
            throw response.json();
          }
        })
        .then(data => {
          this.isPGLoading = false;
          this.paytmTxn = data;
          console.log(this.paytmTxn);
          if (this.paytmTxn.txnToken) {
            paytmForm.action = this.paytmTxn.gateway;
            paytmForm.elements["mid"].value = this.paytmTxn.mid;
            paytmForm.elements["orderId"].value = this.paytmTxn.orderId;
            paytmForm.elements["txnToken"].value = this.paytmTxn.txnToken;
            paytmForm.submit();
          }
        })
        .catch((error) => {
          console.log(error);
          this.isPGLoading = false;
          if (error['resultMsg']) {
            alert(error['resultMsg']);
          } else {
            alert('Error initiating payment!');
          }
        });
    }
  }
}

function accountModule() {
  return {
    account: {
      firstName: null,
      lastName: null,
      email: null,
      phoneNumber: null,
      alternatePhoneNumber: null,
      enableCreditPoints: null,
      creditPoints: null,
      shipToAddress: {
        address1: null,
        address2: null,
        city: null,
        state: null,
        postalCode: null,
        country: null
      }
    },
    isLoading: true,
    shippingZones: [],
    saving: false,
    async loadAccount() {
      this.isLoading = true;

      this.shippingZones = await commerce.getShippingZones();

      let user = await commerce.getUser(getCustomerId());
      if (user) {
        this.account.firstName = user.firstName;
        this.account.lastName = user.lastName;
        this.account.email = user.email;
        this.account.phoneNumber = user.phoneNumber;
        this.account.alternatePhoneNumber = user.alternatePhoneNumber;
        this.account.enableCreditPoints = user.enableCreditPoints;
        this.account.creditPoints = user.creditPoints;
        if (user['shipToAddress']) {
          this.account.shipToAddress = user.shipToAddress;
        }
      }
      this.isLoading = false;
    },
    async saveAccount() {
      if (!(this.account.shipToAddress.address1 == '' && this.account.shipToAddress.address2 == '' && this.account.shipToAddress.city == '' && this.account.shipToAddress.postalCode == '' && this.account.shipToAddress.state == '' && this.account.shipToAddress.country == '')) {
        if (this.account.shipToAddress.address1 == '') {
          alert('Please enter Address Line 1');
          return;
        }
        if (this.account.shipToAddress.address2 == '') {
          alert('Please enter Address Line 2');
          return;
        }
        if (this.account.shipToAddress.city == '') {
          alert('Please enter City');
          return;
        }
        if (this.account.shipToAddress.postalCode == '') {
          alert('Please enter Postal Code');
          return;
        }
        if (this.account.shipToAddress.country == '') {
          alert('Please enter Country');
          return;
        }
        if (this.account.shipToAddress.state == '') {
          alert('Please enter State');
          return;
        }
      }
      this.saving = true;
      const updates = {};
      updates[`customers/${getCustomerId()}/firstName`] = this.account.firstName;
      updates[`customers/${getCustomerId()}/lastName`] = this.account.lastName;
      updates[`customers/${getCustomerId()}/phoneNumber`] = this.account.phoneNumber;
      updates[`customers/${getCustomerId()}/alternatePhoneNumber`] = this.account.alternatePhoneNumber;
      updates[`customers/${getCustomerId()}/shipToAddress`] = this.account.shipToAddress;
      await commerce.updateData(updates);
      this.saving = false;
      alert('Saved!');
    }
  }
}

function orderModule() {
  return {
    isLoading: true,
    orderList: [],
    orders: {},
    orderId: null,
    order: {},
    statuses: {
      'PP': {
        name: 'Pending payment',
        color: 'gray'
      },
      'PF': {
        name: 'Payment failed',
        color: 'red'
      },
      'OH': {
        name: 'On hold',
        color: 'yellow'
      },
      'PR': {
        name: 'Processing',
        color: 'green'
      },
      'DI': {
        name: 'Dispatched',
        color: 'blue'
      },
      'CO': {
        name: 'Completed',
        color: 'gray'
      },
      'CA': {
        name: 'Cancelled',
        color: 'gray'
      }
    },
    noOfItemsPerPage: 5,
    currentPage: 1,
    async loadOrders() {
      let ordersSnapshot = await commerce.getUserOrders(getCustomerId());
      this.orderList = ordersSnapshot ? Object.keys(ordersSnapshot) : [];
      this.orderList.sort(function (a, b) {
        return b - a;
      });
      this.noOfPages = Math.ceil(this.orderList.length / this.noOfItemsPerPage);
      console.log(this.orderList);
      this.orders = {};
      this.loadPage();
    },
    loadPage(page = 1) {
      this.isLoading = true;
      this.currentPage = page;
      let start = 0 + this.noOfItemsPerPage * (page - 1);
      let end = this.noOfItemsPerPage * page;
      let currentPageResults = this.orderList.slice(start, end);
      currentPageResults.forEach(async (orderId) => {
        this.orders[orderId] = await commerce.getOrder(orderId);
      });
      this.isLoading = false;
    },
    loadOrder(order, id) {
      this.orderId = id;
      this.order = JSON.parse(JSON.stringify(order));
      if (this.order.notes == undefined) {
        this.order.notes = [];
      }
      this.currentStatus = this.order.status;
      this.sortNotes();
      document.getElementById("orderPage").scrollIntoView();
    },
    closeOrder() {
      this.orderId = null;
      this.order = null;
      this.currentStatus = null;
    },
    sortNotes() {
      this.order.notes.sort((a, b) => {
        return b.createdOn - a.createdOn;
      });
    },
    getShippingAddress() {
      let address = this.order.customer.shipToAddress.address1 +
        "\n" +
        this.order.customer.shipToAddress.address2 +
        '\n' +
        this.order.customer.shipToAddress.city +
        ' - ' +
        this.order.customer.shipToAddress.postalCode +
        '\n' +
        this.order.customer.shipToAddress.state +
        ', ' +
        this.order.customer.shipToAddress.country;
      return address;
    }
  }
}

function paymentStatusModule() {
  return {
    orderId: null,
    order: {
      cart: {
        products: []
      }
    },
    status: null,
    errorMessage: null,
    showSummary: false,
    isLoading: false,
    paymentMode: {
      'PPI': 'Paytm Wallet',
      'UPI': 'UPI',
      'CC': 'Credit Card',
      'DC': 'Debit Card',
      'NB': 'Net Banking',
    },
    shippingZones: [],
    async loadOrder() {
      this.isLoading = true;
      const urlSearchParams = new URLSearchParams(window.location.search);
      const params = Object.fromEntries(urlSearchParams.entries());
      console.log(params);
      this.orderId = params['orderId'];
      this.status = params['status'];
      this.errorMessage = params['errorMessage'];
      if (this.status == 'Success') {
        this.order = await commerce.getOrder(this.orderId);
        console.log(this.order);
        this.shippingZones = await commerce.getShippingZones();
        this.isLoading = false;
      } else {
        this.isLoading = false;
      }
    },
    printShippingAddress() {
      let address;
      if (this.shippingZones) {
        address = this.order.customer.shipToAddress.address1
          + "\n"
          + this.order.customer.shipToAddress.address2
          + '\n'
          + this.order.customer.shipToAddress.city
          + ' - '
          + this.order.customer.shipToAddress.postalCode
          + '\n'
          + this.shippingZones[this.order.customer.shipToAddress.country].states[this.order.customer.shipToAddress.state].name
          + ', '
          + this.shippingZones[this.order.customer.shipToAddress.country].name;
      }
      return address;
    }
  }
}

async function getRegistrationToken() {
  let registrationToken = null;
  await messaging.requestPermission()
    .then(function () {
      console.log("Notification permission granted.");
      // get the token in the form of promise
      return messaging.getToken()
    })
    .then(async function (token) {
      console.log("token is : " + token);
      registrationToken = token;
    })
    .catch(function (err) {
      console.log("Unable to get permission to notify.", err);
      alert("Unable to get permission to notification. Please check your browser's notification settings");
    });
  return registrationToken;
}

async function subscribeToNotification(topic) {
  let status = false;
  let token = await getRegistrationToken();
  if (!token) {
    return false;
  }
  await fetch('/.netlify/functions/subscribeToTopic', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      uid: getCustomerId(),
      registrationTokens: [token],
      topic: topic
    })
  })
    .then(response => {
      if (response.ok) {
        return response.json();
      } else {
        throw response.json();
      }
    })
    .then(data => {
      console.log(data);
      if (data['successCount'] > 0) {
        console.log('Success');
        status = true;
      }
    })
    .catch((error) => {
      console.log(error);
      alert('Unable to Subscribe. Please try again after sometime.');
    });
  return status;
}

function subscribeModule() {
  return {
    subscribeText: null,
    async checkSubscription() {
      this.subscribeText = 'Subscribe';
      if (Notification.permission == 'granted') {
        let token = await getRegistrationToken();
        if (token && await commerce.checkSubscription('newsletter', token)) {
          this.subscribeText = 'Subscribed!';
        }
      }
    },
    async subscribe() {
      if (this.subscribeText == 'Subscribe') {
        this.subscribeText = 'Subscribing...';
        let status = await subscribeToNotification('newsletter');
        if (status) {
          this.subscribeText = 'Subscribed!';
        } else {
          this.subscribeText = 'Subscribe';
        }
      }
    }
  }
}

function collectionSliders() {
  document
    .querySelectorAll(".collection-slider")
    .forEach(slider => {
      new Glide(slider, {
        autoplay: 2000,
        type: "carousel",
        perView: 3,
        gap: 30,
        breakpoints: {
          1440: {
            perView: 2,
          },
          1024: {
            perView: 2,
          },
          768: {
            perView: 2,
          },
          600: {
            perView: 1,
          }
        },
      })
        .mount();
    });
}

function postSlider() {
  new Glide(".posts-slider", {
    type: "carousel",
    startAt: 1,
    perView: 3,
    gap: 0,
    peek: {
      before: 50,
      after: 50,
    },
    breakpoints: {
      1024: {
        perView: 3,
        peek: {
          before: 20,
          after: 20,
        },
      },
      768: {
        perView: 2,
        peek: {
          before: 10,
          after: 10,
        },
      },
      600: {
        perView: 1,
        peek: {
          before: 0,
          after: 0,
        },
      },
    },
  })
    .mount();
}

// var btnBackToTop = $('#btnBackToTop');

// window.scroll(function() {
//   if (window.scrollTop() > 300) {
//     btnBackToTop.addClass('block');
//   } else {
//     btnBackToTop.removeClass('block');
//   }
// });

// btnBackToTop.on('click', function(e) {
//   e.preventDefault();
//   $('html, body').animate({scrollTop:0}, '300');
// });

// document.addEventListener('DOMContentLoaded', function(){
//         var script = document.createElement('script');
//         script.src = 'https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js';
//         script.onload = function(){
//             particlesJS("snow", {
//                 "particles": {
//                     "number": {
//                         "value": 200,
//                         "density": {
//                             "enable": true,
//                             "value_area": 800
//                         }
//                     },
//                     "color": {
//                         "value": "#ffffff"
//                     },
//                     "opacity": {
//                         "value": 0.7,
//                         "random": false,
//                         "anim": {
//                             "enable": false
//                         }
//                     },
//                     "size": {
//                         "value": 5,
//                         "random": true,
//                         "anim": {
//                             "enable": false
//                         }
//                     },
//                     "line_linked": {
//                         "enable": false
//                     },
//                     "move": {
//                         "enable": true,
//                         "speed": 5,
//                         "direction": "bottom",
//                         "random": true,
//                         "straight": false,
//                         "out_mode": "out",
//                         "bounce": false,
//                         "attract": {
//                             "enable": true,
//                             "rotateX": 300,
//                             "rotateY": 1200
//                         }
//                     }
//                 },
//                 "interactivity": {
//                     "events": {
//                         "onhover": {
//                             "enable": false
//                         },
//                         "onclick": {
//                             "enable": false
//                         },
//                         "resize": false
//                     }
//                 },
//                 "retina_detect": true
//             });
//         }
//         document.head.append(script);
//     });