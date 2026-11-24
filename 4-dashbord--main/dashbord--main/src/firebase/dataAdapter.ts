import { SensorInfo, SensorHistory } from '../types';

/**
 * Génère un historique simulé pour un capteur
 * Cela permet d'avoir des graphiques plus intéressants même sans historique réel
 */
function generateSimulatedHistory(
  currentValue: number,
  minThreshold: number,
  maxThreshold: number,
  currentTimestamp: string
): SensorHistory[] {
  const history: SensorHistory[] = [];
  const now = new Date(currentTimestamp);
  const range = maxThreshold - minThreshold;

  // Générer 24 points d'historique (1 par heure)
  for (let i = 23; i >= 0; i--) {
    const timestamp = new Date(now);
    timestamp.setHours(timestamp.getHours() - i);

    // Générer une valeur aléatoire autour de la valeur actuelle
    // Plus on s'approche du présent, plus la valeur est proche de la valeur actuelle
    const randomFactor = Math.random() * 0.5 - 0.25; // Entre -0.25 et 0.25
    const timeCloseness = (24 - i) / 24; // Plus proche de 1 quand on s'approche du présent

    // Mélanger la valeur aléatoire avec la valeur actuelle selon la proximité temporelle
    const baseValue = minThreshold + Math.random() * range;
    const value = baseValue * (1 - timeCloseness) + currentValue * timeCloseness + randomFactor * range;

    // Ajouter le point d'historique
    history.push({
      timestamp: timestamp.toISOString(),
      value: value
    });
  }

  // Remplacer le dernier point par la valeur actuelle exacte
  history[history.length - 1] = {
    timestamp: currentTimestamp,
    value: currentValue
  };

  return history;
}

/**
 * Adapte les données provenant de Firebase au format attendu par l'application
 * Cela permet de gérer différentes structures de données sans modifier tout le code
 */
