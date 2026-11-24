import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import './styles/custom.css';
import Layout from './components/layout/Layout';
import Dashboard from './components/dashboard/Dashboard';
import RaspberryPiDashboard from './components/dashboard/RaspberryPiDashboard';
import OptimizedDualChamberDashboard from './components/dashboard/OptimizedDualChamberDashboard';
import ChamberComparisonLayout from './components/dashboard/ChamberComparisonLayout';
import SensorsPage from './pages/SensorsPage';
import HistoryPage from './pages/HistoryPage';
import FirebaseTestPage from './pages/FirebaseTestPage';
import { ThemeProvider } from './hooks/ThemeContext';
import { FirebaseProvider } from './firebase/FirebaseContext';

const App: React.FC = () => {
  return (
    <Router>
      <ThemeProvider>
        <FirebaseProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<OptimizedDualChamberDashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/sensors" element={<SensorsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              {/* Routes cachées pour développement */}
              <Route path="/single-chamber" element={<RaspberryPiDashboard />} />
              <Route path="/dashboard-old" element={<Dashboard />} />
              <Route path="/chambers" element={<ChamberComparisonLayout />} />
              <Route path="/firebase-test" element={<FirebaseTestPage />} />
            </Routes>
          </Layout>
        </FirebaseProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
