/**
 * Script de test pour le système dual chamber
 * Permet de tester les fonctionnalités sans avoir de vraies données Firebase
 */

import { 
  generateFirebaseMockStructure, 
  generateTestScenario, 
  simulateRealTimeUpdates,
  mockConnectivityTest 
} from '../data/mockChamberData.js';

import { 
  convertToChamberSensors, 
  testChamberConnectivity 
} from '../services/DualFirebaseLoader.service.js';

import { 
  calculatePumpStats, 
  checkPumpAlert 
} from '../utils/PumpStateIndicator.util.js';

/**
 * Test des données mock
 */
export const testMockDataGeneration = () => {
  console.log('=== Test de génération de données mock ===');
  
  // Test de génération normale
  const normalData = generateFirebaseMockStructure();
  console.log('Données normales générées:', normalData);
  
  // Test de scénarios d'alerte
  const alertData = generateTestScenario('alert');
  console.log('Données d\'alerte générées:', alertData);
  
  // Test de scénario hors ligne
  const offlineData = generateTestScenario('offline');
  console.log('Données hors ligne générées:', offlineData);
  
  return {
    normal: normalData,
    alert: alertData,
    offline: offlineData
  };
};

/**
 * Test de conversion des données en capteurs
 */
export const testDataConversion = () => {
  console.log('=== Test de conversion des données ===');
  
  const mockData = generateFirebaseMockStructure();
  
  // Test conversion chambre 1
  const ch1Sensors = convertToChamberSensors(
    mockData.chambre.ch1.sensors,
    'ch1',
    'Chambre 1'
  );
  console.log('Capteurs Chambre 1:', ch1Sensors);
  
  // Test conversion chambre 2
  const ch2Sensors = convertToChamberSensors(
    mockData.chambre.ch2.sensors,
    'ch2',
    'Chambre 2'
  );
  console.log('Capteurs Chambre 2:', ch2Sensors);
  
  return {
    ch1: ch1Sensors,
    ch2: ch2Sensors
  };
};

/**
 * Test des statistiques de pompe
 */
export const testPumpStatistics = () => {
  console.log('=== Test des statistiques de pompe ===');
  
  // Générer un historique de pompe simulé
  const pumpHistory = [];
  const now = new Date();
  
  for (let i = 24; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
    const isActive = Math.sin(i * 0.5) > 0.3; // Cycle d'activité simulé
    
    pumpHistory.push({
      timestamp: timestamp.toISOString(),
      value: isActive ? 1 : 0
    });
  }
  
  // Calculer les statistiques
  const stats = calculatePumpStats(pumpHistory, 24);
  console.log('Statistiques de pompe:', stats);
  
  // Tester les alertes
  const alerts = checkPumpAlert(pumpHistory);
  console.log('Alertes de pompe:', alerts);
  
  return {
    history: pumpHistory,
    stats,
    alerts
  };
};

/**
 * Test de connectivité mock
 */
export const testConnectivity = async () => {
  console.log('=== Test de connectivité ===');
  
  try {
    const connectivity = await mockConnectivityTest();
    console.log('Test de connectivité réussi:', connectivity);
    return connectivity;
  } catch (error) {
    console.error('Erreur de connectivité:', error);
    return null;
  }
};

/**
 * Test de simulation en temps réel
 */
export const testRealTimeSimulation = (duration = 10000) => {
  console.log('=== Test de simulation temps réel ===');
  console.log(`Simulation pendant ${duration}ms...`);
  
  let updateCount = 0;
  
  const stopSimulation = simulateRealTimeUpdates((data) => {
    updateCount++;
    console.log(`Mise à jour #${updateCount}:`, {
      timestamp: new Date().toISOString(),
      ch1_temp: data.chambre.ch1.sensors.temperature,
      ch2_temp: data.chambre.ch2.sensors.temperature,
      ch1_pump: data.chambre.ch1.sensors.pump_active,
      ch2_pump: data.chambre.ch2.sensors.pump_active
    });
  }, 2000); // Mise à jour toutes les 2 secondes
  
  // Arrêter après la durée spécifiée
  setTimeout(() => {
    stopSimulation();
    console.log(`Simulation terminée. ${updateCount} mises à jour reçues.`);
  }, duration);
  
  return stopSimulation;
};

