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
        signInFailure: function (error) {
            console.log(error);
            if (error.code != 'firebaseui/anonymous-upgrade-merge-conflict') {
                return Promise.resolve();
            }
            var anonymousUserData = null;
            var anonymousUser = firebase.auth().currentUser;
            var cred = error.credential;
            return firebase.app().database().ref('carts/' + firebase.auth().currentUser.uid)
                .once('value')
                .then(function (snapshot) {
                    anonymousUserData = snapshot.val();
                    return firebase.auth().signInWithCredential(cred);
                })
                .then(function (newUser) {
                    if (anonymousUserData) {
                        firebase.app().database().ref('carts/' + newUser.user.uid).set(anonymousUserData)
                    }
                    return firebase.app().database().ref('carts/' + anonymousUser.uid).remove();
                })
                .then(function () {
                    return anonymousUser.delete();
                }).then(function () {
                    anonymousUserData = null;
                    handleSignedInUser(firebase.auth().currentUser);
                });
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
    tosUrl: '<your-tos-url>',
    privacyPolicyUrl: '<your-privacy-policy-url>'
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
    console.log('User is signed in: ' + user.displayName);
    console.log(user);
    if (getCookie('isAnonymous')) {
        setCookie('uid', '', 365);
        setCookie('isAnonymous', '', 365);
    }
    if (!getCookie('uid')) {
        let serverUser = await firebase.database().ref().child("users").child(user.uid).once('value').then((snapshot) => { return snapshot.val(); });
        if (!serverUser) {
            const updates = {};
            updates[`users/${user.uid}/userInfo/email`] = user.email;
            updates[`users/${user.uid}/userInfo/displayName`] = user.displayName;
            updates[`users/${user.uid}/userInfo/phoneNumber`] = '';
            await firebase.database().ref().update(updates, (error) => {
                if (error) {
                    console.log(error);
                    alert('Error creating user! Please clear your browser cache and retry again.');
                } else {
                    setCookie('uid', user.uid, 365);
                }
            });
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

function addToCart(productId, selectedVariant, productQuantity) {
    firebase.database().ref().child("stock").child(productId).child(selectedVariant).once('value')
        .then((snapshot) => {
            let stockQuantity = snapshot.val();

            if (stockQuantity != 0 && stockQuantity >= productQuantity) {
                firebase.database().ref().child("carts").child(getCookie('uid')).child(productId).set({
                    'quantity': productQuantity,
                    'variant': selectedVariant
                }, (error) => {
                    if (error) {
                        console.log(error);
                    } else {
                        var r = confirm("Item added to cart! Do you want to view the cart?");
                        if (r == true) {
                            window.location.href = '/cart';
                        }
                    }
                });
            } else {
                alert('Product is not in stock!');
            }
        });
}

function addToWishList(productId) {
    firebase.database().ref().child("wishlist").child(getCookie('uid')).child(productId).set(true, (error) => {
        if (error) {
            console.log(error);
        } else {
            var r = confirm("Item added to wishlist! Do you want to view the wishlist?");
            if (r == true) {
                window.location.href = '/wishlist/';
            }
        }
    });
}

function searchModule() {
    return {
        searchTerm: null,
        results: [],
        searchIndex: null,
        productsObject: null,
        products: [],
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
                        })
                    );
                }
            } else {
                this.searchPage = false;
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
            }

            if (this.results) {
                this.noOfPages = Math.ceil(this.results.length / this.noOfItemsPerPage);
                fetch("/api/products.json").then((res) =>
                    res.json().then((products) => {
                        this.productsObject = products;
                        this.sortProducts();
                        this.loadPage(page);
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
            fetch(`/api/products/${productId}.json`).then((res) =>
                res.json().then(async (product) => {
                    this.product = product;
                    console.log(this.product);
                    this.selectedImage = product.variants[product.generalInfo.defaultVariant].image;
                    this.selectedVariant = product.generalInfo.defaultVariant;
                    document.title = this.product.generalInfo.name + " | Holi Colours Jewellery"
                    this.isLoading = false;
                    this.stockQuantity = await firebase.database().ref().child("stock").child(product.id).child(this.selectedVariant).once('value').then((snapshot) => { return snapshot.val(); });
                    this.stockStatus = this.stockQuantity > 0 ? 'IS' : 'OS';
                    console.log(this.stockQuantity);
                }));
        },
        async changeVariant() {
            this.stockStatus = null;
            this.selectedImage = this.product.variants[this.selectedVariant].image;
            this.stockQuantity = await firebase.database().ref().child("stock").child(this.product.id).child(this.selectedVariant).once('value').then((snapshot) => { return snapshot.val(); });
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
            this.product['reviews'] = await firebase.database().ref().child("products").child(this.productId).child("reviews").once('value')
                .then((snapshot) => {
                    return snapshot.val();
                });
            if (this.product.reviews) {
                Object.keys(this.product.reviews).forEach(async (reviewId) => {
                    this.reviews[reviewId] = await firebase.database().ref().child("reviews").child(reviewId).once('value')
                        .then((snapshot) => {
                            return snapshot.val();
                        });
                    if (this.reviews[reviewId].images == undefined) {
                        this.reviews[reviewId].images = [];
                    }
                });
            } else {
                this.reviewsEmpty = true;
            }
            if (!getCookie('isAnonymous')) {
                await firebase.database().ref().child("users").child(getCookie('uid')).once('value')
                    .then((snapshot) => {
                        if (snapshot.val()) {
                            if (snapshot.val()['userInfo']) {
                                this.displayName = snapshot.val()['userInfo']['displayName'];
                                this.email = snapshot.val()['userInfo']['email'];
                                this.newReview.name = this.displayName;
                                this.newReview.email = this.email;
                            }
                        }
                    });
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

            var newReviewKey = firebase.database().ref().child('reviews').push().key;

            for (let i in this.newReview.images) {
                if (this.newReview.images[i].startsWith("blob:")) {
                    this.newReview.images[i] = await this.uploadImageToStorage(this.newReview.images[i]);
                }
            }

            this.newReview.createdOn = new Date().getTime();

            var updates = {};

            updates[`reviews/${newReviewKey}`] = this.newReview;
            updates[`products/${this.productId}/reviews/${newReviewKey}`] = true;

            await firebase.database().ref().update(updates, (error) => {
                if (error) {
                    console.log(error);
                    alert('Error submitting review! Please try again after sometime.');
                } else {
                    alert('Thank you for reviewing!');
                    this.reviewsEmpty = false;
                    this.reviews[newReviewKey] = this.newReview;
                    document.querySelector("#new_review_form").reset();
                    this.newReview = {
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
            });

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
        loadCart() {
            if (getCookie('uid')) {
                this.cart = [];
                this.isLoading = true;
                this.empty = true;
                this.quantity = 0;
                this.subTotal = 0;
                this.discount = 0;
                this.total = 0;
                firebase.database().ref().child("carts").child(getCookie('uid')).orderByKey().once('value')
                    .then((snapshot) => {
                        let cartList = snapshot.val();
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
                                    let stockQuantity = await firebase.database().ref().child("stock").child(product.id).child(selectedVariant).once('value').then((snapshot) => { return snapshot.val(); });
                                    let productName = product.variants[selectedVariant].salePercentage ? product.generalInfo.name + ' (' + product.variants[selectedVariant].salePercentage + '% OFF)' : product.generalInfo.name;
                                    let productObject = {
                                        id: product.id,
                                        name: productName,
                                        image: product.variants[selectedVariant].image,
                                        price: product.variants[selectedVariant].salePrice,
                                        quantity: cartList[product.id].quantity,
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
                    });
            } else {
                this.isLoading = false;
            }
        },
        async changeVariant(product) {
            const selectedVariant = product.selectedVariant;
            product.image = product.variants[selectedVariant].image;
            product.price = product.variants[selectedVariant].salePrice;
            product.stockQuantity = await firebase.database().ref().child("stock").child(product.id).child(selectedVariant).once('value').then((snapshot) => { return snapshot.val(); });
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
        updateCart() {
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
            firebase.database().ref().child("carts").child(getCookie('uid')).set(cartObject);
        },
        async checkout() {
            for (var i in this.cart) {
                this.cart[i].stockQuantity = await firebase.database().ref().child("stock").child(this.cart[i].id).child(this.cart[i].selectedVariant).once('value').then((snapshot) => { return snapshot.val(); });

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
        loadWishlist() {
            if (getCookie('uid')) {
                this.wishlist = [];
                this.isLoading = true;
                this.empty = true;
                firebase.database().ref().child("wishlist").child(getCookie('uid')).orderByKey().once('value')
                    .then((snapshot) => {
                        let wishlist = snapshot.val();
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
                                    let stockQuantity = await firebase.database().ref().child("stock").child(product.id).child(selectedVariant).once('value').then((snapshot) => { return snapshot.val(); });
                                    let stockStatus = stockQuantity > 0 ? 'IS' : 'OS';
                                    let productObject = {
                                        id: product.id,
                                        slug: product.slug,
                                        name: product.generalInfo.name,
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
                    });
            } else {
                this.isLoading = false;
            }
        },
        async changeVariant(product) {
            const selectedVariant = product.selectedVariant;
            product.image = product.variants[selectedVariant].image;
            product.price = product.variants[selectedVariant].salePrice;
            product.stockQuantity = await firebase.database().ref().child("stock").child(product.id).child(selectedVariant).once('value').then((snapshot) => { return snapshot.val(); });
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
        updateWishlist() {
            let wishlistObject = {};
            for (var i in this.wishlist) {
                wishlistObject[this.wishlist[i].id] = {
                    variant: this.wishlist[i].selectedVariant
                };
            }
            this.empty = this.wishlist.length != 0 ? false : true;
            firebase.database().ref().child("wishlist").child(getCookie('uid')).set(wishlistObject);
        },
        test(productId) { console.log(productId) },
        async addToCart(product) {
            await firebase.database().ref().child("stock").child(product.id).child(product.selectedVariant).once('value')
                .then(async (snapshot) => {
                    let stockQuantity = snapshot.val();

                    if (stockQuantity != 0 && stockQuantity >= 1) {
                        await firebase.database().ref().child("carts").child(getCookie('uid')).child(product.id).set({
                            'quantity': 1,
                            'variant': product.selectedVariant
                        }, (error) => {
                            if (error) {
                                console.log(error);
                            } else {
                                this.removeFromWishlist(product.id);
                                var r = confirm("Item added to cart! Do you want to view the cart?");
                                if (r == true) {
                                    window.location.href = '/cart';
                                }
                            }
                        });
                    } else {
                        alert('Product is not in stock!');
                    }
                });
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
        freeShipping: false,
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
                this.isOnSale = false;
                await firebase.database().ref().child("carts").child(getCookie('uid')).once('value')
                    .then(async (snapshot) => {
                        let cartList = snapshot.val();
                        if (!cartList) {
                            window.location.href = '/cart';
                            return;
                        }
                        for (var productId in cartList) {
                            await fetch(`/api/products/${productId}.json`)
                                .then(response => {
                                    if (response.ok) {
                                        return response.json();
                                    } else {
                                        throw new Error(`Product ${productId} Not Found`);
                                    }
                                })
                                .then(async (product) => {
                                    let selectedVariant = cartList[product.id]['variant'] ? cartList[product.id].variant : product.generalInfo.defaultVariant;
                                    let productName = product.variants[selectedVariant].salePercentage ? product.generalInfo.name + ' (' + product.variants[selectedVariant].salePercentage + '% OFF)' : product.generalInfo.name;
                                    let productObject = {
                                        id: product.id,
                                        name: productName,
                                        image: product.variants[selectedVariant].image,
                                        price: product.variants[selectedVariant].salePrice,
                                        variantName: product.variants.length > 1 ? product.variants[selectedVariant].name : '',
                                        quantity: cartList[product.id].quantity,
                                        selectedVariant: selectedVariant,
                                        weight: product.variants[selectedVariant].weight,
                                        couponCode: product.couponCode
                                    };
                                    this.cart.push(productObject);
                                    this.quantity += cartList[product.id].quantity;
                                    this.subTotal += cartList[product.id].quantity * productObject.price;
                                    this.total = this.subTotal - this.discount;
                                    this.weight += productObject.weight;
                                    if (!this.isOnSale && product.couponCode) {
                                        this.isOnSale = true;
                                    }
                                    console.log(product['freeshipping']);
                                    if (product['freeshipping']) {
                                        this.freeShipping = true;
                                    }
                                })
                                .catch((error) => {
                                    console.log(error)
                                });
                        }

                        await fetch('/api/shipping-zones.json')
                            .then(response => response.json())
                            .then((data) => {
                                this.shippingZones = data;
                            });

                        if (!getCookie('isAnonymous')) {
                            await firebase.database().ref().child("users").child(getCookie('uid')).once('value')
                                .then((snapshot) => {
                                    if (snapshot.val()) {
                                        if (snapshot.val()['userInfo']) {
                                            this.account.userInfo = snapshot.val()['userInfo'];
                                        }
                                        if (snapshot.val()['shipToAddress']) {
                                            this.account.shipToAddress = snapshot.val()['shipToAddress'];
                                            console.log('ST Populated');
                                        }
                                        console.log(snapshot.val());
                                    }
                                });
                        }
                        this.isLoading = false;
                    });
            } else {
                window.location.href = '/cart';
                this.isLoading = false;
            }
        },
        goToShipping() {
            if (this.account.shipToAddress.address1 && this.account.shipToAddress.address2 && this.account.shipToAddress.city && this.account.shipToAddress.postalCode && this.account.shipToAddress.state && this.account.shipToAddress.country) {
                this.page = 'shipping-method';
                this.loadShippingMethods();
                if (this.saveCustomerInfo && !getCookie('isAnonymous')) {
                    const updates = {};
                    updates[`users/${getCookie('uid')}/userInfo/displayName`] = this.account.userInfo.displayName;
                    updates[`users/${getCookie('uid')}/userInfo/phoneNumber`] = this.account.userInfo.phoneNumber;
                    updates[`users/${getCookie('uid')}/shipToAddress`] = this.account.shipToAddress;
                    console.log(updates);
                    firebase.database().ref().update(updates);
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
            this.discount = this.redeemCreditPoints;
            this.total = this.subTotal + this.shipping - this.discount;
        },
        async initiatePayment(paytmForm) {
            this.isPGLoading = true;

            for (var i in this.cart) {
                let stockQuantity = await firebase.database().ref().child("stock").child(this.cart[i].id).child(this.cart[i].selectedVariant).once('value').then((snapshot) => { return snapshot.val(); });

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
                this.order.cart.products[this.cart[i].id] = {
                    quantity: this.cart[i].quantity,
                    variant: this.cart[i].variantName,
                    selectedVariant: this.cart[i].selectedVariant
                };
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

            await firebase.database().ref().child("users").child(getCookie('uid')).once('value')
                .then((snapshot) => {
                    if (snapshot.val()) {
                        if (snapshot.val()['userInfo']) {
                            this.account.userInfo = snapshot.val()['userInfo'];
                        }
                        if (snapshot.val()['shipToAddress']) {
                            this.account.shipToAddress = snapshot.val()['shipToAddress'];
                        }
                    }
                    this.isLoading = false;
                });
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
            await firebase.database().ref().update(updates);
            this.saving = false;
            alert('Saved!');
        }
    }
}

function wishListModule() {
    return {
        wishlist: [],
        isLoading: true,
        empty: true,
        loadWishList() {
            this.wishlist = [];
            this.isLoading = true;
            firebase.database().ref().child("wishlist").child(getCookie('uid')).once('value')
                .then((snapshot) => {
                    wishlistSnapshot = snapshot.val();
                    this.empty = wishlistSnapshot ? false : true;
                    for (var productId in wishlistSnapshot) {
                        firebase.database().ref().child("products").child(productId).once('value')
                            .then((snapshot) => {
                                let productId = snapshot.key;
                                let product = snapshot.val();
                                console.log(productId);
                                console.log(product);
                                let productObject = {
                                    id: productId,
                                    name: product.generalInfo.name,
                                    image: product.variants[product.generalInfo.defaultVariant].image,
                                    price: product.variants[product.generalInfo.defaultVariant].regularPrice
                                };
                                this.wishlist.push(productObject);
                            });
                    }
                    this.isLoading = false;
                });
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
        loadOrders() {
            firebase.database().ref().child("users").child(getCookie('uid')).child("orders").once('value')
                .then((snapshot) => {
                    ordersSnapshot = snapshot.val();
                    this.empty = ordersSnapshot ? false : true;
                    this.orderList = Object.keys(ordersSnapshot);
                    this.orderList.sort(function (a, b) {
                        return b - a;
                    });
                    this.noOfPages = Math.ceil(this.orderList.length / this.noOfItemsPerPage);
                    console.log(this.orderList);
                    this.orders = {};
                    this.loadPage();
                });
        },
        loadPage(page = 1) {
            this.isLoading = true;
            this.currentPage = page;
            let start = 0 + this.noOfItemsPerPage * (page - 1);
            let end = this.noOfItemsPerPage * page;
            let currentPageResults = this.orderList.slice(start, end);
            currentPageResults.forEach(async (orderId) => {
                this.orders[orderId] = await firebase.database().ref().child("orders").child(orderId).once('value')
                    .then((snapshot) => {
                        return snapshot.val();
                    });
            });
            console.log(this.orders);
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
            console.log(this.order);
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
                firebase.database().ref().child("orders").child(this.orderId).once('value')
                    .then(async (snapshot) => {
                        this.order = snapshot.val();
                        await fetch('/api/shipping-zones.json')
                            .then(response => response.json())
                            .then((data) => {
                                this.shippingZones = data;
                            });
                        this.isLoading = false;
                    });
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