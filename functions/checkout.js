const fetch = require("node-fetch");
const PaytmChecksum = require('paytmchecksum');
const firebase = require('firebase-admin');
const {
    PAYTM_MID,
    PAYTM_MKEY,
    PAYTM_SITE_NAME,
    PAYTM_CALLBACK_URL,
    PAYTM_PAYMENT_URL
} = process.env;

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

if (!firebase.apps.length) {
    firebase.initializeApp({
        credential: firebase.credential.cert(serviceAccount),
        databaseURL: "https://holi-colours-jewellery-default-rtdb.asia-southeast1.firebasedatabase.app/"
    });
}

exports.handler = async (event, context) => {
    try {
        let order = JSON.parse(event.body);

        var db = firebase.database();
        var dbRef = db.ref();

        order.generalInfo = {
            "createdOn": new Date().getTime(),
            "lastUpdatedOn": null,
            "status": "PP"
        };

        order.notes = [];

        order.cart.discount = 0;
        order.cart.quantity = 0;
        order.cart.subTotal = 0;
        order.cart.weight = 0;

        let discountCoupons = await dbRef.child("discount").child("coupons").once('value').then((snapshot) => { return snapshot.val() });

        let onSaleCoupons = [];

        for (var coupon in discountCoupons) {
            let currentTime = new Date().getTime();
            console.log(currentTime);
            if (currentTime >= discountCoupons[coupon].startTime && currentTime <= discountCoupons[coupon].endTime) {
                onSaleCoupons.push(coupon);
            }
        }

        onSaleCoupons.sort(function (a, b) {
            return discountCoupons[a].createdOn - discountCoupons[b].createdOn;
        });

        console.log(onSaleCoupons);

        let isOnSale = false;
        let freeshipping = false;

        const updates = {};

        for (var productId in order.cart.products) {
            await dbRef.child("products").child(productId).once('value')
                .then((snapshot) => {
                    let productId = snapshot.key;
                    let product = snapshot.val();

                    let selectedVariant = order.cart.products[productId].selectedVariant;
                    let variant = product.variants[selectedVariant];
                    let productName = order.cart.products[productId].variant ? `${product.generalInfo.name} [${order.cart.products[productId].variant}]` : product.generalInfo.name;

                    if (product.publish.status != 'P') {
                        throw { resultMsg: productName + ' cannot be ordered now. Please try again later!' };
                    }

                    if (variant.stockQuantity == 0) {
                        throw { resultMsg: productName + ' is not in stock!' };
                    } else if (order.cart.products[productId].quantity > variant.stockQuantity) {
                        throw { resultMsg: 'Only ' + stockQuantity + ' item(s) are in stock for ' + productName };
                    }

                    let salePercentage = null;
                    let couponCode = null;

                    for (var i in onSaleCoupons) {
                        let coupon = onSaleCoupons[i];
                        if ((discountCoupons[coupon].products && discountCoupons[coupon].products[productId]) || discountCoupons[coupon].applyShippingFor == 'all') {
                            if (discountCoupons[coupon].couponType == 'discount') {
                                couponCode = coupon;
                                salePercentage = discountCoupons[coupon].discountPercentage;
                                isOnSale = true;
                                freeshipping = false;
                                order.shipping.coupon = null;
                            } else if (discountCoupons[coupon].couponType == 'shipping') {
                                if (!isOnSale && !freeshipping && Object.keys(order.cart.products).length >= discountCoupons[coupon].minNumberOfItems) {
                                    couponCode = coupon;
                                    freeshipping = true;
                                    order.shipping.coupon = coupon;
                                }
                            }
                            break;
                        }
                    }

                    if (salePercentage) {
                        variant.salePrice = Math.round(variant.regularPrice * (1 - salePercentage / 100));
                    } else {
                        variant.salePrice = variant.regularPrice;
                    }

                    order.cart.products[productId].name = product.generalInfo.name;
                    order.cart.products[productId].image = variant.image;
                    order.cart.products[productId].price = variant.salePrice;
                    order.cart.products[productId].couponCode = couponCode;
                    order.cart.products[productId].salePercentage = salePercentage;

                    order.cart.weight += parseFloat(variant.weight);
                    order.cart.quantity += order.cart.products[productId].quantity;
                    order.cart.subTotal += order.cart.products[productId].quantity * order.cart.products[productId].price;
                });
        }

        if (!freeshipping) {
            await dbRef.child("shipping").child(order.customer.shipToAddress.country).child("states").child(order.customer.shipToAddress.state).child("methods").once('value')
                .then(async (snapshot) => {
                    let shippingMethods = snapshot.val();
                    for (var method in shippingMethods) {
                        await dbRef.child("shippingMethods").child(method).once('value')
                            .then((snapshot) => {
                                let shippingMethodDetails = snapshot.val();
                                if (snapshot.key == order.shipping.methodKey) {
                                    shippingMethodDetails['key'] = snapshot.key;
                                    shippingMethodDetails['price'] = shippingMethodDetails.baseCost;
                                    if (shippingMethodDetails.weightRate.overKg < order.cart.weight) {
                                        shippingMethodDetails['price'] += ((Math.ceil(order.cart.weight) - shippingMethodDetails.weightRate.overKg) / shippingMethodDetails.weightRate.perKg) * shippingMethodDetails.weightRate.charge;
                                    }
                                    order.shipping.charge = shippingMethodDetails['price'];
                                }
                            });
                    }
                });
            order.shipping.coupon = null;
        } else {
            order.shipping.charge = 0;
        }

        let userRegistered = await dbRef.child("users").child(order.customer.uid).child("userInfo").child("email").once('value').then((snapshot) => { return snapshot.val() });
        let userEnableCreditPoints = await dbRef.child("users").child(order.customer.uid).child("userInfo").child("enableCreditPoints").once('value').then((snapshot) => { return snapshot.val() });
        let userCreditPoints = await dbRef.child("users").child(order.customer.uid).child("userInfo").child("creditPoints").once('value').then((snapshot) => { return snapshot.val() });

        if (userRegistered != null && !isOnSale && !freeshipping && userEnableCreditPoints && order.cart.redeemCreditPoints >= 100 && order.cart.redeemCreditPoints <= userCreditPoints) {
            order.cart.discount = order.cart.redeemCreditPoints;
        } else {
            order.cart.redeemCreditPoints = 0;
        }

        order.cart.total = order.cart.subTotal + order.shipping.charge - order.cart.discount;

        let orderSequence = await dbRef.child("sequence").child("orders")
            .transaction(function (currentValue) {
                return (currentValue || 0) + 1;
            });

        let orderId = orderSequence.snapshot.val().toString();

        if (userRegistered != null) {
            updates[`users/${order.customer.uid}/orders/${orderId}`] = true;
        }
        updates[`orders/${orderId}`] = order;

        // For Staging 
        // var environment = Paytm.LibraryConstants.STAGING_ENVIRONMENT;
        // var PAYTM_PAYMENT_URL = 'https://securegw-stage.paytm.in';

        // For Production 
        // var environment = Paytm.LibraryConstants.PRODUCTION_ENVIRONMENT;
        // var PAYTM_PAYMENT_URL = 'https://securegw.paytm.in';

        // var mid = "TMsBjt48133630926129";
        // var key = "DtBAucE_Hc58q2jU";
        // var website = "WEBSTAGING";
        // var callbackUrl = "http://localhost:8888/.netlify/functions/checkoutCallback";

        var paytmParams = {};

        paytmParams.body = {
            requestType: "Payment",
            mid: PAYTM_MID,
            websiteName: PAYTM_SITE_NAME,
            orderId: orderId,
            callbackUrl: PAYTM_CALLBACK_URL,
            txnAmount: {
                value: order.cart.total,
                currency: "INR",
            },
            userInfo: {
                custId: order.customer.uid,
                mobile: order.customer.phoneNumber,
                email: order.customer.email,
                firstName: order.customer.displayName
            },
        };

        var checksum = await PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), PAYTM_MKEY);

        paytmParams.head = {
            "signature": checksum
        };

        console.log(paytmParams);

        var post_data = JSON.stringify(paytmParams);

        var paytmResp = await fetch(PAYTM_PAYMENT_URL + '/theia/api/v1/initiateTransaction?mid=' + PAYTM_MID + '&orderId=' + orderId, {
            headers: {
                "Content-Type": "application/json",
                "Content-Length": post_data.length
            },
            method: "POST",
            body: post_data,
        })
            .then(res => res.json())
            .catch((error) => ({ error: error }));

        console.log(paytmResp);

        var txnToken = paytmResp.body.resultInfo.resultStatus == 'S' ? paytmResp.body.txnToken : null;

        if (!txnToken) {
            throw paytmResp.body.resultInfo;
        }

        let paytmResponse = {
            gateway: `${PAYTM_PAYMENT_URL}/theia/api/v1/showPaymentPage?mid=${PAYTM_MID}&orderId=${orderId}`,
            mid: PAYTM_MID,
            orderId: orderId,
            txnToken: txnToken
        }

        await dbRef.update(updates);

        return {
            statusCode: 200,
            body: JSON.stringify(paytmResponse)
        };
    } catch (error) {
        console.log(error);
        return {
            statusCode: 500,
            body: JSON.stringify(error)
        };
    }
};