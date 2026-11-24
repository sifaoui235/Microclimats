import React, { createContext, useContext, useState, useEffect } from 'react';
import { SensorInfo } from '../types';
import { subscribeSensors, getAllSensors, saveSensor, updateSensorValue, deleteSensor } from './services';
import { seedDatabase } from './seedDatabase';

interface FirebaseContextType {
  sensors: SensorInfo[];
  loading: boolean;
  error: string | null;
  refreshSensors: () => Promise<void>;
  saveSensor: (sensor: SensorInfo) => Promise<void>;
  updateSensorValue: (sensorId: string, newValue: number) => Promise<void>;
  deleteSensor: (sensorId: string) => Promise<void>;
  seedDatabase: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sensors, setSensors] = useState<SensorInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to refresh sensors data
  const refreshSensors = async () => {
    try {
      setLoading(true);
      const data = await getAllSensors();
      setSensors(data);
      setError(null);
    } catch (err) {
      setError('Failed to fetch sensors data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Subscribe to real-time updates when the component mounts
  useEffect(() => {
    const unsubscribe = subscribeSensors((data) => {
      setSensors(data);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Wrapper functions for Firebase services
  const handleSaveSensor = async (sensor: SensorInfo) => {
    await saveSensor(sensor);
  };

  const handleUpdateSensorValue = async (sensorId: string, newValue: number) => {
    await updateSensorValue(sensorId, newValue);
  };

  const handleDeleteSensor = async (sensorId: string) => {
    await deleteSensor(sensorId);
  };

  const handleSeedDatabase = async () => {
    await seedDatabase();
  };

  const value = {
    sensors,
    loading,
    error,
    refreshSensors,
    saveSensor: handleSaveSensor,
    updateSensorValue: handleUpdateSensorValue,
    deleteSensor: handleDeleteSensor,
    seedDatabase: handleSeedDatabase,
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

// Custom hook to use the Firebase context
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
