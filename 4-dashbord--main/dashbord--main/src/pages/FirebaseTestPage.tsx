import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import FirebaseConnectionTest from '../components/debug/FirebaseConnectionTest';
import ChamberDataPopulator from '../components/debug/ChamberDataPopulator';
import RealtimeSensorCard from '../components/widgets/RealtimeSensorCard';

/**
 * A test page to verify Firebase connectivity and real-time updates
 */
const FirebaseTestPage: React.FC = () => {
  return (
    <Container className="py-4">
      <h1 className="mb-4">Firebase Test Page</h1>

      <Row className="mb-5">
        <Col>
          {/* Firebase Connection Test */}
          <FirebaseConnectionTest />
        </Col>
      </Row>

      <Row className="mb-5">
        <Col>
          {/* Chamber Data Populator */}
          <ChamberDataPopulator />
        </Col>
      </Row>

      <h2 className="mb-3 mt-5">Sensor Cards Test</h2>
      <div className="row g-3">
        <div className="col-md-4">
          <RealtimeSensorCard
            sensorType="temperature"
            title="Temperature"
            description="Temperature sensor"
            unit="°C"
            minThreshold={18}
            maxThreshold={28}
          />
        </div>
        <div className="col-md-4">
          <RealtimeSensorCard
            sensorType="humidity_air"
            title="Air Humidity"
            description="Air humidity sensor"
            unit="%"
            minThreshold={40}
            maxThreshold={80}
          />
        </div>
        <div className="col-md-4">
          <RealtimeSensorCard
            sensorType="humidity_soil"
            title="Soil Humidity"
            description="Soil humidity sensor"
            unit="%"
            minThreshold={60}
            maxThreshold={80}
          />
        </div>
      </div>
    </Container>
  );
};

export default FirebaseTestPage;
