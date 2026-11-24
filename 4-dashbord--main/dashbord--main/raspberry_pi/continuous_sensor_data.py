#!/usr/bin/env python3
"""
Script to continuously send sensor data to Firebase.
This script runs indefinitely, sending data at regular intervals.
"""
import time
import random
import datetime
import json
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

# Update interval in seconds
DEFAULT_UPDATE_INTERVAL = 30  # 30 seconds

def init_firebase():
    """Initialize Firebase connection"""
    try:
        # Check if Firebase is already initialized
        if not firebase_admin._apps:
            # Check if credentials file exists
            if not os.path.exists(FIREBASE_CREDENTIALS_FILE):
                print(f"Firebase credentials file '{FIREBASE_CREDENTIALS_FILE}' not found.")
                print("Please download real credentials from Firebase console.")
                print("1. Go to Firebase Console: https://console.firebase.google.com/")
                print("2. Select your project: fraisier-fa1be")
                print("3. Go to Project Settings > Service accounts")
                print("4. Click 'Generate new private key'")
                print(f"5. Save the downloaded file as {FIREBASE_CREDENTIALS_FILE}")
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
                print("This might be due to invalid credentials.")
                return False
        return True
    except Exception as e:
        print(f"Error in init_firebase: {e}")
        return False

def generate_random_value(min_val, max_val, previous_value=None):
    """Generate a random sensor value within the given range"""
    # If we have a previous value, generate a value close to it
    if previous_value is not None:
        # Generate a value within 10% of the previous value
        range_width = max_val - min_val
        max_change = range_width * 0.1
        change = random.uniform(-max_change, max_change)
        value = previous_value + change
        
        # Ensure the value is within the range
        value = max(min_val, min(max_val, value))
    else:
        # Generate a completely random value
        range_width = max_val - min_val
        value = min_val + random.random() * range_width

    # Occasionally generate values outside the range to trigger alerts (5% chance)
    if random.random() < 0.05:
        if random.random() < 0.5:
            # Below minimum
            value = min_val - (random.random() * range_width * 0.1)
        else:
            # Above maximum
            value = max_val + (random.random() * range_width * 0.1)

    return value

def update_data_in_firebase(temperature, humidity_air, humidity_soil, water_level, pump_active, light=None):
    """Update all sensor data in Firebase at the root level and in sensor_data collection"""
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
        
        # Reference to the sensor_data collection
        sensor_data_ref = db.reference('/sensor_data')
        
        # 1. Update data at the root level for the frontend
        root_ref.update(data)
        
        # 2. Also add the data to the sensor_data collection for historical records
        # Use push() to create a new entry with a unique key
        sensor_data_ref.push(data)

        print(f"Updated Firebase with new sensor data at {timestamp}")
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

def run_continuous_updates(update_interval=DEFAULT_UPDATE_INTERVAL):
    """Run continuous updates, sending sensor values to Firebase at regular intervals"""
    if not init_firebase():
        print("\nFailed to initialize Firebase. Exiting.")
        return

    print(f"\nStarting continuous updates with interval of {update_interval} seconds")
    print("Press Ctrl+C to stop the script\n")

    # Initialize previous values
    prev_temperature = random.uniform(*TEMPERATURE_RANGE)
    prev_humidity_air = random.uniform(*HUMIDITY_AIR_RANGE)
    prev_humidity_soil = random.uniform(*HUMIDITY_SOIL_RANGE)
    prev_water_level = random.uniform(*WATER_LEVEL_RANGE)
    prev_light = random.uniform(*LIGHT_RANGE)
    pump_active = False
    
    # Counter for pump state changes
    pump_counter = 0

    count = 0
    try:
        while True:
            count += 1
            print(f"\nUpdate #{count} - {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

            # Generate values close to previous values for more realistic changes
            temperature = generate_random_value(*TEMPERATURE_RANGE, prev_temperature)
            humidity_air = generate_random_value(*HUMIDITY_AIR_RANGE, prev_humidity_air)
            humidity_soil = generate_random_value(*HUMIDITY_SOIL_RANGE, prev_humidity_soil)
            water_level = generate_random_value(*WATER_LEVEL_RANGE, prev_water_level)
            light = generate_random_value(*LIGHT_RANGE, prev_light)

            # Update previous values for next iteration
            prev_temperature = temperature
            prev_humidity_air = humidity_air
            prev_humidity_soil = humidity_soil
            prev_water_level = water_level
            prev_light = light

            # Handle pump state
            pump_counter += 1
            if pump_counter >= 10:  # Change pump state every 10 updates
                pump_active = not pump_active
                pump_counter = 0
            
            # If soil is too dry, activate the pump
            if humidity_soil < 50 and not pump_active:
                pump_active = True
                pump_counter = 0
            
            # If soil is wet enough, deactivate the pump
            if humidity_soil > 75 and pump_active:
                pump_active = False
                pump_counter = 0

            # Update Firebase
            update_data_in_firebase(
                temperature=temperature,
                humidity_air=humidity_air,
                humidity_soil=humidity_soil,
                water_level=water_level,
                pump_active=pump_active,
                light=light
            )

            # Wait for the next update
            print(f"Waiting {update_interval} seconds for next update...")
            time.sleep(update_interval)

    except KeyboardInterrupt:
        print("\nScript stopped by user")

    print("\nScript completed")

if __name__ == "__main__":
    # Run continuous updates with 30-second intervals
    run_continuous_updates(update_interval=30)
