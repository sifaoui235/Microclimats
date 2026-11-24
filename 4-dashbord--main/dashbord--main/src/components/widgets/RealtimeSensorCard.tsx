import React, { useState, useEffect } from 'react';
import { Card, Badge } from 'react-bootstrap';
import {
  FaThermometerHalf,
  FaTint,
  FaSun,
  FaWater,
  FaPowerOff
} from 'react-icons/fa';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebase/config';
import { useThemeContext } from '../../hooks/ThemeContext';
import { IconBaseProps } from 'react-icons';

const ThermometerIcon = (props: IconBaseProps) => <FaThermometerHalf {...props} />;
const TintIcon = (props: IconBaseProps) => <FaTint {...props} />;
const SunIcon = (props: IconBaseProps) => <FaSun {...props} />;
const WaterIcon = (props: IconBaseProps) => <FaWater {...props} />;
const PumpIcon = (props: IconBaseProps) => <FaPowerOff {...props} />;

interface RealtimeSensorCardProps {
  sensorType: 'temperature' | 'humidity_air' | 'humidity_soil' | 'water_level' | 'light' | 'pump_active';
  title: string;
  description: string;
  unit: string;
  minThreshold: number;
  maxThreshold: number;
}

const RealtimeSensorCard: React.FC<RealtimeSensorCardProps> = ({
  sensorType,
  title,
  description,
  unit,
  minThreshold,
  maxThreshold
}) => {
  const { darkMode } = useThemeContext();
  const [value, setValue] = useState<number>(0);
  const [isAlert, setIsAlert] = useState<boolean>(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // State to track if we've received data
  const [dataReceived, setDataReceived] = useState<boolean>(false);

  // Function to extract and process value from data
  const extractValue = (data: any, path: string): number | null => {
    if (!data || typeof data !== 'object') return null;

    let rawValue = data[path];
    if (rawValue === undefined) return null;

    // Process value based on sensor type
    if (path === 'pump_active') {
      // Convert boolean values to 0/1
      if (typeof rawValue === 'boolean') {
        return rawValue ? 1 : 0;
      } else if (typeof rawValue === 'string') {
        return rawValue.toLowerCase() === 'true' ? 1 : 0;
      } else {
        return rawValue ? 1 : 0;
      }
    } else {
      // For other sensors, convert to number
      const numValue = typeof rawValue === 'number' ? rawValue : parseFloat(String(rawValue));
      return !isNaN(numValue) ? numValue : null;
    }
  };

  // Use a more specific reference to reduce data transfer
  useEffect(() => {
    // Reference directly to the specific sensor data path
    const dataRef = ref(database, '/');

    // Subscribe to real-time updates with optimized callback
    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (!snapshot.exists()) return;

      const data = snapshot.val();
      let newValue: number | null = null;

      // First try to get value directly from root
      newValue = extractValue(data, sensorType);

      // If not found and sensor_data exists, try to get from latest entry
      if (newValue === null && data.sensor_data) {
        // Get all entries
        const entries = Object.values(data.sensor_data);
        if (entries.length > 0) {
          // Find the latest entry (avoid sorting if possible)
          let latestEntry = entries[0] as any;
          let latestTime = latestEntry.timestamp ? new Date(latestEntry.timestamp).getTime() : 0;

          for (let i = 1; i < entries.length; i++) {
            const entry = entries[i] as any;
            const time = entry.timestamp ? new Date(entry.timestamp).getTime() : 0;
            if (time > latestTime) {
              latestTime = time;
              latestEntry = entry;
            }
          }

          // Extract value from latest entry
          newValue = extractValue(latestEntry, sensorType);
        }
      }

      // Update state only if we have a valid value and it's different from current
      if (newValue !== null && (Math.abs(newValue - value) > 0.01 || !dataReceived)) {
        setValue(newValue);
        setIsAlert(newValue < minThreshold || newValue > maxThreshold);
        setLastUpdate(new Date());
        setDataReceived(true);
      }
    }, {
      // Use these options to optimize performance
      onlyOnce: false
    });

    // Clean up subscription when component unmounts
    return () => {
      unsubscribe();
    };
  }, [sensorType, minThreshold, maxThreshold]);

  const getSensorIcon = () => {
    switch (sensorType) {
      case 'temperature':
        return <ThermometerIcon size={24} />;
      case 'humidity_air':
      case 'humidity_soil':
        return <TintIcon size={24} />;
      case 'light':
        return <SunIcon size={24} />;
      case 'water_level':
        return <WaterIcon size={24} />;
      case 'pump_active':
        return <PumpIcon size={24} />;
      default:
        return <ThermometerIcon size={24} />;
    }
  };

  const getStatusColor = () => {
    if (isAlert) return 'danger';
    return 'success';
  };

  return (
    <Card
      className={`h-100 shadow-sm ${isAlert ? 'border-danger' : ''}`}
      bg={darkMode ? 'dark' : 'light'}
      text={darkMode ? 'light' : 'dark'}
    >
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div className="d-flex align-items-center">
          <div className={`me-2 text-${getStatusColor()}`}>
            {getSensorIcon()}
          </div>
          <span>{title}</span>
        </div>
        <div>
          {/* Data received indicator */}
          {dataReceived ? (
            <span className="badge bg-success me-2" style={{ width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block' }}></span>
          ) : (
            <span className="badge bg-secondary me-2" style={{ width: '10px', height: '10px', borderRadius: '50%', display: 'inline-block' }}></span>
          )}

          {/* Alert badge */}
          {isAlert && (
            <Badge bg="danger" pill>
              Alerte
            </Badge>
          )}
        </div>
      </Card.Header>
      <Card.Body className="text-center">
        <h2 className={`display-4 ${isAlert ? 'text-danger' : ''}`}>
          {value.toFixed(1)}
          <small className="fs-6 ms-1">{unit}</small>
        </h2>
        <Card.Text>
          <small className="text-muted">
            Min: {minThreshold} {unit} | Max: {maxThreshold} {unit}
          </small>
        </Card.Text>
        <Card.Text>{description}</Card.Text>
        <small className="text-muted d-block mt-2">
          Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
        </small>
      </Card.Body>
    </Card>
  );
};

export default RealtimeSensorCard;
