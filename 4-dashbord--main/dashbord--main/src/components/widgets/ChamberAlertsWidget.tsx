import React from 'react';
import { Card, ListGroup, Badge } from 'react-bootstrap';
import { FaExclamationTriangle } from 'react-icons/fa';
import { useThemeContext } from '../../hooks/ThemeContext';
import { IconBaseProps } from 'react-icons';

const WarningIcon = (props: IconBaseProps) => <FaExclamationTriangle {...props} />;

interface ChamberAlertsWidgetProps {
  sensors: any[];
  title: string;
  color: string;
}

const ChamberAlertsWidget: React.FC<ChamberAlertsWidgetProps> = ({ sensors, title, color }) => {
  const { darkMode } = useThemeContext();
  
  const alertSensors = sensors.filter(sensor => sensor.isAlert);
  
  return (
    <Card 
      className="h-100 shadow-sm"
      bg={darkMode ? 'dark' : 'light'}
      text={darkMode ? 'light' : 'dark'}
      border={alertSensors.length > 0 ? 'danger' : ''}
    >
      <Card.Header 
        className="d-flex align-items-center"
        style={{ backgroundColor: color, color: 'white' }}
      >
        <span className="me-2">
          <WarningIcon size={20} />
        </span>
        <h5 className="mb-0">{title}</h5>
        {alertSensors.length > 0 && (
          <Badge bg="danger" pill className="ms-2">
            {alertSensors.length}
          </Badge>
        )}
      </Card.Header>
      <Card.Body>
        {alertSensors.length === 0 ? (
          <div className="text-center py-4">
            <p className="mb-0 text-success">Aucune alerte active</p>
          </div>
        ) : (
          <ListGroup variant={darkMode ? 'dark' : 'light'}>
            {alertSensors.map(sensor => (
              <ListGroup.Item 
                key={sensor.id}
                className="d-flex justify-content-between align-items-center"
                variant="danger"
              >
                <div>
                  <strong>{sensor.name}</strong>
                  <p className="mb-0 small">
                    Valeur actuelle: {typeof sensor.currentValue === 'number' ? sensor.currentValue.toFixed(1) : sensor.currentValue} {sensor.unit}
                  </p>
                </div>
                <div>
                  <small>
                    Seuils: {sensor.minThreshold} - {sensor.maxThreshold} {sensor.unit}
                  </small>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>
      {alertSensors.length > 0 && (
        <Card.Footer className="text-center">
          <small className="text-danger">
            Attention: {alertSensors.length} capteur(s) nécessite(nt) votre attention
          </small>
        </Card.Footer>
      )}
    </Card>
  );
};

export default ChamberAlertsWidget;
