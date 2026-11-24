import React, { useState, useEffect } from 'react';
import { Card, Button } from 'react-bootstrap';
import { database } from '../../firebase/config';
import { ref, onValue, get } from 'firebase/database';
import { FaSync } from 'react-icons/fa';
import DirectSensorDisplay from '../widgets/DirectSensorDisplay';

// Composant ultra-simple pour déboguer la connexion Firebase
const FirebaseDebugger: React.FC = () => {
  // État pour stocker les données brutes
  const [rawData, setRawData] = useState<any>(null);
  // État pour suivre le chargement
  const [loading, setLoading] = useState<boolean>(false);
  // État pour stocker les erreurs
  const [error, setError] = useState<string | null>(null);
  // État pour suivre la dernière mise à jour
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  // État pour stocker l'ID du projet Firebase
  const [projectId, setProjectId] = useState<string>('');

  // Fonction pour rafraîchir manuellement les données
  const refreshData = async () => {
    setLoading(true);
    try {
      // Référence à la racine de la base de données
      const dataRef = ref(database, '/');
      const snapshot = await get(dataRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('Données reçues (rafraîchissement manuel):', data);
        setRawData(data);
        setLastUpdate(new Date());
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
    console.log('Initialisation de la connexion Firebase pour FirebaseDebugger');
    setLoading(true);

    // Récupérer l'ID du projet Firebase
    try {
      // @ts-ignore
      const firebaseConfig = database._app.options;
      setProjectId(firebaseConfig.projectId || 'Inconnu');
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'ID du projet Firebase:', error);
    }

    // Référence à la racine de la base de données
    const dataRef = ref(database, '/');

    // S'abonner aux mises à jour en temps réel
    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('FirebaseDebugger - Nouvelles données reçues:', data);
        setRawData(data);
        setLastUpdate(new Date());
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
      console.log('Nettoyage de la connexion Firebase pour FirebaseDebugger');
      unsubscribe();
    };
  }, []);

  return (
    <div className="mb-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Débogueur Firebase</h1>
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

      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Informations de connexion</h5>
        </Card.Header>
        <Card.Body>
          <p><strong>Projet Firebase:</strong> {projectId}</p>
          <p><strong>État de la connexion:</strong> {error ? 'Erreur' : 'Connecté'}</p>
          <p><strong>Dernière mise à jour:</strong> {lastUpdate.toLocaleString()}</p>
        </Card.Body>
      </Card>

      {error && (
        <Card className="mb-4 border-danger">
          <Card.Header className="bg-danger text-white">
            <h5 className="mb-0">Erreur</h5>
          </Card.Header>
          <Card.Body>
            <p>{error}</p>
          </Card.Body>
        </Card>
      )}

      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Données brutes de Firebase</h5>
        </Card.Header>
        <Card.Body>
          {rawData ? (
            <pre className="bg-light p-3 rounded" style={{ maxHeight: '500px', overflow: 'auto' }}>
              {JSON.stringify(rawData, null, 2)}
            </pre>
          ) : (
            <p>Aucune donnée disponible.</p>
          )}
        </Card.Body>
      </Card>

      {/* Afficher les capteurs avec le nouveau composant DirectSensorDisplay */}
      <DirectSensorDisplay />
    </div>
  );
};

export default FirebaseDebugger;
