export interface SensorData {
  id: string;
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  min: number;
  max: number;
  isAlert: boolean;
}

export interface SensorHistory {
  timestamp: string;
  value: number;
}

export interface SensorInfo {
  id: string;
  name: string;
  description: string;
  unit: string;
  minThreshold: number;
  maxThreshold: number;
  currentValue: number;
  history: SensorHistory[];
  isAlert: boolean;
}

export type SensorType = 'temperature' | 'humidity' | 'light' | 'soilMoisture' | 'waterLevel';

// Types pour le système dual chamber
export interface ChamberData {
  temperature: number;
  humidity_air: number;
  humidity_soil: number;
  water_level: number;
  pump_active: boolean;
  light: number;
  timestamp: string;
}

export interface ChamberSensorInfo extends SensorInfo {
  chamberId: 'ch1' | 'ch2';
  chamberName: string;
}

export interface DualChamberState {
  ch1: {
    data: ChamberData | null;
    sensors: ChamberSensorInfo[];
    loading: boolean;
    error: string | null;
  };
  ch2: {
    data: ChamberData | null;
    sensors: ChamberSensorInfo[];
    loading: boolean;
    error: string | null;
  };
  lastUpdate: Date;
}

export type ChamberAction =
  | { type: 'SET_CHAMBER_DATA'; payload: { chamberId: 'ch1' | 'ch2'; data: ChamberData } }
  | { type: 'SET_CHAMBER_SENSORS'; payload: { chamberId: 'ch1' | 'ch2'; sensors: ChamberSensorInfo[] } }
  | { type: 'SET_CHAMBER_LOADING'; payload: { chamberId: 'ch1' | 'ch2'; loading: boolean } }
  | { type: 'SET_CHAMBER_ERROR'; payload: { chamberId: 'ch1' | 'ch2'; error: string | null } }
  | { type: 'SET_LAST_UPDATE'; payload: Date };

export interface ThemeContextType {
  darkMode: boolean;
  toggleDarkMode: () => void;
}
