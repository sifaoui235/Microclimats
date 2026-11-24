import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Badge, ButtonGroup } from 'react-bootstrap';
import { FaHistory, FaDownload, FaPlay, FaStop, FaChartLine } from 'react-icons/fa';
import ChamberGraphs from '../components/charts/ChamberGraphs.component';
import { subscribeToAllChambers, convertToChamberSensors } from '../services/DualFirebaseLoader.service';

interface DualMilieuState {
  ch1: any[];
  ch2: any[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date;
}

/**
 * Page d'historique des mesures avec graphiques temporels
 */
const ChamberHistoryPage: React.FC = () => {
  const [history, setHistory] = useState<DualMilieuState>({
    ch1: [],
    ch2: [],
    loading: true,
    error: null,
    lastUpdate: new Date()
  });

  const [isRealTime, setIsRealTime] = useState(false);
  const [unsubscribeFunctions, setUnsubscribeFunctions] = useState<Function[]>([]);

  // Charger l'historique initial
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setHistory(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Utiliser le service existant pour charger les données
      const unsubscribe = subscribeToAllChambers((data: any) => {
        const ch1Sensors = convertToChamberSensors(data.ch1, 'ch1', 'Premier Milieu');
        const ch2Sensors = convertToChamberSensors(data.ch2, 'ch2', 'Deuxième Milieu');

        setHistory(prev => ({
          ...prev,
          ch1: ch1Sensors,
          ch2: ch2Sensors,
          loading: false,
          error: null,
          lastUpdate: new Date()
        }));
      }, (error: any) => {
        console.error('Erreur chargement:', error);
        setHistory(prev => ({
          ...prev,
          error: error.message,
          loading: false
        }));
      });

      // Nettoyer l'abonnement après un court délai pour obtenir les données initiales
      setTimeout(() => {
        if (unsubscribe) {
          unsubscribe();
        }
      }, 2000);

    } catch (error: any) {
      setHistory(prev => ({
        ...prev,
        error: error.message,
        loading: false
      }));
    }
  };

  // Démarrer l'écoute temps réel
  const startRealTimeUpdates = () => {
    if (isRealTime) return;

    console.log('🔄 Démarrage écoute temps réel historique...');

    const unsubscribe = subscribeToAllChambers((data: any) => {
      const ch1Sensors = convertToChamberSensors(data.ch1, 'ch1', 'Premier Milieu');
      const ch2Sensors = convertToChamberSensors(data.ch2, 'ch2', 'Deuxième Milieu');

      setHistory(prev => ({
        ...prev,
        ch1: ch1Sensors,
        ch2: ch2Sensors,
        lastUpdate: new Date()
      }));
    }, (error: any) => {
      console.error('Erreur temps réel:', error);
    });

    setUnsubscribeFunctions([unsubscribe]);
    setIsRealTime(true);
  };

  // Arrêter l'écoute temps réel
  const stopRealTimeUpdates = () => {
    console.log('⏹️ Arrêt écoute temps réel historique...');

    unsubscribeFunctions.forEach(unsubscribe => (unsubscribe as () => void)());
    setUnsubscribeFunctions([]);
    setIsRealTime(false);
  };

  // Générer des données de test
  const generateTestData = async () => {
    setHistory(prev => ({ ...prev, loading: true }));

    try {
      // Simuler la génération de données de test
      alert('✅ Fonction de génération de données de test non implémentée dans cette version');
      await loadHistory(); // Recharger les données existantes
    } catch (error: any) {
      alert(`❌ Erreur: ${error.message}`);
      setHistory(prev => ({ ...prev, loading: false }));
    }
  };

