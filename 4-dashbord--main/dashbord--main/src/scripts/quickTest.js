/**
 * Script de test rapide pour vérifier le système dual chamber
 * À exécuter dans la console du navigateur
 */

// Fonction pour tester l'ajout de données Firebase
window.testDualChamber = async () => {
  console.log('🚀 Test du système dual chamber...');
  
  try {
    // Importer Firebase
    const { ref, set } = await import('firebase/database');
    const { database } = await import('../firebase/config');
    
    console.log('✅ Firebase importé avec succès');
    
    // Données de test pour les deux chambres
    const testData = {
      chambre: {
        ch1: {
          sensors: {
            temperature: 21.5,
            humidity_air: 62,
            humidity_soil: 75,
            water_level: 80,
            pump_active: false,
            light: 450,
            timestamp: new Date().toISOString()
          }
        },
        ch2: {
          sensors: {
            temperature: 23.2,
            humidity_air: 68,
            humidity_soil: 70,
            water_level: 75,
            pump_active: true,
            light: 520,
            timestamp: new Date().toISOString()
          }
        }
      }
    };
    
    console.log('📊 Données de test préparées:', testData);
    
    // Écrire dans Firebase
    const dataRef = ref(database, '/');
    await set(dataRef, testData);
    
    console.log('✅ Données ajoutées à Firebase avec succès !');
    console.log('🔄 Le dashboard devrait se mettre à jour automatiquement...');
    
    return { success: true, data: testData };
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    return { success: false, error: error.message };
  }
};

// Fonction pour nettoyer les données de test
window.clearTestData = async () => {
  console.log('🧹 Nettoyage des données de test...');
  
  try {
    const { ref, set } = await import('firebase/database');
    const { database } = await import('../firebase/config');
    
    const dataRef = ref(database, 'chambre');
    await set(dataRef, null);
    
    console.log('✅ Données de test supprimées');
    return { success: true };
    
  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    return { success: false, error: error.message };
  }
};

// Fonction pour vérifier la connectivité
window.testConnectivity = async () => {
  console.log('🔗 Test de connectivité Firebase...');
  
  try {
    const { testChamberConnectivity } = await import('../services/DualFirebaseLoader.service');
    const result = await testChamberConnectivity();
    
    console.log('📡 Résultat du test de connectivité:', result);
    return result;
    
  } catch (error) {
    console.error('❌ Erreur de connectivité:', error);
    return { connected: false, error: error.message };
  }
};

// Instructions d'utilisation
console.log(`
🔧 Fonctions de test disponibles dans la console :

1. testDualChamber() - Ajoute des données de test pour les deux chambres
2. clearTestData() - Supprime les données de test
3. testConnectivity() - Teste la connectivité Firebase

💡 Exemple d'utilisation :
   await testDualChamber()
   await testConnectivity()
   await clearTestData()
`);

export { testDualChamber, clearTestData, testConnectivity };
