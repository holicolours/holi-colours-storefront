var firebase = require('firebase-admin');
const searchFilter = require("./filters/searchFilter");

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

var db = firebase.database();
var dbRef = db.ref();

module.exports = function (config) {
    config.addPassthroughCopy("assets");
    config.addFilter("search", searchFilter);
};