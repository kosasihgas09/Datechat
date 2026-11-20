import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";

import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDuTZ3FobHubSUCpLMfADkUmbBWA6u4csI",
  authDomain: "datechat-2df69.firebaseapp.com",
  projectId: "datechat-2df69",
  storageBucket: "datechat-2df69.firebasestorage.app",
  messagingSenderId: "824429837645",
  appId: "1:824429837645:web:1b522f8852411d53ef4b04"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
