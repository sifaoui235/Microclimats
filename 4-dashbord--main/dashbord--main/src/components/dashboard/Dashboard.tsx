import React, { useState } from 'react';
import { Row, Col, Button, Alert } from 'react-bootstrap';
import { FaSync } from 'react-icons/fa';
import SensorCard from '../widgets/SensorCard';
import SensorChart from '../charts/SensorChart';
import { SensorInfo } from '../../types';
import { useThemeContext } from '../../hooks/ThemeContext';
import { IconBaseProps } from 'react-icons';
import { useFirebase } from '../../firebase/FirebaseContext';
import DatabaseInitializer from '../firebase/DatabaseInitializer';

const SyncIcon = (props: IconBaseProps) => <FaSync {...props} />;

const Dashboard: React.FC = () => {
  const { darkMode } = useThemeContext();
  const { sensors, loading, error, refreshSensors } = useFirebase();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const updateSensorData = async () => {
    try {
      await refreshSensors();
      setLastUpdate(new Date());
    } catch (err) {
      console.error('Error refreshing sensor data:', err);
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Tableau de bord</h1>
        <div>
          <small className="me-3 text-muted">
            Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
          </small>
          <Button
            variant={darkMode ? 'outline-light' : 'outline-primary'}
            size="sm"
            onClick={updateSensorData}
            disabled={loading}
            className="d-flex align-items-center"
          >
            <span className={`me-2 ${loading ? 'fa-spin' : ''}`}>
              <SyncIcon size={16} />
            </span>
            {loading ? 'Mise à jour...' : 'Actualiser'}
          </Button>
        </div>
      </div>

      {/* Message when no sensors are found */}
      {sensors.length === 0 && !loading && (
        <div className="mb-4">
          <Alert variant="info">
            Aucune donnée de capteur trouvée. Assurez-vous que votre Raspberry Pi envoie des données à Firebase.
          </Alert>
        </div>
      )}

      {error && (
        <Alert variant="danger" className="mb-4">
          Erreur: {error}
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
          {sensors.length > 0 && (
            <>
              <h2 className="mb-3">Capteurs</h2>
              <Row className="mb-4 g-3">
                {sensors.map(sensor => (
                  <Col key={sensor.id} lg={3} md={6} sm={12}>
                    <SensorCard sensor={sensor} />
                  </Col>
                ))}
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

export default Dashboard;
