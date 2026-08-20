import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyD36Cm7NkvNfhgvx0SxHhHS4J0x2Bo-xsw",
  authDomain: "nirmala-d514e.firebaseapp.com",
  databaseURL: "https://nirmala-d514e-default-rtdb.firebaseio.com",
  projectId: "nirmala-d514e",
  storageBucket: "nirmala-d514e.firebasestorage.app",
  messagingSenderId: "172992466152",
  appId: "1:172992466152:web:75c77bae84e9f4621a8d5d",
  measurementId: "G-7ML2R9X2XK"
};

// Firebase Initialize
const app = initializeApp(firebaseConfig);

// Firestore Database Export
export const db = getFirestore(app);