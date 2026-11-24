// Firebase configuration
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getDatabase } from "firebase/database";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBmzmvUb8plakOAKUi_U40PcET7x0tDWmU",
  authDomain: "fraisier-fa1be.firebaseapp.com",
  databaseURL: "https://fraisier-fa1be-default-rtdb.firebaseio.com",
  projectId: "fraisier-fa1be",
  storageBucket: "fraisier-fa1be.firebasestorage.app",
  messagingSenderId: "998885212968",
  appId: "1:998885212968:web:9a1320a249d70b66ad061d",
  measurementId: "G-XCXGSCC4LS"
};

// Initialize Firebase with performance optimizations
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Configure database with optimized settings for better performance
// The latest Firebase version handles connection management automatically
const database = getDatabase(app);

// Get authentication service
const auth = getAuth(app);

export { app, analytics, database, auth };
