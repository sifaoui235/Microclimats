import React, { useReducer, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge } from 'react-bootstrap';
import { FaSync, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';
import { useThemeContext } from '../../hooks/ThemeContext';
import { subscribeToAllChambers, convertToChamberSensors, testChamberConnectivity } from '../../services/DualFirebaseLoader.service';
import ChamberGraphs from '../charts/ChamberGraphs.component';
import { PumpStateIndicator, PumpStatsDisplay, checkPumpAlert } from '../../utils/PumpStateIndicator.util';
import styles from '../../styles/ChamberStyles.module.css';

// Reducer pour gérer l'état des deux chambres
const chamberReducer = (state, action) => {
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
const initialState = {
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
 * Composant principal pour la surveillance dual chamber
 */
const ChamberComparisonLayout = () => {
  const { darkMode } = useThemeContext();
  const [state, dispatch] = useReducer(chamberReducer, initialState);

  // Callbacks pour les mises à jour des chambres
  const handleCh1Update = useCallback((data, error) => {
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
  }, []);

  const handleCh2Update = useCallback((data, error) => {
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
  }, []);

  // Effet pour s'abonner aux mises à jour en temps réel
  useEffect(() => {
    console.log('Initialisation de la surveillance dual chamber');
    
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
  }, [handleCh1Update, handleCh2Update]);

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
    } catch (error) {
      console.error('Erreur lors du rafraîchissement:', error);
      dispatch({ type: 'SET_CHAMBER_ERROR', payload: { chamberId: 'ch1', error: error.message } });
      dispatch({ type: 'SET_CHAMBER_ERROR', payload: { chamberId: 'ch2', error: error.message } });
    }
  };

  // Rendu d'une carte de capteur
  const renderSensorCard = (sensor, chamberColor) => {
    const isAlert = sensor.isAlert;
    const alertClass = isAlert ? styles.alert : '';
    
    return (
      <Card 
        key={sensor.id}
        className={`${styles.sensorCard} ${alertClass} h-100`}
        style={{ borderLeftColor: chamberColor }}
      >
        <Card.Body>
          <div className={styles.sensorHeader}>
            <div className={styles.sensorTitle}>
              <span className={styles.sensorIcon}>
                {getSensorIcon(sensor.name)}
              </span>
              {sensor.name}
            </div>
            {isAlert && (
              <Badge bg="danger" pill>
                <FaExclamationTriangle size={12} />
              </Badge>
            )}
          </div>
          
          <div className={styles.sensorValue}>
            {sensor.currentValue}
            <span className={styles.sensorUnit}>{sensor.unit}</span>
          </div>
          
          <div className={styles.sensorThresholds}>
            Min: {sensor.minThreshold}{sensor.unit} | Max: {sensor.maxThreshold}{sensor.unit}
          </div>
          
          {sensor.name === 'État de la pompe' && (
            <div className="mt-2">
              <PumpStateIndicator 
                isActive={sensor.currentValue === 1}
                chamberName={sensor.chamberName}
                lastUpdate={sensor.history[sensor.history.length - 1]?.timestamp}
                size="sm"
              />
            </div>
          )}
        </Card.Body>
      </Card>
    );
  };

  // Rendu d'une chambre
  const renderChamber = (chamberId, chamberName, chamberColor) => {
    const chamber = state[chamberId];
    const chamberClass = chamberId === 'ch1' ? styles.chamberCh1 : styles.chamberCh2;
    
    return (
      <div className={`${styles.chamber} ${chamberClass}`}>
        <div className={styles.chamberHeader}>
          <h3 className={styles.chamberTitle}>
            <div className={`${styles.chamberIcon} ${chamberId === 'ch1' ? styles.chamberIconCh1 : styles.chamberIconCh2}`}>
              {chamberId === 'ch1' ? '1' : '2'}
            </div>
            {chamberName}
          </h3>
          
          <div className={styles.chamberStatus}>
            <div className={`${styles.statusIndicator} ${
              chamber.loading ? styles.statusLoading : 
              chamber.error ? styles.statusOffline : 
              styles.statusOnline
            }`}></div>
            <span>
              {chamber.loading ? 'Chargement...' : 
               chamber.error ? 'Hors ligne' : 
               'En ligne'}
            </span>
          </div>
        </div>

        {chamber.error && (
          <Alert variant="danger" className="mb-3">
            <FaExclamationTriangle className="me-2" />
            Erreur: {chamber.error}
          </Alert>
        )}

        {chamber.loading ? (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Chargement...</span>
            </div>
            <p className="mt-2 text-muted">Chargement des données de la {chamberName.toLowerCase()}...</p>
          </div>
        ) : chamber.sensors.length > 0 ? (
          <>
            <Row className="g-3">
              {chamber.sensors.map(sensor => (
                <Col key={sensor.id} lg={4} md={6} sm={12}>
                  {renderSensorCard(sensor, chamberColor)}
                </Col>
              ))}
            </Row>
            
            {/* Statistiques de pompe */}
            {chamber.sensors.find(s => s.name === 'État de la pompe') && (
              <Card className="mt-3">
                <Card.Body>
                  <PumpStatsDisplay 
                    history={chamber.sensors.find(s => s.name === 'État de la pompe').history}
                    chamberName={chamberName}
                    hours={24}
                  />
                </Card.Body>
              </Card>
            )}
          </>
        ) : (
          <Alert variant="info">
            <FaCheckCircle className="me-2" />
            Aucune donnée disponible pour cette chambre
          </Alert>
        )}
      </div>
    );
  };

  // Fonction pour obtenir l'icône d'un capteur
  const getSensorIcon = (sensorName) => {
    const icons = {
      'Température': '🌡️',
      'Humidité d\'air': '💨',
      'Humidité du sol': '🌱',
      'Niveau d\'eau': '💧',
      'État de la pompe': '⚡',
      'Luminosité': '☀️'
    };
    return icons[sensorName] || '📊';
  };

  return (
    <Container fluid className={`${styles.chamberContainer} ${darkMode ? styles.dark : ''}`}>
      {/* En-tête avec contrôles */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <h1>Surveillance Dual Chamber</h1>
            <div className={styles.controlButtons}>
              <Button 
                variant="primary" 
                onClick={handleManualRefresh}
                disabled={state.ch1.loading || state.ch2.loading}
                className={styles.refreshButton}
              >
                <FaSync className={state.ch1.loading || state.ch2.loading ? styles.loadingSpinner : ''} />
                Actualiser
              </Button>
            </div>
          </div>
          <p className="text-muted">
            Dernière mise à jour: {state.lastUpdate.toLocaleString('fr-FR')}
          </p>
        </Col>
      </Row>

      {/* Légende des chambres */}
      <div className={styles.chamberLegend}>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.legendColorCh1}`}></div>
          <span>Chambre 1</span>
        </div>
        <div className={styles.legendItem}>
          <div className={`${styles.legendColor} ${styles.legendColorCh2}`}></div>
          <span>Chambre 2</span>
        </div>
      </div>

      {/* Chambres */}
      <Row>
        <Col lg={6} md={12} className="mb-4">
          {renderChamber('ch1', 'Chambre 1', '#007bff')}
        </Col>
        <Col lg={6} md={12} className="mb-4">
          {renderChamber('ch2', 'Chambre 2', '#fd7e14')}
        </Col>
      </Row>

      {/* Section de comparaison avec graphiques */}
      <div className={styles.comparisonSection}>
        <h2 className={styles.comparisonTitle}>Comparaison et Historiques</h2>
        <ChamberGraphs 
          ch1Sensors={state.ch1.sensors}
          ch2Sensors={state.ch2.sensors}
        />
      </div>
    </Container>
  );
};

export default ChamberComparisonLayout;
