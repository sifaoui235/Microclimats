import React from 'react';
import { Card, ListGroup, Badge } from 'react-bootstrap';
import { FaWater, FaExclamationTriangle } from 'react-icons/fa';
import { useThemeContext } from '../../hooks/ThemeContext';
import { IconBaseProps } from 'react-icons';

const WaterIcon = (props: IconBaseProps) => <FaWater {...props} />;
const WarningIcon = (props: IconBaseProps) => <FaExclamationTriangle {...props} />;

interface WaterLevelAlertsWidgetProps {
  ch1Sensors: any[];
  ch2Sensors: any[];
}

const WaterLevelAlertsWidget: React.FC<WaterLevelAlertsWidgetProps> = ({ ch1Sensors, ch2Sensors }) => {
  const { darkMode } = useThemeContext();
  
  // Fonction pour extraire les capteurs de niveau d'eau
  const getWaterLevelSensors = () => {
    const ch1WaterSensor = ch1Sensors.find(sensor => sensor.id.includes('water_level'));
    const ch2WaterSensor = ch2Sensors.find(sensor => sensor.id.includes('water_level'));
    
    const waterSensors = [];
    if (ch1WaterSensor) waterSensors.push({ ...ch1WaterSensor, milieu: 'Milieu 1' });
    if (ch2WaterSensor) waterSensors.push({ ...ch2WaterSensor, milieu: 'Milieu 2' });
    
    return waterSensors;
  };

  const waterSensors = getWaterLevelSensors();
  const alertWaterSensors = waterSensors.filter(sensor => sensor.isAlert);
  
  return (
    <Card 
      className="h-100 shadow-sm"
      bg={darkMode ? 'dark' : 'light'}
      text={darkMode ? 'light' : 'dark'}
      border={alertWaterSensors.length > 0 ? 'danger' : ''}
    >
      <Card.Header 
        className="d-flex align-items-center"
        style={{ backgroundColor: '#17a2b8', color: 'white' }}
      >
        <span className="me-2">
          <WaterIcon size={20} />
        </span>
        <h6 className="mb-0">Niveau d'eau</h6>
        {alertWaterSensors.length > 0 && (
          <Badge bg="danger" pill className="ms-2">
            {alertWaterSensors.length}
          </Badge>
        )}
      </Card.Header>
      <Card.Body className="p-2">
        {alertWaterSensors.length === 0 ? (
          <div className="text-center py-3">
            <p className="mb-0 text-success small">Aucune alerte de niveau d'eau</p>
          </div>
        ) : (
          <ListGroup variant={darkMode ? 'dark' : 'light'} className="list-group-flush">
            {alertWaterSensors.map(sensor => (
              <ListGroup.Item 
                key={sensor.id}
                className="px-2 py-2 border-0"
                variant="danger"
              >
                <div className="d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center mb-1">
                      <WaterIcon size={14} className="me-2 text-danger" />
                      <strong className="small">{sensor.milieu}</strong>
                    </div>
                    <p className="mb-1 small">
                      <strong>Niveau:</strong> {typeof sensor.currentValue === 'number' ? sensor.currentValue.toFixed(1) : sensor.currentValue}{sensor.unit}
                    </p>
                    <small className="text-muted">
                      Seuils: {sensor.minThreshold}-{sensor.maxThreshold}{sensor.unit}
                    </small>
                  </div>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        )}
      </Card.Body>
      {alertWaterSensors.length > 0 && (
        <Card.Footer className="text-center py-2">
          <small className="text-danger">
            Attention: Niveau d'eau critique
          </small>
        </Card.Footer>
      )}
    </Card>
  );
};

export default WaterLevelAlertsWidget;
