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

function productModule() {
    return {
        isLoading: true,
        statuses: {
            'D': { name: 'Draft', color: '' },
            'P': { name: 'Published', color: '' }
        },
        stockStatuses: {
            'IS': { name: 'In stock', color: 'green' },
            'OS': { name: 'Out of stock', color: 'red' },
            'OB': { name: 'On backorder', color: 'yellow' }
        },
        products: null,
        categories: null,
        product: null,
        productId: null,
        showModal: false,
        modalVariantId: null,
        modalDefaultVariant: null,
        modalVariant: null,
        modalTitle: null,
        productGallery: [],
        imagesToDelete: [],
        minProductSeq: null,
        maxProductSeq: null,
        noOfItemsPerPage: getCookie('products_no_of_rows'),
        firstPage: null,
        lastPage: null,
        searchSKU: false,
        skuFiltered: false,
        async loadProducts() {
            if (!this.noOfItemsPerPage) {
                this.noOfItemsPerPage = "10";
            }
            setCookie('products_no_of_rows', this.noOfItemsPerPage, 365);

            this.categories = await firebase.database().ref().child("categories").once('value')
                .then((snapshot) => { return snapshot.val(); });

            this.maxProductSeq = await firebase.database().ref().child("sequence").child("products").once('value')
                .then((snapshot) => { return snapshot.val(); });

            firebase.database().ref().child("products").orderByKey().startAfter("0").limitToFirst(parseInt(this.noOfItemsPerPage)).once('value')
                .then((snapshot) => {
                    this.products = snapshot.val();
                    this.minProductSeq = Math.min(...Object.keys(this.products).map(v => parseInt(v))).toString();
                    this.firstPage = true;
                    if (this.maxProductSeq <= Math.max(...Object.keys(this.products).map(v => parseInt(v))).toString()) {
                        this.lastPage = true;
                    } else {
                        this.lastPage = false;
                    }
                    this.isLoading = false;
                });
        },
        loadNextPage() {
            if (this.lastPage) {
                return;
            }
            this.isLoading = true;
            let startAfter = Math.max(...Object.keys(this.products).map(v => parseInt(v))).toString();
            firebase.database().ref().child("products").orderByKey().startAfter(startAfter).limitToFirst(parseInt(this.noOfItemsPerPage)).once('value')
                .then((snapshot) => {
                    this.products = snapshot.val();
                    this.firstPage = false;
                    if (this.maxProductSeq <= Math.max(...Object.keys(this.products).map(v => parseInt(v))).toString()) {
                        this.lastPage = true;
                    } else {
                        this.lastPage = false;
                    }
                    this.isLoading = false;
                });
        },
        loadPreviousPage() {
            if (this.firstPage) {
                return;
            }
            this.isLoading = true;
            let endBefore = Math.min(...Object.keys(this.products).map(v => parseInt(v))).toString();
            firebase.database().ref().child("products").orderByKey().endBefore(endBefore).limitToLast(parseInt(this.noOfItemsPerPage)).once('value')
                .then((snapshot) => {
                    this.products = snapshot.val();
                    this.lastPage = false;
                    if (this.minProductSeq >= Math.min(...Object.keys(this.products).map(v => parseInt(v))).toString()) {
                        this.firstPage = true;
                    } else {
                        this.firstPage = false;
                    }
                    this.isLoading = false;
                });
        },
        searchProduct(sku) {
            this.searchSKU = false;
            this.isLoading = true;
            firebase.database().ref().child("products").orderByKey().equalTo(sku).once('value')
                .then((snapshot) => {
                    this.products = snapshot.val();
                    this.isLoading = false;
                    this.firstPage = true;
                    this.lastPage = true;
                    this.skuFiltered = true;
                });
        },
        addProduct() {
            this.loadProduct(null, null);
        },
        loadProduct(product, index) {
            this.productGallery = [];
            this.imagesToDelete = [];
            this.productId = index;

            if (this.productId) {
                this.product = JSON.parse(JSON.stringify(product));;
                if (this.product.gallery == undefined) {
                    this.product.gallery = [];
                }
                if (this.product.tags == undefined) {
                    this.product.tags = {};
                }
                if (this.product.categories == undefined) {
                    this.product.categories = [];
                }
                for (let i in this.categories) {
                    if (this.product.categories[i] == undefined) {
                        this.product.categories[i] = false;
                    }
                }
            } else {
                this.product = {
                    generalInfo: {
                        name: '',
                        description: ''
                    },
                    publish: {
                        status: '',
                        createdOn: null,
                        lastUpdatedOn: null
                    },
                    variants: [],
                    categories: [],
                    tags: {},
                    gallery: [],
                    saleCount: 0
                }
                for (let i in this.categories) {
                    this.product.categories[i] = false;
                }
            }
            this.loadProductGallery();
            console.log(this.product);
        },
        closeProduct() {
            // window.location.reload();
            this.productId = null;
            this.product = null;
            this.productGallery = [];
            this.imagesToDelete = [];
        },
        addVariant() {
            this.modalTitle = 'Add Variant';
            this.showModal = true;
            this.modalDefaultVariant = this.product.variants.length == 0 ? true : false;
            this.modalVariant = {
                name: null,
                image: null,
                regularPrice: null,
                salePrice: null,
                stockStatus: null,
                stockQuantity: null,
                weight: null,
                length: null,
                width: null,
                height: null,
                saleCount: 0
            }
        },
        editVariant(variant, index) {
            this.modalTitle = 'Edit Variant';
            this.showModal = true;
            this.modalVariantId = index;
            this.modalDefaultVariant = this.product.generalInfo.defaultVariant == this.modalVariantId ? true : false;
            this.modalVariant = JSON.parse(JSON.stringify(variant));
        },
        saveVariant() {
            if (this.modalTitle == 'Add Variant') {
                this.product.variants.push(this.modalVariant);
                this.loadProductGallery();
            } else if (this.modalTitle == 'Edit Variant') {
                if (this.product.variants[this.modalVariantId].image != this.modalVariant.image) {
                    this.imagesToDelete.push(this.product.variants[this.modalVariantId].image);
                }
                this.product.variants[this.modalVariantId] = this.modalVariant;
                this.loadProductGallery();
            }
            if (this.modalDefaultVariant) {
                this.product.generalInfo.defaultVariant = (this.modalVariantId || 0);
            }
            this.cancelModal();
        },
        removeVariant(index) {
            this.imagesToDelete.push(this.product.variants[index].image);
            this.product.variants.splice(index, 1);
            this.loadProductGallery();
        },
        cancelModal() {
            this.showModal = false;
            this.modalVariantId = null;
            this.modalDefaultVariant = null;
            this.modalVariant = null;
            this.modalTitle = null;
        },
        loadProductGallery() {
            if (this.product) {
                this.productGallery = [];
                for (let i in this.product.variants) {
                    this.productGallery.push({ image: this.product.variants[i].image, variant: true });
                }
                for (let i in this.product.gallery) {
                    this.productGallery.push({ image: this.product.gallery[i], variant: false });
                }
            }
        },
        uploadImages($event) {
            files = Object.values($event.target.files);
            files.forEach(file => {
                this.product.gallery.push(URL.createObjectURL(file));
            });
            this.loadProductGallery();
        },
        removeImage(imageURL) {
            for (let i in this.product.gallery) {
                if (this.product.gallery[i] == imageURL) {
                    if (imageURL.startsWith("https://")) {
                        this.imagesToDelete.push(imageURL);
                    }
                    this.product.gallery.splice(i, 1);
                    break;
                }
            }
            this.loadProductGallery();
        },
        addTag(tag) {
            if (tag) {
                var format = /[ `!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~]/;
                if (!format.test(tag)) {
                    this.product.tags[tag] = true;
                } else {
                    alert('Tag can\'t contain special charecters');
                }
            }
        },
        removeTag(tag) {
            this.product.tags[tag] = null;
        },
        async uploadImageToStorage(imageURL) {
            console.log(imageURL);
            console.log(this.productId);
            let imageBLOB = await fetch(imageURL).then(r => r.blob());
            console.log(`products/${this.productId}/${imageURL.substr(imageURL.lastIndexOf('/') + 1)}`);
            return await firebase.storage().ref()
                .child(`products/${this.productId}/${imageURL.substr(imageURL.lastIndexOf('/') + 1)}`)
                .put(imageBLOB)
                .then(function (snapshot) {
                    return snapshot.ref.getDownloadURL();
                });
        },
        getFloat(stringFloat) {
            return stringFloat ? parseFloat(stringFloat) : null;
        },
        async saveProduct() {
            if (!this.productId) {
                let productSequence = await firebase.database().ref().child("sequence").child("products")
                    .transaction(function (currentValue) {
                        return (currentValue || 0) + 1;
                    });
                this.productId = productSequence.snapshot.val();
            }
            const updates = {};
            for (let i in this.product.variants) {
                if (this.product.variants[i].image.startsWith("blob:")) {
                    this.product.variants[i].image = await this.uploadImageToStorage(this.product.variants[i].image);
                }
                this.product.variants[i].height = this.getFloat(this.product.variants[i].height);
                this.product.variants[i].width = this.getFloat(this.product.variants[i].width);
                this.product.variants[i].length = this.getFloat(this.product.variants[i].length);
                this.product.variants[i].weight = this.getFloat(this.product.variants[i].weight);
                this.product.variants[i].regularPrice = this.getFloat(this.product.variants[i].regularPrice);
                this.product.variants[i].salePrice = this.getFloat(this.product.variants[i].salePrice);
                this.product.variants[i].stockQuantity = this.getFloat(this.product.variants[i].stockQuantity);
                updates[`stock/${this.productId}/${i}`] = this.getFloat(this.product.variants[i].stockQuantity);
            }
            for (let i in this.product.gallery) {
                if (this.product.gallery[i].startsWith("blob:")) {
                    this.product.gallery[i] = await this.uploadImageToStorage(this.product.gallery[i]);
                }
            }
            for (let i in this.imagesToDelete) {
                await firebase.storage().refFromURL(this.imagesToDelete[i]).delete();
            }
            this.imagesToDelete = [];
            for (let i in this.product.categories) {
                updates[`categories/${i}/products/${this.productId}`] = this.product.categories[i] ? true : null;
                if (!this.product.categories[i]) {
                    delete this.product.categories[i];
                }
            }
            for (let tag in this.product.tags) {
                updates[`tags/${tag}/products/${this.productId}`] = this.product.tags[tag];
            }
            if (!this.product.publish.createdOn) {
                this.product.publish.createdOn = new Date().getTime();
            }
            this.product.publish.lastUpdatedOn = new Date().getTime();
            updates[`products/${this.productId}`] = this.product;
            console.log(this.product);
            console.log(updates);
            firebase.database().ref().update(updates);
            this.loadProductGallery();
            if (!this.products) { this.products = [] }
            this.products[this.productId] = this.product;
        },
        deleteProduct(productId) {
            let deleteConfirm = confirm("Confirm delete?");
            if (deleteConfirm) {
                firebase.app().database().ref('products/' + productId).remove();
                delete this.products[productId];
            }
        },
        getCategoriesName(categories) {
            return categories ? Object.keys(categories).map(c => this.categories[c].name).join(', ') : "—";
        },
        getPriceRange(variants) {
            let priceList = [];
            for (let variantId in variants) {
                if (variants[variantId].salePrice) {
                    priceList.push(variants[variantId].salePrice);
                } else {
                    priceList.push(variants[variantId].regularPrice);
                }
            }
            let min = Math.min(...priceList);
            let max = Math.max(...priceList);
            if (min == max) {
                return '₹' + min;
            } else {
                return '₹' + min + ' - ₹' + max;
            }
        }
    }
}

function orderModule() {
    return {
        isLoading: true,
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
                color: 'yellow',
                emailSubject: 'Your Holi Colours Jewellery order has been put on hold!',
                emailHeader: 'Your order is on hold',
                emailContent: 'Your order details are shown below for your reference.',
                emailAdditionalContent: 'We look forward to fulfilling your order soon.'
            },
            'PR': {
                name: 'Processing',
                color: 'green',
                emailSubject: 'Your Holi Colours Jewellery order has been received!',
                emailHeader: 'Thank you for your order',
                emailContent: 'Your order has been received and is now being processed. Your order details are shown below for your reference.',
                emailAdditionalContent: 'Thanks for shopping with us.'
            },
            'DI': {
                name: 'Dispatched',
                color: 'blue',
                emailSubject: 'Your Holi Colours Jewellery order has been dispatched!',
                emailHeader: 'Your order has been dispatched',
                emailContent: 'We have dispatched your order. Your order details are shown below for your reference.',
                emailAdditionalContent: 'Thanks for shopping with us.'
            },
            'CO': {
                name: 'Completed',
                color: 'gray',
                emailSubject: 'Your Holi Colours Jewellery order is now complete',
                emailHeader: 'Thanks for shopping with us',
                emailContent: 'We have finished processing your order. Your order details are shown below for your reference.',
                emailAdditionalContent: 'Thanks for shopping with us.'
            },
            'CA': {
                name: 'Cancelled',
                color: 'gray',
                emailSubject: 'Your Holi Colours Jewellery order has been cancelled',
                emailHeader: 'Your order has been cancelled',
                emailContent: 'Your order details are shown below for your reference.',
                emailAdditionalContent: 'Thanks for reading.'
            }
        },
        currentStatus: null,
        trackingURL: null,
        minOrderSeq: null,
        maxOrderSeq: null,
        noOfItemsPerPage: getCookie('orders_no_of_rows'),
        firstPage: null,
        lastPage: null,
        searchOrder: null,
        orderFiltered: false,
        searchCustomer: null,
        customerFiltered: false,
        searchStatus: null,
        statusFiltered: false,
        statusSearchTerm: null,
        async loadOrders() {
            if (!this.noOfItemsPerPage) {
                this.noOfItemsPerPage = "10";
            }
            setCookie('orders_no_of_rows', this.noOfItemsPerPage, 365);

            this.maxOrderSeq = await firebase.database().ref().child("sequence").child("orders").once('value')
                .then((snapshot) => { return snapshot.val(); });

            let ordersRef;

            if (this.statusSearchTerm) {
                ordersRef = firebase.database().ref().child("orders").orderByChild('generalInfo/status').equalTo(this.statusSearchTerm).limitToLast(parseInt(this.noOfItemsPerPage));
                this.statusFiltered = true;
                this.searchStatus = false;
            } else {
                ordersRef = firebase.database().ref().child("orders").orderByKey().startAfter("0").limitToLast(parseInt(this.noOfItemsPerPage));
            }

            ordersRef.once('value')
                .then((snapshot) => {
                    this.orders = snapshot.val();
                    this.firstPage = true;
                    if (Object.keys(this.orders).length < parseInt(this.noOfItemsPerPage)) {
                        this.lastPage = true;
                    } else {
                        this.lastPage = false;
                    }
                    this.isLoading = false;
                });
        },
        loadNextPage() {
            if (this.lastPage) {
                return;
            }
            this.isLoading = true;
            let endBefore = Math.min(...Object.keys(this.orders).map(v => parseInt(v))).toString();
            firebase.database().ref().child("orders").orderByKey().endBefore(endBefore).limitToLast(parseInt(this.noOfItemsPerPage)).once('value')
                .then((snapshot) => {
                    if (snapshot.val()) {
                        this.orders = snapshot.val();
                        if (Object.keys(this.orders).length < parseInt(this.noOfItemsPerPage)) {
                            this.lastPage = true;
                        }
                        this.firstPage = false;
                    } else {
                        this.lastPage = true;
                    }
                    this.isLoading = false;
                });
        },
        loadPreviousPage() {
            if (this.firstPage) {
                return;
            }
            this.isLoading = true;
            let startAfter = Math.max(...Object.keys(this.orders).map(v => parseInt(v))).toString();
            firebase.database().ref().child("orders").orderByKey().startAfter(startAfter).limitToFirst(parseInt(this.noOfItemsPerPage)).once('value')
                .then((snapshot) => {
                    if (snapshot.val()) {
                        this.orders = snapshot.val();
                        this.lastPage = false;
                    } else {
                        this.firstPage = true;
                    }
                    this.isLoading = false;
                });
        },
        searchOrderByNumber(orderNumber) {
            this.searchOrder = false;
            this.searchCustomer = false;
            this.searchStatus = false;
            this.isLoading = true;
            firebase.database().ref().child("orders").orderByKey().equalTo(orderNumber).once('value')
                .then((snapshot) => {
                    this.orders = snapshot.val();
                    this.isLoading = false;
                    this.firstPage = true;
                    this.lastPage = true;
                    this.orderFiltered = true;
                    this.customerFiltered = false;
                    this.statusFiltered = false;
                });
        },
        loadOrder(order, id) {
            this.orderId = id;
            this.order = JSON.parse(JSON.stringify(order));
            if (this.order.notes == undefined) {
                this.order.notes = [];
            }
            if (Array.isArray(this.order.cart.products)) {
                this.order.cart.products = { ...this.order.cart.products };
                for (let i in this.order.cart.products) {
                    if (!this.order.cart.products[i]) {
                        delete this.order.cart.products[i];
                    }
                }
            }
            this.currentStatus = this.order.generalInfo.status;
            this.sortNotes();
            console.log(this.order);
        },
        closeOrder() {
            this.orderId = null;
            this.order = null;
            this.currentStatus = null;
        },
        sendEmail(orderId, order, subject, header, content, additionalContent) {
            fetch('/.netlify/functions/email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    orderId: orderId,
                    order: order,
                    subject: subject,
                    header: header,
                    content: content,
                    additionalContent: additionalContent
                })
            })
                .then(response => response.json())
                .then(data => {
                    console.log(data);
                })
                .catch((error) => {
                    console.error(error);
                });
        },
        saveStatus() {
            this.order.generalInfo.lastUpdatedOn = new Date().getTime();
            const updates = {};
            updates[`orders/${this.orderId}/generalInfo/status`] = this.order.generalInfo.status;
            updates[`orders/${this.orderId}/generalInfo/lastUpdatedOn`] = this.order.generalInfo.lastUpdatedOn;
            firebase.database().ref().update(updates);
            let note = `Order status changed from ${this.statuses[this.currentStatus]['name']} to ${this.statuses[this.order.generalInfo.status]['name']}.`;
            if (this.order.generalInfo.status == 'DI' && this.trackingURL) {
                note += " Shipment Tracking URL: " + this.trackingURL;
            }
            this.addNote(note, false);
            this.sendEmail(
                this.orderId,
                this.order,
                this.statuses[this.order.generalInfo.status]['emailSubject'],
                this.statuses[this.order.generalInfo.status]['emailHeader'],
                this.statuses[this.order.generalInfo.status]['emailContent'],
                this.statuses[this.order.generalInfo.status]['emailAdditionalContent']
            );
            this.currentStatus = this.order.generalInfo.status;
            this.orders[this.orderId] = this.order;
        },
        addNote(note, sendEmail) {
            if (!note) {
                return;
            }
            let noteObject = {
                message: note,
                createdOn: new Date().getTime()
            }
            this.order.notes.push(noteObject);
            this.sortNotes();
            this.order.generalInfo.lastUpdatedOn = new Date().getTime();
            const updates = {};
            updates[`orders/${this.orderId}/notes/${this.order.notes.length - 1}`] = noteObject;
            updates[`orders/${this.orderId}/generalInfo/lastUpdatedOn`] = this.order.generalInfo.lastUpdatedOn;
            firebase.database().ref().update(updates);
            if (sendEmail) {
                var options = { year: 'numeric', month: 'long', day: 'numeric' };
                this.sendEmail(
                    this.orderId,
                    this.order,
                    'Note added to your Holi Colours Jewellery order from ' + new Date(this.order.generalInfo.createdOn).toLocaleDateString("en-US", options),
                    'A note has been added to your order',
                    `The following note has been added to your order: <blockquote><p style="margin:0 0 16px">${note}</p></blockquote>
                    As a reminder, here are your order details:`,
                    'Thanks for reading.'
                );
            }
            this.orders[this.orderId] = this.order;
        },
        sortNotes() {
            this.order.notes.sort((a, b) => {
                return b.createdOn - a.createdOn;
            });
        },
        printShippingAddress() {
            let address = this.order.customer.shipToAddress.address1
                + "\n"
                + this.order.customer.shipToAddress.address2
                + '\n'
                + this.order.customer.shipToAddress.city
                + ' - '
                + this.order.customer.shipToAddress.postalCode
                + '\n'
                + this.order.customer.shipToAddress.state
                + ', '
                + this.order.customer.shipToAddress.country;
            return address;
        }
    }
}


function customerModule() {
    return {
        isLoading: true,
        customers: null,
        loadCustomers() {
            firebase.database().ref().child("users")
                .orderByChild('userInfo/email').once('value')
                .then((snapshot) => {
                    this.customers = snapshot.val();
                    this.isLoading = false;
                    console.log(this.customers);
                });
        },
        searchCustomer(email) {
            firebase.database().ref().child("users").orderByChild('userInfo/email').equalTo(email).once('value')
                .then((snapshot) => {
                    this.customers = snapshot.val();
                    this.isLoading = false;
                    console.log(this.customers);
                });
        }
    }
}

// var chartOne = document.getElementById('chartOne');
// var myChart = new Chart(chartOne, {
//     type: 'bar',
//     data: {
//         labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
//         datasets: [{
//             label: '# of Votes',
//             data: [12, 19, 3, 5, 2, 3],
//             backgroundColor: [
//                 'rgba(255, 99, 132, 0.2)',
//                 'rgba(54, 162, 235, 0.2)',
//                 'rgba(255, 206, 86, 0.2)',
//                 'rgba(75, 192, 192, 0.2)',
//                 'rgba(153, 102, 255, 0.2)',
//                 'rgba(255, 159, 64, 0.2)'
//             ],
//             borderColor: [
//                 'rgba(255, 99, 132, 1)',
//                 'rgba(54, 162, 235, 1)',
//                 'rgba(255, 206, 86, 1)',
//                 'rgba(75, 192, 192, 1)',
//                 'rgba(153, 102, 255, 1)',
//                 'rgba(255, 159, 64, 1)'
//             ],
//             borderWidth: 1
//         }]
//     },
//     options: {
//         scales: {
//             yAxes: [{
//                 ticks: {
//                     beginAtZero: true
//                 }
//             }]
//         }
//     }
// });

// var chartTwo = document.getElementById('chartTwo');
// var myLineChart = new Chart(chartTwo, {
//     type: 'line',
//     data: {
//         labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
//         datasets: [{
//             label: '# of Votes',
//             data: [12, 19, 3, 5, 2, 3],
//             backgroundColor: [
//                 'rgba(255, 99, 132, 0.2)',
//                 'rgba(54, 162, 235, 0.2)',
//                 'rgba(255, 206, 86, 0.2)',
//                 'rgba(75, 192, 192, 0.2)',
//                 'rgba(153, 102, 255, 0.2)',
//                 'rgba(255, 159, 64, 0.2)'
//             ],
//             borderColor: [
//                 'rgba(255, 99, 132, 1)',
//                 'rgba(54, 162, 235, 1)',
//                 'rgba(255, 206, 86, 1)',
//                 'rgba(75, 192, 192, 1)',
//                 'rgba(153, 102, 255, 1)',
//                 'rgba(255, 159, 64, 1)'
//             ],
//             borderWidth: 1
//         }]
//     },
//     options: {
//         scales: {
//             yAxes: [{
//                 ticks: {
//                     beginAtZero: true
//                 }
//             }]
//         }
//     }
// });