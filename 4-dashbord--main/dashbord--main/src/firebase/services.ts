import { ref, set, get, onValue, push, update, remove } from 'firebase/database';
import { database } from './config';
import { SensorInfo, SensorHistory } from '../types';
import { adaptSensorData, adaptSingleSensor } from './dataAdapter';

// Reference to the root of the database where sensor data is stored
const sensorsRef = ref(database, '/');

// Get all sensors
export const getAllSensors = async (): Promise<SensorInfo[]> => {
  try {
    console.log("Fetching all sensors from path:", sensorsRef.toString());

    const snapshot = await get(sensorsRef);
    if (snapshot.exists()) {
      console.log("Received data from Firebase:", snapshot.val());

      // Utiliser l'adaptateur pour convertir les données au format attendu
      const sensors = adaptSensorData(snapshot.val());
      console.log("Converted sensors:", sensors);

      return sensors;
    }

    console.log("No data found in Firebase");
    return [];
  } catch (error) {
    console.error('Error fetching sensors:', error);
    throw error;
  }
};

// Get a single sensor by ID
export const getSensorById = async (sensorId: string): Promise<SensorInfo | null> => {
  try {
    // Pour notre structure spécifique, nous devons récupérer toutes les données
    // et extraire le capteur spécifique
    const rootRef = ref(database, '/');
    const snapshot = await get(rootRef);

    if (snapshot.exists()) {
      const data = snapshot.val();

      // Utiliser l'adaptateur pour convertir les données au format attendu
      return adaptSingleSensor(sensorId, data);
    }
    return null;
  } catch (error) {
    console.error(`Error fetching sensor ${sensorId}:`, error);
    throw error;
  }
};

// Add or update a sensor
export const saveSensor = async (sensor: SensorInfo): Promise<void> => {
  try {
    const sensorRef = ref(database, `sensors/${sensor.id}`);
    await set(sensorRef, sensor);
  } catch (error) {
    console.error('Error saving sensor:', error);
    throw error;
  }
};

// Update sensor current value and add to history
export const updateSensorValue = async (
  sensorId: string,
  newValue: number,
  timestamp = new Date().toISOString()
): Promise<void> => {
  try {
    const sensorRef = ref(database, `sensors/${sensorId}`);
    const snapshot = await get(sensorRef);

    if (snapshot.exists()) {
      const sensor = snapshot.val() as SensorInfo;

      // Check if value is outside thresholds
      const isAlert = newValue < sensor.minThreshold || newValue > sensor.maxThreshold;

      // Create new history entry
      const newHistoryEntry: SensorHistory = {
        timestamp,
        value: newValue
      };

      // Keep only the last 24 history entries
      const updatedHistory = [...sensor.history.slice(-23), newHistoryEntry];

      // Update the sensor
      await update(sensorRef, {
        currentValue: newValue,
        isAlert,
        history: updatedHistory
      });
    }
  } catch (error) {
    console.error(`Error updating sensor ${sensorId}:`, error);
    throw error;
  }
};

// Delete a sensor
export const deleteSensor = async (sensorId: string): Promise<void> => {
  try {
    const sensorRef = ref(database, `sensors/${sensorId}`);
    await remove(sensorRef);
  } catch (error) {
    console.error(`Error deleting sensor ${sensorId}:`, error);
    throw error;
  }
};

// Subscribe to real-time updates for all sensors
export const subscribeSensors = (callback: (sensors: SensorInfo[]) => void): (() => void) => {
  console.log("Subscribing to sensors at path:", sensorsRef.toString());

  const unsubscribe = onValue(sensorsRef, (snapshot) => {
    if (snapshot.exists()) {
      console.log("Received data from Firebase:", snapshot.val());

      // Utiliser l'adaptateur pour convertir les données au format attendu
      const sensors = adaptSensorData(snapshot.val());
      console.log("Converted sensors:", sensors);

      callback(sensors);
    } else {
      console.log("No data found in Firebase");
      callback([]);
    }
  }, (error) => {
    console.error("Error subscribing to sensors:", error);
  });

  // Return unsubscribe function
  return unsubscribe;
};

// Subscribe to real-time updates for a single sensor
export const subscribeSensor = (
  sensorId: string,
  callback: (sensor: SensorInfo | null) => void
): (() => void) => {
  // Pour notre structure spécifique, nous devons écouter toutes les données
  // et extraire le capteur spécifique
  const rootRef = ref(database, '/');

  const unsubscribe = onValue(rootRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();

      // Utiliser l'adaptateur pour convertir les données au format attendu
      callback(adaptSingleSensor(sensorId, data));
    } else {
      callback(null);
    }
  });

  // Return unsubscribe function
  return unsubscribe;
};
