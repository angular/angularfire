importScripts('https://www.gstatic.com/firebasejs/7.21.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.21.1/firebase-messaging.js');

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

const messaging = firebase.messaging();