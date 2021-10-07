var firebase = require('firebase-admin');

const serviceAccount = {
    "type": "service_account",
    "project_id": "holi-colours-jewellery",
    "private_key_id": "a58823557e808ef91ec120c40c7e14354e6b18e7",
    "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvAIBADANBgkqhkiG9w0BAQEFAASCBKYwggSiAgEAAoIBAQCqpsbWfiAZKZ47\nouOz4E4BJ1Zg4v2FbsfupZqiJFTbQZY2qPYFITnuVaFyrHZ8KtymgKi34+scsprk\nnG5Kx0KAqSALHNnAIp8xmB2ajmbSwGNY4t5sh+FpehYlP00FP/hYlqMNG+HCGczD\nbI75CUSOXW5O81Vy5tMTiSlDnNcSacXmZFctJ6wFN5gMRuR3Hb6na6NQGD9oRfzt\n0VnFfG+w8N8UIgt+7Onsuga5P+XDBeV2mGWGQE9qad6X6u74Hi4pdlBfnWwCz3O5\nCq7nh6FqMJqll5TxaRGC86RkqZ+Tg7GRwu0P738eh57lG5dbYS1yMg1aOMv4ChBK\nSs/sDK3TAgMBAAECggEAGyabviak/rvjZAOfjM/kOUTD9nhG88LTZoHMn31+TsAZ\noSqysdA+gk/3duI/m7PKFWek8FT/5Dn6cOL+nUEksIm4AmydrHcVsvNLynpbm65m\nYA8Aam4YDAsTmOuAWpR588ZLvNsxyQsHzBPqj27NDIWK9l66uqRE8vfAq/Q5N8F/\n2+aeEDytQpNQUHsCKCZ638TqWBdxPEVxMzCJ5UT/U2CaeX0Ejy1dWWmFc3z+FuXq\nDVLTlWAfI3tIaYWni+xMShQehMmPbN0+9Phls6YcuEbtlnneFGxm4x2EK28t3gHT\nUAKJ1/pvg+obx8Uodva4O3FqfVbV3euS6F11U/3ncQKBgQDaLvfLNlLhLM59k4j+\nA1KhxCLHrW39jpKtxW5N3AR6RPoVlJMq/6qBbKUrmXTWc3mVcHcqt2JlcNjw5Ruv\nAZ61GIivcrUoNIF7xgFNzuHmR41y2i58aES1escAJR9L2MhQi1oxwGbyavtomaei\ndG1jOGjfBUzWetHdKKWTU9rXyQKBgQDIOsN8KBBLGNHqxdnALCLV1EnpMBAwCG4c\ncW842KD4SPrK64YvOrzVlriksWXq2q6jE4m5Sw5qVzIc16jyliL1BKRzNmm4cLjF\nyPiRx/Ng+NvsEzaBfKInjWgAHyXtkMGVLUDjUTIweg6WvJBbbUUTXG/W1e7AtYe6\nC1GroWueuwKBgBqXDMXsSe99WXD+cPycBQ8H60Ewhq4XGRMqc4XzoWwRSfUlVUYx\nQGNjjUGiAxY7nn6y5SMElG5OcXHySgxrAx+I7OeM8D0FIR6ng/MqmmdJIxjzNCUf\nQ/hmDSicXZMNyWPfh892ZlV26krWJxLqY4ZrEoTTjYi6ESeF05//4TTZAoGAXxWY\n05Lq+d6VgRnnqBzNhiHD35rVdRnrwFIV8Tbeakmt30Mte6w3FG74zCz6KyciG4sh\nsf50oAc8Yvn+3wRxIU3NEnFajx3ogPRJJmF/sCM9vMP69E7Nal76bmRcTI6bf034\nLHrYjLDJ0MdG/kPLs8AH1EvPj3AlPjI13H1RcBUCgYAwCrBjqURfZ9Jd9+wFCFQS\ne7kHFQ0ITBn8pO1Zt604DRcn9GaRkLfo3IBuYbume5tvmebQ5yPgJMyaAEmOktim\nDJbPXnVx7WdaHniOKpFQ3xzCZZq6mFDsVflSeHvZ20cGpICZyuVVe6yLKtdf63yE\nMyUKkR2lMLusYGD4zqsc1w==\n-----END PRIVATE KEY-----\n",
    "client_email": "firebase-adminsdk-anxtl@holi-colours-jewellery.iam.gserviceaccount.com",
    "client_id": "109764840705438007823",
    "auth_uri": "https://accounts.google.com/o/oauth2/auth",
    "token_uri": "https://oauth2.googleapis.com/token",
    "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
    "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-anxtl%40holi-colours-jewellery.iam.gserviceaccount.com"
};