export const adaptSensorData = (rawData: any): SensorInfo[] => {
  if (!rawData) return [];

  // Vérifier si les données sont dans sensor_data
  if (typeof rawData === 'object' && 'sensor_data' in rawData) {
    console.log("Structure sensor_data détectée:", rawData.sensor_data);

    // Trouver la dernière entrée dans sensor_data
    const sensorEntries = Object.values(rawData.sensor_data);
    if (sensorEntries.length > 0) {
      // Trier par timestamp (du plus récent au plus ancien)
      const sortedEntries = sensorEntries.sort((a: any, b: any) => {
        if (!a.timestamp || !b.timestamp) return 0;
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      });

      // Prendre la première entrée (la plus récente)
      const latestEntry = sortedEntries[0] as any;
      console.log('Entrée la plus récente:', latestEntry);

      // Utiliser cette entrée comme source de données principale
      // mais conserver l'historique complet dans sensor_data
      rawData = {
        ...latestEntry,  // Données les plus récentes
        sensor_data: rawData.sensor_data  // Historique complet
      };

      console.log('Données adaptées:', rawData);
    }
  }

  // Structure spécifique pour les données de votre Raspberry Pi
  // humidity_air, humidity_soil, temperature, water_level, pump_active, timestamp
  if (typeof rawData === 'object') {
    // Vérifier si nous avons les données de capteurs
    const hasTemperature = 'temperature' in rawData;
    const hasHumidityAir = 'humidity_air' in rawData;
    const hasHumiditySoil = 'humidity_soil' in rawData;
    const hasWaterLevel = 'water_level' in rawData;
    const hasPumpActive = 'pump_active' in rawData;
    const hasLight = 'light' in rawData;
    const hasTimestamp = 'timestamp' in rawData;

    // Si nous avons au moins un capteur, créer les capteurs virtuels
    if (hasTemperature || hasHumidityAir || hasHumiditySoil || hasWaterLevel || hasPumpActive || hasLight) {
      console.log("Données de capteurs détectées:", rawData);

      // Utiliser l'horodatage actuel si aucun n'est fourni
      const timestamp = hasTimestamp ? rawData.timestamp : new Date().toISOString();

      // Créer des capteurs virtuels pour chaque type de mesure
      const sensors: SensorInfo[] = [];

      // Capteur de température
      if (hasTemperature) {
        const tempValue = typeof rawData.temperature === 'number' ? rawData.temperature : parseFloat(rawData.temperature);
        sensors.push(createSensorFromValue('temp-1', 'Température', tempValue, '°C', 18, 28, timestamp));
      }

      // Capteur d'humidité de l'air
      if (hasHumidityAir) {
        const humAirValue = typeof rawData.humidity_air === 'number' ? rawData.humidity_air : parseFloat(rawData.humidity_air);
        sensors.push(createSensorFromValue('hum-air-1', 'Humidité de l\'air', humAirValue, '%', 40, 80, timestamp));
      }

      // Capteur d'humidité du sol
      if (hasHumiditySoil) {
        const humSoilValue = typeof rawData.humidity_soil === 'number' ? rawData.humidity_soil : parseFloat(rawData.humidity_soil);
        sensors.push(createSensorFromValue('hum-soil-1', 'Humidité du sol', humSoilValue, '%', 60, 80, timestamp));
      }

      // Capteur de niveau d'eau
      if (hasWaterLevel) {
        const waterValue = typeof rawData.water_level === 'number' ? rawData.water_level : parseFloat(rawData.water_level);
        sensors.push(createSensorFromValue('water-1', 'Niveau d\'eau', waterValue, '%', 20, 100, timestamp));
      }

      // Capteur d'état de la pompe
      if (hasPumpActive) {
        const pumpValue = rawData.pump_active ? 1 : 0;
        sensors.push(createSensorFromValue('pump-1', 'État de la pompe', pumpValue, '', 0, 1, timestamp));
      }

      // Capteur de luminosité
      if (hasLight) {
        const lightValue = typeof rawData.light === 'number' ? rawData.light : parseFloat(rawData.light);
        sensors.push(createSensorFromValue('light-1', 'Luminosité', lightValue, 'lux', 200, 1000, timestamp));
      }

      console.log("Capteurs créés:", sensors.length);
      return sensors;
    }
  }

  // Si les données sont déjà au format attendu (tableau d'objets SensorInfo)
  if (Array.isArray(rawData) && rawData.length > 0 && 'id' in rawData[0] && 'history' in rawData[0]) {
    return rawData as SensorInfo[];
  }

  // Si les données sont un objet avec des clés qui sont les IDs des capteurs
  if (typeof rawData === 'object' && !Array.isArray(rawData)) {
    // Essayer de convertir les données existantes
    const sensorsFromData = Object.entries(rawData).map(([id, data]) => {
      // Si les données sont déjà au format SensorInfo
      if (data && typeof data === 'object' && 'id' in data && 'history' in data) {
        return data as SensorInfo;
      }

      // Si les données sont dans un format différent, on les adapte
      return adaptSingleSensor(id, data);
    });

    // Si nous avons des capteurs, les retourner
    if (sensorsFromData.length > 0) {
      return sensorsFromData;
    }
  }

  // Si aucune donnée n'a été trouvée ou convertie, créer des capteurs virtuels par défaut
  console.log("Creating default virtual sensors");

  const defaultSensors: SensorInfo[] = [
    createSensorFromValue('temp-1', 'Température', 22.0, '°C', 18, 28, new Date().toISOString()),
    createSensorFromValue('hum-air-1', 'Humidité de l\'air', 60.0, '%', 40, 80, new Date().toISOString()),
    createSensorFromValue('hum-soil-1', 'Humidité du sol', 70.0, '%', 60, 80, new Date().toISOString()),
    createSensorFromValue('water-1', 'Niveau d\'eau', 50.0, '%', 20, 100, new Date().toISOString()),
    createSensorFromValue('pump-1', 'État de la pompe', 0, '', 0, 1, new Date().toISOString()),
    createSensorFromValue('light-1', 'Luminosité', 500.0, 'lux', 200, 1000, new Date().toISOString())
  ];

  return defaultSensors;
};

/**
 * Crée un objet SensorInfo à partir d'une valeur simple
 */
function createSensorFromValue(
  id: string,
  name: string,
  value: number,
  unit: string,
  minThreshold: number,
  maxThreshold: number,
  timestamp: string
): SensorInfo {
  const isAlert = value < minThreshold || value > maxThreshold;

  // Créer une entrée d'historique avec la valeur actuelle
  const historyEntry: SensorHistory = {
    timestamp: timestamp || new Date().toISOString(),
    value: value
  };

  // Générer un historique simulé basé sur la valeur actuelle
  // Cela permet d'avoir des graphiques plus intéressants même sans historique réel
  const history: SensorHistory[] = generateSimulatedHistory(value, minThreshold, maxThreshold, timestamp);

  return {
    id,
    name,
    description: `Capteur de ${name.toLowerCase()}`,
    unit,
    minThreshold,
    maxThreshold,
    currentValue: value,
    history,
    isAlert
  };
}

