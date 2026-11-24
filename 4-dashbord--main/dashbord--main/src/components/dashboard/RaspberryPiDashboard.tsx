import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Alert, Button } from 'react-bootstrap';
import { FaSync } from 'react-icons/fa';
import { ref, onValue, get } from 'firebase/database';
import { database } from '../../firebase/config';

import RealtimeSensorCard from '../widgets/RealtimeSensorCard';
import SensorChart from '../charts/SensorChart';
import { SensorInfo, SensorHistory } from '../../types';
import { useThemeContext } from '../../hooks/ThemeContext';

// Définition des types pour les données de votre Raspberry Pi
interface RaspberryPiData {
  humidity_air: number;
  humidity_soil: number;
  pump_active: boolean;
  temperature: number;
  timestamp: string;
  water_level: number;
  light: number;
}

// Fonction pour créer un capteur à partir des données
const createSensor = (
  id: string,
  name: string,
  value: number,
  unit: string,
  minThreshold: number,
  maxThreshold: number,
  timestamp: string
): SensorInfo => {
  // Générer un historique simulé
  const history: SensorHistory[] = [];
  const now = new Date(timestamp);

  // Générer 24 points d'historique (1 par heure)
  for (let i = 23; i >= 0; i--) {
    const historyTime = new Date(now);
    historyTime.setHours(historyTime.getHours() - i);

    // Générer une valeur aléatoire autour de la valeur actuelle
    const randomFactor = Math.random() * 0.5 - 0.25; // Entre -0.25 et 0.25
    const range = maxThreshold - minThreshold;
    const historyValue = value + (randomFactor * range);

    history.push({
      timestamp: historyTime.toISOString(),
      value: historyValue
    });
  }

  // Remplacer le dernier point par la valeur actuelle
  history[history.length - 1] = {
    timestamp,
    value
  };

  // Vérifier si la valeur est en dehors des seuils
  const isAlert = value < minThreshold || value > maxThreshold;

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
};

