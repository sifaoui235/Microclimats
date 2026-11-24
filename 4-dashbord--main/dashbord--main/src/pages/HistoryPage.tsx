import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Alert } from 'react-bootstrap';
import SensorChart from '../components/charts/SensorChart';
import { useThemeContext } from '../hooks/ThemeContext';
import { subscribeToAllChambers, convertToChamberSensors } from '../services/DualFirebaseLoader.service';

interface DualMilieuState {
  ch1: any[];
  ch2: any[];
  loading: boolean;
  error: string | null;
}

const HistoryPage: React.FC = () => {
  const { darkMode } = useThemeContext();
  const [state, setState] = useState<DualMilieuState>({
    ch1: [],
    ch2: [],
    loading: true,
    error: null
  });
  const [selectedMilieu, setSelectedMilieu] = useState<string>('ch1');
  const [selectedSensor, setSelectedSensor] = useState<string>('');
  const [currentSensor, setCurrentSensor] = useState<any | null>(null);

  // Fonction pour mettre à jour les capteurs d'un milieu
  const updateMilieuSensors = (chamberId: 'ch1' | 'ch2', data: any, error?: any) => {
    setState(prevState => {
      if (error) {
        return {
          ...prevState,
          error: error.message || 'Erreur de chargement',
          loading: false
        };
      }

      if (data) {
        const sensors = convertToChamberSensors(data, chamberId, chamberId === 'ch1' ? 'Milieu 1' : 'Milieu 2');
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
    console.log('🔄 Initialisation de la page historique');

    // Callbacks pour les mises à jour
    const handleCh1Update = (data: any, error?: any) => updateMilieuSensors('ch1', data, error);
    const handleCh2Update = (data: any, error?: any) => updateMilieuSensors('ch2', data, error);

    // S'abonner aux mises à jour
    const unsubscribe = subscribeToAllChambers(handleCh1Update, handleCh2Update);

    return () => {
      console.log('🔄 Nettoyage de la page historique');
      unsubscribe();
    };
  }, []);

  // Obtenir les capteurs du milieu sélectionné
  const getCurrentMilieuSensors = () => {
    if (selectedMilieu === 'ch1') {
      return state.ch1.filter(sensor => !sensor.id.includes('water_level'));
    } else if (selectedMilieu === 'ch2') {
      return state.ch2.filter(sensor => !sensor.id.includes('water_level'));
    } else if (selectedMilieu === 'water') {
      // Pour le niveau d'eau, récupérer le premier capteur de niveau d'eau trouvé
      // car c'est une valeur unique (un seul réservoir)
      const ch1WaterSensors = state.ch1.filter(sensor => sensor.id.includes('water_level'));
      const ch2WaterSensors = state.ch2.filter(sensor => sensor.id.includes('water_level'));
      const allWaterSensors = [...ch1WaterSensors, ...ch2WaterSensors];

      console.log('🔍 Debug niveau d\'eau:');
      console.log('- ch1WaterSensors:', ch1WaterSensors);
      console.log('- ch2WaterSensors:', ch2WaterSensors);
      console.log('- allWaterSensors:', allWaterSensors);

      // Retourner seulement le premier capteur trouvé car c'est la même valeur
      return allWaterSensors.length > 0 ? [allWaterSensors[0]] : [];
    }
    return [];
  };

  const currentMilieuSensors = getCurrentMilieuSensors();

  // Debug pour voir l'état des capteurs
  console.log('🔍 Debug état des capteurs:');
  console.log('- selectedMilieu:', selectedMilieu);
  console.log('- state.ch1:', state.ch1);
  console.log('- state.ch2:', state.ch2);
  console.log('- currentMilieuSensors:', currentMilieuSensors);
  console.log('- selectedSensor:', selectedSensor);

  // Set the first sensor as selected when milieu or data changes
  useEffect(() => {
    if (currentMilieuSensors.length > 0) {
      // Pour le niveau d'eau, toujours sélectionner automatiquement le capteur unique
      if (selectedMilieu === 'water') {
        setSelectedSensor(currentMilieuSensors[0].id);
      } else if (!selectedSensor || !currentMilieuSensors.find(s => s.id === selectedSensor)) {
        setSelectedSensor(currentMilieuSensors[0].id);
      }
    } else {
      setSelectedSensor('');
    }
  }, [currentMilieuSensors, selectedMilieu, selectedSensor]);

  // Update current sensor when selection changes
  useEffect(() => {
    if (selectedSensor) {
      const sensor = currentMilieuSensors.find(s => s.id === selectedSensor);
      setCurrentSensor(sensor || null);
    } else {
      setCurrentSensor(null);
    }
  }, [selectedSensor, currentMilieuSensors]);

  return (
    <div>
      <h1 className="mb-4">Historique des Mesures</h1>

      {/* Message when no sensors are found */}
      {(state.ch1.length === 0 && state.ch2.length === 0) && !state.loading && (
        <div className="mb-4">
          <Alert variant="info">
            Aucune donnée de capteur trouvée. Assurez-vous que votre Raspberry Pi envoie des données à Firebase.
          </Alert>
        </div>
      )}

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
          <p className="mt-3">Chargement des données...</p>
        </div>
      ) : (
        <>
          {(state.ch1.length > 0 || state.ch2.length > 0) && (
            <>
              <Row className="mb-4">
                <Col md={6}>
                  <Card
                    bg={darkMode ? 'dark' : 'light'}
                    text={darkMode ? 'light' : 'dark'}
                    className="shadow-sm"
                  >
                    <Card.Body>
                      <Form.Group>
                        <Form.Label>Sélectionner un milieu</Form.Label>
                        <Form.Select
                          value={selectedMilieu}
                          onChange={(e) => setSelectedMilieu(e.target.value)}
                          className={darkMode ? 'bg-dark text-light' : ''}
                        >
                          <option value="ch1">Milieu 1</option>
                          <option value="ch2">Milieu 2</option>
                          <option value="water">Niveau d'eau</option>
                        </Form.Select>
                      </Form.Group>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={6}>
                  <Card
                    bg={darkMode ? 'dark' : 'light'}
                    text={darkMode ? 'light' : 'dark'}
                    className="shadow-sm"
                  >
                    <Card.Body>
                      <Form.Group>
                        <Form.Label>Sélectionner un capteur</Form.Label>
                        {selectedMilieu === 'water' ? (
                          <>
                            <Form.Select
                              value={selectedSensor}
                              className={darkMode ? 'bg-dark text-light' : ''}
                              disabled={true}
                            >
                              <option value={selectedSensor}>
                                Niveau d'eau (valeur unique)
                              </option>
                            </Form.Select>
                            <Form.Text className="text-muted">
                              Le niveau d'eau est une valeur unique partagée (un seul réservoir)
                            </Form.Text>
                          </>
                        ) : (
                          <Form.Select
                            value={selectedSensor}
                            onChange={(e) => setSelectedSensor(e.target.value)}
                            className={darkMode ? 'bg-dark text-light' : ''}
                            disabled={currentMilieuSensors.length === 0}
                          >
                            {currentMilieuSensors.length === 0 ? (
                              <option value="">Aucun capteur disponible</option>
                            ) : (
                              currentMilieuSensors.map((sensor: any) => (
                                <option key={sensor.id} value={sensor.id}>
                                  {sensor.name}
                                </option>
                              ))
                            )}
                          </Form.Select>
                        )}
                      </Form.Group>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>

              {currentSensor && (
                <>
                  <Row>
                    <Col>
                      <Card
                        bg={darkMode ? 'dark' : 'light'}
                        text={darkMode ? 'light' : 'dark'}
                        className="shadow-sm"
                      >
                        <Card.Body>
                          <div style={{ height: '400px' }}>
                            <SensorChart sensor={currentSensor} />
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  </Row>


                </>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

export default HistoryPage;
