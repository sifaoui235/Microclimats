import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Table, Alert, Badge } from 'react-bootstrap';
import { useThemeContext } from '../hooks/ThemeContext';
import { subscribeToAllChambers, convertToChamberSensors } from '../services/DualFirebaseLoader.service';

// Interface pour l'état des milieux
interface MilieuSensorsState {
  ch1: any[];
  ch2: any[];
  loading: boolean;
  error: string | null;
}

const SensorsPage: React.FC = () => {
  const { darkMode } = useThemeContext();
  const [state, setState] = useState<MilieuSensorsState>({
    ch1: [],
    ch2: [],
    loading: true,
    error: null
  });

  // Fonction pour mettre à jour les capteurs d'un milieu
  const updateMilieuSensors = (chamberId: 'ch1' | 'ch2', data: any, error?: any) => {
    setState(prevState => {
      if (error) {
        return {
          ...prevState,
          error: error.message,
          loading: false
        };
      } else if (data) {
        const sensors = convertToChamberSensors(
          data,
          chamberId,
          chamberId === 'ch1' ? 'Premier Milieu' : 'Deuxième Milieu'
        );

        return {
          ...prevState,
          [chamberId]: sensors,
          loading: false,
          error: null
        };
      }
      return prevState;
    });
  };

  // Effet pour s'abonner aux données des milieux
  useEffect(() => {
    console.log('🔄 Initialisation de la page capteurs');

    // Callbacks pour les mises à jour
    const handleCh1Update = (data: any, error?: any) => updateMilieuSensors('ch1', data, error);
    const handleCh2Update = (data: any, error?: any) => updateMilieuSensors('ch2', data, error);

    // S'abonner aux mises à jour
    const unsubscribe = subscribeToAllChambers(handleCh1Update, handleCh2Update);

    // Nettoyage
    return () => {
      unsubscribe();
    };
  }, []);

  // Fonction pour rendre un tableau de capteurs
  const renderSensorsTable = (sensors: any[], title: string, color: string) => (
    <Card
      bg={darkMode ? 'dark' : 'light'}
      text={darkMode ? 'light' : 'dark'}
      className="shadow-sm mb-4"
    >
      <Card.Header style={{ backgroundColor: color, color: 'white' }}>
        <h5 className="mb-0">{title}</h5>
      </Card.Header>
      <Card.Body>
        {sensors.length === 0 ? (
          <div className="text-center p-4">
            <p>Aucun capteur trouvé pour ce milieu.</p>
          </div>
        ) : (
          <Table
            responsive
            striped
            bordered
            hover
            variant={darkMode ? 'dark' : 'light'}
          >
            <thead>
              <tr>
                <th>Nom</th>
                <th>Description</th>
                <th>Valeur Actuelle</th>
                <th>Unité</th>
                <th>Seuil Min</th>
                <th>Seuil Max</th>
                <th>État</th>
              </tr>
            </thead>
            <tbody>
              {sensors.map((sensor: any) => (
                <tr key={sensor.id}>
                  <td>{sensor.name}</td>
                  <td>{sensor.description}</td>
                  <td className={sensor.isAlert ? 'text-danger' : 'text-success'}>
                    {typeof sensor.currentValue === 'number'
                      ? sensor.currentValue.toFixed(1)
                      : typeof sensor.currentValue === 'object' && sensor.currentValue !== null
                        ? `R:${sensor.currentValue.r} G:${sensor.currentValue.g} B:${sensor.currentValue.b}`
                        : sensor.currentValue}
                  </td>
                  <td>{sensor.unit}</td>
                  <td>{sensor.minThreshold}</td>
                  <td>{sensor.maxThreshold}</td>
                  <td>
                    <Badge bg={sensor.isAlert ? 'danger' : 'success'}>
                      {sensor.isAlert ? 'Alerte' : 'Normal'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card.Body>
    </Card>
  );

  return (
    <div>
      <div className="mb-4">
        <h1>Liste des Capteurs</h1>
        <p className="text-muted">Capteurs utilisés dans les deux milieux de culture</p>
      </div>

      {state.error && (
        <Alert variant="danger" className="mb-4">
          Erreur: {state.error}
        </Alert>
      )}

      {state.loading ? (
        <div className="text-center my-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3">Chargement des capteurs...</p>
        </div>
      ) : (
        <Row>
          <Col>
            {/* Tableau des capteurs du Premier Milieu */}
            {renderSensorsTable(state.ch1, 'Liste des capteurs du Premier Milieu', '#007bff')}

            {/* Tableau des capteurs du Deuxième Milieu */}
            {renderSensorsTable(state.ch2, 'Liste des capteurs du Deuxième Milieu', '#fd7e14')}
          </Col>
        </Row>
      )}
    </div>
  );
};

export default SensorsPage;
