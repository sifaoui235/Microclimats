/**
 * Script de test pour vérifier la détection "Hors ligne"
 * Ce script simule l'arrêt des données Firebase pour tester la logique de détection
 */

const admin = require('firebase-admin');
const path = require('path');

// Configuration Firebase
const serviceAccountPath = path.join(__dirname, 'raspberry_pi', 'fraisier-fa1be-firebase-adminsdk-ixqzr-b8b8b8b8b8.json');

// Initialiser Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = require(serviceAccountPath);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      databaseURL: 'https://fraisier-fa1be-default-rtdb.europe-west1.firebasedatabase.app/'
    });
    console.log('✅ Firebase Admin initialisé avec succès');
  } catch (error) {
    console.error('❌ Erreur lors de l\'initialisation de Firebase Admin:', error.message);
    process.exit(1);
  }
}

const db = admin.database();

/**
 * Envoie des données de test récentes
 */
async function sendRecentData() {
  const timestamp = new Date().toISOString();
  const testData = {
    timestamp,
    temperature: 22.5 + Math.random() * 3,
    humidity_air: 65 + Math.random() * 10,
    humidity_soil: 70 + Math.random() * 10,
    water_level: 80 + Math.random() * 15,
    pump_active: Math.random() > 0.5,
    fan_active: Math.random() > 0.7,
    heater_active: Math.random() > 0.8,
    light: {
      r: Math.floor(Math.random() * 256),
      g: Math.floor(Math.random() * 256),
      b: Math.floor(Math.random() * 256)
    }
  };

  try {
    // Envoyer aux deux milieux
    await db.ref('/milieu/ch1/sensors').push(testData);
    await db.ref('/milieu/ch2/sensors').push(testData);
    console.log(`📡 Données récentes envoyées à ${timestamp}`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi des données:', error);
  }
}

/**
 * Envoie des données avec un timestamp ancien (pour simuler des données obsolètes)
 */
async function sendOldData() {
  // Timestamp d'il y a 2 minutes (plus ancien que le timeout de 60 secondes)
  const oldTimestamp = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const testData = {
    timestamp: oldTimestamp,
    temperature: 20.0,
    humidity_air: 50.0,
    humidity_soil: 60.0,
    water_level: 75.0,
    pump_active: false,
    fan_active: false,
    heater_active: false,
    light: { r: 0, g: 0, b: 0 }
  };

  try {
    await db.ref('/milieu/ch1/sensors').push(testData);
    await db.ref('/milieu/ch2/sensors').push(testData);
    console.log(`📡 Données obsolètes envoyées avec timestamp: ${oldTimestamp}`);
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi des données obsolètes:', error);
  }
}

/**
 * Supprime toutes les données pour simuler une panne complète
 */
async function clearAllData() {
  try {
    await db.ref('/milieu').remove();
    console.log('🗑️ Toutes les données supprimées (simulation de panne)');
  } catch (error) {
    console.error('❌ Erreur lors de la suppression des données:', error);
  }
}

/**
 * Menu interactif
 */
function showMenu() {
  console.log('\n=== Test de Détection Hors Ligne ===');
  console.log('1. Envoyer des données récentes (En ligne)');
  console.log('2. Envoyer des données obsolètes (Hors ligne)');
  console.log('3. Supprimer toutes les données (Panne)');
  console.log('4. Envoyer des données en continu (5 secondes)');
  console.log('5. Arrêter l\'envoi de données (simulation d\'arrêt)');
  console.log('0. Quitter');
  console.log('=====================================');
  process.stdout.write('Votre choix: ');
}

/**
 * Envoie des données en continu
 */
let continuousInterval = null;

function startContinuousData() {
  if (continuousInterval) {
    clearInterval(continuousInterval);
  }
  
  console.log('🔄 Démarrage de l\'envoi continu de données...');
  continuousInterval = setInterval(sendRecentData, 5000);
  sendRecentData(); // Envoyer immédiatement
}

function stopContinuousData() {
  if (continuousInterval) {
    clearInterval(continuousInterval);
    continuousInterval = null;
    console.log('⏹️ Arrêt de l\'envoi continu de données');
  }
}

// Gestion des entrées utilisateur
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function handleUserInput() {
  showMenu();
  
  rl.on('line', async (input) => {
    const choice = input.trim();
    
    switch (choice) {
      case '1':
        await sendRecentData();
        break;
      case '2':
        await sendOldData();
        break;
      case '3':
        await clearAllData();
        break;
      case '4':
        startContinuousData();
        break;
      case '5':
        stopContinuousData();
        break;
      case '0':
        stopContinuousData();
        console.log('👋 Au revoir !');
        process.exit(0);
        break;
      default:
        console.log('❌ Choix invalide');
        break;
    }
    
    setTimeout(() => {
      showMenu();
    }, 1000);
  });
}

// Démarrer le script
console.log('🚀 Script de test de détection hors ligne démarré');
handleUserInput();

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  stopContinuousData();
  console.log('\n👋 Script arrêté');
  process.exit(0);
});
