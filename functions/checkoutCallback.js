const firebase = require('firebase-admin');
const nodemailer = require("nodemailer");
const Email = require('email-templates');

function createMailClient() {
    return nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465, //587,
        secure: true, // true for 465, false for other ports
        auth: {
            type: 'OAuth2',
            user: "holicoloursit@gmail.com",
            clientId: "423060301267-s6n8tr6hqo5j0cc8eglcdrvucth6tp50.apps.googleusercontent.com",
            clientSecret: "06pMsRcPf8hx46E5hLTtpix5",
            refreshToken: "1//0gMkZK7iqoeJGCgYIARAAGBASNwF-L9Ir4nttI8NZCe5EWcmH_ev1CfGiO1M85-Bru9LP54BM_lwa7idlW3oZDtwy1S4j7w2zRqw",
        }
    });
}

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

statuses = {
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
    }
}

exports.handler = async (event, context) => {
    try {
        paymentResult = Object.fromEntries(new URLSearchParams(event.body));
        let orderId = paymentResult["ORDERID"];
        let status = '';
        let errorMessage = '';

        var db = firebase.database();
        var dbRef = db.ref();

        let order = await dbRef.child("orders").child(orderId).once('value').then((snapshot) => {
            return snapshot.val();
        });

        const updates = {};

        if (paymentResult["STATUS"] == "TXN_SUCCESS") {
            status = 'Success';

            order['payment'] = {
                method: "Paytm",
                result: paymentResult
            };
            order.generalInfo.status = 'PR';
            order.generalInfo.lastUpdatedOn = new Date().getTime();
            order.notes = [
                {
                    message: `Order status changed from Pending payment to Processing.`,
                    createdOn: new Date().getTime()
                },
                {
                    message: `Thank you for your order. Your payment has been successfully received. Transaction ID: ${paymentResult["TXNID"]} Paytm Order ID: ${paymentResult["ORDERID"]}.`,
                    createdOn: new Date().getTime() + 1000
                }
            ]

            let cartList = await dbRef.child("carts").child(order.customer.uid).once('value').then((snapshot) => { return snapshot.val(); });

            let isOnSale = false;

            for (var productId in order.cart.products) {
                if (!isOnSale && order.cart.products[productId].couponCode) {
                    isOnSale = true;
                }
                await dbRef.child("products").child(productId).once('value')
                    .then(async (snapshot) => {
                        let productId = snapshot.key;
                        let product = snapshot.val();
                        let selectedVariant = order.cart.products[productId].selectedVariant;

                        updates[`products/${productId}/saleCount`] = firebase.database.ServerValue.increment(1);
                        updates[`products/${productId}/variants/${selectedVariant}/saleCount`] = firebase.database.ServerValue.increment(1);

                        let stockQuantity = await dbRef.child("stock").child(productId).child(selectedVariant).once('value').then((snapshot) => { return snapshot.val(); });

                        if (stockQuantity >= order.cart.products[productId].quantity) {
                            updates[`products/${productId}/variants/${selectedVariant}/stockQuantity`] = firebase.database.ServerValue.increment(-order.cart.products[productId].quantity);
                            updates[`stock/${productId}/${selectedVariant}`] = firebase.database.ServerValue.increment(-order.cart.products[productId].quantity);
                        } else {
                            if (order.generalInfo.status != 'OH') {
                                order.generalInfo.status = 'OH';
                                order.notes.push({
                                    message: `Order status changed from Processing to On hold.`,
                                    createdOn: new Date().getTime()
                                });
                            }
                            let productName = order.cart.products[productId].variant ? `${product.generalInfo.name} [${order.cart.products[productId].variant}]` : product.generalInfo.name;
                            let message;

                            if (stockQuantity == 0) {
                                message = productName + ' is not in stock';
                            } else {
                                message = 'Only ' + stockQuantity + ' item(s) are in stock for ' + productName;
                            }
                            order.notes.push({
                                message: message + `. Putting the order on hold.`,
                                createdOn: new Date().getTime()
                            })
                        }

                        if (cartList && cartList[productId]) {
                            if (cartList[productId].quantity == order.cart.products[productId].quantity) {
                                updates[`carts/${order.customer.uid}/${productId}`] = null;
                            } else {
                                updates[`carts/${order.customer.uid}/${productId}/quantity`] = firebase.database.ServerValue.increment(-order.cart.products[productId].quantity);
                            }
                        }
                    });
            }

            let configEnableCreditPoints = await dbRef.child("config").child("enableCreditPoints").once('value').then((snapshot) => { return snapshot.val() });
            let configMaxCreditPoints = await dbRef.child("config").child("maxCreditPoints").once('value').then((snapshot) => { return snapshot.val() });
            let configCreditPointsPerOrder  = await dbRef.child("config").child("creditPointsPerOrder").once('value').then((snapshot) => { return snapshot.val() });
            let userRegistered = await dbRef.child("users").child(order.customer.uid).child("userInfo").child("email").once('value').then((snapshot) => { return snapshot.val() });
            let userEnableCreditPoints = await dbRef.child("users").child(order.customer.uid).child("userInfo").child("enableCreditPoints").once('value').then((snapshot) => { return snapshot.val() });
            let userCreditPoints = await dbRef.child("users").child(order.customer.uid).child("userInfo").child("creditPoints").once('value').then((snapshot) => { return snapshot.val() });

            if (userRegistered != null && configEnableCreditPoints) {
                let configNumberOfCPUsers = await dbRef.child("config").child("numberOfCPUsers").once('value').then((snapshot) => { return snapshot.val() });
                if (configNumberOfCPUsers > 0) {
                    updates[`users/${order.customer.uid}/userInfo/enableCreditPoints`] = true;
                    updates[`config/numberOfCPUsers`] = firebase.database.ServerValue.increment(-1);
                    userEnableCreditPoints = true;
                }
            }

            if (userRegistered != null && !isOnSale && userEnableCreditPoints && order.cart.redeemCreditPoints >= 100 && order.cart.redeemCreditPoints <= userCreditPoints) {
                updates[`users/${order.customer.uid}/userInfo/creditPoints`] = firebase.database.ServerValue.increment(-order.cart.redeemCreditPoints);
            } else if (userRegistered != null && userEnableCreditPoints && configMaxCreditPoints > userCreditPoints) {
                updates[`users/${order.customer.uid}/userInfo/creditPoints`] = firebase.database.ServerValue.increment(configCreditPointsPerOrder);
                updates[`orders/${orderId}/cart/rewardCreditPoints`] = configCreditPointsPerOrder;
            }

            const mailClient = createMailClient();

            const email = new Email();

            let htmlMessage = await email
                .render('email-templates/html', {
                    orderId: orderId,
                    order: order,
                    header: statuses[order.generalInfo.status].emailHeader,
                    content: statuses[order.generalInfo.status].emailContent,
                    additionalContent: statuses[order.generalInfo.status].emailAdditionalContent
                })
                .then((data) => {
                    return data;
                })
                .catch(console.error);

            const gmailResponse = await mailClient.sendMail({
                from: '"Holi Colours Jewellery" <holicoloursit@gmail.com>',
                to: `${order.customer.displayName} <${order.customer.email}>`,
                subject: statuses[order.generalInfo.status].emailSubject,
                html: htmlMessage
            });

            console.log(gmailResponse);

            const adminEmail = new Email();

            let adminHtmlMessage = await adminEmail
                .render('email-templates/html', {
                    orderId: orderId,
                    order: order,
                    header: `New order #${orderId}`,
                    content: 'You have received a new order. The order details are shown below for your reference.',
                    additionalContent: 'Congratulations on the sale.'
                })
                .then((data) => {
                    return data;
                })
                .catch(console.error);

            const adminGmailResponse = await mailClient.sendMail({
                from: '"Holi Colours Jewellery" <holicoloursit@gmail.com>',
                to: '"Holi Colours Jewellery" <holicoloursit@gmail.com>',
                subject: `Holi Colours Jewellery: New order #${orderId}`,
                html: adminHtmlMessage
            });

            console.log(adminGmailResponse);
        } else {
            status = 'Error';
            errorMessage = `${paymentResult["RESPMSG"]} Transaction ID: ${paymentResult["TXNID"]}. Paytm Order ID: ${paymentResult["ORDERID"]}.`;

            order['payment'] = {
                method: "Paytm",
                result: paymentResult
            };
            order.generalInfo.status = 'PF';
            order.generalInfo.lastUpdatedOn = new Date().getTime();
            order.notes = [
                {
                    message: `Order status changed from Pending payment to Payment failed.`,
                    createdOn: new Date().getTime()
                },
                {
                    message: `${paymentResult["RESPMSG"]}. Transaction ID: ${paymentResult["TXNID"]} Paytm Order ID: ${paymentResult["ORDERID"]}.`,
                    createdOn: new Date().getTime() + 1000
                }
            ]
        }

        updates[`orders/${orderId}/payment`] = order['payment'];
        updates[`orders/${orderId}/generalInfo/status`] = order.generalInfo.status;
        updates[`orders/${orderId}/generalInfo/lastUpdatedOn`] = order.generalInfo.lastUpdatedOn;
        updates[`orders/${orderId}/notes`] = order.notes;

        await dbRef.update(updates);

        return {
            statusCode: 302,
            headers: {
                "Location": "/paymentStatus/?orderId=" + orderId + '&status=' + status + '&errorMessage=' + errorMessage
            }
        };
    } catch (error) {
        console.log(error);
        return {
            statusCode: 500,
            body: JSON.stringify(error)
        };
    }
};