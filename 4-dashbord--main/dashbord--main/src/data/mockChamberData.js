/**
 * Générateur de données de test pour le système dual chamber
 * Simule des données réalistes pour les deux chambres
 */

/**
 * Génère des données de capteurs réalistes pour une chambre
 * @param {string} chamberId - 'ch1' ou 'ch2'
 * @param {object} baseValues - Valeurs de base pour la génération
 * @returns {object} Données de chambre simulées
 */
export const generateMockChamberData = (chamberId = 'ch1', baseValues = {}) => {
  const defaultValues = {
    temperature: 22,
    humidity_air: 65,
    humidity_soil: 70,
    water_level: 75,
    pump_active: false,
    light: 500,
    ...baseValues
  };

  // Ajouter des variations réalistes
  const variations = {
    temperature: (Math.random() - 0.5) * 4, // ±2°C
    humidity_air: (Math.random() - 0.5) * 20, // ±10%
    humidity_soil: (Math.random() - 0.5) * 10, // ±5%
    water_level: (Math.random() - 0.5) * 30, // ±15%
    light: (Math.random() - 0.5) * 400, // ±200 lux
  };

  // Simuler l'activité de la pompe basée sur l'humidité du sol
  const soilHumidity = defaultValues.humidity_soil + variations.humidity_soil;
  const pumpActive = soilHumidity < 60 ? Math.random() > 0.3 : Math.random() > 0.8;

  return {
    temperature: Math.round((defaultValues.temperature + variations.temperature) * 10) / 10,
    humidity_air: Math.max(0, Math.min(100, Math.round(defaultValues.humidity_air + variations.humidity_air))),
    humidity_soil: Math.max(0, Math.min(100, Math.round(defaultValues.humidity_soil + variations.humidity_soil))),
    water_level: Math.max(0, Math.min(100, Math.round(defaultValues.water_level + variations.water_level))),
    pump_active: pumpActive,
    light: Math.max(0, Math.round(defaultValues.light + variations.light)),
    timestamp: new Date().toISOString(),
    chamberId
  };
};

/**
 * Génère un historique de données sur 24 heures
 * @param {string} chamberId - 'ch1' ou 'ch2'
 * @param {number} intervalMinutes - Intervalle entre les points en minutes
 * @returns {array} Historique de données
 */
export const generateMockHistory = (chamberId = 'ch1', intervalMinutes = 60) => {
  const history = [];
  const now = new Date();
  const pointsCount = Math.floor((24 * 60) / intervalMinutes);

  // Valeurs de base différentes pour chaque chambre
  const baseValues = chamberId === 'ch1' ? {
    temperature: 21,
    humidity_air: 60,
    humidity_soil: 75,
    water_level: 80,
    light: 450
  } : {
    temperature: 23,
    humidity_air: 70,
    humidity_soil: 65,
    water_level: 70,
    light: 550
  };

  for (let i = pointsCount - 1; i >= 0; i--) {
    const timestamp = new Date(now.getTime() - (i * intervalMinutes * 60 * 1000));
    
    // Simuler des cycles jour/nuit pour la lumière
    const hour = timestamp.getHours();
    const isDayTime = hour >= 6 && hour <= 20;
    const lightMultiplier = isDayTime ? 1 + Math.sin((hour - 6) * Math.PI / 14) : 0.1;
    
    // Simuler des cycles d'arrosage
    const pumpCycle = Math.sin((timestamp.getTime() / (1000 * 60 * 60 * 3)) * Math.PI) > 0.7;
    
    const data = generateMockChamberData(chamberId, {
      ...baseValues,
      light: baseValues.light * lightMultiplier,
      pump_active: pumpCycle && Math.random() > 0.6
    });
    
    data.timestamp = timestamp.toISOString();
    history.push(data);
  }

  return history;
};

/**
 * Génère des données de test pour les deux chambres
 * @returns {object} Données complètes pour ch1 et ch2
 */
