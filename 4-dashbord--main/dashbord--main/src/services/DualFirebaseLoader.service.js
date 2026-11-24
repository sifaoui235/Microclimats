import { ref, onValue, get } from 'firebase/database';
import { database } from '../firebase/config';

/**
 * Service pour charger les données des deux milieux depuis Firebase
 * Chemins Firebase:
 * - Milieu 1: /chambre/ch1/sensors
 * - Milieu 2: /chambre/ch2/sensors
 */

/**
 * Extrait les données les plus récentes depuis la structure Firebase complexe
 * @param {object} firebaseData - Données brutes de Firebase
 * @returns {object|null} Données de capteurs extraites
 */
const extractLatestSensorData = (firebaseData) => {
  if (!firebaseData) return null;

  let latestData = null;
  let latestTimestampDate = null;

  // Chercher dans tous les objets avec IDs complexes et prendre le plus récent
  for (const [key, value] of Object.entries(firebaseData)) {
    if (typeof value === 'object' && value !== null) {
      const data = value;

      // Vérifier si cet objet contient des données de capteurs
      if (data.temperature !== undefined || data.humidity_air !== undefined) {
        const timestamp = data.timestamp || '';

        try {
          // Convertir le timestamp en Date pour une comparaison correcte
          const timestampDate = new Date(timestamp);

          // Prendre les données les plus récentes basées sur la date
          if (!latestData || !latestTimestampDate || timestampDate > latestTimestampDate) {
            latestData = data;
            latestTimestampDate = timestampDate;
            console.log(`📊 Nouvelles données plus récentes trouvées dans ${key}:`, timestamp);
          }
        } catch (error) {
          console.warn(`⚠️ Timestamp invalide pour ${key}:`, timestamp);
        }
      }
    }
  }

  if (latestData) {
    console.log('✅ Données finales sélectionnées:', latestData);
    return latestData;
  }

  return null;
};

// Timeout pour considérer un milieu comme hors ligne (en millisecondes)
const OFFLINE_TIMEOUT = 60000; // 60 secondes

// Stockage des dernières mises à jour pour chaque milieu
const lastUpdateTimes = {
  ch1: null,
  ch2: null
};

// Stockage des dernières données valides pour chaque milieu
const lastValidData = {
  ch1: null,
  ch2: null
};

/**
 * Vérifie si un milieu est considéré comme hors ligne
 * @param {string} chamberId - 'ch1' ou 'ch2'
 * @returns {boolean} True si le milieu est hors ligne
 */
const isChamberOffline = (chamberId) => {
  const lastUpdate = lastUpdateTimes[chamberId];
  if (!lastUpdate) return true;

  const now = new Date().getTime();
  const timeDiff = now - lastUpdate;
  return timeDiff > OFFLINE_TIMEOUT;
};

/**
 * Vérifie si les données sont récentes (basé sur le timestamp des données)
 * @param {string} timestamp - Timestamp des données
 * @returns {boolean} True si les données sont récentes
 */
const isDataRecent = (timestamp) => {
  if (!timestamp) return false;

  try {
    const dataTime = new Date(timestamp).getTime();
    const now = new Date().getTime();
    const timeDiff = now - dataTime;
    return timeDiff <= OFFLINE_TIMEOUT;
  } catch (error) {
    console.warn('Timestamp invalide:', timestamp);
    return false;
  }
};

/**
 * Écoute les changements en temps réel pour un milieu spécifique
 * @param {string} chamberId - 'ch1' ou 'ch2'
 * @param {function} callback - Fonction appelée lors des mises à jour
 * @returns {function} Fonction de désabonnement
 */
