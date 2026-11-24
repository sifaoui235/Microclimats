import { ref, set } from 'firebase/database';
import { database } from './config';
import { sensorData } from '../data/mockData';

// Function to seed the database with initial mock data
export const seedDatabase = async (): Promise<void> => {
  try {
    const sensorsRef = ref(database, 'sensors');
    
    // Create an object with sensor IDs as keys
    const sensorsObject = sensorData.reduce((acc, sensor) => {
      acc[sensor.id] = sensor;
      return acc;
    }, {} as Record<string, any>);
    
    // Set the data in Firebase
    await set(sensorsRef, sensorsObject);
    console.log('Database seeded successfully with mock data');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  }
};

// Export a function to seed a single sensor if needed
export const seedSensor = async (sensorId: string): Promise<void> => {
  try {
    const sensor = sensorData.find(s => s.id === sensorId);
    if (!sensor) {
      throw new Error(`Sensor with ID ${sensorId} not found in mock data`);
    }
    
    const sensorRef = ref(database, `sensors/${sensorId}`);
    await set(sensorRef, sensor);
    console.log(`Sensor ${sensorId} seeded successfully`);
  } catch (error) {
    console.error(`Error seeding sensor ${sensorId}:`, error);
    throw error;
  }
};
