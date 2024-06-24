import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.0.1/firebase-app.js';
import { getMessaging, isSupported, onBackgroundMessage } from 'https://www.gstatic.com/firebasejs/9.0.1/firebase-messaging-sw.js';

const app = initializeApp({
  apiKey: "AIzaSyBVSy3YpkVGiKXbbxeK0qBnu3-MNZ9UIjA",
  authDomain: "angularfire2-test.firebaseapp.com",
  databaseURL: "https://angularfire2-test.firebaseio.com",
  projectId: "angularfire2-test",
  storageBucket: "angularfire2-test.appspot.com",
  messagingSenderId: "920323787688",
  appId: "1:920323787688:web:2253a0e5eb5b9a8b",
  measurementId: "G-W20QDV5CZP"
});

isSupported().then(isSupported => {

  if (isSupported) {

    const messaging = getMessaging(app);

    onBackgroundMessage(messaging, ({ notification: { title, body, image } }) => {
      self.registration.showNotification(title, { body, icon: image || '/assets/icons/icon-72x72.png' });
    });

  }

});