const RaspberryPiDashboard: React.FC = () => {
  const { darkMode } = useThemeContext();
  // État pour stocker les données brutes
  const [, setRawData] = useState<any>(null);
  // État pour stocker les données traitées
  const [data, setData] = useState<RaspberryPiData | null>(null);
  // État pour stocker les capteurs
  const [sensors, setSensors] = useState<SensorInfo[]>([]);
  // État pour suivre le chargement
  const [loading, setLoading] = useState<boolean>(true);
  // État pour stocker les erreurs
  const [error, setError] = useState<string | null>(null);
  // État pour suivre la dernière mise à jour
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Function to convert raw data to structured data
  const processRawData = (rawData: any): RaspberryPiData | null => {
    if (!rawData) {
      return null;
    }

    // Create an object with default values
    const data: RaspberryPiData = {
      temperature: 22.0,
      humidity_air: 60.0,
      humidity_soil: 70.0,
      water_level: 50.0,
      pump_active: false,
      timestamp: new Date().toISOString(),
      light: 500.0
    };

    // Check if data is in sensor_data collection
    let dataSource = rawData;
    if (rawData && typeof rawData === 'object' && 'sensor_data' in rawData) {
      // Find the latest entry in sensor_data
      const sensorEntries = Object.values(rawData.sensor_data);
      if (sensorEntries.length > 0) {
        // Sort by timestamp (newest first)
        const sortedEntries = sensorEntries.sort((a: any, b: any) => {
          if (!a.timestamp || !b.timestamp) return 0;
          return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
        });

        // Use the latest entry as data source
        dataSource = sortedEntries[0] as any;
      }
    }

    // Extract values from raw data
    // Temperature
    if ('temperature' in dataSource) {
      data.temperature = typeof dataSource.temperature === 'number'
        ? dataSource.temperature
        : parseFloat(String(dataSource.temperature));
    }

    // Air humidity
    if ('humidity_air' in dataSource) {
      data.humidity_air = typeof dataSource.humidity_air === 'number'
        ? dataSource.humidity_air
        : parseFloat(String(dataSource.humidity_air));
    }

    // Soil humidity
    if ('humidity_soil' in dataSource) {
      data.humidity_soil = typeof dataSource.humidity_soil === 'number'
        ? dataSource.humidity_soil
        : parseFloat(String(dataSource.humidity_soil));
    }

    // Water level
    if ('water_level' in dataSource) {
      data.water_level = typeof dataSource.water_level === 'number'
        ? dataSource.water_level
        : parseFloat(String(dataSource.water_level));
    }

    // Pump active
    if ('pump_active' in dataSource) {
      data.pump_active = Boolean(dataSource.pump_active);
    }

    // Timestamp
    if ('timestamp' in dataSource) {
      data.timestamp = String(dataSource.timestamp);
    }

    // Light
    if ('light' in dataSource) {
      data.light = typeof dataSource.light === 'number'
        ? dataSource.light
        : parseFloat(String(dataSource.light));
    }

    return data;
  };

  // Fonction pour convertir les données en capteurs
  const createSensorsFromData = (data: RaspberryPiData): SensorInfo[] => {
    const sensors: SensorInfo[] = [];

    // Capteur de température
    sensors.push(createSensor(
      'temp-1',
      'Température',
      data.temperature,
      '°C',
      18,
      28,
      data.timestamp
    ));

    // Capteur d'humidité de l'air
    sensors.push(createSensor(
      'hum-air-1',
      'Humidité de l\'air',
      data.humidity_air,
      '%',
      40,
      80,
      data.timestamp
    ));

    // Capteur d'humidité du sol
    sensors.push(createSensor(
      'hum-soil-1',
      'Humidité du sol',
      data.humidity_soil,
      '%',
      60,
      80,
      data.timestamp
    ));

    // Capteur de niveau d'eau
    sensors.push(createSensor(
      'water-1',
      'Niveau d\'eau',
      data.water_level,
      '%',
      20,
      100,
      data.timestamp
    ));

    // Capteur de luminosité
    sensors.push(createSensor(
      'light-1',
      'Luminosité',
      data.light,
      'lux',
      200,
      1000,
      data.timestamp
    ));

    // Capteur d'état de la pompe (valeur binaire convertie en numérique pour l'affichage)
    sensors.push(createSensor(
      'pump-1',
      'État de la pompe',
      data.pump_active ? 1 : 0,
      '',
      0,
      1,
      data.timestamp
    ));

    return sensors;
  };

  // Memoize the sensor creation to avoid unnecessary recalculations
  const createSensorsFromDataMemoized = React.useCallback((data: RaspberryPiData): SensorInfo[] => {
    return createSensorsFromData(data);
  }, []);

  // Function to update data from a Firebase snapshot with optimized processing
  const updateDataFromSnapshot = (snapshot: any) => {
    if (!snapshot.exists()) {
      if (!error) {
        setError('No data found in Firebase.');
      }
      setLoading(false);
      return;
    }

    try {
      const newRawData = snapshot.val();

      // Process data - only update state if data has actually changed
      const processedData = processRawData(newRawData);

      if (!processedData) {
        setLoading(false);
        return;
      }

      // Use a single batch update for all state changes
      const batchUpdate = () => {
        setRawData(newRawData);
        setData(processedData);
        setSensors(createSensorsFromDataMemoized(processedData));
        setLastUpdate(new Date());
        setError(null);
        setLoading(false);
      };

      // Use requestAnimationFrame to batch updates with the browser's render cycle
      // This helps prevent multiple re-renders
      requestAnimationFrame(batchUpdate);
    } catch (err) {
      console.error('Error processing data:', err);
      setError('Error processing data from Firebase.');
      setLoading(false);
    }
  };

  // Use a ref to track the last update time to prevent too frequent updates
  const lastUpdateTimeRef = React.useRef<number>(0);
  const MIN_UPDATE_INTERVAL = 500; // Minimum time between updates in milliseconds

  // Effect to subscribe to real-time updates
  useEffect(() => {
    console.log('Initializing Firebase real-time connection');
    setLoading(true);

    // Try to connect to dual chamber structure first, then fallback to root
    const chamberRef = ref(database, '/chambre');

    const unsubscribe = onValue(
      chamberRef,
      (snapshot) => {
        const chamberData = snapshot.val();

        if (chamberData && (chamberData.ch1 || chamberData.ch2)) {
          // We have dual chamber data, use the first available chamber
          const firstChamber = chamberData.ch1?.sensors || chamberData.ch2?.sensors;
          if (firstChamber) {
            console.log('Using dual chamber data from Firebase');
            updateDataFromSnapshot({ val: () => firstChamber });
            return;
          }
        }

        // Fallback to root level data
        const rootRef = ref(database, '/');
        const rootUnsubscribe = onValue(
          rootRef,
          (rootSnapshot) => {
            const now = Date.now();
            if (now - lastUpdateTimeRef.current < MIN_UPDATE_INTERVAL) {
              return;
            }
            lastUpdateTimeRef.current = now;
            updateDataFromSnapshot(rootSnapshot);
          },
          (error) => {
            console.error('Error getting real-time data:', error);
            setError(`Error: ${error.message}`);
            setLoading(false);
          }
        );

        return rootUnsubscribe;
      },
      (error) => {
        console.error('Error getting chamber data:', error);
        // Fallback to root level
        const rootRef = ref(database, '/');
        const rootUnsubscribe = onValue(
          rootRef,
          (rootSnapshot) => {
            const now = Date.now();
            if (now - lastUpdateTimeRef.current < MIN_UPDATE_INTERVAL) {
              return;
            }
            lastUpdateTimeRef.current = now;
            updateDataFromSnapshot(rootSnapshot);
          },
          (error) => {
            console.error('Error getting real-time data:', error);
            setError(`Error: ${error.message}`);
            setLoading(false);
          }
        );

        return rootUnsubscribe;
      }
    );

    // Clean up subscription when component unmounts
    return () => {
      unsubscribe();
    };
  }, []);

  // Fonction pour rafraîchir manuellement les données
  const refreshData = async () => {
    // Si déjà en cours de chargement, ne pas rafraîchir à nouveau
    if (loading) return;

    console.log("Rafraîchissement manuel des données");
    setLoading(true);

    try {
      const dataRef = ref(database, '/');
      const snapshot = await get(dataRef);

      // Utiliser la même fonction que pour les mises à jour automatiques
      updateDataFromSnapshot(snapshot);
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données:', error);
      setError(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Tableau de bord Raspberry Pi</h1>
        <div>
          <small className="me-3 text-muted">
            Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
          </small>
          <Button
            variant={darkMode ? 'outline-light' : 'outline-primary'}
            size="sm"
            onClick={refreshData}
            disabled={loading}
            className="d-flex align-items-center"
          >
            <span className={`me-2 ${loading ? 'fa-spin' : ''}`}>
              <FaSync size={16} />
            </span>
            {loading ? 'Mise à jour...' : 'Actualiser'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {loading && sensors.length === 0 ? (
        <div className="text-center my-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3">Chargement des données...</p>
        </div>
      ) : (
        <>
          {data && (
            <Row className="mb-4">
              <Col md={6} className="mb-4 mb-md-0">
                <Card
                  bg={darkMode ? 'dark' : 'light'}
                  text={darkMode ? 'light' : 'dark'}
                  className="shadow-sm"
                >
                  <Card.Header>
                    <h5 className="mb-0">État du système</h5>
                  </Card.Header>
                  <Card.Body>
                    <Row>
                      <Col xs={6}>
                        <div className="mb-3">
                          <h6>Pompe</h6>
                          <h4>
                            <span className={`badge bg-${data.pump_active ? 'success' : 'secondary'}`}>
                              {data.pump_active ? 'Active' : 'Inactive'}
                            </span>
                          </h4>
                        </div>
                      </Col>
                      <Col xs={6}>
                        <div className="mb-3">
                          <h6>Dernière mise à jour</h6>
                          <p>{new Date(data.timestamp).toLocaleString()}</p>
                        </div>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={6}>
                <Card
                  bg={darkMode ? 'dark' : 'light'}
                  text={darkMode ? 'light' : 'dark'}
                  className="shadow-sm"
                >
                  <Card.Header>
                    <h5 className="mb-0">Alertes</h5>
                  </Card.Header>
                  <Card.Body>
                    {sensors.filter(s => s.isAlert).length === 0 ? (
                      <p className="text-success">Aucune alerte active</p>
                    ) : (
                      <ul className="list-unstyled">
                        {sensors.filter(s => s.isAlert).map(sensor => (
                          <li key={sensor.id} className="mb-2">
                            <span className="badge bg-danger me-2">Alerte</span>
                            <strong>{sensor.name}:</strong> {sensor.currentValue.toFixed(1)} {sensor.unit}
                            {sensor.currentValue < sensor.minThreshold && ` (inférieur au seuil min: ${sensor.minThreshold})`}
                            {sensor.currentValue > sensor.maxThreshold && ` (supérieur au seuil max: ${sensor.maxThreshold})`}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          {sensors.length > 0 && (
            <>
              <h2 className="mb-3">Capteurs</h2>
              <Row className="mb-4 g-3">
                <Col lg={3} md={6} sm={12}>
                  <RealtimeSensorCard
                    sensorType="temperature"
                    title="Température"
                    description="Capteur de température"
                    unit="°C"
                    minThreshold={18}
                    maxThreshold={28}
                  />
                </Col>
                <Col lg={3} md={6} sm={12}>
                  <RealtimeSensorCard
                    sensorType="humidity_air"
                    title="Humidité de l'air"
                    description="Capteur d'humidité de l'air"
                    unit="%"
                    minThreshold={40}
                    maxThreshold={80}
                  />
                </Col>
                <Col lg={3} md={6} sm={12}>
                  <RealtimeSensorCard
                    sensorType="humidity_soil"
                    title="Humidité du sol"
                    description="Capteur d'humidité du sol"
                    unit="%"
                    minThreshold={60}
                    maxThreshold={80}
                  />
                </Col>
                <Col lg={3} md={6} sm={12}>
                  <RealtimeSensorCard
                    sensorType="water_level"
                    title="Niveau d'eau"
                    description="Capteur de niveau d'eau"
                    unit="%"
                    minThreshold={20}
                    maxThreshold={100}
                  />
                </Col>
                <Col lg={3} md={6} sm={12}>
                  <RealtimeSensorCard
                    sensorType="light"
                    title="Luminosité"
                    description="Capteur de luminosité"
                    unit="lux"
                    minThreshold={200}
                    maxThreshold={1000}
                  />
                </Col>
                <Col lg={3} md={6} sm={12}>
                  <RealtimeSensorCard
                    sensorType="pump_active"
                    title="État de la pompe"
                    description="Capteur de l'état de la pompe"
                    unit=""
                    minThreshold={0}
                    maxThreshold={1}
                  />
                </Col>
              </Row>

              <h2 className="mb-3">Graphiques</h2>
              <Row className="g-3">
                {sensors.map(sensor => (
                  <Col key={`chart-${sensor.id}`} lg={6} md={12} className="mb-4">
                    <SensorChart sensor={sensor} />
                  </Col>
                ))}
              </Row>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default RaspberryPiDashboard;
