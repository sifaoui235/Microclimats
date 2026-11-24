import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
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

/**
 * Composant pour afficher les graphiques des deux milieux
 * @param {object} props - Props du composant
 * @param {array} props.ch1Sensors - Capteurs du milieu 1
 * @param {array} props.ch2Sensors - Capteurs du milieu 2
 */
const ChamberGraphs = ({ ch1Sensors = [], ch2Sensors = [] }) => {
  const { darkMode } = useThemeContext();

  // Couleurs pour les milieux
  const milieuColors = {
    ch1: {
      primary: 'rgba(54, 162, 235, 1)', // Bleu
      secondary: 'rgba(54, 162, 235, 0.1)',
      border: 'rgba(54, 162, 235, 0.8)'
    },
    ch2: {
      primary: 'rgba(255, 159, 64, 1)', // Orange
      secondary: 'rgba(255, 159, 64, 0.1)',
      border: 'rgba(255, 159, 64, 0.8)'
    }
  };

  /**
   * Crée les données pour un graphique combiné de deux capteurs
   * @param {object} ch1Sensor - Capteur du milieu 1
   * @param {object} ch2Sensor - Capteur du milieu 2
   * @returns {object} Données formatées pour Chart.js
   */
  const createCombinedChartData = (ch1Sensor, ch2Sensor) => {
    if (!ch1Sensor && !ch2Sensor) return null;

    // Utiliser l'historique du capteur disponible ou créer des labels par défaut
    const sensor = ch1Sensor || ch2Sensor;
    const labels = sensor.history?.map(h => {
      const date = new Date(h.timestamp);
      return `${date.getHours().toString().padStart(2, '0')}h`;
    }) || [];

    const datasets = [];

    // Dataset pour le milieu 1
    if (ch1Sensor) {
      const values = ch1Sensor.history?.map(h => h.value) || [];

      datasets.push({
        label: `Milieu 1 - ${ch1Sensor.name}`,
        data: values,
        borderColor: milieuColors.ch1.primary,
        backgroundColor: milieuColors.ch1.secondary,
        borderWidth: 2,
        tension: 0.4,
        fill: false,
        pointRadius: 2,
        pointBackgroundColor: milieuColors.ch1.primary,
      });

      // Seuils pour le milieu 1
      datasets.push({
        label: 'M1 - Min',
        data: Array(labels.length).fill(ch1Sensor.minThreshold),
        borderColor: milieuColors.ch1.border,
        borderWidth: 1,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      });

      datasets.push({
        label: 'M1 - Max',
        data: Array(labels.length).fill(ch1Sensor.maxThreshold),
        borderColor: milieuColors.ch1.border,
        borderWidth: 1,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      });
    }

    // Dataset pour le milieu 2
    if (ch2Sensor) {
      const values = ch2Sensor.history?.map(h => h.value) || [];

      datasets.push({
        label: `Milieu 2 - ${ch2Sensor.name}`,
        data: values,
        borderColor: milieuColors.ch2.primary,
        backgroundColor: milieuColors.ch2.secondary,
        borderWidth: 2,
        tension: 0.4,
        fill: false,
        pointRadius: 2,
        pointBackgroundColor: milieuColors.ch2.primary,
      });

      // Seuils pour le milieu 2
      datasets.push({
        label: 'M2 - Min',
        data: Array(labels.length).fill(ch2Sensor.minThreshold),
        borderColor: milieuColors.ch2.border,
        borderWidth: 1,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      });

      datasets.push({
        label: 'M2 - Max',
        data: Array(labels.length).fill(ch2Sensor.maxThreshold),
        borderColor: milieuColors.ch2.border,
        borderWidth: 1,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      });
    }

    return { labels, datasets };
  };

  /**
   * Options communes pour tous les graphiques
   */
  const getChartOptions = (title, unit) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: darkMode ? '#fff' : '#666',
          filter: (legendItem) => {
            // Masquer les seuils dans la légende pour éviter l'encombrement
            return !legendItem.text.includes('Min') && !legendItem.text.includes('Max');
          }
        }
      },
      title: {
        display: true,
        text: `${title} - Évolution journalière par heures`,
        color: darkMode ? '#fff' : '#333'
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value}${unit}`;
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
          maxTicksLimit: 24,
          callback: function(value, index) {
            // Afficher toutes les 3 heures pour éviter l'encombrement (0h, 3h, 6h, 9h, 12h, 15h, 18h, 21h)
            return index % 3 === 0 ? this.getLabelForValue(value) : '';
          }
        }
      },
      y: {
        grid: {
          color: darkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          color: darkMode ? '#fff' : '#666',
          callback: (value) => `${value}${unit}`
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  });

  // Grouper les capteurs par type
  const sensorTypes = ['temperature', 'humidity_air', 'humidity_soil', 'water_level', 'light'];

  const getSensorByType = (sensors, type) => {
    return sensors.find(sensor => sensor.id.includes(type));
  };

  return (
    <div className="milieu-graphs">
      <h3 className="mb-4">Graphiques de Comparaison des Milieux</h3>

      <Row className="g-4">
        {sensorTypes.map(type => {
          const ch1Sensor = getSensorByType(ch1Sensors, type);
          const ch2Sensor = getSensorByType(ch2Sensors, type);

          // Ne pas afficher le graphique si aucun des deux milieux n'a ce capteur
          if (!ch1Sensor && !ch2Sensor) return null;

          const chartData = createCombinedChartData(ch1Sensor, ch2Sensor);
          if (!chartData) return null;

          const sensor = ch1Sensor || ch2Sensor;
          const title = sensor.name;
          const unit = sensor.unit;

          return (
            <Col key={type} lg={6} md={12} className="mb-4">
              <Card
                className="h-100 shadow-sm"
                bg={darkMode ? 'dark' : 'light'}
                text={darkMode ? 'light' : 'dark'}
              >
                <Card.Body>
                  <div style={{ height: '350px' }}>
                    <Line
                      data={chartData}
                      options={getChartOptions(title, unit)}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    </div>
  );
};

export default ChamberGraphs;
