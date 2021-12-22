let checkoutPendingLogin = false;

var firebaseConfig = {
    apiKey: "AIzaSyAVKIXxd68CdLlJfzCcPtw47-dkJh2xJm0",
    authDomain: "holi-colours-jewellery.firebaseapp.com",
    projectId: "holi-colours-jewellery",
    storageBucket: "holi-colours-jewellery.appspot.com",
    messagingSenderId: "423060301267",
    appId: "1:423060301267:web:e7f2dc25f8fb0703153b26",
    databaseURL: "https://holi-colours-jewellery-default-rtdb.asia-southeast1.firebasedatabase.app/",
    measurementId: "G-LNR3MKCG8F"
};

firebase.initializeApp(firebaseConfig);

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
        signInSuccessWithAuthResult: function (authResult, redirectUrl) {
            if (authResult.user) {
                console.log('signInSuccessWithAuthResult');
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
            var cred = error.credential;
            var newUser = await firebase.auth().signInWithCredential(cred);
            await database.relogin();
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
    if (!getCookie('uid')) {
        if (!database.isUserExists(user.uid)) {
            const updates = {};
            updates[`users/${user.uid}/userInfo/email`] = user.email;
            updates[`users/${user.uid}/userInfo/displayName`] = user.displayName;
            updates[`users/${user.uid}/userInfo/phoneNumber`] = '';
            let updated = await database.updateData(updates);
            if (!updated) {
                console.log(error);
                alert('Error creating user! Please clear your browser cache and retry again.');
            } else {
                setCookie('uid', user.uid, 365);
            }
        } else {
            setCookie('uid', user.uid, 365);
            if (window.location.pathname == '/checkout/') {
                window.location.reload();
            }
        }
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

async function addToCart(productId, selectedVariant, productQuantity) {
    let stockQuantity = await database.getStock(productId, selectedVariant);
    if (stockQuantity != 0 && stockQuantity >= productQuantity) {
        let updatedCart = await database.addToCart(getCookie('uid'), productId, selectedVariant, productQuantity);
        if (updatedCart) {
            var r = confirm("Item added to cart! Do you want to view the cart?");
            if (r == true) {
                window.location.href = '/cart';
            }
        }
    } else {
        alert('Product is not in stock!');
    }
}

async function addToWishList(productId, selectedVariant) {
    let updatedWishList = await database.addToWishList(getCookie('uid'), productId, selectedVariant);
    if (updatedWishList) {
        var r = confirm("Item added to wishlist! Do you want to view the wishlist?");
        if (r == true) {
            window.location.href = '/wishlist/';
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
                            for (var i in tags[this.tag].products) {
                                this.results.push({
                                    doc: {
                                        id: tags[this.tag].products[i]
                                    }
                                })
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
                                if (this.results[r].doc.id == this.searchTerm) {
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
                    await fetch("/api/categories.json").then((res) =>
                        res.json().then((categories) => {
                            for (var i in categories[cid].products) {
                                this.results.push({
                                    doc: {
                                        id: categories[cid].products[i]
                                    }
                                })
                            }
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
                await fetch("/api/products.json").then((res) =>
                    res.json().then((products) => {
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
            currentPageResults.forEach(result => {
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
                        return productsObject[a.doc.id].salePrice - productsObject[b.doc.id].salePrice;
                    });
                    break;
                case 'price_high_to_low':
                    this.results.sort(function (a, b) {
                        return productsObject[b.doc.id].salePrice - productsObject[a.doc.id].salePrice;
                    });
                    break;
                case 'date_old_to_new':
                    this.results.sort(function (a, b) {
                        return a.doc.id - b.doc.id;
                    });
                    break;
                case 'date_new_to_old':
                    this.results.sort(function (a, b) {
                        return b.doc.id - a.doc.id;
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
        selectedVariant: null,
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
            'OB': {
                name: 'On backorder',
                color: 'yellow'
            }
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
            images: [],
            createdOn: ''
        },
        reviewsEmpty: false,
        reviewsLoading: false,
        submittingReview: false,
        async loadProduct(productId) {
            this.productId = productId;
            this.newReview.pid = this.productId;
            fetch(`/api/products/${productId}.json`).then((res) =>
                res.json().then(async (product) => {
                    this.product = product;
                    console.log(this.product);
                    this.selectedImage = product.variants[product.generalInfo.defaultVariant].image;
                    this.selectedVariant = product.generalInfo.defaultVariant;
                    document.title = this.product.generalInfo.name + " | Holi Colours Jewellery"
                    this.isLoading = false;
                    this.stockQuantity = await database.getStock(product.id, this.selectedVariant);
                    this.stockStatus = this.stockQuantity > 0 ? 'IS' : 'OS';
                    console.log(this.stockQuantity);
                }));
        },
        async changeVariant() {
            this.stockStatus = null;
            this.selectedImage = this.product.variants[this.selectedVariant].image;
            this.stockQuantity = await database.getStock(this.product.id, this.selectedVariant);
            this.stockStatus = this.stockQuantity > 0 ? 'IS' : 'OS';
            console.log(this.stockQuantity);
            if (this.quantity > this.stockQuantity) {
                this.quantity = this.stockQuantity;
            }
        },
        addToCart() {
            if (this.stockQuantity != 0 && this.stockQuantity >= this.quantity) {
                addToCart(this.product.id, this.selectedVariant, this.quantity);
            } else {
                alert('Product is not in stock!');
            }
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
                    this.displayName = user.userInfo['displayName'];
                    this.email = user.userInfo['email'];
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
            this.submittingReview = true;

            var newReviewKey = await database.addNewReview();

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
        cart: [],
        isLoading: true,
        empty: true,
        quantity: 0,
        subTotal: 0,
        discount: 0,
        total: 0,
        checkoutLoading: false,
        async loadCart() {
            if (getCookie('uid')) {
                this.cart = [];
                this.isLoading = true;
                this.empty = true;
                this.quantity = 0;
                this.subTotal = 0;
                this.discount = 0;
                this.total = 0;

                let cartList = await database.getUserCart(getCookie('uid'));
                this.empty = cartList ? false : true;
                for (var productId in cartList) {
                    fetch(`/api/products/${productId}.json`)
                        .then(response => {
                            if (response.ok) {
                                return response.json();
                            } else {
                                throw new Error(`Product ${productId} Not Found`);
                            }
                        })
                        .then(async (product) => {
                            let selectedVariant = cartList[product.id]['variant'] ? cartList[product.id].variant : product.generalInfo.defaultVariant;

                            let stockQuantity = await database.getStock(product.id, selectedVariant);

                            let productObject = {
                                id: product.id,
                                name: product.generalInfo.name,
                                slug: product.generalInfo.slug,
                                image: product.variants[selectedVariant].image,
                                price: product.variants[selectedVariant].salePrice,
                                salePercentage: product.variants[selectedVariant].salePercentage, quantity: cartList[product.id].quantity,
                                variants: product.variants,
                                defaultVariant: product.generalInfo.defaultVariant,
                                selectedVariant: selectedVariant,
                                stockQuantity: stockQuantity
                            };
                            this.cart.push(productObject);
                            this.quantity += cartList[product.id].quantity;
                            this.subTotal += cartList[product.id].quantity * productObject.price;
                            this.total = this.subTotal - this.discount;
                        })
                        .catch((error) => {
                            console.log(error)
                        });
                    ;
                }
                this.isLoading = false;
            } else {
                this.isLoading = false;
            }
        },
        async changeVariant(product) {
            const selectedVariant = product.selectedVariant;
            product.image = product.variants[selectedVariant].image;
            product.price = product.variants[selectedVariant].salePrice;
            product.salePercentage = product.variants[selectedVariant].salePercentage;
            product.stockQuantity = await database.getStock(product.id, selectedVariant);
            if (product.quantity > product.stockQuantity) {
                product.quantity = product.stockQuantity;
            } else if (product.quantity == 0 && product.quantity <= product.stockQuantity) {
                product.quantity = 1;
            }
            this.updateCart();
        },
        removeFromCart(product) {
            const index = this.cart.indexOf(product);
            if (index > -1) {
                this.cart.splice(index, 1);
            }
            this.updateCart();
        },
        async updateCart() {
            let cartObject = {};
            this.quantity = 0;
            this.subTotal = 0;
            this.total = 0;
            for (var i in this.cart) {
                cartObject[this.cart[i].id] = {
                    quantity: this.cart[i].quantity,
                    variant: this.cart[i].selectedVariant
                };
                this.quantity += this.cart[i].quantity;
                this.subTotal += this.cart[i].quantity * this.cart[i].price;
            }
            this.total = this.subTotal - this.discount;
            this.empty = this.cart.length != 0 ? false : true;
            await database.updateCart(getCookie('uid'), cartObject);
        },
        async checkout() {
            for (var i in this.cart) {
                this.cart[i].stockQuantity = await database.getStock(this.cart[i].id, this.cart[i].selectedVariant);
                let productName = this.cart[i].variants.length > 1 ? `${this.cart[i].name} [${this.cart[i].variants[this.cart[i].selectedVariant].name}]` : this.cart[i].name;
                if (this.cart[i].stockQuantity == 0) {
                    alert(productName + ' is not in stock!');
                    return;
                } else if (this.cart[i].stockQuantity < this.cart[i].quantity) {
                    alert('Only ' + this.cart[i].stockQuantity + ' item(s) are in stock for ' + productName);
                    return;
                }
            }
            window.location.href = '/checkout';
            // if (getCookie('uid') && !getCookie('isAnonymous')) {
            //     window.location.href = '/checkout';
            // } else {
            //     checkoutPendingLogin = true;
            //     logIn('Login or Create an Account to Checkout');
            // }
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
                            let selectedVariant = wishlist[product.id]['variant'] ? wishlist[product.id].variant : product.generalInfo.defaultVariant;
                            let stockQuantity = await database.getStock(product.id, selectedVariant);
                            let stockStatus = stockQuantity > 0 ? 'IS' : 'OS';
                            let productObject = {
                                id: product.id,
                                name: product.generalInfo.name,
                                slug: product.generalInfo.slug,
                                image: product.variants[selectedVariant].image,
                                price: product.variants[selectedVariant].salePrice,
                                variants: product.variants,
                                defaultVariant: product.generalInfo.defaultVariant,
                                selectedVariant: selectedVariant,
                                stockQuantity: stockQuantity,
                                stockStatus: stockStatus
                            };
                            this.wishlist.push(productObject);
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
        async changeVariant(product) {
            const selectedVariant = product.selectedVariant;
            product.image = product.variants[selectedVariant].image;
            product.price = product.variants[selectedVariant].salePrice;
            product.stockQuantity = await database.getStock(product.id, selectedVariant);
            product.stockStatus = product.stockQuantity > 0 ? 'IS' : 'OS';
            this.updateWishlist();
        },
        async removeFromWishlist(productId) {
            for (var i in this.wishlist) {
                if (this.wishlist[i].id == productId) {
                    this.wishlist.splice(i, 1);
                    this.updateWishlist();
                    return;
                }
            }
        },
        async updateWishlist() {
            let wishlistObject = {};
            for (var i in this.wishlist) {
                wishlistObject[this.wishlist[i].id] = {
                    variant: this.wishlist[i].selectedVariant
                };
            }
            this.empty = this.wishlist.length != 0 ? false : true;
            await database.updateWishList(getCookie('uid'), wishlistObject);
        },
        test(productId) { console.log(productId) },
        async addToCart(product) {
            let stockQuantity = await database.getStock(product.id, product.selectedVariant);
            if (stockQuantity != 0 && stockQuantity >= 1) {
                let updatedCart = await database.addToCart(getCookie('uid'), product.id, product.selectedVariant, 1);
                if (updatedCart) {
                    this.removeFromWishlist(product.id);
                    var r = confirm("Item added to cart! Do you want to view the cart?");
                    if (r == true) {
                        window.location.href = '/cart';
                    }
                }
            } else {
                alert('Product is not in stock!');
            }
        }
    }
}

function checkoutModule() {
    return {
        cart: [],
        order: {},
        showSummary: false,
        isLoading: false,
        quantity: 0,
        subTotal: 0,
        shipping: 0,
        discount: 0,
        total: 0,
        weight: 0,
        page: 'customer-info',
        account: {
            userInfo: {
                displayName: '',
                email: '',
                phoneNumber: ''
            },
            shipToAddress: {
                address1: '',
                address2: '',
                city: '',
                state: '',
                postalCode: '',
                country: ''
            }
        },
        saveCustomerInfo: getCookie('uid') && !getCookie('isAnonymous'),
        orderNote: '',
        storeFeedback: '',
        freeShipping: false,
        minNumberOfItems: 0,
        shippingZones: [],
        shippingMethodsList: null,
        shippingInfo: { name: '', key: '', price: '' },
        redeemCreditPoints: null,
        paytmTxn: {
            gateway: '',
            mid: '',
            orderId: '',
            txnToken: ''
        },
        isPGLoading: false,
        isOnSale: false,
        offers: [],
        offerApplied: false,
        async loadCart() {
            if (getCookie('uid')) {
                this.cart = [];
                this.isLoading = true;
                this.quantity = 0;
                this.subTotal = 0;
                this.discount = 0;
                this.total = 0;
                this.weight = 0;
                this.freeShipping = false;
                this.minNumberOfItems = 0;
                this.isOnSale = false;

                let cartList = await database.getUserCart(getCookie('uid'));
                if (!cartList) {
                    window.location.href = '/cart';
                    return;
                }
                for (var productId in cartList) {
                    let product = await database.getProduct(productId);
                    let selectedVariant = cartList[product.id].variant;
                    let productObject = {
                        id: product.id,
                        name: product.generalInfo.name,
                        slug: product.generalInfo.slug,
                        image: product.variants[selectedVariant].image,
                        price: product.variants[selectedVariant].salePrice,
                        salePercentage: product.variants[selectedVariant].salePercentage,
                        variantName: product.variants.length > 1 ? product.variants[selectedVariant].name : '',
                        quantity: cartList[product.id].quantity,
                        selectedVariant: selectedVariant,
                        weight: product.variants[selectedVariant].weight
                    };
                    this.cart.push(productObject);
                    this.quantity += cartList[product.id].quantity;
                    this.subTotal += cartList[product.id].quantity * productObject.price;
                    this.weight += productObject.weight;
                    if (!this.isOnSale && product.isOnSale) {
                        this.isOnSale = true;
                        this.offers = [];
                    }
                    console.log(this.isOnSale);
                    console.log(this.offers);
                    console.log(product.offers);
                    if (!this.isOnSale && this.offers.length == 0 && product.offers && product.offers.length >= 1) {
                        this.offers = product.offers;
                        console.log(this.offers);
                    }
                }

                let sortedOffers = this.offers;
                sortedOffers.sort(function (a, b) {
                    return b.minNumberOfItems - a.minNumberOfItems;
                });
                this.offers = sortedOffers;
                console.log(this.offers);

                if (!this.isOnSale && this.offers && this.offers.length >= 1) {
                    for (let i in this.offers) {
                        if (!this.offerApplied && this.quantity >= this.offers[i].minNumberOfItems) {
                            if (this.offers[i].freeShipping) {
                                this.freeShipping = true;
                                this.offerApplied = true;
                            }
                            if (this.offers[i].discountAmount > 0) {
                                this.discount += parseFloat(this.offers[i].discountAmount);
                                this.offerApplied = true;
                            }
                            console.log(this.offers[i].products);
                            if (this.offers[i].products && Object.keys(this.offers[i].products).length > 0) {
                                for (var pid in this.offers[i].products) {
                                    let pidIndex = null;
                                    for (var j in this.cart) {
                                        if (pid == this.cart[j].id) {
                                            pidIndex = j;
                                            break;
                                        }
                                    }
                                    if (pidIndex) {
                                        this.cart[pidIndex].quantity += 1;
                                        this.cart[pidIndex].type = 'item+1freebie';
                                        this.subTotal += this.cart[pidIndex].price;
                                        this.discount += parseFloat(this.cart[pidIndex].price);
                                    } else {
                                        let product = await database.getProduct(pid);
                                        let selectedVariant = product.generalInfo.defaultVariant;
                                        let productObject = {
                                            id: product.id,
                                            name: product.generalInfo.name,
                                            slug: product.generalInfo.slug,
                                            type: '1freebie',
                                            image: product.variants[selectedVariant].image,
                                            price: product.variants[selectedVariant].salePrice,
                                            salePercentage: product.variants[selectedVariant].salePercentage,
                                            variantName: product.variants.length > 1 ? product.variants[selectedVariant].name : '',
                                            quantity: 1,
                                            selectedVariant: selectedVariant,
                                            weight: product.variants[selectedVariant].weight
                                        };
                                        this.cart.push(productObject);
                                        this.subTotal += productObject.price;
                                        this.discount += parseFloat(productObject.price);
                                    }
                                    this.quantity += 1;
                                }
                                this.offerApplied = true;
                            }
                        }
                        if (this.offerApplied) {
                            break;
                        }
                    }
                }

                await fetch('/api/shipping-zones.json')
                    .then(response => response.json())
                    .then((data) => {
                        this.shippingZones = data;
                    });

                if (!getCookie('isAnonymous')) {
                    let user = await database.getUser(getCookie('uid'));
                    if (user) {
                        if (user['userInfo']) {
                            this.account.userInfo = user.userInfo;
                        }
                        if (user['shipToAddress']) {
                            this.account.shipToAddress = user.shipToAddress;
                        }
                    }
                }

                this.total = this.subTotal - this.discount;
                this.isLoading = false;
            } else {
                window.location.href = '/cart';
                this.isLoading = false;
            }
        },
        async goToShipping() {
            if (this.account.shipToAddress.address1 && this.account.shipToAddress.address2 && this.account.shipToAddress.city && this.account.shipToAddress.postalCode && this.account.shipToAddress.state && this.account.shipToAddress.country) {
                this.page = 'shipping-method';
                this.loadShippingMethods();
                if (this.saveCustomerInfo && !getCookie('isAnonymous')) {
                    const updates = {};
                    updates[`users/${getCookie('uid')}/userInfo/displayName`] = this.account.userInfo.displayName;
                    updates[`users/${getCookie('uid')}/userInfo/phoneNumber`] = this.account.userInfo.phoneNumber;
                    updates[`users/${getCookie('uid')}/shipToAddress`] = this.account.shipToAddress;
                    let updated = await database.updateData(updates);
                }
            }
        },
        printShippingAddress() {
            let address = '';
            if (this.page == 'shipping-method' || this.page == 'payment-method') {
                address = this.account.shipToAddress.address1
                    + ', '
                    + this.account.shipToAddress.address2
                    + ', '
                    + this.account.shipToAddress.city
                    + ' - '
                    + this.account.shipToAddress.postalCode
                    + ', '
                    + this.shippingZones[this.account.shipToAddress.country].states[this.account.shipToAddress.state].name
                    + ', '
                    + this.shippingZones[this.account.shipToAddress.country].name;
            }
            return address;
        },
        async loadShippingMethods() {
            this.shippingMethodsList = null;

            if (!this.freeShipping) {
                let shippingMethods = this.shippingZones[this.account.shipToAddress.country].states[this.account.shipToAddress.state].methods;

                if (shippingMethods) {
                    let allShippingMethods;

                    await fetch('/api/shipping-methods.json')
                        .then(response => response.json())
                        .then((data) => {
                            allShippingMethods = data;
                        });

                    let shippingMethodsList = []
                    for (var method in shippingMethods) {
                        let shippingMethodDetails = allShippingMethods[method];
                        shippingMethodDetails['key'] = method;
                        shippingMethodDetails['price'] = shippingMethodDetails.baseCost;
                        if (shippingMethodDetails.weightRate.overKg < this.weight) {
                            shippingMethodDetails['price'] += ((Math.ceil(this.weight) - shippingMethodDetails.weightRate.overKg) / shippingMethodDetails.weightRate.perKg) * shippingMethodDetails.weightRate.charge;
                        }
                        shippingMethodsList.push(shippingMethodDetails);
                    }
                    this.shippingMethodsList = shippingMethodsList;
                } else {
                    this.shippingMethodsList = [];
                }
            } else {
                this.shippingMethodsList = [
                    {
                        key: 'freeShipping',
                        name: 'Free Delivery',
                        price: 0
                    }
                ];
            }
        },
        selectShippingMethod(shippingMethod) {
            this.shippingInfo.name = shippingMethod.name;
            this.shippingInfo.price = shippingMethod.price;
            this.shipping = shippingMethod.price;
            this.total = this.subTotal + this.shipping - this.discount;
        },
        goToPayment() {
            if (this.shippingInfo.key) {
                this.page = 'payment-method';
            }
        },
        redeemCP(redeem) {
            this.redeemCreditPoints = redeem ? this.account.userInfo['creditPoints'] : 0;
            this.discount += parseFloat(this.redeemCreditPoints);
            this.total = this.subTotal + this.shipping - this.discount;
        },
        async initiatePayment(paytmForm) {
            this.isPGLoading = true;

            for (var i in this.cart) {
                let stockQuantity = await database.getStock(this.cart[i].id, this.cart[i].selectedVariant);
                let productName = this.cart[i].variantName ? `${this.cart[i].name} [${this.cart[i].variantName}]` : this.cart[i].name;
                if (stockQuantity == 0) {
                    alert(productName + ' is not in stock!');
                    this.isPGLoading = false;
                    return;
                } else if (stockQuantity < this.cart[i].quantity) {
                    alert('Only ' + stockQuantity + ' item(s) are in stock for ' + productName);
                    this.isPGLoading = false;
                    return;
                }
            }

            this.order = {
                cart: {
                    note: this.orderNote,
                    storeFeedback: this.storeFeedback,
                    redeemCreditPoints: this.redeemCreditPoints,
                    products: {}
                },
                customer: {
                    displayName: this.account.userInfo.displayName,
                    email: this.account.userInfo.email,
                    phoneNumber: this.account.userInfo.phoneNumber,
                    shipToAddress: this.account.shipToAddress,
                    uid: getCookie('uid')
                },
                shipping: {
                    methodKey: this.shippingInfo.key,
                    methodName: this.shippingInfo.name
                }
            };

            for (let i in this.cart) {
                if (this.cart[i]['type'] == 'item+1freebie') {
                    this.order.cart.products[this.cart[i].id] = {
                        quantity: this.cart[i].quantity - 1,
                        variant: this.cart[i].variantName,
                        selectedVariant: this.cart[i].selectedVariant,
                    };
                } else if (this.cart[i]['type'] != '1freebie') {
                    this.order.cart.products[this.cart[i].id] = {
                        quantity: this.cart[i].quantity,
                        variant: this.cart[i].variantName,
                        selectedVariant: this.cart[i].selectedVariant,
                    };
                }
            }

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
            userInfo: {
                displayName: '',
                email: '',
                phoneNumber: '',
                creditPoints: null
            },
            shipToAddress: {
                address1: '',
                address2: '',
                city: '',
                state: '',
                postalCode: '',
                country: ''
            }
        },
        isLoading: true,
        shippingZones: [],
        saving: false,
        async loadAccount() {
            this.isLoading = true;

            await fetch('/api/shipping-zones.json')
                .then(response => response.json())
                .then((data) => {
                    this.shippingZones = data;
                });

            let user = await database.getUser(getCookie('uid'));
            if (user) {
                if (user['userInfo']) {
                    this.account.userInfo = user.userInfo;
                }
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
            updates[`users/${getCookie('uid')}/userInfo/displayName`] = this.account.userInfo.displayName;
            updates[`users/${getCookie('uid')}/userInfo/phoneNumber`] = this.account.userInfo.phoneNumber;
            updates[`users/${getCookie('uid')}/shipToAddress`] = this.account.shipToAddress;
            console.log(updates);
            await database.updateData(updates);
            this.saving = false;
            alert('Saved!');
        }
    }
}

function orderModule() {
    return {
        isLoading: true,
        empty: true,
        orderList: [],
        orders: null,
        orderId: null,
        order: null,
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
            this.empty = ordersSnapshot ? false : true;
            this.orderList = Object.keys(ordersSnapshot);
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
            if (Array.isArray(this.order.cart.products)) {
                this.order.cart.products = {
                    ...this.order.cart.products
                };
                for (let i in this.order.cart.products) {
                    if (!this.order.cart.products[i]) {
                        delete this.order.cart.products[i];
                    }
                }
            }
            this.currentStatus = this.order.generalInfo.status;
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
        printShippingAddress() {
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
        order: {},
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
            this.order = [];
            this.isLoading = true;
            const urlSearchParams = new URLSearchParams(window.location.search);
            const params = Object.fromEntries(urlSearchParams.entries());
            console.log(params);
            this.orderId = params['orderId'];
            this.status = params['status'];
            this.errorMessage = params['errorMessage'];
            if (this.status == 'Success') {
                this.order = await database.getOrder(this.orderId);
                await fetch('/api/shipping-zones.json')
                    .then(response => response.json())
                    .then((data) => {
                        this.shippingZones = data;
                    });
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