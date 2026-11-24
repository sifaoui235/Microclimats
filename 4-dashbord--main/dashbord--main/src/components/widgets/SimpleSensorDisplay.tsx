import React, { useState, useEffect } from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import { database } from '../../firebase/config';
import { ref, onValue } from 'firebase/database';
import {
  FaThermometerHalf,
  FaTint,
  FaWater
} from 'react-icons/fa';
import { useThemeContext } from '../../hooks/ThemeContext';

// Composant très simple pour afficher les valeurs des capteurs
const SimpleSensorDisplay: React.FC = () => {
  const { darkMode } = useThemeContext();
  const [sensorData, setSensorData] = useState<any>({
    temperature: 0,
    humidity_air: 0,
    humidity_soil: 0,
    water_level: 0,
    pump_active: false,
    timestamp: new Date().toISOString()
  });
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // État pour stocker les données brutes complètes
  const [rawData, setRawData] = useState<any>(null);

  // Effet pour s'abonner aux mises à jour en temps réel
  useEffect(() => {
    console.log('Initialisation de la connexion Firebase pour SimpleSensorDisplay');

    // Référence à la racine de la base de données
    const dataRef = ref(database, '/');

    // S'abonner aux mises à jour en temps réel
    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('SimpleSensorDisplay - Nouvelles données reçues:', data);

        // Stocker les données brutes complètes
        setRawData(data);

        // Essayer de trouver les données des capteurs
        try {
          // Créer un objet pour les nouvelles données
          const newSensorData = { ...sensorData };

          // Vérifier si les données sont dans sensor_data
          if (data && typeof data === 'object' && 'sensor_data' in data) {
            console.log('Données trouvées dans sensor_data');

            // Trouver la dernière entrée dans sensor_data
            const sensorEntries = Object.values(data.sensor_data);
            if (sensorEntries.length > 0) {
              // Trier par timestamp (du plus récent au plus ancien)
              const sortedEntries = sensorEntries.sort((a: any, b: any) => {
                if (!a.timestamp || !b.timestamp) return 0;
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
              });

              // Prendre la première entrée (la plus récente)
              const latestEntry = sortedEntries[0] as any;
              console.log('Entrée la plus récente:', latestEntry);

              // Extraire les valeurs de la dernière entrée
              if ('temperature' in latestEntry) {
                newSensorData.temperature = latestEntry.temperature;
              }
              if ('humidity_air' in latestEntry) {
                newSensorData.humidity_air = latestEntry.humidity_air;
              }
              if ('humidity_soil' in latestEntry) {
                newSensorData.humidity_soil = latestEntry.humidity_soil;
              }
              if ('water_level' in latestEntry) {
                newSensorData.water_level = latestEntry.water_level;
              }
              if ('pump_active' in latestEntry) {
                newSensorData.pump_active = latestEntry.pump_active;
              }
              if ('timestamp' in latestEntry) {
                newSensorData.timestamp = latestEntry.timestamp;
              }
            }
          } else {
            // Vérifier si les données sont directement à la racine
            if (data && typeof data === 'object') {
              // Essayer de récupérer les valeurs directement
              if ('temperature' in data) {
                newSensorData.temperature = data.temperature;
              }
              if ('humidity_air' in data) {
                newSensorData.humidity_air = data.humidity_air;
              }
              if ('humidity_soil' in data) {
                newSensorData.humidity_soil = data.humidity_soil;
              }
              if ('water_level' in data) {
                newSensorData.water_level = data.water_level;
              }
              if ('pump_active' in data) {
                newSensorData.pump_active = data.pump_active;
              }
              if ('timestamp' in data) {
                newSensorData.timestamp = data.timestamp;
              }

              // Vérifier si les données sont dans un sous-nœud
              const keys = Object.keys(data);
              if (keys.length === 1 && typeof data[keys[0]] === 'object') {
                const subData = data[keys[0]];

                if ('temperature' in subData) {
                  newSensorData.temperature = subData.temperature;
                }
                if ('humidity_air' in subData) {
                  newSensorData.humidity_air = subData.humidity_air;
                }
                if ('humidity_soil' in subData) {
                  newSensorData.humidity_soil = subData.humidity_soil;
                }
                if ('water_level' in subData) {
                  newSensorData.water_level = subData.water_level;
                }
                if ('pump_active' in subData) {
                  newSensorData.pump_active = subData.pump_active;
                }
                if ('timestamp' in subData) {
                  newSensorData.timestamp = subData.timestamp;
                }
              }
            }
          }

          // Mettre à jour les données des capteurs
          setSensorData(newSensorData);
        } catch (error) {
          console.error('Erreur lors du traitement des données:', error);
        }

        setLastUpdate(new Date());
      }
    });

    // Nettoyer l'abonnement lors du démontage du composant
    return () => {
      console.log('Nettoyage de la connexion Firebase pour SimpleSensorDisplay');
      unsubscribe();
    };
  }, []);

  // Fonction pour formater une valeur
  const formatValue = (value: any): string => {
    if (value === undefined || value === null) return '0';
    if (typeof value === 'number') return value.toFixed(1);
    if (typeof value === 'string' && !isNaN(parseFloat(value))) return parseFloat(value).toFixed(1);
    return String(value);
  };

  return (
    <div className="mb-4">
      <h2 className="mb-3">Capteurs</h2>
      <p className="text-muted small">Dernière mise à jour: {lastUpdate.toLocaleTimeString()}</p>

      {/* Affichage des données brutes pour le débogage */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Données brutes de Firebase</h5>
        </Card.Header>
        <Card.Body>
          <pre className="bg-light p-3 rounded" style={{ maxHeight: '200px', overflow: 'auto' }}>
            {JSON.stringify(rawData, null, 2)}
          </pre>
        </Card.Body>
      </Card>

      <Row className="g-3">
        {/* Température */}
        <Col lg={3} md={6} sm={12}>
          <Card
            className="h-100 shadow-sm"
            bg={darkMode ? 'dark' : 'light'}
            text={darkMode ? 'light' : 'dark'}
          >
            <Card.Header className="d-flex align-items-center">
              <div className="me-2 text-primary">
                <FaThermometerHalf size={24} />
              </div>
              <span>Température</span>
            </Card.Header>
            <Card.Body className="text-center">
              <h2 className="display-4">
                {formatValue(sensorData.temperature)}
                <small className="fs-6 ms-1">°C</small>
              </h2>
              <Card.Text>
                <small className="text-muted">
                  Min: 18 °C | Max: 28 °C
                </small>
              </Card.Text>
              <Card.Text>Capteur de température</Card.Text>
            </Card.Body>
          </Card>
        </Col>

        {/* Humidité de l'air */}
        <Col lg={3} md={6} sm={12}>
          <Card
            className="h-100 shadow-sm"
            bg={darkMode ? 'dark' : 'light'}
            text={darkMode ? 'light' : 'dark'}
          >
            <Card.Header className="d-flex align-items-center">
              <div className="me-2 text-primary">
                <FaTint size={24} />
              </div>
              <span>Humidité de l'air</span>
            </Card.Header>
            <Card.Body className="text-center">
              <h2 className="display-4">
                {formatValue(sensorData.humidity_air)}
                <small className="fs-6 ms-1">%</small>
              </h2>
              <Card.Text>
                <small className="text-muted">
                  Min: 40 % | Max: 80 %
                </small>
              </Card.Text>
              <Card.Text>Capteur d'humidité de l'air</Card.Text>
            </Card.Body>
          </Card>
        </Col>

        {/* Humidité du sol */}
        <Col lg={3} md={6} sm={12}>
          <Card
            className="h-100 shadow-sm"
            bg={darkMode ? 'dark' : 'light'}
            text={darkMode ? 'light' : 'dark'}
          >
            <Card.Header className="d-flex align-items-center">
              <div className="me-2 text-primary">
                <FaTint size={24} />
              </div>
              <span>Humidité du sol</span>
            </Card.Header>
            <Card.Body className="text-center">
              <h2 className="display-4">
                {formatValue(sensorData.humidity_soil)}
                <small className="fs-6 ms-1">%</small>
              </h2>
              <Card.Text>
                <small className="text-muted">
                  Min: 60 % | Max: 80 %
                </small>
              </Card.Text>
              <Card.Text>Capteur d'humidité du sol</Card.Text>
            </Card.Body>
          </Card>
        </Col>

        {/* Niveau d'eau */}
        <Col lg={3} md={6} sm={12}>
          <Card
            className="h-100 shadow-sm"
            bg={darkMode ? 'dark' : 'light'}
            text={darkMode ? 'light' : 'dark'}
          >
            <Card.Header className="d-flex align-items-center">
              <div className="me-2 text-primary">
                <FaWater size={24} />
              </div>
              <span>Niveau d'eau</span>
            </Card.Header>
            <Card.Body className="text-center">
              <h2 className="display-4">
                {formatValue(sensorData.water_level)}
                <small className="fs-6 ms-1">%</small>
              </h2>
              <Card.Text>
                <small className="text-muted">
                  Min: 20 % | Max: 100 %
                </small>
              </Card.Text>
              <Card.Text>Capteur de niveau d'eau</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default SimpleSensorDisplay;
