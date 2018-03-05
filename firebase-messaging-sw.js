// This "base" path is for Karma testing
importScripts('/base/node_modules/firebase/firebase.js');
var COMMON_CONFIG = {
    apiKey: "AIzaSyBVSy3YpkVGiKXbbxeK0qBnu3-MNZ9UIjA",
    authDomain: "angularfire2-test.firebaseapp.com",
    databaseURL: "https://angularfire2-test.firebaseio.com",
    storageBucket: "angularfire2-test.appspot.com",
    messagingSenderId: "920323787688"
};
firebase.initializeApp(COMMON_CONFIG);