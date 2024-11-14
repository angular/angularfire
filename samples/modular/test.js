const { initializeApp } = require("firebase/app");
const { initializeMessaging, isSupported } = require('firebase/messaging');

// Add the Firebase products that you want to use
const { getFunctions, httpsCallable } = require("firebase/functions");
// Initialize Firebase
var config = {
    apiKey: "AIzaSyBVSy3YpkVGiKXbbxeK0qBnu3-MNZ9UIjA",
    authDomain: "angularfire2-test.firebaseapp.com",
    databaseURL: "https://angularfire2-test.firebaseio.com",
    projectId: "angularfire2-test",
    storageBucket: "angularfire2-test.appspot.com",
    messagingSenderId: "920323787688",
    appId: "1:920323787688:web:2253a0e5eb5b9a8b",
    measurementId: "G-W20QDV5CZP"
};
// Initialize Firebase
const app = initializeApp(config);
const functions = getFunctions(app);
const fn = httpsCallable(functions, 'callTest');
fn().then((result) => {
    console.log(result);
    process.exit();
})