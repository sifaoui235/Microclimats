import React, { useState, useEffect } from 'react';
import { Card } from 'react-bootstrap';
import { database } from '../../firebase/config';
import { ref, onValue } from 'firebase/database';

// Composant ultra-simple qui affiche uniquement la température
const TemperatureDisplay: React.FC = () => {
  // État pour stocker la valeur de température
  const [temperature, setTemperature] = useState<number | null>(null);
  // État pour stocker les données brutes complètes
  const [rawData, setRawData] = useState<any>(null);
  // État pour suivre la dernière mise à jour
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  // Effet pour s'abonner aux mises à jour en temps réel
  useEffect(() => {
    console.log('Initialisation de la connexion Firebase pour TemperatureDisplay');
    
    // Référence à la racine de la base de données
    const dataRef = ref(database, '/');
    
    // S'abonner aux mises à jour en temps réel
    const unsubscribe = onValue(dataRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('TemperatureDisplay - Nouvelles données reçues:', data);
        
        // Stocker les données brutes complètes
        setRawData(data);
        
        // Essayer d'extraire la température
        try {
          // Vérifier si la température est directement à la racine
          if (data && 'temperature' in data) {
            const temp = data.temperature;
            console.log('Température trouvée directement:', temp);
            if (typeof temp === 'number') {
              setTemperature(temp);
            } else if (typeof temp === 'string' && !isNaN(parseFloat(temp))) {
              setTemperature(parseFloat(temp));
            }
          } 
          // Vérifier si les données sont dans un sous-nœud
          else {
            const keys = Object.keys(data);
            for (const key of keys) {
              const subData = data[key];
              if (typeof subData === 'object' && subData !== null && 'temperature' in subData) {
                const temp = subData.temperature;
                console.log('Température trouvée dans sous-nœud:', temp);
                if (typeof temp === 'number') {
                  setTemperature(temp);
                } else if (typeof temp === 'string' && !isNaN(parseFloat(temp))) {
                  setTemperature(parseFloat(temp));
                }
                break;
              }
            }
          }
        } catch (error) {
          console.error('Erreur lors de l\'extraction de la température:', error);
        }
        
        setLastUpdate(new Date());
      }
    });
    
    // Nettoyer l'abonnement lors du démontage du composant
    return () => {
      console.log('Nettoyage de la connexion Firebase pour TemperatureDisplay');
      unsubscribe();
    };
  }, []);

  return (
    <div>
      <h2>Température</h2>
      <p>Dernière mise à jour: {lastUpdate.toLocaleTimeString()}</p>
      
      <Card>
        <Card.Body>
          <h1 className="display-1 text-center">
            {temperature !== null ? temperature.toFixed(1) : 'N/A'} °C
          </h1>
        </Card.Body>
      </Card>
      
      <div className="mt-4">
        <h4>Données brutes:</h4>
        <pre className="bg-light p-3 rounded" style={{ maxHeight: '300px', overflow: 'auto' }}>
          {JSON.stringify(rawData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default TemperatureDisplay;
