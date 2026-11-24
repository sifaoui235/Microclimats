import React from 'react';
import { Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaPowerOff, FaPlay, FaStop } from 'react-icons/fa';

/**
 * Utilitaires pour l'affichage et la gestion des états de pompe
 */

/**
 * Retourne l'icône appropriée pour l'état de la pompe
 * @param {boolean} isActive - État de la pompe (true = active, false = inactive)
 * @param {object} props - Props supplémentaires pour l'icône
 * @returns {JSX.Element} Icône React
 */
export const getPumpIcon = (isActive, props = {}) => {
  const defaultProps = {
    size: 20,
    ...props
  };

  if (isActive) {
    return <FaPlay {...defaultProps} className="text-success" />;
  } else {
    return <FaStop {...defaultProps} className="text-danger" />;
  }
};

/**
 * Retourne un badge coloré pour l'état de la pompe
 * @param {boolean} isActive - État de la pompe
 * @param {string} size - Taille du badge ('sm', 'lg', ou par défaut)
 * @returns {JSX.Element} Badge React Bootstrap
 */
export const getPumpBadge = (isActive, size = '') => {
  const variant = isActive ? 'success' : 'danger';
  const text = isActive ? 'ACTIVE' : 'ARRÊTÉE';
  
  return (
    <Badge 
      bg={variant} 
      pill={size === 'sm'}
      className={size === 'lg' ? 'fs-6 px-3 py-2' : ''}
    >
      {text}
    </Badge>
  );
};

/**
 * Composant d'indicateur d'état de pompe avec tooltip
 * @param {object} props - Props du composant
 * @param {boolean} props.isActive - État de la pompe
 * @param {string} props.chamberName - Nom de la chambre
 * @param {string} props.lastUpdate - Dernière mise à jour
 * @param {string} props.size - Taille de l'indicateur
 * @returns {JSX.Element} Composant d'indicateur
 */
export const PumpStateIndicator = ({ 
  isActive, 
  chamberName = 'Chambre', 
  lastUpdate = null,
  size = 'default'
}) => {
  const tooltipContent = (
    <div>
      <strong>{chamberName}</strong><br />
      État: {isActive ? 'Active' : 'Arrêtée'}<br />
      {lastUpdate && (
        <>Dernière mise à jour: {new Date(lastUpdate).toLocaleString('fr-FR')}</>
      )}
    </div>
  );

  return (
    <OverlayTrigger
      placement="top"
      overlay={<Tooltip>{tooltipContent}</Tooltip>}
    >
      <div className="d-flex align-items-center gap-2">
        {getPumpIcon(isActive, { size: size === 'lg' ? 24 : 16 })}
        {getPumpBadge(isActive, size)}
      </div>
    </OverlayTrigger>
  );
};

/**
 * Calcule les statistiques d'activité de la pompe sur une période
 * @param {array} history - Historique des valeurs de la pompe
 * @param {number} hours - Nombre d'heures à analyser (par défaut 24)
 * @returns {object} Statistiques d'activité
 */
