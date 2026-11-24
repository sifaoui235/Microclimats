import React, { useState } from 'react';
import { Button, Toast, ToastContainer } from 'react-bootstrap';
import { FaPlus, FaSpinner } from 'react-icons/fa';

/**
 * Bouton de test rapide pour ajouter des données
 */
const QuickTestButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState<'success' | 'danger'>('success');

  const addTestData = async () => {
    setLoading(true);
    try {
      const { ref, set } = await import('firebase/database');
      const { database } = await import('../../firebase/config');
      
      const testData = {
        chambre: {
          ch1: {
            sensors: {
              temperature: 21.5 + Math.random() * 2,
              humidity_air: 60 + Math.random() * 10,
              humidity_soil: 70 + Math.random() * 10,
              water_level: 75 + Math.random() * 15,
              pump_active: Math.random() > 0.5,
              light: 400 + Math.random() * 200,
              timestamp: new Date().toISOString()
            }
          },
          ch2: {
            sensors: {
              temperature: 23 + Math.random() * 2,
              humidity_air: 65 + Math.random() * 10,
              humidity_soil: 72 + Math.random() * 8,
              water_level: 80 + Math.random() * 10,
              pump_active: Math.random() > 0.7,
              light: 500 + Math.random() * 150,
              timestamp: new Date().toISOString()
            }
          }
        }
      };

      const dataRef = ref(database, '/');
      await set(dataRef, testData);
      
      setToastMessage('✅ Données de test ajoutées avec succès !');
      setToastVariant('success');
      setShowToast(true);
      
    } catch (error: any) {
      console.error('Erreur:', error);
      setToastMessage(`❌ Erreur: ${error.message}`);
      setToastVariant('danger');
      setShowToast(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="success"
        size="sm"
        onClick={addTestData}
        disabled={loading}
        className="d-flex align-items-center"
      >
        {loading ? (
          <FaSpinner className="fa-spin me-2" />
        ) : (
          <FaPlus className="me-2" />
        )}
        {loading ? 'Ajout...' : 'Données Test'}
      </Button>

      <ToastContainer position="top-end" className="p-3">
        <Toast
          show={showToast}
          onClose={() => setShowToast(false)}
          delay={3000}
          autohide
          bg={toastVariant}
        >
          <Toast.Body className="text-white">
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>
    </>
  );
};

export default QuickTestButton;
