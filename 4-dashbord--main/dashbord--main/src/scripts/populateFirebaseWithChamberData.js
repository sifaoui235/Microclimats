/**
 * Script pour peupler Firebase avec des données de test pour les deux chambres
 * Exécutez ce script pour ajouter des données de test dans votre base Firebase
 */

import { ref, set, push } from 'firebase/database';
import { database } from '../firebase/config';
import { generateFirebaseMockStructure, generateMockChamberData } from '../data/mockChamberData';

/**
 * Ajoute des données de test pour les deux chambres
 */
export const populateChamberData = async () => {
  try {
    console.log('🚀 Début du peuplement des données Firebase...');

    // Générer des données pour les deux chambres
    const ch1Data = generateMockChamberData('ch1', {
      temperature: 21.5,
      humidity_air: 62,
      humidity_soil: 75,
      water_level: 80,
      pump_active: false,
      light: 450
    });

    const ch2Data = generateMockChamberData('ch2', {
      temperature: 23.2,
      humidity_air: 68,
      humidity_soil: 70,
      water_level: 75,
      pump_active: true,
      light: 520
    });

    // Structure Firebase pour les chambres
    const chamberData = {
      chambre: {
        ch1: {
          sensors: {
            temperature: ch1Data.temperature,
            humidity_air: ch1Data.humidity_air,
            humidity_soil: ch1Data.humidity_soil,
            water_level: ch1Data.water_level,
            pump_active: ch1Data.pump_active,
            light: ch1Data.light,
            timestamp: ch1Data.timestamp
          }
        },
        ch2: {
          sensors: {
            temperature: ch2Data.temperature,
            humidity_air: ch2Data.humidity_air,
            humidity_soil: ch2Data.humidity_soil,
            water_level: ch2Data.water_level,
            pump_active: ch2Data.pump_active,
            light: ch2Data.light,
            timestamp: ch2Data.timestamp
          }
        }
      }
    };

    // Écrire les données dans Firebase
    const chamberRef = ref(database, '/');
    await set(chamberRef, chamberData);

    console.log('✅ Données des chambres ajoutées avec succès !');
    console.log('📊 Données Chambre 1:', ch1Data);
    console.log('📊 Données Chambre 2:', ch2Data);

    return { success: true, data: chamberData };

  } catch (error) {
    console.error('❌ Erreur lors du peuplement des données:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Ajoute des données d'historique pour les tests
 */
export const populateHistoryData = async () => {
  try {
    console.log('📈 Ajout de données d\'historique...');

    const now = new Date();
    const historyData = {};

    // Générer 24 points d'historique pour chaque chambre
    for (let i = 23; i >= 0; i--) {
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
      const timestampKey = timestamp.toISOString().replace(/[:.]/g, '-');

      // Données pour chambre 1
      const ch1Data = generateMockChamberData('ch1', {
        temperature: 21 + Math.sin(i * 0.3) * 2,
        humidity_air: 60 + Math.sin(i * 0.2) * 10,
        humidity_soil: 75 + Math.cos(i * 0.4) * 5,
        water_level: 80 - (i * 0.5),
        pump_active: Math.sin(i * 0.5) > 0.5,
        light: i >= 6 && i <= 20 ? 400 + Math.sin((i - 6) * 0.4) * 200 : 50
      });

      // Données pour chambre 2
      const ch2Data = generateMockChamberData('ch2', {
        temperature: 23 + Math.cos(i * 0.3) * 1.5,
        humidity_air: 65 + Math.cos(i * 0.2) * 8,
        humidity_soil: 70 + Math.sin(i * 0.4) * 6,
        water_level: 75 - (i * 0.3),
        pump_active: Math.cos(i * 0.6) > 0.3,
        light: i >= 6 && i <= 20 ? 500 + Math.cos((i - 6) * 0.4) * 150 : 40
      });

      historyData[`history/${timestampKey}`] = {
        chambre: {
          ch1: { sensors: ch1Data },
          ch2: { sensors: ch2Data }
        }
      };
    }

    // Écrire l'historique dans Firebase
    for (const [path, data] of Object.entries(historyData)) {
      const historyRef = ref(database, path);
      await set(historyRef, data);
    }

    console.log('✅ Historique ajouté avec succès !');
    return { success: true, points: Object.keys(historyData).length };

  } catch (error) {
    console.error('❌ Erreur lors de l\'ajout de l\'historique:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Simule des mises à jour en temps réel
 */
export const startRealTimeSimulation = (intervalSeconds = 30) => {
  console.log(`🔄 Démarrage de la simulation temps réel (${intervalSeconds}s)...`);

  const updateData = async () => {
    try {
      // Générer de nouvelles données
      const ch1Data = generateMockChamberData('ch1');
      const ch2Data = generateMockChamberData('ch2');

      // Mettre à jour Firebase
      const updates = {
        'chambre/ch1/sensors': ch1Data,
        'chambre/ch2/sensors': ch2Data
      };

      const promises = Object.entries(updates).map(([path, data]) => {
        const updateRef = ref(database, path);
        return set(updateRef, data);
      });

      await Promise.all(promises);

      console.log(`🔄 Mise à jour ${new Date().toLocaleTimeString()}:`, {
        ch1_temp: ch1Data.temperature,
        ch2_temp: ch2Data.temperature,
        ch1_pump: ch1Data.pump_active,
        ch2_pump: ch2Data.pump_active
      });

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour:', error);
    }
  };

  // Première mise à jour immédiate
  updateData();

  // Puis mises à jour périodiques
  const interval = setInterval(updateData, intervalSeconds * 1000);

  // Retourner une fonction pour arrêter la simulation
  return () => {
    clearInterval(interval);
    console.log('⏹️ Simulation temps réel arrêtée');
  };
};

/**
 * Nettoie toutes les données de test
 */
export const clearTestData = async () => {
  try {
    console.log('🧹 Nettoyage des données de test...');

    // Supprimer les données des chambres
    const chamberRef = ref(database, 'chambre');
    await set(chamberRef, null);

    // Supprimer l'historique
    const historyRef = ref(database, 'history');
    await set(historyRef, null);

    console.log('✅ Données de test supprimées');
    return { success: true };

  } catch (error) {
    console.error('❌ Erreur lors du nettoyage:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Script principal pour configurer les données de test
 */
export const setupTestEnvironment = async () => {
  console.log('🏗️ Configuration de l\'environnement de test...');

  try {
    // 1. Nettoyer les anciennes données
    await clearTestData();

    // 2. Ajouter les données actuelles
    const currentResult = await populateChamberData();
    if (!currentResult.success) {
      throw new Error(currentResult.error);
    }

    // 3. Ajouter l'historique
    const historyResult = await populateHistoryData();
    if (!historyResult.success) {
      throw new Error(historyResult.error);
    }

    console.log('🎉 Environnement de test configuré avec succès !');
    console.log('💡 Vous pouvez maintenant:');
    console.log('   - Voir les données dans votre dashboard');
    console.log('   - Démarrer la simulation temps réel avec startRealTimeSimulation()');
    console.log('   - Nettoyer avec clearTestData()');

    return { success: true };

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error);
    return { success: false, error: error.message };
  }
};

// Export par défaut
export default {
  populateChamberData,
  populateHistoryData,
  startRealTimeSimulation,
  clearTestData,
  setupTestEnvironment
};

// Si exécuté directement dans la console du navigateur
if (typeof window !== 'undefined') {
  // Rendre les fonctions disponibles globalement pour les tests
  window.chamberTestUtils = {
    populateChamberData,
    populateHistoryData,
    startRealTimeSimulation,
    clearTestData,
    setupTestEnvironment
  };

  console.log('🔧 Utilitaires de test disponibles dans window.chamberTestUtils');
  console.log('💡 Exécutez window.chamberTestUtils.setupTestEnvironment() pour commencer');
}