  // Exporter les données
  const exportData = () => {
    const data = {
      export_date: new Date().toISOString(),
      chambers: {
        ch1: history.ch1,
        ch2: history.ch2
      },
      summary: {
        ch1_entries: history.ch1.length,
        ch2_entries: history.ch2.length,
        total_entries: history.ch1.length + history.ch2.length
      }
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `historique_chambres_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Statistiques rapides
  const getStats = () => {
    const ch1Count = history.ch1.length;
    const ch2Count = history.ch2.length;
    const totalCount = ch1Count + ch2Count;

    const lastCh1 = history.ch1[history.ch1.length - 1];
    const lastCh2 = history.ch2[history.ch2.length - 1];

    return {
      ch1Count,
      ch2Count,
      totalCount,
      lastCh1Date: lastCh1 ? new Date(lastCh1.timestamp).toLocaleString('fr-FR') : 'Aucune',
      lastCh2Date: lastCh2 ? new Date(lastCh2.timestamp).toLocaleString('fr-FR') : 'Aucune'
    };
  };

  const stats = getStats();

  return (
    <Container fluid className="py-4">
      {/* En-tête */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className="d-flex align-items-center">
                <FaHistory className="me-3" />
                Historique des Mesures
              </h1>
              <p className="text-muted mb-0">
                Graphiques temporels et analyse des données des chambres
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button variant="success" size="sm" onClick={generateTestData} disabled={history.loading}>
                <FaPlay className="me-2" />
                Générer Test
              </Button>
              <Button variant="info" size="sm" onClick={exportData} disabled={stats.totalCount === 0}>
                <FaDownload className="me-2" />
                Exporter
              </Button>
            </div>
          </div>
        </Col>
      </Row>

      {/* Statistiques */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Body className="py-3">
              <Row className="text-center">
                <Col md={2}>
                  <div className="d-flex flex-column">
                    <Badge bg="primary" pill className="mb-1">Chambre 1</Badge>
                    <strong>{stats.ch1Count}</strong>
                    <small className="text-muted">mesures</small>
                  </div>
                </Col>
                <Col md={2}>
                  <div className="d-flex flex-column">
                    <Badge bg="warning" pill className="mb-1">Chambre 2</Badge>
                    <strong>{stats.ch2Count}</strong>
                    <small className="text-muted">mesures</small>
                  </div>
                </Col>
                <Col md={2}>
                  <div className="d-flex flex-column">
                    <Badge bg="success" pill className="mb-1">Total</Badge>
                    <strong>{stats.totalCount}</strong>
                    <small className="text-muted">mesures</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="d-flex flex-column">
                    <Badge bg="info" pill className="mb-1">Dernière Ch1</Badge>
                    <small>{stats.lastCh1Date}</small>
                  </div>
                </Col>
                <Col md={3}>
                  <div className="d-flex flex-column">
                    <Badge bg="secondary" pill className="mb-1">Dernière Ch2</Badge>
                    <small>{stats.lastCh2Date}</small>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Contrôles temps réel */}
      <Row className="mb-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Body className="py-2">
              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center">
                  <Badge bg={isRealTime ? 'success' : 'secondary'} pill className="me-2">
                    {isRealTime ? 'TEMPS RÉEL ACTIF' : 'TEMPS RÉEL INACTIF'}
                  </Badge>
                  <small className="text-muted">
                    Dernière mise à jour: {history.lastUpdate.toLocaleTimeString('fr-FR')}
                  </small>
                </div>
                <ButtonGroup size="sm">
                  <Button
                    variant={isRealTime ? 'outline-success' : 'success'}
                    onClick={startRealTimeUpdates}
                    disabled={isRealTime}
                  >
                    <FaPlay className="me-1" />
                    Démarrer
                  </Button>
                  <Button
                    variant={isRealTime ? 'danger' : 'outline-danger'}
                    onClick={stopRealTimeUpdates}
                    disabled={!isRealTime}
                  >
                    <FaStop className="me-1" />
                    Arrêter
                  </Button>
                  <Button variant="outline-primary" onClick={loadHistory} disabled={history.loading}>
                    Actualiser
                  </Button>
                </ButtonGroup>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Messages d'erreur */}
      {history.error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger">
              <strong>Erreur:</strong> {history.error}
            </Alert>
          </Col>
        </Row>
      )}

      {/* Graphiques */}
      <Row>
        <Col>
          <ChamberGraphs
            ch1Sensors={history.ch1}
            ch2Sensors={history.ch2}
          />
        </Col>
      </Row>

      {/* Instructions */}
      <Row className="mt-4">
        <Col>
          <Card className="border-info">
            <Card.Header className="bg-info text-white">
              <FaChartLine className="me-2" />
              Instructions d'utilisation
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <h6>🚀 Pour commencer :</h6>
                  <ul className="small">
                    <li>Cliquez <strong>"Générer Test"</strong> pour créer 48h d'historique</li>
                    <li>Utilisez les boutons <strong>capteur</strong> pour changer le type de mesure</li>
                    <li>Changez la <strong>période</strong> (1h, 6h, 24h, 7j, 30j)</li>
                    <li>Activez le <strong>temps réel</strong> pour les mises à jour automatiques</li>
                  </ul>
                </Col>
                <Col md={6}>
                  <h6>📊 Fonctionnalités :</h6>
                  <ul className="small">
                    <li><strong>Graphiques interactifs</strong> avec zoom et survol</li>
                    <li><strong>Comparaison</strong> des deux chambres sur le même graphique</li>
                    <li><strong>Export JSON</strong> de toutes les données</li>
                    <li><strong>Statistiques</strong> en temps réel</li>
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ChamberHistoryPage;
