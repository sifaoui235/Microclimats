import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Badge } from 'react-bootstrap';
import { ref, onValue, get } from 'firebase/database';
import { database } from '../../firebase/config';

/**
 * A simple component to test Firebase real-time connection
 * This component displays raw data from Firebase and updates in real-time
 */
const FirebaseConnectionTest: React.FC = () => {
  const [rawData, setRawData] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [connected, setConnected] = useState<boolean>(false);
  const [updateCount, setUpdateCount] = useState<number>(0);

  // Function to manually refresh data
  const refreshData = async () => {
    try {
      setLoading(true);

      // Reference to the root of the database
      const dataRef = ref(database, '/');

      // Get data once
      const snapshot = await get(dataRef);

      if (snapshot.exists()) {
        const data = snapshot.val();
        console.log('Manual refresh - Data received:', data);
        setRawData(data);
        setLastUpdate(new Date());
        setError(null);
      } else {
        console.log('No data found (manual refresh)');
        setError('No data found in Firebase.');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
      setError(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  // Use a ref to track the last update time to prevent too frequent UI updates
  const lastUpdateTimeRef = React.useRef<number>(0);
  const MIN_UPDATE_INTERVAL = 200; // Minimum time between UI updates in milliseconds

  // Effect to subscribe to real-time updates
  useEffect(() => {
    console.log('Initializing Firebase real-time connection test');
    setLoading(true);

    // Reference to the root of the database
    const dataRef = ref(database, '/');

    // Subscribe to real-time updates with throttling
    const unsubscribe = onValue(dataRef, (snapshot) => {
      // Throttle UI updates to reduce rendering overhead
      const now = Date.now();
      const shouldUpdateUI = now - lastUpdateTimeRef.current >= MIN_UPDATE_INTERVAL;

      if (snapshot.exists()) {
        const data = snapshot.val();

        // Always increment update count to track all updates
        setUpdateCount(prev => prev + 1);

        // Only update UI components at throttled rate
        if (shouldUpdateUI) {
          lastUpdateTimeRef.current = now;
          setRawData(data);
          setLastUpdate(new Date());
          setError(null);
          setConnected(true);
          setLoading(false);
        }
      } else {
        if (shouldUpdateUI) {
          lastUpdateTimeRef.current = now;
          setError('No data found in Firebase.');
          setLoading(false);
        }
      }
    }, (error) => {
      console.error('Error getting real-time data:', error);
      setError(`Error: ${error.message}`);
      setConnected(false);
      setLoading(false);
    });

    // Clean up subscription when component unmounts
    return () => {
      unsubscribe();
    };
  }, []);

  // Format values for display
  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'True' : 'False';
    if (typeof value === 'number') return value.toFixed(2);
    if (typeof value === 'object') {
      if (value instanceof Date) return value.toLocaleString();
      return JSON.stringify(value);
    }
    return String(value);
  };

  return (
    <div className="mb-4">
      <h2 className="mb-3">Firebase Connection Test</h2>

      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <Badge bg={connected ? 'success' : 'danger'} className="me-2">
            {connected ? 'Connected' : 'Disconnected'}
          </Badge>
          <small className="text-muted">
            Last update: {lastUpdate.toLocaleString()}
            {updateCount > 0 && ` (${updateCount} updates received)`}
          </small>
        </div>
        <Button
          variant="primary"
          onClick={refreshData}
          disabled={loading}
          size="sm"
        >
          {loading ? 'Loading...' : 'Manual Refresh'}
        </Button>
      </div>

      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      {loading && !rawData ? (
        <div className="text-center my-5">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3">Loading data...</p>
        </div>
      ) : (
        <>
          {rawData ? (
            <Card>
              <Card.Header>
                <h5 className="mb-0">Raw Firebase Data</h5>
              </Card.Header>
              <Card.Body>
                <pre className="bg-light p-3 rounded" style={{ maxHeight: '400px', overflow: 'auto' }}>
                  {JSON.stringify(rawData, null, 2)}
                </pre>
              </Card.Body>
            </Card>
          ) : (
            <Alert variant="warning">
              No data available from Firebase.
            </Alert>
          )}
        </>
      )}
    </div>
  );
};

export default FirebaseConnectionTest;
