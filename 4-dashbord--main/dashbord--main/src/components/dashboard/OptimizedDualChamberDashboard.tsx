import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge } from 'react-bootstrap';
import { FaSync, FaExclamationTriangle, FaCheckCircle, FaThermometerHalf, FaTint, FaWater, FaSun, FaPowerOff } from 'react-icons/fa';
import { useThemeContext } from '../../hooks/ThemeContext';
import { subscribeToAllChambers, convertToChamberSensors, testChamberConnectivity } from '../../services/DualFirebaseLoader.service';
import ChamberGraphs from '../charts/ChamberGraphs.component';
import ChamberAlertsWidget from '../widgets/ChamberAlertsWidget';
import SystemStatusWidget from '../widgets/SystemStatusWidget';
import WaterLevelWidget from '../widgets/WaterLevelWidget';

// Interface pour l'état des milieux
interface MilieuState {
  data: any;
  sensors: any[];
  loading: boolean;
  error: string | null;
  isOnline: boolean;
  lastDataUpdate: Date | null;
}

interface DashboardState {
  ch1: MilieuState;
  ch2: MilieuState;
  lastUpdate: Date;
}

/**
 * Dashboard dual milieu optimisé pour éviter les re-renders
 */
const OptimizedDualChamberDashboard: React.FC = () => {
  const { darkMode } = useThemeContext();
  const [state, setState] = useState<DashboardState>({
    ch1: { data: null, sensors: [], loading: true, error: null, isOnline: false, lastDataUpdate: null },
    ch2: { data: null, sensors: [], loading: true, error: null, isOnline: false, lastDataUpdate: null },
    lastUpdate: new Date()
  });

  // Refs pour éviter les re-renders
  const unsubscribeRef = useRef<Function | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fonction pour mettre à jour un milieu
  const updateMilieu = (chamberId: 'ch1' | 'ch2', data: any, error?: any) => {
    setState(prevState => {
      if (error && !data) {
        // Erreur sans données - garder les anciennes données mais marquer comme hors ligne
        return {
          ...prevState,
          [chamberId]: {
            ...prevState[chamberId],
            loading: false,
            isOnline: false,
            // Ne pas mettre à jour error si on a déjà des données
            error: prevState[chamberId].sensors.length === 0 ? error.message : null
          }
        };
      } else if (data) {
        const sensors = convertToChamberSensors(
          data,
          chamberId,
          chamberId === 'ch1' ? 'Milieu 1' : 'Milieu 2'
        );

        return {
          ...prevState,
          [chamberId]: {
            data,
            sensors,
            loading: false,
            error: null,
            isOnline: data.isOnline !== false, // Utiliser le statut isOnline des données
            lastDataUpdate: new Date()
          },
          lastUpdate: new Date()
        };
      }
      return prevState;
    });
  };

  // Initialisation une seule fois
  useEffect(() => {
    console.log('🚀 Initialisation du dashboard dual milieu optimisé');

    // Callbacks stables
    const handleCh1Update = (data: any, error?: any) => updateMilieu('ch1', data, error);
    const handleCh2Update = (data: any, error?: any) => updateMilieu('ch2', data, error);

    // S'abonner aux mises à jour
    unsubscribeRef.current = subscribeToAllChambers(handleCh1Update, handleCh2Update);

    // Auto-refresh toutes les 15 secondes (juste pour l'horodatage)
    intervalRef.current = setInterval(() => {
      setState(prevState => ({
        ...prevState,
        lastUpdate: new Date()
      }));
    }, 15000);

    // Nettoyage
    return () => {
      if (unsubscribeRef.current) {
        (unsubscribeRef.current as () => void)();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []); // Pas de dépendances pour éviter les re-renders

  // Fonction de rafraîchissement manuel
  const handleManualRefresh = async () => {
    setState(prevState => ({
      ...prevState,
      ch1: { ...prevState.ch1, loading: true },
      ch2: { ...prevState.ch2, loading: true }
    }));

    try {
      const connectivity = await testChamberConnectivity();
      console.log('Test de connectivité:', connectivity);

      if (!connectivity.connected) {
        throw new Error('Impossible de se connecter à Firebase');
      }

      setState(prevState => ({
        ...prevState,
        lastUpdate: new Date()
      }));
    } catch (error: any) {
      console.error('Erreur lors du rafraîchissement:', error);
      setState(prevState => ({
        ...prevState,
        ch1: { ...prevState.ch1, error: error.message, loading: false },
        ch2: { ...prevState.ch2, error: error.message, loading: false }
      }));
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

  // Rendu d'une carte de capteur
  const renderSensorCard = (sensor: any, chamberColor: string) => {
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

  // Rendu d'un milieu
  const renderMilieu = (chamberId: 'ch1' | 'ch2', milieuName: string, milieuColor: string) => {
    const milieu = state[chamberId];

    return (
      <Card className="mb-4 shadow">
        <Card.Header
          style={{ backgroundColor: milieuColor, color: 'white' }}
          className="d-flex justify-content-between align-items-center"
        >
          <h5 className="mb-0 d-flex align-items-center">
            <div
              className="rounded-circle d-flex align-items-center justify-content-center me-2"
              style={{ width: '30px', height: '30px', backgroundColor: 'rgba(255,255,255,0.2)' }}
            >
              {chamberId === 'ch1' ? '1' : '2'}
            </div>
            {milieuName}
          </h5>

          <div className="d-flex align-items-center">
            <div
              className="rounded-circle me-2"
              style={{
                width: '10px',
                height: '10px',
                backgroundColor: milieu.loading ? '#ffc107' : !milieu.isOnline ? '#dc3545' : '#28a745'
              }}
            ></div>
            <small>
              {milieu.loading ? 'Chargement...' : !milieu.isOnline ? 'Hors ligne' : 'En ligne'}
            </small>
          </div>
        </Card.Header>

        <Card.Body>
          {/* Afficher l'erreur seulement s'il n'y a pas de données du tout */}
          {milieu.error && milieu.sensors.length === 0 && (
            <Alert variant="danger" className="mb-3">
              <FaExclamationTriangle className="me-2" />
              Erreur: {milieu.error}
            </Alert>
          )}

          {/* Message d'information supprimé pour garder l'interface propre */}

          {milieu.loading ? (
            <div className="text-center py-3">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : milieu.sensors.length > 0 ? (
            <Row className="g-2">
              {milieu.sensors
                .filter(sensor => !sensor.id.includes('water_level')) // Exclure seulement le niveau d'eau
                .map(sensor => (
                  <Col key={sensor.id} lg={4} md={6} sm={12}>
                    {renderSensorCard(sensor, milieuColor)}
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
              <h1>Dashboard Dual Milieu</h1>
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

      {/* État du système et Alertes */}
      {hasData && (
        <Row className="mb-4">
          <Col md={6} className="mb-4 mb-md-0">
            <div className="mb-3">
              <SystemStatusWidget sensors={[...state.ch1.sensors, ...state.ch2.sensors]} />
            </div>
            <WaterLevelWidget
              ch1Sensors={state.ch1.sensors}
              ch2Sensors={state.ch2.sensors}
            />
          </Col>
          <Col md={6}>
            <Card
              className="h-100 shadow-sm"
              bg={darkMode ? 'dark' : 'light'}
              text={darkMode ? 'light' : 'dark'}
            >
              <Card.Header className="d-flex align-items-center">
                <span className="text-danger me-2">
                  <FaExclamationTriangle size={20} />
                </span>
                <h5 className="mb-0">Alertes</h5>
              </Card.Header>
              <Card.Body className="p-2">
                <div className="d-flex flex-column gap-2">
                  <ChamberAlertsWidget
                    sensors={state.ch1.sensors.filter(sensor => !sensor.id.includes('water_level'))}
                    title="Premier Milieu"
                    color="#007bff"
                  />
                  <ChamberAlertsWidget
                    sensors={state.ch2.sensors.filter(sensor => !sensor.id.includes('water_level'))}
                    title="Deuxième Milieu"
                    color="#fd7e14"
                  />
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Légende des milieux */}
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
                  <span>Milieu 1</span>
                </div>
                <div className="d-flex align-items-center">
                  <div
                    className="rounded me-2"
                    style={{ width: '16px', height: '16px', backgroundColor: '#fd7e14' }}
                  ></div>
                  <span>Milieu 2</span>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Milieux */}
      <Row>
        <Col lg={6} md={12}>
          {renderMilieu('ch1', 'Milieu 1', '#007bff')}
        </Col>
        <Col lg={6} md={12}>
          {renderMilieu('ch2', 'Milieu 2', '#fd7e14')}
        </Col>
      </Row>

      {/* Graphiques de comparaison */}
      {hasData && (
        <Row>
          <Col>
            <Card className="shadow">
              <Card.Header>
                <h5 className="mb-0">Graphiques de Comparaison des Milieux</h5>
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

export default OptimizedDualChamberDashboard;
