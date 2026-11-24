import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Badge, Row, Col } from 'react-bootstrap';
import { FaCheckCircle, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

// Interface pour les diagnostics
interface DiagnosticItem {
  status: 'loading' | 'success' | 'warning' | 'error';
  message: string;
}

interface DiagnosticsState {
  firebase: DiagnosticItem;
  services: DiagnosticItem;
  components: DiagnosticItem;
  data: DiagnosticItem;
}

/**
 * Composant de diagnostic rapide pour identifier les problèmes
 */
const QuickDiagnostic: React.FC = () => {
  const [diagnostics, setDiagnostics] = useState<DiagnosticsState>({
    firebase: { status: 'loading', message: 'Test en cours...' },
    services: { status: 'loading', message: 'Test en cours...' },
    components: { status: 'loading', message: 'Test en cours...' },
    data: { status: 'loading', message: 'Test en cours...' }
  });

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    console.log('🔍 Démarrage des diagnostics...');

    // Test 1: Firebase
    try {
      const { database } = await import('../../firebase/config');
      if (database) {
        setDiagnostics(prev => ({
          ...prev,
          firebase: { status: 'success', message: 'Firebase configuré correctement' }
        }));
      } else {
        setDiagnostics(prev => ({
          ...prev,
          firebase: { status: 'error', message: 'Firebase non configuré' }
        }));
      }
    } catch (error: any) {
      setDiagnostics(prev => ({
        ...prev,
        firebase: { status: 'error', message: `Erreur Firebase: ${error.message}` }
      }));
    }

    // Test 2: Services
    try {
      const { testChamberConnectivity } = await import('../../services/DualFirebaseLoader.service');
      const connectivity = await testChamberConnectivity();

      if (connectivity.connected) {
        setDiagnostics(prev => ({
          ...prev,
          services: {
            status: 'success',
            message: `Services OK - Ch1: ${connectivity.chambers?.ch1 ? 'OK' : 'Pas de données'}, Ch2: ${connectivity.chambers?.ch2 ? 'OK' : 'Pas de données'}`
          }
        }));
      } else {
        setDiagnostics(prev => ({
          ...prev,
          services: { status: 'warning', message: 'Services chargés mais pas de connexion Firebase' }
        }));
      }
    } catch (error: any) {
      setDiagnostics(prev => ({
        ...prev,
        services: { status: 'error', message: `Erreur services: ${error.message}` }
      }));
    }

    // Test 3: Composants
    try {
      const ChamberGraphs = await import('../charts/ChamberGraphs.component');
      const PumpUtils = await import('../../utils/PumpStateIndicator.util');

      if (ChamberGraphs && PumpUtils) {
        setDiagnostics(prev => ({
          ...prev,
          components: { status: 'success', message: 'Tous les composants chargés' }
        }));
      }
    } catch (error: any) {
      setDiagnostics(prev => ({
        ...prev,
        components: { status: 'error', message: `Erreur composants: ${error.message}` }
      }));
    }

    // Test 4: Données
    try {
      const { ref, get } = await import('firebase/database');
      const { database } = await import('../../firebase/config');

      const chamberRef = ref(database, '/chambre');
      const snapshot = await get(chamberRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        const ch1Exists = data.ch1?.sensors ? 'OK' : 'Manquant';
        const ch2Exists = data.ch2?.sensors ? 'OK' : 'Manquant';

        setDiagnostics(prev => ({
          ...prev,
          data: {
            status: 'success',
            message: `Données trouvées - Ch1: ${ch1Exists}, Ch2: ${ch2Exists}`
          }
        }));
      } else {
        setDiagnostics(prev => ({
          ...prev,
          data: { status: 'warning', message: 'Aucune donnée dans Firebase' }
        }));
      }
    } catch (error: any) {
      setDiagnostics(prev => ({
        ...prev,
        data: { status: 'error', message: `Erreur données: ${error.message}` }
      }));
    }
  };

  const addTestData = async () => {
    try {
      const { ref, set } = await import('firebase/database');
      const { database } = await import('../../firebase/config');

      const testData = {
        chambre: {
          ch1: {
            sensors: {
              temperature: 21.5,
              humidity_air: 62,
              humidity_soil: 75,
              water_level: 80,
              pump_active: false,
              light: 450,
              timestamp: new Date().toISOString()
            }
          },
          ch2: {
            sensors: {
              temperature: 23.2,
              humidity_air: 68,
              humidity_soil: 70,
              water_level: 75,
              pump_active: true,
              light: 520,
              timestamp: new Date().toISOString()
            }
          }
        }
      };

      const dataRef = ref(database, '/');
      await set(dataRef, testData);

      alert('✅ Données de test ajoutées ! Rafraîchissez la page pour voir les changements.');

    } catch (error: any) {
      alert(`❌ Erreur: ${error.message}`);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <FaCheckCircle className="text-success" />;
      case 'warning':
        return <FaExclamationTriangle className="text-warning" />;
      case 'error':
        return <FaExclamationTriangle className="text-danger" />;
      default:
        return <FaSpinner className="text-info fa-spin" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'success':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
        return 'danger';
      default:
        return 'info';
    }
  };

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">🔍 Diagnostic Système</h5>
        <Button variant="outline-primary" size="sm" onClick={runDiagnostics}>
          Relancer
        </Button>
      </Card.Header>
      <Card.Body>
        <Row className="g-3">
          {(Object.entries(diagnostics) as [keyof DiagnosticsState, DiagnosticItem][]).map(([key, diagnostic]) => (
            <Col key={key} md={6} lg={3}>
              <Alert variant={getStatusVariant(diagnostic.status)} className="mb-0">
                <div className="d-flex align-items-center mb-2">
                  {getStatusIcon(diagnostic.status)}
                  <strong className="ms-2">
                    {key === 'firebase' && 'Firebase'}
                    {key === 'services' && 'Services'}
                    {key === 'components' && 'Composants'}
                    {key === 'data' && 'Données'}
                  </strong>
                </div>
                <small>{diagnostic.message}</small>
              </Alert>
            </Col>
          ))}
        </Row>

        <hr />

        <div className="text-center">
          <h6>Actions Rapides</h6>
          <div className="d-flex gap-2 justify-content-center flex-wrap">
            <Button variant="success" size="sm" onClick={addTestData}>
              Ajouter Données Test
            </Button>
            <Button
              variant="info"
              size="sm"
              onClick={() => window.location.href = '/firebase-test'}
            >
              Page Test Firebase
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.location.reload()}
            >
              Rafraîchir Page
            </Button>
          </div>
        </div>

        <hr />

        <div className="text-muted">
          <h6>Instructions de Dépannage :</h6>
          <ul className="mb-0" style={{ fontSize: '0.9rem' }}>
            <li><strong>Firebase rouge :</strong> Vérifiez la configuration dans src/firebase/config.js</li>
            <li><strong>Services rouge :</strong> Problème de connexion Firebase</li>
            <li><strong>Composants rouge :</strong> Erreur d'import des composants</li>
            <li><strong>Données orange :</strong> Cliquez "Ajouter Données Test"</li>
          </ul>
        </div>
      </Card.Body>
    </Card>
  );
};

export default QuickDiagnostic;
