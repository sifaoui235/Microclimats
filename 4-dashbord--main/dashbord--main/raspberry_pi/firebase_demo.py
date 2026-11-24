#!/usr/bin/env python3
"""
Demo script to test sending data to Firebase from Raspberry Pi.
This script generates random sensor values and sends them to Firebase
without requiring any physical sensors to be connected.
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

def create_placeholder_credentials():
    """Create a placeholder credentials file for testing"""
    if os.path.exists(FIREBASE_CREDENTIALS_FILE):
        return True

    print(f"Creating placeholder credentials file: {FIREBASE_CREDENTIALS_FILE}")
    print("NOTE: This is for testing only and will not actually connect to Firebase.")
    print("You need to replace this with real credentials from the Firebase console.")

    # Create a placeholder structure (this will NOT work with Firebase)
    placeholder = {
        "type": "service_account",
        "project_id": "fraisier-fa1be",
        "private_key_id": "placeholder",
        "private_key": "-----BEGIN PRIVATE KEY-----\nplaceholder\n-----END PRIVATE KEY-----\n",
        "client_email": f"firebase-adminsdk-xxxxx@fraisier-fa1be.iam.gserviceaccount.com",
        "client_id": "placeholder",
        "auth_uri": "https://accounts.google.com/o/oauth2/auth",
        "token_uri": "https://oauth2.googleapis.com/token",
        "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
        "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-xxxxx%40fraisier-fa1be.iam.gserviceaccount.com",
        "universe_domain": "googleapis.com"
    }

    # Write to file
    with open(FIREBASE_CREDENTIALS_FILE, 'w') as f:
        json.dump(placeholder, f, indent=2)

    return True

def init_firebase():
    """Initialize Firebase connection"""
    try:
        # Check if Firebase is already initialized
        if not firebase_admin._apps:
            # Check if credentials file exists
            if not os.path.exists(FIREBASE_CREDENTIALS_FILE):
                print(f"Firebase credentials file '{FIREBASE_CREDENTIALS_FILE}' not found.")
                create_placeholder_credentials()
                print("\nWARNING: Using placeholder credentials. This will NOT work with Firebase.")
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

# This function is no longer needed with the new data structure
# We're now storing data at the root level instead of in a sensors collection
def initialize_firebase_data():
    """Initialize Firebase with default data if it doesn't exist"""
    try:
        # Check if data already exists
        root_ref = db.reference('/')
        existing_data = root_ref.get()

        if not existing_data:
            print("No data found in Firebase. Initializing with default values...")

            # Generate random values for each sensor
            temperature = generate_random_value(*TEMPERATURE_RANGE)
            humidity_air = generate_random_value(*HUMIDITY_AIR_RANGE)
            humidity_soil = generate_random_value(*HUMIDITY_SOIL_RANGE)
            water_level = generate_random_value(*WATER_LEVEL_RANGE)
            light = generate_random_value(*LIGHT_RANGE)
            pump_active = random.choice([True, False])

            # Update Firebase with initial data
            update_data_in_firebase(
                temperature=temperature,
                humidity_air=humidity_air,
                humidity_soil=humidity_soil,
                water_level=water_level,
                pump_active=pump_active,
                light=light
            )

            print("Firebase initialized with default data")
            return True

        print("Firebase already contains data")
        return True
    except Exception as e:
        print(f"Error initializing Firebase data: {e}")
        return False

def run_demo(update_interval=10, iterations=None):
    """Run the demo, sending random sensor values to Firebase"""
    if not init_firebase():
        print("\nFailed to initialize Firebase. Running in simulation mode.")
        print("This will show what data would be sent to Firebase, but won't actually connect.")
        simulate_mode = True
    else:
        simulate_mode = False

    print(f"\nStarting Firebase demo with update interval of {update_interval} seconds")
    print("Press Ctrl+C to stop the demo\n")

    if not simulate_mode:
        # Initialize Firebase with default data if needed
        initialize_firebase_data()

    count = 0
    try:
        while iterations is None or count < iterations:
            count += 1
            print(f"\nUpdate #{count} - {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

            # Generate random values for each sensor
            temperature = generate_random_value(*TEMPERATURE_RANGE)
            humidity_air = generate_random_value(*HUMIDITY_AIR_RANGE)
            humidity_soil = generate_random_value(*HUMIDITY_SOIL_RANGE)
            water_level = generate_random_value(*WATER_LEVEL_RANGE)
            light = generate_random_value(*LIGHT_RANGE)

            # Randomly toggle pump state (20% chance of changing)
            pump_active = random.random() < 0.2

            if simulate_mode:
                # Just print what would be sent
                print("SIMULATION: Would update Firebase with the following values:")
                print(f"  Temperature: {temperature:.2f}°C")
                print(f"  Humidity (Air): {humidity_air:.2f}%")
                print(f"  Humidity (Soil): {humidity_soil:.2f}%")
                print(f"  Water Level: {water_level:.2f}%")
                print(f"  Pump Active: {pump_active}")
                print(f"  Light: {light:.2f} lux")
            else:
                # Actually update Firebase
                update_data_in_firebase(
                    temperature=temperature,
                    humidity_air=humidity_air,
                    humidity_soil=humidity_soil,
                    water_level=water_level,
                    pump_active=pump_active,
                    light=light
                )

            # Wait for the next update
            if iterations is None or count < iterations:
                print(f"Waiting {update_interval} seconds for next update...")
                time.sleep(update_interval)

    except KeyboardInterrupt:
        print("\nDemo stopped by user")

    print("\nDemo completed")

if __name__ == "__main__":
    # Run the demo with 5-second intervals for 3 iterations
    # This will complete in about 15 seconds
    run_demo(update_interval=5, iterations=3)
