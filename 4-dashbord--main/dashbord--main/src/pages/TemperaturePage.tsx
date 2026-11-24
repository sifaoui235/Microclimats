import React from 'react';
import { Container } from 'react-bootstrap';
import TemperatureDisplay from '../components/debug/TemperatureDisplay';

const TemperaturePage: React.FC = () => {
  return (
    <Container>
      <TemperatureDisplay />
    </Container>
  );
};

export default TemperaturePage;
