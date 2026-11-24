import React, { useState, useMemo } from 'react';
import { Card, Button, Row, Col } from 'react-bootstrap';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { SensorInfo } from '../../types';
import { useThemeContext } from '../../hooks/ThemeContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SensorChartProps {
  sensor: SensorInfo;
}

const SensorChart: React.FC<SensorChartProps> = ({ sensor }) => {
  const { darkMode } = useThemeContext();

  // État pour la navigation par mois (24 mois = 2 ans)
  const [currentMonthOffset, setCurrentMonthOffset] = useState(0); // 0 = mois actuel, 1 = mois précédent, etc.

  // Obtenir les 24 derniers mois disponibles
  const availableMonths = useMemo(() => {
    const months = new Set();
    sensor.history.forEach(item => {
      const date = new Date(item.timestamp);
      const monthKey = `${date.getFullYear()}-${date.getMonth()}`;
      months.add(monthKey);
    });

    // Convertir en array et trier par date (plus récent en premier)
    const sortedMonths = Array.from(months).sort().reverse();

    // Limiter à 24 mois maximum
    return sortedMonths.slice(0, 24);
  }, [sensor.history]);

  // Filtrer les données pour le mois sélectionné
  const currentMonthData = useMemo(() => {
    if (availableMonths.length === 0) return [];

    const selectedMonthKey = availableMonths[currentMonthOffset];
    if (!selectedMonthKey || typeof selectedMonthKey !== 'string') return [];

    const parts = selectedMonthKey.split('-');
    if (parts.length !== 2) return [];

    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);

    if (isNaN(year) || isNaN(month)) return [];

    return sensor.history.filter(item => {
      const date = new Date(item.timestamp);
      return date.getFullYear() === year && date.getMonth() === month;
    });
  }, [sensor.history, availableMonths, currentMonthOffset]);

  // Obtenir le nom du mois actuel
  const currentMonthName = useMemo(() => {
    if (availableMonths.length === 0) return '';

    const selectedMonthKey = availableMonths[currentMonthOffset];
    if (!selectedMonthKey || typeof selectedMonthKey !== 'string') return '';

    const parts = selectedMonthKey.split('-');
    if (parts.length !== 2) return '';

    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);

    if (isNaN(year) || isNaN(month)) return '';

    const date = new Date(year, month, 1);

    return date.toLocaleDateString('fr-FR', {
      month: 'long',
      year: 'numeric'
    });
  }, [availableMonths, currentMonthOffset]);

  const formatChartData = () => {
    // Créer les labels pour les jours du mois (1 à 31)
    const labels = currentMonthData.map(item => {
      const date = new Date(item.timestamp);
      return date.getDate().toString();
    });

    const values = currentMonthData.map(item => item.value);

    return {
      labels,
      datasets: [
        {
          label: `${sensor.name} (${sensor.unit})`,
          data: values,
          borderColor: sensor.isAlert ? 'rgba(220, 53, 69, 1)' : 'rgba(40, 167, 69, 1)',
          backgroundColor: sensor.isAlert
            ? 'rgba(220, 53, 69, 0.1)'
            : 'rgba(40, 167, 69, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 3,
          pointBackgroundColor: sensor.isAlert ? 'rgba(220, 53, 69, 1)' : 'rgba(40, 167, 69, 1)',
        },
        {
          label: 'Min',
          data: Array(labels.length).fill(sensor.minThreshold),
          borderColor: 'rgba(255, 193, 7, 0.8)',
          borderWidth: 1,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
        },
        {
          label: 'Max',
          data: Array(labels.length).fill(sensor.maxThreshold),
          borderColor: 'rgba(255, 193, 7, 0.8)',
          borderWidth: 1,
          borderDash: [5, 5],
          fill: false,
          pointRadius: 0,
        }
      ]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          color: darkMode ? '#fff' : '#666'
        }
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          title: function(context: any) {
            const index = context[0].dataIndex;
            if (currentMonthData[index]) {
              const date = new Date(currentMonthData[index].timestamp);
              return date.toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              });
            }
            return '';
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: darkMode ? '#fff' : '#666',
          maxTicksLimit: 31, // Maximum 31 jours dans un mois
          callback: function(value: any, index: number, ticks: any[]): string {
            // Afficher les jours 1, 5, 10, 15, 20, 25, 30
            if (typeof value === 'number' && index < currentMonthData.length) {
              const item = currentMonthData[index];
              if (item) {
                const day = new Date(item.timestamp).getDate();
                return [1, 5, 10, 15, 20, 25, 30].includes(day) ? day.toString() : '';
              }
            }
            return '';
          }
        }
      },
      y: {
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: darkMode ? '#fff' : '#666'
        }
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    }
  };

  // Fonctions de navigation
  const goToPreviousMonth = () => {
    if (currentMonthOffset < availableMonths.length - 1) {
      setCurrentMonthOffset(currentMonthOffset + 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonthOffset > 0) {
      setCurrentMonthOffset(currentMonthOffset - 1);
    }
  };

  return (
    <Card
      className="h-100 shadow-sm"
      bg={darkMode ? 'dark' : 'light'}
      text={darkMode ? 'light' : 'dark'}
    >
      <Card.Header>
        <Row className="align-items-center">
          <Col>
            <h5 className="mb-0">{sensor.name} - Historique mensuel (24 mois)</h5>
          </Col>
        </Row>
        <Row className="align-items-center mt-2">
          <Col xs={2}>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={goToPreviousMonth}
              disabled={currentMonthOffset >= availableMonths.length - 1}
              className="w-100"
            >
              &lt;
            </Button>
          </Col>
          <Col xs={8} className="text-center">
            <h6 className="mb-0 text-capitalize">{currentMonthName}</h6>
            <small className="text-muted">
              Mois {currentMonthOffset + 1} sur {availableMonths.length}
            </small>
          </Col>
          <Col xs={2}>
            <Button
              variant="outline-primary"
              size="sm"
              onClick={goToNextMonth}
              disabled={currentMonthOffset <= 0}
              className="w-100"
            >
              &gt;
            </Button>
          </Col>
        </Row>
      </Card.Header>
      <Card.Body>
        <div style={{ height: '300px' }}>
          {currentMonthData.length > 0 ? (
            <Line data={formatChartData()} options={chartOptions} />
          ) : (
            <div className="d-flex align-items-center justify-content-center h-100">
              <p className="text-muted">Aucune donnée disponible pour ce mois</p>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default SensorChart;
