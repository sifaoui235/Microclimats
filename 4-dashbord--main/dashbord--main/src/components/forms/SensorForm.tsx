import React, { useState, useEffect } from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';
import { SensorInfo } from '../../types';
import { useFirebase } from '../../firebase/FirebaseContext';

interface SensorFormProps {
  sensor?: SensorInfo;
  onSave?: () => void;
  onCancel?: () => void;
}

const defaultSensor: SensorInfo = {
  id: '',
  name: '',
  description: '',
  unit: '',
  minThreshold: 0,
  maxThreshold: 100,
  currentValue: 50,
  history: [],
  isAlert: false
};

const SensorForm: React.FC<SensorFormProps> = ({ 
  sensor = defaultSensor,
  onSave,
  onCancel 
}) => {
  const { saveSensor } = useFirebase();
  const [formData, setFormData] = useState<SensorInfo>(sensor);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isNewSensor = !sensor.id;

  useEffect(() => {
    setFormData(sensor);
  }, [sensor]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    // Convert numeric values
    const processedValue = type === 'number' ? parseFloat(value) : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.id) newErrors.id = 'ID is required';
    if (!formData.name) newErrors.name = 'Name is required';
    if (formData.minThreshold >= formData.maxThreshold) {
      newErrors.minThreshold = 'Min threshold must be less than max threshold';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // For new sensors, generate empty history
      let sensorToSave = formData;
      
      if (isNewSensor) {
        // Generate empty history for the last 24 hours
        const now = new Date();
        const emptyHistory = Array.from({ length: 24 }, (_, i) => {
          const date = new Date(now);
          date.setHours(date.getHours() - (24 - i));
          return {
            timestamp: date.toISOString(),
            value: formData.currentValue
          };
        });
        
        sensorToSave = {
          ...formData,
          history: emptyHistory,
          isAlert: formData.currentValue < formData.minThreshold || 
                  formData.currentValue > formData.maxThreshold
        };
      }
      
      await saveSensor(sensorToSave);
      onSave?.();
    } catch (error) {
      console.error('Error saving sensor:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>ID</Form.Label>
            <Form.Control
              type="text"
              name="id"
              value={formData.id}
              onChange={handleChange}
              disabled={!isNewSensor}
              isInvalid={!!errors.id}
            />
            <Form.Control.Feedback type="invalid">{errors.id}</Form.Control.Feedback>
            <Form.Text className="text-muted">
              Unique identifier for the sensor (e.g., temp-1, hum-2)
            </Form.Text>
          </Form.Group>
        </Col>
        
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Name</Form.Label>
            <Form.Control
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              isInvalid={!!errors.name}
            />
            <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Description</Form.Label>
        <Form.Control
          type="text"
          name="description"
          value={formData.description}
          onChange={handleChange}
        />
      </Form.Group>

      <Row>
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Unit</Form.Label>
            <Form.Control
              type="text"
              name="unit"
              value={formData.unit}
              onChange={handleChange}
            />
            <Form.Text className="text-muted">
              Unit of measurement (e.g., °C, %, lux)
            </Form.Text>
          </Form.Group>
        </Col>
        
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Min Threshold</Form.Label>
            <Form.Control
              type="number"
              name="minThreshold"
              value={formData.minThreshold}
              onChange={handleChange}
              isInvalid={!!errors.minThreshold}
            />
            <Form.Control.Feedback type="invalid">{errors.minThreshold}</Form.Control.Feedback>
          </Form.Group>
        </Col>
        
        <Col md={4}>
          <Form.Group className="mb-3">
            <Form.Label>Max Threshold</Form.Label>
            <Form.Control
              type="number"
              name="maxThreshold"
              value={formData.maxThreshold}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>
      </Row>

      <Form.Group className="mb-3">
        <Form.Label>Current Value</Form.Label>
        <Form.Control
          type="number"
          name="currentValue"
          value={formData.currentValue}
          onChange={handleChange}
        />
      </Form.Group>

      <div className="d-flex justify-content-end gap-2 mt-4">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Sensor'}
        </Button>
      </div>
    </Form>
  );
};

export default SensorForm;
