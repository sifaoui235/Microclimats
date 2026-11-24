import React from 'react';
import { Card, Row, Col, ProgressBar, Badge } from 'react-bootstrap';
import { FaWater, FaExclamationTriangle } from 'react-icons/fa';
import { useThemeContext } from '../../hooks/ThemeContext';
import { IconBaseProps } from 'react-icons';

const WaterIcon = (props: IconBaseProps) => <FaWater {...props} />;
const WarningIcon = (props: IconBaseProps) => <FaExclamationTriangle {...props} />;

interface WaterLevelWidgetProps {
  ch1Sensors: any[];
  ch2Sensors: any[];
}

const WaterLevelWidget: React.FC<WaterLevelWidgetProps> = ({ ch1Sensors, ch2Sensors }) => {
  const { darkMode } = useThemeContext();

  // Fonction pour extraire le capteur de niveau d'eau
  const getWaterLevelSensor = (sensors: any[]) => {
    return sensors.find(sensor => sensor.id.includes('water_level'));
  };

  const ch1WaterSensor = getWaterLevelSensor(ch1Sensors);
  const ch2WaterSensor = getWaterLevelSensor(ch2Sensors);

  // Utiliser le premier capteur disponible (priorité au milieu 1, sinon milieu 2)
  const waterSensor = ch1WaterSensor || ch2WaterSensor;

  // Fonction pour obtenir la couleur de la barre de progression
  const getProgressVariant = (value: number, minThreshold: number, maxThreshold: number) => {
    if (value < minThreshold) return 'danger';
    if (value > maxThreshold) return 'warning';
    return 'success';
  };

  if (!waterSensor) {
    return (
      <Card
        className="shadow-sm"
        bg={darkMode ? 'dark' : 'light'}
        text={darkMode ? 'light' : 'dark'}
      >
        <Card.Header className="d-flex align-items-center">
          <span className="text-primary me-2">
            <WaterIcon size={20} />
          </span>
          <h5 className="mb-0">Niveau d'Eau</h5>
        </Card.Header>
        <Card.Body>
          <div className="text-center p-4">
            <div className="text-muted mb-2">
              <WaterIcon size={48} />
            </div>
            <p className="text-muted mb-0">Aucune donnée de niveau d'eau disponible</p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  const value = waterSensor.currentValue;
  const isAlert = waterSensor.isAlert;
  const variant = getProgressVariant(value, waterSensor.minThreshold, waterSensor.maxThreshold);

  return (
    <Card
      className="shadow-sm"
      bg={darkMode ? 'dark' : 'light'}
      text={darkMode ? 'light' : 'dark'}
    >
      <Card.Header className="d-flex align-items-center">
        <span className="text-primary me-2">
          <WaterIcon size={20} />
        </span>
        <h5 className="mb-0">Niveau d'Eau</h5>
        {isAlert && (
          <Badge bg="danger" pill className="ms-2">
            <WarningIcon size={10} />
          </Badge>
        )}
      </Card.Header>
      <Card.Body>
        <div className="text-center">
          {/* Icône principale */}
          <div className="mb-2">
            <WaterIcon size={32} className={isAlert ? 'text-danger' : 'text-primary'} />
          </div>

          {/* Valeur principale */}
          <div className="mb-2">
            <h3 className={`mb-1 ${isAlert ? 'text-danger' : 'text-primary'}`}>
              {value.toFixed(1)}
              <small className="ms-1" style={{ fontSize: '0.7rem' }}>
                {waterSensor.unit}
              </small>
            </h3>
            <small className="text-muted d-block">
              Seuils: {waterSensor.minThreshold}-{waterSensor.maxThreshold}{waterSensor.unit}
            </small>
          </div>

          {/* Barre de progression */}
          <div className="mb-2">
            <ProgressBar
              now={value}
              max={100}
              variant={variant}
              style={{ height: '8px' }}
              className="mb-1"
            />
            <div className="d-flex justify-content-between">
              <small className="text-muted">0%</small>
              <small className="text-muted">100%</small>
            </div>
          </div>

          {/* Statut */}
          <Badge bg={isAlert ? 'danger' : 'success'} className="px-3 py-1">
            {isAlert ? 'Critique' : 'Normal'}
          </Badge>
        </div>
      </Card.Body>
    </Card>
  );
};

export default WaterLevelWidget;
