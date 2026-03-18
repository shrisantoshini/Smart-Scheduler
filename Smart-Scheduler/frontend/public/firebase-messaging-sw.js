/* importScripts for Firebase compat (background message handling) */
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.0/firebase-messaging-compat.js');

const urlParams = new URLSearchParams(self.location.search);
const firebaseConfig = {
  apiKey: urlParams.get('apiKey') || '',
  authDomain: urlParams.get('authDomain') || '',
  projectId: urlParams.get('projectId') || '',
  messagingSenderId: urlParams.get('messagingSenderId') || '',
  appId: urlParams.get('appId') || '',
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
