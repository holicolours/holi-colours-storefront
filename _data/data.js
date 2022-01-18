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
    let products = await firebase.database().ref().child("products").orderByChild("publish/status").equalTo("P").once('value').then((snapshot) => { 
        let prdList = [];
        let prdObj = snapshot.val();
        for (var pid in prdObj) {
            prdList[pid] = prdObj[pid];
        }
        return prdList 
    });
    let categories = await firebase.database().ref().child("categories").once('value').then((snapshot) => { return snapshot.val() });
    let tags = await firebase.database().ref().child("tags").once('value').then((snapshot) => { return snapshot.val() });
    let shippingZones = await firebase.database().ref().child("shipping").once('value').then((snapshot) => { return snapshot.val() });
    let shippingMethods = await firebase.database().ref().child("shippingMethods").once('value').then((snapshot) => { return snapshot.val() });
    let banner = await firebase.database().ref().child("config").child("banner").once('value').then((snapshot) => { return snapshot.val() });

    orderedCategories = Object.keys(categories);
    orderedCategories.sort(function (a, b) {
        return categories[a]['order'] - categories[b]['order'];
    });

    let categoryList = [];

    for (var cid in categories) {
        categoryList[cid] = categories[cid];
    }

    categories = categoryList;

    if (banner.message == undefined) {
        banner.message = '';
    }

    let coupons = [];

    for (var coupon in discountCoupons) {
        let currentTime = new Date().getTime();
        if (currentTime >= discountCoupons[coupon].startTime && currentTime <= discountCoupons[coupon].endTime) {
            coupons.push(coupon);
        }
    }

    coupons.sort(function (a, b) {
        return discountCoupons[a].createdOn - discountCoupons[b].createdOn;
    });

    console.log('Available Coupons: ' + coupons);

    let bestSellerList = [];
    let priceLowToHighList = [];
    let priceHighToLowList = [];
    let dateOldToNewList = [];
    let dateNewToOldList = [];
    let onSaleList = [];

    for (var pid in products) {
        products[pid].id = pid;
        let dv = products[pid].generalInfo.defaultVariant;

        if (!products[pid]['saleCount']) {
            products[pid].saleCount = 0;
        }

        for (var i in coupons) {
            let coupon = coupons[i];
            if (discountCoupons[coupon].couponType == 'sale' && discountCoupons[coupon].products && discountCoupons[coupon].products[pid]) {
                products[pid].isOnSale = true;
                products[pid].salePercentage = discountCoupons[coupon].discountPercentage;
                products[pid].offers = [];
                break;
            } else if (discountCoupons[coupon].couponType == 'offer') {
                products[pid].isOnSale = false;
                if (products[pid].offers == undefined) {
                    products[pid].offers = [];
                }
                products[pid].offers.push(discountCoupons[coupon]);
            }
        }

        products[pid].variantImages = [];

        for (var vid in products[pid].variants) {
            products[pid].variants[vid].id = vid;

            if (products[pid].isOnSale && products[pid].salePercentage) {
                products[pid].variants[vid].salePrice = Math.round(products[pid].variants[vid].regularPrice * (1 - products[pid].salePercentage / 100));
                products[pid].variants[vid].salePercentage = products[pid].salePercentage;
            } else {
                if (!products[pid].variants[vid].salePrice) {
                    products[pid].variants[vid].salePrice = products[pid].variants[vid].regularPrice;
                } else {
                    products[pid].variants[vid].salePercentage = Math.round(((products[pid].variants[vid].regularPrice - products[pid].variants[vid].salePrice) / products[pid].variants[vid].regularPrice) * 100);
                }
            }

            if (!products[pid].variants[vid]['saleCount']) {
                products[pid].variants[vid].saleCount = 0;
            }
            if (!products[pid].variants[vid]['image']) {
                products[pid].variants[vid].image = products[pid].variants[dv].image;
            }
            products[pid].variantImages.push(products[pid].variants[vid].image);
        }

        products[pid].variantImages = [...new Set(products[pid].variantImages)];

        if (products[pid]['categories']) {
            products[pid].categories = Object.keys(products[pid].categories);
            products[pid].categories.sort(function (a, b) {
                return categories[a]['order'] - categories[b]['order'];
            });
        } else {
            products[pid].categories = [];
        }

        let relatedProducts = [];
        for (var i in products[pid].categories) {
            let cid = products[pid].categories[i];
            for (var relatedPID in categories[cid].products) {
                if (pid != relatedPID) {
                    relatedProducts.push(relatedPID);
                }
            }
        }
        products[pid].relatedProducts = [...new Set(relatedProducts)];

        let product = {
            id: pid,
            name: products[pid].generalInfo.name,
            slug: products[pid].generalInfo.slug,
            image: products[pid].variants[dv].image,
            regularPrice: products[pid].variants[dv].regularPrice,
            salePrice: products[pid].variants[dv].salePrice,
            salePercentage: products[pid].variants[dv]['salePercentage'],
            saleCount: products[pid]['saleCount'] ? products[pid]['saleCount'] : 0,
            defaultVariant: dv
        };

        products[pid].info = product;

        bestSellerList.push(product);
        priceLowToHighList.push(product);
        priceHighToLowList.push(product);
        dateOldToNewList.push(product);
        dateNewToOldList.push(product);

        if (products[pid].salePercentage) {
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

    for (var pid in products) {
        products[pid].relatedProducts.sort(function (a, b) {
            return products[b].saleCount - products[a].saleCount;
        });
        products[pid].relatedProducts = products[pid].relatedProducts.slice(0, 8);
        if (products[pid].relatedProducts.length != 8) {
            for (var j in bestSellerList) {
                if (!products[pid].relatedProducts.includes(bestSellerList[j].id)) {
                    products[pid].relatedProducts.push(bestSellerList[j].id);
                    if (products[pid].relatedProducts.length == 8) {
                        break;
                    }
                }
            }
        }
    }

    for (var cid in categories) {
        categories[cid].id = cid;

        if (categories[cid]['products']) {
            categories[cid].products = Object.keys(categories[cid].products);
        } else {
            categories[cid].products = [];
        }

        categories[cid].noOfProducts = Object.keys(categories[cid].products).length;

        let featuredCollections = [];
        for (var i in categories[cid].products) {
            let pid = categories[cid].products[i];
            if (products[pid] && categories[cid].featured) {
                featuredCollections.push(products[pid].info);
            }
        }
        featuredCollections = featuredCollections.filter(p => p);
        featuredCollections.sort(function (a, b) {
            return b.saleCount - a.saleCount;
        });
        categories[cid].featuredCollections = featuredCollections.slice(0, 8);
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

    let announcements = [];
    announcements.push({
        message: 'Secure Online Payment'
    });
    announcements.push({
        message: 'No Cash on Delivery'
    });
    announcements.push({
        message: 'Save while shopping'
    });

    let reviews = [];
    reviews.push({
        name: 'Varsha B',
        message: 'A big thanks to Holi Colours Jewellery for bringing such unique designs along with super fast delivery',
        images: ['https://firebasestorage.googleapis.com/v0/b/holi-colours-jewellery.appspot.com/o/products%2F10%2Freviews%2F5946666c-1bfa-445f-a654-a91ec4e0d426?alt=media&token=eea67ad3-d6a0-459e-afd1-91f8a045afa9']
    });
    reviews.push({
        name: 'Vishnupriya',
        message: 'Amazing designs and at such reasonable prices. Loved the experience.',
        images: ['https://firebasestorage.googleapis.com/v0/b/holi-colours-jewellery.appspot.com/o/products%2F10%2Freviews%2F0c26e499-5242-4b5c-965e-04b08c968a74?alt=media&token=d70762d1-9b3d-4382-a5aa-2448e4295ea4']
    });
    reviews.push({
        name: 'Aditya',
        message: 'Got this as a gift for my Mom - she absolutely loved it! Thanks Holi Colours!',
        images: ['https://firebasestorage.googleapis.com/v0/b/holi-colours-jewellery.appspot.com/o/products%2F10%2Freviews%2Fd9d838b6-9dc1-4b06-bd14-0d6c663818ff?alt=media&token=bc1e9824-021d-42a6-83ea-ecde23410b69']
    });
    reviews.push({
        name: 'Sanu',
        message: `Best Silver Jewellery. Holi Colours's collection is a mix of Modern yet traditional, and affordable as well.`,
        images: ['https://firebasestorage.googleapis.com/v0/b/holi-colours-jewellery.appspot.com/o/products%2F10%2Freviews%2F5438c967-cec4-41f4-b542-9fd53c8c4156?alt=media&token=c4ecddd6-9240-429a-af13-0e973c371c00']
    });

    let faqs = [];
    faqs.push({
        question: `How many days does the product takes to arrive?`,
        answer: `It takes 7-10 working days to deliver our products across India (the product will be dispatched within 4 working days from your payment date. Saturday and Sunday are not accountable).`
    });
    faqs.push({
        question: `Is there an option to get your product before the defined delivery time?`,
        answer: `Yes, we do have two options on the site (Standard and Express Delivery). Please select the "Express Delivery" shipping method on the Checkout page.`
    });
    faqs.push({
        question: `Where can I get the product's real image?`,
        answer: `All the pictures on the website were taken by our in-house photographer without editing and filter in place.`
    });
    faqs.push({
        question: `Where and when can I get the tracking id?`,
        answer: `You'll get your tracking id via mail on the 4th working day from your payment date.`
    });
    faqs.push({
        question: `Will you ship overseas?`,
        answer: `Yes, we do. Please text us on WhatsApp (87788-76584) and our team will assist you.`
    });
    faqs.push({
        question: `What should I do if I haven't got the product within the defined time?`,
        answer: `Please send an email to holicolourscustomercare@gmail.com. Our team will assist you within 30 minutes`
    });
    faqs.push({
        question: `Will you take back your product in case of damage?`,
        answer: `Yes, we do. Please text us on WhatsApp (87788-76584) with the product unboxing video and our team will assist you.`
    });
    faqs.push({
        question: `Does Cash On Delivery/Installment options available for payment?`,
        answer: `No, as of now we are not offering both of these options. We will let you know if we enable these options in the future.`
    });
    faqs.push({
        question: `Do you have whatsapp broadcast group?`,
        answer: `Yes we do have, please do text us in whatsapp so that we'll add you to our regular update broadcast ( it is not a reseller group .. So please don't reach us for reselling )`
    });
    faqs.push({
        question: `What is the jewellery made of ?`,
        answer: `Each Jewellery is made up of " base metal " such as Copper, Brass, Zinc, and Bronze 
        Then coated with premium quality matte or antique polish`
    });
    faqs.push({
        question: `How to take care of jewellery?`,
        answer: `Please do visit jewellery care instruction page`
    });
    faqs.push({
        question: `Is their any guarantee or warranty for jewellery?`,
        answer: `No, but we'll serve you with premium quality products.`
    });
    faqs.push({
        question: `What if a product I want to buy is Sold Out?`,
        answer: `We do have subscribe button on the right side of particular jewellery please do subscribe it .. So that our team can work on restocking process in no time. As well you can pre book it via whatsapp 8778876584.`
    });
    faqs.push({
        question: `Will the products be checked for damage before dispatch?`,
        answer: `Yes, before packing your order had been undergone 3 step verification.`
    });
    faqs.push({
        question: `What will be the Size of the product?`,
        answer: `The approx. size in terms of dimensions and weight are mentioned in the description of the post.`
    });
    faqs.push({
        question: `Can I speak to someone about a problem on the website?`,
        answer: `We always welcome your valuable feedback and strive to offer you the joy of jewellery shopping with every visit. You can contact us by email holicolourscustomercare@gmail.com or via whatsapp 8778876584.`
    });
    faqs.push({
        question: `Do you have a physical outlet?`,
        answer: `No, we don't have any physical outlet.`
    });
    faqs.push({
        question: `How do I know if my order has been confirmed?`,
        answer: `You'll get notified right from ordering to delivery via registered mail.`
    });
    faqs.push({
        question: `Do I need to create an account to buy products?`,
        answer: `It is optional but our expert team suggest you to create account so that it'll help you manage address, card details securely, your order history, etc.,`
    });
    faqs.push({
        question: `How do I track my order?`,
        answer: `Once your order is dispatched you'll get tracking id via mail as well how to track procedure too..that will help you locate your parcel.`
    });
    faqs.push({
        question: `Do you undertake bulk orders?`,
        answer: `Yes please text us 8778876584.`
    });
    faqs.push({
        question: `Can I transfer funds through NEFT/IMPS and will you undertake such orders through WhatsApp?`,
        answer: `Yes, if you are a person who is unaware of Net banking, Card based payments, Google Pay, we can definitely undertake such orders over what’s app and help you with NEFT/IMPS details.`
    });

    return {
        products: products,
        categories: categories,
        orderedCategories: orderedCategories,
        announcements: announcements,
        reviews: reviews,
        topBestSellers: bestSellerList.slice(0,8),
        tags: tags,
        faqs: faqs,
        productTags: Object.keys(tags),
        onSale: { id: 'on-sale', name: 'On Sale' },
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