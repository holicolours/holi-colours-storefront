const fetch = require("node-fetch");
const PaytmChecksum = require('paytmchecksum');
const firebase = require('firebase-admin');
const gqlClient = require('graphql-request');
const gql = gqlClient.gql;
const gqlEndPoint = 'http://localhost:3000/api/graphql';
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
    var db = firebase.database();
    var dbRef = db.ref();

    const productQuery = gql`query productQuery($idList:[ID!]) {
      products( 
        where: { id: { in: $idList } }
      ) {
        id
        name
        slug
        status
        defaultVariant
        variants {
          id
          status
          sku {
            sku
          }
          title
          image {
            id
            publicUrl
          }
          regularPrice
          salePrice
          price
          salePercentage
          weight
        }
        accessories {
          id
          name
          status
          price
        }
      }
    }`;

    const shippingMethodQuery = gql`query shippingMethodQuery($id: ID!) {
      shippingMethod (where: { id: $id}) {
        id
        name
        method
        baseCost
        charge
        perEachKg
        overKg
        zones {
          id
          countryCode
          stateCode
        }
      }
    }`;

    const salesQuery = gql`{
      sales(
        where: {
          startDate: { lt: "${new Date().toISOString()}" }
          endDate: { gt: "${new Date().toISOString()}" }
        }
      ) {
        saleCode
        startDate
        endDate
        productsIsIn {
          id
        }
        discountPercentage
      }
    }`;

    const offersQuery = gql`query offerQuery($cc: String){
      offers(
        where: {
          startDate: { lt: "${new Date().toISOString()}" }
          endDate: { gt: "${new Date().toISOString()}" },
          couponCode: { equals: $cc}
        }
      ) {
        couponCode
        startDate
        endDate
        minimumItemsPerOrder
        discountAmount
        freeShipping
        freebieProducts {
          id
        }
      }
    }`;

    const createOrderMutation = gql`mutation createOrder($order: OrderCreateInput!) {
      createOrder(data: $order) {
        id
      }
    }`;

    let order = JSON.parse(event.body);

    order.status = 'PP';
    order.createdOn = new Date().getTime();
    order.cart.quantity = order.cart.products.map(p => p.quantity).reduce((sum, a) => sum + a, 0);
    order.cart.subTotal = 0;
    order.cart.discount = 0;
    order.cart.weight = 0;
    order.cart.total = 0;
    order.cart.isOnSale = false;
    order.cart.freeShipping = false;
    order.shipping.charge = 0;

    const updates = {};

    let offers = await gqlClient.request(gqlEndPoint, offersQuery, {
      "cc": order.cart.offerCoupon
    })
      .then(res => res.offers);

    if (order.cart.offerCoupon) {
      if (offers && offers.length > 0) {
        let offer = offers[0];
        if (offer.minimumItemsPerOrder <= order.cart.quantity) {
          order.cart.discount += offer.discountAmount;
          if (offer.freeShipping == 'Y') {
            order.cart.freeShipping = true;
          }
          if (!order.cart.products.filter(p => p.freebie).every(p => {
            return offer.freebieProducts.map(fp => fp.id).includes(p.id) && p.quantity == 1;
          })) {
            throw `Invalid freebie products found in the cart!`;
          }
        } else {
          throw `Invalid Coupon: ${order.cart.offerCoupon}`;
        }
      } else {
        throw `Invalid Coupon: ${order.cart.offerCoupon}`;
      }
    }

    let products = await gqlClient.request(gqlEndPoint, productQuery, {
      "idList": order.cart.products.map(v => v.id)
    })
      .then(res => res.products);

    let sales = await gqlClient.request(gqlEndPoint, salesQuery)
      .then(res => res.sales);

    let shippingMethod = await gqlClient.request(gqlEndPoint, shippingMethodQuery, {
      "id": order.shipping.methodId
    })
      .then(res => res.shippingMethod);

    let orderItemsInput = [];

    order.cart.products.forEach(async p => {
      let product = products.filter(v => v.id == p.id);
      let variant;
      let accessories = [];
      if (Array.isArray(product) && product.length > 0) {
        product = product[0];
        variant = product.variants.filter(v => v.id == p.vid);
        if (Array.isArray(variant) && variant.length > 0) {
          variant = variant[0];
        }
        accessories = product.accessories.filter(v => {
          return p.accessories && p.accessories.length > 0 && p.accessories.includes(v.id);
        });
      }

      sales.forEach(s => {
        if (s.productsIsIn.map(v => v.id).includes(product.id)) {
          order.cart.isOnSale = true;
          variant.salePrice = Math.round(variant.regularPrice - (variant.regularPrice * s.discountPercentage / 100));
          variant.salePercentage = s.discountPercentage;
          variant.price = variant.salePrice;
        }
      });

      if (order.cart.offerCoupon && order.cart.isOnSale) {
        throw "Coupon could not be applied for products in sale!";
      }

      if (product.status != 'PUBLISHED' || variant.status != 'PUBLISHED' || accessories.some(v => v.status != 'PUBLISHED')) {
        throw { resultMsg: product.name + ' cannot be ordered now. Please try again later!' };
      }

      let accessoriesPrice = accessories.map(v => v.price).reduce((sum, a) => sum + a, 0);
      if (accessoriesPrice) {
        variant.price += accessoriesPrice;
      }

      if (p.freebie) {
        variant.price = 0;
      }

      order.cart.subTotal += p.quantity * variant.price;
      order.cart.weight += variant.weight;

      product.variants.some((v, i) => {
        if (v.title == product.defaultVariant) {
          product.defaultVariantIndex = i;
          product.defaultVariantId = v.id;
          return true;
        }
        return false;
      });

      p.details = {};

      p.details.productName = product.name;
      if (variant.title != 'Simple Product') {
        p.details.productName += ' (' + variant.title + ')';
      }
      if (accessories && accessories.length > 0) {
        p.details.productName += ' + ' + accessories.map(v => v.name).join(', + ');
      }
      p.details.product = product.name;
      p.details.variant = variant.title;
      p.details.sku = variant.sku.sku;
      p.details.slug = product.slug;
      p.details.accessories = accessories.map(v => v.name);
      p.details.image = variant.image ? variant.image.publicUrl : product.variants[product.defaultVariantIndex].image.publicUrl;
      p.details.price = variant.price;
      p.details.salePercentage = variant.salePercentage;

      let stockQuantity = await firebase.database().ref().child("stock").child(p.details.sku).once('value').then((snapshot) => { return snapshot.val(); });

      if (!stockQuantity || p.stockQuantity <= 0) {
        throw `${p.details.productName} is not in stock!`;
      } else if (stockQuantity < p.quantity) {
        throw `Only ${stockQuantity} item(s) are in stock for ${p.details.productName}`;
      }

      orderItemsInput.push({
        item: p.details.productName,
        sku: {
          "connect": {
            "sku": p.details.sku
          }
        },
        quantity: p.quantity,
        unitPrice: variant.price,
        total: p.quantity * variant.price
      });
    });

    if (shippingMethod.zones.some(v => v.stateCode == order.customer.shipToAddress.state && v.countryCode == order.customer.shipToAddress.country)) {
      order.shipping.methodName = shippingMethod.method;
      order.shipping.charge = shippingMethod.baseCost;
      if (shippingMethod.overKg < order.cart.weight) {
        order.shipping.charge += ((Math.ceil(order.cart.weight) - shippingMethod.overKg) / shippingMethod.perEachKg) * shippingMethod.charge;
      }
    } else {
      throw { resultMsg: shippingMethod.method + ' is not valid for the selected zone!' };
    }

    let userRegistered = await dbRef.child("users").child(order.customer.uid).child("email").once('value').then((snapshot) => { return snapshot.val() });
    let userEnableCreditPoints = await dbRef.child("users").child(order.customer.uid).child("enableCreditPoints").once('value').then((snapshot) => { return snapshot.val() });
    let userCreditPoints = await dbRef.child("users").child(order.customer.uid).child("creditPoints").once('value').then((snapshot) => { return snapshot.val() });

    if (userRegistered != null && !order.cart.isOnSale && !order.cart.freeshipping && userEnableCreditPoints && order.cart.redeemCreditPoints >= 100 && order.cart.redeemCreditPoints <= userCreditPoints) {
      order.cart.discount += order.cart.redeemCreditPoints;
    } else {
      order.cart.redeemCreditPoints = 0;
    }

    order.cart.total = order.cart.subTotal + order.shipping.charge - order.cart.discount;

    let orderInputs = {};

    let orderSequence = await dbRef.child("sequence").child("orders")
      .transaction(function (currentValue) {
        return (currentValue || 0) + 1;
      });

    let orderId = orderSequence.snapshot.val().toString();

    orderInputs['orderNumber'] = orderId;
    orderInputs['status'] = "PP";
    orderInputs['items'] = {
      "create": orderItemsInput
    };
    orderInputs['subTotal'] = order.cart.subTotal;
    orderInputs['shippingMethod'] = order.shipping.methodName;
    orderInputs['shippingCharge'] = order.shipping.charge;
    orderInputs['discount'] = order.cart.discount;
    orderInputs['total'] = order.cart.total;
    orderInputs['customer'] = null; //TO-DO
    orderInputs['customerFirstName'] = order.customer.firstName;
    orderInputs['customerLastName'] = order.customer.lastName;
    orderInputs['customerEmail'] = order.customer.email;
    orderInputs['customerPhoneNumber'] = order.customer.phoneNumber;
    orderInputs['customerAlternatePhoneNumber'] = order.customer.alternatePhoneNumber;
    orderInputs['shipToAddress1'] = order.customer.shipToAddress.address1;
    orderInputs['shipToAddress2'] = order.customer.shipToAddress.address2;
    orderInputs['shipToCity'] = order.customer.shipToAddress.city;
    orderInputs['shipToState'] = order.customer.shipToAddress.state;
    orderInputs['shipToCountry'] = order.customer.shipToAddress.country;
    orderInputs['shipToPostalCode'] = order.customer.shipToAddress.postalCode;

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
      }
    };

    var checksum = await PaytmChecksum.generateSignature(JSON.stringify(paytmParams.body), PAYTM_MKEY);

    paytmParams.head = {
      "signature": checksum
    };

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

    let createOrder = await gqlClient.request(gqlEndPoint, createOrderMutation, {
      "order": orderInputs
    })
      .then(res => res.createOrder);

    console.log(createOrder);

    if (userRegistered != null) {
      updates[`users/${order.customer.uid}/orders/${orderId}`] = true;
    }
    updates[`orders/${orderId}`] = order;
    updates[`sync/orders/${orderId}`] = true;

    await dbRef.update(updates);

    // throw orderInputs;

    return {
      statusCode: 200,
      body: JSON.stringify(paytmResponse)
    };
  } catch (error) {
    console.log(error);
    return {
      statusCode: 500,
      body: JSON.stringify(error, null, 4)
    };
  }
};