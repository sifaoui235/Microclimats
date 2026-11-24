#!/usr/bin/env python3
"""
Test script to send rapid updates to Firebase to test frontend latency.
This script sends updates every 0.5 seconds to test how well the frontend handles frequent updates.
"""
import time
import random
import datetime
import os
import firebase_admin
from firebase_admin import credentials
from firebase_admin import db

# Firebase configuration
FIREBASE_CREDENTIALS_FILE = "fraisier-fa1be-firebase-adminsdk.json"
FIREBASE_DATABASE_URL = "https://fraisier-fa1be-default-rtdb.firebaseio.com"

# Sensor ranges (min and max values for generating random data)
TEMPERATURE_RANGE = (18, 28)  # °C
HUMIDITY_AIR_RANGE = (40, 80)  # %
HUMIDITY_SOIL_RANGE = (40, 80)  # %
WATER_LEVEL_RANGE = (20, 100)  # %
LIGHT_RANGE = (200, 1000)  # lux

def init_firebase():
    """Initialize Firebase connection"""
    try:
        # Check if Firebase is already initialized
        if not firebase_admin._apps:
            # Check if credentials file exists
            if not os.path.exists(FIREBASE_CREDENTIALS_FILE):
                print(f"Firebase credentials file '{FIREBASE_CREDENTIALS_FILE}' not found.")
                return False

            try:
                # Initialize Firebase
                cred = credentials.Certificate(FIREBASE_CREDENTIALS_FILE)
                firebase_admin.initialize_app(cred, {
                    'databaseURL': FIREBASE_DATABASE_URL
                })
                print("Firebase initialized successfully")
                return True
            except Exception as e:
                print(f"Error initializing Firebase: {e}")
                return False
        return True
    except Exception as e:
        print(f"Error in init_firebase: {e}")
        return False

def generate_random_value(min_val, max_val, previous_value=None):
    """Generate a random sensor value with small changes from previous value"""
    if previous_value is not None:
        # Generate a small change (±5% of range)
        range_width = max_val - min_val
        max_change = range_width * 0.05
        change = random.uniform(-max_change, max_change)
        new_value = previous_value + change
        
        # Keep within range
        new_value = max(min_val, min(max_val, new_value))
        return new_value
    else:
        # First value - generate within range
        return min_val + random.random() * (max_val - min_val)

def update_data_in_firebase(temperature, humidity_air, humidity_soil, water_level, pump_active, light=None):
    """Update all sensor data in Firebase at the root level"""
    try:
        # Get current timestamp
        timestamp = datetime.datetime.now().isoformat()

        # Create data object with all sensor values
        data = {
            'temperature': temperature,
            'humidity_air': humidity_air,
            'humidity_soil': humidity_soil,
            'water_level': water_level,
            'pump_active': pump_active,
            'timestamp': timestamp
        }

        # Add light data if provided
        if light is not None:
            data['light'] = light

        # Reference to the root of the database
        root_ref = db.reference('/')

        # Update data at the root level for the frontend
        root_ref.update(data)

        print(f"Updated Firebase at {timestamp}")
        print(f"  Temperature: {temperature:.2f}°C")
        print(f"  Humidity (Air): {humidity_air:.2f}%")
        print(f"  Humidity (Soil): {humidity_soil:.2f}%")
        print(f"  Water Level: {water_level:.2f}%")
        print(f"  Pump Active: {pump_active}")
        if light is not None:
            print(f"  Light: {light:.2f} lux")

        return True
    except Exception as e:
        print(f"Error updating data in Firebase: {e}")
        return False

def run_rapid_test(update_interval=0.5, iterations=20):
    """Run the rapid update test, sending sensor values to Firebase frequently"""
    if not init_firebase():
        print("Failed to initialize Firebase.")
        return

    print(f"\nStarting rapid update test with interval of {update_interval} seconds")
    print(f"Will send {iterations} updates\n")

    # Initial values
    temperature = generate_random_value(*TEMPERATURE_RANGE)
    humidity_air = generate_random_value(*HUMIDITY_AIR_RANGE)
    humidity_soil = generate_random_value(*HUMIDITY_SOIL_RANGE)
    water_level = generate_random_value(*WATER_LEVEL_RANGE)
    light = generate_random_value(*LIGHT_RANGE)
    pump_active = random.choice([True, False])

    try:
        for i in range(iterations):
            print(f"\nUpdate #{i+1} - {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S.%f')[:-3]}")

            # Generate values with small changes from previous
            temperature = generate_random_value(*TEMPERATURE_RANGE, temperature)
            humidity_air = generate_random_value(*HUMIDITY_AIR_RANGE, humidity_air)
            humidity_soil = generate_random_value(*HUMIDITY_SOIL_RANGE, humidity_soil)
            water_level = generate_random_value(*WATER_LEVEL_RANGE, water_level)
            light = generate_random_value(*LIGHT_RANGE, light)
            
            # Occasionally toggle pump state (10% chance)
            if random.random() < 0.1:
                pump_active = not pump_active

            # Update Firebase
            update_data_in_firebase(
                temperature=temperature,
                humidity_air=humidity_air,
                humidity_soil=humidity_soil,
                water_level=water_level,
                pump_active=pump_active,
                light=light
            )

            # Wait for next update
            if i < iterations - 1:
                time.sleep(update_interval)

    except KeyboardInterrupt:
        print("\nTest stopped by user")

    print("\nRapid update test completed")

if __name__ == "__main__":
    # Run the test with 0.5-second intervals for 20 iterations
    run_rapid_test(update_interval=0.5, iterations=20)
