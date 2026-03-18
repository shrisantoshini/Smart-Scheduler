/* importScripts for Firebase compat (background message handling) */
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: self.FIREBASE_API_KEY || '',
  authDomain: self.FIREBASE_AUTH_DOMAIN || '',
  projectId: self.FIREBASE_PROJECT_ID || '',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: self.FIREBASE_APP_ID || '',
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification?.title || 'Smart Notifier';
    const notificationOptions = {
      body: payload.notification?.body || 'You have a new reminder!',
      icon: '/vite.svg',
      badge: '/vite.svg',
    };
    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.warn('Firebase messaging service worker init failed:', e);
}