/**
 * Adapte un seul capteur au format SensorInfo
 */
export const adaptSingleSensor = (id: string, data: any): SensorInfo => {
  // Format par défaut si les données sont manquantes
  const defaultSensor: SensorInfo = {
    id,
    name: id,
    description: '',
    unit: '',
    minThreshold: 0,
    maxThreshold: 100,
    currentValue: 0,
    history: [],
    isAlert: false
  };

  // Si aucune donnée, retourner le format par défaut
  if (!data) return defaultSensor;

  // Adapter les données selon leur structure
  try {
    // Cas spécifique: Structure de données de votre Raspberry Pi
    // Vérifier si nous avons les données de capteurs
    const hasTemperature = 'temperature' in data;
    const hasHumidityAir = 'humidity_air' in data;
    const hasHumiditySoil = 'humidity_soil' in data;
    const hasWaterLevel = 'water_level' in data;
    const hasPumpActive = 'pump_active' in data;
    const hasLight = 'light' in data;
    const hasTimestamp = 'timestamp' in data;
    const timestamp = hasTimestamp ? data.timestamp : new Date().toISOString();

    // Capteur de température
    if (id === 'temp-1' && hasTemperature) {
      const tempValue = typeof data.temperature === 'number' ? data.temperature : parseFloat(data.temperature);
      return createSensorFromValue(
        'temp-1',
        'Température',
        tempValue,
        '°C',
        18,
        28,
        timestamp
      );
    }

    // Capteur d'humidité de l'air
    if (id === 'hum-air-1' && hasHumidityAir) {
      const humAirValue = typeof data.humidity_air === 'number' ? data.humidity_air : parseFloat(data.humidity_air);
      return createSensorFromValue(
        'hum-air-1',
        'Humidité de l\'air',
        humAirValue,
        '%',
        40,
        80,
        timestamp
      );
    }

    // Capteur d'humidité du sol
    if (id === 'hum-soil-1' && hasHumiditySoil) {
      const humSoilValue = typeof data.humidity_soil === 'number' ? data.humidity_soil : parseFloat(data.humidity_soil);
      return createSensorFromValue(
        'hum-soil-1',
        'Humidité du sol',
        humSoilValue,
        '%',
        60,
        80,
        timestamp
      );
    }

    // Capteur de niveau d'eau
    if (id === 'water-1' && hasWaterLevel) {
      const waterValue = typeof data.water_level === 'number' ? data.water_level : parseFloat(data.water_level);
      return createSensorFromValue(
        'water-1',
        'Niveau d\'eau',
        waterValue,
        '%',
        20,
        100,
        timestamp
      );
    }

    // Cas spécial: si l'ID correspond à un capteur mais que les données sont à la racine
    if (id === 'temp-1') {
      // Essayer de trouver la température dans les données
      if (hasTemperature) {
        const tempValue = typeof data.temperature === 'number' ? data.temperature : parseFloat(data.temperature);
        return createSensorFromValue(
          'temp-1',
          'Température',
          tempValue,
          '°C',
          18,
          28,
          timestamp
        );
      } else {
        // Valeur par défaut pour la température
        return createSensorFromValue(
          'temp-1',
          'Température',
          22.0,
          '°C',
          18,
          28,
          new Date().toISOString()
        );
      }
    }

    if (id === 'hum-air-1') {
      // Essayer de trouver l'humidité de l'air dans les données
      if (hasHumidityAir) {
        const humAirValue = typeof data.humidity_air === 'number' ? data.humidity_air : parseFloat(data.humidity_air);
        return createSensorFromValue(
          'hum-air-1',
          'Humidité de l\'air',
          humAirValue,
          '%',
          40,
          80,
          timestamp
        );
      } else {
        // Valeur par défaut pour l'humidité de l'air
        return createSensorFromValue(
          'hum-air-1',
          'Humidité de l\'air',
          60.0,
          '%',
          40,
          80,
          new Date().toISOString()
        );
      }
    }

    if (id === 'hum-soil-1') {
      // Essayer de trouver l'humidité du sol dans les données
      if (hasHumiditySoil) {
        const humSoilValue = typeof data.humidity_soil === 'number' ? data.humidity_soil : parseFloat(data.humidity_soil);
        return createSensorFromValue(
          'hum-soil-1',
          'Humidité du sol',
          humSoilValue,
          '%',
          60,
          80,
          timestamp
        );
      } else {
        // Valeur par défaut pour l'humidité du sol
        return createSensorFromValue(
          'hum-soil-1',
          'Humidité du sol',
          70.0,
          '%',
          60,
          80,
          new Date().toISOString()
        );
      }
    }

    if (id === 'water-1') {
      // Essayer de trouver le niveau d'eau dans les données
      if (hasWaterLevel) {
        const waterValue = typeof data.water_level === 'number' ? data.water_level : parseFloat(data.water_level);
        return createSensorFromValue(
          'water-1',
          'Niveau d\'eau',
          waterValue,
          '%',
          20,
          100,
          timestamp
        );
      } else {
        // Valeur par défaut pour le niveau d'eau
        return createSensorFromValue(
          'water-1',
          'Niveau d\'eau',
          50.0,
          '%',
          20,
          100,
          new Date().toISOString()
        );
      }
    }

    // Capteur d'état de la pompe
    if (id === 'pump-1') {
      // Essayer de trouver l'état de la pompe dans les données
      if (hasPumpActive) {
        const pumpValue = data.pump_active ? 1 : 0;
        return createSensorFromValue(
          'pump-1',
          'État de la pompe',
          pumpValue,
          '',
          0,
          1,
          timestamp
        );
      } else {
        // Valeur par défaut pour l'état de la pompe
        return createSensorFromValue(
          'pump-1',
          'État de la pompe',
          0,
          '',
          0,
          1,
          new Date().toISOString()
        );
      }
    }

    // Capteur de luminosité
    if (id === 'light-1') {
      // Essayer de trouver la luminosité dans les données
      if (hasLight) {
        const lightValue = typeof data.light === 'number' ? data.light : parseFloat(data.light);
        return createSensorFromValue(
          'light-1',
          'Luminosité',
          lightValue,
          'lux',
          200,
          1000,
          timestamp
        );
      } else {
        // Valeur par défaut pour la luminosité
        return createSensorFromValue(
          'light-1',
          'Luminosité',
          500.0,
          'lux',
          200,
          1000,
          new Date().toISOString()
        );
      }
    }

    // Cas 1: Format standard de notre application
    if ('currentValue' in data && 'history' in data) {
      return {
        ...defaultSensor,
        ...data,
      };
    }

    // Cas 2: Format simple avec juste une valeur
    if ('value' in data) {
      const value = Number(data.value);
      const minThreshold = 'min' in data ? Number(data.min) : defaultSensor.minThreshold;
      const maxThreshold = 'max' in data ? Number(data.max) : defaultSensor.maxThreshold;
      const isAlert = value < minThreshold || value > maxThreshold;

      return {
        ...defaultSensor,
        name: data.name || id,
        description: data.description || '',
        unit: data.unit || '',
        minThreshold,
        maxThreshold,
        currentValue: value,
        isAlert,
        history: [
          {
            timestamp: data.timestamp || new Date().toISOString(),
            value
          }
        ]
      };
    }

    // Cas 3: Format avec valeurs directes (ex: { temperature: 25 })
    const keys = Object.keys(data);
    if (keys.length === 1 && typeof data[keys[0]] === 'number') {
      const value = Number(data[keys[0]]);
      return {
        ...defaultSensor,
        name: keys[0],
        currentValue: value,
        isAlert: false,
        history: [
          {
            timestamp: new Date().toISOString(),
            value
          }
        ]
      };
    }

    // Cas 4: Format avec plusieurs valeurs mais pas d'historique
    if ('currentValue' in data && !('history' in data)) {
      return {
        ...defaultSensor,
        ...data,
        history: [
          {
            timestamp: new Date().toISOString(),
            value: data.currentValue
          }
        ]
      };
    }

    // Si aucun format reconnu, retourner les données telles quelles avec les valeurs par défaut
    return {
      ...defaultSensor,
      ...data
    };
  } catch (error) {
    console.error('Error adapting sensor data:', error);
    return defaultSensor;
  }
};