export const subscribeToChamberData = (chamberId, callback) => {
  const chamberRef = ref(database, `/chambre/${chamberId}/sensors`);

  // Timer pour vérifier périodiquement le statut hors ligne
  const offlineCheckInterval = setInterval(() => {
    if (isChamberOffline(chamberId) && lastValidData[chamberId]) {
      console.log(`⚠️ Milieu ${chamberId} considéré comme hors ligne - envoi des dernières données`);
      // Envoyer les dernières données valides avec le statut hors ligne
      const offlineData = {
        ...lastValidData[chamberId],
        isOnline: false
      };
      callback(offlineData, null); // Pas d'erreur, juste un changement de statut
    }
  }, 10000); // Vérifier toutes les 10 secondes

  const unsubscribe = onValue(
    chamberRef,
    (snapshot) => {
      const rawData = snapshot.val();
      console.log(`🔄 Données reçues pour ${chamberId}:`, rawData);

      if (rawData) {
        // Extraire les données les plus récentes
        const latestData = extractLatestSensorData(rawData);

        if (latestData) {
          // Vérifier si les données sont récentes
          const dataIsRecent = isDataRecent(latestData.timestamp);

          if (dataIsRecent) {
            // Mettre à jour le temps de dernière réception
            lastUpdateTimes[chamberId] = new Date().getTime();

            // Ajouter l'ID de la chambre aux données
            const processedData = {
              ...latestData,
              chamberId,
              timestamp: latestData.timestamp || new Date().toISOString(),
              isOnline: true
            };

            // Sauvegarder les données valides
            lastValidData[chamberId] = processedData;

            console.log(`✅ Données traitées pour ${chamberId}:`, processedData);
            callback(processedData);
          } else {
            console.log(`⚠️ Données obsolètes pour ${chamberId}, timestamp: ${latestData.timestamp}`);
            // Pour les données obsolètes, on garde les dernières données valides si disponibles
            if (lastValidData[chamberId]) {
              const offlineData = {
                ...lastValidData[chamberId],
                isOnline: false
              };
              callback(offlineData, null); // Pas d'erreur, juste changement de statut
            } else {
              // Première fois qu'on reçoit des données obsolètes, on les traite quand même
              const processedData = {
                ...latestData,
                chamberId,
                timestamp: latestData.timestamp || new Date().toISOString(),
                isOnline: false
              };
              lastValidData[chamberId] = processedData;
              callback(processedData, null);
            }
          }
        } else {
          console.log(`⚠️ Aucune donnée valide trouvée pour ${chamberId}`);
          // Envoyer les dernières données valides si disponibles
          if (lastValidData[chamberId]) {
            const offlineData = {
              ...lastValidData[chamberId],
              isOnline: false
            };
            callback(offlineData, null);
          } else {
            // Vraiment aucune donnée - comportement normal
            callback(null, null);
          }
        }
      } else {
        // Pas de données disponibles
        console.log(`❌ Aucune donnée disponible pour ${chamberId}`);
        // Envoyer les dernières données valides si disponibles
        if (lastValidData[chamberId]) {
          const offlineData = {
            ...lastValidData[chamberId],
            isOnline: false
          };
          callback(offlineData, null);
        } else {
          // Vraiment aucune donnée - comportement normal
          callback(null, null);
        }
      }
    },
    (error) => {
      console.error(`Erreur lors de l'écoute des données de la chambre ${chamberId}:`, error);
      callback(null, error);
    }
  );

  // Retourner une fonction de désabonnement qui nettoie aussi l'interval
  return () => {
    unsubscribe();
    clearInterval(offlineCheckInterval);
  };
};

/**
 * Obtient le statut de connexion d'un milieu
 * @param {string} chamberId - 'ch1' ou 'ch2'
 * @returns {object} Statut de connexion avec isOnline et lastUpdate
 */
export const getChamberConnectionStatus = (chamberId) => {
  const lastUpdate = lastUpdateTimes[chamberId];
  const isOnline = !isChamberOffline(chamberId);

  return {
    isOnline,
    lastUpdate: lastUpdate ? new Date(lastUpdate) : null,
    timeSinceLastUpdate: lastUpdate ? new Date().getTime() - lastUpdate : null
  };
};

/**
 * Obtient le statut de connexion de tous les milieux
 * @returns {object} Statut de connexion pour ch1 et ch2
 */
export const getAllChambersConnectionStatus = () => {
  return {
    ch1: getChamberConnectionStatus('ch1'),
    ch2: getChamberConnectionStatus('ch2')
  };
};

/**
 * Écoute les changements pour les deux milieux simultanément
 * @param {function} onCh1Update - Callback pour le milieu 1
 * @param {function} onCh2Update - Callback pour le milieu 2
 * @returns {function} Fonction de désabonnement pour les deux milieux
 */
export const subscribeToAllChambers = (onCh1Update, onCh2Update) => {
  const unsubscribeCh1 = subscribeToChamberData('ch1', onCh1Update);
  const unsubscribeCh2 = subscribeToChamberData('ch2', onCh2Update);

  // Retourne une fonction qui désabonne les deux milieux
  return () => {
    unsubscribeCh1();
    unsubscribeCh2();
  };
};

/**
 * Récupère les données d'un milieu une seule fois
 * @param {string} chamberId - 'ch1' ou 'ch2'
 * @returns {Promise} Données du milieu
 */
export const getChamberDataOnce = async (chamberId) => {
  try {
    const chamberRef = ref(database, `/chambre/${chamberId}/sensors`);
    const snapshot = await get(chamberRef);

    if (snapshot.exists()) {
      const data = snapshot.val();
      return {
        ...data,
        chamberId,
        timestamp: data.timestamp || new Date().toISOString()
      };
    } else {
      console.log(`Aucune donnée trouvée pour le milieu ${chamberId}`);
      return null;
    }
  } catch (error) {
    console.error(`Erreur lors de la récupération des données du milieu ${chamberId}:`, error);
    throw error;
  }
};