/**
 * Test de validation des seuils
 */
export const testThresholdValidation = () => {
  console.log('=== Test de validation des seuils ===');
  
  const testCases = [
    { value: 15, min: 18, max: 28, expected: true }, // Trop froid
    { value: 32, min: 18, max: 28, expected: true }, // Trop chaud
    { value: 22, min: 18, max: 28, expected: false }, // Normal
    { value: 18, min: 18, max: 28, expected: false }, // Limite min
    { value: 28, min: 18, max: 28, expected: false }, // Limite max
  ];
  
  testCases.forEach((testCase, index) => {
    const isAlert = testCase.value < testCase.min || testCase.value > testCase.max;
    const passed = isAlert === testCase.expected;
    
    console.log(`Test ${index + 1}: ${passed ? 'PASS' : 'FAIL'}`, {
      value: testCase.value,
      range: `${testCase.min}-${testCase.max}`,
      expected: testCase.expected ? 'Alerte' : 'Normal',
      actual: isAlert ? 'Alerte' : 'Normal'
    });
  });
};

/**
 * Test complet du système
 */
export const runCompleteTest = async () => {
  console.log('🚀 === DÉBUT DES TESTS DUAL CHAMBER ===');
  
  try {
    // Test 1: Génération de données
    console.log('\n1️⃣ Test de génération de données...');
    const mockData = testMockDataGeneration();
    
    // Test 2: Conversion des données
    console.log('\n2️⃣ Test de conversion des données...');
    const sensors = testDataConversion();
    
    // Test 3: Statistiques de pompe
    console.log('\n3️⃣ Test des statistiques de pompe...');
    const pumpStats = testPumpStatistics();
    
    // Test 4: Connectivité
    console.log('\n4️⃣ Test de connectivité...');
    const connectivity = await testConnectivity();
    
    // Test 5: Validation des seuils
    console.log('\n5️⃣ Test de validation des seuils...');
    testThresholdValidation();
    
    // Test 6: Simulation temps réel (optionnel)
    console.log('\n6️⃣ Test de simulation temps réel (5 secondes)...');
    testRealTimeSimulation(5000);
    
    console.log('\n✅ === TOUS LES TESTS TERMINÉS ===');
    
    return {
      mockData,
      sensors,
      pumpStats,
      connectivity,
      success: true
    };
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
    return {
      error: error.message,
      success: false
    };
  }
};

/**
 * Fonction utilitaire pour afficher un résumé des données
 */
export const displayDataSummary = (data) => {
  console.log('📊 === RÉSUMÉ DES DONNÉES ===');
  
  if (data.chambre) {
    Object.entries(data.chambre).forEach(([chamberId, chamberData]) => {
      console.log(`\n${chamberId.toUpperCase()}:`);
      if (chamberData.sensors) {
        Object.entries(chamberData.sensors).forEach(([sensor, value]) => {
          console.log(`  ${sensor}: ${value}`);
        });
      }
    });
  }
};

// Export par défaut pour utilisation dans d'autres modules
export default {
  testMockDataGeneration,
  testDataConversion,
  testPumpStatistics,
  testConnectivity,
  testRealTimeSimulation,
  testThresholdValidation,
  runCompleteTest,
  displayDataSummary
};

// Si le script est exécuté directement (pour les tests en ligne de commande)
if (typeof window === 'undefined' && typeof process !== 'undefined') {
  // Environnement Node.js
  runCompleteTest().then(result => {
    if (result.success) {
      console.log('🎉 Tests réussis !');
      process.exit(0);
    } else {
      console.log('💥 Tests échoués !');
      process.exit(1);
    }
  });
}
