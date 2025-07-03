// lib/firebase.js
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAXtydhBi53w1kUWjSOL65d_5EMrFsmSrk",
  authDomain: "captyn-global.firebaseapp.com",
  projectId: "captyn-global",
  storageBucket: "captyn-global.appspot.com",
  messagingSenderId: "667246663013",
  appId: "1:667246663013:web:ac783cd4c9845148e67d8c",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { auth, googleProvider };
export { app };