import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Alert } from 'react-bootstrap';
import { database } from '../../firebase/config';
import { ref, onValue, get } from 'firebase/database';
import { FaSync } from 'react-icons/fa';

// Composant simple pour afficher les données en temps réel
const SimpleRealTimeDisplay: React.FC = () => {
  // État pour stocker les données brutes
  const [rawData, setRawData] = useState<any>(null);
  // État pour suivre le chargement
  const [loading, setLoading] = useState<boolean>(true);
  // État pour stocker les erreurs
  const [error, setError] = useState<string | null>(null);
  // État pour suivre la dernière mise à jour
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Fonction pour rafraîchir manuellement les données
  const refreshData = async () => {
    setLoading(true);
    try {
      const dataRef = ref(database, '/');
      const snapshot = await get(dataRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('Données reçues (rafraîchissement manuel):', data);

        // Vérifier si les données sont dans sensor_data
        if (data && typeof data === 'object' && 'sensor_data' in data) {
          console.log('Données trouvées dans sensor_data (rafraîchissement manuel)');

          // Trouver la dernière entrée dans sensor_data
          const sensorEntries = Object.values(data.sensor_data);
          if (sensorEntries.length > 0) {
            // Trier par timestamp (du plus récent au plus ancien)
            const sortedEntries = sensorEntries.sort((a: any, b: any) => {
              if (!a.timestamp || !b.timestamp) return 0;
              return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            });

            // Prendre la première entrée (la plus récente)
            const latestEntry = sortedEntries[0] as any;
            console.log('Entrée la plus récente (rafraîchissement manuel):', latestEntry);

            // Mettre à jour les données brutes avec la dernière entrée
            setRawData({
              ...latestEntry,  // Utiliser les données de la dernière entrée comme base
              sensor_data: data.sensor_data  // Conserver l'historique complet pour référence
            });
            setLastUpdate(new Date(latestEntry.timestamp || new Date()));
          } else {
            setRawData(data);
            setLastUpdate(new Date());
          }
        } else {
          // Utiliser les données telles quelles
          setRawData(data);
          setLastUpdate(new Date());
        }

        setError(null);
      } else {
        console.log('Aucune donnée trouvée (rafraîchissement manuel)');
        setError('Aucune donnée trouvée dans Firebase.');
      }
    } catch (error) {
      console.error('Erreur lors du rafraîchissement des données:', error);
      setError(`Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  // Effet pour s'abonner aux mises à jour en temps réel
  useEffect(() => {
    console.log('Initialisation de la connexion Firebase en temps réel');
    setLoading(true);

    // Référence à la racine de la base de données
    const dataRef = ref(database, '/');

    // S'abonner aux mises à jour en temps réel
    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('Nouvelles données reçues en temps réel:', data);

        // Vérifier si les données sont dans sensor_data
        if (data && typeof data === 'object' && 'sensor_data' in data) {
          console.log('Données trouvées dans sensor_data');

          // Trouver la dernière entrée dans sensor_data
          const sensorEntries = Object.values(data.sensor_data);
          if (sensorEntries.length > 0) {
            // Trier par timestamp (du plus récent au plus ancien)
            const sortedEntries = sensorEntries.sort((a: any, b: any) => {
              if (!a.timestamp || !b.timestamp) return 0;
              return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            });

            // Prendre la première entrée (la plus récente)
            const latestEntry = sortedEntries[0] as any;
            console.log('Entrée la plus récente:', latestEntry);

            // Mettre à jour les données brutes avec la dernière entrée
            setRawData({
              ...latestEntry,  // Utiliser les données de la dernière entrée comme base
              sensor_data: data.sensor_data  // Conserver l'historique complet pour référence
            });
            setLastUpdate(new Date(latestEntry.timestamp || new Date()));
          } else {
            setRawData(data);
            setLastUpdate(new Date());
          }
        } else {
          // Utiliser les données telles quelles
          setRawData(data);
          setLastUpdate(new Date());
        }

        setError(null);
      } else {
        console.log('Aucune donnée trouvée (temps réel)');
        setError('Aucune donnée trouvée dans Firebase.');
      }
      setLoading(false);
    }, (error) => {
      console.error('Erreur lors de la récupération des données en temps réel:', error);
      setError(`Erreur: ${error.message}`);
      setLoading(false);
    });

    // Nettoyer l'abonnement lors du démontage du composant
    return () => {
      console.log('Nettoyage de la connexion Firebase');
      unsubscribe();
    };
  }, []);

  // Fonction pour formater une valeur
  const formatValue = (value: any): string => {
    if (value === undefined || value === null) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
    if (typeof value === 'number') return value.toFixed(2);
    return String(value);
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Données en temps réel</h1>
        <div>
          <small className="me-3 text-muted">
            Dernière mise à jour: {lastUpdate.toLocaleTimeString()}
          </small>
          <Button
            variant="outline-primary"
            size="sm"
            onClick={refreshData}
            disabled={loading}
            className="d-flex align-items-center"
          >
            <span className={`me-2 ${loading ? 'fa-spin' : ''}`}>
              <FaSync size={16} />
            </span>
            {loading ? 'Mise à jour...' : 'Actualiser'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}

      {loading && !rawData ? (
        <div className="text-center my-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Chargement...</span>
          </div>
          <p className="mt-3">Chargement des données...</p>
        </div>
      ) : (
        <>
          {rawData ? (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">Données brutes de Firebase</h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  {Object.entries(rawData).map(([key, value]) => (
                    <Col key={key} md={3} sm={6} className="mb-3">
                      <Card>
                        <Card.Body>
                          <Card.Title>{key}</Card.Title>
                          <Card.Text className="fs-4">
                            {formatValue(value)}
                            {key === 'temperature' && ' °C'}
                            {key.includes('humidity') && ' %'}
                            {key === 'water_level' && ' %'}
                          </Card.Text>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>

                <div className="mt-4">
                  <h6>Données JSON brutes:</h6>
                  <pre className="bg-light p-3 rounded">
                    {JSON.stringify(rawData, null, 2)}
                  </pre>
                </div>
              </Card.Body>
            </Card>
          ) : (
            <Alert variant="info">
              Aucune donnée disponible. Assurez-vous que votre Raspberry Pi envoie des données à Firebase.
            </Alert>
          )}
        </>
      )}
    </div>
  );
};

export default SimpleRealTimeDisplay;