/**
 * Récupère les données des deux milieux une seule fois
 * @returns {Promise} Objet contenant les données des deux milieux
 */
export const getAllChambersDataOnce = async () => {
  try {
    const [ch1Data, ch2Data] = await Promise.all([
      getChamberDataOnce('ch1'),
      getChamberDataOnce('ch2')
    ]);

    return {
      ch1: ch1Data,
      ch2: ch2Data
    };
  } catch (error) {
    console.error('Erreur lors de la récupération des données des milieux:', error);
    throw error;
  }
};

/**
 * Génère un historique horaire simulé pour les graphiques de comparaison
 * @param {number} currentValue - Valeur actuelle
 * @param {number} min - Valeur minimale
 * @param {number} max - Valeur maximale
 * @param {string} timestamp - Timestamp actuel
 * @returns {array} Historique simulé sur 24 heures
 */
const generateHourlyHistory = (currentValue, min, max, timestamp) => {
  const history = [];
  const now = new Date(timestamp);
  const range = max - min;

  // Générer 24 heures de données (de 0h à 23h)
  for (let hour = 0; hour < 24; hour++) {
    const time = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, 0, 0);

    // Ne pas générer de données futures
    if (time > now) break;

    // Variation aléatoire autour de la valeur actuelle avec cycle journalier
    const hourlyFactor = Math.sin((hour / 24) * Math.PI * 2) * 0.15; // Cycle journalier
    const randomVariation = (Math.random() - 0.5) * range * 0.3;
    let value = currentValue + randomVariation + (hourlyFactor * range);

    // S'assurer que la valeur reste dans une plage raisonnable
    value = Math.max(min - range * 0.1, Math.min(max + range * 0.1, value));

    history.push({
      timestamp: time.toISOString(),
      value: Math.round(value * 100) / 100,
      hour: hour
    });
  }

  // Le dernier point est la valeur actuelle exacte
  if (history.length > 0) {
    history[history.length - 1] = {
      timestamp: timestamp,
      value: currentValue,
      hour: now.getHours()
    };
  }

  return history;
};

/**
 * Convertit les données brutes d'un milieu en format SensorInfo
 * @param {object} rawData - Données brutes de Firebase
 * @param {string} chamberId - 'ch1' ou 'ch2'
 * @param {string} milieuName - Nom du milieu
 * @returns {array} Tableau de MilieuSensorInfo
 */
