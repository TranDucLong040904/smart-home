/**
 * Firebase Configuration
 * Smart Door Project
 */

const firebaseConfig = {
  apiKey: "AIzaSyCE2hPgdymahEaPaOgF2ByxjJAhUPoUymw",
  authDomain: "smart-home-v1-0-24872.firebaseapp.com",
  databaseURL:
    "https://smart-home-v1-0-24872-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-home-v1-0-24872",
  storageBucket: "smart-home-v1-0-24872.firebasestorage.app",
  messagingSenderId: "678270288027",
  appId: "1:678270288027:web:49bd1ecfb51763e218463e",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get database reference
const database = firebase.database();

// Device ID
const DEVICE_ID = "esp8266_01";

// Database paths
const DB_PATHS = {
  devices: `/devices/${DEVICE_ID}`,
  commands: `/commands/${DEVICE_ID}`,
  config: `/config/${DEVICE_ID}`,
  logs: `/logs`,
};

console.log("Firebase initialized successfully!");