module.exports = async function () {
    console.log("Fetching data from Firebase Realtime Database...");

    let app;

    if (!firebase.apps.length) {
        app = firebase.initializeApp({
            credential: firebase.credential.cert(serviceAccount),
            databaseURL: "https://holi-colours-jewellery-default-rtdb.asia-southeast1.firebasedatabase.app/"
        });
    }

    let discountCoupons = await firebase.database().ref().child("discount").child("coupons").once('value').then((snapshot) => { return snapshot.val() });
    let products = await firebase.database().ref().child("products").orderByChild("publish/status").equalTo("P").once('value').then((snapshot) => { return snapshot.val() });
    let categories = await firebase.database().ref().child("categories").once('value').then((snapshot) => { return snapshot.val() });
    let tags = await firebase.database().ref().child("tags").once('value').then((snapshot) => { return snapshot.val() });
    let shippingZones = await firebase.database().ref().child("shipping").once('value').then((snapshot) => { return snapshot.val() });
    let shippingMethods = await firebase.database().ref().child("shippingMethods").once('value').then((snapshot) => { return snapshot.val() });
    let banner = await firebase.database().ref().child("config").child("banner").once('value').then((snapshot) => { return snapshot.val() });

    if (banner.message == undefined) {
        banner.message = '';
    }

    let onSaleCoupons = [];

    for (var coupon in discountCoupons) {
        let currentTime = new Date().getTime();
        console.log('currentTime: ' + currentTime);
        if (currentTime >= discountCoupons[coupon].startTime && currentTime <= discountCoupons[coupon].endTime) {
            onSaleCoupons.push(coupon);
        }
    }

    onSaleCoupons.sort(function (a, b) {
        return discountCoupons[a].createdOn - discountCoupons[b].createdOn;
    });

    console.log(onSaleCoupons);

    let bestSellerList = [];
    let priceLowToHighList = [];
    let priceHighToLowList = [];
    let dateOldToNewList = [];
    let dateNewToOldList = [];
    let onSaleList = [];

    for (var pid in products) {
        products[pid].id = pid;
        if (!products[pid]['saleCount']) {
            products[pid].saleCount = 0;
        }

        let salePercentage = null;
        let freeshipping = false;
        let couponCode = null;

        for (var i in onSaleCoupons) {
            let coupon = onSaleCoupons[i];
            if (discountCoupons[coupon].products[pid]) {
                salePercentage = discountCoupons[coupon].discountPercentage;
                freeshipping = discountCoupons[coupon].freeShipping;
                couponCode = coupon;
                break;
            }
        }

        if (freeshipping) {
            products[pid].freeshipping = freeshipping;
        }

        if (couponCode) {
            products[pid].couponCode = couponCode;
        }

        for (var vid in products[pid].variants) {
            products[pid].variants[vid].id = vid;

            if (salePercentage) {
                products[pid].variants[vid].salePrice = Math.round(products[pid].variants[vid].regularPrice * (1 - salePercentage / 100));
                products[pid].variants[vid].salePercentage = salePercentage;
            } else {
                products[pid].variants[vid].salePrice = products[pid].variants[vid].regularPrice;
            }

            if (!products[pid].variants[vid]['saleCount']) {
                products[pid].variants[vid].saleCount = 0;
            }
        }

        if (products[pid]['categories']) {
            products[pid].categories = Object.keys(products[pid].categories);
        } else {
            products[pid].categories = [];
        }

        let dv = products[pid].generalInfo.defaultVariant;
        let product = {
            id: pid,
            name: products[pid].generalInfo.name,
            image: products[pid].variants[dv].image,
            regularPrice: products[pid].variants[dv].regularPrice,
            salePrice: products[pid].variants[dv].salePrice,
            salePercentage: products[pid].variants[dv]['salePercentage'],
            saleCount: products[pid]['saleCount'] ? products[pid]['saleCount'] : 0,
            defaultVariant: dv
        };

        bestSellerList.push(product);
        priceLowToHighList.push(product);
        priceHighToLowList.push(product);
        dateOldToNewList.push(product);
        dateNewToOldList.push(product);

        if (salePercentage) {
            onSaleList.push(product);
        }
    }

    bestSellerList = bestSellerList.filter(p => p);
    priceLowToHighList = priceLowToHighList.filter(p => p);
    priceHighToLowList = priceHighToLowList.filter(p => p);
    dateOldToNewList = dateOldToNewList.filter(p => p);
    dateNewToOldList = dateNewToOldList.filter(p => p);

    bestSellerList.sort(function (a, b) {
        return b.saleCount - a.saleCount;
    });
    priceLowToHighList.sort(function (a, b) {
        return a.regularPrice - b.regularPrice;
    });
    priceHighToLowList.sort(function (a, b) {
        return b.regularPrice - a.regularPrice;
    });
    dateOldToNewList.sort(function (a, b) {
        return a.id - b.id;
    });
    dateNewToOldList.sort(function (a, b) {
        return b.id - a.id;
    });

    let newArrivals = dateNewToOldList.slice(0, 8);

    for (var cid in categories) {
        categories[cid].id = cid;

        if (categories[cid]['products']) {
            categories[cid].products = Object.keys(categories[cid].products);
        } else {
            categories[cid].products = [];
        }

        categories[cid].noOfProducts = Object.keys(categories[cid].products).length;

        let featuredCollections = [];
        for (var pid in categories[cid].products) {
            if (categories[cid].featured) {
                featuredCollections.push(bestSellerList[pid]);
            }
        }
        featuredCollections = featuredCollections.filter(p => p);
        featuredCollections.sort(function (a, b) {
            return b.saleCount - a.saleCount;
        });
        categories[cid].featuredCollections = featuredCollections.slice(0, 9);
    }

    for (var tag in tags) {
        if (tags[tag]['products']) {
            tags[tag].products = Object.keys(tags[tag].products);
        } else {
            tags[tag].products = [];
        }
    }

    firebase.database().goOffline();
    app.delete();

    return {
        products: products,
        categories: categories,
        tags: tags,
        productTags: Object.keys(tags),
        onSaleList: onSaleList,
        newArrivals: newArrivals,
        bestSellerList: bestSellerList,
        priceLowToHighList: priceLowToHighList,
        priceHighToLowList: priceHighToLowList,
        dateOldToNewList: dateOldToNewList,
        dateNewToOldList: dateNewToOldList,
        shippingZones: shippingZones,
        shippingMethods: shippingMethods,
        banner: banner,
        currentYear: new Date().getFullYear()
    };
};