// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCOpcgxhfV-NT3UKHH9zWHqu8-I-ZUOapc",
  authDomain: "marikamba-finance.firebaseapp.com",
  projectId: "marikamba-finance",
  storageBucket: "marikamba-finance.firebasestorage.app",
  messagingSenderId: "314479205456",
  appId: "1:314479205456:web:276599ff319052177bc555",
  measurementId: "G-RFV2C0XMWC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
