// Script pour envoyer des données de test à Firebase
const { initializeApp } = require('firebase/app');
const { getDatabase, ref, set } = require('firebase/database');

// Configuration Firebase
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

// Initialiser Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// Fonction pour envoyer des données à Firebase
const sendData = () => {
  const now = new Date();
  const timestamp = now.toISOString();

  // Générer des valeurs aléatoires
  const temperature = (20 + Math.random() * 10).toFixed(1);
  const humidity_air = (50 + Math.random() * 30).toFixed(1);
  const humidity_soil = (60 + Math.random() * 20).toFixed(1);
  const water_level = (30 + Math.random() * 70).toFixed(1);
  const light = (300 + Math.random() * 700).toFixed(1);
  const pump_active = Math.random() > 0.5;

  // Données à envoyer
  const data = {
    temperature: parseFloat(temperature),
    humidity_air: parseFloat(humidity_air),
    humidity_soil: parseFloat(humidity_soil),
    water_level: parseFloat(water_level),
    light: parseFloat(light),
    pump_active: pump_active,
    timestamp: timestamp
  };

  console.log('Envoi des données:', data);

  // Envoyer les données à Firebase
  set(ref(database, '/'), data)
    .then(() => {
      console.log('Données envoyées avec succès');
    })
    .catch((error) => {
      console.error('Erreur lors de l\'envoi des données:', error);
    });
};

// Envoyer des données toutes les 5 secondes
sendData();
setInterval(sendData, 5000);

console.log('Script démarré. Envoi de données toutes les 5 secondes...');
