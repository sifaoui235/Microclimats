import React, { useReducer, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge } from 'react-bootstrap';
import { FaSync, FaExclamationTriangle, FaCheckCircle, FaThermometerHalf, FaTint, FaWater, FaSun, FaPowerOff } from 'react-icons/fa';
import { useThemeContext } from '../../hooks/ThemeContext';
import { subscribeToAllChambers, convertToChamberSensors, testChamberConnectivity } from '../../services/DualFirebaseLoader.service';
import ChamberGraphs from '../charts/ChamberGraphs.component';
import { PumpStateIndicator, PumpStatsDisplay } from '../../utils/PumpStateIndicator.util';
import { DualChamberState, ChamberAction } from '../../types';

// Reducer pour gérer l'état des deux chambres
const chamberReducer = (state: DualChamberState, action: ChamberAction): DualChamberState => {
  switch (action.type) {
    case 'SET_CHAMBER_DATA':
      const { chamberId, data } = action.payload;
      const sensors = convertToChamberSensors(
        data,
        chamberId,
        chamberId === 'ch1' ? 'Chambre 1' : 'Chambre 2'
      );

      return {
        ...state,
        [chamberId]: {
          ...state[chamberId],
          data,
          sensors,
          loading: false,
          error: null
        },
        lastUpdate: new Date()
      };

    case 'SET_CHAMBER_LOADING':
      return {
        ...state,
        [action.payload.chamberId]: {
          ...state[action.payload.chamberId],
          loading: action.payload.loading
        }
      };

    case 'SET_CHAMBER_ERROR':
      return {
        ...state,
        [action.payload.chamberId]: {
          ...state[action.payload.chamberId],
          error: action.payload.error,
          loading: false
        }
      };

    case 'SET_LAST_UPDATE':
      return {
        ...state,
        lastUpdate: action.payload
      };

    default:
      return state;
  }
};

// État initial
const initialState: DualChamberState = {
  ch1: {
    data: null,
    sensors: [],
    loading: true,
    error: null
  },
  ch2: {
    data: null,
    sensors: [],
    loading: true,
    error: null
  },
  lastUpdate: new Date()
};

/**
 * Dashboard principal avec support dual chamber
 */
