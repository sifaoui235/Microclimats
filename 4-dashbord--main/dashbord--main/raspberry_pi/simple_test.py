#!/usr/bin/env python3
"""
Simple test script to simulate sending sensor data to Firebase.
This script doesn't require any external dependencies.
"""
import random
import time
import datetime

# Sensor IDs (should match the IDs in your web app)
SENSORS = [
    {"id": "temp-1", "name": "Temperature", "min": 18, "max": 28, "unit": "°C"},
    {"id": "hum-1", "name": "Humidity", "min": 60, "max": 80, "unit": "%"},
    {"id": "light-1", "name": "Light", "min": 3000, "max": 10000, "unit": "lux"},
    {"id": "water-1", "name": "Water Level", "min": 20, "max": 100, "unit": "%"}
]

def generate_random_value(min_val, max_val):
    """Generate a random sensor value within the given range"""
    # Add some variability to make the data more interesting
    range_width = max_val - min_val
    value = min_val + random.random() * range_width
    
    # Occasionally generate values outside the range to trigger alerts
    if random.random() < 0.2:  # 20% chance of out-of-range value
        if random.random() < 0.5:
            # Below minimum
            value = min_val - (random.random() * range_width * 0.2)
        else:
            # Above maximum
            value = max_val + (random.random() * range_width * 0.2)
    
    return value

def run_simulation(update_interval=5, iterations=3):
    """Run a simulation of sending sensor data"""
    print(f"\nStarting sensor simulation with update interval of {update_interval} seconds")
    print("This simulates what would be sent to Firebase\n")
    
    count = 0
    try:
        while iterations is None or count < iterations:
            count += 1
            now = datetime.datetime.now()
            print(f"\nUpdate #{count} - {now.strftime('%Y-%m-%d %H:%M:%S')}")
            
            # Update each sensor with a random value
            for sensor in SENSORS:
                value = generate_random_value(sensor["min"], sensor["max"])
                min_threshold = sensor["min"]
                max_threshold = sensor["max"]
                is_alert = value < min_threshold or value > max_threshold
                
                print(f"Sensor: {sensor['name']} ({sensor['id']})")
                print(f"  Value: {value:.2f} {sensor['unit']}")
                print(f"  Alert: {is_alert} (Thresholds: {min_threshold}-{max_threshold})")
                
                # In a real implementation, this would be sent to Firebase
                # Here's what the data structure would look like:
                data = {
                    'currentValue': value,
                    'isAlert': is_alert,
                    'history': [
                        # ... previous history entries ...
                        {
                            'timestamp': now.isoformat(),
                            'value': value
                        }
                    ]
                }
                
            # Wait for the next update
            if iterations is None or count < iterations:
                print(f"\nWaiting {update_interval} seconds for next update...")
                time.sleep(update_interval)
    
    except KeyboardInterrupt:
        print("\nSimulation stopped by user")
    
    print("\nSimulation completed")
    print("\nTo send this data to Firebase from a Raspberry Pi:")
    print("1. Install the Firebase Admin SDK: pip install firebase-admin")
    print("2. Get Firebase credentials from the Firebase console")
    print("3. Use the firebase_demo.py script with your credentials")

if __name__ == "__main__":
    # Run the simulation
    run_simulation()
