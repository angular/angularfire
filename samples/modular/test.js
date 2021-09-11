const { initializeApp } = require("firebase/app");
const { initializeMessaging, isSupported } = require('firebase/messaging');

// Add the Firebase products that you want to use
const { getFunctions, httpsCallable } = require("firebase/functions");
// Initialize Firebase
var config = {
    apiKey: "AIzaSyB3BYpqf_FrZ2WQidSh9Ml04kuXJp3fvVk",
    authDomain: "chholland-test.firebaseapp.com",
    databaseURL: "https://chholland-test.firebaseio.com",
    projectId: "chholland-test",
    storageBucket: "chholland-test.appspot.com",
    messagingSenderId: "91336787373",
    appId: "1:91336787373:web:a3dffe45ec797267",
    measurementId: "G-RV2DRJVZ88"
};
// Initialize Firebase
const app = initializeApp(config);
const functions = getFunctions(app);
const fn = httpsCallable(functions, 'callTest');
fn().then((result) => {
    console.log(result);
    process.exit();
})