// Scripts for firebase and firebase messaging
importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js");
importScripts("https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js");

// Initialize the Firebase app in the service worker by passing the generated config
const prdfirebaseConfig = {
    apiKey: "AIzaSyAVKIXxd68CdLlJfzCcPtw47-dkJh2xJm0",
    authDomain: "holi-colours-jewellery.firebaseapp.com",
    projectId: "holi-colours-jewellery",
    storageBucket: "holi-colours-jewellery.appspot.com",
    messagingSenderId: "423060301267",
    appId: "1:423060301267:web:e7f2dc25f8fb0703153b26",
    databaseURL: "https://holi-colours-jewellery-default-rtdb.asia-southeast1.firebasedatabase.app/",
    measurementId: "G-LNR3MKCG8F"
};

firebase.initializeApp(prdfirebaseConfig);

// Retrieve firebase messaging
const messaging = firebase.messaging();

messaging.onBackgroundMessage(function (payload) {
    console.log("Received background message ", payload);
    // const notificationTitle = payload.notification.title;
    // const notificationOptions = {
    //     body: payload.notification.body,
    // };

    // self.registration.showNotification(notificationTitle, notificationOptions);
});