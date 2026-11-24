import React, { useEffect, useState } from 'react';
import { Button, Alert } from 'react-bootstrap';
import { useFirebase } from '../../firebase/FirebaseContext';

interface DatabaseInitializerProps {
  autoInitialize?: boolean;
}

const DatabaseInitializer: React.FC<DatabaseInitializerProps> = ({ 
  autoInitialize = false 
}) => {
  const { seedDatabase, sensors, loading } = useFirebase();
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-initialize if requested and no sensors exist
  useEffect(() => {
    const checkAndInitialize = async () => {
      if (autoInitialize && !loading && sensors.length === 0) {
        try {
          await seedDatabase();
          setInitialized(true);
        } catch (err) {
          setError('Failed to initialize database');
          console.error(err);
        }
      }
    };

    checkAndInitialize();
  }, [autoInitialize, loading, sensors.length, seedDatabase]);

  const handleInitialize = async () => {
    try {
      await seedDatabase();
      setInitialized(true);
      setError(null);
    } catch (err) {
      setError('Failed to initialize database');
      console.error(err);
    }
  };

  return (
    <div className="mb-4">
      {error && <Alert variant="danger">{error}</Alert>}
      
      {initialized ? (
        <Alert variant="success">
          Database initialized successfully with mock data!
        </Alert>
      ) : (
        <Button 
          variant="primary" 
          onClick={handleInitialize}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Initialize Database with Mock Data'}
        </Button>
      )}
    </div>
  );
};

export default DatabaseInitializer;
