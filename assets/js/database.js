let databaseURL = "https://holi-colours-jewellery-default-rtdb.asia-southeast1.firebasedatabase.app";
let idToken = null;

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
    getStock: async function (productId, selectedVariant) {
        let apiURL = `${databaseURL}/stock/${productId}/${selectedVariant}.json`;
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
    getOrder: async function (orderId) {
        let apiURL = `${databaseURL}/orders/${orderId}.json`;
        let order = await database.read(apiURL, true);
        return order;
    },
    getUserCart: async function (uid) {
        let apiURL = `${databaseURL}/carts/${uid}.json`;
        let userCart = await database.read(apiURL, true);
        return userCart;
    },
    getUserWishlist: async function (uid) {
        let apiURL = `${databaseURL}/wishlist/${uid}.json`;
        let userWishlist = await database.read(apiURL, true);
        return userWishlist;
    },
    addToCart: async function (uid, productId, selectedVariant, productQuantity) {
        let apiURL = `${databaseURL}/carts/${uid}/${productId}.json`;
        let updatedCart = await database.put(apiURL, {
            'quantity': productQuantity,
            'variant': selectedVariant
        }, true);
        return updatedCart;
    },
    updateCart: async function (uid, cart) {
        let apiURL = `${databaseURL}/carts/${uid}.json`;
        let updatedCart = await database.put(apiURL, cart, true);
        return updatedCart;
    },
    addToWishList: async function (uid, productId, selectedVariant) {
        let apiURL = `${databaseURL}/wishlist/${uid}/${productId}.json`;
        let updatedWishList = await database.put(apiURL, {
            'variant': selectedVariant
        }, true);
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
        return newReview.name;
    },
    getProduct: async function (productId) {
        let apiURL = `/api/products/${productId}.json`;
        let product = await database.read(apiURL);
        return product;
    }
};