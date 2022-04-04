let checkoutPendingLogin = false;

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
const prdfirebaseConfig = {
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
} else {
  firebase.initializeApp(prdfirebaseConfig);
}

const messaging = firebase.messaging();

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

var uiConfig = {
  callbacks: {
    signInSuccessWithAuthResult: async function (authResult, redirectUrl) {
      console.log(authResult);
      if (authResult.user) {
        console.log('signInSuccessWithAuthResult');
        await database.relogin(authResult.credential);
        handleSignedInUser(authResult.user);
      }
      return false;
    },
    signInFailure: async function (error) {
      console.log(error);
      if (error.code != 'firebaseui/anonymous-upgrade-merge-conflict') {
        return Promise.resolve();
      }
      var anonymousUser = await firebase.auth().currentUser;
      var anonymousUserData = await database.getUserCart(anonymousUser.uid);
      await database.updateCart(anonymousUser.uid, null);
      var newUser = await database.relogin(error.credential);
      if (anonymousUserData) {
        await database.updateCart(newUser.user.uid, anonymousUserData);
      }
      anonymousUser.delete();
      anonymousUserData = null;
      handleSignedInUser(firebase.auth().currentUser);
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
  autoUpgradeAnonymousUsers: true,
  credentialHelper: firebaseui.auth.CredentialHelper.GOOGLE_YOLO,
  tosUrl: '/terms-and-conditions/',
  privacyPolicyUrl: '/privacy-policy/'
};

var ui = new firebaseui.auth.AuthUI(firebase.auth());
ui.disableAutoSignIn();

var handleAnonymousUser = async function (user) {
  setCookie('uid', user.uid, 365);
  setCookie('isAnonymous', 'true', 365);
  console.log('Anonymous User: ' + user.uid);
  if (window.location.pathname.startsWith("/account/")) {
    window.location.href = '/';
  }
  document.getElementById('firebaseui-loading').style.display = 'none';
  document.getElementById('firebaseui-container').style.display = 'block';
};

var handleSignedInUser = async function (user) {
  document.getElementById('firebaseui-loading').style.display = 'none';
  document.getElementById('firebaseui-container').style.display = 'block';
  console.log('User is signed in: ' + user.uid);
  if (getCookie('isAnonymous')) {
    setCookie('uid', '', 365);
    setCookie('isAnonymous', '', 365);
  }
  await database.authenticate();
  let isUserExists = await database.isUserExists(user.uid);
  console.log('main.js isUserExists', isUserExists);
  if (!isUserExists) {
    const updates = {};
    // updates[`users/${user.uid}/email`] = user.email;
    updates[`users/${user.uid}/firstName`] = user.displayName;
    updates[`users/${user.uid}/phoneNumber`] = '';
    let updated = await database.updateData(updates);
    console.log('User Creation Response: ', updated);
    if (!updated) {
      alert('Error creating user! Please clear your browser cache and retry again.');
    } else {
      setCookie('uid', user.uid, 365);
      //TO-DO: Create customer in Admin Site
    }
  } else {
    setCookie('uid', user.uid, 365);
    console.log('User: ' + user.uid);
    // if (window.location.pathname == '/checkout/') {
    //   window.location.reload();
    // }
  }
  document.getElementById('login-modal').style.display = 'none';
  if (checkoutPendingLogin) {
    window.location.href = '/checkout/';
  }
};

var handleSignedOutUser = function () {
  setCookie('uid', '', 365);
  setCookie('isAnonymous', '', 365);
  console.log('User is not signed in');
  if (window.location.pathname.startsWith("/account/")) {
    window.location.href = '/';
  }
  firebase.auth().signInAnonymously();
};

firebase.auth().onAuthStateChanged(async function (user) {
  console.log('onAuthStateChanged');
  if (user) {
    user.isAnonymous ? handleAnonymousUser(user) : await handleSignedInUser(user);
  } else {
    handleSignedOutUser();
  }
});

function logIn(title = 'Login or Create an Account') {
  if (getCookie('uid') && !getCookie('isAnonymous')) {
    window.location.href = '/account/';
  } else {
    ui.start('#firebaseui-container', uiConfig);
    document.getElementById('login-modal').style.display = 'flex';
    document.getElementById('login-modal-title').innerText = title;
  }
}

function logOut() {
  firebase.auth().signOut().then(() => {
    setCookie('uid', '', 365);
    window.location.href = '/';
  }).catch((error) => {
    console.log(error);
  });
}

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
  let stockQuantity = await database.getStock(sku);
  if (stockQuantity != 0 && stockQuantity >= quantity) {
    updatedCart = await database.addToCart(getCookie('uid'), pid, vid, productDetails);
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
  let updatedWishList = await database.addToWishList(getCookie('uid'), pid, vid, productDetails);
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
      this.stockQuantity = await database.getStock(this.product.sku);
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
        let stockQuantity = await database.getStock(this.productsObject[result.doc.id].sku);
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
      uid: getCookie('uid'),
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
      this.product = await database.getProduct(productId);
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
      this.stockQuantity = await database.getStock(this.selectedSKU);
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
          this.stockQuantity = await database.getStock(this.selectedSKU);
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
        if (token && await database.checkSubscription(`stock-${this.selectedSKU}`, token)) {
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
      this.product.reviews = await database.getAllReviews(this.productId);
      if (this.product.reviews) {
        Object.keys(this.product.reviews).forEach(async (reviewId) => {
          this.reviews[reviewId] = await database.getReview(reviewId);
          if (this.reviews[reviewId].images == undefined) {
            this.reviews[reviewId].images = [];
          }
        });
      } else {
        this.reviewsEmpty = true;
      }
      if (!getCookie('isAnonymous')) {
        let user = await database.getUser(getCookie('uid'));
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

      var newReviewKey = await database.addNewReview();
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

      let updated = await database.updateData(updates);

      if (!updated) {
        alert('Error submitting review! Please try again after sometime.');
      } else {
        alert('Thank you for reviewing!');
        this.reviewsEmpty = false;
        this.reviews[newReviewKey] = this.newReview;
        document.querySelector("#new_review_form").reset();
        this.newReview = {
          uid: getCookie('uid'),
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
      if (getCookie('uid')) {
        this.isLoading = true;
        this.cart = await database.getUserCart(getCookie('uid'));
        console.log(this.cart);
        this.isLoading = false;
      } else {
        this.isLoading = false;
      }
    },
    async updateCart() {
      this.cart.quantity = 0;
      this.cart.subTotal = 0;
      this.cart.total = 0;
      let updates = {};
      this.cart.products.filter(p => p.quantity == null).forEach(p => {
        updates[`carts/${getCookie('uid')}/${p.id}/${p.vid}`] = null;
      });
      this.cart.products = this.cart.products.filter(p => p.quantity && p.quantity > 0);
      this.cart.products.forEach(p => {
        updates[`carts/${getCookie('uid')}/${p.id}/${p.vid}/quantity`] = p.quantity;
        this.cart.quantity += p.quantity;
        this.cart.subTotal += p.quantity * p.price;
      });
      this.cart.total = this.cart.subTotal - this.cart.discount;
      await database.updateData(updates);
    },
    async checkout() {
      this.checkoutLoading = true;
      await this.updateCart();
      let inStock = await database.checkCartStock(this.cart);
      this.checkoutLoading = false;
      if (!inStock) return;
      if (getCookie('uid') && !getCookie('isAnonymous')) {
        window.location.href = '/checkout';
      } else {
        checkoutPendingLogin = true;
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
      if (getCookie('uid')) {
        this.wishlist = [];
        this.isLoading = true;
        this.empty = true;

        let wishlist = await database.getUserWishlist(getCookie('uid'));
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

                let stockQuantity = await database.getStock(variant.sku.sku);
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
      } else {
        this.isLoading = false;
      }
    },
    async removeFromWishlist(pid, vid) {
      let updates = {};
      updates[`wishlist/${getCookie('uid')}/${pid}/${vid}`] = null;
      await database.updateData(updates);
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
        uid: getCookie('uid')
      },
      shipping: {
        methodId: null,
        methodName: null
      }
    },
    showSummary: false,
    isLoading: false,
    page: 'customer-info',
    saveCustomerInfo: getCookie('uid') && !getCookie('isAnonymous'),
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
      if (getCookie('uid')) {
        this.cart = [];
        this.isLoading = true;

        this.cart = await database.getUserCart(getCookie('uid'));

        if (this.cart.products.length == 0) {
          window.location.href = '/cart';
          return;
        }

        this.cart = await database.applyOfferToCart(this.cart);

        this.shippingZones = await database.getShippingZones();

        if (!getCookie('isAnonymous')) {
          let user = await database.getUser(getCookie('uid'));
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
      } else {
        window.location.href = '/cart';
        this.isLoading = false;
      }
    },
    async goToShipping() {
      if (this.order.customer.shipToAddress.address1 && this.order.customer.shipToAddress.address2 && this.order.customer.shipToAddress.city && this.order.customer.shipToAddress.postalCode && this.order.customer.shipToAddress.state && this.order.customer.shipToAddress.country) {
        this.page = 'shipping-method';
        this.loadShippingMethods();
        if (this.saveCustomerInfo && !getCookie('isAnonymous')) {
          const updates = {};
          updates[`users/${getCookie('uid')}/firstName`] = this.order.customer.firstName;
          updates[`users/${getCookie('uid')}/lastName`] = this.order.customer.lastName;
          updates[`users/${getCookie('uid')}/phoneNumber`] = this.order.customer.phoneNumber;
          updates[`users/${getCookie('uid')}/alternatePhoneNumber`] = this.order.customer.alternatePhoneNumber;
          updates[`users/${getCookie('uid')}/shipToAddress`] = this.order.customer.shipToAddress;
          await database.updateData(updates);
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

      let inStock = await database.checkCartStock(this.cart);
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

      this.shippingZones = await database.getShippingZones();

      let user = await database.getUser(getCookie('uid'));
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
      updates[`users/${getCookie('uid')}/firstName`] = this.account.firstName;
      updates[`users/${getCookie('uid')}/lastName`] = this.account.lastName;
      updates[`users/${getCookie('uid')}/phoneNumber`] = this.account.phoneNumber;
      updates[`users/${getCookie('uid')}/alternatePhoneNumber`] = this.account.alternatePhoneNumber;
      updates[`users/${getCookie('uid')}/shipToAddress`] = this.account.shipToAddress;
      await database.updateData(updates);
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
      let ordersSnapshot = await database.getUserOrders(getCookie('uid'));
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
        this.orders[orderId] = await database.getOrder(orderId);
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
        this.order = await database.getOrder(this.orderId);
        console.log(this.order);
        this.shippingZones = await database.getShippingZones();
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
      uid: getCookie('uid'),
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
        if (token && await database.checkSubscription('newsletter', token)) {
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