export const calculatePumpStats = (history = [], hours = 24) => {
  if (!history || history.length === 0) {
    return {
      totalTime: 0,
      activeTime: 0,
      inactiveTime: 0,
      activationCount: 0,
      activityPercentage: 0,
      averageRunTime: 0
    };
  }

  // Filtrer les données des dernières heures
  const cutoffTime = new Date(Date.now() - (hours * 60 * 60 * 1000));
  const recentHistory = history.filter(entry => 
    new Date(entry.timestamp) >= cutoffTime
  ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  if (recentHistory.length === 0) {
    return calculatePumpStats([], hours);
  }

  let activeTime = 0;
  let activationCount = 0;
  let currentRunStart = null;
  let previousState = null;

  recentHistory.forEach((entry, index) => {
    const isActive = entry.value === 1 || entry.value === true;
    const timestamp = new Date(entry.timestamp);

    // Détecter les changements d'état
    if (previousState !== null && previousState !== isActive) {
      if (isActive) {
        // Début d'activation
        activationCount++;
        currentRunStart = timestamp;
      } else if (currentRunStart) {
        // Fin d'activation
        activeTime += timestamp - currentRunStart;
        currentRunStart = null;
      }
    } else if (previousState === null && isActive) {
      // Premier état actif
      activationCount++;
      currentRunStart = timestamp;
    }

    // Si c'est le dernier point et que la pompe est active
    if (index === recentHistory.length - 1 && isActive && currentRunStart) {
      activeTime += timestamp - currentRunStart;
    }

    previousState = isActive;
  });

  const totalTime = hours * 60 * 60 * 1000; // en millisecondes
  const inactiveTime = totalTime - activeTime;
  const activityPercentage = (activeTime / totalTime) * 100;
  const averageRunTime = activationCount > 0 ? activeTime / activationCount : 0;

  return {
    totalTime: totalTime / (60 * 60 * 1000), // en heures
    activeTime: activeTime / (60 * 60 * 1000), // en heures
    inactiveTime: inactiveTime / (60 * 60 * 1000), // en heures
    activationCount,
    activityPercentage: Math.round(activityPercentage * 100) / 100,
    averageRunTime: averageRunTime / (60 * 1000) // en minutes
  };
};

/**
 * Composant d'affichage des statistiques de pompe
 * @param {object} props - Props du composant
 * @param {array} props.history - Historique de la pompe
 * @param {string} props.chamberName - Nom de la chambre
 * @param {number} props.hours - Période d'analyse en heures
 * @returns {JSX.Element} Composant de statistiques
 */
export const PumpStatsDisplay = ({ history, chamberName, hours = 24 }) => {
  const stats = calculatePumpStats(history, hours);

  return (
    <div className="pump-stats">
      <h6 className="mb-3">{chamberName} - Statistiques {hours}h</h6>
      <div className="row g-2">
        <div className="col-6">
          <small className="text-muted">Temps actif:</small>
          <div className="fw-bold text-success">
            {stats.activeTime.toFixed(1)}h ({stats.activityPercentage}%)
          </div>
        </div>
        <div className="col-6">
          <small className="text-muted">Activations:</small>
          <div className="fw-bold">{stats.activationCount}</div>
        </div>
        <div className="col-6">
          <small className="text-muted">Temps inactif:</small>
          <div className="fw-bold text-danger">
            {stats.inactiveTime.toFixed(1)}h
          </div>
        </div>
        <div className="col-6">
          <small className="text-muted">Durée moyenne:</small>
          <div className="fw-bold">
            {stats.averageRunTime.toFixed(1)} min
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Détermine si une alerte doit être affichée pour la pompe
 * @param {array} history - Historique de la pompe
 * @param {object} thresholds - Seuils d'alerte
 * @returns {object} Information sur l'alerte
 */
export const checkPumpAlert = (history, thresholds = {}) => {
  const defaultThresholds = {
    maxInactiveHours: 12, // Alerte si inactive plus de 12h
    maxActiveHours: 6,    // Alerte si active plus de 6h consécutives
    maxActivationsPerHour: 10, // Alerte si plus de 10 activations par heure
    ...thresholds
  };

  const stats = calculatePumpStats(history, 24);
  const alerts = [];

  // Vérifier l'inactivité prolongée
  if (stats.inactiveTime > defaultThresholds.maxInactiveHours) {
    alerts.push({
      type: 'warning',
      message: `Pompe inactive depuis ${stats.inactiveTime.toFixed(1)}h`
    });
  }

  // Vérifier l'activité excessive
  if (stats.activeTime > defaultThresholds.maxActiveHours) {
    alerts.push({
      type: 'danger',
      message: `Pompe active depuis ${stats.activeTime.toFixed(1)}h`
    });
  }

  // Vérifier les activations fréquentes
  const activationsPerHour = stats.activationCount / 24;
  if (activationsPerHour > defaultThresholds.maxActivationsPerHour) {
    alerts.push({
      type: 'warning',
      message: `Activations fréquentes: ${activationsPerHour.toFixed(1)}/h`
    });
  }

  return {
    hasAlert: alerts.length > 0,
    alerts,
    stats
  };
};