export const convertToChamberSensors = (rawData, chamberId, milieuName) => {
  if (!rawData) return [];

  const sensors = [];
  const timestamp = rawData.timestamp || new Date().toISOString();

  // Définition des seuils spécifiques pour chaque milieu
  const getThresholds = (chamberId) => {
    if (chamberId === 'ch1') {
      // Seuils pour Milieu 1
      return {
        temperature: { min: 12, max: 25, unit: '°C', name: 'Température' },
        humidity_air: { min: 60, max: 85, unit: '%', name: 'Humidité d\'air' },
        humidity_soil: { min: 60, max: 80, unit: '%', name: 'Humidité du sol' },
        water_level: { min: 20, max: 100, unit: '%', name: 'Niveau d\'eau' },
        pump_active: { min: 0, max: 1, unit: '', name: 'Pompe d\'irrigation' },
        light: { min: 200, max: 1000, unit: 'lux', name: 'Luminosité' },
        fan_active: { min: 0, max: 1, unit: '', name: 'État du ventilateur' },
        heater_active: { min: 0, max: 1, unit: '', name: 'État du chauffage' }
      };
    } else {
      // Seuils pour Milieu 2
      return {
        temperature: { min: 18, max: 20, unit: '°C', name: 'Température' },
        humidity_air: { min: 65, max: 75, unit: '%', name: 'Humidité d\'air' },
        humidity_soil: { min: 60, max: 70, unit: '%', name: 'Humidité du sol' },
        water_level: { min: 20, max: 100, unit: '%', name: 'Niveau d\'eau' },
        pump_active: { min: 0, max: 1, unit: '', name: 'Pompe d\'irrigation' },
        light: { min: 200, max: 1000, unit: 'lux', name: 'Luminosité' },
        fan_active: { min: 0, max: 1, unit: '', name: 'État du ventilateur' },
        heater_active: { min: 0, max: 1, unit: '', name: 'État du chauffage' }
      };
    }
  };

  const thresholds = getThresholds(chamberId);

  // Créer un capteur pour chaque mesure disponible (sauf water_level)
  Object.entries(thresholds).forEach(([key, config]) => {
    // Exclure water_level car c'est un milieu séparé (réservoir unique)
    if (key !== 'water_level' && rawData.hasOwnProperty(key)) {
      const value = typeof rawData[key] === 'boolean' ? (rawData[key] ? 1 : 0) : Number(rawData[key]);
      const isAlert = value < config.min || value > config.max;

      // Générer un historique simulé pour les graphiques (journalier par heures pour les comparaisons)
      const history = generateHourlyHistory(value, config.min, config.max, timestamp);

      sensors.push({
        id: `${chamberId}-${key}`,
        name: config.name,
        description: `${config.name} - ${milieuName}`,
        unit: config.unit,
        minThreshold: config.min,
        maxThreshold: config.max,
        currentValue: value,
        history: history,
        isAlert: isAlert,
        chamberId: chamberId,
        milieuName: milieuName
      });
    }
  });

  // Ajouter le capteur de pompe MPK (simulé)
  const pumpMpkValue = Math.random() > 0.5 ? 1 : 0; // Simulation aléatoire
  sensors.push({
    id: `${chamberId}-pump_mpk`,
    name: 'Pompe MPK',
    description: `Pompe MPK - ${milieuName}`,
    unit: '',
    minThreshold: 0,
    maxThreshold: 1,
    currentValue: pumpMpkValue,
    history: generateHourlyHistory(pumpMpkValue, 0, 1, timestamp),
    isAlert: false,
    chamberId: chamberId,
    milieuName: milieuName
  });

  // Ajouter le capteur de lumière RGB (simulé)
  const rgbValues = {
    r: Math.random() > 0.5 ? 1 : 0,
    g: Math.random() > 0.5 ? 1 : 0,
    b: Math.random() > 0.5 ? 1 : 0
  };

  sensors.push({
    id: `${chamberId}-light_rgb`,
    name: 'Lumière RGB',
    description: `Lumière RGB - ${milieuName}`,
    unit: '',
    minThreshold: 0,
    maxThreshold: 1,
    currentValue: rgbValues, // Objet avec r, g, b
    history: generateHourlyHistory(1, 0, 1, timestamp),
    isAlert: false,
    chamberId: chamberId,
    milieuName: milieuName,
    rgbValues: rgbValues // Valeurs RGB spécifiques
  });

  return sensors;
};

/**
 * Génère un historique simulé pour les graphiques
 * @param {number} currentValue - Valeur actuelle
 * @param {number} min - Valeur minimale
 * @param {number} max - Valeur maximale
 * @param {string} timestamp - Timestamp actuel
 * @returns {array} Historique simulé sur 3 mois complets
 */
const generateSimulatedHistory = (currentValue, min, max, timestamp) => {
  const history = [];
  const now = new Date(timestamp);
  const range = max - min;

  // Générer 3 mois complets de données (environ 90 jours)
  for (let monthOffset = 2; monthOffset >= 0; monthOffset--) {
    const monthStart = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() - monthOffset + 1, 0);
    const daysInMonth = monthEnd.getDate();

    for (let day = 1; day <= daysInMonth; day++) {
      const time = new Date(now.getFullYear(), now.getMonth() - monthOffset, day);

      // Ne pas générer de données futures
      if (time > now) break;

      // Variation aléatoire autour de la valeur actuelle avec tendance saisonnière
      const seasonalFactor = Math.sin((monthOffset / 3) * Math.PI * 2) * 0.1;
      const dailyVariation = (Math.random() - 0.5) * range * 0.4;
      let value = currentValue + dailyVariation + (seasonalFactor * range);

      // S'assurer que la valeur reste dans une plage raisonnable
      value = Math.max(min - range * 0.2, Math.min(max + range * 0.2, value));

      history.push({
        timestamp: time.toISOString(),
        value: Math.round(value * 100) / 100,
        month: time.getMonth(),
        year: time.getFullYear()
      });
    }
  }

  // Le dernier point est la valeur actuelle exacte
  if (history.length > 0) {
    history[history.length - 1] = {
      timestamp: timestamp,
      value: currentValue,
      month: now.getMonth(),
      year: now.getFullYear()
    };
  }

  return history;
};

/**
 * Vérifie la connectivité Firebase pour les milieux
 * @returns {Promise} Statut de la connexion
 */
export const testChamberConnectivity = async () => {
  try {
    const testRef = ref(database, '/chambre');
    const snapshot = await get(testRef);

    return {
      connected: true,
      hasData: snapshot.exists(),
      milieux: {
        ch1: snapshot.child('ch1/sensors').exists(),
        ch2: snapshot.child('ch2/sensors').exists()
      }
    };
  } catch (error) {
    console.error('Erreur de connectivité Firebase:', error);
    return {
      connected: false,
      error: error.message
    };
  }
};
