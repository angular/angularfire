importScripts('https://www.gstatic.com/firebasejs/9.0.0-20217250818/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0-20217250818/firebase-messaging-compat.js');

firebase.initializeApp({
    apiKey: 'AIzaSyA7CNE9aHbcSEbt9y03QReJ-Xr0nwKg7Yg',
    authDomain: 'aftest-94085.firebaseapp.com',
    databaseURL: 'https://aftest-94085.firebaseio.com',
    projectId: 'aftest-94085',
    storageBucket: 'aftest-94085.appspot.com',
    messagingSenderId: '480362569154',
    appId: '1:480362569154:web:2fe6f75104cdfb82f50a5b',
    measurementId: 'G-CBRYER9PJR'
});

const isSupported = firebase.messaging.isSupported();
if (isSupported) {
    const messaging = firebase.messaging();
    messaging.onBackgroundMessage(({ notification: { title, body, image } }) => {
        self.registration.showNotification(title, { body, icon: image || '/assets/icons/icon-72x72.png' });
    });
}
