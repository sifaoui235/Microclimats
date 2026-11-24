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

// Composant qui affiche directement les valeurs des capteurs à partir des données brutes
const DirectSensorDisplay: React.FC = () => {
  const { darkMode } = useThemeContext();
  // État pour stocker les données brutes
  const [rawData, setRawData] = useState<any>(null);
  // État pour suivre la dernière mise à jour
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Effet pour s'abonner aux mises à jour en temps réel
  useEffect(() => {
    console.log('Initialisation de la connexion Firebase pour DirectSensorDisplay');

    // Référence à la racine de la base de données
    const dataRef = ref(database, '/');

    // S'abonner aux mises à jour en temps réel
    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('DirectSensorDisplay - Nouvelles données reçues:', data);

        // Priorité 1: Vérifier si les données sont dans sensor_data
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

            // Mettre à jour les données brutes avec la dernière entrée
            setRawData({
              ...latestEntry,  // Utiliser les données de la dernière entrée comme base
              sensor_data: data.sensor_data  // Conserver l'historique complet
            });
            setLastUpdate(new Date(latestEntry.timestamp || new Date()));
            return;
          }
        }

        // Priorité 2: Fallback - vérifier si les données essentielles sont directement à la racine
        const requiredKeys = ['temperature', 'humidity_air', 'humidity_soil', 'water_level', 'pump_active'];
        const hasRootData = requiredKeys.some(key => key in data);

        if (hasRootData) {
          console.log('Données trouvées directement à la racine');
          setRawData(data);
          setLastUpdate(new Date());
          return;
        }

        // Si aucune structure reconnue, utiliser les données brutes
        console.log('Aucune structure de données reconnue, utilisation des données brutes');
        setRawData(data);
        setLastUpdate(new Date());
      } else {
        console.warn('DirectSensorDisplay - Aucune donnée trouvée dans Firebase');
      }
    }, (error) => {
      console.error('DirectSensorDisplay - Erreur Firebase:', error);
    });

    // Nettoyer l'abonnement lors du démontage du composant
    return () => {
      console.log('Nettoyage de la connexion Firebase pour DirectSensorDisplay');
      unsubscribe();
    };
  }, []);

  // Fonction pour extraire une valeur des données brutes
  const extractValue = (key: string): number => {
    if (!rawData) return 0;

    // Vérifier si la clé existe directement dans les données brutes
    if (key in rawData) {
      const value = rawData[key];
      if (typeof value === 'number') return value;
      if (typeof value === 'string' && !isNaN(parseFloat(value))) return parseFloat(value);
    }

    // Vérifier si les données sont dans un sous-nœud
    const keys = Object.keys(rawData);
    for (const dataKey of keys) {
      const subData = rawData[dataKey];
      if (typeof subData === 'object' && subData !== null && key in subData) {
        const value = subData[key];
        if (typeof value === 'number') return value;
        if (typeof value === 'string' && !isNaN(parseFloat(value))) return parseFloat(value);
      }
    }

    return 0;
  };

  // Fonction pour extraire une valeur booléenne des données brutes
  const extractBooleanValue = (key: string): boolean => {
    if (!rawData) return false;

    // Vérifier si la clé existe directement dans les données brutes
    if (key in rawData) {
      return Boolean(rawData[key]);
    }

    // Vérifier si les données sont dans un sous-nœud
    const keys = Object.keys(rawData);
    for (const dataKey of keys) {
      const subData = rawData[dataKey];
      if (typeof subData === 'object' && subData !== null && key in subData) {
        return Boolean(subData[key]);
      }
    }

    return false;
  };

  // Fonction pour formater une valeur
  const formatValue = (value: number): string => {
    return value.toFixed(1);
  };

  // Extraire les valeurs des capteurs
  const temperature = extractValue('temperature');
  const humidityAir = extractValue('humidity_air');
  const humiditySoil = extractValue('humidity_soil');
  const waterLevel = extractValue('water_level');
  const pumpActive = extractBooleanValue('pump_active');

  return (
    <div className="mb-4">
      <h2 className="mb-3">Capteurs</h2>
      <p className="text-muted small">Dernière mise à jour: {lastUpdate.toLocaleTimeString()}</p>

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
                {formatValue(temperature)}
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
                {formatValue(humidityAir)}
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
                {formatValue(humiditySoil)}
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
                {formatValue(waterLevel)}
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

      {/* État de la pompe */}
      <Card className="mt-4">
        <Card.Header>
          <h5 className="mb-0">État du système</h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col xs={6}>
              <div className="mb-3">
                <h6>Pompe</h6>
                <h4>
                  <span className={`badge bg-${pumpActive ? 'success' : 'secondary'}`}>
                    {pumpActive ? 'Active' : 'Inactive'}
                  </span>
                </h4>
              </div>
            </Col>
            <Col xs={6}>
              <div className="mb-3">
                <h6>Dernière mise à jour</h6>
                <p>{lastUpdate.toLocaleString()}</p>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
};

export default DirectSensorDisplay;
