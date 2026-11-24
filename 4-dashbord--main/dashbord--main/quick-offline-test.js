/**
 * Test rapide pour vérifier la détection "Hors ligne"
 * Ce script envoie des données puis s'arrête pour voir si l'interface détecte l'état "Hors ligne"
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
    console.log('💡 Assurez-vous que le fichier de clé Firebase existe dans le dossier raspberry_pi/');
    process.exit(1);
  }
}

const db = admin.database();

/**
 * Envoie des données de test
 */
async function sendTestData() {
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
    console.log(`📡 Données envoyées à ${timestamp}`);
    return true;
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi des données:', error);
    return false;
  }
}

/**
 * Test principal
 */
async function runTest() {
  console.log('🚀 Démarrage du test de détection hors ligne...\n');
  
  // Étape 1: Envoyer quelques données pour établir la connexion
  console.log('📡 Étape 1: Envoi de données initiales...');
  for (let i = 0; i < 3; i++) {
    const success = await sendTestData();
    if (success) {
      console.log(`   ✅ Données ${i + 1}/3 envoyées`);
    } else {
      console.log(`   ❌ Échec envoi ${i + 1}/3`);
    }
    await new Promise(resolve => setTimeout(resolve, 2000)); // Attendre 2 secondes
  }
  
  console.log('\n✅ Données initiales envoyées. Les milieux devraient maintenant afficher "En ligne"');
  console.log('⏰ Attente de 70 secondes pour que les milieux passent en "Hors ligne"...');
  console.log('   (Le timeout est configuré à 60 secondes)');
  
  // Étape 2: Attendre que le timeout se déclenche
  let countdown = 70;
  const countdownInterval = setInterval(() => {
    process.stdout.write(`\r⏳ Temps restant: ${countdown} secondes`);
    countdown--;
    
    if (countdown < 0) {
      clearInterval(countdownInterval);
      console.log('\n\n🔍 Les milieux devraient maintenant afficher "Hors ligne"');
      console.log('📱 Vérifiez votre interface web pour confirmer le changement de statut');
      console.log('\n💡 Pour tester à nouveau:');
      console.log('   - Relancez ce script pour renvoyer des données');
      console.log('   - Ou utilisez le script test-offline-detection.js pour plus d\'options');
      console.log('\n👋 Test terminé. Appuyez sur Ctrl+C pour quitter.');
    }
  }, 1000);
}

// Gestion de l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n👋 Test arrêté');
  process.exit(0);
});

// Démarrer le test
runTest().catch(console.error);
