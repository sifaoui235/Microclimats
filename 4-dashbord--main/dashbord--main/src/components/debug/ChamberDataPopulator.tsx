import React, { useState } from 'react';
import { Card, Button, Alert, Row, Col, Badge } from 'react-bootstrap';
import { FaDatabase, FaPlay, FaStop, FaTrash, FaCheckCircle } from 'react-icons/fa';
import { ref, set } from 'firebase/database';
import { database } from '../../firebase/config';
import { generateMockChamberData } from '../../data/mockChamberData';

/**
 * Composant pour peupler Firebase avec des données de test
 */
const ChamberDataPopulator: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'danger' | 'info'; text: string } | null>(null);
  const [simulationActive, setSimulationActive] = useState(false);
  const [simulationInterval, setSimulationInterval] = useState<NodeJS.Timeout | null>(null);

  const showMessage = (type: 'success' | 'danger' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  /**
   * Ajoute des données de test pour les deux chambres
   */
  const populateTestData = async () => {
    setLoading(true);
    try {
      // Générer des données pour les deux chambres
      const ch1Data: any = generateMockChamberData('ch1', {
        temperature: 21.5,
        humidity_air: 62,
        humidity_soil: 75,
        water_level: 80,
        pump_active: false,
        light: 450
      });

      const ch2Data: any = generateMockChamberData('ch2', {
        temperature: 23.2,
        humidity_air: 68,
        humidity_soil: 70,
        water_level: 75,
        pump_active: true,
        light: 520
      });

      // Structure Firebase
      const chamberData = {
        chambre: {
          ch1: {
            sensors: {
              temperature: ch1Data.temperature,
              humidity_air: ch1Data.humidity_air,
              humidity_soil: ch1Data.humidity_soil,
              water_level: ch1Data.water_level,
              pump_active: ch1Data.pump_active,
              light: ch1Data.light,
              timestamp: new Date().toISOString()
            }
          },
          ch2: {
            sensors: {
              temperature: ch2Data.temperature,
              humidity_air: ch2Data.humidity_air,
              humidity_soil: ch2Data.humidity_soil,
              water_level: ch2Data.water_level,
              pump_active: ch2Data.pump_active,
              light: ch2Data.light,
              timestamp: new Date().toISOString()
            }
          }
        }
      };

      // Écrire dans Firebase
      const chamberRef = ref(database, '/');
      await set(chamberRef, chamberData);

      showMessage('success', 'Données de test ajoutées avec succès ! Rafraîchissez le dashboard pour voir les changements.');

    } catch (error: any) {
      console.error('Erreur:', error);
      showMessage('danger', `Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Démarre la simulation en temps réel
   */
  const startSimulation = () => {
    if (simulationActive) return;

    const updateData = async () => {
      try {
        const ch1Data: any = generateMockChamberData('ch1');
        const ch2Data: any = generateMockChamberData('ch2');

        const updates = {
          'chambre/ch1/sensors': ch1Data,
          'chambre/ch2/sensors': ch2Data
        };

        const promises = Object.entries(updates).map(([path, data]) => {
          const updateRef = ref(database, path);
          return set(updateRef, data);
        });

        await Promise.all(promises);
        console.log('Données mises à jour:', new Date().toLocaleTimeString());

      } catch (error) {
        console.error('Erreur lors de la mise à jour:', error);
      }
    };

    // Première mise à jour
    updateData();

    // Puis toutes les 10 secondes
    const interval = setInterval(updateData, 10000);
    setSimulationInterval(interval);
    setSimulationActive(true);

    showMessage('info', 'Simulation temps réel démarrée (mise à jour toutes les 10 secondes)');
  };

  /**
   * Arrête la simulation
   */
  const stopSimulation = () => {
    if (simulationInterval) {
      clearInterval(simulationInterval);
      setSimulationInterval(null);
    }
    setSimulationActive(false);
    showMessage('info', 'Simulation temps réel arrêtée');
  };

  /**
   * Nettoie les données de test
   */
  const clearData = async () => {
    setLoading(true);
    try {
      const chamberRef = ref(database, 'chambre');
      await set(chamberRef, null);

      showMessage('success', 'Données de test supprimées');

    } catch (error: any) {
      console.error('Erreur:', error);
      showMessage('danger', `Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Ajoute des données avec alertes pour tester les seuils
   */
  const populateAlertData = async () => {
    setLoading(true);
    try {
      // Données avec alertes pour chambre 1
      const ch1Data: any = generateMockChamberData('ch1', {
        temperature: 32, // Trop chaud
        humidity_air: 30, // Trop sec
        humidity_soil: 45, // Trop sec
        water_level: 15, // Trop bas
        pump_active: true,
        light: 100 // Trop sombre
      });

      // Données normales pour chambre 2
      const ch2Data: any = generateMockChamberData('ch2', {
        temperature: 22,
        humidity_air: 65,
        humidity_soil: 72,
        water_level: 80,
        pump_active: false,
        light: 500
      });

      const chamberData = {
        chambre: {
          ch1: {
            sensors: {
              ...ch1Data,
              timestamp: new Date().toISOString()
            }
          },
          ch2: {
            sensors: {
              ...ch2Data,
              timestamp: new Date().toISOString()
            }
          }
        }
      };

      const chamberRef = ref(database, '/');
      await set(chamberRef, chamberData);

      showMessage('success', 'Données avec alertes ajoutées ! La chambre 1 devrait afficher des alertes.');

    } catch (error: any) {
      console.error('Erreur:', error);
      showMessage('danger', `Erreur: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="shadow-sm">
      <Card.Header className="d-flex align-items-center">
        <FaDatabase className="me-2" />
        <h5 className="mb-0">Générateur de Données de Test</h5>
      </Card.Header>
      <Card.Body>
        {message && (
          <Alert variant={message.type} className="mb-3">
            {message.text}
          </Alert>
        )}

        <Row className="g-3">
          <Col md={6}>
            <div className="d-grid gap-2">
              <Button
                variant="primary"
                onClick={populateTestData}
                disabled={loading}
                className="d-flex align-items-center justify-content-center"
              >
                <FaCheckCircle className="me-2" />
                Ajouter Données Normales
              </Button>

              <Button
                variant="warning"
                onClick={populateAlertData}
                disabled={loading}
                className="d-flex align-items-center justify-content-center"
              >
                <FaCheckCircle className="me-2" />
                Ajouter Données avec Alertes
              </Button>
            </div>
          </Col>

          <Col md={6}>
            <div className="d-grid gap-2">
              {!simulationActive ? (
                <Button
                  variant="success"
                  onClick={startSimulation}
                  disabled={loading}
                  className="d-flex align-items-center justify-content-center"
                >
                  <FaPlay className="me-2" />
                  Démarrer Simulation
                </Button>
              ) : (
                <Button
                  variant="danger"
                  onClick={stopSimulation}
                  className="d-flex align-items-center justify-content-center"
                >
                  <FaStop className="me-2" />
                  Arrêter Simulation
                </Button>
              )}

              <Button
                variant="outline-danger"
                onClick={clearData}
                disabled={loading}
                className="d-flex align-items-center justify-content-center"
              >
                <FaTrash className="me-2" />
                Nettoyer Données
              </Button>
            </div>
          </Col>
        </Row>

        <hr />

        <div className="text-center">
          <h6>État de la Simulation</h6>
          <Badge bg={simulationActive ? 'success' : 'secondary'} pill>
            {simulationActive ? 'ACTIVE' : 'ARRÊTÉE'}
          </Badge>
          {simulationActive && (
            <div className="mt-2">
              <small className="text-muted">
                Mise à jour automatique toutes les 10 secondes
              </small>
            </div>
          )}
        </div>

        <hr />

        <div className="text-muted">
          <h6>Instructions :</h6>
          <ul className="mb-0">
            <li><strong>Données Normales :</strong> Ajoute des données réalistes pour les deux chambres</li>
            <li><strong>Données avec Alertes :</strong> Ajoute des données hors seuils pour tester les alertes</li>
            <li><strong>Simulation :</strong> Met à jour les données automatiquement toutes les 10 secondes</li>
            <li><strong>Nettoyer :</strong> Supprime toutes les données de test</li>
          </ul>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ChamberDataPopulator;