export const generateDualChamberMockData = () => {
  return {
    ch1: {
      current: generateMockChamberData('ch1'),
      history: generateMockHistory('ch1', 60)
    },
    ch2: {
      current: generateMockChamberData('ch2'),
      history: generateMockHistory('ch2', 60)
    }
  };
};

/**
 * Simule des données avec des alertes pour tester les seuils
 * @param {string} chamberId - 'ch1' ou 'ch2'
 * @returns {object} Données avec alertes
 */
export const generateAlertMockData = (chamberId = 'ch1') => {
  const alertScenarios = [
    { temperature: 32, humidity_air: 30, humidity_soil: 45, water_level: 15 }, // Trop chaud et sec
    { temperature: 15, humidity_air: 90, humidity_soil: 85, water_level: 95 }, // Trop froid et humide
    { temperature: 25, humidity_air: 50, humidity_soil: 30, water_level: 10 }, // Sol trop sec
    { temperature: 20, humidity_air: 85, humidity_soil: 90, water_level: 100 } // Trop humide
  ];

  const scenario = alertScenarios[Math.floor(Math.random() * alertScenarios.length)];
  
  return generateMockChamberData(chamberId, {
    ...scenario,
    pump_active: scenario.humidity_soil < 50, // Pompe active si sol sec
    light: Math.random() * 1000
  });
};

/**
 * Génère des données de test pour Firebase
 * Structure: /chambre/ch1/sensors et /chambre/ch2/sensors
 * @returns {object} Structure Firebase complète
 */
export const generateFirebaseMockStructure = () => {
  const ch1Data = generateMockChamberData('ch1');
  const ch2Data = generateMockChamberData('ch2');

  return {
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
};

/**
 * Simule une mise à jour en temps réel des données
 * @param {function} callback - Fonction appelée avec les nouvelles données
 * @param {number} interval - Intervalle en millisecondes
 * @returns {function} Fonction pour arrêter la simulation
 */
export const simulateRealTimeUpdates = (callback, interval = 5000) => {
  const updateInterval = setInterval(() => {
    const mockData = generateFirebaseMockStructure();
    callback(mockData);
  }, interval);

  return () => clearInterval(updateInterval);
};

/**
 * Génère des scénarios de test spécifiques
 * @param {string} scenario - Type de scénario ('normal', 'alert', 'offline', 'mixed')
 * @returns {object} Données de test pour le scénario
 */
export const generateTestScenario = (scenario = 'normal') => {
  switch (scenario) {
    case 'alert':
      return {
        chambre: {
          ch1: {
            sensors: generateAlertMockData('ch1')
          },
          ch2: {
            sensors: generateAlertMockData('ch2')
          }
        }
      };

    case 'offline':
      return {
        chambre: {
          ch1: {
            sensors: generateMockChamberData('ch1')
          }
          // ch2 manquant pour simuler une chambre hors ligne
        }
      };

    case 'mixed':
      return {
        chambre: {
          ch1: {
            sensors: generateMockChamberData('ch1')
          },
          ch2: {
            sensors: generateAlertMockData('ch2')
          }
        }
      };

    case 'normal':
    default:
      return generateFirebaseMockStructure();
  }
};

/**
 * Utilitaire pour tester la connectivité Firebase avec des données mock
 * @returns {Promise} Simulation de test de connectivité
 */
export const mockConnectivityTest = async () => {
  // Simuler un délai réseau
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    connected: true,
    hasData: true,
    chambers: {
      ch1: true,
      ch2: true
    },
    mockData: generateFirebaseMockStructure()
  };
};

/**
 * Exporte les données par défaut pour les tests
 */
export default {
  generateMockChamberData,
  generateMockHistory,
  generateDualChamberMockData,
  generateAlertMockData,
  generateFirebaseMockStructure,
  simulateRealTimeUpdates,
  generateTestScenario,
  mockConnectivityTest
};