const DualChamberDashboard: React.FC = () => {
  const { darkMode } = useThemeContext();
  const [state, dispatch] = useReducer(chamberReducer, initialState);

  // Callbacks pour les mises à jour des chambres (sans useCallback pour éviter les re-renders)
  const handleCh1Update = (data: any, error?: any) => {
    if (error) {
      dispatch({
        type: 'SET_CHAMBER_ERROR',
        payload: { chamberId: 'ch1', error: error.message }
      });
    } else if (data) {
      dispatch({
        type: 'SET_CHAMBER_DATA',
        payload: { chamberId: 'ch1', data }
      });
    }
  };

  const handleCh2Update = (data: any, error?: any) => {
    if (error) {
      dispatch({
        type: 'SET_CHAMBER_ERROR',
        payload: { chamberId: 'ch2', error: error.message }
      });
    } else if (data) {
      dispatch({
        type: 'SET_CHAMBER_DATA',
        payload: { chamberId: 'ch2', data }
      });
    }
  };

  // Effet pour s'abonner aux mises à jour en temps réel
  useEffect(() => {
    console.log('Initialisation du dashboard dual chamber');

    // S'abonner aux mises à jour des deux chambres
    const unsubscribe = subscribeToAllChambers(handleCh1Update, handleCh2Update);

    // Auto-refresh toutes les 15 secondes
    const refreshInterval = setInterval(() => {
      dispatch({ type: 'SET_LAST_UPDATE', payload: new Date() });
    }, 15000);

    // Nettoyage
    return () => {
      unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []); // Suppression des dépendances pour éviter la boucle infinie

  // Fonction de rafraîchissement manuel
  const handleManualRefresh = async () => {
    dispatch({ type: 'SET_CHAMBER_LOADING', payload: { chamberId: 'ch1', loading: true } });
    dispatch({ type: 'SET_CHAMBER_LOADING', payload: { chamberId: 'ch2', loading: true } });

    try {
      const connectivity = await testChamberConnectivity();
      console.log('Test de connectivité:', connectivity);

      if (!connectivity.connected) {
        throw new Error('Impossible de se connecter à Firebase');
      }

      dispatch({ type: 'SET_LAST_UPDATE', payload: new Date() });
    } catch (error: any) {
      console.error('Erreur lors du rafraîchissement:', error);
      dispatch({ type: 'SET_CHAMBER_ERROR', payload: { chamberId: 'ch1', error: error.message } });
      dispatch({ type: 'SET_CHAMBER_ERROR', payload: { chamberId: 'ch2', error: error.message } });
    }
  };

  // Fonction pour obtenir l'icône d'un capteur
  const getSensorIcon = (sensorName: string) => {
    const iconMap: { [key: string]: JSX.Element } = {
      'Température': <FaThermometerHalf className="text-danger" />,
      'Humidité d\'air': <FaTint className="text-info" />,
      'Humidité du sol': <FaTint className="text-success" />,
      'Niveau d\'eau': <FaWater className="text-primary" />,
      'Pompe d\'irrigation': <FaPowerOff className="text-warning" />,
      'Luminosité': <FaSun className="text-warning" />,
      'Pompe MPK': <FaPowerOff className="text-info" />,
      'Lumière RGB': <FaSun className="text-primary" />
    };
    return iconMap[sensorName] || <FaCheckCircle />;
  };

  // Rendu d'une carte de capteur compacte
  const renderCompactSensorCard = (sensor: any, chamberColor: string) => {
    const isAlert = sensor.isAlert;

    return (
      <Card
        key={sensor.id}
        className={`h-100 shadow-sm ${isAlert ? 'border-danger' : ''}`}
        bg={darkMode ? 'dark' : 'light'}
        text={darkMode ? 'light' : 'dark'}
        style={{ borderLeftColor: chamberColor, borderLeftWidth: '4px' }}
      >
        <Card.Body className="p-3">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div className="d-flex align-items-center">
              {getSensorIcon(sensor.name)}
              <span className="ms-2 fw-bold" style={{ fontSize: '0.9rem' }}>
                {sensor.name}
              </span>
            </div>
            {isAlert && (
              <Badge bg="danger" pill>
                <FaExclamationTriangle size={10} />
              </Badge>
            )}
          </div>

          {/* Affichage spécial pour la lumière RGB */}
          {sensor.name === 'Lumière RGB' ? (
            <div className="text-center">
              <div className="mb-2">
                <small className="text-muted">État des couleurs</small>
              </div>
              <div className="d-flex justify-content-center gap-2">
                <div className="d-flex flex-column align-items-center">
                  <div
                    className="rounded-circle mb-1"
                    style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: sensor.rgbValues?.r ? '#ff0000' : '#cccccc',
                      border: '2px solid #ddd'
                    }}
                  ></div>
                  <Badge bg={sensor.rgbValues?.r ? 'danger' : 'secondary'} className="small">
                    R
                  </Badge>
                </div>
                <div className="d-flex flex-column align-items-center">
                  <div
                    className="rounded-circle mb-1"
                    style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: sensor.rgbValues?.g ? '#00ff00' : '#cccccc',
                      border: '2px solid #ddd'
                    }}
                  ></div>
                  <Badge bg={sensor.rgbValues?.g ? 'success' : 'secondary'} className="small">
                    G
                  </Badge>
                </div>
                <div className="d-flex flex-column align-items-center">
                  <div
                    className="rounded-circle mb-1"
                    style={{
                      width: '20px',
                      height: '20px',
                      backgroundColor: sensor.rgbValues?.b ? '#0000ff' : '#cccccc',
                      border: '2px solid #ddd'
                    }}
                  ></div>
                  <Badge bg={sensor.rgbValues?.b ? 'primary' : 'secondary'} className="small">
                    B
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <h4 className="mb-1" style={{ color: chamberColor }}>
                {typeof sensor.currentValue === 'object' ? 'RGB' : sensor.currentValue}
                <small className="ms-1" style={{ fontSize: '0.7rem' }}>
                  {sensor.unit}
                </small>
              </h4>
              <small className="text-muted">
                {sensor.minThreshold}-{sensor.maxThreshold}{sensor.unit}
              </small>
            </div>
          )}

          {(sensor.name === 'Pompe d\'irrigation' ||
            sensor.name === 'État du ventilateur' ||
            sensor.name === 'État du chauffage' ||
            sensor.name === 'Pompe MPK') && (
            <div className="mt-2 text-center">
              <Badge bg={sensor.currentValue === 1 ? 'success' : 'secondary'}>
                {sensor.currentValue === 1 ? 'ACTIVÉ' : 'ARRÊTÉ'}
              </Badge>
            </div>
          )}
        </Card.Body>
      </Card>
    );
  };

  // Rendu d'une chambre en format compact
  const renderCompactChamber = (chamberId: 'ch1' | 'ch2', chamberName: string, chamberColor: string) => {
    const chamber = state[chamberId];

    return (
      <Card className="mb-4 shadow">
        <Card.Header
          style={{ backgroundColor: chamberColor, color: 'white' }}
          className="d-flex justify-content-between align-items-center"
        >
          <h5 className="mb-0 d-flex align-items-center">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center me-2"
              style={{ width: '30px', height: '30px', backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              {chamberId === 'ch1' ? '1' : '2'}
            </div>
            {chamberName}
          </h5>

          <div className="d-flex align-items-center">
            <div
              className="rounded-circle me-2"
              style={{
                width: '10px',
                height: '10px',
                backgroundColor: chamber.loading ? '#ffc107' : chamber.error ? '#dc3545' : '#28a745'
              }}
            ></div>
            <small>
              {chamber.loading ? 'Chargement...' : chamber.error ? 'Hors ligne' : 'En ligne'}
            </small>
          </div>
        </Card.Header>

        <Card.Body>
          {chamber.error && (
            <Alert variant="danger" className="mb-3">
              <FaExclamationTriangle className="me-2" />
              Erreur: {chamber.error}
            </Alert>
          )}

          {chamber.loading ? (
            <div className="text-center py-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : chamber.sensors.length > 0 ? (
            <Row className="g-2">
              {chamber.sensors
                .filter(sensor => !sensor.id.includes('water_level')) // Exclure seulement le niveau d'eau
                .map(sensor => (
                  <Col key={sensor.id} lg={4} md={6} sm={12}>
                    {renderCompactSensorCard(sensor, chamberColor)}
                  </Col>
                ))}
            </Row>
          ) : (
            <Alert variant="info">
              <FaCheckCircle className="me-2" />
              Aucune donnée disponible
            </Alert>
          )}
        </Card.Body>
      </Card>
    );
  };

  const hasData = state.ch1.sensors.length > 0 || state.ch2.sensors.length > 0;
  const isLoading = state.ch1.loading || state.ch2.loading;

  return (
    <Container fluid className="py-3">
      {/* En-tête */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1>Dashboard Dual Chamber</h1>
              <p className="text-muted mb-0">
                Surveillance en temps réel - Dernière mise à jour: {state.lastUpdate.toLocaleString('fr-FR')}
              </p>
            </div>
            <Button
              variant="primary"
              onClick={handleManualRefresh}
              disabled={isLoading}
              className="d-flex align-items-center"
            >
              <FaSync className={isLoading ? 'fa-spin me-2' : 'me-2'} />
              Actualiser
            </Button>
          </div>
        </Col>
      </Row>

      {/* Légende des chambres */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Body className="py-2">
              <div className="d-flex justify-content-center align-items-center gap-4">
                <div className="d-flex align-items-center">
                  <div
                    className="rounded me-2"
                    style={{ width: '16px', height: '16px', backgroundColor: '#007bff' }}
                  ></div>
                  <span>Chambre 1</span>
                </div>
                <div className="d-flex align-items-center">
                  <div
                    className="rounded me-2"
                    style={{ width: '16px', height: '16px', backgroundColor: '#fd7e14' }}
                  ></div>
                  <span>Chambre 2</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Chambres */}
      <Row>
        <Col lg={6} md={12}>
          {renderCompactChamber('ch1', 'Chambre 1', '#007bff')}
        </Col>
        <Col lg={6} md={12}>
          {renderCompactChamber('ch2', 'Chambre 2', '#fd7e14')}
        </Col>
      </Row>

      {/* Graphiques de comparaison */}
      {hasData && (
        <Row>
          <Col>
            <Card className="shadow">
              <Card.Header>
                <h5 className="mb-0">Graphiques de Comparaison</h5>
              </Card.Header>
              <Card.Body>
                <ChamberGraphs
                  ch1Sensors={state.ch1.sensors}
                  ch2Sensors={state.ch2.sensors}
                />
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default DualChamberDashboard;
